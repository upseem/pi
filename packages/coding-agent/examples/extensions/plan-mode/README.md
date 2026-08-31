# 计划模式扩展

只读探索模式，用于安全的代码分析。

## 功能

- **禁用内置写入工具**：关闭 edit/write，同时保留其他已激活工具
- **Bash 允许列表**：只允许只读 bash 命令
- **计划提取**：从 `Plan:` 段落提取带编号的步骤
- **进度跟踪**：执行期间由 widget 显示完成状态
- **`[DONE:n]` 标记**：显式跟踪步骤完成
- **会话持久化**：状态在会话恢复后仍在

## 命令

- `/plan` - 切换计划模式
- `/todos` - 显示当前计划进度
- `Ctrl+Alt+P` - 切换计划模式（快捷键）

## 用法

1. 用 `/plan` 或 `--plan` 标志启用计划模式
2. 让代理分析代码并制定计划
3. 代理应在 `Plan:` 标题下输出带编号的计划：

```
Plan:
1. First step description
2. Second step description
3. Third step description
```

4. 出现提示时选择 "Execute the plan"
5. 执行期间，代理用 `[DONE:n]` 标签标记已完成步骤
6. 进度 widget 显示完成状态

## 工作原理

### 计划模式（只读）
- 禁用内置 edit/write 工具
- 其他已激活工具仍可用
- Bash 命令经过允许列表过滤
- 代理制定计划但不做修改

### 执行模式
- 恢复完整工具访问
- 代理按顺序执行步骤
- `[DONE:n]` 标记跟踪完成情况
- Widget 显示进度

### 命令允许列表

安全命令（允许）：
- 文件查看：`cat`、`head`、`tail`、`less`、`more`
- 搜索：`grep`、`find`、`rg`、`fd`
- 目录：`ls`、`pwd`、`tree`
- Git 读取：`git status`、`git log`、`git diff`、`git branch`
- 包信息：`npm list`、`npm outdated`、`yarn info`
- 系统信息：`uname`、`whoami`、`date`、`uptime`

被拦截的命令：
- 文件修改：`rm`、`mv`、`cp`、`mkdir`、`touch`
- Git 写入：`git add`、`git commit`、`git push`
- 包安装：`npm install`、`yarn add`、`pip install`
- 系统：`sudo`、`kill`、`reboot`
- 编辑器：`vim`、`nano`、`code`
