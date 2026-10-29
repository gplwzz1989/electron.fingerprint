const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const { EventEmitter } = require('node:events')
const { SessionObserver } = require('../session-observer')

function fixture (frames = []) {
  // 仅在隔离单元测试中构造 Electron 事件源，真实运行时另有 HTTPS 验收。
  const owner = Object.assign(new EventEmitter(), { isDestroyed: () => false })
  const debuggerApi = Object.assign(new EventEmitter(), {
    attached: false,
    isAttached () { return this.attached },
    attach () { this.attached = true },
    detach () { this.attached = false },
    async sendCommand () { return {} }
  })
  const contents = Object.assign(new EventEmitter(), { isDestroyed: () => false, debugger: debuggerApi, mainFrame: { framesInSubtree: frames }, session: { cookies: { get: async () => [] } } })
  const observer = new SessionObserver({ getTab: () => ({ kind: 'managed', view: { webContents: contents } }) })
  const { publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' } })
  return { observer, owner, contents, input: { tabId: 'test-only', operationId: 'test-operation', origins: ['https://example.com'], publicKey, storageKeys: ['a', 'b'] } }
}

test('同来源多个 frame 合并存储字段，忽略其他来源', async () => {
  const state = fixture([
    { url: 'https://example.com/', executeJavaScript: async () => ({ a: 'secret-a' }) },
    { url: 'https://example.com/frame', executeJavaScript: async () => ({ b: 'secret-b' }) },
    { url: 'https://other.example/', executeJavaScript: async () => { throw new Error('不应读取其他来源') } }
  ])
  const { id } = await state.observer.open(state.owner, state.input)
  const result = await state.observer.read(state.owner, { id })
  assert.deepEqual(result.storageKeys['https://example.com'], ['a', 'b'])
  assert(!JSON.stringify(result).includes('secret-'))
  assert.throws(() => state.observer.get({}, id), /已结束/)
  await state.observer.close(state.owner, id)
})

test('取消发生在异步存储采集期间时，不返回已取消任务的数据', async () => {
  let finish
  const state = fixture([{ url: 'https://example.com/', executeJavaScript: () => new Promise(resolve => { finish = resolve }) }])
  const { id } = await state.observer.open(state.owner, state.input)
  const reading = state.observer.read(state.owner, { id })
  await state.observer.close(state.owner, id)
  finish({ a: 'cancelled-secret' })
  await assert.rejects(reading, /已结束/)
  assert.equal(state.observer.jobs.size, 0)
})

test('首页文档导航清理监听，保留其他调试使用者的连接', async () => {
  const state = fixture(); const { id } = await state.observer.open(state.owner, state.input)
  const otherListener = () => {}; state.contents.debugger.on('message', otherListener)
  state.owner.emit('did-start-navigation', {}, 'https://example.com/#accounts', true, true)
  assert.equal(state.observer.jobs.size, 1)
  state.owner.emit('did-start-navigation', {}, 'https://example.com/new', false, true)
  assert.equal(state.observer.jobs.size, 0)
  assert.equal(state.contents.debugger.isAttached(), true)
  assert.equal(state.contents.debugger.listenerCount('message'), 1)
  assert.throws(() => state.observer.get(state.owner, id), /已结束/)
})

test('Other 分类的匹配授权接口也被解析，诊断仅返回计数和分类', async () => {
  const state = fixture(); const { id } = await state.observer.open(state.owner, state.input)
  state.contents.debugger.sendCommand = async () => ({ body: JSON.stringify({ finderUser: { id: 'isolated-test' } }), base64Encoded: false })
  state.contents.debugger.emit('message', {}, 'Network.responseReceived', { requestId: 'test-other', type: 'Other', response: { url: 'https://example.com/auth_data', status: 200 } })
  state.contents.debugger.emit('message', {}, 'Network.loadingFinished', { requestId: 'test-other', encodedDataLength: 60 })
  await new Promise(resolve => setImmediate(resolve))
  const result = await state.observer.read(state.owner, { id })
  assert.equal(result.responses.length, 1)
  assert.equal(result.diagnostics.lastType, 'Other')
  assert.equal(result.diagnostics.parsedResponses, 1)
  assert(!JSON.stringify(result.diagnostics).includes('isolated-test'))
  await state.observer.close(state.owner, id)
})

test('同步日志抛出 EPIPE 不影响匹配、解析和加密采集', async () => {
  const state = fixture()
  state.observer.logger = { info () { throw Object.assign(new Error('测试关闭管道'), { code: 'EPIPE' }) }, warn () { throw Object.assign(new Error('测试关闭管道'), { code: 'EPIPE' }) } }
  const { id } = await state.observer.open(state.owner, state.input)
  const job = state.observer.get(state.owner, id)
  state.contents.debugger.sendCommand = async () => ({ body: JSON.stringify({ finderUser: { id: 'isolated-test' } }), base64Encoded: false })
  await job.listener({}, 'Network.responseReceived', { requestId: 'valid', type: 'Other', response: { url: 'https://example.com/auth_data', status: 200 } })
  await job.listener({}, 'Network.loadingFinished', { requestId: 'valid', encodedDataLength: 60 })
  const result = await state.observer.read(state.owner, { id })
  assert.equal(result.responses.length, 1)
  assert.equal(result.diagnostics.parsedResponses, 1)
  assert.equal(result.diagnostics.failedResponses, 0)
  const envelope = await state.observer.capture(state.owner, { id })
  assert(envelope.ciphertext); assert(envelope.tag)
  await job.listener({}, 'Network.responseReceived', { requestId: 'invalid', type: 'Other', response: { url: 'https://example.com/auth_data', status: 200 } })
  state.contents.debugger.sendCommand = async () => ({ body: '非 JSON 测试响应', base64Encoded: false })
  await job.listener({}, 'Network.loadingFinished', { requestId: 'invalid', encodedDataLength: 20 })
  assert.equal(job.diagnostics.failedResponses, 1)
  await state.observer.close(state.owner, id)
})

test('日志返回拒绝的 Promise 不产生未处理拒绝，默认日志不调用控制台', async () => {
  const state = fixture(); const { id } = await state.observer.open(state.owner, state.input)
  const job = state.observer.get(state.owner, id)
  const originalInfo = console.info; const originalWarn = console.warn
  try {
    console.info = console.warn = () => { throw new Error('不应写入继承管道') }
    state.observer.log('info', '仅桥接诊断', {})
    state.observer.logger = { info: async () => { throw Object.assign(new Error('异步日志测试失败'), { code: 'EPIPE' }) } }
    state.contents.debugger.sendCommand = async () => ({ body: '{}', base64Encoded: false })
    await job.listener({}, 'Network.responseReceived', { requestId: 'async-log', type: 'Fetch', response: { url: 'https://example.com/auth_data', status: 200 } })
    await job.listener({}, 'Network.loadingFinished', { requestId: 'async-log', encodedDataLength: 2 })
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(job.diagnostics.parsedResponses, 1)
    assert.equal(job.diagnostics.failedResponses, 0)
  } finally { console.info = originalInfo; console.warn = originalWarn; await state.observer.close(state.owner, id) }
})
