'use strict'

const assert = require('node:assert')
const { PlatformAutomationManager } = require('../platform-automation')
const { BasePlatformAutomation } = require('../platform-automation/base-automation')
const { XPlatformAutomation, DEFAULT_PROMPT, DEFAULT_INTERVAL_MS } = require('../platform-automation/platforms/x')
const { cleanGeneratedText, isXPlatformUrl, normalizeMentionHandles, getXPostBodyBudget, buildGrokPrompt } = require('../platform-automation/platforms/x/selectors')

async function runTests () {
  console.log('[测试] 开始验证平台自动化架构 (PlatformAutomationManager & XPlatformAutomation)...')

  const manager = new PlatformAutomationManager()
  const xPlatform = manager.getPlatform('x')

  // 1. 验证架构与平台注册
  assert.ok(xPlatform instanceof XPlatformAutomation, '管理器应已默认注册 XPlatformAutomation 平台驱动')
  assert.strictEqual(xPlatform.platformId, 'x')
  assert.strictEqual(xPlatform.platformName, 'X (Twitter)')
  console.log('✓ 平台自动化中心结构与驱动注册自检通过')

  // 2. 验证域名精确识别函数 isXPlatformUrl
  assert.strictEqual(isXPlatformUrl('https://x.com'), true, 'x.com 应被识别')
  assert.strictEqual(isXPlatformUrl('https://x.com/home'), true, 'x.com/home 应被识别')
  assert.strictEqual(isXPlatformUrl('https://twitter.com/i/grok'), true, 'twitter.com/i/grok 应被识别')
  assert.strictEqual(isXPlatformUrl('https://mobile.twitter.com'), true, 'mobile.twitter.com 应被识别')
  assert.strictEqual(isXPlatformUrl('https://www.baidu.com'), false, '百度首页绝不应识别为 X 平台')
  assert.strictEqual(isXPlatformUrl('https://baidu.com/s?wd=twitter'), false, '包含 twitter 搜索词的百度页面绝不应识别为 X 平台')
  assert.strictEqual(isXPlatformUrl('https://not-x.com'), false, '非 X 域名绝不应识别')
  assert.strictEqual(isXPlatformUrl('about:blank'), false, '空白页不应识别为 X 平台')
  console.log('✓ 严格 URL 域名校验函数 (isXPlatformUrl) 自检通过')

  // 3. 验证环境匹配（严格按实际 URL，杜绝因环境名称误判非 X 页面）
  assert.strictEqual(xPlatform.match({ profileName: '美国-推特', creationUrl: 'https://x.com/' }), true, '访问 x.com 的美国-推特环境应匹配')
  assert.strictEqual(xPlatform.match({ profileName: '美国-推特', creationUrl: 'https://twitter.com/home' }), true, '访问 twitter.com 的美国-推特环境应匹配')
  assert.strictEqual(xPlatform.match({ profileName: '美国-推特', creationUrl: 'https://www.baidu.com' }), false, '即使环境名为美国-推特，只要访问百度页面就绝不匹配 X 平台')
  assert.strictEqual(xPlatform.match({ profileName: '美国-推特' }, 'https://www.baidu.com'), false, '打开目标为百度时绝不匹配 X 平台')
  assert.strictEqual(xPlatform.match({ profileName: '普通环境' }, 'https://x.com/'), true, '打开目标为 x.com 时应精准匹配')
  assert.strictEqual(xPlatform.match({ profileName: '普通环境' }, 'https://www.baidu.com'), false, '打开目标为百度时绝不匹配')
  console.log('✓ X/Twitter 平台 URL 隔离路由自检通过（进入百度页面严格不匹配）')

  // 4. 验证文本清洗与思维链 (Thought) 过滤算法
  const rawWithThought = '“这是一条推文：AI让创作更高效！#AI #Tech”'
  const cleaned1 = cleanGeneratedText(rawWithThought)
  assert.strictEqual(cleaned1, 'AI让创作更高效！#AI #Tech', '应去除首尾引号及前缀说明')

  const rawPolite = '好的！这是为你生成的推文：\n探索未知，拥抱未来。'
  const cleaned2 = cleanGeneratedText(rawPolite)
  assert.strictEqual(cleaned2, '探索未知，拥抱未来。', '应去除客套前缀')
  console.log('✓ Grok 正文文本清洗与客套话过滤自检通过')
  assert.deepStrictEqual(normalizeMentionHandles('@grok，@OpenAI grok'), ['grok', 'OpenAI'])
  assert.deepStrictEqual(normalizeMentionHandles(''), [])
  assert.throws(() => normalizeMentionHandles('@bad-name'), /用户名/)
  assert.throws(() => normalizeMentionHandles('https://x.com/grok'), /用户名/)
  assert.equal(getXPostBodyBudget(['grok']), 120)
  assert.ok(getXPostBodyBudget(Array.from({length:10}, (_, index) => 'account_name_' + index)) < 120, '多个提及账号应压缩正文预算')
  assert.ok(buildGrokPrompt('保留疑问结尾', ['grok']).startsWith('保留疑问结尾'))
  assert.ok(buildGrokPrompt('保留疑问结尾', ['grok']).includes('最多 120 个字符'))

  // 5. 验证任务创建、生命周期与快照
  const mockEnv = { id: 'env-twitter-001', profileName: '美国-推特' }
  manager.onEnvironmentOpened(mockEnv, 'tab-001', 'https://x.com/')

  const status = manager.getTaskStatus('env-twitter-001')
  assert.ok(status, '应成功为该环境挂载自动化任务')
  assert.strictEqual(status.platformId, 'x')
  assert.strictEqual(status.environmentName, '美国-推特')
  assert.strictEqual(status.enabled, false, '进入页面后必须保持待命状态，绝不自动启动发帖')
  assert.strictEqual(status.intervalMs, DEFAULT_INTERVAL_MS)
  assert.strictEqual(status.prompt, DEFAULT_PROMPT)
  assert.deepStrictEqual(status.mentions, ['grok'], '默认发帖应提及 Grok')
  console.log('✓ 环境打开静默待命自检通过 (不自动启动)')

  // 6. 验证在百度等非 X 页面时打开环境不挂载任务
  const mockBaiduEnv = { id: 'env-baidu-001', profileName: '美国-推特' }
  manager.onEnvironmentOpened(mockBaiduEnv, 'tab-002', 'https://www.baidu.com')
  assert.strictEqual(manager.getTaskStatus('env-baidu-001'), null, '打开百度页面时 Manager 不应挂载 X 发帖任务')
  console.log('✓ 打开百度页面静默忽略自检通过')

  // 7. 验证配置动态更新
  await manager.updateConfig('env-twitter-001', {
    intervalMs: 15 * 60 * 1000,
    prompt: '全新科技推文Prompt',
    mentions: '@grok @OpenAI'
  })
  const updatedStatus = manager.getTaskStatus('env-twitter-001')
  assert.strictEqual(updatedStatus.intervalMs, 15 * 60 * 1000)
  assert.strictEqual(updatedStatus.prompt, '全新科技推文Prompt')
  assert.deepStrictEqual(updatedStatus.mentions, ['grok', 'OpenAI'])
  await assert.rejects(manager.updateConfig('env-twitter-001', { prompt: '' }), /提示词/)
  assert.strictEqual(manager.getTaskStatus('env-twitter-001').prompt, '全新科技推文Prompt', '无效配置不能清除已保存提示词')
  console.log('✓ 动态配置更新自检通过')

  // 8. 验证手动启动开关与环境销毁
  manager.toggleTask('env-twitter-001', true)
  assert.strictEqual(manager.getTaskStatus('env-twitter-001').enabled, true, '手动点击后应成功启动任务')
  assert.strictEqual(manager.getTaskStatus('env-twitter-001').prompt, '全新科技推文Prompt', '启动定时发帖不能恢复默认提示词')

  manager.toggleTask('env-twitter-001', false)
  assert.strictEqual(manager.getTaskStatus('env-twitter-001').enabled, false, '手动点击后应成功暂停任务')

  manager.onEnvironmentClosed('env-twitter-001')
  assert.strictEqual(xPlatform.tasks.has('env-twitter-001'), false, '环境关闭后应自动清理任务定时器')
  console.log('✓ 任务生命周期控制与资源释放自检通过')

  // 9. 验证新平台极速接入扩展能力（以扩展自定义 Reddit 平台驱动为例）
  class MockRedditPlatformAutomation extends BasePlatformAutomation {
    constructor (options = {}) {
      super({
        platformId: 'reddit',
        platformName: 'Reddit',
        tabBrowser: options.tabBrowser || null,
        defaultIntervalMs: 15 * 60 * 1000,
        defaultPrompt: 'Reddit 科技贴文 Prompt'
      })
    }
    match (environment, targetUrl) {
      const url = String(targetUrl || environment?.creationUrl || environment?.lastUrl || '')
      return url.includes('reddit.com')
    }
    async runCycle (task) {
      task.runCount += 1
      task.state = 'success'
    }
  }

  const mockReddit = new MockRedditPlatformAutomation()
  manager.registerPlatform(mockReddit)
  assert.strictEqual(manager.getPlatform('reddit'), mockReddit, '新平台驱动应成功注册入管理器')

  const redditEnv = { id: 'env-reddit-001', profileName: '海外社区运营-01' }
  manager.onEnvironmentOpened(redditEnv, 'tab-reddit-001', 'https://reddit.com/r/technology')
  const redditStatus = manager.getTaskStatus('env-reddit-001')
  assert.ok(redditStatus, '新平台环境应自动路由并挂载任务')
  assert.strictEqual(redditStatus.platformId, 'reddit')
  assert.strictEqual(redditStatus.intervalMs, 15 * 60 * 1000)
  assert.strictEqual(redditStatus.prompt, 'Reddit 科技贴文 Prompt')
  console.log('✓ 适配新平台极速接入扩展性自检通过')

  console.log('\n全部平台自动化单元测试通过！')
}

void runTests()
