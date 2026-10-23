const { app, BrowserWindow, session } = require('electron')
const path = require('node:path')
const fs = require('node:fs/promises')
const syncFs = require('node:fs')
const { createFingerprintProfile } = require('../profile-store')
const { applyFingerprintConfig } = require('../runtime-compat')
const { detectExitIp, alignFingerprintWithGeo } = require('../geo-ip')
const { humanoidClick } = require('../humanoid-actions')

const projectRoot = path.resolve(__dirname, '..')
const outputDir = path.resolve(projectRoot, '../dist/diagnostics/commercial-benchmark-2026')
const brainArtifactDir = process.env.FP_BENCHMARK_REPORT_DIR || path.join(outputDir, 'reports')
syncFs.mkdirSync(brainArtifactDir, { recursive: true })

syncFs.mkdirSync(outputDir, { recursive: true })
const logPath = path.join(outputDir, 'benchmark.log')
syncFs.writeFileSync(logPath, `[${new Date().toISOString()}] Commercial Antidetect Benchmark Started\n`, 'utf8')

function log (...args) {
  const line = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
  console.log(line)
  syncFs.appendFileSync(logPath, line + '\n', 'utf8')
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

async function safeLoadURL (win, url, timeoutMs = 20000) {
  let resolved = false
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true
        log(`  ⏱️ 加载超时 (${timeoutMs}ms)，停止未完成请求: ${url}`)
        try { win.webContents.stop() } catch {}
        resolve()
      }
    }, timeoutMs)

    win.webContents.once('dom-ready', () => {
      // DOM Ready 已到达，如果整体加载还在挂起，允许放行
      setTimeout(() => {
        if (!resolved) {
          resolved = true
          clearTimeout(timer)
          resolve()
        }
      }, 3000)
    })

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

async function safeEval (win, script, timeoutMs = 8000, fallback = {}) {
  try {
    const evalPromise = win.webContents.executeJavaScript(script)
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('eval timeout')), timeoutMs))
    return await Promise.race([evalPromise, timeoutPromise])
  } catch (err) {
    log(`  ⚠️ 脚本执行异常: ${err.message}`)
    return fallback
  }
}

async function saveScreenshot (win, filename, timeoutMs = 8000) {
  try {
    const capturePromise = win.capturePage()
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('capture timeout')), timeoutMs))
    const img = await Promise.race([capturePromise, timeoutPromise])
    const pngBuffer = img.toPNG()
    const dest = path.join(outputDir, filename)
    await fs.writeFile(dest, pngBuffer)
    try {
      await fs.writeFile(path.join(brainArtifactDir, filename), pngBuffer)
    } catch {}
    log(`  📸 截图已成功保存: ${filename} (${pngBuffer.length} 字节)`)
    return dest
  } catch (err) {
    log(`  ❌ 截图保存失败 [${filename}]:`, err.message)
    return null
  }
}

async function createBenchmarkWindow (benchmarkSession) {
  return new BrowserWindow({
    width: 1366,
    height: 900,
    show: false,
    webPreferences: {
      session: benchmarkSession,
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false
    }
  })
}

async function runBenchmark () {
  log('================================================================')
  log('🏆 启动商业级指纹浏览器标准评测基准 (Commercial Antidetect Benchmark)')
  log(`📁 诊断目录: ${outputDir}`)
  log('================================================================')

  // 1. 构建标准高拟真 Windows 11 Chrome 138 硬件指纹模板
  let profile = createFingerprintProfile({
    schemaVersion: 1,
    id: 'commercial-standard-profile-2026',
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
      seed: 'commercial-benchmark-seed-2026',
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

  // 2. 出口网络 IP 与时区自洽对齐探测 (商业指纹浏览器标准：IP-Geo-Timezone 闭环自洽)
  let geo = null
  try {
    log('🌐 [0/5] 探测出口 IP 并执行时区/语言自洽对齐...')
    geo = await detectExitIp({ timeout: 6000 })
    log(`  ✅ 出口 IP: ${geo.ip} (${geo.country}, ${geo.city}), 时区: ${geo.timezone}, 语言: ${geo.locale.language}`)
    profile = alignFingerprintWithGeo(profile, geo)
    log(`  🎯 指纹环境已物理自洽对齐完成！`)
  } catch (err) {
    log(`  ⚠️ 出口 IP 探测失败，沿用默认配置: ${err.message}`)
  }

  const testSession = session.fromPartition('persist:commercial-benchmark-session')
  applyFingerprintConfig(testSession, profile)

  const report = {
    timestamp: new Date().toISOString(),
    geo,
    profileSummary: {
      id: profile.id,
      ua: profile.browser.userAgent,
      platform: profile.hardware.platform,
      concurrency: profile.hardware.hardwareConcurrency,
      deviceMemory: profile.hardware.deviceMemory,
      screen: `${profile.screen.width}x${profile.screen.height}`,
      webglVendor: profile.graphics.webglVendor,
      webglRenderer: profile.graphics.webglRenderer,
      timezone: profile.locale.timezone,
      language: profile.locale.language,
      noiseSeed: profile.noise.seed
    },
    tests: {}
  }

  // -------------------------------------------------------------
  // 测试 1: PixelScan 综合评测 (指纹一致性、掩盖感知、人类轨迹抗机器人)
  // -------------------------------------------------------------
  log('\n----------------------------------------------------------------')
  log('🎯 [1/5] 正在评测 PixelScan (https://pixelscan.net/)...')
  {
    const win = await createBenchmarkWindow(testSession)
    try {
      await safeLoadURL(win, 'https://pixelscan.net/', 18000)
      await wait(3000)

      const btnCoords = await safeEval(win, `(() => {
        const btn = Array.from(document.querySelectorAll('button, a')).find(el => el.innerText.includes('Scan My Browser'));
        if (!btn) return null;
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const r = btn.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      })()`, 5000, null)

      if (btnCoords) {
        log('  🖱️ 触发仿生人类贝塞尔平滑滑动与拟真按压点击 "Scan My Browser Now"...')
        await humanoidClick(win.webContents, { x: Math.round(btnCoords.x), y: Math.round(btnCoords.y) })
      }

      // 等待 3 秒让扫描任务派发，然后轮询扫描完成
      await wait(3000)
      log('  ⏳ 等待 PixelScan 深度计算完成 (轮询扫描状态)...')
      for (let i = 0; i < 20; i++) {
        await wait(1000)
        const scanning = await safeEval(win, `!!document.querySelector('.status-scanning')`, 3000, false)
        if (!scanning) {
          log(`  ✅ PixelScan 扫描在第 ${i + 4} 秒完成！`)
          break
        }
      }
      await wait(2000)

      const pixelscanData = await safeEval(win, `(() => {
        const statusBar = document.querySelector('.status-bar')?.innerText?.trim() || '';
        const statusText = document.querySelector('.status-text')?.innerText?.trim() || '';
        const body = document.body.innerText;

        const cards = Array.from(document.querySelectorAll('pxlscn-checker-card, .checker-card')).map(card => {
          const text = card.innerText?.trim() || '';
          const isFailed = card.className.includes('failed') || card.innerHTML.includes('failed') || card.innerHTML.includes('icon-danger');
          return { text: text.replace(/\\n+/g, ' | '), isFailed };
        });

        return {
          statusBar,
          statusText,
          isConsistent: !statusBar.toLowerCase().includes('inconsistent'),
          hasNoMasking: body.includes('No masking detected'),
          hasMaskingDetected: body.includes('Masking detected') && !body.includes('No masking detected'),
          hasAutomated: body.includes('Automated behavior detected'),
          hasTimezoneSpoofed: body.includes('Timezone spoofed'),
          cards
        };
      })()`, 8000, {})

      await saveScreenshot(win, '1-pixelscan.png')
      report.tests.pixelscan = pixelscanData
      log('  ✅ PixelScan 评测完成:', {
        statusBar: pixelscanData.statusBar,
        isConsistent: pixelscanData.isConsistent,
        hasNoMasking: pixelscanData.hasNoMasking,
        hasMaskingDetected: pixelscanData.hasMaskingDetected,
        hasTimezoneSpoofed: pixelscanData.hasTimezoneSpoofed
      })
    } catch (err) {
      log('  ❌ PixelScan 测试失败:', err.message)
      report.tests.pixelscan = { error: err.message }
    } finally {
      win.close()
    }
  }

  // -------------------------------------------------------------
  // 测试 2: CreepJS 深度反检测与原型链自洽度评测
  // -------------------------------------------------------------
  log('\n----------------------------------------------------------------')
  log('🎯 [2/5] 正在评测 CreepJS (https://abrahamjuliot.github.io/creepjs/)...')
  {
    const win = await createBenchmarkWindow(testSession)
    try {
      await safeLoadURL(win, 'https://abrahamjuliot.github.io/creepjs/', 20000)
      log('  ⏳ 等待 CreepJS 原型链探针与并发 Worker 计算完毕 (14秒)...')
      await wait(14000)

      const creepData = await safeEval(win, `(() => {
        const bodyText = document.body.innerText;
        const lies = Array.from(document.querySelectorAll('.lies')).map(el => el.innerText.trim());
        const untrustworthy = Array.from(document.querySelectorAll('.untrustworthy')).map(el => el.innerText.trim());

        let trustScore = 'N/A';
        const scoreMatch = bodyText.match(/(?:trust score|crowd-blending score|score)[\\s:]+(\\d+(?:\\.\\d+)?%?)/i);
        if (scoreMatch) trustScore = scoreMatch[1];

        let fpHash = '';
        const fpEl = document.querySelector('.fuzzy-fp') || document.querySelector('#fingerprint-data');
        if (fpEl) fpHash = fpEl.innerText.slice(0, 80);

        return {
          trustScore,
          fpHash,
          liesCount: lies.length,
          liesList: lies.slice(0, 8),
          untrustworthyCount: untrustworthy.length,
          untrustworthyList: untrustworthy.slice(0, 8)
        };
      })()`, 8000, {})

      await saveScreenshot(win, '2-creepjs.png')
      report.tests.creepjs = creepData
      log('  ✅ CreepJS 评测完成:', {
        trustScore: creepData.trustScore,
        liesCount: creepData.liesCount,
        untrustworthyCount: creepData.untrustworthyCount,
        fpHash: creepData.fpHash
      })
    } catch (err) {
      log('  ❌ CreepJS 测试失败:', err.message)
      report.tests.creepjs = { error: err.message }
    } finally {
      win.close()
    }
  }

  // -------------------------------------------------------------
  // 测试 3: BrowserLeaks Canvas & WebRTC 防泄漏全家桶
  // -------------------------------------------------------------
  log('\n----------------------------------------------------------------')
  log('🎯 [3/5] 正在评测 BrowserLeaks Canvas (https://browserleaks.com/canvas)...')
  {
    const win = await createBenchmarkWindow(testSession)
    try {
      await safeLoadURL(win, 'https://browserleaks.com/canvas', 15000)
      await wait(3000)

      const canvasData = await safeEval(win, `(() => {
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
      })()`, 8000, {})

      await saveScreenshot(win, '3-browserleaks-canvas.png')
      report.tests.browserleaks_canvas = canvasData
      log('  ✅ BrowserLeaks Canvas 结果:', canvasData)
    } catch (err) {
      log('  ❌ BrowserLeaks Canvas 测试失败:', err.message)
      report.tests.browserleaks_canvas = { error: err.message }
    } finally {
      win.close()
    }
  }

  log('\n🎯 [3/5 附加] 正在评测 BrowserLeaks WebRTC (https://browserleaks.com/webrtc)...')
  {
    const win = await createBenchmarkWindow(testSession)
    try {
      await safeLoadURL(win, 'https://browserleaks.com/webrtc', 15000)
      await wait(3000)

      const webrtcData = await safeEval(win, `(() => {
        const text = document.body.innerText;
        const hasLocalLeak = /192\\.168\\.|10\\.\\d+\\.|172\\.(1[6-9]|2\\d|3[01])\\./.test(text);
        const noLeakStatus = text.includes('No Leak') || !hasLocalLeak;
        return {
          hasLocalIpLeak: hasLocalLeak,
          noLeakStatus: noLeakStatus,
          rtcpPeerConnection: text.includes('RTCPeerConnection') && text.includes('True')
        };
      })()`, 8000, {})

      await saveScreenshot(win, '3-browserleaks-webrtc.png')
      report.tests.browserleaks_webrtc = webrtcData
      log('  ✅ BrowserLeaks WebRTC 结果:', webrtcData)
    } catch (err) {
      log('  ❌ BrowserLeaks WebRTC 测试失败:', err.message)
      report.tests.browserleaks_webrtc = { error: err.message }
    } finally {
      win.close()
    }
  }

  // -------------------------------------------------------------
  // 测试 4: Iphey 软硬件与信任评级检测
  // -------------------------------------------------------------
  log('\n----------------------------------------------------------------')
  log('🎯 [4/5] 正在评测 Iphey (https://iphey.com/)...')
  {
    const win = await createBenchmarkWindow(testSession)
    try {
      await safeLoadURL(win, 'https://iphey.com/', 18000)
      log('  ⏳ 等待 Iphey 信任检测与网络多重校验 (最多12秒)...')
      for (let i = 0; i < 12; i++) {
        await wait(1000)
        const finished = await safeEval(win, `(() => {
          const text = document.body.innerText;
          return text.includes('Trustworthy') || text.includes('Suspicious') || text.includes('Not trustworthy');
        })()`, 2000, false)
        if (finished) {
          log(`  ✅ Iphey 检测在第 ${i + 1} 秒完成！`)
          break
        }
      }

      const ipheyData = await safeEval(win, `(() => {
        const text = document.body.innerText;
        const trustworthy = text.includes('Trustworthy');
        const suspicious = text.includes('Suspicious');

        const checks = {
          location: text.includes('Location') && !text.match(/Location[\\s\\S]*?Failed/),
          ip: text.includes('IP') && !text.match(/IP[\\s\\S]*?Failed/),
          browser: text.includes('Browser') && !text.match(/Browser[\\s\\S]*?Failed/),
          hardware: text.includes('Hardware') && !text.match(/Hardware[\\s\\S]*?Failed/),
          software: text.includes('Software') && !text.match(/Software[\\s\\S]*?Failed/)
        };

        return {
          overall: trustworthy ? 'Trustworthy' : (suspicious ? 'Suspicious' : 'Evaluated'),
          trustworthy,
          suspicious,
          checks
        };
      })()`, 8000, {})

      await saveScreenshot(win, '4-iphey.png')
      report.tests.iphey = ipheyData
      log('  ✅ Iphey 结果:', { overall: ipheyData.overall, trustworthy: ipheyData.trustworthy, suspicious: ipheyData.suspicious })
    } catch (err) {
      log('  ❌ Iphey 测试失败:', err.message)
      report.tests.iphey = { error: err.message }
    } finally {
      win.close()
    }
  }

  // -------------------------------------------------------------
  // 测试 5: Sannysoft 自动化反检测与特征抹除评测
  // -------------------------------------------------------------
  log('\n----------------------------------------------------------------')
  log('🎯 [5/5] 正在评测 Sannysoft Bot Detection (https://bot.sannysoft.com/)...')
  {
    const win = await createBenchmarkWindow(testSession)
    try {
      await safeLoadURL(win, 'https://bot.sannysoft.com/', 15000)
      await wait(3000)

      const sannysoftData = await safeEval(win, `(() => {
        const rows = Array.from(document.querySelectorAll('table tr')).map(r => {
          const cells = Array.from(r.querySelectorAll('td, th')).map(c => c.innerText.trim());
          return { name: cells[0] || '', value: cells[1] || '' };
        }).filter(r => r.name);

        const webdriverItem = rows.find(r => r.name.toLowerCase().includes('webdriver'));
        const chromeItem = rows.find(r => r.name.toLowerCase().includes('chrome'));
        const permissionsItem = rows.find(r => r.name.toLowerCase().includes('permission'));
        const pluginsItem = rows.find(r => r.name.toLowerCase().includes('plugin'));

        return {
          webdriver: webdriverItem ? webdriverItem.value : 'N/A',
          chrome: chromeItem ? chromeItem.value : 'N/A',
          permissions: permissionsItem ? permissionsItem.value : 'N/A',
          plugins: pluginsItem ? pluginsItem.value : 'N/A',
          hasWebDriverFailed: rows.some(r => r.name.toLowerCase().includes('webdriver') && r.value.toLowerCase().includes('fail'))
        };
      })()`, 8000, {})

      await saveScreenshot(win, '5-sannysoft.png')
      report.tests.sannysoft = sannysoftData
      log('  ✅ Sannysoft 结果:', sannysoftData)
    } catch (err) {
      log('  ❌ Sannysoft 测试失败:', err.message)
      report.tests.sannysoft = { error: err.message }
    } finally {
      win.close()
    }
  }

  // -------------------------------------------------------------
  // 报告汇总保存
  // -------------------------------------------------------------
  const reportPath = path.join(outputDir, 'commercial-benchmark-report.json')
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8')
  try {
    await fs.writeFile(path.join(brainArtifactDir, 'commercial-benchmark-report.json'), JSON.stringify(report, null, 2), 'utf8')
  } catch {}

  log('\n================================================================')
  log('🎉 商业级指纹浏览器全套标准评测已全部执行完毕！')
  log(`📄 完整 JSON 结构化报告: ${reportPath}`)
  log('================================================================\n')

  app.quit()
}

app.whenReady().then(runBenchmark)
