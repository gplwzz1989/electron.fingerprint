const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { DEFAULT_GROUP_ID, DEFAULT_GROUP_NAME, GroupRepository } = require('../group-repository')

async function run () {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'fp-groups-test-'))
  try {
    const repository = new GroupRepository(root)
    await repository.load([{ group: '电商运营' }, { group: '未分组' }])
    assert.deepEqual(repository.list().map(group => group.name), ['未分组', '电商运营'])
    const created = await repository.create('客户支持')
    assert.equal(repository.get(created.id).name, '客户支持')
    await assert.rejects(repository.create('客户支持'), /已经存在/)
    const renamed = await repository.rename(created.id, '海外广告')
    assert.equal(renamed.previousName, '客户支持')
    assert.equal(repository.get(created.id).name, '海外广告')
    await assert.rejects(repository.rename(DEFAULT_GROUP_ID, '不能修改'), /默认分组/)
    await repository.remove(created.id)
    assert.equal(repository.get(created.id), undefined)
    await assert.rejects(repository.remove(DEFAULT_GROUP_ID), /默认分组/)
    const reloaded = new GroupRepository(root)
    await reloaded.load()
    assert.equal(reloaded.getByName(DEFAULT_GROUP_NAME).id, DEFAULT_GROUP_ID)
    assert.equal(reloaded.getByName('电商运营').name, '电商运营')
    console.log('业务分组迁移、增改删、重复校验和重启持久化自检通过。')
  } finally {
    assert.ok(path.basename(root).startsWith('fp-groups-test-'))
    await fs.rm(root, { recursive: true, force: true })
  }
}

void run().catch(error => {
  console.error('业务分组自检失败。', error)
  process.exitCode = 1
})
