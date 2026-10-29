const test = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { WorkspaceServer } = require('../src/workspace-server')
const { createSmtpMailbox } = require('./smtp-mailbox')
const { signedFields, sign, responseObject } = require('../src/payment-providers')
const { getDefaultProfile } = require('../src/fingerprint/profile-store')

// 仅测试拦截支付平台网络，使用临时 RSA 密钥验证真实签名、回调与 MySQL 事务；不向真实商户扣款。
test('隔离支付协议与真实数据库权益验收', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'qijie-payment-test-'))
  const keyPair = () => crypto.generateKeyPairSync('rsa', { modulusLength: 2048, privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } })
  const merchant = keyPair(); const platform = keyPair()
  for (const [file, key] of [['merchant.pem', merchant.privateKey], ['platform.pem', platform.publicKey]]) fs.writeFileSync(path.join(directory, file), key)
  const plan = { id: 'isolated-test-plan', name: '隔离验收套餐', enabled: true, currency: 'CNY', amount: 100, periodDays: 30, quotas: { fingerprints: 1, environments: 1, members: 2 } }
  fs.writeFileSync(path.join(directory, 'plans.json'), JSON.stringify({ plans: [plan] }))
  const config = path.join(directory, 'payments.env')
  fs.writeFileSync(config, [
    'PAYMENTS_ENABLED=true', 'BILLING_PLANS_FILE=plans.json', 'WECHAT_PAY_APP_ID=wxIsolatedTest', 'WECHAT_PAY_MCH_ID=1900000001', 'WECHAT_PAY_SERIAL_NO=ABC123', `WECHAT_PAY_PRIVATE_KEY_PATH=${path.join(directory, 'merchant.pem')}`, `WECHAT_PAY_PLATFORM_CERT_PATH=${path.join(directory, 'platform.pem')}`, 'WECHAT_PAY_PLATFORM_SERIAL_NO=PUB_KEY_ID_ISOLATED_TEST', 'WECHAT_PAY_API_V3_KEY=01234567890123456789012345678901', 'WECHAT_PAY_NOTIFY_URL=https://isolated.example.test/api/payments/wechat/notify',
    'ALIPAY_APP_ID=2026000000000001', 'ALIPAY_SELLER_ID=2088000000000001', `ALIPAY_PRIVATE_KEY_PATH=${path.join(directory, 'merchant.pem')}`, `ALIPAY_PUBLIC_KEY_PATH=${path.join(directory, 'platform.pem')}`, 'ALIPAY_NOTIFY_URL=https://isolated.example.test/api/payments/alipay/notify'
  ].join('\n'))
  const upstream = new Map(); const calls = { wechat: 0, alipay: 0 }; let corruptResponse = false
  const nativeFetch = globalThis.fetch
  const verify = (text, signature) => crypto.verify('RSA-SHA256', Buffer.from(text), merchant.publicKey, Buffer.from(signature, 'base64'))
  function signedWechat (body, timestamp = String(Math.floor(Date.now() / 1000))) {
    const raw = JSON.stringify(body); const nonce = crypto.randomBytes(16).toString('hex')
    return { raw, headers: { 'Content-Type': 'application/json', 'Wechatpay-Timestamp': timestamp, 'Wechatpay-Nonce': nonce, 'Wechatpay-Serial': 'PUB_KEY_ID_ISOLATED_TEST', 'Wechatpay-Signature': sign(`${timestamp}\n${nonce}\n${raw}\n`, platform.privateKey) } }
  }
  const interceptor = t.mock.method(globalThis, 'fetch', async (input, options = {}) => {
    const url = new URL(input)
    if (url.hostname === 'api.mch.weixin.qq.com') {
      const fields = Object.fromEntries([...options.headers.Authorization.matchAll(/(mchid|nonce_str|timestamp|serial_no|signature)="([^"]+)"/g)].map(match => [match[1], match[2]]))
      assert(verify(`${options.method}\n${url.pathname}${url.search}\n${fields.timestamp}\n${fields.nonce_str}\n${options.body || ''}\n`, fields.signature))
      let result
      if (options.method === 'POST') {
        const body = JSON.parse(options.body); assert.equal(body.amount.total, 100); assert.equal(body.amount.currency, 'CNY')
        upstream.set(body.out_trade_no, { ...body, state: 'NOTPAY' }); calls.wechat++
        result = { code_url: `weixin://wxpay/bizpayurl?pr=${body.out_trade_no}` }
      } else {
        const order = upstream.get(url.pathname.split('/').at(-1))
        result = { out_trade_no: order.out_trade_no, appid: order.appid, mchid: order.mchid, trade_state: order.state, amount: order.amount, transaction_id: `WX${order.out_trade_no}`, success_time: new Date().toISOString() }
      }
      const signed = signedWechat(result)
      if (corruptResponse) signed.headers['Wechatpay-Signature'] = 'invalid'
      return new Response(signed.raw, { status: 200, headers: signed.headers })
    }
    if (url.hostname === 'openapi.alipay.com') {
      const fields = Object.fromEntries(new URLSearchParams(options.body)); const signature = fields.sign; delete fields.sign
      assert(verify(Object.keys(fields).sort().map(key => `${key}=${fields[key]}`).join('&'), signature))
      const body = JSON.parse(fields.biz_content); let result
      if (fields.method === 'alipay.trade.precreate') {
        assert.equal(body.total_amount, '1.00'); upstream.set(body.out_trade_no, { ...body, state: 'WAIT_BUYER_PAY' }); calls.alipay++
        result = { code: '10000', out_trade_no: body.out_trade_no, qr_code: `https://qr.alipay.com/${body.out_trade_no}` }
      } else {
        const order = upstream.get(body.out_trade_no)
        result = { code: '10000', out_trade_no: body.out_trade_no, trade_no: `ALI${body.out_trade_no}`, trade_status: order.state, total_amount: order.total_amount }
      }
      const raw = JSON.stringify(result); return new Response(`{"${fields.method.replace(/\./g, '_')}_response":${raw},"sign":${JSON.stringify(corruptResponse ? 'invalid' : sign(raw, platform.privateKey))}}`, { status: 200 })
    }
    return await nativeFetch(input, options)
  })
  const mailbox = await createSmtpMailbox(directory)
  const options = { port: 0, dataDir: directory, databaseName: 'qijie_workspace_test_' + crypto.randomBytes(8).toString('hex'), mailConfigFile: mailbox.configFile, billingConfigFile: config }
  let server = new WorkspaceServer(options); let address = await server.start(); let origin = `http://127.0.0.1:${address.port}`
  const accounts = {}
  async function api (route, { account = 'owner', method = 'GET', body, expected = 200 } = {}) {
    const auth = accounts[account]
    const result = await fetch(origin + route, { method, headers: { 'Content-Type': 'application/json', ...(auth ? { Cookie: auth.cookie, 'X-CSRF-Token': auth.csrf } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
    const data = await result.json(); assert.equal(result.status, expected, data.message)
    return { ...data, cookie: result.headers.get('set-cookie')?.split(';')[0] }
  }
  const notifyWechat = async (order, overrides = {}, { badSignature = false, old = false } = {}) => {
    const message = { out_trade_no: order.id, appid: 'wxIsolatedTest', mchid: '1900000001', trade_state: 'SUCCESS', transaction_id: `WX${order.id}`, success_time: new Date().toISOString(), amount: { total: 100, currency: 'CNY' }, ...overrides }
    const nonce = crypto.randomBytes(6).toString('hex'); const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from('01234567890123456789012345678901'), nonce); cipher.setAAD(Buffer.from('transaction'))
    const encrypted = Buffer.concat([cipher.update(JSON.stringify(message)), cipher.final(), cipher.getAuthTag()]).toString('base64')
    const signed = signedWechat({ event_type: 'TRANSACTION.SUCCESS', resource: { algorithm: 'AEAD_AES_256_GCM', original_type: 'transaction', associated_data: 'transaction', nonce, ciphertext: encrypted } }, String(Math.floor(Date.now() / 1000) - (old ? 600 : 0)))
    if (badSignature) signed.headers['Wechatpay-Signature'] = 'invalid'
    return await fetch(origin + '/api/payments/wechat/notify', { method: 'POST', headers: signed.headers, body: signed.raw })
  }
  const notifyAlipay = async (order, overrides = {}) => {
    const fields = { app_id: '2026000000000001', seller_id: '2088000000000001', out_trade_no: order.id, trade_no: `ALI${order.id}`, total_amount: '1.00', trade_status: 'TRADE_SUCCESS', sign_type: 'RSA2', ...overrides }
    fields.sign = sign(signedFields(fields), platform.privateKey)
    return await fetch(origin + '/api/payments/alipay/notify', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(fields).toString() })
  }
  let base; let first; let second; let expiry
  try {
    for (const name of ['owner', 'outsider']) {
      const email = `${name}-${crypto.randomUUID()}@example.test`
      await api('/api/auth/registration-code', { method: 'POST', body: { email } })
      accounts[name] = await api('/api/auth/register', { method: 'POST', expected: 201, body: { email, verificationCode: mailbox.codeFor(email), name: '支付隔离验收', workspaceName: '支付隔离验收团队', password: crypto.randomBytes(24).toString('hex') } })
    }
    base = `/api/workspaces/${accounts.owner.workspaces[0].id}`
    await t.test('服务端报价、真实 RSA 请求签名及下单幂等，不采信前端金额', async () => {
      const requestId = crypto.randomUUID(); const body = { planId: plan.id, method: 'wechat', requestId, amount: 1 }
      first = (await api(`${base}/orders`, { method: 'POST', body, expected: 201 })).order
      assert.equal(first.amount, 100); assert.equal(first.status, 'pending')
      const duplicate = (await api(`${base}/orders`, { method: 'POST', body, expected: 201 })).order
      assert.equal(duplicate.id, first.id); assert.equal(calls.wechat, 1)
      await api(`${base}/orders`, { method: 'POST', body: { ...body, method: 'alipay' }, expected: 409 })
      const qr = await fetch(origin + `${base}/orders/${first.id}/code`, { headers: { Cookie: accounts.owner.cookie } })
      assert.equal(qr.status, 200); assert((await qr.text()).startsWith('<svg'))
      await api(`${base}/orders/${first.id}`, { account: 'outsider', expected: 403 })
      assert.equal((await fetch(origin + `${base}/orders/${first.id}/code`)).status, 401)
    })
    await t.test('拒绝伪签名、过期签名、商户与金额不符，权益不变', async () => {
      for (const response of [await notifyWechat(first, {}, { badSignature: true }), await notifyWechat(first, {}, { old: true }), await notifyWechat(first, { mchid: '1999999999' }), await notifyWechat(first, { amount: { total: 1, currency: 'CNY' } })]) assert.equal(response.status, 400)
      assert.equal((await api(`${base}/billing`)).subscription, null)
      corruptResponse = true
      await api(`${base}/orders/${first.id}/refresh`, { method: 'POST', body: {}, expected: 502 })
      corruptResponse = false
      assert.equal((await api(`${base}/billing`)).subscription, null)
    })
    await t.test('微信回调 AES-GCM 解密；并发重复通知只开通一次', async () => {
      const results = await Promise.all([notifyWechat(first), notifyWechat(first), notifyWechat(first)])
      assert(results.every(response => response.status === 204))
      const billing = await api(`${base}/billing`); assert(billing.subscription.active)
      expiry = billing.subscription.expiresAt
      assert(Math.abs(expiry - Date.now() - 30 * 86400000) < 5000)
      assert.equal(billing.orders[0].status, 'paid')
      assert.equal((await fetch(origin + `${base}/orders/${first.id}/code`, { headers: { Cookie: accounts.owner.cookie } })).status, 409)
      await notifyWechat(first); assert.equal((await api(`${base}/billing`)).subscription.expiresAt, expiry)
    })
    await t.test('支付宝真实 RSA2 验签、收款账户绑定、回调续费幂等', async () => {
      second = (await api(`${base}/orders`, { method: 'POST', body: { planId: plan.id, method: 'alipay', requestId: crypto.randomUUID() }, expected: 201 })).order
      assert.equal(calls.alipay, 1)
      assert.equal((await notifyAlipay(second, { seller_id: '2088000000000099' })).status, 400)
      assert.equal((await notifyAlipay(second, { total_amount: '0.01' })).status, 400)
      assert.equal((await notifyAlipay(second)).status, 200)
      assert.equal((await notifyAlipay(second)).status, 200)
      assert.equal((await api(`${base}/billing`)).subscription.expiresAt, expiry + 30 * 86400000)
      const escaped = '{"message":"\\u4e2d\\u6587 { test }","amount":1.00}'
      assert.equal(responseObject(`{"alipay_trade_query_response":${escaped},"sign":"value"}`, 'alipay_trade_query_response'), escaped)
    })
    await t.test('主动查单确认支付，权益与流水服务重启后仍存在', async () => {
      const order = (await api(`${base}/orders`, { method: 'POST', body: { planId: plan.id, method: 'alipay', requestId: crypto.randomUUID() }, expected: 201 })).order
      upstream.get(order.id).state = 'TRADE_SUCCESS'
      const result = await api(`${base}/orders/${order.id}/refresh`, { method: 'POST', body: {} }); assert.equal(result.order.status, 'paid')
      assert.equal((await api(`${base}/billing`)).subscription.expiresAt, expiry + 60 * 86400000)
      await server.stop(); server = new WorkspaceServer(options); address = await server.start(); origin = `http://127.0.0.1:${address.port}`
      assert.equal((await api(`${base}/billing`)).subscription.expiresAt, expiry + 60 * 86400000)
    })
    await t.test('套餐限额并发创建只准一次；到期阻止新增并保留已有资源', async () => {
      const requests = await Promise.all([0, 1].map(async index => {
        const response = await fetch(origin + `${base}/fingerprints`, { method: 'POST', headers: { Cookie: accounts.owner.cookie, 'X-CSRF-Token': accounts.owner.csrf, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `配额并发验收${index}`, profile: getDefaultProfile() }) })
        return response.status
      }))
      assert.deepEqual(requests.sort(), [201, 409])
      await server.database.execute('UPDATE billing_subscriptions SET expires_at=?', [Date.now() - 1])
      await api(`${base}/fingerprints`, { method: 'POST', body: { name: '到期阻止新增', profile: getDefaultProfile() }, expected: 403 })
      assert.equal((await api(`${base}/fingerprints`)).items.length, 1)
    })
  } finally { interceptor.mock.restore(); await server.stop(); await mailbox.stop() }
})
