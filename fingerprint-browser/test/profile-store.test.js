const assert = require('node:assert/strict')
const path = require('node:path')
const { getLaunchOptions, runtimeExecutable } = require('../scripts/start')
const { applyFingerprintConfig } = require('../runtime-compat')
const {
  createProfileRecord,
  getDefaultProfile,
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

  const launch = getLaunchOptions({ FP_BROWSER_DATA_DIR: './数据目录', FP_ELECTRON_RUNTIME: './运行时', TEST_VALUE: '保留' })
  assert.ok(launch.args.includes(`--user-data-dir=${path.resolve('./数据目录')}`))
  assert.equal(launch.options.env.FP_BROWSER_DATA_DIR, path.resolve('./数据目录'))
  assert.equal(launch.options.env.TEST_VALUE, '保留')
  assert.equal(launch.args.includes('--no-sandbox'), false)
  assert.equal(runtimeExecutable('内核', 'darwin'), path.join('内核', 'Electron.app', 'Contents', 'MacOS', 'Electron'))
  assert.equal(runtimeExecutable('内核', 'linux'), path.join('内核', 'electron'))

  const source = getDefaultProfile()
  const original = structuredClone(source)
  let calls = 0
  let accepted
  const oldRuntime = { setFingerprintConfig (config) {
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
  assert.equal(applyFingerprintConfig({ setFingerprintConfig (config) { assert.equal(config.modules.runtimeInspector, true) } }, source), '')
  assert.equal(applyFingerprintConfig({
    getFingerprintConfig: () => ({ ...original, modules: { ...original.modules, runtimeInspector: undefined } }),
    setFingerprintConfig () { throw new Error('不应重复设置已经锁定的配置。') }
  }, original), '')
  assert.throws(() => applyFingerprintConfig({
    getFingerprintConfig: () => ({ ...original, hardware: { ...original.hardware, hardwareConcurrency: 2 } }),
    setFingerprintConfig () { throw new Error('不应更换已经锁定的配置。') }
  }, original), /已经锁定另一份/)
  assert.throws(() => applyFingerprintConfig({}, source), /不包含指纹配置接口/)
  let failedCalls = 0
  assert.throws(() => applyFingerprintConfig({ setFingerprintConfig () { failedCalls++; throw new Error('其他错误') } }, original), /检查配置/)
  assert.equal(failedCalls, 1)
  console.log('配置存储、启动参数和运行时兼容自检通过。')
}

run()
