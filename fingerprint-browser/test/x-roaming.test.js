'use strict'

const assert = require('node:assert/strict')
const { test } = require('node:test')
const vm = require('node:vm')
const { XPlatformAutomation, getXMentionState } = require('../platform-automation/platforms/x')
const { normalizeXGrokConfig } = require('../platform-automation/platforms/x/selectors')
const { startXRoaming, stopXRoaming, inspectTimeline, inspectReply, resolveReplyTarget, commentOnPost } = require('../platform-automation/platforms/x/roaming')
const { humanoidPressKey } = require('../humanoid-actions')

function fixture () {
  const contents = { isDestroyed: () => false, getURL: () => 'https://x.com/home',
    async executeJavaScript (script) { new vm.Script(script); return { exists: false, text: '' } } }
  const tab = { id: 'roaming-test', environmentId: 'roaming-test', view: { webContents: contents } }
  const platform = new XPlatformAutomation({ tabBrowser: { tabs: new Map([[tab.id, tab]]) } })
  const task = platform.createTask(tab.id, tab.id, '漫游隔离测试')
  task.roamingEnabled = true
  task.commentSentences = ['隔离测试评论一', '隔离测试评论二']
  platform.tasks.set(task.environmentId, task)
  return { platform, task }
}

test('漫游配置校验、换行分句和页面脚本语法', () => {
  assert.throws(() => normalizeXGrokConfig({ roamingEnabled: true, commentSentences: '' }), /至少填写一句/)
  assert.deepEqual(normalizeXGrokConfig({ roamingEnabled: true, commentSentences: '第一句\n第二句\n第一句', commentIntervalMs: 60000 }).commentSentences, ['第一句', '第二句'])
  assert.throws(() => normalizeXGrokConfig({ commentSentences: ['长'.repeat(121)] }), /120/)
  assert.throws(() => normalizeXGrokConfig({ commentIntervalMs: 1000 }), /间隔/)
  for (const probe of [inspectTimeline, inspectReply, resolveReplyTarget]) new vm.Script('(' + probe.toString() + ')')
})

test('框架快捷键为当前编辑器发送原生按键', async () => {
  const events = []
  await humanoidPressKey({ focus: () => events.push('focus'), sendInputEvent: event => events.push(event) }, 'A', { modifiers: ['control'] })
  assert.equal(events[0], 'focus')
  assert.deepEqual(events.slice(1).map(event => [event.type, event.keyCode, event.modifiers]), [
    ['keyDown', 'A', ['control']], ['keyUp', 'A', ['control']]
  ])
})

test('提及确认接受不换行空格和段落尾空白，但拒绝未关闭的候选列表', () => {
  const input = { innerText: '正文 @GROK\u00a0\n' }
  let candidate = null
  const context = { innerWidth: 100, innerHeight: 100, document: { activeElement: input,
    querySelector: selector => selector === 'input' ? input : candidate,
    elementFromPoint: () => candidate } }
  const probe = '(' + getXMentionState.toString() + ')("input", "candidate", "grok")'
  assert.equal(vm.runInNewContext(probe, context).selected, true)
  input.innerText = '正文 @grok'
  assert.equal(vm.runInNewContext(probe, context).selected, false)
  input.innerText = 'name@grok '
  assert.equal(vm.runInNewContext(probe, context).selected, false)
  input.innerText = '正文 @grok '
  candidate = { disabled: false, getClientRects: () => [{}], getBoundingClientRect: () => ({left:10,top:10,width:20,height:20}), contains: () => true }
  const pending = vm.runInNewContext(probe, context)
  assert.equal(pending.candidateReady, true)
  assert.equal(pending.selected, false)
})

function mentionFixture (failedClicks, changeText = false) {
  const state = { text: '原始正文', clicks: 0, activated: 0, selected: false }
  const contents = {
    focus () {},
    async executeJavaScript (script) {
      new vm.Script(script)
      if (script.includes('function getXMentionState')) return {candidateReady:!state.selected,selected:state.selected,currentText:state.text}
      return {x:40,y:40,width:40,height:30}
    },
    sendInputEvent (event) {
      if (event.type === 'char') state.text += event.keyCode
      if (event.type === 'mouseDown') assert.ok(state.activated > 0, '必须先激活目标标签再发出点击')
      if (event.type === 'mouseUp') {
        state.clicks += 1
        if (changeText) state.text += '用户修改'
        else if (state.clicks > failedClicks) { state.selected = true; state.text += ' ' }
      }
    }
  }
  const tab = {id:'mention-test',environmentId:'mention-test',view:{webContents:contents}}
  const platform = new XPlatformAutomation({tabBrowser:{tabs:new Map([[tab.id,tab]]),select:id=>{assert.equal(id,tab.id);state.activated += 1}}})
  const task = platform.createTask(tab.id,tab.id,'提及选择隔离测试')
  return {state,contents,platform,task}
}

test('第一次候选点击未生效时重新激活标签，只重试准确候选且不重复输入用户名', async () => {
  const {state,contents,platform,task} = mentionFixture(1)
  await platform.appendMentions(contents,['grok'],task)
  assert.equal(state.clicks,2)
  assert.ok(state.activated >= 3)
  assert.equal(state.text,'原始正文 @grok ')
})

test('候选选择重试次数有限，草稿被修改时停止继续点击', async () => {
  const failure = mentionFixture(99)
  await assert.rejects(failure.platform.appendMentions(failure.contents,['grok'],failure.task),/重试后仍未确认/)
  assert.equal(failure.state.clicks,3)
  assert.equal(failure.state.text,'原始正文 @grok')
  const changed = mentionFixture(99,true)
  await assert.rejects(changed.platform.appendMentions(changed.contents,['grok'],changed.task),/内容发生变化/)
  assert.equal(changed.state.clicks,1)
  assert.ok(changed.state.text.endsWith('用户修改'))
})

test('评论目标核验使用原帖作者，不能把引用帖作者当作评论目标', () => {
  let author = 'outer_author'
  const original = { querySelector: selector => selector.includes('tweetText')
    ? { innerText: '原帖内容和被引用的目标正文' }
    : { getAttribute: () => 'UserAvatar-Container-' + author } }
  const dialog = { querySelector: selector => selector.includes('tweetTextarea') ? { innerText: '' }
    : selector.includes('tweetButton') ? { disabled: true } : original }
  const context = { target: { author: 'quoted_author', excerpt: '目标正文' },
    document: { querySelector: () => dialog, querySelectorAll: () => [] } }
  const probe = '(' + inspectReply.toString() + ')(target, "")'
  assert.equal(vm.runInNewContext(probe, context).belongsToTarget, false)
  author = 'quoted_author'
  assert.equal(vm.runInNewContext(probe, context).belongsToTarget, true)
  context.target.excerpt = '目标 正文'
  assert.equal(vm.runInNewContext(probe, context).belongsToTarget, true, '同一正文在两个渲染器中的排版空白不应造成目标误判')
})

test('实时定位按原帖链接匹配，忽略其他帖子中的引用链接和过期坐标', () => {
  const makeLink=href=>({getAttribute:()=>href,querySelector:()=>({})})
  let visible=true
  const button={disabled:false,getAttribute:()=>null,contains:node=>node===button,
    getBoundingClientRect:()=>({left:40,top:visible?50:500,width:20,height:20})}
  const quoted={querySelectorAll:()=>[makeLink('/other/status/456'),makeLink('/test_author/status/123')],querySelector:()=>{throw new Error('不能选中引用帖所在的错误原帖')}}
  const original={querySelectorAll:()=>[makeLink('/test_author/status/123')],querySelector:()=>button}
  const context={URL,location:{origin:'https://x.com'},innerWidth:300,innerHeight:300,target:{url:'https://x.com/test_author/status/123',point:{x:1,y:1}},
    document:{querySelector:()=>null,querySelectorAll:()=>[quoted,original],elementFromPoint:()=>button}}
  const probe='('+resolveReplyTarget.toString()+')(target)'
  const result=vm.runInNewContext(probe,context)
  assert.equal(result.ready,true)
  assert.equal(result.point.x,50)
  assert.equal(result.point.y,60)
  visible=false
  assert.equal(vm.runInNewContext(probe,context).ready,false)
})

test('暂停任务和关闭漫游配置会取消等待中的漫游', async () => {
  const { platform, task } = fixture()
  task.enabled = true
  task.nextRunAt = Date.now() + 60000
  startXRoaming(platform, task)
  const controller = task.roamingController
  const operation = task.roamingPromise
  platform.toggleTask(task.environmentId, false)
  await operation
  assert.equal(controller.signal.aborted, true)
  assert.equal(task.roamingPromise, null)
  assert.equal(task.state, 'stopped')
  task.enabled = true
  task.nextRunAt = Date.now() + 60000
  startXRoaming(platform, task)
  await platform.updateConfig(task.environmentId, { roamingEnabled: false })
  assert.equal(task.roamingPromise, null)
  assert.equal(task.roamingEnabled, false)
  platform.onEnvironmentClosed(task.environmentId)
})

function replyFixture (abortDuringInput, options = {}) {
  const { platform, task } = fixture()
  const controller = new AbortController()
  const target = { url: 'https://x.com/test_author/status/123', author: 'test_author', excerpt: '隔离测试帖子', point: { x: 10, y: 20 } }
  const state = { open: false, text: '', submitted: 0, feedback: '', entryClicks: 0, identityReads: 0, inputAfterIdentityReads: 0 }
  let selected = false
  task.enabled = true
  task.nextRunAt = Date.now() + 120000
  const contents = {
    focus () {}, isDestroyed: () => false,
    async insertText (text) { state.inputAfterIdentityReads ||= state.identityReads; state.text += text; if (abortDuringInput) controller.abort() },
    async executeJavaScript (script) {
      new vm.Script(script)
      if (script.includes('document.activeElement?.matches')) return true
      if (script.includes('function resolveReplyTarget')) return {ready:!options.unavailable,point:target.point}
      if (script.includes('function inspectReply')) {
        if (state.open) state.identityReads += 1
        const matched = state.open && state.identityReads > (options.identityDelay || 0)
        return { exists: state.open, dialogPresent:state.open, closeAvailable:state.open, text: state.text.trim(), belongsToTarget: matched,
          ready: state.text === 'AB', feedback: state.feedback, feedbackUrl: '' }
      }
      const x = script.includes('app-bar-close') ? 80 : script.includes('tweetButton') ? 120 : 40
      return { x, y: 20, width: 20, height: 20 }
    },
    sendInputEvent (event) {
      if (event.type === 'char') {
        state.text += event.keyCode
        if (abortDuringInput) controller.abort()
      }
      if (event.type === 'keyDown' && event.keyCode === 'A' && event.modifiers?.includes(process.platform === 'darwin' ? 'meta' : 'control')) selected = true
      if (event.type === 'keyDown' && event.keyCode === 'Backspace' && selected) {
        if (options.cleanupDelay) setTimeout(() => { state.text = '' }, options.cleanupDelay)
        else state.text = ''
      }
      if (event.type !== 'mouseUp') return
      if (event.x < 30) {state.entryClicks += 1;state.open = state.entryClicks > (options.entryMisses || 0)}
      else if (event.x >= 80 && event.x < 110) {
        if (options.cleanupDelay) setTimeout(() => { state.open = false }, options.cleanupDelay)
        else state.open = false
      }
      else if (event.x >= 120) { state.submitted += 1; state.open = false; state.feedback = 'Your post was sent.' }
    }
  }
  return { platform, task, target, controller, state, contents }
}

test('输入评论过程中暂停会清空本次草稿，不点击发送', async () => {
  const { platform, task, target, controller, state, contents } = replyFixture(true)
  assert.equal(await commentOnPost(platform, task, contents, target, 'AB', controller.signal), false)
  assert.equal(state.text, '')
  assert.equal(state.open, false)
  assert.equal(state.submitted, 0)
  assert.equal(task.commentedPostUrls.size, 0)
  platform.onEnvironmentClosed(task.environmentId)
})

test('暂停后等待草稿清空与窗口动画结束，再交还调度', async () => {
  const { platform, task, target, controller, state, contents } = replyFixture(true, { cleanupDelay: 180 })
  assert.equal(await commentOnPost(platform, task, contents, target, 'AB', controller.signal), false)
  assert.equal(state.text, '')
  assert.equal(state.open, false)
  assert.equal(state.submitted, 0)
  platform.onEnvironmentClosed(task.environmentId)
})

test('评论核验成功后记录统计和去重帖子', async () => {
  const { platform, task, target, controller, state, contents } = replyFixture(false)
  assert.equal(await commentOnPost(platform, task, contents, target, 'AB', controller.signal), true)
  assert.equal(state.submitted, 1)
  assert.equal(task.commentCount, 1)
  assert.equal(task.commentedPostUrls.has(target.url), true)
  platform.onEnvironmentClosed(task.environmentId)
})

test('评论输入区先出现时继续等待原帖信息，不提前输入', async () => {
  const {platform,task,target,controller,state,contents}=replyFixture(false,{identityDelay:2})
  assert.equal(await commentOnPost(platform,task,contents,target,'AB',controller.signal),true)
  assert.ok(state.inputAfterIdentityReads>=3)
  assert.equal(state.submitted,1)
  platform.onEnvironmentClosed(task.environmentId)
})

test('评论入口首点未打开时重新定位重试，目标不可点击时返回可跳过错误', async () => {
  const retry=replyFixture(false,{entryMisses:1})
  assert.equal(await commentOnPost(retry.platform,retry.task,retry.contents,retry.target,'AB',retry.controller.signal),true)
  assert.equal(retry.state.entryClicks,2)
  retry.platform.onEnvironmentClosed(retry.task.environmentId)
  const unavailable=replyFixture(false,{unavailable:true})
  await assert.rejects(commentOnPost(unavailable.platform,unavailable.task,unavailable.contents,unavailable.target,'AB',unavailable.controller.signal),error=>error.code==='X_ROAM_TARGET_UNAVAILABLE')
  assert.equal(unavailable.state.submitted,0)
  assert.equal(unavailable.task.commentedPostUrls.size,0)
  unavailable.platform.onEnvironmentClosed(unavailable.task.environmentId)
})

test('Grok 回复过长时重新创作，并为提及账号保留正文预算', async () => {
  const { platform, task } = fixture()
  const originalPrompt = task.prompt
  const requests = []
  const published = []
  platform.generateWithGrok = async (_contents, _task, prompt) => {
    requests.push(prompt)
    return requests.length === 1 ? '长'.repeat(130) : '重新创作后保留完整疑问结尾，可以吗？'
  }
  platform.publishTweet = async (_contents, text) => published.push(text)
  await platform.runCycle(task)
  assert.equal(requests.length, 2)
  assert.ok(requests.every(prompt => prompt.includes('最多 120 个字符')))
  assert.deepEqual(published, ['重新创作后保留完整疑问结尾，可以吗？'])
  assert.equal(task.prompt, originalPrompt, '运行时发布约束不能覆盖用户保存的提示词')
  platform.onEnvironmentClosed(task.environmentId)
})

test('发帖成功后漫游，到期先结束漫游再发帖，重复触发不会并发发布', async () => {
  const { platform, task } = fixture()
  const events = []
  task.enabled = true
  task.intervalMs = 40 // 缩短测试时钟，不向真实 X 发送内容。
  platform.generateWithGrok = async () => {
    assert.equal(task.roamingPromise, null, '开始下一次创作前必须结束漫游')
    events.push('创作')
    return '隔离测试正文'
  }
  platform.publishTweet = async () => {
    events.push('发帖')
    if (events.filter(event => event === '发帖').length === 2) task.enabled = false
  }
  let timeout
  const complete = new Promise((resolve, reject) => {
    timeout = setTimeout(() => reject(new Error('调度循环未按预期完成')), 10000)
    platform.on('status-changed', status => { if (status.runCount === 2) resolve() })
  })
  task.roamingPromise = null
  try {
    await Promise.all([platform.runCycle(task), platform.runCycle(task)])
    assert.equal(task.state, 'roaming')
    await complete
    if (task.cyclePromise) await task.cyclePromise
    assert.deepEqual(events, ['创作', '发帖', '创作', '发帖'])
    assert.equal(task.runCount, 2)
  } finally {
    clearTimeout(timeout)
    task.enabled = false
    await stopXRoaming(task)
    platform.onEnvironmentClosed(task.environmentId)
  }
})
