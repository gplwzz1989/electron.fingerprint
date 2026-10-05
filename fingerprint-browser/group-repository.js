const fs = require('node:fs/promises')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const { ProfileValidationError } = require('./profile-store')

const DEFAULT_GROUP_ID = 'group-default'
const DEFAULT_GROUP_NAME = '未分组'

function clone (value) {
  return structuredClone(value)
}

function ensureGroupName (value) {
  const name = value === undefined || value === null ? '' : String(value).trim()
  if (!name) throw new ProfileValidationError('分组名称不能为空。')
  if (name.length > 80) throw new ProfileValidationError('分组名称不能超过 80 个字符。')
  if (name === DEFAULT_GROUP_NAME) throw new ProfileValidationError('未分组是系统默认分组，不能重复创建或修改。')
  return name
}

function normalizeGroup (record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) throw new ProfileValidationError('分组记录必须是对象。')
  if (typeof record.id !== 'string' || !record.id || record.id.includes('..') || /[\\/]/.test(record.id)) throw new ProfileValidationError('分组 ID 无效。')
  const name = record.id === DEFAULT_GROUP_ID ? DEFAULT_GROUP_NAME : ensureGroupName(record.name)
  const createdAt = Number.isInteger(record.createdAt) && record.createdAt > 0 ? record.createdAt : Date.now()
  const updatedAt = Number.isInteger(record.updatedAt) && record.updatedAt > 0 ? record.updatedAt : createdAt
  return { id: record.id, name, createdAt, updatedAt }
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
      if (error.code !== 'ENOENT') console.error('[清理分组临时文件]', error)
    }
  }
}

class GroupRepository {
  constructor (dataRoot, fileSystem = fs) {
    this.dataRoot = path.resolve(dataRoot)
    this.filePath = path.join(this.dataRoot, 'groups.json')
    this.fileSystem = fileSystem
    this.records = []
    this.pending = Promise.resolve()
    this.loaded = false
  }

  list () {
    return clone(this.records)
  }

  get (id) {
    return this.records.find(group => group.id === id)
  }

  getByName (name) {
    return this.records.find(group => group.name === name)
  }

  async load (environmentRecords = []) {
    let records
    let needsPersist = false
    try {
      records = JSON.parse(await this.fileSystem.readFile(this.filePath, 'utf8'))
    } catch (error) {
      if (error.code !== 'ENOENT' && !(error instanceof SyntaxError)) throw new ProfileValidationError('分组记录无法读取，请检查应用数据目录。')
      try {
        records = JSON.parse(await this.fileSystem.readFile(`${this.filePath}.bak`, 'utf8'))
      } catch (backupError) {
        if (error.code !== 'ENOENT' || backupError.code !== 'ENOENT') throw new ProfileValidationError('分组记录和备份均无法读取，请保留原文件后检查应用数据目录。')
        records = []
      }
      needsPersist = true
    }
    if (!Array.isArray(records)) throw new ProfileValidationError('分组记录必须是数组。')
    const normalized = []
    const ids = new Set()
    const names = new Set()
    for (const record of records) {
      const group = normalizeGroup(record)
      if (ids.has(group.id) || names.has(group.name)) throw new ProfileValidationError('分组记录存在重复 ID 或名称。')
      ids.add(group.id)
      names.add(group.name)
      normalized.push(group)
    }
    if (!ids.has(DEFAULT_GROUP_ID)) {
      const now = Date.now()
      normalized.unshift({ id: DEFAULT_GROUP_ID, name: DEFAULT_GROUP_NAME, createdAt: now, updatedAt: now })
      ids.add(DEFAULT_GROUP_ID)
      names.add(DEFAULT_GROUP_NAME)
      needsPersist = true
    }
    for (const environment of environmentRecords) {
      const name = typeof environment?.group === 'string' && environment.group.trim() ? environment.group.trim() : DEFAULT_GROUP_NAME
      if (names.has(name)) continue
      const now = Date.now()
      normalized.push({ id: `group-${randomUUID()}`, name, createdAt: now, updatedAt: now })
      names.add(name)
      needsPersist = true
    }
    this.records = normalized
    this.loaded = true
    if (needsPersist) await this.persist(this.records)
    return { migrated: needsPersist }
  }

  async persist (nextRecords) {
    await this.fileSystem.mkdir(this.dataRoot, { recursive: true })
    if (this.loaded) await writeAtomicText(this.fileSystem, `${this.filePath}.bak`, `${JSON.stringify(this.records, null, 2)}\n`)
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
        // 当前调用负责显示错误，后续分组操作仍可继续排队执行。
      }
    })()
    return task
  }

  async create (value) {
    return await this.enqueue(async () => {
      const name = ensureGroupName(value)
      if (this.getByName(name)) throw new ProfileValidationError('分组名称已经存在。')
      const now = Date.now()
      const group = { id: `group-${randomUUID()}`, name, createdAt: now, updatedAt: now }
      await this.persist([...this.records, group])
      return clone(group)
    })
  }

  async ensure (value) {
    const rawName = value === undefined || value === null ? DEFAULT_GROUP_NAME : String(value).trim()
    if (!rawName || rawName === DEFAULT_GROUP_NAME) return clone(this.get(DEFAULT_GROUP_ID))
    return await this.enqueue(async () => {
      const existing = this.getByName(rawName)
      if (existing) return clone(existing)
      const name = ensureGroupName(rawName)
      const now = Date.now()
      const group = { id: `group-${randomUUID()}`, name, createdAt: now, updatedAt: now }
      await this.persist([...this.records, group])
      return clone(group)
    })
  }

  async rename (id, value) {
    return await this.enqueue(async () => {
      const current = this.get(id)
      if (!current) throw new ProfileValidationError('找不到要修改的分组。')
      if (id === DEFAULT_GROUP_ID) throw new ProfileValidationError('未分组是系统默认分组，不能修改。')
      const name = ensureGroupName(value)
      const duplicate = this.getByName(name)
      if (duplicate && duplicate.id !== id) throw new ProfileValidationError('分组名称已经存在。')
      const now = Date.now()
      const next = { ...current, name, updatedAt: now }
      await this.persist(this.records.map(record => record.id === id ? next : record))
      return { previousName: current.name, group: clone(next) }
    })
  }

  async remove (id) {
    return await this.enqueue(async () => {
      const current = this.get(id)
      if (!current) throw new ProfileValidationError('找不到要删除的分组。')
      if (id === DEFAULT_GROUP_ID) throw new ProfileValidationError('未分组是系统默认分组，不能删除。')
      await this.persist(this.records.filter(record => record.id !== id))
      return clone(current)
    })
  }

  async waitForWrites () {
    await this.pending
  }
}

module.exports = { DEFAULT_GROUP_ID, DEFAULT_GROUP_NAME, GroupRepository, ensureGroupName }
