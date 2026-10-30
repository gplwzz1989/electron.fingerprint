// 导航隔离验收：仅提供测试 HTTP 页面及未登录响应，不访问正式用户会话和数据库。
const { app, BrowserWindow } = require('electron/main')
const fs = require('node:fs')
const path = require('node:path')
const http = require('node:http')
const os = require('node:os')
const assert = require('node:assert/strict')
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'environment-navigation-'))
app.setPath('userData', path.join(directory, 'browser'))
const report = process.argv[2] || path.join(directory, 'report.json')
const root = path.resolve(__dirname, '../saas-server/public')
const results = []; const errors = []; let server; let window
const timer = setTimeout(() => { fs.writeFileSync(report, JSON.stringify({ ok: false, results, errors, message: '导航验收超时。' })); app.exit(2) }, 45000)
async function page (code) { return await window.webContents.executeJavaScript(code) }
async function until (operation) { for (let i = 0; i < 100; i++) { if (await operation()) return; await new Promise(resolve => setTimeout(resolve, 50)) }; throw new Error('导航页面未就绪。') }
app.whenReady().then(async () => {
  server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1')
    if (url.pathname.startsWith('/api/')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      if (url.pathname === '/api/platforms') return res.end(JSON.stringify({ ok: true, platforms: [] }))
      res.writeHead(401); return res.end(JSON.stringify({ ok: false, message: '请先登录工作空间。' }))
    }
    const file = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname))
    if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end() }
    res.setHeader('Content-Type', ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' })[path.extname(file)] || 'application/octet-stream')
    fs.createReadStream(file).pipe(res)
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const origin = `http://127.0.0.1:${server.address().port}`
  window = new BrowserWindow({ show: false, width: 1180, height: 850, webPreferences: { sandbox: true, nodeIntegration: false, contextIsolation: true, backgroundThrottling: false } })
  window.webContents.on('console-message', (_event, level, message) => { if (level >= 3 && /SyntaxError|ReferenceError|TypeError/.test(message)) errors.push(message) })
  await window.loadURL(origin + '/#environments')
  await until(() => page('Boolean(window.WorkspaceUI?.getBaseRoute)'))
  for (const route of ['environments', 'fingerprints', 'proxies']) {
    await page(`history.replaceState(null, '', '#${route}'); WorkspaceUI.render()`)
    await until(() => page(`WorkspaceUI.getBaseRoute() === '${route}'`))
    assert.equal(await page('document.querySelectorAll("#navigation .nav-link").length'), 6)
    assert.equal(await page('document.querySelector("#navigation .nav-link.active").dataset.route'), 'environments')
    assert.equal(await page('document.querySelector("#navigation .nav-link.active span").textContent'), '浏览器环境管理')
    assert.equal(await page('document.querySelectorAll("#page .environment-management-tab").length'), 3)
    assert.equal(await page('document.querySelector("#page .environment-management-tab.active").dataset.route'), route)
    assert.equal(await page('document.querySelector("#page h1").textContent'), '浏览器环境管理')
    assert.equal(await page('document.querySelectorAll("#modal-root [role=dialog]").length'), 0)
    for (const zoom of [1, 1.25, 1.5, 2]) {
      window.webContents.setZoomFactor(zoom)
      assert.equal(await page('Array.from(document.querySelectorAll("#navigation .nav-link span")).filter(node => getComputedStyle(node).display !== "none" && node.getBoundingClientRect().width > 0).length'), 6)
      assert.equal(await page('Array.from(document.querySelectorAll(".environment-management-tab")).filter(node => getComputedStyle(node).display !== "none" && node.getBoundingClientRect().width > 0).length'), 3)
    }
    results.push(route + '：旧 hash 可直接访问，统一导航高亮，三个分类常驻')
  }
  window.webContents.setZoomFactor(1)
  await page('document.querySelector(".environment-management-tab[data-route=fingerprints]").click()')
  await until(() => page('WorkspaceUI.getBaseRoute() === "fingerprints"'))
  assert.equal(await page('location.hash'), '#fingerprints')
  await page('document.querySelector(".environment-management-tab[data-route=proxies]").click()')
  await until(() => page('WorkspaceUI.getBaseRoute() === "proxies"'))
  assert.equal(errors.length, 0, errors.join('\n'))
  results.push('顶部分类实际点击可切换，100%—200%缩放六项静态导航及分类文字常驻')
  fs.writeFileSync(report, JSON.stringify({ ok: true, results, errors }, null, 2))
}).catch(error => { fs.writeFileSync(report, JSON.stringify({ ok: false, message: error.message, stack: error.stack, results, errors }, null, 2)); process.exitCode = 1 }).finally(async () => { clearTimeout(timer); window?.destroy(); if (server) await new Promise(resolve => server.close(resolve)); app.exit(process.exitCode || 0) })
