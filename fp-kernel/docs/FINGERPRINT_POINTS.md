# 指纹点实施清单

本清单按“单点实现、单点测试、隔离测试、补丁记录、编译验证”的顺序推进。每个指纹点完成前，不进入下一个指纹点。

参考项目：`J:\\bwork\\fingerprint-chromium`

## 总体约束

- 默认关闭：没有 Profile 时保持 Chromium 原始行为。
- Session 隔离：配置属于 Session，不属于 BrowserWindow；Profile A、Profile B 和无 Profile 不能互相污染。
- 单点修改：每次只修改一个指纹点对应的最小 Chromium 路径。
- 补丁管理：Chromium 修改只通过 Electron Patch System 导出，不提交完整 Chromium 工作树。
- 失效关闭：配置缺失、格式错误或超出范围时，回退到 Chromium 原始值。

## 实施顺序

| 编号 | 指纹点 | 主要 Web API 或路径 | 参考项目依据 | 当前状态 |
| --- | --- | --- | --- | --- |
| FP-00 | 配置链与 Session 隔离 | Session、BrowserContext、Renderer 启动参数 | `000-add-fingerprint-switches.patch` 的参数转发思路 | 已完成，持续回归 |
| FP-01 | `navigator.hardwareConcurrency` | Window、Worker、ServiceWorker 的 Navigator | `005-hardware-concurrency-fingerprint.patch` | 已完成，持续回归 |
| FP-02 | `navigator.deviceMemory` | `navigator.deviceMemory` | `005-hardware-concurrency-fingerprint.patch` | 已完成，持续回归 |
| FP-03 | User-Agent | `navigator.userAgent`、请求 User-Agent | `002-user-agent-fingerprint.patch` | 已完成，持续回归 |
| FP-04 | Client Hints | `navigator.userAgentData`、`Sec-CH-UA*` | Chromium 原生 `UserAgentOverride` | 已完成，持续回归 |
| FP-05 | Locale 与 Timezone | `navigator.language`、`Accept-Language`、Intl 时区 | `fp_override_timezone_from_session_config.patch` 与 Session 网络上下文更新 | 已完成，持续回归 |
| FP-06 | Navigator 平台 | `navigator.platform` | `fp_override_navigator_platform_from_session_config.patch` | 已完成，持续回归 |
| FP-07 | Screen 与 DPR | `screen.*`、`devicePixelRatio` | `fp_override_screen_from_session_config.patch` | 已完成，持续回归 |
| FP-08 | WebGL GPU 信息 | WebGL vendor、renderer | `011-gpu-info.patch` | 已完成，持续回归 |
| FP-09 | Canvas 像素 | `getImageData`、`toDataURL` | `012-canvas-get-image-data.patch`、`013-canvas-toDataURL.patch` | 已完成，持续回归 |
| FP-10 | Canvas 文本测量 | `measureText` | `015-canvas-measure-text.patch` | 已完成，持续回归 |
| FP-11 | Audio | OfflineAudioContext 渲染结果 | `003-audio-fingerprint.patch` | 已完成，持续回归 |
| FP-12 | Fonts | 字体可用性和字体集合 | `006-font-fingerprint.patch` | 已完成，持续回归 |
| FP-13 | ClientRects | `getClientRects`、`getBoundingClientRect`、Range | `014-client-rects.patch` | 已完成，持续回归 |
| FP-14 | WebGL 像素 | `readPixels` | `016-webgl-readPixels.patch` | 已实现，待编译和运行验证 |
| FP-15 | `navigator.webdriver` | 自动化标记 | `009-webdriver.patch` | 已实现，待编译和运行验证 |
| FP-16 | Headless 与 Runtime Inspector | Headless UA、可选 Runtime Inspector 暴露收敛 | `fp_hide_headless_chrome_product_name.patch`、`patches/v8/fp_reduce_v8_runtime_inspector_exposure.patch`、`patches/chromium/fp_configurable_runtime_inspector_exposure.patch` | 已实现，待编译和运行验证；`modules.runtimeInspector` 可选，默认关闭 |
| FP-17 | Worker / iframe / ServiceWorker / Network 一致性 | 跨上下文配置和请求头 | `ElectronBrowserClient::AppendExtraCommandLineSwitches`、`WorkerNavigator::GetAcceptLanguages` 与 Session NetworkContext | 已实现，新增一致性诊断和 Node 自检通过；Electron 实际运行待验证 |
| FP-18 | WebRTC 网络地址 | ICE 候选与非代理 UDP | `ElectronBrowserClient::OverrideWebPreferences`（参考 `default-webrtc-ip-handling-policy.patch`） | 已实现，待编译和真实 ICE 候选验证 |
| FP-19 | WebGPU 适配器访问 | `GPU::requestAdapter(options)` | `fp_block_session_webgpu_adapter.patch` 与 Session 启动参数 | 已实现，四种选项的报告自检通过；Electron 实际运行待验证 |
| FP-20 | TLS ClientHello 策略 | TLS 1.2 套件、支持组、签名算法和扩展策略 | `fp_session_tls_client_hello.patch` 与 `Session.setSSLConfig()` | Chrome 138 范围已实现，未编译；跨版本参考样本只用于测量对照，不表示目标仿真 |

## 每个指纹点的完成门槛

1. 明确配置字段、默认值、合法范围和关闭条件。
2. 只修改该指纹点对应的 Chromium 或 Electron 入口，保留现有中文注释和无关代码。
3. 完成无 Profile、Profile A、Profile B 三组单点验证。
4. 完成至少一个跨上下文或跨 Session 的隔离验证。
5. 在 `fp-kernel/docs/PATCH_REGISTRY.md` 记录补丁编号、源文件和验证结果。
6. 通过对应编译目标后，才将状态改为“已完成”。

## FP-01 当前测试矩阵

| 场景 | 预期 |
| --- | --- |
| 无 `fingerprint-config` | 返回 Chromium 原始 `hardwareConcurrency` |
| `enabled=false` | 返回 Chromium 原始值 |
| `modules.navigator=false` | 返回 Chromium 原始值 |
| 缺少或非法 `hardwareConcurrency` | 返回 Chromium 原始值 |
| Profile A | 只返回 A 的配置值 |
| Profile B | 只返回 B 的配置值 |
| Window 与 Worker | 同一 Renderer 配置下保持一致 |

## FP-04 当前测试矩阵

| 场景 | 预期 |
| --- | --- |
| Profile A | `navigator.userAgentData.brands`、高熵 `uaFullVersion` 和 `Sec-CH-UA` 使用 A 的 Chromium 版本 |
| Profile B | 使用 B 的 Chromium 版本，不读取 A 的值 |
| `modules.clientHints=false` | 保留 Chromium 原生 Client Hints |
| 无 Profile 或 `enabled=false` | 保留 Chromium 原生 Client Hints |
| 高熵值查询 | `getHighEntropyValues(['uaFullVersion'])` 返回配置版本 |
| 安全上下文与 `Accept-CH` 协商 | 允许请求高熵 Client Hints；未协商时不扩大请求头范围 |

## FP-05 当前测试矩阵

| 场景 | 预期 |
| --- | --- |
| Profile A/B | `navigator.language`、`navigator.languages` 和 Intl 时区分别使用各自配置 |
| Profile A | 请求 `Accept-Language` 使用 A 的完整配置值 |
| `enabled=false`、模块关闭或无 Profile | 保留 Chromium 原始语言、请求头和时区行为 |
| Session 网络上下文已存在 | 设置 Profile 后仍能更新 `Accept-Language` |

## FP-06 当前测试矩阵

| 场景 | 预期 |
| --- | --- |
| Profile A/B | `navigator.platform` 分别使用 `Win32` 和 `MacIntel` |
| `modules.navigator=false` | 保留该运行时的原生 `navigator.platform` |
| 无 Profile | 保留 Chromium 原始 `navigator.platform` |
| 非法平台值 | Browser Process 拒绝配置 |

## FP-07 当前测试矩阵

| 场景 | 预期 |
| --- | --- |
| Profile A/B | `screen.*` 和 `devicePixelRatio` 分别使用各自配置值 |
| `modules.screen=false` | 保留该运行时的原生屏幕值和 DPR |
| 无 Profile | 保留 Chromium 原始屏幕值和 DPR |

## FP-08 当前测试矩阵

| 场景 | 预期 |
| --- | --- |
| Profile A/B | `WEBGL_debug_renderer_info` 的 vendor 和 renderer 分别使用各自配置 |
| `modules.webgl=false` | 保留 Chromium 原生 WebGL vendor 和 renderer |
| 无 Profile | 保留 Chromium 原生 WebGL vendor 和 renderer |

## FP-09 当前测试矩阵

| 场景 | 预期 |
| --- | --- |
| Profile A/B | Canvas 2D 的 `getImageData()` 和 `toDataURL()` 分别使用各自 seed 生成不同像素结果 |
| `modules.canvas=false` | 保留 Chromium 原生 Canvas 像素结果 |
| 无 Profile 或 `enabled=false` | 保留 Chromium 原生 Canvas 像素结果 |

## FP-10 当前测试矩阵

| 场景 | 预期 |
| --- | --- |
| Profile A/B | Canvas 2D 的 `measureText()` 指标分别使用各自 seed 生成不同结果 |
| `modules.canvas=false` | 保留 Chromium 原生文本测量结果 |
| 无 Profile 或 `enabled=false` | 保留 Chromium 原生文本测量结果 |

## FP-11 当前测试矩阵

| 场景 | 预期 |
| --- | --- |
| Profile A/B | `OfflineAudioContext` 的采样率和离线渲染结果分别使用各自 seed |
| `modules.audio=false` | 保留 Chromium 原生 Audio 采样率和渲染结果 |
| 无 Profile 或 `enabled=false` | 保留 Chromium 原生 Audio 采样率和渲染结果 |

## FP-12 当前测试矩阵

| 场景 | 预期 |
| --- | --- |
| Profile A/B | 目标平台代表性字体分别替代为本地字体，当前平台独有字体按目标平台隐藏 |
| `modules.fonts=false` | 保留 Chromium 原生字体选择和渲染结果 |
| 无 Profile 或 `enabled=false` | 保留 Chromium 原生字体选择和渲染结果 |

## FP-13 当前测试矩阵

| 场景 | 预期 |
| --- | --- |
| Profile A/B | Element 与 Range 的 DOM Rect 查询分别使用各自 seed 生成稳定微小偏移 |
| `noise.rects=false` | 保留 Chromium 原生 DOM Rect 查询结果 |
| 无 Profile 或 `enabled=false` | 保留 Chromium 原生 DOM Rect 查询结果 |

## FP-14 当前测试矩阵

| 场景 | 预期 |
| --- | --- |
| Profile A/B | `RGBA + UNSIGNED_BYTE` 的 WebGL `readPixels()` 分别使用各自 seed 生成不同结果 |
| `modules.webgl=false` | 保留 Chromium 原生 WebGL 像素结果 |
| 无 Profile 或 `enabled=false` | 保留 Chromium 原生 WebGL 像素结果 |

## FP-15 当前测试矩阵

| 场景 | 预期 |
| --- | --- |
| `AutomationControlled` 开启 | `navigator.webdriver` 保持 `false` |
| 显式自动化探针覆盖 | 保留探针返回的自动化状态 |

## FP-16 当前测试矩阵

| 场景 | 预期 |
| --- | --- |
| Headless UA | User-Agent 产品名不包含 `HeadlessChrome` |
| Runtime Agent | 不主动暴露 Runtime bindings、console message 和 enabled 状态 |
| 未设置或 `modules.runtimeInspector=false` | 保持原生 CDP Runtime 行为 |
| `modules.runtimeInspector=true` | 收敛 Runtime bindings、console message 和 enabled 状态暴露 |
| 非 Headless 页面 | 保持 Chromium 原生 User-Agent 行为 |
| 未启用远程调试 | 不新增额外 Runtime Agent 暴露 |

## FP-17 当前测试矩阵

| 场景 | 预期 |
| --- | --- |
| 页面、普通 Worker、ServiceWorker | `hardwareConcurrency` 和 `navigator.userAgent` 使用同一 Session 配置 |
| 页面、普通 Worker、ServiceWorker 请求 | `User-Agent` 和 `Accept-Language` 请求头保持一致 |
| 无 Profile 或配置关闭 | 保留 Chromium 原生值和请求头行为 |

## FP-18 当前测试矩阵

| 场景 | 预期 |
| --- | --- |
| Profile A 且 `modules.webrtc=true` | WebRTC IP 处理策略为 `disable_non_proxied_udp` |
| Profile B 且 `modules.webrtc=false` | 保留 Chromium 原生 WebRTC IP 处理策略 |
| 无 Profile 或 `enabled=false` | 保留 Chromium 原生 WebRTC IP 处理策略 |
| `modules.webrtc=true` 的 ICE 收集 | 不产生非代理 UDP 主机候选 |

## FP-17 / FP-19 当前上下文验收矩阵

| 场景 | 预期 |
| --- | --- |
| 页面、Dedicated/Shared/Service Worker、同源/跨源 iframe | `navigator.language`、完整 `navigator.languages`、UA、高熵 API 与配置一致；请求 UA 和语言与配置一致 |
| Locale、Client Hints、Navigator、WebGL 模块关闭 | 各自字段对照同类型上下文的无配置原生基线；请求头不以页面和线程一起偏离来误判通过 |
| `--require-client-hints` | 将高熵版本列表按完整品牌/版本集合（忽略顺序）对照 API 值，并校验平台、架构、位数；启用 Client Hints 的样例缺少请求头时失败，普通模式列为未验证 |
| `modules.webgl=true` 且有可用原生 WebGPU 适配器 | 默认、`low-power`、`high-performance`、`forceFallbackAdapter` 均不得取得适配器/设备，也不得以错误冒充成功阻断 |
| 对照上下文不支持 WebGPU 或没有可用适配器 | 报告标为“不适用”，不计为保护通过 |
| `modules.webgl=false`、无 Profile 或 `enabled=false` | 四种 WebGPU 请求结果对照同类型上下文的原生基线 |

以上当前只有应用层 Node 报告自检通过；需使用包含能力查询接口的最新自定义 Electron 运行时执行 `npm run test:fingerprint:contexts`，才可标记为原生运行验收通过。

## FP-20 当前测试矩阵

| 场景 | 预期 |
| --- | --- |
| 默认策略 | 保持当前 Chromium 138 原生握手 |
| TLS 1.2 套件、支持组、签名算法和扩展排列策略 | 仅按本内核实际能力生效，按 Session 隔离 |
| UA、Client Hints 和 TLS Profile 版本 | 必须与当前运行时版本生命周期一致 |
| Chrome 120/macOS 等跨版本参考样本 | 可用于测量握手字段差异；不能据此宣称在当前 Chrome 138 内核完整模拟目标 |
| 新原生策略构建/运行验收 | 用户要求暂停编译；当前未通过，待使用现有缓存按规则预演及验收 |
