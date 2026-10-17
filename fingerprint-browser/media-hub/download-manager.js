const fs = require('node:fs')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const { EventEmitter } = require('node:events')
const { app, shell } = require('electron')

const { spawn } = require('node:child_process')
const { findExistingFfmpeg, ensureFfmpegBinary } = require('./ffmpeg-provider')

async function streamFetchToFile ({ url, destPath, headers, session, signal, onChunk, onLength }) {
  const reqHeaders = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
    ...(headers || {})
  }

  if (session?.cookies) {
    try {
      const cookies = await session.cookies.get({ url })
      if (cookies && cookies.length > 0) {
        reqHeaders['Cookie'] = cookies.map(c => `${c.name}=${c.value}`).join('; ')
      }
    } catch (_) {}
  }

  const response = await fetch(url, {
    headers: reqHeaders,
    signal
  })

  if (!response.ok) {
    throw new Error(`HTTP 响应状态错误: ${response.status} ${response.statusText}`)
  }

  const len = Number(response.headers.get('content-length')) || 0
  if (onLength) onLength(len)

  const fileStream = fs.createWriteStream(destPath)
  const reader = response.body.getReader()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      fileStream.write(Buffer.from(value))
      if (onChunk) onChunk(value.length)
    }

    await new Promise((resolve, reject) => {
      fileStream.end(resolve)
      fileStream.on('error', reject)
    })
  } catch (err) {
    try { fileStream.destroy() } catch (_) {}
    try { if (fs.existsSync(destPath)) fs.unlinkSync(destPath) } catch (_) {}
    throw err
  }
}

class DownloadManager extends EventEmitter {
  constructor () {
    super()
    this.tasks = new Map()
    this.activeRequests = new Map()
    this.downloadDir = path.join(app.getPath('downloads'), '栖界媒体库')
    this.ensureDownloadDir()
  }

  ensureDownloadDir () {
    try {
      if (!fs.existsSync(this.downloadDir)) {
        fs.mkdirSync(this.downloadDir, { recursive: true })
      }
    } catch (err) {
      console.warn('[创建下载目录失败]', err)
    }
  }

  sanitizeFilename (name) {
    return (name || '未命名媒体')
      .replace(/[\\/:*?"<>|]/g, '_')
      .trim()
      .slice(0, 100)
  }

  /**
   * 探测并确保可用 FFmpeg 路径（优先复用本地已有或打包版本，缺失时自动静默自愈下载适配当前系统架构的版本）
   */
  async resolveFfmpegPath (task) {
    const existing = findExistingFfmpeg({
      appRoot: app.getAppPath(),
      userDataDir: app.getPath('userData')
    })
    if (existing) return existing

    try {
      if (task) {
        task.speed = '首次运行正在下载跨平台解码套件...'
        this.emitChange()
      }
      return await ensureFfmpegBinary({
        appRoot: app.getAppPath(),
        userDataDir: app.getPath('userData'),
        onProgress: (p) => {
          if (task && p.status === 'downloading') {
            task.speed = `准备解码组件 ${p.percent}%`
            this.emitChange()
          } else if (task && p.status === 'extracting') {
            task.speed = '正在解压套件...'
            this.emitChange()
          }
        }
      })
    } catch (err) {
      console.warn('[FFmpeg 运行时自愈下载失败]', err.message)
      return null
    }
  }

  /**
   * 启动下载任务
   * @param {object} params
   * @param {string} params.tabId
   * @param {Electron.Session} params.session - 当前环境持久化 Session
   * @param {object} params.resource - 媒体资源对象
   * @returns {object} task
   */
  startDownload ({ tabId, session, resource }) {
    if (!resource || !resource.url) {
      throw new Error('下载地址无效。')
    }

    let targetUrl = resource.url
    if (targetUrl.startsWith('//')) {
      targetUrl = `https:${targetUrl}`
    }

    const taskId = randomUUID()
    const ext = resource.format || (resource.category === 'image' ? 'jpg' : resource.category === 'audio' ? 'mp3' : 'mp4')
    const safeTitle = this.sanitizeFilename(resource.title || '下载资源')
    const fileName = `${safeTitle}_${Date.now().toString().slice(-4)}.${ext}`
    const filePath = path.join(this.downloadDir, fileName)

    const abortController = new AbortController()

    const task = {
      id: taskId,
      tabId,
      title: safeTitle,
      category: resource.category || 'video',
      format: ext,
      status: 'downloading',
      receivedBytes: 0,
      totalBytes: 0,
      progress: 0,
      speed: '0 KB/s',
      filePath,
      error: '',
      createdAt: new Date().toISOString()
    }

    this.tasks.set(taskId, task)
    this.activeRequests.set(taskId, { abortController })
    this.emitChange()

    // 异步执行下载流程
    void this.executeDownloadTask(taskId, task, filePath, targetUrl, resource, session, abortController)

    return task
  }

  async executeDownloadTask (taskId, task, filePath, targetUrl, resource, session, abortController) {
    let speedTimer = null
    const tempFiles = []

    try {
      const headers = resource.headers || {}
      let lastBytes = 0
      let lastTime = Date.now()

      speedTimer = setInterval(() => {
        if (task.status !== 'downloading') {
          clearInterval(speedTimer)
          return
        }
        const now = Date.now()
        const duration = (now - lastTime) / 1000
        if (duration > 0) {
          const delta = task.receivedBytes - lastBytes
          const bps = delta / duration
          task.speed = bps > 1024 * 1024 
            ? `${(bps / 1024 / 1024).toFixed(1)} MB/s` 
            : `${(bps / 1024).toFixed(0)} KB/s`
          lastBytes = task.receivedBytes
          lastTime = now
          this.emitChange()
        }
      }, 500)

      // 1. 如果是音视频分离的 DASH 视频流（如 B站），需并发下载视频轨与音频轨，并使用 FFmpeg 封装合成
      if (resource.category === 'video' && resource.audioUrl) {
        const videoTemp = `${filePath}.video.tmp`
        const audioTemp = `${filePath}.audio.tmp`
        tempFiles.push(videoTemp, audioTemp)

        let videoTotal = 0
        let audioTotal = 0

        const downloadVideoPromise = streamFetchToFile({
          url: targetUrl,
          destPath: videoTemp,
          headers,
          session,
          signal: abortController.signal,
          onLength: (len) => {
            videoTotal = len
            task.totalBytes = videoTotal + audioTotal
          },
          onChunk: (bytes) => {
            task.receivedBytes += bytes
            if (task.totalBytes > 0) {
              task.progress = Math.min(95, Math.round((task.receivedBytes / task.totalBytes) * 100))
            }
          }
        })

        const downloadAudioPromise = streamFetchToFile({
          url: resource.audioUrl,
          destPath: audioTemp,
          headers,
          session,
          signal: abortController.signal,
          onLength: (len) => {
            audioTotal = len
            task.totalBytes = videoTotal + audioTotal
          },
          onChunk: (bytes) => {
            task.receivedBytes += bytes
            if (task.totalBytes > 0) {
              task.progress = Math.min(95, Math.round((task.receivedBytes / task.totalBytes) * 100))
            }
          }
        })

        await Promise.all([downloadVideoPromise, downloadAudioPromise])

        // 音视频两路流下载完成，开始封装为标准 MP4 容器
        task.speed = '正在合成音视频...'
        task.progress = 98
        this.emitChange()

        const ffmpegPath = await this.resolveFfmpegPath(task)
        if (!ffmpegPath) {
          throw new Error('未检测到可用 FFmpeg 且自动下载失败，已自动回退保留原始视频轨')
        }
        try {
          await new Promise((resolve, reject) => {
            const proc = spawn(ffmpegPath, [
              '-y',
              '-i', videoTemp,
              '-i', audioTemp,
              '-c', 'copy',
              filePath
            ], { windowsHide: true })

            let stderr = ''
            proc.stderr.on('data', d => { stderr += d.toString() })
            proc.on('close', code => {
              if (code === 0 && fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
                resolve()
              } else {
                reject(new Error(`FFmpeg 退出码 ${code}: ${stderr.slice(-200)}`))
              }
            })
            proc.on('error', err => reject(err))
          })

          // 合成完成，清理两路临时分段
          for (const tmp of tempFiles) {
            try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp) } catch (_) {}
          }
        } catch (mergeErr) {
          console.warn('[FFmpeg 合成失败，尝试保留视频原轨]', mergeErr)
          // 兜底：若 FFmpeg 异常，将视频轨重命名为目标文件，避免内容丢失
          if (fs.existsSync(videoTemp)) {
            try {
              if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
              fs.renameSync(videoTemp, filePath)
            } catch (_) {}
          }
        }
      } else if (resource.category === 'audio' && (targetUrl.includes('.m4s') || resource.format === 'm4a')) {
        // 2. 单独下载 DASH 音频流时，通过 FFmpeg 转封装为标准 M4A 容器
        const audioTemp = `${filePath}.audio.tmp`
        tempFiles.push(audioTemp)

        await streamFetchToFile({
          url: targetUrl,
          destPath: audioTemp,
          headers,
          session,
          signal: abortController.signal,
          onLength: (len) => {
            task.totalBytes = len
          },
          onChunk: (bytes) => {
            task.receivedBytes += bytes
            if (task.totalBytes > 0) {
              task.progress = Math.min(95, Math.round((task.receivedBytes / task.totalBytes) * 100))
            }
          }
        })

        task.speed = '正在封装音频...'
        task.progress = 98
        this.emitChange()

        const ffmpegPath = await this.resolveFfmpegPath(task)
        if (ffmpegPath) {
          try {
          await new Promise((resolve, reject) => {
            const proc = spawn(ffmpegPath, [
              '-y',
              '-i', audioTemp,
              '-c', 'copy',
              filePath
            ], { windowsHide: true })

            proc.on('close', code => {
              if (code === 0 && fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
                resolve()
              } else {
                reject(new Error(`音频封装退出码: ${code}`))
              }
            })
            proc.on('error', err => reject(err))
          })
          try { if (fs.existsSync(audioTemp)) fs.unlinkSync(audioTemp) } catch (_) {}
        } catch (_) {
          if (fs.existsSync(audioTemp)) {
            try {
              if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
              fs.renameSync(audioTemp, filePath)
            } catch (_) {}
          }
        }
      } else {
        if (fs.existsSync(audioTemp)) {
          try {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
            fs.renameSync(audioTemp, filePath)
          } catch (_) {}
        }
      }
      } else {
        // 3. 普通单流资源（图片、直链 MP4、通用视频）
        await streamFetchToFile({
          url: targetUrl,
          destPath: filePath,
          headers,
          session,
          signal: abortController.signal,
          onLength: (len) => {
            task.totalBytes = len
          },
          onChunk: (bytes) => {
            task.receivedBytes += bytes
            if (task.totalBytes > 0) {
              task.progress = Math.min(100, Math.round((task.receivedBytes / task.totalBytes) * 100))
            }
          }
        })
      }

      clearInterval(speedTimer)
      task.status = 'completed'
      task.progress = 100
      task.speed = '已完成'
      this.activeRequests.delete(taskId)
      this.emitChange()

    } catch (err) {
      if (speedTimer) clearInterval(speedTimer)
      for (const tmp of tempFiles) {
        try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp) } catch (_) {}
      }
      this.activeRequests.delete(taskId)

      if (abortController.signal.aborted) {
        task.status = 'canceled'
        task.error = '已取消下载'
        task.speed = '已取消'
      } else {
        task.status = 'failed'
        task.error = err.message || '网络连接中断'
        task.speed = '失败'
      }
      this.emitChange()
    }
  }

  cancelTask (taskId) {
    const handle = this.activeRequests.get(taskId)
    if (handle) {
      if (handle.abortController) {
        try { handle.abortController.abort() } catch (_) {}
      }
      this.activeRequests.delete(taskId)
    }
    const task = this.tasks.get(taskId)
    if (task && task.status === 'downloading') {
      task.status = 'canceled'
      task.error = '已取消下载'
      task.speed = '已取消'
      this.emitChange()
    }
  }

  openFile (taskId) {
    const task = this.tasks.get(taskId)
    if (task && fs.existsSync(task.filePath)) {
      shell.openPath(task.filePath)
    }
  }

  openFolder (taskId) {
    const task = this.tasks.get(taskId)
    if (task && fs.existsSync(task.filePath)) {
      shell.showItemInFolder(task.filePath)
    } else if (fs.existsSync(this.downloadDir)) {
      shell.openPath(this.downloadDir)
    }
  }

  listTasks () {
    return Array.from(this.tasks.values()).reverse()
  }

  emitChange () {
    this.emit('tasks-changed', this.listTasks())
  }
}

module.exports = {
  DownloadManager
}
