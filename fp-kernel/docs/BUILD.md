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
