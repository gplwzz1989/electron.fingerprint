const path = require('node:path')
const fs = require('node:fs')

const nestedServer = path.join(__dirname, 'saas-server')
const serverDirectory = fs.existsSync(path.join(nestedServer, 'server/index.js')) ? nestedServer : __dirname

// 可从部署包根目录或 saas-server 目录启动；端口和数据库由服务端目录下的 .env.prod 设置。
module.exports = {
  apps: [{
    name: 'qijie-saas',
    cwd: serverDirectory,
    script: path.join(serverDirectory, 'start.cjs'),
    args: 'prod',
    interpreter: 'node',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    // 仅监听交付程序与网页，避免数据、日志及配置写入触发重启；部署前仍须关闭监听。
    watch: ['server', 'public', 'platform-service/server', 'platform-service/dist'],
    watch_delay: 3000,
    ignore_watch: ['node_modules', 'data', 'logs', '\\.git', '\\.env', '\\.log$', '\\.tmp$'],
    watch_options: { followSymlinks: false, ignoreInitial: true },
    restart_delay: 3000,
    kill_timeout: 15000,
    shutdown_with_message: true,
    env: { NODE_ENV: 'production', SAAS_ENV: 'prod' }
  }]
}
