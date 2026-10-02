# 构建环境

目标平台：Windows x64。

工具位置：

| 工具 | 路径或版本 |
| --- | --- |
| Node.js | `G:\nvm4w\v22.18.0` |
| Electron Build Tools | `G:\nvm4w\global`，版本 `2.1.5` |
| Build Tools 源码 | `G:\codex-build-tools\build-tools` |
| depot_tools | `G:\codex-build-tools\build-tools\third_party\depot_tools` |
| Git 缓存 | `G:\codex-build-tools\git_cache` |
| Python | `G:\Users\Administrator\AppData\Local\Programs\Python\Python314` |

构建工作区：`J:\awork\electron-fp-build`。

使用 Build Tools 前设置：

```powershell
$env:ELECTRON_BUILD_TOOLS_ROOT = 'G:\codex-build-tools\build-tools'
```

当前记录：Node.js 与 Electron Build Tools 版本和计划文档目标存在差异，待原版构建验证后再决定是否调整。GN/Ninja 由 depot_tools 同步提供，不单独安装到系统盘。

## Release 增量构建

构建副本可能没有上游版本标签，因此在 `src\out\Release\args.gn` 中显式指定已核验的 Electron 版本，避免生成 `0.0.0-no-git-tag-found`：

```gn
import("//electron/build/args/release.gn")
target_cpu = "x64"
chrome_pgo_phase = 0
override_electron_version = "37.2.6"
```

在 `J:\awork\electron-fp-build\src` 中沿用本机工具链：

```powershell
$env:DEPOT_TOOLS_WIN_TOOLCHAIN = '0'
$env:GYP_MSVS_OVERRIDE_PATH = 'C:\Program Files\Microsoft Visual Studio\2022\Professional'
$env:WINDOWSSDKDIR = 'I:\Windows Kits\10'
gn.bat gen out\Release
autoninja.bat -C out\Release -j 8 electron
autoninja.bat -C out\Release -j 8 electron:electron_dist_zip
```

只在配置发生变化时执行 `gn.bat gen`；它保留现有编译产物。版本变化后，依赖版本头文件的目标需要增量重编并重新链接，无需清理输出目录。后续升级时应同步调整显式版本号，并核对 `fp-kernel/version.json` 的上游版本。
