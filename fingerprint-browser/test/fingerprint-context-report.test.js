const assert = require('node:assert/strict')
const { validateContextReport, getContextFallbackFields } = require('../scripts/test-fingerprint')

const contexts = ['page', 'dedicated', 'shared', 'serviceWorker', 'sameOriginFrame', 'crossOriginFrame']
const values = Object.fromEntries(contexts.map(context => [context, {
  userAgent: '诊断用户代理', platform: 'Win32', language: 'en-US', languages: ['en-US', 'en'],
  hardwareConcurrency: 4, deviceMemory: 8, timezone: 'America/New_York',
  hints: { platform: 'Windows' }, webglVendor: '测试厂商', webgpu: { adapter: false, device: false },
  headers: { userAgent: '诊断用户代理', language: 'en-US,en;q=0.9', hints: {} }
}]))
const initial = {
  phase: 'initial', ok: true, failures: [], unverified: [], runtime: { electron: '37.2.6', chrome: '138.0.7204.185' },
  samples: Array.from({ length: 7 }, (_, index) => ({ index, values: structuredClone(values), refreshed: structuredClone(values) })),
  tlsComparison: { direct: { throughProxy: false }, tunnel: { throughProxy: true } }
}
const restored = { ...structuredClone(initial), phase: 'restore' }
assert.doesNotThrow(() => validateContextReport(initial, 'initial'))
assert.doesNotThrow(() => validateContextReport(restored, 'restore', initial))
assert.throws(() => validateContextReport(restored, 'restore'), /首次运行对照/)
const unverifiedHints = structuredClone(initial)
unverifiedHints.unverified.push('工作线程缺少高熵提示请求头。')
assert.doesNotThrow(() => validateContextReport(unverifiedHints, 'initial'))
assert.throws(() => validateContextReport(unverifiedHints, 'initial', undefined, true), /高熵/)
for (const change of [
  report => { report.ok = false },
  report => { report.failures.push({ message: '测试失败。' }) },
  report => { report.samples.pop() },
  report => { report.samples[2].index = 1 },
  report => { delete report.samples[1].values.shared },
  report => { delete report.samples[1].refreshed.crossOriginFrame },
  report => { delete report.samples[1].values.shared.headers.hints },
  report => { report.samples[1].values.crossOriginFrame.hints = null },
  report => { report.samples[1].values.dedicated.languages = ['fr-FR'] },
  report => { report.samples[1].refreshed.sameOriginFrame.webgpu.device = true },
  report => { report.tlsComparison.tunnel.throughProxy = false }
]) {
  const incomplete = structuredClone(initial)
  change(incomplete)
  assert.throws(() => validateContextReport(incomplete, 'initial'), /指纹验证/)
}
assert.deepEqual(getContextFallbackFields(null), ['userAgent', 'platform', 'language', 'languages', 'hardwareConcurrency', 'deviceMemory', 'timezone', 'hints', 'webglVendor', 'webgpu', 'headers.userAgent', 'headers.language', 'headers.hints'])
assert.deepEqual(getContextFallbackFields({
  enabled: true,
  modules: { ua: true, clientHints: false, locale: true, timezone: true, navigator: true, webgl: false }
}), ['hints', 'headers.hints', 'webglVendor', 'webgpu'])
for (const change of [
  report => { report.runtime.chrome = '139.0.0.0' },
  report => { report.samples[1].values.serviceWorker.languages = ['en-US'] },
  report => { report.samples[2].values.crossOriginFrame.webgpu.adapter = true },
  report => { report.samples[1].values.page.headers.language = 'zh-CN' }
]) {
  const changed = structuredClone(restored)
  change(changed)
  assert.throws(() => validateContextReport(changed, 'restore', initial), /指纹验证/)
}
console.log('上下文报告完整性及重启身份比对自检通过。')
