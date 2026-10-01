# Electron 指纹支持现状说明

## 1. 文档目的

本文基于当前 `fp/37.2.6` 分支源码、Electron Chromium 补丁、Session 测试和
`fp-kernel` 配置协议，对 Electron 指纹能力的实际支持情况进行评估。

本文区分以下三种状态：

- **已生效**：配置会经过运行时链路，并已经在 Chromium/Blink 入口读取。
- **基础设施已完成**：配置、校验、传输或 API 已存在，但尚未有对应的运行时消费逻辑。
- **未实现**：当前只有规划、Schema 字段或参考补丁信息，没有接入本分支运行时。

## 2. 结论摘要

当前版本不是完整的 Electron 指纹浏览器，而是一个已经打通基础配置链路、并完成
`navigator.hardwareConcurrency` 与 `navigator.deviceMemory` 两个硬件指纹点的早期版本。

| 评估项 | 当前结论 |
| --- | --- |
| 运行时基线 | Electron `37.2.6`，Chromium `138.0.7204.185` |
| 指纹内核版本 | `0.1.0` |
| Profile Schema | 版本 `1` |
| 配置入口 | `Session.setFingerprintConfig()` |
| 配置作用域 | `Session` 对应的 `ElectronBrowserContext` |
| 已真正覆盖的指纹点 | `navigator.hardwareConcurrency`、`navigator.deviceMemory` |
| 已验证的场景 | Session 配置保存/清除、非法值校验、Renderer 中的 `deviceMemory` 覆盖 |
| 仍未真正覆盖的主要项目 | UA、Client Hints、语言、时区、平台、屏幕、WebGL、Canvas、Audio、字体、ClientRects、WebRTC 等 |
| 编译状态 | Windows x64 增量编译 `561/561` 通过；完整回归仍在继续 |

因此，当前版本适合用于验证“按 Session 隔离的指纹配置基础设施”和
`hardwareConcurrency` 单点能力，不适合宣称已经完成浏览器级指纹伪装或全量反检测。

## 3. 当前运行时链路

```text
Session.setFingerprintConfig(profile)
        |
        v
Browser Process：FingerprintProfileParser 校验
        |
        v
ElectronBrowserContext::FingerprintContext 保存配置
        |
        v
Renderer 创建时序锁定配置
        |
        v
ElectronBrowserClient 序列化为 --fingerprint-config
        |
        v
 ElectronBrowserContext::GetUserAgent()
        |
        v
 navigator.userAgent / 请求 User-Agent
        |
        v
 Blink NavigatorBase::hardwareConcurrency()
        |
        v
 navigator.hardwareConcurrency
        |
        v
 Blink NavigatorDeviceMemory::deviceMemory()
        |
        v
 navigator.deviceMemory
```

### 3.1 配置存储与作用域

`FingerprintContext` 存储在 `ElectronBrowserContext` 内，因此配置属于 Session，
不属于单个 `BrowserWindow`。不同 Session 可以分别设置不同 Profile；没有 Profile
的 Session 不会追加指纹配置启动参数。

### 3.2 配置生效时机

配置必须在该 Session 的首个 Renderer 创建前设置。Renderer 创建后：

- 再调用 `setFingerprintConfig()` 会抛出异常；
- `clearFingerprintConfig()` 不会再修改已经锁定的配置；
- 当前实现不支持热更新。

这里的锁定点是 Renderer 进程即将启动，而不是单纯的某个页面完成导航。

### 3.3 Renderer 传输方式

启用的 Profile 会被完整序列化为 JSON，并通过 `--fingerprint-config` 传给子进程。
当前只有启用状态为 `true` 的配置会传输；未设置 Profile 或 `enabled` 为 `false`
时，子进程不会收到该参数。

这条链路目前传输的是整个 Profile，但并不代表 Profile 中每个字段都会生效。
实际是否生效，取决于 Chromium/Blink 是否已经读取对应字段。

## 4. 指纹点支持矩阵

| 指纹点 | 配置字段 | 当前实际状态 | 说明 |
| --- | --- | --- | --- |
| 配置链与 Session 隔离 | 全部 Profile 字段 | 基础设施已完成 | API、BrowserContext 存储、Renderer 参数转发已存在；仍需完整编译和更全面隔离回归 |
| `navigator.hardwareConcurrency` | `hardware.hardwareConcurrency`、`modules.navigator` | **已生效** | Blink 统一 Navigator 入口读取配置；Window 和普通 Worker 测试覆盖 |
| `navigator.deviceMemory` | `hardware.deviceMemory`、`modules.navigator` | **已生效** | Blink Navigator 入口读取 Session 配置；无有效配置时保留 Chromium 原始值 |
| User-Agent | `browser.userAgent`、`modules.ua` | **已生效** | BrowserContext 统一覆盖 `navigator.userAgent` 和请求 User-Agent；无效、未启用或模块禁用时保留原生值 |
| Client Hints | `modules.clientHints` | 未实现 | 不影响 `navigator.userAgentData` 或 `Sec-CH-UA*` 请求头 |
| Locale | `locale.language`、`locale.languages`、`browser.acceptLanguage`、`modules.locale` | 未实现 | 不影响 `navigator.language`、`navigator.languages` 或请求头 |
| Timezone | `locale.timezone`、`modules.timezone` | 未实现 | 不影响 Intl 时区或系统时区表现 |
| Navigator 平台 | `hardware.platform`、`modules.navigator` | 未实现 | 不影响 `navigator.platform` |
| Screen 与 DPR | `screen.*`、`modules.screen` | 未实现 | 不影响 `screen.*` 或 `devicePixelRatio` |
| WebGL GPU 信息 | `graphics.webglVendor`、`graphics.webglRenderer`、`modules.webgl` | 未实现 | 不影响 WebGL vendor/renderer 查询结果 |
| Canvas 像素 | `noise.canvas`、`modules.canvas` | 未实现 | 不影响 `getImageData()` 或 `toDataURL()` |
| Canvas 文本测量 | `noise.canvas`、`modules.canvas` | 未实现 | 不影响 `measureText()` |
| Audio | `noise.audio`、`modules.audio` | 未实现 | 不影响 OfflineAudioContext 渲染结果 |
| Fonts | `modules.fonts` | 未实现 | 不影响字体可用性或字体集合查询 |
| ClientRects | `noise.rects` | 未实现 | 不影响 DOM Rect 查询结果 |
| WebGL 像素 | `noise`、`modules.webgl` | 未实现 | 不影响 `readPixels()` |
| `navigator.webdriver` | 当前没有可生效字段 | 未实现 | 尚未接入自动化标记覆盖 |
| Headless/CDP 特征 | 当前没有可生效字段 | 未实现 | 尚未处理 Headless UA、Runtime Agent 等特征 |
| Worker/ServiceWorker/Network 一致性 | 全部相关字段 | 部分具备基础传输 | 普通 Worker 的 `hardwareConcurrency` 已测试；ServiceWorker、请求头和其他上下文尚未完成一致性验证 |
| WebRTC 网络地址 | 当前没有可生效字段 | 未实现 | 尚未处理 ICE 候选和非代理 UDP 地址暴露 |

### 4.1 当前已生效的指纹点

当前有实际运行时覆盖逻辑的是：

```js
navigator.hardwareConcurrency
navigator.deviceMemory
navigator.userAgent
```

生效条件同时包括：

1. Session 已设置合法 Profile；
2. `profile.enabled === true`；
3. `profile.modules.navigator === true`；
4. `profile.hardware.hardwareConcurrency` 在 `1..1024` 范围内。

任一条件不满足时，Blink 使用 Chromium 原始值。

同一配置链路还覆盖 `navigator.deviceMemory`，生效条件与上述条件相同，硬件字段改为
`profile.hardware.deviceMemory`，有效范围为 `1..1024` 的整数。

`navigator.userAgent` 和请求 User-Agent 在 `profile.enabled === true`、
`profile.modules.ua === true` 且 `profile.browser.userAgent` 非空时使用配置值；否则
继续使用 Electron 原生 Session UA。该值通过 BrowserContext 的统一 UA 入口应用，保证
页面 API 和网络请求保持一致。

补丁在进程内对启动参数中的配置进行一次解析，并缓存解析结果。该设计保证同一个
Renderer 及其普通 Worker 使用同一配置，但也意味着当前不能在页面运行期间动态切换值。

## 5. Profile 配置支持情况

### 5.1 Schema 层支持

Schema 版本为 `1`，定义文件为
[`fingerprint-profile.schema.json`](../schema/fingerprint-profile.schema.json)。
当前 Schema 要求 Profile 一次性包含以下分组：

- `browser`
- `locale`
- `hardware`
- `screen`
- `graphics`
- `noise`
- `modules`

即使某个模块尚未实现，对应分组和字段仍然必须存在。这些字段当前主要承担配置
协议和未来扩展的作用，不能据此判断对应指纹点已生效。

### 5.2 当前硬编码兼容边界

Browser Process 解析器当前只接受：

- `schemaVersion = 1`；
- `browser.family = "Chrome"`；
- `browser.chromiumMajor = 138`；
- `hardware.platform = "Win32"`；
- `hardwareConcurrency` 和 `deviceMemory` 为 `1..1024` 的整数；
- 屏幕尺寸为正数，且可用尺寸不能大于总尺寸；
- `deviceScaleFactor` 大于 `0`。

这意味着当前 Profile 适配目标是 Chromium 138、Windows/Win32、x64 运行时，不能
直接视为跨 Chromium 主版本或跨平台通用格式。

### 5.3 Schema 与运行时校验的差异

Schema 声明顶层和各子对象不允许未知字段，但当前 C++ 解析器主要检查必需字段、
类型和部分范围，没有完整执行 `additionalProperties: false`。因此，“通过
`setFingerprintConfig()`”目前不等于“完全通过 JSON Schema 校验”。

另外，部分字段的格式约束也没有完全复制到 C++ 解析器，例如语言字符串的最小长度
和若干字符串内容格式。后续如果将 Profile 作为稳定对外协议，应统一 Schema 校验
和运行时解析规则。

## 6. 对外 API

当前 Session 暴露三个方法：

```js
ses.setFingerprintConfig(profile)
ses.getFingerprintConfig()
ses.clearFingerprintConfig()
```

典型使用方式如下。必须在使用该 Session 创建页面前设置 Profile：

```js
const { session } = require('electron')

const ses = session.fromPartition('persist:fingerprint-demo')
ses.setFingerprintConfig(require('./win11-cn-desktop.json'))
```

`getFingerprintConfig()` 返回的是当前 Session 保存的配置对象，不是运行时指纹点的
实际探测结果。因此，即使返回对象中存在 UA、WebGL 或 Canvas 配置，也不能证明这些
值已经在网页中生效。

## 7. 当前测试与验证证据

### 7.1 已有自动化测试

`spec/api-session-spec.ts` 当前覆盖：

- Session 初始没有 Profile；
- Profile 可以保存、读取和清除；
- 非法 `hardwareConcurrency` 会被拒绝；
- 首个 Renderer 创建后修改配置会失败；
- 不同 Session 的 `hardwareConcurrency` 可以分别为 `4` 和 `12`；
- 不同 Session 的 `deviceMemory` 可以分别为 `4` 和 `16`；
- 不同 Session 的 User-Agent 可以分别使用各自配置值，且请求头与页面 API 一致；
- `modules.ua=false` 时保留原生 User-Agent；
- 无 Profile、`enabled=false` 的 Session 使用原始值；
- Window 与普通 Worker 的值保持一致。

### 7.2 已执行的基础验证

以下仓库基础验证已通过：

- `fp-kernel/tools/verify-version.py`：版本清单通过；
- `fp-kernel/tools/verify-patches.py`：补丁基础文件通过。

### 7.3 尚未形成的验证证据

当前不能据现有记录认定以下项目已经通过：

- 全量 Chromium Patch System 应用后的构建验证；
- UA、Client Hints、Locale、Timezone、Screen、WebGL、Canvas、
  Audio、Fonts 等未实现点的运行时测试；
- ServiceWorker、跨进程 Network 请求头和 WebRTC 的一致性验证；
- 多个 Renderer 进程重启、崩溃复用和持久 Session 场景下的完整隔离回归。

现有 Windows 构建工作流仍是手动触发的预留入口；当前状态应标记为“基础验证和增量构建通过，完整回归待验证”。

## 8. 风险与后续建议

### 8.1 不能对外宣称的能力

当前版本不应对外宣称以下能力：

- 已完成全量浏览器指纹伪装；
- 已统一修改 UA、Client Hints 和网络请求头；
- 已统一修改语言、时区、屏幕和 WebGL；
- 已处理 Canvas、Audio、字体和 ClientRects 指纹；
- 已隐藏 Headless、CDP 或 WebDriver 特征；
- 已阻断 WebRTC 本地网络地址暴露。

### 8.2 建议优先级

建议后续按以下顺序推进：

1. 完成 FP-00/FP-01 的 Windows x64 编译和正式隔离回归，并把状态从“进行中”改为“已完成”；
2. 实现 User-Agent、Client Hints、Locale、Timezone 和 `navigator.platform`，优先保证 JS API 与网络请求的一致性；
3. 实现 Screen/DPR 与 WebGL 信息，并增加真实网页探测测试；
4. 再处理 Canvas、Audio、Fonts、ClientRects、WebGL 像素和 WebRTC 等高兼容性风险点；
5. 将 C++ 解析器与 JSON Schema 的未知字段、字符串格式和范围约束统一起来；
6. 在每个指纹点完成“无 Profile、Profile A、Profile B、禁用模块、跨上下文”测试后，再更新支持矩阵。

## 9. 相关文件

| 文件 | 作用 |
| --- | --- |
| `shell/browser/fingerprint/fingerprint_config.*` | Profile 内部结构和序列化 |
| `shell/browser/fingerprint/fingerprint_context.*` | Session 级配置保存、版本和 Renderer 锁定 |
| `shell/browser/fingerprint/fingerprint_profile_parser.*` | Browser Process 配置解析和校验 |
| `shell/browser/electron_browser_client.cc` | 向子进程传输 Profile |
| `patches/chromium/fp_override_navigator_hardware_concurrency_from_session_config.patch` | `hardwareConcurrency` 的 Blink 覆盖补丁 |
| `patches/chromium/fp_override_navigator_device_memory_from_session_config.patch` | `deviceMemory` 的 Blink 覆盖补丁 |
| `fp-kernel/schema/fingerprint-profile.schema.json` | Profile Schema 版本 1 |
| `spec/api-session-spec.ts` | Session 指纹 API 和隔离测试 |
| `fp-kernel/docs/FINGERPRINT_POINTS.md` | 指纹点实施计划 |
| `fp-kernel/docs/PATCH_REGISTRY.md` | 补丁和完成状态登记 |
