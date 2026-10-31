const fs = require('node:fs')
const path = require('node:path')
const { spawn, spawnSync } = require('node:child_process')

const environment = process.env.SAAS_ENV || process.argv[2] || 'prod'
if (!['dev', 'test', 'prod'].includes(environment)) {
  console.error('请选择 dev、test 或 prod 环境。')
  process.exit(1)
}

const serverDirectory = path.join(__dirname, 'saas-server')
if (!fs.existsSync(path.join(serverDirectory, `.env.${environment}`))) {
  console.error(`请先将 saas-server/.env.example 复制为 .env.${environment}，并填写数据库与邮件配置。`)
  process.exit(1)
}

const runtime = {
  ...process.env,
  SAAS_ENV: environment,
  PRISMA_CLI_QUERY_ENGINE_TYPE: 'binary',
  PRISMA_QUERY_ENGINE_BINARY: path.join(serverDirectory, 'prisma-cli/query-engine-debian-openssl-3.0.x'),
  PRISMA_SCHEMA_ENGINE_BINARY: path.join(serverDirectory, 'prisma-cli/schema-engine-debian-openssl-3.0.x'),
  PRISMA_CLI_PATH: path.join(serverDirectory, 'prisma-cli/build/index.js')
}

const sync = spawnSync(process.execPath, ['scripts/prisma-cli.cjs', 'db', 'push'], { cwd: serverDirectory, env: runtime, stdio: 'inherit' })
if (sync.error) {
  console.error('Prisma 数据库结构同步未能启动，请检查服务配置和引擎文件。')
  process.exit(1)
}
if (sync.status !== 0) process.exit(sync.status ?? 1)

const server = spawn(process.execPath, ['server/index.js'], { cwd: serverDirectory, env: runtime, stdio: 'inherit' })
const stop = signal => { if (!server.killed) server.kill(signal) }
process.on('SIGINT', () => stop('SIGINT'))
process.on('SIGTERM', () => stop('SIGTERM'))
process.on('message', message => { if (message === 'shutdown') stop('SIGTERM') })
server.on('error', () => {
  console.error('SaaS 服务进程未能启动。')
  process.exitCode = 1
})
server.on('exit', (code, signal) => { process.exitCode = code ?? (signal === 'SIGINT' || signal === 'SIGTERM' ? 0 : 1) })
