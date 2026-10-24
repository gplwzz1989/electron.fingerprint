const test = require('node:test')
const assert = require('node:assert/strict')
const { AdapterRegistry } = require('../media-hub/adapter-registry')
const { BaseAdapter } = require('../media-hub/types')
const { MediaSniffer } = require('../media-hub/media-sniffer')
const { GenericAdapter } = require('../media-hub/adapters/generic')
const { BilibiliAdapter } = require('../media-hub/adapters/bilibili')
const { DouyinAdapter } = require('../media-hub/adapters/douyin')
const { XiaohongshuAdapter } = require('../media-hub/adapters/xiaohongshu')
const { TwitterAdapter } = require('../media-hub/adapters/twitter')

test('适配器注册中心：正确识别 Twitter/X、B站、抖音、小红书及通用兜底', () => {
  const registry = new AdapterRegistry()

  // 1. Twitter / X 匹配
  const xAdapter = registry.findAdapter('https://x.com/caobidi/status/2113888225513148808')
  assert.equal(xAdapter.id, 'twitter')
  const twitterAdapter = registry.findAdapter('https://twitter.com/caobidi/status/2113888225513148808')
  assert.equal(twitterAdapter.id, 'twitter')

  // 2. 哔哩哔哩匹配
  const biliAdapter = registry.findAdapter('https://www.bilibili.com/video/BV1G4411p7Z2')
  assert.equal(biliAdapter.id, 'bilibili')

  // 3. 抖音匹配
  const dyAdapter = registry.findAdapter('https://www.douyin.com/video/7382910492817294')
  assert.equal(dyAdapter.id, 'douyin')

  // 4. 小红书匹配
  const xhsAdapter = registry.findAdapter('https://www.xiaohongshu.com/explore/64a92c8100000000130283')
  assert.equal(xhsAdapter.id, 'xiaohongshu')

  // 5. 任意未知网站自动降级为通用兜底
  const genericAdapter = registry.findAdapter('https://example.com/some/article')
  assert.equal(genericAdapter.id, 'generic')
})

test('动态注册新适配器：可随时扩展新的目标网站', () => {
  const registry = new AdapterRegistry()

  class CustomVideoAdapter extends BaseAdapter {
    constructor () {
      super()
      this.id = 'my-custom-portal'
      this.name = '自定义视频门户'
    }
    match (url) {
      return /^https?:\/\/(www\.)?mycustomportal\.com/i.test(url)
    }
    async extract () {
      return { title: '测试', resources: [] }
    }
  }

  // 注册前命中通用
  assert.equal(registry.findAdapter('https://mycustomportal.com/watch?v=123').id, 'generic')

  // 动态注册新适配器
  registry.register(new CustomVideoAdapter())

  // 注册后命中自定义适配器
  assert.equal(registry.findAdapter('https://mycustomportal.com/watch?v=123').id, 'my-custom-portal')
})

test('网络层嗅探器 MediaSniffer：记录多媒体分类与事件派发', () => {
  const sniffer = new MediaSniffer()
  let changedCount = 0

  sniffer.on('change', ({ tabId, count }) => {
    assert.equal(tabId, 'tab-test-1')
    changedCount = count
  })

  // 记录视频
  sniffer.recordMedia('tab-test-1', {
    url: 'https://cdn.example.com/sample.mp4',
    category: 'video',
    format: 'mp4',
    contentLength: 10485760
  })
  assert.equal(changedCount, 1)

  // 记录音频
  sniffer.recordMedia('tab-test-1', {
    url: 'https://cdn.example.com/audio.mp3',
    category: 'audio',
    format: 'mp3',
    contentLength: 3145728
  })
  assert.equal(changedCount, 2)

  // 记录重复 URL 应当自动去重
  sniffer.recordMedia('tab-test-1', {
    url: 'https://cdn.example.com/sample.mp4',
    category: 'video'
  })
  assert.equal(changedCount, 2)

  const items = sniffer.getForTab('tab-test-1')
  assert.equal(items.length, 2)
  assert.equal(items[0].category, 'video')
  assert.equal(items[1].category, 'audio')

  // 清除标签数据
  sniffer.clearTab('tab-test-1')
  assert.equal(sniffer.getForTab('tab-test-1').length, 0)
  assert.equal(changedCount, 0)
})

test('通用适配器 GenericAdapter：正确聚合嗅探结果与多媒体归类', async () => {
  const adapter = new GenericAdapter()

  const mockWebContents = {
    isDestroyed: () => false,
    getUserAgent: () => 'Mozilla/5.0 Chrome/128.0',
    executeJavaScript: async () => ({
      title: '测试网页',
      author: '测试作者',
      ogImage: 'https://example.com/cover.png',
      videos: ['https://example.com/stream.mp4'],
      audios: ['https://example.com/bgm.mp3'],
      images: [{ url: 'https://example.com/photo1.jpg', width: 1080, height: 720 }]
    })
  }

  const sniffed = [
    { url: 'https://cdn.example.com/m3u8-playlist.m3u8', category: 'video', format: 'm3u8', contentLength: 0 }
  ]

  const result = await adapter.extract({
    webContents: mockWebContents,
    url: 'https://example.com/article',
    sniffed
  })

  assert.equal(result.adapterId, 'generic')
  assert.equal(result.title, '测试网页')
  assert.ok(result.resources.length >= 4)

  const categories = result.resources.map(r => r.category)
  assert.ok(categories.includes('video'), '应当包含视频')
  assert.ok(categories.includes('audio'), '应当包含音频')
  assert.ok(categories.includes('image'), '应当包含图片')
})

test('B站适配器 BilibiliAdapter：DASH流优先选取 H.264 编码并规避 PCDN 节点', async () => {
  const adapter = new BilibiliAdapter()

  const mockWebContents = {
    isDestroyed: () => false,
    getUserAgent: () => 'Mozilla/5.0 Chrome/138.0',
    executeJavaScript: async () => ({
      title: '测试B站视频',
      author: '测试UP主',
      cover: 'https://i0.hdslb.com/bfs/archive/sample.jpg',
      playInfo: {
        data: {
          dash: {
            video: [
              {
                id: 32,
                codecid: 12,
                codecs: 'hev1.1.6.L120.90',
                bandwidth: 70000,
                baseUrl: 'https://xy123.mcdn.bilivideo.cn:8082/video_hevc.m4s',
                backupUrl: ['https://upos-sz-mirrorcos.bilivideo.com/video_hevc.m4s']
              },
              {
                id: 32,
                codecid: 7,
                codecs: 'avc1.64001F',
                bandwidth: 68000,
                baseUrl: 'https://xy123.mcdn.bilivideo.cn:8082/video_avc.m4s',
                backupUrl: ['https://upos-sz-mirrorcos.bilivideo.com/video_avc.m4s']
              }
            ],
            audio: [
              {
                id: 30216,
                bandwidth: 64000,
                baseUrl: 'https://xy123.mcdn.bilivideo.cn:8082/audio_low.m4s',
                backupUrl: ['https://upos-sz-mirrorcos.bilivideo.com/audio_low.m4s']
              },
              {
                id: 30280,
                bandwidth: 128000,
                baseUrl: 'https://xy123.mcdn.bilivideo.cn:8082/audio_high.m4s',
                backupUrl: ['https://upos-sz-mirrorcos.bilivideo.com/audio_high.m4s']
              }
            ]
          }
        }
      }
    })
  }

  const result = await adapter.extract({
    webContents: mockWebContents,
    url: 'https://www.bilibili.com/video/BV1xx411c7mD'
  })

  assert.equal(result.adapterId, 'bilibili')
  assert.equal(result.title, '测试B站视频')

  // 1. 验证视频资源优先选择了 H.264
  const videoResource = result.resources.find(r => r.category === 'video')
  assert.ok(videoResource, '应当提取到视频资源')
  assert.ok(videoResource.quality.includes('H.264'), '应当优先选用 H.264 编码')
  assert.ok(videoResource.url.includes('video_avc.m4s'), '视频地址应为 avc 流')
  assert.ok(!videoResource.url.includes('mcdn.bilivideo'), '视频地址应当剔除 PCDN 节点')
  assert.ok(videoResource.url.includes('upos-sz-mirrorcos'), '视频地址应选用官方直连 CDN')

  // 2. 验证视频资源附带最高音质的音频轨（audio_high）
  assert.ok(videoResource.audioUrl, '视频资源必须附带关联音频流')
  assert.ok(videoResource.audioUrl.includes('audio_high.m4s'), '音频流应选用最高带宽轨')
  assert.ok(!videoResource.audioUrl.includes('mcdn.bilivideo'), '音频地址应当剔除 PCDN 节点')

  // 3. 验证独立音频和封面图
  const audioResource = result.resources.find(r => r.category === 'audio')
  assert.ok(audioResource, '应当提取到独立原声音频')

  const imageResource = result.resources.find(r => r.category === 'image')
  assert.ok(imageResource, '应当提取到官方封面')
})

test('跨平台 FFmpeg 套件提供者 ffmpeg-provider：正确识别多平台架构与资源清单', () => {
  const { getPlatformInfo, findExistingFfmpeg } = require('../media-hub/ffmpeg-provider')

  // 1. Windows x64
  const win = getPlatformInfo('win32', 'x64')
  assert.equal(win.platformKey, 'win32-x64')
  assert.equal(win.binaryName, 'ffmpeg.exe')
  assert.equal(win.isWindows, true)
  assert.ok(win.urls.length > 0)

  // 2. macOS Apple Silicon (arm64)
  const macArm = getPlatformInfo('darwin', 'arm64')
  assert.equal(macArm.platformKey, 'darwin-arm64')
  assert.equal(macArm.binaryName, 'ffmpeg')
  assert.equal(macArm.isMac, true)
  assert.ok(macArm.urls.some(u => u.includes('darwin-arm64')))

  // 3. macOS Intel (x64)
  const macIntel = getPlatformInfo('darwin', 'x64')
  assert.equal(macIntel.platformKey, 'darwin-x64')
  assert.equal(macIntel.binaryName, 'ffmpeg')
  assert.equal(macIntel.isMac, true)
  assert.ok(macIntel.urls.some(u => u.includes('darwin-x64')))

  // 4. Linux x64
  const linux = getPlatformInfo('linux', 'x64')
  assert.equal(linux.platformKey, 'linux-x64')
  assert.equal(linux.binaryName, 'ffmpeg')
  assert.equal(linux.isLinux, true)
  assert.ok(linux.urls.some(u => u.includes('linux-x64')))

  // 5. 本地环境探测
  const localBinary = findExistingFfmpeg()
  assert.ok(typeof localBinary === 'string' || localBinary === null)
})

test('抖音适配器 DouyinAdapter：正确解析用户主页多个不同作品（不同标题、封面与视频直链）', async () => {
  const adapter = new DouyinAdapter()

  // 1. 验证网址匹配
  assert.ok(adapter.match('https://www.douyin.com/user/MS4wLjABAAAAXSF18NxD-pbJSd3569FiSsYN6VaduMumFLDP4WbX1uw?from_tab_name=main&vid=7692062238979879099'))
  assert.ok(adapter.match('https://www.douyin.com/video/7692062238979879099'))

  // 2. 模拟主页多作品数据
  const mockWebContents = {
    isDestroyed: () => false,
    getUserAgent: () => 'Mozilla/5.0 Chrome/138.0',
    executeJavaScript: async () => ({
      success: true,
      isUserHome: true,
      targetVid: '7692062238979879099',
      pageTitle: '抖动的蜗牛的抖音',
      authorHeader: '抖动的蜗牛',
      works: [
        {
          vid: '7692062238979879099',
          isTarget: true,
          title: '票房80亿！欧洲动荡！战争阴影席卷全球！',
          author: '抖动的蜗牛',
          cover: 'https://p3.douyinpic.com/cover_target.jpeg',
          audioUrl: 'https://lf26.douyinstatic.com/audio_target.mp3',
          audioTitle: '目标作品原声',
          bestStream: {
            url: 'https://aweme.snssdk.com/aweme/v1/playwm/?video_id=v1e_target',
            label: '720p (1280×720)',
            sizeStr: '190.1 MB',
            format: 'mp4'
          }
        },
        {
          vid: '7465339276402625849',
          isTarget: false,
          title: '战争系列电影之狂暴巨兽分集一',
          author: '抖动的蜗牛',
          cover: 'https://p3.douyinpic.com/cover_second.jpeg',
          audioUrl: 'https://lf26.douyinstatic.com/audio_second.mp3',
          audioTitle: '第二作品原声',
          bestStream: {
            url: 'https://v11.douyinvod.com/stream_second.mp4',
            label: '720p (1694×720)',
            sizeStr: '143.8 MB',
            format: 'mp4'
          }
        },
        {
          vid: '7697301408933210873',
          isTarget: false,
          title: '2026必看科技电影解说',
          author: '抖动的蜗牛',
          cover: 'https://p3.douyinpic.com/cover_third.jpeg',
          bestStream: {
            url: 'https://v11.douyinvod.com/stream_third.mp4',
            label: '1080p (1920×1080)',
            sizeStr: '84.1 MB',
            format: 'mp4'
          }
        }
      ]
    })
  }

  const sniffed = [
    {
      url: 'https://v11-weba.douyinvod.com/sniffed_flow.mp4',
      category: 'video',
      format: 'mp4',
      contentLength: 57671680
    }
  ]

  const result = await adapter.extract({
    webContents: mockWebContents,
    url: 'https://www.douyin.com/user/MS4wLjABAAAAXSF18NxD-pbJSd3569FiSsYN6VaduMumFLDP4WbX1uw?from_tab_name=main&vid=7692062238979879099',
    sniffed
  })

  assert.equal(result.adapterId, 'douyin')
  assert.ok(result.title.includes('3 个作品'))
  assert.equal(result.author, '抖动的蜗牛')

  // 验证视频资源提取：解析出了主页下的不同作品
  const videos = result.resources.filter(r => r.category === 'video')
  assert.ok(videos.length >= 3, '应当解析出主页下的多个作品')

  // 验证第 1 个是目标置顶作品，且标题不同
  assert.ok(videos[0].title.includes('票房80亿！欧洲动荡！'))
  assert.ok(!videos[0].url.includes('/playwm/'), '水印应当清洗为play')

  // 验证第 2 个是不同的作品，且标题不同
  assert.ok(videos[1].title.includes('战争系列电影之狂暴巨兽'))
  assert.notEqual(videos[0].url, videos[1].url, '不同作品的视频URL应当不同')

  // 验证第 3 个是不同的作品
  assert.ok(videos[2].title.includes('2026必看科技电影解说'))
  assert.notEqual(videos[1].url, videos[2].url, '不同作品的视频URL应当不同')

  // 验证封面资源提取：不同作品有不同封面
  const images = result.resources.filter(r => r.category === 'image')
  assert.ok(images.length >= 3, '应当包含多个作品各自的封面')
  assert.notEqual(images[0].url, images[1].url, '各作品封面应当不同')

  // 验证音频资源提取
  const audios = result.resources.filter(r => r.category === 'audio')
  assert.ok(audios.length >= 2, '应当包含多个作品各自的原声背景音')
})

test('推特适配器 TwitterAdapter：精准解析推文标题、作者、高清原画直链与画质排序', async () => {
  const adapter = new TwitterAdapter()

  const mockWebContents = {
    isDestroyed: () => false,
    getUserAgent: () => 'Mozilla/5.0 Chrome/138.0',
    executeJavaScript: async () => ({
      title: '卧槽！！！现在的诈骗这么高级了吗，谁能告诉我付款时显示 付 1 元钱，为什么付完后变成 499 了，问题到底在哪里？',
      author: '操笔帝 (@caobidi)',
      cover: 'https://pbs.twimg.com/amplify_video_thumb/2113869996581584896/img/CHXKKBbsbgTu3SeH.jpg',
      variants: [
        {
          content_type: 'application/x-mpegURL',
          url: 'https://video.twimg.com/amplify_video/2113869996581584896/pl/yZwHlUpel-5HLaVM.m3u8?tag=29&v=cfc'
        },
        {
          bitrate: 632000,
          content_type: 'video/mp4',
          url: 'https://video.twimg.com/amplify_video/2113869996581584896/vid/avc1/320x568/65bDBO_zepDhagqs.mp4?tag=29'
        },
        {
          bitrate: 950000,
          content_type: 'video/mp4',
          url: 'https://video.twimg.com/amplify_video/2113869996581584896/vid/avc1/464x824/aUAk2gkSMfDDyzgx.mp4?tag=29'
        }
      ],
      images: [
        'https://pbs.twimg.com/media/G123456?format=jpg&name=medium'
      ]
    })
  }

  const result = await adapter.extract({
    webContents: mockWebContents,
    url: 'https://x.com/caobidi/status/2113888225513148808'
  })

  assert.equal(result.adapterId, 'twitter')
  assert.equal(result.author, '操笔帝 (@caobidi)')
  assert.ok(result.title.includes('现在的诈骗这么高级了吗'))

  const videoResources = result.resources.filter(r => r.category === 'video')
  assert.equal(videoResources.length, 3, '应当包含 2 个 MP4 清晰度与 1 个 HLS 流')

  // 验证画质排序：最高码率（950000）的 MP4 应当排在首位
  assert.equal(videoResources[0].format, 'mp4')
  assert.ok(videoResources[0].url.includes('464x824'))
  assert.ok(videoResources[0].quality.includes('464×824'))

  // 次高码率（632000）的 MP4 应当排第二位
  assert.equal(videoResources[1].format, 'mp4')
  assert.ok(videoResources[1].url.includes('320x568'))

  // 自适应流 M3U8 排最后
  assert.equal(videoResources[2].format, 'm3u8')
  assert.ok(videoResources[2].quality.includes('HLS'))

  // 验证图片资源：封面与配图已转换为 orig 超清原图
  const imgResources = result.resources.filter(r => r.category === 'image')
  assert.ok(imgResources.length >= 2)
  assert.ok(imgResources[1].url.includes('name=orig'), '推特图片应当自动替换为 orig 原图参数')
})

test('下载管理器 DownloadManager：对 m3u8 流媒体自动修正文件后缀为 mp4', () => {
  const { DownloadManager } = require('../media-hub/download-manager')
  const dm = new DownloadManager()

  // 模拟 startDownload 时对于 m3u8 资源的处理
  const task = dm.startDownload({
    resource: {
      category: 'video',
      format: 'm3u8',
      title: '测试推特视频',
      url: 'https://video.twimg.com/amplify_video/2113869996581584896/pl/yZwHlUpel-5HLaVM.m3u8?tag=29&v=cfc'
    }
  })

  // 任务取消避免发起实际网络请求
  dm.cancelTask(task.id)

  assert.equal(task.format, 'mp4', 'm3u8 视频流在下载任务中后缀应修正为 mp4 容器')
  assert.ok(task.filePath.endsWith('.mp4'), '目标文件保存路径必须是 .mp4 格式')
})



