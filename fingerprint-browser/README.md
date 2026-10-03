# 指纹浏览器

这是基于当前仓库 `fp-kernel` 和自定义 Electron 运行时的独立示例项目。首版提供：

- 多个浏览器配置的创建、编辑和删除；
- 同一浏览器窗口支持多个标签，支持新建、切换、关闭及地址导航；
- 每个标签使用独立数据目录和持久化 Session，即使选择同一个配置也不共享会话；
- 语言、时区、平台、硬件、屏幕和 User-Agent 配置；
- Canvas、Audio、元素尺寸模块的开关；
- 每个标签保留创建时的独立指纹快照，配置更新只影响之后新建的标签；
- 不依赖额外 npm 包。

## 启动

在 PowerShell 中执行：

```powershell
cd J:\awork\electron.fp\fingerprint-browser
$env:FP_ELECTRON_RUNTIME = 'J:\awork\electron-fp-build\src\out\Testing'
npm start
```

如果使用文档中约定的默认构建目录，可以只执行：

```powershell
cd J:\awork\electron.fp\fingerprint-browser
npm start
```

启动器也兼容 `ELECTRON_OVERRIDE_DIST_PATH`。运行时必须是本仓库编译出的完整目录，不能只复制一个 `electron.exe`。

开发启动默认将配置和会话数据保存到项目的 `.data` 目录，启动器会在 Electron 初始化前指定该路径，避免默认应用数据目录不可写时直接崩溃。可设置 `FP_BROWSER_DATA_DIR` 使用其他目录；指定路径必须可写。之前保存在系统应用数据目录中的配置不会删除或自动迁移，需要继续使用时可将此变量设置为原目录。

旧 Testing 内核不支持 `modules.runtimeInspector` 时，只对该选项为 `false` 的配置使用旧版默认行为，并在界面显示兼容提示；这不代表旧内核实现了该开关。显式设为 `true` 时会提示更新内核，不会静默丢弃配置。浏览器默认 User-Agent 使用与当前 Chromium 一致的 Chrome 标识，不暴露 Electron 版本。没有默认关闭浏览器沙箱。

## 多标签隔离

在配置管理页点击“新建独立标签”，或在浏览器顶部选择配置后点击“新建标签”。所有网页标签在同一个窗口切换，每个标签通过 `session.fromPath()` 使用 `.data/tabs/<标签 UUID>` 目录，Cookie、缓存、本地存储等会话数据落在该目录中；`fingerprint.json` 保存创建时的配置快照。应用本身的管理配置仍位于 `.data/profiles.json`，不会为每个标签更改进程级 `app.userData`。

不同标签可以选择不同指纹配置；选择相同配置时，初始指纹值相同，但会话、目录和指纹配置对象独立。编辑配置不会改变已打开标签的指纹。关闭标签会释放网页视图、保留数据目录；管理页的“独立环境”列表可以重新打开原目录，恢复原指纹快照、Cookie、缓存和登录状态。重新打开不会套用配置的最新版本；编辑配置只影响之后新建的环境。应用重启后环境记录恢复为已关闭，可重新打开；旧版只有 `fingerprint.json` 的标签目录会在首次启动时迁移到 `environments.json`。

删除环境需要二次确认，并只允许删除应用 `userData/tabs/<环境 ID>` 下的目录。Windows 仍被 Session 占用时，环境会先从列表移除并登记到 `environment-deletions.json`，下次启动自动清理；不会为了立即删除而强制破坏正在使用的 Session。

网页使用无 Node.js、无应用通信桥的沙箱视图。当前不自动打开网站弹出窗口，以免意外复用其他标签的会话。

## 测试

```powershell
npm test
npm run test:tabs
```

多标签原生测试直接加载真实项目，在同一窗口打开两个标签，读取页面实际指纹，核对独立存储路径，并检查同配置重复开标签、配置更新、切换、导航、关闭和会话隔离。使用独立测试数据，不覆盖日常配置。结果和截图在仓库的 `dist/electron-diagnostics/tabs`。使用 `npm run test:tabs -- --keep-open` 可在测试通过后保留测试窗口。

配置数据保存到 Electron 的用户数据目录下的 `profiles.json`。项目自带的
`profiles/win11-cn-desktop.json` 只在首次启动时作为默认配置模板使用。

当前版本依赖 `fp-kernel` 已提供的 `Session.setFingerprintConfig()` API，定位是多配置隔离和内核能力验证基础，不宣称已经覆盖完整的浏览器指纹场景，也不包含用于绕过网站规则的额外脚本。

环境记录保存为 `environments.json`，包含环境 ID、来源配置版本、独立数据目录、指纹 JSON 快照、最近网址和状态。每个标签继续通过 `session.fromPath()` 使用自己的目录；同一环境在同一进程内重新打开时，会复用并校验已锁定的 Session 配置，禁止更换为另一份指纹。

## 开发计划与配置可靠性

分阶段任务、验收要求和实施状态见 [开发计划](开发计划.md)。

配置继续以 JSON 对象传入内核。应用层使用原有数组格式的 `profiles.json`，保存时通过
同目录临时文件、文件同步和重命名提交，并在 `profiles.json.bak` 保留上一份有效配置。
修改串行执行，提交成功后才更新内存；更新需要携带读取时的 `revision`，管理界面同时
使用 `expectedRevision` 区分新建（`null`）和编辑（原版本号），避免过期编辑覆盖或复活已删除配置。

主文件损坏或丢失时，应用优先读取有效备份并提示，不自动重置为默认配置。损坏原文件
在下次成功保存前会复制为 `profiles.json.damaged-<唯一编号>`，便于人工检查；备份是上一版，
可能不包含最后一次成功修改。主文件与备份都不可用时停止启动，不覆盖原数据。

同一数据目录使用单实例保护，正常退出等待已接受的配置写入。文件同步和原子替换用于
降低进程中断导致的损坏风险，不保证任意文件系统上的断电安全；强制结束进程仍需依赖备份。
