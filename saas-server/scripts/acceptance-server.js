const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { WorkspaceServer } = require('../src/workspace-server')
const { createSmtpMailbox } = require('../test/smtp-mailbox')

// 页面验收使用独立 MySQL 数据库，不向开发或生产数据库写入测试账号。
const directory = path.resolve(__dirname, '../../dist/workspace-refactor-acceptance')
fs.mkdirSync(directory, { recursive: true })
const metadata = path.join(directory, 'mysql-browser-server.json')
const prior = fs.existsSync(metadata) ? JSON.parse(fs.readFileSync(metadata, 'utf8')) : null
const databaseName = prior?.databaseName || 'qijie_workspace_test_browser_' + crypto.randomBytes(6).toString('hex')
async function start () {
  let mailbox = null
  if (process.argv.includes('--local-mailbox')) {
    mailbox = await createSmtpMailbox(directory)
    // 仅隔离验收保存本机收件内容，正式服务不会写出验证码或启用此收件器。
    mailbox.onMessage = message => fs.writeFileSync(path.join(directory, 'registration-mailbox.json'), JSON.stringify({ recipient: message.recipient, code: mailbox.codeFor(message.recipient) }), { mode: 0o600 })
  }
  const server = new WorkspaceServer({ port: 8088, dataDir: path.join(directory, 'mysql-browser-data'), databaseName, allowPrivateProxy: true, mailConfigFile: mailbox?.configFile })
  await server.start()
  fs.writeFileSync(path.join(directory, 'mysql-browser-server.json'), JSON.stringify({ processId: process.pid, databaseName, url: 'http://127.0.0.1:8088/', localMailbox: Boolean(mailbox) }, null, 2))
  console.log('MySQL 页面验收服务已启动。')
}
start().catch(() => { console.error('页面验收服务启动失败，请检查服务端配置文件与端口。'); process.exitCode = 1 })
