# Patch Registry

| 编号 | 状态 | 说明 |
| --- | --- | --- |
| FP-00 | 进行中 | Session/BrowserContext 配置、Renderer 启动参数传输；基础隔离回归待完成 |
| FP-01 | 已完成 | `navigator.hardwareConcurrency` 已加入 Blink 统一 Navigator 入口；单点测试、补丁导出和增量编译通过 |
| FP-02 | 已完成 | `navigator.deviceMemory` 已加入 Blink Navigator 入口；单点测试、补丁导出和增量编译通过 |
| FP-03 | 已完成 | `browser.userAgent` 配置已统一覆盖 `navigator.userAgent` 和请求 User-Agent；Session 隔离及模块禁用测试通过 |
| FP-04 | 已完成 | 复用 Chromium 原生 `UserAgentOverride` 覆盖 Client Hints；`navigator.userAgentData`、高熵 `uaFullVersion` 和 `Sec-CH-UA` 测试通过，Session 隔离和模块禁用回归通过；Electron 增量编译通过 |
| FP-05 | 已完成 | `navigator.language`、`navigator.languages`、`Accept-Language` 和 Intl 时区已接入 Session 配置；Chromium 补丁、网络上下文更新、Electron 增量编译和 13 项定向测试通过 |
| FP-06 | 已完成 | `navigator.platform` 已支持 `Win32`、`MacIntel` 和 `Linux x86_64`；Schema、Browser Process 校验、Chromium 补丁、Session 隔离测试和 Electron 增量编译通过 |
| FP-07 | 已完成 | Screen 与 DPR 已接入 `screen.width`、`screen.height`、`screen.availWidth`、`screen.availHeight` 和 `devicePixelRatio`；Session 隔离、模块关闭/无 Profile 回退、补丁导出和 Electron 增量编译通过 |
| FP-08 | 已完成 | `WEBGL_debug_renderer_info` 的 vendor/renderer 已读取 Session 配置；Session 隔离、模块关闭/无 Profile 回退、定向测试和 Electron 增量编译通过 |
| FP-09 | 已完成 | Canvas 2D 的 `getImageData()` 与 `toDataURL()` 已使用 Session seed 生成像素噪声；Session 隔离、模块关闭/无 Profile 回退、定向测试和 Electron 增量编译通过 |
| FP-10 | 已完成 | Canvas 2D 的 `measureText()` 已使用 Session seed 生成稳定的微小指标扰动；Session 隔离、模块关闭/无 Profile 回退、定向测试和 Electron 增量编译通过 |
| FP-11 | 已完成 | `OfflineAudioContext` 已使用 Session seed 生成稳定的微小采样率扰动；Session 隔离、模块关闭/无 Profile 回退、定向测试和 Electron 增量编译通过 |
| FP-12 | 已完成 | 字体缓存已支持按 Session 目标平台替代和隐藏代表性字体；Session 隔离、模块关闭/无 Profile 回退、定向测试和 Electron 增量编译通过 |
| FP-13 | 已实现，待验证 | Element 与 Range 的 ClientRects 查询已使用 Session seed 生成稳定的微小 X/Y 偏移；Session 隔离、noise.rects 关闭/无 Profile 回退、定向测试和补丁导出已完成，Electron 增量编译待验证 |
| FP-14 | 已实现，待验证 | WebGL `RGBA + UNSIGNED_BYTE` 的 `readPixels()` 已使用 Session seed 生成稳定像素噪声；Session 隔离、模块关闭/无 Profile 回退测试和补丁导出已完成，Electron 增量编译与运行测试待验证 |
| FP-15 | 已实现，待验证 | `AutomationControlled` 开启时不再强制暴露 `navigator.webdriver=true`，保留显式自动化探针覆盖；定向测试和补丁导出已完成，Electron 增量编译与运行测试待验证 |
| FP-16 | 已实现，待验证 | Headless UA 已隐藏 `HeadlessChrome` 产品名；`modules.runtimeInspector=true` 时降低 bindings、console message 和 enabled 状态暴露，未设置或为 `false` 时保持原生 CDP Runtime；补丁登记已完成，Electron 增量编译、DevTools/自动化兼容性和运行测试待验证 |
| FP-17 | 已实现，待验证 | Renderer、普通 Worker 和 ServiceWorker 复用 Session 的指纹配置；页面、Worker 和 ServiceWorker 请求复用 Session 的 User-Agent 与 `Accept-Language`；端到端回归测试已补充，增量编译和运行验证待完成 |
| FP-18 | 已实现，待验证 | `modules.webrtc` 已在 Electron `RendererPreferences` 入口启用 `disable_non_proxied_udp`；Session 隔离、模块关闭、无 Profile 回退和真实 ICE 候选测试已补充，增量编译与运行验证待完成 |

Chromium 修改必须通过 Electron 官方 Patch System 维护，不提交完整 Chromium 工作树。
