# Chrome 138 TLS 策略与 ClientHello 验证

更新：2026-10-23。首个原生策略目标为当前 Chrome 138，并锁定 UA 生命周期；TLS 优先于其他后续开发。

## 当前实现

| 能力 | 实现与边界 |
| --- | --- |
| UA 版本绑定 | 应用加载和原生 Profile 入口校验实际内核版本；允许真实完整版本与 `138.0.0.0` 缩减版本；启用 UA 或 Client Hints 时，`Session.setUserAgent()`、`WebContents.setUserAgent()` 和 `loadURL({ userAgent })` 同样校验 |
| TLS 1.2 密码套件 | 按 Session 配置套件子集和顺序；限制为当前 Chromium 原生支持的 12 个套件，拒绝空列表、重复、非整数、不支持值及与禁用列表冲突的值 |
| 支持组及签名算法 | 按 Session 配置原生安全算法的子集与顺序；支持组为 P-256、P-384、X25519、X25519MLKEM768、X25519Kyber768Draft00（25497），签名算法限当前内核的 8 项；拒绝空、重复、非法值及后量子策略冲突 |
| ClientHello 扩展策略 | 支持扩展随机排列、ECH/ECH GREASE、后量子密钥协商开关及 ALPS 编号 17513/17613；未指定 ALPS 编号时保持原生，0 是内部哨兵值，不是可公开输入 |
| 会话隔离及更新 | 通过已有 `SSLConfigClient` 和 `SSLContextConfig` 传输；使用每条连接的 `SSL` 对象，不修改共享 `SSL_CTX`；配置比较及更新通知沿用原实现 |
| 能力查询 | `Session.getTLSFingerprintCapabilities()` 返回真实运行时版本和支持范围，旧运行时不会被误认为支持新策略 |
| 环境保存与启动 | `tlsFingerprint` 与 `proxy` 同级，可随配置、环境快照保存及重启恢复；首次创建页面前应用，同一 Session 策略锁定。旧记录缺省保持原生，旧运行时拒绝显式策略；旧界面保存时未提交字段不会抹掉策略，显式 `null` 才清除 |
| 测量 | 透明转发 TLS 字节并解析实际 ClientHello，保留套件、扩展顺序、支持版本、组、签名算法、ALPN、KeyShare 组及 JA3/JA4 原文与摘要 |

TLS 1.3 套件及顺序、GREASE 随机值、证书校验、ALPN 和密钥生成保持原生实现。当前不提供任意扩展插入/排列、其他 Chrome 版本预设、QUIC 指纹或 HTTP/2 SETTINGS 仿真；自定义策略不能宣称是完整的其他浏览器版本。

原生 Profile 仍绑定实际 Chromium 138，且 `tlsFingerprint.chromiumVersion` 必须与运行时完整版本相同。因此当前不能在这个内核上完整模拟 macOS Chrome 120。独立样本现在允许提供任意合法 Chrome 四段版本及平台，用来测量并对比握手字段；样本与运行时版本或平台不同会明确标记 `runtimeIdentityMatches: false`，字段对照通过也不等于已模拟目标浏览器。用户尚未提供 Chrome 120/macOS 的真实 ClientHello 样本，当前没有该目标的实测结果。

默认应用继续使用原生 Chrome 138 TLS；高级调用方可通过现有配置保存入口设置 `tlsFingerprint`，本轮未新增界面编辑器。同一环境策略相同的重复标签不重新设置 TLS；修改或清除已使用的策略需要重启客户端，避免复用旧连接。Profile 的版本绑定不限制用户主动使用 DevTools 或逐请求覆写请求头的调试行为。

这仍未满足跨系统、跨大版本完整仿真。JA3/JA4 不是操作系统或设备的唯一标识；相同 Chrome 共用 JA4 很正常，随机修改策略也可能让环境更独特。TLS 一致性不能保证 Cloudflare/Akamai 放行或账号不关联。当前网络策略仅覆盖 TCP；QUIC 使用独立路径，不能用跨 Session 的全局禁用冒充会话隔离。

## 接入与源码边界

调用链：应用/诊断 → Electron `setSSLConfig` 参数校验 → 既有 SSL 配置 Mojo → NetworkContext 配置服务 → `SSLClientSocketImpl` → BoringSSL 已有接口。

| 修改 | 位置 / 依赖 |
| --- | --- |
| Electron 参数、能力查询、UA 修改检查 | `shell/browser/api/electron_api_session.cc`、`electron_api_web_contents.cc`；复用 `electron_lib`，无新增 Electron 公共声明 |
| Profile 版本检查 | `shell/browser/fingerprint/fingerprint_profile_parser.cc`；复用已有解析器 |
| 传输与数据契约 | 补丁中的 `services/network/public/mojom/ssl_config.mojom`、`net/ssl/ssl_config_service.h` 增加套件、支持组、签名算法列表与扩展排列开关 |
| 数据转换 | `services/network/ssl_config_type_converter.cc`；其他 ECH/PQ 字段沿用已有契约 |
| 执行 | `net/socket/ssl_client_socket_impl.cc`；保留现有禁用套件、ECDHE、安全版本和证书校验逻辑 |
| 原生配置回归 | 复用 `ssl_config_service_mojo_unittest.cc` 中的初始化、恢复默认、再次更新和变更通知测试入口 |

以上 Chromium 修改均登记在 `fp_session_tls_client_hello.patch`。新增字段必须跨网络进程，单改 Electron `.cc` 无法把套件、支持组、签名和扩展排列策略送达网络服务；不能复用无关字段夹带配置，也不能使用跨 Session 的全局开关代替。

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
  supportedGroups: [29, 23],
  signatureAlgorithms: [0x0804, 0x0403, 0x0401],
  permuteExtensions: false,
  echEnabled: false,
  postQuantumKeyAgreementEnabled: false
})
```

这个示例用于验证策略确实改变握手，**不是 Chrome 138 默认预设**。关闭 ECH/PQ 会改变原生隐私与协商能力，不默认应用到用户环境。调用 `setSSLConfig({})` 恢复默认策略；已有活动连接不强制断开，验证新策略时应等待 `closeAllConnections()`。

持久化时在配置记录中设置 `tlsFingerprint: { chromiumVersion: '138.0.7204.185', ...策略字段 }`，版本必须与实际运行时精确一致。只指定版本时仍使用原生参数；缺省或显式 `null` 不保存策略。

## 测试与本次证据

在 `fingerprint-browser` 目录运行：

```text
npm test
npm run test:fingerprint:tls:baseline
npm run test:fingerprint:tls
npm run test:fingerprint:contexts
```

- `tls:baseline` 只采集当前原生运行时：直连与透明 HTTP CONNECT 两条路径；结果明确标记 `implementationVerified: false`。
- `tls` 使用新接口：原生对照、Chrome 138 默认策略、自定义策略、后续原生 Session，分别测直连与代理；另验证非法策略、原生 UA 版本约束。生命周期用同一 Session 先完成真实握手，再更改策略及恢复默认。未编译进新接口的运行时应失败，不能静默退回基线模式。
- 普通对照使用独立 Session；生命周期对照主动关闭连接并拒绝恢复票据样本，防止扩展变化污染对照。记录实际请求 UA、客户端提示、协商协议及 HTTP/2 设置；测试站点使用本轮生成并核验的证书。
- TLS 入口使用 Session 请求；默认策略和自定义策略同时设置匹配的 Profile UA。该入口不模拟网页 Client Hints 协商，页面和线程的提示一致性由上下文入口另行覆盖。
- ClientHello 解析包含 TCP 分片、跨 TLS record、长度限制与 GREASE 过滤测试；JA4 使用 [公开技术规范](https://github.com/FoxIO-LLC/ja4/blob/main/technical_details/JA4.md) 中的固定向量核对结果。
- JA3 包含扩展顺序，Chrome 扩展随机排列会令不同握手的 JA3 改变；JA4 对相应字段排序，不能要求默认 Chrome 的每次 JA3 固定。
- 除 JA3/JA4 外，对比有序套件、扩展集合（固定模式时为顺序）、支持组、签名算法、支持版本、ALPN、KeyShare 和 GREASE 数量/位置，防止摘要相同掩盖实际差异。

可选独立对照：`npm run test:fingerprint:tls -- --tls-reference <样本路径>`；基线入口同样支持。文件为 UTF-8 JSON，最大 256 KiB；启动器固定本次输入副本并记录 SHA-256。样本必须包含 `schemaVersion: 1`、`browser: { family: 'Chrome', version: '120.0.6099.1' }` 等合法四段版本号、`platform`（`win32`/`darwin`/`linux`）、`source: { kind: 'independent-browser', capturedAt: '含时区的 ISO 时间', description: '实际采集来源' }` 和完整 `hello`。`hello` 字段是解析结果中的 `legacyVersion`、`ciphers`、`extensions`、`groups`、`pointFormats`、`supportedVersions`、`signatureAlgorithms`、`alpnHex`、`keyShareGroups`；摘要重新计算，拒绝票据恢复样本。示例版本只演示样本格式，不是本内核支持的模拟目标。

报告的 `independentReference` 区分未提供、已对照、失配；没有参考文件不能声称与独立 Chrome 一致。样本允许跨版本对照，`runtimeIdentityMatches` 只比较版本和平台元数据，不代表跨版本/跨系统模拟。来源由提供者声明，工具不认证样本出处；对照通过也只说明已比较的握手字段一致，不代表扩展全部载荷、HTTP/2 字节顺序、QUIC 或 CDN 行为一致。

2026-10-22 现有 Release 基线：`dist/electron-diagnostics/fingerprint/1792676247354-a6eb53f0/tls-result.json`。Electron `37.2.6` / Chromium `138.0.7204.185`，直连与透明代理两个样本均为 TLS 1.3、`TLS_AES_128_GCM_SHA256`、HTTP/2；JA4 均为 `t13d1516h2_8daaf6152771_d8a2da3f94cd`，JA3 因扩展顺序不同而不同。该结果只证明当前运行时的受控基线，不代表与独立 Chrome 138 发行版或公网检测完成对照。

同日用本轮增强校验再次采集：`dist/electron-diagnostics/fingerprint/1792678161747-0d1c94de/tls-result.json`。直连与透明代理共 2 个样本、0 个失败项，握手稳定字段和 HTTP/2 设置值一致；`implementationVerified: false`，`independentReference.provided: false`。新策略的 16 样本入口（8 种样本 × 直连/CONNECT）尚未运行，不把旧运行时基线计为新原生功能已生效。

2026-10-23 更新：`fingerprint-browser` 的 `npm test` 退出码为 0，包含上下文报告、四种 WebGPU 请求模式、严格高熵提示门禁和跨版本样本元数据的纯 Node 自检。WebGPU/Worker/iframe 新的 Electron 上下文实测尚未运行；现有 Release 二进制早于能力接口提交，用户要求不编译，因此不能把这些自检写成原生功能已验收。新增 TLS 原生实现、网络服务单元测试及策略生效同样未验证。`check_cpp_syntax.py` 当前未找到，不宣称专用语法检查通过。

## Git 恢复点

继续开发前已正常提交五个有修改的仓库：主仓库 `633e638`、构建 Chromium `0f6ee80`、构建 Electron `0c499da`、V8 `0f15985`、Node `40f8a9a`。开发前独立快照 `codex/snapshot-20261022-before-step5` 继续保留。

完整清单位于 `dist/git-snapshots/20261022-before-step5/commits-after-step5.json` 和 `snapshot-manifest.json`。恢复源码需按仓库分别处理，不能清理或覆盖 `out/Release`、`out/Testing` 及缓存。以上均为本地提交，未推送远端。
