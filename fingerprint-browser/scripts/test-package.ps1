$ErrorActionPreference = 'Stop'
$workspaceRoot = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$testRoot = [IO.Path]::GetFullPath((Join-Path $workspaceRoot 'dist/installer-test'))
$installRoot = Join-Path $testRoot 'program'
$registry = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\com.qijie.fingerprintbrowser'
$previousAppData = $env:APPDATA
$previousOverride = $env:FP_BROWSER_DATA_DIR
$installed = $false
try {
  if (Test-Path -LiteralPath $registry) { throw '当前账户已安装客户端，不能执行安装卸载验证。' }
  if (!$testRoot.StartsWith($workspaceRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) { throw '安装验证路径无效。' }
  New-Item -ItemType Directory -Path $testRoot -Force | Out-Null
  $setup = Start-Process -FilePath (Join-Path $workspaceRoot 'dist/指纹浏览器-安装包.exe') -ArgumentList "/S /D=$installRoot" -WindowStyle Hidden -Wait -PassThru
  if ($setup.ExitCode -ne 0) { throw '安装验证失败。' }
  $installed = $true
  $program = Join-Path $installRoot '指纹浏览器.exe'
  if (!(Test-Path -LiteralPath $program) -or (Get-ItemProperty -LiteralPath $registry).InstallLocation -ne $installRoot) { throw '安装文件或卸载登记验证失败。' }
  $shortcut = Join-Path ([Environment]::GetFolderPath('Desktop')) '栖界指纹浏览器.lnk'
  if (!(Test-Path -LiteralPath $shortcut)) { throw '桌面快捷方式验证失败。' }
  $env:APPDATA = Join-Path $testRoot 'user-appdata'
  $env:FP_BROWSER_DATA_DIR = ''
  $smoke = @'
const fs = require('node:fs/promises')
const path = require('node:path')
const http = require('node:http')
const { spawn } = require('node:child_process')
const expected = path.resolve(process.env.APPDATA, '栖界', '指纹浏览器')
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
const pending = new Map()
let child, server, socket, sequence = 0
async function evaluate(expression) {
  const id = ++sequence
  const response = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('安装版页面响应超时。')), 20000)
    pending.set(id, message => { clearTimeout(timeout); resolve(message) })
  })
  socket.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression, awaitPromise: true, returnByValue: true } }))
  const result = await response
  if (result.error || result.result.exceptionDetails) throw new Error('安装版页面验证失败。')
  return result.result.result.value
}
async function run() {
  await fs.rm(path.join(process.env.APPDATA, '..', '验证诊断.log'), { force: true })
  server = http.createServer((_request, response) => { response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end('<title>安装版环境验证</title>') })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  child = spawn(process.argv[2], ['--remote-debugging-port=19226'], { env: process.env, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] })
  let runtimeLog = ''
  child.stderr.on('data', chunk => { runtimeLog += chunk.toString() })
  child.once('exit', () => { void fs.writeFile(path.join(process.env.APPDATA, '..', '启动诊断.log'), runtimeLog, 'utf8') })
  let target
  for (let attempt = 0; attempt < 150; attempt++) {
    try {
      const targets = await (await fetch('http://127.0.0.1:19226/json/list')).json()
      target = targets.find(item => item.url.includes('resources/app/renderer/index.html'))
      if (target) break
    } catch {}
    await wait(100)
  }
  if (!target) throw new Error('安装版管理页面没有启动。')
  socket = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', () => reject(new Error('安装版诊断接口不可用。')), { once: true }) })
  socket.addEventListener('message', event => { const message = JSON.parse(event.data); if (pending.has(message.id)) { pending.get(message.id)(message); pending.delete(message.id) } })
  const result = await evaluate(`(async () => {
    const draft = await window.browserApi.getDraft()
    draft.profile.name = '安装版数据目录验证'
    draft.profile.url = 'http://127.0.0.1:${server.address().port}/'
    const saved = await window.browserApi.saveProfile(draft.profile)
    if (!saved.ok) return saved
    const launched = await window.browserApi.launchProfile({ id: saved.profile.id })
    if (!launched.ok) return launched
    return await window.browserApi.listTabs()
  })()`)
  if (!result.ok || !result.tabs?.length || !path.resolve(result.tabs[0].dataDir).startsWith(expected + path.sep)) throw new Error('安装版没有使用默认应用数据目录。')
  await fs.access(path.join(expected, 'profiles.json'))
  await fs.writeFile(path.join(process.env.APPDATA, '..', '验证结果.json'), JSON.stringify({ ok: true, 默认数据目录: expected, 环境目录: result.tabs[0].dataDir }), 'utf8')
  console.log('安装版启动、默认用户数据目录和环境创建验证通过。')
}
void (async () => {
  try { await run() } catch (error) {
    await fs.writeFile(path.join(process.env.APPDATA, '..', '验证诊断.log'), error.stack || String(error), 'utf8')
    console.error('安装版启动与默认数据目录验证失败，请查看验证诊断记录。')
    process.exitCode = 1
  }
  finally {
    socket?.close()
    if (child?.exitCode === null) await new Promise(resolve => { child.once('exit', resolve); child.kill() })
    server?.close()
  }
})()
'@
  $smoke | node - $program
  if ($LASTEXITCODE -ne 0) { throw '安装版启动验证失败。' }
  '额外的用户文件必须保留。' | Set-Content -LiteralPath (Join-Path $installRoot '保留文件.txt') -Encoding utf8NoBOM
  $uninstall = Start-Process -FilePath (Join-Path $installRoot '卸载.exe') -ArgumentList '/S' -WindowStyle Hidden -Wait -PassThru
  if ($uninstall.ExitCode -ne 0 -or (Test-Path -LiteralPath $program) -or (Test-Path -LiteralPath $registry) -or (Test-Path -LiteralPath $shortcut)) { throw '卸载或快捷方式清理验证失败。' }
  if (!(Test-Path -LiteralPath (Join-Path $installRoot '保留文件.txt')) -or !(Test-Path -LiteralPath (Join-Path $env:APPDATA '栖界/指纹浏览器/profiles.json'))) { throw '卸载没有保留用户数据。' }
  $installed = $false
  Write-Host '安装、快捷方式、默认数据目录、卸载及用户数据保留验证全部通过。'
} catch {
  Write-Host '安装包验证失败，请检查 dist/installer-test 中的安装与数据目录。' -ForegroundColor Red
  exit 1
} finally {
  $env:APPDATA = $previousAppData
  $env:FP_BROWSER_DATA_DIR = $previousOverride
  if ($installed -and (Test-Path -LiteralPath $registry) -and (Get-ItemProperty -LiteralPath $registry).InstallLocation -eq $installRoot) {
    Start-Process -FilePath (Join-Path $installRoot '卸载.exe') -ArgumentList '/S' -WindowStyle Hidden -Wait
  }
}
