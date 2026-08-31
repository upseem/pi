<a id="custom-providers"></a>
# 自定义提供商

扩展可通过 `pi.registerProvider()` 注册自定义模型提供商。用途包括：

- **代理** - 把请求转到企业代理或 API 网关
- **自定义端点** - 使用自托管或私有模型部署
- **OAuth/SSO** - 为企业提供商加入认证流程
- **自定义 API** - 为非标准 LLM API 实现流式输出

<a id="example-extensions"></a>
## 扩展示例

完整提供商示例：

- [`examples/extensions/custom-provider-anthropic/`](../examples/extensions/custom-provider-anthropic/)
- [`examples/extensions/custom-provider-gitlab-duo/`](../examples/extensions/custom-provider-gitlab-duo/)

<a id="table-of-contents"></a>
## 目录

- [扩展示例](#example-extensions)
- [快速参考](#quick-reference)
- [覆盖现有提供商](#override-existing-provider)
- [注册新提供商](#register-new-provider)
- [注销提供商](#unregister-provider)
- [OAuth 支持](#oauth-support)
- [自定义流式 API](#custom-streaming-api)
- [上下文溢出错误](#context-overflow-errors)
- [测试实现](#testing-your-implementation)
- [配置参考](#config-reference)
- [模型定义参考](#model-definition-reference)

<a id="quick-reference"></a>
## 快速参考

扩展可以注册完整的 pi-ai `Provider`，也可以使用旧版 provider-config 形式。需要自定义认证、过滤、刷新或流式行为时，优先用完整提供商。Pi 会把 `models.json` 覆盖叠在已注册的原生提供商之上。

```typescript
import { createProvider, openAICompletionsApi } from "@earendil-works/pi-ai";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.registerProvider(createProvider({
    id: "native-local",
    name: "Native Local",
    baseUrl: "http://localhost:8080/v1",
    auth: {
      apiKey: {
        name: "Local server API key",
        async login(interaction) {
          return {
            type: "api_key",
            key: await interaction.prompt({ type: "secret", message: "API key" })
          };
        },
        async resolve({ credential }) {
          return credential?.key
            ? { auth: { apiKey: credential.key }, source: "stored API key" }
            : undefined;
        }
      }
    },
    models: [],
    api: openAICompletionsApi()
  }));

  // 旧版 provider-config 形式：
  // 覆盖现有提供商的 baseUrl
  pi.registerProvider("anthropic", {
    baseUrl: "https://proxy.example.com"
  });

  // 用 models 注册新提供商
  pi.registerProvider("my-provider", {
    name: "My Provider",
    baseUrl: "https://api.example.com",
    apiKey: "$MY_API_KEY",
    api: "openai-completions",
    models: [
      {
        id: "my-model",
        name: "My Model",
        reasoning: false,
        input: ["text", "image"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 4096
      }
    ]
  });
}
```

扩展工厂也可以是 `async`。若要动态发现模型，在工厂里拉取并注册，不要放到 `session_start`。pi 会等工厂完成后再继续启动，因此提供商在交互启动期间以及 `pi --list-models` 中都可用。

<a id="override-existing-provider"></a>
## 覆盖现有提供商

最简单的用法：把现有提供商转到代理。

```typescript
// 所有 Anthropic 请求现在走你的代理
pi.registerProvider("anthropic", {
  baseUrl: "https://proxy.example.com"
});

// 为 OpenAI 请求添加自定义 headers
pi.registerProvider("openai", {
  headers: {
    "X-Custom-Header": "value"
  }
});

// 同时设置 baseUrl 和 headers
pi.registerProvider("google", {
  baseUrl: "https://ai-gateway.corp.com/google",
  headers: {
    "X-Corp-Auth": "$CORP_AUTH_TOKEN"  // 环境变量或字面量
  }
});
```

只提供 `baseUrl` 和/或 `headers`（没有 `models`）时，该提供商的现有模型全部保留，只改端点。

<a id="register-new-provider"></a>
## 注册新提供商

要添加全新提供商，需同时指定 `models` 和必要配置。

若模型列表来自远程端点，使用 async 扩展工厂：

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

export default async function (pi: ExtensionAPI) {
  const response = await fetch("http://localhost:1234/v1/models");
  const payload = (await response.json()) as {
    data: Array<{
      id: string;
      name?: string;
      context_window?: number;
      max_tokens?: number;
    }>;
  };

  pi.registerProvider("local-openai", {
    baseUrl: "http://localhost:1234/v1",
    apiKey: "$LOCAL_OPENAI_API_KEY",
    api: "openai-completions",
    models: payload.data.map((model) => ({
      id: model.id,
      name: model.name ?? model.id,
      reasoning: false,
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: model.context_window ?? 128000,
      maxTokens: model.max_tokens ?? 4096,
    })),
  });
}
```

这会在启动结束前注册拉取到的模型。

```typescript
pi.registerProvider("my-llm", {
  baseUrl: "https://api.my-llm.com/v1",
  apiKey: "$MY_LLM_API_KEY",  // 环境变量引用
  api: "openai-completions",  // 使用哪种流式 API
  models: [
    {
      id: "my-llm-large",
      name: "My LLM Large",
      reasoning: true,        // 支持扩展思考
      input: ["text", "image"],
      cost: {
        input: 3.0,           // 美元/百万 tokens
        output: 15.0,
        cacheRead: 0.3,
        cacheWrite: 3.75
      },
      contextWindow: 200000,
      maxTokens: 16384
    }
  ]
});
```

提供 `models` 时，它会**替换**该提供商的全部现有模型。

`apiKey` 和自定义 header 值使用与 `models.json` 相同的配置值语法：以 `!command` 开头会把整个值当命令执行，`$ENV_VAR` 和 `${ENV_VAR}` 插值环境变量，`$$` 产出字面 `$`，`$!` 产出字面 `!`。

<a id="unregister-provider"></a>
## 注销提供商

用 `pi.unregisterProvider(name)` 移除先前通过 `pi.registerProvider(name, ...)` 注册的提供商：

```typescript
// 注册
pi.registerProvider("my-llm", {
  baseUrl: "https://api.my-llm.com/v1",
  apiKey: "$MY_LLM_API_KEY",
  api: "openai-completions",
  models: [
    {
      id: "my-llm-large",
      name: "My LLM Large",
      reasoning: true,
      input: ["text", "image"],
      cost: { input: 3.0, output: 15.0, cacheRead: 0.3, cacheWrite: 3.75 },
      contextWindow: 200000,
      maxTokens: 16384
    }
  ]
});

// 之后移除
pi.unregisterProvider("my-llm");
```

注销会移除该提供商的动态模型、API key 回退、OAuth 提供商注册，以及自定义 stream handler 注册。被覆盖的内置模型或提供商行为会恢复。

在初始扩展加载阶段之后的调用会立即生效，无需 `/reload`。

<a id="api-types"></a>
### API 类型

`api` 字段决定使用哪种流式实现：

| API | 用于 |
|-----|---------|
| `anthropic-messages` | Anthropic Claude API 及兼容实现 |
| `openai-completions` | OpenAI Chat Completions API 及兼容实现 |
| `openai-responses` | OpenAI Responses API |
| `azure-openai-responses` | Azure OpenAI Responses API |
| `openai-codex-responses` | OpenAI Codex Responses API |
| `mistral-conversations` | 原生 Mistral Chat Completions 流式 |
| `google-generative-ai` | Google Generative AI API |
| `google-vertex` | Google Vertex AI API |
| `bedrock-converse-stream` | Amazon Bedrock Converse API |

多数 OpenAI 兼容提供商可用 `openai-completions`。用模型级 `thinkingLevelMap` 处理特定模型的思考级别，用 `compat` 处理提供商差异。`xhigh` 和 `max` 为 opt-in，需要非 null 映射项，且中间可以有不支持的空档：

```typescript
models: [{
  id: "custom-model",
  // ...
  reasoning: true,
  thinkingLevelMap: {              // 把 pi 级别映射到提供商值；null 隐藏不支持的级别
    minimal: null,
    low: null,
    medium: null,
    high: "default",
    xhigh: null,
    max: "max"
  },
  compat: {
    supportsDeveloperRole: false,   // 用 "system" 替代 "developer"
    supportsReasoningEffort: true,
    maxTokensField: "max_tokens",   // 替代 "max_completion_tokens"
    requiresToolResultName: true,   // tool results 需要 name 字段
    thinkingFormat: "qwen",        // 顶层 enable_thinking: true
    cacheControlFormat: "anthropic" // Anthropic 风格的 cache_control 标记
  }
}]
```

用 `openrouter` 处理 OpenRouter 风格的 `reasoning: { effort }` 控制。用 `together` 处理 Together 风格的 `reasoning: { enabled }` 控制；在 `supportsReasoningEffort` 开启时也会发送 `reasoning_effort`。对读取 `chat_template_kwargs.enable_thinking` 且需要 `preserve_thinking` 的本地 Qwen 兼容服务器，使用 `qwen-chat-template`。
对通过系统提示、最后一个工具定义，以及最后一条 user、assistant 或 tool-result 文本内容上的 `cache_control` 暴露 Anthropic 风格提示缓存的 OpenAI 兼容提供商，使用 `cacheControlFormat: "anthropic"`。

对使用 `api: "anthropic-messages"` 的 Anthropic 兼容提供商，若上游模型要求 adaptive thinking（`thinking.type: "adaptive"` 加上 `output_config.effort`），在模型或提供商上设置 `compat.forceAdaptiveThinking: true`。内置 adaptive Claude 模型会自动设置。仅当提供商发出空 thinking signature 并在回放时期望 `signature: ""` 时，才设置 `compat.allowEmptySignature: true`。

> 迁移说明：Mistral 已从 `openai-completions` 迁到 `mistral-conversations`。
> 原生 Mistral 模型请使用 `mistral-conversations`。
> 若有意把 Mistral 兼容/自定义端点走 `openai-completions`，按需显式设置 `compat` 标志。

<a id="auth-header"></a>
### 认证头

若提供商期望 `Authorization: Bearer <key>` 但不是标准 API，设置 `authHeader: true`：

```typescript
pi.registerProvider("custom-api", {
  baseUrl: "https://api.example.com",
  apiKey: "$MY_API_KEY",
  authHeader: true,  // 添加 Authorization: Bearer header
  api: "openai-completions",
  models: [...]
});
```

每个请求都会解析 key。请求上显式的 `Authorization` header 优先于生成值。

<a id="oauth-support"></a>
## OAuth 支持

加入与 `/login` 集成的 OAuth/SSO 认证：

```typescript
import type { OAuthCredentials, OAuthLoginCallbacks } from "@earendil-works/pi-ai";

pi.registerProvider("corporate-ai", {
  baseUrl: "https://ai.corp.com/v1",
  api: "openai-responses",
  models: [...],
  oauth: {
    name: "Corporate AI (SSO)",

    async login(callbacks: OAuthLoginCallbacks): Promise<OAuthCredentials> {
      const method = await callbacks.onSelect({
        message: "Select login method:",
        options: [
          { id: "browser", label: "Browser OAuth" },
          { id: "device", label: "Device code" }
        ]
      });
      if (!method) throw new Error("Login cancelled");

      let code: string;
      if (method === "device") {
        callbacks.onDeviceCode({
          userCode: "ABCD-1234",
          verificationUri: "https://sso.corp.com/device",
          intervalSeconds: 5,
          expiresInSeconds: 900
        });
        code = await pollDeviceCodeUntilComplete();
      } else {
        callbacks.onAuth({ url: "https://sso.corp.com/authorize?..." });
        code = await callbacks.onPrompt({ message: "Enter SSO code:" });
      }

      // 用 code 换 token（由你实现）
      const tokens = await exchangeCodeForTokens(code);

      return {
        refresh: tokens.refreshToken,
        access: tokens.accessToken,
        expires: Date.now() + tokens.expiresIn * 1000
      };
    },

    async refreshToken(credentials: OAuthCredentials, signal: AbortSignal): Promise<OAuthCredentials> {
      const tokens = await refreshAccessToken(credentials.refresh, signal);
      return {
        refresh: tokens.refreshToken ?? credentials.refresh,
        access: tokens.accessToken,
        expires: Date.now() + tokens.expiresIn * 1000
      };
    },

    getApiKey(credentials: OAuthCredentials): string {
      return credentials.access;
    }
  }
});
```

注册后，用户可通过 `/login corporate-ai` 认证。

<a id="oauthlogincallbacks"></a>
### OAuthLoginCallbacks

`callbacks` 对象为提供商自有流程提供与 UI 无关的交互：

```typescript
interface OAuthLoginCallbacks {
  // 在浏览器中打开 URL（OAuth 重定向）
  onAuth(params: { url: string }): void;

  // 显示设备码（设备授权流程）
  onDeviceCode(params: {
    userCode: string;
    verificationUri: string;
    intervalSeconds?: number;
    expiresInSeconds?: number;
  }): void;

  // 显示短暂进度
  onProgress?(message: string): void;

  // 提示用户输入（手动输入 token）
  onPrompt(params: { message: string }): Promise<string>;

  // 显示交互式选择器，例如选择 browser OAuth 还是 device code
  onSelect(params: {
    message: string;
    options: { id: string; label: string }[];
  }): Promise<string | undefined>;
}
```

<a id="oauthcredentials"></a>
### OAuthCredentials

凭据保存在 `~/.pi/agent/auth.json`：

```typescript
interface OAuthCredentials {
  refresh: string;   // Refresh token（供 refreshToken() 使用）
  access: string;    // Access token（由 getApiKey() 返回）
  expires: number;   // 过期时间戳，单位毫秒
}
```

<a id="custom-streaming-api"></a>
## 自定义流式 API

对非标准 API 的提供商，实现 `streamSimple`。写自己的实现前，先研究现有 API 实现：

**参考实现：**
- [anthropic-messages.ts](https://github.com/earendil-works/pi-mono/blob/main/packages/ai/src/api/anthropic-messages.ts) - Anthropic Messages API
- [mistral-conversations.ts](https://github.com/earendil-works/pi-mono/blob/main/packages/ai/src/api/mistral-conversations.ts) - Mistral Conversations API
- [openai-completions.ts](https://github.com/earendil-works/pi-mono/blob/main/packages/ai/src/api/openai-completions.ts) - OpenAI Chat Completions
- [openai-responses.ts](https://github.com/earendil-works/pi-mono/blob/main/packages/ai/src/api/openai-responses.ts) - OpenAI Responses API
- [google-generative-ai.ts](https://github.com/earendil-works/pi-mono/blob/main/packages/ai/src/api/google-generative-ai.ts) - Google Generative AI
- [bedrock-converse-stream.ts](https://github.com/earendil-works/pi-mono/blob/main/packages/ai/src/api/bedrock-converse-stream.ts) - AWS Bedrock

<a id="stream-pattern"></a>
### 流模式

所有提供商遵循同一模式：

```typescript
import {
  type AssistantMessage,
  type AssistantMessageEventStream,
  type Context,
  type Model,
  type SimpleStreamOptions,
  calculateCost,
  createAssistantMessageEventStream,
} from "@earendil-works/pi-ai";

function streamMyProvider(
  model: Model<any>,
  context: Context,
  options?: SimpleStreamOptions
): AssistantMessageEventStream {
  const stream = createAssistantMessageEventStream();

  (async () => {
    // 初始化输出消息
    const output: AssistantMessage = {
      role: "assistant",
      content: [],
      api: model.api,
      provider: model.provider,
      model: model.id,
      usage: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
        totalTokens: 0,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
      },
      stopReason: "pending",
      timestamp: Date.now(),
    };

    try {
      // 推送 start 事件
      stream.push({ type: "start", partial: output });

      // 发起 API 请求并处理响应...
      // 随数据到达推送 content 事件，并从终止事件设置 stopReason。
      if (output.stopReason === "pending") {
        throw new Error("Provider stream ended without a stop reason");
      }
      if (output.stopReason === "error" || output.stopReason === "aborted") {
        throw new Error(output.errorMessage || "An unknown error occurred");
      }

      // 推送 done 事件
      stream.push({
        type: "done",
        reason: output.stopReason,
        message: output
      });
      stream.end();
    } catch (error) {
      output.stopReason = options?.signal?.aborted ? "aborted" : "error";
      output.errorMessage = error instanceof Error ? error.message : String(error);
      stream.push({ type: "error", reason: output.stopReason, error: output });
      stream.end();
    }
  })();

  return stream;
}
```

<a id="event-types"></a>
### 事件类型

通过 `stream.push()` 按此顺序推送事件：

1. `{ type: "start", partial: output }` - 流已开始

2. 内容事件（可重复，每个块跟踪 `contentIndex`）：
   - `{ type: "text_start", contentIndex, partial }` - 文本块开始
   - `{ type: "text_delta", contentIndex, delta, partial }` - 文本分片
   - `{ type: "text_end", contentIndex, content, partial }` - 文本块结束
   - `{ type: "thinking_start", contentIndex, partial }` - 思考开始
   - `{ type: "thinking_delta", contentIndex, delta, partial }` - 思考分片
   - `{ type: "thinking_end", contentIndex, content, partial }` - 思考结束
   - `{ type: "toolcall_start", contentIndex, partial }` - 工具调用开始
   - `{ type: "toolcall_delta", contentIndex, delta, partial }` - 工具调用 JSON 分片
   - `{ type: "toolcall_end", contentIndex, toolCall, partial }` - 工具调用结束

3. `{ type: "done", reason, message }` 或 `{ type: "error", reason, error }` - 流结束

每个事件中的 `partial` 字段是当前 `AssistantMessage` 状态。收到数据时更新 `output.content`，再把 `output` 作为 `partial`。

<a id="content-blocks"></a>
### 内容块

数据到达时向 `output.content` 添加内容块：

```typescript
// 文本块
output.content.push({ type: "text", text: "" });
stream.push({ type: "text_start", contentIndex: output.content.length - 1, partial: output });

// 文本到达时
const block = output.content[contentIndex];
if (block.type === "text") {
  block.text += delta;
  stream.push({ type: "text_delta", contentIndex, delta, partial: output });
}

// 块完成时
stream.push({ type: "text_end", contentIndex, content: block.text, partial: output });
```

<a id="tool-calls"></a>
### 工具调用

工具调用需要累积 JSON 并解析：

```typescript
// 开始 tool call
output.content.push({
  type: "toolCall",
  id: toolCallId,
  name: toolName,
  arguments: {}
});
stream.push({ type: "toolcall_start", contentIndex: output.content.length - 1, partial: output });

// 累积 JSON
let partialJson = "";
partialJson += jsonDelta;
try {
  block.arguments = JSON.parse(partialJson);
} catch {}
stream.push({ type: "toolcall_delta", contentIndex, delta: jsonDelta, partial: output });

// 完成
stream.push({
  type: "toolcall_end",
  contentIndex,
  toolCall: { type: "toolCall", id, name, arguments: block.arguments },
  partial: output
});
```

<a id="usage-and-cost"></a>
### 用量与费用

根据 API 响应更新用量并计算费用：

```typescript
output.usage.input = response.usage.input_tokens;
output.usage.output = response.usage.output_tokens;
output.usage.cacheRead = response.usage.cache_read_tokens ?? 0;
output.usage.cacheWrite = response.usage.cache_write_tokens ?? 0;
output.usage.totalTokens = output.usage.input + output.usage.output +
                           output.usage.cacheRead + output.usage.cacheWrite;
calculateCost(model, output.usage);
```

<a id="context-overflow-errors"></a>
### 上下文溢出错误

请求超出模型上下文窗口时，pi 可以压缩对话并重试来自动恢复。只有 pi 把失败识别为溢出时，才会走这条恢复路径。

检测针对已定稿的 assistant 消息：

- `stopReason === "error"`
- `errorMessage` 匹配 pi 已知的溢出模式（见 [`packages/ai/src/utils/overflow.ts`](https://github.com/earendil-works/pi-mono/blob/main/packages/ai/src/utils/overflow.ts)）

若提供商返回的溢出错误信息 pi 无法识别，在注册该提供商的同一扩展里规范化错误。用 `message_end` handler 改写 assistant 消息，使其 `errorMessage` 以 pi 能识别的短语开头。通用回退 `context_length_exceeded` 最稳妥。

```typescript
const MY_PROVIDER_OVERFLOW_PATTERN = /your provider's overflow phrase/i;

export default function (pi: ExtensionAPI) {
  pi.registerProvider("my-provider", { /* ... */ });

  pi.on("message_end", (event, ctx) => {
    const message = event.message;
    if (message.role !== "assistant") return;
    if (message.stopReason !== "error") return;
    if (
      message.provider !== "my-provider" &&
      ctx.model?.provider !== "my-provider"
    )
      return;

    const errorMessage = message.errorMessage ?? "";
    if (errorMessage.includes("context_length_exceeded")) return;
    if (!MY_PROVIDER_OVERFLOW_PATTERN.test(errorMessage)) return;

    return {
      message: {
        ...message,
        errorMessage: `context_length_exceeded: ${errorMessage}`,
      },
    };
  });
}
```

`message_end` 在 pi 为自动压缩跟踪 assistant 消息之前运行，因此 pi 检查的是改写后的 `errorMessage`。设置之后，pi 会：

1. 从 `errorMessage` 检测溢出。
2. 从实时上下文中丢弃失败的 assistant 消息。
3. 执行压缩。
4. 重试该请求一次。

改写时要严格设限：

- 限定到你的提供商（`message.provider` 和 `ctx.model?.provider`），不要动其他提供商的无关错误。
- 匹配提供商特有模式，不要匹配 pi 的通用溢出模式。把限流或节流错误（`rate limit`、`too many requests`）改写成溢出会误触发压缩，而不是 pi 正常的退避重试。
- 若 `errorMessage` 已包含 `context_length_exceeded` 则跳过，保证 handler 幂等。

<a id="registration"></a>
### 注册

注册你的 stream 函数：

```typescript
pi.registerProvider("my-provider", {
  baseUrl: "https://api.example.com",
  apiKey: "$MY_API_KEY",
  api: "my-custom-api",
  models: [...],
  streamSimple: streamMyProvider
});
```

<a id="testing-your-implementation"></a>
## 测试实现

用内置提供商同一套测试来测你的提供商。从 [packages/ai/test/](https://github.com/earendil-works/pi-mono/tree/main/packages/ai/test) 复制并改编这些测试文件：

| 测试 | 用途 |
|------|---------|
| `stream.test.ts` | 基本流式、文本输出 |
| `tokens.test.ts` | Token 计数与用量 |
| `abort.test.ts` | AbortSignal 处理 |
| `empty.test.ts` | 空/最小响应 |
| `context-overflow.test.ts` | 上下文窗口限制 |
| `image-limits.test.ts` | 图像输入处理 |
| `unicode-surrogate.test.ts` | Unicode 边界情况 |
| `tool-call-without-result.test.ts` | 工具调用边界情况 |
| `image-tool-result.test.ts` | 工具结果中的图像 |
| `total-tokens.test.ts` | 总 token 计算 |
| `cross-provider-handoff.test.ts` | 提供商之间的上下文交接 |

用你的提供商/模型组合跑测试以验证兼容性。

<a id="config-reference"></a>
## 配置参考

```typescript
interface ProviderConfig {
  /** 提供商在 /login 等 UI 中的显示名称。 */
  name?: string;

  /** API 端点 URL。定义 models 时必填。 */
  baseUrl?: string;

  /** API key 字面量、环境插值（$ENV_VAR 或 ${ENV_VAR}），或 !command。定义 models 时必填（除非有 oauth）。 */
  apiKey?: string;

  /** 流式 API 类型。定义 models 时，提供商或模型级必须有。 */
  api?: Api;

  /** 非标准 API 的自定义流式实现。 */
  streamSimple?: (
    model: Model<Api>,
    context: Context,
    options?: SimpleStreamOptions
  ) => AssistantMessageEventStream;

  /** 请求中包含的自定义 headers。值使用与 apiKey 相同的解析语法。 */
  headers?: Record<string, string>;

  /** 为 true 时，用解析后的 API key 添加 Authorization: Bearer header。 */
  authHeader?: boolean;

  /** 要注册的模型。若提供，会替换该提供商的全部现有模型。 */
  models?: ProviderModelConfig[];

  /** 用于 /login 的 OAuth 提供商。 */
  oauth?: {
    name: string;
    login(callbacks: OAuthLoginCallbacks): Promise<OAuthCredentials>;
    refreshToken(credentials: OAuthCredentials, signal: AbortSignal): Promise<OAuthCredentials>;
    getApiKey(credentials: OAuthCredentials): string;
  };
}
```

<a id="model-definition-reference"></a>
## 模型定义参考

```typescript
interface ProviderModelConfig {
  /** 模型 ID（例如 "claude-sonnet-4-20250514"）。 */
  id: string;

  /** 显示名称（例如 "Claude 4 Sonnet"）。 */
  name: string;

  /** 该模型的 API 类型覆盖。 */
  api?: Api;

  /** 该模型的 API 端点 URL 覆盖。 */
  baseUrl?: string;

  /** 模型是否支持扩展思考。 */
  reasoning: boolean;

  /** 把 pi 思考级别映射到提供商/模型特定值；null 表示该级别不受支持。 */
  thinkingLevelMap?: Partial<Record<"off" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max", string | null>>;

  /** 支持的输入类型。 */
  input: ("text" | "image")[];

  /** 每百万 tokens 的费用（用于用量跟踪）。 */
  cost: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
  };

  /** 最大上下文窗口，单位 tokens。 */
  contextWindow: number;

  /** 最大输出 tokens。 */
  maxTokens: number;

  /** 该模型的自定义 headers。 */
  headers?: Record<string, string>;

  /** 所选 API 的兼容性设置。 */
  compat?: {
    // openai-completions
    supportsStore?: boolean;
    supportsDeveloperRole?: boolean;
    supportsReasoningEffort?: boolean;
    supportsUsageInStreaming?: boolean;
    supportsFinishReason?: boolean;
    supportsStrictMode?: boolean;
    supportsOpenAIGrammarTools?: boolean; // openai-completions/openai-responses；false 回退到普通 function tools
    maxTokensField?: "max_completion_tokens" | "max_tokens";
    requiresToolResultName?: boolean;
    requiresAssistantAfterToolResult?: boolean;
    requiresThinkingAsText?: boolean;
    requiresReasoningContentOnAssistantMessages?: boolean;
    thinkingFormat?: "openai" | "openrouter" | "deepseek" | "together" | "baseten" | "zai" | "qwen" | "chat-template" | "qwen-chat-template" | "string-thinking" | "ant-ling";
    chatTemplateKwargs?: Record<string, string | number | boolean | null | { "$var": "thinking.enabled" | "thinking.effort" | "thinking.budget"; omitWhenOff?: boolean }>;
    chatTemplateArgs?: Record<string, string | number | boolean | null | { "$var": "thinking.enabled" | "thinking.effort" | "thinking.budget"; omitWhenOff?: boolean }>;
    thinkingTokenBudgetField?: "thinking_token_budget" | "thinking_budget" | "thinking_budget_tokens";
    supportsThinkingTokenBudget?: boolean;
    cacheControlFormat?: "anthropic";
    sessionAffinityFormat?: "openai" | "openai-nosession" | "openrouter";
    sendSessionAffinityHeaders?: boolean;

    // anthropic-messages
    supportsEagerToolInputStreaming?: boolean;
    supportsLongCacheRetention?: boolean;
    sendSessionAffinityHeaders?: boolean;
    supportsCacheControlOnTools?: boolean;
    forceAdaptiveThinking?: boolean;
    allowEmptySignature?: boolean;
    supportsStrictTools?: boolean;
  };
}
```

`openrouter` 发送 `reasoning: { effort }`。`deepseek` 发送 `thinking: { type: "enabled" | "disabled" }`，启用时还发送 `reasoning_effort`。`together` 发送 `reasoning: { enabled }`，在 `supportsReasoningEffort` 开启时也发送 `reasoning_effort`。`qwen` 用于 DashScope 风格的顶层 `enable_thinking`。对读取 `chat_template_kwargs.enable_thinking` 且需要 `preserve_thinking` 的本地 Qwen 兼容服务器，使用 `qwen-chat-template`。对可配置的 `chat_template_kwargs` 使用 `chat-template`，例如 vLLM 后面的 DeepSeek V3.x，配合 `chatTemplateKwargs: { "thinking": { "$var": "thinking.enabled" } }`。当提供商期望在 `chat_template_args` 下使用开关值，并可选支持顶层 `reasoning_effort` 时，使用 `thinkingFormat: "baseten"` 配合 `chatTemplateArgs`。
`thinkingTokenBudgetField` 把按级别钳制后的思考预算作为顶层请求字段发送（vLLM 上是 `thinking_token_budget`，Qwen/SGLang 上是 `thinking_budget`，llama.cpp 上是 `thinking_budget_tokens`）。`supportsThinkingTokenBudget: true` 是 vLLM 字段名的别名。不要在 DashScope Qwen 模型上把它与 `reasoning_effort` 一起用。
`cacheControlFormat: "anthropic"` 会把 Anthropic 风格的 `cache_control` 标记应用到系统提示、最后一个工具定义，以及最后一条 user、assistant 或 tool-result 文本内容。
