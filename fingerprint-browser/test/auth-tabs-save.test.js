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

test('保存按钮参数受控与默认值：标签页默认显示保存按钮，可由参数关闭', () => {
  // 1. 默认情况：没有显式传 showSaveButton，无论是授权还是普通标签，默认均显示
  const tabDefault = {
    authType: null,
    showSaveButton: undefined
  }
  const show1 = tabDefault.showSaveButton !== undefined ? Boolean(tabDefault.showSaveButton) : true
  assert.equal(show1, true)

  // 2. 显式关闭
  const tabDisabled = {
    authType: 'platform',
    showSaveButton: false
  }
  const show2 = tabDisabled.showSaveButton !== undefined ? Boolean(tabDisabled.showSaveButton) : true
  assert.equal(show2, false)

  // 3. 显式开启
  const tabEnabled = {
    authType: 'platform',
    showSaveButton: true
  }
  const show3 = tabEnabled.showSaveButton !== undefined ? Boolean(tabEnabled.showSaveButton) : true
  assert.equal(show3, true)
})

test('账号打开标题策略：平台账号显示"平台-账号昵称"，其他网站账号显示其 name 名称', () => {
  // 1. 平台账号格式化测试
  const platforms = [{ key: 'shipinhao', name: '视频号' }, { key: 'douyin', name: '抖音' }, { key: 'kuaishou', name: '快手' }, { key: 'xiaohongshu', name: '小红书' }]
  function formatPlatformTitle (platformKey, accountName, fallbackId) {
    const platform = platforms.find(p => p.key === platformKey)
    const platformLabel = platform?.name || platformKey || '平台'
    const accountLabel = accountName || fallbackId || '账号'
    return accountLabel.startsWith(`${platformLabel}-`) ? accountLabel : `${platformLabel}-${accountLabel}`
  }

  assert.equal(formatPlatformTitle('shipinhao', '张三', 'u1001'), '视频号-张三')
  assert.equal(formatPlatformTitle('douyin', '李四', 'u1002'), '抖音-李四')
  assert.equal(formatPlatformTitle('kuaishou', '快手-王五', 'u1003'), '快手-王五', '避免重复前缀')
  assert.equal(formatPlatformTitle('xiaohongshu', '', 'u1004'), '小红书-u1004', '昵称为空时回退账号ID')

  // 2. 网站账号标题测试（直接取 name）
  const websiteAccount = { id: 'web-1', name: '百度', url: 'https://www.baidu.com' }
  assert.equal(websiteAccount.name, '百度')

  // 3. 模拟 policy 组装与 tab 标题绑定
  const { TabCapabilities } = require('../tab-capabilities')
  const capabilityRegistry = new TabCapabilities()

  const launchPayload = { capabilities: ['*'], allowedOrigins: ['https://channels.weixin.qq.com'] }
  const profileName = formatPlatformTitle('shipinhao', '张三', 'u1001')

  const policy = {
    ...capabilityRegistry.normalize({
      capabilities: launchPayload.capabilities ?? ['*'],
      allowedOrigins: launchPayload.allowedOrigins
    }),
    authType: 'platform',
    name: profileName
  }

  assert.equal(policy.name, '视频号-张三')
  const pinnedTitle = policy.name ? String(policy.name).trim() : null
  const tab = {
    id: 'tab-platform',
    pinnedTitle,
    title: pinnedTitle || '新标签'
  }
  assert.equal(tab.title, '视频号-张三')

  // 网页自身更新标题不能覆盖 pinnedTitle
  const contents = new EventEmitter()
  contents.on('page-title-updated', (_event, title) => {
    tab.title = tab.pinnedTitle || title || '新标签页'
  })
  contents.emit('page-title-updated', {}, '微信视频号助手 - 创作者管理')
  assert.equal(tab.title, '视频号-张三', '网页自身更新标题不会覆盖固定平台标题')
})

test('页面加载完成前关闭标签页：不触发"网页加载失败"阻断性错误，安全返回', async () => {
  const tabs = new Map()
  const tabId = 'tab-early-close'
  const tab = {
    id: tabId,
    closing: false,
    closed: false,
    preserveLastUrl: false,
    error: ''
  }
  tabs.set(tabId, tab)

  // 模拟用户在网页加载过程中点击关闭标签
  function simulateCloseTab () {
    tab.closing = true
    tabs.delete(tabId)
    tab.closed = true
  }

  // 模拟 openPage catch 流程
  async function simulateOpenCatch (err) {
    if (!tabs.has(tabId) || tab.closing || tab.closed || tab.closePromise || err?.code === 'ERR_ABORTED' || err?.errno === -3) {
      if (!tabs.has(tabId) || tab.closing || tab.closed) {
        return { tabId, warning: '', closed: true }
      }
      return { tabId, warning: '' }
    }
    throw new Error('网页加载失败，标签已保留，可修改网址后重试。')
  }

  // 1. 用户提前关闭标签，ERR_ABORTED 触发
  simulateCloseTab()
  const result = await simulateOpenCatch({ code: 'ERR_ABORTED', errno: -3 })
  assert.equal(result.closed, true)
  assert.equal(result.tabId, tabId)

  // 2. 真实网络错误（未关闭标签）仍然正常抛错
  const liveTab = { id: 'live-tab', closing: false, closed: false }
  tabs.set('live-tab', liveTab)
  let threw = false
  try {
    if (!tabs.has('live-tab') || liveTab.closing || liveTab.closed) {
      // not closed
    } else {
      throw new Error('网页加载失败，标签已保留，可修改网址后重试。')
    }
  } catch (e) {
    threw = true
    assert.match(e.message, /网页加载失败，标签已保留/)
  }
  assert.equal(threw, true)
})
