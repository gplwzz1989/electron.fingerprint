const assert = require('node:assert/strict')
const { getDefaultProfile, createProfileRecord, createTLSFingerprintConfig } = require('../profile-store')
const { applyFingerprintConfig } = require('../runtime-compat')
const { assertTLSRuntimeIdentity, applyTLSFingerprintConfig, applyEnvironmentTLSFingerprintConfig } = require('../tls-fingerprint')

const version = '138.0.7204.185'
const profile = getDefaultProfile()
assert.doesNotThrow(() => assertTLSRuntimeIdentity(profile, version))
for (const uaVersion of [version, '138.0.0.0']) {
  profile.browser.userAgent = `Mozilla/5.0 Chrome/${uaVersion}`
  assert.doesNotThrow(() => assertTLSRuntimeIdentity(profile, version))
}
const oldChrome = Object.getOwnPropertyDescriptor(process.versions, 'chrome')
Object.defineProperty(process.versions, 'chrome', { value: version, configurable: true })
try {
  let runtimeCalls = 0
  for (const userAgent of [
    'Mozilla/5.0 Chrome/138.0.0.0 Chrome/120.0.0.0',
    'Mozilla/5.0 Chrome/138.0.0.0 Chrome/138.0.0.0',
    'Mozilla/5.0 Chrome/138.0.0.0.123',
    'Mozilla/5.0 Brand-Chrome/138.0.0.0',
    'Mozilla/5.0 Chrome/138.0.0.0/other',
    'Chrome/138.0.0.0\n',
    'Chrome/138.0.0.0\t'
  ]) {
    profile.browser.userAgent = userAgent
    assert.throws(() => assertTLSRuntimeIdentity(profile, version), /TLS 内核/)
    assert.throws(() => applyFingerprintConfig({ setFingerprintConfig () { runtimeCalls++ } }, profile), /TLS 内核/)
  }
  assert.equal(runtimeCalls, 0, '无效 UA 必须在调用旧运行时之前被拒绝。')
  for (const userAgent of ['Chrome/138.0.0.0', `Mozilla/5.0 Chrome/${version})`]) {
    profile.browser.userAgent = userAgent
    assert.doesNotThrow(() => assertTLSRuntimeIdentity(profile, version))
  }
} finally {
  if (oldChrome) Object.defineProperty(process.versions, 'chrome', oldChrome)
  else delete process.versions.chrome
}
for (const uaVersion of ['139.0.0.0', '138.0.1.1']) {
  profile.browser.userAgent = `Mozilla/5.0 Chrome/${uaVersion}`
  profile.modules.clientHints = false
  assert.throws(() => assertTLSRuntimeIdentity(profile, version), /TLS 内核/)
}
profile.enabled = false
assert.doesNotThrow(() => assertTLSRuntimeIdentity(profile, version))
profile.enabled = true
profile.browser.userAgent = null
assert.throws(() => assertTLSRuntimeIdentity(profile, '139.0.0.0'), /主版本/)
let applied
const capabilities = { schemaVersion: 1, chromiumVersion: version, cipherOrder: 'tls1.2', extensionPermutation: true, ech: true, postQuantumKeyAgreement: true, supportedGroups: true, signatureAlgorithms: true }
const fakeSession = {
  getTLSFingerprintCapabilities: () => capabilities,
  setSSLConfig: config => { applied = config }
}
const policy = { cipherSuites: [0xc02f, 0xc030], permuteExtensions: false }
applyTLSFingerprintConfig(fakeSession, policy, version)
assert.deepEqual(applied.fingerprint, { ...policy, chromiumVersion: version })
assert.deepEqual(policy, { cipherSuites: [0xc02f, 0xc030], permuteExtensions: false })
assert.throws(() => applyTLSFingerprintConfig({}, policy, version), /未包含 TLS/)
assert.throws(() => applyTLSFingerprintConfig(fakeSession, policy, '139.0.0.0'), /不一致/)
assert.throws(() => applyTLSFingerprintConfig(fakeSession, { chromiumVersion: '139.0.0.0' }, version), /当前内核版本/)
assert.throws(() => applyTLSFingerprintConfig({ ...fakeSession, getTLSFingerprintCapabilities: () => null }, policy, version), /不一致/)
assert.throws(() => applyTLSFingerprintConfig({ ...fakeSession, getTLSFingerprintCapabilities () { throw new Error('底层错误') } }, policy, version), /无法读取当前运行时/)
const storedPolicy = { chromiumVersion: version, ...policy, supportedGroups: [29, 23], signatureAlgorithms: [0x0403, 0x0804], postQuantumKeyAgreementEnabled: false }
const record = createProfileRecord({ fingerprint: getDefaultProfile(), tlsFingerprint: storedPolicy })
assert.deepEqual(record.tlsFingerprint, storedPolicy)
record.tlsFingerprint.cipherSuites.reverse()
assert.deepEqual(storedPolicy.cipherSuites, policy.cipherSuites, '保存策略不得共享调用方的可变数组。')
assert.equal(Object.hasOwn(createProfileRecord({ fingerprint: getDefaultProfile() }), 'tlsFingerprint'), false)
assert.equal(Object.hasOwn(createProfileRecord({ fingerprint: getDefaultProfile(), tlsFingerprint: null }), 'tlsFingerprint'), false)
for (const invalid of [[], '策略', {}, { chromiumVersion: '139.0.0.0' }, { ...storedPolicy, unknown: true }, { ...storedPolicy, permuteExtensions: 'false' }, { ...storedPolicy, supportedGroups: [4588] }]) {
  assert.throws(() => createTLSFingerprintConfig(invalid), /TLS|Chrome/)
}
for (const field of ['cipherSuites', 'supportedGroups', 'signatureAlgorithms']) {
  for (const values of [[], null, [0], [storedPolicy[field][0], storedPolicy[field][0]], [storedPolicy[field][0] + 0.5]]) {
    assert.throws(() => createTLSFingerprintConfig({ ...storedPolicy, [field]: values }), /TLS/)
  }
}
for (const field of ['supportedGroups', 'signatureAlgorithms']) {
  assert.throws(() => applyTLSFingerprintConfig({ ...fakeSession, getTLSFingerprintCapabilities: () => ({ ...capabilities, [field]: false }) }, storedPolicy, version), /不支持 TLS 策略字段/)
}
const alpsSession = { ...fakeSession, getTLSFingerprintCapabilities: () => ({ ...capabilities, alpsCodepoints: [17513, 17613] }) }
for (const alpsCodepoint of [17513, 17613]) {
  const alpsPolicy = { ...storedPolicy, alpsCodepoint }
  assert.equal(createProfileRecord({ fingerprint: getDefaultProfile(), tlsFingerprint: alpsPolicy }).tlsFingerprint.alpsCodepoint, alpsCodepoint)
  applyTLSFingerprintConfig(alpsSession, alpsPolicy, version)
  assert.equal(applied.fingerprint.alpsCodepoint, alpsCodepoint)
  assert.throws(() => applyTLSFingerprintConfig(fakeSession, alpsPolicy, version), /不支持所选的 ALPS/)
}
for (const alpsCodepoint of [0, null, undefined, 17513.5, '17513', [], 65535]) {
  assert.throws(() => createTLSFingerprintConfig({ ...storedPolicy, alpsCodepoint }), /ALPS/)
}
for (const alpsCodepoints of [[17513], ['17613'], true, null]) {
  assert.throws(() => applyTLSFingerprintConfig({ ...alpsSession, getTLSFingerprintCapabilities: () => ({ ...capabilities, alpsCodepoints }) }, { ...storedPolicy, alpsCodepoint: 17613 }, version), /不支持所选的 ALPS/)
}
applyTLSFingerprintConfig(fakeSession, storedPolicy, version)
assert.equal(Object.hasOwn(applied.fingerprint, 'alpsCodepoint'), false, '未声明 ALPS 标识时应保持原生默认。')
let firstCalls = 0
let secondCalls = 0
const firstSession = { ...fakeSession, setSSLConfig () { firstCalls++ } }
const secondSession = { ...fakeSession, setSSLConfig () { secondCalls++ } }
const firstPolicy = structuredClone(storedPolicy)
applyEnvironmentTLSFingerprintConfig(firstSession, firstPolicy, version)
firstPolicy.cipherSuites.reverse()
applyEnvironmentTLSFingerprintConfig(firstSession, structuredClone(storedPolicy), version)
assert.equal(firstCalls, 1, '重复打开环境不能重复应用 TLS 配置或重置连接。')
applyEnvironmentTLSFingerprintConfig(secondSession, { ...storedPolicy, cipherSuites: [0xc030] }, version)
assert.equal(secondCalls, 1, '不同环境应独立应用 TLS 策略。')
for (const changed of [undefined, null, { ...storedPolicy, cipherSuites: [0xc030] }]) {
  assert.throws(() => applyEnvironmentTLSFingerprintConfig(firstSession, changed, version), /重启客户端/)
}
assert.equal(firstCalls, 1)
const nativeSession = {}
applyEnvironmentTLSFingerprintConfig(nativeSession, undefined, version)
applyEnvironmentTLSFingerprintConfig(nativeSession, null, version)
assert.throws(() => applyEnvironmentTLSFingerprintConfig(nativeSession, storedPolicy, version), /重启客户端/)
assert.throws(() => applyEnvironmentTLSFingerprintConfig({}, storedPolicy, version), /未包含 TLS/)
assert.throws(() => applyEnvironmentTLSFingerprintConfig({}, storedPolicy, '138.0.7204.186'), /当前内核版本不一致/)
const retrySession = { ...fakeSession, setSSLConfig () { throw new Error('底层错误') } }
assert.throws(() => applyEnvironmentTLSFingerprintConfig(retrySession, storedPolicy, version), /TLS 策略无效/)
retrySession.setSSLConfig = () => { firstCalls++ }
applyEnvironmentTLSFingerprintConfig(retrySession, storedPolicy, version)
assert.equal(firstCalls, 2, '策略应用失败不得把会话错误锁定为已成功状态。')
fakeSession.setSSLConfig = () => { throw new Error('底层错误') }
assert.throws(() => applyTLSFingerprintConfig(fakeSession, policy, version), error => /TLS 策略无效/.test(error.message) && !error.message.includes('底层错误'))
console.log('TLS 版本绑定、持久化格式、会话隔离和策略锁定自检通过。')
