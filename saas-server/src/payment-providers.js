const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')
const { UserError } = require('./mysql-database')

const sign = (value, key) => crypto.sign('RSA-SHA256', Buffer.from(value), key).toString('base64')
const verify = (value, signature, key) => typeof signature === 'string' && crypto.verify('RSA-SHA256', Buffer.from(value), key, Buffer.from(signature, 'base64'))
const failure = () => new UserError('支付平台暂时无法处理请求，请稍后重试或查询原订单。', 502)
const signedFields = fields => Object.keys(fields).filter(key => !['sign', 'sign_type'].includes(key) && fields[key] !== '').sort().map(key => `${key}=${fields[key]}`).join('&')
const money = cents => (cents / 100).toFixed(2)
function cents (value) {
  if (typeof value !== 'string' || !/^\d{1,8}(?:\.\d{1,2})?$/.test(value)) throw failure()
  const [whole, fraction = ''] = value.split('.')
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
}
function readKey (file, privateKey = false) {
  if (!file || !path.isAbsolute(file)) throw new Error('支付证书路径必须为服务端绝对路径。')
  const value = fs.readFileSync(file, 'utf8')
  const key = privateKey ? crypto.createPrivateKey(value) : crypto.createPublicKey(value)
  if (key.asymmetricKeyType !== 'rsa' || key.asymmetricKeyDetails.modulusLength < 2048) throw new Error('支付证书须使用至少 2048 位 RSA 密钥。')
  return { key, value }
}
function notifyUrl (value, provider) {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== `/api/payments/${provider}/notify`) throw new Error('支付回调须配置对应的公网 HTTPS 接口。')
  return url.href
}
async function exchange (url, options) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000), redirect: 'error' })
  const reader = response.body.getReader(); const chunks = []; let size = 0
  try {
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 262144) throw failure(); chunks.push(Buffer.from(value)) }
  } finally { await reader.cancel().catch(() => {}) }
  return { status: response.status, headers: Object.fromEntries(response.headers), body: Buffer.concat(chunks).toString('utf8') }
}

class WechatPayProvider {
  constructor (config) {
    this.key = 'wechat'; this.name = '微信支付'; this.config = config
    this.appId = config.WECHAT_PAY_APP_ID; this.merchantId = config.WECHAT_PAY_MCH_ID
    if (!/^[a-zA-Z0-9]{1,32}$/.test(this.appId) || !/^\d{6,32}$/.test(this.merchantId) || !/^[A-Fa-f0-9]{1,64}$/.test(config.WECHAT_PAY_SERIAL_NO)) throw new Error('微信支付商户配置不完整。')
    this.privateKey = readKey(config.WECHAT_PAY_PRIVATE_KEY_PATH, true).key
    const platform = readKey(config.WECHAT_PAY_PLATFORM_CERT_PATH)
    this.platformKey = platform.key
    if (platform.value.includes('BEGIN CERTIFICATE')) {
      this.certificate = new crypto.X509Certificate(platform.value)
      this.platformSerial = this.certificate.serialNumber
    } else this.platformSerial = config.WECHAT_PAY_PLATFORM_SERIAL_NO
    if (!/^(?:[A-Fa-f0-9]{1,64}|PUB_KEY_ID_[a-zA-Z0-9_]{1,80})$/.test(this.platformSerial)) throw new Error('请配置微信支付平台证书序列号或公钥编号。')
    this.apiKey = Buffer.from(config.WECHAT_PAY_API_V3_KEY || '')
    if (this.apiKey.length !== 32) throw new Error('微信支付 APIv3 密钥须为 32 字节。')
    this.notifyUrl = notifyUrl(config.WECHAT_PAY_NOTIFY_URL, this.key)
  }
  validateSignature (headers, body) {
    const timestamp = headers['wechatpay-timestamp']; const nonce = headers['wechatpay-nonce']
    if (!/^\d{10,11}$/.test(timestamp || '') || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300 || typeof nonce !== 'string' || !nonce || nonce.length > 256 || headers['wechatpay-serial'] !== this.platformSerial) throw failure()
    if (this.certificate && (Date.now() < Date.parse(this.certificate.validFrom) || Date.now() > Date.parse(this.certificate.validTo))) throw failure()
    if (!verify(`${timestamp}\n${nonce}\n${body}\n`, headers['wechatpay-signature'], this.platformKey)) throw failure()
  }
  async request (method, target, payload) {
    try {
      const body = payload ? JSON.stringify(payload) : ''; const timestamp = Math.floor(Date.now() / 1000); const nonce = crypto.randomBytes(16).toString('hex')
      const signature = sign(`${method}\n${target}\n${timestamp}\n${nonce}\n${body}\n`, this.privateKey)
      const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${this.merchantId}",nonce_str="${nonce}",timestamp="${timestamp}",serial_no="${this.config.WECHAT_PAY_SERIAL_NO}",signature="${signature}"`
      const result = await exchange(`https://api.mch.weixin.qq.com${target}`, { method, headers: { Authorization: authorization, Accept: 'application/json', 'Content-Type': 'application/json', 'Wechatpay-Serial': this.platformSerial }, ...(body ? { body } : {}) })
      this.validateSignature(result.headers, result.body)
      if (result.status !== 200) throw failure()
      return JSON.parse(result.body)
    } catch { throw failure() }
  }
  async create (order) {
    const result = await this.request('POST', '/v3/pay/transactions/native', { appid: this.appId, mchid: this.merchantId, description: order.plan.name, out_trade_no: order.id, time_expire: new Date(order.expiresAt).toISOString().replace(/\.\d{3}Z$/, 'Z'), notify_url: this.notifyUrl, amount: { total: order.amount, currency: 'CNY' } })
    if (typeof result.code_url !== 'string' || result.code_url.length > 1024 || !result.code_url.startsWith('weixin://')) throw failure()
    return result.code_url
  }
  settlement (data) {
    if (data.appid !== this.appId || data.mchid !== this.merchantId || data.trade_state !== 'SUCCESS' || data.amount?.currency !== 'CNY' || !Number.isSafeInteger(data.amount.total) || !data.transaction_id) throw failure()
    return { id: data.out_trade_no, amount: data.amount.total, transactionId: data.transaction_id, paidAt: Date.parse(data.success_time) }
  }
  async query (order) {
    const data = await this.request('GET', `/v3/pay/transactions/out-trade-no/${encodeURIComponent(order.id)}?mchid=${this.merchantId}`)
    if (data.out_trade_no !== order.id || data.appid !== this.appId || data.mchid !== this.merchantId) throw failure()
    return data.trade_state === 'SUCCESS' ? this.settlement(data) : null
  }
  notification (headers, raw) {
    try {
      this.validateSignature(headers, raw)
      const event = JSON.parse(raw); const resource = event.resource
      if (event.event_type !== 'TRANSACTION.SUCCESS' || resource?.algorithm !== 'AEAD_AES_256_GCM' || resource.original_type !== 'transaction') throw failure()
      const encrypted = Buffer.from(resource.ciphertext, 'base64')
      if (encrypted.length < 17) throw failure()
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.apiKey, Buffer.from(resource.nonce))
      decipher.setAAD(Buffer.from(resource.associated_data || '')); decipher.setAuthTag(encrypted.subarray(-16))
      return this.settlement(JSON.parse(Buffer.concat([decipher.update(encrypted.subarray(0, -16)), decipher.final()]).toString('utf8')))
    } catch { throw new UserError('支付通知校验失败。', 400) }
  }
}

// 支付宝响应验签使用原始 JSON 对象字节，不能解析后再序列化，避免转义或数字格式改变。
function responseObject (raw, key) {
  const prefix = new RegExp(`"${key}"\\s*:\\s*\\{`).exec(raw)
  if (!prefix) throw failure()
  const start = prefix.index + prefix[0].length - 1; let depth = 0; let quoted = false; let escaped = false
  for (let i = start; i < raw.length; i++) {
    const char = raw[i]
    if (quoted) { if (escaped) escaped = false; else if (char === '\\') escaped = true; else if (char === '"') quoted = false }
    else if (char === '"') quoted = true
    else if (char === '{') depth++
    else if (char === '}' && --depth === 0) return raw.slice(start, i + 1)
  }
  throw failure()
}
class AlipayProvider {
  constructor (config) {
    this.key = 'alipay'; this.name = '支付宝'; this.config = config
    this.appId = config.ALIPAY_APP_ID; this.sellerId = config.ALIPAY_SELLER_ID
    if (!/^\d{10,32}$/.test(this.appId) || !/^\d{10,32}$/.test(this.sellerId)) throw new Error('支付宝商户配置不完整。')
    this.privateKey = readKey(config.ALIPAY_PRIVATE_KEY_PATH, true).key
    this.platformKey = readKey(config.ALIPAY_PUBLIC_KEY_PATH).key
    this.notifyUrl = notifyUrl(config.ALIPAY_NOTIFY_URL, this.key)
    if (config.ALIPAY_SANDBOX === 'true' && process.env.SAAS_ENV === 'prod') throw new Error('生产环境不能使用支付宝沙箱。')
    this.gateway = config.ALIPAY_SANDBOX === 'true' ? 'https://openapi-sandbox.dl.alipaydev.com/gateway.do' : 'https://openapi.alipay.com/gateway.do'
  }
  async request (method, business) {
    try {
      const timestamp = new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 19).replace('T', ' ')
      const fields = { app_id: this.appId, method, format: 'JSON', charset: 'utf-8', sign_type: 'RSA2', timestamp, version: '1.0', ...(method === 'alipay.trade.precreate' ? { notify_url: this.notifyUrl } : {}), biz_content: JSON.stringify(business) }
      fields.sign = sign(Object.keys(fields).sort().map(key => `${key}=${fields[key]}`).join('&'), this.privateKey)
      const result = await exchange(this.gateway, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' }, body: new URLSearchParams(fields).toString() })
      if (result.status !== 200) throw failure()
      const key = method.replace(/\./g, '_') + '_response'; const data = JSON.parse(result.body)
      if (!verify(responseObject(result.body, key), data.sign, this.platformKey) || data[key]?.code !== '10000') throw failure()
      return data[key]
    } catch { throw failure() }
  }
  async create (order) {
    const result = await this.request('alipay.trade.precreate', { out_trade_no: order.id, total_amount: money(order.amount), subject: order.plan.name, seller_id: this.sellerId, timeout_express: '30m' })
    const url = new URL(result.qr_code)
    if (url.protocol !== 'https:' || url.hostname !== 'qr.alipay.com' || url.username || url.password || url.href.length > 1024 || result.out_trade_no !== order.id) throw failure()
    return url.href
  }
  async query (order) {
    const result = await this.request('alipay.trade.query', { out_trade_no: order.id })
    if (result.out_trade_no !== order.id || (result.seller_id && result.seller_id !== this.sellerId)) throw failure()
    return ['TRADE_SUCCESS', 'TRADE_FINISHED'].includes(result.trade_status) ? { id: result.out_trade_no, amount: cents(result.total_amount), transactionId: result.trade_no, paidAt: Date.now() } : null
  }
  notification (headers, raw) {
    try {
      const entries = [...new URLSearchParams(raw)]; const data = Object.fromEntries(entries)
      if (Object.keys(data).length !== entries.length || data.app_id !== this.appId || data.seller_id !== this.sellerId || data.sign_type !== 'RSA2' || !verify(signedFields(data), data.sign, this.platformKey) || !['TRADE_SUCCESS', 'TRADE_FINISHED'].includes(data.trade_status)) throw failure()
      return { id: data.out_trade_no, amount: cents(data.total_amount), transactionId: data.trade_no, paidAt: Date.now() }
    } catch { throw new UserError('支付通知校验失败。', 400) }
  }
}

module.exports = { WechatPayProvider, AlipayProvider, responseObject, signedFields, sign, cents }
