const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const path = require('node:path')
const os = require('node:os')
const { TaskRepository } = require('../task-repository')
const { TaskGateway } = require('../task-gateway')

test('TaskGateway: 单对象入参、类型路由、Push通知与24小时持久化查询', async (t) => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'task-gateway-test-'))

  t.after(async () => {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
  })

  const repository = new TaskRepository(tempDir, { ttlMs: 24 * 60 * 60 * 1000 })
  t.after(() => repository.destroy())
  await repository.load()

  const pushEvents = []
  const mockSender = {
    isDestroyed: () => false,
    send: (channel, payload) => {
      pushEvents.push({ channel, payload })
    }
  }

  const gateway = new TaskGateway({
    taskRepository: repository
  })

  // 1. 测试入参校验：非对象入参报错
  await assert.rejects(
    async () => gateway.execute('not-an-object'),
    /executeTask 参数必须为单一对象/
  )
  await assert.rejects(
    async () => gateway.execute({}),
    /必须提供有效的任务类型/
  )
  await assert.rejects(
    async () => gateway.execute({ type: 'unknown:type' }),
    /未注册的任务类型/
  )

  // 2. 注册成功类型的任务处理器
  gateway.registerHandler('test:success', async ({ taskId, type, payload, signal }) => {
    assert.equal(type, 'test:success')
    assert.equal(payload.foo, 'bar')
    // 模拟异步工作
    await new Promise(resolve => setTimeout(resolve, 50))
    return { accountId: 'acc-123', token: 'mock-token' }
  })

  // 3. 注册会失败的任务处理器
  gateway.registerHandler('test:fail', async () => {
    await new Promise(resolve => setTimeout(resolve, 50))
    throw new Error('网络连接超时')
  })

  // 4. 注册可取消的任务处理器
  gateway.registerHandler('test:cancel', async ({ signal }) => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => resolve('done'), 1000)
      signal.addEventListener('abort', () => {
        clearTimeout(timer)
        reject(new Error('用户主动取消'))
      })
    })
  })

  // 执行成功任务
  const startResult = await gateway.execute({
    type: 'test:success',
    payload: { foo: 'bar' }
  }, mockSender)

  assert.equal(startResult.ok, true)
  assert.equal(typeof startResult.taskId, 'string')
  assert.equal(startResult.type, 'test:success')
  assert.equal(startResult.status, 'running')
  assert.equal(typeof startResult.expiresAt, 'number')

  // 等待任务在后台执行完成
  await new Promise(resolve => setTimeout(resolve, 100))

  // 校验 Push 事件触发
  const successPush = pushEvents.find(e => e.channel === 'task:completed' && e.payload.taskId === startResult.taskId)
  assert.ok(successPush, '应当收到 task:completed 的 Push 事件')
  assert.equal(successPush.payload.ok, true)
  assert.equal(successPush.payload.type, 'test:success')
  assert.equal(successPush.payload.status, 'success')
  assert.deepEqual(successPush.payload.data, { accountId: 'acc-123', token: 'mock-token' })
  assert.equal(typeof successPush.payload.finishedAt, 'number')

  // 校验通过 taskId 主动 Query
  const queryResult = await gateway.query({ taskId: startResult.taskId })
  assert.equal(queryResult.ok, true)
  assert.equal(queryResult.taskId, startResult.taskId)
  assert.equal(queryResult.type, 'test:success')
  assert.equal(queryResult.status, 'success')
  assert.deepEqual(queryResult.data, { accountId: 'acc-123', token: 'mock-token' })

  // 校验磁盘持久化：重新创建 Repository 读取磁盘
  const newRepo = new TaskRepository(tempDir)
  t.after(() => newRepo.destroy())
  await newRepo.load()
  const loadedTask = newRepo.getTask(startResult.taskId)
  assert.ok(loadedTask, '任务应已持久化到磁盘')
  assert.equal(loadedTask.type, 'test:success')
  assert.equal(loadedTask.status, 'success')
  assert.deepEqual(loadedTask.data, { accountId: 'acc-123', token: 'mock-token' })

  // 执行失败任务
  const failStart = await gateway.execute({
    type: 'test:fail',
    payload: {}
  }, mockSender)

  await new Promise(resolve => setTimeout(resolve, 100))

  const failPush = pushEvents.find(e => e.channel === 'task:completed' && e.payload.taskId === failStart.taskId)
  assert.ok(failPush, '失败任务应触发 Push 通知')
  assert.equal(failPush.payload.ok, false)
  assert.equal(failPush.payload.status, 'failed')
  assert.equal(failPush.payload.error, '网络连接超时')

  // 查询失败任务结果
  const failQuery = await gateway.query({ taskId: failStart.taskId })
  assert.equal(failQuery.ok, false)
  assert.equal(failQuery.status, 'failed')
  assert.equal(failQuery.error, '网络连接超时')

  // 执行取消任务
  const cancelStart = await gateway.execute({
    type: 'test:cancel',
    payload: {}
  }, mockSender)

  const cancelResult = await gateway.cancel({ taskId: cancelStart.taskId })
  assert.equal(cancelResult.ok, true)

  await new Promise(resolve => setTimeout(resolve, 100))

  const cancelPush = pushEvents.find(e => e.channel === 'task:completed' && e.payload.taskId === cancelStart.taskId)
  assert.ok(cancelPush, '取消任务应触发 Push 通知')
  assert.equal(cancelPush.payload.status, 'cancelled')

  // 查询取消任务结果
  const cancelQuery = await gateway.query({ taskId: cancelStart.taskId })
  assert.equal(cancelQuery.status, 'cancelled')
})

test('TaskRepository: 过期淘汰逻辑', async (t) => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'task-ttl-test-'))
  t.after(async () => {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
  })

  // 设置 TTL 为 50ms
  const repo = new TaskRepository(tempDir, { ttlMs: 50 })
  t.after(() => repo.destroy())
  await repo.load()

  const task = await repo.createTask({
    taskId: 'task-will-expire',
    type: 'test:ttl',
    payload: {}
  })

  assert.equal(repo.getTask('task-will-expire')?.taskId, 'task-will-expire')

  // 等待 70ms 使得任务过期
  await new Promise(resolve => setTimeout(resolve, 70))

  assert.equal(repo.getTask('task-will-expire'), null, '过期任务 getTask 应当返回 null')

  // 清理并检查磁盘落盘
  await repo.cleanupExpired()
  const records = repo.listTasks()
  assert.equal(records.length, 0, '过期任务应从列表中彻底移除')
})
