# 测试

首批测试必须覆盖：

1. 无 Profile 时保持 Electron 原始路径；
2. Profile A、Profile B、Normal Session 互不污染；
3. `hardwareConcurrency` 从 Session 配置传递到 Renderer；
4. 配置非法时在 Browser Process 拒绝，不导致崩溃。

2026-10-23 更新受控验收入口（均从 `fingerprint-browser` 运行，不触发编译）：

- `npm run test:fingerprint:contexts`：七种配置、页面/独立线程/共享线程/Service Worker/同源和跨源 iframe；检查中文与 ASCII 配置、语言列表与高熵 Client Hints、请求 UA/Accept-Language、关闭模块时按同类上下文恢复原生值、所有环境同时存在后的刷新，以及第二进程重启后的身份、提示请求值和存储恢复。关闭 `modules.clientHints` 的样例独立于 WebGPU 样例。
- 上下文诊断分别请求 WebGPU 默认、`low-power`、`high-performance`、`forceFallbackAdapter` 四种选项，记录适配器、设备和调用错误；保护开启时任一选项泄漏适配器/设备或报错即失败。只有本机该上下文存在可用原生适配器和设备时才把保护判定为可验证；不支持时写入“不适用”，不计为通过。
- `npm run test:fingerprint:contexts -- --require-client-hints`：严格验收页面、Worker 和 iframe 请求中的完整品牌/版本列表（忽略顺序）、平台、架构和位数，并与同一上下文的高熵 API 值对照；首次采样、刷新及恢复阶段均检查已有请求值。启用客户端提示的样例缺少字段时由未验证升级为失败。普通模式保留缺项明细，不能把缺失当作通过。
- `npm run test:fingerprint:tls:baseline`：采集现有运行时的真实 ClientHello、JA3/JA4、TLS/ALPN/HTTP 协商与请求身份，不宣称新策略已验证。
- `npm run test:fingerprint:tls`：新运行时的会话级 TLS 策略、默认回退、跨会话隔离、透明代理和非法值检查。接口缺失或结果不完整返回失败。
- 两个 TLS 入口均可附加 `-- --tls-reference <样本路径>`，接收任意合法 Chrome 四段版本/平台的独立首次握手文件，保存输入副本与 SHA-256。跨版本字段对照不是跨版本仿真；缺少样本不计为独立对照通过。套件顺序、支持组、签名、版本、ALPN 和 KeyShare 参与比较，不能只凭 JA4 相同判通过。
- `npm test` 包含上下文报告完整性、重启比对、关闭配置原生回退、四种 WebGPU 模式及错误状态、高熵提示严格门禁、TLS 版本绑定和 ClientHello 解析的纯 Node 自检。

报告与运行时哈希写入独立 `dist/electron-diagnostics/fingerprint/<本轮目录>`。不使用真实用户环境或凭据；本轮不重复优化或测试已经由用户确认完成的噪音算法。

当前按用户要求停止编译。2026-10-23 `npm test` 退出码为 0；该结果只验证 Node 自检，不代表新版 Electron 的 Worker/iframe/WebGPU 或 TLS 原生功能已运行通过。现有 Release 二进制早于能力查询接口提交，未用于新上下文诊断；构建状态、支持边界及 TLS 测量范围见 [TLS 实现说明](TLS_CLIENT_HELLO.md)。
