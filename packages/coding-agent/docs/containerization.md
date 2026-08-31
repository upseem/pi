<a id="containerization"></a>
# 容器化

Pi 默认以全部权限运行，但有时需要更精细地控制 Pi 可写入的目录以及它拥有的访问权限。

一般有两种做法。你可以
1. 把整个 `pi` 进程放进隔离环境，或
2. 在宿主机运行 `pi`，把工具执行转发到隔离环境。

<a id="choose-a-pattern"></a>
## 选择模式

| 模式 | 隔离范围 | 适用场景 | 说明 |
| --- | --- | --- | --- |
| Gondolin 扩展 | 内置工具和 `!` 命令 | 本地微型虚拟机隔离，认证留在宿主机 | 见 [`examples/extensions/gondolin/`](../examples/extensions/gondolin/)。 |
| 普通 Docker | 整个 `pi` 进程在本地容器中 | 简单的本地隔离 | 提供商 API key 会进入容器。 |
| OpenShell | 整个 `pi` 进程在受策略控制的沙箱中 | 本地或远程托管沙箱 | 需要 OpenShell 网关 |

扩展运行在 `pi` 进程所在之处。如果在宿主机 `pi` 上使用工具转发扩展，其他自定义扩展工具仍在宿主机运行，除非它们也委托了自己的操作。

<a id="gondolin"></a>
## Gondolin

[Gondolin](https://github.com/earendil-works/gondolin) 是本地 Linux 微型虚拟机。
若希望 `pi` 留在宿主机、但把所有内置工具转发到虚拟机，使用[示例扩展](../examples/extensions/gondolin)。

设置：

```bash
cp -R packages/coding-agent/examples/extensions/gondolin ~/.pi/agent/extensions/gondolin
cd ~/.pi/agent/extensions/gondolin
npm install --ignore-scripts
```

从要挂载的项目目录运行：

```bash
cd /path/to/project
pi -e ~/.pi/agent/extensions/gondolin
```

该扩展将宿主机 cwd 挂载到虚拟机的 `/workspace`，并覆盖 `read`、`write`、`edit`、`bash`、`grep`、`find` 和 `ls`。
用户的 `!` 命令也会转发到虚拟机。
`/workspace` 下的文件更改会写回宿主机。

要求：`@earendil-works/gondolin` 需要 Node.js >= 23.6.0，以及 QEMU（需通过包管理器安装）。

<a id="plain-docker"></a>
## 普通 Docker

若只需要最简单的本地容器边界，把整个 `pi` 进程放进 Docker。

`Dockerfile.pi`：

```dockerfile
FROM node:24-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash ca-certificates git ripgrep \
  && rm -rf /var/lib/apt/lists/*
RUN npm install -g --ignore-scripts @earendil-works/pi-coding-agent

WORKDIR /workspace
ENTRYPOINT ["pi"]
```

构建并运行：

```bash
docker build -t pi-sandbox -f Dockerfile.pi .

docker run --rm -it \
  -e ANTHROPIC_API_KEY \
  -v "$PWD:/workspace" \
  -v pi-agent-home:/root/.pi/agent \
  pi-sandbox
```

`-v "$PWD:/workspace"` 将当前目录挂载到容器内的 /workspace，因此 Docker 内对 `/workspace` 的读写会直接作用于宿主机文件，与 Gondolin 示例类似。

若希望设置和会话只存在于容器内，为 `/root/.pi/agent` 使用命名卷。挂载宿主机的 `~/.pi/agent` 会把宿主机的认证和会话文件暴露给容器。

<a id="openshell"></a>
## OpenShell

若需要带文件系统、进程、网络、凭据和推理控制的策略沙箱，使用 [NVIDIA OpenShell](https://docs.nvidia.com/openshell/about/overview)。
OpenShell 可通过由 Docker、Podman 或虚拟机运行时支撑的本地网关运行沙箱，也可通过远程 Kubernetes 网关运行。

每个沙箱都需要一个活动网关。
创建沙箱前先注册并选择网关：

```bash
openshell gateway add <gateway-url> --name <name>
openshell gateway select <name>
```

在 OpenShell 沙箱中启动 `pi`：

```bash
openshell sandbox create --name pi-sandbox --from pi -- pi
```

在此模式下，整个 `pi` 进程运行在沙箱内。
内置工具、`!` 命令和扩展工具都在 OpenShell 边界内执行。

若网关在远程，项目文件不会从宿主机绑定挂载，因此沙箱内的写入不会反映到本机。
在沙箱内克隆仓库，或使用 OpenShell 文件传输命令：

```bash
openshell sandbox upload pi-sandbox ./repo /workspace
openshell sandbox download pi-sandbox /workspace/repo ./repo-out
```

OpenShell 提供商可以把原始模型 API key 留在沙箱外。
配置推理路由后，沙箱内的代码可以调用 `https://inference.local`，由网关向上游注入已配置的提供商凭据。
若希望模型流量走这条路径，将 Pi 配置为对应的 OpenAI 兼容或 Anthropic 兼容端点。
