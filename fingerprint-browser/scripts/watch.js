const fs = require('node:fs')
const path = require('node:path')
const { spawn } = require('node:child_process')
const { getLaunchOptions, runtimeExecutable } = require('./start')

// 与参考客户端一致：应用文件变化时重启自己的子进程，持续转发主进程控制台，不触发原生编译。
const root = path.resolve(__dirname, '..')
const runtime = process.env.FP_ELECTRON_RUNTIME || [path.join(root, 'runtime'), 'F:/mywork/electron-fp-build/src/out/Release', 'J:/awork/electron-fp-build/src/out/Release'].find(directory => fs.existsSync(runtimeExecutable(directory)))
if (!runtime) { console.error('未找到已有运行时，请设置 FP_ELECTRON_RUNTIME 后启动监听。'); process.exitCode = 1 } else {
  const env = { ...process.env, FP_ELECTRON_RUNTIME: runtime, FP_BUILD_ENV: process.env.FP_BUILD_ENV || 'dev', FP_AUTH_DEBUG: '1' }
  const seed = path.join(root, 'dist/fingerprint-browser-win-x64/resources/platform-runtime')
  if (!env.FP_PLATFORM_RUNTIME_DIR && fs.existsSync(path.join(seed, 'manifest.json'))) env.FP_PLATFORM_RUNTIME_DIR = seed
  let child; let timer; let restarting = false; let pending = false; let stopping = false
  async function stopChild () {
    const previous = child; child = null
    if (!previous || previous.exitCode !== null) return
    await new Promise(resolve => { previous.once('exit', resolve); previous.kill() })
  }
  async function restart () {
    if (stopping) return
    if (restarting) { pending = true; return }
    restarting = true
    try {
      await stopChild()
      if (stopping) return
      const options = getLaunchOptions(env, process.env.REMOTE_DEBUGGING ? ['--remote-debugging-port=0'] : [])
      console.log('正在启动源码客户端，应用日志将直接输出到当前控制台。')
      child = spawn(options.executable, options.args, { ...options.options, stdio: 'inherit', windowsHide: true })
      child.once('error', () => console.error('源码客户端启动失败，请检查运行时路径。'))
    } catch { console.error('源码客户端未能启动，请检查运行时与开发配置。') } finally { restarting = false; if (pending) { pending = false; void restart() } }
  }
  const watcher = fs.watch(root, { recursive: true }, (_event, file) => {
    if (!file || /^(dist|node_modules|data|scratch|test)[/\\]/.test(file) || !/\.(js|json|html|css)$/.test(file)) return
    clearTimeout(timer); timer = setTimeout(() => { console.log('应用源码已变化，正在重新启动客户端。'); void restart() }, 400)
  })
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { stopping = true; clearTimeout(timer); watcher.close(); void stopChild().finally(() => process.exit()) })
  void restart()
}
