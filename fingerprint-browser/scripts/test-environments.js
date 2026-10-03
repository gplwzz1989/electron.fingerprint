const assert = require('node:assert/strict')
const http = require('node:http')
const path = require('node:path')
const fs = require('node:fs/promises')
const { spawn } = require('node:child_process')
const { getLaunchOptions } = require('./start')

async function runChild (executable, options, childScript, dataRoot, mode, url) {
  const childOptions = {
    ...options,
    env: { ...options.env, FP_BROWSER_DATA_DIR: dataRoot, FP_RESTART_MODE: mode, FP_RESTART_URL: url },
    windowsHide: true
  }
  const child = spawn(executable, [childScript, `--user-data-dir=${dataRoot}`], childOptions)
  return await new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', (code, signal) => resolve({ code, signal }))
  })
}

async function run () {
  const output = path.resolve(__dirname, '..', '..', 'dist', 'electron-diagnostics', 'environments')
  const dataRoot = path.join(output, `data-${Date.now()}`)
  await fs.mkdir(dataRoot, { recursive: true })
  const server = http.createServer((_request, response) => {
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    response.end('<!doctype html><html lang="zh-CN"><body>环境恢复测试</body></html>')
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const url = `http://127.0.0.1:${server.address().port}/`
  const { executable, options } = getLaunchOptions({ ...process.env, FP_BROWSER_DATA_DIR: dataRoot })
  const childScript = path.resolve(__dirname, '..', 'test', 'environment-restart.test.js')
  try {
    const first = await runChild(executable, options, childScript, dataRoot, 'write', url)
    assert.equal(first.code, 0, `首次环境写入进程失败：${first.signal || first.code}`)
    const second = await runChild(executable, options, childScript, dataRoot, 'read', url)
    assert.equal(second.code, 0, `重启环境恢复进程失败：${second.signal || second.code}`)
    console.log('跨进程重启后的环境、指纹、Cookie 和本地存储恢复通过。')
  } finally {
    await new Promise(resolve => server.close(resolve))
  }
}

void run().catch(error => {
  console.error('跨进程环境恢复测试失败。', error)
  process.exitCode = 1
})
