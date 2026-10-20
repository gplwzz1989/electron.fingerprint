const { app, BrowserWindow, session } = require('electron')
const path = require('node:path')
const fs = require('node:fs/promises')
const syncFs = require('node:fs')
const { createFingerprintProfile } = require('../profile-store')
const { applyFingerprintConfig } = require('../runtime-compat')

const outputDir = path.resolve(__dirname, '../../dist/diagnostics/public-detectors')
syncFs.mkdirSync(outputDir, { recursive: true })
const logPath = path.join(outputDir, 'run.log')
syncFs.writeFileSync(logPath, `[${new Date().toISOString()}] Benchmark started\n`, 'utf8')

function log (...args) {
  const line = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
  console.log(line)
  syncFs.appendFileSync(logPath, line + '\n', 'utf8')
}

process.on('uncaughtException', (err) => {
  log('FATAL uncaughtException:', err.stack || err.message)
})

process.on('unhandledRejection', (reason) => {
  log('FATAL unhandledRejection:', reason)
})

// 构建一个标准的 Windows 11 · 1080p · Intel UHD 核显高拟真指纹配置
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

function safeLoadURL (win, url, timeoutMs = 15000) {
  return new Promise((resolve) => {
    let resolved = false
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true
        log(`  ⏱️ 加载超时 (${timeoutMs}ms)，强行进入后续处理: ${url}`)
        resolve()
      }
    }, timeoutMs)

    win.loadURL(url).then(() => {
      if (!resolved) {
        resolved = true
        clearTimeout(timer)
        resolve()
      }
    }).catch((err) => {
      if (!resolved) {
        resolved = true
        clearTimeout(timer)
        log(`  ⚠️ 加载报错: ${err.message}`)
        resolve()
      }
    })
  })
}

async function saveScreenshot (win, filename) {
  try {
    const image = await win.capturePage()
    const pngBuffer = image.toPNG()
    await fs.writeFile(path.join(outputDir, filename), pngBuffer)
    log(`  📸 截图已成功保存: ${filename} (${pngBuffer.length} 字节)`)
  } catch (err) {
    log(`  ❌ 截图保存失败 [${filename}]:`, err.message)
  }
}

async function runBenchmark () {
  log('================================================================')
  log('🚀 开始四大公网权威指纹测试网站跑测...')
  log(`📁 诊断产物与截图目录: ${outputDir}`)
  log('================================================================')

  const testSession = session.fromPartition('persist:benchmark-session')
  applyFingerprintConfig(testSession, testFingerprint)

  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    show: true,
    webPreferences: {
      session: testSession,
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  })

  const results = {}

  // -------------------------------------------------------------
  // 1. BrowserLeaks 测试 (Canvas & WebGL & WebRTC)
  // -------------------------------------------------------------
  log('\n[1/4] 正在评测 BrowserLeaks Canvas (https://browserleaks.com/canvas)...')
  try {
    await safeLoadURL(win, 'https://browserleaks.com/canvas', 15000)
    await wait(3000)
    const browserLeaksData = await win.webContents.executeJavaScript(`(() => {
      const text = document.body.innerText;
      const signatureMatch = text.match(/Signature\\s*[:：]\\s*([A-F0-9]+)/i);
      const uniquenessMatch = text.match(/Uniqueness\\s*[:：]\\s*([^\\n]+)/i);
      return {
        signature: signatureMatch ? signatureMatch[1] : 'Found',
        uniqueness: uniquenessMatch ? uniquenessMatch[1].trim() : 'Unique',
        hasCanvas2D: text.includes('Canvas 2D API') && text.includes('True'),
        hasTextAPI: text.includes('Text API for Canvas') && text.includes('True'),
        hasToDataURL: text.includes('Canvas toDataURL') && text.includes('True')
      };
    })()`)
    await saveScreenshot(win, '1-browserleaks-canvas.png')
    results.browserleaks_canvas = browserLeaksData
    log('  ✅ BrowserLeaks Canvas 评测数据:', browserLeaksData)
  } catch (err) {
    log('  ❌ BrowserLeaks Canvas 测试失败:', err.message)
    results.browserleaks_canvas = { error: err.message }
  }

  log('\n[1/4 附加] 正在评测 BrowserLeaks WebRTC (https://browserleaks.com/webrtc)...')
  try {
    await safeLoadURL(win, 'https://browserleaks.com/webrtc', 15000)
    await wait(3000)
    const webrtcData = await win.webContents.executeJavaScript(`(() => {
      const text = document.body.innerText;
      const hasLeak = /192\\.168\\.|10\\.\\d+\\.|172\\.(1[6-9]|2\\d|3[01])\\./.test(text);
      const noLeakStatus = text.includes('No Leak');
      return {
        hasLocalIpLeak: hasLeak,
        noLeakStatus: noLeakStatus,
        rtcpPeerConnection: text.includes('RTCPeerConnection') && text.includes('True')
      };
    })()`)
    await saveScreenshot(win, '1-browserleaks-webrtc.png')
    results.browserleaks_webrtc = webrtcData
    log('  ✅ BrowserLeaks WebRTC 评测数据:', webrtcData)
  } catch (err) {
    log('  ❌ BrowserLeaks WebRTC 测试失败:', err.message)
    results.browserleaks_webrtc = { error: err.message }
  }

  // -------------------------------------------------------------
  // 2. CreepJS 测试 (原型链、谎言检测、自洽性)
  // -------------------------------------------------------------
  log('\n[2/4] 正在评测 CreepJS (https://abrahamjuliot.github.io/creepjs/)...')
  try {
    await safeLoadURL(win, 'https://abrahamjuliot.github.io/creepjs/', 20000)
    log('  ⏳ 等待 CreepJS 指纹计算与原型链探针执行完毕 (10秒)...')
    await wait(10000)
    const creepResult = await win.webContents.executeJavaScript(`(() => {
      const bodyText = document.body.innerText;
      const lies = Array.from(document.querySelectorAll('.lies')).map(el => el.innerText.trim());
      const errors = Array.from(document.querySelectorAll('.untrustworthy')).map(el => el.innerText.trim());
      
      // 提取 Trust Score
      let trustScore = 'N/A';
      const scoreMatch = bodyText.match(/(?:trust score|crowd-blending score|score)[\\s:]+(\\d+(?:\\.\\d+)?%?)/i);
      if (scoreMatch) trustScore = scoreMatch[1];
      
      // 提取指纹特征哈希
      let fpHash = '';
      const fpEl = document.querySelector('.fuzzy-fp') || document.querySelector('#fingerprint-data');
      if (fpEl) fpHash = fpEl.innerText.slice(0, 100);

      return {
        trustScore,
        fpHash,
        liesCount: lies.length,
        liesList: lies.slice(0, 5),
        errorsCount: errors.length,
        errorsList: errors.slice(0, 5),
        hasWorker: bodyText.includes('worker:'),
        hasCanvas: bodyText.includes('canvas:'),
        hasWebGL: bodyText.includes('webgl:')
      };
    })()`)
    await saveScreenshot(win, '2-creepjs.png')
    results.creepjs = creepResult
    log('  ✅ CreepJS 评测完成: TrustScore =', creepResult?.trustScore, 'liesCount =', creepResult?.liesCount)
  } catch (err) {
    log('  ❌ CreepJS 测试失败:', err.message)
    results.creepjs = { error: err.message }
  }

  // -------------------------------------------------------------
  // 3. PixelScan 测试 (一致性、自然噪点、反检测)
  // -------------------------------------------------------------
  log('\n[3/4] 正在评测 PixelScan (https://pixelscan.net/)...')
  try {
    await safeLoadURL(win, 'https://pixelscan.net/', 20000)
    log('  ⏳ 等待 PixelScan 进行软硬件一致性与后台 API 验证 (10秒)...')
    await wait(10000)
    const pixelscanResult = await win.webContents.executeJavaScript(`(() => {
      const body = document.body.innerText;
      const h1 = document.querySelector('h1')?.innerText?.trim() || '';
      const isConsistent = body.includes('consistent') || body.includes('No fingerprint inconsistencies detected');
      const hasIssues = body.includes('Inconsistent') || body.includes('issues detected');
      
      return {
        header: h1,
        isConsistent,
        hasIssues,
        textSnippet: body.slice(0, 1200)
      };
    })()`)
    await saveScreenshot(win, '3-pixelscan.png')
    results.pixelscan = pixelscanResult
    log('  ✅ PixelScan 评测数据: isConsistent =', pixelscanResult?.isConsistent, 'hasIssues =', pixelscanResult?.hasIssues)
  } catch (err) {
    log('  ❌ PixelScan 测试失败:', err.message)
    results.pixelscan = { error: err.message }
  }

  // -------------------------------------------------------------
  // 4. Iphey 测试 (软硬件自洽度、信任评估)
  // -------------------------------------------------------------
  log('\n[4/4] 正在评测 Iphey (https://iphey.com/)...')
  try {
    await safeLoadURL(win, 'https://iphey.com/', 20000)
    log('  ⏳ 等待 Iphey 进行信任检测与反检测校验 (8秒)...')
    await wait(8000)
    const ipheyResult = await win.webContents.executeJavaScript(`(() => {
      const body = document.body.innerText;
      const trustworthy = body.includes('Trustworthy');
      const suspicious = body.includes('Suspicious');
      
      // 检测子模块状态
      const checks = {
        location: body.includes('Location') && !body.match(/Location[\\s\\S]*?Failed/),
        ip: body.includes('IP') && !body.match(/IP[\\s\\S]*?Failed/),
        browser: body.includes('Browser') && !body.match(/Browser[\\s\\S]*?Failed/),
        hardware: body.includes('Hardware') && !body.match(/Hardware[\\s\\S]*?Failed/),
        software: body.includes('Software') && !body.match(/Software[\\s\\S]*?Failed/)
      };

      return {
        overall: trustworthy ? 'Trustworthy' : (suspicious ? 'Suspicious' : 'Evaluated'),
        trustworthy,
        suspicious,
        checks,
        textSnippet: body.slice(0, 1200)
      };
    })()`)
    await saveScreenshot(win, '4-iphey.png')
    results.iphey = ipheyResult
    log('  ✅ Iphey 评测完成: overall =', ipheyResult?.overall)
  } catch (err) {
    log('  ❌ Iphey 测试失败:', err.message)
    results.iphey = { error: err.message }
  }

  // 写入 JSON 报告
  await fs.writeFile(path.join(outputDir, 'report.json'), JSON.stringify(results, null, 2), 'utf8')
  log('\n================================================================')
  log('🎉 四大公网权威检测站自动化跑测全部完成！')
  log(`📄 完整结果汇总已保存至: ${path.join(outputDir, 'report.json')}`)
  log('================================================================\n')

  win.close()
  app.quit()
}

app.whenReady().then(runBenchmark)
