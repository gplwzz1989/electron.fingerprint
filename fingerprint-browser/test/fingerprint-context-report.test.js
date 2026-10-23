const assert = require('node:assert/strict')
const {
  validateContextReport, getContextFallbackFields, getWebGPUProtectionFailures,
  getMissingContextHintHeaders, getContextHintMismatches, getWebGPUBaselineStatus
} = require('../scripts/test-fingerprint')

const contexts = ['page', 'dedicated', 'shared', 'serviceWorker', 'sameOriginFrame', 'crossOriginFrame']
const webgpuModes = ['default', 'low-power', 'high-performance', 'force-fallback']
const values = Object.fromEntries(contexts.map(context => [context, {
  userAgent: '诊断用户代理', platform: 'Win32', language: 'en-US', languages: ['en-US', 'en'],
  hardwareConcurrency: 4, deviceMemory: 8, timezone: 'America/New_York',
  hints: { platform: 'Windows' }, webglVendor: '测试厂商', webgpu: {
    supported: true,
    requests: Object.fromEntries(webgpuModes.map(mode => [mode, { adapter: false, device: false, adapterError: false, deviceError: false }]))
  },
  headers: { userAgent: '诊断用户代理', language: 'en-US,en;q=0.9', hints: {} }
}]))
const initial = {
  phase: 'initial', ok: true, failures: [], unverified: [], notApplicable: [], runtime: { electron: '37.2.6', chrome: '138.0.7204.185' },
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
  report => { delete report.notApplicable },
  report => { report.samples[2].index = 1 },
  report => { delete report.samples[1].values.shared },
  report => { delete report.samples[1].refreshed.crossOriginFrame },
  report => { delete report.samples[1].values.shared.headers.hints },
  report => { report.samples[1].values.crossOriginFrame.hints = null },
  report => { report.samples[1].values.dedicated.languages = ['fr-FR'] },
  report => { delete report.samples[1].refreshed.sameOriginFrame.webgpu.requests['high-performance'] },
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
assert.deepEqual(getWebGPUProtectionFailures(values.page.webgpu), [])
const webgpuLeak = structuredClone(values.page.webgpu)
webgpuLeak.requests['force-fallback'].adapter = true
assert.deepEqual(getWebGPUProtectionFailures(webgpuLeak), ['force-fallback.adapter'])
const webgpuError = structuredClone(values.page.webgpu)
webgpuError.requests['high-performance'].adapterError = true
assert.deepEqual(getWebGPUProtectionFailures(webgpuError), ['high-performance.adapterError'])
assert.equal(getWebGPUBaselineStatus({ supported: false, requests: {} }), 'not-applicable')
assert.equal(getWebGPUBaselineStatus({ supported: true, requests: { default: { adapter: false, device: false } } }), 'not-applicable')
assert.equal(getWebGPUBaselineStatus({ supported: true, requests: { default: { adapter: true, device: true } } }), 'ready')
assert.equal(getWebGPUBaselineStatus({ supported: true, requests: { default: { adapter: true, device: false, deviceError: true } } }), 'unverified')
const contextHints = {
  hints: {
    fullVersionList: [
      { brand: 'Chromium', version: '138.0.0.0' },
      { brand: 'Google Chrome', version: '138.0.0.0' }
    ],
    platform: 'Windows',
    architecture: 'x86',
    bitness: '64'
  },
  headers: {
    hints: {
      'sec-ch-ua-full-version-list': '"Chromium";v="138.0.0.0", "Google Chrome";v="138.0.0.0"',
      'sec-ch-ua-platform': '"Windows"',
      'sec-ch-ua-arch': '"x86"',
      'sec-ch-ua-bitness': '"64"'
    }
  }
}
assert.deepEqual(getContextHintMismatches(contextHints), [])
assert.deepEqual(getMissingContextHintHeaders(contextHints), [])
const reorderedContextHints = structuredClone(contextHints)
reorderedContextHints.headers.hints['sec-ch-ua-full-version-list'] = '"Google Chrome";v="138.0.0.0", "Chromium";v="138.0.0.0"'
assert.deepEqual(getContextHintMismatches(reorderedContextHints), [])
const extraContextHint = structuredClone(contextHints)
extraContextHint.headers.hints['sec-ch-ua-full-version-list'] += ', "Rogue Browser";v="1.0.0.0"'
assert.deepEqual(getContextHintMismatches(extraContextHint), ['sec-ch-ua-full-version-list'])
const inconsistentContextHints = structuredClone(contextHints)
inconsistentContextHints.headers.hints['sec-ch-ua-platform'] = '"Linux"'
assert.deepEqual(getContextHintMismatches(inconsistentContextHints), ['sec-ch-ua-platform'])
const incompleteContextHints = structuredClone(contextHints)
incompleteContextHints.headers.hints['sec-ch-ua-full-version-list'] += ','
assert.deepEqual(getContextHintMismatches(incompleteContextHints), ['sec-ch-ua-full-version-list'])
assert.deepEqual(getMissingContextHintHeaders({ headers: { hints: {} } }), [
  'sec-ch-ua-full-version-list', 'sec-ch-ua-platform', 'sec-ch-ua-arch', 'sec-ch-ua-bitness'
])
const mismatchedContextReport = structuredClone(initial)
mismatchedContextReport.samples[1].refreshed.shared.headers.hints['sec-ch-ua-platform'] = '"Linux"'
assert.throws(() => validateContextReport(mismatchedContextReport, 'initial'), /请求值与高熵值不一致/)
for (const change of [
  report => { report.runtime.chrome = '139.0.0.0' },
  report => { report.samples[1].values.serviceWorker.languages = ['en-US'] },
  report => { report.samples[2].values.crossOriginFrame.webgpu.requests.default.adapter = true },
  report => { report.samples[1].values.page.headers.language = 'zh-CN' }
]) {
  const changed = structuredClone(restored)
  change(changed)
  assert.throws(() => validateContextReport(changed, 'restore', initial), /指纹验证/)
}
console.log('上下文报告完整性及重启身份比对自检通过。')
