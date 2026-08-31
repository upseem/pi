<a id="termux-android-setup"></a>
# Termux（Android）设置

Pi 可通过 [Termux](https://termux.dev/) 在 Android 上运行。Termux 是 Android 上的终端模拟器和 Linux 环境。

<a id="prerequisites"></a>
## 前置条件

1. 从 GitHub 或 F-Droid 安装 [Termux](https://github.com/termux/termux-app#installation)（不要用 Google Play，该版本已弃用）
2. 从 GitHub 或 F-Droid 安装 [Termux:API](https://github.com/termux/termux-api#installation)，用于剪贴板及其他设备集成

<a id="installation"></a>
## 安装

```bash
# 更新软件包
pkg update && pkg upgrade

# 安装依赖
pkg install nodejs termux-api git

# 安装 pi
npm install -g --ignore-scripts @earendil-works/pi-coding-agent

# 创建配置目录
mkdir -p ~/.pi/agent

# 运行 pi
pi
```

<a id="clipboard-support"></a>
## 剪贴板支持

在 Termux 中运行时，剪贴板操作使用 `termux-clipboard-set` 和 `termux-clipboard-get`。这些命令需要已安装 Termux:API 应用。

Termux 不支持图片剪贴板（`ctrl+v` 粘贴图片功能不可用）。

<a id="example-agentsmd-for-termux"></a>
## Termux 的 AGENTS.md 示例

创建 `~/.pi/agent/AGENTS.md`，帮助代理理解 Termux 环境：

````markdown
# Agent Environment: Termux on Android

## Location
- **OS**: Android (Termux terminal emulator)
- **Home**: `/data/data/com.termux/files/home`
- **Prefix**: `/data/data/com.termux/files/usr`
- **Shared storage**: `/storage/emulated/0` (Downloads, Documents, etc.)

## Opening URLs
```bash
termux-open-url "https://example.com"
```

## Opening Files
```bash
termux-open file.pdf          # Opens with default app
termux-open --chooser image.jpg      # Choose app
```

## Clipboard
```bash
termux-clipboard-set "text"   # Copy
termux-clipboard-get          # Paste
```

## Notifications
```bash
termux-notification -t "Title" -c "Content"
```

## Device Info
```bash
termux-battery-status         # Battery info
termux-wifi-connectioninfo    # WiFi info
termux-telephony-deviceinfo   # Device info
```

## Sharing
```bash
termux-share -a send file.txt # Share file
```

## Other Useful Commands
```bash
termux-toast "message"        # Quick toast popup
termux-vibrate                # Vibrate device
termux-tts-speak "hello"      # Text to speech
termux-camera-photo out.jpg   # Take photo
```

## Notes
- Termux:API app must be installed for `termux-*` commands
- Use `pkg install termux-api` for the command-line tools
- Storage permission needed for `/storage/emulated/0` access
````

<a id="limitations"></a>
## 限制

- **无图片剪贴板**：Termux 剪贴板 API 只支持文本
- **无原生二进制**：部分可选原生依赖（如剪贴板模块）在 Android ARM64 上不可用，安装时会跳过
- **存储访问**：要访问 `/storage/emulated/0`（Downloads 等）中的文件，需先运行一次 `termux-setup-storage` 授予权限

<a id="troubleshooting"></a>
## 故障排除

<a id="clipboard-not-working"></a>
### 剪贴板不可用

确保两个应用都已安装：
1. Termux（来自 GitHub 或 F-Droid）
2. Termux:API（来自 GitHub 或 F-Droid）

然后安装 CLI 工具：
```bash
pkg install termux-api
```

<a id="permission-denied-for-shared-storage"></a>
### 共享存储权限被拒绝

运行一次以授予存储权限：
```bash
termux-setup-storage
```

<a id="nodejs-installation-issues"></a>
### Node.js 安装问题

若 npm 失败，尝试清理缓存：
```bash
npm cache clean --force
```
