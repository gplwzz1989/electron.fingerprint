const fs = require('node:fs')
const path = require('node:path')
const { spawn } = require('node:child_process')
const { dataRoot: resolveDataRoot } = require('../data-directory')

const projectRoot = path.resolve(__dirname, '..')

function runtimeExecutable (root, platform = process.platform) {
  if (platform === 'win32') return path.join(root, 'electron.exe')
  if (platform === 'darwin') return path.join(root, 'Electron.app', 'Contents', 'MacOS', 'Electron')
  return path.join(root, 'electron')
}

function getLaunchOptions (env = process.env, extraArgs = []) {
  const runtimeRoot = env.FP_ELECTRON_RUNTIME || env.ELECTRON_OVERRIDE_DIST_PATH || path.resolve(projectRoot, '..', '..', 'electron-fp-build', 'src', 'out', 'Release')
  const dataRoot = resolveDataRoot(env)
  return {
    executable: runtimeExecutable(runtimeRoot),
    args: [projectRoot, ...extraArgs, `--user-data-dir=${dataRoot}`],
    options: { cwd: projectRoot, env: { ...env, FP_BROWSER_DATA_DIR: dataRoot }, stdio: 'inherit' },
    dataRoot
  }
}

async function start () {
  const { executable, args, options, dataRoot } = getLaunchOptions(process.env, process.argv.slice(2))
  if (!fs.existsSync(executable)) {
    console.error(`未找到指纹版 Electron 运行时：${executable}`)
    console.error('请设置 FP_ELECTRON_RUNTIME 为完整运行时目录后再启动。')
    process.exitCode = 1
    return
  }
  try {
    await fs.promises.mkdir(dataRoot, { recursive: true })
    await fs.promises.access(dataRoot, fs.constants.W_OK)
  } catch {
    console.error('应用数据目录不可写，请将 FP_BROWSER_DATA_DIR 设置为可写目录。')
    process.exitCode = 1
    return
  }
  const child = spawn(executable, args, options)

  child.on('error', () => {
    console.error('启动指纹版 Electron 失败，请检查运行时路径和执行权限。')
    process.exitCode = 1
  })

  child.on('exit', (code, signal) => {
    if (signal) {
      console.error(`指纹版 Electron 被信号 ${signal} 终止。`)
      process.exitCode = 1
      return
    }
    if (code) console.error(`指纹版 Electron 退出，退出码：${code}。`)
    process.exitCode = code || 0
  })
}

module.exports = { getLaunchOptions, runtimeExecutable }
if (require.main === module) void start()
