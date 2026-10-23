const { app, BrowserWindow, session } = require('electron')
const path = require('node:path')
const fs = require('node:fs/promises')
const { createFingerprintProfile } = require('../profile-store')
const { applyFingerprintConfig } = require('../runtime-compat')
const { detectExitIp, alignFingerprintWithGeo } = require('../geo-ip')
const { humanoidClick } = require('../humanoid-actions')

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

async function runInspect () {
  let profile = createFingerprintProfile({
    schemaVersion: 1,
    id: 'benchmark-inspect',
    enabled: true,
    browser: {
      family: 'Chrome',
      chromiumMajor: 138,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
      acceptLanguage: 'en-US,en;q=0.9'
    },
    locale: {
      language: 'en-US',
      languages: ['en-US', 'en'],
      timezone: 'America/Los_Angeles'
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
      seed: 'benchmark-inspect-seed',
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

  const geo = await detectExitIp({ timeout: 5000 })
  profile = alignFingerprintWithGeo(profile, geo)

  const ses = session.fromPartition('persist:benchmark-inspect')
  applyFingerprintConfig(ses, profile)

  const win = new BrowserWindow({
    width: 1366,
    height: 900,
    show: false,
    webPreferences: {
      session: ses,
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  })

  console.log('Loading PixelScan...')
  await win.loadURL('https://pixelscan.net/')
  await wait(3000)

  const btnCoords = await win.webContents.executeJavaScript(`(() => {
    const btn = Array.from(document.querySelectorAll('button, a')).find(el => el.innerText.includes('Scan My Browser'));
    if (!btn) return null;
    btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const r = btn.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`)

  if (btnCoords) {
    console.log('Clicking button with humanoid actions...')
    await humanoidClick(win.webContents, { x: Math.round(btnCoords.x), y: Math.round(btnCoords.y) })
  }

  console.log('Waiting for scan to complete (checking .status-scanning)...')
  let completed = false
  for (let i = 0; i < 30; i++) {
    await wait(1000)
    const isScanning = await win.webContents.executeJavaScript(`!!document.querySelector('.status-scanning')`)
    if (!isScanning) {
      console.log(`Scan completed in ${i + 1}s!`)
      completed = true
      break
    }
  }

  // 额外缓冲 2 秒让 UI 渲染完毕
  await wait(2000)

  const analysis = await win.webContents.executeJavaScript(`(() => {
    const statusBar = document.querySelector('.status-bar')?.innerText?.trim() || '';
    const statusText = document.querySelector('.status-text')?.innerText?.trim() || '';
    
    // 获取各卡片
    const cards = Array.from(document.querySelectorAll('pxlscn-checker-card, .checker-card')).map(card => {
      const text = card.innerText?.trim() || '';
      const isFailed = card.className.includes('failed') || card.innerHTML.includes('failed') || card.innerHTML.includes('icon-danger');
      return { text: text.replace(/\\n+/g, ' | '), isFailed };
    });

    const bodyText = document.body.innerText;

    return {
      statusBar,
      statusText,
      hasConsistent: bodyText.includes('consistent') || bodyText.includes('No fingerprint inconsistencies'),
      hasMasking: bodyText.includes('Masking detected'),
      hasAutomated: bodyText.includes('Automated behavior detected'),
      hasNoAutomated: bodyText.includes('No automated behavior detected'),
      hasTimezoneSpoofed: bodyText.includes('Timezone spoofed'),
      cards,
      bodySample: bodyText.slice(0, 1500)
    };
  })()`)

  console.log('=== PIXELSCAN FINAL RESULT ===')
  console.log('Status Bar:', analysis.statusBar)
  console.log('Status Text:', analysis.statusText)
  console.log('Flags:', {
    hasConsistent: analysis.hasConsistent,
    hasMasking: analysis.hasMasking,
    hasAutomated: analysis.hasAutomated,
    hasNoAutomated: analysis.hasNoAutomated,
    hasTimezoneSpoofed: analysis.hasTimezoneSpoofed
  })
  console.log('Cards:', JSON.stringify(analysis.cards, null, 2))

  const img = await win.capturePage()
  const imgDir = path.resolve(__dirname, '../../dist/diagnostics/commercial-benchmark-2026')
  await fs.mkdir(imgDir, { recursive: true })
  const imgPath = path.join(imgDir, 'pixelscan-complete.png')
  await fs.writeFile(imgPath, img.toPNG())
  console.log('Saved screenshot to:', imgPath)

  win.close()
  app.quit()
}

app.whenReady().then(runInspect)
