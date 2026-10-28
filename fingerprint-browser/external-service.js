const fs = require('node:fs')
const path = require('node:path')

// 外部服务由部署者显式安装和配置；不下载或执行网页提供的任意脚本。
function loadExternalService (entry = process.env.FP_EXTERNAL_SERVICE_ENTRY) {
  if (!entry) return null
  if (!path.isAbsolute(entry) || !['.js', '.cjs'].includes(path.extname(entry)) || !fs.statSync(entry).isFile()) {
    throw new Error('外部平台服务配置无效，请指定已安装的 JavaScript 模块绝对路径。')
  }
  const service = require(entry)
  if (!service || typeof service !== 'object') throw new Error('外部平台服务未提供有效接口。')
  return service
}

module.exports = { loadExternalService }
