const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const os = require('node:os')
const crypto = require('node:crypto')
const http = require('node:http')
const { PlatformPackageManager } = require('../platform-package-manager')

// 这些最小能力仅供隔离更新测试，用于验证真实下载、摘要、缓存和切换，不进入发行包。
async function release (directory, version) {
  await fs.mkdir(directory, { recursive: true })
  const manifest = { version, bridgeVersion: 2 }
  for (const [prefix, property, code] of [
    ['authorization', null, `window.MediaPlatform={version:'${version}',catalog:[],run:async()=>({})}`],
    ['rpa', 'rpa', `window.MediaRpa={version:'${version}',identity:()=>null}`]
  ]) {
    const sha256 = crypto.createHash('sha256').update(code).digest('hex'); const file = `${prefix}-${version}-${sha256.slice(0, 12)}.js`
    await fs.writeFile(path.join(directory, file), code)
    if (property) manifest[property] = { version, sha256, file }
    else Object.assign(manifest, { file, sha256 })
  }
  await fs.writeFile(path.join(directory, 'manifest.json'), JSON.stringify(manifest))
  return manifest
}
test('能力更新由客户端完成：启动缓存、并发去重、版本切换、损坏回退及离线重启', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'platform-updates-'))
  const bundled = path.join(root, 'bundled'); const remote = path.join(root, 'remote'); const cache = path.join(root, 'cache')
  await release(bundled, '1.0.0'); let manifest = await release(remote, '1.1.0'); let requests = 0
  const server = http.createServer((req, res) => { requests++; fs.readFile(path.join(remote, path.basename(req.url))).then(bytes => res.end(bytes), () => { res.statusCode = 404; res.end() }) })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const manager = new PlatformPackageManager({ directory: cache, bundledDirectory: bundled, url: `http://127.0.0.1:${server.address().port}/manifest.json`, channel: 'dev' })
  try {
    await manager.initialize()
    const pinned = (await manager.runtime.load()).runtime
    assert.equal(pinned.version, '1.0.0')
    const checks = await Promise.all([manager.check(), manager.check()])
    assert(checks.every(item => item.status === 'updated')); assert.equal(requests, 3)
    assert.equal((await manager.runtime.load()).manifest.version, '1.1.0')
    assert.equal(pinned.version, '1.0.0', '已加载任务继续持有旧版执行对象')
    const directory = manager.runtime.directory
    manifest = await release(remote, '1.2.0'); await fs.appendFile(path.join(remote, manifest.rpa.file), '损坏内容')
    assert.equal((await manager.check()).status, 'error'); assert.equal(manager.runtime.directory, directory)
    await release(remote, '0.9.0'); await manager.check()
    assert.equal((await manager.runtime.load()).manifest.version, '1.1.0', '拒绝版本回退')
    const offline = new PlatformPackageManager({ directory: cache, bundledDirectory: path.join(root, '不存在'), url: '' })
    await offline.initialize(); assert.equal((await offline.runtime.load()).manifest.version, '1.1.0')
    assert.equal((await offline.check()).status, 'local')
    assert(!JSON.stringify(await fs.readFile(path.join(cache, 'current.json'), 'utf8')).includes('.pending'))
  } finally { await new Promise(resolve => server.close(resolve)) }
})
