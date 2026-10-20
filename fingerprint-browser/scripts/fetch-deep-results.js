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

async function runDeep () {
  const testSession = session.fromPartition('persist:deep-session')
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

  // 1. CreepJS 深度明细
  console.log('[1/2] Fetching CreepJS deep details...')
  try {
    await win.loadURL('https://abrahamjuliot.github.io/creepjs/')
    await wait(14000)
    const creepDetails = await win.webContents.executeJavaScript(`(() => {
      const liesElements = Array.from(document.querySelectorAll('.lies'));
      const lies = liesElements.map(el => ({
        text: el.innerText.trim(),
        parent: el.parentElement?.innerText?.slice(0, 150)
      }));
      const untrustworthy = Array.from(document.querySelectorAll('.untrustworthy')).map(el => el.innerText.trim());
      const body = document.body.innerText;
      const score = body.match(/trust score[\\s:]*(\\d+%?)/i)?.[1] || body.match(/(\\d+%)[\\s]*trust/i)?.[1] || 'N/A';
      return { score, lies, untrustworthy, bodySnippet: body.slice(0, 2000) };
    })()`)
    await fs.writeFile(path.join(outputDir, 'creepjs-details.json'), JSON.stringify(creepDetails, null, 2), 'utf8')
    console.log('CreepJS details saved, score:', creepDetails.score, 'lies count:', creepDetails.lies.length)
  } catch (err) {
    console.error('CreepJS detail failed:', err.message)
  }

  // 2. Iphey 等待完整渲染
  console.log('[2/2] Fetching Iphey final status (25s wait)...')
  try {
    await win.loadURL('https://iphey.com/')
    for (let i = 0; i < 25; i++) {
      await wait(1000)
      const isDone = await win.webContents.executeJavaScript(`(() => {
        const text = document.body.innerText;
        return text.includes('Trustworthy') || text.includes('Suspicious') || text.includes('Not trustworthy');
      })()`)
      if (isDone) {
        console.log(\`Iphey finished in \${i+1}s!\`)
        break
      }
    }
    const ipheyData = await win.webContents.executeJavaScript(`(() => {
      const text = document.body.innerText;
      return {
        trustworthy: text.includes('Trustworthy'),
        suspicious: text.includes('Suspicious'),
        bodySnippet: text.slice(0, 2000)
      };
    })()`)
    const img = await win.capturePage()
    await fs.writeFile(path.join(outputDir, '4-iphey.png'), img.toPNG())
    await fs.writeFile(path.join(outputDir, 'iphey-details.json'), JSON.stringify(ipheyData, null, 2), 'utf8')
    console.log('Iphey final result saved:', ipheyData.trustworthy ? 'Trustworthy' : (ipheyData.suspicious ? 'Suspicious' : 'Other'))
  } catch (err) {
    console.error('Iphey final failed:', err.message)
  }

  win.close()
  app.quit()
}

app.whenReady().then(runDeep)
