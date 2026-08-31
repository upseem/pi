<a id="session-file-format"></a>
# 会话文件格式

会话以 JSONL（JSON Lines）文件存储。每行是一个带 `type` 字段的 JSON 对象。会话条目通过 `id`/`parentId` 形成树结构，可在原文件内分支，无需创建新文件。

<a id="file-location"></a>
## 文件位置

```
~/.pi/agent/sessions/--<path>--/<timestamp>_<uuid>.jsonl
```

其中 `<path>` 是将 `/` 替换为 `-` 后的工作目录。

<a id="deleting-sessions"></a>
## 删除会话

可通过删除 `~/.pi/agent/sessions/` 下对应的 `.jsonl` 文件来移除会话。

Pi 也支持在 `/resume` 中交互式删除会话（选中会话后按 `Ctrl+D`，再确认）。可用时，pi 使用 `trash` CLI，以避免永久删除。

<a id="session-version"></a>
## 会话版本

会话在 header 中有 version 字段：

- **Version 1**：线性条目序列（遗留，加载时自动迁移）
- **Version 2**：带 `id`/`parentId` 链接的树结构
- **Version 3**：将 `hookMessage` role 重命名为 `custom`（扩展统一）

已有会话在加载时会自动迁移到当前版本（v3）。

<a id="source-files"></a>
## 源文件

GitHub 源码（[pi-mono](https://github.com/earendil-works/pi-mono)）：
- [`packages/coding-agent/src/core/session-manager.ts`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/session-manager.ts) - 会话条目类型和 SessionManager
- [`packages/coding-agent/src/core/messages.ts`](https://github.com/earendil-works/pi-mono/blob/main/packages/coding-agent/src/core/messages.ts) - 扩展消息类型（BashExecutionMessage、CustomMessage 等）
- [`packages/ai/src/types.ts`](https://github.com/earendil-works/pi-mono/blob/main/packages/ai/src/types.ts) - 基础消息类型（UserMessage、AssistantMessage、ToolResultMessage）
- [`packages/agent/src/types.ts`](https://github.com/earendil-works/pi-mono/blob/main/packages/agent/src/types.ts) - AgentMessage 联合类型

项目中的 TypeScript 定义可查看 `node_modules/@earendil-works/pi-coding-agent/dist/` 和 `node_modules/@earendil-works/pi-ai/dist/`。

<a id="message-types"></a>
## 消息类型

会话条目包含 `AgentMessage` 对象。解析会话和编写扩展时需要理解这些类型。

<a id="content-blocks"></a>
### 内容块

消息包含类型化内容块数组：

```typescript
interface TextContent {
  type: "text";
  text: string;
}

interface ImageContent {
  type: "image";
  data: string;      // base64 编码
  mimeType: string;  // 例如 "image/jpeg"、"image/png"
}

interface ThinkingContent {
  type: "thinking";
  thinking: string;
}

interface ToolCall {
  type: "toolCall";
  id: string;
  name: string;
  arguments: Record<string, any>;
}
```

<a id="base-message-types-from-pi-ai"></a>
### 基础消息类型（来自 pi-ai）

```typescript
interface UserMessage {
  role: "user";
  content: string | (TextContent | ImageContent)[];
  timestamp: number;  // Unix ms
}

interface AssistantMessage {
  role: "assistant";
  content: (TextContent | ThinkingContent | ToolCall)[];
  api: string;
  provider: string;
  model: string;
  usage: Usage;
  stopReason: "stop" | "length" | "toolUse" | "error" | "aborted";
  errorMessage?: string;
  timestamp: number;
}

interface ToolResultMessage {
  role: "toolResult";
  toolCallId: string;
  toolName: string;
  content: (TextContent | ImageContent)[];
  details?: any;      // 工具相关的元数据
  usage?: Usage;      // 工具执行的嵌套 LLM 工作
  isError: boolean;
  timestamp: number;
}

interface Usage {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  totalTokens: number;
  cost: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    total: number;
  };
}
```

导出的 pi-ai `StopReason` 类型也包含 `"pending"`，但该值仅保留给流式事件中的部分消息。终端 `done`/`error` 消息会在 pi 持久化助手消息前将其替换为完成原因，因此 `"pending"` 不应出现在会话 JSONL 中。

<a id="extended-message-types-from-pi-coding-agent"></a>
### 扩展消息类型（来自 pi-coding-agent）

```typescript
interface BashExecutionMessage {
  role: "bashExecution";
  command: string;
  output: string;
  exitCode: number | undefined;
  cancelled: boolean;
  truncated: boolean;
  fullOutputPath?: string;
  excludeFromContext?: boolean;  // !! 前缀命令为 true
  timestamp: number;
}

interface CustomMessage {
  role: "custom";
  customType: string;            // 扩展标识符
  content: string | (TextContent | ImageContent)[];
  display: boolean;              // 在 TUI 中显示
  details?: any;                 // 扩展相关的元数据
  timestamp: number;
}

interface BranchSummaryMessage {
  role: "branchSummary";
  summary: string;
  fromId: string;                // 分支出发的条目
  timestamp: number;
}

interface CompactionSummaryMessage {
  role: "compactionSummary";
  summary: string;
  tokensBefore: number;
  timestamp: number;
}
```

<a id="agentmessage-union"></a>
### AgentMessage 联合类型

```typescript
type AgentMessage =
  | UserMessage
  | AssistantMessage
  | ToolResultMessage
  | BashExecutionMessage
  | CustomMessage
  | BranchSummaryMessage
  | CompactionSummaryMessage;
```

<a id="entry-base"></a>
## 条目基类

除 `SessionHeader` 外，所有条目都扩展 `SessionEntryBase`：

```typescript
interface SessionEntryBase {
  type: string;
  id: string;           // 8 位十六进制 ID
  parentId: string | null;  // 父条目 ID（第一条为 null）
  timestamp: string;    // ISO 时间戳
}
```

<a id="entry-types"></a>
## 条目类型

<a id="sessionheader"></a>
### SessionHeader

文件第一行。仅元数据，不属于树（无 `id`/`parentId`）。

```json
{"type":"session","version":3,"id":"uuid","timestamp":"2024-12-03T14:00:00.000Z","cwd":"/path/to/project"}
```

对于有父会话的会话（通过 `/fork`、`/clone` 或 `newSession({ parentSession })` 创建）：

```json
{"type":"session","version":3,"id":"uuid","timestamp":"2024-12-03T14:00:00.000Z","cwd":"/path/to/project","parentSession":"/path/to/original/session.jsonl"}
```

<a id="sessionmessageentry"></a>
### SessionMessageEntry

对话中的一条消息。`message` 字段包含一个 `AgentMessage`。

```json
{"type":"message","id":"a1b2c3d4","parentId":"prev1234","timestamp":"2024-12-03T14:00:01.000Z","message":{"role":"user","content":"Hello"}}
{"type":"message","id":"b2c3d4e5","parentId":"a1b2c3d4","timestamp":"2024-12-03T14:00:02.000Z","message":{"role":"assistant","content":[{"type":"text","text":"Hi!"}],"provider":"anthropic","model":"claude-sonnet-4-5","usage":{...},"stopReason":"stop"}}
{"type":"message","id":"c3d4e5f6","parentId":"b2c3d4e5","timestamp":"2024-12-03T14:00:03.000Z","message":{"role":"toolResult","toolCallId":"call_123","toolName":"bash","content":[{"type":"text","text":"output"}],"isError":false}}
```

<a id="modelchangeentry"></a>
### ModelChangeEntry

用户在会话中途切换模型时发出。

```json
{"type":"model_change","id":"d4e5f6g7","parentId":"c3d4e5f6","timestamp":"2024-12-03T14:05:00.000Z","provider":"openai","modelId":"gpt-4o"}
```

<a id="thinkinglevelchangeentry"></a>
### ThinkingLevelChangeEntry

用户更改思考/推理级别时发出。

```json
{"type":"thinking_level_change","id":"e5f6g7h8","parentId":"d4e5f6g7","timestamp":"2024-12-03T14:06:00.000Z","thinkingLevel":"high"}
```

<a id="compactionentry"></a>
### CompactionEntry

压缩上下文时创建。存储较早消息的摘要。

```json
{"type":"compaction","id":"f6g7h8i9","parentId":"e5f6g7h8","timestamp":"2024-12-03T14:10:00.000Z","summary":"User discussed X, Y, Z...","firstKeptEntryId":"c3d4e5f6","tokensBefore":50000}
```

较新的 harness 生成压缩会把压缩后保留的上下文直接嵌入条目，而不是使用 `firstKeptEntryId`：

```json
{"type":"compaction","id":"f6g7h8i9","parentId":"e5f6g7h8","timestamp":"2024-12-03T14:10:00.000Z","summary":"User discussed X, Y, Z...","tokensBefore":50000,"retainedTail":[{"role":"user","content":"latest request"},{"role":"assistant","content":[{"type":"text","text":"latest reply"}],"provider":"anthropic","model":"claude-sonnet-4-5","usage":{...},"stopReason":"stop"}]}
```

可选字段：
- `usage`：生成摘要时的 LLM usage；计入会话 token 和费用总计
- `retainedTail`：压缩后保留的物化 `AgentMessage[]`。仅因兼容旧会话而为可选。较新的 harness 生成压缩会包含它，以便从该检查点重建上下文，而无需遍历压缩条目之前的旧条目。
- `details`：实现相关的数据（例如默认实现的 `{ readFiles: string[], modifiedFiles: string[] }`，或扩展的自定义数据）
- `fromHook`：由扩展生成时为 `true`，由 pi 生成时为 `false`/`undefined`（遗留字段名）
- `firstKeptEntryId`：兼容旧条目格式。

<a id="branchsummaryentry"></a>
### BranchSummaryEntry

通过 `/tree` 切换分支，并对离开的分支（到共同祖先为止）生成 LLM 摘要时创建。捕获被放弃路径的上下文。

```json
{"type":"branch_summary","id":"g7h8i9j0","parentId":"a1b2c3d4","timestamp":"2024-12-03T14:15:00.000Z","fromId":"f6g7h8i9","summary":"Branch explored approach A..."}
```

可选字段：
- `usage`：生成摘要时的 LLM usage；计入会话 token 和费用总计
- `details`：文件跟踪数据（默认实现为 `{ readFiles: string[], modifiedFiles: string[] }`），或扩展的自定义数据
- `fromHook`：由扩展生成时为 `true`，由 pi 生成时为 `false`/`undefined`（遗留字段名）

<a id="customentry"></a>
### CustomEntry

扩展状态持久化。不参与 LLM 上下文。

```json
{"type":"custom","id":"h8i9j0k1","parentId":"g7h8i9j0","timestamp":"2024-12-03T14:20:00.000Z","customType":"my-extension","data":{"count":42}}
```

用 `customType` 在重新加载时识别你的扩展条目。交互模式可通过 `pi.registerEntryRenderer(customType, renderer)` 渲染自定义条目，但它们仍不参与 LLM 上下文。

<a id="custommessageentry"></a>
### CustomMessageEntry

扩展注入的消息，会参与 LLM 上下文。

```json
{"type":"custom_message","id":"i9j0k1l2","parentId":"h8i9j0k1","timestamp":"2024-12-03T14:25:00.000Z","customType":"my-extension","content":"Injected context...","display":true}
```

字段：
- `content`：字符串或 `(TextContent | ImageContent)[]`（与 UserMessage 相同）
- `display`：`true` = 在 TUI 中以不同样式显示，`false` = 隐藏
- `details`：可选的扩展元数据（不发送给 LLM）

<a id="labelentry"></a>
### LabelEntry

用户在某条目上定义的书签/标记。

```json
{"type":"label","id":"j0k1l2m3","parentId":"i9j0k1l2","timestamp":"2024-12-03T14:30:00.000Z","targetId":"a1b2c3d4","label":"checkpoint-1"}
```

将 `label` 设为 `undefined` 可清除标签。

<a id="sessioninfoentry"></a>
### SessionInfoEntry

会话元数据（例如用户定义的显示名）。通过 `/name`、`--name` / `-n`，或扩展中的 `pi.setSessionName()` 设置。

```json
{"type":"session_info","id":"k1l2m3n4","parentId":"j0k1l2m3","timestamp":"2024-12-03T14:35:00.000Z","name":"Refactor auth module"}
```

设置后，会话选择器（`/resume`）会显示该会话名，而不是第一条消息。

<a id="tree-structure"></a>
## 树结构

条目形成树：
- 第一条的 `parentId: null`
- 之后每条通过 `parentId` 指向其父条目
- 分支会从较早条目创建新的子节点
- “叶子”是树中的当前位置

```
[user msg] ─── [assistant] ─── [user msg] ─── [assistant] ─┬─ [user msg] ← current leaf
                                                            │
                                                            └─ [branch_summary] ─── [user msg] ← alternate branch
```

<a id="context-building"></a>
## 上下文构建

`buildContextEntries()` 从当前叶子走到根，生成活动条目列表，并遵循压缩规则：

1. 收集路径上的全部条目
2. 若路径上有 `CompactionEntry`：
   - 先包含该压缩条目
   - 若存在 `retainedTail`，它作为自包含检查点，压缩之后的条目会被包含
   - 否则包含从 `firstKeptEntryId` 到该压缩条目的条目
   - 然后包含压缩之后的条目
3. 在选定范围内保留非消息条目，以便交互模式渲染它们

`buildSessionContext()` 基于该条目列表，生成给 LLM 的消息列表：

1. 从完整路径提取当前模型和思考级别设置
2. 将选定条目转为消息：
   - `message` -> 存储的 `AgentMessage`
   - `compaction` -> `compactionSummary`，若存在则加上 `retainedTail`
   - `branch_summary` -> `branchSummary`
   - `custom_message` -> `CustomMessage`
   - `custom` -> 无上下文消息

因此较新的压缩相当于自包含检查点。`retainedTail` 仅为可选，以便只存储 `firstKeptEntryId` 的旧会话仍能正确加载。

<a id="parsing-example"></a>
## 解析示例

```typescript
import { readFileSync } from "fs";

const lines = readFileSync("session.jsonl", "utf8").trim().split("\n");

for (const line of lines) {
  const entry = JSON.parse(line);

  switch (entry.type) {
    case "session":
      console.log(`Session v${entry.version ?? 1}: ${entry.id}`);
      break;
    case "message":
      console.log(`[${entry.id}] ${entry.message.role}: ${JSON.stringify(entry.message.content)}`);
      break;
    case "compaction":
      console.log(`[${entry.id}] Compaction: ${entry.tokensBefore} tokens summarized`);
      break;
    case "branch_summary":
      console.log(`[${entry.id}] Branch from ${entry.fromId}`);
      break;
    case "custom":
      console.log(`[${entry.id}] Custom (${entry.customType}): ${JSON.stringify(entry.data)}`);
      break;
    case "custom_message":
      console.log(`[${entry.id}] Extension message (${entry.customType}): ${entry.content}`);
      break;
    case "label":
      console.log(`[${entry.id}] Label "${entry.label}" on ${entry.targetId}`);
      break;
    case "model_change":
      console.log(`[${entry.id}] Model: ${entry.provider}/${entry.modelId}`);
      break;
    case "thinking_level_change":
      console.log(`[${entry.id}] Thinking: ${entry.thinkingLevel}`);
      break;
  }
}
```

<a id="sessionmanager-api"></a>
## SessionManager API

以编程方式操作会话的主要方法。

<a id="static-creation-methods"></a>
### 静态创建方法
- `SessionManager.create(cwd, sessionDir?)` - 新会话
- `SessionManager.open(path, sessionDir?)` - 打开已有会话文件
- `SessionManager.continueRecent(cwd, sessionDir?)` - 继续最近会话或创建新会话
- `SessionManager.inMemory(cwd?)` - 不持久化到文件
- `SessionManager.forkFrom(sourcePath, targetCwd, sessionDir?)` - 从另一项目 fork 会话

<a id="static-listing-methods"></a>
### 静态列表方法
- `SessionManager.list(cwd, sessionDir?, onProgress?)` - 列出某目录的会话
- `SessionManager.listAll(onProgress?)` - 列出所有项目的全部会话

<a id="instance-methods---session-management"></a>
### 实例方法 - 会话管理
- `newSession(options?)` - 开始新会话（options：`{ parentSession?: string }`）
- `setSessionFile(path)` - 切换到另一会话文件
- `createBranchedSession(leafId)` - 将分支提取到新会话文件

<a id="instance-methods---appending-all-return-entry-id"></a>
### 实例方法 - 追加（均返回条目 ID）
- `appendMessage(message)` - 添加消息
- `appendThinkingLevelChange(level)` - 记录思考级别变更
- `appendModelChange(provider, modelId)` - 记录模型变更
- `appendCompaction(summary, firstKeptEntryId, tokensBefore, details?, fromHook?)` - 添加压缩
- `appendCustomEntry(customType, data?)` - 扩展状态（不在上下文中）
- `appendSessionInfo(name)` - 设置会话显示名
- `appendCustomMessageEntry(customType, content, display, details?)` - 扩展消息（在上下文中）
- `appendLabelChange(targetId, label)` - 设置/清除标签

<a id="instance-methods---tree-navigation"></a>
### 实例方法 - 树导航
- `getLeafId()` - 当前位置
- `getLeafEntry()` - 获取当前叶子条目
- `getEntry(id)` - 按 ID 获取条目
- `getBranch(fromId?)` - 从条目走到根
- `getTree()` - 获取完整树结构
- `getChildren(parentId)` - 获取直接子节点
- `getLabel(id)` - 获取条目标签
- `branch(entryId)` - 将叶子移到较早条目
- `resetLeaf()` - 将叶子重置为 null（任何条目之前）
- `branchWithSummary(entryId, summary, details?, fromHook?)` - 带上下文摘要的分支

<a id="instance-methods---context--info"></a>
### 实例方法 - 上下文与信息
- `buildContextEntries()` - 获取应用压缩后的活动分支条目
- `buildSessionContext()` - 获取给 LLM 的消息、thinkingLevel 和 model
- `getEntries()` - 全部条目（不含 header）
- `getHeader()` - 会话 header 元数据
- `getSessionName()` - 从最新 session_info 条目获取显示名
- `getCwd()` - 工作目录
- `getSessionDir()` - 会话存储目录
- `getSessionId()` - 会话 UUID
- `getSessionFile()` - 会话文件路径（内存会话为 undefined）
- `isPersisted()` - 会话是否已保存到磁盘
