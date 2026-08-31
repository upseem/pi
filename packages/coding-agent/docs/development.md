<a id="development"></a>
# 开发

更多指南见 [AGENTS.md](https://github.com/earendil-works/pi-mono/blob/main/AGENTS.md)。

<a id="setup"></a>
## 设置

```bash
git clone https://github.com/earendil-works/pi-mono
cd pi-mono
npm install
npm run build
```

从源码运行：

```bash
/path/to/pi-mono/pi-test.sh
```

该脚本可以从任意目录运行。Pi 会保持调用方的当前工作目录。

<a id="forking--rebranding"></a>
## Fork / 换品牌

通过 `package.json` 配置：

```json
{
  "piConfig": {
    "name": "pi",
    "configDir": ".pi"
  }
}
```

为你的 fork 改 `name`、`configDir` 和 `bin` 字段。这会影响 CLI 横幅、配置路径和环境变量名。

<a id="path-resolution"></a>
## 路径解析

三种执行模式：npm 安装、独立二进制、从源码用 tsx。

**包资源始终使用 `src/config.ts`**：

```typescript
import { getPackageDir, getThemeDir } from "./config.js";
```

不要直接用 `__dirname` 取包资源。

<a id="debug-command"></a>
## 调试命令

`/debug`（隐藏）写入 `~/.pi/agent/pi-debug.log`：
- 带 ANSI 码的已渲染 TUI 行
- 最近发给 LLM 的消息

<a id="testing"></a>
## 测试

```bash
./test.sh                         # 运行非 LLM 测试（不需要 API key）
npm test                          # 运行全部测试
npm test -- test/specific.test.ts # 运行指定测试
```

<a id="project-structure"></a>
## 项目结构

```
packages/
  ai/           # LLM 提供商抽象
  agent/        # 代理循环与消息类型
  tui/          # 终端 UI 组件
  coding-agent/ # CLI 与交互模式
```
