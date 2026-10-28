// 使用现有自定义 Electron、独立 MySQL 与本机 SMTP 验收真实加密启动，不读取正式用户账户。
const { app, BrowserWindow } = require('electron/main')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const crypto = require('node:crypto')
const assert = require('node:assert/strict')
const { WorkspaceServer } = require(path.join(process.env.FP_CLOUD_TEST_SERVER_ROOT || path.resolve(__dirname, '../../saas-server'), 'src/workspace-server'))
const { createSmtpMailbox } = require('../../saas-server/test/smtp-mailbox')
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'qijie-cloud-native-'))
const report = process.argv[2]
const results = []; let server; let mailbox
const timeout = setTimeout(() => { fs.writeFileSync(report, JSON.stringify({ ok: false, message: '云端指纹运行时验收超时。', results })); app.exit(1) }, 60000)
async function waitFor (operation) { for (let i = 0; i < 150; i++) { const value = await operation(); if (value) return value; await new Promise(resolve => setTimeout(resolve, 100)) }; throw new Error('客户端未按时就绪。') }
app.whenReady().then(async () => {
  mailbox = await createSmtpMailbox(directory)
  server = new WorkspaceServer({ port: 0, dataDir: path.join(directory, 'server'), databaseName: 'qijie_workspace_test_' + crypto.randomBytes(8).toString('hex'), mailConfigFile: mailbox.configFile, updateConfigFile: mailbox.configFile })
  const address = await server.start(); const origin = `http://127.0.0.1:${address.port}`
  let cookie = ''; let csrf = ''
  async function api (route, body) {
    const response = await fetch(origin + route, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie, 'X-CSRF-Token': csrf }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
    const result = await response.json(); assert(response.ok && result.ok, result.message)
    if (response.headers.has('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0]
    if (result.csrf) csrf = result.csrf
    return result
  }
  const email = `native-${crypto.randomUUID()}@example.test`
  await api('/api/auth/registration-code', { email })
  const account = await api('/api/auth/register', { email, verificationCode: mailbox.codeFor(email), password: crypto.randomBytes(24).toString('hex'), name: '隔离运行时验收', workspaceName: '加密运行时验收' })
  const workspaceId = account.workspaces[0].id
  const draft = (await api('/api/fingerprint-draft', { platform: 'Win32' })).profile
  const fingerprint = (await api(`/api/workspaces/${workspaceId}/fingerprints`, { name: '云端生成验收', profile: draft })).item
  const environment = (await api(`/api/workspaces/${workspaceId}/environments`, { name: '加密启动验收', fingerprintId: fingerprint.id, fingerprintVersion: fingerprint.version, startUrl: origin + '/api/health' })).item
  results.push('云端生成、真实邮箱注册与独立 MySQL 指纹入库成功')
  process.env.FP_APP_URL = origin + '/'; process.env.FP_BUILD_ENV = 'test'; process.env.FP_BROWSER_DATA_DIR = path.join(directory, 'client'); process.env.FP_AUTOMATION_PORT = '62871'
  let clientRoot = path.resolve(__dirname, '..')
  if (process.env.FP_CLOUD_TEST_CLIENT_ROOT) {
    clientRoot = path.join(directory, 'packaged-application')
    fs.cpSync(process.env.FP_CLOUD_TEST_CLIENT_ROOT, clientRoot, { recursive: true })
    // 仅替换隔离副本的部署地址，生产发行包与用户配置保持原样。
    fs.writeFileSync(path.join(clientRoot, 'client-config.json'), JSON.stringify({ environment: 'test', appUrl: origin + '/', updatesEnabled: false }))
  }
  require(path.join(clientRoot, 'main'))
  const home = await waitFor(() => BrowserWindow.getAllWindows().flatMap(window => window.contentView.children).map(view => view.webContents).find(contents => contents?.getURL().startsWith(origin + '/')))
  await home.session.cookies.set({ url: origin, name: 'qijie_session', value: cookie.slice('qijie_session='.length), httpOnly: true, sameSite: 'strict' })
  await home.reload()
  await waitFor(async () => { try { return await home.executeJavaScript('Boolean(window.workspaceBridge && window.WorkspaceUI)') } catch { return false } })
  const launched = await home.executeJavaScript(`window.workspaceBridge.launch(${JSON.stringify({ workspaceId, environmentId: environment.id })})`)
  assert.equal(launched.ok, true, launched.error)
  const tabs = await home.executeJavaScript('window.workspaceBridge.tabs()')
  assert(tabs.tabs.some(tab => tab.profileId === environment.id))
  results.push('实际客户端通过加密接口获取配置、主进程解密并启动自定义内核环境')
  const clientDirectory = path.join(directory, 'client')
  const raw = fs.readFileSync(path.join(clientDirectory, 'environments.json'), 'utf8')
  assert(raw.includes('qijie-device-storage-v1')); assert(!raw.includes(fingerprint.profile.noise.seed))
  const { safeStorage } = require('electron/main')
  const { createLocalProfileProtection } = require('../local-profile-protection')
  const { EnvironmentRepository } = require('../environment-repository')
  const decoded = createLocalProfileProtection(safeStorage).decode(JSON.parse(raw))
  const local = decoded.find(record => record.profileId === environment.id)
  assert.equal(local.fingerprint.noise.seed, fingerprint.profile.noise.seed)
  const snapshot = fs.readFileSync(path.join(local.dataDir, 'fingerprint.json'), 'utf8')
  assert(!snapshot.includes(fingerprint.profile.noise.seed)); assert(snapshot.includes('qijie-device-storage-v1'))
  await home.executeJavaScript(`window.workspaceBridge.closeTab(${JSON.stringify(launched.tabId)})`)
  const restored = new EnvironmentRepository(clientDirectory, undefined, createLocalProfileProtection(safeStorage)); await restored.load()
  assert.equal(restored.get(local.id).fingerprint.noise.seed, fingerprint.profile.noise.seed)
  results.push('Windows 系统密钥保护实际缓存，关闭后解密恢复且跨端同步种子一致')
  const pageErrors = await home.executeJavaScript('({hasNavigation:document.querySelectorAll("#navigation .nav-link").length,hasUI:Boolean(window.WorkspaceUI)})')
  assert.equal(pageErrors.hasNavigation, 8); assert(pageErrors.hasUI)
  results.push('SaaS 真实页面正常加载，八项导航和客户端更新桥接可用')
  const status = await home.executeJavaScript('window.workspaceBridge.updateStatus()'); assert.equal(status.ok, true)
  await home.loadURL(origin + '/#fingerprint-create')
  const editor = await waitFor(async () => { try { return await home.executeJavaScript('window.WorkspaceUI?.getFingerprint().profile.id || null') } catch { return null } })
  assert(editor)
  const generated = await home.executeJavaScript('window.QijieFingerprintEngine.generateRandomHardwareProfile({platform:"Win32"})')
  assert.equal(generated.hardware.platform, 'Win32'); assert(generated.noise.seed)
  results.push('实际指纹创建页面从服务端获取默认参数，并通过登录会话调用云端生成器')
  fs.writeFileSync(report, JSON.stringify({ ok: true, runtime: process.versions.electron, results }, null, 2))
}).catch(error => { fs.writeFileSync(report, JSON.stringify({ ok: false, message: error.message, stack: error.stack, results }, null, 2)); process.exitCode = 1 }).finally(async () => {
  clearTimeout(timeout)
  try { await server?.stop(); await mailbox?.stop() } catch {}
  app.exit(process.exitCode || 0)
})
