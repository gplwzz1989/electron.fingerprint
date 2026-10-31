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
  const input = (!packaged && env.FP_APP_URL) || config.appUrl || ''
  if (!input) throw new Error('未配置工作空间地址，请在打包时指定正式页面 URL。')
  const appUrl = validateAppUrl(input)
  if (config.updatePublicKey && (typeof config.updatePublicKey !== 'string' || /PRIVATE KEY/.test(config.updatePublicKey))) throw new Error('客户端更新配置只能包含公钥，禁止写入签名私钥。')
  if (config.updatesEnabled === true && !config.updatePublicKey) throw new Error('已开启自动更新，但未配置更新验签公钥。')
  if (config.updatesEnabled === true && !config.updateUrl) throw new Error('已开启自动更新，但未配置更新清单地址。')
  const updates = { enabled: Boolean(config.updatePublicKey && config.updateUrl) && config.updatesEnabled !== false, publicKey: config.updatePublicKey || '', channel: environment, url: config.updateUrl || '' }
  if (updates.enabled) {
    try { if (crypto.createPublicKey(updates.publicKey).asymmetricKeyType !== 'ed25519') throw new Error(); updates.url = updateUrl(updates.url, environment) } catch { throw new Error('更新地址或验签公钥配置无效，请检查打包配置。') }
  }
  const applicationId = config.applicationId || 'com.qijie.fingerprintbrowser'
  const appName = config.appName || '浏览器基座'
  if (!/^[a-z][a-z0-9]*(?:\.[a-z][a-z0-9]*){2,}$/.test(applicationId) || !/^[\p{L}\p{N} _.-]{1,60}$/u.test(appName)) throw new Error('应用标识或名称无效，请检查打包配置。')
  let platformManifestUrl = (!packaged && env.FP_PLATFORM_MANIFEST_URL) || config.platformManifestUrl || new URL('/api/platform-releases/manifest.json', appUrl).href
  if (platformManifestUrl) { try { platformManifestUrl = updateUrl(platformManifestUrl, environment) } catch { throw new Error('平台能力发布源地址无效，请使用独立 HTTPS 清单地址。') } }
  return { appUrl, environment, updates, applicationId, appName, platformManifestUrl }
}

module.exports = { getClientConfig, validateAppUrl }
