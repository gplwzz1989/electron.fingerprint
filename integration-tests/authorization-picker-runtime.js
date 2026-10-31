// 仅测试真实页面调度与数据库；客户端采集接口在此隔离为测试专用桥接，不访问真实媒体账号。
const { app, BrowserWindow, ipcMain } = require('electron/main')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const crypto = require('node:crypto')
const assert = require('node:assert/strict')
const { WorkspaceServer } = require('../saas-server/src/workspace-server')
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'authorization-picker-'))
app.setPath('userData', path.join(directory, 'browser'))
const report = process.argv[2]; let server; let window
const channel = 'picker-test-' + crypto.randomUUID()
const timeout = setTimeout(() => { fs.writeFileSync(report, JSON.stringify({ ok: false, message: '授权选择框验收超时。' })); app.exit(2) }, 45000)
async function until (operation) { for (let i = 0; i < 120; i++) { if (await operation()) return; await new Promise(resolve => setTimeout(resolve, 50)) }; throw new Error('授权界面未达到预期状态。') }
const page = source => window.webContents.executeJavaScript(source)
app.whenReady().then(async () => {
  server = new WorkspaceServer({ port: 0, dataDir: directory, databaseName: 'qijie_workspace_test_' + crypto.randomBytes(10).toString('hex') })
  const address = await server.start(); const origin = `http://127.0.0.1:${address.port}`; const db = server.database
  const user = crypto.randomUUID(); const workspace = crypto.randomUUID(); const environment = crypto.randomUUID()
  await db.execute('INSERT INTO users VALUES(?,?,?,?,?,?)', [user, user + '@example.test', '选择框隔离测试', '不可登录的测试摘要', Date.now(), Date.now()])
  await db.execute('INSERT INTO workspaces VALUES(?,?,?)', [workspace, '选择框隔离测试', user])
  await db.execute('INSERT INTO members VALUES(?,?,?,?,?)', [crypto.randomUUID(), workspace, user, 'owner', JSON.stringify({ mode: 'all', ids: [] })])
  await db.put('environments', workspace, environment, { name: '仅用于界面验收的独立环境' }, null)
  const auth = await db.createSession(user)
  const preload = path.join(directory, 'test-preload.js')
  fs.writeFileSync(preload, `const {contextBridge,ipcRenderer}=require('electron');contextBridge.exposeInMainWorld('__pickerNative',{poll:p=>ipcRenderer.invoke(${JSON.stringify(channel)},p)})`)
  window = new BrowserWindow({ show: false, width: 1180, height: 820, webPreferences: { preload, contextIsolation: true, sandbox: true, partition: channel } })
  ipcMain.handle(channel, async (event, input) => {
    assert.equal(event.sender, window.webContents)
    if (input.fail) return { ok: true, done: true, result: { ciphertext: '仅测试解密失败' } }
    const task = await db.get('authorizations', workspace, input.id)
    const payload = { operationId: task.id, identity: { platformUserId: 'picker-fixture-id', name: '隔离界面身份', avatar: '' }, platform: { key: task.platform.key, url: 'https://creator.xiaohongshu.com', origins: ['https://creator.xiaohongshu.com'] }, cookies: [{ name: 'session', value: 'isolated-only', domain: '.xiaohongshu.com' }], storage: {} }
    payload.proof = crypto.createHmac('sha256', db.decrypt(task.proofKey)).update(JSON.stringify(payload)).digest('hex')
    const key = crypto.randomBytes(32); const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv('aes-256-gcm', key, iv); cipher.setAAD(Buffer.from(task.id))
    const ciphertext = Buffer.concat([cipher.update(JSON.stringify(payload)), cipher.final()])
    return { ok: true, done: true, result: { wrappedKey: crypto.publicEncrypt({ key: task.publicKey, oaepHash: 'sha256' }, key).toString('base64'), iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), ciphertext: ciphertext.toString('base64') } }
  })
  await window.webContents.session.cookies.set({ url: origin, name: 'qijie_session', value: auth.token, httpOnly: true })
  await window.loadURL(origin)
  await until(() => page('Boolean(window.getMediaWorkspace?.().canWrite && window.WorkspaceUI)'))
  await page(`window.workspaceBridge={platformStatus:()=>new Promise(resolve=>{window.__continueAuthorization=()=>resolve({ok:true,protocol:'platform-runtime-v2'})}),launch:async()=>({ok:true,tabId:'fixture-tab'}),tabs:async()=>({ok:true,tabs:[{id:'fixture-tab'}]}),startPlatformTask:async({task})=>({ok:true,id:task.id}),pollPlatformTask:input=>__pickerNative.poll({...input,fail:window.__failFixture}),cancelPlatformTask:async()=>({ok:true}),closeTab:async()=>({ok:true}),dashboard:async()=>({ok:true})};void 0`)
  for (const fail of [true, false]) {
    await page(`window.__failFixture=${fail};WorkspaceUI.openPage('account-platforms')`)
    await until(() => page('Boolean(document.querySelector("[data-platform-key=xiaohongshu]:not(:disabled)"))'))
    await page('document.querySelector("[data-platform-key=xiaohongshu]").click()')
    await until(() => page('Boolean(document.querySelector("[data-media-environment]"))'))
    assert.equal(await page('document.querySelectorAll("#modal-root .form-footer,#modal-root .authorization-flow").length'), 0)
    assert.equal(await page('document.querySelectorAll("#modal-root [role=dialog]").length'), 1)
    await window.webContents.capturePage().then(image => fs.writeFileSync(path.join(directory, 'environment-picker.png'), image.toPNG()))
    await page('document.querySelector("[data-media-environment]").click()')
    await until(() => page('!document.querySelector("#modal-root [role=dialog]") && typeof window.__continueAuthorization === "function"'))
    await page('window.__continueAuthorization()')
    await until(() => page(fail ? 'Boolean(document.querySelector("#workspace-result.workspace-result--error"))' : 'document.querySelector("#workspace-result")?.textContent.includes("账号授权成功")'))
    assert.equal(await page('document.querySelectorAll("#modal-root [role=dialog]").length'), 0)
    assert(await page('parseFloat(getComputedStyle(document.querySelector("#workspace-result")).top)<130'))
    await page('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
    await window.webContents.capturePage().then(image => fs.writeFileSync(path.join(directory, fail ? 'failure-toast.png' : 'success-toast.png'), image.toPNG()))
    if (fail) { await page('document.querySelector("[data-media-operation=cancel]").click()'); await until(() => page('document.querySelector("#workspace-result")?.textContent.includes("已取消")')) }
  }
  assert.equal((await db.list('accounts', workspace)).length, 1)
  fs.writeFileSync(report, JSON.stringify({ ok: true, checks: ['精简环境列表', '选择即关闭全部弹框', '失败顶部红色气泡', '成功顶部绿色气泡', '真实业务账号入库'], screenshots: directory }, null, 2))
}).catch(async error => { const state = window && !window.isDestroyed() ? await page('JSON.stringify({toast:document.querySelector("#workspace-result")?.textContent,route:WorkspaceUI.getRoute(),requests:performance.getEntriesByType("resource").filter(x=>x.name.includes("authorizations")).map(x=>({path:new URL(x.name).pathname,status:x.responseStatus}))})').catch(()=>null) : null; fs.writeFileSync(report, JSON.stringify({ ok: false, message: error.message, stack: error.stack, state }, null, 2)); process.exitCode = 1 }).finally(async () => { clearTimeout(timeout); window?.destroy(); ipcMain.removeHandler(channel); if (server) await server.stop(); app.exit(process.exitCode || 0) })
