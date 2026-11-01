const fs = require('node:fs')
const path = require('node:path')
const { spawn } = require('node:child_process')
const { dataRoot: resolveDataRoot } = require('./data-directory')
const { getClientConfig } = require('./client-config')

const projectRoot = path.resolve(__dirname)

function runtimeExecutable (root, platform = process.platform) {
  if (!root) return ''
  if (platform === 'win32') return path.join(root, 'electron.exe')
  if (platform === 'darwin') return path.join(root, 'Electron.app', 'Contents', 'MacOS', 'Electron')
  return path.join(root, 'electron')
}

function resolveCandidateRuntime (env = process.env) {
  const candidates = [
    env.FP_ELECTRON_RUNTIME,
    env.ELECTRON_OVERRIDE_DIST_PATH,
    path.join(projectRoot, 'runtime'),
    path.resolve(projectRoot, '../electron-fp-build/src/out/Release'),
    path.resolve(projectRoot, '../out/Release')
  ].filter(Boolean)

  for (const candidate of candidates) {
    const executable = runtimeExecutable(candidate)
    if (executable && fs.existsSync(executable)) {
      return candidate
    }
  }
  return candidates[0] || path.join(projectRoot, 'runtime')
}

function getLaunchOptions (options = {}) {
  const env = { ...process.env, ...(options.envVars || {}) }
  const runtimeRoot = options.runtimeRoot || resolveCandidateRuntime(env)
  const config = getClientConfig({ env, directory: projectRoot })

  // 支持通过 options 覆盖配置
  if (options.appUrl) config.appUrl = options.appUrl
  if (options.appName) config.appName = options.appName
  if (options.applicationId) config.applicationId = options.applicationId
  if (options.environment) config.environment = options.environment

  const baseDataRoot = options.dataDir ? path.resolve(options.dataDir) : resolveDataRoot(env)
  const dataRoot = env.FP_BROWSER_DATA_DIR || config.environment === 'prod' ? baseDataRoot : path.join(baseDataRoot, config.environment)

  const extraArgs = options.extraArgs || []
  const executable = runtimeExecutable(runtimeRoot)

  return {
    executable,
    runtimeRoot,
    args: [projectRoot, ...extraArgs, `--user-data-dir=${dataRoot}`],
    options: {
      cwd: projectRoot,
      env: {
        ...env,
        FP_BROWSER_DATA_DIR: dataRoot,
        ...(options.appUrl ? { FP_OVERRIDE_APP_URL: options.appUrl } : {})
      },
      stdio: options.stdio || 'inherit',
      detached: Boolean(options.detached)
    },
    dataRoot,
    config
  }
}

async function launch (options = {}) {
  const launchOptions = getLaunchOptions(options)
  const { executable, args, options: spawnOptions, dataRoot } = launchOptions

  if (!fs.existsSync(executable)) {
    throw new Error(`未找到指纹版 Electron 运行时：${executable}。请设置 options.runtimeRoot 或环境变量 FP_ELECTRON_RUNTIME。`)
  }

  try {
    await fs.promises.mkdir(dataRoot, { recursive: true })
    await fs.promises.access(dataRoot, fs.constants.W_OK)
  } catch {
    throw new Error(`应用数据目录不可写：${dataRoot}，请检查权限或指定 options.dataDir。`)
  }

  const child = spawn(executable, args, spawnOptions)

  if (spawnOptions.detached && typeof child.unref === 'function') {
    child.unref()
  }

  return {
    process: child,
    pid: child.pid,
    dataRoot,
    executable,
    launchOptions
  }
}

module.exports = {
  launch,
  getLaunchOptions,
  runtimeExecutable,
  resolveCandidateRuntime,
  projectRoot
}
