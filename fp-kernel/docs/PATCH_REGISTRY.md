# Patch Registry

| 编号 | 状态 | 说明 |
| --- | --- | --- |
| FP-00 | 进行中 | Session/BrowserContext 配置、Renderer 启动参数传输；2026-10-22 增加标准 JSON Unicode 转义，兼容既有 ASCII 消费方，完整运行验收待完成 |
| FP-01 | 已完成 | `navigator.hardwareConcurrency` 已加入 Blink 统一 Navigator 入口；单点测试、补丁导出和增量编译通过 |
| FP-02 | 已完成 | `navigator.deviceMemory` 已加入 Blink Navigator 入口；合法网页可见值收敛为 1、2、4、8 GiB，单点测试、补丁导出和增量编译通过 |
| FP-03 | 已完成 | `browser.userAgent` 配置已统一覆盖 `navigator.userAgent` 和请求 User-Agent；Session 隔离及模块禁用测试通过 |
| FP-04 | 已完成 | 复用 Chromium 原生 `UserAgentOverride` 覆盖 Client Hints；仅改写 Chromium/Google Chrome 品牌，保留真实完整版本和 GREASE 品牌；Session 隔离和模块禁用回归通过；本轮一致性补丁待增量编译 |
| FP-05 | 已完成 | `navigator.language`、`navigator.languages`、`Accept-Language`、Intl 区域和 Intl 时区已接入 Session 配置；Chromium 区域入口、网络上下文更新、Electron 增量编译和标签回归测试通过 |
| FP-06 | 已完成 | `navigator.platform` 已支持 `Win32`、`MacIntel` 和 `Linux x86_64`；Schema、Browser Process 校验、Chromium 补丁、Session 隔离测试和 Electron 增量编译通过 |
| FP-07 | 已完成 | Screen 与 DPR 已接入 `screen.width`、`screen.height`、`screen.availWidth`、`screen.availHeight` 和 `devicePixelRatio`；Session 隔离、模块关闭/无 Profile 回退、补丁导出和 Electron 增量编译通过 |
| FP-08 | 已完成 | `WEBGL_debug_renderer_info` 的 vendor/renderer 已读取 Session 配置；Session 隔离、模块关闭/无 Profile 回退、定向测试和 Electron 增量编译通过 |
| FP-09 | 用户已确认通过（2026-10-22） | Canvas 2D 的 getImageData() 与 toDataURL() 使用 Session seed；增加探针尺寸守卫（小于 16px 或面积小于 512px 不加噪）与 4 邻域单色块/硬直阶跃硬拼合保护（同色邻居 >= 2 保持 0 扰动），仅对文字及曲线抗锯齿亚像素边缘进行确定性微扰，彻底消除纯色阶跃被 PixelScan `canvasNoiseOn2d` 捕获的漏洞并规避 Masking detected |
| FP-10 | 已完成 | Canvas 2D 的 `measureText()` 已使用 Session seed 生成稳定的微小指标扰动；Session 隔离、模块关闭/无 Profile 回退、定向测试和 Electron 增量编译通过 |
| FP-11 | 已完成 | `OfflineAudioContext` 保持请求采样率、帧数和时长关系，在完成后的 AudioBuffer 样本边界使用 Session seed 生成稳定的微小扰动；本轮一致性补丁待增量编译与回归 |
| FP-12 | 已完成 | 字体缓存已支持按 Session 目标平台替代和隐藏代表性字体；Session 隔离、模块关闭/无 Profile 回退、定向测试和 Electron 增量编译通过 |
| FP-13 | 已完成 | Element 与 Range 的 ClientRects 查询已使用 Session seed 生成稳定的微小 X/Y 偏移；空 Range/零尺寸结果保持原生零值；本轮一致性补丁待增量编译与回归。2026-10-05 使用现有 Release 运行时完成四类查询冒烟验证：不同 Session 结果隔离，关闭模块与无 Profile 结果一致 |
| FP-14 | 用户已确认通过（2026-10-22） | WebGL `RGBA + UNSIGNED_BYTE` 的 `readPixels()` 升级为复用 `NoisePixelsEdgeAware` 及探针/平坦区保护，确保纯色 WebGL 实心矩形（如 PixelScan `getFixedRedBoxHash`）读回像素 100% 保持标准哈希（`noNoise` 判定通过），同时兼顾复杂着色器指纹抗锯齿混淆 |
| FP-15 | 已实现，待验证 | `AutomationControlled` 开启时不再强制暴露 `navigator.webdriver=true`，保留显式自动化探针覆盖；定向测试和补丁导出已完成，Electron 增量编译与运行测试待验证 |
| FP-16 | 已实现，待验证 | Headless UA 已隐藏 `HeadlessChrome` 产品名；`modules.runtimeInspector=true` 时降低 bindings、console message 和 enabled 状态暴露，未设置或为 `false` 时保持原生 CDP Runtime；补丁登记已完成，Electron 增量编译、DevTools/自动化兼容性和运行测试待验证 |
| FP-17 | 已实现，待原生运行验证 | Renderer、Dedicated/Shared/Service Worker 与同源/跨源 iframe 复用 Session 指纹配置；上下文诊断现在核对语言列表、高熵 API/请求头、UA、平台、硬件值、Accept-Language、模块关闭原生回退及刷新/重启；`npm test` 的纯 Node 报告自检通过，新 Electron 实测未运行 |
| FP-18 | 已实现，待验证 | `modules.webrtc` 已在 Electron `RendererPreferences` 入口启用 `disable_non_proxied_udp`；Session 隔离、模块关闭、无 Profile 回退和真实 ICE 候选测试已补充，增量编译与运行验证待完成 |

| FP-19 | 已实现，待原生运行验收 | WebGPU 按 Session 的 `modules.webgl` 在 Blink `GPU::requestAdapter` 限制适配器访问；诊断覆盖默认、低功耗、高性能和强制回退四种选项，并区分设备不支持的“不适用”；页面/工作线程共享入口，Node 报告自检通过 |
| FP-20 | Chrome 138 范围已实现，未编译 | Chrome 138 TLS/UA 版本绑定、会话级 TLS 1.2 套件/支持组/签名算法顺序与扩展策略；环境保存与生命周期接入完成，已有原生 ClientHello/JA3/JA4 基线；任意合法 Chrome 样本可用于字段对照，但跨版本匹配不表示目标仿真。新增原生策略待编译与运行验证，见 [实现说明](TLS_CLIENT_HELLO.md) |
| FP-21 | 已实现，待编译与运行验证 | `window.chrome` 原生对象树（app, csi, loadTimes, runtime）注入与反 BotGuard 探测原生支持；补丁 `patches/chromium/fp_native_window_chrome.patch` 已导出 |

Chromium 修改必须通过 Electron 官方 Patch System 维护，不提交完整 Chromium 工作树。

2026-10-23 上下文诊断补充了原生基线回退、严格 Client Hints 门禁、四种 WebGPU 选项及不适用状态自检；`fingerprint-browser` 的 `npm test` 退出码为 0。该结果没有运行 Electron，不改变 FP-17、FP-19 的原生验收状态，也没有验证 FP-20 新 TLS 原生策略。

2026-10-02 已将构建目录中的补充改动同步回主仓库：Navigator 设备内存补丁及登记、Session 的 UA/Client Hints/语言入口、指纹类型的编译适配，以及 WebGL 缓冲区检查和 V8 Runtime 方法定义的后续修复补丁。保留原有完整测试与配置字段；Chromium/V8 子模块的其他版本差异不纳入提交。这次归档不表示最新 Release 构建和全部功能已重新实测通过。
