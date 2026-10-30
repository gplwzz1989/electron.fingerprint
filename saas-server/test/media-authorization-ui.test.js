const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

function fixture ({ manifestGate, failConfirm = false, failComplete = false, waitingRunner = false, closeFails = false, modal = false } = {}) {
  // 仅测试控制页调度，不以此代替真实平台或 Electron 验收。
  const listeners = new Map(); const calls = []; const events = []; const status = { textContent: '', classList: { toggle () {} }, setAttribute () {} }
  const baseStatus = { textContent: '', classList: { toggle () {} }, setAttribute () {} }
  const pageSurface = { querySelector: selector => selector === '#media-auth-status' ? modal ? baseStatus : status : selector === '#field-account-authorize-0-1' ? { value: modal ? 'wrong-background-environment' : 'environment-test' } : null, insertAdjacentHTML () {} }
  const modalSurface = { querySelector: selector => selector === '#media-auth-status' ? status : selector === '#field-account-authorize-0-1' ? { value: 'environment-test' } : null, insertAdjacentHTML () {} }
  let context = { workspaceId: 'workspace-test', userId: 'user-test', canWrite: true }; let confirmations = 0; let confirms = 0; let completions = 0; let savedAccounts = 0
  const document = {
    addEventListener (name, listener) { listeners.set(name, listener) },
    dispatchEvent (event) { events.push(event) }, querySelector: () => null,
    getElementById: id => id === 'page' ? pageSurface : id === 'field-account-authorize-0-1' ? { value: 'environment-test' } : id === 'media-auth-status' ? status : null
  }
  let tabOpen = true; let launches = 0; let tabEnvironment = 'environment-test'
  const desktop = { observeSession: async () => ({ ok: true, id: 'test-observer' }), captureSession: async () => { calls.push(['native:capture']); return { ok: true, ciphertext: 'recaptured-test-envelope' } }, closeSession: async () => ({ ok: true }), closeTab: async id => { calls.push(['native:close-tab', id]); if (closeFails) return { ok: false }; tabOpen = false; return { ok: true } }, navigate: async () => ({ ok: true }), launch: async payload => { launches++; tabOpen = true; tabEnvironment = payload.environmentId; return { ok: true } }, tabs: async () => ({ ok: true, tabs: tabOpen ? [{ id: 'tab-test', profileId: tabEnvironment }] : [] }), dashboard: async () => ({ ok: true }) }
  let releasePoll
  desktop.platformStatus = async () => { calls.push(['native:platform-status']); if (manifestGate) await manifestGate; return { ok: true, version: 'test' } }
  desktop.startPlatformTask = async () => ({ ok: true, id: 'test-runtime-task' })
  desktop.pollPlatformTask = async () => waitingRunner ? new Promise(resolve => { releasePoll = resolve }) : ({ ok: true, done: true, result: { ciphertext: 'test-only-envelope' } })
  desktop.cancelPlatformTask = async () => { releasePoll?.({ ok: true, done: true, error: '已取消授权。' }); return { ok: true } }
  const window = { workspaceBridge: desktop, getMediaWorkspace: () => ({ ...context }) }
  let modalOpen = modal
  if (modal) window.WorkspaceUI = {
    getSurface: () => modalOpen ? modalSurface : pageSurface,
    getRoute: () => modalOpen ? 'account-authorize' : 'accounts',
    getBaseRoute: () => 'accounts',
    openPage (route, options) { calls.push(['ui:open-modal', route, options]); modalOpen = true; listeners.get('workspace:render')?.({ detail: { route } }) },
    closePage () { calls.push(['ui:close-modal']); modalOpen = false; listeners.get('workspace:modal-closed')?.({ detail: { pageId: 'account-authorize' } }) }
  }
  const fetch = async (url, input = {}) => {
    calls.push([url, input.method || 'GET', input.body ? JSON.parse(input.body) : undefined])
    let data = { ok: true }; let code = 200
    if (url === '/api/auth/me') data.csrf = 'test-csrf'
    else if (url === '/api/platform-runtime') { if (manifestGate) await manifestGate; data.version = 'test' }
    else if (url.endsWith('/authorizations')) data.task = { id: 'test-task', environmentId: JSON.parse(input.body).environmentId, platform: { origins: ['https://example.com'], responsePath: '/test-identity', url: 'https://example.com', storageKeys: [] } }
    else if (url.endsWith('/complete')) { if (failComplete && ++completions === 1) { code = 422; data = { ok: false, message: '隔离测试会话未准备完整' } } else data.task = confirms ? { status: 'saved' } : { status: 'review', identity: { name: '隔离测试身份', platformUserId: 'test-id' } } }
    else if (url.endsWith('/confirm')) { confirms++; savedAccounts = 1; if (failConfirm && confirms === 1) { code = 503; data = { ok: false, message: '隔离测试响应丢失' } } else data.task = { status: 'saved', accountId: 'test-account' } }
    return { ok: code === 200, status: code, json: async () => data }
  }
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../public/media-authorization.js'), 'utf8'), { window, document, fetch, AbortController, AbortSignal, setTimeout, confirm: () => { confirmations++; return true }, CustomEvent: class { constructor (type, init) { this.type = type; this.detail = init?.detail } }, location: {} })
  return {
    calls, events, status, baseStatus, confirmations: () => confirmations, savedAccounts: () => savedAccounts,
    closeTab () { tabOpen = false }, launches: () => launches,
    setContext (value) { context = value },
    emit: (name, detail) => listeners.get(name)?.({ detail }),
    click (operation) { const button = { dataset: { mediaOperation: operation }, disabled: false }; listeners.get('click')({ target: { closest: selector => selector === '[data-media-operation]' ? button : null }, preventDefault () {}, stopImmediatePropagation () {} }) }
  }
}
async function drain () { for (let i = 0; i < 15; i++) await new Promise(resolve => setImmediate(resolve)) }

test('客户端能力加载期间重复开始互斥，取消后不会再创建授权任务', async () => {
  let release; const state = fixture({ manifestGate: new Promise(resolve => { release = resolve }) })
  state.click('start'); state.click('start'); await drain()
  assert.equal(state.calls.filter(([url]) => url === 'native:platform-status').length, 1)
  assert.match(state.status.textContent, /已有授权/)
  state.click('cancel'); release(); await drain()
  assert.equal(state.calls.filter(([url]) => url.endsWith('/authorizations')).length, 0)
})

test('保存失败可以幂等重试，已保存响应不会再次弹出身份确认', async () => {
  const state = fixture({ failConfirm: true }); state.click('start'); await drain()
  assert.match(state.status.textContent, /响应丢失/)
  assert.equal(state.calls.filter(([url]) => url === 'native:close-tab').length, 0)
  state.click('retry'); state.click('retry'); await drain()
  assert.equal(state.calls.filter(([url]) => url.endsWith('/authorizations')).length, 1)
  assert.equal(state.calls.filter(([url]) => url.endsWith('/complete')).length, 2)
  assert.equal(state.confirmations(), 0)
  assert.equal(state.savedAccounts(), 1)
  assert.equal(state.calls.filter(([url]) => url.endsWith('/confirm')).length, 1)
  assert.equal(state.calls.filter(([url]) => url === 'native:close-tab').length, 1)
  assert.match(state.status.textContent, /授权已保存/)
})

test('取消待重试保存或切换团队后，重试不会启动新任务', async () => {
  const state = fixture({ failConfirm: true }); state.click('start'); await drain()
  state.setContext({ workspaceId: 'another-workspace', userId: 'user-test' })
  state.emit('workspace:render', { route: 'accounts' }); await drain()
  state.click('retry'); await drain()
  assert.match(state.status.textContent, /没有待保存/)
  assert.equal(state.calls.filter(([url]) => url.endsWith('/authorizations')).length, 1)
  assert.equal(state.calls.filter(([url]) => url.endsWith('/cancel')).length, 1)
})

test('等待平台响应时重试可从原登录环境补采集，关闭标签后可恢复持久环境', async () => {
  const state = fixture({ waitingRunner: true }); state.click('start'); await drain()
  state.closeTab(); state.click('retry'); await drain()
  assert.equal(state.calls.filter(([url]) => url.endsWith('/authorizations')).length, 1)
  assert.equal(state.calls.filter(([url]) => url === 'native:capture').length, 1)
  assert.equal(state.launches(), 2)
  assert.match(state.status.textContent, /授权已保存/)
})

test('身份核验明确失败后重新采集当前会话，不重复提交旧失败快照', async () => {
  const state = fixture({ failComplete: true }); state.click('start'); await drain()
  assert.match(state.status.textContent, /未准备完整/)
  state.click('retry'); await drain()
  assert.equal(state.calls.filter(([url]) => url === 'native:capture').length, 1)
  assert.equal(state.calls.filter(([url]) => url.endsWith('/authorizations')).length, 1)
  assert.equal(state.calls.filter(([url]) => url.endsWith('/complete')).length, 2)
  assert.match(state.status.textContent, /授权已保存/)
})

test('只有服务端确认保存后才关闭授权标签并发出账号列表成功提示', async () => {
  const state = fixture(); state.click('start'); await drain()
  const saved = state.events.find(event => event.type === 'media:saved')
  assert.match(saved.detail.message, /账号授权成功，已添加到账号列表/)
  assert.equal(saved.detail.warning, '')
  assert.equal(state.confirmations(), 0)
  assert(state.calls.findIndex(([url]) => url.endsWith('/confirm')) < state.calls.findIndex(([url]) => url === 'native:close-tab'))
  assert.equal(state.calls.find(([url]) => url === 'native:close-tab')[1], 'tab-test')
})

test('关闭授权标签失败不把已保存账号改为失败，返回明确中文收尾说明', async () => {
  const state = fixture({ closeFails: true }); state.click('start'); await drain()
  assert.equal(state.savedAccounts(), 1)
  const saved = state.events.find(event => event.type === 'media:saved')
  assert.match(saved.detail.message, /授权成功/)
  assert.match(saved.detail.warning, /账号已保存.*未能自动关闭.*手动关闭/)
  assert.match(state.status.textContent, /授权已保存/)
})

test('授权模态只读取当前面板的环境和状态，成功关闭模态且不会取消已保存任务', async () => {
  const state = fixture({ modal: true }); state.click('start'); await drain()
  const begin = state.calls.find(([url]) => url.endsWith('/authorizations'))
  assert.equal(begin[2].environmentId, 'environment-test')
  assert.equal(state.baseStatus.textContent, '')
  assert.equal(state.calls.filter(([url]) => url === 'ui:close-modal').length, 1)
  assert.equal(state.calls.filter(([url]) => url.endsWith('/cancel')).length, 0)
  assert.equal(state.savedAccounts(), 1)
  assert(state.events.some(event => event.type === 'media:saved'))
})

test('关闭尚在登录的授权模态取消任务但不关闭平台标签或清除登录环境', async () => {
  const state = fixture({ modal: true, waitingRunner: true }); state.click('start'); await drain()
  state.emit('workspace:modal-closed', { pageId: 'account-authorize' }); await drain()
  assert(state.calls.some(([url]) => url.endsWith('/cancel')))
  assert.equal(state.calls.filter(([url]) => url === 'native:close-tab').length, 0)
  assert.equal(state.savedAccounts(), 0)
  assert.equal(state.baseStatus.textContent, '')
  state.emit('workspace:render', { route: 'account-authorize' }); await drain()
  state.click('start'); await drain()
  assert.equal(state.calls.filter(([url]) => url.endsWith('/authorizations')).length, 2)
  state.click('cancel'); await drain()
})

test('账号列表重新授权先打开对应平台模态，再按原账号环境开始', async () => {
  const state = fixture({ modal: true })
  state.emit('media:reauthorize', { id: 'test-existing-account', platform: 'shipinhao', environmentId: 'existing-account-environment' })
  await drain()
  const opened = state.calls.findIndex(([url]) => url === 'ui:open-modal')
  const beginning = state.calls.findIndex(([url]) => url.endsWith('/authorizations'))
  assert(opened >= 0 && beginning > opened)
  assert.equal(state.calls[opened][1], 'account-authorize')
  assert.equal(state.calls[opened][2].platform, 'shipinhao')
  assert.equal(state.calls[beginning][2].environmentId, 'existing-account-environment')
  assert.equal(state.calls[beginning][2].accountId, 'test-existing-account')
  assert.equal(state.savedAccounts(), 1)
})
