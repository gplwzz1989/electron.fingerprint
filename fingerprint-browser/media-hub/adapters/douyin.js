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

  async extract ({ webContents, url, sniffed = [] }) {
    if (!webContents || webContents.isDestroyed()) {
      throw new Error('页面已关闭，无法提取。')
    }

    const data = await webContents.executeJavaScript(`
      (() => {
        try {
          const currentUrl = location.href;
          const urlObj = new URL(currentUrl);
          const isUserHome = location.pathname.startsWith('/user/');
          const targetVid = urlObj.searchParams.get('vid') || 
                            urlObj.searchParams.get('modal_id') ||
                            (location.pathname.match(/\\/video\\/(\\d+)/) || [])[1];

          // 辅助解析单个作品的音视频、码率与封面
          function parseAwemeItem(item, fallbackEl = null) {
            if (!item && !fallbackEl) return null;
            const vid = item?.awemeId || item?.aweme_id || (fallbackEl?.getAttribute('href')?.match(/\\/video\\/(\\d+)/) || [])[1];
            if (!vid) return null;

            const title = (item?.desc || item?.itemTitle || fallbackEl?.innerText || '').trim() || '抖音作品';
            const author = (item?.authorInfo?.nickname || item?.author?.nickname || '').trim() || '抖音创作者';
            const videoObj = item?.video || {};
            const bitRates = videoObj.bitRateList || videoObj.bit_rate || [];

            let bestStream = null;
            const allStreams = [];

            for (const b of bitRates) {
              const playList = Array.isArray(b.playAddr) ? b.playAddr : (b.playAddr?.urlList || b.play_addr?.url_list || []);
              let streamUrl = typeof playList[0] === 'string' ? playList[0] : playList[0]?.src || playList[0]?.url || b.playApi;
              if (!streamUrl) continue;
              if (streamUrl.startsWith('//')) streamUrl = 'https:' + streamUrl;
              streamUrl = streamUrl.replace('/playwm/', '/play/');

              const isDash = b.format === 'dash' || streamUrl.includes('/media-video-');
              const width = b.width || 0;
              const height = b.height || 0;
              const sizeBytes = b.dataSize || b.size || 0;
              const qName = b.gear_name || b.gearName || (height ? \`\${height}p\` : '高清');
              const label = \`\${qName} (\${width}×\${height})\`.replace('normal_', '').replace('low_', '流畅_');

              let sizeStr = '高清视频';
              if (sizeBytes > 0) {
                sizeStr = (sizeBytes / (1024 * 1024)).toFixed(1) + ' MB';
              }

              const streamInfo = { url: streamUrl, label, width, height, sizeBytes, sizeStr, format: isDash ? 'dash' : 'mp4' };
              allStreams.push(streamInfo);

              if (!bestStream) {
                bestStream = streamInfo;
              } else {
                // 优先非 DASH MP4，再按分辨率择优
                if (!isDash && bestStream.isDash) {
                  bestStream = streamInfo;
                } else if ((!isDash || bestStream.isDash) && (width * height > bestStream.width * bestStream.height)) {
                  bestStream = streamInfo;
                }
              }
            }

            // 兜底官方 PlayApi
            if (!bestStream && videoObj.playApi) {
              let pUrl = videoObj.playApi;
              if (pUrl.startsWith('//')) pUrl = 'https:' + pUrl;
              pUrl = pUrl.replace('/playwm/', '/play/');
              const sizeBytes = videoObj.dataSize || 0;
              bestStream = {
                url: pUrl,
                label: '官方原画 (PlayApi)',
                width: videoObj.width || 0,
                height: videoObj.height || 0,
                sizeBytes,
                sizeStr: sizeBytes > 0 ? (sizeBytes / 1024 / 1024).toFixed(1) + ' MB' : '原画质',
                format: 'mp4'
              };
              allStreams.push(bestStream);
            }

            // 提取封面
            const cover = (videoObj.originCoverUrlList || videoObj.coverUrlList || [])[0] ||
                          videoObj.cover?.urlList?.[0] || videoObj.cover?.url_list?.[0] ||
                          fallbackEl?.querySelector('img')?.src || '';

            // 提取背景原声
            const music = item?.music;
            const audioUrl = music?.playUrl?.urlList?.[0] || music?.play_url?.url_list?.[0] || '';
            const audioTitle = music?.title ? \`\${music.title} - \${music.author || author}\` : \`\${title} - 原声\`;

            // 提取图集作品的超清原图
            const imageList = [];
            const rawImages = item?.images || item?.imageInfos || [];
            for (let i = 0; i < rawImages.length; i++) {
              const img = rawImages[i];
              const u = (img.urlList || img.url_list || [])[0] || img.url;
              if (u) {
                imageList.push({
                  url: u.startsWith('//') ? 'https:' + u : u,
                  width: img.width || 1080,
                  height: img.height || 1920
                });
              }
            }

            return {
              vid,
              title,
              author,
              cover,
              audioUrl,
              audioTitle,
              bestStream,
              allStreams,
              imageList
            };
          }

          const works = [];
          const seenVids = new Set();

          // 1. 尝试从当前播放器（弹窗播放器或信息流主播放器）读取 slideData
          const video = document.querySelector('video');
          const playerEl = document.querySelector('.xgplayer') || video?.parentElement;
          const fiberKey = Object.keys(playerEl || {}).find(k => k.startsWith('__reactFiber'));
          let slideData = null;
          if (fiberKey) {
            let f = playerEl[fiberKey];
            let d = 0;
            while (f && d < 15) {
              if (f.memoizedProps?.slideData) {
                slideData = f.memoizedProps.slideData;
                break;
              }
              f = f.return;
              d++;
            }
          }

          if (slideData) {
            const currentWork = parseAwemeItem(slideData);
            if (currentWork) {
              seenVids.add(currentWork.vid);
              currentWork.isCurrentPlaying = true;
              if (currentWork.vid === targetVid) currentWork.isTarget = true;
              works.push(currentWork);
            }
          }

          // 2. 遍历页面中的所有视频卡片
          const cards = Array.from(document.querySelectorAll('a[href*="/video/"]'));
          for (const a of cards) {
            const href = a.getAttribute('href') || '';
            const vidMatch = href.match(/\\/video\\/(\\d+)/);
            const vid = vidMatch ? vidMatch[1] : null;
            if (!vid || seenVids.has(vid)) continue;
            seenVids.add(vid);

            const target = a.closest('li') || a;
            const targetFiberKey = Object.keys(target || {}).find(k => k.startsWith('__reactFiber'));
            let fiber = target ? target[targetFiberKey] : null;
            let itemInfo = null;
            let depth = 0;
            while (fiber && depth < 8) {
              if (fiber.memoizedProps?.itemInfo) {
                itemInfo = fiber.memoizedProps.itemInfo;
                break;
              }
              fiber = fiber.return;
              depth++;
            }

            const w = parseAwemeItem(itemInfo, a);
            if (w) {
              if (w.vid === targetVid) w.isTarget = true;
              works.push(w);
            }
          }

          // 3. 兜底：若未发现卡片且未发现 slideData，检查非 blob 的 video 标签
          let fallbackStreams = [];
          if (works.length === 0) {
            document.querySelectorAll('video').forEach((v, idx) => {
              const src = v.currentSrc || v.src || v.querySelector('source')?.src;
              if (src && !src.startsWith('blob:')) {
                fallbackStreams.push({
                  url: src,
                  label: '页面视频',
                  sizeStr: '未知大小',
                  format: 'mp4'
                });
              }
            });
          }

          // 排序：若指定了 vid 则置顶，其次是当前播放的作品，其余按原序
          works.sort((a, b) => {
            if (a.isTarget && !b.isTarget) return -1;
            if (!a.isTarget && b.isTarget) return 1;
            if (a.isCurrentPlaying && !b.isCurrentPlaying) return -1;
            if (!a.isCurrentPlaying && b.isCurrentPlaying) return 1;
            return 0;
          });

          const pageTitle = document.title.replace(/- 抖音.*/, '').trim() || '抖音';
          const authorHeader = document.querySelector('[data-e2e="user-info"] a')?.innerText?.trim() ||
                               document.querySelector('.author-name')?.innerText?.trim() ||
                               works[0]?.author || '抖音创作者';

          return {
            success: true,
            isUserHome,
            targetVid,
            pageTitle,
            authorHeader,
            works,
            fallbackStreams
          };
        } catch (e) {
          return { error: e.message };
        }
      })()
    `)

    if (!data || data.error) {
      throw new Error(`提取抖音页面信息失败: ${data?.error || '未知原因'}`)
    }

    const resources = []
    const seenUrls = new Set()
    const headers = {
      Referer: 'https://www.douyin.com/',
      'User-Agent': webContents.getUserAgent()
    }

    const works = data.works || []
    const isSingleVideoPage = !data.isUserHome && works.length <= 1

    // 模式 A：如果是单视频详情页，为该视频展示全部清晰度
    if (isSingleVideoPage && works.length === 1) {
      const w = works[0]
      for (let i = 0; i < (w.allStreams || []).length; i++) {
        const s = w.allStreams[i]
        const cleanUrl = (s.url || '').replace('/playwm/', '/play/')
        if (seenUrls.has(cleanUrl)) continue
        seenUrls.add(cleanUrl)

        resources.push({
          id: `dy-v-${i}`,
          category: 'video',
          title: `${w.title} - ${s.label}`,
          quality: s.label,
          format: s.format || 'mp4',
          url: cleanUrl,
          headers,
          size: s.sizeStr
        })
      }

      if (w.audioUrl && !seenUrls.has(w.audioUrl)) {
        seenUrls.add(w.audioUrl)
        resources.push({
          id: 'dy-audio',
          category: 'audio',
          title: w.audioTitle,
          quality: '原声无损音频',
          format: 'mp3',
          url: w.audioUrl,
          headers,
          size: '音频'
        })
      }

      if (w.cover && !seenUrls.has(w.cover)) {
        seenUrls.add(w.cover)
        resources.push({
          id: 'dy-cover',
          category: 'image',
          title: `${w.title} - 高清封面`,
          quality: '超清封面',
          format: 'jpg',
          url: w.cover,
          headers,
          size: '封面'
        })
      }
    } else {
      // 模式 B：用户主页（或包含多个作品的列表）——每一个作品对应独立的一条最佳视频资源！
      for (let i = 0; i < works.length; i++) {
        const w = works[i]
        if (!w.bestStream || !w.bestStream.url) continue
        const cleanUrl = w.bestStream.url.replace('/playwm/', '/play/')
        if (seenUrls.has(cleanUrl)) continue
        seenUrls.add(cleanUrl)

        const isTargetPrefix = w.isTarget ? '【当前定位】' : ''
        resources.push({
          id: `dy-work-${w.vid}`,
          category: 'video',
          title: `${isTargetPrefix}${w.title}`,
          quality: `${w.bestStream.label} · ${w.author}`,
          format: w.bestStream.format || 'mp4',
          url: cleanUrl,
          headers,
          size: w.bestStream.sizeStr
        })
      }

      // 将每个作品的高清封面作为独立图片条目加入
      for (let i = 0; i < works.length; i++) {
        const w = works[i]
        if (!w.cover || seenUrls.has(w.cover)) continue
        seenUrls.add(w.cover)

        resources.push({
          id: `dy-cover-${w.vid}`,
          category: 'image',
          title: `${w.title} - 封面`,
          quality: '超清封面',
          format: 'jpg',
          url: w.cover,
          headers,
          size: '封面'
        })
      }

      // 将有原声背景音乐的作品加入音频列表
      for (let i = 0; i < works.length; i++) {
        const w = works[i]
        if (!w.audioUrl || seenUrls.has(w.audioUrl)) continue
        seenUrls.add(w.audioUrl)

        resources.push({
          id: `dy-audio-${w.vid}`,
          category: 'audio',
          title: w.audioTitle || `${w.title} - 背景原声`,
          quality: '原声无损音频',
          format: 'mp3',
          url: w.audioUrl,
          headers,
          size: '音频'
        })
      }
    }

    // 兜底：处理非 blob 的原生 video 标签
    for (let i = 0; i < (data.fallbackStreams || []).length; i++) {
      const s = data.fallbackStreams[i]
      if (seenUrls.has(s.url)) continue
      seenUrls.add(s.url)
      resources.push({
        id: `dy-fallback-v-${i}`,
        category: 'video',
        title: `${data.pageTitle} - 页面视频 #${i + 1}`,
        quality: s.label,
        format: s.format,
        url: s.url,
        headers,
        size: s.sizeStr
      })
    }

    // 网络层嗅探结果融合
    for (let i = 0; i < sniffed.length; i++) {
      const item = sniffed[i]
      if (seenUrls.has(item.url)) continue

      if (item.category === 'video' || /douyinvod|aweme\/v1\/play|mime_type=video_mp4/i.test(item.url)) {
        seenUrls.add(item.url)
        resources.push({
          id: `dy-sniff-v-${i}`,
          category: 'video',
          title: `${data.pageTitle} - 播放捕获流 #${i + 1}`,
          quality: '网络捕获 MP4',
          format: item.format || 'mp4',
          url: item.url.replace('/playwm/', '/play/'),
          headers,
          size: item.contentLength ? `${(item.contentLength / 1024 / 1024).toFixed(1)} MB` : '原画质'
        })
      }
    }

    const firstWork = works[0]
    return {
      adapterId: this.id,
      adapterName: this.name,
      title: data.isUserHome ? `${data.authorHeader} 的主页作品 (${works.length} 个作品)` : (firstWork?.title || data.pageTitle),
      author: data.authorHeader || firstWork?.author,
      coverUrl: firstWork?.cover || '',
      resources
    }
  }
}

module.exports = {
  DouyinAdapter
}
