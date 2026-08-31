<a id="subagent-example"></a>
# 子代理示例

把任务委托给带独立上下文窗口的专用子代理。

<a id="features"></a>
## 功能

- **独立上下文**：每个子代理在单独的 `pi` 进程中运行
- **流式输出**：实时看到工具调用和进度
- **并行流式**：所有并行任务同时流式更新
- **Markdown 渲染**：最终输出按正确格式渲染（展开视图）
- **用量跟踪**：显示每个代理的回合数、tokens、费用和上下文用量
- **中止支持**：Ctrl+C 会传播并终止子代理进程

<a id="structure"></a>
## 结构

```
subagent/
├── README.md            # 本文件
├── index.ts             # 扩展（入口）
├── agents.ts            # Agent 发现逻辑
├── agents/              # 示例 agent 定义
│   ├── scout.md         # 快速侦察，返回压缩后的上下文
│   ├── planner.md       # 制定实现计划
│   ├── reviewer.md      # 代码审查
│   └── worker.md        # 通用（完整能力）
└── prompts/             # 工作流预设（提示模板）
    ├── implement.md     # scout -> planner -> worker
    ├── scout-and-plan.md    # scout -> planner（不实现）
    └── implement-and-review.md  # worker -> reviewer -> worker
```

<a id="installation"></a>
## 安装

从仓库根目录符号链接这些文件：

```bash
# 符号链接扩展（必须放在包含 index.ts 的子目录中）
mkdir -p ~/.pi/agent/extensions/subagent
ln -sf "$(pwd)/packages/coding-agent/examples/extensions/subagent/index.ts" ~/.pi/agent/extensions/subagent/index.ts
ln -sf "$(pwd)/packages/coding-agent/examples/extensions/subagent/agents.ts" ~/.pi/agent/extensions/subagent/agents.ts

# 符号链接 agents
mkdir -p ~/.pi/agent/agents
for f in packages/coding-agent/examples/extensions/subagent/agents/*.md; do
  ln -sf "$(pwd)/$f" ~/.pi/agent/agents/$(basename "$f")
done

# 符号链接工作流提示
mkdir -p ~/.pi/agent/prompts
for f in packages/coding-agent/examples/extensions/subagent/prompts/*.md; do
  ln -sf "$(pwd)/$f" ~/.pi/agent/prompts/$(basename "$f")
done
```

<a id="security-model"></a>
## 安全模型

该工具会执行一个单独的 `pi` 子进程，并传入委托的系统提示以及工具/模型配置。

**项目本地 agents**（`.pi/agents/*.md`）是由仓库控制的提示，可以指示模型读文件、运行 bash 命令等。

**默认行为：** 只从 `~/.pi/agent/agents` 加载**用户级 agents**。

要启用项目本地 agents，传入 `agentScope: "both"`（或 `"project"`）。只对你信任的仓库这样做。

交互运行时，在不受信任的项目中运行项目本地 agents 之前，该工具会提示确认。受信任的项目会跳过额外提示。设 `confirmProjectAgents: false` 可关闭确认。

<a id="usage"></a>
## 用法

<a id="single-agent"></a>
### 单个 agent
```
Use scout to find all authentication code
```

<a id="parallel-execution"></a>
### 并行执行
```
Run 2 scouts in parallel: one to find models, one to find providers
```

<a id="chained-workflow"></a>
### 链式工作流
```
Use a chain: first have scout find the read tool, then have planner suggest improvements
```

<a id="workflow-prompts"></a>
### 工作流提示
```
/implement add Redis caching to the session store
/scout-and-plan refactor auth to support OAuth
/implement-and-review add input validation to API endpoints
```

<a id="tool-modes"></a>
## 工具模式

| 模式 | 参数 | 说明 |
|------|-----------|-------------|
| 单个 | `{ agent, task }` | 一个 agent，一个任务 |
| 并行 | `{ tasks: [...] }` | 多个 agent 并发运行（最多 8 个，4 个并发） |
| 链式 | `{ chain: [...] }` | 顺序执行，带 `{previous}` 占位符 |

<a id="output-display"></a>
## 输出显示

**折叠视图**（默认）：
- 状态图标（✓/✗/⏳）和 agent 名称
- 最近 5–10 项（工具调用和文本）
- 用量统计：`3 turns ↑input ↓output RcacheRead WcacheWrite $cost ctx:contextTokens model`

**展开视图**（Ctrl+O）：
- 完整任务文本
- 全部工具调用及格式化参数
- 最终输出按 Markdown 渲染
- 每个任务的用量（链式/并行）

**并行模式流式**：
- 显示所有任务及其实时状态（⏳ 运行中，✓ 完成，✗ 失败）
- 随每个任务推进而更新
- 显示 “2/3 done, 1 running” 状态
- 把每个已完成任务的最终输出返回给父模型，每个任务上限 50 KB
- 子进程在产生输出前退出时，从 stderr/错误消息返回失败诊断

**工具调用格式**（模仿内置工具）：
- bash 使用 `$ command`
- read 使用 `read ~/path:1-10`
- grep 使用 `grep /pattern/ in ~/path`
- 等等。

<a id="agent-definitions"></a>
## Agent 定义

Agents 是带 YAML frontmatter 的 markdown 文件：

```markdown
---
name: my-agent
description: What this agent does
tools: read, grep, find, ls
model: claude-haiku-4-5
---

System prompt for the agent goes here.
```

省略 `model` 时，子代理继承派出会话的当前模型和思考级别。

**位置：**
- `~/.pi/agent/agents/*.md` - 用户级（始终加载）
- `.pi/agents/*.md` - 项目级（仅当 `agentScope: "project"` 或 `"both"`）

当 `agentScope: "both"` 时，同名的项目 agents 会覆盖用户 agents。

<a id="sample-agents"></a>
## 示例 Agents

| Agent | 用途 | 模型 | 工具 |
|-------|---------|-------|-------|
| `scout` | 快速代码库侦察 | Haiku | read, grep, find, ls, bash |
| `planner` | 实现计划 | Sonnet | read, grep, find, ls |
| `reviewer` | 代码审查 | Sonnet | read, grep, find, ls, bash |
| `worker` | 通用 | Sonnet | （全部默认） |

<a id="workflow-prompts-1"></a>
## 工作流提示

| 提示 | 流程 |
|--------|------|
| `/implement <query>` | scout → planner → worker |
| `/scout-and-plan <query>` | scout → planner |
| `/implement-and-review <query>` | worker → reviewer → worker |

<a id="error-handling"></a>
## 错误处理

- **退出码 != 0**：工具返回错误，带 stderr/输出
- **stopReason "error"**：LLM 错误连同错误消息一起传播
- **stopReason "aborted"**：用户中止（Ctrl+C）会终止子进程并抛出错误
- **链式模式**：在第一个失败步骤停止，并报告失败的是哪一步

<a id="limitations"></a>
## 限制

- 折叠视图中输出截断为最近 10 项（展开可看全部）
- 并行模式下对模型可见的输出每个任务上限 50 KB；完整结果仍在工具 details 中
- 每次调用都会重新发现 agents（允许在会话中途编辑）
- 并行模式限制为 8 个任务、4 个并发
