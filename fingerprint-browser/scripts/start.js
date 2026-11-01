const { launch, getLaunchOptions, runtimeExecutable } = require('../launcher')

async function start () {
  try {
    const extraArgs = process.argv.slice(2)
    const result = await launch({ extraArgs, stdio: 'inherit' })
    const child = result.process

    child.on('error', () => {
      console.error('启动指纹版 Electron 失败，请检查运行时路径和执行权限。')
      process.exitCode = 1
    })

    child.on('exit', (code, signal) => {
      if (signal) {
        console.error(`指纹版 Electron 被信号 ${signal} 终止。`)
        process.exitCode = 1
        return
      }
      if (code) console.error(`指纹版 Electron 退出，退出码：${code}。`)
      process.exitCode = code || 0
    })
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}

module.exports = { getLaunchOptions, runtimeExecutable, start }
if (require.main === module) void start()
