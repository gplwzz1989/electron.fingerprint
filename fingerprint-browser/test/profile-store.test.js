const assert = require('node:assert/strict')
const path = require('node:path')
const { getLaunchOptions, runtimeExecutable } = require('../scripts/start')
const { applyFingerprintConfig } = require('../runtime-compat')
const { defaultDataRoot, dataRoot } = require('../data-directory')
const {
  createProfileRecord,
  getDefaultProfile,
  getPresetTemplates,
  getPresetTemplateById,
  validateFingerprintProfile
} = require('../profile-store')

function run () {
  assert.doesNotThrow(() => validateFingerprintProfile(getDefaultProfile()))

  const profile = getDefaultProfile()
  profile.hardware.platform = 'Android'
  assert.throws(() => validateFingerprintProfile(profile), /硬件平台/)

  for (const value of [NaN, Infinity, -Infinity, 0, -1, '1']) {
    const invalid = getDefaultProfile()
    invalid.screen.deviceScaleFactor = value
    assert.throws(() => validateFingerprintProfile(invalid), /有限数值/)
  }
  for (const [field, value, message] of [
    ['timezone', '不存在的时区', /有效时区/],
    ['language', 'zh_CN', /语言标记/],
    ['languages', ['zh_CN'], /语言标记/]
  ]) {
    const invalid = getDefaultProfile()
    invalid.locale[field] = value
    assert.throws(() => validateFingerprintProfile(invalid), message)
  }
  const oversized = getDefaultProfile()
  oversized.screen.width = 2147483648
  assert.throws(() => validateFingerprintProfile(oversized), /2147483647/)
  const utc = getDefaultProfile()
  utc.locale.timezone = 'UTC'
  assert.doesNotThrow(() => validateFingerprintProfile(utc))

  const record = createProfileRecord({
    id: 'profile-test',
    name: '测试配置',
    url: 'https://example.com',
    revision: 3,
    fingerprint: getDefaultProfile()
  })
  assert.equal(record.id, 'profile-test')
  assert.equal(record.revision, 3)
  assert.equal(record.fingerprint.id, 'profile-test')
  assert.equal(record.group, '未分组')
  assert.equal(record.storage, 'local')
  const legacyProfile = getDefaultProfile()
  legacyProfile.hardware.deviceMemory = 16
  const migratedRecord = createProfileRecord({ id: 'profile-legacy-memory', fingerprint: legacyProfile })
  assert.equal(legacyProfile.hardware.deviceMemory, 16)
  assert.equal(migratedRecord.fingerprint.hardware.deviceMemory, 8)
  const metadataRecord = createProfileRecord({
    id: 'profile-metadata',
    name: '元数据配置',
    group: '内容营销',
    storage: 'cloud',
    fingerprint: getDefaultProfile()
  })
  assert.equal(metadataRecord.group, '内容营销')
  assert.equal(metadataRecord.storage, 'cloud')
  assert.throws(() => createProfileRecord({ group: '分组'.repeat(41), fingerprint: getDefaultProfile() }), /分组名称不能超过/)
  assert.throws(() => createProfileRecord({ storage: 'remote', fingerprint: getDefaultProfile() }), /保存方式只能是/)
  const proxyRecord = createProfileRecord({
    id: 'profile-proxy',
    name: '代理配置',
    proxy: { mode: 'http', server: 'http://127.0.0.1:8080', username: '用户', password: '密码' },
    fingerprint: getDefaultProfile()
  })
  assert.deepEqual(proxyRecord.proxy, { mode: 'http', server: 'http://127.0.0.1:8080', username: '用户', password: '密码' })
  const socksProxy = { mode: 'socks5', server: 'socks5://127.0.0.1:1080', username: '用户', password: '密码' }
  assert.deepEqual(createProfileRecord({ proxy: socksProxy, fingerprint: getDefaultProfile() }).proxy, socksProxy)
  assert.throws(() => createProfileRecord({ proxy: { ...socksProxy, password: '' }, fingerprint: getDefaultProfile() }), /同时填写账号和密码/)
  assert.throws(() => createProfileRecord({ proxy: { ...socksProxy, password: '密'.repeat(86) }, fingerprint: getDefaultProfile() }), /255 字节/)
  assert.throws(() => createProfileRecord({ id: 'profile-invalid-proxy', proxy: { mode: 'direct', server: 'http://127.0.0.1:8080' }, fingerprint: getDefaultProfile() }), /直连模式/)
  assert.throws(() => createProfileRecord({ id: 'profile-invalid-proxy', proxy: { mode: 'socks5', server: 'http://127.0.0.1:8080' }, fingerprint: getDefaultProfile() }), /socks5 协议/)

  const presets = getPresetTemplates()
  assert.ok(Array.isArray(presets))
  assert.ok(presets.length >= 3)
  const nvidiaPreset = getPresetTemplateById('win11-us-nvidia')
  assert.ok(nvidiaPreset)
  assert.equal(nvidiaPreset.id, 'win11-us-nvidia')
  assert.equal(nvidiaPreset.profile.graphics.webglVendor, 'Google Inc. (NVIDIA)')
  assert.equal(getPresetTemplateById('unknown-preset'), null)

  const recordFromPreset = createProfileRecord({
    id: 'preset-record-1',
    name: '预设生成配置',
    presetId: 'win11-us-nvidia'
  })
  assert.equal(recordFromPreset.fingerprint.graphics.webglVendor, 'Google Inc. (NVIDIA)')
  assert.equal(recordFromPreset.fingerprint.locale.timezone, 'America/New_York')

  const launch = getLaunchOptions({ FP_BROWSER_DATA_DIR: './数据目录', FP_ELECTRON_RUNTIME: './运行时', TEST_VALUE: '保留' })
  assert.ok(launch.args.includes(`--user-data-dir=${path.resolve('./数据目录')}`))
  assert.equal(launch.options.env.FP_BROWSER_DATA_DIR, path.resolve('./数据目录'))
  assert.equal(launch.options.env.TEST_VALUE, '保留')
  assert.equal(launch.args.includes('--no-sandbox'), false)
  assert.equal(defaultDataRoot({ LOCALAPPDATA: 'C:\\用户\\本地数据', APPDATA: 'C:\\用户\\漫游数据' }, 'win32', 'C:\\用户'), 'C:\\用户\\本地数据\\Programs\\栖界\\指纹浏览器')
  assert.equal(defaultDataRoot({}, 'win32', 'C:\\用户'), 'C:\\用户\\AppData\\Local\\Programs\\栖界\\指纹浏览器')
  assert.equal(defaultDataRoot({}, 'darwin', '/用户'), '/用户/Library/Application Support/栖界/指纹浏览器')
  assert.equal(defaultDataRoot({ XDG_CONFIG_HOME: '/配置' }, 'linux', '/用户'), '/配置/栖界/指纹浏览器')
  assert.equal(defaultDataRoot({}, 'linux', '/用户'), '/用户/.config/栖界/指纹浏览器')
  assert.equal(getLaunchOptions({}).dataRoot, path.join(dataRoot({}), 'dev'))
  assert.equal(getLaunchOptions({}).executable, runtimeExecutable(path.resolve(__dirname, '..', '..', '..', 'electron-fp-build', 'src', 'out', 'Release')))
  assert.equal(getLaunchOptions({ ELECTRON_OVERRIDE_DIST_PATH: './兼容运行时' }).executable, runtimeExecutable('./兼容运行时'))
  assert.equal(runtimeExecutable('内核', 'darwin'), path.join('内核', 'Electron.app', 'Contents', 'MacOS', 'Electron'))
  assert.equal(runtimeExecutable('内核', 'linux'), path.join('内核', 'electron'))

  const capabilities = { schemaVersion: 1, chromiumVersion: process.versions.chrome, unicodeConfigTransport: true, webgpuAdapterBlocking: true, workerLanguageList: true }
  const supportedRuntime = { getFingerprintCapabilities: () => capabilities }
  const source = getDefaultProfile()
  const original = structuredClone(source)
  let calls = 0
  let accepted
  const oldRuntime = { ...supportedRuntime, setFingerprintConfig (config) {
    calls++
    if (Object.hasOwn(config.modules, 'runtimeInspector')) throw new Error('Fingerprint 配置包含不支持字段: modules.runtimeInspector')
    accepted = config
  } }
  assert.match(applyFingerprintConfig(oldRuntime, source), /此选项未生效/)
  assert.equal(calls, 2)
  assert.equal(accepted.hardware.hardwareConcurrency, source.hardware.hardwareConcurrency)
  assert.deepEqual(source, original)
  assert.equal(Object.hasOwn(accepted.modules, 'runtimeInspector'), false)
  source.modules.runtimeInspector = true
  assert.throws(() => applyFingerprintConfig(oldRuntime, source), /最新构建/)
  assert.equal(calls, 3)
  assert.equal(applyFingerprintConfig({ ...supportedRuntime, setFingerprintConfig (config) { assert.equal(config.modules.runtimeInspector, true) } }, source), '')
  assert.equal(applyFingerprintConfig({
    ...supportedRuntime,
    getFingerprintConfig: () => ({ ...original, modules: { ...original.modules, runtimeInspector: undefined } }),
    setFingerprintConfig () { throw new Error('不应重复设置已经锁定的配置。') }
  }, original), '')
  assert.throws(() => applyFingerprintConfig({
    ...supportedRuntime,
    getFingerprintConfig: () => ({ ...original, hardware: { ...original.hardware, hardwareConcurrency: 2 } }),
    setFingerprintConfig () { throw new Error('不应更换已经锁定的配置。') }
  }, original), /已经锁定另一份/)
  assert.throws(() => applyFingerprintConfig({}, source), /不包含指纹配置接口/)
  let failedCalls = 0
  assert.throws(() => applyFingerprintConfig({ ...supportedRuntime, setFingerprintConfig () { failedCalls++; throw new Error('其他错误') } }, original), /检查配置/)
  assert.equal(failedCalls, 1)
  let nativeCalls = 0
  let existingReads = 0
  const capabilityRuntime = {
    getFingerprintConfig () { existingReads++; return original },
    setFingerprintConfig () { nativeCalls++ }
  }
  assert.throws(() => applyFingerprintConfig(capabilityRuntime, original), /指纹能力查询接口/)
  assert.equal(existingReads, 0, '相同配置的早返回不能绕过运行时能力检查。')
  for (const declared of [null, { ...capabilities, schemaVersion: 2 }, { ...capabilities, chromiumVersion: '138.0.7204.186' }]) {
    assert.throws(() => applyFingerprintConfig({ ...capabilityRuntime, getFingerprintCapabilities: () => declared }, original), /内核版本不一致/)
  }
  for (const [key, message] of [['webgpuAdapterBlocking', /WebGPU/], ['workerLanguageList', /工作线程/]]) {
    assert.throws(() => applyFingerprintConfig({ ...capabilityRuntime, getFingerprintCapabilities: () => ({ ...capabilities, [key]: false }) }, original), message)
  }
  assert.throws(() => applyFingerprintConfig({ ...capabilityRuntime, getFingerprintCapabilities () { throw new Error('底层错误') } }, original), error => /无法读取当前运行时/.test(error.message) && !error.message.includes('底层错误'))
  assert.equal(nativeCalls, 0)
  assert.equal(existingReads, 0)
  const noNewFeatures = structuredClone(original)
  noNewFeatures.modules.webgl = false
  noNewFeatures.modules.locale = false
  assert.equal(applyFingerprintConfig({ setFingerprintConfig () { nativeCalls++ } }, noNewFeatures), '')
  const unicode = structuredClone(noNewFeatures)
  unicode.id = '中文环境-😀'
  assert.throws(() => applyFingerprintConfig({ setFingerprintConfig () { nativeCalls++ } }, unicode), /指纹能力查询接口/)
  assert.throws(() => applyFingerprintConfig({ ...supportedRuntime, getFingerprintCapabilities: () => ({ ...capabilities, unicodeConfigTransport: false }), setFingerprintConfig () { nativeCalls++ } }, unicode), /中文及特殊字符/)
  assert.equal(applyFingerprintConfig({ getFingerprintCapabilities: () => ({ schemaVersion: 1, chromiumVersion: process.versions.chrome, unicodeConfigTransport: true }), setFingerprintConfig () { nativeCalls++ } }, unicode), '')
  const disabled = { ...unicode, enabled: false }
  assert.equal(applyFingerprintConfig({ setFingerprintConfig () { nativeCalls++ } }, disabled), '')
  assert.equal(nativeCalls, 3, '原生行为和关闭配置不得强制新能力接口。')
  const invalidUA = structuredClone(original)
  invalidUA.browser.userAgent = 'Chrome/120.0.0.0'
  assert.throws(() => applyFingerprintConfig({}, invalidUA), /不包含指纹配置接口/)
  console.log('配置存储、启动参数和运行时兼容自检通过。')
}

const previousChrome = Object.getOwnPropertyDescriptor(process.versions, 'chrome')
Object.defineProperty(process.versions, 'chrome', { value: '138.0.7204.185', configurable: true })
try { run() } finally {
  if (previousChrome) Object.defineProperty(process.versions, 'chrome', previousChrome)
  else delete process.versions.chrome
}
