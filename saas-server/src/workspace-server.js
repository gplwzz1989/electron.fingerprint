const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { WorkspaceDatabase, UserError } = require('./mysql-database')
const { verifyPassword } = require('./auth')
const { checkProxy } = require('./proxy-check')
const { createFingerprintProfile, getDefaultProfile, getPresetTemplateById } = require('./fingerprint/profile-store')
const { auditGPUProfileConsistency, generateRandomHardwareProfile } = require('./fingerprint/webgl-topology')
const { catalog: clientPlatforms } = require('./client-platform-service')
const { RegistrationMailer } = require('./registration-mailer')
const { normalizeEmail } = require('./email-address')
const { BillingService } = require('./billing-service')
const { sealLaunch, validateLaunchRequest } = require('./desktop-protocol')
const { MediaAuthorizations } = require('./media-authorizations')
const { ClientUpdateService } = require('./client-update-service')
const { SystemSettings } = require('./system-settings')
const { PlatformReleaseService } = require('./platform-release-service')

const platforms = [{ key: 'wechat', name: '微信公众号', icon: 'assets/platforms/wechat.png' }, { key: 'douyin', name: '抖音', icon: 'assets/platforms/douyin.png' }, { key: 'weibo', name: '新浪微博', icon: 'assets/platforms/weibo.png' }]
const hash = text => crypto.createHash('sha256').update(text).digest('hex')
const text = (value, label, limit = 160) => {
  if (typeof value !== 'string' || !value.trim() || value.length > limit) throw new UserError(`请填写有效的${label}。`)
  return value.trim()
}
const safeUser = user => ({ id: user.id, name: user.name, email: user.email })
const safeProxy = proxy => { const { credential, ...safe } = proxy; return { ...safe, hasAuthentication: Boolean(credential) } }
const platformIcons = { shipinhao: 'shipinhao.png', kuaishou: 'kuaishou.png', xiaohongshu: 'xiaohongshu.png', douyin: 'douyin.png' }
function validateProfile (input) {
  let profile
  try { profile = createFingerprintProfile(input) } catch { throw new UserError('指纹参数格式无效，请检查必填项、屏幕和内存设置。') }
  const audit = auditGPUProfileConsistency(profile)
  if (!audit.consistent) throw new UserError(audit.issues.filter(item => item.severity === 'error').map(item => item.message).join(' '))
  if (profile.locale.language !== profile.locale.languages[0]) throw new UserError('主要语言必须与语言列表首项一致。')
  let preferred
  try {
    const values = profile.browser.acceptLanguage.split(',').map(item => {
      const match = item.trim().match(/^([a-zA-Z0-9-]+)(?:;q=(0(?:\.\d{1,3})?|1(?:\.0{1,3})?))?$/)
      if (!match) throw new Error()
      return { tag: Intl.getCanonicalLocales(match[1])[0], quality: match[2] === undefined ? 1 : Number(match[2]) }
    }).sort((a, b) => b.quality - a.quality)
    preferred = values[0]
  } catch { throw new UserError('请求语言格式或权重不正确。') }
  if (!preferred || preferred.quality <= 0 || preferred.tag !== Intl.getCanonicalLocales(profile.locale.language)[0]) throw new UserError('请求语言优先级与主要语言不一致。')
  if (profile.browser.userAgent) {
    const ua = profile.browser.userAgent; const version = Number(ua.match(/Chrome\/(\d+)/)?.[1])
    const system = /Windows NT/.test(ua) ? 'Win32' : /Macintosh/.test(ua) ? 'MacIntel' : /Linux/.test(ua) ? 'Linux x86_64' : ''
    if (version !== profile.browser.chromiumMajor || system !== profile.hardware.platform || /Android|Mobile|iPhone|iPad/i.test(ua)) throw new UserError('浏览器标识与桌面平台或内核版本不一致。')
  }
  return profile
}

function loadEnvironment (directory, environment) {
  const file = path.join(directory, `.env.${environment}`)
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/)
    // 端口优先使用配置文件，避免 PM2 或宿主机的 PORT 覆盖实际监听端口。
    if (match && (match[1] === 'PORT' || process.env[match[1]] === undefined)) process.env[match[1]] = match[2].trim().replace(/^(["'])(.*)\1$/, '$2')
  }
}

class WorkspaceServer {
  constructor ({ port = 8088, host = '127.0.0.1', dataDir = path.join(__dirname, '../data/workspace'), publicUrl = '', allowPrivateProxy = false, platformService = null, databaseName, mailConfigFile, billingConfigFile, updateConfigFile } = {}) {
    this.port = port; this.host = host; this.publicUrl = publicUrl; this.allowPrivateProxy = allowPrivateProxy
    this.database = new WorkspaceDatabase(dataDir, { databaseName }); this.platformService = platformService
    this.platformReleases = new PlatformReleaseService(this.database, path.join(dataDir, 'platform-releases'))
    this.mediaAuthorizations = new MediaAuthorizations(this.database, platformService)
    this.registrationMailer = new RegistrationMailer(this.database, mailConfigFile)
    this.billing = new BillingService(this.database, billingConfigFile)
    this.clientUpdates = new ClientUpdateService(updateConfigFile)
    this.serviceConfigFiles = { mailConfigFile, billingConfigFile, updateConfigFile }
    this.systemSettings = new SystemSettings(this.database, undefined, { SAAS_PUBLIC_URL: publicUrl, SAAS_ALLOW_PRIVATE_PROXY: String(allowPrivateProxy) })
    this.publicDirectory = path.join(__dirname, '../public'); this.rateLimits = new Map()
    this.server = http.createServer((req, res) => { this.handle(req, res).catch(() => { if (!res.headersSent) this.json(res, 500, { ok: false, message: '服务暂时不可用，请稍后重试。' }); else res.destroy() }) })
    this.configurationReady = this.systemSettings.initialize().then(() => this.refreshSystemSettings())
  }
  async refreshSystemSettings () {
    const state = await this.systemSettings.read()
    if (this.configRevision === state.revision) return
    const { mailConfigFile, billingConfigFile, updateConfigFile } = this.serviceConfigFiles
    const mailer = new RegistrationMailer(this.database, mailConfigFile, mailConfigFile ? undefined : state.values)
    const billing = new BillingService(this.database, billingConfigFile, billingConfigFile ? undefined : state.values)
    const updates = new ClientUpdateService(updateConfigFile, updateConfigFile ? undefined : state.values)
    this.registrationMailer.close()
    this.registrationMailer = mailer; this.billing = billing; this.clientUpdates = updates
    this.publicUrl = state.values.SAAS_PUBLIC_URL
    this.allowPrivateProxy = state.values.SAAS_ALLOW_PRIVATE_PROXY === 'true'
    this.configRevision = state.revision
  }
  json (res, status, data) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)) }
  async body (req) {
    if (!req.headers['content-type']?.startsWith('application/json')) throw new UserError('请使用有效的页面表单提交数据。', 415)
    let body = ''
    for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 262144) throw new UserError('提交内容过大。', 413) }
    try { const value = JSON.parse(body || '{}'); if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error(); return value } catch { throw new UserError('提交的数据格式不正确。') }
  }
  cookie (req) { const value = req.headers.cookie?.split(';').map(item => item.trim()).find(item => item.startsWith('qijie_session=')); return value ? value.slice(14) : '' }
  async handle (req, res) {
    await this.configurationReady
    await this.refreshSystemSettings()
    res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'same-origin'); res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: https:; connect-src 'self' http://127.0.0.1:* http://localhost:*; object-src 'none'; base-uri 'self'; frame-ancestors 'none'")
    const address = this.server.address(); const origin = this.publicUrl ? new URL(this.publicUrl).origin : `http://${this.host}:${address?.port || this.port}`
    const url = new URL(req.url, origin); const pathname = url.pathname; const method = req.method
    const send = (data, status = 200) => this.json(res, status, { ok: true, ...data })
    try {
      if (req.headers.origin && req.headers.origin !== origin) throw new UserError('请求来源不受信任，请从工作空间页面重试。', 403)
      if (method === 'GET' && pathname.startsWith('/platform-runtime/')) throw new UserError('平台能力已迁移至独立客户端，请更新客户端能力包。', 410)
      if (method === 'GET' && pathname === '/api/platform-releases/manifest.json') {
        const manifest = await this.platformReleases.current()
        if (!manifest) throw new UserError('尚未发布完整的平台与 RPA 能力，请在管理后台上传两个组件。', 404)
        return this.json(res, 200, manifest)
      }
      if (method === 'GET' && pathname.startsWith('/api/platform-releases/')) {
        const bytes = await this.platformReleases.download(pathname.slice('/api/platform-releases/'.length))
        res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'public, max-age=31536000, immutable' }); return res.end(bytes)
      }
      if (!pathname.startsWith('/api/')) return this.static(req, res, pathname)
      if (method === 'GET' && pathname === '/api/health') return send({ status: 'available', version: require('../package.json').version, launchProtocols: ['desktop-launch-v1', 'qijie-launch-v1'] })
      if (await this.clientUpdates.handle(req, res, pathname)) return
      const paymentNotification = pathname.match(/^\/api\/payments\/(wechat|alipay)\/notify$/)
      if (paymentNotification && method === 'POST') {
        const provider = paymentNotification[1]
        const contentType = provider === 'wechat' ? 'application/json' : 'application/x-www-form-urlencoded'
        if (!req.headers['content-type']?.startsWith(contentType)) throw new UserError('支付通知格式不正确。', 415)
        const chunks = []; let length = 0
        for await (const chunk of req) { length += chunk.length; if (length > 262144) throw new UserError('支付通知内容过大。', 413); chunks.push(chunk) }
        await this.billing.notification(provider, req.headers, Buffer.concat(chunks).toString('utf8'))
        res.writeHead(provider === 'wechat' ? 204 : 200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' })
        return res.end(provider === 'wechat' ? '' : 'success')
      }
      if (method === 'GET' && pathname === '/api/auth/registration-options') return send({ emailVerificationRequired: true, emailDeliveryAvailable: this.registrationMailer.available })
      if (method === 'POST' && pathname === '/api/auth/registration-code') {
        const body = await this.body(req); const email = normalizeEmail(body.email)
        if (!email) throw new UserError('邮箱格式不正确。')
        const result = await this.registrationMailer.sendCode(email, req.socket.remoteAddress)
        return send({ ...result, message: '验证码邮件已发送，请检查收件箱。' })
      }
      if (method === 'GET' && pathname === '/api/platforms') return send({ platforms: (this.platformService?.catalog || clientPlatforms).map(item => ({ key: item.key, name: item.name, icon: platformIcons[item.key] ? `assets/platforms/${platformIcons[item.key]}` : item.icon, enabled: this.mediaAuthorizations.available(), reason: this.mediaAuthorizations.available() ? '' : '平台授权服务尚未配置' })) })
      if (method === 'GET' && pathname === '/api/platform-runtime') {
        return send({ protocol: 'platform-runtime-v2', location: 'client', message: '请通过客户端 JSAPI 查询平台能力。' })
      }
      if (method === 'POST' && ['/api/auth/login', '/api/auth/register'].includes(pathname)) {
        const key = req.socket.remoteAddress; const now = Date.now(); const attempts = this.rateLimits.get(key) || { count: 0, until: now + 60000 }
        if (now > attempts.until) { attempts.count = 0; attempts.until = now + 60000 }
        if (++attempts.count > 12) throw new UserError('尝试次数较多，请稍后再试。', 429)
        if (this.rateLimits.size > 2000) for (const [id, entry] of this.rateLimits) if (entry.until < now) this.rateLimits.delete(id)
        this.rateLimits.set(key, attempts)
        const body = await this.body(req); const email = normalizeEmail(body.email)
        if (!email) throw new UserError('邮箱格式不正确。')
        if (typeof body.password !== 'string' || !body.password || body.password.length > 256) throw new UserError('请填写有效的密码。')
        const password = body.password
        let user
        if (pathname.endsWith('/register')) {
          if (password.length < 8 || !password.trim()) throw new UserError('密码至少需要 8 个字符，且不能全部为空格。')
          if (typeof body.verificationCode !== 'string' || !/^\d{6}$/.test(body.verificationCode)) throw new UserError('请输入邮箱收到的六位验证码。')
          const nickname = text(body.nickname ?? body.name, '昵称', 60)
          user = await this.database.register({ email, password, verificationCode: body.verificationCode, name: nickname, workspaceName: body.nickname === undefined ? text(body.workspaceName ?? nickname, '团队名称', 80) : nickname })
        } else {
          const found = await this.database.userByEmail(email)
          if (!found || !verifyPassword(password, found.password_hash)) throw new UserError('邮箱或密码错误。', 401)
          user = safeUser(found)
        }
        const session = await this.database.createSession(user.id)
        res.setHeader('Set-Cookie', `qijie_session=${session.token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400${origin.startsWith('https:') ? '; Secure' : ''}`)
        return send({ user, workspaces: await this.database.workspaces(user.id), csrf: session.csrf }, pathname.endsWith('/register') ? 201 : 200)
      }
      const session = await this.database.session(this.cookie(req))
      if (!session) throw new UserError('请先登录工作空间。', 401)
      if (!['GET', 'HEAD'].includes(method) && req.headers['x-csrf-token'] !== session.csrf) throw new UserError('页面会话已变化，请刷新后重试。', 403)
      const user = await this.database.user(session.user_id)
      if (method === 'GET' && pathname === '/api/auth/me') return send({ user, workspaces: await this.database.workspaces(user.id), csrf: session.csrf, isSystemAdmin: await this.systemSettings.isAdmin(user.id) })
      if (pathname === '/api/system/platform-releases' || pathname.startsWith('/api/system/platform-releases/')) {
        await this.systemSettings.assertAdmin(user.id)
        if (method === 'GET' && pathname === '/api/system/platform-releases') return send(await this.platformReleases.list())
        if (method === 'POST') {
          if (!req.headers['content-type']?.startsWith('application/javascript')) throw new UserError('请上传单文件 JavaScript 产物。', 415)
          const chunks = []; let size = 0
          for await (const chunk of req) { size += chunk.length; if (size > 4 * 1024 * 1024) throw new UserError('能力文件不能超过 4 MB。', 413); chunks.push(chunk) }
          return send(await this.platformReleases.publish(pathname.slice('/api/system/platform-releases/'.length), Buffer.concat(chunks), user.id), 201)
        }
        throw new UserError('此发布操作不受支持。', 405)
      }
      if (pathname === '/api/system/settings') {
        await this.systemSettings.assertAdmin(user.id)
        if (method === 'GET') return send({ settings: await this.systemSettings.publicSettings(user.id), paymentMethods: this.billing.methods(), emailDeliveryAvailable: this.registrationMailer.available })
        if (method === 'PUT') {
          const settings = await this.systemSettings.save(user.id, await this.body(req))
          await this.refreshSystemSettings()
          return send({ settings, paymentMethods: this.billing.methods(), emailDeliveryAvailable: this.registrationMailer.available, message: '系统配置已保存并生效。' })
        }
      }
      if (pathname === '/api/system/audit' && method === 'GET') {
        await this.systemSettings.assertAdmin(user.id)
        return send({ items: await this.database.execute('SELECT a.revision,a.changed_fields,a.created_at,u.email FROM system_settings_audit a JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC LIMIT 20') })
      }
      if (method === 'POST' && pathname === '/api/auth/logout') { await this.database.logout(this.cookie(req)); res.setHeader('Set-Cookie', 'qijie_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); return send({}) }
      if (method === 'GET' && pathname === '/api/fingerprint-defaults') { const profile = getDefaultProfile(); profile.id = crypto.randomUUID(); profile.noise.seed = crypto.randomUUID(); return send({ profile }) }
      if (method === 'POST' && pathname === '/api/fingerprint-draft') {
        const body = await this.body(req)
        if (!['Win32', 'MacIntel', 'Linux x86_64'].includes(body.platform)) throw new UserError('请选择有效的平台类型。')
        const preset = body.presetId ? getPresetTemplateById(body.presetId) : null
        if (body.presetId && !preset) throw new UserError('所选指纹模板不存在。')
        const profile = structuredClone(preset?.profile || getDefaultProfile())
        Object.assign(profile, generateRandomHardwareProfile({ platform: body.platform }))
        profile.id = crypto.randomUUID(); profile.noise.seed = crypto.randomUUID(); profile.browser.userAgent = null; profile.modules.webrtc = true
        return send({ profile: validateProfile(profile) })
      }
      if (method === 'POST' && pathname === '/api/fingerprint-generate') {
        const body = await this.body(req)
        if (!['Win32', 'MacIntel', 'Linux x86_64'].includes(body.platform)) throw new UserError('请选择有效的平台类型。')
        return send({ parameters: generateRandomHardwareProfile({ platform: body.platform }) })
      }
      const route = pathname.match(/^\/api\/workspaces\/([a-zA-Z0-9-]+)(?:\/([a-z-]+))?(?:\/([a-zA-Z0-9-]+))?(?:\/([a-z-]+))?$/)
      if (!route) throw new UserError('该页面或操作不存在。', 404)
      const [, workspaceId, resource, id, action] = route; const db = this.database
      const member = resource === 'invitations' && action === 'accept' ? null : await db.membership(workspaceId, user.id)
      const accessible = item => db.canAccess(member, item.id)
      const getRecord = async kind => { const record = await db.get(kind, workspaceId, id); if (!record || !accessible(record)) throw new UserError('记录不存在或无法访问。', 404); return record }
      if (resource === 'fingerprints') {
        if (method === 'GET' && !id) return send({ items: (await db.fingerprints(workspaceId)).filter(accessible) })
        if (method === 'POST' && !id) {
          db.assertWrite(member)
          const body = await this.body(req)
          if (body.id && !(await db.fingerprints(workspaceId)).some(item => item.id === body.id && accessible(item))) throw new UserError('指纹不存在或无法编辑。', 404)
          // 最终运行标识与噪声种子只由服务端生成，不采信页面提交的种子。
          const profile = validateProfile(body.profile)
          profile.id = crypto.randomUUID(); profile.noise.seed = crypto.randomUUID()
          const saved = await this.billing.withCapacity(workspaceId, 'fingerprints', () => db.saveFingerprint(workspaceId, user.id, { ...body, name: text(body.name, '指纹名称'), profile }), !body.id)
          return send({ item: saved }, 201)
        }
        if (method === 'DELETE' && id) {
          db.assertWrite(member)
          if (!(await db.fingerprints(workspaceId)).some(item => item.id === id && accessible(item))) throw new UserError('指纹不存在或无法访问。', 404)
          if ((await db.list('environments', workspaceId)).some(item => item.fingerprintId === id)) throw new UserError('该指纹仍被环境引用，请先调整环境。', 409)
          await db.execute('UPDATE fingerprints SET deleted_at=? WHERE id=? AND workspace_id=?', [Date.now(), id, workspaceId])
          return send({})
        }
      }
      if (resource === 'proxies') {
        if (method === 'GET' && !id) return send({ items: (await db.list('proxies', workspaceId)).filter(accessible).map(safeProxy) })
        if (method === 'POST' && (!id || action === 'check')) {
          db.assertWrite(member)
          const body = id ? await getRecord('proxies') : await this.body(req)
          const credentials = body.credential ? JSON.parse(db.decrypt(body.credential)) : { username: body.username || '', password: body.password || '' }
          let result
          try { result = await checkProxy({ ...body, ...credentials }, { allowPrivate: this.allowPrivateProxy }) } catch (error) {
            if (id) await db.put('proxies', workspaceId, id, { ...body, status: 'unavailable', checkedAt: Date.now() }, body.revision)
            throw error
          }
          if (id) { const saved = await db.put('proxies', workspaceId, id, { ...body, ...result }, body.revision); return send({ result, item: safeProxy(saved) }) }
          const value = { name: text(body.name, '代理名称'), protocol: body.protocol, host: body.host.trim(), port: Number(body.port), ...result, credential: db.encrypt(JSON.stringify(credentials)) }
          const saved = await db.put('proxies', workspaceId, crypto.randomUUID(), value, null)
          return send({ item: safeProxy(saved) }, 201)
        }
        if (method === 'DELETE' && id) {
          db.assertWrite(member); await getRecord('proxies')
          if ((await db.list('environments', workspaceId)).some(item => item.proxyId === id)) throw new UserError('代理仍被环境引用，暂时不能移除。', 409)
          await db.remove('proxies', workspaceId, id); return send({})
        }
      }
      if (resource === 'environments') {
        if (method === 'GET' && !id) return send({ items: (await db.list('environments', workspaceId)).filter(accessible).map(({ fingerprint, ...item }) => item) })
        if (method === 'GET' && id) { const { fingerprint, ...item } = await getRecord('environments'); return send({ item }) }
        if (method === 'POST' && !id) {
          db.assertWrite(member); const body = await this.body(req)
          const fingerprint = await db.fingerprint(workspaceId, body.fingerprintId, body.fingerprintVersion)
          if (!fingerprint || !db.canAccess(member, fingerprint.id)) throw new UserError('请选择有权限访问的有效指纹版本。')
          let startUrl
          try { const parsed = new URL(body.startUrl || 'about:blank'); if (!['http:', 'https:', 'about:'].includes(parsed.protocol) || (parsed.protocol === 'about:' && parsed.href !== 'about:blank') || parsed.username || parsed.password) throw new Error(); startUrl = parsed.href } catch { throw new UserError('启动网址应使用完整的网页地址。') }
          let proxy = null
          if (body.proxyId) {
            proxy = await db.get('proxies', workspaceId, body.proxyId)
            if (!proxy || !db.canAccess(member, proxy.id)) throw new UserError('代理不存在或无法访问。')
            const result = await checkProxy({ ...proxy, ...JSON.parse(db.decrypt(proxy.credential)) }, { allowPrivate: this.allowPrivateProxy })
            if (result.timezone !== fingerprint.profile.locale.timezone && body.timezoneAcknowledged !== true) throw new UserError('代理出口时区与指纹不同，请确认差异或更换指纹。', 409)
          }
          if (body.id) { const existing = await db.get('environments', workspaceId, body.id); if (!existing || !accessible(existing)) throw new UserError('环境不存在或无法编辑。', 404) }
          const value = { name: text(body.name, '环境名称'), startUrl, fingerprintId: fingerprint.id, fingerprintVersion: fingerprint.version, fingerprint: db.encodeFingerprint(fingerprint.profile), proxyId: proxy?.id || null, timezoneAcknowledged: Boolean(body.timezoneAcknowledged), updatedAt: Date.now() }
          const saved = await this.billing.withCapacity(workspaceId, 'environments', () => db.put('environments', workspaceId, body.id || crypto.randomUUID(), value, body.expectedRevision ?? null), !body.id)
          const { fingerprint: sealedFingerprint, ...item } = saved
          return send({ item }, 201)
        }
        if (method === 'POST' && id && action === 'launch') {
          db.assertWrite(member); const environment = await getRecord('environments')
          const encryption = await this.body(req)
          let extra = {}
          if (encryption.authorizationId) {
            const task = await db.get('authorizations', workspaceId, encryption.authorizationId)
            if (!task || task.environmentId !== environment.id) throw new UserError('授权任务与环境不匹配。', 409)
            await this.mediaAuthorizations.access(workspaceId, user.id, task)
            this.mediaAuthorizations.assertActive(task)
            if (task.status !== 'waiting' || !task.proofKey) throw new UserError('授权任务已结束，请重新开始。', 409)
            extra = { authorization: { operationId: task.id, platformKey: task.platform.key, publicKey: task.publicKey, proofKey: db.decrypt(task.proofKey), expiresAt: task.expiresAt, mode: task.mode, expectedUserId: task.targetAccountId ? (await db.get('accounts', workspaceId, task.targetAccountId))?.platformUserId : null } }
          }
          return send({ envelope: await this.launchEnvelope(workspaceId, member, environment, encryption, extra) })
        }
        if (method === 'DELETE' && id) {
          await db.transaction(async () => {
            await db.execute('SELECT id FROM workspaces WHERE id=? FOR UPDATE', [workspaceId])
            const current = await db.membership(workspaceId, user.id); db.assertWrite(current)
            const environment = await db.get('environments', workspaceId, id)
            if (!environment || !db.canAccess(current, id)) throw new UserError('环境不存在或无法访问。', 404)
            if ((await db.list('accounts', workspaceId)).some(account => account.environmentId === id)) throw new UserError('该环境仍有关联账号，请先删除账号。', 409)
            await db.remove('environments', workspaceId, id)
          }); return send({})
        }
      }
      if (resource === 'members') {
        if (method === 'GET' && !id) return send({ items: (await db.members(workspaceId)) })
        if (method === 'PUT' && id) {
          db.assertWrite(member, true); const target = (await db.members(workspaceId)).find(item => item.id === id)
          if (!target || target.role === 'owner' || target.userId === user.id) throw new UserError('不能修改团队所有者或自己的权限。', 403)
          const body = await this.body(req)
          if (!['admin', 'operator', 'viewer'].includes(body.role)) throw new UserError('角色无效。')
          if (member.role !== 'owner' && (target.role === 'admin' || body.role === 'admin')) throw new UserError('只有所有者可调整管理员。', 403)
          if (!['all', 'selected'].includes(body.scope?.mode) || !Array.isArray(body.scope.ids) || body.scope.ids.some(id => typeof id !== 'string')) throw new UserError('资源范围格式不正确。')
          await db.execute('UPDATE members SET role=?,scope=? WHERE id=? AND workspace_id=?', [body.role, JSON.stringify(body.scope), id, workspaceId]); return send({})
        }
        if (method === 'DELETE' && id) {
          db.assertWrite(member, true); const target = (await db.members(workspaceId)).find(item => item.id === id)
          if (!target || target.role === 'owner' || target.userId === user.id || (target.role === 'admin' && member.role !== 'owner')) throw new UserError('不能移除此成员。', 403)
          await db.execute('DELETE FROM members WHERE id=? AND workspace_id=?', [id, workspaceId]); return send({})
        }
      }
      if (resource === 'invitations') {
        if (method === 'POST' && !id) {
          db.assertWrite(member, true); const body = await this.body(req); const email = text(body.email, '受邀邮箱', 254).toLowerCase()
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !['operator', 'viewer'].includes(body.role)) throw new UserError('请填写有效邮箱并选择操作成员或只读成员。')
          if ((await db.members(workspaceId)).some(item => item.email === email)) throw new UserError('该账户已经是团队成员。', 409)
          const token = crypto.randomBytes(32).toString('hex')
          const invitation = await db.put('invitations', workspaceId, crypto.randomUUID(), { email, role: body.role, tokenHash: hash(token), expiresAt: Date.now() + 7 * 86400000, used: false }, null)
          return send({ invitation: { id: invitation.id, email, expiresAt: invitation.expiresAt }, token }, 201)
        }
        if (method === 'POST' && id && action === 'accept') {
          const body = await this.body(req); const invitation = await db.get('invitations', workspaceId, id)
          if (!invitation || invitation.used || invitation.expiresAt < Date.now() || invitation.email !== user.email || hash(String(body.token || '')) !== invitation.tokenHash) throw new UserError('邀请无效、已使用或不属于当前账户。', 403)
          await this.billing.withCapacity(workspaceId, 'members', async () => {
            const locked = (await db.execute("SELECT data FROM records WHERE kind='invitations' AND id=? AND workspace_id=? FOR UPDATE", [id, workspaceId]))[0]
            const latest = typeof locked?.data === 'string' ? JSON.parse(locked.data) : locked?.data
            if (!latest || latest.used || latest.expiresAt < Date.now()) throw new UserError('邀请已使用或已经过期。', 403)
            await db.execute('INSERT INTO members VALUES(?,?,?,?,?)', [crypto.randomUUID(), workspaceId, user.id, invitation.role, JSON.stringify({ mode: 'selected', ids: [] })])
            await db.execute("UPDATE records SET data=JSON_SET(data,'$.used',true),revision=revision+1 WHERE kind='invitations' AND id=? AND workspace_id=?", [id, workspaceId])
          }); return send({})
        }
      }
      if (resource === 'accounts' && method === 'DELETE' && id && !action) {
        await db.transaction(async () => {
          await db.execute('SELECT id FROM workspaces WHERE id=? FOR UPDATE', [workspaceId])
          const current = await db.membership(workspaceId, user.id); db.assertWrite(current)
          const account = await db.get('accounts', workspaceId, id)
          if (!account || !db.canAccess(current, id)) throw new UserError('账号不存在或无法访问。', 404)
          await db.put('accounts', workspaceId, id, { ...account, status: 'invalid', checkedAt: Date.now() }, account.revision)
          await db.execute("UPDATE auth_accounts SET auth_status='archived',updated_at=? WHERE workspace_id=? AND id=?", [Date.now(), workspaceId, id])
          await db.remove('accounts', workspaceId, id)
          for (const task of await db.list('authorizations', workspaceId)) if (['waiting', 'review'].includes(task.status) && (task.targetAccountId === id || task.platform?.key === account.platform && task.identity?.platformUserId === account.platformUserId)) {
            await db.mediaSessions.remove(workspaceId, task.id, 'authorization')
            await db.put('authorizations', workspaceId, task.id, { ...task, status: 'cancelled', privateKey: null, proofKey: null, credential: null }, task.revision)
          }
        }); return send({ message: '账号已删除。' })
      }
      if (resource === 'accounts' && method === 'GET' && !id) return send({ items: (await db.list('accounts', workspaceId)).filter(accessible) })
      if (resource === 'accounts' && method === 'POST' && id && ['launch', 'check'].includes(action)) {
        db.assertWrite(member)
        const account = await getRecord('accounts')
        const platform = (this.platformService?.catalog || clientPlatforms).find(item => item.key === account.platform)
        if (!platform) throw new UserError('此账号的平台服务尚未配置。', 503)
        const environment = await db.get('environments', workspaceId, account.environmentId)
        if (!environment || !db.canAccess(member, environment.id)) throw new UserError('账号绑定的浏览器环境不存在或无法访问。', 403)
        const body = await this.body(req)
        if (action === 'launch') {
          if (account.status !== 'valid') throw new UserError('账号授权已失效，请先重新授权。', 409)
          if (body.protocol !== 'desktop-launch-v1') throw new UserError('请升级客户端后打开账号。')
          try { validateLaunchRequest(body) } catch (error) { throw new UserError(error.message) }
        }
        if (action === 'check') {
          if (!this.platformService) throw new UserError('请通过客户端打开账号并检测授权状态。', 409)
          await this.billing.withCapacity(workspaceId, 'environments', async () => {}, false)
          const snapshot = await db.readAccountSession(workspaceId, user.id, account.id)
          const saveStatus = async status => await db.transaction(async () => {
            // 公网核验完成后重新锁定权限与账号，撤权或并发重授权不能被旧结果覆盖。
            await db.readAccountSession(workspaceId, user.id, account.id)
            return await db.put('accounts', workspaceId, account.id, { ...account, status, checkedAt: Date.now() }, account.revision)
          })
          let verified
          try { verified = await this.platformService.verifyAuthorization(account.platform, snapshot) } catch (error) {
            if (error.code !== 'AUTH_EXPIRED') throw new UserError('暂时无法核验账号状态，请稍后重试。', 503)
            const item = await saveStatus('invalid')
            return send({ item })
          }
          if (verified.platformUserId !== account.platformUserId) throw new UserError('账号会话身份不匹配，请联系管理员。', 409)
          const item = await saveStatus('valid')
          return send({ item })
        }
        const envelope = await db.transaction(async () => {
          const snapshot = await db.readAccountSession(workspaceId, user.id, account.id)
          const currentAccount = await db.get('accounts', workspaceId, account.id)
          if (currentAccount.status !== 'valid') throw new UserError('账号授权已失效，请先重新授权。', 409)
          const currentMember = await db.membership(workspaceId, user.id)
          const currentEnvironment = await db.get('environments', workspaceId, currentAccount.environmentId)
          const session = { format: 'desktop-session-v1', origins: snapshot.origins?.length ? snapshot.origins : platform.origins || currentAccount.origins || [], cookies: snapshot.cookies, storage: snapshot.storage, version: snapshot.sessionVersion }
          return await this.launchEnvelope(workspaceId, currentMember, currentEnvironment, body, { id: account.id, name: currentAccount.name, url: platform.url || currentAccount.launchUrl || currentEnvironment.startUrl, ...(!this.platformService ? { platformKey: currentAccount.platform } : {}), session, localSessionSource: { resourceId: currentEnvironment.id, operationId: currentAccount.authorizationOperationId } })
        })
        return send({ envelope })
      }
      if (resource === 'authorizations') {
        // 平台接入仅通过系统接口，禁止提交任意登录地址、Cookie 或自定义身份。
        db.assertWrite(member)
        if (method === 'POST' && !id) {
          const body = await this.body(req)
          return send({ task: await this.billing.withCapacity(workspaceId, 'environments', () => this.mediaAuthorizations.begin(workspaceId, user.id, body), false) }, 201)
        }
        if (id && (method === 'GET' && !action || method === 'POST' && ['complete', 'confirm', 'cancel'].includes(action))) {
          const body = method === 'POST' ? await this.body(req) : {}
          const operation = () => this.mediaAuthorizations.handle(workspaceId, user.id, id, action, body)
          return send({ task: action === 'confirm' ? await this.billing.withCapacity(workspaceId, 'environments', operation, false) : await operation() })
        }
      }
      if (resource === 'billing' && method === 'GET') return send({ ...await this.billing.summary(workspaceId, ['owner', 'admin'].includes(member.role)), usage: { fingerprints: (await db.fingerprints(workspaceId)).filter(accessible).length, environments: (await db.list('environments', workspaceId)).filter(accessible).length, members: (await db.members(workspaceId)).length } })
      if (resource === 'orders') {
        db.assertWrite(member, true)
        if (method === 'POST' && !id) return send({ order: await this.billing.create(workspaceId, user.id, await this.body(req)) }, 201)
        if (method === 'POST' && id && action === 'refresh') return send({ order: await this.billing.reconcile(workspaceId, id) })
        if (method === 'GET' && id && !action) return send({ order: this.billing.publicOrder(await this.billing.order(workspaceId, id)) })
        if (method === 'GET' && id && action === 'code') {
          const svg = await this.billing.paymentCode(workspaceId, id)
          res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' }); return res.end(svg)
        }
      }
      if (resource === 'settings') {
        if (method === 'GET') return send({ settings: await db.get('settings', workspaceId, workspaceId) || { revision: null, reduceMotion: false, pageSize: 20 } })
        if (method === 'PUT') {
          db.assertWrite(member, true); const body = await this.body(req)
          if (![10, 20, 50].includes(Number(body.pageSize))) throw new UserError('请选择有效的每页条数。')
          return send({ settings: await db.put('settings', workspaceId, workspaceId, { reduceMotion: Boolean(body.reduceMotion), pageSize: Number(body.pageSize) }, body.expectedRevision ?? null) })
        }
      }
      throw new UserError('该操作不存在。', 404)
    } catch (error) {
      if (!(error instanceof UserError)) console.error('[Workspace request failed]', error.code || error.name)
      return this.json(res, error instanceof UserError ? error.status : 500, { ok: false, message: error instanceof UserError ? error.message : '操作未完成，请稍后重试。', ...(error.diagnosticCode ? { errorCode: error.diagnosticCode } : {}) })
    }
  }
  static (req, res, pathname) {
    if (!['GET', 'HEAD'].includes(req.method)) throw new UserError('不支持此请求方式。', 405)
    let relative
    try { relative = decodeURIComponent(pathname === '/' ? '/index.html' : pathname) } catch { throw new UserError('页面地址无效。', 404) }
    const file = path.resolve(this.publicDirectory, `.${relative}`)
    if (!file.startsWith(this.publicDirectory + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) throw new UserError('页面不存在。', 404)
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.svg': 'image/svg+xml' }
    const mime = types[path.extname(file)]
    if (!mime) throw new UserError('页面不存在。', 404)
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' }); if (req.method === 'HEAD') return res.end(); fs.createReadStream(file).pipe(res)
  }
  async launchEnvelope (workspaceId, member, environment, encryption, extra = {}) {
    const db = this.database
    try { validateLaunchRequest(encryption) } catch (error) { throw new UserError(error.message) }
    if (encryption.protocol === 'desktop-launch-v1' && (encryption.scope !== workspaceId || encryption.resourceId !== (extra.id || environment.id))) throw new UserError('启动请求与当前团队或账号环境不一致。')
    const fingerprint = db.decodeFingerprint(environment.fingerprint)
    await this.billing.withCapacity(workspaceId, 'environments', async () => {}, false)
    let proxy = { mode: 'direct', server: '', username: '', password: '' }
    if (environment.proxyId) {
      const item = await db.get('proxies', workspaceId, environment.proxyId)
      if (!item || !db.canAccess(member, item.id)) throw new UserError('环境代理已失效，启动已阻止。', 409)
      const credentials = JSON.parse(db.decrypt(item.credential)); const result = await checkProxy({ ...item, ...credentials }, { allowPrivate: this.allowPrivateProxy })
      if (result.timezone !== fingerprint.locale.timezone && !environment.timezoneAcknowledged) throw new UserError('出口时区已变化，请重新确认环境网络。', 409)
      const host = item.host.includes(':') ? `[${item.host}]` : item.host
      proxy = { mode: item.protocol, server: `${item.protocol}://${host}:${item.port}`, ...credentials }
    }
    return sealLaunch({ id: environment.id, name: environment.name, url: environment.startUrl, fingerprint, proxy, ...extra }, encryption, { workspaceId, environmentId: extra.id || environment.id })
  }
  async start () { await this.database.ready; await this.configurationReady; return await new Promise((resolve, reject) => { this.server.once('error', reject); this.server.listen(this.port, this.host, () => resolve(this.server.address())) }) }
  async stop () { await new Promise(resolve => this.server.close(resolve)); this.registrationMailer.close(); await this.database.close() }
}

if (require.main === module) {
  if (!process.env.SAAS_ENV && process.argv[2] === '--init-system-admin') process.env.SAAS_ENV = 'prod'
  loadEnvironment(path.join(__dirname, '..'), process.env.SAAS_ENV || 'dev')
  const server = new WorkspaceServer({ port: Number(process.env.PORT || 8088), host: process.env.HOST || '127.0.0.1', dataDir: process.env.SAAS_DATA_DIR || path.join(__dirname, '../data/workspace'), publicUrl: process.env.SAAS_PUBLIC_URL || '', allowPrivateProxy: process.env.SAAS_ALLOW_PRIVATE_PROXY === 'true', platformService: null })
  if (process.argv[2] === '--init-system-admin') {
    void server.configurationReady.then(async () => {
      const result = await server.systemSettings.provisionAdmin(process.argv[3])
      console.log(`系统管理员已配置：${result.email}`)
      if (result.password) console.log(`初始密码（请妥善保存）：${result.password}`)
      else console.log('现有账号密码保持不变。')
    }).catch(() => { console.error('管理员初始化失败，请检查邮箱、数据库和配置文件。'); process.exitCode = 1 }).finally(async () => { server.registrationMailer.close(); await server.database.close() })
  } else {
  server.start().then(address => console.log(`工作空间服务已启动：http://${address.address}:${address.port}`)).catch(() => { console.error('工作空间服务启动失败，请检查端口、数据库和环境配置。'); process.exitCode = 1 })
  let stopping = false
  const shutdown = () => {
    if (stopping) return
    stopping = true
    void server.stop().then(() => process.exit(0)).catch(() => { console.error('服务停止未完成，请检查数据库连接和运行日志。'); process.exit(1) })
  }
  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
  process.on('message', message => { if (message === 'shutdown') shutdown() })
  }
}

module.exports = { WorkspaceServer, validateProfile, loadEnvironment }
