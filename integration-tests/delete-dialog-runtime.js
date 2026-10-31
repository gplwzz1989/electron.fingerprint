// 用真实 React/Radix 组件、浏览器页面与隔离数据库验收删除交互，不操作用户资源。
const { app, BrowserWindow } = require('electron/main')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const crypto = require('node:crypto')
const assert = require('node:assert/strict')
const { WorkspaceServer } = require('../saas-server/src/workspace-server')
const { getDefaultProfile } = require('../saas-server/src/fingerprint/profile-store')
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'shadcn-delete-dialog-'))
app.setPath('userData', path.join(directory, 'browser'))
const report = process.argv[2]; let server; let window
const deadline = setTimeout(() => { fs.writeFileSync(report, JSON.stringify({ ok: false, message: '删除弹层验收超时。' })); app.exit(2) }, 45000)
const page = code => window.webContents.executeJavaScript(code)
async function until (operation) { for (let i = 0; i < 120; i++) { if (await operation()) return; await new Promise(resolve => setTimeout(resolve, 50)) }; throw new Error('删除界面未达到预期状态。') }
app.whenReady().then(async () => {
  server = new WorkspaceServer({ port: 0, dataDir: directory, databaseName: 'qijie_workspace_test_' + crypto.randomBytes(10).toString('hex') })
  const address = await server.start(); const origin = `http://127.0.0.1:${address.port}`; const db = server.database
  const user = crypto.randomUUID(); const workspace = crypto.randomUUID(); const environment = crypto.randomUUID(); const proxy = crypto.randomUUID(); const account = crypto.randomUUID()
  await db.execute('INSERT INTO users VALUES(?,?,?,?,?,?)', [user, user + '@example.test', '删除弹层隔离测试', '不可登录的测试摘要', Date.now(), Date.now()])
  await db.execute('INSERT INTO workspaces VALUES(?,?,?)', [workspace, '删除弹层隔离测试', user])
  await db.execute('INSERT INTO members VALUES(?,?,?,?,?)', [crypto.randomUUID(), workspace, user, 'owner', JSON.stringify({ mode: 'all', ids: [] })])
  const fingerprint = await db.saveFingerprint(workspace, user, { name: '界面验收指纹', profile: getDefaultProfile() })
  await db.put('proxies', workspace, proxy, { name: '界面验收代理', protocol: 'http', host: 'proxy.example.test', port: 8080, status: 'available', timezone: 'Asia/Shanghai', credential: db.encrypt('{}') }, null)
  await db.put('environments', workspace, environment, { name: '界面验收环境', fingerprintId: fingerprint.id, fingerprintVersion: fingerprint.version, proxyId: proxy }, null)
  const metadata = { name: '界面验收账号', platformName: '抖音', platform: 'douyin', platformUserId: 'isolated-dialog-id', environmentId: environment, environmentName: '界面验收环境', status: 'valid' }
  await db.authAccounts.write(workspace, account, metadata, { cookies: [{ name: 'session', value: 'test-only-preserved-value' }], storage: {} })
  await db.put('accounts', workspace, account, metadata, null)
  const auth = await db.createSession(user)
  window = new BrowserWindow({ show: false, width: 1180, height: 820, webPreferences: { sandbox: true, contextIsolation: true, partition: 'dialog-' + crypto.randomUUID(), backgroundThrottling: false } })
  await window.webContents.session.cookies.set({ url: origin, name: 'qijie_session', value: auth.token, httpOnly: true })
  await window.loadURL(origin)
  await until(() => page('Boolean(window.getMediaWorkspace?.().canWrite && window.WorkspaceDialogs?.confirmDelete)'))
  await page('window.__nativeConfirmCalls=0;window.confirm=()=>{window.__nativeConfirmCalls++;throw Error("不允许使用原生确认框")};WorkspaceUI.openPage("accounts")')
  await until(() => page('Boolean(document.querySelector("[data-operation=remove-account]"))'))
  for (const cancel of ['button', 'escape']) {
    await page('document.querySelector("[data-operation=remove-account]").focus();document.querySelector("[data-operation=remove-account]").click()')
    await until(() => page('Boolean(document.querySelector("[data-slot=alert-dialog-content][role=alertdialog]"))'))
    assert.equal(await page('document.activeElement.textContent'), '取消')
    if (cancel === 'button') await page('document.querySelector(".shadcn-dialog-cancel").click()')
    else { window.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' }); window.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' }) }
    await until(() => page('!document.querySelector("[role=alertdialog]") && document.activeElement.dataset.operation==="remove-account"'))
    assert(await db.get('accounts', workspace, account))
  }
  for (const [route, kind, id] of [['accounts', 'account', account], ['environments', 'environment', environment], ['fingerprints', 'fingerprint', fingerprint.id], ['proxies', 'proxy', proxy]]) {
    await page(`WorkspaceUI.openPage(${JSON.stringify(route)})`)
    await until(() => page(`Boolean(document.querySelector('[data-operation="remove-${kind}"][data-id="${id}"]'))`))
    await page(`document.querySelector('[data-operation="remove-${kind}"][data-id="${id}"]').click()`)
    await until(() => page('Boolean(document.querySelector("[role=alertdialog]"))'))
    if (kind === 'account') {
      assert.equal(await page('getComputedStyle(document.querySelector(".shadcn-alert-content")).borderRadius'), '18px')
      await page('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
      await window.webContents.capturePage().then(image => fs.writeFileSync(path.join(directory, 'delete-desktop.png'), image.toPNG()))
    }
    if (kind === 'environment') {
      window.setSize(375, 820); await until(() => page('innerWidth<=375'))
      assert(await page('document.documentElement.scrollWidth<=innerWidth'))
      await window.webContents.capturePage().then(image => fs.writeFileSync(path.join(directory, 'delete-mobile.png'), image.toPNG()))
    }
    await page('document.querySelector(".shadcn-dialog-destructive").click()')
    await until(() => page(`!document.querySelector('[data-operation="remove-${kind}"][data-id="${id}"]') && !document.querySelector('[role=alertdialog]')`))
  }
  assert.equal(await page('window.__nativeConfirmCalls'), 0)
  fs.writeFileSync(report, JSON.stringify({ ok: true, checks: ['真实 shadcn/Radix AlertDialog', '取消不删除', 'Esc 与焦点返回', '四类资源实际逻辑删除', '圆角弹层与窄屏布局', '无原生 confirm'], screenshots: directory }, null, 2))
}).catch(async error => { const state = window && !window.isDestroyed() ? await page('document.body.innerText').catch(() => '') : ''; fs.writeFileSync(report, JSON.stringify({ ok: false, message: error.message, stack: error.stack, state }, null, 2)); process.exitCode = 1 }).finally(async () => { clearTimeout(deadline); window?.destroy(); if (server) await server.stop(); app.exit(process.exitCode || 0) })
