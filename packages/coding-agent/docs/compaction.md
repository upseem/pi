<a id="compaction--branch-summarization"></a>
# 压缩与分支摘要

LLM 的上下文窗口有限。当对话过长时，Pi 使用压缩来摘要较旧内容，同时保留近期工作。本页同时介绍自动压缩和分支摘要。

**源文件**（[pi-mono](https://github.com/earendil-works/pi-mono)）：
- [`packages/coding-agent/src/core/compaction/compaction.ts`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/compaction/compaction.ts) - 自动压缩逻辑
- [`packages/coding-agent/src/core/compaction/branch-summarization.ts`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/compaction/branch-summarization.ts) - 分支摘要
- [`packages/coding-agent/src/core/compaction/utils.ts`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/compaction/utils.ts) - 共享工具（文件跟踪、序列化）
- [`packages/coding-agent/src/core/session-manager.ts`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/session-manager.ts) - 条目类型（`CompactionEntry`、`BranchSummaryEntry`）
- [`packages/coding-agent/src/core/extensions/types.ts`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/extensions/types.ts) - 扩展事件类型

项目中的 TypeScript 定义可查看 `node_modules/@earendil-works/pi-coding-agent/dist/`。

<a id="overview"></a>
## 概览

Pi 有两种摘要机制：

| 机制 | 触发条件 | 用途 |
|-----------|---------|---------|
| 压缩 | 上下文超过阈值，或 `/compact` | 摘要旧消息以释放上下文 |
| 分支摘要 | `/tree` 导航 | 切换分支时保留上下文 |

两者使用相同的结构化摘要格式，并累计跟踪文件操作。压缩和分支摘要请求使用新的 routing session ID；在 provider 支持时会禁用 prompt-cache 写入，因为这些一次性 prompt 不太可能被复用。

<a id="compaction"></a>
## 压缩

<a id="when-it-triggers"></a>
### 何时触发

自动压缩在以下条件触发：

```
contextTokens > contextWindow - reserveTokens
```

默认情况下，`reserveTokens` 为 16384 token（可在 `~/.pi/agent/settings.json` 或 `<project-dir>/.pi/settings.json` 中配置）。这为 LLM 的回复留出空间。

在多轮 agent 运行期间，Pi 会在工具完成且其结果追加后、开始下一次助手回复前检查此阈值。如果超过阈值，Pi 会在同一次 agent 运行中执行压缩，然后使用摘要和保留的消息继续运行。当已完成的工具批次会终止本次运行，且没有排队消息需要继续回复时，Pi 会跳过这次轮次间检查。Pi 还会在收到新的用户 prompt 前以及底层 agent 运行结束后检查此阈值。

也可以用 `/compact [instructions]` 手动触发，可选 instructions 用于聚焦摘要。

<a id="how-it-works"></a>
### 工作方式

1. **查找切分点**：从最新消息向前遍历，累加 token 估算，直到达到 `keepRecentTokens`（默认 20k，可在 `~/.pi/agent/settings.json` 或 `<project-dir>/.pi/settings.json` 中配置）
2. **提取消息**：收集从上一个保留边界（或会话起点）到切分点的消息
3. **生成摘要**：调用 LLM 按结构化格式摘要；若存在上一份摘要，则作为迭代上下文传入
4. **追加条目**：保存带有摘要和 `firstKeptEntryId` 的 `CompactionEntry`
5. **重建上下文**：会话为下一次请求重建上下文，使用摘要 + 从 `firstKeptEntryId` 起的消息

```
Before compaction:

  entry:  0     1     2     3      4     5     6      7      8     9
        ┌─────┬─────┬─────┬──────┬─────┬─────┬──────┬──────┬─────┬─────┐
        │ hdr │ usr │ ass │ tool │ usr │ ass │ tool │ tool │ ass │ tool│
        └─────┴─────┴─────┴──────┴─────┴─────┴──────┴──────┴─────┴─────┘
                └────────┬───────┘ └──────────────┬──────────────┘
               messagesToSummarize            kept messages
                                   ↑
                          firstKeptEntryId (entry 4)

After compaction (new entry appended):

  entry:  0     1     2     3      4     5     6      7      8     9     10
        ┌─────┬─────┬─────┬──────┬─────┬─────┬──────┬──────┬─────┬─────┬─────┐
        │ hdr │ usr │ ass │ tool │ usr │ ass │ tool │ tool │ ass │ tool│ cmp │
        └─────┴─────┴─────┴──────┴─────┴─────┴──────┴──────┴─────┴─────┴─────┘
               └──────────┬──────┘ └──────────────────────┬───────────────────┘
                 not sent to LLM                    sent to LLM
                                                         ↑
                                              starts from firstKeptEntryId

What the LLM sees:

  ┌────────┬─────────┬─────┬─────┬──────┬──────┬─────┬──────┐
  │ system │ summary │ usr │ ass │ tool │ tool │ ass │ tool │
  └────────┴─────────┴─────┴─────┴──────┴──────┴─────┴──────┘
       ↑         ↑      └─────────────────┬────────────────┘
    prompt   from cmp          messages from firstKeptEntryId
```

重复压缩时，被摘要的区间从上一次压缩的保留边界（`firstKeptEntryId`）开始，而不是从压缩条目本身开始；若路径中找不到该保留条目，则回退到上一压缩之后的条目。这样会把上次压缩后幸存的消息也纳入下一次摘要。Pi 还会在写入新的 `CompactionEntry` 之前，根据重建后的会话上下文重新计算 `tokensBefore`，使 token 数反映实际被替换的压缩前上下文。

<a id="split-turns"></a>
### 拆分轮次

一轮（turn）从用户消息开始，包含直到下一条用户消息之前的全部助手回复和工具调用。通常，压缩在轮次边界处切分。

当单轮超过 `keepRecentTokens` 时，切分点会落在轮次中间的助手消息上。这就是“拆分轮次”：

```
Split turn (one huge turn exceeds budget):

  entry:  0     1     2      3     4      5      6     7      8
        ┌─────┬─────┬─────┬──────┬─────┬──────┬──────┬─────┬──────┐
        │ hdr │ usr │ ass │ tool │ ass │ tool │ tool │ ass │ tool │
        └─────┴─────┴─────┴──────┴─────┴──────┴──────┴─────┴──────┘
                ↑                                     ↑
         turnStartIndex = 1                  firstKeptEntryId = 7
                │                                     │
                └──── turnPrefixMessages (1-6) ───────┘
                                                      └── kept (7-8)

  isSplitTurn = true
  messagesToSummarize = []  (no complete turns before)
  turnPrefixMessages = [usr, ass, tool, ass, tool, tool]
```

对于拆分轮次，Pi 生成两份摘要并合并：
1. **历史摘要**：此前的上下文（如有）
2. **轮次前缀摘要**：拆分轮次的前半部分

<a id="cut-point-rules"></a>
### 切分点规则

有效切分点为：
- 用户消息
- 助手消息
- BashExecution 消息
- 自定义消息（custom_message、branch_summary）

绝不在工具结果处切分（它们必须与对应的工具调用放在一起）。

<a id="compactionentry-structure"></a>
### CompactionEntry 结构

定义于 [`session-manager.ts`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/session-manager.ts)：

```typescript
interface CompactionEntry<T = unknown> {
  type: "compaction";
  id: string;
  parentId: string;
  timestamp: number;
  summary: string;
  firstKeptEntryId: string;
  tokensBefore: number;
  usage?: Usage;       // 生成摘要时的 LLM usage
  fromHook?: boolean;  // 为 true 表示由扩展提供（遗留字段名）
  details?: T;         // 实现相关的数据
}

// 默认压缩在 details 中使用此结构（来自 compaction.ts）：
interface CompactionDetails {
  readFiles: string[];
  modifiedFiles: string[];
}
```

扩展可在 `details` 中存储任意可 JSON 序列化的数据。默认压缩跟踪文件操作，但自定义扩展实现可以使用自己的结构。生成的摘要和扩展提供的摘要在可用时会存储其 LLM `usage`，以便会话总计包含摘要工作。

实现见 [`prepareCompaction()`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/compaction/compaction.ts) 和 [`compact()`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/compaction/compaction.ts)。若要直接以编程方式摘要，`generateSummary()` 返回摘要文本，`generateSummaryWithUsage()` 返回 `{ text, usage }`。

<a id="branch-summarization"></a>
## 分支摘要

<a id="when-it-triggers-1"></a>
### 何时触发

使用 `/tree` 导航到另一分支时，Pi 会询问是否摘要即将离开的工作。这会把离开分支的上下文注入新分支。

<a id="how-it-works-1"></a>
### 工作方式

1. **查找共同祖先**：旧位置与新位置共享的最深节点
2. **收集条目**：从旧叶子回溯到共同祖先
3. **按预算准备**：按 token 预算纳入消息（从新到旧）
4. **生成摘要**：按结构化格式调用 LLM
5. **追加条目**：在导航点保存 `BranchSummaryEntry`

```
Tree before navigation:

         ┌─ B ─ C ─ D (old leaf, being abandoned)
    A ───┤
         └─ E ─ F (target)

Common ancestor: A
Entries to summarize: B, C, D

After navigation with summary:

         ┌─ B ─ C ─ D
    A ───┤
         └─ E ─ F ─ [summary of B,C,D] (new leaf)
```

<a id="cumulative-file-tracking"></a>
### 累计文件跟踪

压缩和分支摘要都累计跟踪文件。生成摘要时，pi 从以下来源提取文件操作：
- 被摘要消息中的工具调用
- 上一份压缩或分支摘要的 `details`（如有）

因此文件跟踪会跨多次压缩或嵌套分支摘要累计，保留已读和已修改文件的完整历史。

<a id="branchsummaryentry-structure"></a>
### BranchSummaryEntry 结构

定义于 [`session-manager.ts`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/session-manager.ts)：

```typescript
interface BranchSummaryEntry<T = unknown> {
  type: "branch_summary";
  id: string;
  parentId: string;
  timestamp: number;
  summary: string;
  fromId: string;      // 导航出发的条目
  usage?: Usage;       // 生成摘要时的 LLM usage
  fromHook?: boolean;  // 为 true 表示由扩展提供（遗留字段名）
  details?: T;         // 实现相关的数据
}

// 默认分支摘要在 details 中使用此结构（来自 branch-summarization.ts）：
interface BranchSummaryDetails {
  readFiles: string[];
  modifiedFiles: string[];
}
```

与压缩相同，扩展可在 `details` 中存储自定义数据。

实现见 [`collectEntriesForBranchSummary()`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/compaction/branch-summarization.ts)、[`prepareBranchEntries()`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/compaction/branch-summarization.ts) 和 [`generateBranchSummary()`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/compaction/branch-summarization.ts)。

<a id="summary-format"></a>
## 摘要格式

压缩和分支摘要使用相同的结构化格式：

```markdown
## Goal
[What the user is trying to accomplish]

## Constraints & Preferences
- [Requirements mentioned by user]

## Progress
### Done
- [x] [Completed tasks]

### In Progress
- [ ] [Current work]

### Blocked
- [Issues, if any]

## Key Decisions
- **[Decision]**: [Rationale]

## Next Steps
1. [What should happen next]

## Critical Context
- [Data needed to continue]

<read-files>
path/to/file1.ts
path/to/file2.ts
</read-files>

<modified-files>
path/to/changed.ts
</modified-files>
```

<a id="message-serialization"></a>
### 消息序列化

摘要前，消息通过 [`serializeConversation()`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/compaction/utils.ts) 序列化为文本：

```
[User]: What they said
[Assistant thinking]: Internal reasoning
[Assistant]: Response text
[Assistant tool calls]: read(path="foo.ts"); edit(path="bar.ts", ...)
[Tool result]: Output from tool
```

这可以防止模型将其当作要继续的对话。

序列化时，工具结果截断为 2000 个字符。超出部分替换为标明截断字符数的标记。这使摘要请求保持在合理的 token 预算内，因为工具结果（尤其来自 `read` 和 `bash`）通常是上下文体积的主要来源。

<a id="custom-summarization-via-extensions"></a>
## 通过扩展自定义摘要

扩展可以拦截并自定义压缩和分支摘要。事件类型定义见 [`extensions/types.ts`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/extensions/types.ts)。

<a id="session_before_compact"></a>
### session_before_compact

在自动压缩或 `/compact` 之前触发。可以取消或提供自定义摘要。见类型文件中的 `SessionBeforeCompactEvent` 和 `CompactionPreparation`。

```typescript
pi.on("session_before_compact", async (event, ctx) => {
  const { preparation, branchEntries, customInstructions, reason, willRetry, signal } = event;

  // preparation.messagesToSummarize - 待摘要的消息
  // preparation.turnPrefixMessages - 拆分轮次前缀（若 isSplitTurn）
  // preparation.previousSummary - 上一份压缩摘要
  // preparation.fileOps - 提取出的文件操作
  // preparation.tokensBefore - 压缩前的上下文 token
  // preparation.firstKeptEntryId - 保留消息的起点
  // preparation.settings - 压缩设置

  // branchEntries - 当前分支上的全部条目（用于自定义状态）
  // reason - "manual" (/compact)、"threshold" 或 "overflow"
  // willRetry - 压缩后是否重试被中止的轮次（overflow 恢复）
  // signal - AbortSignal（传给 LLM 调用）

  // 取消：
  return { cancel: true };

  // 自定义摘要：
  return {
    compaction: {
      summary: "Your summary...",
      firstKeptEntryId: preparation.firstKeptEntryId,
      tokensBefore: preparation.tokensBefore,
      // usage: summaryResponse.usage, // 可选；计入会话总计
      details: { /* custom data */ },
    }
  };
});
```

<a id="converting-messages-to-text"></a>
#### 将消息转为文本

若要用自己的模型生成摘要，使用 `serializeConversation` 将消息转为文本：

```typescript
import { convertToLlm, serializeConversation } from "@earendil-works/pi-coding-agent";

pi.on("session_before_compact", async (event, ctx) => {
  const { preparation } = event;
  
  // 将 AgentMessage[] 转为 Message[]，再序列化为文本
  const conversationText = serializeConversation(
    convertToLlm(preparation.messagesToSummarize)
  );
  // 返回：
  // [User]: message text
  // [Assistant thinking]: thinking content
  // [Assistant]: response text
  // [Assistant tool calls]: read(path="..."); bash(command="...")
  // [Tool result]: output text

  // 再发给你的模型做摘要
  const { summary, usage } = await myModel.summarize(conversationText);
  
  return {
    compaction: {
      summary,
      firstKeptEntryId: preparation.firstKeptEntryId,
      tokensBefore: preparation.tokensBefore,
      usage,
    }
  };
});
```

使用不同模型的完整示例见 [custom-compaction.ts](../examples/extensions/custom-compaction.ts)。

<a id="session_compact_failed"></a>
### session_compact_failed

在手动或自动压缩失败或中止时触发。适用于需要将 `session_before_compact` 尝试与最终结果配对的遥测扩展。

```typescript
pi.on("session_compact_failed", async (event, ctx) => {
  const { reason, errorMessage, aborted, willRetry, fromExtension } = event;
  // reason - "manual" (/compact)、"threshold" 或 "overflow"
  // errorMessage - 非中止失败时存在
  // aborted - 取消/中止的压缩为 true
  // willRetry - 压缩后是否本应重试被中止的轮次
  // fromExtension - 当时是否在使用扩展提供的压缩内容
});
```

<a id="session_before_tree"></a>
### session_before_tree

在 `/tree` 导航前触发。无论用户是否选择摘要都会触发。可以取消导航或提供自定义摘要。

```typescript
pi.on("session_before_tree", async (event, ctx) => {
  const { preparation, signal } = event;

  // preparation.targetId - 导航目标
  // preparation.oldLeafId - 当前位置（即将离开）
  // preparation.commonAncestorId - 共同祖先
  // preparation.entriesToSummarize - 将被摘要的条目
  // preparation.userWantsSummary - 用户是否选择摘要

  // 完全取消导航：
  return { cancel: true };

  // 提供自定义摘要（仅在 userWantsSummary 为 true 时使用）：
  if (preparation.userWantsSummary) {
    return {
      summary: {
        summary: "Your summary...",
        // usage: summaryResponse.usage, // 可选；计入会话总计
        details: { /* custom data */ },
      }
    };
  }
});
```

见类型文件中的 `SessionBeforeTreeEvent` 和 `TreePreparation`。

<a id="settings"></a>
## 设置

在 `~/.pi/agent/settings.json` 或 `<project-dir>/.pi/settings.json` 中配置压缩：

```json
{
  "compaction": {
    "enabled": true,
    "reserveTokens": 16384,
    "keepRecentTokens": 20000
  }
}
```

| 设置 | 默认值 | 说明 |
|---------|---------|-------------|
| `enabled` | `true` | 启用自动压缩 |
| `reserveTokens` | `16384` | 为 LLM 回复预留的 token |
| `keepRecentTokens` | `20000` | 保留的近期 token（不摘要） |

用 `"enabled": false` 禁用自动压缩。仍可用 `/compact` 手动压缩。
