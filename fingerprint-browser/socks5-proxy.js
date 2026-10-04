const net = require('node:net')
const { ProfileValidationError } = require('./profile-store')

function waitForSocket (socket, event) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      socket.removeListener(event, ready)
      socket.removeListener('error', failed)
      socket.removeListener('end', closed)
      socket.removeListener('close', closed)
    }
    const ready = () => { cleanup(); resolve() }
    const failed = error => { cleanup(); reject(error) }
    const closed = () => failed(new Error('代理连接已关闭。'))
    socket.once(event, ready)
    socket.once('error', failed)
    socket.once('end', closed)
    socket.once('close', closed)
  })
}

async function readBytes (socket, size) {
  const chunks = []
  let received = 0
  while (received < size) {
    // 先取出已有片段，避免不足一个完整报文时反复触发可读事件。
    const data = socket.read(socket.readableLength ? Math.min(socket.readableLength, size - received) : size - received)
    if (data) { chunks.push(data); received += data.length; continue }
    if (socket.destroyed || socket.readableEnded) throw new Error('代理连接已关闭。')
    await waitForSocket(socket, 'readable')
  }
  return Buffer.concat(chunks, size)
}

async function readAddress (socket, type) {
  if (type === 1) return await readBytes(socket, 6)
  if (type === 4) return await readBytes(socket, 18)
  if (type !== 3) throw new Error('代理地址类型无效。')
  const length = await readBytes(socket, 1)
  if (!length[0]) throw new Error('代理域名不能为空。')
  return Buffer.concat([length, await readBytes(socket, length[0] + 2)])
}

async function connectAuthenticated (proxy, timeout, sockets) {
  const address = new URL(proxy.server)
  const socket = net.createConnection({ host: address.hostname.replace(/^\[|\]$/g, ''), port: Number(address.port) || 1080 })
  sockets.add(socket)
  socket.on('close', () => sockets.delete(socket))
  socket.on('error', () => {})
  socket.setTimeout(timeout, () => socket.destroy(new Error('代理连接超时。')))
  try {
    await waitForSocket(socket, 'connect')
    // 带凭据的环境只接受账号密码认证，不允许服务端降级为无认证。
    socket.write(Buffer.from([5, 1, 2]))
    const method = await readBytes(socket, 2)
    if (method[0] !== 5 || method[1] !== 2) throw new ProfileValidationError('SOCKS5 代理不支持账号密码认证，已阻止直连。')
    const username = Buffer.from(proxy.username, 'utf8')
    const password = Buffer.from(proxy.password, 'utf8')
    socket.write(Buffer.concat([Buffer.from([1, username.length]), username, Buffer.from([password.length]), password]))
    const auth = await readBytes(socket, 2)
    if (auth[0] !== 1 || auth[1] !== 0) throw new ProfileValidationError('SOCKS5 代理账号或密码错误，已阻止直连。')
    return socket
  } catch (error) {
    socket.destroy()
    throw error
  }
}

async function createSocks5Proxy (proxy, timeout) {
  const sockets = new Set()
  // 启动前完成真实认证，错误凭据不会创建可运行的环境标签。
  const probe = await connectAuthenticated(proxy, timeout, sockets)
  probe.destroy()
  const server = net.createServer(client => {
    sockets.add(client)
    client.on('close', () => sockets.delete(client))
    client.on('error', () => {})
    client.setTimeout(timeout, () => client.destroy())
    async function relay () {
      let upstream
      try {
        const greeting = await readBytes(client, 2)
        if (!greeting[1]) throw new Error('本地代理协商失败。')
        const methods = await readBytes(client, greeting[1])
        if (greeting[0] !== 5 || !methods.includes(0)) throw new Error('本地代理协商失败。')
        client.write(Buffer.from([5, 0]))
        const request = await readBytes(client, 4)
        if (request[0] !== 5 || request[1] !== 1 || request[2] !== 0) throw new Error('本地代理请求无效。')
        const destination = await readAddress(client, request[3])
        upstream = await connectAuthenticated(proxy, timeout, sockets)
        client.once('close', () => upstream.destroy())
        upstream.once('close', () => { if (!upstream.readableEnded) client.destroy() })
        upstream.write(Buffer.concat([request, destination]))
        const response = await readBytes(upstream, 4)
        const bound = await readAddress(upstream, response[3])
        if (response[0] !== 5 || response[1] !== 0 || response[2] !== 0) throw new Error('SOCKS5 代理无法连接目标网站。')
        client.write(Buffer.concat([response, bound]))
        // 只把目标地址转交上游，域名由代理解析；不建立任何直连回退。
        client.setTimeout(0)
        upstream.setTimeout(0)
        upstream.pipe(client)
        client.pipe(upstream)
      } catch {
        upstream?.destroy()
        client.destroy()
      }
    }
    void relay()
  })
  await new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  server.on('error', () => { for (const socket of sockets) socket.destroy() })
  return {
    server: `socks5://127.0.0.1:${server.address().port}`,
    close () {
      server.close()
      for (const socket of sockets) socket.destroy()
    }
  }
}

module.exports = { createSocks5Proxy }
