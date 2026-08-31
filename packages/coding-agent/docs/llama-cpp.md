<a id="llamacpp"></a>
# llama.cpp

Pi 支持 [llama.cpp](https://github.com/ggml-org/llama.cpp) 路由器服务器。路由器会发现多个 GGUF 模型，并按需加载或卸载。

请使用带路由器支持的较新 llama.cpp 构建。按 [构建说明](https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md) 操作，或为你的平台安装 [预构建发行版](https://github.com/ggml-org/llama.cpp/releases)。

<a id="start-the-router"></a>
## 启动路由器

启动 `llama-server` 时不要带 `--model` 或 `-m`。传入模型会进入单模型模式，而不是路由器模式。

```bash
llama-server \
  --models-dir ~/models \
  --no-models-autoload \
  --jinja \
  --host 127.0.0.1 \
  --port 8080 \
  -ngl 999 \
  -c 32768
```

重要选项：

- `--models-dir ~/models` 发现本地 GGUF 文件。
- `--no-models-autoload` 让加载保持显式，通过 `/llama` 完成。
- `--jinja` 启用兼容的聊天模板和工具调用。
- `-ngl 999` 尽可能多地把层卸载到 GPU。
- `-c 32768` 为每个已加载模型设置上下文窗口。省略则使用模型原生上下文，可能显著增加内存占用。

单文件模型可以直接放在模型目录中。多模态和分片模型放在各自的子目录：

```text
~/models/
├── llama-3.2-1b-Q4_K_M.gguf
├── gemma-3-4b-it-Q4_K_M/
│   ├── gemma-3-4b-it-Q4_K_M.gguf
│   └── mmproj-F16.gguf
└── large-model-Q4_K_M/
    ├── large-model-Q4_K_M-00001-of-00003.gguf
    ├── large-model-Q4_K_M-00002-of-00003.gguf
    └── large-model-Q4_K_M-00003-of-00003.gguf
```

手动添加文件后需重启路由器。按模型设置上下文大小及其他选项，见 [llama.cpp model presets](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md#model-presets)。

<a id="configure-pi"></a>
## 配置 Pi

启动 Pi 并配置提供商：

```text
/login llama.cpp
```

输入路由器 URL 和可选的 API key。默认 URL 为 `http://127.0.0.1:8080`。

如果用 `--no-models-autoload` 启动路由器，`/login llama.cpp` 只保存连接。先运行 `/llama` 加载模型，再运行 `/model` 为当前会话选择已加载的模型。

也可用环境变量配置同样的值，无需 `/login`：

```bash
export LLAMA_BASE_URL=http://127.0.0.1:8080
export LLAMA_API_KEY=optional-secret
pi
```

如果服务器使用 API key，启动 `llama-server` 时传入匹配的 `--api-key`。本地访问请保持 `--host 127.0.0.1`。

<a id="manage-models"></a>
## 管理模型

运行：

```text
/llama
```

- 选择未加载的模型以加载它。
- 选择已加载的模型以卸载它。
- 选择 **Download model…**，搜索 Hugging Face，然后选择仓库和量化。精确的 `owner/repository[:quant]` 值也可以。
- 加载或下载过程中按 Escape 可确认取消。

Hugging Face 搜索会在已设置时使用 `HF_TOKEN`，然后依次检查 `$HF_TOKEN_PATH`、`$HF_HOME/token`、`$XDG_CACHE_HOME/huggingface/token` 和 `~/.cache/huggingface/token`。未认证也可以搜索，但速率限制更低。下载受门禁的仓库前，Pi 会发出警告并给出访问页面链接。下载由 llama.cpp 服务器执行，因此所选仓库需要访问权限时，其进程也必须有 `HF_TOKEN`。

若已有其他模型加载，Pi 会询问是先卸载还是保持加载。Pi 不会静默卸载模型，也从不删除模型文件。路由器可能与其他客户端共享，因此 `/llama` 始终显示路由器的当前状态。

只有已加载的模型会出现在 `/model` 中。加载模型后，运行 `/model` 为当前 Pi 会话选择它。

如果路由器断开，`/llama` 会显示 **Retry** 和 **Close**。Retry 会重新连接并刷新模型状态，不会重放中断的操作。

<a id="troubleshooting"></a>
## 故障排除

检查路由器是否可达：

```bash
curl http://127.0.0.1:8080/health
curl http://127.0.0.1:8080/models
```

- **`/llama` 中没有模型：** 检查 `--models-dir`、目录布局，并重启路由器。
- **`/model` 中缺少模型：** 先用 `/llama` 加载。
- **加载失败或占用内存过多：** 降低 `-c` 或卸载另一个模型。
- **服务器不在路由器模式：** 启动时不要带 `--model`、`-m` 或 `-hf`。
