const fs = require('node:fs')
const path = require('node:path')

// 平台服务随部署包提供，也可由部署者显式安装和配置；不下载或执行网页提供的任意脚本。
function loadExternalService (entry = process.env.FP_EXTERNAL_SERVICE_ENTRY) {
  const bundledEntry = path.join(__dirname, '../platform-service/server/index.cjs')
  if (!entry) {
    if (!fs.existsSync(bundledEntry)) return null
    entry = bundledEntry
  }
  entry = path.resolve(__dirname, '..', entry)
  if (!['.js', '.cjs'].includes(path.extname(entry)) || !fs.existsSync(entry) || !fs.statSync(entry).isFile()) {
    throw new Error('平台服务配置无效，请检查部署包或已配置的本地模块路径。')
  }
  let service
  try { service = require(entry) } catch {
    throw new Error('平台模块加载失败，请核对部署文件的 SHA-256；停止服务后重新解压完整部署包，不要在线覆盖或编辑打包后的 JS 文件。')
  }
  if (!service || typeof service !== 'object') throw new Error('外部平台服务未提供有效接口。')
  return service
}

module.exports = { loadExternalService }
