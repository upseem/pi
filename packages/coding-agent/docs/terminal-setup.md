<a id="terminal-setup"></a>
# 终端设置

Pi 使用 [Kitty keyboard protocol](https://sw.kovidgoyal.net/kitty/keyboard-protocol/) 以可靠检测修饰键。多数现代终端支持该协议，但有些需要配置。

<a id="capability-overrides"></a>
## 能力覆盖

Pi 会自动检测 OSC 8 超链接、行内图片协议和真彩色。若因终端代理或多路复用器导致检测失败，可使用这些高级覆盖：

| 能力 | 环境变量 | JSON 设置 |
|------------|----------------------|--------------|
| OSC 8 超链接 | `PI_HYPERLINKS=1\|0\|auto` | `terminal.hyperlinks: true\|false\|"auto"` |
| 行内图片 | `PI_IMAGE_PROTOCOL=kitty\|iterm2\|none\|auto` | `terminal.images: "kitty"\|"iterm2"\|false\|"auto"` |
| 真彩色 | `PI_TRUE_COLOR=1\|0\|auto` | `terminal.trueColor: true\|false\|"auto"` |

设置优先于环境变量；未设置或为 `auto` 时保留自动检测。只强制开启完整终端路径都支持的能力，因为不支持的转义序列会破坏渲染。

<a id="kitty"></a>
## Kitty

开箱即用。

<a id="iterm2"></a>
## iTerm2

<a id="regular-tui-mode"></a>
### 普通 TUI 模式

开箱即用。

<a id="fullscreen-tui-mode"></a>
### 全屏 TUI 模式

Pi 接管视口，因此 iTerm2 会发送鼠标滚轮报告，而不是滚动其原生回滚缓冲区。在 iTerm2 默认的快速触控板行为下，这些报告可能丢失加速滚轮的大部分增量，使全屏滚动明显慢于普通滚动。

若全屏模式下快速滚轮手势一次只移动大约一行：

1. 打开 **iTerm2 → Settings → Advanced**。
2. 搜索 **Trackpad scrolls fast?** 并将其设为 **No**。

这是 iTerm2 全局变通，也可能改变原生触控板滚动。底层行为见 [iTerm2 issue 9619](https://gitlab.com/gnachman/iterm2/-/work_items/9619)。

<a id="apple-terminal"></a>
## Apple Terminal

可用时，Pi 会启用增强按键报告。若 Terminal.app 对 `Shift+Enter` 仍发送普通 Return，pi 会使用本地 macOS 修饰键回退，将该 Return 视为 `Shift+Enter`。

此回退仅在 pi 与 Terminal.app 运行在同一台 Mac 上时有效。通过远程 SSH 无法检测本地键盘。

<a id="ghostty"></a>
## Ghostty

添加到 Ghostty 配置（macOS 上为 `~/Library/Application Support/com.mitchellh.ghostty/config`，Linux 上为 `~/.config/ghostty/config`）：

```
keybind = alt+backspace=text:\x1b\x7f
```

较旧的 Claude Code 版本可能添加过这个 Ghostty 映射：

```
keybind = shift+enter=text:\n
```

该映射发送原始换行字节。在 pi 内部，这与 `Ctrl+J` 无法区分，因此 tmux 和 pi 都看不到真正的 `shift+enter` 按键事件。

如果添加该映射只是为了 Claude Code 2.x 或更新版本，可以删掉它；除非你要在 tmux 中使用 Claude Code，那种情况仍需要该 Ghostty 映射。

Pi 将 `Ctrl+J` 绑定为默认换行别名，因此在 tmux 中 `Shift+Enter` 可通过该重映射继续工作，无需额外的 pi 配置。

<a id="fullscreen-tui-mode-1"></a>
### 全屏 TUI 模式

全屏模式下链接仍可点击，但 pi 捕获鼠标输入时，Ghostty 不会显示悬停下划线或左下角 URL 预览。在 macOS 上按住 `Shift+Command`，在 Linux 上按住 `Shift+Ctrl`，可使用 Ghostty 的原生链接处理。

<a id="wezterm"></a>
## WezTerm

WezTerm 通常通过 xterm modifyOtherKeys 对 `Shift+Enter` 开箱即用。若要显式使用 Kitty keyboard protocol，创建 `~/.wezterm.lua`：

```lua
local wezterm = require 'wezterm'
local config = wezterm.config_builder()
config.enable_kitty_keyboard = true
return config
```

在 macOS 上，WezTerm 默认将 `Option+Enter` 绑定为全屏。若要用 `Option+Enter` 做 pi 的 follow-up 入队，添加此按键覆盖：

```lua
local wezterm = require 'wezterm'
local config = wezterm.config_builder()
config.keys = {
  {
    key = 'Enter',
    mods = 'ALT',
    action = wezterm.action.SendString('\x1b[13;3u'),
  },
}
return config
```

如果已有 `config.keys` 表，把该条目加进去即可。

在 WSL 上，WezTerm 可能需要可见的硬件光标来定位 IME 候选窗口。若 CJK IME 候选不跟随文本光标，运行 pi 前设置 `PI_HARDWARE_CURSOR=1`，或在设置中将 `showHardwareCursor` 设为 `true`。

<a id="alacritty"></a>
## Alacritty

Alacritty 通常对 `Shift+Enter` 开箱即用。在 macOS 上，`Option+Enter` 可能变成普通 `Enter`。若要用 `Option+Enter` 做 pi 的 follow-up 入队，添加到 `~/.config/alacritty/alacritty.toml`：

```toml
[[keyboard.bindings]]
key = "Enter"
mods = "Alt"
chars = "\u001b[13;3u"
```

更改配置后重启 Alacritty。

<a id="vs-code-integrated-terminal"></a>
## VS Code（集成终端）

VS Code 1.109.5 及更新版本默认在集成终端启用 Kitty keyboard protocol，因此 `Shift+Enter` 应开箱即用。

低于 1.109.5 的 VS Code 需要为 `Shift+Enter` 显式配置终端按键绑定。

`keybindings.json` 位置：
- macOS: `~/Library/Application Support/Code/User/keybindings.json`
- Linux: `~/.config/Code/User/keybindings.json`

添加到 `keybindings.json`：

```json
{
  "key": "shift+enter",
  "command": "workbench.action.terminal.sendSequence",
  "args": { "text": "\u001b[13;2u" },
  "when": "terminalFocus"
}
```

<a id="xfce4-terminal-terminator"></a>
## xfce4-terminal、terminator

这些终端对转义序列的支持有限。`Ctrl+Enter` 和 `Shift+Enter` 等带修饰的 Enter 无法与普通 `Enter` 区分，因此 `submit: ["ctrl+enter"]` 这类自定义按键绑定无法工作。

为获得最佳体验，请使用支持 Kitty keyboard protocol 的终端：
- [Kitty](https://sw.kovidgoyal.net/kitty/)
- [Ghostty](https://ghostty.org/)
- [WezTerm](https://wezfurlong.org/wezterm/)
- [iTerm2](https://iterm2.com/)
- [Alacritty](https://github.com/alacritty/alacritty)（需要以 Kitty 协议支持编译）

<a id="intellij-idea-integrated-terminal"></a>
## IntelliJ IDEA（集成终端）

内置终端对转义序列的支持有限。在 IntelliJ 终端中无法区分 Shift+Enter 与 Enter。

若希望显示硬件光标，运行 pi 前设置 `PI_HARDWARE_CURSOR=1`（为兼容性默认关闭）。

建议使用独立终端模拟器以获得最佳体验。
