<a id="settings"></a>
# 设置

Pi 使用 JSON 设置文件，项目设置会覆盖全局设置。

| 位置 | 作用域 |
|----------|-------|
| `~/.pi/agent/settings.json` | 全局（所有项目） |
| `.pi/settings.json` | 项目（当前目录） |

可直接编辑，或用 `/settings` 修改常用选项。要交互式保存启动模型默认值，使用 `/model` 并在目标模型上按 Ctrl+S。要保存启动思考级别，使用 `/thinking` 并按 Ctrl+S。

<a id="project-trust"></a>
## 项目信任

交互式启动时，若项目文件夹包含项目级设置、资源或项目 `.agents/skills`，且 `~/.pi/agent/trust.json` 中对该文件夹或其父文件夹没有已保存的决定，pi 会先询问是否信任。信任项目后，pi 可加载 `.pi/settings.json` 和 `.pi` 资源、安装缺失的项目包，并执行项目扩展。

非交互模式（`-p`、`--mode json` 和 `--mode rpc`）不会显示信任提示。若没有适用的已保存信任决定，它们使用全局设置中的 `defaultProjectTrust`：`ask`（默认）和 `never` 会忽略这些项目资源，`always` 则信任它们。传入 `--approve`/`-a` 或 `--no-approve`/`-na` 可覆盖本次运行的项目信任。

若没有扩展或已保存决定适用，`defaultProjectTrust` 控制回退行为。在 `~/.pi/agent/settings.json` 中设为 `"ask"`、`"always"` 或 `"never"`，或通过 `/settings` 修改。

`pi config` 和包相关命令使用相同的项目信任流程，但 `pi update` 从不提示。传入 `--approve` 可在单次命令中信任项目级设置，或传入 `--no-approve` 忽略它们。

在交互模式中使用 `/trust` 可为后续会话保存项目信任决定，包括对直接父文件夹的信任。它只写入 `~/.pi/agent/trust.json`；当前会话不会重新加载，因此需重启 pi 后生效。

<a id="all-settings"></a>
## 全部设置

<a id="model--thinking"></a>
### 模型与思考

| 设置 | 类型 | 默认值 | 说明 |
|---------|------|---------|-------------|
| `defaultProvider` | string | - | 启动 provider（例如 `"anthropic"`、`"openai"`；在 `/model` 中用 Ctrl+S 保存，或手动编辑） |
| `defaultModel` | string | - | 启动模型 ID（在 `/model` 中用 Ctrl+S 保存，或手动编辑） |
| `defaultThinkingLevel` | string | - | 启动思考级别（在 `/thinking` 中用 Ctrl+S 保存，或手动编辑）：`"off"`、`"minimal"`、`"low"`、`"medium"`、`"high"`、`"xhigh"`、`"max"` |
| `modelThinkingLevels` | object | - | 按模型的启动思考级别，键为 `"provider/modelId"`；在 `/settings` → Default thinking level per model 中配置，或手动编辑 |
| `hideThinkingBlock` | boolean | `false` | 在输出中隐藏思考块 |
| `showCacheMissNotices` | boolean | `false` | 对显著的 prompt-cache 未命中、压缩或分支摘要用量，以及丢弃 Anthropic 思考块等提供商恢复诊断，显示会话通知 |
| `thinkingBudgets` | object | - | 各思考级别的自定义 token 预算。Anthropic、Google 和 Bedrock 原生使用这些值。OpenAI 兼容模型在设置了 `compat.thinkingTokenBudgetField`（或 `supportsThinkingTokenBudget`）时使用。 |

<a id="thinkingbudgets"></a>
#### thinkingBudgets

```json
{
  "thinkingBudgets": {
    "minimal": 1024,
    "low": 4096,
    "medium": 10240,
    "high": 32768
  }
}
```

<a id="ui--display"></a>
### UI 与显示

| 设置 | 类型 | 默认值 | 说明 |
|---------|------|---------|-------------|
| `theme` | string | `"dark"` | 主题名（`"dark"`、`"light"` 或自定义） |
| `externalEditor` | string | `$VISUAL`，然后 `$EDITOR`，然后 `nano` | Ctrl+G 外部编辑器命令；优先于环境变量 |
| `quietStartup` | boolean | `false` | 隐藏启动头信息 |
| `defaultProjectTrust` | string | `"ask"` | 项目信任回退行为：`"ask"`、`"always"` 或 `"never"`。仅全局设置 |
| `collapseChangelog` | boolean | `false` | 更新后显示精简 changelog |
| `enableInstallTelemetry` | boolean | `true` | 发送匿名安装/更新 ping 和选定的提供商归因请求头。这不控制更新检查 |
| `enableAnalytics` | boolean | `false` | 选择加入分析数据共享。目前仅在实验性首次设置（`PI_EXPERIMENTAL=1`）期间询问 |
| `trackingId` | string | - | 分析跟踪标识符，在打开 `enableAnalytics` 时生成 |
| `doubleEscapeAction` | string | `"tree"` | 双击 Escape 的动作：`"tree"`、`"fork"` 或 `"none"` |
| `treeFilterMode` | string | `"default"` | `/tree` 的默认过滤：`"default"`、`"no-tools"`、`"user-only"`、`"labeled-only"`、`"all"` |
| `editorPaddingX` | number | `0` | 输入编辑器水平内边距（0-3） |
| `outputPad` | number | `1` | 用户消息、助手消息和思考的水平内边距（0 或 1） |
| `autocompleteMaxVisible` | number | `5` | 自动补全下拉中最多可见项数（3-20） |
| `showHardwareCursor` | boolean | `false` | 在 TUI 为 IME 定位光标时显示终端光标 |
| `tuiMode` | string | `"regular"` | 交互 TUI 模式：`"regular"` 或实验性 `"fullscreen"`。从 `/settings` 更改会立即生效；`--tui-mode` 在启动时覆盖此设置 |
| `fullscreenExitOutput` | string | `"transcript"` | 全屏退出输出：`"transcript"` 打印最终会话记录和恢复提示，`"resume-hint"` 恢复上一屏并只打印恢复提示。在常规 TUI 模式下无效 |
| `fullscreenScrollbar` | string | `"auto"` | 全屏会话滚动条：`"auto"` 在滚动时或指针悬停于最右列轨道时临时显示，`"always"` 预留该列并保持可见，`"hidden"` 隐藏。在常规 TUI 模式下无效 |
| `fullscreenCopyOnSelect` | boolean | `true` | 在全屏模式下自动复制选中的文本。禁用后，选区会保持高亮，按 `Ctrl+X` 可复制当前选区 |

对 VS Code，加入 `--wait`，以便编辑器退出后 pi 再继续：

```json
{
  "externalEditor": "code --wait"
}
```

<a id="telemetry-and-update-checks"></a>
### 遥测与更新检查

`enableInstallTelemetry` 控制发往 `https://pi.dev/api/report-install` 的匿名安装/更新 ping，以及 OpenRouter、NVIDIA NIM 和 Cloudflare 提供商请求中的 Pi 归因请求头。选择退出会同时禁用这两项。它不会禁用更新检查；Pi 仍可请求 `https://pi.dev/api/latest-version` 以查找最新版本。

设置 `PI_SKIP_VERSION_CHECK=1` 可禁用 Pi 版本更新检查。使用 `--offline` 或 `PI_OFFLINE=1` 可禁用此处描述的全部启动网络操作，包括更新检查、包更新检查以及安装/更新遥测。

<a id="network"></a>
### 网络

| 设置 | 类型 | 默认值 | 说明 |
|---------|------|---------|-------------|
| `httpProxy` | string | - | HTTP 代理 URL，作为 `HTTP_PROXY` 和 `HTTPS_PROXY` 应用。仅全局设置。 |

```json
{
  "httpProxy": "http://127.0.0.1:7890"
}
```

<a id="warnings"></a>
### 警告

| 设置 | 类型 | 默认值 | 说明 |
|---------|------|---------|-------------|
| `warnings.anthropicExtraUsage` | boolean | `true` | 当 Anthropic 订阅认证可能使用付费额外用量时显示警告 |

```json
{
  "warnings": {
    "anthropicExtraUsage": false
  }
}
```

<a id="compaction"></a>
### 压缩

| 设置 | 类型 | 默认值 | 说明 |
|---------|------|---------|-------------|
| `compaction.enabled` | boolean | `true` | 启用自动压缩 |
| `compaction.reserveTokens` | number | `16384` | 为 LLM 回复预留的 token |
| `compaction.keepRecentTokens` | number | `20000` | 保留的近期 token（不摘要） |

```json
{
  "compaction": {
    "enabled": true,
    "reserveTokens": 16384,
    "keepRecentTokens": 20000
  }
}
```

<a id="branch-summary"></a>
### 分支摘要

| 设置 | 类型 | 默认值 | 说明 |
|---------|------|---------|-------------|
| `branchSummary.reserveTokens` | number | `16384` | 选择分支历史时预留的 token；输出最多为 4096 tokens |
| `branchSummary.skipPrompt` | boolean | `false` | 在 `/tree` 导航时跳过“Summarize branch?”提示（默认不生成摘要） |

<a id="retry"></a>
### 重试

| 设置 | 类型 | 默认值 | 说明 |
|---------|------|---------|-------------|
| `retry.enabled` | boolean | `true` | 在瞬时错误时启用自动的 agent 级重试 |
| `retry.maxRetries` | number | `3` | agent 级最大重试次数 |
| `retry.baseDelayMs` | number | `2000` | agent 级指数退避的基础延迟（2s、4s、8s） |
| `retry.provider.timeoutMs` | number | SDK default | provider/SDK 请求超时（毫秒） |
| `retry.provider.maxRetries` | number | `0` | provider/SDK 重试次数 |
| `retry.provider.maxRetryDelayMs` | number | `60000` | 失败前允许的最长服务端请求延迟（60s） |

当 provider 请求的重试延迟超过 `retry.provider.maxRetryDelayMs` 时，请求会立即失败并给出明确错误，而不是静默等待。设为 `0` 可关闭该限制。

除非明确需要 provider 级重试，否则将 `retry.provider.maxRetries` 保持为 `0`。设为大于 `0` 可能导致 SDK/provider 重试在 Pi 看到错误之前处理超量限制错误，某些情况下会阻塞 agent，直到 provider 配额重置。

```json
{
  "retry": {
    "enabled": true,
    "maxRetries": 3,
    "baseDelayMs": 2000,
    "provider": {
      "timeoutMs": 3600000,
      "maxRetries": 0,
      "maxRetryDelayMs": 60000
    }
  }
}
```

<a id="message-delivery"></a>
### 消息投递

| 设置 | 类型 | 默认值 | 说明 |
|---------|------|---------|-------------|
| `steeringMode` | string | `"one-at-a-time"` | 引导消息的发送方式：`"all"` 或 `"one-at-a-time"` |
| `followUpMode` | string | `"one-at-a-time"` | 后续消息的发送方式：`"all"` 或 `"one-at-a-time"` |
| `transport` | string | `"auto"` | 支持多种传输时的首选传输：`"sse"`、`"websocket"`、`"websocket-cached"` 或 `"auto"` |
| `httpIdleTimeoutMs` | number | `300000` | HTTP 头/体空闲超时（毫秒），也被带有显式流空闲超时的 provider 使用。设为 `0` 可禁用。 |
| `websocketConnectTimeoutMs` | number | `15000` | 支持 WebSocket 传输的 provider 的 WebSocket 连接/打开握手超时（毫秒）。设为 `0` 可禁用。 |

<a id="terminal--images"></a>
### 终端与图片

| 设置 | 类型 | 默认值 | 说明 |
|---------|------|---------|-------------|
| `terminal.showImages` | boolean | `true` | 在终端中显示图片（若支持） |
| `terminal.imageWidthCells` | number | `60` | 行内图片的首选宽度（终端单元格） |
| `terminal.clearOnShrink` | boolean | `false` | 内容变短时清除空行（可能闪烁） |
| `terminal.hyperlinks` | boolean or `"auto"` | `"auto"` | 覆盖 OSC 8 超链接支持（高级，仅 JSON） |
| `terminal.images` | string or boolean | `"auto"` | 用 `"kitty"`、`"iterm2"`、`false` 或 `"auto"` 覆盖图片协议支持（高级，仅 JSON） |
| `terminal.trueColor` | boolean or `"auto"` | `"auto"` | 覆盖 truecolor 支持（高级，仅 JSON） |
| `images.autoResize` | boolean | `true` | 将图片缩放到最大 2000x2000。适用于 `@file` 附件、`read`，以及工具返回的图片 |
| `images.blockImages` | boolean | `false` | 阻止向 LLM 发送任何图片 |

<a id="shell"></a>
### Shell

| 设置 | 类型 | 默认值 | 说明 |
|---------|------|---------|-------------|
| `shellPath` | string | - | 自定义 shell 路径；支持以 `~` 表示主目录 |
| `shellCommandPrefix` | string | - | 每条 bash 命令的前缀（例如 `"shopt -s expand_aliases"`） |
| `npmCommand` | string[] | - | 用于 npm 包查找/安装操作的命令 argv（例如 `["mise", "exec", "node@20", "--", "npm"]`） |

```json
{
  "npmCommand": ["mise", "exec", "node@20", "--", "npm"]
}
```

`npmCommand` 用于全部 npm 包管理操作，包括安装、卸载，以及 git 包内的依赖安装。用户范围的 npm 包安装到 `~/.pi/agent/npm/`；项目范围的 npm 包安装到 `.pi/npm/`。使用与进程启动完全一致的 argv 形式。配置了 `npmCommand` 时，git 包依赖安装使用普通 `install`，以避免包装器或替代包管理器中的 npm 专用标志。

<a id="tools"></a>
### 工具

| 设置 | 类型 | 默认值 | 说明 |
|---------|------|---------|-------------|
| `defaultTools` | string[] | - | 启动时启用的内置工具。省略时，Pi 使用其标准默认值 |

`defaultTools` 选择启动时启用的内置工具。扩展和 SDK 自定义工具仍保持启用。可用内置工具为 `read`、`bash`、`edit`、`write`、`grep`、`find` 和 `ls`：

```json
{
  "defaultTools": ["bash", "edit", "write"]
}
```

空数组表示启动时没有内置工具，但保留扩展和 SDK 自定义工具。`--tools` 用严格白名单替换该行为（适用于全部工具），`--no-tools` 禁用全部工具，`--no-builtin-tools` 禁用内置默认工具。`--exclude-tools` 过滤最终列表。项目级 `defaultTools` 数组会替换全局数组。

<a id="sessions"></a>
### 会话

| 设置 | 类型 | 默认值 | 说明 |
|---------|------|---------|-------------|
| `sessionDir` | string | - | 会话文件存储目录。接受绝对或相对路径，以及 `~`。 |

```json
{ "sessionDir": ".pi/sessions" }
```

当多个来源指定会话目录时，优先级为 `--session-dir`、`PI_CODING_AGENT_SESSION_DIR`，然后是 settings.json 中的 `sessionDir`。

<a id="model-cycling"></a>
### 模型循环

| 设置 | 类型 | 默认值 | 说明 |
|---------|------|---------|-------------|
| `enabledModels` | string[] | - | 用于 Ctrl+P 循环的模型模式（格式与 `--models` CLI 标志相同） |

```json
{
  "enabledModels": ["claude-*", "gpt-4o", "gemini-2*"]
}
```

<a id="markdown"></a>
### Markdown

| 设置 | 类型 | 默认值 | 说明 |
|---------|------|---------|-------------|
| `markdown.codeBlockIndent` | string | `"  "` | 代码块缩进 |
| `markdown.mermaid` | string | `"streaming"` | Mermaid 渲染模式：`"off"`、`"final"` 或 `"streaming"` |

<a id="resources"></a>
### 资源

这些设置定义从何处加载扩展、skills、prompts 和主题。

`~/.pi/agent/settings.json` 中的路径相对于 `~/.pi/agent` 解析。`.pi/settings.json` 中的路径相对于 `.pi` 解析。支持绝对路径和 `~`。

| 设置 | 类型 | 默认值 | 说明 |
|---------|------|---------|-------------|
| `packages` | array | `[]` | 从中加载资源的 npm/git 包 |
| `extensions` | string[] | `[]` | 本地扩展文件路径或目录 |
| `skills` | string[] | `[]` | 本地 skill 文件路径或目录 |
| `prompts` | string[] | `[]` | 本地 prompt 模板路径或目录 |
| `themes` | string[] | `[]` | 本地主题文件路径或目录 |
| `enableSkillCommands` | boolean | `true` | 将 skills 注册为 `/skill:name` 命令 |

数组支持 glob 模式和排除。使用 `!pattern` 排除。使用 `+path` 强制包含精确路径，使用 `-path` 强制排除精确路径。

<a id="packages"></a>
#### packages

字符串形式会加载包中的全部资源：

```json
{
  "packages": ["pi-skills", "@org/my-extension"]
}
```

对象形式可过滤要加载的资源：

```json
{
  "packages": [
    {
      "source": "pi-skills",
      "skills": ["brave-search", "transcribe"],
      "extensions": []
    }
  ]
}
```

包管理细节见 [packages.md](packages.md)。

<a id="example"></a>
## 示例

```json
{
  "defaultProvider": "anthropic",
  "defaultModel": "claude-sonnet-4-20250514",
  "defaultThinkingLevel": "medium",
  "modelThinkingLevels": {
    "anthropic/claude-sonnet-4-20250514": "high"
  },
  "theme": "dark",
  "compaction": {
    "enabled": true,
    "reserveTokens": 16384,
    "keepRecentTokens": 20000
  },
  "retry": {
    "enabled": true,
    "maxRetries": 3
  },
  "enabledModels": ["claude-*", "gpt-4o"],
  "warnings": {
    "anthropicExtraUsage": true
  },
  "packages": ["pi-skills"]
}
```

<a id="project-overrides"></a>
## 项目覆盖

项目设置（`.pi/settings.json`）覆盖全局设置。嵌套对象会合并：

```json
// ~/.pi/agent/settings.json（全局）
{
  "theme": "dark",
  "compaction": { "enabled": true, "reserveTokens": 16384 }
}

// .pi/settings.json（项目）
{
  "compaction": { "reserveTokens": 8192 }
}

// 结果
{
  "theme": "dark",
  "compaction": { "enabled": true, "reserveTokens": 8192 }
}
```
