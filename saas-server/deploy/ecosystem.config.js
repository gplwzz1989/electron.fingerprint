const path = require('node:path')

// 路径以本配置文件为基准，端口在 saas-server/.env.prod 中设置。
module.exports = {
  apps: [{
    name: 'qijie-saas',
    cwd: path.join(__dirname, 'saas-server'),
    script: path.join(__dirname, 'saas-server/server/index.js'),
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    restart_delay: 3000,
    kill_timeout: 15000,
    shutdown_with_message: true,
    env: { NODE_ENV: 'production', SAAS_ENV: 'prod' }
  }]
}
