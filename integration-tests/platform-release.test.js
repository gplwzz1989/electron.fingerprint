const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const crypto = require('node:crypto')
const { WorkspaceServer } = require('../saas-server/src/workspace-server')
const { PlatformPackageManager } = require('../fingerprint-browser/platform-package-manager')

test('后台上传单 JS → 自动版本 → 检测与下载 → 客户端缓存；普通用户和伪造请求均被拒绝', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'platform-release-integration-'))
  const databaseName = 'qijie_workspace_test_' + crypto.randomBytes(10).toString('hex')
  let server = new WorkspaceServer({ port: 0, dataDir: directory, databaseName }); let address = await server.start()
  let origin = `http://127.0.0.1:${address.port}`
  try {
    const admin = await server.systemSettings.provisionAdmin('release-admin@example.test')
    const user = await server.database.userByEmail(admin.email); const session = await server.database.createSession(user.id)
    const upload = async (component, code, expected = 201, authenticated = true, csrf = session.csrf) => {
      const response = await fetch(origin + '/api/system/platform-releases/' + component, { method: 'POST', headers: { 'Content-Type': 'application/javascript', ...(authenticated ? { Cookie: 'qijie_session=' + session.token, 'X-CSRF-Token': csrf } : {}) }, body: code })
      const result = await response.json(); assert.equal(response.status, expected, result.message); return result
    }
    // 最小 CommonJS 文件仅用于隔离发布协议测试，不进入客户端或 SaaS 发行包。
    const platform = "module.exports={catalog:[],run:async()=>({}),version:'源文件内部版本不参与后台编号'}"
    const rpa = 'module.exports={identity:()=>null}'
    await upload('platform', platform, 401, false)
    await upload('platform', platform, 403, true, 'invalid-csrf-token')
    await upload('platform', 'function {', 400)
    const first = await upload('platform', platform); assert.equal(first.manifest, null)
    const second = await upload('rpa', rpa)
    assert.notEqual(first.version, second.version); assert(second.manifest.rpa)
    const manager = new PlatformPackageManager({ directory: path.join(directory, 'client-cache'), bundledDirectory: path.join(directory, '没有预置能力'), url: origin + '/api/platform-releases/manifest.json', channel: 'dev' })
    await manager.initialize(); assert.equal((await manager.check()).status, 'updated')
    assert.equal((await manager.runtime.load()).manifest.version, second.version)
    const cached = manager.runtime.directory
    const newer = await upload('rpa', rpa + ';/* 隔离测试更新 */')
    assert.notEqual(newer.version, second.version); assert.equal(newer.manifest.file, second.manifest.file)
    await manager.check(); assert.notEqual(manager.runtime.directory, cached)
    const concurrent = await Promise.all([upload('platform', platform), upload('rpa', rpa)])
    assert.notEqual(concurrent[0].version, concurrent[1].version)
    const oldDownload = await fetch(origin + '/api/platform-releases/' + second.manifest.rpa.file)
    assert.equal(oldDownload.status, 200); assert.equal(await oldDownload.text(), rpa)
    await server.stop(); server = new WorkspaceServer({ port: 0, dataDir: directory, databaseName }); address = await server.start(); origin = `http://127.0.0.1:${address.port}`
    const persisted = await fetch(origin + '/api/platform-releases/manifest.json').then(response => response.json())
    assert(concurrent.some(item => item.version === persisted.version))
    await server.database.execute('DELETE FROM system_administrators WHERE user_id=?', [user.id])
    await upload('platform', platform, 403)
    assert.equal(await fs.promises.readFile(path.join(directory, 'client-cache', 'current.json'), 'utf8').then(JSON.parse).then(value => typeof value.release), 'string')
  } finally { await server.stop() }
})
