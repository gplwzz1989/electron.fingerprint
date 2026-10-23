const { app, BrowserWindow, session } = require('electron')
const { createFingerprintProfile } = require('../profile-store')
const { applyFingerprintConfig } = require('../runtime-compat')

app.whenReady().then(async () => {
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
      pluginsCount: navigator.plugins?.length || 0,
      languages: Array.from(navigator.languages || []),
      domAutomation: !!window.domAutomation || !!window.domAutomationController,
      userAgentData: !!navigator.userAgentData,
      permissionsQuery: typeof navigator.permissions?.query
    };
  })()`)
  console.log('Bot flags in session:', JSON.stringify(flags, null, 2))
  win.close()
  app.quit()
})
