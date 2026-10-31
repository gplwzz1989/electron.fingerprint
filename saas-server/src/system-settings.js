const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { UserError } = require('./mysql-database')
const { readServerConfig } = require('./server-config')
const { hashPassword } = require('./auth')
const { normalizeEmail } = require('./email-address')

// 系统配置属于平台，不属于任何团队；敏感值只进入加密存储，接口不回显。
const fields = [
  ['SAAS_PUBLIC_URL', '基础', '公开页面地址', 'url'],
  ['SAAS_ALLOW_PRIVATE_PROXY', '基础', '允许内网代理', 'boolean'],
  ['SMTP_HOST', '邮件', '邮件服务器', 'text'],
  ['SMTP_PORT', '邮件', '邮件端口', 'port'],
  ['SMTP_SECURE', '邮件', '直接使用 TLS', 'boolean'],
  ['SMTP_USER', '邮件', 'SMTP 登录邮箱', 'email'],
  ['SMTP_PASSWORD', '邮件', 'SMTP 授权码', 'secret'],
  ['SMTP_FROM', '邮件', '发件邮箱', 'email'],
  ['PAYMENTS_ENABLED', '支付', '开放支付', 'boolean'],
  ['WECHAT_PAY_APP_ID', '微信支付', '应用 ID', 'text'],
  ['WECHAT_PAY_MCH_ID', '微信支付', '商户号', 'text'],
  ['WECHAT_PAY_API_V3_KEY', '微信支付', 'API v3 密钥', 'secret'],
  ['WECHAT_PAY_SERIAL_NO', '微信支付', '商户证书序列号', 'text'],
  ['WECHAT_PAY_PRIVATE_KEY', '微信支付', '商户私钥（PEM）', 'secretMultiline'],
  ['WECHAT_PAY_PLATFORM_CERT', '微信支付', '平台证书或公钥（PEM）', 'secretMultiline'],
  ['WECHAT_PAY_PLATFORM_SERIAL_NO', '微信支付', '平台公钥编号', 'text'],
  ['WECHAT_PAY_NOTIFY_URL', '微信支付', '支付回调地址', 'url'],
  ['ALIPAY_APP_ID', '支付宝', '应用 ID', 'text'],
  ['ALIPAY_SELLER_ID', '支付宝', '收款卖家 ID', 'text'],
  ['ALIPAY_SANDBOX', '支付宝', '使用沙箱（生产禁止开启）', 'boolean'],
  ['ALIPAY_PRIVATE_KEY', '支付宝', '应用私钥（PEM）', 'secretMultiline'],
  ['ALIPAY_PUBLIC_KEY', '支付宝', '支付宝公钥（PEM）', 'secretMultiline'],
  ['ALIPAY_NOTIFY_URL', '支付宝', '支付回调地址', 'url'],
  ['BILLING_PLANS', '套餐', '真实售卖套餐', 'plans'],
  ['CLIENT_UPDATES_DIR', '客户端更新', '签名更新文件目录', 'text']
].map(([key, group, label, type]) => ({ key, group, label, type, secret: type.startsWith('secret') }))

class SystemSettings {
  constructor (database, configFile, defaults = {}) { this.db = database; this.configFile = configFile; this.defaults = defaults }
  async initialize () {
    await this.db.execute('CREATE TABLE IF NOT EXISTS system_settings(id TINYINT PRIMARY KEY,value_ciphertext LONGTEXT NOT NULL,revision INT NOT NULL,updated_at BIGINT NOT NULL,updated_by VARCHAR(36)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4')
    await this.db.execute('CREATE TABLE IF NOT EXISTS system_administrators(user_id VARCHAR(36) PRIMARY KEY,created_at BIGINT NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4')
    await this.db.execute('CREATE TABLE IF NOT EXISTS system_settings_audit(id VARCHAR(36) PRIMARY KEY,user_id VARCHAR(36) NOT NULL,revision INT NOT NULL,changed_fields JSON NOT NULL,created_at BIGINT NOT NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4')
    if ((await this.db.execute('SELECT id FROM system_settings WHERE id=1')).length) return
    const config = { ...readServerConfig(this.configFile), ...this.defaults }
    const values = Object.fromEntries(fields.map(field => [field.key, config[field.key] ?? (field.type === 'boolean' ? 'false' : field.type === 'plans' ? [] : '')]))
    values.SMTP_PORT ||= '465'
    values.SMTP_HOST ||= 'smtp.qq.com'
    values.SMTP_SECURE = config.SMTP_SECURE ?? 'true'
    values.CLIENT_UPDATES_DIR ||= 'client-updates'
    if (values.SAAS_PUBLIC_URL) {
      const origin = new URL(values.SAAS_PUBLIC_URL).origin
      values.WECHAT_PAY_NOTIFY_URL ||= origin + '/api/payments/wechat/notify'
      values.ALIPAY_NOTIFY_URL ||= origin + '/api/payments/alipay/notify'
    }
    // 首次启动迁移旧文件配置；之后只读取数据库，清空的字段不会被文件重新覆盖。
    const directory = path.dirname(this.configFile || process.env.SAAS_CONFIG_FILE || path.join(__dirname, `../.env.${process.env.SAAS_ENV || 'dev'}`))
    for (const [key, legacy] of Object.entries({ WECHAT_PAY_PRIVATE_KEY: 'WECHAT_PAY_PRIVATE_KEY_PATH', WECHAT_PAY_PLATFORM_CERT: 'WECHAT_PAY_PLATFORM_CERT_PATH', ALIPAY_PRIVATE_KEY: 'ALIPAY_PRIVATE_KEY_PATH', ALIPAY_PUBLIC_KEY: 'ALIPAY_PUBLIC_KEY_PATH' })) {
      if (!values[key] && config[legacy]) values[key] = fs.readFileSync(path.resolve(directory, config[legacy]), 'utf8')
    }
    if (config.BILLING_PLANS_FILE) values.BILLING_PLANS = JSON.parse(fs.readFileSync(path.resolve(directory, config.BILLING_PLANS_FILE), 'utf8')).plans
    await this.db.execute('INSERT IGNORE INTO system_settings VALUES(1,?,1,?,NULL)', [this.db.encrypt(JSON.stringify(values)), Date.now()])
  }
  async read () {
    const row = (await this.db.execute('SELECT * FROM system_settings WHERE id=1'))[0]
    if (!row) throw new UserError('系统配置尚未初始化。', 503)
    return { values: JSON.parse(this.db.decrypt(row.value_ciphertext)), revision: row.revision, updatedAt: row.updated_at }
  }
  async isAdmin (userId) { return Boolean((await this.db.execute('SELECT user_id FROM system_administrators WHERE user_id=?', [userId]))[0]) }
  async assertAdmin (userId) { if (!await this.isAdmin(userId)) throw new UserError('此操作仅允许系统管理员执行。', 403) }
  async publicSettings (userId) {
    await this.assertAdmin(userId)
    const state = await this.read()
    return { revision: state.revision, updatedAt: state.updatedAt, fields, values: Object.fromEntries(fields.filter(field => !field.secret).map(field => [field.key, state.values[field.key]])), configuredSecrets: fields.filter(field => field.secret && state.values[field.key]).map(field => field.key) }
  }
  validate (values) {
    for (const field of fields) {
      const value = values[field.key]
      if (field.type === 'plans') {
        if (!Array.isArray(value) || value.length > 50) throw new UserError('套餐必须是数组，最多配置 50 项。')
        const ids = new Set()
        for (const plan of value) {
          if (!plan || !/^[a-zA-Z0-9_-]{1,48}$/.test(plan.id) || ids.has(plan.id) || typeof plan.name !== 'string' || !plan.name.trim() || plan.name.length > 80 || typeof plan.enabled !== 'boolean' || plan.currency !== 'CNY' || !Number.isInteger(plan.amount) || plan.amount < 1 || plan.amount > 100000000 || !Number.isInteger(plan.periodDays) || plan.periodDays < 1 || plan.periodDays > 3660 || ['fingerprints', 'environments', 'members'].some(key => !Number.isInteger(plan.quotas?.[key]) || plan.quotas[key] < 1 || plan.quotas[key] > 10000000)) throw new UserError('套餐字段或额度无效，请检查真实售卖配置。')
          ids.add(plan.id)
        }
        continue
      }
      if (typeof value !== 'string' || value.length > (field.type === 'secretMultiline' ? 32768 : 4096)) throw new UserError(`${field.label}格式或长度无效。`)
      if (field.type === 'boolean' && !['true', 'false'].includes(value)) throw new UserError(`${field.label}必须选择开启或关闭。`)
      if (field.type === 'port' && (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 65535)) throw new UserError('邮件端口须为 1 至 65535 的整数。')
      if (field.type === 'email' && value && !normalizeEmail(value)) throw new UserError(`${field.label}格式不正确。`)
      if (field.type === 'url' && value) {
        let url; try { url = new URL(value) } catch { throw new UserError(`${field.label}须填写完整地址。`) }
        if (url.username || url.password || (url.protocol !== 'https:' && !(process.env.SAAS_ENV !== 'prod' && ['localhost', '127.0.0.1'].includes(url.hostname) && url.protocol === 'http:'))) throw new UserError(`${field.label}须使用安全的 HTTPS 地址。`)
        if (field.key === 'SAAS_PUBLIC_URL' && (url.pathname !== '/' || url.search || url.hash)) throw new UserError('公开页面地址不能包含路径或查询参数。')
      }
    }
    if (process.env.SAAS_ENV === 'prod' && values.ALIPAY_SANDBOX === 'true') throw new UserError('生产环境不能启用支付宝沙箱。')
    if (values.WECHAT_PAY_API_V3_KEY && Buffer.byteLength(values.WECHAT_PAY_API_V3_KEY) !== 32) throw new UserError('微信支付 API v3 密钥须为 32 字节。')
    for (const field of fields.filter(field => field.type === 'secretMultiline')) if (values[field.key]) {
      try {
        if (field.key.includes('PRIVATE_KEY')) crypto.createPrivateKey(values[field.key])
        else crypto.createPublicKey(values[field.key])
      } catch { throw new UserError(`${field.label}内容无效。`) }
    }
  }
  async save (userId, input) {
    await this.assertAdmin(userId)
    if (!input || !Number.isInteger(input.revision) || !input.values || typeof input.values !== 'object' || Array.isArray(input.values) || !Array.isArray(input.clearSecrets || [])) throw new UserError('配置提交格式无效。')
    const allowed = new Map(fields.map(field => [field.key, field]))
    if (Object.keys(input.values).some(key => !allowed.has(key)) || (input.clearSecrets || []).some(key => !allowed.get(key)?.secret)) throw new UserError('包含不允许修改的系统参数。')
    await this.db.transaction(async () => {
      await this.assertAdmin(userId)
      const row = (await this.db.execute('SELECT * FROM system_settings WHERE id=1 FOR UPDATE'))[0]
      if (row.revision !== input.revision) throw new UserError('配置已被修改，请刷新后重试。', 409)
      const values = JSON.parse(this.db.decrypt(row.value_ciphertext)); const changed = []
      for (const [key, value] of Object.entries(input.values)) {
        if (allowed.get(key).secret && value === '') continue
        if (JSON.stringify(values[key]) !== JSON.stringify(value)) { values[key] = value; changed.push(key) }
      }
      for (const key of input.clearSecrets || []) if (values[key]) { values[key] = ''; changed.push(key) }
      this.validate(values)
      if (!changed.length) return
      await this.db.execute('UPDATE system_settings SET value_ciphertext=?,revision=revision+1,updated_at=?,updated_by=? WHERE id=1', [this.db.encrypt(JSON.stringify(values)), Date.now(), userId])
      await this.db.execute('INSERT INTO system_settings_audit VALUES(?,?,?,?,?)', [crypto.randomUUID(), userId, row.revision + 1, JSON.stringify([...new Set(changed)]), Date.now()])
    })
    return await this.publicSettings(userId)
  }
  async provisionAdmin (email) {
    email = normalizeEmail(email)
    if (!email) throw new UserError('请填写有效的管理员邮箱。')
    return await this.db.transaction(async () => {
      let user = await this.db.userByEmail(email); let password = null
      if (!user) {
        password = crypto.randomBytes(24).toString('base64url')
        user = { id: crypto.randomUUID() }; const workspaceId = crypto.randomUUID(); const now = Date.now()
        await this.db.execute('INSERT INTO users VALUES(?,?,?,?,?,?)', [user.id, email, '系统管理员', hashPassword(password), now, now])
        await this.db.execute('INSERT INTO workspaces VALUES(?,?,?)', [workspaceId, '管理工作空间', user.id])
        await this.db.execute('INSERT INTO members VALUES(?,?,?,?,?)', [crypto.randomUUID(), workspaceId, user.id, 'owner', JSON.stringify({ mode: 'all', ids: [] })])
      }
      await this.db.execute('INSERT IGNORE INTO system_administrators VALUES(?,?)', [user.id, Date.now()])
      return { email, password }
    })
  }
}

module.exports = { SystemSettings }
