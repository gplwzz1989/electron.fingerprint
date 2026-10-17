const { BaseAdapter } = require('../types')

class DouyinAdapter extends BaseAdapter {
  constructor () {
    super()
    this.id = 'douyin'
    this.name = '抖音 (Douyin)'
  }

  match (url) {
    return /^https?:\/\/(www\.)?douyin\.com/i.test(url)
  }

  async extract ({ webContents, url }) {
    if (!webContents || webContents.isDestroyed()) {
      throw new Error('页面已关闭，无法提取。')
    }

    const data = await webContents.executeJavaScript(`
      (() => {
        try {
          const title = document.querySelector('[data-e2e="video-desc"]')?.innerText?.trim() ||
                        document.title.replace(/- 抖音.*/, '').trim() || '抖音作品';
          const author = document.querySelector('[data-e2e="user-info"] a')?.innerText?.trim() ||
                         document.querySelector('.author-name')?.innerText?.trim() || '抖音创作者';
          
          // 查找视频元素
          const videos = [];
          document.querySelectorAll('video').forEach((v, index) => {
            const src = v.currentSrc || v.src || v.querySelector('source')?.src;
            if (src && !src.startsWith('blob:')) {
              videos.push(src);
            }
          });

          // 查找图集元素
          const images = [];
          document.querySelectorAll('img').forEach(img => {
            const src = img.currentSrc || img.src;
            // 过滤小头像和图标
            if (src && img.naturalWidth > 300 && img.naturalHeight > 300) {
              images.push({
                url: src,
                width: img.naturalWidth,
                height: img.naturalHeight
              });
            }
          });

          return { title, author, videos, images };
        } catch (e) {
          return { error: e.message };
        }
      })()
    `)

    if (!data || data.error) {
      throw new Error('提取抖音页面信息失败。')
    }

    const resources = []
    const headers = {
      Referer: 'https://www.douyin.com/',
      'User-Agent': webContents.getUserAgent()
    }

    // 1. 处理视频资源（尝试无水印替换）
    const seenVideos = new Set()
    for (let i = 0; i < (data.videos || []).length; i++) {
      let rawUrl = data.videos[i]
      if (rawUrl.startsWith('//')) rawUrl = `https:${rawUrl}`
      // 常见无水印替换逻辑：将 playwm 替换为 play
      const cleanUrl = rawUrl.replace('/playwm/', '/play/')
      if (seenVideos.has(cleanUrl)) continue
      seenVideos.add(cleanUrl)

      resources.push({
        id: `dy-v-${i}`,
        category: 'video',
        title: `${data.title} - 原画无水印`,
        quality: '原画质 MP4',
        format: 'mp4',
        url: cleanUrl,
        headers,
        size: '高清视频'
      })
    }

    // 2. 处理图集资源
    const seenImgs = new Set()
    for (let i = 0; i < (data.images || []).length; i++) {
      const img = data.images[i]
      let imgUrl = img.url
      if (imgUrl.startsWith('//')) imgUrl = `https:${imgUrl}`
      if (seenImgs.has(imgUrl)) continue
      seenImgs.add(imgUrl)

      resources.push({
        id: `dy-img-${i}`,
        category: 'image',
        title: `${data.title} - 照片 ${i + 1}`,
        quality: `${img.width}×${img.height}`,
        format: 'jpg',
        url: imgUrl,
        headers,
        size: '超清原图'
      })
    }

    return {
      adapterId: this.id,
      adapterName: this.name,
      title: data.title,
      author: data.author,
      coverUrl: data.images?.[0]?.url || '',
      resources
    }
  }
}

module.exports = {
  DouyinAdapter
}
