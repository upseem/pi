<a id="tmux-setup"></a>
# tmux 设置

Pi 可以在 tmux 里运行，但 tmux 默认会剥掉某些键的修饰信息。不配置时，`Shift+Enter` 和 `Ctrl+Enter` 通常与普通 `Enter` 无法区分。

<a id="recommended-configuration"></a>
## 推荐配置

写入 `~/.tmux.conf`：

```tmux
set -g extended-keys on
set -g extended-keys-format csi-u
```

然后完整重启 tmux：

```bash
tmux kill-server
tmux
```

当 Kitty 键盘协议不可用时，Pi 会自动请求扩展按键报告。配合 `extended-keys-format csi-u`，tmux 会以 CSI-u 格式转发带修饰键，这是最可靠的配置。`extended-keys-format` 选项需要 tmux 3.5 或更高版本。

<a id="why-csi-u-is-recommended"></a>
## 为什么推荐 `csi-u`

如果只有：

```tmux
set -g extended-keys on
```

tmux 默认使用 `extended-keys-format xterm`。应用请求扩展按键报告时，带修饰键会以 xterm `modifyOtherKeys` 格式转发，例如：

- `Ctrl+C` → `\x1b[27;5;99~`
- `Ctrl+D` → `\x1b[27;5;100~`
- `Ctrl+Enter` → `\x1b[27;5;13~`

使用 `extended-keys-format csi-u` 时，同样的键会转发为：

- `Ctrl+C` → `\x1b[99;5u`
- `Ctrl+D` → `\x1b[100;5u`
- `Ctrl+Enter` → `\x1b[13;5u`

Pi 两种格式都支持，但推荐的 tmux 配置是 `csi-u`。

<a id="what-this-fixes"></a>
## 这能修什么

没有 tmux 扩展按键时，带修饰的 Enter 会塌成旧序列：

| 按键 | 无 extkeys | 有 `csi-u` |
|-----|-----------------|--------------|
| Enter | `\r` | `\r` |
| Shift+Enter | `\r` | `\x1b[13;2u` |
| Ctrl+Enter | `\r` | `\x1b[13;5u` |
| Alt/Option+Enter | `\x1b\r` | `\x1b[13;3u` |

这会影响默认快捷键（`Enter` 提交、`Shift+Enter` 换行），以及任何使用带修饰 Enter 的自定义快捷键。

<a id="requirements"></a>
## 要求

- `extended-keys-format csi-u` 需要 tmux 3.5 或更高（用 `tmux -V` 检查）
- 支持扩展按键的终端模拟器（Ghostty、Kitty、iTerm2、WezTerm）

tmux 3.2 到 3.4 请省略 `extended-keys-format csi-u`；Pi 仍支持 tmux 默认的 xterm `modifyOtherKeys` 格式。
