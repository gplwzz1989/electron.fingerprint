const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const QRCode = require('qrcode')
const { readServerConfig } = require('./server-config')
const { UserError } = require('./mysql-database')
const { WechatPayProvider, AlipayProvider } = require('./payment-providers')

const parse = value => typeof value === 'string' ? JSON.parse(value) : value
const unavailable = () => new UserError('支付通道尚未开放，请完成商户配置与验收。', 503)
class BillingService {
  constructor (database, configFile, runtimeConfig) {
    this.database = database; this.configFile = configFile
    this.config = runtimeConfig || readServerConfig(configFile); this.providers = new Map()
    if (this.config.PAYMENTS_ENABLED === 'true') {
      for (const Provider of [WechatPayProvider, AlipayProvider]) {
        try { const provider = new Provider(this.config); this.providers.set(provider.key, provider) } catch { /* 未完整配置的通道保持关闭，不输出商户密钥或证书内容。 */ }
      }
    }
    this.plans = this.readPlans()
  }
  readPlans () {
    if (!Array.isArray(this.config.BILLING_PLANS) && !this.config.BILLING_PLANS_FILE) return []
    try {
      const file = this.config.BILLING_PLANS_FILE && path.resolve(path.dirname(this.configFile || process.env.SAAS_CONFIG_FILE || path.join(__dirname, `../.env.${process.env.SAAS_ENV || 'dev'}`)), this.config.BILLING_PLANS_FILE)
      const data = Array.isArray(this.config.BILLING_PLANS) ? { plans: this.config.BILLING_PLANS } : JSON.parse(fs.readFileSync(file, 'utf8'))
      if (!Array.isArray(data.plans) || data.plans.length > 50) throw new Error()
      const ids = new Set()
      return data.plans.filter(plan => plan.enabled === true).map(plan => {
        if (!/^[a-zA-Z0-9_-]{1,48}$/.test(plan.id) || ids.has(plan.id) || typeof plan.name !== 'string' || !plan.name.trim() || plan.name.length > 80 || !Number.isInteger(plan.amount) || plan.amount < 1 || plan.amount > 100000000 || !Number.isInteger(plan.periodDays) || plan.periodDays < 1 || plan.periodDays > 3660 || plan.currency !== 'CNY') throw new Error()
        const quotas = Object.fromEntries(['fingerprints', 'environments', 'members'].map(kind => {
          const limit = plan.quotas?.[kind]
          if (!Number.isInteger(limit) || limit < 1 || limit > 10000000) throw new Error()
          return [kind, limit]
        }))
        ids.add(plan.id)
        return { id: plan.id, name: plan.name.trim(), amount: plan.amount, currency: 'CNY', periodDays: plan.periodDays, quotas }
      })
    } catch { throw new Error('套餐配置无效，请检查服务端套餐文件。') }
  }
  methods () { return [{ key: 'wechat', name: '微信支付' }, { key: 'alipay', name: '支付宝' }].map(item => ({ ...item, enabled: this.providers.has(item.key) })) }
  provider (method) { const provider = this.providers.get(method); if (!provider) throw unavailable(); return provider }
  publicOrder (row) {
    return { id: row.id, plan: parse(row.plan), amount: row.amount, currency: row.currency, method: row.provider, status: row.status === 'pending' && row.expires_at <= Date.now() ? 'expired' : row.status, createdAt: row.created_at, expiresAt: row.expires_at, paidAt: row.paid_at, hasPaymentCode: row.status === 'pending' && row.expires_at > Date.now() && Boolean(row.code_url) }
  }
  async subscription (workspaceId) {
    const row = (await this.database.execute('SELECT * FROM billing_subscriptions WHERE workspace_id=?', [workspaceId]))[0]
    return row ? { ...parse(row.plan), startsAt: row.starts_at, expiresAt: row.expires_at, active: row.expires_at > Date.now() } : null
  }
  async summary (workspaceId, includeOrders) {
    const orders = includeOrders ? (await this.database.execute('SELECT * FROM billing_orders WHERE workspace_id=? ORDER BY created_at DESC LIMIT 100', [workspaceId])).map(row => this.publicOrder(row)) : []
    return { subscription: await this.subscription(workspaceId), plans: this.plans, orders, paymentMethods: this.methods() }
  }
  async order (workspaceId, id) {
    const row = (await this.database.execute('SELECT * FROM billing_orders WHERE id=? AND workspace_id=?', [id, workspaceId]))[0]
    if (!row) throw new UserError('订单不存在或无法访问。', 404)
    return row
  }
  async create (workspaceId, userId, body) {
    const provider = this.provider(body.method)
    const plan = this.plans.find(item => item.id === body.planId)
    if (!plan) throw new UserError('请选择有效的在售套餐。')
    if (!/^[a-f0-9-]{36}$/i.test(body.requestId || '')) throw new UserError('订单请求标识无效，请刷新页面后重试。')
    let fresh = false
    const row = await this.database.transaction(async () => {
      await this.database.execute('SELECT id FROM workspaces WHERE id=? FOR UPDATE', [workspaceId])
      const existing = (await this.database.execute('SELECT * FROM billing_orders WHERE workspace_id=? AND request_id=?', [workspaceId, body.requestId]))[0]
      if (existing) {
        if (existing.provider !== body.method || parse(existing.plan).id !== body.planId) throw new UserError('同一订单请求不能更换套餐或付款方式。', 409)
        return existing
      }
      // 当前只支持同套餐续费；避免不同套餐剩余时长折算不明确时发生收费。
      const subscription = await this.subscription(workspaceId)
      if (subscription?.active && subscription.id !== plan.id) throw new UserError('当前订阅有效期内仅支持原套餐续费，请到期后选择其他套餐。', 409)
      const pending = (await this.database.execute("SELECT plan FROM billing_orders WHERE workspace_id=? AND status IN ('creating','pending') AND expires_at>?", [workspaceId, Date.now()])).map(item => parse(item.plan))
      if (pending.some(item => item.id !== plan.id)) throw new UserError('存在其他套餐的待付款订单，请处理完毕或等待过期后再下单。', 409)
      const now = Date.now(); const id = 'QJ' + crypto.randomBytes(15).toString('hex')
      await this.database.execute("INSERT INTO billing_orders(id,workspace_id,created_by,request_id,provider,plan,amount,currency,status,created_at,expires_at) VALUES(?,?,?,?,?,?,?,'CNY','creating',?,?)", [id, workspaceId, userId, body.requestId, provider.key, JSON.stringify(plan), plan.amount, now, now + 1800000])
      fresh = true
      return await this.order(workspaceId, id)
    })
    if (!fresh) return this.publicOrder(row)
    try {
      const codeUrl = await provider.create({ id: row.id, plan: parse(row.plan), amount: row.amount, expiresAt: row.expires_at })
      await this.database.execute("UPDATE billing_orders SET code_url=?,status='pending' WHERE id=? AND status='creating'", [codeUrl, row.id])
      return this.publicOrder(await this.order(workspaceId, row.id))
    } catch {
      // 超时不等于下单失败，保留原单供查单；不把网络错误转换成付款成功。
      throw new UserError('支付订单暂未确认，请在订阅订单中查询结果，避免重复下单。', 502)
    }
  }
  async reconcile (workspaceId, id) {
    const row = await this.order(workspaceId, id)
    if (!['paid', 'review'].includes(row.status) && Date.now() - (row.checked_at || 0) >= 5000) {
      const claimed = await this.database.execute('UPDATE billing_orders SET checked_at=? WHERE id=? AND (checked_at IS NULL OR checked_at<=?)', [Date.now(), id, Date.now() - 5000])
      if (claimed.affectedRows) { const settlement = await this.provider(row.provider).query(this.publicOrder(row)); if (settlement) await this.settle(row.provider, settlement) }
    }
    return this.publicOrder(await this.order(workspaceId, id))
  }
  async settle (provider, result) {
    if (!/^[a-zA-Z0-9]{32}$/.test(result.id || '') || typeof result.transactionId !== 'string' || !result.transactionId || result.transactionId.length > 100 || !Number.isFinite(result.paidAt)) throw new UserError('支付通知内容不完整。', 400)
    const located = (await this.database.execute('SELECT workspace_id FROM billing_orders WHERE id=?', [result.id]))[0]
    if (!located) throw new UserError('支付通知订单不存在。', 400)
    try {
      await this.database.transaction(async () => {
        await this.database.execute('SELECT id FROM workspaces WHERE id=? FOR UPDATE', [located.workspace_id])
        const row = (await this.database.execute('SELECT * FROM billing_orders WHERE id=? FOR UPDATE', [result.id]))[0]
        if (row.provider !== provider || row.amount !== result.amount || row.currency !== 'CNY') throw new UserError('支付通知与订单金额或通道不一致。', 400)
        if (['paid', 'review'].includes(row.status)) { if (row.transaction_id !== result.transactionId) throw new UserError('支付流水与原订单不一致。', 400); return }
        const now = Date.now(); const plan = parse(row.plan); const subscription = await this.subscription(row.workspace_id)
        // 极端情况下跨套餐旧单延迟成功，保存已付事实但不重复覆盖权益，转人工核对。
        const review = subscription?.active && subscription.id !== plan.id
        await this.database.execute("UPDATE billing_orders SET status=?,transaction_id=?,paid_at=? WHERE id=?", [review ? 'review' : 'paid', result.transactionId, result.paidAt, row.id])
        if (review) return
        const startsAt = subscription?.active ? subscription.startsAt : now
        const expiresAt = Math.max(now, subscription?.expiresAt || 0) + plan.periodDays * 86400000
        await this.database.execute('INSERT INTO billing_subscriptions VALUES(?,?,?,?,?) ON DUPLICATE KEY UPDATE plan=VALUES(plan),starts_at=VALUES(starts_at),expires_at=VALUES(expires_at),last_order_id=VALUES(last_order_id)', [row.workspace_id, JSON.stringify(plan), startsAt, expiresAt, row.id])
      })
    } catch (error) { if (error.code === 'ER_DUP_ENTRY') throw new UserError('支付流水已关联其他订单。', 400); throw error }
  }
  async notification (method, headers, raw) { return await this.settle(method, this.provider(method).notification(headers, raw)) }
  async paymentCode (workspaceId, id) {
    const row = await this.order(workspaceId, id)
    if (!this.publicOrder(row).hasPaymentCode) throw new UserError('此订单暂无有效支付码，请查询付款结果。', 409)
    return await QRCode.toString(row.code_url, { type: 'svg', errorCorrectionLevel: 'M', margin: 4, width: 220 })
  }
  async withCapacity (workspaceId, kind, operation, addition = true) {
    return await this.database.transaction(async () => {
      await this.database.execute('SELECT id FROM workspaces WHERE id=? FOR UPDATE', [workspaceId])
      const subscription = await this.subscription(workspaceId)
      if (subscription && !subscription.active) throw new UserError('团队订阅已到期，请续费后继续创建资源或启动环境。', 403)
      if (addition && subscription?.active) {
        const count = kind === 'fingerprints' ? (await this.database.fingerprints(workspaceId)).length : kind === 'members' ? (await this.database.members(workspaceId)).length : (await this.database.list(kind, workspaceId)).length
        if (count >= subscription.quotas[kind]) throw new UserError('当前套餐用量已达上限，请调整资源后再试。', 409)
      }
      return await operation()
    })
  }
}

module.exports = { BillingService }
