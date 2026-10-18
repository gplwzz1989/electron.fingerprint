const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const fs = require('node:fs')
const os = require('node:os')

const { ArticleCreator } = require('../creator-hub/article-creator')
const { PostCreator } = require('../creator-hub/post-creator')
const { VideoCreator } = require('../creator-hub/video-creator')
const { AssetStore } = require('../creator-hub/asset-store')
const { PublisherAdapter } = require('../creator-hub/publisher-adapter')
const { DoocsParser } = require('../renderer/doocs-md/parser')
const { DOOCS_THEMES } = require('../renderer/doocs-md/themes')

test('文章创作引擎 ArticleCreator：爆款大纲与多平台差异化排版', async () => {
  const creator = new ArticleCreator()

  // 1. 小红书平台生成
  const xhsArticle = await creator.generateOutline({
    topic: '如何建立高效的个人第二大脑',
    keywords: 'PKM, Notion, 效率',
    platform: 'xiaohongshu',
    style: '干货'
  })

  assert.ok(xhsArticle.candidateTitles.length >= 3, '应生成至少3个心理学候选标题')
  assert.ok(xhsArticle.selectedTitle, '应有默认选中的标题')
  assert.ok(xhsArticle.content.includes('【核心要点') || xhsArticle.content.includes('干货'), '小红书排版应包含种草/干货特色结构')
  assert.ok(xhsArticle.tags.some(t => t.startsWith('#')), '应自动附带社交标签')

  // 2. 知乎平台生成
  const zhihuArticle = await creator.generateOutline({
    topic: '如何建立高效的个人第二大脑',
    platform: 'zhihu'
  })
  assert.ok(zhihuArticle.content.includes('谢邀') || zhihuArticle.content.includes('个人浅见'), '知乎排版应具备问答/深度特色')

  // 3. 微信公众号平台生成
  const wechatArticle = await creator.generateOutline({
    topic: '如何建立高效的个人第二大脑',
    platform: 'wechat'
  })
  assert.ok(wechatArticle.content.includes('01 ') || wechatArticle.content.includes('结语'), '公众号排版应具备长文小标题或结语结构')
})

test('文章创作引擎 ArticleCreator：微信公众号富文本排版组件库与图文混合环绕', () => {
  const tpls = ArticleCreator.getWechatTemplates()
  assert.ok(Array.isArray(tpls) && tpls.length >= 6, '应提供丰富的微信公众号排版模版组件')

  // 验证包含左侧和右侧图文混合环绕模版
  const wrapLeft = tpls.find(t => t.id === 'img-wrap-left')
  assert.ok(wrapLeft, '应提供图文混排左侧环绕模版')
  assert.ok(wrapLeft.html.includes('float: left'), '左环绕模版应具备 float: left 内联样式')
  assert.ok(wrapLeft.html.includes('<figure') && wrapLeft.html.includes('<figcaption'), '图文混排应具备标准语义化图注标签')

  const wrapRight = tpls.find(t => t.id === 'img-wrap-right')
  assert.ok(wrapRight, '应提供图文混排右侧环绕模版')
  assert.ok(wrapRight.html.includes('float: right'), '右环绕模版应具备 float: right 内联样式')

  // 验证标题与卡片模版均具备行内样式
  const h2Bar = tpls.find(t => t.id === 'h2-bar')
  assert.ok(h2Bar.html.includes('style='), '模版必须采用 Inline CSS 保证粘贴到微信后台 100% 保真')
})

test('文章创作引擎 ArticleCreator：平台风控敏感词自检与一键替换', () => {
  const creator = new ArticleCreator()

  // 测试文本包含广告法极限词（顶级、最好）、违规造富（暴富）、违规引流（微信）
  const riskyText = '这是顶级最好的自媒体课程，保证100%赚钱，想暴富的微信交流！'
  const result = creator.auditCompliance(riskyText)

  assert.equal(result.ok, false, '包含违禁词应判定不合规')
  assert.ok(result.score < 100, '合规得分应被扣减')
  assert.ok(result.hits.length >= 3, '应检出多个敏感词')

  // 验证敏感词包含替换建议
  const hit = result.hits.find(h => h.word === '微信')
  assert.ok(hit, '应识别微信导流词')
  assert.ok(hit.replace, '应给出安全替换建议')

  // 测试纯净内容
  const cleanResult = creator.auditCompliance('分享三个日常深度阅读的好习惯，希望对大家有所启发。')
  assert.equal(cleanResult.ok, true, '正常内容应判定合规')
  assert.equal(cleanResult.score, 100, '正常内容应为满分 100')
  assert.equal(cleanResult.hits.length, 0)
})

test('动态贴图创作引擎 PostCreator：生成配置与图片持久化', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'post-creator-test-'))
  const creator = new PostCreator(tmpDir)

  // 1. 生成金句卡配置
  const quotePost = creator.createPost({
    type: 'quote',
    text: '行动是打败焦虑的唯一良药。',
    author: '周禾',
    theme: 'gradient'
  })
  assert.equal(quotePost.template, 'quote')
  assert.equal(quotePost.bgTheme, 'dark') // 默认或透传配置
  assert.ok(quotePost.text.includes('行动是打败焦虑'))

  // 2. 生成表情包配置
  const memePost = creator.createPost({
    template: 'meme',
    text: '当我看到需求又改了的时候',
    subText: '内心毫无波澜甚至想笑'
  })
  assert.equal(memePost.template, 'meme')

  // 3. 保存 Base64 图片到本地
  const fakePngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  const saved = await creator.saveBase64Image(fakePngBase64, 'test-card')
  assert.ok(fs.existsSync(saved.filePath), '图片文件应成功落盘')
  assert.ok(saved.fileSize > 0, '图片文件应有实际字节大小')

  fs.rmSync(tmpDir, { recursive: true, force: true })
})

test('图文创作引擎 PostCreator：商业级多图图文笔记契约校验与多图持久化', async () => {
  // 1. 契约校验
  const invalidTitle = PostCreator.validatePostData({
    title: '',
    content: '测试正文',
    images: ['/path/to/img1.png']
  })
  assert.equal(invalidTitle.ok, false)
  assert.ok(invalidTitle.issues.some(i => i.includes('标题不能为空')))

  const noImage = PostCreator.validatePostData({
    title: '正常标题',
    content: '测试正文',
    images: []
  })
  assert.equal(noImage.ok, false)
  assert.ok(noImage.issues.some(i => i.includes('至少需要 1 张图片素材')))

  const validPost = PostCreator.validatePostData({
    title: '🔥 3招搞定职场沟通实操',
    content: '正文干货满满...',
    images: ['/path/to/cover.png', '/path/to/img2.png']
  })
  assert.equal(validPost.ok, true)
  assert.equal(validPost.imageCount, 2)
  assert.equal(validPost.coverImage, '/path/to/cover.png')

  // 2. 多图批量持久化
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'post-multi-test-'))
  const fakePngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
  const persisted = await PostCreator.persistPostImages(tmpDir, [fakePngBase64])
  assert.equal(persisted.length, 1)
  assert.ok(fs.existsSync(persisted[0]))

  fs.rmSync(tmpDir, { recursive: true, force: true })
})

test('视频创作引擎 VideoCreator：智能分镜拆解', async () => {
  const creator = new VideoCreator()

  const storyboard = await creator.generateStoryboard({
    topic: '普通人如何用3个步骤打造个人IP',
    targetDuration: 15
  })

  assert.equal(storyboard.scenes.length, 4, '15秒爆款应遵循四段式黄金结构')
  const scene1 = storyboard.scenes[0]
  assert.equal(scene1.index, 1)
  assert.ok(scene1.durationSec > 0)
  assert.ok(scene1.visualPrompt, '每个分镜应提供视觉画面提示')
  assert.ok(scene1.voiceover, '每个分镜应提供口播脚本')

  const totalTime = storyboard.scenes.reduce((sum, s) => sum + s.durationSec, 0)
  assert.equal(totalTime, 15, '分镜时长总和应与目标时长一致')
})

test('视频创作引擎 VideoCreator：真实素材扫描与 FFmpeg 渲染成片', async () => {
  const fixtureDir = path.resolve(__dirname, '../../spec/fixtures')
  const catSpin = path.join(fixtureDir, 'cat-spin.mp4')

  // 1. 扫描媒体素材
  const mediaList = await VideoCreator.listDownloadedMedia({
    downloadDir: fixtureDir,
    mediaDir: ''
  })
  assert.ok(mediaList.length > 0, '应成功扫描出目录中的媒体文件')
  const videoItem = mediaList.find(m => m.type === 'video')
  assert.ok(videoItem, '应识别出视频素材类型')

  // 2. 如果存在测试视频素材与 ffmpeg，执行真实切片与合成
  if (fs.existsSync(catSpin)) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'video-creator-test-'))
    const result = await VideoCreator.renderVideo({
      outputDir: tmpDir,
      title: '测试真实素材短视频',
      materials: [catSpin],
      scenes: [
        { index: 1, title: '片段1', voiceover: '真实视频素材第1段', durationSec: 1, startTime: 0, materialPath: catSpin },
        { index: 2, title: '片段2', voiceover: '真实视频素材第2段', durationSec: 1, startTime: 0, materialPath: catSpin }
      ],
      width: 540,
      height: 960,
      enableBlurBg: true,
      enableSubtitles: false, // 测试环境下关闭字幕避免依赖字体文件
      antiDuplication: true
    })

    assert.equal(result.ok, true, 'FFmpeg 应成功完成多镜头合成')
    assert.ok(fs.existsSync(result.outputPath), '成片文件必须真实存在')
    assert.ok(result.fileSize > 0, '成片文件必须有实际大小')
    assert.equal(result.width, 540)
    assert.equal(result.height, 960)

    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
})

test('资产库持久化管理器 AssetStore：原子增删改查与分类筛选', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'asset-store-test-'))
  const store = new AssetStore(tmpDir)

  // 1. 保存视频资产
  const vidAsset = await store.save({
    type: 'video',
    title: '3招搞定职场沟通短视频',
    content: '四段式分镜',
    targetPlatform: 'douyin',
    tags: ['#职场', '#干货']
  })
  assert.ok(vidAsset.id, '应自动生成资产 ID')
  assert.equal(vidAsset.status, 'draft')

  // 2. 保存文章资产
  const artAsset = await store.save({
    type: 'article',
    title: '高效阅读实操指南',
    content: '文章主体内容...',
    targetPlatform: 'xiaohongshu',
    tags: ['#阅读']
  })

  // 3. 列表查询与分类过滤
  const allList = await store.list()
  assert.equal(allList.length, 2, '应能检索到全部资产')

  const vidList = await store.list({ type: 'video' })
  assert.equal(vidList.length, 1)
  assert.equal(vidList[0].id, vidAsset.id)

  const artList = await store.list({ type: 'article' })
  assert.equal(artList.length, 1)
  assert.equal(artList[0].id, artAsset.id)

  // 4. 更新资产状态
  const updated = await store.update(vidAsset.id, { status: 'ready' })
  assert.equal(updated.status, 'ready')

  // 5. 删除资产
  const delOk = await store.delete(artAsset.id)
  assert.equal(delOk, true)
  const remaining = await store.list()
  assert.equal(remaining.length, 1)

  fs.rmSync(tmpDir, { recursive: true, force: true })
})

test('发布适配器 PublisherAdapter：创作者后台分发与载荷组装', () => {
  const adapter = new PublisherAdapter()

  // 1. 各平台后台 URL 校验
  assert.ok(adapter.getCreatorUrl('xiaohongshu').includes('creator.xiaohongshu.com'))
  assert.ok(adapter.getCreatorUrl('douyin').includes('creator.douyin.com'))
  assert.ok(adapter.getCreatorUrl('bilibili').includes('member.bilibili.com'))
  assert.ok(adapter.getCreatorUrl('wechat').includes('mp.weixin.qq.com'))
  assert.ok(adapter.getCreatorUrl('zhihu').includes('zhihu.com/creator'))
  assert.ok(adapter.getCreatorUrl('weibo').includes('weibo.com'))

  // 2. 组装待发草稿载荷
  const payload = adapter.buildPublishPayload({
    asset: {
      id: 'ast-101',
      type: 'article',
      title: '如何自律',
      content: '正文...',
      tags: ['#自律'],
      targetPlatform: 'xiaohongshu',
      mediaFiles: ['/path/to/img1.png']
    },
    platform: 'xiaohongshu'
  })

  assert.equal(payload.platform, 'xiaohongshu')
  assert.equal(payload.title, '如何自律')
  assert.ok(payload.creatorUrl.includes('creator.xiaohongshu.com'))
  assert.equal(payload.mediaFiles.length, 1)
})

test('Doocs/md 微信编辑器：开源主题配置完整性', () => {
  assert.ok(DOOCS_THEMES.default, '应包含经典微信绿主题')
  assert.ok(DOOCS_THEMES.orange, '应包含活力自媒体橙主题')
  assert.ok(DOOCS_THEMES.blue, '应包含极客干货蓝主题')
  assert.ok(DOOCS_THEMES.purple, '应包含优雅深邃紫主题')
  assert.ok(DOOCS_THEMES.dark, '应包含极简纯粹黑主题')

  // 校验每个主题的关键样式字段
  const keys = ['primaryColor', 'accentColor', 'textColor', 'h1Style', 'h2Style', 'h3Style', 'blockquoteStyle']
  for (const [themeId, theme] of Object.entries(DOOCS_THEMES)) {
    for (const key of keys) {
      assert.ok(theme[key], `主题 ${themeId} 必须定义 ${key}`)
    }
  }
})

test('Doocs/md 微信编辑器：图文混合环绕排版与微信规范 Inline CSS', () => {
  const parser = new DoocsParser({ themeId: 'default', fontSize: '16px' })

  // 1. 验证左环绕图文
  const mdLeft = `
# 标题测试

![产品左侧配图](https://example.com/demo1.jpg#left)
这是一段与图片并排左环绕的正文内容。微信公众号要求浮动样式直接内嵌在 figure 标签中。
`.trim()

  const htmlLeft = parser.render(mdLeft)
  assert.ok(htmlLeft.includes('class="wrap-left"'), '应生成 wrap-left 类名')
  assert.ok(htmlLeft.includes('float: left;'), '应包含 float: left 样式')
  assert.ok(htmlLeft.includes('margin: 4px 18px 12px 0;'), '应包含左环绕安全间距')
  assert.ok(htmlLeft.includes('<figcaption style='), '应渲染独立图注')
  assert.ok(htmlLeft.includes('图：产品左侧配图'), '图注内容应正确提取')

  // 2. 验证右环绕图文
  const mdRight = `
![技术架构右侧配图](https://example.com/demo2.png#right)
这是右环绕说明文字。
`.trim()

  const htmlRight = parser.render(mdRight)
  assert.ok(htmlRight.includes('class="wrap-right"'), '应生成 wrap-right 类名')
  assert.ok(htmlRight.includes('float: right;'), '应包含 float: right 样式')
  assert.ok(htmlRight.includes('margin: 4px 0 12px 18px;'), '应包含右环绕安全间距')

  // 3. 验证微信公众号外层 section 包裹器与内联样式
  assert.ok(htmlLeft.includes('class="doocs-wechat-wrapper"'))
  assert.ok(htmlLeft.includes('font-family: -apple-system'))

  // 4. 验证 Mac 风格三色圆点代码块
  const mdCode = `
\`\`\`javascript
const a = 1
console.log(a)
\`\`\`
`.trim()
  const htmlCode = parser.render(mdCode)
  assert.ok(htmlCode.includes('<svg xmlns="http://www.w3.org/2000/svg" width="45px" height="13px"'), '应渲染 Mac 三色控制台小圆点')
  assert.ok(htmlCode.includes('JAVASCRIPT'), '应渲染代码语言标签')

  // 5. 验证主题切换与字号切换
  parser.setTheme('orange')
  parser.setFontSize('15px')
  const htmlOrange = parser.render('## 二级标题\n普通文字')
  assert.ok(htmlOrange.includes(DOOCS_THEMES.orange.primaryColor), '渲染结果应更新为活力橙主题色')
  assert.ok(htmlOrange.includes('font-size: 15px;'), '字号应动态生效')
})

test('视频创作引擎 VideoCreator：字幕断句折行与切片时间顺延保护', () => {
  // 1. 测试长句子智能断句与折行
  const longSentence = '在这个人人都想做副业的时代，为什么90%的人都在盲目跟风，最后连电费都没赚回来？'
  const formatted = VideoCreator.formatSubtitleLines(longSentence, 13)
  const lines = formatted.split('\n')
  assert.ok(lines.length >= 2, '长字幕必须折成多行展示')
  assert.ok(lines.length <= 2, '自媒体短视频最多保留2行视觉大字')
  for (const line of lines) {
    assert.ok(line.length <= 15, `单行汉字数量 (${line.length}) 不得超过安全视窗上限`)
  }

  // 2. 测试分镜时间顺延累加，确保不重复第0秒
  const sb = VideoCreator.generateStoryboard({ topic: '测试顺延', targetDuration: 15 })
  assert.equal(sb.scenes[0].startTime, 0)
  assert.ok(sb.scenes[1].startTime > 0, '镜头2起始时间必须大于0')
  assert.ok(sb.scenes[2].startTime > sb.scenes[1].startTime, '镜头3起始时间必须顺延')
  assert.ok(sb.scenes[3].startTime > sb.scenes[2].startTime, '镜头4起始时间必须顺延')
})

test('AI 创作中心 UI 视窗零滚动结构自检：确保头部常驻与操作按钮吸底', () => {
  const { creatorPage, switchCreatorTab } = require('../renderer/creator-view')

  // 1. 验证默认视频创作页面包含全视口网格、内滚容器与吸底操作区
  const videoHtml = creatorPage()
  assert.ok(videoHtml.includes('class="creator-hub-container"'), '必须包含全视口工作台容器')
  assert.ok(videoHtml.includes('class="creator-studio-grid"'), '必须使用双栏独立布局')
  assert.ok(videoHtml.includes('class="creator-form-scrollable"'), '表单区域必须支持内部独立滚动')
  assert.ok(videoHtml.includes('class="creator-card-footer"'), '操作按钮必须常驻吸底卡片底部')
  assert.ok(videoHtml.includes('id="btn-generate-storyboard"'), '一键生成分镜按钮必须常驻吸底')

  // 2. 验证文章创作页面双栏独立排版结构
  switchCreatorTab('article')
  const articleHtml = creatorPage()
  assert.ok(articleHtml.includes('class="doocs-studio-container"'), '公众号排版必须包含全高容器')
  assert.ok(articleHtml.includes('class="doocs-dual-workspace"'), '公众号排版必须包含左右双栏')
  assert.ok(articleHtml.includes('id="btn-copy-wechat-html"'), '一键复制微信排版按钮必须在头部常驻')

  // 3. 验证图文笔记页面横向图片滑动轨道与吸底保存按钮
  switchCreatorTab('post')
  const postHtml = creatorPage()
  assert.ok(postHtml.includes('class="multi-image-scroll-track"'), '图片画廊必须为横向紧凑滑动轨道')
  assert.ok(postHtml.includes('id="btn-save-post-asset"'), '图文保存按钮必须常驻吸底')
  assert.ok(postHtml.includes('class="mobile-simulator-wrapper"'), '手机外观模拟器必须独立常驻展示')

  // 恢复状态
  switchCreatorTab('video')
})


