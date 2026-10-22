const assert = require('node:assert/strict')
const { getDefaultProfile } = require('../profile-store')
const { assertTLSRuntimeIdentity, applyTLSFingerprintConfig } = require('../tls-fingerprint')

const version = '138.0.7204.185'
const profile = getDefaultProfile()
assert.doesNotThrow(() => assertTLSRuntimeIdentity(profile, version))
for (const uaVersion of [version, '138.0.0.0']) {
  profile.browser.userAgent = `Mozilla/5.0 Chrome/${uaVersion}`
  assert.doesNotThrow(() => assertTLSRuntimeIdentity(profile, version))
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
const fakeSession = {
  getTLSFingerprintCapabilities: () => ({ schemaVersion: 1, chromiumVersion: version }),
  setSSLConfig: config => { applied = config }
}
const policy = { cipherSuites: [0xc02f, 0xc030], permuteExtensions: false }
applyTLSFingerprintConfig(fakeSession, policy, version)
assert.deepEqual(applied.fingerprint, { ...policy, chromiumVersion: version })
assert.deepEqual(policy, { cipherSuites: [0xc02f, 0xc030], permuteExtensions: false })
assert.throws(() => applyTLSFingerprintConfig({}, policy, version), /未包含 TLS/)
assert.throws(() => applyTLSFingerprintConfig(fakeSession, policy, '139.0.0.0'), /不一致/)
assert.throws(() => applyTLSFingerprintConfig(fakeSession, { chromiumVersion: '139.0.0.0' }, version), /当前内核版本/)
assert.throws(() => applyTLSFingerprintConfig({ getTLSFingerprintCapabilities: () => null }, policy, version), /不一致/)
assert.throws(() => applyTLSFingerprintConfig({ getTLSFingerprintCapabilities () { throw new Error('底层错误') } }, policy, version), /无法读取当前运行时/)
fakeSession.setSSLConfig = () => { throw new Error('底层错误') }
assert.throws(() => applyTLSFingerprintConfig(fakeSession, policy, version), error => /TLS 策略无效/.test(error.message) && !error.message.includes('底层错误'))
console.log('TLS 版本绑定、策略接口和错误包装自检通过。')
