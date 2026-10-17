#!/usr/bin/env node
const fs = require('node:fs')
const path = require('node:path')
const { getPlatformInfo, downloadFfmpegBinary, findExistingFfmpeg } = require('../media-hub/ffmpeg-provider')

function parseArgs () {
  const args = {}
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--')) {
      const [key, val] = arg.slice(2).split('=')
      args[key] = val || true
    }
  }
  return args
}

async function main () {
  const args = parseArgs()
  const targetPlatform = args.platform || process.platform
  const targetArch = args.arch || process.arch
  const info = getPlatformInfo(targetPlatform, targetArch)

  const projectRoot = path.resolve(__dirname, '..')
  const destDir = args.dest 
    ? path.resolve(args.dest)
    : path.join(projectRoot, 'bin')

  const targetBinary = path.join(destDir, info.binaryName)
  console.log(`[FFmpeg 打包构建检查] 目标平台: ${info.platformKey} | 期望文件: ${info.binaryName}`)
  console.log(`[FFmpeg 打包构建检查] 目标输出目录: ${destDir}`)

  // 1. 如果目标位置已有该平台的二进制，直接复用
  if (fs.existsSync(targetBinary) && fs.statSync(targetBinary).size > 1024 * 1024) {
    console.log(`[FFmpeg 打包构建检查] 目标文件已就绪 (${(fs.statSync(targetBinary).size / 1024 / 1024).toFixed(1)} MB)，跳过下载。`)
    return
  }

  // 2. 检查本地源码 bin/ 中是否已有目标文件
  const localSourceBinary = path.join(projectRoot, 'bin', info.binaryName)
  if (fs.existsSync(localSourceBinary) && fs.statSync(localSourceBinary).size > 1024 * 1024) {
    console.log(`[FFmpeg 打包构建检查] 从本地源码缓存复制: ${localSourceBinary} -> ${targetBinary}`)
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })
    fs.copyFileSync(localSourceBinary, targetBinary)
    if (!info.isWindows) fs.chmodSync(targetBinary, 0o755)
    return
  }

  // 3. 否则自动从官方/镜像源下载并解压到目标目录
  console.log(`[FFmpeg 打包构建检查] 正在下载适配 ${info.platformKey} 的独立二进制包...`)
  await downloadFfmpegBinary({
    targetDir: destDir,
    customPlatform: targetPlatform,
    customArch: targetArch,
    onProgress: (p) => {
      if (p.status === 'downloading') {
        process.stdout.write(`\r下载进度: ${p.percent}% (${(p.receivedBytes / 1024 / 1024).toFixed(1)} MB / ${(p.totalBytes / 1024 / 1024).toFixed(1)} MB)`)
      } else if (p.status === 'extracting') {
        console.log('\n正在解压并配置可执行权限...')
      }
    }
  })

  console.log(`[FFmpeg 打包构建检查] ${info.platformKey} 版 FFmpeg 准备完成: ${targetBinary}`)
}

main().catch(err => {
  console.error('[FFmpeg 打包构建检查失败]', err)
  process.exit(1)
})
