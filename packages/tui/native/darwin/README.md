# Darwin 原生预构建

从仓库根目录为两种 macOS 架构构建：

```sh
npm --prefix packages/tui run build:native:darwin
```

构建将 macOS 11.0 作为 arm64 部署目标，将 macOS 10.15 作为 x86_64 部署目标。在 macOS 上，`build.sh` 通过 `xcrun` 查找 Apple clang 和当前 macOS SDK。Intel 或 Apple Silicon 主机都可以构建两套产物。

非 macOS 主机需要完整的 Darwin 交叉工具链，包括 macOS SDK 和 Mach-O 链接器。例如，可以用 `CC` 和 `SDKROOT` 指定一套 osxcross 安装：

```sh
CC=/path/to/osxcross/clang SDKROOT=/path/to/MacOSX.sdk \
  npm --prefix packages/tui run build:native:darwin
```

SDK 必须按 Apple 许可获取和使用。普通的 Linux 或 Windows clang 不够用，因为该 addon 会包含并链接 CoreGraphics。

这里不用 Zig，因为它不提供 Apple SDK 或 CoreGraphics framework stub，因此无法让这次构建摆脱对 SDK 的依赖；它的 clang 驱动目前也不能把这套 Mach-O bundle 配方当作 Apple clang 的即插即用替代。
