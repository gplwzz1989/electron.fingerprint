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
