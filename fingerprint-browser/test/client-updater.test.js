const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const os = require('node:os')
const http = require('node:http')
const crypto = require('node:crypto')
const { ClientUpdater, verifyManifest, newerVersion, updateUrl } = require('../client-updater')
const { UpdateFeedServer } = require('./update-feed-server')

test('签名更新清单拒绝伪签名、过期、跨环境、错误平台和不安全下载地址', () => {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519')
  const now = Date.now(); const options = { publicKey: publicKey.export({ type: 'spki', format: 'pem' }), channel: 'prod', platform: 'win32', arch: 'x64', currentVersion: '0.1.0', now }
  const manifest = { format: 'qijie-update-v1', version: '0.2.0', channel: 'prod', platform: 'win32', arch: 'x64', size: 100, sha256: 'a'.repeat(64), url: 'https://updates.example/update.exe', notes: '修复已知问题。', publishedAt: now, expiresAt: now + 60000 }
  const sign = data => { const payload = Buffer.from(JSON.stringify(data)); return { payload: payload.toString('base64'), signature: crypto.sign(null, payload, privateKey).toString('base64') } }
  assert.equal(verifyManifest(sign(manifest), options).version, '0.2.0')
  assert.throws(() => verifyManifest({ ...sign(manifest), signature: crypto.randomBytes(64).toString('base64') }, options))
  for (const change of [{ channel: 'test' }, { arch: 'arm64' }, { platform: 'darwin' }, { expiresAt: now - 1 }, { publishedAt: now + 3600000 }, { size: 3 * 1024 ** 3 }, { url: 'http://remote.example/update.exe' }, { url: 'https://user:password@example/update.exe' }]) assert.throws(() => verifyManifest(sign({ ...manifest, ...change }), options))
  assert(newerVersion('1.0.0', '0.99.99')); assert(!newerVersion('0.1.0', '0.2.0')); assert(!newerVersion('0.1.0', '0.1.0'))
  assert.throws(() => updateUrl('http://127.0.0.1/update.exe', 'prod'))
})

test('真实 HTTP 发布、检查、自动下载、缓存复核及安装前二次校验', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'qijie-updater-'))
  const updates = path.join(directory, 'public'); await fs.mkdir(updates)
  const configFile = path.join(directory, '.env.test'); await fs.writeFile(configFile, `CLIENT_UPDATES_DIR=${updates.replace(/\\/g, '/')}`)
  const service = new UpdateFeedServer(updates)
  let requests = 0
  const server = http.createServer((req, res) => { requests++; void service.handle(req, res, new URL(req.url, 'http://localhost').pathname).then(handled => { if (!handled) { res.writeHead(404); res.end() } }).catch(error => { if (!res.headersSent) res.writeHead(error.status || 500); res.end() }) })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const origin = `http://127.0.0.1:${server.address().port}`
  const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519')
  const binary = crypto.randomBytes(32768); const digest = crypto.createHash('sha256').update(binary).digest('hex')
  const manifest = { format: 'qijie-update-v1', version: '0.2.0', channel: 'dev', platform: 'win32', arch: 'x64', url: origin + '/test-update.exe', sha256: digest, size: binary.length, notes: '仅隔离更新链路测试，不执行此文件。', publishedAt: Date.now(), expiresAt: Date.now() + 60000 }
  const publish = async value => { const payload = Buffer.from(JSON.stringify(value)); await fs.writeFile(path.join(updates, 'dev-win32-x64.json'), JSON.stringify({ payload: payload.toString('base64'), signature: crypto.sign(null, payload, privateKey).toString('base64') })) }
  const updater = new ClientUpdater({ config: { enabled: true, channel: 'dev', publicKey: publicKey.export({ type: 'spki', format: 'pem' }), url: origin + '/dev-win32-x64.json' }, currentVersion: '0.1.0', directory: path.join(directory, 'client'), platform: 'win32', arch: 'x64' })
  try {
    assert.equal((await updater.check()).status, 'current', '无发布清单时不更新。')
    await fs.writeFile(path.join(updates, 'test-update.exe'), binary); await publish(manifest)
    const before = requests
    await Promise.all([updater.check(), updater.check(), updater.check()])
    assert.equal(requests - before, 2, '并发检查只请求一次清单和一次安装包。')
    assert.equal(updater.snapshot().status, 'ready'); assert.equal(updater.snapshot().progress, 100)
    const prepared = await updater.prepareInstall(); assert.deepEqual(await fs.readFile(prepared.installer), binary)
    await fs.writeFile(prepared.installer, crypto.randomBytes(binary.length))
    await assert.rejects(updater.prepareInstall(), /校验失败/)
    assert.equal(updater.snapshot().status, 'error')
    assert.equal((await updater.check()).status, 'ready', '损坏缓存可以重新下载。')
    await publish({ ...manifest, sha256: 'f'.repeat(64) })
    assert.equal((await updater.check()).status, 'error', '伪造文件摘要阻止安装。')
    await publish({ ...manifest, version: '0.0.9' }); assert.equal((await updater.check()).status, 'current', '拒绝版本回退。')
    assert.equal((await fetch(origin + '/private.pem')).status, 404, '私钥类型不能公开下载。')
  } finally { updater.stop(); await new Promise(resolve => server.close(resolve)) }
})
