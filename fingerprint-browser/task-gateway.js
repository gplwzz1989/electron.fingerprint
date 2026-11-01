const { randomUUID } = require('node:crypto')
const { ProfileValidationError } = require('./profile-store')

function toEnvelope (task) {
  if (!task) return null
  return {
    ok: task.status === 'success',
    taskId: task.taskId,
    type: task.type,
    status: task.status,
    createdAt: task.createdAt,
    finishedAt: task.finishedAt,
    expiresAt: task.expiresAt,
    ...(task.data !== null && task.data !== undefined ? { data: task.data } : {}),
    ...(task.error ? { error: task.error } : {})
  }
}

function ensureObjectPayload (input, methodName) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ProfileValidationError(`${methodName} 参数必须为单一对象。`)
  }
  return input
}

class TaskGateway {
  constructor ({ taskRepository, broadcast = null } = {}) {
    if (!taskRepository) throw new ProfileValidationError('任务网关必须提供任务仓储。')
    this.repository = taskRepository
    this.broadcast = typeof broadcast === 'function' ? broadcast : null
    this.handlers = new Map()
    this.runningControllers = new Map()
  }

  registerHandler (type, handler) {
    if (typeof type !== 'string' || !type.trim()) {
      throw new ProfileValidationError('任务类型必须是非空字符串。')
    }
    if (typeof handler !== 'function') {
      throw new ProfileValidationError('任务处理器必须是函数。')
    }
    this.handlers.set(type.trim(), handler)
  }

  notifyCompleted (sender, task) {
    const envelope = toEnvelope(task)
    if (!envelope) return
    try {
      if (sender && !sender.isDestroyed?.()) {
        sender.send('task:completed', envelope)
      }
    } catch (err) {
      console.warn('[发送任务完成通知失败]', err)
    }
    try {
      if (this.broadcast) {
        this.broadcast('task:completed', envelope)
      }
    } catch (err) {
      console.warn('[广播任务完成通知失败]', err)
    }
  }

  async execute (input, sender = null) {
    const payloadObject = ensureObjectPayload(input, 'executeTask')
    const type = typeof payloadObject.type === 'string' ? payloadObject.type.trim() : ''
    if (!type) throw new ProfileValidationError('必须提供有效的任务类型 (type)。')
    const handler = this.handlers.get(type)
    if (!handler) {
      throw new ProfileValidationError(`未注册的任务类型：${type}`)
    }

    const taskId = payloadObject.taskId ? String(payloadObject.taskId).trim() : randomUUID()
    const taskPayload = payloadObject.payload ?? null
    const options = payloadObject.options ?? null

    const task = await this.repository.createTask({
      taskId,
      type,
      payload: taskPayload,
      options
    })

    const controller = new AbortController()
    this.runningControllers.set(taskId, controller)

    // 异步执行任务，不阻断即时返回
    Promise.resolve()
      .then(() => handler({
        taskId,
        type,
        payload: taskPayload,
        options,
        signal: controller.signal,
        sender
      }))
      .then(async result => {
        this.runningControllers.delete(taskId)
        const updated = await this.repository.updateTask(taskId, {
          status: 'success',
          data: result,
          error: null,
          finishedAt: Date.now()
        })
        this.notifyCompleted(sender, updated)
      })
      .catch(async error => {
        this.runningControllers.delete(taskId)
        const isCancelled = controller.signal.aborted
        const status = isCancelled ? 'cancelled' : 'failed'
        const errorMessage = error instanceof ProfileValidationError
          ? error.message
          : (error?.message || '异步任务执行失败。')
        const updated = await this.repository.updateTask(taskId, {
          status,
          error: errorMessage,
          finishedAt: Date.now()
        })
        this.notifyCompleted(sender, updated)
      })

    // 立即向调用方返回任务标识
    return {
      ok: true,
      taskId: task.taskId,
      type: task.type,
      status: task.status,
      createdAt: task.createdAt,
      expiresAt: task.expiresAt
    }
  }

  async query (input) {
    const payloadObject = ensureObjectPayload(input, 'queryTask')
    const taskId = typeof payloadObject.taskId === 'string' ? payloadObject.taskId.trim() : ''
    if (!taskId) throw new ProfileValidationError('必须提供任务标识 (taskId)。')

    const task = this.repository.getTask(taskId)
    if (!task) {
      return {
        ok: false,
        error: '任务不存在或已过期。'
      }
    }
    return toEnvelope(task)
  }

  async cancel (input) {
    const payloadObject = ensureObjectPayload(input, 'cancelTask')
    const taskId = typeof payloadObject.taskId === 'string' ? payloadObject.taskId.trim() : ''
    if (!taskId) throw new ProfileValidationError('必须提供任务标识 (taskId)。')

    const controller = this.runningControllers.get(taskId)
    if (controller) {
      controller.abort()
      this.runningControllers.delete(taskId)
    }

    const task = this.repository.getTask(taskId)
    if (task && task.status === 'running') {
      const updated = await this.repository.updateTask(taskId, {
        status: 'cancelled',
        error: '任务已被手动取消。',
        finishedAt: Date.now()
      })
      this.notifyCompleted(null, updated)
    }

    return {
      ok: true,
      taskId
    }
  }
}

module.exports = {
  TaskGateway,
  toEnvelope
}
