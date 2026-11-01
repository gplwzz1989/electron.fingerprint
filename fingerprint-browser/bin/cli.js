#!/usr/bin/env node
const path = require('node:path')
const { launch, getLaunchOptions } = require('../launcher')
const metadata = require('../package.json')

function printHelp () {
  console.log(`
指纹浏览器基座 CLI - ${metadata.name} v${metadata.version}

用法:
  fingerprint-browser [选项] [-- 额外参数...]
  qijie-desktop [选项] [-- 额外参数...]

选项:
  -u, --url <url>           指定启动加载的固定首页 URL
  -r, --runtime <dir>       指定指纹版 Electron 运行时目录 (或设置 FP_ELECTRON_RUNTIME)
  -d, --data-dir <dir>      指定用户数据存储目录 (或设置 FP_BROWSER_DATA_DIR)
  -e, --env <env>           运行环境 (prod | dev | test)
  --name <appName>          定制应用显示名称
  --id <appId>              定制应用标识 (applicationId)
  --detached                在后台独立启动，脱离当前命令行终端
  -v, --version             显示版本号并退出
  -h, --help                显示帮助信息并退出

环境变量:
  FP_ELECTRON_RUNTIME       指纹版 Electron 运行时路径
  FP_BROWSER_DATA_DIR       用户数据存放目录

示例:
  fingerprint-browser --url https://qijie.xinmeitool.com
  fingerprint-browser --runtime "D:/runtimes/electron-fp" --env dev
`)
}

function parseArgs (argv) {
  const options = { extraArgs: [] }
  let i = 0
  while (i < argv.length) {
    const arg = argv[i]
    if (arg === '--') {
      options.extraArgs = argv.slice(i + 1)
      break
    }
    if (arg === '-h' || arg === '--help') {
      options.help = true
    } else if (arg === '-v' || arg === '--version') {
      options.version = true
    } else if (arg === '-u' || arg === '--url') {
      options.appUrl = argv[++i]
    } else if (arg.startsWith('--url=')) {
      options.appUrl = arg.slice(6)
    } else if (arg === '-r' || arg === '--runtime') {
      options.runtimeRoot = argv[++i]
    } else if (arg.startsWith('--runtime=')) {
      options.runtimeRoot = arg.slice(10)
    } else if (arg === '-d' || arg === '--data-dir') {
      options.dataDir = argv[++i]
    } else if (arg.startsWith('--data-dir=')) {
      options.dataDir = arg.slice(11)
    } else if (arg === '-e' || arg === '--env') {
      options.environment = argv[++i]
    } else if (arg.startsWith('--env=')) {
      options.environment = arg.slice(6)
    } else if (arg === '--name') {
      options.appName = argv[++i]
    } else if (arg.startsWith('--name=')) {
      options.appName = arg.slice(7)
    } else if (arg === '--id') {
      options.applicationId = argv[++i]
    } else if (arg.startsWith('--id=')) {
      options.applicationId = arg.slice(5)
    } else if (arg === '--detached') {
      options.detached = true
    } else {
      options.extraArgs.push(arg)
    }
    i++
  }
  return options
}

async function runCli () {
  const args = parseArgs(process.argv.slice(2))

  if (args.help) {
    printHelp()
    process.exit(0)
  }

  if (args.version) {
    console.log(metadata.version)
    process.exit(0)
  }

  try {
    const result = await launch({
      ...args,
      stdio: args.detached ? 'ignore' : 'inherit'
    })

    if (args.detached) {
      console.log(`[指纹浏览器基座] 已在后台启动 (PID: ${result.pid})，数据目录：${result.dataRoot}`)
      process.exit(0)
    }

    const child = result.process

    child.on('error', error => {
      console.error(`[指纹浏览器基座] 启动失败：${error.message}`)
      process.exit(1)
    })

    child.on('exit', (code, signal) => {
      if (signal) {
        console.error(`[指纹浏览器基座] 被信号 ${signal} 中止。`)
        process.exit(1)
      }
      process.exit(code || 0)
    })
  } catch (error) {
    console.error(`[指纹浏览器基座错误] ${error.message}`)
    process.exit(1)
  }
}

if (require.main === module) {
  void runCli()
}

module.exports = { parseArgs, printHelp }
