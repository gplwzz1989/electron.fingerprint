const fs = require('node:fs/promises')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const { createProfileRecord, DEFAULT_URL, ProfileValidationError, normalizeUrl } = require('./profile-store')

function clone (value) {
  return structuredClone(value)
}

function ensureEnvironmentPath (dataRoot, id, dataDir) {
  if (typeof dataDir !== 'string' || !dataDir) throw new ProfileValidationError('环境数据目录无效。')
  const expected = path.resolve(path.join(dataRoot, 'tabs', id))
  if (path.resolve(dataDir) !== expected) throw new ProfileValidationError('环境数据目录不符合应用目录规则。')
  return expected
}

function normalizeEnvironment (record, dataRoot) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new ProfileValidationError('环境记录必须是对象。')
  }
  if (typeof record.id !== 'string' || !record.id || record.id.includes('..') || /[\\/]/.test(record.id)) {
    throw new ProfileValidationError('环境 ID 无效。')
  }
  const dataDir = ensureEnvironmentPath(dataRoot, record.id, record.dataDir)
  if (typeof record.profileId !== 'string' || !record.profileId) throw new ProfileValidationError('环境缺少来源配置 ID。')
  if (!Number.isInteger(record.profileRevision) || record.profileRevision < 1) throw new ProfileValidationError('环境来源配置版本无效。')
  const profile = createProfileRecord({
    id: record.profileId,
    name: record.profileName,
    url: record.lastUrl || DEFAULT_URL,
    revision: record.profileRevision,
    fingerprint: record.fingerprint,
    proxy: record.proxy
  })
  if (!['open', 'closed'].includes(record.status)) throw new ProfileValidationError('环境状态无效。')
  if (!Number.isInteger(record.createdAt) || record.createdAt < 1) throw new ProfileValidationError('环境创建时间无效。')
  if (!Number.isInteger(record.updatedAt) || record.updatedAt < 1) throw new ProfileValidationError('环境更新时间无效。')
  return {
    id: record.id,
    profileId: profile.id,
    profileName: profile.name,
    profileRevision: profile.revision,
    dataDir,
    proxy: profile.proxy,
    fingerprint: profile.fingerprint,
    lastUrl: normalizeUrl(record.lastUrl || DEFAULT_URL),
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  }
}

async function writeAtomicText (fileSystem, target, content) {
  const temporary = `${target}.${randomUUID()}.tmp`
  try {
    const handle = await fileSystem.open(temporary, 'wx', 0o600)
    try {
      await handle.writeFile(content, 'utf8')
      await handle.sync()
    } finally {
      await handle.close()
    }
    await fileSystem.rename(temporary, target)
  } finally {
    try {
      await fileSystem.unlink(temporary)
    } catch (error) {
      if (error.code !== 'ENOENT') console.error('[清理环境临时文件]', error)
    }
  }
}

class EnvironmentRepository {
  constructor (dataRoot, fileSystem = fs) {
    this.dataRoot = path.resolve(dataRoot)
    this.tabsRoot = path.join(this.dataRoot, 'tabs')
    this.filePath = path.join(this.dataRoot, 'environments.json')
    this.pendingDeletePath = path.join(this.dataRoot, 'environment-deletions.json')
    this.fileSystem = fileSystem
    this.records = []
    this.pending = Promise.resolve()
    this.loaded = false
  }

  list () {
    return clone(this.records)
  }

  get (id) {
    return this.records.find(environment => environment.id === id)
  }

  async load () {
    await this.fileSystem.mkdir(this.tabsRoot, { recursive: true })
    await this.processPendingDeletes()
    let records
    try {
      records = JSON.parse(await this.fileSystem.readFile(this.filePath, 'utf8'))
    } catch (error) {
      if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw new ProfileValidationError('环境记录无法读取，请检查应用数据目录。')
      try {
        records = JSON.parse(await this.fileSystem.readFile(`${this.filePath}.bak`, 'utf8'))
      } catch (backupError) {
        if (error.code !== 'ENOENT' || backupError.code !== 'ENOENT') {
          throw new ProfileValidationError('环境记录和备份均无法读取，请保留原文件后检查应用数据目录。')
        }
        records = await this.migrateLegacy()
      }
    }
    if (!Array.isArray(records)) throw new ProfileValidationError('环境记录必须是数组。')
    const ids = new Set()
    this.records = records.map(record => {
      const environment = normalizeEnvironment(record, this.dataRoot)
      if (ids.has(environment.id)) throw new ProfileValidationError('环境记录存在重复 ID。')
      ids.add(environment.id)
      return { ...environment, status: 'closed' }
    })
    this.loaded = true
    await this.persist(this.records)
    return { migrated: !records.length && this.records.length > 0 }
  }

  async processPendingDeletes () {
    let pending
    try {
      pending = JSON.parse(await this.fileSystem.readFile(this.pendingDeletePath, 'utf8'))
    } catch (error) {
      if (error.code === 'ENOENT') return
      throw new ProfileValidationError('待删除环境记录无法读取，请检查应用数据目录。')
    }
    if (!Array.isArray(pending)) throw new ProfileValidationError('待删除环境记录格式无效。')
    const remaining = []
    for (const item of pending) {
      try {
        const dataDir = ensureEnvironmentPath(this.dataRoot, item.id, item.dataDir)
        await this.fileSystem.rm(dataDir, { recursive: true, force: true })
      } catch (error) {
        console.error('[清理待删除环境]', error)
        remaining.push(item)
      }
    }
    if (remaining.length > 0) {
      await writeAtomicText(this.fileSystem, this.pendingDeletePath, `${JSON.stringify(remaining, null, 2)}\n`)
    } else {
      await this.fileSystem.unlink(this.pendingDeletePath).catch(error => {
        if (error.code !== 'ENOENT') throw error
      })
    }
  }

  async queuePendingDelete (environment) {
    let pending = []
    try {
      pending = JSON.parse(await this.fileSystem.readFile(this.pendingDeletePath, 'utf8'))
      if (!Array.isArray(pending)) pending = []
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
    }
    pending.push({ id: environment.id, dataDir: environment.dataDir })
    await writeAtomicText(this.fileSystem, this.pendingDeletePath, `${JSON.stringify(pending, null, 2)}\n`)
  }

  async migrateLegacy () {
    const records = []
    let entries
    try {
      entries = await this.fileSystem.readdir(this.tabsRoot, { withFileTypes: true })
    } catch (error) {
      if (error.code === 'ENOENT') return []
      throw error
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.includes('..') || /[\\/]/.test(entry.name)) continue
      try {
        const dataDir = path.join(this.tabsRoot, entry.name)
        const snapshot = JSON.parse(await this.fileSystem.readFile(path.join(dataDir, 'fingerprint.json'), 'utf8'))
        const stat = await this.fileSystem.stat(dataDir)
        records.push(normalizeEnvironment({
          id: entry.name,
          profileId: snapshot.id,
          profileName: snapshot.name,
          profileRevision: snapshot.revision,
          dataDir,
          proxy: snapshot.proxy,
          fingerprint: snapshot.fingerprint,
          lastUrl: snapshot.url,
          status: 'closed',
          createdAt: Math.floor(stat.birthtimeMs || stat.ctimeMs || Date.now()),
          updatedAt: Math.floor(stat.mtimeMs || Date.now())
        }, this.dataRoot))
      } catch (error) {
        console.error('[迁移旧环境]', error)
      }
    }
    return records
  }

  async persist (nextRecords) {
    await this.fileSystem.mkdir(this.dataRoot, { recursive: true })
    if (this.loaded) {
      await writeAtomicText(this.fileSystem, `${this.filePath}.bak`, `${JSON.stringify(this.records, null, 2)}\n`)
    }
    await writeAtomicText(this.fileSystem, this.filePath, `${JSON.stringify(nextRecords, null, 2)}\n`)
    this.records = nextRecords.map(record => clone(record))
    this.loaded = true
  }

  enqueue (operation) {
    const previous = this.pending
    const task = (async () => {
      await previous
      return await operation()
    })()
    this.pending = (async () => {
      try {
        await task
      } catch {
        // 当前调用负责显示错误，后续环境操作仍可继续排队执行。
      }
    })()
    return task
  }

  async create (profile, lastUrl) {
    return await this.enqueue(async () => {
      const now = Date.now()
      const id = randomUUID()
      const dataDir = ensureEnvironmentPath(this.dataRoot, id, path.join(this.tabsRoot, id))
      const environment = normalizeEnvironment({
        id,
        profileId: profile.id,
        profileName: profile.name,
        profileRevision: profile.revision,
        dataDir,
        proxy: profile.proxy,
        fingerprint: profile.fingerprint,
        lastUrl,
        status: 'closed',
        createdAt: now,
        updatedAt: now
      }, this.dataRoot)
      await this.fileSystem.mkdir(dataDir, { recursive: true })
      await writeAtomicText(this.fileSystem, path.join(dataDir, 'fingerprint.json'), `${JSON.stringify(profile, null, 2)}\n`)
      try {
        await this.persist([...this.records, environment])
      } catch (error) {
        await this.fileSystem.rm(dataDir, { recursive: true, force: true })
        throw error
      }
      return clone(environment)
    })
  }

  async update (id, patch) {
    return await this.enqueue(async () => {
      const current = this.get(id)
      if (!current) throw new ProfileValidationError('找不到浏览器环境。')
      const next = normalizeEnvironment({ ...current, ...patch, id, updatedAt: Date.now() }, this.dataRoot)
      await this.persist(this.records.map(record => record.id === id ? next : record))
      return clone(next)
    })
  }

  async remove (id) {
    return await this.enqueue(async () => {
      const current = this.get(id)
      if (!current) throw new ProfileValidationError('找不到浏览器环境。')
      const dataDir = ensureEnvironmentPath(this.dataRoot, id, current.dataDir)
      const tombstone = `${dataDir}.deleted-${randomUUID()}`
      const nextRecords = this.records.filter(record => record.id !== id)
      try {
        await this.fileSystem.rename(dataDir, tombstone)
      } catch (error) {
        if (error.code === 'ENOENT') {
          await this.persist(nextRecords)
          return { pending: false }
        }
        if (!['EPERM', 'EBUSY', 'ENOTEMPTY'].includes(error.code)) throw error
        await this.persist(nextRecords)
        await this.queuePendingDelete(current)
        return { pending: true }
      }
      try {
        await this.persist(nextRecords)
        await this.fileSystem.rm(tombstone, { recursive: true, force: true })
      } catch (error) {
        try {
          await this.fileSystem.rename(tombstone, dataDir)
        } catch (restoreError) {
          console.error('[恢复已删除环境]', restoreError)
        }
        throw error
      }
      return { pending: false }
    })
  }

  async waitForWrites () {
    await this.pending
  }
}

module.exports = { EnvironmentRepository, normalizeEnvironment, ensureEnvironmentPath }
