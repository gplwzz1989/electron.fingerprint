// 独立第三方站点验收：不导入 SaaS、不连接数据库、不使用正式用户会话。
const { app, BrowserWindow } = require('electron/main')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const http = require('node:http')
const crypto = require('node:crypto')
const assert = require('node:assert/strict')
const { sealLaunch } = require('./protocol-provider')
const { getDefaultProfile } = require('../profile-store')
const source = process.env.FP_BASE_TEST_APP_DIR || path.resolve(__dirname, '..')
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'desktop-independent-'))
const report = process.argv[2]; const results = []; let server
const timeout = setTimeout(() => { fs.writeFileSync(report, JSON.stringify({ ok: false, message: '独立基座验收超时。', results })); app.exit(1) }, 60000)
async function ready (operation) { for (let i = 0; i < 150; i++) { const value = await operation(); if (value) return value; await new Promise(resolve => setTimeout(resolve, 100)) }; throw new Error('基座未就绪。') }
app.whenReady().then(async () => {
  server = http.createServer((req, res) => { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end('<!doctype html><html lang="zh-CN"><title>第三方业务应用</title><body><h1>独立第三方站点验收</h1></body></html>') })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const origin = `http://127.0.0.1:${server.address().port}`
  const isolated = path.join(directory, 'application'); fs.mkdirSync(isolated)
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) if (!entry.isDirectory() && (entry.name.endsWith('.js') || ['package.json','browser-shell.html','browser-shell.css','new-tab.html','new-tab.css','update-installer.ps1'].includes(entry.name))) fs.copyFileSync(path.join(source, entry.name), path.join(isolated, entry.name))
  for (const name of ['assets','platform-automation','renderer']) if (fs.existsSync(path.join(source, name))) fs.cpSync(path.join(source, name), path.join(isolated, name), { recursive: true })
  fs.writeFileSync(path.join(isolated, 'client-config.json'), JSON.stringify({ environment: 'test', applicationId: 'com.example.baseacceptance', appName: '第三方应用基座', appUrl: origin + '/', updatesEnabled: false }))
  process.env.FP_BROWSER_DATA_DIR = path.join(directory, 'user-data'); process.env.FP_AUTOMATION_PORT = '62872'
  require(path.join(isolated, 'main'))
  const home = await ready(() => BrowserWindow.getAllWindows().flatMap(window => window.contentView.children).map(view => view.webContents).find(contents => contents?.getURL().startsWith(origin)))
  await ready(async () => { try { return await home.executeJavaScript('Boolean(window.desktopBridge)') } catch { return false } })
  const runtime = await home.executeJavaScript('desktopBridge.runtime()'); assert.equal(runtime.ok, true); assert.equal(runtime.appName, '第三方应用基座')
  assert.equal(await home.executeJavaScript('typeof workspaceBridge'), 'undefined')
  results.push('独立复制客户端可启动任意第三方首页，仅暴露通用桥接，不含 SaaS 业务 SDK')
  const launched = []
  for (const scope of ['third-party-a', 'third-party-b']) {
    const request = await home.executeJavaScript(`desktopBridge.prepareLaunch(${JSON.stringify({ scope, resourceId: 'resource-1' })})`); assert.equal(request.ok, true, request.error)
    const fingerprint = getDefaultProfile(); fingerprint.noise.seed = crypto.randomUUID()
    const envelope = sealLaunch({ id: 'resource-1', name: '独立协议验收', url: origin + '/page', fingerprint }, request, { scope, resourceId: 'resource-1' })
    const payload = { requestId: request.requestId, envelope }
    const result = await home.executeJavaScript(`desktopBridge.launchEncrypted(${JSON.stringify(payload)})`); assert.equal(result.ok, true, result.error); launched.push(result)
    const replay = await home.executeJavaScript(`desktopBridge.launchEncrypted(${JSON.stringify(payload)})`); assert.equal(replay.ok, false)
  }
  assert.notEqual(launched[0].environmentId, launched[1].environmentId)
  const snapshot = await home.executeJavaScript('desktopBridge.tabs()')
  assert(snapshot.tabs.some(tab => tab.externalReference?.scope === 'third-party-a')); assert(snapshot.tabs.some(tab => tab.externalReference?.scope === 'third-party-b'))
  results.push('独立第三方生产端通过公开密文协议启动真实环境，不同资源范围隔离且重放被拒绝')
  const legacyFingerprint = getDefaultProfile(); legacyFingerprint.noise.seed = crypto.randomUUID()
  const legacyProfile = { id: 'legacy-resource', name: '旧缓存迁移验收', url: origin + '/page', fingerprint: legacyFingerprint }
  const saved = await home.executeJavaScript(`browserApi.saveProfile(${JSON.stringify(legacyProfile)})`); assert.equal(saved.ok, true, saved.error)
  const old = await home.executeJavaScript('browserApi.launchProfile({id:"legacy-resource"})'); assert.equal(old.ok, true, old.error)
  const migrated = []
  for (const scope of ['legacy-a', 'legacy-b', 'legacy-a']) {
    const request = await home.executeJavaScript(`desktopBridge.prepareLaunch(${JSON.stringify({ scope, resourceId: 'legacy-resource' })})`)
    const envelope = sealLaunch(legacyProfile, request, { scope, resourceId: 'legacy-resource' })
    const result = await home.executeJavaScript(`desktopBridge.launchEncrypted(${JSON.stringify({ requestId: request.requestId, envelope })})`)
    assert.equal(result.ok, true, result.error); migrated.push(result.environmentId)
  }
  assert.equal(migrated[0], old.environmentId); assert.equal(migrated[2], old.environmentId); assert.notEqual(migrated[1], old.environmentId)
  results.push('旧环境缓存首次绑定接入范围，保留原会话；其他范围不能继承，重复启动继续复用')
  const shellWindow = BrowserWindow.getAllWindows().find(window => window.webContents.getURL().endsWith('browser-shell.html'))
  const ordinary = await shellWindow.webContents.executeJavaScript('browserShell.create()'); assert.equal(ordinary.ok, true)
  const views = shellWindow.contentView.children.filter(view => view.webContents && view.webContents !== home)
  const page = views.map(view => view.webContents).find(contents => contents.getURL().endsWith('new-tab.html'))
  assert(page); assert.equal(await page.executeJavaScript('typeof desktopBridge'), 'undefined')
  results.push('加号普通标签无内部桥接，首页与系统创建标签的能力边界保持')
  fs.writeFileSync(report, JSON.stringify({ ok: true, runtime: process.versions.electron, results }, null, 2))
}).catch(error => { fs.writeFileSync(report, JSON.stringify({ ok: false, message: error.message, stack: error.stack, results }, null, 2)); process.exitCode = 1 }).finally(async () => { clearTimeout(timeout); if (server) await new Promise(resolve => server.close(resolve)); app.exit(process.exitCode || 0) })
