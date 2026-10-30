// 使用隔离本机 HTTPS 页面验证真实 Electron 网络观察与加密采集，不访问用户会话。
const { app, BrowserWindow } = require('electron/main')
const fs = require('node:fs')
const https = require('node:https')
const crypto = require('node:crypto')
const assert = require('node:assert/strict')
const { SessionObserver } = require('../session-observer')
const report = process.argv[2]; let server; let window
const timer = setTimeout(() => app.exit(2), 30000)
app.whenReady().then(async () => {
  server = https.createServer({ key: fs.readFileSync(process.argv[3]), cert: fs.readFileSync(process.argv[4]) }, (req, res) => {
    res.setHeader('Content-Type', req.url === '/identity' ? 'application/json' : 'text/html; charset=utf-8')
    res.end(req.url === '/identity' ? JSON.stringify({ user: { id: 'isolated-runtime-test' } }) : '<!doctype html><html lang="zh-CN"><title>会话观察隔离验收</title><body>仅用于本机验收</body></html>')
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const origin = `https://127.0.0.1:${server.address().port}`
  window = new BrowserWindow({ show: false, webPreferences: { partition: 'observer-test-' + crypto.randomUUID(), sandbox: true, nodeIntegration: false } })
  window.webContents.session.setCertificateVerifyProc((_request, callback) => callback(0))
  await window.loadURL(origin)
  const contents = window.webContents
  const observer = new SessionObserver({ getTab: () => ({ kind: 'managed', view: { webContents: contents } }) })
  const keys = crypto.generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } })
  const operationId = crypto.randomUUID()
  const job = await observer.open(contents, { tabId: 'test', origins: [origin], storageKeys: ['isolated-key'], publicKey: keys.publicKey, operationId })
  await contents.session.cookies.set({ url: origin, name: 'isolated-cookie', value: 'runtime-test-secret', secure: true, httpOnly: true })
  await contents.executeJavaScript("localStorage.setItem('isolated-key', 'runtime-storage-secret'); fetch('/identity').then(r => r.json())")
  let snapshot
  for (let i = 0; i < 50; i++) { snapshot = await observer.read(contents, { id: job.id }); if (snapshot.responses.length) break; await new Promise(resolve => setTimeout(resolve, 100)) }
  assert.equal(snapshot.responses[0].body.user.id, 'isolated-runtime-test')
  assert(snapshot.storageKeys[origin].includes('isolated-key'))
  assert(!JSON.stringify(snapshot).includes('runtime-storage-secret'))
  assert.throws(() => observer.get({}, job.id), /已结束/)
  const envelope = await observer.capture(contents, { id: job.id })
  const key = crypto.privateDecrypt({ key: keys.privateKey, oaepHash: 'sha256' }, Buffer.from(envelope.wrappedKey, 'base64'))
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(envelope.iv, 'base64')); decipher.setAAD(Buffer.from(operationId)); decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'))
  const session = JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.ciphertext, 'base64')), decipher.final()]).toString())
  assert(session.cookies.some(cookie => cookie.httpOnly === false && cookie.secure === false && cookie.value === 'runtime-test-secret'))
  assert.equal(session.storage[origin]['isolated-key'], 'runtime-storage-secret')
  await observer.close(contents, job.id); assert.equal(observer.jobs.size, 0)
  assert.equal(contents.debugger.isAttached(), false)
  fs.writeFileSync(report, JSON.stringify({ ok: true, electron: process.versions.electron, checks: ['真实网络响应', '来源隔离', 'HttpOnly Cookie', '本地存储', 'RSA 与 AES-GCM', '任务归属', '监听释放'] }, null, 2))
}).catch(error => { fs.writeFileSync(report, JSON.stringify({ ok: false, message: error.message, stack: error.stack })); process.exitCode = 1 }).finally(() => { clearTimeout(timer); window?.destroy(); server?.close(); app.exit(process.exitCode || 0) })
