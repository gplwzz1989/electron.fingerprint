const test = require('node:test')
const assert = require('node:assert/strict')
const { AdapterRegistry } = require('../media-hub/adapter-registry')
const { BaseAdapter } = require('../media-hub/types')
const { MediaSniffer } = require('../media-hub/media-sniffer')
const { GenericAdapter } = require('../media-hub/adapters/generic')
const { BilibiliAdapter } = require('../media-hub/adapters/bilibili')
const { DouyinAdapter } = require('../media-hub/adapters/douyin')
const { XiaohongshuAdapter } = require('../media-hub/adapters/xiaohongshu')

test('适配器注册中心：正确识别 B站、抖音、小红书及通用兜底', () => {
  const registry = new AdapterRegistry()

  // 1. 哔哩哔哩匹配
  const biliAdapter = registry.findAdapter('https://www.bilibili.com/video/BV1G4411p7Z2')
  assert.equal(biliAdapter.id, 'bilibili')

  // 2. 抖音匹配
  const dyAdapter = registry.findAdapter('https://www.douyin.com/video/7382910492817294')
  assert.equal(dyAdapter.id, 'douyin')

  // 3. 小红书匹配
  const xhsAdapter = registry.findAdapter('https://www.xiaohongshu.com/explore/64a92c8100000000130283')
  assert.equal(xhsAdapter.id, 'xiaohongshu')

  // 4. 任意未知网站自动降级为通用兜底
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

test('抖音适配器 DouyinAdapter：正确解析用户主页指定vid视频与高清无水印流', async () => {
  const adapter = new DouyinAdapter()

  // 1. 验证网址匹配
  assert.ok(adapter.match('https://www.douyin.com/user/MS4wLjABAAAAXSF18NxD-pbJSd3569FiSsYN6VaduMumFLDP4WbX1uw?from_tab_name=main&vid=7692062238979879099'))
  assert.ok(adapter.match('https://www.douyin.com/video/7692062238979879099'))

  // 2. 模拟 executeJavaScript 执行结果（包含无水印替换、各清晰度轨、原声背景音乐与封面）
  const mockWebContents = {
    isDestroyed: () => false,
    getUserAgent: () => 'Mozilla/5.0 Chrome/138.0',
    executeJavaScript: async () => ({
      success: true,
      vid: '7692062238979879099',
      title: '票房80亿！欧洲动荡！战争阴影席卷全球！',
      author: '抖动的蜗牛',
      coverUrl: 'https://p3-pc-sign.douyinpic.com/tos-cn-p-0015c000-ce/cover.jpeg',
      audioUrl: 'https://lf26-music-east.douyinstatic.com/obj/ies-music-hj/sample.mp3',
      audioTitle: '抖动的蜗牛原声',
      videoStreams: [
        {
          url: 'https://aweme.snssdk.com/aweme/v1/playwm/?video_id=v1e00fgi0000davqqbvog65tfh2vl3i0',
          quality: '720p (1280×720)',
          size: '55.0 MB',
          format: 'mp4'
        },
        {
          url: 'https://v26-web.douyinvod.com/stream/v1e00fgi0000davqqbvog65tfh2vl3i0.mp4',
          quality: '540p (1024×576)',
          size: '50.1 MB',
          format: 'mp4'
        }
      ],
      imageList: []
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
  assert.equal(result.title, '票房80亿！欧洲动荡！战争阴影席卷全球！')
  assert.equal(result.author, '抖动的蜗牛')

  // 验证视频资源提取
  const videos = result.resources.filter(r => r.category === 'video')
  assert.ok(videos.length >= 2, '应当包含多个清晰度视频')
  // 验证无水印去除（playwm -> play）
  assert.ok(!videos[0].url.includes('/playwm/'), '视频应当自动替换为无水印play直链')
  assert.ok(videos[0].url.includes('/play/'), '视频地址中应当包含无水印/play/标识')

  // 验证网络嗅探流融合
  const sniffedVideo = videos.find(v => v.id.includes('dy-sniff-v'))
  assert.ok(sniffedVideo, '应当成功融合底层嗅探到的媒体流')
  assert.equal(sniffedVideo.size, '55.0 MB')

  // 验证原声背景音乐提取
  const audio = result.resources.find(r => r.category === 'audio')
  assert.ok(audio, '应当成功提取独立原声背景音频')
  assert.equal(audio.format, 'mp3')

  // 验证独立封面提取
  const cover = result.resources.find(r => r.category === 'image')
  assert.ok(cover, '应当成功提取视频高清封面')
})

