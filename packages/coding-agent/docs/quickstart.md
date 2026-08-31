<a id="quickstart"></a>
# 快速开始

本页帮助你从安装走到一次可用的首次 pi 会话。

<a id="install"></a>
## 安装

Pi 以 npm 包分发：

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
```

`--ignore-scripts` 会在安装时禁用依赖的生命周期脚本。普通 npm 安装不需要安装脚本。

<a id="uninstall"></a>
### 卸载

使用当初安装 pi 的包管理器。curl 安装脚本使用全局 npm，因此 curl 与 npm 安装都用 npm 卸载：

```bash
# curl 安装脚本或 npm install -g
npm uninstall -g @earendil-works/pi-coding-agent

# pnpm
pnpm remove -g @earendil-works/pi-coding-agent

# Yarn
yarn global remove @earendil-works/pi-coding-agent

# Bun
bun uninstall -g @earendil-works/pi-coding-agent
```

卸载 pi 会保留 `~/.pi/agent/` 中的设置、凭据、会话和已安装的 pi 软件包。

然后在希望它处理的项目目录中启动 pi：

```bash
cd /path/to/project
pi
```

<a id="authenticate"></a>
## 认证

Pi 可通过 `/login` 使用订阅提供商，或通过环境变量或 auth 文件使用 API-key 提供商。

<a id="option-1-subscription-login"></a>
### 方式 1：订阅登录

启动 pi 并运行：

```text
/login
```

然后选择提供商。内置订阅登录包括 Claude Pro/Max、ChatGPT Plus/Pro（Codex）和 GitHub Copilot。

<a id="option-2-api-key"></a>
### 方式 2：API key

启动 pi 前设置 API key：

```bash
export ANTHROPIC_API_KEY=sk-ant-...
pi
```

也可以运行 `/login` 并选择 API-key 提供商，将 key 存入 `~/.pi/agent/auth.json`。

全部支持的提供商、环境变量和云提供商设置见 [Providers](providers.md)。

<a id="first-session"></a>
## 首次会话

pi 启动后，输入请求并按 Enter：

```text
Summarize this repository and tell me how to run its checks.
```

默认情况下，pi 向模型提供四个工具：

- `read` - 读取文件
- `write` - 创建或覆盖文件
- `edit` - 修补文件
- `bash` - 运行 shell 命令

其他内置只读工具（`grep`、`find`、`ls`）可通过工具选项使用。Pi 在当前工作目录中运行，并可修改其中的文件。若需要方便回滚，请使用 git 或其他检查点工作流。

<a id="give-pi-project-instructions"></a>
## 给 pi 项目说明

Pi 在启动时加载上下文文件。添加 `AGENTS.md` 以说明如何在项目中工作：

```markdown
# Project Instructions

- Run `npm run check` after code changes.
- Do not run production migrations locally.
- Keep responses concise.
```

Pi 会加载：

- `~/.pi/agent/AGENTS.md` 作为全局说明
- 父目录和当前目录中的 `AGENTS.md` 或 `CLAUDE.md`

若某目录包含 `AGENTS.override.md`，Pi 会加载它，而不是该目录中的 `AGENTS.md` 或 `CLAUDE.md`。

更改上下文文件后重启 pi，或运行 `/reload`。

<a id="common-things-to-try"></a>
## 常见用法

<a id="reference-files"></a>
### 引用文件

在编辑器中输入 `@` 可模糊搜索文件，或在命令行传入文件：

```bash
pi @README.md "Summarize this"
pi @src/app.ts @src/app.test.ts "Review these together"
```

可用 Ctrl+V 粘贴图片或文本；在支持的终端中也可以拖入图片。

<a id="run-shell-commands"></a>
### 运行 shell 命令

在交互模式中：

```text
!npm run lint
```

命令输出会发送给模型。使用 `!!command` 运行命令但不把输出加入模型上下文。

<a id="switch-models"></a>
### 切换模型

使用 `/model` 或 Ctrl+L 为当前会话选择模型。在模型选择器中按 Ctrl+S 可将高亮模型保存为启动默认。使用 `/thinking` 为当前会话选择思考级别，或在该选择器中按 Ctrl+S 保存启动默认思考级别。使用 Shift+Tab 循环切换思考级别。使用 Ctrl+P / Shift+Ctrl+P 循环切换范围内的模型。

<a id="continue-later"></a>
### 稍后继续

会话会自动保存：

```bash
pi -c                  # 继续最近的会话
pi -r                  # 浏览以往会话
pi --name "my task"    # 启动时设置会话显示名称
pi --session <path|id> # 打开指定会话
```

在 pi 内使用 `/resume`、`/new`、`/tree`、`/fork` 和 `/clone` 管理会话。

<a id="non-interactive-mode"></a>
### 非交互模式

一次性提示：

```bash
pi -p "Summarize this codebase"
cat README.md | pi -p "Summarize this text"
pi -p @screenshot.png "What's in this image?"
```

JSON 事件输出用 `--mode json`，进程集成用 `--mode rpc`。

<a id="next-steps"></a>
## 后续步骤

- [使用 Pi](usage.md) - 交互模式、斜杠命令、会话、上下文文件和 CLI 参考。
- [Providers](providers.md) - 认证与模型设置。
- [设置](settings.md) - 全局与项目配置。
- [按键绑定](keybindings.md) - 快捷键与自定义。
- [Pi 软件包](packages.md) - 安装共享扩展、技能、提示和主题。

平台说明：[Termux](termux.md)、[tmux](tmux.md)、[终端设置](terminal-setup.md)、[Shell 别名](shell-aliases.md)。
