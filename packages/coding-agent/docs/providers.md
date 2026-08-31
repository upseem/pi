<a id="providers"></a>
# 提供商

Pi 通过 OAuth 支持订阅类提供商，通过环境变量或 auth 文件支持 API key 提供商。内置目录随 pi 发布；已配置的提供商可能刷新更新的目录，并缓存到 `~/.pi/agent/models-store.json` 供离线使用。

<a id="table-of-contents"></a>
## 目录

- [订阅](#subscriptions)
- [API Keys](#api-keys)
- [Auth 文件](#auth-file)
- [云提供商](#cloud-providers)
- [llama.cpp](#llamacpp)
- [自定义提供商](#custom-providers)
- [解析顺序](#resolution-order)

<a id="subscriptions"></a>
## 订阅

在交互模式中使用 `/login`，然后选择提供商：

- ChatGPT Plus/Pro (Codex)
- Claude Pro/Max
- GitHub Copilot
- xAI (Grok/X subscription)
- OpenRouter（OAuth 签发的 API key，从 OpenRouter credits 计费）
- Radius

用 `/logout` 清除凭据。Token 存在 `~/.pi/agent/auth.json`，过期后自动刷新。OpenRouter 则签发由用户控制、不会自动过期的 API key。

<a id="openai-codex"></a>
### OpenAI Codex

- 需要 ChatGPT Plus 或 Pro 订阅
- 由 OpenAI 官方认可：[Codex for OSS](https://developers.openai.com/community/codex-for-oss)

<a id="claude-promax"></a>
### Claude Pro/Max

Anthropic 订阅认证对 Claude Pro/Max 账号生效。第三方框架用量取自 [extra usage](https://claude.ai/settings/usage)，按 token 计费，不计入 Claude 套餐限额。

<a id="github-copilot"></a>
### GitHub Copilot

- 按 Enter 使用 github.com，或输入 GitHub Enterprise Server 域名
- 若出现 "model not supported"，在 VS Code 中启用：Copilot Chat → 模型选择器 → 选择模型 → "Enable"

<a id="xai-grokx-subscription"></a>
### xAI (Grok/X subscription)

- 运行 `/login xai`，然后选择 **Use a subscription**
- `XAI_API_KEY` 仍可通过 **Use an API key** 使用

<a id="openrouter"></a>
### OpenRouter

- 运行 `/login openrouter`，然后选择 **Sign in with OpenRouter**，打开 OpenRouter PKCE 授权流程
- 授权会创建由用户控制的 OpenRouter API key，从你的 OpenRouter credits 计费
- 在远程/无界面机器上（例如通过 SSH），浏览器无法到达 loopback 回调；请把最终重定向 URL（或授权码）粘贴到登录提示中
- `OPENROUTER_API_KEY` 仍可通过 **Use an API key** 使用

<a id="radius"></a>
### Radius

Radius 是动态的 `pi-messages` 网关。`/login radius` 把 OAuth token 存入 `auth.json`；网关目录独立刷新，并缓存到 `models-store.json`。自定义 Radius 网关可在 `models.json` 中用 `"oauth": "radius"` 和网关 `baseUrl` 声明。

<a id="api-keys"></a>
## API Keys

<a id="environment-variables-or-auth-file"></a>
### 环境变量或 Auth 文件

在交互模式中用 `/login` 选择提供商，把 API key 存入 `auth.json`，或通过环境变量设置凭据：

```bash
export ANTHROPIC_API_KEY=sk-ant-...
pi
```

| 提供商 | 环境变量 | `auth.json` 键 |
|----------|----------------------|------------------|
| Anthropic | `ANTHROPIC_API_KEY` | `anthropic` |
| Ant Ling | `ANT_LING_API_KEY` | `ant-ling` |
| Azure OpenAI Responses | `AZURE_OPENAI_API_KEY` | `azure-openai-responses` |
| OpenAI | `OPENAI_API_KEY` | `openai` |
| DeepSeek | `DEEPSEEK_API_KEY` | `deepseek` |
| NVIDIA NIM | `NVIDIA_API_KEY` | `nvidia` |
| Google Gemini | `GEMINI_API_KEY` | `google` |
| Amazon Bedrock | `AWS_BEARER_TOKEN_BEDROCK` | `amazon-bedrock` |
| Mistral | `MISTRAL_API_KEY` | `mistral` |
| Groq | `GROQ_API_KEY` | `groq` |
| Cerebras | `CEREBRAS_API_KEY` | `cerebras` |
| Cloudflare AI Gateway | `CLOUDFLARE_API_KEY`（另需 `CLOUDFLARE_ACCOUNT_ID`、`CLOUDFLARE_GATEWAY_ID`） | `cloudflare-ai-gateway` |
| Cloudflare Workers AI | `CLOUDFLARE_API_KEY`（另需 `CLOUDFLARE_ACCOUNT_ID`） | `cloudflare-workers-ai` |
| xAI | `XAI_API_KEY` | `xai` |
| OpenRouter | `OPENROUTER_API_KEY` | `openrouter` |
| Vercel AI Gateway | `AI_GATEWAY_API_KEY` | `vercel-ai-gateway` |
| ZAI Coding Plan（全球） | `ZAI_API_KEY` | `zai` |
| ZAI Coding Plan（中国） | `ZAI_CODING_CN_API_KEY` | `zai-coding-cn` |
| OpenCode Zen | `OPENCODE_API_KEY` | `opencode` |
| OpenCode Go | `OPENCODE_API_KEY` | `opencode-go` |
| Radius | `RADIUS_API_KEY` | `radius` |
| Hugging Face | `HF_TOKEN` | `huggingface` |
| Fireworks | `FIREWORKS_API_KEY` | `fireworks` |
| Together AI | `TOGETHER_API_KEY` | `together` |
| Baseten | `BASETEN_API_KEY` | `baseten` |
| Kimi For Coding | `KIMI_API_KEY` | `kimi-coding` |
| MiniMax | `MINIMAX_API_KEY` | `minimax` |
| MiniMax（中国） | `MINIMAX_CN_API_KEY` | `minimax-cn` |
| Qwen Token Plan（现有目录） | `QWEN_TOKEN_PLAN_API_KEY` | `qwen-token-plan` |
| Qwen Token Plan（Individual） | `QWEN_TOKEN_PLAN_API_KEY` | `qwen-token-plan-individual` |
| Qwen Token Plan（中国） | `QWEN_TOKEN_PLAN_CN_API_KEY` | `qwen-token-plan-cn` |
| Xiaomi MiMo | `XIAOMI_API_KEY` | `xiaomi` |
| Xiaomi MiMo Token Plan（中国） | `XIAOMI_TOKEN_PLAN_CN_API_KEY` | `xiaomi-token-plan-cn` |
| Xiaomi MiMo Token Plan（阿姆斯特丹） | `XIAOMI_TOKEN_PLAN_AMS_API_KEY` | `xiaomi-token-plan-ams` |
| Xiaomi MiMo Token Plan（新加坡） | `XIAOMI_TOKEN_PLAN_SGP_API_KEY` | `xiaomi-token-plan-sgp` |

环境变量和 `auth.json` 键的参考：[`packages/ai/src/env-api-keys.ts`](https://github.com/earendil-works/pi-mono/blob/main/packages/ai/src/env-api-keys.ts) 中的 [`const envMap`](https://github.com/earendil-works/pi-mono/blob/main/packages/ai/src/env-api-keys.ts)。

<a id="auth-file"></a>
#### Auth 文件

把凭据存在 `~/.pi/agent/auth.json`：

```json
{
  "anthropic": { "type": "api_key", "key": "sk-ant-..." },
  "ant-ling": { "type": "api_key", "key": "..." },
  "openai": { "type": "api_key", "key": "sk-..." },
  "deepseek": { "type": "api_key", "key": "sk-..." },
  "nvidia": { "type": "api_key", "key": "nvapi-..." },
  "google": { "type": "api_key", "key": "..." },
  "opencode": { "type": "api_key", "key": "..." },
  "opencode-go": { "type": "api_key", "key": "..." },
  "together": { "type": "api_key", "key": "..." },
  "qwen-token-plan":  { "type": "api_key", "key": "sk-sp-..." },
  "qwen-token-plan-individual": { "type": "api_key", "key": "sk-sp-..." },
  "qwen-token-plan-cn": { "type": "api_key", "key": "sk-sp-..." },
  "xiaomi": { "type": "api_key", "key": "..." },
  "xiaomi-token-plan-cn":  { "type": "api_key", "key": "..." },
  "xiaomi-token-plan-ams": { "type": "api_key", "key": "..." },
  "xiaomi-token-plan-sgp": { "type": "api_key", "key": "..." }
}
```

`qwen-token-plan-individual` 使用与 `qwen-token-plan` 相同的国际端点和 `QWEN_TOKEN_PLAN_API_KEY`，但选择器只列出 Individual 订阅文档中的模型。现有提供商保留更广的目录以保持兼容。使用 `auth.json` 时，把凭据存在你所选提供商下；环境变量由两个国际提供商共享。

文件以 `0600` 权限创建（仅用户可读写）。Auth 文件中的凭据优先于环境变量。

API key 凭据也可以包含提供商作用域的环境值。解析凭据键、提供商/模型 headers，以及 Cloudflare 账号 ID、Azure OpenAI 设置、Vertex 项目/区域、Bedrock 设置、`PI_CACHE_RETENTION` 和 `HTTP_PROXY`/`HTTPS_PROXY` 等提供商配置时，这些值优先于进程环境变量。

```json
{
  "cloudflare-ai-gateway": {
    "type": "api_key",
    "key": "$CLOUDFLARE_API_KEY",
    "env": {
      "CLOUDFLARE_API_KEY": "...",
      "CLOUDFLARE_ACCOUNT_ID": "account-id",
      "CLOUDFLARE_GATEWAY_ID": "gateway-id"
    }
  }
}
```

当 pi 应使用与项目 shell 环境不同的提供商设置时，用这种方式。

<a id="key-resolution"></a>
### 键解析

`key` 字段支持命令执行、环境插值和字面量：

- **Shell 命令：** 以 `"!command"` 开头时，把整个值当命令执行，使用 stdout（在进程生命周期内缓存）
  ```json
  { "type": "api_key", "key": "!security find-generic-password -ws 'anthropic'" }
  { "type": "api_key", "key": "!op read 'op://vault/item/credential'" }
  ```
- **环境插值：** `"$ENV_VAR"` 或 `"${ENV_VAR}"` 使用该变量的值。插值也可出现在更大的字面量中。
  ```json
  { "type": "api_key", "key": "$MY_ANTHROPIC_KEY" }
  { "type": "api_key", "key": "${KEY_PREFIX}_${KEY_SUFFIX}" }
  ```
  `$FOO_BAR` 是变量 `FOO_BAR`；`BAR` 为字面文本时用 `${FOO}_BAR`。缺失的环境变量会使该值无法解析。
- **转义：** `"$$"` 产出字面 `"$"`；`"$!"` 产出字面 `"!"` 且不触发命令执行。
  ```json
  { "type": "api_key", "key": "$$literal-dollar-prefix" }
  { "type": "api_key", "key": "$!literal-bang-prefix" }
  ```
- **字面值：** 直接使用。纯大写字符串如 `MY_API_KEY` 是字面量；环境变量请用 `$MY_API_KEY`。
  ```json
  { "type": "api_key", "key": "sk-ant-..." }
  { "type": "api_key", "key": "public" }
  ```

`/login` 之后的 OAuth 凭据也存在这里，并自动管理。

<a id="cloud-providers"></a>
## 云提供商

<a id="azure-openai"></a>
### Azure OpenAI

```bash
export AZURE_OPENAI_API_KEY=...
export AZURE_OPENAI_BASE_URL=https://your-resource.ai.azure.com
# 也支持：https://your-resource.cognitiveservices.azure.com
# 也支持：https://your-resource.openai.azure.com
# 根路径端点会自动规范化为 /openai/v1
# 也可以用资源名代替 base URL
export AZURE_OPENAI_RESOURCE_NAME=your-resource

# 可选
export AZURE_OPENAI_API_VERSION=2024-02-01
export AZURE_OPENAI_DEPLOYMENT_NAME_MAP=gpt-4=my-gpt4,gpt-4o=my-gpt4o
```

<a id="amazon-bedrock"></a>
### Amazon Bedrock

用 `/login amazon-bedrock` 存储 Bedrock API key，或配置以下环境 AWS 凭据来源之一：

```bash
# 选项 1：AWS Profile
export AWS_PROFILE=your-profile

# 选项 2：IAM Keys
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=...

# 选项 3：Bearer Token
export AWS_BEARER_TOKEN_BEDROCK=...

# 可选区域（默认为 us-east-1）
export AWS_REGION=us-west-2
```

也支持 ECS task roles（`AWS_CONTAINER_CREDENTIALS_*`）和 IRSA（`AWS_WEB_IDENTITY_TOKEN_FILE`）。

```bash
pi --provider amazon-bedrock --model us.anthropic.claude-sonnet-4-20250514-v1:0
```

对 ID 中含可识别模型名的 Claude 模型（基础模型和系统定义的 inference profiles），提示缓存会自动启用。对应用 inference profiles（ARN 中不含模型名），设置 `AWS_BEDROCK_FORCE_CACHE=1` 以启用 cache points：

```bash
export AWS_BEDROCK_FORCE_CACHE=1
pi --provider amazon-bedrock --model arn:aws:bedrock:us-east-1:123456789012:application-inference-profile/abc123
```

若连接到 Bedrock API 代理，可使用以下环境变量：

```bash
# 设置 Bedrock 代理 URL（标准 AWS SDK 环境变量）
export AWS_ENDPOINT_URL_BEDROCK_RUNTIME=https://my.corp.proxy/bedrock

# 若代理不需要认证则设置
export AWS_BEDROCK_SKIP_AUTH=1

# 若代理只支持 HTTP/1.1 则设置
export AWS_BEDROCK_FORCE_HTTP1=1
```

<a id="cloudflare-ai-gateway"></a>
### Cloudflare AI Gateway

`CLOUDFLARE_API_KEY` 可通过 `/login` 设置。账号 ID 和 gateway slug 可作为环境变量，或写在 `auth.json` 里 API key 凭据的 `env` 对象中。

```bash
export CLOUDFLARE_API_KEY=...           # 或使用 /login
export CLOUDFLARE_ACCOUNT_ID=...
export CLOUDFLARE_GATEWAY_ID=...        # 在 dash.cloudflare.com → AI → AI Gateway 创建
pi --provider cloudflare-ai-gateway --model "claude-sonnet-4-5"
```

通过 Cloudflare AI Gateway 路由到 OpenAI、Anthropic 和 Workers AI。Workers AI 使用 Unified API（`/compat`）和带前缀的模型 ID（`workers-ai/@cf/...`）。OpenAI 使用 OpenAI 透传路由（`/openai`），模型 ID 为原生 OpenAI ID，例如 `gpt-5.1`。Anthropic 使用 Anthropic 透传路由（`/anthropic`），模型 ID 为原生 Anthropic ID，例如 `claude-sonnet-4-5`。

AI Gateway 认证把 `CLOUDFLARE_API_KEY` 用作 `cf-aig-authorization`。上游认证可以是：

| 模式 | 请求认证 | 上游认证 |
|------|--------------|---------------|
| Workers AI | 仅 Cloudflare token | Cloudflare 原生 |
| 统一计费 | 仅 Cloudflare token | Cloudflare 处理上游认证并扣减 credits |
| 存储的 BYOK | 仅 Cloudflare token | Cloudflare 注入 AI Gateway 控制台中存储的提供商密钥 |
| 内联 BYOK | Cloudflare token 加上游 `Authorization` header | 请求提供上游提供商密钥 |

日常使用 pi 时，优先用统一计费或存储的 BYOK。内联 BYOK 需要为 Cloudflare AI Gateway 提供商额外配置上游 `Authorization` header，例如通过 `models.json` 的提供商/模型覆盖。

<a id="cloudflare-workers-ai"></a>
### Cloudflare Workers AI

`CLOUDFLARE_API_KEY` 可通过 `/login` 设置。`CLOUDFLARE_ACCOUNT_ID` 可作为环境变量，或写在 `auth.json` 里 API key 凭据的 `env` 对象中。

```bash
export CLOUDFLARE_API_KEY=...           # 或使用 /login
export CLOUDFLARE_ACCOUNT_ID=...
pi --provider cloudflare-workers-ai --model "@cf/moonshotai/kimi-k2.6"
```

Pi 会自动设置 `x-session-affinity`，以享受 [prefix caching](https://developers.cloudflare.com/workers-ai/features/prompt-caching/) 折扣。

<a id="google-vertex-ai"></a>
### Google Vertex AI

使用应用默认凭据：

```bash
gcloud auth application-default login
export GOOGLE_CLOUD_PROJECT=your-project
export GOOGLE_CLOUD_LOCATION=us-central1
```

或把 `GOOGLE_APPLICATION_CREDENTIALS` 设为服务账号密钥文件。

<a id="llamacpp"></a>
## llama.cpp

Pi 支持 llama.cpp 路由服务器。用 `/login llama.cpp` 配置，用 `/llama` 管理已加载模型，用 `/model` 选择已加载模型。

服务器设置、模型目录布局、环境变量和命令用法见 [llama.cpp](llama-cpp.md)。

<a id="custom-providers"></a>
## 自定义提供商

**通过 models.json：** 添加 Ollama、LM Studio、vLLM，或任何使用受支持 API 的提供商（OpenAI Completions、OpenAI Responses、Anthropic Messages、Google Generative AI）。见 [models.md](models.md)。

**通过扩展：** 对需要自定义 API 实现或 OAuth 流程的提供商，创建扩展。见 [custom-provider.md](custom-provider.md) 和 [examples/extensions/custom-provider-gitlab-duo](../examples/extensions/custom-provider-gitlab-duo/)。

<a id="resolution-order"></a>
## 解析顺序

解析提供商凭据时：

1. CLI `--api-key` 标志
2. `auth.json` 条目（API key 或 OAuth token）
3. 环境变量
4. `models.json` 中的自定义提供商密钥
