<p align="center">
  <a href="https://pi.dev">
    <img alt="pi logo" src="https://pi.dev/logo-auto.svg" width="128">
  </a>
</p>
<p align="center">
  <a href="https://discord.com/invite/3cU7Bz4UPx"><img alt="Discord" src="https://img.shields.io/badge/discord-community-5865F2?style=flat-square&logo=discord&logoColor=white" /></a>
  <a href="https://www.npmjs.com/package/@earendil-works/pi-coding-agent"><img alt="npm" src="https://img.shields.io/npm/v/@earendil-works/pi-coding-agent?style=flat-square" /></a>
</p>

> 新贡献者提交的 Issue 和 PR 默认会被自动关闭。维护者每天会复查这些自动关闭的条目。详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

# Pi Agent Harness

这里是 Pi 代理框架项目的所在地，其中包括我们可扩展的编码代理。

* **[@earendil-works/pi-coding-agent](packages/coding-agent)**：交互式编码代理 CLI
* **[@earendil-works/pi-agent-core](packages/agent)**：带工具调用和状态管理的代理运行时
* **[@earendil-works/pi-ai](packages/ai)**：统一的多提供商 LLM API（OpenAI、Anthropic、Google 等）

了解更多：

* [访问 pi.dev](https://pi.dev)，项目网站和演示
* [阅读文档](https://pi.dev/docs/latest)；也可以直接让代理解释自己

## 全部软件包

| 软件包 | 说明 |
|---------|-------------|
| **[@earendil-works/pi-telemetry](packages/telemetry)** | 厂商无关的遥测约定、参考适配器、一致性测试和类型化 schema |
| **[@earendil-works/pi-ai](packages/ai)** | 统一的多提供商 LLM API（OpenAI、Anthropic、Google 等） |
| **[@earendil-works/pi-agent-core](packages/agent)** | 带工具调用和状态管理的代理运行时 |
| **[@earendil-works/pi-coding-agent](packages/coding-agent)** | 交互式编码代理 CLI |
| **[@earendil-works/pi-tui](packages/tui)** | 带差分渲染的终端 UI 库 |

Slack / 聊天自动化和工作流见 [earendil-works/pi-chat](https://github.com/earendil-works/pi-chat)。

## 权限与容器化

Pi 没有内置权限系统来限制文件系统、进程、网络或凭据访问。默认情况下，它以启动它的用户和进程的权限运行。

如果需要更强隔离，请把 Pi 放进容器或沙箱。三种模式见 [packages/coding-agent/docs/containerization.md](packages/coding-agent/docs/containerization.md)：

- **Gondolin 扩展**：`pi` 和提供商认证留在宿主机，内置工具和 `!` 命令转发到本地 Linux 微型虚拟机。
- **普通 Docker**：把整个 `pi` 进程放进本地容器，做简单隔离。
- **OpenShell**：把整个 `pi` 进程放进受策略控制的沙箱。

## 贡献

贡献指南见 [CONTRIBUTING.md](CONTRIBUTING.md)，项目规则（人和代理都适用）见 [AGENTS.md](AGENTS.md)。更长期的规划见 [RFCs](https://rfc.earendil.com/keyword/pi/)。

## 开发

```bash
npm install --ignore-scripts  # 安装全部依赖，不运行生命周期脚本
npm run build         # 刷新模型数据，然后构建所有包
npm run build:offline # 使用已有模型数据重建，不访问网络
npm run check         # 代码检查、格式化和类型检查
./test.sh            # 运行测试（没有 API key 时会跳过依赖 LLM 的测试）
./pi-test.sh         # 从源码运行 pi（可在任意目录执行）
```

## 从发布源码构建独立二进制

GitHub Release 会附带带版本号的源码归档，并由该次发布的 `SHA256SUMS` 覆盖校验。解压后运行官方独立二进制使用的同一套构建脚本：

```bash
VERSION="<release-version>"
tar -xzf "pi-${VERSION}-source.tar.gz"
cd "pi-${VERSION}"
./scripts/build-binaries.sh --offline-model-data --platform linux-x64 --out "$PWD/out"
```

源码归档包含该次发布使用的已生成提供商模型数据。`--offline-model-data` 用这份快照构建，而不是从线上提供商目录刷新。脚本仍会安装依赖、构建 monorepo、编译 Bun 可执行文件，并暂存运行时资源。自行提供依赖的打包维护者可以传 `--skip-install --skip-deps`。

## 供应链加固

我们把 npm 依赖变更当作需要审查的代码变更。

- 直接外部依赖钉死精确版本。内部 workspace 包仍使用版本范围。
- `.npmrc` 设置了 `save-exact=true` 和 `min-release-age=2`，避免解析时用上当天刚发布的依赖。
- `package-lock.json` 是依赖的事实来源。除非设置 `PI_ALLOW_LOCKFILE_CHANGE=1`，预提交钩子会拦住误提交的 lockfile。
- `npm run check` 会校验钉死的直接依赖、原生 TypeScript 导入兼容性，以及生成的 coding-agent shrinkwrap。
- 发布的 CLI 包包含从根 lockfile 生成的 `packages/coding-agent/npm-shrinkwrap.json`，用来给 npm 用户钉死传递依赖。
- 发布冒烟测试用 `npm run release:local`：在打 tag 前于仓库外构建、打包，并创建隔离的 npm 与 Bun 安装。
- 本地发布安装、文档中的 npm 安装，以及 `pi update --self`，在支持的情况下使用 `--ignore-scripts`。
- CI 用 `npm ci --ignore-scripts` 安装；定时 GitHub workflow 会跑 `npm audit --omit=dev` 和 `npm audit signatures --omit=dev`。
- Shrinkwrap 生成对依赖生命周期脚本有显式允许列表；带生命周期脚本的新依赖在审查通过前会让检查失败。

## 分享你的开源编码代理会话

如果你用 Pi 或其他编码代理做开源工作，请分享会话。

公开的开源会话数据能用真实任务、工具调用、失败和修复来改进编码代理，而不是玩具基准。

完整说明见 [这篇 X 帖](https://x.com/badlogicgames/status/2037811643774652911)。

发布会话请用 [`badlogic/pi-share-hf`](https://github.com/badlogic/pi-share-hf)。设置步骤见它的 README.md。你只需要一个 Hugging Face 账号、Hugging Face CLI，以及 `pi-share-hf`。

也可以看 [这个视频](https://x.com/badlogicgames/status/2041151967695634619)，里面演示了如何发布我的 `pi-mono` 会话。

我自己会定期把 `pi-mono` 工作会话发布到这里：

- [badlogicgames/pi-mono on Hugging Face](https://huggingface.co/datasets/badlogicgames/pi-mono)

## 许可证

MIT

<p align="center">
  <a href="https://pi.dev">pi.dev</a> 域名由
  <br /><br />
  <a href="https://exe.dev"><img src="packages/coding-agent/docs/images/exy.png" alt="Exy mascot" width="48" /><br />exe.dev</a>
  <br />慷慨捐赠
</p>
