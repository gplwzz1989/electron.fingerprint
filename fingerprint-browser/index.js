const {
  launch,
  getLaunchOptions,
  runtimeExecutable,
  resolveCandidateRuntime,
  projectRoot
} = require('./launcher')

const {
  getClientConfig
} = require('./client-config')

const {
  dataRoot,
  defaultDataRoot
} = require('./data-directory')

const {
  FORMAT: PROTOCOL_VERSION,
  createLaunchRequest,
  openLaunch,
  sealLaunch,
  validateLaunchRequest
} = require('./fingerprint-envelope')

const {
  createProfileRecord,
  getDefaultProfile,
  getPresetTemplates,
  ProfileValidationError
} = require('./profile-store')

// 当 Electron 运行时直接将本项目作为应用主进程加载时（如 electron . 或打包运行环境）
if (process.versions?.electron && require.main === module) {
  require('./main.js')
} else {
  module.exports = {
    // 浏览器基座启动与参数管理
    launch,
    getLaunchOptions,
    runtimeExecutable,
    resolveCandidateRuntime,
    projectRoot,

    // 客户端配置与用户数据目录
    getClientConfig,
    dataRoot,
    defaultDataRoot,

    // 启动信封加解密与协议定义 (desktop-launch-v1)
    PROTOCOL_VERSION,
    createLaunchRequest,
    openLaunch,
    sealLaunch,
    validateLaunchRequest,

    // 指纹档案模型与预置模板
    createProfileRecord,
    getDefaultProfile,
    getPresetTemplates,
    ProfileValidationError
  }
}
