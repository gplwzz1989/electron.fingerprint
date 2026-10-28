const net = require('node:net')
const tls = require('node:tls')
const https = require('node:https')
const dns = require('node:dns/promises')
const { once } = require('node:events')
const { UserError } = require('./mysql-database')

function privateAddress (ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number)
    return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127)
  }
  return ip === '::' || ip === '::1' || /^(fc|fd|fe[89ab]|ff)/i.test(ip) || ip.includes('.') || /^::ffff:/i.test(ip)
}

async function readUntil (socket, ready) {
  let result = Buffer.alloc(0)
  return await new Promise((resolve, reject) => {
    const cleanup = () => { socket.off('data', data); socket.off('error', error); socket.off('end', ended) }
    const error = () => { cleanup(); reject(new UserError('代理连接中断，请检查地址与认证信息。', 422)) }
    const ended = () => error()
    const data = chunk => {
      result = Buffer.concat([result, chunk])
      if (result.length > 65536) return error()
      const length = ready(result)
      if (length) { cleanup(); socket.pause(); if (result.length > length) socket.unshift(result.subarray(length)); resolve(result.subarray(0, length)) }
    }
    socket.on('data', data); socket.on('error', error); socket.on('end', ended); socket.resume()
  })
}

async function checkProxy (input, { allowPrivate = false, timeoutMs = 10000 } = {}) {
  const host = String(input.host || '').trim(); const port = Number(input.port)
  if (!/^[a-zA-Z0-9.:-]+$/.test(host) || !Number.isInteger(port) || port < 1 || port > 65535 || !['http', 'socks5'].includes(input.protocol)) throw new UserError('请填写有效的协议、服务器地址和端口。')
  const username = String(input.username || ''); const password = String(input.password || '')
  if (Buffer.byteLength(username) > 255 || Buffer.byteLength(password) > 255) throw new UserError('代理认证信息过长。')
  const addresses = await dns.lookup(host, { all: true }).catch(() => { throw new UserError('代理地址无法解析，请检查服务器地址。', 422) })
  if (!addresses.length || (!allowPrivate && addresses.some(item => privateAddress(item.address)))) throw new UserError('该代理地址属于受限网络，请配置公网代理。', 422)
  const socket = net.connect({ host: addresses[0].address, port }); const started = Date.now()
  const timer = setTimeout(() => socket.destroy(new Error('连接超时')), timeoutMs)
  socket.on('error', () => {})
  let secure
  try {
    await once(socket, 'connect')
    if (input.protocol === 'socks5') {
      let pending = readUntil(socket, b => b.length >= 2 && 2)
      socket.write(Buffer.from([5, 1, username ? 2 : 0])); const greeting = await pending
      if (greeting[0] !== 5 || ![0, 2].includes(greeting[1])) throw new UserError('代理不支持当前认证方式。', 422)
      if (greeting[1] === 2) {
        pending = readUntil(socket, b => b.length >= 2 && 2)
        socket.write(Buffer.concat([Buffer.from([1, Buffer.byteLength(username)]), Buffer.from(username), Buffer.from([Buffer.byteLength(password)]), Buffer.from(password)]))
        if ((await pending)[1] !== 0) throw new UserError('代理用户名或密码不正确。', 422)
      }
      const target = Buffer.from('ipwho.is')
      pending = readUntil(socket, b => b.length < 5 ? 0 : b[3] === 1 ? (b.length >= 10 && 10) : b[3] === 4 ? (b.length >= 22 && 22) : b[3] === 3 ? (b.length >= 7 + b[4] && 7 + b[4]) : 0)
      socket.write(Buffer.concat([Buffer.from([5, 1, 0, 3, target.length]), target, Buffer.from([1, 187])]))
      const reply = await pending
      if (reply[1] !== 0) throw new UserError('代理无法建立外网连接。', 422)
    } else {
      const pending = readUntil(socket, b => { const end = b.indexOf('\r\n\r\n'); return end < 0 ? 0 : end + 4 })
      const authorization = username ? `Proxy-Authorization: Basic ${Buffer.from(`${username}:${password}`).toString('base64')}\r\n` : ''
      socket.write(`CONNECT ipwho.is:443 HTTP/1.1\r\nHost: ipwho.is:443\r\n${authorization}\r\n`)
      if (!/^HTTP\/1\.[01] 200\b/.test((await pending).toString('ascii'))) throw new UserError('代理连接被拒绝，请检查认证或访问权限。', 422)
    }
    secure = tls.connect({ socket, servername: 'ipwho.is', rejectUnauthorized: true })
    secure.on('error', () => {}); await once(secure, 'secureConnect')
    const agent = new https.Agent({ keepAlive: false }); agent.createConnection = (_options, callback) => { callback(null, secure) }
    const result = await new Promise((resolve, reject) => {
      const req = https.get('https://ipwho.is/', { agent, headers: { Accept: 'application/json' } }, res => {
        let body = ''; res.on('data', chunk => { body += chunk; if (body.length > 65536) res.destroy() }); res.on('error', reject)
        res.on('end', () => { try { if (res.statusCode !== 200) throw new Error(); resolve(JSON.parse(body)) } catch { reject(new UserError('出口信息查询失败，请稍后重试。', 422)) } })
      }); req.on('error', reject)
    })
    if (result.success === false || !net.isIP(result.ip) || !result.timezone?.id) throw new UserError('未取得有效的出口地址与时区，请稍后重试。', 422)
    new Intl.DateTimeFormat('zh-CN', { timeZone: result.timezone.id })
    return { status: 'available', ip: result.ip, timezone: result.timezone.id, checkedAt: Date.now(), latencyMs: Date.now() - started }
  } catch (error) {
    if (error instanceof UserError) throw error
    throw new UserError('代理检测失败，请检查连接、认证或网络后重试。', 422)
  } finally { clearTimeout(timer); secure?.destroy(); socket.destroy() }
}

module.exports = { checkProxy, privateAddress }
