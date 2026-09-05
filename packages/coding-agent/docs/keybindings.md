<a id="keybindings"></a>
# 快捷键

所有键盘快捷键都可通过 `~/.pi/agent/keybindings.json` 自定义。每个动作可以绑定一个或多个按键。

配置文件使用与 pi 内部相同、扩展作者在 `keyHint()` 和注入的 `keybindings` 管理器中使用的带命名空间 keybinding id。

使用未加命名空间的旧 id（例如 `cursorUp` 或 `expandTools`）的配置会在启动时自动迁移到带命名空间的 id。

编辑 `keybindings.json` 后，在 pi 中运行 `/reload` 即可应用更改，无需重启会话。

<a id="key-format"></a>
## 按键格式

`modifier+key`，修饰键为 `ctrl`、`shift`、`alt`、`super`（可组合），按键为：

- **字母：** `a-z`
- **数字：** `0-9`
- **特殊键：** `escape`、`esc`、`enter`、`return`、`tab`、`space`、`backspace`、`delete`、`insert`、`clear`、`home`、`end`、`pageUp`、`pageDown`、`up`、`down`、`left`、`right`
- **功能键：** `f1`-`f12`
- **符号：** `` ` ``、`-`、`=`、`[`、`]`、`\`、`;`、`'`、`,`、`.`、`/`、`!`、`@`、`#`、`$`、`%`、`^`、`&`、`*`、`(`、`)`、`_`、`+`、`|`、`~`、`{`、`}`、`:`、`<`、`>`、`?`

修饰键组合：`ctrl+shift+x`、`alt+ctrl+x`、`ctrl+shift+alt+x`、`super+k`、`ctrl+super+k`、`ctrl+1` 等。

`super` 绑定需要终端单独上报该修饰键，通常通过 Kitty keyboard protocol。没有该支持的终端可能无法使用。

<a id="all-actions"></a>
## 全部动作

<a id="tui-editor-cursor-movement"></a>
### TUI 编辑器光标移动

| Keybinding id | 默认 | 说明 |
|--------|---------|-------------|
| `tui.editor.cursorUp` | `up` | 光标上移；在顶部浏览更早的历史 |
| `tui.editor.cursorDown` | `down` | 光标下移；在底部浏览更新的历史 |
| `tui.editor.historyPrevious` | *（无）* | 选择上一条提示历史 |
| `tui.editor.historyNext` | *（无）* | 选择下一条提示历史 |
| `tui.editor.cursorLeft` | `left`、`ctrl+b` | 光标左移 |
| `tui.editor.cursorRight` | `right`、`ctrl+f` | 光标右移 |
| `tui.editor.cursorWordLeft` | `alt+left`、`ctrl+left`、`alt+b` | 按词左移 |
| `tui.editor.cursorWordRight` | `alt+right`、`ctrl+right`、`alt+f` | 按词右移 |
| `tui.editor.cursorLineStart` | `home`、`ctrl+home`、`ctrl+a` | 移到行首 |
| `tui.editor.cursorLineEnd` | `end`、`ctrl+end`、`ctrl+e` | 移到行尾 |
| `tui.editor.jumpForward` | `ctrl+]` | 向前跳到指定字符 |
| `tui.editor.jumpBackward` | `ctrl+alt+]` | 向后跳到指定字符 |
| `tui.editor.pageUp` | `pageUp`、`ctrl+pageUp` | 向上翻页 |
| `tui.editor.pageDown` | `pageDown`、`ctrl+pageDown` | 向下翻页 |

专用历史动作无论光标在多行提示中的位置如何，都会切换历史条目。主编辑器聚焦时，显式历史绑定优先于应用动作，因此把 `tui.editor.historyPrevious` 绑到 `ctrl+p` 会在该上下文覆盖模型循环，而不会改变选择器中的 `Ctrl+P`。

<a id="tui-editor-deletion"></a>
### TUI 编辑器删除

| Keybinding id | 默认 | 说明 |
|--------|---------|-------------|
| `tui.editor.deleteCharBackward` | `backspace` | 向后删除字符 |
| `tui.editor.deleteCharForward` | `delete`、`ctrl+d` | 向前删除字符 |
| `tui.editor.deleteWordBackward` | `ctrl+w`、`alt+backspace` | 向后删除单词 |
| `tui.editor.deleteWordForward` | `alt+d`、`alt+delete` | 向前删除单词 |
| `tui.editor.deleteToLineStart` | `ctrl+u` | 删除到行首 |
| `tui.editor.deleteToLineEnd` | `ctrl+k` | 删除到行尾 |

<a id="tui-input"></a>
### TUI 输入

| Keybinding id | 默认 | 说明 |
|--------|---------|-------------|
| `tui.input.newLine` | `shift+enter`、`ctrl+j` | 插入换行 |
| `tui.input.submit` | `enter` | 提交输入 |
| `tui.input.tab` | `tab` | Tab / 自动补全 |

<a id="tui-kill-ring"></a>
### TUI Kill Ring

| Keybinding id | 默认 | 说明 |
|--------|---------|-------------|
| `tui.editor.yank` | `ctrl+y` | 粘贴最近删除的文本 |
| `tui.editor.yankPop` | `alt+y` | yank 后循环已删除文本 |
| `tui.editor.undo` | `ctrl+-` | 撤销上次编辑 |

<a id="tui-clipboard-and-selection"></a>
### TUI 剪贴板与选择

| Keybinding id | 默认 | 说明 |
|--------|---------|-------------|
| `tui.input.copy` | `ctrl+c` | 复制选区 |
| `tui.select.up` | `up` | 选择上移 |
| `tui.select.down` | `down` | 选择下移 |
| `tui.select.pageUp` | `pageUp` | 列表向上翻页 |
| `tui.select.pageDown` | `pageDown` | 列表向下翻页 |
| `tui.select.confirm` | `enter` | 确认选择 |
| `tui.select.cancel` | `escape`、`ctrl+c` | 取消选择 |

<a id="tui-fullscreen-viewport"></a>
### TUI 全屏视口

这些动作在交互模式使用 `--tui-mode fullscreen` 时生效，作用于主 transcript 滚动区域。双指触控板和鼠标滚轮滚动指针下方的区域；若在固定的编辑器/状态/页脚停靠区上，则回退到 transcript。点击 OSC 8 超链接会用默认处理器打开。按住主键拖动可选中文本并复制到剪贴板；在 transcript 顶部或底部边缘按住会自动滚入屏幕外内容。向上滚动 transcript 后，底部一行会显示可点击的“跳到最新消息”标签，并标示 `tui.altScreen.bottom` 快捷键。终端相关的鼠标和触控板行为见 [终端设置](terminal-setup.md)。

全屏 transcript 绑定优先于编辑器绑定。因此默认的无修饰导航键在全屏模式控制 transcript，其 `ctrl` 变体继续控制编辑器。非全屏模式下，两种变体都控制编辑器。

transcript 搜索面板会显示已配置的上一个/下一个快捷键和可点击的箭头控件。再次按 `tui.altScreen.search`，或使用 `tui.altScreen.searchClose`，可关闭该面板。

| 按键 | 默认模式 | 全屏模式 |
|-----|--------------|-----------------|
| `home`、`end` | 编辑器 | Transcript |
| `ctrl+home`、`ctrl+end` | 编辑器 | 编辑器 |
| `pageUp`、`pageDown` | 编辑器 | Transcript |
| `ctrl+pageUp`、`ctrl+pageDown` | 编辑器 | 编辑器 |

该路由仍可通过普通动作绑定配置。例如 `"tui.altScreen.pageUp": "ctrl+pageUp"` 会让 `pageUp` 在全屏模式控制编辑器，`ctrl+pageUp` 控制 transcript。绑定 `tui.altScreen.halfPageUp` 和 `tui.altScreen.halfPageDown` 可半页滚动，绑定 `tui.altScreen.lineUp` 和 `tui.altScreen.lineDown` 可单行滚动。设置 `"tui.altScreen.pageUp": []` 会完全禁用该 transcript 快捷键。用户绑定会替换该动作的默认值。

| Keybinding id | 默认 | 说明 |
|--------|---------|-------------|
| `tui.altScreen.pageUp` | `pageUp` | 将 transcript 向上滚动一页 |
| `tui.altScreen.pageDown` | `pageDown` | 将 transcript 向下滚动一页 |
| `tui.altScreen.halfPageUp` | *（无）* | 将 transcript 向上滚动半页 |
| `tui.altScreen.halfPageDown` | *（无）* | 将 transcript 向下滚动半页 |
| `tui.altScreen.lineUp` | *（无）* | 将 transcript 向上滚动一行 |
| `tui.altScreen.lineDown` | *（无）* | 将 transcript 向下滚动一行 |
| `tui.altScreen.previousPrompt` | `ctrl+shift+up`、`ctrl+up` | 跳到上一条已标记消息 |
| `tui.altScreen.nextPrompt` | `ctrl+shift+down`、`ctrl+down` | 跳到下一条已标记消息 |
| `tui.altScreen.search` | `ctrl+shift+f` | 搜索已渲染的 transcript |
| `tui.altScreen.searchNext` | `enter`、`ctrl+g` | 搜索时选中下一个匹配 |
| `tui.altScreen.searchPrevious` | `shift+enter`、`ctrl+shift+g` | 搜索时选中上一个匹配 |
| `tui.altScreen.searchClose` | `escape` | 关闭 transcript 搜索 |
| `tui.altScreen.top` | `home` | 滚到 transcript 开头 |
| `tui.altScreen.bottom` | `end` | 滚到 transcript 末尾并跟随新输出 |

<a id="application"></a>
### 应用

| Keybinding id | 默认 | 说明 |
|--------|---------|-------------|
| `app.interrupt` | `escape` | 取消 / 中止 |
| `app.clear` | `ctrl+c` | 清空编辑器（第一次）/ 退出（第二次） |
| `app.exit` | `ctrl+d` | 退出（编辑器为空时） |
| `app.suspend` | `ctrl+z` | 挂起到后台 |
| `app.editor.external` | `ctrl+g` | 在外部编辑器中打开（`externalEditor`、`$VISUAL`、`$EDITOR` 或 `nano`） |
| `app.clipboard.pasteImage` | `ctrl+v` | 从剪贴板粘贴图片或文本 |

<a id="sessions"></a>
### 会话

| Keybinding id | 默认 | 说明 |
|--------|---------|-------------|
| `app.session.new` | *（无）* | 开始新会话（`/new`） |
| `app.session.tree` | *（无）* | 打开会话树导航（`/tree`） |
| `app.session.fork` | *（无）* | Fork 当前会话（`/fork`） |
| `app.session.resume` | *（无）* | 打开会话恢复选择器（`/resume`） |
| `app.session.togglePath` | `ctrl+p` | 切换路径显示 |
| `app.session.toggleSort` | `ctrl+s` | 切换排序模式 |
| `app.session.toggleNamedFilter` | `ctrl+n` | 切换仅显示已命名会话的过滤 |
| `app.session.rename` | `ctrl+r` | 重命名会话 |
| `app.session.delete` | `ctrl+d` | 删除会话 |
| `app.session.deleteNoninvasive` | `ctrl+backspace` | 查询为空时删除会话 |

<a id="models-and-thinking"></a>
### 模型与思考

| Keybinding id | 默认 | 说明 |
|--------|---------|-------------|
| `app.model.select` | `ctrl+l` | 打开模型选择器 |
| `app.model.cycleForward` | `ctrl+p` | 循环到下一个模型 |
| `app.model.cycleBackward` | `shift+ctrl+p` | 循环到上一个模型 |
| `app.models.save` | `ctrl+s` | 把选中的默认模型或限定模型配置保存到设置 |
| `app.thinking.cycle` | `shift+tab` | 循环思考级别 |
| `app.thinking.save` | `ctrl+s` | 把当前思考级别保存到设置 |
| `app.thinking.toggle` | `ctrl+t` | 折叠或展开思考块 |

<a id="display-and-message-queue"></a>
### 显示与消息队列

| Keybinding id | 默认 | 说明 |
|--------|---------|-------------|
| `app.tools.expand` | `ctrl+o` | 折叠或展开工具输出 |
| `app.message.copy` | `ctrl+x` | 在 `/tree` 中复制选中的消息；其他情况下复制上一条助手消息，或在禁用 `fullscreenCopyOnSelect` 时复制当前全屏文本选区 |
| `app.message.followUp` | `alt+enter` | 排队后续消息 |
| `app.message.dequeue` | `alt+up` | 把已排队消息恢复到编辑器 |

<a id="tree-navigation"></a>
### 树导航

| Keybinding id | 默认 | 说明 |
|--------|---------|-------------|
| `app.tree.foldOrUp` | `ctrl+left`、`alt+left` | 折叠当前分支段，或跳到上一段起点 |
| `app.tree.unfoldOrDown` | `ctrl+right`、`alt+right` | 展开当前分支段，或跳到下一段起点或分支末尾 |
| `app.tree.editLabel` | `shift+l` | 编辑选中树节点的标签 |
| `app.tree.toggleLabelTimestamp` | `shift+t` | 切换树中的标签时间戳 |
| `app.tree.filter.default` | `ctrl+d` | 将树过滤设为默认视图 |
| `app.tree.filter.noTools` | `ctrl+t` | 切换隐藏工具结果的树过滤 |
| `app.tree.filter.userOnly` | `ctrl+u` | 切换仅显示用户消息的树过滤 |
| `app.tree.filter.labeledOnly` | `ctrl+l` | 切换仅显示已标记条目的树过滤 |
| `app.tree.filter.all` | `ctrl+a` | 切换显示全部条目的树过滤 |
| `app.tree.filter.cycleForward` | `ctrl+o` | 向前循环树过滤 |
| `app.tree.filter.cycleBackward` | `shift+ctrl+o` | 向后循环树过滤 |

<a id="scoped-models-selector"></a>
### 限定模型选择器

用于限定模型选择器（通过 `/scoped-models` 打开）。

| Keybinding id | 默认 | 说明 |
|--------|---------|-------------|
| `app.models.enableAll` | `ctrl+a` | 启用全部模型（或当前搜索匹配的全部模型） |
| `app.models.clearAll` | `ctrl+x` | 清除全部模型（或当前搜索匹配的全部模型） |
| `app.models.toggleProvider` | `ctrl+p` | 切换当前提供商的全部模型 |
| `app.models.reorderUp` | `alt+up` | 将选中模型在循环顺序中上移 |
| `app.models.reorderDown` | `alt+down` | 将选中模型在循环顺序中下移 |

<a id="custom-configuration"></a>
## 自定义配置

创建 `~/.pi/agent/keybindings.json`：

```json
{
  "tui.editor.historyPrevious": "ctrl+p",
  "tui.editor.historyNext": "ctrl+n",
  "tui.editor.deleteWordBackward": ["ctrl+w", "alt+backspace"]
}
```

每个动作可以是单个按键或按键数组。用户配置覆盖默认值。

<a id="emacs-example"></a>
### Emacs 示例

```json
{
  "tui.editor.historyPrevious": "ctrl+p",
  "tui.editor.historyNext": "ctrl+n",
  "tui.editor.cursorLeft": ["left", "ctrl+b"],
  "tui.editor.cursorRight": ["right", "ctrl+f"],
  "tui.editor.cursorWordLeft": ["alt+left", "alt+b"],
  "tui.editor.cursorWordRight": ["alt+right", "alt+f"],
  "tui.editor.deleteCharForward": ["delete", "ctrl+d"],
  "tui.editor.deleteCharBackward": ["backspace", "ctrl+h"],
  "tui.input.newLine": ["shift+enter", "ctrl+j"]
}
```

<a id="vim-example"></a>
### Vim 示例

```json
{
  "tui.editor.cursorUp": ["up", "alt+k"],
  "tui.editor.cursorDown": ["down", "alt+j"],
  "tui.editor.cursorLeft": ["left", "alt+h"],
  "tui.editor.cursorRight": ["right", "alt+l"],
  "tui.editor.cursorWordLeft": ["alt+left", "alt+b"],
  "tui.editor.cursorWordRight": ["alt+right", "alt+w"]
}
```
