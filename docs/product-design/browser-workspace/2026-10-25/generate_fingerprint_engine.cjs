const fs = require('node:fs')
const path = require('node:path')
const { getDefaultProfile } = require('../../profile-store')

// 直接复用现有默认值、配置校验与硬件拓扑规则，避免设计稿维护平行参数源。
const store = fs.readFileSync(path.join(__dirname, '../../profile-store.js'), 'utf8')
const validation = store.slice(store.indexOf('class ProfileValidationError'), store.indexOf('function normalizeUrl'))
const topology = fs.readFileSync(path.join(__dirname, '../../webgl-topology.js'), 'utf8')
  .replace("const crypto = require('node:crypto')", 'const crypto = root.crypto')
  .replace('module.exports = {', 'return {')
const source = `(function (root) {
  'use strict'
  // 此文件由 generate_fingerprint_engine.cjs 从现有实现导出，请修改源实现后重新生成。
  const DEFAULT_PROFILE = ${JSON.stringify(getDefaultProfile(), null, 2)}
  ${validation}
  const topology = (function () {
    ${topology}
  })()
  root.QijieFingerprintEngine = {
    createFingerprintProfile,
    validateFingerprintProfile,
    getDefaultProfile: () => clone(DEFAULT_PROFILE),
    ...topology
  }
})(window)
`
const target = path.join(__dirname, 'fingerprint-engine.js')
if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== source) fs.writeFileSync(target, source, 'utf8')
console.log('已导出现有指纹默认参数与自洽检查。')
