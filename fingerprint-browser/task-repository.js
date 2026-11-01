const fs = require('node:fs/promises')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const { ProfileValidationError } = require('./profile-store')

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000

function clone (value) {
  return structuredClone(value)
}

function ensureTaskId (value) {
  const id = value === undefined || value === null ? '' : String(value).trim()
  if (!id) throw new ProfileValidationError('任务标识不能为空。')
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(id)) throw new ProfileValidationError('任务标识必须为 1-64 位字母、数字、下划线或连字符。')
  return id
}

function ensureTaskType (value) {
  const type = value === undefined || value === null ? '' : String(value).trim()
  if (!type) throw new ProfileValidationError('任务类型不能为空。')
  if (!/^[a-zA-Z0-9_:-]{1,64}$/.test(type)) throw new ProfileValidationError('任务类型格式无效。')
  return type
}

function normalizeTaskRecord (record) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) throw new ProfileValidationError('任务记录必须是对象。')
  const taskId = ensureTaskId(record.taskId || record.id)
  const type = ensureTaskType(record.type)
  const status = ['pending', 'running', 'success', 'failed', 'cancelled'].includes(record.status) ? record.status : 'running'
  const createdAt = Number.isInteger(record.createdAt) && record.createdAt > 0 ? record.createdAt : Date.now()
  const finishedAt = Number.isInteger(record.finishedAt) && record.finishedAt > 0 ? record.finishedAt : null
  const expiresAt = Number.isInteger(record.expiresAt) && record.expiresAt > 0 ? record.expiresAt : createdAt + DEFAULT_TTL_MS
  return {
    taskId,
    type,
    status,
    createdAt,
    finishedAt,
    expiresAt,
    payload: record.payload ?? null,
    options: record.options ?? null,
    data: record.data ?? null,
    error: record.error ?? null
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
      if (error.code !== 'ENOENT') console.error('[清理任务临时文件]', error)
    }
  }
}

class TaskRepository {
  constructor (dataRoot, { fileSystem = fs, ttlMs = DEFAULT_TTL_MS } = {}) {
    this.dataRoot = path.resolve(dataRoot)
    this.filePath = path.join(this.dataRoot, 'tasks.json')
    this.fileSystem = fileSystem
    this.ttlMs = ttlMs > 0 ? ttlMs : DEFAULT_TTL_MS
    this.records = new Map()
    this.pending = Promise.resolve()
    this.loaded = false
    this.cleanupTimer = setInterval(() => void this.cleanupExpired(), 60 * 60 * 1000)
    this.cleanupTimer.unref()
  }

  destroy () {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }

  async load () {
    await this.fileSystem.mkdir(this.dataRoot, { recursive: true })
    try {
      const text = await this.fileSystem.readFile(this.filePath, 'utf8')
      const parsed = JSON.parse(text)
      if (Array.isArray(parsed)) {
        const now = Date.now()
        this.records.clear()
        for (const item of parsed) {
          try {
            const normalized = normalizeTaskRecord(item)
            if (normalized.expiresAt > now) {
              this.records.set(normalized.taskId, normalized)
            }
          } catch {}
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('[加载任务仓储失败]', error)
      }
      this.records.clear()
    }
    this.loaded = true
    return this.listTasks()
  }

  enqueue (action) {
    const execute = async () => {
      if (!this.loaded) await this.load()
      return await action()
    }
    const current = this.pending.then(execute, execute)
    this.pending = current.then(() => {}, () => {})
    return current
  }

  async flush () {
    const list = Array.from(this.records.values())
    await writeAtomicText(this.fileSystem, this.filePath, JSON.stringify(list, null, 2))
  }

  createTask ({ taskId = randomUUID(), type, payload, options }) {
    return this.enqueue(async () => {
      const validId = ensureTaskId(taskId)
      const validType = ensureTaskType(type)
      const now = Date.now()
      const existing = this.records.get(validId)
      if (existing && existing.expiresAt > now) {
        throw new ProfileValidationError(`任务标识 ${validId} 已存在。`)
      }
      const record = {
        taskId: validId,
        type: validType,
        status: 'running',
        createdAt: now,
        finishedAt: null,
        expiresAt: now + this.ttlMs,
        payload: payload ? clone(payload) : null,
        options: options ? clone(options) : null,
        data: null,
        error: null
      }
      this.records.set(validId, record)
      await this.flush()
      return clone(record)
    })
  }

  updateTask (taskId, patch = {}) {
    return this.enqueue(async () => {
      const validId = ensureTaskId(taskId)
      const current = this.records.get(validId)
      if (!current) throw new ProfileValidationError(`未找到标识为 ${validId} 的任务。`)
      if (patch.status && ['pending', 'running', 'success', 'failed', 'cancelled'].includes(patch.status)) {
        current.status = patch.status
      }
      if (patch.data !== undefined) current.data = patch.data ? clone(patch.data) : patch.data
      if (patch.error !== undefined) current.error = patch.error
      if (patch.finishedAt !== undefined) {
        current.finishedAt = patch.finishedAt
      } else if (['success', 'failed', 'cancelled'].includes(current.status) && !current.finishedAt) {
        current.finishedAt = Date.now()
      }
      if (patch.expiresAt !== undefined && Number.isInteger(patch.expiresAt)) {
        current.expiresAt = patch.expiresAt
      }
      await this.flush()
      return clone(current)
    })
  }

  getTask (taskId) {
    if (!taskId) return null
    const validId = String(taskId).trim()
    const current = this.records.get(validId)
    if (!current) return null
    if (current.expiresAt <= Date.now()) {
      this.records.delete(validId)
      return null
    }
    return clone(current)
  }

  listTasks ({ type, status } = {}) {
    const now = Date.now()
    const results = []
    for (const [id, record] of this.records.entries()) {
      if (record.expiresAt <= now) {
        this.records.delete(id)
        continue
      }
      if (type && record.type !== type) continue
      if (status && record.status !== status) continue
      results.push(clone(record))
    }
    return results
  }

  cleanupExpired (now = Date.now()) {
    return this.enqueue(async () => {
      let changed = false
      for (const [id, record] of this.records.entries()) {
        if (record.expiresAt <= now) {
          this.records.delete(id)
          changed = true
        }
      }
      if (changed) {
        await this.flush()
      }
      return changed
    })
  }
}

module.exports = {
  TaskRepository,
  DEFAULT_TTL_MS,
  ensureTaskId,
  ensureTaskType
}
