const fs = require('node:fs')
const path = require('node:path')
const { createGunzip } = require('node:zlib')
const { pipeline } = require('node:stream/promises')
const { Readable } = require('node:stream')
const { execSync } = require('node:child_process')

const FFMPEG_RELEASE_TAG = 'b6.1.1'

/**
 * 跨平台 FFmpeg 单文件二进制源配置
 */
const FFMPEG_REGISTRY = {
  'win32-x64': {
    binaryName: 'ffmpeg.exe',
    fileName: 'ffmpeg-win32-x64.gz',
    urls: [
      `https://ghproxy.net/https://github.com/eugeneware/ffmpeg-static/releases/download/${FFMPEG_RELEASE_TAG}/ffmpeg-win32-x64.gz`,
      `https://mirror.ghproxy.com/https://github.com/eugeneware/ffmpeg-static/releases/download/${FFMPEG_RELEASE_TAG}/ffmpeg-win32-x64.gz`,
      `https://github.com/eugeneware/ffmpeg-static/releases/download/${FFMPEG_RELEASE_TAG}/ffmpeg-win32-x64.gz`
    ]
  },
  'darwin-arm64': {
    binaryName: 'ffmpeg',
    fileName: 'ffmpeg-darwin-arm64.gz',
    urls: [
      `https://ghproxy.net/https://github.com/eugeneware/ffmpeg-static/releases/download/${FFMPEG_RELEASE_TAG}/ffmpeg-darwin-arm64.gz`,
      `https://mirror.ghproxy.com/https://github.com/eugeneware/ffmpeg-static/releases/download/${FFMPEG_RELEASE_TAG}/ffmpeg-darwin-arm64.gz`,
      `https://github.com/eugeneware/ffmpeg-static/releases/download/${FFMPEG_RELEASE_TAG}/ffmpeg-darwin-arm64.gz`
    ]
  },
  'darwin-x64': {
    binaryName: 'ffmpeg',
    fileName: 'ffmpeg-darwin-x64.gz',
    urls: [
      `https://ghproxy.net/https://github.com/eugeneware/ffmpeg-static/releases/download/${FFMPEG_RELEASE_TAG}/ffmpeg-darwin-x64.gz`,
      `https://mirror.ghproxy.com/https://github.com/eugeneware/ffmpeg-static/releases/download/${FFMPEG_RELEASE_TAG}/ffmpeg-darwin-x64.gz`,
      `https://github.com/eugeneware/ffmpeg-static/releases/download/${FFMPEG_RELEASE_TAG}/ffmpeg-darwin-x64.gz`
    ]
  },
  'linux-x64': {
    binaryName: 'ffmpeg',
    fileName: 'ffmpeg-linux-x64.gz',
    urls: [
      `https://ghproxy.net/https://github.com/eugeneware/ffmpeg-static/releases/download/${FFMPEG_RELEASE_TAG}/ffmpeg-linux-x64.gz`,
      `https://mirror.ghproxy.com/https://github.com/eugeneware/ffmpeg-static/releases/download/${FFMPEG_RELEASE_TAG}/ffmpeg-linux-x64.gz`,
      `https://github.com/eugeneware/ffmpeg-static/releases/download/${FFMPEG_RELEASE_TAG}/ffmpeg-linux-x64.gz`
    ]
  }
}

/**
 * 获取当前环境或指定打包目标的系统平台信息
 */
function getPlatformInfo (customPlatform, customArch) {
  const platform = customPlatform || process.platform
  const arch = customArch || process.arch
  let platformKey = `${platform}-${arch}`

  if (platform === 'win32') {
    platformKey = 'win32-x64'
  } else if (platform === 'darwin') {
    platformKey = arch === 'arm64' ? 'darwin-arm64' : 'darwin-x64'
  } else if (platform === 'linux') {
    platformKey = 'linux-x64'
  }

  const config = FFMPEG_REGISTRY[platformKey] || FFMPEG_REGISTRY['win32-x64']
  const binaryName = platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg'

  return {
    platform,
    arch,
    platformKey,
    binaryName,
    isWindows: platform === 'win32',
    isMac: platform === 'darwin',
    isLinux: platform === 'linux',
    urls: config.urls
  }
}

/**
 * 本地已有 FFmpeg 路径检测
 */
function findExistingFfmpeg ({ appRoot, userDataDir, customPlatform, customArch } = {}) {
  const info = getPlatformInfo(customPlatform, customArch)
  const binaryName = info.binaryName

  const candidateDirs = [
    appRoot ? path.join(appRoot, 'bin') : null,
    appRoot ? path.join(appRoot, '..') : null,
    path.join(__dirname, '../bin'),
    userDataDir ? path.join(userDataDir, 'bin') : null,
    process.cwd(),
    path.join(process.cwd(), 'bin')
  ].filter(Boolean)

  // 1. 优先检测各候选目录中已解压/已放置的二进制
  for (const dir of candidateDirs) {
    const candidate = path.join(dir, binaryName)
    try {
      if (fs.existsSync(candidate) && fs.statSync(candidate).size > 1024 * 1024) {
        return candidate
      }
    } catch (_) {}
  }

  // 2. Windows 平台特例：检测开发机已有的 Python/Workbuddy 独立二进制
  if (info.isWindows) {
    const defaultPythonFfmpeg = 'C:\\Users\\Administrator\\.workbuddy\\binaries\\python\\envs\\default\\Lib\\site-packages\\imageio_ffmpeg\\binaries\\ffmpeg.exe'
    if (fs.existsSync(defaultPythonFfmpeg)) {
      return defaultPythonFfmpeg
    }
  }

  // 3. 环境变量 PATH 检测
  try {
    const checkCmd = info.isWindows ? 'where.exe ffmpeg' : 'which ffmpeg'
    const out = execSync(checkCmd, { stdio: ['ignore', 'pipe', 'ignore'], timeout: 2000 }).toString().trim()
    const firstLine = out.split(/[\r\n]+/)[0]?.trim()
    if (firstLine && fs.existsSync(firstLine)) {
      return firstLine
    }
  } catch (_) {}

  return null
}

let activeDownloadPromise = null

/**
 * 跨平台流式下载并解压目标平台的 FFmpeg 二进制（零第三方依赖）
 */
async function downloadFfmpegBinary ({ targetDir, customPlatform, customArch, onProgress } = {}) {
  const info = getPlatformInfo(customPlatform, customArch)
  const binaryName = info.binaryName
  const destBinaryPath = path.join(targetDir, binaryName)

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }

  const urls = [
    process.env.FFMPEG_DOWNLOAD_URL,
    ...info.urls
  ].filter(Boolean)

  let lastError = null

  for (const url of urls) {
    try {
      if (onProgress) onProgress({ status: 'connecting', url })
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`)
      }

      const totalBytes = Number(res.headers.get('content-length')) || 0
      const tempPath = `${destBinaryPath}.tmp`
      const fileStream = fs.createWriteStream(tempPath)

      let receivedBytes = 0
      const reader = res.body.getReader()

      // 跟踪进度并喂给 Node Readable 流
      const customReadable = new Readable({
        async read () {
          try {
            const { done, value } = await reader.read()
            if (done) {
              this.push(null)
            } else {
              receivedBytes += value.length
              if (onProgress && totalBytes > 0) {
                const percent = Math.min(100, Math.round((receivedBytes / totalBytes) * 100))
                onProgress({ status: 'downloading', percent, receivedBytes, totalBytes })
              }
              this.push(Buffer.from(value))
            }
          } catch (err) {
            this.destroy(err)
          }
        }
      })

      if (onProgress) onProgress({ status: 'extracting' })

      // 流式管道直接解压 GZ 写入目标文件
      await pipeline(
        customReadable,
        createGunzip(),
        fileStream
      )

      // macOS / Linux 赋予 0755 可执行权限
      if (!info.isWindows) {
        fs.chmodSync(tempPath, 0o755)
      }

      // 原子重命名为目标二进制
      if (fs.existsSync(destBinaryPath)) {
        try { fs.unlinkSync(destBinaryPath) } catch (_) {}
      }
      fs.renameSync(tempPath, destBinaryPath)

      if (!info.isWindows) {
        fs.chmodSync(destBinaryPath, 0o755)
      }

      if (onProgress) onProgress({ status: 'ready', path: destBinaryPath })
      return destBinaryPath
    } catch (err) {
      lastError = err
      console.warn(`[FFmpeg 下载源失败: ${url}]`, err.message)
    }
  }

  throw new Error(`下载 FFmpeg 失败: ${lastError?.message || '所有源均不可用'}`)
}

/**
 * 自动确保可用（本地探测优先，缺失则静默自愈下载）
 */
async function ensureFfmpegBinary ({ appRoot, userDataDir, customPlatform, customArch, onProgress } = {}) {
  // 1. 先探测已有路径
  const existing = findExistingFfmpeg({ appRoot, userDataDir, customPlatform, customArch })
  if (existing) {
    return existing
  }

  // 2. 若当前有并发下载任务，复用 Promise
  if (activeDownloadPromise) {
    return activeDownloadPromise
  }

  const targetDir = userDataDir ? path.join(userDataDir, 'bin') : (appRoot ? path.join(appRoot, 'bin') : path.join(__dirname, '../bin'))

  activeDownloadPromise = (async () => {
    try {
      return await downloadFfmpegBinary({
        targetDir,
        customPlatform,
        customArch,
        onProgress
      })
    } finally {
      activeDownloadPromise = null
    }
  })()

  return activeDownloadPromise
}

module.exports = {
  getPlatformInfo,
  findExistingFfmpeg,
  downloadFfmpegBinary,
  ensureFfmpegBinary,
  FFMPEG_REGISTRY
}
