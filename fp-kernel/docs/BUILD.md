# 构建环境

所有 Chromium/Electron 构建必须先遵守根目录 [项目协作规则](../../AGENTS.md) 的缓存保护要求：禁止全量编译，复用现有输出目录，修改前后预演并核验失效原因。缓存不可用或出现无法解释的大范围重编时必须停止，不得清理重来。仅修改应用层时复用已有运行时，无需原生编译。

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
ninja.bat -C out\Release -n -d explain electron
autoninja.bat -C out\Release -j 8 electron
ninja.bat -C out\Release -n -d explain electron:electron_dist_zip
autoninja.bat -C out\Release -j 8 electron:electron_dist_zip
```

上述预演命令与实际编译命令必须分步执行，只有核验预演结果通过后才能继续，禁止整段直接运行。仅在任务确需修改 GN 输入且影响已核验时，才在原目录执行 `gn.bat gen out\Release`，随后重新预演；保留编译产物不代表配置变化不会触发大范围重编。版本变化后，依赖版本头文件的目标需要增量重编并重新链接，无需清理输出目录。后续升级时应同步调整显式版本号，并核对 `fp-kernel/version.json` 的上游版本；若无法复用兼容缓存，必须停止构建并报告。
