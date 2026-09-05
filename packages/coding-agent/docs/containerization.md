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
| Docker Sandboxes | 整个 `pi` 进程在托管沙箱中 | 提供商密钥留在宿主机的本地隔离 | 需要 Docker Sandboxes（`sbx`） |

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

<a id="docker-sandboxes"></a>
## Docker Sandboxes

[Docker Sandboxes](https://docs.docker.com/ai/sandboxes/) 是 Docker 提供的托管沙箱运行时，会在沙箱内运行整个 `pi` 进程。
它是[无内置沙箱](security.md#no-built-in-sandbox)所指向的容器边界之一。

与上面的普通 Docker 模式不同，提供商凭据不会传入容器。
沙箱只会收到一个哨兵值；访问 `api.anthropic.com` 时，`sbx` 代理会在出口处将其替换为真实凭据。
凭据在创建沙箱时绑定，因此应先将凭据存储在宿主机上。

使用 Claude Pro/Max 订阅时，在装有 Claude Code 的机器上运行 `claude setup-token`，然后把结果存储到宿主机。
如果已绑定 `anthropic` secret，请先删除；否则代理会在 Bearer token 之外再添加 `x-api-key` 请求头，导致 Anthropic 拒绝请求。
`sbx secret set-custom` 从 stdin 读取 token，因此不会写入 shell 历史。

```bash
sbx secret rm anthropic

sbx secret set-custom \
  --host api.anthropic.com \
  --env ANTHROPIC_OAUTH_TOKEN \
  --placeholder 'sk-ant-oat01-{rand}'
```

沙箱拿到的是符合 OAuth token 格式的占位值，而不是真实 token；代理会在访问该主机时将其替换。Pi 已支持 `ANTHROPIC_OAUTH_TOKEN`，并优先于 API key 使用，因此无需额外配置 Pi。

若使用 API key，改用 `sbx secret set anthropic` 存储。该 kit 会以相同方式注入哨兵值，并由代理在出口处替换。

存储凭据后，在要挂载的项目目录中启动 `pi`：

```bash
sbx run --kit "docker.io/sbx/pi-kit:latest" pi
```

该 kit 已在镜像中预装 `pi`，因此沙箱无需安装即可启动，并把当前目录作为沙箱工作区。

不要在沙箱内认证：在那里运行 `/login` 会把真实 token 写入容器，破坏代理隔离模型。

脚本化使用方式相同：

```bash
sbx exec <sandbox-name> -- pi -p "list the failing tests"
```

完整的凭据支持矩阵、故障排查和版本固定方法见 [kit 文档](https://github.com/docker/sbx-kits-contrib/tree/main/pi)。
