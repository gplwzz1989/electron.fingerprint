# Patch Registry

| 编号 | 状态 | 说明 |
| --- | --- | --- |
| FP-00 | 进行中 | Session/BrowserContext 配置、Renderer 启动参数传输；基础隔离回归待完成 |
| FP-01 | 已完成 | `navigator.hardwareConcurrency` 已加入 Blink 统一 Navigator 入口；单点测试、补丁导出和增量编译通过 |
| FP-02 | 已完成 | `navigator.deviceMemory` 已加入 Blink Navigator 入口；单点测试、补丁导出和增量编译通过 |
| FP-03 | 已完成 | `browser.userAgent` 配置已统一覆盖 `navigator.userAgent` 和请求 User-Agent；Session 隔离及模块禁用测试通过 |
| FP-04 | 未开始 | Client Hints |
| FP-05 | 未开始 | Locale 与 Timezone |
| FP-06 | 未开始 | Navigator 平台 |
| FP-07 | 未开始 | Screen 与 DPR |
| FP-08 | 未开始 | WebGL |

Chromium 修改必须通过 Electron 官方 Patch System 维护，不提交完整 Chromium 工作树。
