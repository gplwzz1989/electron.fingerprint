const { EventEmitter } = require('node:events')

class MediaSniffer extends EventEmitter {
  constructor () {
    super()
    this.tabRecords = new Map() // tabId -> Array<SniffedItem>
    this.monitoredSessions = new WeakSet()
  }

  /**
   * 监听指定 Session 的网络响应
   * @param {Electron.Session} session
   * @param {() => string} getActiveTabId
   */
  attachSession (session, getActiveTabId) {
    if (!session || this.monitoredSessions.has(session)) return
    this.monitoredSessions.add(session)

    session.webRequest.onHeadersReceived({ urls: ['*://*/*'] }, (details, callback) => {
      callback({ cancel: false })
      try {
        const responseHeaders = details.responseHeaders || {}
        const contentTypeHeader = Object.keys(responseHeaders).find(k => k.toLowerCase() === 'content-type')
        const contentType = contentTypeHeader ? responseHeaders[contentTypeHeader][0]?.toLowerCase() : ''
        const contentLengthHeader = Object.keys(responseHeaders).find(k => k.toLowerCase() === 'content-length')
        const contentLength = contentLengthHeader ? Number(responseHeaders[contentLengthHeader][0]) : 0
        const url = details.url

        // 仅处理 http/https
        if (!/^https?:\/\//i.test(url)) return

        let category = null
        let format = 'mp4'

        // 1. 视频检测
        if (contentType.includes('video/') || 
            contentType.includes('application/vnd.apple.mpegurl') || 
            contentType.includes('application/x-mpegurl') ||
            /\.(mp4|webm|flv|m3u8|mpd)(\?|$)/i.test(url)) {
          category = 'video'
          format = url.includes('.m3u8') ? 'm3u8' : url.includes('.webm') ? 'webm' : 'mp4'
        }
        // 2. 音频检测
        else if (contentType.includes('audio/') || /\.(mp3|m4a|wav|aac|flac|ogg)(\?|$)/i.test(url)) {
          category = 'audio'
          format = url.includes('.m4a') ? 'm4a' : 'mp3'
        }
        // 3. 超清图片检测（过滤小于 80KB 的小图标和样式资源）
        else if (contentType.includes('image/') && (contentLength > 80 * 1024 || /\.(jpg|jpeg|png|webp)(\?|$)/i.test(url))) {
          if (contentLength === 0 || contentLength > 80 * 1024) {
            category = 'image'
            format = 'jpg'
          }
        }

        if (category) {
          const tabId = typeof getActiveTabId === 'function' ? getActiveTabId() : null
          if (tabId) {
            this.recordMedia(tabId, {
              url,
              category,
              format,
              contentType,
              contentLength,
              timestamp: Date.now()
            })
          }
        }
      } catch (err) {
        // 忽略嗅探异常，确保不影响主流程
      }
    })
  }

  recordMedia (tabId, item) {
    const list = this.tabRecords.get(tabId) || []
    // 过滤重复 URL
    if (list.some(existing => existing.url === item.url)) return
    list.push(item)
    this.tabRecords.set(tabId, list)
    this.emit('change', { tabId, count: list.length })
  }

  getForTab (tabId) {
    return this.tabRecords.get(tabId) || []
  }

  clearTab (tabId) {
    if (this.tabRecords.has(tabId)) {
      this.tabRecords.delete(tabId)
      this.emit('change', { tabId, count: 0 })
    }
  }
}

module.exports = {
  MediaSniffer
}
