const fs = require('node:fs')
const path = require('node:path')

function readServerConfig (file = process.env.SAAS_CONFIG_FILE || path.join(__dirname, `../.env.${process.env.SAAS_ENV || 'dev'}`)) {
  if (!fs.existsSync(file)) throw new Error('未找到服务端环境配置文件，请先完成服务端配置。')
  const config = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/)
    if (match) config[match[1]] = match[2].trim().replace(/^(["'])(.*)\1$/, '$2')
  }
  return config
}

module.exports = { readServerConfig }
