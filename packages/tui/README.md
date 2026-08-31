<a id="earendil-workspi-tui"></a>
# @earendil-works/pi-tui

精简的终端 UI 框架，提供差分渲染和同步输出，用于无闪烁的交互式 CLI 应用。

<a id="features"></a>
## 特性

- **可互换渲染器**：共享 `TUI` 接口，提供主屏幕与备用屏幕两种实现
- **差分渲染**：只更新变化的行或视口行
- **应用自管滚动**：备用屏幕视口支持鼠标、触控板和键盘导航
- **同步输出**：使用 CSI 2026 做原子屏幕更新（无闪烁）
- **括号粘贴模式**：正确处理大段粘贴，超过 10 行时使用标记
- **基于组件**：简单的 Component 接口，带 `render()` 方法
- **主题支持**：组件接受主题接口，可自定义样式
- **内置组件**：Text、TruncatedText、Input、Editor、Markdown、Loader、SelectList、SettingsList、Spacer、Image、Box、Container、VStack、HStack、ScrollView
- **行内图片**：在支持 Kitty 或 iTerm2 图形协议的终端中渲染图片
- **自动补全**：文件路径与斜杠命令

<a id="quick-start"></a>
## 快速开始

```typescript
import { type TUI, Text, Editor, ProcessTerminal, TuiMainScreen, matchesKey } from "@earendil-works/pi-tui";

// 创建终端
const terminal = new ProcessTerminal();

// 通过共享 TUI 接口创建默认的主屏幕渲染器
const tui: TUI = new TuiMainScreen(terminal);

// 添加组件
tui.addChild(new Text("Welcome to my app!"));

import { defaultEditorTheme as editorTheme } from './test/test-themes.ts';
const editor = new Editor(tui, editorTheme);
editor.onSubmit = (text) => {
  console.log("Submitted:", text);
  tui.addChild(new Text(`You said: ${text}`));
};
tui.addChild(editor);

// 聚焦编辑器，使其接收键盘输入
tui.setFocus(editor);

// raw 模式下 Ctrl+C 不会发送 SIGINT —— 在这里拦截以允许退出
tui.addInputListener((data) => {
  if (matchesKey(data, 'ctrl+c')) {
    tui.stop();
    process.exit(0);
  }
});

// 启动
tui.start();
```

<a id="core-api"></a>
## 核心 API

<a id="tui-interface-and-renderers"></a>
### TUI 接口与渲染器

`TUI` 是共享接口，覆盖组件管理、焦点、浮层、输入、生命周期、终端查询和渲染。只在构造应用时选择具体渲染器：

- `TuiMainScreen` 渲染到主终端缓冲区，并保留终端回滚。
- `TuiAltScreen` 在备用终端缓冲区中渲染固定高度视口，由应用自管滚动。停止时会恢复主缓冲区，并打印完整的最终文档。

```typescript
import { type TUI, TuiAltScreen, TuiMainScreen } from "@earendil-works/pi-tui";

const tui: TUI = new TuiMainScreen(terminal);
// 若要改用备用终端缓冲区中由应用自管的视口：
// const tui: TUI = new TuiAltScreen(terminal);

tui.addChild(component);
tui.removeChild(component);
tui.start();
tui.stop();
tui.requestRender(); // 请求重新渲染

// 全局调试快捷键（Shift+Ctrl+D）
tui.onDebug = () => console.log("Debug triggered");
```

<a id="alternate-screen-viewport-layouts"></a>
### 备用屏幕视口布局

`TuiAltScreen` 可以渲染明确按终端高度划分的布局。`VStack` 和 `HStack` 分配受约束区域，`ScrollView` 负责其中一个区域的滚动。这些语义有意不提供给 `TuiMainScreen`，因为后者由终端管理回滚。

```typescript
import {
  Container,
  isViewportTUI,
  ScrollView,
  Text,
  VStack,
} from "@earendil-works/pi-tui";

const transcript = new Container();
transcript.addChild(new Text("History"));

const editorAndFooter = new VStack([
  editor,
  new Text("status"),
]);

if (isViewportTUI(tui)) {
  tui.setLayoutRoot(new VStack([
    {
      component: new ScrollView(transcript, {
        follow: "end",
        primary: true,
        overscroll: "chain",
      }),
      basis: 0,
      grow: 1,
      minSize: 1,
    },
    {
      component: editorAndFooter,
      basis: "auto",
      shrink: 1,
      minSize: 1,
    },
  ]));
}
```

栈条目支持 `basis`、`grow`、`shrink`、`minSize`、`maxSize`，以及响应式 `visible` 回调。鼠标滚轮默认作用于指针下的滚动视图，未消耗的增量会链式传递给外层滚动视图。主滚动视图接收备用屏幕的键盘导航动作，以及落在不可滚动区域上的滚轮输入。它也可以在 OSC 133 语义提示标记之间跳转，与常见终端提示导航快捷键一致。按 `Ctrl+Shift+F` 搜索其渲染内容，`Enter`/`Ctrl+G` 和 `Shift+Enter`/`Ctrl+Shift+G` 在匹配项之间移动，`Escape` 关闭搜索。`TuiAltScreenOptions.searchMatchStyle` 和 `searchCurrentMatchStyle` 可自定义匹配高亮。

每次请求帧都会重建布局几何。有状态组件会被保留，其已有的渲染行缓存仍然有效。直接对这些布局组件调用 `render(width)` 会生成无界文档，备用模式恢复主屏幕时也会用到它。

<a id="overlays"></a>
### 浮层

浮层在现有内容之上渲染组件，而不会替换底层内容。适用于对话框、菜单和模态 UI。

```typescript
// 以默认选项显示浮层（居中，最多 80 列）
const handle = tui.showOverlay(component);

// 以自定义定位和尺寸显示浮层
// 值可以是数字（绝对）或百分比字符串（例如 "50%"）
const handle = tui.showOverlay(component, {
  // 尺寸
  width: 60,              // 固定列宽
  width: "80%",           // 相对终端宽度的百分比
  minWidth: 40,           // 最小宽度下限
  maxHeight: 20,          // 最大行高
  maxHeight: "50%",       // 相对终端高度的百分比

  // 基于锚点的定位（默认：'center'）
  anchor: 'bottom-right', // 相对锚点定位
  offsetX: 2,             // 相对锚点的水平偏移
  offsetY: -1,            // 相对锚点的垂直偏移

  // 基于百分比的定位（锚点的替代方案）
  row: "25%",             // 垂直位置（0%=顶部，100%=底部）
  col: "50%",             // 水平位置（0%=左侧，100%=右侧）

  // 绝对定位（覆盖锚点/百分比）
  row: 5,                 // 精确行位置
  col: 10,                // 精确列位置

  // 距终端边缘的边距
  margin: 2,              // 四边
  margin: { top: 1, right: 2, bottom: 1, left: 2 },

  // 响应式可见性
  visible: (termWidth, termHeight) => termWidth >= 100  // 窄终端上隐藏

  // 焦点行为
  nonCapturing: true       // 显示时不自动聚焦
});

// OverlayHandle 方法
handle.hide();              // 永久移除浮层
handle.setHidden(true);     // 临时隐藏（可以再显示）
handle.setHidden(false);    // 隐藏后再显示
handle.isHidden();          // 检查是否临时隐藏
handle.focus();             // 聚焦并提到视觉最前
handle.unfocus();           // 把焦点交还给常规回退目标
handle.unfocus({ target: baseComponent }); // 把该浮层的焦点交给指定组件
handle.unfocus({ target: null });   // 释放该浮层焦点并保持无焦点
handle.isFocused();         // 检查浮层是否拥有焦点

handle.unfocus();
// 浮层失去焦点；TUI 回退到另一个可见的捕获型浮层，或先前的焦点目标。

handle.unfocus({ target: null });
// 浮层失去焦点；在再次设置焦点前，没有组件接收输入。

// 已聚焦且可见的浮层会在临时替换 UI 释放焦点后重新夺取键盘输入。
// 若希望在浮层仍可见时让某个组件接收输入，调用 handle.unfocus({ target: component })。

// 隐藏最顶层浮层
tui.hideOverlay();

// 检查是否有任何可见浮层处于活动状态
tui.hasOverlay();
```

**锚点取值**：`'center'`、`'top-left'`、`'top-right'`、`'bottom-left'`、`'bottom-right'`、`'top-center'`、`'bottom-center'`、`'left-center'`、`'right-center'`

**解析顺序**：
1. 计算宽度后，`minWidth` 作为下限生效
2. 位置：绝对 `row`/`col` > 百分比 `row`/`col` > `anchor`
3. `margin` 会钳制最终位置，使其保持在终端边界内
4. `visible` 回调控制浮层是否渲染（每帧调用）

<a id="component-interface"></a>
### 组件接口

所有组件都实现：

```typescript
interface Component {
  render(width: number): string[];
  handleInput?(data: string): void;
  invalidate?(): void;
}
```

| 方法 | 说明 |
|--------|-------------|
| `render(width)` | 返回字符串数组，每行一条。每行**不得超过 `width`**，否则 TUI 会报错。使用 `truncateToWidth()` 或手动换行来保证这一点。 |
| `handleInput?(data)` | 组件拥有焦点并收到键盘输入时调用。`data` 字符串包含原始终端输入（可能包含 ANSI 转义序列）。 |
| `invalidate?()` | 用于清除任何缓存的渲染状态。组件应在下一次 `render()` 调用时从头重新渲染。 |

TUI 会在每条渲染行末尾追加完整的 SGR 重置和 OSC 8 重置。样式不会跨行延续。如果输出带样式的多行文本，请按行重新应用样式，或使用 `wrapTextWithAnsi()`，以便每条换行后的行都保留样式。

<a id="focusable-interface-ime-support"></a>
### Focusable 接口（IME 支持）

显示文本光标并需要 IME（输入法编辑器）支持的组件应实现 `Focusable` 接口：

```typescript
import { CURSOR_MARKER, type Component, type Focusable } from "@earendil-works/pi-tui";

class MyInput implements Component, Focusable {
  focused: boolean = false;  // 焦点变化时由 TUI 设置
  
  render(width: number): string[] {
    const marker = this.focused ? CURSOR_MARKER : "";
    // 在伪光标正前方发出标记
    return [`> ${beforeCursor}${marker}\x1b[7m${atCursor}\x1b[27m${afterCursor}`];
  }
}
```

当 `Focusable` 组件拥有焦点时，TUI：
1. 将该组件的 `focused` 设为 `true`
2. 扫描渲染输出中的 `CURSOR_MARKER`（零宽度 APC 转义序列）
3. 将硬件终端光标定位到该位置
4. 仅在启用 `showHardwareCursor` 时显示硬件光标

默认隐藏光标。这样仍渲染伪光标，同时为那些在光标隐藏时仍跟踪 IME 候选窗的终端定位硬件光标。有些终端需要可见硬件光标才能正确定位 IME；可通过渲染器构造函数的 `showHardwareCursor` 参数、`setShowHardwareCursor(true)` 或 `PI_HARDWARE_CURSOR=1` 启用。内置的 `Editor` 和 `Input` 组件已实现该接口。

**包含嵌入输入的容器组件：** 当容器组件（对话框、选择器等）包含 `Input` 或 `Editor` 子组件时，容器必须实现 `Focusable`，并把焦点状态传播给子组件：

```typescript
import { Container, type Focusable, Input } from "@earendil-works/pi-tui";

class SearchDialog extends Container implements Focusable {
  private searchInput: Input;

  // 把焦点传播给子输入，以便 IME 光标定位
  private _focused = false;
  get focused(): boolean { return this._focused; }
  set focused(value: boolean) {
    this._focused = value;
    this.searchInput.focused = value;
  }

  constructor() {
    super();
    this.searchInput = new Input();
    this.addChild(this.searchInput);
  }
}
```

若不做此传播，使用 IME（中文、日文、韩文等）输入时，候选窗会出现在错误位置。

<a id="built-in-components"></a>
## 内置组件

<a id="container"></a>
### Container

对子组件分组。

```typescript
const container = new Container();
container.addChild(component);
container.removeChild(component);
```

<a id="box"></a>
### Box

为所有子组件应用内边距和背景色的容器。

```typescript
const box = new Box(
  1,                              // paddingX（默认：1）
  1,                              // paddingY（默认：1）
  (text) => chalk.bgGray(text)   // 可选的背景函数
);
box.addChild(new Text("Content"));
box.setBgFn((text) => chalk.bgBlue(text));  // 动态更改背景
```

<a id="text"></a>
### Text

显示多行文本，支持自动换行和内边距。

```typescript
const text = new Text(
  "Hello World",                  // 文本内容
  1,                              // paddingX（默认：1）
  1,                              // paddingY（默认：1）
  (text) => chalk.bgGray(text)   // 可选的背景函数
);
text.setText("Updated text");
text.setCustomBgFn((text) => chalk.bgBlue(text));
```

<a id="truncatedtext"></a>
### TruncatedText

单行文本，按视口宽度截断。适用于状态行和页头。

```typescript
const truncated = new TruncatedText(
  "This is a very long line that will be truncated...",
  0,  // paddingX（默认：0）
  0   // paddingY（默认：0）
);
```

<a id="input"></a>
### Input

带水平滚动的单行文本输入。

```typescript
const input = new Input();
input.onSubmit = (value) => console.log(value);
input.setValue("initial");
input.getValue();
```

**按键绑定：**
- `Enter` - 提交
- `Ctrl+A` / `Ctrl+E` - 行首/行尾
- `Ctrl+W` 或 `Alt+Backspace` - 向后删除单词
- `Ctrl+U` - 删除到行首
- `Ctrl+K` - 删除到行尾
- `Ctrl+Left` / `Ctrl+Right` - 按词导航
- `Alt+Left` / `Alt+Right` - 按词导航
- 方向键、Backspace、Delete 按预期工作

<a id="editor"></a>
### Editor

多行文本编辑器，支持自动补全、文件补全、粘贴处理，以及内容超出终端高度时的垂直滚动。

```typescript
interface EditorTheme {
  borderColor: (str: string) => string;
  selectList: SelectListTheme;
}

interface EditorOptions {
  paddingX?: number;  // 水平内边距（默认：0）
}

const editor = new Editor(tui, theme, options?);  // 需要 tui 才能做感知高度的滚动
editor.onSubmit = (text) => console.log(text);
editor.onChange = (text) => console.log("Changed:", text);
editor.disableSubmit = true; // 临时禁用提交
editor.setAutocompleteProvider(provider);
editor.borderColor = (s) => chalk.blue(s); // 动态更改边框
editor.setPaddingX(1); // 动态更新水平内边距
editor.getPaddingX();  // 获取当前内边距
```

**特性：**
- 带自动换行的多行编辑
- 斜杠命令自动补全（输入 `/`）
- 文件路径自动补全（按 `Tab`）
- 大段粘贴处理（超过 10 行会创建 `[paste #1 +50 lines]` 标记）
- 编辑器上下方的水平分隔线
- 伪光标渲染（隐藏真实光标）

**按键绑定：**
- `Enter` - 提交
- `Shift+Enter`、`Ctrl+Enter` 或 `Alt+Enter` - 换行（取决于终端，`Alt+Enter` 最可靠）
- `Tab` - 自动补全
- `Ctrl+K` - 删除到行尾
- `Ctrl+U` - 删除到行首
- `Ctrl+W` 或 `Alt+Backspace` - 向后删除单词
- `Alt+D` 或 `Alt+Delete` - 向前删除单词
- `Ctrl+A` / `Ctrl+E` - 行首/行尾
- `Ctrl+]` - 向前跳到指定字符（等待下一次按键，然后将光标移到首次出现处）
- `Ctrl+Alt+]` - 向后跳到指定字符
- 方向键、Backspace、Delete 按预期工作

<a id="markdown"></a>
### Markdown

渲染带语法高亮和主题支持的 markdown。

```typescript
interface MarkdownTheme {
  heading: (text: string) => string;
  link: (text: string) => string;
  linkUrl: (text: string) => string;
  code: (text: string) => string;
  codeBlock: (text: string) => string;
  codeBlockBorder: (text: string) => string;
  quote: (text: string) => string;
  quoteBorder: (text: string) => string;
  hr: (text: string) => string;
  listBullet: (text: string) => string;
  bold: (text: string) => string;
  italic: (text: string) => string;
  strikethrough: (text: string) => string;
  underline: (text: string) => string;
  highlightCode?: (code: string, lang?: string) => string[];
}

interface DefaultTextStyle {
  color?: (text: string) => string;
  bgColor?: (text: string) => string;
  bold?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
  underline?: boolean;
}

const md = new Markdown(
  "# Hello\n\nSome **bold** text",
  1,              // paddingX
  1,              // paddingY
  theme,          // MarkdownTheme
  defaultStyle    // 可选的 DefaultTextStyle
);
md.setText("Updated markdown");
```

**特性：**
- 标题、粗体、斜体、代码块、列表、链接、引用
- HTML 标签按纯文本渲染
- 可通过 `highlightCode` 启用可选语法高亮
- 支持内边距
- 渲染缓存以提升性能

<a id="loader"></a>
### Loader

动画加载旋转器。

```typescript
const loader = new Loader(
  tui,                              // 用于渲染更新的 TUI 实例
  (s) => chalk.cyan(s),            // 旋转器颜色函数
  (s) => chalk.gray(s),            // 消息颜色函数
  "Loading..."                      // 消息（默认："Loading..."）
);
loader.start();
loader.setMessage("Still loading...");
loader.stop();
```

<a id="cancellableloader"></a>
### CancellableLoader

扩展 Loader，增加 Escape 键处理和用于取消异步操作的 AbortSignal。

```typescript
const loader = new CancellableLoader(
  tui,                              // 用于渲染更新的 TUI 实例
  (s) => chalk.cyan(s),            // 旋转器颜色函数
  (s) => chalk.gray(s),            // 消息颜色函数
  "Working..."                      // 消息
);
loader.onAbort = () => done(null); // 用户按下 Escape 时调用
doAsyncWork(loader.signal).then(done);
```

**属性：**
- `signal: AbortSignal` - 用户按下 Escape 时中止
- `aborted: boolean` - 加载器是否已被中止
- `onAbort?: () => void` - 用户按下 Escape 时的回调

<a id="selectlist"></a>
### SelectList

带键盘导航的交互式选择列表。

```typescript
interface SelectItem {
  value: string;
  label: string;
  description?: string;
}

interface SelectListTheme {
  selectedPrefix: (text: string) => string;
  selectedText: (text: string) => string;
  description: (text: string) => string;
  scrollInfo: (text: string) => string;
  noMatch: (text: string) => string;
}

const list = new SelectList(
  [
    { value: "opt1", label: "Option 1", description: "First option" },
    { value: "opt2", label: "Option 2", description: "Second option" },
  ],
  5,      // maxVisible
  theme   // SelectListTheme
);

list.onSelect = (item) => console.log("Selected:", item);
list.onCancel = () => console.log("Cancelled");
list.onSelectionChange = (item) => console.log("Highlighted:", item);
list.setFilter("opt"); // 过滤项
```

**操作：**
- 方向键：导航
- Enter：选择
- Escape：取消

<a id="settingslist"></a>
### SettingsList

带值循环和子菜单的设置面板。

```typescript
interface SettingItem {
  id: string;
  label: string;
  description?: string;
  currentValue: string;
  values?: string[];  // 若提供，Enter/Space 会在这些值之间循环
  submenu?: (currentValue: string, done: (selectedValue?: string) => void) => Component;
}

interface SettingsListTheme {
  label: (text: string, selected: boolean) => string;
  value: (text: string, selected: boolean) => string;
  description: (text: string) => string;
  cursor: string;
  hint: (text: string) => string;
}

const settings = new SettingsList(
  [
    { id: "theme", label: "Theme", currentValue: "dark", values: ["dark", "light"] },
    { id: "model", label: "Model", currentValue: "gpt-4", submenu: (val, done) => modelSelector },
  ],
  10,      // maxVisible
  theme,   // SettingsListTheme
  (id, newValue) => console.log(`${id} changed to ${newValue}`),
  () => console.log("Cancelled")
);
settings.updateValue("theme", "light");
```

**操作：**
- 方向键：导航
- Enter/Space：激活（循环值或打开子菜单）
- Escape：取消

<a id="spacer"></a>
### Spacer

用于垂直间距的空行。

```typescript
const spacer = new Spacer(2); // 2 个空行（默认：1）
```

<a id="image"></a>
### Image

在支持 Kitty 图形协议（Kitty、Ghostty、WezTerm）或 iTerm2 行内图片的终端中行内渲染图片。不支持的终端回退为文本占位符。

```typescript
interface ImageTheme {
  fallbackColor: (str: string) => string;
}

interface ImageOptions {
  maxWidthCells?: number;
  maxHeightCells?: number;
  filename?: string;
}

const image = new Image(
  base64Data,       // base64 编码的图片数据
  "image/png",      // MIME 类型
  theme,            // ImageTheme
  options           // 可选的 ImageOptions
);
tui.addChild(image);
```

支持的格式：PNG、JPEG、GIF、WebP。尺寸会从图片头自动解析。

<a id="alternate-screen-image-compatibility"></a>
#### 备用屏幕图片兼容性

`TuiAltScreen` 在实现 Kitty 图形协议的终端（包括 Kitty 和 Ghostty）中支持行内图片和视口局部裁剪。iTerm2 的行内图片协议无法在滚动时删除已有放置或裁剪其源。为避免过期图片残留在重绘内容之上，`TuiAltScreen` 在 iTerm2 中把图片组件渲染为文本占位符。`TuiMainScreen` 仍正常渲染 iTerm2 行内图片。

<a id="autocomplete"></a>
## 自动补全

<a id="combinedautocompleteprovider"></a>
### CombinedAutocompleteProvider

同时支持斜杠命令和文件路径。

```typescript
import { CombinedAutocompleteProvider } from "@earendil-works/pi-tui";

const provider = new CombinedAutocompleteProvider(
  [
    { name: "help", description: "Show help" },
    { name: "clear", description: "Clear screen" },
    { name: "delete", description: "Delete last message" },
  ],
  process.cwd() // 文件补全的基础路径
);

editor.setAutocompleteProvider(provider);
```

**特性：**
- 输入 `/` 查看斜杠命令
- 按 `Tab` 做文件路径补全
- 支持 `~/`、`./`、`../` 和 `@` 前缀
- `@` 前缀会过滤为可附加文件

<a id="key-detection"></a>
## 按键检测

使用 `matchesKey()` 配合 `Key` 辅助函数检测键盘输入（支持 Kitty 键盘协议）：

```typescript
import { matchesKey, Key } from "@earendil-works/pi-tui";

if (matchesKey(data, Key.ctrl("c"))) {
  process.exit(0);
}

if (matchesKey(data, Key.enter)) {
  submit();
} else if (matchesKey(data, Key.escape)) {
  cancel();
} else if (matchesKey(data, Key.up)) {
  moveUp();
}
```

**按键标识符**（用 `Key.*` 获得自动补全，或使用字符串字面量）：
- 基础键：`Key.enter`、`Key.escape`、`Key.tab`、`Key.space`、`Key.backspace`、`Key.delete`、`Key.home`、`Key.end`
- 方向键：`Key.up`、`Key.down`、`Key.left`、`Key.right`
- 带修饰键：`Key.ctrl("c")`、`Key.shift("tab")`、`Key.alt("left")`、`Key.ctrlShift("p")`
- 字符串格式也可以：`"enter"`、`"ctrl+c"`、`"shift+tab"`、`"ctrl+shift+p"`

<a id="rendering-modes"></a>
## 渲染模式

`TuiMainScreen` 使用三种渲染策略：

1. **首次渲染**：输出所有行，不清除回滚
2. **宽度变化或视口上方发生变化**：清屏并完整重绘
3. **常规更新**：把光标移到第一条变化行，清到末尾，并渲染变化的行

`TuiAltScreen` 拥有一个终端高度的视口。没有显式布局根时，它保留旧的单文档滚动行为。使用 `setLayoutRoot()` 后，`VStack`、`HStack` 和嵌套的 `ScrollView` 可以预留固定区域，并独立滚动受约束区域。它就地更新变化的视口行，在底部时跟随流式输出，并在内容增长时保留手动选择的滚动位置。鼠标滚轮和可配置的键盘导航会滚动视口，而不修改终端回滚，包括在 OSC 133 语义提示标记之间跳转。点击 OSC 8 超链接会用配置的 URL 处理器打开。用主键拖动可选中文本；除非将 `TuiAltScreenOptions.copyOnSelect` 设为 `false`，否则会通过 OSC 52 将其复制到剪贴板；在滚动视图的顶/底边缘按住拖动会自动滚动，并把选区扩展到屏幕外内容。Kitty 图片支持垂直视口裁剪；iTerm2 行内图片回退为文本，因为 iTerm2 协议无法在视口重绘时删除或裁剪放置。

两种渲染器都用**同步输出**（`\x1b[?2026h` ... `\x1b[?2026l`）包裹更新，以实现原子、无闪烁渲染。

<a id="terminal-interface"></a>
## Terminal 接口

TUI 可与任何实现 `Terminal` 接口的对象配合使用：

```typescript
interface Terminal {
  start(onInput: (data: string) => void, onResize: () => void): void;
  stop(): void;
  write(data: string): void;
  get columns(): number;
  get rows(): number;
  moveBy(lines: number): void;
  hideCursor(): void;
  showCursor(): void;
  clearLine(): void;
  clearFromCursor(): void;
  clearScreen(): void;
}
```

**内置实现：**
- `ProcessTerminal` - 使用 `process.stdin/stdout`
- `VirtualTerminal` - 用于测试（使用 `@xterm/headless`）

<a id="utilities"></a>
## 工具函数

```typescript
import { visibleWidth, truncateToWidth, wrapTextWithAnsi } from "@earendil-works/pi-tui";

// 获取字符串的可见宽度（忽略 ANSI 码）
const width = visibleWidth("\x1b[31mHello\x1b[0m"); // 5

// 按宽度截断字符串（保留 ANSI 码，并添加省略号）
const truncated = truncateToWidth("Hello World", 8); // "Hello..."

// 不带省略号截断
const truncatedNoEllipsis = truncateToWidth("Hello World", 8, ""); // "Hello Wo"

// 按宽度换行（跨行保留 ANSI 码）
const lines = wrapTextWithAnsi("This is a long line that needs wrapping", 20);
// ["This is a long line", "that needs wrapping"]
```

<a id="creating-custom-components"></a>
## 创建自定义组件

创建自定义组件时，**`render()` 返回的每一行都不得超过 `width` 参数**。任何一行宽于终端时，TUI 都会报错。

<a id="handling-input"></a>
### 处理输入

使用 `matchesKey()` 配合 `Key` 辅助函数处理键盘输入：

```typescript
import { matchesKey, Key, truncateToWidth } from "@earendil-works/pi-tui";
import type { Component } from "@earendil-works/pi-tui";

class MyInteractiveComponent implements Component {
  private selectedIndex = 0;
  private items = ["Option 1", "Option 2", "Option 3"];
  
  public onSelect?: (index: number) => void;
  public onCancel?: () => void;

  handleInput(data: string): void {
    if (matchesKey(data, Key.up)) {
      this.selectedIndex = Math.max(0, this.selectedIndex - 1);
    } else if (matchesKey(data, Key.down)) {
      this.selectedIndex = Math.min(this.items.length - 1, this.selectedIndex + 1);
    } else if (matchesKey(data, Key.enter)) {
      this.onSelect?.(this.selectedIndex);
    } else if (matchesKey(data, Key.escape) || matchesKey(data, Key.ctrl("c"))) {
      this.onCancel?.();
    }
  }

  render(width: number): string[] {
    return this.items.map((item, i) => {
      const prefix = i === this.selectedIndex ? "> " : "  ";
      return truncateToWidth(prefix + item, width);
    });
  }
}
```

<a id="handling-line-width"></a>
### 处理行宽

使用提供的工具函数确保行宽合适：

```typescript
import { visibleWidth, truncateToWidth } from "@earendil-works/pi-tui";
import type { Component } from "@earendil-works/pi-tui";

class MyComponent implements Component {
  private text: string;

  constructor(text: string) {
    this.text = text;
  }

  render(width: number): string[] {
    // 方案 1：截断过长的行
    return [truncateToWidth(this.text, width)];

    // 方案 2：检查并填充到精确宽度
    const line = this.text;
    const visible = visibleWidth(line);
    if (visible > width) {
      return [truncateToWidth(line, width)];
    }
    // 填充到精确宽度（可选，用于背景）
    return [line + " ".repeat(width - visible)];
  }
}
```

<a id="ansi-code-considerations"></a>
### ANSI 码注意事项

`visibleWidth()` 和 `truncateToWidth()` 都能正确处理 ANSI 转义码：

- `visibleWidth()` 计算宽度时忽略 ANSI 码
- `truncateToWidth()` 保留 ANSI 码，并在截断时正确关闭它们

```typescript
import chalk from "chalk";

const styled = chalk.red("Hello") + " " + chalk.blue("World");
const width = visibleWidth(styled); // 11（不计 ANSI 码）
const truncated = truncateToWidth(styled, 8); // 红色 "Hello" + " W..."，并正确重置
```

<a id="caching"></a>
### 缓存

为了性能，组件应缓存渲染输出，只在必要时重新渲染：

```typescript
class CachedComponent implements Component {
  private text: string;
  private cachedWidth?: number;
  private cachedLines?: string[];

  render(width: number): string[] {
    if (this.cachedLines && this.cachedWidth === width) {
      return this.cachedLines;
    }

    const lines = [truncateToWidth(this.text, width)];

    this.cachedWidth = width;
    this.cachedLines = lines;
    return lines;
  }

  invalidate(): void {
    this.cachedWidth = undefined;
    this.cachedLines = undefined;
  }
}
```

<a id="example"></a>
## 示例

完整聊天界面示例见 `test/chat-simple.ts`，包含：
- 带自定义背景色的 Markdown 消息
- 响应期间的加载旋转器
- 带自动补全和斜杠命令的编辑器
- 消息之间的间隔

运行：
```bash
npx tsx test/chat-simple.ts
```

<a id="development"></a>
## 开发

```bash
# 从 monorepo 根目录安装依赖
npm install

# 运行类型检查
npm run check

# 运行演示
npx tsx test/chat-simple.ts
```

<a id="debug-logging"></a>
### 调试日志

设置 `PI_TUI_WRITE_LOG` 以捕获写入 stdout 的原始 ANSI 流。

```bash
PI_TUI_WRITE_LOG=/tmp/tui-ansi.log npx tsx test/chat-simple.ts
```
