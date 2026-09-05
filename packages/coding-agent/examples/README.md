# 示例

pi-coding-agent SDK 与扩展的示例代码。

## 目录

### [sdk/](sdk/)
通过 `createAgentSession()` 做编程式使用。展示如何自定义模型、提示、工具、扩展和会话管理。

### [extensions/](extensions/)
示例扩展，演示：
- 生命周期事件处理（工具拦截、安全门、上下文修改）
- 自定义工具（待办列表、提问、子代理、输出截断）
- 命令与键盘快捷键
- 自定义 UI（页脚、页头、编辑器、覆盖层）
- Git 集成（检查点、自动提交）
- 系统提示修改与自定义压缩
- 外部集成（SSH、文件监视、系统主题同步）
- 自定义提供商（带自定义流式的 Anthropic、GitLab Duo）

### [plugins/pi-example-plugin/](plugins/pi-example-plugin/)
实验性插件包，Pi 会自动将其构建为独立的 Session worker facet 和 TUI Chord facet。

## 文档

- [SDK 参考](sdk/README.md)
- [扩展文档](../docs/extensions.md)
- [Skills 文档](../docs/skills.md)
