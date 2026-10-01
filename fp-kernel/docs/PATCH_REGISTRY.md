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
| FP-07 | 未开始 | Screen 与 DPR |
| FP-08 | 未开始 | WebGL |

Chromium 修改必须通过 Electron 官方 Patch System 维护，不提交完整 Chromium 工作树。
