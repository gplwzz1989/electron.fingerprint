const { BaseAdapter } = require('../types')

class XiaohongshuAdapter extends BaseAdapter {
  constructor () {
    super()
    this.id = 'xiaohongshu'
    this.name = '小红书 (Xiaohongshu)'
  }

  match (url) {
    return /^https?:\/\/(www\.)?(xiaohongshu\.com|xhslink\.com)/i.test(url)
  }

  async extract ({ webContents, url }) {
    if (!webContents || webContents.isDestroyed()) {
      throw new Error('页面已关闭，无法提取。')
    }

    const data = await webContents.executeJavaScript(`
      (() => {
        try {
          const title = document.querySelector('#detail-title')?.innerText?.trim() ||
                        document.querySelector('.title')?.innerText?.trim() ||
                        document.title.replace(/- 小红书.*/, '').trim() || '小红书笔记';
          const author = document.querySelector('.author-container .name')?.innerText?.trim() ||
                         document.querySelector('.username')?.innerText?.trim() || '小红书博主';

          // 视频检测
          const videos = [];
          document.querySelectorAll('video').forEach(v => {
            const src = v.currentSrc || v.src || v.querySelector('source')?.src;
            if (src && !src.startsWith('blob:')) videos.push(src);
          });

          // 轮播图/大图检测
          const images = [];
          document.querySelectorAll('.media-container img, .swiper-slide img, .note-content img').forEach(img => {
            const src = img.currentSrc || img.src;
            if (src) {
              images.push({
                url: src,
                width: img.naturalWidth || 1080,
                height: img.naturalHeight || 1440
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
      throw new Error('提取小红书内容失败。')
    }

    const resources = []
    const headers = {
      Referer: 'https://www.xiaohongshu.com/',
      'User-Agent': webContents.getUserAgent()
    }

    // 1. 视频提取
    (data.videos || []).forEach((vUrl, idx) => {
      resources.push({
        id: `xhs-v-${idx}`,
        category: 'video',
        title: `${data.title} - 视频`,
        quality: '高清视频',
        format: 'mp4',
        url: vUrl,
        headers,
        size: '原画 MP4'
      })
    })

    // 2. 超清无水印图集提取
    const seenImgs = new Set()
    ;(data.images || []).forEach((img, idx) => {
      // 去除小红书缩略图参数，还原超清原图
      let cleanUrl = img.url.replace(/\?imageMogr2\/.*$/, '')
      if (seenImgs.has(cleanUrl)) return
      seenImgs.add(cleanUrl)

      resources.push({
        id: `xhs-img-${idx}`,
        category: 'image',
        title: `${data.title} - 图片 ${idx + 1}`,
        quality: `${img.width}×${img.height}`,
        format: 'jpg',
        url: cleanUrl,
        headers,
        size: '无水印原图'
      })
    })

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
  XiaohongshuAdapter
}
