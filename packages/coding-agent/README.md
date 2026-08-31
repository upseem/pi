<p align="center">
  <a href="https://pi.dev">
    <img alt="pi logo" src="https://pi.dev/logo-auto.svg" width="128">
  </a>
</p>
<p align="center">
  <a href="https://discord.com/invite/3cU7Bz4UPx"><img alt="Discord" src="https://img.shields.io/badge/discord-community-5865F2?style=flat-square&logo=discord&logoColor=white" /></a>
  <a href="https://www.npmjs.com/package/@earendil-works/pi-coding-agent"><img alt="npm" src="https://img.shields.io/npm/v/@earendil-works/pi-coding-agent?style=flat-square" /></a>
</p>

> 新贡献者提交的 Issue 和 PR 默认会被自动关闭。维护者每天会复查这些自动关闭的条目。详见 [CONTRIBUTING.md](../../CONTRIBUTING.md)。

---

Pi 是一套精简的终端编码框架。让 pi 适配你的工作流，而不是反过来，无需 fork 或修改 pi 内部实现。用 TypeScript [扩展](#extensions)、[Skills](#skills)、[提示模板](#prompt-templates) 和 [主题](#themes) 扩展它。把扩展、skills、提示模板和主题放进 [Pi 包](#pi-packages)，通过 npm 或 git 分享。

Pi 自带强大的默认能力，但刻意不包含子代理、plan mode 等功能。你可以让 pi 按你的需求构建这些能力，或安装符合你工作流的第三方 pi 包。

Pi 有四种运行模式：交互、打印或 JSON、用于进程集成的 RPC，以及用于嵌入自有应用的 SDK。

<a id="share-your-oss-coding-agent-sessions"></a>
## 分享你的开源编码代理会话

如果你用 pi 做开源工作，请分享你的编码代理会话。

公开的开源会话数据能用真实开发工作流改进模型、提示、工具和评估。

完整说明见 [这篇 X 帖](https://x.com/badlogicgames/status/2037811643774652911)。

发布会话请用 [`badlogic/pi-share-hf`](https://github.com/badlogic/pi-share-hf)。设置步骤见它的 README.md。你只需要一个 Hugging Face 账号、Hugging Face CLI，以及 `pi-share-hf`。

也可以看 [这个视频](https://x.com/badlogicgames/status/2041151967695634619)，里面演示了如何发布我的 `pi-mono` 会话。

我自己会定期把 `pi-mono` 工作会话发布到这里：

- [badlogicgames/pi-mono on Hugging Face](https://huggingface.co/datasets/badlogicgames/pi-mono)

<a id="table-of-contents"></a>
## 目录

- [快速开始](#quick-start)
- [提供商与模型](#providers--models)
- [交互模式](#interactive-mode)
  - [编辑器](#editor)
  - [命令](#commands)
  - [快捷键](#keyboard-shortcuts)
  - [消息队列](#message-queue)
- [会话](#sessions)
  - [分支](#branching)
  - [压缩](#compaction)
- [设置](#settings)
- [上下文文件](#context-files)
- [自定义](#customization)
  - [提示模板](#prompt-templates)
  - [Skills](#skills)
  - [扩展](#extensions)
  - [主题](#themes)
  - [Pi 包](#pi-packages)
- [编程式使用](#programmatic-usage)
- [理念](#philosophy)
- [CLI 参考](#cli-reference)

---

<a id="quick-start"></a>
## 快速开始

```bash
npm install -g --ignore-scripts @earendil-works/pi-coding-agent
```

`--ignore-scripts` 会在安装时禁用依赖的生命周期脚本。普通 npm 安装不需要安装脚本。

安装器备选：

```bash
curl -fsSL https://pi.dev/install.sh | sh
```

用 API key 认证：

```bash
export ANTHROPIC_API_KEY=sk-ant-...
pi
```

或使用已有订阅：

```bash
pi
/login  # 然后选择提供商
```

然后直接和 pi 对话。默认情况下，pi 给模型四个工具：`read`、`write`、`edit` 和 `bash`。模型用它们完成你的请求。通过 [skills](#skills)、[提示模板](#prompt-templates)、[扩展](#extensions) 或 [pi 包](#pi-packages) 增加能力。

**平台说明：** [Termux (Android)](docs/termux.md) | [tmux](docs/tmux.md) | [终端设置](docs/terminal-setup.md) | [Shell 别名](docs/shell-aliases.md)

---

<a id="providers--models"></a>
## 提供商与模型

对每个内置提供商，pi 维护一份具备工具能力的模型列表。已配置的提供商目录会自动刷新；运行 `pi update --models` 可立即强制刷新。通过订阅（`/login`）或 API key 认证后，用 `/model`（或 Ctrl+L）从该提供商选择任意模型。在模型选择器中按 Ctrl+S，可将高亮模型保存为启动默认。

**订阅：**
- Anthropic Claude Pro/Max
- OpenAI ChatGPT Plus/Pro (Codex)
- GitHub Copilot

**API key：**
- Anthropic
- Ant Ling
- OpenAI
- Azure OpenAI
- DeepSeek
- NVIDIA NIM
- Google Gemini
- Google Vertex
- Amazon Bedrock
- Mistral
- Groq
- Cerebras
- Cloudflare AI Gateway
- Cloudflare Workers AI
- xAI
- OpenRouter
- Vercel AI Gateway
- ZAI Coding Plan（全球）
- ZAI Coding Plan（中国）
- OpenCode Zen
- OpenCode Go
- Hugging Face
- Fireworks
- Together AI
- Baseten
- Kimi For Coding
- MiniMax
- Xiaomi MiMo
- Xiaomi MiMo Token Plan（中国）
- Xiaomi MiMo Token Plan（阿姆斯特丹）
- Xiaomi MiMo Token Plan（新加坡）

Pi 也支持 llama.cpp 路由服务器。用 `/login llama.cpp` 配置，用 `/llama` 管理下载和已加载模型，再用 `/model` 选择已加载的模型。设置与用法见 [docs/llama-cpp.md](docs/llama-cpp.md)。

其他提供商的设置说明见 [docs/providers.md](docs/providers.md)。

**自定义提供商与模型：** 若提供商使用受支持的 API（OpenAI、Anthropic、Google），可通过 `~/.pi/agent/models.json` 添加。自定义 API 或 OAuth 请用扩展。见 [docs/models.md](docs/models.md) 和 [docs/custom-provider.md](docs/custom-provider.md)。

---

<a id="interactive-mode"></a>
## 交互模式

<p align="center"><img src="docs/images/interactive-mode.png" alt="Interactive Mode" width="600"></p>

界面从上到下：

- **启动头** - 显示快捷键（`/hotkeys` 查看全部）、已加载的 AGENTS.md 文件、提示模板、skills 和扩展
- **消息** - 你的消息、助手回复、工具调用和结果、通知、错误，以及扩展 UI
- **编辑器** - 输入位置；边框颜色表示思考级别
- **页脚** - 工作目录、会话名、总 token/缓存用量（`↑` 输入、`↓` 输出、`R` 缓存读、`W` 缓存写、`CH` 最近缓存命中率）、费用、上下文用量、当前模型。总计包含助手回复、工具上报的用量，以及摘要生成。

编辑器可被其他 UI 临时替换，例如内置 `/settings`，或扩展提供的自定义 UI（如让用户以结构化格式回答模型问题的问答工具）。[扩展](#extensions) 也可以替换编辑器、在其上方/下方添加控件、状态行、自定义页脚或覆盖层。

<a id="editor"></a>
### 编辑器

| 功能 | 操作 |
|---------|-----|
| 文件引用 | 输入 `@` 对项目文件做模糊搜索 |
| 路径补全 | 按 Tab 补全路径 |
| 多行 | Shift+Enter（Windows Terminal 上为 Ctrl+Enter） |
| 外部编辑器 | Ctrl+G 打开 `externalEditor`、`$VISUAL`、`$EDITOR`，Windows 上为 Notepad，其他平台为 `nano` |
| 剪贴板 | Ctrl+V 粘贴图片或文本（Windows 上为 Alt+V），或把图片拖到终端 |
| Bash 命令 | `!command` 运行并把输出发给 LLM，`!!command` 运行但不发送 |

删除单词、撤销等标准编辑快捷键见 [docs/keybindings.md](docs/keybindings.md)。

<a id="commands"></a>
### 命令

在编辑器中输入 `/` 触发命令。[扩展](#extensions) 可以注册自定义命令，[skills](#skills) 以 `/skill:name` 提供，[提示模板](#prompt-templates) 通过 `/templatename` 展开。

| 命令 | 说明 |
|---------|-------------|
| `/login`、`/logout` | 管理提供商凭据 |
| [`/llama`](docs/llama-cpp.md) | 下载、加载和卸载 llama.cpp 路由模型 |
| `/model` | 切换模型；选择器中按 Ctrl+S 保存为启动默认 |
| `/thinking` | 切换思考级别；选择器中按 Ctrl+S 保存为启动默认 |
| `/scoped-models` | 启用/禁用用于 Ctrl+P 循环的模型 |
| `/settings` | 主题、消息投递、传输和其他偏好 |
| `/resume` | 从以往会话中选择 |
| `/new` | 开始新会话 |
| `/name <name>` | 设置会话显示名 |
| `/session` | 显示会话信息（文件、ID、消息、token、费用） |
| `/tree` | 跳到会话中的任意位置并从那里继续 |
| `/trust` | 保存项目信任决定，供之后的会话使用（需重启） |
| `/fork` | 从之前的一条用户消息创建新会话 |
| `/clone` | 把当前活动分支复制到新会话 |
| `/compact [prompt]` | 手动压缩上下文，可选自定义说明 |
| `/copy` | 把上一条助手消息复制到剪贴板 |
| `/export [file]` | 将会话导出为 HTML 或 JSONL 文件 |
| `/import <file>` | 从 JSONL 文件导入并恢复会话 |
| `/share` | 上传为私有 GitHub gist，并提供可分享的 HTML 链接 |
| `/reload` | 重新加载快捷键、扩展、skills、提示、主题和上下文文件 |
| `/hotkeys` | 显示全部键盘快捷键 |
| `/changelog` | 显示版本历史 |
| `/quit` | 退出 pi |

<a id="keyboard-shortcuts"></a>
### 快捷键

完整列表见 `/hotkeys`。通过 `~/.pi/agent/keybindings.json` 自定义。见 [docs/keybindings.md](docs/keybindings.md)。

**常用：**

| 按键 | 操作 |
|-----|--------|
| Ctrl+C | 清空编辑器 |
| Ctrl+C 两次 | 退出 |
| Escape | 取消/中止 |
| Escape 两次 | 打开 `/tree` |
| Ctrl+L | 打开模型选择器 |
| Ctrl+P / Shift+Ctrl+P | 向前/向后循环已启用的模型 |
| Shift+Tab | 循环思考级别 |
| Ctrl+O | 折叠/展开工具输出 |
| Ctrl+T | 折叠/展开思考块 |
| Ctrl+X | 复制上一条助手消息 |

<a id="message-queue"></a>
### 消息队列

代理仍在工作时也可以提交消息：

- **Enter** 排队一条*引导*消息，在当前助手回合执行完其工具调用后投递
- **Alt+Enter** 排队一条*后续*消息，仅在代理完成全部工作后投递
- **Escape** 中止并把已排队消息恢复到编辑器
- **Alt+Up** 把已排队消息取回编辑器

在 Windows Terminal 上，`Alt+Enter` 默认是全屏。按 [docs/terminal-setup.md](docs/terminal-setup.md) 重新映射，以便 pi 能收到后续消息快捷键。

在 [设置](docs/settings.md) 中配置投递：`steeringMode` 和 `followUpMode` 可以是 `"one-at-a-time"`（默认，等待回复）或 `"all"`（一次投递全部排队消息）。`transport` 为支持多种传输的提供商选择传输偏好（`"sse"`、`"websocket"` 或 `"auto"`）。

---

<a id="sessions"></a>
## 会话

会话以带树结构的 JSONL 文件存储。每条记录都有 `id` 和 `parentId`，可在原文件内分支而无需创建新文件。文件格式见 [docs/session-format.md](docs/session-format.md)。

<a id="management"></a>
### 管理

会话自动保存到 `~/.pi/agent/sessions/`，按工作目录组织。

```bash
pi -c                  # 继续最近一次会话
pi -r                  # 浏览并选择历史会话
pi --no-session        # 临时模式（不保存）
pi --name "my task"    # 启动时设置会话显示名
pi --session <path|id> # 使用指定会话文件或 ID
pi --fork <path|id>    # 将会话文件或 ID fork 到新会话
```

在交互模式中用 `/session` 查看当前会话 ID，然后再用 `--session <id>` 或 `--fork <id>` 复用它。

<a id="branching"></a>
### 分支

**`/tree`** - 在原文件内导航会话树。选择任意先前位置，从那里继续，并在分支之间切换。全部历史保存在单个文件中。

<p align="center"><img src="docs/images/tree-view.png" alt="Tree View" width="600"></p>

- 输入文字搜索；用 Ctrl+←/Ctrl+→ 或 Alt+←/Alt+→ 折叠/展开并在分支间跳转；用 ←/→ 翻页
- 筛选模式（Ctrl+O）：default → no-tools → user-only → labeled-only → all
- 按 Ctrl+X 复制选中的消息
- 按 Shift+L 将条目标记为书签，按 Shift+T 切换标签时间戳

**`/fork`** - 从活动分支上之前的一条用户消息创建新会话文件。打开选择器，复制到该点为止的活动路径，并把所选提示放入编辑器以便修改。

**`/clone`** - 把当前活动分支复制到新会话文件，位置为当前点。新会话保留完整的活动路径历史，并以空编辑器打开。

**`--fork <path|id>`** - 直接从 CLI 按会话文件或部分会话 UUID fork 已有会话。这会把完整源会话复制到当前项目的新会话文件中。

<a id="compaction"></a>
### 压缩

长会话会耗尽上下文窗口。压缩会摘要较旧的消息，同时保留近期消息。

**手动：** `/compact` 或 `/compact <custom instructions>`

**自动：** 默认启用。在上下文溢出时触发（恢复并重试），或在接近上限时主动触发。通过 `/settings` 或 `settings.json` 配置。

压缩是有损的。完整历史仍在 JSONL 文件中；用 `/tree` 回看。通过 [扩展](#extensions) 自定义压缩行为。内部机制见 [docs/compaction.md](docs/compaction.md)。

---

<a id="settings"></a>
## 设置

用 `/settings` 修改常用选项，或直接编辑 JSON 文件：

| 位置 | 作用域 |
|----------|-------|
| `~/.pi/agent/settings.json` | 全局（所有项目） |
| `.pi/settings.json` | 项目（覆盖全局） |

全部选项见 [docs/settings.md](docs/settings.md)。

<a id="project-trust"></a>
### 项目信任

交互式启动时，若项目文件夹包含项目本地设置、资源或项目 `.agents/skills`，且 `~/.pi/agent/trust.json` 中对该文件夹或其父文件夹没有已保存的决定，pi 会先询问是否信任。信任项目后，pi 可加载 `.pi/settings.json` 和 `.pi` 资源、安装缺失的项目包，并执行项目扩展。

在信任决定之前，pi 只加载上下文文件、用户/全局扩展，以及 CLI `-e` 扩展，以便它们能处理 `project_trust` 事件。项目本地扩展、由项目包管理的扩展，以及项目设置，只在项目受信任后加载。切换到另一个 cwd 的会话，且该会话的信任尚未在当前进程中决议时，同样适用此拆分。

非交互模式（`-p`、`--mode json` 和 `--mode rpc`）不会显示信任提示。若没有适用的已保存信任决定，它们使用全局设置中的 `defaultProjectTrust`：`ask`（默认）和 `never` 会忽略这些项目资源，`always` 则信任它们。传入 `--approve`/`-a` 或 `--no-approve`/`-na` 可覆盖本次运行的项目信任。

若没有扩展或已保存决定适用，`defaultProjectTrust` 控制回退行为。在 `~/.pi/agent/settings.json` 中设为 `"ask"`、`"always"` 或 `"never"`，或通过 `/settings` 修改。

`pi config` 和包相关命令使用相同的项目信任流程，但 `pi update` 从不提示。传入 `--approve` 可在单次命令中信任项目本地设置，或传入 `--no-approve` 忽略它们。

在交互模式中使用 `/trust` 可为后续会话保存项目信任决定，包括对直接父文件夹的信任。它只写入 `~/.pi/agent/trust.json`；当前会话不会重新加载，因此需重启 pi 后生效。

<a id="telemetry-and-update-checks"></a>
### 遥测与更新检查

Pi 有两项独立的启动功能：

- **更新检查：** 请求 `https://pi.dev/api/latest-version`，检查是否有更新的 Pi 版本。用 `PI_SKIP_VERSION_CHECK=1` 禁用。禁用更新检查只关闭这项检查。
- **安装/更新遥测：** 在首次安装或检测到 changelog 更新后，向 `https://pi.dev/api/report-install` 发送匿名版本 ping。该设置也控制发往 OpenRouter、Cloudflare 和直接 NVIDIA NIM 请求的可选提供商归因头。在 `settings.json` 中将 `enableInstallTelemetry` 设为 `false`，或设置 `PI_TELEMETRY=0` 即可退出。这不会禁用更新检查；除非禁用了更新检查或启用了离线模式，Pi 仍可能联系 `pi.dev` 获取最新版本。

使用 `--offline` 或 `PI_OFFLINE=1` 可禁用此处描述的全部启动网络操作，包括更新检查、包更新检查以及安装/更新遥测。

---

<a id="context-files"></a>
## 上下文文件

Pi 在启动时从以下位置加载 `AGENTS.md`（或 `CLAUDE.md`）：
- `~/.pi/agent/AGENTS.md`（全局）
- 父目录（从 cwd 向上遍历）
- 当前目录

若某目录包含 `AGENTS.override.md`，Pi 会加载它，而不是该目录中的 `AGENTS.md` 或 `CLAUDE.md`。其他目录的上下文文件仍会拼接。

用于项目说明（`AGENTS.md`/`CLAUDE.md`）、约定、常用命令。所有匹配文件都会拼接。

用 `--no-context-files`（或 `-nc`）禁用上下文文件加载。

<a id="system-prompt"></a>
### 系统提示

用 `.pi/SYSTEM.md`（项目）或 `~/.pi/agent/SYSTEM.md`（全局）替换默认系统提示。用 `APPEND_SYSTEM.md` 追加而不替换。

---

<a id="customization"></a>
## 自定义

<a id="prompt-templates"></a>
### 提示模板

可复用的 Markdown 提示。输入 `/name` 展开。

```markdown
<!-- ~/.pi/agent/prompts/review.md -->
Review this code for bugs, security issues, and performance problems.
Focus on: {{focus}}
```

放在 `~/.pi/agent/prompts/`、`.pi/prompts/`，或 [pi 包](#pi-packages) 中以便分享。见 [docs/prompt-templates.md](docs/prompt-templates.md)。

<a id="skills"></a>
### Skills

遵循 [Agent Skills 标准](https://agentskills.io) 的按需能力包。通过 `/skill:name` 调用，或让代理自动加载。

```markdown
<!-- ~/.pi/agent/skills/my-skill/SKILL.md -->
# My Skill
Use this skill when the user asks about X.

## Steps
1. Do this
2. Then that
```

放在 `~/.pi/agent/skills/`、`~/.agents/skills/`、`.pi/skills/` 或 `.agents/skills/`（从 `cwd` 向上遍历父目录），或 [pi 包](#pi-packages) 中以便分享。见 [docs/skills.md](docs/skills.md)。

<a id="extensions"></a>
### 扩展

<p align="center"><img src="docs/images/doom-extension.png" alt="Doom Extension" width="600"></p>

用 TypeScript 模块为 pi 添加自定义工具、命令、键盘快捷键、事件处理器和 UI 组件。

```typescript
export default function (pi: ExtensionAPI) {
  pi.registerTool({ name: "deploy", ... });
  pi.registerCommand("stats", { ... });
  pi.on("tool_call", async (event, ctx) => { ... });
}
```

默认导出也可以是 `async`。pi 会在启动继续前等待异步扩展工厂，适合一次性初始化，例如在调用 `pi.registerProvider()` 之前拉取远程模型列表。

**可以做什么：**
- 自定义工具（或完全替换内置工具）
- 子代理和 plan mode
- 自定义压缩与摘要
- 权限门控和路径保护
- 自定义编辑器和 UI 组件
- 状态行、页头、页脚
- Git 检查点与自动提交
- SSH 与沙箱执行
- MCP 服务器集成
- 让 pi 看起来像 Claude Code
- 等待时玩游戏（是的，Doom 能跑）
- ……任何你能想到的

放在 `~/.pi/agent/extensions/`、`.pi/extensions/`，或 [pi 包](#pi-packages) 中以便分享。见 [docs/extensions.md](docs/extensions.md) 和 [examples/extensions/](examples/extensions/)。

<a id="themes"></a>
### 主题

内置：`dark`、`light`。主题支持热重载：修改当前主题文件后，pi 会立即应用更改。

放在 `~/.pi/agent/themes/`、`.pi/themes/`，或 [pi 包](#pi-packages) 中以便分享。见 [docs/themes.md](docs/themes.md)。

<a id="pi-packages"></a>
### Pi 包

把扩展、skills、提示和主题打包，通过 npm 或 git 分享。在 [npmjs.com](https://www.npmjs.com/search?q=keywords%3Api-package) 或 [Discord](https://discord.com/channels/1456806362351669492/1457744485428629628) 查找包。

> **安全：** Pi 包拥有完整系统权限。扩展会执行任意代码，skills 可以指示模型执行任何操作，包括运行可执行文件。安装第三方包前请先审查源码。

```bash
pi install npm:@foo/pi-tools
pi install npm:@foo/pi-tools@1.2.3      # 钉死版本
pi install git:github.com/user/repo
pi install git:github.com/user/repo@v1  # tag 或 commit
pi install git:git@github.com:user/repo
pi install git:git@github.com:user/repo@v1  # tag 或 commit
pi install https://github.com/user/repo
pi install https://github.com/user/repo@v1      # tag 或 commit
pi install ssh://git@github.com/user/repo
pi install ssh://git@github.com/user/repo@v1    # tag 或 commit
pi remove npm:@foo/pi-tools
pi uninstall npm:@foo/pi-tools          # remove 的别名
pi list
pi update                               # 仅更新 pi
pi update --all                         # 更新 pi 和包
pi update --extensions                  # 仅更新包
pi update --models                      # 仅刷新模型目录
pi update --self                        # 仅更新 pi
pi update --self --force                # 即使当前已是该版本也重新安装 pi
pi update npm:@foo/pi-tools             # 更新单个包
pi config                               # 启用/禁用扩展、skills、提示、主题
```

包安装到 `~/.pi/agent/git/`（git）或 `~/.pi/agent/npm/`（npm）。用 `-l` 做项目本地安装（`.pi/git/`、`.pi/npm/`）。Git `@ref` 值是钉死的 tag 或 commit；`pi update --extensions` 和 `pi update --all` 会跳过已钉死的包，因此要用 `pi install git:host/user/repo@new-ref` 把已有包移到新 ref。Git 包默认用 `npm install --omit=dev` 安装依赖，因此运行时依赖必须列在 `dependencies` 下；配置了 `npmCommand` 时，git 包使用普通 `install` 以兼容包装器。若使用 Node 版本管理器，并希望包安装复用稳定的 npm 环境，在 `settings.json` 中设置 `npmCommand`，例如 `["mise", "exec", "node@20", "--", "npm"]`。

在 `package.json` 中添加 `pi` 键来创建包：

```json
{
  "name": "my-pi-package",
  "keywords": ["pi-package"],
  "pi": {
    "extensions": ["./extensions"],
    "skills": ["./skills"],
    "prompts": ["./prompts"],
    "themes": ["./themes"]
  }
}
```

没有 `pi` manifest 时，pi 会从约定目录自动发现（`extensions/`、`skills/`、`prompts/`、`themes/`）。

见 [docs/packages.md](docs/packages.md)。

---

<a id="programmatic-usage"></a>
## 编程式使用

<a id="sdk"></a>
### SDK

```typescript
import { createAgentSession, ModelRuntime, SessionManager } from "@earendil-works/pi-coding-agent";

const modelRuntime = await ModelRuntime.create();
const { session } = await createAgentSession({
  sessionManager: SessionManager.inMemory(),
  modelRuntime,
});

await session.prompt("What files are in the current directory?");
```

高级多会话运行时替换请用 `createAgentSessionRuntime()` 和 `AgentSessionRuntime`。

见 [docs/sdk.md](docs/sdk.md) 和 [examples/sdk/](examples/sdk/)。

<a id="rpc-mode"></a>
### RPC 模式

非 Node.js 集成请通过 stdin/stdout 使用 RPC 模式：

```bash
pi --mode rpc
```

RPC 模式使用严格的 LF 分隔 JSONL 帧。客户端必须只按 `\n` 拆分记录。不要使用 Node `readline` 这类通用按行读取器，它们也会按 JSON payload 内的 Unicode 分隔符拆分。

协议见 [docs/rpc.md](docs/rpc.md)。

---

<a id="philosophy"></a>
## 理念

Pi 刻意做成可高度扩展，这样它就不必规定你的工作流。其他工具内置的功能可以用 [扩展](#extensions)、[skills](#skills) 构建，或从第三方 [pi 包](#pi-packages) 安装。这让核心保持精简，同时让你按自己的工作方式塑造 pi。

**没有 MCP。** 做带 README 的 CLI 工具（见 [Skills](#skills)），或写一个添加 MCP 支持的扩展。[为什么？](https://mariozechner.at/posts/2025-11-02-what-if-you-dont-need-mcp/)

**没有子代理。** 做法很多。用 tmux 拉起 pi 实例，或用 [扩展](#extensions) 自己做，或安装按你的方式实现的包。

**没有权限弹窗。** 在容器里运行，或用 [扩展](#extensions) 按你的环境和安全要求构建自己的确认流程。

**没有 plan mode。** 把计划写到文件，或用 [扩展](#extensions) 构建，或安装一个包。

**没有内置待办。** 它们会干扰模型。用 TODO.md 文件，或用 [扩展](#extensions) 自己做。

**没有后台 bash。** 用 tmux。可完整观察，可直接交互。

完整理由见[这篇博文](https://mariozechner.at/posts/2025-11-30-pi-coding-agent/)。

---

<a id="cli-reference"></a>
## CLI 参考

```bash
pi [options] [--] [@files...] [messages...]
```

<a id="package-commands"></a>
### 包命令

```bash
pi install <source> [-l]     # 安装包，-l 表示项目本地
pi remove <source> [-l]      # 移除包
pi uninstall <source> [-l]   # remove 的别名
pi update [source|self|pi]   # 仅更新 pi，或更新单个包来源
pi update --all              # 更新 pi 和包
pi update --extensions       # 仅更新包
pi update --models           # 仅刷新模型目录
pi update --self             # 仅更新 pi
pi update --self --force     # 即使当前已是该版本也重新安装 pi
pi update --extension <src>  # 更新单个包
pi list                      # 列出已安装的包
pi config                    # 启用/禁用包资源
```

`pi config` 和项目包命令接受 `--approve`/`--no-approve`，用于单次命令信任或忽略项目本地设置。`pi update` 从不提示项目信任。

<a id="modes"></a>
### 模式

| 标志 | 说明 |
|------|-------------|
| （默认） | 交互模式 |
| `-p`、`--print` | 打印回复后退出 |
| `--mode json` | 将全部事件输出为 JSON 行（见 [docs/json.md](docs/json.md)） |
| `--mode rpc` | 用于进程集成的 RPC 模式（见 [docs/rpc.md](docs/rpc.md)） |
| `--export <in> [out]` | 将会话导出为 HTML |

在 print 模式下，pi 还会读取管道传入的 stdin，并合并到初始提示中：

```bash
cat README.md | pi -p "Summarize this text"
```

<a id="model-options"></a>
### 模型选项

| 选项 | 说明 |
|--------|-------------|
| `--provider <name>` | 提供商（anthropic、openai、google 等） |
| `--model <pattern>` | 模型模式或 ID（支持 `provider/id` 和可选的 `:<thinking>`） |
| `--api-key <key>` | API key（覆盖环境变量） |
| `--thinking <level>` | `off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`max` |
| `--models <patterns>` | 用于 Ctrl+P 循环的逗号分隔模式 |
| `--list-models [search]` | 列出可用模型 |

<a id="session-options"></a>
### 会话选项

| 选项 | 说明 |
|--------|-------------|
| `-c`、`--continue` | 继续最近一次会话 |
| `-r`、`--resume` | 浏览并选择会话 |
| `--session <path\|id>` | 使用指定会话文件或部分 UUID |
| `--fork <path\|id>` | 将会话文件或部分 UUID fork 到新会话 |
| `--session-dir <dir>` | 自定义会话存储目录 |
| `--no-session` | 临时模式（不保存） |
| `--name <name>`、`-n <name>` | 启动时设置会话显示名 |

<a id="tool-options"></a>
### 工具选项

| 选项 | 说明 |
|--------|-------------|
| `--tools <list>`、`-t <list>` | 允许指定的内置、扩展和自定义工具名 |
| `--exclude-tools <list>`、`-xt <list>` | 禁用指定的内置、扩展和自定义工具名 |
| `--no-builtin-tools`、`-nbt` | 默认禁用内置工具，但保留扩展/自定义工具 |
| `--no-tools`、`-nt` | 默认禁用全部工具 |

可用内置工具：`read`、`bash`、`edit`、`write`、`grep`、`find`、`ls`

<a id="resource-options"></a>
### 资源选项

| 选项 | 说明 |
|--------|-------------|
| `-e`、`--extension <source>` | 从路径、npm 或 git 加载扩展（可重复） |
| `--no-extensions` | 禁用扩展发现 |
| `--skill <path>` | 加载 skill（可重复） |
| `--no-skills` | 禁用 skill 发现 |
| `--prompt-template <path>` | 加载提示模板（可重复） |
| `--no-prompt-templates` | 禁用提示模板发现 |
| `--theme <path>` | 加载主题（可重复） |
| `--no-themes` | 禁用主题发现 |
| `--no-context-files`、`-nc` | 禁用 AGENTS.md 和 CLAUDE.md 上下文文件发现 |

把 `--no-*` 与显式标志组合，可精确加载所需内容并忽略 settings.json（例如 `--no-extensions -e ./my-ext.ts`）。

<a id="other-options"></a>
### 其他选项

| 选项 | 说明 |
|--------|-------------|
| `--system-prompt <text>` | 替换默认提示（上下文文件和 skills 仍会追加） |
| `--append-system-prompt <text>` | 追加到系统提示 |
| `--tui-mode <mode>` | TUI 模式：`regular`（默认）或实验性的 `fullscreen` |
| `--use-theme <name[/name]>` | 为本轮运行设置初始交互主题，不改设置 |
| `--verbose` | 强制详细启动输出 |
| `-a`、`--approve` | 本轮运行信任项目本地文件 |
| `-na`、`--no-approve` | 本轮运行忽略项目本地文件 |
| `--` | 停止解析选项；其余参数视为提示或 `@file` 输入 |
| `-h`、`--help` | 显示帮助 |
| `-v`、`--version` | 显示版本 |

<a id="file-arguments"></a>
### 文件参数

用 `@` 前缀把文件包含进消息：

```bash
pi @prompt.md "Answer this"
pi -p @screenshot.png "What's in this image?"
pi @code.ts @test.ts "Review these files"
```

<a id="examples"></a>
### 示例

```bash
# 带初始提示的交互模式
pi "List all .ts files in src/"

# 非交互
pi -p "Summarize this codebase"

# 以短横线开头的提示
pi -p -- "- Summarize these points"

# 非交互，从管道读取 stdin
cat README.md | pi -p "Summarize this text"

# 命名的一次性会话
pi --name "release audit" -p "Audit this repository"

# 不同模型
pi --provider openai --model gpt-4o "Help me refactor"

# 带提供商前缀的模型（不需要 --provider）
pi --model openai/gpt-4o "Help me refactor"

# 带思考级别简写的模型
pi --model sonnet:high "Solve this complex problem"

# 限制模型循环
pi --models "claude-*,gpt-4o"

# 只读模式
pi --tools read,grep,find,ls -p "Review the code"

# 禁用某个扩展或内置工具，其余保持可用
pi --exclude-tools ask_question

# 高思考级别
pi --thinking high "Solve this complex problem"
```

<a id="environment-variables"></a>
### 环境变量

| 变量 | 说明 |
|----------|-------------|
| `AI_AGENT` | 由 CLI 和 RPC 入口设为 `pi`，便于通用工具把子进程归因到 Pi |
| `PI_CODING_AGENT` | 由 CLI 和 RPC 入口设为 `true`，便于子进程检测自己运行在 Pi 内 |
| `PI_CODING_AGENT_DIR` | 覆盖配置目录（默认：`~/.pi/agent`） |
| `PI_CODING_AGENT_SESSION_DIR` | 覆盖会话存储目录（会被 `--session-dir` 覆盖） |
| `PI_PACKAGE_DIR` | 覆盖包目录（适用于 Nix/Guix 等 store 路径分词效果差的环境） |
| `PI_OFFLINE` | 禁用启动时的网络操作，包括更新检查、包更新检查以及安装/更新遥测 |
| `PI_SKIP_VERSION_CHECK` | 跳过启动时的 Pi 版本更新检查。这会阻止向 `pi.dev` 请求最新版本 |
| `PI_TELEMETRY` | 覆盖安装/更新遥测与提供商归因头。用 `1`/`true`/`yes` 启用，或 `0`/`false`/`no` 禁用。这不会禁用更新检查 |
| `PI_CACHE_RETENTION` | 设为 `long` 可延长 prompt 缓存（Anthropic：1h，OpenAI：24h） |
| `VISUAL`、`EDITOR` | 未设置 `externalEditor` 时 Ctrl+G 的外部编辑器回退；Windows 默认为 Notepad，其他平台为 `nano` |

LLM 可调用的 `bash` 工具所运行的命令也会收到当前会话元数据：

| 变量 | 说明 |
|----------|-------------|
| `PI_SESSION_ID` | 当前会话 ID |
| `PI_SESSION_FILE` | 会话 JSONL 的绝对路径；临时会话不设置 |
| `PI_PROVIDER` | 当前选中的模型提供商 |
| `PI_MODEL` | 当前选中的模型 ID |
| `PI_REASONING_LEVEL` | 当前有效推理级别 |

这些值在每条命令启动时解析。语义、示例和自定义工具的退出方式见 [环境变量](docs/environment-variables.md#shell-tool-session-environment)。

---

<a id="contributing--development"></a>
## 贡献与开发

指南见 [CONTRIBUTING.md](../../CONTRIBUTING.md)，设置、fork 和调试见 [docs/development.md](docs/development.md)。

<a id="license"></a>
## 许可证

MIT

<a id="see-also"></a>
## 另见

- [@earendil-works/pi-ai](https://www.npmjs.com/package/@earendil-works/pi-ai)：核心 LLM 工具包
- [@earendil-works/pi-agent-core](https://www.npmjs.com/package/@earendil-works/pi-agent-core)：代理框架
- [@earendil-works/pi-tui](https://www.npmjs.com/package/@earendil-works/pi-tui)：终端 UI 组件

<p align="center">
  <a href="https://pi.dev">pi.dev</a> 域名由
  <br /><br />
  <a href="https://exe.dev"><img src="docs/images/exy.png" alt="Exy mascot" width="48" /><br />exe.dev</a>
  慷慨捐赠
</p>
