<a id="environment-variables"></a>
# 环境变量

Pi 以三种方式使用环境变量：

- 如 `PI_OFFLINE` 这类变量用于配置 Pi 进程本身。
- Pi 会设置进程标记，便于子进程识别启动方是 Pi。
- LLM 可调用的 shell 工具所运行的命令会收到描述当前会话的 `PI_*` 变量。

提供商 API key 变量另见 [Providers](providers.md#environment-variables-or-auth-file)。

<a id="process-marker"></a>
## 进程标记

CLI 与 RPC 入口会设置两个进程标记：

- `AI_AGENT=pi` 是通用标记，供工具识别启动该进程的代理是 Pi。
- `PI_CODING_AGENT=true` 是 Pi 专用标记，供子进程检测自己运行在 Pi 内。

子进程会继承这两个标记。它们与会话无关；通过 SDK 嵌入 Pi 时不会自动设置。

<a id="shell-tool-session-environment"></a>
## Shell 工具会话环境

`bash` 工具运行的命令会收到当前 Pi 会话状态：

| 变量 | 说明 |
|----------|-------------|
| `PI_SESSION_ID` | 当前会话 ID |
| `PI_SESSION_FILE` | 当前会话 JSONL 文件的绝对路径；临时会话不设置 |
| `PI_PROVIDER` | 当前选中的模型提供商 |
| `PI_MODEL` | 当前选中的模型 ID |
| `PI_REASONING_LEVEL` | 当前有效推理级别：`off`、`minimal`、`low`、`medium`、`high`、`xhigh` 或 `max` |

这些值在每条命令启动时解析。因此切换模型或更改推理级别会影响下一条 shell 命令，无需重启 Pi。`PI_PROVIDER` 和 `PI_MODEL` 标识的是当前选中的 Pi 模型，而不是路由器内部可能另选的上游模型。

被问及当前运行的模型或提供商时，应检查这些变量，而不是从系统提示推断：

```bash
printf '%s/%s\n' "$PI_PROVIDER" "$PI_MODEL"
printf 'reasoning=%s session=%s\n' "$PI_REASONING_LEVEL" "$PI_SESSION_ID"
```

会话持久时可以直接查看会话文件：

```bash
if [ -n "$PI_SESSION_FILE" ]; then
  tail -n 1 "$PI_SESSION_FILE"
fi
```

这些变量会注入到 LLM 可调用的 `bash` 工具中。不会注入到用户输入的 `!` 或 `!!` 命令。

<a id="custom-shell-tools"></a>
### 自定义 Shell 工具

用 `createBashTool()` 创建并注册到 Pi 的工具默认会暴露会话环境。注入发生在 `spawnHook` 之前，因此 hook 会在 `ctx.env` 中收到这些变量：

```typescript
const bashTool = createBashTool(cwd, {
  spawnHook: (ctx) => ({
    ...ctx,
    env: { ...ctx.env, CI: "1" },
  }),
});
```

可在不影响 spawn hook 的情况下关闭会话元数据注入：

```typescript
const bashTool = createBashTool(cwd, {
  exposeSessionEnvironment: false,
  spawnHook: (ctx) => ctx,
});
```

关闭后，Pi 会清除这些变量的继承值，避免嵌套的 Pi 进程暴露过期的父会话元数据。

<a id="pi-process-configuration"></a>
## Pi 进程配置

以下变量由 Pi 自身读取：

| 变量 | 说明 |
|----------|-------------|
| `PI_CODING_AGENT_DIR` | 覆盖配置目录；默认为 `~/.pi/agent` |
| `PI_CODING_AGENT_SESSION_DIR` | 覆盖会话存储目录；会被 `--session-dir` 覆盖 |
| `PI_PACKAGE_DIR` | 覆盖软件包目录，适用于 Nix/Guix store 路径 |
| `PI_OFFLINE` | 禁用启动时的网络操作，包括更新检查、软件包更新，以及安装/更新遥测 |
| `PI_SKIP_VERSION_CHECK` | 禁用向 `pi.dev` 请求最新版本 |
| `PI_TELEMETRY` | 覆盖安装/更新遥测与提供商归因头：`1`/`true`/`yes` 或 `0`/`false`/`no` |
| `PI_CACHE_RETENTION` | 设为 `long` 可在支持的提供商上延长 prompt 缓存 |
| `PI_SHARE_VIEWER_URL` | 覆盖 `/share` 使用的基础 URL |
| `PI_HARDWARE_CURSOR` | 设为 `1` 显示硬件光标；见 [终端设置](terminal-setup.md) |
| `PI_HYPERLINKS` | 用 `1`、`0` 或 `auto` 覆盖 OSC 8 超链接检测 |
| `PI_IMAGE_PROTOCOL` | 用 `kitty`、`iterm2`、`none` 或 `auto` 覆盖行内图片检测 |
| `PI_TRUE_COLOR` | 用 `1`、`0` 或 `auto` 覆盖真彩色检测 |
| `PI_TUI_ESC_TIMEOUT` | 单独收到 ESC 后等待多久才视为 Escape，单位毫秒；SSH 下默认 `100`，否则 `10`。若 Alt 键输入被误判为 Escape，可增大该值 |
| `VISUAL`、`EDITOR` | 未设置 `externalEditor` 时的外部编辑器回退 |
| `HTTP_PROXY`、`HTTPS_PROXY` | 代理出站 HTTP 请求 |

`ANTHROPIC_API_KEY`、`OPENAI_API_KEY` 等提供商凭据以及云提供商配置见 [Providers](providers.md#environment-variables-or-auth-file)。
