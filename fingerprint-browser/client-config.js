const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { updateUrl } = require('./client-updater')

function validateAppUrl (input) {
  let url
  try { url = new URL(input) } catch { throw new Error('工作空间地址无效，请配置完整的 HTTPS 地址。') }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash) {
    throw new Error('工作空间须使用 HTTPS，本机开发可使用 HTTP；地址不能包含凭据、查询或片段。')
  }
  return url.href
}

function getClientConfig ({ packaged = false, env = process.env, directory = __dirname } = {}) {
  const file = path.join(directory, 'client-config.json')
  let config = {}
  if (fs.existsSync(file)) {
    try { config = JSON.parse(fs.readFileSync(file, 'utf8')) } catch { throw new Error('客户端配置无法读取，请重新安装或修复工作空间地址。') }
  } else if (!packaged && fs.existsSync(path.join(directory, 'build-config.json'))) {
    const environment = env.FP_BUILD_ENV || 'dev'
    try { config = { ...JSON.parse(fs.readFileSync(path.join(directory, 'build-config.json'), 'utf8'))[environment], environment } } catch { throw new Error('打包环境配置无法读取。') }
  }
  const environment = config.environment || (packaged ? 'prod' : 'dev')
  if (!['dev', 'test', 'prod'].includes(environment)) throw new Error('客户端环境配置无效，请选择 dev、test 或 prod。')
  const input = (!packaged && env.FP_APP_URL) || config.appUrl || (!packaged && environment === 'dev' ? 'http://127.0.0.1:8088/' : '')
  if (!input) throw new Error('未配置工作空间地址，请在打包时指定正式页面 URL。')
  const appUrl = validateAppUrl(input)
  if (config.updatesEnabled === true && !config.updatePublicKey) throw new Error('已开启自动更新，但未配置更新验签公钥。')
  const updates = { enabled: Boolean(config.updatePublicKey) && config.updatesEnabled !== false, publicKey: config.updatePublicKey || '', channel: environment, url: config.updateUrl || new URL(`/api/client-updates/${environment}/win32/x64.json`, appUrl).href }
  if (updates.enabled) {
    try { if (crypto.createPublicKey(updates.publicKey).asymmetricKeyType !== 'ed25519') throw new Error(); updates.url = updateUrl(updates.url, environment) } catch { throw new Error('更新地址或验签公钥配置无效，请检查打包配置。') }
  }
  return { appUrl, environment, updates }
}

module.exports = { getClientConfig, validateAppUrl }
