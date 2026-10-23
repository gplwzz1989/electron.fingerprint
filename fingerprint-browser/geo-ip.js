/**
 * GeoIP 与网络出口识别联动模块
 * 用于根据公网出口 IP 或代理配置，自动解析物理地理位置、时区与匹配语系，
 * 从根源上消除“IP 与时区错配”（Timezone spoofed）的风控判定。
 */

const http = require('node:http')
const https = require('node:https')

// 国家代码与标准语言映射表（覆盖主要国家和地区）
const COUNTRY_LOCALE_MAP = {
  US: { language: 'en-US', languages: ['en-US', 'en'], acceptLanguage: 'en-US,en;q=0.9' },
  GB: { language: 'en-GB', languages: ['en-GB', 'en'], acceptLanguage: 'en-GB,en;q=0.9' },
  CA: { language: 'en-CA', languages: ['en-CA', 'en', 'fr-CA'], acceptLanguage: 'en-CA,en;q=0.9,fr;q=0.8' },
  AU: { language: 'en-AU', languages: ['en-AU', 'en'], acceptLanguage: 'en-AU,en;q=0.9' },
  DE: { language: 'de-DE', languages: ['de-DE', 'de', 'en'], acceptLanguage: 'de-DE,de;q=0.9,en;q=0.8' },
  FR: { language: 'fr-FR', languages: ['fr-FR', 'fr', 'en'], acceptLanguage: 'fr-FR,fr;q=0.9,en;q=0.8' },
  JP: { language: 'ja-JP', languages: ['ja-JP', 'ja', 'en'], acceptLanguage: 'ja-JP,ja;q=0.9,en;q=0.8' },
  KR: { language: 'ko-KR', languages: ['ko-KR', 'ko', 'en'], acceptLanguage: 'ko-KR,ko;q=0.9,en;q=0.8' },
  SG: { language: 'en-SG', languages: ['en-SG', 'en', 'zh-CN'], acceptLanguage: 'en-SG,en;q=0.9,zh-CN;q=0.8' },
  HK: { language: 'zh-HK', languages: ['zh-HK', 'zh-TW', 'en'], acceptLanguage: 'zh-HK,zh;q=0.9,en;q=0.8' },
  TW: { language: 'zh-TW', languages: ['zh-TW', 'zh', 'en'], acceptLanguage: 'zh-TW,zh;q=0.9,en;q=0.8' },
  CN: { language: 'zh-CN', languages: ['zh-CN', 'zh', 'en'], acceptLanguage: 'zh-CN,zh;q=0.9,en;q=0.8' },
  RU: { language: 'ru-RU', languages: ['ru-RU', 'ru', 'en'], acceptLanguage: 'ru-RU,ru;q=0.9,en;q=0.8' },
  ES: { language: 'es-ES', languages: ['es-ES', 'es', 'en'], acceptLanguage: 'es-ES,es;q=0.9,en;q=0.8' },
  IT: { language: 'it-IT', languages: ['it-IT', 'it', 'en'], acceptLanguage: 'it-IT,it;q=0.9,en;q=0.8' },
  BR: { language: 'pt-BR', languages: ['pt-BR', 'pt', 'en'], acceptLanguage: 'pt-BR,pt;q=0.9,en;q=0.8' },
  IN: { language: 'en-IN', languages: ['en-IN', 'en', 'hi'], acceptLanguage: 'en-IN,en;q=0.9,hi;q=0.8' },
  NL: { language: 'nl-NL', languages: ['nl-NL', 'nl', 'en'], acceptLanguage: 'nl-NL,nl;q=0.9,en;q=0.8' },
  MY: { language: 'ms-MY', languages: ['ms-MY', 'en-US', 'zh-CN'], acceptLanguage: 'ms-MY,ms;q=0.9,en;q=0.8' },
  TH: { language: 'th-TH', languages: ['th-TH', 'en-US'], acceptLanguage: 'th-TH,th;q=0.9,en;q=0.8' },
  VN: { language: 'vi-VN', languages: ['vi-VN', 'en-US'], acceptLanguage: 'vi-VN,vi;q=0.9,en;q=0.8' },
  PH: { language: 'en-PH', languages: ['en-PH', 'tl', 'en'], acceptLanguage: 'en-PH,en;q=0.9,tl;q=0.8' },
  ID: { language: 'id-ID', languages: ['id-ID', 'en-US'], acceptLanguage: 'id-ID,id;q=0.9,en;q=0.8' },
  TR: { language: 'tr-TR', languages: ['tr-TR', 'en-US'], acceptLanguage: 'tr-TR,tr;q=0.9,en;q=0.8' },
  PL: { language: 'pl-PL', languages: ['pl-PL', 'en-US'], acceptLanguage: 'pl-PL,pl;q=0.9,en;q=0.8' }
}

const DEFAULT_FALLBACK_LOCALE = {
  language: 'en-US',
  languages: ['en-US', 'en'],
  acceptLanguage: 'en-US,en;q=0.9'
}

/**
 * 通用带超时的 JSON 请求
 */
function fetchJson (url, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    const req = client.get(url, { headers: { 'User-Agent': 'curl/8.0' } }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`请求失败，状态码: ${res.statusCode}`))
      }
      let rawData = ''
      res.on('data', (chunk) => { rawData += chunk })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(rawData)
          resolve(parsed)
        } catch (e) {
          reject(new Error(`JSON 解析失败: ${e.message}`))
        }
      })
    })

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`请求超时 (${timeoutMs}ms)`))
    })

    req.on('error', (err) => {
      reject(err)
    })
  })
}

/**
 * 通过 HTTP 代理发起 JSON 请求
 */
function fetchJsonViaHttpProxy (proxyUrl, targetUrl, timeoutMs = 6000) {
  return new Promise((resolve, reject) => {
    try {
      const parsedProxy = new URL(proxyUrl)
      const parsedTarget = new URL(targetUrl)
      const options = {
        host: parsedProxy.hostname,
        port: Number(parsedProxy.port) || 80,
        path: targetUrl,
        headers: {
          Host: parsedTarget.host,
          'User-Agent': 'curl/8.0'
        }
      }
      if (parsedProxy.username || parsedProxy.password) {
        const auth = Buffer.from(`${decodeURIComponent(parsedProxy.username)}:${decodeURIComponent(parsedProxy.password)}`).toString('base64')
        options.headers['Proxy-Authorization'] = `Basic ${auth}`
      }
      const req = http.get(options, res => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`代理请求失败，状态码: ${res.statusCode}`))
        }
        let rawData = ''
        res.on('data', chunk => { rawData += chunk })
        res.on('end', () => {
          try {
            resolve(JSON.parse(rawData))
          } catch (e) {
            reject(new Error(`JSON 解析失败: ${e.message}`))
          }
        })
      })
      req.setTimeout(timeoutMs, () => req.destroy(new Error(`代理请求超时 (${timeoutMs}ms)`)))
      req.on('error', reject)
    } catch (err) {
      reject(err)
    }
  })
}

/**
 * 探测出口 IP 信息（内置多源容灾与 HTTP 代理通道穿透）
 * @param {object} [options]
 * @param {object} [options.proxy] 代理配置 ({ mode: 'http', server: 'http://host:port' })
 * @param {number} [options.timeout=5000] 超时时间
 * @returns {Promise<{ip: string, country: string, countryCode: string, city: string, timezone: string, locale: object}>}
 */
async function detectExitIp (options = {}) {
  const timeout = options.timeout || 5000
  const proxy = options.proxy
  const isHttpProxy = Boolean(proxy && proxy.mode === 'http' && proxy.server)

  // 接口 1: ip-api.com
  try {
    const targetUrl = 'http://ip-api.com/json/?fields=status,message,country,countryCode,city,timezone,query'
    const data = isHttpProxy
      ? await fetchJsonViaHttpProxy(proxy.server, targetUrl, timeout)
      : await fetchJson(targetUrl, timeout)

    if (data && data.status === 'success') {
      const countryCode = String(data.countryCode || 'US').toUpperCase()
      const locale = COUNTRY_LOCALE_MAP[countryCode] || DEFAULT_FALLBACK_LOCALE
      return {
        ip: data.query,
        country: data.country || 'Unknown',
        countryCode,
        city: data.city || 'Unknown',
        timezone: data.timezone || 'UTC',
        locale
      }
    }
  } catch (err) {
    // 降级尝试备用接口
  }

  // 接口 2: ipwho.is (备用)
  try {
    const targetUrl = 'https://ipwho.is/'
    const data = isHttpProxy
      ? await fetchJsonViaHttpProxy(proxy.server, targetUrl, timeout)
      : await fetchJson(targetUrl, timeout)

    if (data && data.success) {
      const countryCode = String(data.country_code || 'US').toUpperCase()
      const locale = COUNTRY_LOCALE_MAP[countryCode] || DEFAULT_FALLBACK_LOCALE
      return {
        ip: data.ip,
        country: data.country || 'Unknown',
        countryCode,
        city: data.city || 'Unknown',
        timezone: data.timezone?.id || 'UTC',
        locale
      }
    }
  } catch (err) {
    // 降级完成
  }

  throw new Error('无法探测当前出口 IP 归属地，请检查网络或代理连通性。')
}

/**
 * 将推导出的 GeoIP 信息与环境指纹配置进行物理自洽对齐
 * @param {object} profile 指纹配置对象
 * @param {object} geoInfo detectExitIp 返回的对象
 * @returns {object} 对齐后的指纹配置对象
 */
function alignFingerprintWithGeo (profile, geoInfo) {
  if (!profile || typeof profile !== 'object' || !geoInfo) return profile

  const updated = structuredClone(profile)
  const target = (updated.fingerprint && typeof updated.fingerprint === 'object') ? updated.fingerprint : updated

  // 1. 对齐时区
  if (geoInfo.timezone && target.locale) {
    target.locale.timezone = geoInfo.timezone
  }

  // 2. 对齐语言偏好
  if (geoInfo.locale && target.locale) {
    target.locale.language = geoInfo.locale.language
    target.locale.languages = [...geoInfo.locale.languages]
  }

  // 3. 对齐浏览器 HTTP Accept-Language
  if (geoInfo.locale?.acceptLanguage && target.browser) {
    target.browser.acceptLanguage = geoInfo.locale.acceptLanguage
  }

  // 4. 确保在代理环境下锁定 WebRTC 非代理 UDP 防护
  if (target.modules) {
    target.modules.webrtc = true
  }

  return updated
}

module.exports = {
  detectExitIp,
  alignFingerprintWithGeo,
  COUNTRY_LOCALE_MAP
}
