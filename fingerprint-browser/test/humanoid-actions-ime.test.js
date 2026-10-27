const assert = require('node:assert/strict')
const test = require('node:test')
const {
  resolveImeSegments,
  humanoidImeType,
  COMMON_PINYIN_DICT
} = require('../humanoid-actions')

test('resolveImeSegments: 能够智能识别中英文字符并正确映射拼音', () => {
  const text = 'hello你好world'
  const segments = resolveImeSegments(text)

  assert.equal(segments.length, 12)
  // 'h', 'e', 'l', 'l', 'o' 应为非 IME
  assert.equal(segments[0].isIme, false)
  assert.equal(segments[0].char, 'h')

  // '你' (index 5) 和 '好' (index 6) 应为 IME 模式
  const segNi = segments[5]
  assert.equal(segNi.isIme, true)
  assert.equal(segNi.char, '你')
  assert.equal(segNi.pinyin, 'ni')

  const segHao = segments[6]
  assert.equal(segHao.isIme, true)
  assert.equal(segHao.char, '好')
  assert.equal(segHao.pinyin, 'hao')

  // 支持自定义拼音覆盖
  const custom = resolveImeSegments('淘宝', ['tao', 'bao'])
  assert.equal(custom[0].pinyin, 'tao')
  assert.equal(custom[1].pinyin, 'bao')
})

test('humanoidImeType: 完整派发 IME 键盘事件序列与 W3C 组词生命周期', async () => {
  const sentInputEvents = []
  const executedScripts = []

  const mockWebContents = {
    sendInputEvent: event => {
      sentInputEvents.push(event)
    },
    executeJavaScript: async script => {
      executedScripts.push(script)
      return null
    }
  }

  // 模拟输入 "你好"
  await humanoidImeType(mockWebContents, '你好', {
    keyInterval: 5,
    candidateWaitMs: 10
  })

  // 1. 验证底层键盘事件派发
  // 必须发送 keyCode 为 Process (IME 拦截键) 以及 Space (选词键)
  const processKeys = sentInputEvents.filter(e => e.keyCode === 'Process')
  assert.ok(processKeys.length >= 8, '每个拼音字母必须分别发送 keyDown 和 keyUp (ni + hao = 5 字母 * 2 = 10 次事件)')

  const spaceKeys = sentInputEvents.filter(e => e.keyCode === 'Space')
  assert.equal(spaceKeys.length, 4, '每个汉字选词必须发送 Space 的 keyDown 和 keyUp (2 个汉字 * 2 = 4 次事件)')

  // 2. 验证前端 DOM 注入脚本中派发的标准 W3C IME 事件
  const combinedScripts = executedScripts.join('\n')

  // 2.1 验证 compositionstart 触发
  assert.ok(combinedScripts.includes('compositionstart'), '必须触发 compositionstart 组词事件')

  // 2.2 验证 compositionupdate 逐字母更新组词 buffer
  assert.ok(combinedScripts.includes('compositionupdate'), '必须触发 compositionupdate 组词事件')
  assert.ok(combinedScripts.includes('"ni"'), '组词 update 必须包含当前打出的拼音前缀')
  assert.ok(combinedScripts.includes('"hao"'), '组词 update 必须包含当前打出的拼音')

  // 2.3 验证标准按键 keyCode 229 与 isComposing 标志位 (W3C DOM 规范)
  assert.ok(combinedScripts.includes('keyCode: 229'), 'IME 状态下键盘事件 keyCode 必须为 229 (VK_PROCESSKEY)')
  assert.ok(combinedScripts.includes('isComposing: true'), '组词阶段键盘事件 isComposing 必须为 true')

  // 2.4 验证 compositionend 携带最终字符
  assert.ok(combinedScripts.includes('compositionend'), '必须触发 compositionend 结束事件')
  assert.ok(combinedScripts.includes('"你"'), '必须携带最终选词文字 "你"')
  assert.ok(combinedScripts.includes('"好"'), '必须携带最终选词文字 "好"')

  // 2.5 验证 beforeinput 与 input (inputType: insertFromComposition)
  assert.ok(combinedScripts.includes('insertFromComposition'), '必须通过 insertFromComposition 将文字上屏到 DOM')
  assert.ok(combinedScripts.includes('isComposing: false'), '最终上屏 input 事件 isComposing 必须恢复为 false')
})

test('原生输入模式通过运行时提交中文、标点和表情，换行使用原生回车', async () => {
  const inserted = []
  const events = []
  const scripts = []
  const contents = {
    focus () {},
    insertText: async text => inserted.push(text),
    sendInputEvent: event => events.push(event),
    executeJavaScript: async script => { scripts.push(script); return true }
  }
  await humanoidImeType(contents, '中文，\n🙂A', { nativeInput: true, selector: '[contenteditable="true"]', baseInterval: 0 })
  assert.deepEqual(inserted, ['中', '文', '，', '🙂', 'A'])
  assert.deepEqual(events.map(event => [event.type, event.keyCode]), [['keyDown', 'Enter'], ['char', '\r'], ['keyUp', 'Enter']])
  assert.ok(scripts.every(script => script.includes('document.activeElement?.matches') && !/dispatchEvent|execCommand|\.value\s*=/.test(script)), '原生输入不能通过页面脚本改写编辑器')
  inserted.length = 0
  await humanoidImeType(contents, '', { nativeInput: true, replace: true, selector: '[contenteditable="true"]' })
  assert.equal(inserted.length, 0)
  events.length = 0
  await humanoidImeType(contents, 'A\nB', { nativeInput: true, lineBreakModifiers: ['shift'], baseInterval: 0 })
  assert.ok(events.filter(event => event.keyCode === 'Enter' || event.keyCode === '\r').every(event => event.modifiers.includes('shift')), 'Grok 换行必须使用 Shift+Enter，避免提前提交提示词')
  inserted.length = 0
  contents.executeJavaScript = async () => false
  await assert.rejects(humanoidImeType(contents, '不可输入', { nativeInput: true, selector: 'textarea' }), /焦点/)
  assert.equal(inserted.length, 0, '焦点不正确时不能输入到其他控件')
})
