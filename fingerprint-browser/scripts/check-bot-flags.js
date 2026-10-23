const { app, BrowserWindow, session } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const { createFingerprintProfile } = require('../profile-store')
const { applyFingerprintConfig } = require('../runtime-compat')

const resultFile = process.env.FP_BOT_FLAGS_OUT || path.resolve(__dirname, '..', 'bot-flags-result.json')

app.whenReady().then(async () => {
  try {
    const profile = createFingerprintProfile({ schemaVersion: 1, id: 'test-bot-flags', enabled: true, modules: { navigator: true, runtimeInspector: false } })
    const ses = session.fromPartition('persist:test-bot-flags')
    applyFingerprintConfig(ses, profile)
    const win = new BrowserWindow({ show: false, webPreferences: { session: ses } })
    await win.loadURL('about:blank')
    const flags = await win.webContents.executeJavaScript(`(() => {
      return {
        webdriver: navigator.webdriver,
        webdriverInProto: 'webdriver' in Navigator.prototype,
        hasChrome: !!window.chrome,
        chromeKeys: window.chrome ? Object.keys(window.chrome) : [],
        hasCsi: !!window.chrome?.csi,
        hasLoadTimes: !!window.chrome?.loadTimes,
        hasApp: !!window.chrome?.app,
        pluginsCount: navigator.plugins?.length || 0,
        languages: Array.from(navigator.languages || []),
        domAutomation: !!window.domAutomation || !!window.domAutomationController,
        userAgentData: !!navigator.userAgentData,
        permissionsQuery: typeof navigator.permissions?.query
      };
    })()`)
    fs.writeFileSync(resultFile, JSON.stringify(flags, null, 2))
    console.log('Bot flags written to:', resultFile)
    win.close()
  } catch (err) {
    console.error('检测失败:', err)
  } finally {
    app.quit()
  }
})
