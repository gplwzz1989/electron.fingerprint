const { BaseAdapter } = require('../types')

class GenericAdapter extends BaseAdapter {
  constructor () {
    super()
    this.id = 'generic'
    this.name = '通用媒体嗅探器'
  }

  match () {
    return true // 兜底匹配任意网址
  }

  async extract ({ webContents, url, sniffed = [] }) {
    if (!webContents || webContents.isDestroyed()) {
      throw new Error('页面已关闭，无法嗅探。')
    }

    const domData = await webContents.executeJavaScript(`
      (() => {
        try {
          const title = document.title || '网页媒体资源';
          const author = document.querySelector('meta[name="author"]')?.content || location.hostname;
          const ogImage = document.querySelector('meta[property="og:image"]')?.content || '';

          // 页面内视频
          const videos = [];
          document.querySelectorAll('video').forEach(v => {
            const src = v.currentSrc || v.src || v.querySelector('source')?.src;
            if (src && !src.startsWith('blob:')) videos.push(src);
          });

          // 页面内音频
          const audios = [];
          document.querySelectorAll('audio').forEach(a => {
            const src = a.currentSrc || a.src || a.querySelector('source')?.src;
            if (src && !src.startsWith('blob:')) audios.push(src);
          });

          // 页面内大图
          const images = [];
          document.querySelectorAll('img').forEach(img => {
            const src = img.currentSrc || img.src;
            if (src && img.naturalWidth >= 300 && img.naturalHeight >= 200) {
              images.push({
                url: src,
                width: img.naturalWidth,
                height: img.naturalHeight
              });
            }
          });

          return { title, author, ogImage, videos, audios, images };
        } catch (e) {
          return { error: e.message };
        }
      })()
    `)

    const resources = []
    const seenUrls = new Set()
    const headers = {
      Referer: url,
      'User-Agent': webContents.getUserAgent()
    }

    // 1. 优先加入网络层嗅探到的请求
    for (let i = 0; i < sniffed.length; i++) {
      const item = sniffed[i]
      if (seenUrls.has(item.url)) continue
      seenUrls.add(item.url)

      resources.push({
        id: `sniff-${i}`,
        category: item.category || 'video',
        title: `${domData.title || '嗅探媒体'} #${i + 1}`,
        quality: item.contentType || '网络媒体流',
        format: item.format || 'mp4',
        url: item.url,
        headers,
        size: item.contentLength ? `${(item.contentLength / 1024 / 1024).toFixed(1)} MB` : '流媒体'
      })
    }

    // 2. 加入 DOM 内发现的视频
    ;(domData.videos || []).forEach((vUrl, i) => {
      if (seenUrls.has(vUrl)) return
      seenUrls.add(vUrl)
      resources.push({
        id: `dom-v-${i}`,
        category: 'video',
        title: `${domData.title} - 网页视频`,
        quality: 'DOM 媒体源',
        format: vUrl.includes('.webm') ? 'webm' : 'mp4',
        url: vUrl,
        headers,
        size: '直链视频'
      })
    })

    // 3. 加入 DOM 内发现的音频
    ;(domData.audios || []).forEach((aUrl, i) => {
      if (seenUrls.has(aUrl)) return
      seenUrls.add(aUrl)
      resources.push({
        id: `dom-a-${i}`,
        category: 'audio',
        title: `${domData.title} - 音频`,
        quality: '网页原声',
        format: 'mp3',
        url: aUrl,
        headers,
        size: '音频'
      })
    })

    // 4. 加入发现的大图或 OG 封面
    if (domData.ogImage && !seenUrls.has(domData.ogImage)) {
      seenUrls.add(domData.ogImage)
      resources.push({
        id: 'dom-og-image',
        category: 'image',
        title: `${domData.title} - 封面图`,
        quality: '网页封面',
        format: 'jpg',
        url: domData.ogImage,
        headers,
        size: '封面'
      })
    }

    ;(domData.images || []).slice(0, 15).forEach((img, i) => {
      if (seenUrls.has(img.url)) return
      seenUrls.add(img.url)
      resources.push({
        id: `dom-img-${i}`,
        category: 'image',
        title: `${domData.title} - 图片 ${i + 1}`,
        quality: `${img.width}×${img.height}`,
        format: 'jpg',
        url: img.url,
        headers,
        size: '图片'
      })
    })

    return {
      adapterId: this.id,
      adapterName: this.name,
      title: domData.title,
      author: domData.author,
      coverUrl: domData.ogImage || domData.images?.[0]?.url || '',
      resources
    }
  }
}

module.exports = {
  GenericAdapter
}
