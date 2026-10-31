const path = require('node:path')
const fs = require('node:fs')
const { spawnSync } = require('node:child_process')

function readServerConfig (file) {
  file ||= process.env.SAAS_CONFIG_FILE || path.join(__dirname, `../.env.${process.env.SAAS_ENV || 'dev'}`)
  if (!fs.existsSync(file)) throw new Error('未找到服务端环境配置文件，请先完成服务端配置。')
  const config = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/)
    if (match) config[match[1]] = match[2].trim().replace(/^("|')(.*)\1$/, '$2')
  }
  return config
}

function databaseUrl (config) {
  if (!config.DB_HOST || !config.DB_USER || !config.DB_NAME || !config.DB_PORT || config.DB_PASSWORD === undefined) throw new Error('数据库配置不完整，请检查服务端环境配置文件。')
  if (!/^[a-zA-Z0-9_]+$/.test(config.DB_NAME) || !Number.isInteger(Number(config.DB_PORT))) throw new Error('数据库名称或端口配置无效。')
  const hostname = config.DB_HOST.includes(':') && !config.DB_HOST.startsWith('[') ? `[${config.DB_HOST}]` : config.DB_HOST
  return `mysql://${encodeURIComponent(config.DB_USER)}:${encodeURIComponent(config.DB_PASSWORD)}@${hostname}:${Number(config.DB_PORT)}/${config.DB_NAME}?connection_limit=8&connect_timeout=10`
}

try {
  const serverRoot = path.resolve(__dirname, '..')
  const cli = process.env.PRISMA_CLI_PATH || path.join(serverRoot, 'node_modules/prisma/build/index.js')
  const args = process.argv.slice(2)
  if (args[0] === 'db' && args[1] === 'push' && !args.includes('--skip-generate')) args.push('--skip-generate')
  if (!args.includes('--schema') && !args.some(argument => argument.startsWith('--schema='))) args.push('--schema', path.join(serverRoot, 'prisma/schema.prisma'))
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: serverRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl(readServerConfig()) },
    stdio: 'inherit'
  })
  if (result.error) throw result.error
  process.exitCode = result.status ?? 1
} catch (error) {
  console.error(error.message || 'Prisma 操作未完成，请检查数据库配置和本地 Prisma 工具。')
  process.exitCode = 1
}
