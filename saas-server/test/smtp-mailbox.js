const net = require('node:net')
const fs = require('node:fs')
const path = require('node:path')

// 隔离测试使用真实 SMTP 会话收件，不向外部邮箱发送验收邮件。
async function createSmtpMailbox (directory) {
  const messages = []; const sockets = new Set()
  const mailbox = { rejectNext: false, messages }
  const server = net.createServer(socket => {
    sockets.add(socket); socket.on('close', () => sockets.delete(socket)); socket.on('error', () => {})
    let buffer = ''; let recipient = ''; let data = null
    socket.write('220 localhost SMTP acceptance\r\n')
    socket.on('data', chunk => {
      buffer += chunk.toString('utf8')
      if (buffer.length > 1048576) return socket.destroy()
      while (buffer.includes('\r\n')) {
        const end = buffer.indexOf('\r\n'); const line = buffer.slice(0, end); buffer = buffer.slice(end + 2)
        if (data) {
          if (line === '.') {
            if (mailbox.rejectNext) { mailbox.rejectNext = false; socket.write('451 Temporary delivery failure\r\n') }
            else { const message = { recipient, raw: data.join('\r\n') }; messages.push(message); mailbox.onMessage?.(message); socket.write('250 Message accepted\r\n') }
            data = null
          } else data.push(line.startsWith('..') ? line.slice(1) : line)
        } else if (/^EHLO\b/i.test(line)) socket.write('250-localhost\r\n250 8BITMIME\r\n')
        else if (/^HELO\b/i.test(line)) socket.write('250 localhost\r\n')
        else if (/^MAIL FROM:/i.test(line)) socket.write('250 Sender accepted\r\n')
        else if (/^RCPT TO:/i.test(line)) { recipient = line.match(/<([^>]+)>/)?.[1].toLowerCase(); socket.write('250 Recipient accepted\r\n') }
        else if (/^DATA$/i.test(line)) { data = []; socket.write('354 End with a single dot\r\n') }
        else if (/^QUIT$/i.test(line)) { socket.end('221 Bye\r\n'); break }
        else if (/^RSET$/i.test(line)) { data = null; recipient = ''; socket.write('250 Reset\r\n') }
        else socket.write('250 OK\r\n')
      }
    })
  })
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve) })
  mailbox.configFile = path.join(directory, 'smtp.env')
  fs.writeFileSync(mailbox.configFile, `SMTP_HOST=127.0.0.1\nSMTP_PORT=${server.address().port}\nSMTP_SECURE=false\nSMTP_FROM=verification@example.test\nSMTP_ALLOW_INSECURE_LOCAL=true\n`, { encoding: 'utf8', mode: 0o600 })
  mailbox.codeFor = email => {
    const message = messages.filter(item => item.recipient === email.toLowerCase()).at(-1)
    if (!message) throw new Error('验收邮箱尚未收到邮件。')
    const [headers, ...body] = message.raw.split('\r\n\r\n'); let content = body.join('\r\n\r\n')
    if (/Content-Transfer-Encoding: base64/i.test(headers)) content = Buffer.from(content.replace(/\s/g, ''), 'base64').toString('utf8')
    else if (/Content-Transfer-Encoding: quoted-printable/i.test(headers)) {
      const raw = content.replace(/=\r\n/g, ''); const bytes = []
      for (let index = 0; index < raw.length; index++) {
        if (raw[index] === '=' && /^[a-f0-9]{2}$/i.test(raw.slice(index + 1, index + 3))) { bytes.push(parseInt(raw.slice(index + 1, index + 3), 16)); index += 2 } else bytes.push(raw.charCodeAt(index))
      }
      content = Buffer.from(bytes).toString('utf8')
    }
    const code = content.match(/验证码为：(\d{6})/)?.[1]
    if (!code) throw new Error('验收邮件中未找到六位验证码。')
    return code
  }
  mailbox.stop = async () => { sockets.forEach(socket => socket.destroy()); await new Promise(resolve => server.close(resolve)) }
  return mailbox
}

module.exports = { createSmtpMailbox }
