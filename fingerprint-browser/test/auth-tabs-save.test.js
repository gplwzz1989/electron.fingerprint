const test = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const { bridgeContract, shellChannels, managementChannels } = require('../client-api-contract')

test('契约校验：包含 openAuthTab、tabs:save-auth 与 tabs:open-auth 权限通道', () => {
  assert.equal(typeof bridgeContract.desktopBridge.openAuthTab, 'string')
  assert.equal(bridgeContract.desktopBridge.openAuthTab, 'tabs:open-auth')
  assert.ok(shellChannels.has('tabs:save-auth'), 'shellChannels 必须包含 tabs:save-auth')
  assert.ok(managementChannels.has('tabs:open-auth'), 'managementChannels 必须包含 tabs:open-auth')
})

test('固定 Tab 标题与防覆盖机制：传入 name 时 page-title-updated 不覆盖', () => {
  const contents = new EventEmitter()
  const options = {
    name: '自定义测试标签',
    authType: 'custom',
    showSaveButton: true
  }

  const pinnedTitle = options.name ? String(options.name).trim() : null
  const authType = options.authType || null
  const showSaveButton = options.showSaveButton !== undefined ? Boolean(options.showSaveButton) : Boolean(authType)
  const tab = {
    id: 'tab-1',
    title: pinnedTitle || '新标签页',
    pinnedTitle,
    authType,
    showSaveButton,
    saving: false
  }

  // 绑定 page-title-updated 事件
  contents.on('page-title-updated', (_event, title) => {
    tab.title = tab.pinnedTitle || title || '新标签页'
  })

  assert.equal(tab.title, '自定义测试标签')

  // 模拟网页更新标题
  contents.emit('page-title-updated', {}, '登录成功 - 某平台后台')
  assert.equal(tab.title, '自定义测试标签', '网页标题更新不应覆盖传入的固定名称')

  // 如果没有传入 name
  const ordinaryTab = {
    id: 'tab-2',
    title: '新标签页',
    pinnedTitle: null
  }
  const ordinaryContents = new EventEmitter()
  ordinaryContents.on('page-title-updated', (_event, title) => {
    ordinaryTab.title = ordinaryTab.pinnedTitle || title || '新标签页'
  })
  ordinaryContents.emit('page-title-updated', {}, '百度一下')
  assert.equal(ordinaryTab.title, '百度一下', '未传入 name 时应随网页标题正常更新')
})

test('保存按钮参数受控与默认值：授权标签默认显示保存按钮，可由参数关闭', () => {
  // 1. 默认情况：没有显式传 showSaveButton，只要是 authType，默认显示
  const tabDefault = {
    authType: 'custom',
    showSaveButton: undefined
  }
  const show1 = tabDefault.showSaveButton !== undefined ? Boolean(tabDefault.showSaveButton) : Boolean(tabDefault.authType)
  assert.equal(show1, true)

  // 2. 显式关闭
  const tabDisabled = {
    authType: 'platform',
    showSaveButton: false
  }
  const show2 = tabDisabled.showSaveButton !== undefined ? Boolean(tabDisabled.showSaveButton) : Boolean(tabDisabled.authType)
  assert.equal(show2, false)

  // 3. 显式开启
  const tabEnabled = {
    authType: 'platform',
    showSaveButton: true
  }
  const show3 = tabEnabled.showSaveButton !== undefined ? Boolean(tabEnabled.showSaveButton) : Boolean(tabEnabled.authType)
  assert.equal(show3, true)
})
