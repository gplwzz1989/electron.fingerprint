# Chrome 138 TLS 策略与 ClientHello 验证

更新：2026-10-22。用户已指定首个目标为当前 Chrome 138，并要求锁定 UA 生命周期；TLS 优先于其他后续开发。

## 当前实现

| 能力 | 实现与边界 |
| --- | --- |
| UA 版本绑定 | 应用加载和原生 Profile 入口校验实际内核版本；允许真实完整版本与 `138.0.0.0` 缩减版本；开启 UA 模块后，`Session.setUserAgent()` 同样校验。关闭 Client Hints 不能绕过版本检查 |
| TLS 1.2 密码套件 | 按 Session 配置套件子集和顺序；限制为当前 Chromium 原生支持的 12 个套件，拒绝空列表、重复、非整数、不支持值及与禁用列表冲突的值 |
| ClientHello 扩展策略 | 支持扩展随机排列、ECH/ECH GREASE、后量子密钥协商开关；默认全部保持 Chrome 138 原生行为 |
| 会话隔离及更新 | 通过已有 `SSLConfigClient` 和 `SSLContextConfig` 传输；使用每条连接的 `SSL` 对象，不修改共享 `SSL_CTX`；配置比较及更新通知沿用原实现 |
| 能力查询 | `Session.getTLSFingerprintCapabilities()` 返回真实运行时版本和支持范围，旧运行时不会被误认为支持新策略 |
| 测量 | 透明转发 TLS 字节并解析实际 ClientHello，保留套件、扩展顺序、支持版本、组、签名算法、ALPN、KeyShare 组及 JA3/JA4 原文与摘要 |

TLS 1.3 套件及顺序、GREASE 随机值、证书校验、签名算法、ALPN 和密钥生成保持原生实现。当前不提供任意扩展插入/排列、任意 Chrome 版本预设、QUIC 指纹或 HTTP/2 SETTINGS 仿真；自定义策略不能宣称是完整的其他浏览器版本。

策略接口属于原生 Session API，本轮没有新增界面编辑器或环境文件持久化字段。默认应用继续使用原生 Chrome 138 TLS；高级调用方可在首次请求前设置策略，重新启动时需重新设置。Profile 的版本绑定不限制用户主动使用 DevTools 或逐请求覆写请求头的调试行为。

## 接入与源码边界

调用链：应用/诊断 → Electron `setSSLConfig` 参数校验 → 既有 SSL 配置 Mojo → NetworkContext 配置服务 → `SSLClientSocketImpl` → BoringSSL 已有接口。

| 修改 | 位置 / 依赖 |
| --- | --- |
| Electron 参数、能力查询、UA 修改检查 | `shell/browser/api/electron_api_session.cc`；复用 `electron_lib`，无新增 Electron 公共声明 |
| Profile 版本检查 | `shell/browser/fingerprint/fingerprint_profile_parser.cc`；复用已有解析器 |
| 传输与数据契约 | 补丁中的 `services/network/public/mojom/ssl_config.mojom`、`net/ssl/ssl_config_service.h` 增加套件列表与扩展排列开关 |
| 数据转换 | `services/network/ssl_config_type_converter.cc`；其他 ECH/PQ 字段沿用已有契约 |
| 执行 | `net/socket/ssl_client_socket_impl.cc`；保留现有禁用套件、ECDHE、安全版本和证书校验逻辑 |
| 原生配置回归 | 复用 `ssl_config_service_mojo_unittest.cc` 中的初始化、恢复默认、再次更新和变更通知测试入口 |

以上 Chromium 修改均登记在 `fp_session_tls_client_hello.patch`。新增两个字段必须跨网络进程，单改 Electron `.cc` 无法把套件顺序和扩展排列策略送达网络服务；不能复用无关字段夹带配置，也不能使用跨 Session 的全局开关代替。

本补丁涉及共享头及 Mojo 生成依赖；只读检索发现 `ssl_config_service.h` 有 34 个直接包含文件、生成的 `ssl_config.mojom.h` 有 9 个，不能按原先 WebGPU 的 8 步估算。**目前只保存源码及补丁，未应用到原生构建树，未运行 GN、Ninja 预演或编译。** 后续构建前需核验依赖扩散；超过 10 步必须按项目规则停止、排查并收窄，不能直接放行或清理缓存。

## 使用方式

默认策略与当前内核绑定：

```js
const { applyTLSFingerprintConfig } = require('./tls-fingerprint')
applyTLSFingerprintConfig(profileSession, {})
```

受控对照示例：

```js
applyTLSFingerprintConfig(profileSession, {
  cipherSuites: [0xc030, 0xc02f],
  permuteExtensions: false,
  echEnabled: false,
  postQuantumKeyAgreementEnabled: false
})
```

这个示例用于验证策略确实改变握手，**不是 Chrome 138 默认预设**。关闭 ECH/PQ 会改变原生隐私与协商能力，不默认应用到用户环境。调用 `setSSLConfig({})` 恢复默认策略；已有活动连接不强制断开，验证新策略时应等待 `closeAllConnections()`。

## 测试与本次证据

在 `fingerprint-browser` 目录运行：

```text
npm test
npm run test:fingerprint:tls:baseline
npm run test:fingerprint:tls
npm run test:fingerprint:contexts
```

- `tls:baseline` 只采集当前原生运行时：直连与透明 HTTP CONNECT 两条路径；结果明确标记 `implementationVerified: false`。
- `tls` 使用新接口：原生对照、Chrome 138 默认策略、自定义策略、恢复默认、后续原生 Session，分别测直连与代理；另验证非法策略、原生 UA 版本约束。未编译进新接口的运行时应失败，不能静默退回基线模式。
- 每个 TLS 样本使用独立 Session，避免 TLS 恢复票据改变扩展集合而污染对照。记录实际请求 UA、客户端提示及协商协议；测试站点使用本轮生成并核验的证书。
- TLS 入口使用 Session 请求；默认策略和自定义策略同时设置匹配的 Profile UA。该入口不模拟网页 Client Hints 协商，页面和线程的提示一致性由上下文入口另行覆盖。
- ClientHello 解析包含 TCP 分片、跨 TLS record、长度限制与 GREASE 过滤测试；JA4 使用 [公开技术规范](https://github.com/FoxIO-LLC/ja4/blob/main/technical_details/JA4.md) 中的固定向量核对结果。
- JA3 包含扩展顺序，Chrome 扩展随机排列会令不同握手的 JA3 改变；JA4 对相应字段排序，不能要求默认 Chrome 的每次 JA3 固定。

2026-10-22 现有 Release 基线：`dist/electron-diagnostics/fingerprint/1792676247354-a6eb53f0/tls-result.json`。Electron `37.2.6` / Chromium `138.0.7204.185`，直连与透明代理两个样本均为 TLS 1.3、`TLS_AES_128_GCM_SHA256`、HTTP/2；JA4 均为 `t13d1516h2_8daaf6152771_d8a2da3f94cd`，JA3 因扩展顺序不同而不同。该结果只证明当前运行时的受控基线，不代表与独立 Chrome 138 发行版或公网检测完成对照。

已通过应用测试、解析测试和补丁应用只读检查。用户已要求暂停编译：新增 TLS 原生实现、网络服务单元测试、策略生效及 WebGPU/多上下文的新运行时验收均未执行。`check_cpp_syntax.py` 当前未找到，不宣称专用语法检查通过。

## Git 恢复点

继续开发前已正常提交五个有修改的仓库：主仓库 `633e638`、构建 Chromium `0f6ee80`、构建 Electron `0c499da`、V8 `0f15985`、Node `40f8a9a`。开发前独立快照 `codex/snapshot-20261022-before-step5` 继续保留。

完整清单位于 `dist/git-snapshots/20261022-before-step5/commits-after-step5.json` 和 `snapshot-manifest.json`。恢复源码需按仓库分别处理，不能清理或覆盖 `out/Release`、`out/Testing` 及缓存。以上均为本地提交，未推送远端。
