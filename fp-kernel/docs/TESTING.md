# 测试

首批测试必须覆盖：

1. 无 Profile 时保持 Electron 原始路径；
2. Profile A、Profile B、Normal Session 互不污染；
3. `hardwareConcurrency` 从 Session 配置传递到 Renderer；
4. 配置非法时在 Browser Process 拒绝，不导致崩溃。

2026-10-22 新增受控验收入口（均从 `fingerprint-browser` 运行，不触发编译）：

- `npm run test:fingerprint:contexts`：七种配置、页面/独立线程/共享线程/Service Worker/同源和跨源 iframe；检查中文与 ASCII 配置、完整语言列表、WebGPU 实际适配器与设备、所有环境同时存在后的刷新，以及第二进程重启后的身份和存储恢复。
- `npm run test:fingerprint:tls:baseline`：采集现有运行时的真实 ClientHello、JA3/JA4、TLS/ALPN/HTTP 协商与请求身份，不宣称新策略已验证。
- `npm run test:fingerprint:tls`：新运行时的会话级 TLS 策略、默认回退、跨会话隔离、透明代理和非法值检查。接口缺失或结果不完整返回失败。
- `npm test` 包含上下文报告完整性、重启比对、TLS 版本绑定以及 ClientHello 解析的纯 Node 自检。

报告与运行时哈希写入独立 `dist/electron-diagnostics/fingerprint/<本轮目录>`。不使用真实用户环境或凭据；本轮不重复优化或测试已经由用户确认完成的噪音算法。

当前按用户要求停止编译。现有运行时的基线采集不能替代新源码的运行验收；构建状态、接口及 TLS 测量范围见 [TLS 实现说明](TLS_CLIENT_HELLO.md)。
