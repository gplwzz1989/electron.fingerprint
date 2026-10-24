# 栖界指纹浏览器：底层定制 Electron 与自动化扩展接口文档

本手册系统梳理了本项目在原生 Electron (`37.2.6`) / Chromium (`138.0.7204.185`) 内核及应用层中所**新增的专有能力**。文档严格聚焦于**浏览器指纹伪装隔离**与**自动化控制**两大核心领域，分为 **JavaScript 接口** 与 **HTTP REST 接口** 两大部分。

---

## 目录
1. [系统整体架构与生命周期约束](#一系统整体架构与生命周期约束)
2. [第一部分：JavaScript 接口清单](#二第一部分javascript-接口清单)
   - 2.1 [Electron 原生 Session 扩展接口 (C++ 底层绑定)](#21-electron-原生-session-扩展接口-c-底层绑定)
   - 2.2 [Blink / DOM 层底层指纹注入点与行为契约](#22-blink--dom-层底层指纹注入点与行为契约)
   - 2.3 [仿生人类行为驱动引擎 API (Humanoid Actions)](#23-仿生人类行为驱动引擎-api-humanoid-actions)
   - 2.4 [TLS 跨版本指纹拓扑与生成接口](#24-tls-跨版本指纹拓扑与生成接口)
   - 2.5 [硬件拓扑与自洽性校验接口](#25-硬件拓扑与自洽性校验接口)
3. [第二部分：HTTP REST 自动化接口清单](#三第二部分http-rest-自动化接口清单)
   - 3.1 [服务基础信息与健康探测](#31-服务基础信息与健康探测)
   - 3.2 [环境生命周期管理 (Environment Lifecycle)](#32-环境生命周期管理-environment-lifecycle)
   - 3.3 [页面与标签页控制 (Page & Tab Automation)](#33-页面与标签页控制-page--tab-automation)
   - 3.4 [拟人化行为自动化接口 (Humanoid Action Endpoints)](#34-拟人化行为自动化接口-humanoid-action-endpoints)
   - 3.5 [硬件拓扑生成与审计接口 (Hardware & GPU Topology)](#35-硬件拓扑生成与审计接口-hardware--gpu-topology)
   - 3.6 [媒体中心自动化探测与下载接口](#36-媒体中心自动化探测与下载接口)

---

## 一、系统整体架构与生命周期约束

```
┌────────────────────────────────────────────────────────┐
│                   自动化客户端 / 外部脚本                 │
│              (Puppeteer / Playwright / HTTP REST)      │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP :39898
┌───────────────────────────▼────────────────────────────┐
│         Automation Server (自动化 REST API 网关)        │
├────────────────────────────────────────────────────────┤
│     拟人化行为引擎      │        环境/配置仓库管理器       │
│  (Humanoid Actions)    │    (Profile / Environment Repo)│
└─────────────┬──────────────────────────┬───────────────┘
              │ 物理拟人化输入调度          │ 会话创建与锁定
┌─────────────▼──────────────────────────▼───────────────┐
│              Electron Browser Process (内核主进程)      │
│  • Session.setFingerprintConfig(profile)               │
│  • Session.setSSLConfig({ fingerprint })               │
│  • FingerprintProfileParser 严格强校验                   │
│  • Chromium Version 138 强绑定与锁定机制                │
└───────────────────────────┬────────────────────────────┘
                            │ --fingerprint-config 命令行参数
┌───────────────────────────▼────────────────────────────┐
│             Chromium / Blink Renderer Process          │
│  • Navigator / Screen / WebGL 挂接点                   │
│  • Canvas / Audio / ClientRects 种子级微噪             │
│  • WebGPU 会话级阻断与保护                             │
│  • 反自动化探针隐藏 (navigator.webdriver / Runtime Agent)│
└────────────────────────────────────────────────────────┘
```

> **生命周期铁律**：指纹配置必须在当前 `Session` 首次创建 `Renderer` 进程（即打开首个网页）前设置。一旦首个页面开始加载，内核即锁定配置，后续调用将抛出异常以防止指纹动态漂移被风控识别。

---

## 二、第一部分：JavaScript 接口清单

### 2.1 Electron 原生 Session 扩展接口 (C++ 底层绑定)

本项目的 Electron 在 `electron::api::Session` 原生对象上注入了以下专有方法：

#### 1. `session.setFingerprintConfig(profile)`
* **说明**：在指定 `Session` 上设置并激活底层指纹 Profile 配置。
* **参数**：`profile` (`Object`)，必须严格符合 Schema Version 1 规范。
* **抛错契约**：
  * 若当前 Session 已经创建过 Renderer 进程，抛出 `TypeError: Fingerprint 配置必须在首次 Renderer 创建前设置`；
  * 若配置字段不合法或缺少必填项，抛出 `TypeError: [字段名] 参数非法`。

#### 2. `session.getFingerprintConfig()`
* **说明**：获取当前 Session 已经锁定的指纹 Profile 对象副本。
* **返回**：`Object | null`。若尚未设置则返回 `null`。

#### 3. `session.clearFingerprintConfig()`
* **说明**：清除当前 Session 上的指纹配置（仅在尚未锁定前生效）。

#### 4. `session.getFingerprintCapabilities()`
* **说明**：查询当前底层内核实际编译启用的指纹特性声明。
* **返回**：
  ```json
  {
    "schemaVersion": 1,
    "chromiumVersion": "138.0.7204.185",
    "unicodeConfigTransport": true,
    "webgpuAdapterBlocking": true,
    "workerLanguageList": true
  }
  ```

#### 5. `session.setSSLConfig(options)`（扩展 `fingerprint` 字段）
* **说明**：在底层的 BoringSSL / Network Service 层注入定制的 TLS ClientHello 握手策略。
* **参数**：
  ```javascript
  session.setSSLConfig({
    fingerprint: {
      chromiumVersion: '138.0.7204.185', // 必须与当前内核版本完全一致
      cipherSuites: [0xc02b, 0xc02f, 0xc02c, 0xc030, 0xcca9, 0xcca8, 0xc013, 0xc014, 0x009c, 0x009d, 0x002f, 0x0035], // TLS 1.2 套件及顺序
      supportedGroups: [4588, 29, 23, 24], // 椭圆曲线与后量子密钥交换组 (4588=ML-KEM-768, 25497=Kyber768Draft00)
      signatureAlgorithms: [0x0403, 0x0804, 0x0401, 0x0503, 0x0805, 0x0501, 0x0806, 0x0601], // 签名算法列表及声明顺序
      permuteExtensions: true, // 是否打乱 ClientHello 扩展顺序 (Chrome 138 默认特性)
      echEnabled: true, // 是否启用 ECH (Encrypted Client Hello)
      postQuantumKeyAgreementEnabled: true, // 是否启用后量子抗量子密钥交换
      alpsCodepoint: 17613 // ALPS 协议代号 (17513: 旧版草案, 17613: 新版标准)
    }
  })
  ```

#### 6. `session.getTLSFingerprintCapabilities()`
* **说明**：查询当前内核所支持的底层 TLS 密码套件与密钥协商能力。
* **返回**：返回包含 `supportedGroupIds`、`alpsCodepoints`、`cipherOrder` 等特性的支持字典。

---

### 2.2 Blink / DOM 层底层指纹注入点与行为契约

所有注入点直接在 Blink C++ 挂接点生效，完全穿透 `iframe`、`Worker` 和 `SharedWorker`，**不依赖任何 JavaScript Prototype 猴子补丁**：

| DOM API 注入点 | 挂接位置 | 行为机制 |
| :--- | :--- | :--- |
| `navigator.hardwareConcurrency` | `Blink NavigatorBase` | 统一返回 `profile.hardware.hardwareConcurrency`（范围 `1..1024`） |
| `navigator.deviceMemory` | `Blink NavigatorDeviceMemory` | 返回 `profile.hardware.deviceMemory`（合规值：`1, 2, 4, 8`） |
| `navigator.userAgent` | `ElectronBrowserContext` | 统一页面 API 与 HTTP 网络层 `User-Agent`，支持 Client Hints 协商 |
| `navigator.userAgentData` | `UserAgentOverride` | 自动匹配 `brands` 与高熵 `uaFullVersion`，消解低版本 Chromium 漏洞 |
| `navigator.language(s)` | `Blink LocalFrame / NetworkContext` | 统一全局语言列表与 HTTP 请求头 `Accept-Language` |
| `Intl.DateTimeFormat` | `Blink TimeZoneController` | 接管 ICU/V8 底层时区，同时同步 `Date()` 本地时间计算 |
| `navigator.platform` | `Blink NavigatorBase` | 支持模拟 `Win32`、`MacIntel` 或 `Linux x86_64` |
| `screen.*` & `devicePixelRatio` | `Blink Screen / LocalFrame` | 覆盖屏幕高宽、可用区域，DPR 自动与 Canvas 渲染管道对齐 |
| `WEBGL_debug_renderer_info` | `Blink WebGLRenderingContextBase` | 拦截 `UNMASKED_VENDOR_WEBGL` 与 `UNMASKED_RENDERER_WEBGL` |
| `Canvas 2D` 像素与测量 | `Blink CanvasInterventionsHelper` | 基于 Profile `noise.seed` 计算**确定性微小扰动**，覆盖 `getImageData()`、`toDataURL()` 与 `measureText()` |
| `OfflineAudioContext` | `Blink AudioBuffer` | 在音频流离线渲染完成的样本缓冲区注入会话种子微噪，音频图指纹唯一化 |
| 字体列表探测 (`FontCache`) | `Blink FontCache` | 根据目标操作系统平台自动过滤与隐藏跨平台差异字体 |
| 几何尺寸 (`ClientRects`) | `Blink Element / Range` | 在 DOM Rect 查询时注入亚像素级不可见抖动，阻止几何渲染指纹追踪 |
| `navigator.gpu` (WebGPU) | `Blink GPU` | 会话级阻断 `requestAdapter()` 越权探测物理底层 GPU 驱动 |
| `WebRTC` 内网穿透策略 | `RendererPreferences` | 强制 `disable_non_proxied_udp`，阻止 WebRTC 绕过代理泄露物理网卡 IP |
| `navigator.webdriver` | `Chromium AutomationControlled` | 移除原生自动化控制标志，即使在驱动连接下也保持 `false` |
| `V8 Runtime Inspector` | `v8_inspector::V8RuntimeAgentImpl` | 阻断 CDP 对 Console 监听器与 Binding 变量的暴露，防止自动化嗅探 |

---

### 2.3 仿生人类行为驱动引擎 API (Humanoid Actions)

模块路径：[`fingerprint-browser/humanoid-actions.js`](../../fingerprint-browser/humanoid-actions.js)

采用**菲茨定律 (Fitts' Law)** 与**三次贝塞尔曲线模型**，实时模拟生理手部微震颤 (Jitter) 与按键起伏：

```javascript
const {
  humanoidMouseMove,
  humanoidClick,
  humanoidType,
  humanoidImeType,
  humanoidDrag,
  humanoidScroll
} = require('./humanoid-actions')
```

#### 1. `humanoidMouseMove(webContents, target, options)`
* **说明**：生成符合人类物理加减速与曲率偏移的贝塞尔轨迹移动鼠标。
* **参数**：
  * `target`: `{ x: number, y: number }` 或 DOM CSS 选择器字符串（如 `"#login-btn"`）；
  * `options`: `{ minSteps?: number, maxSteps?: number }`。

#### 2. `humanoidClick(webContents, target, options)`
* **说明**：物理拟人化点击。自动移动至目标点，随机停顿 40ms~120ms 后发送 `mouseDown`，再延迟 50ms~110ms 发送 `mouseUp`。

#### 3. `humanoidType(webContents, text, options)`
* **说明**：逐字键入字符，基于高斯分布动态计算按键延迟（标准均值 85ms，标准差 25ms），模拟真实人类物理敲击。

#### 4. `humanoidImeType(webContents, text, options)`
* **说明**：**仿生中文输入法输入**。
* **原理**：完整触发真实输入法的组词流水线：
  `compositionstart` ➔ 拼音击键推入 ➔ `compositionupdate` (组词候选窗口) ➔ 空格选词 ➔ `compositionend` (最终文本上屏)。
  彻底规避仅监听 IME 组词事件的反作弊风控。

#### 5. `humanoidDrag(webContents, start, end, options)`
* **说明**：滑块验证码专用拖拽函数。从 `start` 移动并按下左键，沿轨迹平滑拖拽至 `end` 释放，中途加入轻微垂直扰动与终端减速。

#### 6. `humanoidScroll(webContents, options)`
* **说明**：模拟鼠标滚轮惯性滚动，生成带阻尼衰减的平滑分步滚动脉冲。

---

### 2.4 TLS 跨版本指纹拓扑与生成接口

模块路径：[`fingerprint-browser/tls-fingerprint.js`](../../fingerprint-browser/tls-fingerprint.js)

提供针对主流 Chrome 版本的标准 TLS 特征预设与自适应映射：

```javascript
const {
  CHROME_TLS_VERSION_PRESETS,
  getTLSVersionPreset,
  resolveTLSConfigForBrowser,
  applyTLSFingerprintConfig
} = require('./tls-fingerprint')

// 获取 Chrome 120 的传统握手策略 (无后量子算法、ALPS 17513)
const tls120 = getTLSVersionPreset(120)

// 为会话应用 TLS 策略
applyTLSFingerprintConfig(profileSession, tls120)
```

* **支持的内置预设版本**：
  * `Chrome 120`：经典椭圆曲线 `[P-256, P-384, X25519]`，禁用后量子，ALPS 17513；
  * `Chrome 124 ~ 130`：Kyber-768 草案后量子密钥交换（组代号 `25497`）；
  * `Chrome 138`：正式标准 ML-KEM-768（组代号 `4588`）、新版 ALPS 17613、启用 ECH。

---

### 2.5 硬件拓扑与自洽性校验接口

模块路径：[`fingerprint-browser/webgl-topology.js`](../../fingerprint-browser/webgl-topology.js)

```javascript
const {
  getRecommendedGPUList,
  auditGPUProfileConsistency,
  generateRandomHardwareProfile
} = require('./webgl-topology')

// 1. 获取指定操作系统物理真实存在的显卡型号列表
const gpus = getRecommendedGPUList('Win32') // 或 'MacIntel'

// 2. 审计硬件与操作系统自洽性 (检测如“MacIntel + NVIDIA RTX 4090”等荒谬冲突)
const auditReport = auditGPUProfileConsistency(profile)
// auditReport: { consistent: boolean, warnings: string[], score: number }

// 3. 一键随机生成物理绝对自洽的硬件组合
const hardware = generateRandomHardwareProfile({ platform: 'Win32' })
```

---

## 三、第二部分：HTTP REST 自动化接口清单

自动化 HTTP 服务默认在本地开启，提供跨语言（Python、Go、Java、Node.js、Rust）控制指纹浏览器及执行拟人化操作的统一标准接口。

* **服务默认端口**：`39898`（可通过环境变量 `FP_AUTOMATION_PORT` 自定义）
* **绑定地址**：`127.0.0.1`（可通过 `FP_AUTOMATION_HOST` 自定义）
* **基础路径规范**：所有接口均挂载在 `/api/v1/...`，支持 CORS 跨域调用。

---

### 3.1 服务基础信息与健康探测

#### `GET /api/v1/health`
* **说明**：检查自动化服务运行状态。
* **响应示例**：
  ```json
  {
    "ok": true,
    "status": "running",
    "version": "0.1.0",
    "platform": "win32",
    "pid": 25108,
    "uptime": 128
  }
  ```

---

### 3.2 环境生命周期管理 (Environment Lifecycle)

#### `GET /api/v1/environments`
* **说明**：获取所有已保存的指纹环境列表及其当前运行状态。
* **响应字段**：`environments` 数组，每项包含环境元数据、分组及 `isOpen`（是否正在运行）。

#### `GET /api/v1/environments/:id`
* **说明**：获取指定 ID 的环境详情与完整指纹配置。

#### `POST /api/v1/environments/create`
* **说明**：创建全新的指纹环境，可选择是否在创建后立即启动。
* **请求体**：
  ```json
  {
    "name": "Twitter养号环境_01",
    "group": "海外社媒",
    "url": "https://x.com",
    "autoStart": true,
    "proxy": {
      "type": "socks5",
      "host": "127.0.0.1",
      "port": 10808
    },
    "fingerprint": {
      /* 符合 Schema 1 的指纹配置，若不传则基于预设自动生成自洽硬件 */
    }
  }
  ```
* **响应**：`201 Created`，返回创建的环境记录与启动结果。

#### `POST /api/v1/environments/start`
* **说明**：启动或唤醒指定指纹环境。
* **请求体**：
  ```json
  {
    "id": "env_xxx",
    "url": "https://www.google.com" // 可选，覆盖默认初始网页
  }
  ```
* **响应**：返回环境状态与当前浏览器所有标签页快照。

#### `POST /api/v1/environments/stop`
* **说明**：平稳关闭指定的运行中环境，自动保存 Cookie 与持久化存储。
* **请求体**：
  ```json
  {
    "id": "env_xxx"
  }
  ```

#### `DELETE /api/v1/environments/:id`
* **说明**：删除指定环境。环境运行时将拒绝删除并返回 `409 Conflict`。

---

### 3.3 页面与标签页控制 (Page & Tab Automation)

#### `GET /api/v1/tabs`
* **说明**：获取当前打开的全部环境与标签页结构树快照。
* **响应示例**：
  ```json
  {
    "ok": true,
    "activeId": "tab_1001",
    "tabs": [
      {
        "id": "tab_1001",
        "environmentId": "env_xxx",
        "title": "操笔帝 on X",
        "url": "https://x.com/caobidi/status/2113888225513148808",
        "isLoading": false
      }
    ]
  }
  ```

#### `POST /api/v1/tabs/new-page`
* **说明**：在指定环境中打开新标签页。
* **请求体**：
  ```json
  {
    "environmentId": "env_xxx",
    "url": "https://whoer.net"
  }
  ```

#### `POST /api/v1/tabs/navigate`
* **说明**：让指定标签页跳转到目标网页。
* **请求体**：
  ```json
  {
    "tabId": "tab_1001",
    "url": "https://pixelscan.net"
  }
  ```

#### `POST /api/v1/tabs/execute`
* **说明**：在当前激活标签页中直接注入执行自定义 JavaScript 代码。
* **请求体**：
  ```json
  {
    "script": "return document.title;"
  }
  ```
* **响应**：`{ "ok": true, "result": "执行返回值" }`

---

### 3.4 拟人化行为自动化接口 (Humanoid Action Endpoints)

所有拟人化接口均自动匹配生理手部微震颤算法与随机延迟：

#### `POST /api/v1/actions/click`
* **说明**：在页面上执行平滑移动 + 真实按下/释放点击。
* **请求体**：
  ```json
  {
    "tabId": "tab_1001", // 可选，缺省为当前活动标签
    "selector": "#submit-btn", // 支持 CSS 选择器，或使用坐标 { "x": 520, "y": 380 }
    "options": {
      "clickDelayMin": 40,
      "clickDelayMax": 100
    }
  }
  ```

#### `POST /api/v1/actions/type`
* **说明**：真实物理敲击键盘输入英文或数字。
* **请求体**：
  ```json
  {
    "tabId": "tab_1001",
    "text": "my_secure_password_123"
  }
  ```

#### `POST /api/v1/actions/ime-type`
* **说明**：**中文拼音输入法组词拟人化输入**。
* **请求体**：
  ```json
  {
    "tabId": "tab_1001",
    "text": "你好世界，这是拟人化输入测试"
  }
  ```

#### `POST /api/v1/actions/scroll`
* **说明**：惯性滚轮阻尼平滑滚动。
* **请求体**：
  ```json
  {
    "tabId": "tab_1001",
    "deltaY": 600, // 正数向下，负数向上
    "steps": 15
  }
  ```

#### `POST /api/v1/actions/drag`
* **说明**：滑块验证码专用拖拽接口。
* **请求体**：
  ```json
  {
    "tabId": "tab_1001",
    "start": { "x": 280, "y": 450 },
    "end": { "x": 512, "y": 450 }
  }
  ```

---

### 3.5 硬件拓扑生成与审计接口 (Hardware & GPU Topology)

#### `GET /api/v1/gpu/recommend?platform=Win32`
* **说明**：按操作系统平台查询物理市场上存在的合规 GPU 列表。

#### `POST /api/v1/gpu/audit`
* **说明**：审计指定指纹配置的自洽性，识别诸如“Windows 平台配 Apple M3 显卡”或“8核 CPU 配 1GB 内存”等风控高危冲突。
* **请求体**：传入完整 `fingerprint` 对象。
* **响应**：返回 `{ consistent: boolean, warnings: [], score: 98 }`。

#### `GET /api/v1/fingerprint/random-hardware?platform=Win32`
* **说明**：一键生成一套符合目标平台真实统计分布的物理自洽硬件参数（核心数、内存、GPU Vendor/Renderer、屏幕规格）。

---

### 3.6 媒体中心自动化探测与下载接口

#### `GET /api/v1/media/debug`
* **说明**：读取当前标签页已识别的媒体资源与下载任务队列。

#### `POST /api/v1/media/test-extract`
* **说明**：触发当前活动页面的专属适配器或嗅探器重新解析媒体流。

#### `POST /api/v1/media/download`
* **说明**：将解析出来的媒体资源派发给底层下载管理器，自动调用内嵌的 FFmpeg 进行拉流与封装。
