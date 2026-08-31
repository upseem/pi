# Pi macOS 快捷键大全

本文按当前本地版本 **Pi 0.84.3** 的源码整理，覆盖 Pi 内置交互模式、编辑器、模型选择器、会话选择器、会话树、设置页和全屏模式。

项目扩展可以另外注册快捷键，因此扩展快捷键不可能静态列全。在 Pi 中运行 `/hotkeys` 可查看当前实际生效的内置及扩展快捷键。

## macOS 按键名称

- `Ctrl`：Mac 键盘的 Control（⌃），不是 Command。
- `Option`：对应 Pi 配置中的 `alt`（⌥）。
- `Command`：对应 Pi 配置中的 `super`（⌘）。Pi 默认没有 Command 绑定，且终端需要支持 Kitty keyboard protocol 才能把 `super` 可靠传给 Pi。
- `Backspace`：Mac 键盘标为 Delete（⌫）的向后删除键。
- `Delete`：向前删除；紧凑型 Mac 键盘通常按 `Fn+Delete`。
- `Home`：紧凑型 Mac 键盘通常按 `Fn+←`。
- `End`：紧凑型 Mac 键盘通常按 `Fn+→`。
- `Page Up`：紧凑型 Mac 键盘通常按 `Fn+↑`。
- `Page Down`：紧凑型 Mac 键盘通常按 `Fn+↓`。

下文优先使用 Mac 用户看到的 `Option`，括号中给出配置文件使用的名称。

## 最常用

- `Enter`：空闲时提交输入；代理工作时提交一条引导消息，在当前工具调用结束后投递。
- `Shift+Enter` 或 `Ctrl+J`：插入换行。
- `Option+Enter`（`alt+enter`）：排队一条后续消息，等代理完成全部工作后投递。
- `Escape`：取消自动补全、取消当前弹窗，或中止当前代理运行。
- 空编辑器快速按两次 `Escape`：默认打开 `/tree`；可在 `/settings` 的 `doubleEscapeAction` 改成 `fork` 或 `none`。
- `Ctrl+C`：第一次清空编辑器，500 毫秒内第二次退出；在选择器中通常表示取消。
- `Ctrl+D`：编辑器为空时退出；非空时向前删除一个字符。
- `Ctrl+L`：打开模型选择器。
- `Ctrl+P`：切换到下一个限定模型。
- `Ctrl+Shift+P`：切换到上一个限定模型。
- `Shift+Tab`：循环切换思考级别。
- `Ctrl+O`：折叠或展开工具输出；启动页中也用来展开完整帮助。
- `Ctrl+T`：折叠或展开模型的思考块。
- `Ctrl+X`：复制上一条助手消息；在 `/tree` 中复制选中的消息。
- `Ctrl+G`：用外部编辑器编辑当前输入。
- `Ctrl+V`：从系统剪贴板粘贴图片；没有图片时粘贴文本。
- `Option+↑`（`alt+up`）：把已排队消息取回编辑器。
- `Ctrl+Z`：把 Pi 挂起到后台；回到 shell 后可用 `fg` 恢复。
- `Ctrl+Shift+D`：执行隐藏的调试命令，写入调试信息。

补充输入方式：

- 输入 `/`：打开斜杠命令补全。
- 输入 `@`：搜索并引用项目文件。
- 输入 `!command`：运行 bash，并把输出加入模型上下文。
- 输入 `!!command`：运行 bash，但不把输出加入模型上下文。

## 主编辑器

### 光标与历史

- `↑`：光标上移；位于提示顶部时浏览更早的输入历史。
- `↓`：光标下移；位于提示底部时浏览更新的输入历史。
- `←` 或 `Ctrl+B`：左移一个字符。
- `→` 或 `Ctrl+F`：右移一个字符。
- `Option+←`、`Ctrl+←` 或 `Option+B`：左移一个单词。
- `Option+→`、`Ctrl+→` 或 `Option+F`：右移一个单词。
- `Home`、`Ctrl+Home` 或 `Ctrl+A`：移到当前行开头。
- `End`、`Ctrl+End` 或 `Ctrl+E`：移到当前行末尾。
- `Page Up` 或 `Ctrl+Page Up`：向上翻页并移动光标。
- `Page Down` 或 `Ctrl+Page Down`：向下翻页并移动光标。
- `Ctrl+]`，然后输入一个字符：向前跳到该字符。
- `Ctrl+Option+]`（`ctrl+alt+]`），然后输入一个字符：向后跳到该字符。

`tui.editor.historyPrevious` 和 `tui.editor.historyNext` 两个专用历史动作默认未绑定。需要时可在 `keybindings.json` 中自行绑定。

### 删除、撤销与 Kill Ring

- `Backspace` 或 `Shift+Backspace`：向后删除一个字符。
- `Delete`、`Shift+Delete` 或 `Ctrl+D`：向前删除一个字符。
- `Ctrl+W` 或 `Option+Backspace`：向后删除一个单词。
- `Option+D` 或 `Option+Delete`：向前删除一个单词。
- `Ctrl+U`：删除到行首。
- `Ctrl+K`：删除到行尾。
- `Ctrl+Y`：粘贴最近一次被上述删除动作放入 Kill Ring 的文本。
- `Option+Y`：在执行 `Ctrl+Y` 后，循环选择更早删除的文本。
- `Ctrl+-`：撤销上一次编辑。

Kill Ring 是 Pi 编辑器内部的删除文本历史，不等同于 macOS 系统剪贴板。

### 输入、换行与自动补全

- `Enter`：提交。
- `Shift+Enter` 或 `Ctrl+J`：插入换行。
- 行尾输入反斜杠 `\` 后按 `Enter`：删除反斜杠并插入换行，供无法上报 `Shift+Enter` 的终端使用。
- `Tab`：路径或命令自动补全；自动补全打开时接受当前候选。
- 自动补全打开时 `↑` / `↓`：移动候选。
- 自动补全打开时 `Escape`：关闭自动补全，不中止代理。
- `Shift+Space`：插入普通空格。

## 通用选择器与弹窗

模型、思考级别、登录提供商、扩展、设置子菜单和 llama.cpp 等大多数选择器共用：

- `↑` / `↓`：移动选择。
- `Page Up` / `Page Down`：整页移动；部分短列表不使用翻页。
- `Enter`：确认。
- `Escape` 或 `Ctrl+C`：取消或返回。
- 直接输入文字：在支持搜索的选择器中筛选。

## 模型与思考级别

### 主界面

- `Ctrl+L`：打开模型选择器，等同于 `/model`。
- `Ctrl+P`：循环到下一个限定模型。
- `Ctrl+Shift+P`：循环到上一个限定模型。
- `Shift+Tab`：循环思考级别。
- `Ctrl+T`：折叠或展开思考块。

### `/model` 模型选择器

- `↑` / `↓`：循环选择模型。
- `Tab`：在全部模型与限定模型之间切换。
- `Enter`：仅为当前会话选择模型。
- `Ctrl+S`：选择模型并保存为以后启动时的默认模型。
- `Escape` 或 `Ctrl+C`：取消。
- 输入文字：搜索模型。

### `/thinking` 思考级别选择器

- `↑` / `↓`：选择思考级别。
- `Enter`：仅为当前会话选择。
- `Ctrl+S`：选择并保存为以后启动时的默认思考级别。
- `Escape` 或 `Ctrl+C`：取消。
- 输入文字：搜索。

### `/scoped-models` 限定模型选择器

- `↑` / `↓`：选择模型。
- `Enter`：启用或禁用当前模型。
- `Ctrl+A`：启用全部模型；有搜索词时只操作匹配项。
- `Ctrl+X`：清除全部模型；有搜索词时只操作匹配项。
- `Ctrl+P`：启用或禁用当前提供商的全部模型。
- `Option+↑` / `Option+↓`：调整已启用模型的循环顺序。
- `Ctrl+S`：把当前选择保存到设置。
- `Ctrl+C`：有搜索词时先清空搜索；搜索为空时取消。
- `Escape`：取消。

## 消息队列

代理正在工作时：

- `Enter`：排队引导消息。当前助手回合的工具调用结束后，该消息会进入下一轮。
- `Option+Enter`：排队后续消息。代理完成当前全部工作后，该消息才会投递。
- `Option+↑`：把所有已排队消息取回编辑器。
- `Escape`：中止当前运行，并把未消费的排队消息恢复到编辑器。

## 会话选择器

通过 `/resume` 或 `pi -r` 打开：

- 输入文字：搜索会话。
- `↑` / `↓`：移动选择。
- `Page Up` / `Page Down`：整页移动。
- `Tab`：切换当前项目与全部项目范围（该入口支持时）。
- `Enter`：打开选中的会话。
- `Ctrl+P`：切换是否显示完整路径。
- `Ctrl+S`：切换排序模式。
- `Ctrl+N`：切换“只显示已命名会话”。
- `Ctrl+R`：重命名选中会话。
- `Ctrl+D`：进入删除确认；再按 `Enter` 确认，按 `Escape` 或 `Ctrl+C` 取消。
- `Ctrl+Backspace`：搜索框为空时进入删除确认；搜索框非空时按普通删除处理。
- `Escape` 或 `Ctrl+C`：取消并关闭。

## 会话树

通过 `/tree` 打开：

- `↑` / `↓`：循环浏览可见节点。
- `←` 或 `Page Up`：向上翻一页。
- `→` 或 `Page Down`：向下翻一页。
- `Option+←` 或 `Ctrl+←`：折叠当前分支；不能折叠时跳到上一分支段起点。
- `Option+→` 或 `Ctrl+→`：展开当前分支；不能展开时跳到下一分支段。
- `Enter`：选中节点并从该位置继续。
- `Ctrl+X`：复制选中消息。
- `Backspace`：删除搜索词的最后一个字符。
- `Escape` 或 `Ctrl+C`：有搜索词时先清空搜索和折叠状态；否则退出。
- `Shift+L`：设置、编辑或清除选中节点的标签。
- `Shift+T`：显示或隐藏标签时间戳。
- `Ctrl+D`：切到默认筛选。
- `Ctrl+T`：切换隐藏工具结果。
- `Ctrl+U`：切换只显示用户消息。
- `Ctrl+L`：切换只显示有标签的节点。
- `Ctrl+A`：切换显示全部节点。
- `Ctrl+O`：向前循环筛选模式。
- `Ctrl+Shift+O`：向后循环筛选模式。

这里的快捷键按当前焦点解释。例如，`Ctrl+L` 在主界面打开模型选择器，在会话树中则切换“只显示有标签的节点”。

## 设置与包资源配置

### `/settings`

- `↑` / `↓`：移动选择。
- `Enter`：打开或切换当前设置。
- `Space`：搜索框为空时也可打开或切换当前设置。
- `Escape` 或 `Ctrl+C`：返回或关闭。
- 输入文字：搜索设置项。

### `pi config`

- `↑` / `↓`：移动选择。
- `Page Up` / `Page Down`：整页移动。
- `Tab`：在全局设置与项目设置之间切换。
- `Space` 或 `Enter`：启用、禁用或循环继承状态。
- `Escape` 或 `Ctrl+C`：取消或关闭。

## 全屏 TUI 模式

以 `pi --tui-mode fullscreen` 启动后，以下快捷键控制 transcript（对话记录）：

- `Page Up`：向上滚动一页。
- `Page Down`：向下滚动一页。
- `Home`：滚到 transcript 开头。
- `End`：滚到 transcript 末尾，并继续跟随新输出。
- `Ctrl+↑` 或 `Ctrl+Shift+↑`：跳到上一条已标记消息。
- `Ctrl+↓` 或 `Ctrl+Shift+↓`：跳到下一条已标记消息。
- `Ctrl+Shift+F`：搜索已渲染的 transcript。
- 搜索时 `Enter` 或 `Ctrl+G`：下一个匹配。
- 搜索时 `Shift+Enter` 或 `Ctrl+Shift+G`：上一个匹配。
- 搜索时 `Escape`：关闭搜索。

全屏模式中，无修饰的 `Home`、`End`、`Page Up`、`Page Down` 优先控制 transcript；`Ctrl+Home`、`Ctrl+End`、`Ctrl+Page Up`、`Ctrl+Page Down` 仍控制编辑器。

下面这些全屏动作存在，但默认未绑定：

- `tui.altScreen.halfPageUp`：向上滚动半页。
- `tui.altScreen.halfPageDown`：向下滚动半页。
- `tui.altScreen.lineUp`：向上滚动一行。
- `tui.altScreen.lineDown`：向下滚动一行。

全屏模式还支持鼠标滚轮和双指触控板滚动、点击链接、拖动选中文本。在 Ghostty 中按住 `Shift+Command` 可临时使用终端自身的链接处理。

## 默认未绑定的应用动作

以下动作已实现，但默认没有按键，需要使用斜杠命令，或在 `keybindings.json` 中自行绑定：

- `app.session.new`：开始新会话，对应 `/new`。
- `app.session.tree`：打开会话树，对应 `/tree`。
- `app.session.fork`：从当前会话分叉，对应 `/fork`。
- `app.session.resume`：打开会话恢复选择器，对应 `/resume`。
- `tui.editor.historyPrevious`：无视多行光标位置，直接选择上一条历史输入。
- `tui.editor.historyNext`：无视多行光标位置，直接选择下一条历史输入。

## 上下文冲突

同一个按键会随当前界面变化，这是正常行为：

- `Ctrl+C`：主编辑器清空/退出；选择器取消；限定模型选择器先清空搜索。
- `Ctrl+D`：主编辑器为空时退出、非空时向前删除；会话选择器中删除会话；会话树中切到默认筛选。
- `Ctrl+L`：主界面打开模型选择器；会话树中切换标签筛选。
- `Ctrl+P`：主界面循环模型；会话选择器切换路径；限定模型选择器切换当前提供商。
- `Ctrl+S`：模型/思考选择器保存默认；会话选择器切换排序；限定模型选择器保存选择。
- `Ctrl+T`：主界面折叠思考块；会话树切换隐藏工具结果。
- `Ctrl+O`：主界面展开工具输出；会话树循环筛选。
- `Ctrl+X`：主界面复制助手消息；会话树复制节点；限定模型选择器清除模型。

## 自定义快捷键

配置文件：

```text
~/.pi/agent/keybindings.json
```

示例：

```json
{
  "tui.editor.historyPrevious": "ctrl+p",
  "tui.editor.historyNext": "ctrl+n",
  "app.session.tree": "ctrl+shift+t",
  "app.session.resume": "ctrl+shift+r",
  "tui.editor.deleteWordBackward": ["ctrl+w", "alt+backspace"]
}
```

每个动作可以绑定一个按键或按键数组。用户配置会替换该动作的默认绑定，而不是追加。要禁用某个动作，可以绑定空数组：

```json
{
  "app.suspend": [],
  "tui.altScreen.pageUp": []
}
```

保存后在 Pi 中运行：

```text
/reload
```

按键格式使用 `ctrl`、`shift`、`alt`、`super`，例如：

- `Option+Enter` 写作 `alt+enter`
- `Command+K` 写作 `super+k`
- `Ctrl+Command+K` 写作 `ctrl+super+k`

在 Pi 中运行 `/hotkeys` 可查看当前实际生效的快捷键及扩展注册的快捷键。

## 终端兼容性

- 推荐 Kitty、Ghostty、iTerm2、WezTerm、Alacritty，或新版 VS Code/Cursor 集成终端。
- Pi 使用 Kitty keyboard protocol 区分 `Shift+Enter`、`Option+Enter` 等组合。
- Apple Terminal 本地运行时会尝试用 macOS 原生修饰键回退识别 `Shift+Enter`；经 SSH 时无法使用该回退。
- WezTerm 在 macOS 上默认可能把 `Option+Enter` 占作全屏快捷键，需要按 `packages/coding-agent/docs/terminal-setup.md` 覆盖。
- Alacritty 可能把 `Option+Enter` 当普通 `Enter`，需要按终端文档配置转义序列。
- Ghostty 若无法使用 `Option+Backspace`，可加入：

```text
keybind = alt+backspace=text:\x1b\x7f
```

- tmux 3.5 及以上建议在 `~/.tmux.conf` 中配置：

```tmux
set -g extended-keys on
set -g extended-keys-format csi-u
```

然后完整重启 tmux：

```bash
tmux kill-server
tmux
```

详细终端设置见：

- `packages/coding-agent/docs/terminal-setup.md`
- `packages/coding-agent/docs/tmux.md`
- `packages/coding-agent/docs/keybindings.md`
