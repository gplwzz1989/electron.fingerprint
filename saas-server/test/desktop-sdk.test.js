const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const http = require('node:http')

test('网页 SDK 识别旧服务与错误密文协议，在调用客户端解密前给出明确提示', async () => {
  let modern = false; let format = 'qijie-launch-v1'; let prepared = 0; let decrypted = 0
  const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(req.url === '/api/health' ? { ok: true, status: 'available', ...(modern ? { launchProtocols: ['desktop-launch-v1'] } : {}) } : req.url === '/api/auth/me' ? { ok: true, csrf: 'isolated-test' } : { ok: true, envelope: { format } }))
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const origin = `http://127.0.0.1:${server.address().port}`
  const window = { desktopBridge: { protocolVersion: 1, prepareLaunch: async () => { prepared++; return { ok: true, requestId: 'isolated-request' } }, launchEncrypted: async () => { decrypted++; return { ok: true } } } }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/desktop-sdk.js'), 'utf8'), { window, fetch: (url, options) => fetch(origin + url, options), AbortSignal })
  try {
    const payload = { workspaceId: 'isolated-workspace', environmentId: 'isolated-environment' }
    const old = await window.workspaceBridge.launch(payload)
    assert.equal(old.ok, false); assert.match(old.error, /旧版本/); assert.equal(prepared, 0); assert.equal(decrypted, 0)
    modern = true
    const mismatch = await window.workspaceBridge.launch(payload)
    assert.equal(mismatch.ok, false); assert.match(mismatch.error, /协议不兼容/); assert.equal(decrypted, 0)
    format = 'desktop-launch-v1'
    assert.equal((await window.workspaceBridge.launch(payload)).ok, true); assert.equal(decrypted, 1)
  } finally { await new Promise(resolve => server.close(resolve)) }
})
