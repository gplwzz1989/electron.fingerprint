const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { EnvironmentRepository } = require('../environment-repository')
const { getDefaultProfile, createProfileRecord } = require('../profile-store')

function profile (id = 'profile-environment') {
  return createProfileRecord({ id, name: '环境测试配置', url: 'https://example.com', fingerprint: getDefaultProfile() })
}

async function run () {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fp-environments-test-'))
  try {
    const repository = new EnvironmentRepository(root)
    await repository.load()
    const created = await repository.create(profile(), 'https://example.com/start')
    assert.equal(repository.list().length, 1)
    assert.equal(created.status, 'closed')
    assert.equal(path.dirname(created.dataDir), path.join(root, 'tabs'))
    await repository.update(created.id, { status: 'open', lastUrl: 'https://example.com/next' })
    const reloaded = new EnvironmentRepository(root)
    await reloaded.load()
    assert.equal(reloaded.list()[0].status, 'closed', '异常退出后环境不应继续显示为使用中。')
    assert.equal(reloaded.list()[0].lastUrl, 'https://example.com/next')
    assert.deepEqual(reloaded.list()[0].fingerprint, created.fingerprint)

    const failedRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'fp-environments-failed-write-'))
    try {
      const failed = new EnvironmentRepository(failedRoot)
      await failed.load()
      const failingFileSystem = {
        ...fs,
        async rename (source, target) {
          if (target === path.join(failedRoot, 'environments.json')) {
            const error = new Error('模拟磁盘空间不足。')
            error.code = 'ENOSPC'
            throw error
          }
          await fs.rename(source, target)
        }
      }
      failed.fileSystem = failingFileSystem
      await assert.rejects(failed.create(profile('failed-write'), 'https://example.com/failed'), /磁盘空间不足/)
      assert.equal(failed.list().length, 0, '环境写入失败后不应污染内存记录。')
      assert.deepEqual(await fs.readdir(path.join(failedRoot, 'tabs')), [], '环境写入失败后应清理临时目录。')
    } finally {
      assert.ok(path.basename(failedRoot).startsWith('fp-environments-failed-write-'))
      await fs.rm(failedRoot, { recursive: true, force: true })
    }
    await reloaded.remove(created.id)
    assert.equal(reloaded.list().length, 0)
    await assert.rejects(fs.access(created.dataDir))
    await assert.rejects(reloaded.remove(created.id), /找不到浏览器环境/)

    const lockedRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'fp-environments-locked-'))
    try {
      const locked = new EnvironmentRepository(lockedRoot)
      await locked.load()
      const lockedEnvironment = await locked.create(profile('locked-profile'), 'https://example.com/locked')
      const lockedFileSystem = {
        ...fs,
        async rename (source, target) {
          if (target.includes('.deleted-')) {
            const error = new Error('模拟环境仍被页面进程占用。')
            error.code = 'EPERM'
            throw error
          }
          await fs.rename(source, target)
        }
      }
      locked.fileSystem = lockedFileSystem
      const pending = await locked.remove(lockedEnvironment.id)
      assert.equal(pending.pending, true)
      assert.equal(locked.list().length, 0)
      await fs.access(lockedEnvironment.dataDir)
      const afterRestart = new EnvironmentRepository(lockedRoot)
      await afterRestart.load()
      await assert.rejects(fs.access(lockedEnvironment.dataDir))
      assert.equal((await fs.readdir(lockedRoot)).includes('environment-deletions.json'), false)
    } finally {
      assert.ok(path.basename(lockedRoot).startsWith('fp-environments-locked-'))
      await fs.rm(lockedRoot, { recursive: true, force: true })
    }

    const legacyRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'fp-environments-legacy-'))
    try {
      const legacyProfile = profile('legacy-profile')
      const legacyDir = path.join(legacyRoot, 'tabs', 'legacy-environment')
      await fs.mkdir(legacyDir, { recursive: true })
      await fs.writeFile(path.join(legacyDir, 'fingerprint.json'), `${JSON.stringify({
        ...legacyProfile,
        url: 'https://example.com/legacy'
      })}\n`, 'utf8')
      const migrated = new EnvironmentRepository(legacyRoot)
      await migrated.load()
      assert.equal(migrated.list().length, 1)
      assert.equal(migrated.list()[0].id, 'legacy-environment')
      assert.equal(migrated.list()[0].lastUrl, 'https://example.com/legacy')
      assert.equal((await fs.stat(path.join(legacyRoot, 'environments.json'))).isFile(), true)
    } finally {
      assert.ok(path.basename(legacyRoot).startsWith('fp-environments-legacy-'))
      await fs.rm(legacyRoot, { recursive: true, force: true })
    }

    const invalidRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'fp-environments-invalid-'))
    try {
      await fs.mkdir(path.join(invalidRoot, 'tabs'), { recursive: true })
      await fs.writeFile(path.join(invalidRoot, 'environments.json'), JSON.stringify([{
        id: 'outside',
        profileId: 'profile-outside',
        profileName: '越界环境',
        profileRevision: 1,
        dataDir: path.join(invalidRoot, 'outside'),
        fingerprint: getDefaultProfile(),
        lastUrl: 'https://example.com',
        status: 'closed',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }]), 'utf8')
      await assert.rejects(new EnvironmentRepository(invalidRoot).load(), /目录规则/)
    } finally {
      assert.ok(path.basename(invalidRoot).startsWith('fp-environments-invalid-'))
      await fs.rm(invalidRoot, { recursive: true, force: true })
    }
    console.log('环境创建、关闭恢复、旧目录迁移和安全删除自检通过。')
  } finally {
    assert.ok(path.basename(root).startsWith('fp-environments-test-'))
    await fs.rm(root, { recursive: true, force: true })
  }
}

void (async () => {
  try {
    await run()
  } catch (error) {
    console.error('环境管理自检失败。', error)
    process.exitCode = 1
  }
})()
