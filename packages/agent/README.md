<a id="earendil-workspi-agent-core"></a>
# @earendil-works/pi-agent-core

带工具执行和事件流的有状态代理。基于 `@earendil-works/pi-ai`。

<a id="installation"></a>
## 安装

```bash
npm install @earendil-works/pi-agent-core
```

<a id="sqlite-session-backends"></a>
### SQLite 会话后端

SQLite 会话后端和 `node:sqlite` 适配器在独立包 `@earendil-works/pi-session-backend-sqlite-node` 中，因此核心包默认不会引入运行时内置模块或原生 SQLite 依赖。后端接受运行时特定的 SQLite factory，以便将来其他会话后端可以各自成包。

<a id="quick-start"></a>
## 快速开始

```typescript
import { Agent } from "@earendil-works/pi-agent-core";
import { createModels } from "@earendil-works/pi-ai";
import { anthropicProvider } from "@earendil-works/pi-ai/providers/anthropic";

const models = createModels();
models.setProvider(anthropicProvider());
const model = models.getModel("anthropic", "claude-sonnet-4-6");
if (!model) throw new Error("Model not found");

const agent = new Agent({
  initialState: {
    systemPrompt: "You are a helpful assistant.",
    model,
  },
  streamFn: models.streamSimple.bind(models),
});

agent.subscribe((event) => {
  if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
    // 只流式输出新文本块
    process.stdout.write(event.assistantMessageEvent.delta);
  }
});

await agent.prompt("Hello!");
```

<a id="core-concepts"></a>
## 核心概念

<a id="agentmessage-vs-llm-message"></a>
### AgentMessage 与 LLM Message

代理使用 `AgentMessage`，这是一种灵活类型，可以包含：
- 标准 LLM 消息（`user`、`assistant`、`toolResult`）
- 通过 declaration merging 定义的应用自定义消息类型

LLM 只理解 `user`、`assistant` 和 `toolResult`。`convertToLlm` 在每次 LLM 调用前过滤并转换消息，填补这一差距。

<a id="message-flow"></a>
### 消息流

```
AgentMessage[] → transformContext() → AgentMessage[] → convertToLlm() → Message[] → LLM
                    (optional)                           (required)
```

1. **transformContext**：裁剪旧消息，注入外部上下文
2. **convertToLlm**：过滤仅用于 UI 的消息，把自定义类型转成 LLM 格式

<a id="event-flow"></a>
## 事件流

代理发出事件供 UI 更新。理解事件顺序有助于构建响应式界面。

<a id="prompt-event-sequence"></a>
### prompt() 事件顺序

调用 `prompt("Hello")` 时：

```
prompt("Hello")
├─ agent_start
├─ turn_start
├─ message_start   { message: userMessage }      // 你的提示
├─ message_end     { message: userMessage }
├─ message_start   { message: assistantMessage } // LLM 开始回复
├─ message_update  { message: partial... }       // 流式分片
├─ message_update  { message: partial... }
├─ message_end     { message: assistantMessage } // 完整回复
├─ turn_end        { message, toolResults: [] }
└─ agent_end       { messages: [...] }
```

<a id="with-tool-calls"></a>
### 带工具调用

若 assistant 调用工具，循环会继续：

```
prompt("Read config.json")
├─ agent_start
├─ turn_start
├─ message_start/end  { userMessage }
├─ message_start      { assistantMessage with toolCall }
├─ message_update...
├─ message_end        { assistantMessage }
├─ tool_execution_start  { toolCallId, toolName, args }
├─ tool_execution_update { partialResult }           // 若工具会流式输出
├─ tool_execution_end    { toolCallId, result }
├─ message_start/end  { toolResultMessage }
├─ turn_end           { message, toolResults: [toolResult] }
│
├─ turn_start                                        // 下一回合
├─ message_start      { assistantMessage }           // LLM 响应 tool result
├─ message_update...
├─ message_end
├─ turn_end
└─ agent_end
```

工具执行模式可配置：

- `parallel`（默认）：按顺序预检工具调用，并发执行被允许的工具，每个工具一完成就发出 `tool_execution_end`，然后按 assistant 源顺序发出 toolResult 消息和 `turn_end.toolResults`
- `sequential`：逐个执行工具调用，与历史行为一致

在 parallel 模式下，工具完成事件按完成顺序发出，但持久化的 toolResult 消息仍按 assistant 源顺序。

模式可通过 agent 配置中的 `toolExecution` 全局设置，或通过 `AgentTool` 上的 `executionMode` 按工具设置。若一批中任一工具调用的目标工具带有 `executionMode: "sequential"`，整批无论全局设置如何都按顺序执行。

`beforeToolCall` hook 在 `tool_execution_start` 以及参数校验解析之后运行。它可以阻止执行，并在被阻止的结果上附加 `terminate: true`。`afterToolCall` hook 在工具执行结束后、发出 `tool_execution_end` 和最终 tool result 消息事件之前运行。

工具、被阻止的 `beforeToolCall` 结果，以及 `afterToolCall` 覆盖可以返回 `terminate: true`，提示应跳过自动的后续 LLM 调用。仅当该批中每个已定稿的 tool result 都设置了 `terminate: true` 时，循环才会提前停止。混合批次会正常继续。

`Agent` 类在 `AgentOptions` 中接受 `shouldStopAfterTurn`。底层循环调用方可在 `AgentLoopConfig` 中设置同一 hook：

```typescript
const stream = agentLoop(
  prompts,
  context,
  {
    model,
    convertToLlm,
    shouldStopAfterTurn: async ({ message, toolResults, context, newMessages }) => {
      return shouldCompactBeforeNextTurn(context.messages);
    },
  },
  undefined,
  models.streamSimple.bind(models),
);
```

`shouldStopAfterTurn` 在发出 `turn_end` 之后，以及 assistant 回复和任何工具执行都正常完成后运行。若返回 `true`，循环发出 `agent_end` 并退出，不再轮询 steering 或 follow-up 队列，也不再发起下一次 LLM 调用。它不会中止提供商流，不会取消正在运行的工具，也不会改 assistant 消息的 stop reason。`AgentOptions` 回调还会把当前 run 的 `AbortSignal` 作为第二个参数。

使用 `Agent` 类时，assistant `message_end` 处理会作为工具预检开始前的屏障。因此 `beforeToolCall` 看到的 agent 状态已经包含请求该工具调用的 assistant 消息。

<a id="continue-event-sequence"></a>
### continue() 事件顺序

`continue()` 从现有上下文恢复，不添加新消息。用于出错后重试。

```typescript
// 出错后，从当前状态重试
await agent.continue();
```

上下文中的最后一条消息必须是 `user` 或 `toolResult`（不能是 `assistant`）。

<a id="event-types"></a>
### 事件类型

| 事件 | 说明 |
|-------|-------------|
| `agent_start` | 代理开始处理 |
| `agent_end` | 本次 run 的最终事件。该事件的 awaited 订阅者仍计入结算 |
| `turn_start` | 新回合开始（一次 LLM 调用 + 工具执行） |
| `turn_end` | 回合完成，带 assistant 消息和工具结果 |
| `message_start` | 任意消息开始（user、assistant、toolResult） |
| `message_update` | **仅 assistant。** 包含带 delta 的 `assistantMessageEvent` |
| `message_end` | 消息完成 |
| `tool_execution_start` | 工具开始 |
| `tool_execution_update` | 工具流式进度 |
| `tool_execution_end` | 工具完成 |

`Agent.subscribe()` 监听器按注册顺序被 await。`agent_end` 表示不会再发出循环事件，但 `await agent.waitForIdle()` 和 `await agent.prompt(...)` 只会在 awaited 的 `agent_end` 监听器结束后才结算。

<a id="agent-options"></a>
## Agent 选项

```typescript
const agent = new Agent({
  // 初始状态
  initialState: {
    systemPrompt: string,
    model: Model<any>,
    thinkingLevel: "off" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max",
    tools: AgentTool<any>[],
    messages: AgentMessage[],
  },

  // 把 AgentMessage[] 转成 LLM Message[]（自定义消息类型时需要）
  convertToLlm: (messages) => messages.filter(...),

  // 在 convertToLlm 之前变换上下文（用于裁剪、压缩）
  transformContext: async (messages, signal) => pruneOldMessages(messages),

  // Steering 模式："one-at-a-time"（默认）或 "all"
  steeringMode: "one-at-a-time",

  // Follow-up 模式："one-at-a-time"（默认）或 "all"
  followUpMode: "one-at-a-time",

  // 必需的 stream 函数
  streamFn: models.streamSimple.bind(models),

  // 用于提供商缓存的会话 ID
  sessionId: "session-123",

  // 动态 API key 解析（用于会过期的 OAuth token）
  getApiKey: async (provider) => refreshToken(),

  // 工具执行模式："parallel"（默认）或 "sequential"
  toolExecution: "parallel",

  // 参数校验后预检每个工具调用。可以阻止执行。
  beforeToolCall: async ({ toolCall, args, context }) => {
    if (toolCall.name === "bash") {
      return { block: true, reason: "bash is disabled", terminate: true };
    }
  },

  // 在发出最终工具事件之前后处理每个工具结果。
  afterToolCall: async ({ toolCall, result, isError, context }) => {
    if (toolCall.name === "notify_done" && !isError) {
      return { terminate: true };
    }
    if (!isError) {
      return { details: { ...result.details, audited: true } };
    }
  },

  // 在已完成的回合之后、轮询排队消息之前优雅停止。
  shouldStopAfterTurn: async ({ context }, signal) => {
    return shouldCompactBeforeNextTurn(context.messages, signal);
  },

  // 基于 token 的提供商的自定义思考预算
  thinkingBudgets: {
    minimal: 128,
    low: 512,
    medium: 1024,
    high: 2048,
  },
});
```

<a id="agent-state"></a>
## Agent 状态

```typescript
interface AgentState {
  systemPrompt: string;
  model: Model<any>;
  thinkingLevel: ThinkingLevel;
  tools: AgentTool<any>[];
  messages: AgentMessage[];
  readonly isStreaming: boolean;
  readonly streamingMessage?: AgentMessage;
  readonly pendingToolCalls: ReadonlySet<string>;
  readonly errorMessage?: string;
}
```

通过 `agent.state` 访问状态。

赋值 `agent.state.tools = [...]` 或 `agent.state.messages = [...]` 会在存储前复制顶层数组。修改返回的数组会改当前 agent 状态。

流式进行时，`agent.state.streamingMessage` 包含当前部分 assistant 消息。

`agent.state.isStreaming` 会保持 `true`，直到本次 run 完全结算，包括 awaited 的 `agent_end` 订阅者。

<a id="methods"></a>
## 方法

<a id="prompting"></a>
### 提问

```typescript
// 文本提示
await agent.prompt("Hello");

// 带图像
await agent.prompt("What's in this image?", [
  { type: "image", data: base64Data, mimeType: "image/jpeg" }
]);

// 直接传 AgentMessage
await agent.prompt({ role: "user", content: "Hello", timestamp: Date.now() });

// 从当前上下文继续（最后一条消息必须是 user 或 toolResult）
await agent.continue();
```

<a id="state-management"></a>
### 状态管理

```typescript
agent.state.systemPrompt = "New prompt";
agent.state.model = getModel("openai", "gpt-4o");
agent.state.thinkingLevel = "medium";
agent.state.tools = [myTool];
agent.toolExecution = "sequential";
agent.beforeToolCall = async ({ toolCall }) => undefined;
agent.afterToolCall = async ({ toolCall, result }) => undefined;
agent.shouldStopAfterTurn = async ({ context }) => shouldCompactBeforeNextTurn(context.messages);
agent.state.messages = newMessages; // 顶层数组会被复制
agent.state.messages.push(message);
agent.reset();
```

<a id="session-and-thinking-budgets"></a>
### 会话与思考预算

```typescript
agent.sessionId = "session-123";

agent.thinkingBudgets = {
  minimal: 128,
  low: 512,
  medium: 1024,
  high: 2048,
};
```

<a id="control"></a>
### 控制

```typescript
agent.abort();           // 取消当前操作
await agent.waitForIdle(); // 等待完成
```

<a id="events"></a>
### 事件

```typescript
const unsubscribe = agent.subscribe(async (event, signal) => {
  if (event.type === "agent_end") {
    // 本次 run 的最终屏障工作
    await flushSessionState(signal);
  }
});
unsubscribe();
```

<a id="steering-and-follow-up"></a>
## Steering 与 Follow-up

Steering 消息可在工具运行时打断代理。Follow-up 消息可在代理本将停止时排队后续工作。

```typescript
agent.steeringMode = "one-at-a-time";
agent.followUpMode = "one-at-a-time";

// 代理正在运行工具时
agent.steer({
  role: "user",
  content: "Stop! Do this instead.",
  timestamp: Date.now(),
});

// 代理完成当前工作之后
agent.followUp({
  role: "user",
  content: "Also summarize the result.",
  timestamp: Date.now(),
});

const steeringMode = agent.steeringMode;
const followUpMode = agent.followUpMode;

agent.clearSteeringQueue();
agent.clearFollowUpQueue();
agent.clearAllQueues();
```

用 clearSteeringQueue、clearFollowUpQueue 或 clearAllQueues 丢弃已排队的消息。

回合完成后检测到 steering 消息时：
1. 当前 assistant 消息中的所有工具调用已经结束
2. 注入 steering 消息
3. LLM 在下一回合响应

仅在没有更多工具调用且没有 steering 消息时才检查 follow-up 消息。若有排队项，会注入它们并再跑一回合。

<a id="custom-message-types"></a>
## 自定义消息类型

通过 declaration merging 扩展 `AgentMessage`：

```typescript
declare module "@earendil-works/pi-agent-core" {
  interface CustomAgentMessages {
    notification: { role: "notification"; text: string; timestamp: number };
  }
}

// 现在合法
const msg: AgentMessage = { role: "notification", text: "Info", timestamp: Date.now() };
```

在 `convertToLlm` 中处理自定义类型：

```typescript
const agent = new Agent({
  streamFn: models.streamSimple.bind(models),
  convertToLlm: (messages) => messages.flatMap(m => {
    if (m.role === "notification") return []; // 过滤掉
    return [m];
  }),
});
```

<a id="tools"></a>
## 工具

用 `AgentTool` 定义工具：

```typescript
import { Type } from "typebox";

const readFileTool: AgentTool = {
  name: "read_file",
  label: "Read File",  // 用于 UI 显示
  description: "Read a file's contents",
  parameters: Type.Object({
    path: Type.String({ description: "File path" }),
  }),
  // 覆盖该工具的执行模式（可选）。
  // "sequential" 强制整批逐个运行。
  // "parallel" 允许与其他工具调用并发执行。
  // 省略时使用全局 toolExecution 配置。
  executionMode: "sequential",
  execute: async (toolCallId, params, signal, onUpdate) => {
    const content = await fs.readFile(params.path, "utf-8");

    // 可选：流式进度
    onUpdate?.({ content: [{ type: "text", text: "Reading..." }], details: {} });

    // 可选：在此添加 `terminate: true`，当该批每个已定稿的 tool result
    // 都这样做时，跳过自动的后续 LLM 调用。
    return {
      content: [{ type: "text", text: content }],
      details: { path: params.path, size: content.length },
    };
  },
};

agent.state.tools = [readFileTool];
```

<a id="error-handling"></a>
### 错误处理

**工具失败时抛出错误。** 不要把错误信息当作内容返回。

```typescript
execute: async (toolCallId, params, signal, onUpdate) => {
  if (!fs.existsSync(params.path)) {
    throw new Error(`File not found: ${params.path}`);
  }
  // 仅在成功时返回内容
  return { content: [{ type: "text", text: "..." }] };
}
```

抛出的错误由代理捕获，并以 `isError: true` 作为工具错误报告给 LLM。

从 `execute()`、被阻止的 `beforeToolCall` 或 `afterToolCall` 返回 `terminate: true`，提示代理应在当前工具批次后停止。仅当该批每个已定稿的 tool result 都是 terminating 时才会生效。该提示只在运行时有效；发出的 `toolResult` 转录消息仍是标准 LLM 工具结果。

<a id="proxy-usage"></a>
## 代理用法

对通过后端代理的浏览器应用：

```typescript
import { Agent, streamProxy } from "@earendil-works/pi-agent-core";

const agent = new Agent({
  streamFn: (model, context, options) =>
    streamProxy(model, context, {
      ...options,
      authToken: "...",
      proxyUrl: "https://your-server.com",
    }),
});
```

<a id="low-level-api"></a>
## 底层 API

不使用 Agent 类、需要直接控制时：

```typescript
import { agentLoop, agentLoopContinue } from "@earendil-works/pi-agent-core";

const context: AgentContext = {
  systemPrompt: "You are helpful.",
  messages: [],
  tools: [],
};

const config: AgentLoopConfig = {
  model: getModel("openai", "gpt-4o"),
  convertToLlm: (msgs) => msgs.filter(m => ["user", "assistant", "toolResult"].includes(m.role)),
  toolExecution: "parallel",  // 若设置了 per-tool executionMode 则会被覆盖
  beforeToolCall: async ({ toolCall, args, context }) => undefined,
  afterToolCall: async ({ toolCall, result, isError, context }) => undefined,
};

const userMessage = { role: "user", content: "Hello", timestamp: Date.now() };

const streamFn = models.streamSimple.bind(models);
for await (const event of agentLoop([userMessage], context, config, undefined, streamFn)) {
  console.log(event.type);
}

// 从现有上下文继续
for await (const event of agentLoopContinue(context, config, undefined, streamFn)) {
  console.log(event.type);
}
```

这些底层流是观察性的。它们保持事件顺序，但不会等你的异步事件处理结算后才继续后续生产阶段。若需要消息处理在工具预检前充当屏障，使用 `Agent` 类，而不是原始的 `agentLoop()` 或 `agentLoopContinue()`。

<a id="license"></a>
## 许可证

MIT
