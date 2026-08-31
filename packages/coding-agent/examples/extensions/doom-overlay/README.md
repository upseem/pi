# DOOM 覆盖层演示

在 pi 里以覆盖层玩 DOOM。用来演示覆盖层系统可以按 35 FPS 做实时游戏渲染。

## 用法

```bash
pi --extension ./examples/extensions/doom-overlay
```

然后运行：
```
/doom-overlay
```

共享版 WAD 文件（约 4MB）会在首次运行时自动下载。

## 操作

| 动作 | 按键 |
|--------|------|
| 移动 | WASD 或方向键 |
| 奔跑 | Shift + WASD |
| 开火 | F 或 Ctrl |
| 使用/开门 | Space |
| 武器 | 1-7 |
| 地图 | Tab |
| 菜单 | Escape |
| 暂停/退出 | Q |

## 工作原理

DOOM 以从 [doomgeneric](https://github.com/ozkl/doomgeneric) 编译出的 WebAssembly 运行。每一帧用半块字符（▀）和 24-bit 颜色渲染，上半像素是前景色，下半像素是背景色。

覆盖层使用：
- `width: "90%"` - 终端宽度的 90%
- `maxHeight: "80%"` - 终端高度最多 80%
- `anchor: "center"` - 在终端中居中

高度由宽度算出，以保持 DOOM 的 3.2:1 宽高比（已计入半块渲染）。

## 致谢

- [id Software](https://github.com/id-Software/DOOM) 的原始 DOOM
- [doomgeneric](https://github.com/ozkl/doomgeneric) 的可移植 DOOM 实现
- [pi-doom](https://github.com/badlogic/pi-doom) 的原始 pi 集成
