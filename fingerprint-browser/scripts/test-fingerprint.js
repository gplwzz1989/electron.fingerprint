const path = require('node:path')
const fs = require('node:fs/promises')
const { createReadStream } = require('node:fs')
const { createHash, randomUUID } = require('node:crypto')
const { spawn, execFile } = require('node:child_process')
const { promisify } = require('node:util')
const { getLaunchOptions } = require('./start')
const { createDiagnosticTLS } = require('./fingerprint-tls')

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

async function run () {
  const contexts = process.argv.includes('--contexts')
  const output = path.join(projectRoot, 'dist', 'electron-diagnostics', 'fingerprint', `${Date.now()}-${randomUUID().slice(0, 8)}`)
  const { executable, options, dataRoot } = getLaunchOptions({
    ...process.env,
    FP_BROWSER_DATA_DIR: path.join(output, 'data'),
    FP_FINGERPRINT_REQUIRE_CLIENT_HINTS: process.argv.includes('--require-client-hints') ? '1' : process.env.FP_FINGERPRINT_REQUIRE_CLIENT_HINTS,
    FP_FINGERPRINT_TEST_OUTPUT: output
  })
  await fs.mkdir(dataRoot, { recursive: true })
  await createDiagnosticTLS(path.join(output, 'tls'))
  const tracked = [
    'fingerprint-browser/profile-store.js', 'fingerprint-browser/browser-tabs.js',
    'fingerprint-browser/fingerprint-protection.js', 'fingerprint-browser/renderer/saas-app.js',
    'fingerprint-browser/package.json', 'fingerprint-browser/scripts/test-fingerprint.js',
    'fingerprint-browser/test/fingerprint-isolation.test.js', 'fingerprint-browser/test/fingerprint-probes.js',
    'fingerprint-browser/test/fingerprint-contexts.test.js',
    'shell/browser/electron_browser_client.cc', 'patches/chromium/fp_block_session_webgpu_adapter.patch',
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
  await fs.writeFile(path.join(output, 'baseline.json'), `${JSON.stringify({ capturedAt: new Date().toISOString(), git, files, release, requireClientHints: options.env.FP_FINGERPRINT_REQUIRE_CLIENT_HINTS === '1', contexts, debugConnection: false, note: '不采集用户环境、凭据和指纹种子。' }, null, 2)}\n`, 'utf8')
  console.log(`指纹验证记录目录：${output}`)
  for (const phase of contexts ? ['initial', 'restore'] : ['initial']) {
    const testFile = contexts ? 'fingerprint-contexts.test.js' : 'fingerprint-isolation.test.js'
    const child = spawn(executable, [path.join(__dirname, '..', 'test', testFile), `--user-data-dir=${dataRoot}`], { ...options, env: { ...options.env, FP_CONTEXT_PHASE: phase }, windowsHide: true })
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
    } finally {
      clearTimeout(timer)
    }
  }
}

if (require.main === module) void run().catch(error => {
  console.error(/^(指纹验证|无法启动|未找到|HTTPS 诊断|无法生成 HTTPS)/.test(error.message) ? error.message : '无法建立指纹验证基线，请检查运行时与输出目录。')
  process.exitCode = 1
})

module.exports = { hashFile }
