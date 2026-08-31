> pi 可以创建主题。让它按你的环境生成一份即可。

<a id="themes"></a>
# 主题

主题是定义 TUI 颜色的 JSON 文件。

<a id="table-of-contents"></a>
## 目录

- [位置](#locations)
- [选择主题](#selecting-a-theme)
- [创建自定义主题](#creating-a-custom-theme)
- [主题格式](#theme-format)
- [颜色 Token](#color-tokens)
- [颜色值](#color-values)
- [提示](#tips)

<a id="locations"></a>
## 位置

Pi 从以下位置加载主题：

- 内置：`dark`、`light`
- 全局：`~/.pi/agent/themes/*.json`
- 项目：`.pi/themes/*.json`（仅在项目已信任后）
- 包：`themes/` 目录，或 `package.json` 中的 `pi.themes` 条目
- 设置：`themes` 数组，可包含文件或目录
- CLI：`--theme <path>`（可重复）

使用 `--no-themes` 可关闭发现。

<a id="selecting-a-theme"></a>
## 选择主题

通过 `/settings` 或在 `settings.json` 中选择主题：

```json
{
  "theme": "my-theme"
}
```

首次运行时，pi 会检测终端背景，并默认使用 `dark` 或 `light`。

<a id="initial-theme"></a>
### 初始主题

在不改动已保存设置的情况下，为本次交互运行指定主题：

```bash
pi --use-theme light
```

要跟随终端外观，使用 `lightTheme/darkTheme` 语法：

```bash
pi --use-theme light/dark
```

该 CLI 值只作为本次运行的初始主题。之后在 `/settings` 中另选主题会立即生效，并按常规方式保存。

<a id="creating-a-custom-theme"></a>
## 创建自定义主题

1. 创建主题文件：

```bash
mkdir -p ~/.pi/agent/themes
vim ~/.pi/agent/themes/my-theme.json
```

2. 定义主题并填写全部必填颜色（见 [颜色 Token](#color-tokens)）：

```json
{
  "$schema": "https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/src/modes/interactive/theme/theme-schema.json",
  "name": "my-theme",
  "vars": {
    "primary": "#00aaff",
    "secondary": 242
  },
  "colors": {
    "accent": "primary",
    "border": "primary",
    "borderAccent": "#00ffff",
    "borderMuted": "secondary",
    "success": "#00ff00",
    "error": "#ff0000",
    "warning": "#ffff00",
    "muted": "secondary",
    "dim": 240,
    "text": "",
    "thinkingText": "secondary",
    "selectedBg": "#2d2d30",
    "scrollbarThumb": "#555566",
    "searchMatchBg": "#2d2d30",
    "searchMatchText": "",
    "userMessageBg": "#2d2d30",
    "userMessageText": "",
    "customMessageBg": "#2d2d30",
    "customMessageText": "",
    "customMessageLabel": "primary",
    "toolPendingBg": "#1e1e2e",
    "toolSuccessBg": "#1e2e1e",
    "toolErrorBg": "#2e1e1e",
    "toolTitle": "primary",
    "toolOutput": "",
    "mdHeading": "#ffaa00",
    "mdLink": "primary",
    "mdLinkUrl": "secondary",
    "mdCode": "#00ffff",
    "mdCodeBlock": "",
    "mdCodeBlockBorder": "secondary",
    "mdQuote": "secondary",
    "mdQuoteBorder": "secondary",
    "mdHr": "secondary",
    "mdListBullet": "#00ffff",
    "toolDiffAdded": "#00ff00",
    "toolDiffRemoved": "#ff0000",
    "toolDiffContext": "secondary",
    "syntaxComment": "secondary",
    "syntaxKeyword": "primary",
    "syntaxFunction": "#00aaff",
    "syntaxVariable": "#ffaa00",
    "syntaxString": "#00ff00",
    "syntaxNumber": "#ff00ff",
    "syntaxType": "#00aaff",
    "syntaxOperator": "primary",
    "syntaxPunctuation": "secondary",
    "thinkingOff": "secondary",
    "thinkingMinimal": "primary",
    "thinkingLow": "#00aaff",
    "thinkingMedium": "#00ffff",
    "thinkingHigh": "#ff00ff",
    "thinkingXhigh": "#ff0000",
    "thinkingMax": "#ff0088",
    "bashMode": "#ffaa00"
  }
}
```

3. 通过 `/settings` 选择该主题。

**热重载：** 编辑当前生效的自定义主题文件时，pi 会自动重新加载，以便立即看到效果。

<a id="theme-format"></a>
## 主题格式

```json
{
  "$schema": "https://raw.githubusercontent.com/earendil-works/pi/main/packages/coding-agent/src/modes/interactive/theme/theme-schema.json",
  "name": "my-theme",
  "vars": {
    "blue": "#0066cc",
    "gray": 242
  },
  "colors": {
    "accent": "blue",
    "muted": "gray",
    "text": "",
    ...
  }
}
```

- `name` 必填，必须唯一，且不能包含 `/`。
- `vars` 可选。在此定义可复用颜色，再在 `colors` 中引用。
- `colors` 必须定义全部 51 个必填 token。`thinkingMax`、`scrollbarThumb` 以及两个搜索高亮 token 为可选，回退规则见下文。

`$schema` 字段可启用编辑器自动补全与校验。

<a id="color-tokens"></a>
## 颜色 Token

每个主题必须定义全部 51 个必填颜色 token。可选 token 用于兼容已有主题：`thinkingMax` 回退到 `thinkingXhigh`，`scrollbarThumb` 和 `searchMatchBg` 回退到 `selectedBg`，`searchMatchText` 回退到 `text`。其他搜索匹配使用 `searchMatchBg` 上的 `searchMatchText` 并加下划线；当前匹配则对调该前景/背景，并使用粗体。

<a id="core-ui-11-colors"></a>
### 核心 UI（11 色）

| Token | 用途 |
|-------|---------|
| `accent` | 主强调色（logo、选中项、光标） |
| `border` | 普通边框 |
| `borderAccent` | 高亮边框 |
| `borderMuted` | 弱边框（编辑器） |
| `success` | 成功状态 |
| `error` | 错误状态 |
| `warning` | 警告状态 |
| `muted` | 次要文本 |
| `dim` | 第三级文本 |
| `text` | 默认文本（通常为 `""`） |
| `thinkingText` | 思考块文本 |

<a id="backgrounds--content-11-required-3-optional"></a>
### 背景与内容（11 个必填，3 个可选）

| Token | 用途 |
|-------|---------|
| `selectedBg` | 选中行背景 |
| `scrollbarThumb` | 全屏滚动条滑块背景；可选，回退到 `selectedBg` |
| `searchMatchBg` | 会话搜索匹配背景，以及当前匹配的文本色；可选，回退到 `selectedBg` |
| `searchMatchText` | 会话搜索匹配文本，以及当前匹配的背景色；可选，回退到 `text` |
| `userMessageBg` | 用户消息背景 |
| `userMessageText` | 用户消息文本 |
| `customMessageBg` | 扩展消息背景 |
| `customMessageText` | 扩展消息文本 |
| `customMessageLabel` | 扩展消息标签 |
| `toolPendingBg` | 工具框（进行中） |
| `toolSuccessBg` | 工具框（成功） |
| `toolErrorBg` | 工具框（错误） |
| `toolTitle` | 工具标题 |
| `toolOutput` | 工具输出文本 |

<a id="markdown-10-colors"></a>
### Markdown（10 色）

| Token | 用途 |
|-------|---------|
| `mdHeading` | 标题 |
| `mdLink` | 链接文本 |
| `mdLinkUrl` | 链接 URL |
| `mdCode` | 行内代码 |
| `mdCodeBlock` | 代码块内容 |
| `mdCodeBlockBorder` | 代码块围栏 |
| `mdQuote` | 引用文本 |
| `mdQuoteBorder` | 引用边框 |
| `mdHr` | 分隔线 |
| `mdListBullet` | 列表项目符号 |

<a id="tool-diffs-3-colors"></a>
### 工具 Diff（3 色）

| Token | 用途 |
|-------|---------|
| `toolDiffAdded` | 新增行 |
| `toolDiffRemoved` | 删除行 |
| `toolDiffContext` | 上下文行 |

<a id="syntax-highlighting-9-colors"></a>
### 语法高亮（9 色）

| Token | 用途 |
|-------|---------|
| `syntaxComment` | 注释 |
| `syntaxKeyword` | 关键字 |
| `syntaxFunction` | 函数名 |
| `syntaxVariable` | 变量 |
| `syntaxString` | 字符串 |
| `syntaxNumber` | 数字 |
| `syntaxType` | 类型 |
| `syntaxOperator` | 运算符 |
| `syntaxPunctuation` | 标点 |

<a id="thinking-level-borders-6-required-1-optional"></a>
### 思考级别边框（6 个必填，1 个可选）

编辑器边框颜色，用于表示思考级别（从弱到强）：

| Token | 用途 |
|-------|---------|
| `thinkingOff` | 关闭思考 |
| `thinkingMinimal` | 最低思考 |
| `thinkingLow` | 低思考 |
| `thinkingMedium` | 中等思考 |
| `thinkingHigh` | 高思考 |
| `thinkingXhigh` | 更高思考 |
| `thinkingMax` | 最高思考；可选，回退到 `thinkingXhigh` |

<a id="bash-mode-1-color"></a>
### Bash 模式（1 色）

| Token | 用途 |
|-------|---------|
| `bashMode` | bash 模式下的编辑器边框（`!` 前缀） |

<a id="html-export-optional"></a>
### HTML 导出（可选）

`export` 段控制 `/export` HTML 输出的颜色。若省略，颜色从 `userMessageBg` 推导。

```json
{
  "export": {
    "pageBg": "#18181e",
    "cardBg": "#1e1e24",
    "infoBg": "#3c3728"
  }
}
```

<a id="color-values"></a>
## 颜色值

支持四种格式：

| 格式 | 示例 | 说明 |
|--------|---------|-------------|
| Hex | `"#ff0000"` | 6 位十六进制 RGB |
| 256-color | `39` | xterm 256 色调色板索引（0-255） |
| Variable | `"primary"` | 引用 `vars` 中的条目 |
| Default | `""` | 终端默认颜色 |

<a id="256-color-palette"></a>
### 256 色调色板

- `0-15`：基本 ANSI 颜色（取决于终端）
- `16-231`：6×6×6 RGB 立方体（`16 + 36×R + 6×G + B`，其中 R、G、B 为 0-5）
- `232-255`：灰度渐变

<a id="terminal-compatibility"></a>
### 终端兼容性

Pi 使用 24-bit RGB 颜色。多数现代终端支持（iTerm2、Kitty、WezTerm、VS Code）。仅支持 256 色的旧终端上，pi 会回退到最接近的近似色。

检查 truecolor 支持：

```bash
echo $COLORTERM  # 应输出 "truecolor" 或 "24bit"
```

<a id="tips"></a>
## 提示

**深色终端：** 使用更亮、饱和度更高、对比更强的颜色。

**浅色终端：** 使用更暗、更柔和、对比更低的颜色。

**配色和谐：** 从一套基础色板开始（Nord、Gruvbox、Tokyo Night），在 `vars` 中定义，并保持一致引用。

**测试：** 用不同类型的消息、工具状态、markdown 内容以及长换行文本检查主题。

**VS Code：** 将 `terminal.integrated.minimumContrastRatio` 设为 `1`，以获得准确颜色。

<a id="examples"></a>
## 示例

参见内置主题：
- [dark.json](../src/modes/interactive/theme/dark.json)
- [light.json](../src/modes/interactive/theme/light.json)
