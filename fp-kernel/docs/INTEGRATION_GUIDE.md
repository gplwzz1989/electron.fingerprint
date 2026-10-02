# 指纹版 Electron 项目集成说明

## 1. 适用范围

本文适用于依赖 Electron `37.2.6`、Windows x64 的项目，说明如何使用本仓库构建的
指纹版 Electron，以及如何调用新增的 Session 指纹接口。

当前测试产物位于：

```text
J:\awork\electron-fp-build\src\out\Testing
```

该目录是完整的测试运行时目录。不要只复制 `electron.exe` 到另一个 Electron 版本
目录，也不要把它当作已经签名的正式发布包。

## 2. 兼容性结论

### 2.1 默认行为兼容

项目没有设置指纹 Profile 时，Chromium 继续使用原生值。以下接口是新增接口，不会
改变原有 Session API 的调用方式：

```js
ses.setFingerprintConfig(profile)
ses.getFingerprintConfig()
ses.clearFingerprintConfig()
```

### 2.2 使用条件

只有指纹版 Electron 才提供上述接口。使用官方 Electron 启动项目时，调用新增接口会
出现 `setFingerprintConfig is not a function`，这是因为官方运行时没有本项目的扩展。

当前运行时的兼容边界如下：

- Electron 基线：`37.2.6`；
- Chromium 基线：`138.0.7204.185`；
- 目标平台：Windows x64；
- 原生模块：同一 Electron 主版本通常可以复用，但仍必须执行项目自己的原生模块回归；
- 远程调试：FP-16 的 Runtime Inspector 收敛是可选运行时参数；`modules.runtimeInspector`
  未设置或为 `false` 时保持原生 CDP Runtime，只有为 `true` 时依赖 Runtime 绑定注入或
  实时控制台事件的工具需要单独验证。

## 3. 推荐替换方式：使用运行时覆盖目录

推荐使用 `ELECTRON_OVERRIDE_DIST_PATH`，不修改项目的 `node_modules/electron`，也不
影响其他项目。

### 3.1 PowerShell 启动

在项目根目录执行：

```powershell
$env:ELECTRON_OVERRIDE_DIST_PATH = 'J:\awork\electron-fp-build\src\out\Testing'
npm start
```

如果项目的启动脚本不是 `start`，替换为项目实际的启动命令，例如：

```powershell
$env:ELECTRON_OVERRIDE_DIST_PATH = 'J:\awork\electron-fp-build\src\out\Testing'
npm run dev
```

环境变量只对当前 PowerShell 窗口有效。关闭窗口后，项目会恢复使用原来的 Electron。

### 3.2 直接启动自定义运行时

也可以绕过 `node_modules/electron` 启动器：

```powershell
& 'J:\awork\electron-fp-build\src\out\Testing\electron.exe' 'D:\projects\my-electron-app'
```

此方式适合快速验证。项目主进程仍然可以正常使用 Electron 内置模块，例如
`require('electron')`。

### 3.3 启动前检查版本

在项目目录执行：

```powershell
npm ls electron
```

如果项目声明的 Electron 不是 `37.x`，或者不是 Windows x64，应先完成版本适配，不要
直接替换运行时。若项目使用了原生 Node 模块，还应执行项目对应的 Electron 重编译流程。

## 4. 新增 API 调用时序

指纹配置属于 Session，不属于单个 BrowserWindow。必须在该 Session 创建第一个 Renderer
之前设置配置。

正确时序：

```text
创建 Session
    |
设置 Fingerprint Profile
    |
创建 BrowserWindow / Renderer
    |
加载页面
```

Renderer 创建后再次调用 `setFingerprintConfig()` 会抛出异常；当前实现不支持页面运行
期间热切换 Profile。需要切换指纹时，应创建新的 Session 分区和新的 BrowserWindow。

## 5. 完整调用示例

下面的示例可放在项目主进程入口，例如 `main.js`。Profile 的所有必填分组都必须存在。

```js
const { app, BrowserWindow, session } = require('electron')

const profile = {
  schemaVersion: 1,
  id: 'win11-cn-desktop',
  enabled: true,
  browser: {
    family: 'Chrome',
    chromiumMajor: 138,
    userAgent: null,
    acceptLanguage: 'zh-CN,zh;q=0.9'
  },
  locale: {
    language: 'zh-CN',
    languages: ['zh-CN', 'zh'],
    timezone: 'Asia/Shanghai'
  },
  hardware: {
    hardwareConcurrency: 8,
    deviceMemory: 8,
    platform: 'Win32'
  },
  screen: {
    width: 1440,
    height: 900,
    availWidth: 1440,
    availHeight: 860,
    deviceScaleFactor: 1.25
  },
  graphics: {
    webglVendor: 'Google Inc. (Intel)',
    webglRenderer: 'ANGLE (Intel, Intel(R) UHD Graphics, D3D11)'
  },
  noise: {
    seed: 'win11-cn-desktop-stable',
    canvas: true,
    audio: true,
    rects: true
  },
  modules: {
    ua: true,
    clientHints: true,
    locale: true,
    timezone: true,
    navigator: true,
    screen: true,
    webgl: true,
    canvas: true,
    audio: true,
    fonts: true,
    webrtc: true,
    runtimeInspector: false
  }
}

async function createWindow () {
  const ses = session.fromPartition('persist:fingerprint-demo')

  ses.setFingerprintConfig(profile)

  console.log(ses.getFingerprintConfig())

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      session: ses,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  await win.loadURL('https://browserleaks.com/client-hints')
  return win
}

async function main () {
  await app.whenReady()
  await createWindow()
}

main()

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
```

### 5.1 读取和清除配置

```js
const currentProfile = ses.getFingerprintConfig()

if (currentProfile) {
  console.log(currentProfile.id)
}

ses.clearFingerprintConfig()
```

`getFingerprintConfig()` 返回的是 Session 保存的配置对象，不是网页探针实际读取到的
结果。清除配置后，新建的 Renderer 使用 Chromium 原生行为；已经创建的 Renderer 不会
热更新。

### 5.2 使用外部 JSON Profile

推荐把 Profile 保存为项目配置文件，例如 `profiles/win11-cn-desktop.json`：

```js
const fs = require('node:fs')
const path = require('node:path')

const profilePath = path.join(__dirname, 'profiles', 'win11-cn-desktop.json')
const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'))
ses.setFingerprintConfig(profile)
```

完整 Schema 位于：
`fp-kernel/schema/fingerprint-profile.schema.json`。

## 6. 配置字段说明

| 配置分组 | 主要字段 | 作用 |
| --- | --- | --- |
| `browser` | `family`、`chromiumMajor`、`userAgent`、`acceptLanguage` | User-Agent、Client Hints 和请求语言 |
| `locale` | `language`、`languages`、`timezone` | 页面语言、语言列表和时区 |
| `hardware` | `hardwareConcurrency`、`deviceMemory`、`platform` | 硬件并发数、设备内存和平台 |
| `screen` | `width`、`height`、`availWidth`、`availHeight`、`deviceScaleFactor` | 屏幕信息和 DPR |
| `graphics` | `webglVendor`、`webglRenderer` | WebGL 调试信息中的 GPU 标识 |
| `noise` | `seed`、`canvas`、`audio`、`rects` | 噪声种子和 Canvas、Audio、ClientRects 开关 |
| `modules` | `ua`、`clientHints`、`locale`、`timezone`、`navigator`、`screen`、`webgl`、`canvas`、`audio`、`fonts`、`webrtc`、`runtimeInspector` | 各指纹模块的独立开关；`runtimeInspector` 控制 Runtime Inspector 暴露收敛 |

重要规则：

- `enabled` 必须为 `true`，否则整个 Profile 不生效；
- `hardware.platform` 当前支持 `Win32`、`MacIntel`、`Linux x86_64`；
- `hardwareConcurrency` 和 `deviceMemory` 必须是 `1` 到 `1024` 的整数；
- `availWidth` 不能大于 `width`，`availHeight` 不能大于 `height`；
- `deviceScaleFactor` 必须大于 `0`；
- `browser.chromiumMajor` 当前必须为 `138`；
- 未启用的模块回退到 Chromium 原生值；
- `modules.runtimeInspector` 是可选运行时参数，未设置或为 `false` 时保持原生 CDP Runtime，设置为 `true` 时才收敛 Runtime Inspector 暴露；
- Runtime Inspector 收敛不影响 CDP `Page`、`Input` 等鼠标键盘自动化接口；
- Profile 含有未知字段时会被拒绝，不会静默忽略。

如果要让页面 User-Agent 和请求 User-Agent 同时变化，应设置非空的
`browser.userAgent` 并开启 `modules.ua`。`userAgent: null` 表示不覆盖原生 User-Agent，
此时 Client Hints 也不会强制生成自定义版本。

## 7. 多 Profile 隔离示例

不同 Profile 应使用不同的 Session 分区：

```js
function createFingerprintSession (partition, profile) {
  const ses = session.fromPartition(partition)
  ses.setFingerprintConfig(profile)
  return ses
}

const sessionA = createFingerprintSession('persist:fingerprint-a', profileA)
const sessionB = createFingerprintSession('persist:fingerprint-b', profileB)

const windowA = new BrowserWindow({ webPreferences: { session: sessionA } })
const windowB = new BrowserWindow({ webPreferences: { session: sessionB } })
```

不要在多个窗口之间通过共享的可变对象动态修改 Profile。Profile 在 Renderer 创建前
被序列化并锁定，切换配置应创建新的 Session。

## 8. 验证示例

可以在页面中执行以下探针确认配置是否生效：

```js
const values = await win.webContents.executeJavaScript(`({
  userAgent: navigator.userAgent,
  platform: navigator.platform,
  language: navigator.language,
  languages: navigator.languages,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  hardwareConcurrency: navigator.hardwareConcurrency,
  deviceMemory: navigator.deviceMemory,
  screen: {
    width: screen.width,
    height: screen.height,
    availWidth: screen.availWidth,
    availHeight: screen.availHeight,
    devicePixelRatio
  },
  webdriver: navigator.webdriver
})`)

console.log(values)
```

请求头、Canvas、WebGL、Audio、字体、ClientRects 和 WebRTC 应结合对应网站或专项
探针验证。不能只用 `getFingerprintConfig()` 的返回值判断网页运行时已经完全覆盖。

## 9. 回退和排查

### 9.1 临时关闭全部指纹

```js
ses.setFingerprintConfig({ ...profile, enabled: false })
```

更推荐在创建 Renderer 前直接不调用 `setFingerprintConfig()`，或者创建新的 Session。

### 9.2 只关闭单个模块

```js
ses.setFingerprintConfig({
  ...profile,
  modules: { ...profile.modules, webrtc: false }
})
```

### 9.3 常见问题

- 报 `setFingerprintConfig is not a function`：项目仍在使用官方 Electron，没有指向自定义
  `out\Testing` 运行时。
- 报 Profile 校验错误：检查所有必填分组、字段类型、平台值和 Chromium 主版本。
- 配置读取成功但页面值未变化：确认模块开关已开启，并确认配置是在首个 Renderer 创建前
  设置的。
- 启动器仍使用旧 Electron：确认 `ELECTRON_OVERRIDE_DIST_PATH` 设置在启动项目的同一
  PowerShell 会话中。
- DevTools 或自动化工具行为变化：确认是否显式设置了 `modules.runtimeInspector=true`；如未设置
  或为 `false`，重点检查 CDP `Runtime.addBinding`、`Runtime.consoleAPICalled` 和执行上下文事件。

## 10. 正式交付注意事项

`out\Testing` 只用于集成验证。正式交付前应：

1. 使用正式发布配置重新构建，而不是直接把测试目录打包发布；
2. 保留与目标 Electron 版本匹配的完整运行时文件；
3. 重新执行项目的原生模块、窗口、网络、自动更新和崩溃恢复测试；
4. 对显式启用 `modules.runtimeInspector=true` 的 CDP 自动化流程执行 Runtime 域兼容性回归；
5. 完成 Windows 签名和发布包验证。
