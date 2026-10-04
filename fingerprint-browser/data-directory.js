const os = require('node:os')
const path = require('node:path')

function defaultDataRoot (env = process.env, platform = process.platform, home = os.homedir()) {
  if (platform === 'win32') return path.win32.join(env.APPDATA || path.win32.join(home, 'AppData', 'Roaming'), '栖界', '指纹浏览器')
  if (platform === 'darwin') return path.posix.join(home, 'Library', 'Application Support', '栖界', '指纹浏览器')
  return path.posix.join(env.XDG_CONFIG_HOME || path.posix.join(home, '.config'), '栖界', '指纹浏览器')
}

function dataRoot (env = process.env) {
  return path.resolve(env.FP_BROWSER_DATA_DIR?.trim() || defaultDataRoot(env))
}

module.exports = { defaultDataRoot, dataRoot }
