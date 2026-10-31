// 使用真实 Chromium 页面和隔离数据库验收后台，不访问生产账号或发送公网邮件。
const { app, BrowserWindow } = require('electron/main')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const crypto = require('node:crypto')
const assert = require('node:assert/strict')
const { WorkspaceServer } = require('../saas-server/src/workspace-server')
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'system-admin-runtime-'))
app.setPath('userData', path.join(directory, 'browser'))
const report = process.argv[2] || path.join(directory, 'report.json')
let server; let window; const errors = []
const deadline = setTimeout(() => { fs.writeFileSync(report, JSON.stringify({ ok: false, message: '系统后台验收超时。', errors })); app.exit(2) }, 60000)
const page = code => window.webContents.executeJavaScript(code)
async function until (operation, message) {
  for (let i = 0; i < 120; i++) { if (await operation()) return; await new Promise(resolve => setTimeout(resolve, 50)) }
  throw new Error(message)
}
app.whenReady().then(async () => {
  server = new WorkspaceServer({ port: 0, dataDir: directory, databaseName: 'qijie_workspace_test_adminui_' + crypto.randomBytes(6).toString('hex') })
  const address = await server.start(); const origin = `http://127.0.0.1:${address.port}`
  const admin = await server.systemSettings.provisionAdmin('runtime-admin@example.test')
  window = new BrowserWindow({ show: false, width: 1280, height: 950, webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false } })
  window.webContents.on('console-message', (_event, level, message) => { if (level >= 3) errors.push(message) })
  await window.loadURL(origin + '/system-admin.html')
  await until(() => page('!document.querySelector("#login").hidden'), '登录表单未显示。')
  await page(`document.querySelector('[name=email]').value=${JSON.stringify(admin.email)};document.querySelector('[name=password]').value=${JSON.stringify(admin.password)};document.querySelector('#login-form').requestSubmit()`)
  await until(() => page('!document.querySelector("#console").hidden'), '管理员登录失败。')
  assert.equal(await page('document.querySelectorAll("#admin-nav button").length'), 8)
  await page(`document.querySelector('[data-group="邮件"]').click();document.querySelector('#SMTP_USER').value='runtime-smtp@example.test';document.querySelector('#SMTP_PASSWORD').value='isolated-runtime-secret';document.querySelector('#settings-form').requestSubmit()`)
  await until(() => page('document.querySelector("#message").textContent.includes("已保存并生效")'), '邮件配置未保存。')
  assert.equal(server.registrationMailer.transport.options.auth.pass, 'isolated-runtime-secret')
  assert.equal(await page('document.querySelector("#SMTP_PASSWORD").value'), '')
  assert.equal(await page('document.body.textContent.includes("isolated-runtime-secret")'), false)
  await window.webContents.capturePage().then(image => fs.writeFileSync(path.join(directory, 'desktop.png'), image.toPNG()))
  await page(`document.querySelector('[data-group="套餐"]').click();document.querySelector('.plan-tools button').click();for(const [key,value] of Object.entries({id:'runtime-plan',name:'隔离验收套餐',amount:'19.9',periodDays:'30',fingerprints:'2',environments:'2',members:'1'}))document.querySelector('[data-plan-key="'+key+'"]').value=value;document.querySelector('[data-plan-key="enabled"]').checked=true;document.querySelector('#message').textContent='';document.querySelector('#settings-form').requestSubmit()`)
  await until(() => page('document.querySelector("#message").textContent.includes("已保存并生效")'), '套餐未保存。')
  assert.equal(server.billing.plans[0].amount, 1990)
  if (process.env.PLATFORM_RELEASE_DIR) {
    const manifest = JSON.parse(fs.readFileSync(path.join(process.env.PLATFORM_RELEASE_DIR, 'manifest.json'), 'utf8'))
    await page(`document.querySelector('[data-group="能力版本"]').click()`)
    for (const [component, file] of [['platform', manifest.file], ['rpa', manifest.rpa.file]]) {
      const code = fs.readFileSync(path.join(process.env.PLATFORM_RELEASE_DIR, file), 'utf8')
      await page(`document.querySelector('#message').textContent='';{const input=document.querySelector('[data-release-file="'+${JSON.stringify(component)}+'"]');const transfer=new DataTransfer();transfer.items.add(new File([${JSON.stringify(code)}],${JSON.stringify(file)},{type:'application/javascript'}));input.files=transfer.files;input.parentElement.querySelector('button').click()}`)
      await until(() => page('document.querySelector("#message").textContent.includes("发布编号")'), '能力文件未通过真实界面发布。')
    }
    const published = await server.platformReleases.current(); assert(published.rpa)
    await until(() => page(`document.querySelector('[data-panel="能力版本"]').textContent.includes(${JSON.stringify('当前发布版本：')}+${JSON.stringify('')}+${JSON.stringify(published.version)})`), '已发布清单未呈现在后台。')
    await page('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
    await window.webContents.capturePage().then(image => fs.writeFileSync(path.join(directory, 'platform-releases.png'), image.toPNG()))
  }
  await page(`document.querySelector('[data-group="邮件"]').click()`)

  for (const width of [800, 375]) {
    window.setSize(width, 950)
    await until(() => page(`window.innerWidth<=${width}`), '窗口未调整。')
    assert.equal(await page('document.documentElement.scrollWidth <= window.innerWidth'), true)
    assert.equal(await page('[...document.querySelectorAll("#admin-nav button")].every(button=>button.getBoundingClientRect().width>0)'), true)
    await window.webContents.capturePage().then(image => fs.writeFileSync(path.join(directory, width + '.png'), image.toPNG()))
  }
  assert.deepEqual(errors, [])
  fs.writeFileSync(report, JSON.stringify({ ok: true, checks: ['真实管理员登录', '邮件配置保存', '密钥不回显', '套餐真实保存', ...(process.env.PLATFORM_RELEASE_DIR ? ['真实 NCC 文件后台发布与自动版本'] : []), '桌面与移动布局'], screenshots: directory, errors }, null, 2))
}).catch(error => { fs.writeFileSync(report, JSON.stringify({ ok: false, message: error.message, stack: error.stack, errors }, null, 2)); process.exitCode = 1 }).finally(async () => { clearTimeout(deadline); window?.destroy(); if (server) await server.stop(); app.exit(process.exitCode || 0) })
