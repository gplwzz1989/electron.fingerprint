const path = require('node:path')
const fs = require('node:fs/promises')
const { createReadStream } = require('node:fs')
const { createHash, randomUUID } = require('node:crypto')
const { spawn, execFile } = require('node:child_process')
const { promisify, isDeepStrictEqual } = require('node:util')
const { getLaunchOptions } = require('./start')
const { createDiagnosticTLS } = require('./fingerprint-tls')
const { validateTLSReference } = require('../test/tls-client-hello')

const projectRoot = path.resolve(__dirname, '..', '..')
const execute = promisify(execFile)

async function hashFile (filename) {
  try {
    const stat = await fs.stat(filename)
    const hash = createHash('sha256')
    for await (const chunk of createReadStream(filename)) hash.update(chunk)
    return { path: filename, bytes: stat.size, sha256: hash.digest('hex') }
  } catch (error) {
    if (error.code === 'ENOENT') return { path: filename, missing: true }
    throw new Error('无法读取基线文件，请检查文件权限。')
  }
}

async function readTLSReference (filename) {
  try {
    const stat = await fs.stat(filename)
    if (!stat.isFile() || stat.size > 262144) throw new Error()
    const bytes = await fs.readFile(filename)
    if (bytes.length > 262144) throw new Error()
    const input = JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/, ''))
    const reference = validateTLSReference(input)
    return { bytes, reference, sha256: createHash('sha256').update(bytes).digest('hex') }
  } catch {
    throw new Error('指纹验证无法读取 TLS 对照样本，请检查文件路径、大小和 Chrome 样本格式。')
  }
}

function validateContextReport (report, phase, previous, requireClientHints = false) {
  const contexts = ['page', 'dedicated', 'shared', 'serviceWorker', 'sameOriginFrame', 'crossOriginFrame']
  const webgpuModes = ['default', 'low-power', 'high-performance', 'force-fallback']
  if (report?.phase !== phase || report.ok !== true || !Array.isArray(report.failures) || report.failures.length || !Array.isArray(report.unverified) || report.samples?.length !== 7) throw new Error('指纹验证报告不完整或存在失败项。')
  if (requireClientHints && report.unverified.length) throw new Error('指纹验证的高熵客户端提示仍有未验证项。')
  if (phase === 'restore' && !previous) throw new Error('指纹验证缺少首次运行对照。')
  if (previous && !isDeepStrictEqual(report.runtime, previous.runtime)) throw new Error('指纹验证两阶段运行时不一致。')
  for (let index = 0; index < report.samples.length; index++) {
    const sample = report.samples[index]
    if (sample.index !== index || contexts.some(context => !sample.values?.[context] || !sample.refreshed?.[context])) throw new Error('指纹验证缺少环境或上下文样本。')
    for (const context of contexts) {
      for (const value of [sample.values[context], sample.refreshed[context]]) {
        if (['userAgent', 'platform', 'language', 'languages', 'hardwareConcurrency', 'deviceMemory', 'timezone', 'hints', 'webglVendor', 'webgpu', 'headers'].some(field => !Object.hasOwn(value, field)) || typeof value.webgpu?.supported !== 'boolean' || !value.headers || !value.headers.hints) throw new Error('指纹验证缺少上下文信号字段。')
        for (const mode of webgpuModes) {
          const request = value.webgpu.requests?.[mode]
          if (!request || ['adapter', 'device', 'adapterError', 'deviceError'].some(field => typeof request[field] !== 'boolean')) throw new Error('指纹验证缺少 WebGPU 请求模式结果。')
        }
      }
      const current = sample.values[context]
      const page = sample.values.page
      const refreshed = sample.refreshed[context]
      for (const field of ['userAgent', 'platform', 'language', 'languages', 'hardwareConcurrency', 'deviceMemory', 'timezone', 'hints']) {
        if (!isDeepStrictEqual(current[field], page[field])) throw new Error(`指纹验证环境 ${index} 的 ${context} 与页面配置不一致。`)
      }
      if (current.headers.userAgent !== page.headers.userAgent || current.headers.language !== page.headers.language) throw new Error(`指纹验证环境 ${index} 的 ${context} 请求身份与页面不一致。`)
      for (const field of ['userAgent', 'platform', 'language', 'languages', 'hardwareConcurrency', 'deviceMemory', 'timezone', 'hints', 'webglVendor', 'webgpu']) {
        if (!isDeepStrictEqual(current[field], refreshed[field])) throw new Error(`指纹验证环境 ${index} 的 ${context} 刷新后信号改变。`)
      }
      if (current.headers.userAgent !== refreshed.headers.userAgent || current.headers.language !== refreshed.headers.language) throw new Error(`指纹验证环境 ${index} 的 ${context} 刷新后请求身份改变。`)
    }
    if (!previous) continue
    for (const context of contexts) {
      const before = previous.samples[index].values[context]
      const after = sample.values[context]
      for (const field of ['userAgent', 'platform', 'language', 'languages', 'hardwareConcurrency', 'deviceMemory', 'timezone', 'hints', 'webglVendor', 'webgpu']) {
        if (!isDeepStrictEqual(after[field], before[field])) throw new Error(`指纹验证重启后环境 ${index} 的 ${context} 身份或图形策略改变。`)
      }
      if (after.headers?.userAgent !== before.headers?.userAgent || after.headers?.language !== before.headers?.language) throw new Error(`指纹验证重启后环境 ${index} 请求身份改变。`)
    }
  }
  if (report.tlsComparison?.direct?.throughProxy !== false || report.tlsComparison?.tunnel?.throughProxy !== true) throw new Error('指纹验证缺少直连与代理 TLS 对照。')
}

function getContextFallbackFields (profile) {
  if (!profile?.enabled) return ['userAgent', 'platform', 'language', 'languages', 'hardwareConcurrency', 'deviceMemory', 'timezone', 'hints', 'webglVendor', 'webgpu', 'headers.userAgent', 'headers.language', 'headers.hints']
  const fields = []
  if (!profile.modules.ua) fields.push('userAgent', 'headers.userAgent')
  if (!profile.modules.clientHints) fields.push('hints', 'headers.hints')
  if (!profile.modules.locale) fields.push('language', 'languages', 'headers.language')
  if (!profile.modules.timezone) fields.push('timezone')
  if (!profile.modules.navigator) fields.push('platform', 'hardwareConcurrency', 'deviceMemory')
  if (!profile.modules.webgl) fields.push('webglVendor', 'webgpu')
  return fields
}

function getWebGPUProtectionFailures (webgpu) {
  const failures = []
  for (const [mode, request] of Object.entries(webgpu?.requests || {})) {
    for (const field of ['adapter', 'device', 'adapterError', 'deviceError']) {
      if (request?.[field]) failures.push(`${mode}.${field}`)
    }
  }
  return failures
}

function validateTLSReport (report, baselineOnly, reference) {
  if (report?.ok !== true || report.baselineOnly !== baselineOnly || report.implementationVerified !== !baselineOnly || !Array.isArray(report.failures) || report.failures.length || !Array.isArray(report.samples) || !report.samples.length) throw new Error('指纹验证缺少有效的 TLS 策略结果。')
  if (typeof report.runtime?.chrome !== 'string' || !['win32', 'darwin', 'linux'].includes(report.platform)) throw new Error('指纹验证缺少实际 TLS 运行时身份。')
  const names = baselineOnly ? ['native'] : ['native', 'chrome138', 'custom', 'legacy-pq', 'update-before', 'update-custom', 'reset', 'native-after']
  const expectedKeys = names.flatMap(name => ['direct', 'tunnel'].map(route => `${name}:${route}`)).sort()
  const keys = samples => samples.map(sample => `${sample.name}:${sample.route}`).sort()
  if (!isDeepStrictEqual(keys(report.samples), expectedKeys) || report.samples.some(sample => sample.baselineComparison?.matches !== true || sample.hello?.throughProxy !== (sample.route === 'tunnel') || (sample.route === 'tunnel' && sample.tunnelComparison?.matches !== true))) throw new Error('指纹验证缺少完整的 TLS 直连、代理或生命周期样本。')
  const comparison = report.independentReference
  if (reference) {
    if (comparison?.provided !== true || comparison.compared !== true || comparison.matches !== true || comparison.sha256 !== reference.sha256 || !isDeepStrictEqual(comparison.browser, reference.browser) || comparison.platform !== reference.platform || !Array.isArray(comparison.samples) || !comparison.samples.length || comparison.samples.some(sample => sample.matches !== true || !Array.isArray(sample.differences) || sample.differences.length)) throw new Error('指纹验证缺少有效的独立 TLS 样本对照结果。')
    const expectedComparisons = report.samples.filter(sample => !['custom', 'update-custom', 'legacy-pq'].includes(sample.name))
    if (!isDeepStrictEqual(keys(comparison.samples), keys(expectedComparisons))) throw new Error('指纹验证的独立 TLS 对照未覆盖所有默认策略样本。')
    if (comparison.runtimeIdentityMatches !== (reference.browser.version === report.runtime.chrome && reference.platform === report.platform)) throw new Error('指纹验证的目标身份与实际运行时身份标记不一致。')
  } else if (comparison?.provided !== false || comparison.compared !== false || comparison.matches !== null || comparison.runtimeIdentityMatches !== null) throw new Error('指纹验证未提供独立 TLS 样本，不能声明独立对照通过。')
}

async function run () {
  const contexts = process.argv.includes('--contexts')
  const tlsBaselineOnly = process.argv.includes('--tls-baseline')
  const tls = tlsBaselineOnly || process.argv.includes('--tls')
  if (contexts && tls) throw new Error('指纹验证请分别运行上下文与 TLS 入口。')
  const referenceIndex = process.argv.indexOf('--tls-reference')
  const referenceArgument = referenceIndex < 0 ? process.env.FP_TLS_REFERENCE_FILE : process.argv[referenceIndex + 1]
  if (referenceIndex >= 0 && (!referenceArgument || referenceArgument.startsWith('--') || process.argv.lastIndexOf('--tls-reference') !== referenceIndex)) throw new Error('指纹验证的 --tls-reference 必须指定一个样本文件路径。')
  if (referenceArgument && !tls) throw new Error('指纹验证的 TLS 对照样本只能用于 TLS 入口。')
  const referencePath = referenceArgument ? path.resolve(referenceArgument) : null
  const referenceInput = referencePath ? await readTLSReference(referencePath) : null
  const output = path.join(projectRoot, 'dist', 'electron-diagnostics', 'fingerprint', `${Date.now()}-${randomUUID().slice(0, 8)}`)
  const { executable, options, dataRoot } = getLaunchOptions({
    ...process.env,
    FP_BROWSER_DATA_DIR: path.join(output, 'data'),
    FP_FINGERPRINT_REQUIRE_CLIENT_HINTS: process.argv.includes('--require-client-hints') ? '1' : process.env.FP_FINGERPRINT_REQUIRE_CLIENT_HINTS,
    FP_FINGERPRINT_TEST_OUTPUT: output
  })
  await fs.mkdir(dataRoot, { recursive: true })
  const capturedReferencePath = referenceInput ? path.join(output, 'tls-reference.json') : ''
  if (referenceInput) await fs.writeFile(capturedReferencePath, referenceInput.bytes)
  const tlsReference = referenceInput ? { path: referencePath, capturedPath: capturedReferencePath, sha256: referenceInput.sha256, browser: referenceInput.reference.browser, platform: referenceInput.reference.platform, source: referenceInput.reference.source } : null
  await createDiagnosticTLS(path.join(output, 'tls'))
  const tracked = [
    'fingerprint-browser/profile-store.js', 'fingerprint-browser/browser-tabs.js',
    'fingerprint-browser/fingerprint-protection.js', 'fingerprint-browser/renderer/saas-app.js',
    'fingerprint-browser/package.json', 'fingerprint-browser/scripts/test-fingerprint.js',
    'fingerprint-browser/test/fingerprint-isolation.test.js', 'fingerprint-browser/test/fingerprint-probes.js',
    'fingerprint-browser/test/fingerprint-contexts.test.js',
    'shell/browser/electron_browser_client.cc', 'patches/chromium/fp_block_session_webgpu_adapter.patch',
    'patches/chromium/fp_worker_session_languages.patch',
    'patches/chromium/fp_session_tls_client_hello.patch', 'shell/browser/api/electron_api_session.cc',
    'shell/browser/fingerprint/fingerprint_profile_parser.cc', 'shell/browser/api/electron_api_web_contents.cc', 'fingerprint-browser/tls-fingerprint.js',
    'fingerprint-browser/profile-repository.js', 'fingerprint-browser/environment-repository.js', 'fingerprint-browser/main.js',
    'fingerprint-browser/test/tls-client-hello.js', 'fingerprint-browser/test/fingerprint-tls.test.js',
    'fingerprint-browser/test/fingerprint-protection.test.js',
    'shell/browser/electron_browser_context.cc',
    'fingerprint-browser/scripts/fingerprint-tls.js', 'fingerprint-browser/test/fingerprint-network.js',
    'fingerprint-browser/test/profile-store.test.js', 'fingerprint-browser/test/profile-repository.test.js',
    'fingerprint-browser/test/unified-tabs.test.js', 'fp-kernel/version.json',
    'dist/fingerprint-browser-win-x64/指纹浏览器.exe',
    'dist/fingerprint-browser-win-x64/release-manifest.json'
  ]
  const files = await Promise.all([executable, ...tracked.map(file => path.join(projectRoot, file)), path.join(output, 'tls', 'ca.pem'), path.join(output, 'tls', 'server.pem')].map(hashFile))
  if (files[0].missing) throw new Error('未找到指纹版运行时，请设置 FP_ELECTRON_RUNTIME。')
  let git = { available: false }
  try {
    const commit = await execute('git', ['rev-parse', 'HEAD'], { cwd: projectRoot, windowsHide: true })
    const status = await execute('git', ['status', '--short'], { cwd: projectRoot, windowsHide: true })
    git = { available: true, commit: commit.stdout.trim(), worktree: status.stdout.trim().split(/\r?\n/).filter(Boolean) }
  } catch {}
  let release = { available: false }
  try {
    const manifest = JSON.parse(await fs.readFile(path.join(projectRoot, 'dist/fingerprint-browser-win-x64/release-manifest.json'), 'utf8'))
    const packaged = files.find(file => file.path === path.join(projectRoot, 'dist/fingerprint-browser-win-x64/指纹浏览器.exe'))
    release = {
      available: true,
      sourceCommit: manifest.sourceCommit,
      runtimeMatches: files[0].sha256 === String(manifest.runtimeSha256).toLowerCase(),
      executableMatches: packaged?.sha256 === String(manifest.executableSha256).toLowerCase(),
      note: '本次验证工作区与所选运行时，不代表发行包包含当前应用代码。'
    }
  } catch {}
  await fs.writeFile(path.join(output, 'baseline.json'), `${JSON.stringify({ capturedAt: new Date().toISOString(), git, files, release, requireClientHints: options.env.FP_FINGERPRINT_REQUIRE_CLIENT_HINTS === '1', contexts, tls, tlsBaselineOnly, tlsReference, debugConnection: false, note: '不采集用户环境、凭据和指纹种子。' }, null, 2)}\n`, 'utf8')
  console.log(`指纹验证记录目录：${output}`)
  let initialReport
  for (const phase of contexts ? ['initial', 'restore'] : ['initial']) {
    const testFile = tls ? 'fingerprint-tls.test.js' : contexts ? 'fingerprint-contexts.test.js' : 'fingerprint-isolation.test.js'
    const child = spawn(executable, [path.join(__dirname, '..', 'test', testFile), `--user-data-dir=${dataRoot}`], { ...options, env: { ...options.env, FP_CONTEXT_PHASE: phase, FP_TLS_BASELINE_ONLY: tlsBaselineOnly ? '1' : '0', FP_TLS_REFERENCE_FILE: capturedReferencePath }, windowsHide: true })
    let timedOut = false
    const timer = setTimeout(() => { timedOut = true; child.kill() }, 180000)
    try {
      const code = await new Promise((resolve, reject) => {
        child.once('error', () => reject(new Error('无法启动指纹验证运行时。')))
        child.once('exit', value => resolve(value))
      })
      if (timedOut) throw new Error('指纹验证超时，已有记录已保留。')
      process.exitCode = code === 0 ? 0 : 1
      if (code !== 0) {
        console.error('指纹验证未完成，请查看该目录中的结果记录。')
        break
      }
      if (contexts) {
        const report = JSON.parse(await fs.readFile(path.join(output, `contexts-${phase}.json`), 'utf8'))
        validateContextReport(report, phase, initialReport, options.env.FP_FINGERPRINT_REQUIRE_CLIENT_HINTS === '1')
        if (phase === 'initial') initialReport = report
      }
      if (tls) {
        const report = JSON.parse(await fs.readFile(path.join(output, 'tls-result.json'), 'utf8'))
        validateTLSReport(report, tlsBaselineOnly, tlsReference)
      }
    } finally {
      clearTimeout(timer)
    }
  }
}

if (require.main === module) void run().catch(error => {
  console.error(/^(指纹验证|无法启动|未找到|HTTPS 诊断|无法生成 HTTPS)/.test(error.message) ? error.message : '无法建立指纹验证基线，请检查运行时与输出目录。')
  process.exitCode = 1
})

module.exports = { hashFile, validateContextReport, getContextFallbackFields, getWebGPUProtectionFailures, readTLSReference, validateTLSReport }
