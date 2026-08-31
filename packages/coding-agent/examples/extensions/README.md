<a id="extension-examples"></a>
# 扩展示例

pi-coding-agent 的示例扩展。

<a id="usage"></a>
## 用法

```bash
# 用 --extension 标志加载扩展
pi --extension examples/extensions/permission-gate.ts

# 或复制到扩展目录以自动发现
cp permission-gate.ts ~/.pi/agent/extensions/
```

<a id="examples"></a>
## 示例

<a id="lifecycle--safety"></a>
### 生命周期与安全

| 扩展 | 说明 |
|-----------|-------------|
| `permission-gate.ts` | 危险 bash 命令（rm -rf、sudo 等）执行前请求确认 |
| `project-trust.ts` | 演示用户/全局和 CLI 扩展的 `project_trust` 事件 |
| `protected-paths.ts` | 阻止写入受保护路径（.env、.git/、node_modules/） |
| `confirm-destructive.ts` | 破坏性会话操作（clear、switch、fork）前确认 |
| `dirty-repo-guard.ts` | 存在未提交 git 变更时阻止会话更改 |
| `sandbox/` | 使用 `@anthropic-ai/sandbox-runtime` 做操作系统级沙箱，带按项目配置 |
| `gondolin/` | 将内置工具和 `!` 命令路由进 Gondolin 微虚拟机 |

<a id="custom-tools"></a>
### 自定义工具

| 扩展 | 说明 |
|-----------|-------------|
| `todo.ts` | 待办列表工具 + `/todos` 命令，带自定义渲染和状态持久化 |
| `hello.ts` | 最小自定义工具示例 |
| `question.ts` | 演示用 `ctx.ui.select()` 以自定义 UI 向用户提问 |
| `questionnaire.ts` | 多问题输入，问题之间用标签栏导航 |
| `tool-override.ts` | 覆盖内置工具（例如为 `read` 加日志/访问控制） |
| `dynamic-tools.ts` | 启动后（`session_start`）以及运行时通过命令注册工具，带提示片段和工具级提示指南 |
| `kimi-deferred-tools.ts` | 为 Kimi 的延迟工具加载协议搜索并逐步激活工具 |
| `structured-output.ts` | 最终结构化输出工具，返回 `terminate: true`，使代理可以在该工具调用上结束 |
| `built-in-tool-renderer.ts` | 为内置工具（read、bash、edit、write）做自定义紧凑渲染，同时保留原有行为 |
| `minimal-mode.ts` | 覆盖内置工具渲染为最小显示（折叠模式下只显示工具调用，不显示输出） |
| `truncated-tool.ts` | 包装 ripgrep，并正确截断输出（50KB/2000 行） |
| `ssh.ts` | 通过 SSH 用可插拔操作把所有工具委托到远程机器 |
| `subagent/` | 把任务委托给带独立上下文窗口的专用子代理 |

<a id="commands--ui"></a>
### 命令与 UI

| 扩展 | 说明 |
|-----------|-------------|
| `preset.ts` | 通过 `--preset` 标志和 `/preset` 命令，为模型、思考级别、工具和指令提供命名预设 |
| `plan-mode/` | Claude Code 风格的计划模式，只读探索，带 `/plan` 命令和步骤跟踪 |
| `tools.ts` | 交互式 `/tools` 命令，启用/禁用工具，并做会话持久化 |
| `handoff.ts` | 通过 `/handoff <goal>` 将上下文转移到新的聚焦会话 |
| `qna.ts` | 用 `ctx.ui.setEditorText()` 从上次回复中提取问题到编辑器 |
| `status-line.ts` | 通过 `ctx.ui.setStatus()` 在页脚显示回合进度，带主题颜色 |
| `github-issue-autocomplete.ts` | 通过叠加自定义自动补全提供商添加 `#1234` issue 补全，该提供商从 `gh issue list` 预加载未关闭 issue |
| `widget-placement.ts` | 通过 `ctx.ui.setWidget()` 的 placement 在编辑器上方和下方显示 widget |
| `hidden-thinking-label.ts` | 通过 `ctx.ui.setHiddenThinkingLabel()` 自定义折叠思考标签 |
| `working-indicator.ts` | 通过 `ctx.ui.setWorkingIndicator()` 自定义流式工作指示器 |
| `model-status.ts` | 通过 `model_select` hook 在状态栏显示模型变更 |
| `snake.ts` | 贪吃蛇游戏，带自定义 UI、键盘处理和会话持久化 |
| `tic-tac-toe.ts` | 与代理下井字棋，工具使用 `executionMode: "sequential"` 以避免共享光标状态上的竞态 |
| `send-user-message.ts` | 演示扩展用 `pi.sendUserMessage()` 发送用户消息 |
| `timed-confirm.ts` | 演示用 AbortSignal 自动关闭 `ctx.ui.confirm()` 和 `ctx.ui.select()` 对话框 |
| `rpc-demo.ts` | 演练全部 RPC 支持的扩展 UI 方法；可与 [`examples/rpc-extension-ui.ts`](../rpc-extension-ui.ts) 配对 |
| `modal-editor.ts` | 通过 `ctx.ui.setEditorComponent()` 实现类 vim 的模态编辑器 |
| `rainbow-editor.ts` | 通过自定义编辑器实现彩虹文字动画效果 |
| `notify.ts` | 代理完成后通过 OSC 777 发送桌面通知（Ghostty、iTerm2、WezTerm） |
| `titlebar-spinner.ts` | 代理工作时在终端标题中显示 Braille 旋转动画 |
| `summarize.ts` | 用 GPT-5.2 总结对话，并在瞬时 UI 中显示 |
| `custom-footer.ts` | 通过 `ctx.ui.setFooter()` 自定义页脚，显示 git 分支和 token 统计 |
| `custom-header.ts` | 通过 `ctx.ui.setHeader()` 自定义页头 |
| `overlay-test.ts` | 用行内文本输入和边界情况测试 overlay 合成 |
| `overlay-qa-tests.ts` | 全面的 overlay QA 测试：锚点、边距、堆叠、溢出、动画 |
| `doom-overlay/` | 以 overlay 运行 DOOM，35 FPS（演示实时游戏渲染） |
| `shutdown-command.ts` | 添加 `/quit` 命令，演示 `ctx.shutdown()` |
| `reload-runtime.ts` | 添加 `/reload-runtime` 和 `reload_runtime` 工具，展示安全重载流程 |
| `interactive-shell.ts` | 通过 `user_bash` hook 用完整终端运行交互式命令（vim、htop） |
| `inline-bash.ts` | 通过 `input` 事件变换展开提示中的 `!{command}` 模式 |
| `input-transform-streaming.ts` | 通过 `streamingBehavior` 在中途转向时跳过昂贵的输入预处理 |

<a id="git-integration"></a>
### Git 集成

| 扩展 | 说明 |
|-----------|-------------|
| `git-checkpoint.ts` | 每回合创建 git stash 检查点，便于 fork 时恢复代码 |
| `auto-commit-on-exit.ts` | 退出时自动提交，用最后一条助手消息作为提交说明 |

<a id="system-prompt--compaction"></a>
### 系统提示与压缩

| 扩展 | 说明 |
|-----------|-------------|
| `pirate.ts` | 演示用 `systemPromptAppend` 动态修改系统提示 |
| `claude-rules.ts` | 扫描 `.claude/rules/` 文件夹，并在系统提示中列出规则 |
| `custom-compaction.ts` | 自定义压缩，总结整段对话 |
| `trigger-compact.ts` | 上下文用量超过 100k tokens 时触发压缩，并添加 `/trigger-compact` 命令 |

<a id="system-integration"></a>
### 系统集成

| 扩展 | 说明 |
|-----------|-------------|
| `mac-system-theme.ts` | 将 pi 主题与 macOS 深色/浅色模式同步 |

<a id="resources"></a>
### 资源

| 扩展 | 说明 |
|-----------|-------------|
| `dynamic-resources/` | 使用 `resources_discover` 加载 skills、提示模板和主题 |

<a id="messages--communication"></a>
### 消息与通信

| 扩展 | 说明 |
|-----------|-------------|
| `message-renderer.ts` | 通过 `registerMessageRenderer` 自定义消息渲染，带颜色和可展开详情 |
| `entry-renderer.ts` | 通过 `appendEntry` 和 `registerEntryRenderer` 做仅 TUI 的会话条目渲染 |
| `event-bus.ts` | 通过 `pi.events` 做扩展间通信 |

<a id="session-metadata"></a>
### 会话元数据

| 扩展 | 说明 |
|-----------|-------------|
| `session-name.ts` | 通过 `setSessionName` 为会话选择器命名会话 |
| `bookmark.ts` | 通过 `setLabel` 为条目加书签标签，供 `/tree` 导航 |

<a id="custom-providers"></a>
### 自定义提供商

| 扩展 | 说明 |
|-----------|-------------|
| `custom-provider-anthropic/` | 自定义 Anthropic 提供商，支持 OAuth 和自定义流式实现 |
| `custom-provider-gitlab-duo/` | GitLab Duo 提供商，通过代理使用 pi-ai 内置的 Anthropic/OpenAI 流式 |

<a id="external-dependencies"></a>
### 外部依赖

| 扩展 | 说明 |
|-----------|-------------|
| `with-deps/` | 自带 package.json 和依赖的扩展（演示 jiti 模块解析） |
| `file-trigger.ts` | 监视触发文件，并把内容注入对话 |

<a id="writing-extensions"></a>
## 编写扩展

完整文档见 [docs/extensions.md](../../docs/extensions.md)。

```typescript
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

export default function (pi: ExtensionAPI) {
  // 订阅生命周期事件
  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName === "bash" && event.input.command?.includes("rm -rf")) {
      const ok = await ctx.ui.confirm("Dangerous!", "Allow rm -rf?");
      if (!ok) return { block: true, reason: "Blocked by user" };
    }
  });

  // 注册自定义工具
  pi.registerTool({
    name: "greet",
    label: "Greeting",
    description: "Generate a greeting",
    parameters: Type.Object({
      name: Type.String({ description: "Name to greet" }),
    }),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      return {
        content: [{ type: "text", text: `Hello, ${params.name}!` }],
        details: {},
      };
    },
  });

  // 注册命令
  pi.registerCommand("hello", {
    description: "Say hello",
    handler: async (args, ctx) => {
      ctx.ui.notify("Hello!", "info");
    },
  });
}
```

<a id="key-patterns"></a>
## 关键模式

**字符串参数使用 StringEnum**（Google API 兼容性所要求）：
```typescript
import { StringEnum } from "@earendil-works/pi-ai";

// 正确
action: StringEnum(["list", "add"] as const)

// 错误 - 对 Google 无效
action: Type.Union([Type.Literal("list"), Type.Literal("add")])
```

**通过 details 持久化状态：**
```typescript
// 把状态存在工具结果 details 中，以正确支持 fork
return {
  content: [{ type: "text", text: "Done" }],
  details: { todos: [...todos], nextId },  // 持久化在会话中
};

// 在会话事件上重建
pi.on("session_start", async (_event, ctx) => {
  for (const entry of ctx.sessionManager.getBranch()) {
    if (entry.type === "message" && entry.message.toolName === "my_tool") {
      const details = entry.message.details;
      // 从 details 重建状态
    }
  }
});
```
