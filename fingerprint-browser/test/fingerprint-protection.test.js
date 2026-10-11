const assert = require('node:assert/strict')
const { getDefaultProfile } = require('../profile-store')
const { describeFingerprintProtection } = require('../fingerprint-protection')

const profile = getDefaultProfile()
const before = structuredClone(profile)
assert.deepEqual(describeFingerprintProtection(profile).configured, [])
assert.match(describeFingerprintProtection(profile, { mode: 'http' }).warnings.join(''), /非代理 UDP/)
profile.noise.canvas = true
assert.match(describeFingerprintProtection(profile).warnings.join(''), /对应模块关闭/)
assert.equal(describeFingerprintProtection(profile).configured.includes('画布读回保护'), false)
profile.modules.canvas = true
profile.modules.audio = true
profile.noise.audio = true
profile.noise.rects = true
profile.modules.webrtc = true
const enabled = describeFingerprintProtection(profile, { mode: 'http' })
assert.ok(enabled.configured.includes('画布读回保护'))
assert.ok(enabled.configured.includes('音频读回保护'))
assert.ok(enabled.configured.includes('元素几何保护'))
assert.ok(enabled.configured.includes('WebGL 像素保护（部分格式）'))
assert.equal(enabled.warnings.length, 0)
profile.graphics.webglRenderer = ''
assert.equal(describeFingerprintProtection(profile).configured.includes('WebGL 像素保护（部分格式）'), false)
profile.enabled = false
assert.deepEqual(describeFingerprintProtection(profile).configured, [])
const inconsistent = structuredClone(before)
inconsistent.browser.userAgent = 'Mozilla/5.0 Chrome/139.0.0.0'
inconsistent.locale.languages = ['en-US']
assert.equal(describeFingerprintProtection(inconsistent).warnings.length, 2)
describeFingerprintProtection(before)
assert.deepEqual(before, getDefaultProfile())
console.log('保护范围、配置矛盾和模块开关自检通过。')
