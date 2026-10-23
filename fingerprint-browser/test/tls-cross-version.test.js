const assert = require('node:assert/strict')
const {
  CHROME_TLS_VERSION_PRESETS,
  getTLSVersionPreset,
  resolveTLSConfigForBrowser,
  auditTLSVersionConsistency,
  assertTLSRuntimeIdentity,
  chromeVersionFromUserAgent
} = require('../tls-fingerprint')
const { getDefaultProfile, createTLSFingerprintConfig } = require('../profile-store')
const { previewFingerprintProfile } = require('../fingerprint-review')

const runtimeVersion = '138.0.7204.185'

// 1. 预设字典完整性校验
assert.ok(CHROME_TLS_VERSION_PRESETS[120], '必须具备 Chrome 120 预设')
assert.ok(CHROME_TLS_VERSION_PRESETS[124], '必须具备 Chrome 124 预设')
assert.ok(CHROME_TLS_VERSION_PRESETS[126], '必须具备 Chrome 126 预设')
assert.ok(CHROME_TLS_VERSION_PRESETS[128], '必须具备 Chrome 128 预设')
assert.ok(CHROME_TLS_VERSION_PRESETS[130], '必须具备 Chrome 130 预设')
assert.ok(CHROME_TLS_VERSION_PRESETS[138], '必须具备 Chrome 138 预设')

// 2. getTLSVersionPreset 特征校验
const preset120 = getTLSVersionPreset(120)
assert.equal(preset120.targetMajor, 120)
assert.equal(preset120.postQuantumKeyAgreementEnabled, false, 'Chrome 120 必须关闭后量子')
assert.deepEqual(preset120.supportedGroups, [29, 23, 24], 'Chrome 120 必须为纯经典椭圆曲线组')
assert.equal(preset120.alpsCodepoint, 17513, 'Chrome 120 必须为旧版 ALPS 17513')
assert.equal(preset120.echEnabled, false, 'Chrome 120 默认禁用 ECH')

const preset126 = getTLSVersionPreset('126.0.6478.127')
assert.equal(preset126.targetMajor, 126)
assert.equal(preset126.postQuantumKeyAgreementEnabled, true)
assert.ok(preset126.supportedGroups.includes(25497), 'Chrome 126 包含草案 Kyber 25497')
assert.equal(preset126.alpsCodepoint, 17513)

const preset138 = getTLSVersionPreset(138)
assert.equal(preset138.targetMajor, 138)
assert.ok(preset138.supportedGroups.includes(4588), 'Chrome 138 包含标准 ML-KEM 4588')
assert.equal(preset138.alpsCodepoint, 17613, 'Chrome 138 使用新版 ALPS 17613')

// 边界与版本区间自适应回退
assert.equal(getTLSVersionPreset(118).targetMajor, 118)
assert.equal(getTLSVersionPreset(118).postQuantumKeyAgreementEnabled, false)
assert.equal(getTLSVersionPreset(129).targetMajor, 129)
assert.ok(getTLSVersionPreset(129).supportedGroups.includes(25497))
assert.equal(getTLSVersionPreset('invalid'), null)

// 3. resolveTLSConfigForBrowser 跨版本配置解析生成
const config120 = resolveTLSConfigForBrowser('120.0.6099.109', { runtimeVersion })
assert.equal(config120.chromiumVersion, runtimeVersion, '底核运行时版本保持 138')
assert.equal(config120.targetMajor, 120)
assert.equal(config120.targetVersion, '120.0.6099.109')
assert.equal(config120.emulationMode, 'cross-version')
assert.equal(config120.postQuantumKeyAgreementEnabled, false)
assert.equal(config120.alpsCodepoint, 17513)
assert.deepEqual(config120.supportedGroups, [29, 23, 24])

// 验证生成的配置能通过 profile-store 的严格校验
const validated120 = createTLSFingerprintConfig(config120)
assert.deepEqual(validated120, config120)

// 4. auditTLSVersionConsistency 跨版本一致性审查
const profile120 = getDefaultProfile()
profile120.browser.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.109 Safari/537.36'

// 场景 A: UA 是 120，但未配置 TLS（默认 138）-> 检出矛盾并给出建议
const auditNoTLS = auditTLSVersionConsistency(profile120, null, { runtimeVersion })
assert.equal(auditNoTLS.consistent, false)
assert.match(auditNoTLS.reason, /底层网络将暴露 Chrome 138/)
assert.ok(auditNoTLS.suggestedPolicy)

// 场景 B: UA 是 120，但 TLS 错误配置了 ML-KEM 或开启后量子 -> 检出矛盾
const badPolicy120 = { ...config120, postQuantumKeyAgreementEnabled: true, supportedGroups: [4588, 29, 23] }
const auditBadPQ = auditTLSVersionConsistency(profile120, badPolicy120, { runtimeVersion })
assert.equal(auditBadPQ.consistent, false)
assert.match(auditBadPQ.reason, /启用了后量子协商/)

// 场景 C: UA 是 120，TLS 错误使用了新版 ALPS 17613 -> 检出矛盾
const badALPSPolicy = { ...config120, alpsCodepoint: 17613 }
const auditBadALPS = auditTLSVersionConsistency(profile120, badALPSPolicy, { runtimeVersion })
assert.equal(auditBadALPS.consistent, false)
assert.match(auditBadALPS.reason, /新版 ALPS/)

// 场景 D: UA 是 120，TLS 正确配置为 Chrome 120 策略 -> 判定完全一致
const auditGood = auditTLSVersionConsistency(profile120, config120, { runtimeVersion })
assert.equal(auditGood.consistent, true)
assert.equal(auditGood.mode, 'cross-version')
assert.equal(auditGood.targetMajor, 120)

// 5. assertTLSRuntimeIdentity 跨版本校验
const rawProfile120 = getDefaultProfile()
rawProfile120.browser.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.109 Safari/537.36'

// 原生模式下拒绝非 138 UA
assert.throws(() => assertTLSRuntimeIdentity(rawProfile120, runtimeVersion), /用户代理完整版本/)
// 带有自洽跨版本 TLS 策略时，跨版本链路放行通过
rawProfile120.tlsFingerprint = config120
assert.doesNotThrow(() => assertTLSRuntimeIdentity(rawProfile120, runtimeVersion, { allowCrossVersion: true }))

// 6. previewFingerprintProfile 跨版本集成预览
const runtime = { platform: 'win32', chromiumVersion: runtimeVersion }
const preview = previewFingerprintProfile(rawProfile120, runtime, null, { allowCrossVersion: true })
assert.equal(preview.canSave, true, '跨版本自洽配置应该允许保存')
assert.equal(preview.errors.length, 0, '错误列表应为空')
assert.ok(preview.warnings.some(w => w.includes('已启用 Chrome 120 跨版本 TLS 仿真')), '应给出跨版本仿真成功提示')

console.log('TLS 跨浏览器版本伪装链路自检全部通过。')
