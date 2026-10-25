/**
 * Google 登录及高阶反爬风控对抗引擎 (Stealth Engine)
 * 专门针对 Google BotGuard、reCAPTCHA Enterprise、Cloudflare、CreepJS 等环境探测设计。
 * 纯原生仿真：包含完整的 window.chrome 树、原生函数 toString 闭包阻断、
 * navigator.webdriver 消除、完整 5 插件体系以及动态 iframe 防原型差分比对。
 */

function generateStealthScript () {
  return `(function () {
  if (typeof window === 'undefined' || window.__stealth_protection_active__) return
  try {
    Object.defineProperty(window, '__stealth_protection_active__', {
      value: true,
      enumerable: false,
      configurable: false,
      writable: false
    })
  } catch (_) {}

  // 1. 原生函数 toString 拦截与闭包阻断器 (Native Code Cloaking)
  const toStringMap = new WeakMap()
  const fnProto = (function(){}).constructor.prototype || (typeof Function !== 'undefined' ? Function.prototype : Object.prototype)
  const originalToString = fnProto.toString

  function makeNative(fn, name) {
    if (typeof fn !== 'function') return fn
    const fnName = name || fn.name || ''
    const nativeString = 'function ' + fnName + '() { [native code] }'
    toStringMap.set(fn, nativeString)
    try {
      Object.defineProperty(fn, 'name', { value: fnName, configurable: true })
    } catch (_) {}
    return fn
  }

  const customToString = function toString() {
    if (toStringMap.has(this)) {
      return toStringMap.get(this)
    }
    return originalToString.call(this)
  }
  makeNative(customToString, 'toString')

  try {
    Object.defineProperty(fnProto, 'toString', {
      value: customToString,
      writable: true,
      configurable: true,
      enumerable: false
    })
    if (typeof Function !== 'undefined' && Function.prototype && Function.prototype !== fnProto) {
      Object.defineProperty(Function.prototype, 'toString', {
        value: customToString,
        writable: true,
        configurable: true,
        enumerable: false
      })
    }
  } catch (_) {}

  // 2. 深度仿真 window.chrome 对象树与底层原生接口
  function buildChromeObject() {
    const app = {
      isInstalled: false,
      InstallState: Object.freeze({
        DISABLED: 'disabled',
        INSTALLED: 'installed',
        NOT_INSTALLED: 'not_installed'
      }),
      RunningState: Object.freeze({
        CANNOT_RUN: 'cannot_run',
        READY_TO_RUN: 'ready_to_run',
        RUNNING: 'running'
      }),
      getDetails: makeNative(function getDetails() { return null }, 'getDetails'),
      getIsInstalled: makeNative(function getIsInstalled() { return false }, 'getIsInstalled'),
      installState: makeNative(function installState(callback) {
        if (typeof callback === 'function') callback('not_installed')
      }, 'installState'),
      runningState: makeNative(function runningState(callback) {
        if (typeof callback === 'function') callback('cannot_run')
      }, 'runningState')
    }

    const csi = makeNative(function csi() {
      const now = Date.now()
      const startE = now - Math.floor(Math.random() * 200 + 120)
      const onloadT = startE + Math.floor(Math.random() * 80 + 30)
      return {
        startE: startE,
        onloadT: onloadT,
        pageT: (onloadT - startE) + Number((Math.random() * 0.9).toFixed(2)),
        tran: 15
      }
    }, 'csi')

    const loadTimes = makeNative(function loadTimes() {
      const nowSec = Date.now() / 1000
      return {
        requestTime: Number((nowSec - 0.35).toFixed(3)),
        startLoadTime: Number((nowSec - 0.35).toFixed(3)),
        commitLoadTime: Number((nowSec - 0.22).toFixed(3)),
        finishDocumentLoadTime: Number((nowSec - 0.12).toFixed(3)),
        finishLoadTime: Number((nowSec - 0.05).toFixed(3)),
        firstPaintTime: Number((nowSec - 0.18).toFixed(3)),
        firstPaintAfterLoadTime: 0,
        navigationType: 'Other',
        wasFetchedViaSpdy: true,
        wasNpnNegotiated: true,
        npnNegotiatedProtocol: 'h2',
        wasAlternateProtocolAvailable: false,
        connectionInfo: 'h2'
      }
    }, 'loadTimes')

    const runtime = {
      OnInstalledReason: Object.freeze({
        CHROME_UPDATE: 'chrome_update',
        INSTALL: 'install',
        SHARED_MODULE_UPDATE: 'shared_module_update',
        UPDATE: 'update'
      }),
      OnRestartRequiredReason: Object.freeze({
        APP_UPDATE: 'app_update',
        OS_UPDATE: 'os_update',
        PERIODIC: 'periodic'
      }),
      PlatformArch: Object.freeze({
        ARM: 'arm',
        ARM64: 'arm64',
        MIPS: 'mips',
        MIPS64: 'mips64',
        X86_32: 'x86-32',
        X86_64: 'x86-64'
      }),
      PlatformNaclArch: Object.freeze({
        ARM: 'arm',
        MIPS: 'mips',
        MIPS64: 'mips64',
        X86_32: 'x86-32',
        X86_64: 'x86-64'
      }),
      PlatformOs: Object.freeze({
        ANDROID: 'android',
        CROS: 'cros',
        LINUX: 'linux',
        MAC: 'mac',
        OPENBSD: 'openbsd',
        WIN: 'win'
      }),
      RequestUpdateCheckStatus: Object.freeze({
        NO_UPDATE: 'no_update',
        THROTTLED: 'throttled',
        UPDATE_AVAILABLE: 'update_available'
      }),
      connect: makeNative(function connect() { throw new Error('Could not establish connection. Receiving end does not exist.') }, 'connect'),
      sendMessage: makeNative(function sendMessage() { throw new Error('Could not establish connection. Receiving end does not exist.') }, 'sendMessage'),
      id: undefined
    }

    return {
      app: app,
      csi: csi,
      loadTimes: loadTimes,
      runtime: runtime
    }
  }

  function applyChromeToTarget(targetWindow) {
    try {
      const chromeObj = buildChromeObject()
      Object.defineProperty(targetWindow, 'chrome', {
        value: chromeObj,
        writable: true,
        enumerable: true,
        configurable: true
      })
    } catch (_) {}
  }

  applyChromeToTarget(window)

  // 3. 彻底消除 navigator.webdriver 自动化标记 (Prototype + Instance 双重清理)
  try {
    const webdriverGetter = makeNative(function webdriver() { return false }, 'get webdriver')
    if (typeof Navigator !== 'undefined' && Navigator.prototype) {
      Object.defineProperty(Navigator.prototype, 'webdriver', {
        get: webdriverGetter,
        enumerable: true,
        configurable: true
      })
    }
    if (typeof navigator !== 'undefined') {
      try { delete navigator.webdriver } catch (_) {}
      Object.defineProperty(navigator, 'webdriver', {
        get: webdriverGetter,
        enumerable: true,
        configurable: true
      })
    }
  } catch (_) {}

  // 4. 原生化 5 插件体系 (Plugins & MimeTypes)
  function applyPluginsToTarget(targetNav) {
    if (!targetNav) return
    try {
      const mimeTypesData = [
        { type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' },
        { type: 'text/pdf', suffixes: 'pdf', description: 'Portable Document Format' }
      ]

      const pluginsData = [
        { name: 'PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format', mime: mimeTypesData },
        { name: 'Chrome PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format', mime: mimeTypesData },
        { name: 'Chromium PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format', mime: mimeTypesData },
        { name: 'Microsoft Edge PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format', mime: mimeTypesData },
        { name: 'WebKit built-in PDF', filename: 'internal-pdf-viewer', description: 'Portable Document Format', mime: mimeTypesData }
      ]

      const mimeTypeArrayProto = (typeof MimeTypeArray !== 'undefined' && MimeTypeArray.prototype) || Object.prototype
      const pluginArrayProto = (typeof PluginArray !== 'undefined' && PluginArray.prototype) || Object.prototype
      const mimeTypeProto = (typeof MimeType !== 'undefined' && MimeType.prototype) || Object.prototype
      const pluginProto = (typeof Plugin !== 'undefined' && Plugin.prototype) || Object.prototype

      const mimeTypeArray = Object.create(mimeTypeArrayProto)
      const pluginArray = Object.create(pluginArrayProto)

      // 建立 MimeType 实例
      const createdMimes = []
      for (let i = 0; i < mimeTypesData.length; i++) {
        const item = mimeTypesData[i]
        const m = Object.create(mimeTypeProto)
        Object.defineProperties(m, {
          type: { value: item.type, enumerable: true },
          suffixes: { value: item.suffixes, enumerable: true },
          description: { value: item.description, enumerable: true },
          enabledPlugin: { get: () => pluginArray[0], enumerable: true }
        })
        createdMimes.push(m)
        mimeTypeArray[i] = m
        mimeTypeArray[item.type] = m
      }
      Object.defineProperty(mimeTypeArray, 'length', { value: createdMimes.length, enumerable: false })
      mimeTypeArray.item = makeNative(function item(index) { return this[index] || null }, 'item')
      mimeTypeArray.namedItem = makeNative(function namedItem(name) { return this[name] || null }, 'namedItem')

      // 建立 Plugin 实例
      const createdPlugins = []
      for (let i = 0; i < pluginsData.length; i++) {
        const pData = pluginsData[i]
        const p = Object.create(pluginProto)
        for (let mIdx = 0; mIdx < createdMimes.length; mIdx++) {
          p[mIdx] = createdMimes[mIdx]
          p[createdMimes[mIdx].type] = createdMimes[mIdx]
        }
        Object.defineProperties(p, {
          name: { value: pData.name, enumerable: true },
          filename: { value: pData.filename, enumerable: true },
          description: { value: pData.description, enumerable: true },
          length: { value: createdMimes.length, enumerable: false }
        })
        p.item = makeNative(function item(index) { return this[index] || null }, 'item')
        p.namedItem = makeNative(function namedItem(name) { return this[name] || null }, 'namedItem')

        createdPlugins.push(p)
        pluginArray[i] = p
        pluginArray[pData.name] = p
      }
      Object.defineProperty(pluginArray, 'length', { value: createdPlugins.length, enumerable: false })
      pluginArray.item = makeNative(function item(index) { return this[index] || null }, 'item')
      pluginArray.namedItem = makeNative(function namedItem(name) { return this[name] || null }, 'namedItem')
      pluginArray.refresh = makeNative(function refresh() {}, 'refresh')

      Object.defineProperty(targetNav, 'plugins', {
        get: makeNative(function plugins() { return pluginArray }, 'get plugins'),
        enumerable: true,
        configurable: true
      })
      Object.defineProperty(targetNav, 'mimeTypes', {
        get: makeNative(function mimeTypes() { return mimeTypeArray }, 'get mimeTypes'),
        enumerable: true,
        configurable: true
      })
    } catch (_) {}
  }

  applyPluginsToTarget(navigator)

  // 5. 规避 Notification 权限查询异常
  try {
    if (window.navigator && window.navigator.permissions) {
      const origQuery = window.navigator.permissions.query
      window.navigator.permissions.query = makeNative(function query(parameters) {
        if (parameters && parameters.name === 'notifications') {
          return Promise.resolve({
            state: window.Notification ? window.Notification.permission : 'default',
            onchange: null,
            addEventListener: makeNative(function addEventListener() {}, 'addEventListener'),
            removeEventListener: makeNative(function removeEventListener() {}, 'removeEventListener'),
            dispatchEvent: makeNative(function dispatchEvent() { return true }, 'dispatchEvent')
          })
        }
        return origQuery.apply(this, arguments)
      }, 'query')
    }
  } catch (_) {}

  // 6. 动态 iframe 原型差分防探测 (Anti-Iframe Prototype Differential)
  try {
    if (typeof HTMLIFrameElement !== 'undefined' && HTMLIFrameElement.prototype) {
      const originalContentWindow = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'contentWindow')
      if (originalContentWindow && originalContentWindow.get) {
        Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
          get: makeNative(function contentWindow() {
            const win = originalContentWindow.get.call(this)
            if (win) {
              try {
                if (!win.chrome) applyChromeToTarget(win)
                if (!win.navigator.plugins || win.navigator.plugins.length === 0) applyPluginsToTarget(win.navigator)
              } catch (_) {}
            }
            return win
          }, 'get contentWindow'),
          enumerable: true,
          configurable: true
        })
      }
    }
  } catch (_) {}
})()
`
}

module.exports = {
  generateStealthScript
}
