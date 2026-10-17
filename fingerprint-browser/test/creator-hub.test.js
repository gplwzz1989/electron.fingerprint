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
