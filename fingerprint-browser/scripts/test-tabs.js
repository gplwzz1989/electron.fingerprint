const path = require('node:path')
const fs = require('node:fs/promises')
const { spawn } = require('node:child_process')
const { getLaunchOptions } = require('./start')

async function run () {
  const output = path.resolve(__dirname, '..', '..', 'dist', 'electron-diagnostics', 'tabs')
  const { executable, options, dataRoot } = getLaunchOptions({
    ...process.env,
    FP_BROWSER_DATA_DIR: path.join(output, `data-${Date.now()}`),
    FP_TABS_TEST_OUTPUT: output
  })
  await fs.mkdir(dataRoot, { recursive: true })
  const child = spawn(executable, [path.resolve(__dirname, '..', 'test', 'native-tabs.test.js'), `--user-data-dir=${dataRoot}`, ...process.argv.slice(2)], options)
  child.on('error', () => { console.error('无法启动标签测试，请检查 Electron 运行时。'); process.exitCode = 1 })
  child.on('exit', code => { process.exitCode = code ?? 1 })
}
void run().catch(() => { console.error('无法创建标签测试数据目录。'); process.exitCode = 1 })
