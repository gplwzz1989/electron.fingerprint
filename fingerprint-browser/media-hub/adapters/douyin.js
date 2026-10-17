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
          const targetVid = urlObj.searchParams.get('vid') || 
                            urlObj.searchParams.get('modal_id') ||
                            (location.pathname.match(/\\/video\\/(\\d+)/) || [])[1];

          let awemeItem = null;

          // 1. 若 URL 中指定了目标视频 vid，优先从对应作品卡片的 React Fiber 中读取 itemInfo
          if (targetVid) {
            const cardLink = document.querySelector(\`a[href*="\${targetVid}"]\`);
            if (cardLink) {
              const target = cardLink.closest('li') || cardLink;
              const fiberKey = Object.keys(target || {}).find(k => k.startsWith('__reactFiber'));
              let fiber = target ? target[fiberKey] : null;
              let depth = 0;
              while (fiber && depth < 8) {
                if (fiber.memoizedProps?.itemInfo) {
                  awemeItem = fiber.memoizedProps.itemInfo;
                  break;
                }
                fiber = fiber.return;
                depth++;
              }
            }
          }

          // 2. 尝试从播放器组件（弹窗播放器或页面主播放器）提取当前播放的作品 slideData
          if (!awemeItem) {
            const video = document.querySelector('video');
            const playerEl = document.querySelector('.xgplayer') || video?.parentElement;
            const fiberKey = Object.keys(playerEl || {}).find(k => k.startsWith('__reactFiber'));
            let fiber = playerEl ? playerEl[fiberKey] : null;
            let depth = 0;
            while (fiber && depth < 15) {
              if (fiber.memoizedProps?.slideData) {
                awemeItem = fiber.memoizedProps.slideData;
                break;
              }
              fiber = fiber.return;
              depth++;
            }
          }

          // 3. 兜底尝试：从列表第一个卡片提取
          if (!awemeItem) {
            const firstCard = document.querySelector('a[href*="/video/"]');
            if (firstCard) {
              const target = firstCard.closest('li') || firstCard;
              const fiberKey = Object.keys(target || {}).find(k => k.startsWith('__reactFiber'));
              let fiber = target ? target[fiberKey] : null;
              let depth = 0;
              while (fiber && depth < 8) {
                if (fiber.memoizedProps?.itemInfo) {
                  awemeItem = fiber.memoizedProps.itemInfo;
                  break;
                }
                fiber = fiber.return;
                depth++;
              }
            }
          }

          // 提取文本与元数据（杜绝 Layout Reflow，仅读取文本与属性）
          const title = (awemeItem?.desc || awemeItem?.itemTitle || '').trim() ||
                        document.querySelector('[data-e2e="video-desc"]')?.innerText?.trim() ||
                        document.title.replace(/- 抖音.*/, '').trim() || '抖音作品';
          const author = (awemeItem?.authorInfo?.nickname || awemeItem?.author?.nickname || '').trim() ||
                         document.querySelector('[data-e2e="user-info"] a')?.innerText?.trim() ||
                         document.querySelector('.author-name')?.innerText?.trim() || '抖音创作者';
          const vid = awemeItem?.awemeId || awemeItem?.aweme_id || targetVid || '';

          const videoStreams = [];
          const seenUrls = new Set();

          function addVideo(streamUrl, quality, sizeBytes, format = 'mp4') {
            if (!streamUrl) return;
            if (streamUrl.startsWith('//')) streamUrl = 'https:' + streamUrl;
            streamUrl = streamUrl.replace('/playwm/', '/play/');
            if (seenUrls.has(streamUrl)) return;
            seenUrls.add(streamUrl);

            let sizeStr = '高清视频';
            if (sizeBytes > 0) {
              sizeStr = (sizeBytes / (1024 * 1024)).toFixed(1) + ' MB';
            }

            videoStreams.push({
              url: streamUrl,
              quality,
              size: sizeStr,
              format
            });
          }

          let coverUrl = '';
          let audioUrl = '';
          let audioTitle = '';
          const imageList = [];

          if (awemeItem) {
            const videoObj = awemeItem.video || {};
            const bitRates = videoObj.bitRateList || videoObj.bit_rate || [];

            // 遍历各个清晰度档位
            for (const b of bitRates) {
              const qName = b.gear_name || b.gearName || (b.height ? \`\${b.height}p\` : '高清');
              const label = \`\${qName} (\${b.width || 0}×\${b.height || 0})\`.replace('normal_', '').replace('low_', '流畅_');
              const size = b.dataSize || b.size || 0;
              const isDash = b.format === 'dash';

              const playList = Array.isArray(b.playAddr) ? b.playAddr : (b.playAddr?.urlList || b.play_addr?.url_list || []);
              for (const item of playList) {
                const u = typeof item === 'string' ? item : item?.src || item?.url;
                if (u) addVideo(u, label, size, isDash ? 'dash' : 'mp4');
              }

              if (b.playApi) {
                addVideo(b.playApi, \`\${label} (直链接口)\`, size, 'mp4');
              }
            }

            // 官方 PlayApi
            if (videoObj.playApi) {
              addVideo(videoObj.playApi, '官方原画 (PlayApi)', videoObj.dataSize || 0, 'mp4');
            }

            // 提取封面
            coverUrl = (videoObj.originCoverUrlList || videoObj.coverUrlList || [])[0] ||
                       videoObj.cover?.urlList?.[0] || videoObj.cover?.url_list?.[0] || '';

            // 提取背景原声音频
            const music = awemeItem.music;
            audioUrl = music?.playUrl?.urlList?.[0] || music?.play_url?.url_list?.[0] || '';
            if (audioUrl) {
              audioTitle = music?.title ? \`\${music.title} - \${music.author || author}\` : \`\${title} - 原声\`;
            }

            // 提取图集作品的超清原图
            const rawImages = awemeItem.images || awemeItem.imageInfos || [];
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
          }

          // 4. 兜底提取：若未找到 React 数据，检查 DOM 中的非 blob video 标签
          if (videoStreams.length === 0) {
            document.querySelectorAll('video').forEach(v => {
              const src = v.currentSrc || v.src || v.querySelector('source')?.src;
              if (src && !src.startsWith('blob:')) {
                addVideo(src, '页面视频', 0, 'mp4');
              }
            });
          }

          // 封面降级处理（仅读取已定位卡片上的封面图片，杜绝全页面遍历与 Reflow）
          if (!coverUrl && targetVid) {
            const cardImg = document.querySelector(\`a[href*="\${targetVid}"] img\`);
            if (cardImg && cardImg.src) coverUrl = cardImg.src;
          }

          return {
            success: true,
            vid,
            title,
            author,
            coverUrl,
            audioUrl,
            audioTitle,
            videoStreams,
            imageList
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

    // 1. 加入解析出的视频流（按清晰度排序，优先高分辨率）
    for (let i = 0; i < (data.videoStreams || []).length; i++) {
      const v = data.videoStreams[i]
      const cleanUrl = (v.url || '').replace('/playwm/', '/play/')
      if (seenUrls.has(cleanUrl)) continue
      seenUrls.add(cleanUrl)

      resources.push({
        id: `dy-v-${i}`,
        category: 'video',
        title: `${data.title} - ${v.quality}`,
        quality: v.quality,
        format: v.format,
        url: cleanUrl,
        headers,
        size: v.size
      })
    }

    // 2. 网络层嗅探结果融合兜底（若嗅探到 douyinvod / aweme 视频，补充进候选）
    for (let i = 0; i < sniffed.length; i++) {
      const item = sniffed[i]
      if (seenUrls.has(item.url)) continue

      if (item.category === 'video' || /douyinvod|aweme\/v1\/play|mime_type=video_mp4/i.test(item.url)) {
        seenUrls.add(item.url)
        resources.push({
          id: `dy-sniff-v-${i}`,
          category: 'video',
          title: `${data.title} - 播放捕获流 #${i + 1}`,
          quality: '网络捕获 MP4',
          format: item.format || 'mp4',
          url: item.url.replace('/playwm/', '/play/'),
          headers,
          size: item.contentLength ? `${(item.contentLength / 1024 / 1024).toFixed(1)} MB` : '原画质'
        })
      }
    }

    // 3. 加入背景原声音频
    if (data.audioUrl && !seenUrls.has(data.audioUrl)) {
      seenUrls.add(data.audioUrl)
      resources.push({
        id: 'dy-audio',
        category: 'audio',
        title: data.audioTitle || `${data.title} - 背景音乐`,
        quality: '原声无损音频',
        format: 'mp3',
        url: data.audioUrl,
        headers,
        size: '音频'
      })
    }

    // 4. 加入嗅探到的音频
    for (let i = 0; i < sniffed.length; i++) {
      const item = sniffed[i]
      if (item.category === 'audio' && !seenUrls.has(item.url)) {
        seenUrls.add(item.url)
        resources.push({
          id: `dy-sniff-a-${i}`,
          category: 'audio',
          title: `${data.title} - 嗅探音频`,
          quality: '网页原声',
          format: item.format || 'mp3',
          url: item.url,
          headers,
          size: item.contentLength ? `${(item.contentLength / 1024 / 1024).toFixed(1)} MB` : '音频'
        })
      }
    }

    // 5. 加入超清原图/图集图片
    for (let i = 0; i < (data.imageList || []).length; i++) {
      const img = data.imageList[i]
      if (seenUrls.has(img.url)) continue
      seenUrls.add(img.url)

      resources.push({
        id: `dy-img-${i}`,
        category: 'image',
        title: `${data.title} - 照片 ${i + 1}`,
        quality: `${img.width}×${img.height}`,
        format: 'jpg',
        url: img.url,
        headers,
        size: '超清原图'
      })
    }

    // 6. 如果是普通视频，加入封面作为单独图片资源
    if (data.coverUrl && !seenUrls.has(data.coverUrl)) {
      seenUrls.add(data.coverUrl)
      resources.push({
        id: 'dy-cover',
        category: 'image',
        title: `${data.title} - 视频高清封面`,
        quality: '超清封面',
        format: 'jpg',
        url: data.coverUrl,
        headers,
        size: '封面'
      })
    }

    return {
      adapterId: this.id,
      adapterName: this.name,
      title: data.title,
      author: data.author,
      coverUrl: data.coverUrl,
      resources
    }
  }
}

module.exports = {
  DouyinAdapter
}
