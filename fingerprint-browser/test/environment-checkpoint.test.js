const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { CheckpointError, assertTransferVersion, createCheckpoint, verifyCheckpoint } = require('../environment-checkpoint')

async function run () {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fp-checkpoint-test-'))
  try {
    await fs.mkdir(path.join(root, 'Default'), { recursive: true })
    await fs.writeFile(path.join(root, 'fingerprint.json'), '{"版本":1}\n', 'utf8')
    await fs.writeFile(path.join(root, 'Default', 'Cookies'), 'cookie-data', 'utf8')
    const manifest = await createCheckpoint({ environmentId: 'environment-1', dataDir: root, baseVersion: 3, platform: 'win32', now: 1000 })
    assert.equal(manifest.files.length, 2)
    assert.equal((await verifyCheckpoint({ dataDir: root, manifest, targetPlatform: 'win32' })).ok, true)
    assert.equal((await verifyCheckpoint({ dataDir: root, manifest, targetPlatform: 'darwin' })).reason, 'platform')
    await fs.writeFile(path.join(root, 'Default', 'Cookies'), 'changed-cookie-data', 'utf8')
    const changed = await verifyCheckpoint({ dataDir: root, manifest, targetPlatform: 'win32' })
    assert.deepEqual(changed.changed, ['Default/Cookies'])
    await fs.writeFile(path.join(root, 'Default', 'Cookies'), 'cookie-data', 'utf8')
    await fs.writeFile(path.join(root, 'unexpected'), 'new-data', 'utf8')
    const extra = await verifyCheckpoint({ dataDir: root, manifest, targetPlatform: 'win32' })
    assert.deepEqual(extra.unexpected, ['unexpected'])
    assert.equal(await fs.readFile(path.join(root, 'Default', 'Cookies'), 'utf8'), 'cookie-data', '校验过程不应改写本地数据。')
    assert.equal(assertTransferVersion(3, 3), true)
    assert.throws(() => assertTransferVersion(3, 4), CheckpointError)
    const linkTarget = path.join(root, 'link-target')
    await fs.writeFile(linkTarget, 'target', 'utf8')
    await fs.symlink(linkTarget, path.join(root, 'link'))
    await assert.rejects(createCheckpoint({ environmentId: 'environment-1', dataDir: root, platform: 'win32' }), /符号链接/)
    console.log('同系统检查点清单、哈希校验、平台边界和版本冲突自检通过。')
  } finally {
    assert.ok(path.basename(root).startsWith('fp-checkpoint-test-'))
    await fs.rm(root, { recursive: true, force: true })
  }
}

void run().catch(error => {
  console.error('环境检查点自检失败。', error)
  process.exitCode = 1
})
