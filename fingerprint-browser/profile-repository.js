const fs = require('node:fs/promises')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const { createProfileRecord, ProfileValidationError } = require('./profile-store')

function validateRecords (records) {
  if (!Array.isArray(records)) throw new ProfileValidationError('配置文件必须是数组。')
  const ids = new Set()
  return records.map(record => {
    const profile = createProfileRecord(record)
    if (ids.has(profile.id)) throw new ProfileValidationError('配置文件存在重复 ID。')
    ids.add(profile.id)
    return profile
  })
}

async function writeAtomic (fileSystem, target, records) {
  const temporary = `${target}.${randomUUID()}.tmp`
  try {
    const handle = await fileSystem.open(temporary, 'wx', 0o600)
    try {
      await handle.writeFile(`${JSON.stringify(records, null, 2)}\n`, 'utf8')
      await handle.sync()
    } finally {
      await handle.close()
    }
    // 只重命名替换，不先删除原文件；失败时保留上一次成功的配置。
    await fileSystem.rename(temporary, target)
  } finally {
    try {
      await fileSystem.unlink(temporary)
    } catch (error) {
      if (error.code !== 'ENOENT') console.error('[清理配置临时文件]', error)
    }
  }
}

class ProfileRepository {
  constructor (filePath, fileSystem = fs) {
    this.filePath = filePath
    this.fileSystem = fileSystem
    this.records = []
    this.loaded = false
    this.recoveredFromBackup = false
    this.pending = Promise.resolve()
  }

  list () {
    return structuredClone(this.records)
  }

  async load (initialRecords) {
    const read = async file => validateRecords(JSON.parse(await this.fileSystem.readFile(file, 'utf8')))
    try {
      this.records = await read(this.filePath)
      this.loaded = true
      this.recoveredFromBackup = false
      return { recovered: false }
    } catch (error) {
      if (error.code !== 'ENOENT' && !(error instanceof SyntaxError) && !(error instanceof ProfileValidationError)) throw error
      try {
        this.records = await read(`${this.filePath}.bak`)
        this.loaded = true
        this.recoveredFromBackup = true
        return { recovered: true }
      } catch (backupError) {
        if (error.code === 'ENOENT' && backupError.code === 'ENOENT') {
          await this.persist(validateRecords(initialRecords))
          return { recovered: false }
        }
        throw new ProfileValidationError('主配置或备份已损坏，且没有可用的恢复副本。请保留原文件并检查数据目录。')
      }
    }
  }

  async persist (nextRecords) {
    await this.fileSystem.mkdir(path.dirname(this.filePath), { recursive: true })
    if (this.loaded) await writeAtomic(this.fileSystem, `${this.filePath}.bak`, this.records)
    if (this.recoveredFromBackup) {
      try {
        await this.fileSystem.copyFile(this.filePath, `${this.filePath}.damaged-${randomUUID()}`)
      } catch (error) {
        if (error.code !== 'ENOENT') throw error
      }
    }
    await writeAtomic(this.fileSystem, this.filePath, nextRecords)
    this.records = nextRecords
    this.loaded = true
    this.recoveredFromBackup = false
  }

  enqueue (operation) {
    const previous = this.pending
    const task = (async () => {
      await previous
      return await operation()
    })()
    // 一个存储文件使用一个写入队列；将来接入数据库时由事务替代此队列。
    this.pending = (async () => {
      try {
        await task
      } catch {
        // 失败交给本次调用处理，后续修改仍应能够执行。
      }
    })()
    return task
  }

  async save (payload) {
    const input = structuredClone(payload)
    return await this.enqueue(async () => {
      if (!input || typeof input !== 'object' || !input.fingerprint) throw new ProfileValidationError('保存参数不完整。')
      const current = this.records.find(record => record.id === input.id)
      const expectedRevision = Object.hasOwn(input, 'expectedRevision') ? input.expectedRevision : (current ? input.revision : null)
      if (current && expectedRevision === null) throw new ProfileValidationError('配置 ID 已存在，请重新创建配置。')
      if (expectedRevision !== null && (!current || expectedRevision !== current.revision)) {
        throw new ProfileValidationError('配置已被其他操作修改，请重新加载管理页后再保存。')
      }
      const profile = createProfileRecord({ ...input, revision: current ? current.revision + 1 : 1 })
      if (!current && this.records.some(record => record.id === profile.id)) throw new ProfileValidationError('配置 ID 已存在。')
      const nextRecords = current
        ? this.records.map(record => record.id === current.id ? profile : record)
        : [...this.records, profile]
      await this.persist(nextRecords)
      return structuredClone(profile)
    })
  }

  async delete (id) {
    return await this.enqueue(async () => {
      if (typeof id !== 'string' || !id) throw new ProfileValidationError('配置 ID 无效。')
      const nextRecords = this.records.filter(record => record.id !== id)
      if (nextRecords.length === this.records.length) throw new ProfileValidationError('找不到要删除的浏览器配置。')
      await this.persist(nextRecords)
    })
  }

  async waitForWrites () {
    await this.pending
  }
}

module.exports = { ProfileRepository }
