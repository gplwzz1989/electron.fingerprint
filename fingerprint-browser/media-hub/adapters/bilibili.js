const { BaseAdapter } = require('../types')

function pickBestUrl (track) {
  if (!track) return ''
  const candidates = [
    track.baseUrl,
    track.base_url,
    ...(track.backupUrl || []),
    ...(track.backup_url || [])
  ].filter(Boolean)

  // 优先选取非 PCDN 官方直连 CDN（避免 mcdn.bilivideo.cn:8082 这种不稳定或需要特定 P2P 协议的节点）
  const preferred = candidates.find(u => !u.includes('mcdn.bilivideo') && !u.includes(':8082') && !u.includes('szmcdn'))
  let chosen = preferred || candidates[0] || ''
  if (chosen.startsWith('//')) chosen = `https:${chosen}`
  return chosen
}

function getCodecInfo (track) {
  const codecid = track?.codecid || 0
  const codecs = (track?.codecs || '').toLowerCase()
  if (codecid === 7 || codecs.includes('avc') || codecs.includes('h264')) {
    return { priority: 1, name: 'H.264' }
  }
  if (codecid === 12 || codecs.includes('hev') || codecs.includes('h265')) {
    return { priority: 2, name: 'HEVC' }
  }
  if (codecid === 28 || codecs.includes('av01') || codecs.includes('av1')) {
    return { priority: 3, name: 'AV1' }
  }
  return { priority: 4, name: '标准' }
}

class BilibiliAdapter extends BaseAdapter {
  constructor () {
    super()
    this.id = 'bilibili'
    this.name = '哔哩哔哩 (Bilibili)'
  }

  match (url) {
    return /^https?:\/\/(www\.)?bilibili\.com\/video\/[A-Za-z0-9]+/i.test(url)
  }

  async extract ({ webContents, url }) {
    if (!webContents || webContents.isDestroyed()) {
      throw new Error('页面已关闭，无法提取。')
    }

    const pageData = await webContents.executeJavaScript(`
      (() => {
        try {
          const title = document.querySelector('h1.video-title')?.innerText?.trim() || 
                        document.querySelector('.video-info-title-inner')?.innerText?.trim() || 
                        document.title.replace(/_哔哩哔哩_bilibili.*/, '').trim() || 'B站视频';
          const author = document.querySelector('.up-name')?.innerText?.trim() || 
                         document.querySelector('.username')?.innerText?.trim() || 'B站UP主';
          let cover = window.__INITIAL_STATE__?.videoData?.pic || 
                      window.__INITIAL_STATE__?.arc?.pic ||
                      document.querySelector('meta[itemprop="image"]')?.content ||
                      document.querySelector('meta[property="og:image"]')?.content || '';
          if (cover && cover.includes('transparent.png')) {
            cover = window.__INITIAL_STATE__?.videoData?.pic || '';
          }
          const playInfo = window.__playinfo__ || null;
          return { title, author, cover, playInfo };
        } catch (e) {
          return { error: e.message };
        }
      })()
    `)

    if (!pageData || pageData.error) {
      throw new Error('无法读取页面播放信息，请等待视频加载完成。')
    }

    const resources = []
    const headers = {
      Referer: 'https://www.bilibili.com/',
      'User-Agent': webContents.getUserAgent()
    }

    // 1. 提取视频流 (DASH 或 DURL)
    const playInfo = pageData.playInfo?.data
    if (playInfo) {
      if (playInfo.dash) {
        const rawVideoTracks = playInfo.dash.video || []
        const rawAudioTracks = playInfo.dash.audio || []

        // 音频轨按带宽降序排列，取音质最高的直连 CDN 流
        const audioTracks = [...rawAudioTracks].sort((a, b) => (b.bandwidth || 0) - (a.bandwidth || 0))
        const highestAudio = pickBestUrl(audioTracks[0])

        // 整理画质映射
        const qualityMap = {
          127: '8K 超高清',
          120: '4K 超清',
          116: '1080P 60帧',
          80: '1080P 高清',
          74: '720P 60帧',
          64: '720P 高清',
          32: '480P 清晰',
          16: '360P 流畅'
        }

        // 视频轨排序：
        // 1. 画质优先（id 降序）
        // 2. 编码兼容性优先（优先 H.264/AVC，确保 Windows 原生播放器无障碍直接播放）
        // 3. 码率优先（bandwidth 降序）
        const sortedVideoTracks = [...rawVideoTracks].sort((a, b) => {
          const qDiff = (b.id || 0) - (a.id || 0)
          if (qDiff !== 0) return qDiff
          const codecDiff = getCodecInfo(a).priority - getCodecInfo(b).priority
          if (codecDiff !== 0) return codecDiff
          return (b.bandwidth || 0) - (a.bandwidth || 0)
        })

        const seenQuality = new Set()
        for (const v of sortedVideoTracks) {
          const qText = qualityMap[v.id] || `${v.id}P`
          const codecInfo = getCodecInfo(v)
          if (seenQuality.has(qText)) continue
          seenQuality.add(qText)

          const videoUrl = pickBestUrl(v)
          if (videoUrl) {
            resources.push({
              id: `bili-v-${v.id}-${codecInfo.name.toLowerCase()}`,
              category: 'video',
              title: `${pageData.title} - ${qText}`,
              quality: `${qText} (${codecInfo.name})`,
              format: 'mp4',
              url: videoUrl,
              audioUrl: highestAudio, // 附带关联音频流
              headers,
              size: v.bandwidth ? `~${Math.round(v.bandwidth * 60 / 8 / 1024 / 1024 * 3)} MB` : '未知大小'
            })
          }
        }

        // 2. 提取独立原声音频
        if (highestAudio) {
          resources.push({
            id: 'bili-a-primary',
            category: 'audio',
            title: `${pageData.title} - 原声音频`,
            quality: '高品质音频 (DASH)',
            format: 'm4a',
            url: highestAudio,
            headers,
            size: '~音频流'
          })
        }
      } else if (playInfo.durl && playInfo.durl.length > 0) {
        // 单一直链 MP4 模式
        const item = playInfo.durl[0]
        resources.push({
          id: 'bili-v-durl',
          category: 'video',
          title: pageData.title,
          quality: '高清画质',
          format: 'mp4',
          url: item.url,
          headers,
          size: item.size ? `${(item.size / 1024 / 1024).toFixed(1)} MB` : '直接流'
        })
      }
    }

    // 3. 提取高清封面图
    if (pageData.cover && !pageData.cover.includes('transparent.png')) {
      const coverUrl = pageData.cover.startsWith('//') ? `https:${pageData.cover}` : pageData.cover
      const ext = coverUrl.includes('.png') ? 'png' : coverUrl.includes('.webp') ? 'webp' : 'jpg'
      resources.push({
        id: 'bili-img-cover',
        category: 'image',
        title: `${pageData.title} - 官方封面`,
        quality: '原尺寸封面图',
        format: ext,
        url: coverUrl,
        headers,
        size: '原图'
      })
    }

    return {
      adapterId: this.id,
      adapterName: this.name,
      title: pageData.title,
      author: pageData.author,
      coverUrl: pageData.cover?.startsWith('//') ? `https:${pageData.cover}` : pageData.cover,
      resources
    }
  }
}

module.exports = {
  BilibiliAdapter
}
