# Patch Registry

| 编号 | 状态 | 说明 |
| --- | --- | --- |
| FP-00 | 进行中 | Session/BrowserContext 配置、Renderer 启动参数传输；基础隔离回归待完成 |
| FP-01 | 进行中 | `navigator.hardwareConcurrency` 已加入 Blink 统一 Navigator 入口；待单点测试、补丁导出和编译验证 |
| FP-02 | 未开始 | `navigator.deviceMemory` |
| FP-03 | 未开始 | User-Agent |
| FP-04 | 未开始 | Client Hints |
| FP-05 | 未开始 | Locale 与 Timezone |
| FP-06 | 未开始 | Navigator 平台 |
| FP-07 | 未开始 | Screen 与 DPR |
| FP-08 | 未开始 | WebGL |

Chromium 修改必须通过 Electron 官方 Patch System 维护，不提交完整 Chromium 工作树。
