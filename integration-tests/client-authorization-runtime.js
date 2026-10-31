// 真实 Electron、SaaS 与 MySQL 联调；媒体响应仅来自隔离 HTTPS 测试页，不访问生产账号。
const { app, BrowserWindow, session } = require('electron/main')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const https = require('node:https')
const crypto = require('node:crypto')
const assert = require('node:assert/strict')
const { WorkspaceServer } = require('../saas-server/src/workspace-server')
const { getDefaultProfile } = require('../saas-server/src/fingerprint/profile-store')
const { PlatformRuntime } = require('../fingerprint-browser/platform-runtime')
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'client-auth-runtime-'))
const report = process.argv[2]; let server; let media
app.setPath('userData', path.join(directory, 'browser'))
const deadline = setTimeout(() => { fs.writeFileSync(report, JSON.stringify({ ok: false, message: '客户端授权联调超时。' })); app.exit(2) }, 60000)
async function until (operation) { for (let i = 0; i < 150; i++) { const value = await operation(); if (value) return value; await new Promise(resolve => setTimeout(resolve, 100)) }; throw new Error('客户端页面未就绪。') }
app.whenReady().then(async () => {
  media = https.createServer({ key: fs.readFileSync(process.argv[3]), cert: fs.readFileSync(process.argv[4]) }, (req, res) => {
    res.setHeader('Content-Type', req.url === '/identity' ? 'application/json' : 'text/html; charset=utf-8')
    res.setHeader('Set-Cookie', 'isolated-session=runtime-only; HttpOnly; Secure; SameSite=Lax; Path=/')
    res.end(req.url === '/identity' ? JSON.stringify({ errCode: 0, data: { finderUser: { uniqId: 'runtime-isolated-identity', nickname: '运行时隔离账号' } } }) : '<!doctype html><html lang="zh-CN"><title>隔离媒体页</title><script>fetch("/identity").then(r=>r.json())</script></html>')
  })
  await new Promise(resolve => media.listen(0, '127.0.0.1', resolve))
  const mediaOrigin = `https://127.0.0.1:${media.address().port}`
  app.on('certificate-error', (event, _contents, url, _error, _cert, callback) => { if (new URL(url).origin === mediaOrigin) { event.preventDefault(); callback(true) } else callback(false) })
  const production = await new PlatformRuntime(process.env.PLATFORM_RELEASE_DIR).load()
  const fixtures = path.join(directory, 'test-capabilities'); fs.mkdirSync(fixtures)
  const definition = { key: 'shipinhao', url: mediaOrigin, origins: [mediaOrigin], responsePath: '/identity', storageKeys: [], settleMs: 0 }
  const platform = Buffer.from(`window.MediaPlatform={catalog:[${JSON.stringify(definition)}],run:${production.runtime.run.toString()}}`)
  const rpa = fs.readFileSync(path.join(process.env.PLATFORM_RELEASE_DIR, production.manifest.rpa.file))
  const manifest = { version: '9.0.0', bridgeVersion: 2 }
  for (const [prefix, bytes, key] of [['authorization', platform, null], ['rpa', rpa, 'rpa']]) {
    const sha256 = crypto.createHash('sha256').update(bytes).digest('hex'); const file = `${prefix}-9.0.0-${sha256.slice(0, 12)}.js`
    fs.writeFileSync(path.join(fixtures, file), bytes)
    if (key) manifest[key] = { version: '9.0.0', file, sha256 }; else Object.assign(manifest, { file, sha256 })
  }
  fs.writeFileSync(path.join(fixtures, 'manifest.json'), JSON.stringify(manifest))
  server = new WorkspaceServer({ port: 0, dataDir: directory, databaseName: 'qijie_workspace_test_' + crypto.randomBytes(10).toString('hex') })
  const address = await server.start(); const origin = `http://127.0.0.1:${address.port}`
  const db = server.database; const user = crypto.randomUUID(); const workspace = crypto.randomUUID(); const environment = crypto.randomUUID()
  await db.execute('INSERT INTO users VALUES(?,?,?,?,?,?)', [user, user + '@example.test', '真实客户端隔离测试', '不可用于登录的摘要', Date.now(), Date.now()])
  await db.execute('INSERT INTO workspaces VALUES(?,?,?)', [workspace, '真实客户端隔离测试', user])
  await db.execute('INSERT INTO members VALUES(?,?,?,?,?)', [crypto.randomUUID(), workspace, user, 'owner', JSON.stringify({ mode: 'all', ids: [] })])
  await db.put('environments', workspace, environment, { name: '真实隔离环境', fingerprint: db.encodeFingerprint(getDefaultProfile()), startUrl: 'about:blank' }, null)
  const auth = await db.createSession(user)
  process.env.FP_BROWSER_DATA_DIR = path.join(directory, 'client'); process.env.FP_APP_URL = origin + '/'; process.env.FP_AUTOMATION_PORT = '0'; process.env.FP_PLATFORM_RUNTIME_DIR = fixtures; process.env.FP_PLATFORM_MANIFEST_URL = origin + '/api/platform-releases/manifest.json'
  await session.defaultSession.cookies.set({ url: origin, name: 'qijie_session', value: auth.token, httpOnly: true })
  require('../fingerprint-browser/main')
  const home = await until(() => BrowserWindow.getAllWindows().flatMap(window => window.contentView.children).map(view => view.webContents).find(contents => contents?.getURL() === origin + '/'))
  await until(() => home.executeJavaScript('Boolean(window.workspaceBridge?.startPlatformTask)'))
  const saved = await home.executeJavaScript(`(async()=>{
    const api=async(url,body)=>{const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':${JSON.stringify(auth.csrf)}},body:JSON.stringify(body)});const value=await response.json();if(!value.ok)throw Error(value.message);return value};
    const base=${JSON.stringify(`/api/workspaces/${workspace}`)};
    const task=(await api(base+'/authorizations',{platform:'shipinhao',environmentId:${JSON.stringify(environment)}})).task;
    const launch=await workspaceBridge.launch({workspaceId:${JSON.stringify(workspace)},environmentId:${JSON.stringify(environment)},authorizationId:task.id,capabilities:[],allowedOrigins:[]});if(!launch.ok)throw Error(launch.error);
    const started=await workspaceBridge.startPlatformTask({task,tabId:launch.tabId});if(!started.ok)throw Error(started.error);
    for(let i=0;i<120;i++){const state=await workspaceBridge.pollPlatformTask({id:started.id});if(!state.ok||state.error)throw Error(state.error);if(state.done){await api(base+'/authorizations/'+task.id+'/complete',state.result);return (await api(base+'/authorizations/'+task.id+'/confirm',{})).task}await new Promise(resolve=>setTimeout(resolve,200))};throw Error('授权联调超时')
  })()`)
  assert.equal(saved.status, 'saved')
  const row = (await db.execute('SELECT * FROM auth_accounts WHERE workspace_id=?', [workspace]))[0]
  assert.equal(row.platform_user_id, 'runtime-isolated-identity'); assert(!row.platform_cookie_hash.includes('runtime-only'))
  const reopened = await home.executeJavaScript(`workspaceBridge.launch({workspaceId:${JSON.stringify(workspace)},environmentId:${JSON.stringify(environment)},accountId:${JSON.stringify(saved.accountId)},capabilities:[],allowedOrigins:[]})`)
  assert.equal(reopened.ok, true, reopened.error)
  fs.writeFileSync(report, JSON.stringify({ ok: true, electron: process.versions.electron, checks: ['真实 JSAPI 与加密启动', '真实 RPA 身份响应与采集', '主进程任务证明', 'auth_accounts 加密入库', '账号再次打开', '客户端本地能力缓存'] }, null, 2))
}).catch(error => { fs.writeFileSync(report, JSON.stringify({ ok: false, message: error.message, stack: error.stack }, null, 2)); process.exitCode = 1 }).finally(async () => { clearTimeout(deadline); if (server) await server.stop(); media?.close(); app.exit(process.exitCode || 0) })
