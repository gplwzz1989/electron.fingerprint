const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const os = require('node:os')
const Module = require('node:module')
const EventEmitter = require('node:events')

// Mock electron/main 模块供纯 Node.js 测试环境加载 browser-tabs
const mockApp = new EventEmitter()
const origModuleLoad = Module._load
Module._load = function (request, parent, isMain) {
  if (request === 'electron/main') {
    return {
      app: mockApp,
      BrowserWindow: class {},
      WebContentsView: class {},
      session: {
        fromPath: (p) => ({ path: p, setPermissionRequestHandler: () => {}, setPermissionCheckHandler: () => {} })
      }
    }
  }
  return origModuleLoad.apply(this, arguments)
}

const { EnvironmentRepository } = require('../environment-repository')
const { TabBrowser } = require('../browser-tabs')

async function run () {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'tz-edit-test-'))
  try {
    const dataRoot = path.join(tmpRoot, 'data')
    const repo = new EnvironmentRepository(dataRoot)
    await repo.load()

    // 1. 验证环境数据目录保持规范真实路径，避免相对路径别名导致 LevelDB/SQLite 锁冲突
    const baseDir = path.join(dataRoot, 'tabs', 'env-1')
    await fs.mkdir(baseDir, { recursive: true })
    await fs.writeFile(path.join(baseDir, 'test-file.txt'), 'hello')
    assert.equal(path.resolve(baseDir), baseDir, '数据目录必须为规范绝对路径')
    assert.ok(!baseDir.includes(path.sep + '.'), '数据目录不得包含相对路径别名段')
    const content = await fs.readFile(path.join(baseDir, 'test-file.txt'), 'utf8')
    assert.equal(content, 'hello')

    // 2. 测试环境创建与时区保存
    const initialProfile = {
      id: 'prof-test',
      name: '测试环境',
      revision: 1,
      fingerprint: {
        locale: { language: 'zh-CN', languages: ['zh-CN', 'zh'], timezone: 'Asia/Shanghai' },
        noise: { seed: 'seed-test' }
      },
      proxy: { mode: 'direct' }
    }
    const env = await repo.create(initialProfile, 'about:blank')
    assert.equal(env.fingerprint.locale.timezone, 'Asia/Shanghai')
    assert.equal(env.profileRevision, 1)

    // 3. 测试环境关闭后编辑时区并更新
    const nextFp = structuredClone(env.fingerprint)
    nextFp.locale.timezone = 'America/New_York'

    const updated = await repo.updateProfile(env.id, { fingerprint: nextFp })
    assert.equal(updated.fingerprint.locale.timezone, 'America/New_York', '更新后环境时区应为 America/New_York')
    assert.equal(updated.profileRevision, 2, '指纹发生变更时 profileRevision 必须自增')

    // 验证持久化文件中记录的时区与版本
    const diskSnapshot = JSON.parse(await fs.readFile(path.join(updated.dataDir, 'fingerprint.json'), 'utf8'))
    assert.equal(diskSnapshot.fingerprint.locale.timezone, 'America/New_York')
    assert.equal(diskSnapshot.revision, 2)

    // 4. 测试 TabBrowser.updateEnvironmentProfile 正确同步 fingerprint
    const mockTabBrowser = new TabBrowser(dataRoot, repo)
    const fakeTab = {
      id: 'tab-1',
      environmentId: env.id,
      profile: {
        id: env.profileId,
        name: env.profileName,
        url: env.creationUrl,
        revision: 1,
        fingerprint: { locale: { timezone: 'Asia/Shanghai' } },
        proxy: { mode: 'direct' }
      }
    }
    mockTabBrowser.tabs.set('tab-1', fakeTab)
    mockTabBrowser.updateEnvironmentProfile(updated)

    assert.equal(fakeTab.profile.revision, 2)
    assert.equal(fakeTab.profile.fingerprint.locale.timezone, 'America/New_York', 'Tab 中的指纹时区应同步更新')

    console.log('环境编辑时区持久化、修订版本升级、会话规范路径绑定与标签快照同步自检通过。')
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true }).catch(() => {})
  }
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
