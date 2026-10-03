const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { ProfileRepository } = require('../profile-repository')
const { createProfileRecord, getDefaultProfile } = require('../profile-store')

function record (id) {
  return createProfileRecord({ id, name: `测试配置${id}`, fingerprint: getDefaultProfile() })
}

async function run () {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fp-profiles-test-'))
  try {
    const file = path.join(root, 'profiles.json')
    const repository = new ProfileRepository(file)
    assert.deepEqual(await repository.load([record('初始')]), { recovered: false })
    await Promise.all(Array.from({ length: 12 }, (_, index) => repository.save(record(`并发${index}`))))
    assert.equal(repository.list().length, 13, '并发保存丢失配置。')
    assert.deepEqual(JSON.parse(await fs.readFile(file, 'utf8')), repository.list(), '文件与内存不一致。')
    const detached = repository.list()
    detached[0].name = '外部修改'
    assert.notEqual(repository.list()[0].name, detached[0].name, '返回对象可以修改内部配置。')

    const before = repository.list()[0]
    const updates = await Promise.allSettled([
      repository.save({ ...before, name: '版本甲' }),
      repository.save({ ...before, name: '版本乙' })
    ])
    assert.equal(updates.filter(item => item.status === 'fulfilled').length, 1, '过期版本未拒绝。')
    assert.match(updates.find(item => item.status === 'rejected').reason.message, /重新加载/)
    assert.equal(repository.list()[0].revision, 2)
    await assert.rejects(repository.save({ ...repository.list()[0], revision: undefined }), /重新加载/)

    for (const failure of ['写入', '备份替换', '主文件替换']) {
      const memory = repository.list()
      const original = await fs.readFile(file, 'utf8')
      const failing = new ProfileRepository(file, {
        ...fs,
        async open (...args) {
          const handle = await fs.open(...args)
          if (failure !== '写入') return handle
          return {
            writeFile: async () => { throw new Error('模拟写入失败。') },
            sync: async () => { await handle.sync() },
            close: async () => { await handle.close() }
          }
        },
        async rename (source, target) {
          if ((failure === '备份替换' && target === `${file}.bak`) || (failure === '主文件替换' && target === file)) {
            throw new Error('模拟配置替换失败。')
          }
          await fs.rename(source, target)
        }
      })
      await failing.load([])
      await assert.rejects(failing.save(record(`失败${failure}`)), /模拟/)
      assert.deepEqual(failing.list(), memory, '失败的保存污染了内存。')
      assert.equal(await fs.readFile(file, 'utf8'), original, '失败的保存损坏了原文件。')
      assert.equal((await fs.readdir(root)).some(name => name.endsWith('.tmp')), false, '失败后遗留临时文件。')
      failing.fileSystem = fs
      await failing.save(record(`恢复${failure}`))
      assert.equal(failing.list().length, memory.length + 1, '保存失败后队列不能继续使用。')
      await repository.load([])
    }

    const toDelete = repository.list().find(item => item.id === '并发0')
    await Promise.all([repository.delete(toDelete.id), repository.save(record('删除期间新增'))])
    assert.equal(repository.list().some(item => item.id === toDelete.id), false)
    assert.equal(repository.list().some(item => item.id === '删除期间新增'), true)
    await assert.rejects(repository.save({ ...toDelete, expectedRevision: toDelete.revision }), /重新加载/)
    await assert.rejects(repository.save({ ...repository.list()[0], expectedRevision: null }), /ID 已存在/)
    await assert.rejects(repository.delete('不存在'), /找不到/)
    await repository.waitForWrites()

    const backup = JSON.parse(await fs.readFile(`${file}.bak`, 'utf8'))
    const damaged = '{损坏的配置'
    await fs.writeFile(file, damaged, 'utf8')
    const recovered = new ProfileRepository(file)
    assert.deepEqual(await recovered.load([record('不应初始化')]), { recovered: true })
    assert.deepEqual(recovered.list(), backup, '恢复时没有使用有效备份。')
    assert.equal(await fs.readFile(file, 'utf8'), damaged, '读取备份时覆盖了损坏原文件。')
    await recovered.save(record('恢复后新增'))
    const damagedFiles = (await fs.readdir(root)).filter(name => name.startsWith('profiles.json.damaged-'))
    assert.equal(damagedFiles.length, 1, '保存恢复结果时没有保留损坏副本。')
    assert.equal(await fs.readFile(path.join(root, damagedFiles[0]), 'utf8'), damaged)
    assert.deepEqual(JSON.parse(await fs.readFile(`${file}.bak`, 'utf8')), backup, '恢复时污染了有效备份。')

    await fs.unlink(file)
    const missing = new ProfileRepository(file)
    assert.deepEqual(await missing.load([record('不应初始化')]), { recovered: true })
    assert.deepEqual(missing.list(), backup, '主文件丢失时没有读取备份。')

    const invalidFile = path.join(root, 'invalid.json')
    await fs.writeFile(invalidFile, damaged, 'utf8')
    await assert.rejects(new ProfileRepository(invalidFile).load([record('不应初始化')]), /没有可用/)
    assert.equal(await fs.readFile(invalidFile, 'utf8'), damaged, '无备份时重置了损坏配置。')
    await fs.writeFile(`${invalidFile}.bak`, '[]损坏', 'utf8')
    await assert.rejects(new ProfileRepository(invalidFile).load([]), /没有可用/)
    assert.equal(await fs.readFile(invalidFile, 'utf8'), damaged)

    const duplicateFile = path.join(root, 'duplicate.json')
    await fs.writeFile(duplicateFile, JSON.stringify([record('重复'), record('重复')]), 'utf8')
    await assert.rejects(new ProfileRepository(duplicateFile).load([]), /没有可用/)

    const waitingFile = path.join(root, 'waiting.json')
    let unblock
    let entered
    const blocked = new Promise(resolve => { unblock = resolve })
    const committing = new Promise(resolve => { entered = resolve })
    let delayCommit = false
    const waiting = new ProfileRepository(waitingFile, {
      ...fs,
      async rename (source, target) {
        if (delayCommit && target === waitingFile) {
          entered()
          await blocked
        }
        await fs.rename(source, target)
      }
    })
    await waiting.load([])
    delayCommit = true
    const saving = waiting.save(record('等待退出'))
    await committing
    let drained = false
    const draining = (async () => { await waiting.waitForWrites(); drained = true })()
    await Promise.resolve()
    assert.equal(drained, false, '等待写入提前结束。')
    unblock()
    await Promise.all([saving, draining])
    assert.equal(drained, true)
    assert.equal(JSON.parse(await fs.readFile(waitingFile, 'utf8'))[0].id, '等待退出')
    console.log('原子保存、并发修改、版本冲突、失败续写和备份恢复自检通过。')
  } finally {
    // 只删除本测试创建且位于系统临时目录中的专属目录。
    assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()))
    assert.ok(path.basename(root).startsWith('fp-profiles-test-'))
    await fs.rm(root, { recursive: true, force: true })
  }
}

void (async () => {
  try {
    await run()
  } catch (error) {
    console.error('配置持久化自检失败。', error)
    process.exitCode = 1
  }
})()
