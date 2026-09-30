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
| FP-01 | `navigator.hardwareConcurrency` | Window、Worker、ServiceWorker 的 Navigator | `005-hardware-concurrency-fingerprint.patch` | 实现中 |
| FP-02 | `navigator.deviceMemory` | `navigator.deviceMemory` | `005-hardware-concurrency-fingerprint.patch` | 未开始 |
| FP-03 | User-Agent | `navigator.userAgent`、请求 User-Agent | `002-user-agent-fingerprint.patch` | 未开始 |
| FP-04 | Client Hints | `navigator.userAgentData`、`Sec-CH-UA*` | `002-user-agent-fingerprint.patch` | 未开始 |
| FP-05 | Locale 与 Timezone | `navigator.language`、`Accept-Language`、Intl 时区 | `018-timezone.patch` 与 Chromium 原生参数 | 未开始 |
| FP-06 | Navigator 平台 | `navigator.platform` | `002-user-agent-fingerprint.patch` | 未开始 |
| FP-07 | Screen 与 DPR | `screen.*`、`devicePixelRatio` | 参考项目声明了参数，但未找到完整生效路径 | 未开始，需先补齐设计 |
| FP-08 | WebGL GPU 信息 | WebGL vendor、renderer | `011-gpu-info.patch` | 未开始 |
| FP-09 | Canvas 像素 | `getImageData`、`toDataURL` | `012-canvas-get-image-data.patch`、`013-canvas-toDataURL.patch` | 未开始 |
| FP-10 | Canvas 文本测量 | `measureText` | `015-canvas-measure-text.patch` | 未开始 |
| FP-11 | Audio | OfflineAudioContext 渲染结果 | `003-audio-fingerprint.patch` | 未开始 |
| FP-12 | Fonts | 字体可用性和字体集合 | `006-font-fingerprint.patch` | 未开始 |
| FP-13 | ClientRects | `getClientRects`、`getBoundingClientRect`、Range | `014-client-rects.patch` | 未开始 |
| FP-14 | WebGL 像素 | `readPixels` | `016-webgl-readPixels.patch` | 未开始 |
| FP-15 | `navigator.webdriver` | 自动化标记 | `009-webdriver.patch` | 未开始 |
| FP-16 | Headless 与 CDP 特征 | Headless UA、Runtime Agent | `010-headless.patch`、`001-disable-runtime.enable.patch` | 未开始，需单独评估兼容性 |
| FP-17 | Worker / ServiceWorker / Network 一致性 | 跨上下文配置和请求头 | 参考项目的统一转发思路 | 未开始 |
| FP-18 | WebRTC 网络地址 | ICE 候选与非代理 UDP | `default-webrtc-ip-handling-policy.patch` | 未开始，属于网络隐私边界 |

## 每个指纹点的完成门槛

1. 明确配置字段、默认值、合法范围和关闭条件。
2. 只修改该指纹点的 Chromium 入口，保留现有中文注释和无关代码。
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

