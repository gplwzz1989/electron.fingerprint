const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const QRCode = require('qrcode')
const { readServerConfig } = require('./server-config')
const { UserError } = require('./mysql-database')
const { WechatPayProvider, AlipayProvider } = require('./payment-providers')

const parse = value => typeof value === 'string' ? JSON.parse(value) : value
const toBigInt = value => typeof value === 'bigint' ? value : BigInt(Math.trunc(Number(value)))
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
    return { id: row.id, plan: parse(row.plan), amount: row.amount, currency: row.currency, method: row.provider, status: row.status === 'pending' && Number(row.expiresAt) <= Date.now() ? 'expired' : row.status, createdAt: Number(row.createdAt), expiresAt: Number(row.expiresAt), paidAt: row.paidAt === null ? null : Number(row.paidAt), hasPaymentCode: row.status === 'pending' && Number(row.expiresAt) > Date.now() && Boolean(row.codeUrl) }
  }
  async subscription (workspaceId) {
    const row = await this.database.client.billingSubscription.findUnique({ where: { workspaceId } })
    return row ? { ...parse(row.plan), startsAt: Number(row.startsAt), expiresAt: Number(row.expiresAt), active: Number(row.expiresAt) > Date.now() } : null
  }
  async summary (workspaceId, includeOrders) {
    const orders = includeOrders ? (await this.database.client.billingOrder.findMany({ where: { workspaceId }, orderBy: { createdAt: 'desc' }, take: 100 })).map(row => this.publicOrder(row)) : []
    return { subscription: await this.subscription(workspaceId), plans: this.plans, orders, paymentMethods: this.methods() }
  }
  async order (workspaceId, id) {
    const row = await this.database.client.billingOrder.findFirst({ where: { id, workspaceId } })
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
      const existing = await this.database.client.billingOrder.findUnique({ where: { workspaceId_requestId: { workspaceId, requestId: body.requestId } } })
      if (existing) {
        if (existing.provider !== body.method || parse(existing.plan).id !== body.planId) throw new UserError('同一订单请求不能更换套餐或付款方式。', 409)
        return existing
      }
      // 当前只支持同套餐续费；避免不同套餐剩余时长折算不明确时发生收费。
      const subscription = await this.subscription(workspaceId)
      if (subscription?.active && subscription.id !== plan.id) throw new UserError('当前订阅有效期内仅支持原套餐续费，请到期后选择其他套餐。', 409)
      const pending = (await this.database.client.billingOrder.findMany({ where: { workspaceId, status: { in: ['creating', 'pending'] }, expiresAt: { gt: toBigInt(Date.now()) } }, select: { plan: true } })).map(item => parse(item.plan))
      if (pending.some(item => item.id !== plan.id)) throw new UserError('存在其他套餐的待付款订单，请处理完毕或等待过期后再下单。', 409)
      const now = Date.now(); const id = 'QJ' + crypto.randomBytes(15).toString('hex')
      await this.database.client.billingOrder.create({ data: { id, workspaceId, createdBy: userId, requestId: body.requestId, provider: provider.key, plan, amount: plan.amount, currency: 'CNY', status: 'creating', createdAt: toBigInt(now), expiresAt: toBigInt(now + 1800000), checkedAt: null, paidAt: null, codeUrl: null, transactionId: null } })
      fresh = true
      return await this.order(workspaceId, id)
    })
    if (!fresh) return this.publicOrder(row)
    try {
      const codeUrl = await provider.create({ id: row.id, plan: parse(row.plan), amount: row.amount, expiresAt: Number(row.expiresAt) })
      await this.database.client.billingOrder.updateMany({ where: { id: row.id, status: 'creating' }, data: { codeUrl, status: 'pending' } })
      return this.publicOrder(await this.order(workspaceId, row.id))
    } catch {
      // 超时不等于下单失败，保留原单供查单；不把网络错误转换成付款成功。
      throw new UserError('支付订单暂未确认，请在订阅订单中查询结果，避免重复下单。', 502)
    }
  }
  async reconcile (workspaceId, id) {
    const row = await this.order(workspaceId, id)
    const now = Date.now()
    if (!['paid', 'review'].includes(row.status) && now - Number(row.checkedAt || 0) >= 5000) {
      const claimed = await this.database.client.billingOrder.updateMany({ where: { id, status: { notIn: ['paid', 'review'] }, OR: [{ checkedAt: null }, { checkedAt: { lte: toBigInt(now - 5000) } }] }, data: { checkedAt: toBigInt(now) } })
      if (claimed.count) { const settlement = await this.provider(row.provider).query(this.publicOrder(row)); if (settlement) await this.settle(row.provider, settlement) }
    }
    return this.publicOrder(await this.order(workspaceId, id))
  }
  async settle (provider, result) {
    if (!/^[a-zA-Z0-9]{32}$/.test(result.id || '') || typeof result.transactionId !== 'string' || !result.transactionId || result.transactionId.length > 100 || !Number.isFinite(result.paidAt)) throw new UserError('支付通知内容不完整。', 400)
    const located = await this.database.client.billingOrder.findUnique({ where: { id: result.id }, select: { workspaceId: true } })
    if (!located) throw new UserError('支付通知订单不存在。', 400)
    try {
      await this.database.transaction(async () => {
        const row = await this.database.client.billingOrder.findUnique({ where: { id: result.id } })
        if (!row) throw new UserError('支付通知订单不存在。', 400)
        if (row.provider !== provider || row.amount !== result.amount || row.currency !== 'CNY') throw new UserError('支付通知与订单金额或通道不一致。', 400)
        if (['paid', 'review'].includes(row.status)) { if (row.transactionId !== result.transactionId) throw new UserError('支付流水与原订单不一致。', 400); return }
        const now = Date.now(); const plan = parse(row.plan); const subscription = await this.subscription(row.workspaceId)
        // 极端情况下跨套餐旧单延迟成功，保存已付事实但不重复覆盖权益，转人工核对。
        const review = subscription?.active && subscription.id !== plan.id
        await this.database.client.billingOrder.update({ where: { id: row.id }, data: { status: review ? 'review' : 'paid', transactionId: result.transactionId, paidAt: toBigInt(result.paidAt) } })
        if (review) return
        const startsAt = subscription?.active ? subscription.startsAt : now
        const expiresAt = Math.max(now, subscription?.expiresAt || 0) + plan.periodDays * 86400000
        await this.database.client.billingSubscription.upsert({ where: { workspaceId: row.workspaceId }, create: { workspaceId: row.workspaceId, plan, startsAt: toBigInt(startsAt), expiresAt: toBigInt(expiresAt), lastOrderId: row.id }, update: { plan, startsAt: toBigInt(startsAt), expiresAt: toBigInt(expiresAt), lastOrderId: row.id } })
      })
    } catch (error) { if (error.code === 'P2002') throw new UserError('支付流水已关联其他订单。', 400); throw error }
  }
  async notification (method, headers, raw) { return await this.settle(method, this.provider(method).notification(headers, raw)) }
  async paymentCode (workspaceId, id) {
    const row = await this.order(workspaceId, id)
    if (!this.publicOrder(row).hasPaymentCode) throw new UserError('此订单暂无有效支付码，请查询付款结果。', 409)
    return await QRCode.toString(row.codeUrl, { type: 'svg', errorCorrectionLevel: 'M', margin: 4, width: 220 })
  }
  async withCapacity (workspaceId, kind, operation, addition = true) {
    return await this.database.transaction(async () => {
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
