const test = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const { generateStealthScript } = require('../stealth-engine')

function createMockBrowserContext (options = {}) {
  class MockMimeType {}
  class MockMimeTypeArray {}
  class MockPlugin {}
  class MockPluginArray {}
  class MockNavigator {
    constructor () {
      this.webdriver = options.webdriver !== undefined ? options.webdriver : true
      this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36'
      this.permissions = {
        query: async () => ({ state: 'prompt' })
      }
    }
  }

  class MockHTMLIFrameElement {
    constructor () {
      this._contentWindow = createMockSubWindow()
    }
    get contentWindow () {
      return this._contentWindow
    }
  }

  class MockEvent {
    constructor (type, init = {}) {
      this.type = type
      this.target = init.target || null
      this._stopped = false
      this.defaultPrevented = false
    }
    stopImmediatePropagation () {
      this._stopped = true
    }
    preventDefault () {
      this.defaultPrevented = true
    }
  }

  class MockEventTarget {
    constructor () {
      this._listeners = new Map()
    }
    addEventListener (event, listener, useCapture) {
      if (!this._listeners.has(event)) this._listeners.set(event, [])
      this._listeners.get(event).push({ listener, useCapture: Boolean(useCapture) })
    }
    dispatchEvent (event) {
      const list = this._listeners.get(event.type) || []
      const sorted = [...list].sort((a, b) => (b.useCapture ? 1 : 0) - (a.useCapture ? 1 : 0))
      for (const item of sorted) {
        if (event._stopped) break
        item.listener(event)
      }
      return !event.defaultPrevented
    }
  }

  class MockDocument extends MockEventTarget {
    createElement (tag) {
      if (tag.toLowerCase() === 'iframe') {
        return new MockHTMLIFrameElement()
      }
      return { tagName: tag.toUpperCase() }
    }
  }

  function createMockSubWindow () {
    return {
      navigator: {
        plugins: [],
        mimeTypes: []
      },
      document: new MockDocument()
    }
  }

  const windowEventTarget = new MockEventTarget()

  const contextObj = {
    MimeType: MockMimeType,
    MimeTypeArray: MockMimeTypeArray,
    Plugin: MockPlugin,
    PluginArray: MockPluginArray,
    Navigator: MockNavigator,
    HTMLIFrameElement: MockHTMLIFrameElement,
    Document: MockDocument,
    Event: MockEvent,
    Notification: { permission: 'default' },
    Date,
    Math,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Function,
    Error,
    Promise,
    WeakMap,
    console
  }

  contextObj.addEventListener = (event, listener, useCapture) => windowEventTarget.addEventListener(event, listener, useCapture)
  contextObj.dispatchEvent = (event) => windowEventTarget.dispatchEvent(event)
  contextObj.window = contextObj
  contextObj.navigator = new MockNavigator()
  contextObj.document = new MockDocument()

  const sandbox = vm.createContext(contextObj)
  return {
    sandbox,
    contextObj,
    evalInContext: code => vm.runInContext(code, sandbox)
  }
}

test('Google 登录与 BotGuard 防护对抗测试套件', async (t) => {
  const { sandbox, contextObj, evalInContext } = createMockBrowserContext()
  const scriptSource = generateStealthScript()

  // 1. 执行 Stealth 防护脚本
  vm.runInContext(scriptSource, sandbox)

  await t.test('1. window.chrome 完整对象树与属性合规性', () => {
    assert.ok(evalInContext('Boolean(window.chrome)'), 'window.chrome 必须存在')
    assert.equal(evalInContext('typeof window.chrome'), 'object', 'window.chrome 必须为 object')
    assert.equal(evalInContext('typeof window.chrome.app'), 'object', 'chrome.app 必须存在')
    assert.equal(evalInContext('window.chrome.app.isInstalled'), false, 'chrome.app.isInstalled 必须为 false')

    // 检查 InstallState 与 RunningState 常量字典
    assert.equal(evalInContext('window.chrome.app.InstallState.DISABLED'), 'disabled')
    assert.equal(evalInContext('window.chrome.app.InstallState.INSTALLED'), 'installed')
    assert.equal(evalInContext('window.chrome.app.InstallState.NOT_INSTALLED'), 'not_installed')
    assert.equal(evalInContext('window.chrome.app.RunningState.CANNOT_RUN'), 'cannot_run')
    assert.equal(evalInContext('window.chrome.app.RunningState.READY_TO_RUN'), 'ready_to_run')
    assert.equal(evalInContext('window.chrome.app.RunningState.RUNNING'), 'running')

    // 检查 app 核心方法
    assert.equal(evalInContext('typeof window.chrome.app.getDetails'), 'function')
    assert.equal(evalInContext('typeof window.chrome.app.getIsInstalled'), 'function')
    assert.equal(evalInContext('typeof window.chrome.app.installState'), 'function')
    assert.equal(evalInContext('typeof window.chrome.app.runningState'), 'function')
    assert.equal(evalInContext('window.chrome.app.getDetails()'), null)
    assert.equal(evalInContext('window.chrome.app.getIsInstalled()'), false)

    const installStateCallback = evalInContext(`
      (function() {
        let res = '';
        window.chrome.app.installState(function(state) { res = state; });
        return res;
      })()
    `)
    assert.equal(installStateCallback, 'not_installed')

    const runningStateCallback = evalInContext(`
      (function() {
        let res = '';
        window.chrome.app.runningState(function(state) { res = state; });
        return res;
      })()
    `)
    assert.equal(runningStateCallback, 'cannot_run')

    // 检查 csi() 性能时间戳
    assert.equal(evalInContext('typeof window.chrome.csi'), 'function', 'chrome.csi 必须为函数')
    const csiResult = evalInContext('window.chrome.csi()')
    assert.ok(csiResult.startE > 0, 'csi.startE 必须为正数时间戳')
    assert.ok(csiResult.onloadT >= csiResult.startE, 'csi.onloadT 必须 >= csi.startE')
    assert.ok(csiResult.pageT >= 0, 'csi.pageT 必须 >= 0')
    assert.equal(csiResult.tran, 15, 'csi.tran 必须等于 15')

    // 检查 loadTimes() 关键导航时间戳
    assert.equal(evalInContext('typeof window.chrome.loadTimes'), 'function', 'chrome.loadTimes 必须为函数')
    const loadTimesResult = evalInContext('window.chrome.loadTimes()')
    assert.ok(loadTimesResult.requestTime > 0, 'loadTimes.requestTime 必须有效')
    assert.ok(loadTimesResult.finishDocumentLoadTime >= loadTimesResult.requestTime)
    assert.equal(loadTimesResult.connectionInfo, 'h2', 'connectionInfo 必须模拟真实 h2 协议')
    assert.equal(loadTimesResult.wasFetchedViaSpdy, true)
    assert.equal(loadTimesResult.navigationType, 'Other')

    // 检查 runtime 基本结构
    assert.ok(evalInContext('Boolean(window.chrome.runtime)'), 'chrome.runtime 必须存在')
    assert.equal(evalInContext('typeof window.chrome.runtime.connect'), 'function')
    assert.equal(evalInContext('typeof window.chrome.runtime.sendMessage'), 'function')

    // 检查 window.chrome 属性描述符
    const descriptor = evalInContext('Object.getOwnPropertyDescriptor(window, "chrome")')
    assert.equal(descriptor.configurable, true, 'chrome 必须是 configurable')
    assert.equal(descriptor.enumerable, true, 'chrome 必须是 enumerable')
    assert.equal(descriptor.writable, true, 'chrome 必须是 writable')
  })

  await t.test('2. 原生代码函数防逆向与 toString 闭包阻断 (BotGuard 核心检测)', () => {
    // 在页面沙箱内执行 BotGuard 探针检测
    assert.equal(evalInContext('window.chrome.csi.toString()'), 'function csi() { [native code] }')
    assert.equal(evalInContext('window.chrome.loadTimes.toString()'), 'function loadTimes() { [native code] }')
    assert.equal(evalInContext('window.chrome.app.getDetails.toString()'), 'function getDetails() { [native code] }')

    // 使用 Function.prototype.toString.call(...) 深度比对
    assert.equal(evalInContext('Function.prototype.toString.call(window.chrome.csi)'), 'function csi() { [native code] }')
    assert.equal(evalInContext('Function.prototype.toString.call(window.chrome.loadTimes)'), 'function loadTimes() { [native code] }')

    // 检查 Function.prototype.toString 本身
    assert.equal(evalInContext('Function.prototype.toString.toString()'), 'function toString() { [native code] }')
    assert.equal(evalInContext('Function.prototype.toString.call(Function.prototype.toString)'), 'function toString() { [native code] }')
  })

  await t.test('3. navigator.webdriver 自动化标识彻底归零', () => {
    assert.equal(evalInContext('navigator.webdriver'), false, 'navigator.webdriver 必须严格返回 false')
    assert.equal(evalInContext('Navigator.prototype.webdriver'), false, 'Navigator.prototype.webdriver 必须返回 false')
  })

  await t.test('4. 真实 Chrome 5 插件系统 (PluginArray & MimeTypeArray)', () => {
    assert.equal(evalInContext('navigator.plugins.length'), 5, '桌面版 Chrome 必须且仅包含 5 个内置 PDF 插件')

    // 验证 5 个内置插件名称与索引访问
    const expectedPlugins = [
      'PDF Viewer',
      'Chrome PDF Viewer',
      'Chromium PDF Viewer',
      'Microsoft Edge PDF Viewer',
      'WebKit built-in PDF'
    ]
    for (let i = 0; i < expectedPlugins.length; i++) {
      const name = expectedPlugins[i]
      assert.equal(evalInContext(`navigator.plugins[${i}].name`), name)
      assert.equal(evalInContext(`navigator.plugins[${JSON.stringify(name)}].name`), name)
      assert.equal(evalInContext(`navigator.plugins.item(${i}).name`), name)
      assert.equal(evalInContext(`navigator.plugins.namedItem(${JSON.stringify(name)}).name`), name)
    }

    // 验证 MimeTypes
    assert.equal(evalInContext('navigator.mimeTypes.length'), 2, 'Chrome 内置 2 个 PDF MIME 类型')
    assert.equal(evalInContext('navigator.mimeTypes[0].type'), 'application/pdf')
    assert.equal(evalInContext('navigator.mimeTypes["application/pdf"].type'), 'application/pdf')
    assert.equal(evalInContext('navigator.mimeTypes.item(0).type'), 'application/pdf')
    assert.equal(evalInContext('navigator.mimeTypes.namedItem("application/pdf").type'), 'application/pdf')
  })

  await t.test('5. Notification 权限查询与系统通知状态对齐', async () => {
    const state = await evalInContext('navigator.permissions.query({ name: "notifications" }).then(res => res.state)')
    assert.equal(state, 'default', '通知查询状态应与 Notification.permission 保持一致')
  })

  await t.test('6. 动态隐藏 Iframe 原型差分防逆向测试 (Botguard Iframe Probe)', () => {
    // 模拟 BotGuard 动态创建隐藏 iframe 探测原型
    const iframeProbe = evalInContext(`
      (function() {
        const iframe = document.createElement('iframe');
        const win = iframe.contentWindow;
        return {
          hasChrome: Boolean(win && win.chrome),
          hasCsi: Boolean(win && win.chrome && typeof win.chrome.csi === 'function'),
          csiTran: win && win.chrome ? win.chrome.csi().tran : 0,
          pluginsLength: win && win.navigator ? win.navigator.plugins.length : 0
        };
      })()
    `)

    assert.equal(iframeProbe.hasChrome, true, '动态子 iframe 的 window.chrome 必须自动同步加固')
    assert.equal(iframeProbe.hasCsi, true)
    assert.equal(iframeProbe.csiTran, 15)
    assert.equal(iframeProbe.pluginsLength, 5, '动态子 iframe 的 plugins 必须同样具备 5 个插件')
  })

  await t.test('7. 页面可见性永远为 true 与焦点状态永远为 focus 深度防护', () => {
    // 验证 document 实例与原型链上的 visibilityState 与 hidden
    assert.equal(evalInContext('document.visibilityState'), 'visible', 'document.visibilityState 必须始终为 visible')
    assert.equal(evalInContext('document.hidden'), false, 'document.hidden 必须始终为 false')
    assert.equal(evalInContext('document.hasFocus()'), true, 'document.hasFocus() 必须始终返回 true')

    // 验证 Document.prototype 上的原生函数与描述符
    const visDesc = evalInContext('Object.getOwnPropertyDescriptor(Document.prototype, "visibilityState")')
    assert.equal(typeof visDesc.get, 'function')
    assert.equal(evalInContext('Function.prototype.toString.call(Object.getOwnPropertyDescriptor(Document.prototype, "visibilityState").get)'), 'function get visibilityState() { [native code] }')

    const hiddenDesc = evalInContext('Object.getOwnPropertyDescriptor(Document.prototype, "hidden")')
    assert.equal(typeof hiddenDesc.get, 'function')
    assert.equal(evalInContext('Function.prototype.toString.call(Object.getOwnPropertyDescriptor(Document.prototype, "hidden").get)'), 'function get hidden() { [native code] }')

    assert.equal(evalInContext('Function.prototype.toString.call(document.hasFocus)'), 'function hasFocus() { [native code] }')

    // 验证 visibilitychange 事件拦截阻断
    const visResult = evalInContext(`
      (function() {
        let called = false;
        document.addEventListener('visibilitychange', () => { called = true; }, false);
        const event = new Event('visibilitychange');
        document.dispatchEvent(event);
        return { called, stopped: event._stopped };
      })()
    `)
    assert.equal(visResult.called, false, '页面业务代码注册的 visibilitychange 监听器不得被触发')
    assert.equal(visResult.stopped, true, 'visibilitychange 事件必须在捕获阶段被立即阻断传播')

    // 验证 window/document 的 blur 与 focusout 失焦事件拦截
    const blurResult = evalInContext(`
      (function() {
        let windowBlurCalled = false;
        window.addEventListener('blur', () => { windowBlurCalled = true; }, false);
        const blurEvt = new Event('blur', { target: window });
        window.dispatchEvent(blurEvt);
        return { windowBlurCalled, stopped: blurEvt._stopped, defaultPrevented: blurEvt.defaultPrevented };
      })()
    `)
    assert.equal(blurResult.windowBlurCalled, false, '针对 window 的 blur 监听器不得被触发')
    assert.equal(blurResult.stopped, true, '针对 window 的失焦事件必须被立即阻断')
    assert.equal(blurResult.defaultPrevented, true)

    // 验证表单输入控件（input）之间的失焦不受影响
    const inputBlurResult = evalInContext(`
      (function() {
        let inputBlurCalled = false;
        const fakeInput = { tagName: 'INPUT' };
        window.addEventListener('blur', () => { inputBlurCalled = true; }, false);
        const inputEvt = new Event('blur', { target: fakeInput });
        window.dispatchEvent(inputEvt);
        return { inputBlurCalled, stopped: inputEvt._stopped };
      })()
    `)
    assert.equal(inputBlurResult.inputBlurCalled, true, '表单控件本身的失焦事件必须正常通行')
    assert.equal(inputBlurResult.stopped, false)

    // 验证动态子 iframe 继承可见性与焦点状态
    const iframeFocus = evalInContext(`
      (function() {
        const iframe = document.createElement('iframe');
        const win = iframe.contentWindow;
        return {
          visibilityState: win.document.visibilityState,
          hidden: win.document.hidden,
          hasFocus: typeof win.document.hasFocus === 'function' && win.document.hasFocus()
        };
      })()
    `)
    assert.equal(iframeFocus.visibilityState, 'visible')
    assert.equal(iframeFocus.hidden, false)
    assert.equal(iframeFocus.hasFocus, true)
  })
})
