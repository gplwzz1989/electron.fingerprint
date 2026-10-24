const { BaseAdapter } = require('../types')

/**
 * 格式化推特码率与分辨率文案
 */
function formatTwitterQuality (variant) {
  const url = variant.url || variant.src || ''
  const isM3u8 = variant.content_type?.includes('mpegURL') || variant.type?.includes('mpegURL') || url.includes('.m3u8')

  if (isM3u8) {
    return 'HLS 动态自适应流 (M3U8)'
  }

  const dimMatch = url.match(/\/(\d{3,4})x(\d{3,4})\//)
  const resStr = dimMatch ? `${dimMatch[1]}×${dimMatch[2]}` : ''
  const bitrate = variant.bitrate || 0

  let level = '标准画质'
  if (bitrate >= 1200000) level = '1080P / 超清原画'
  else if (bitrate >= 800000) level = '720P / 高清'
  else if (bitrate >= 500000) level = '480P / 清晰'
  else if (bitrate > 0) level = '360P / 流畅'

  const bitStr = bitrate > 0 ? `${(bitrate / 1000).toFixed(0)} Kbps` : ''
  const details = [resStr, bitStr].filter(Boolean).join(', ')
  return details ? `${level} (${details})` : level
}

class TwitterAdapter extends BaseAdapter {
  constructor () {
    super()
    this.id = 'twitter'
    this.name = 'X / Twitter (推特)'
  }

  match (url) {
    return /^https?:\/\/(www\.)?(twitter\.com|x\.com)/i.test(url)
  }

  /**
   * 提取 Twitter / X 上的视频与多媒体资源
   */
  async extract ({ webContents, url, session, sniffed = [] }) {
    if (!webContents || webContents.isDestroyed()) {
      throw new Error('页面已关闭，无法提取。')
    }

    const tweetIdMatch = (url || '').match(/(?:status|statuses)\/(\d+)/)
    const tweetId = tweetIdMatch ? tweetIdMatch[1] : null

    // 1. 在当前标签页 DOM 与内嵌脚本中提取 SSR 数据
    const pageData = await webContents.executeJavaScript(`
      (() => {
        try {
          // 提取标题与作者
          const ogDesc = document.querySelector('meta[property="og:description"]')?.content ||
                         document.querySelector('meta[name="description"]')?.content || '';
          const tweetTextEl = document.querySelector('article[data-testid="tweet"] [data-testid="tweetText"]');
          const tweetText = tweetTextEl ? tweetTextEl.innerText.trim() : '';
          const title = tweetText || ogDesc || document.title.replace(/\\s*\\/\\s*X$/, '').trim() || '推特视频';

          const authorEl = document.querySelector('article[data-testid="tweet"] [data-testid="User-Name"]') ||
                           document.querySelector('[data-testid="User-Name"]');
          const author = authorEl ? authorEl.innerText.split('\\n')[0].trim() :
                         document.querySelector('meta[property="og:title"]')?.content || '推特博主';

          // 提取封面
          let cover = document.querySelector('meta[property="og:image"]')?.content ||
                      document.querySelector('video')?.poster || '';

          // 尝试从内联 script 深度匹配 video_info variants
          const variants = [];
          const html = document.documentElement.innerHTML;
          const unescaped = html.replace(/\\\\"/g, '"').replace(/\\\\\\//g, '/');
          const vInfoRegex = /"variants"\\s*:\\s*(\\[[^\\]]+\\])/g;
          let match;
          while ((match = vInfoRegex.exec(unescaped)) !== null) {
            try {
              const list = JSON.parse(match[1]);
              if (Array.isArray(list)) {
                for (const item of list) {
                  if (item && item.url) variants.push(item);
                }
              }
            } catch (_) {}
          }

          // 提取页面中的大图
          const images = [];
          document.querySelectorAll('article[data-testid="tweet"] img[src*="pbs.twimg.com/media"], img[src*="pbs.twimg.com/media"]').forEach(img => {
            const src = img.currentSrc || img.src;
            if (src && !src.includes('profile_images') && !src.includes('emoji')) {
              images.push(src);
            }
          });

          return { title, author, cover, variants, images };
        } catch (e) {
          return { error: e.message };
        }
      })()
    `).catch(() => null)

    let title = pageData?.title || '推特媒体资源'
    let author = pageData?.author || '推特博主'
    let coverUrl = pageData?.cover || ''
    const rawVariants = [...(pageData?.variants || [])]
    const pageImages = [...(pageData?.images || [])]

    // 2. 若页面内嵌脚本未解析出视频，且存在 tweetId，通过官方免鉴权 Syndication 接口获取精准视频清单
    if (rawVariants.length === 0 && tweetId) {
      try {
        const syndicationUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=1`
        let response = null
        if (session?.net?.fetch) {
          response = await session.net.fetch(syndicationUrl, {
            headers: {
              'User-Agent': webContents.getUserAgent()
            }
          })
        } else {
          response = await fetch(syndicationUrl)
        }

        if (response && response.ok) {
          const tweetJson = await response.json()
          if (tweetJson.text && (!title || title === '推特视频' || title === '推特媒体资源')) {
            title = tweetJson.text.replace(/https:\/\/t\.co\/\S+/g, '').trim() || title
          }
          if (tweetJson.user?.name) {
            author = `${tweetJson.user.name} (@${tweetJson.user.screen_name})`
          }

          const mediaList = tweetJson.mediaDetails || (tweetJson.video ? [tweetJson.video] : [])
          for (const m of mediaList) {
            if (m.media_url_https && !coverUrl) {
              coverUrl = m.media_url_https
            }
            const vars = m.video_info?.variants || m.variants || []
            for (const v of vars) {
              if (v && (v.url || v.src)) {
                rawVariants.push({
                  url: v.url || v.src,
                  content_type: v.content_type || v.type || 'video/mp4',
                  bitrate: v.bitrate || 0
                })
              }
            }
          }
        }
      } catch (err) {
        console.warn('[Twitter Syndication 解析异常]', err.message)
      }
    }

    // 3. 聚合嗅探到的网络流（如果属于 video.twimg.com）
    for (const sniff of sniffed) {
      if (sniff.url && sniff.url.includes('video.twimg.com')) {
        const isM3u8 = sniff.url.includes('.m3u8')
        rawVariants.push({
          url: sniff.url,
          content_type: isM3u8 ? 'application/x-mpegURL' : 'video/mp4',
          bitrate: 0
        })
      }
    }

    // 4. 去重并对视频进行画质优先级排序
    const seenUrls = new Set()
    const uniqueVariants = []

    for (const v of rawVariants) {
      let vUrl = v.url || v.src
      if (!vUrl) continue
      if (vUrl.startsWith('//')) vUrl = `https:${vUrl}`
      if (seenUrls.has(vUrl)) continue
      seenUrls.add(vUrl)

      const isM3u8 = v.content_type?.includes('mpegURL') || vUrl.includes('.m3u8')
      uniqueVariants.push({
        url: vUrl,
        contentType: v.content_type || (isM3u8 ? 'application/x-mpegURL' : 'video/mp4'),
        bitrate: Number(v.bitrate) || 0,
        isM3u8
      })
    }

    // 排序策略：MP4 直链排在前（按码率高到低），自适应流 M3U8 排在后
    uniqueVariants.sort((a, b) => {
      if (!a.isM3u8 && b.isM3u8) return -1
      if (a.isM3u8 && !b.isM3u8) return 1
      return b.bitrate - a.bitrate
    })

    const resources = []
    const headers = {
      Referer: 'https://x.com/',
      'User-Agent': webContents.getUserAgent()
    }

    uniqueVariants.forEach((v, idx) => {
      const quality = formatTwitterQuality(v)
      const format = v.isM3u8 ? 'm3u8' : 'mp4'

      resources.push({
        id: `twitter-v-${idx}`,
        category: 'video',
        title: `${title} - ${v.isM3u8 ? 'HLS流' : `清晰度 ${idx + 1}`}`,
        quality,
        format,
        url: v.url,
        headers,
        size: v.bitrate > 0 ? `${(v.bitrate / 1000).toFixed(0)} kbps` : (v.isM3u8 ? '自适应流' : '直链视频')
      })
    })

    // 5. 提取封面及推文高分辨率大图
    if (coverUrl && !seenUrls.has(coverUrl)) {
      seenUrls.add(coverUrl)
      resources.push({
        id: 'twitter-cover',
        category: 'image',
        title: `${title} - 视频封面`,
        quality: '原画封面',
        format: 'jpg',
        url: coverUrl.replace(/name=\w+/, 'name=orig'),
        headers,
        size: '封面图'
      })
    }

    pageImages.forEach((imgUrl, idx) => {
      // 转换为原图画质参数 name=orig
      const origUrl = imgUrl.replace(/name=\w+/, 'name=orig')
      if (seenUrls.has(origUrl)) return
      seenUrls.add(origUrl)

      resources.push({
        id: `twitter-img-${idx}`,
        category: 'image',
        title: `${title} - 配图 ${idx + 1}`,
        quality: '推特原图',
        format: 'jpg',
        url: origUrl,
        headers,
        size: '高清原图'
      })
    })

    return {
      adapterId: this.id,
      adapterName: this.name,
      title,
      author,
      coverUrl: coverUrl || pageImages[0] || '',
      resources
    }
  }
}

module.exports = {
  TwitterAdapter,
  formatTwitterQuality
}
