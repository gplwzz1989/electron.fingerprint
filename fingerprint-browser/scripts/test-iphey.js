const { app, BrowserWindow, session } = require('electron')
const path = require('node:path')
const fs = require('node:fs/promises')
const { createFingerprintProfile } = require('../profile-store')
const { applyFingerprintConfig } = require('../runtime-compat')

const outputDir = path.resolve(__dirname, '../../dist/diagnostics/public-detectors')

const testFingerprint = createFingerprintProfile({
  schemaVersion: 1,
  id: 'benchmark-win11-standard',
  enabled: true,
  browser: {
    family: 'Chrome',
    chromiumMajor: 138,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
    acceptLanguage: 'zh-CN,zh;q=0.9,en;q=0.8'
  },
  locale: {
    language: 'zh-CN',
    languages: ['zh-CN', 'zh', 'en'],
    timezone: 'Asia/Shanghai'
  },
  hardware: {
    hardwareConcurrency: 8,
    deviceMemory: 8,
    platform: 'Win32'
  },
  screen: {
    width: 1920,
    height: 1080,
    availWidth: 1920,
    availHeight: 1040,
    deviceScaleFactor: 1
  },
  graphics: {
    webglVendor: 'Google Inc. (Intel)',
    webglRenderer: 'ANGLE (Intel, Intel(R) UHD Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)'
  },
  noise: {
    seed: 'benchmark-seed-stable-2026',
    canvas: true,
    audio: true,
    rects: true
  },
  modules: {
    ua: true,
    clientHints: true,
    locale: true,
    timezone: true,
    navigator: true,
    screen: true,
    webgl: true,
    canvas: true,
    audio: true,
    fonts: true,
    webrtc: true,
    runtimeInspector: false
  }
})

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

async function runIphey () {
  const testSession = session.fromPartition('persist:benchmark-session-iphey')
  applyFingerprintConfig(testSession, testFingerprint)

  const win = new BrowserWindow({
    width: 1366,
    height: 900,
    show: true,
    webPreferences: {
      session: testSession,
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  })

  console.log('Navigating to Iphey...')
  try {
    // 监听 dom-ready
    const domReadyPromise = new Promise(resolve => win.webContents.once('dom-ready', resolve))
    win.loadURL('https://iphey.com/').catch(err => console.log('loadURL caught:', err.message))
    await Promise.race([domReadyPromise, wait(15000)])
    console.log('DOM Ready reached or timeout, waiting for Iphey inspection (12s)...')
    await wait(12000)

    const img = await win.capturePage()
    await fs.writeFile(path.join(outputDir, '4-iphey.png'), img.toPNG())
    console.log('Saved screenshot 4-iphey.png')

    const ipheyData = await win.webContents.executeJavaScript(`(() => {
      const body = document.body.innerText;
      return {
        bodySnippet: body.slice(0, 1500)
      };
    })()`)
    console.log('Iphey snippet:', ipheyData)
  } catch (e) {
    console.error('Iphey error:', e.message)
  }

  win.close()
  app.quit()
}

app.whenReady().then(runIphey)
