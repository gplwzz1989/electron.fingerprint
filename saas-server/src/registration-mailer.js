const crypto = require('node:crypto')
const nodemailer = require('nodemailer')
const { UserError } = require('./mysql-database')
const { readServerConfig } = require('./server-config')
const { normalizeEmail } = require('./email-address')

class RegistrationMailer {
  constructor (database, configFile, runtimeConfig) {
    this.database = database
    const config = runtimeConfig || readServerConfig(configFile)
    const host = config.SMTP_HOST || ''; const port = Number(config.SMTP_PORT || 465)
    const secure = config.SMTP_SECURE === undefined ? port === 465 : config.SMTP_SECURE === 'true'
    const local = ['localhost', '127.0.0.1', '::1'].includes(host)
    const localTest = local && config.SMTP_ALLOW_INSECURE_LOCAL === 'true' && process.env.SAAS_ENV !== 'prod'
    this.from = normalizeEmail(config.SMTP_FROM || config.SMTP_USER || '')
    this.available = Boolean(host && this.from && Number.isInteger(port) && port > 0 && port <= 65535 && ((config.SMTP_USER && config.SMTP_PASSWORD) || localTest))
    if (!this.available) return
    this.transport = nodemailer.createTransport({
      host, port, secure, requireTLS: !secure && !localTest,
      auth: config.SMTP_USER ? { user: config.SMTP_USER, pass: config.SMTP_PASSWORD } : undefined,
      connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
      disableFileAccess: true, disableUrlAccess: true, logger: false, debug: false,
      tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
    })
  }
  async sendCode (email, ip) {
    email = normalizeEmail(email)
    if (!email) throw new UserError('邮箱格式不正确。')
    if (!this.available) throw new UserError('验证码邮件服务暂未配置，请联系管理员。', 503)
    if (await this.database.userByEmail(email)) throw new UserError('该邮箱已注册，请直接登录。', 409)
    const generation = crypto.randomUUID(); const code = crypto.randomInt(0, 1000000).toString().padStart(6, '0')
    const digest = this.database.verificationHash(email, generation, code)
    const ipKey = crypto.createHash('sha256').update(String(ip)).digest('hex')
    await this.database.reserveRegistrationCode(email, ipKey, generation, digest)
    try {
      const result = await this.transport.sendMail({
        from: { name: '栖界', address: this.from }, to: email,
        subject: '栖界注册验证码',
        text: `你的栖界注册验证码为：${code}\n\n验证码五分钟内有效，仅用于注册当前邮箱账户。请勿将验证码提供给他人。\n如果不是你本人操作，请忽略此邮件。`
      })
      if (!result.accepted?.some(address => String(address).toLowerCase() === email)) throw new Error('SMTP recipient rejected')
      await this.database.markRegistrationCode(email, generation, true)
    } catch {
      await this.database.markRegistrationCode(email, generation, false)
      throw new UserError('验证码邮件发送失败，请稍后重试或联系管理员。', 503)
    }
    return { expiresInSeconds: 300, retryAfterSeconds: 60 }
  }
  close () { this.transport?.close() }
}

module.exports = { RegistrationMailer }
