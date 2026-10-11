const assert = require('node:assert/strict')
const { getDefaultProfile, createFingerprintProfile } = require('../profile-store')
const { previewFingerprintProfile, assertFingerprintSave } = require('../fingerprint-review')

const runtime = { platform: 'win32', chromiumVersion: '138.0.7204.185' }
const profile = getDefaultProfile()
const before = structuredClone(profile)
assert.equal(previewFingerprintProfile(profile, runtime).canSave, true)
assert.deepEqual(profile, before)
for (const version of ['138.0.0.0', runtime.chromiumVersion]) {
  const input = structuredClone(profile)
  input.browser.userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/${version} Safari/537.36`
  assert.equal(previewFingerprintProfile(input, runtime).canSave, true)
}
for (const [change, message] of [
  [input => { input.browser.userAgent = 'Mozilla/5.0 (Windows NT 10.0) Chrome/139.0.0.0' }, /Chrome 主版本/],
  [input => { input.browser.userAgent = 'Mozilla/5.0 (Windows NT 10.0) Chrome/138.0.1.1' }, /完整版本/],
  [input => { input.browser.userAgent = 'Mozilla/5.0 (Linux; Android 15) Chrome/138.0.0.0 Mobile' }, /桌面宿主/],
  [input => { input.hardware.platform = 'MacIntel' }, /本机不一致/],
  [input => { input.locale.languages = ['en-US'] }, /语言列表首项/],
  [input => { input.browser.acceptLanguage = 'en-US,zh-CN;q=0.5' }, /优先级最高/],
  [input => { input.browser.acceptLanguage = 'zh-CN;q=1.1' }, /请求语言格式/],
  [input => { input.browser.acceptLanguage = 'zh-CN;q=0' }, /请求语言格式/]
]) {
  const input = structuredClone(profile)
  change(input)
  assert.equal(previewFingerprintProfile(input, runtime).canSave, false)
  assert.throws(() => assertFingerprintSave(input, runtime), message)
  assert.doesNotThrow(() => createFingerprintProfile(input), '读取旧配置不应触发新的组合限制。')
  input.enabled = false
  assert.equal(previewFingerprintProfile(input, runtime).canSave, true, '关闭指纹时不应限制原生表面。')
}
const weighted = structuredClone(profile)
weighted.browser.acceptLanguage = 'en-US;q=0,ZH-cn;q=0.9,zh;q=0.8'
weighted.locale.languages[0] = 'ZH-cn'
assert.equal(previewFingerprintProfile(weighted, runtime).canSave, true)
assert.deepEqual(previewFingerprintProfile(weighted, runtime).warnings, [], '语言标记大小写不应产生矛盾提示。')
const disabled = structuredClone(profile)
disabled.modules.locale = false
disabled.locale.languages = ['en-US']
disabled.browser.acceptLanguage = '自定义'
disabled.modules.navigator = false
disabled.modules.fonts = false
disabled.hardware.platform = 'MacIntel'
assert.equal(previewFingerprintProfile(disabled, runtime).canSave, true)
assert.equal(previewFingerprintProfile(profile, { ...runtime, chromiumVersion: '139.0.0.0' }).canSave, false)
for (const [platform, hardwarePlatform] of [['darwin', 'MacIntel'], ['linux', 'Linux x86_64']]) {
  const input = structuredClone(profile)
  input.hardware.platform = hardwarePlatform
  assert.match(previewFingerprintProfile(input, { ...runtime, platform }).errors.join(''), /图形后端/)
  input.graphics.webglVendor = ''
  input.graphics.webglRenderer = ''
  assert.equal(previewFingerprintProfile(input, { ...runtime, platform }).canSave, true)
}
const legacy = structuredClone(profile)
legacy.hardware.deviceMemory = 16
const preview = previewFingerprintProfile(legacy, runtime)
assert.equal(legacy.hardware.deviceMemory, 16)
assert.equal(preview.fingerprint.hardware.deviceMemory, 8)
assert.deepEqual(preview.changes.map(({ field, before, after }) => ({ field, before, after })), [{ field: 'hardware.deviceMemory', before: 16, after: 8 }])
assert.equal(preview.fingerprint.noise.seed, legacy.noise.seed)
assert.throws(() => assertFingerprintSave(legacy, runtime), /先预览并确认/)
assert.doesNotThrow(() => assertFingerprintSave(preview.fingerprint, runtime))
assert.throws(() => previewFingerprintProfile(null, runtime), /必须是对象/)
console.log('配置组合校验、模块边界、宿主匹配和旧内存只读预览自检通过。')
