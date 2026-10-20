const { app, BrowserWindow, session } = require('electron')
const path = require('node:path')
const fs = require('node:fs/promises')
const { createFingerprintProfile } = require('../profile-store')
const { applyFingerprintConfig } = require('../runtime-compat')
const { detectExitIp, alignFingerprintWithGeo } = require('../geo-ip')
const { humanoidClick } = require('../humanoid-actions')

const outputDir = path.resolve(__dirname, '../../dist/diagnostics/public-detectors')
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

async function runPixelScanV2 () {
  console.log('================================================================')
  console.log('🚀 开始第一阶段实战验证: IP时区自动对齐 + 仿生人类轨迹点击 PixelScan')
  console.log('================================================================')

  // 1. 基础 Windows 11 指纹模板
  let baseFingerprint = createFingerprintProfile({
    schemaVersion: 1,
    id: 'benchmark-win11-v2',
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
      timezone: 'America/Los_Angeles' // 初始预设
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
      seed: 'benchmark-seed-v2-auto-align',
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

  // 2. 动态探测出口 IP 并自动对齐时区与语言
  try {
    console.log('🌐 正在探测公网出口 IP 归属地...')
    const geo = await detectExitIp({ timeout: 6000 })
    console.log(`  ✅ 成功识别出口 IP: ${geo.ip} (${geo.country}, ${geo.city}) 时区: ${geo.timezone}`)
    baseFingerprint = alignFingerprintWithGeo(baseFingerprint, geo)
    console.log(`  🎯 指纹配置已自动自洽对齐: 时区 -> ${baseFingerprint.locale.timezone}, 语言 -> ${baseFingerprint.locale.language}`)
  } catch (err) {
    console.warn('  ⚠️ GeoIP 探测失败，使用默认洛杉矶时区:', err.message)
  }

  const testSession = session.fromPartition('persist:pixelscan-v2-session')
  applyFingerprintConfig(testSession, baseFingerprint)

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

  console.log('\n[1/2] 正在加载 PixelScan (https://pixelscan.net/)...')
  await win.loadURL('https://pixelscan.net/')
  await wait(4000)

  console.log('[2/2] 正在使用仿生人类贝塞尔轨迹与物理按压点击 "Scan My Browser Now" 按钮...')
  try {
    // 寻找按钮并使用仿生人类引擎点击
    const btnCoords = await win.webContents.executeJavaScript(`(() => {
      const btn = Array.from(document.querySelectorAll('button, a')).find(el => el.innerText.includes('Scan My Browser'));
      if (!btn) return null;
      btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, width: r.width, height: r.height };
    })()`)

    if (btnCoords) {
      await wait(1000)
      console.log('  🖱️ 启动仿生轨迹平滑滑动与拟真按压...')
      await humanoidClick(win.webContents, { x: Math.round(btnCoords.x), y: Math.round(btnCoords.y) })
      console.log('  ✅ 仿生点击已触发！')
    } else {
      console.log('  ⚠️ 未找到按钮，执行降级点击')
      await win.webContents.executeJavaScript(`document.querySelector('button')?.click()`)
    }
  } catch (e) {
    console.error('  ❌ 仿生点击失败:', e.message)
  }

  console.log('⏳ 等待 PixelScan 扫描完成 (12s)...')
  await wait(12000)

  const result = await win.webContents.executeJavaScript(`(() => {
    const body = document.body.innerText;
    return {
      bodySnippet: body.slice(0, 1500),
      hasTimezoneSpoofed: body.includes('Timezone spoofed'),
      hasAutomated: body.includes('Automated behavior detected'),
      isConsistent: body.includes('consistent') || body.includes('No fingerprint inconsistencies')
    };
  })()`)

  console.log('\n📊 扫描结果摘要:', {
    hasTimezoneSpoofed: result.hasTimezoneSpoofed,
    hasAutomated: result.hasAutomated,
    isConsistent: result.isConsistent
  })

  const img = await win.capturePage()
  await fs.writeFile(path.join(outputDir, '3-pixelscan-v2.png'), img.toPNG())
  console.log(`📸 新截图已成功保存至: ${path.join(outputDir, '3-pixelscan-v2.png')}`)

  win.close()
  app.quit()
}

app.whenReady().then(runPixelScanV2)
