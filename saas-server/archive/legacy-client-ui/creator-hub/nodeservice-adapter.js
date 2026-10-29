'use strict'

const path = require('node:path')
const fs = require('node:fs/promises')
const EventEmitter = require('node:events')
let electronSession = null
try {
  const electron = require('electron/main')
  electronSession = electron.session
} catch {
  try {
    const electron = require('electron')
    electronSession = electron.session
  } catch {
    // 纯 Node 测试环境
  }
}

// 引入本地独立模块 nodeservice：已改为部署者配置的外部模块，不再内嵌代码。
let nodeService = null
try {
  nodeService = require('../external-service').loadExternalService()
} catch (err) {
  console.error('[NodeServicePublisher] 加载 nodeservice 模块失败:', err)
}

/**
 * 8大发布类型枚举与基础元数据定义
 */
const PUBLISH_TYPES = {
  'wechat-article': {
    id: 'wechat-article',
    platform: 'wechat',
    platformName: '微信公众号',
    name: '公众号文章',
    contentType: 'article',
    badge: '深度长文',
    description: '支持富文本/HTML排版、原创保护、留言管理、图文封面，可直接群发或存为公众号草稿箱',
    acceptMedia: 'image',
    defaultTitle: '自媒体高效运营：如何构建自动化增长飞轮？'
  },
  'wechat-dynamic': {
    id: 'wechat-dynamic',
    platform: 'wechat',
    platformName: '微信公众号',
    name: '公众号图文/贴图动态',
    contentType: 'dynamic',
    badge: '贴图图集',
    description: '支持多图画廊海报、精彩贴图动态、随想互动，适合快节奏日常灵感与互动',
    acceptMedia: 'image',
    defaultTitle: '每日精选灵感分享'
  },
  'douyin-video': {
    id: 'douyin-video',
    platform: 'douyin',
    platformName: '抖音',
    name: '抖音视频',
    contentType: 'video',
    badge: '短视频',
    description: '支持高清短视频上传、横竖版封面选择、热门话题标签、同步西瓜视频与AI声明',
    acceptMedia: 'video',
    defaultTitle: '爆款短视频精选分享'
  },
  'douyin-dynamic': {
    id: 'douyin-dynamic',
    platform: 'douyin',
    platformName: '抖音',
    name: '抖音图文动态',
    contentType: 'dynamic',
    badge: '热门图集',
    description: '支持高品质多图轮播、配乐封面、话题互动，抖音热门图文流量扶持推荐',
    acceptMedia: 'image',
    defaultTitle: '亲测有效！3个打破运营瓶颈的实战技巧'
  },
  'douyin-text': {
    id: 'douyin-text',
    platform: 'douyin',
    platformName: '抖音',
    name: '抖音文字',
    contentType: 'text',
    badge: '文字微评',
    description: '支持精炼文字、长文随笔、热门心得分享与话题挂载，轻量高效',
    acceptMedia: 'none',
    defaultTitle: '今日运营思考碎片'
  },
  'weibo-video': {
    id: 'weibo-video',
    platform: 'weibo',
    platformName: '新浪微博',
    name: '微博视频',
    contentType: 'video',
    badge: '微博视界',
    description: '支持高清视频上传、专属视频封面、超话话题挂载、原创声明与互动转发',
    acceptMedia: 'video',
    defaultTitle: '精选视频动态'
  },
  'weibo-dynamic': {
    id: 'weibo-dynamic',
    platform: 'weibo',
    platformName: '新浪微博',
    name: '微博图文动态',
    contentType: 'dynamic',
    badge: '九宫格图文',
    description: '支持九宫格多图、微博长文案、超话社区、AI内容声明与公开/粉丝范围设置',
    acceptMedia: 'image',
    defaultTitle: '微博日常动态'
  },
  'weibo-article': {
    id: 'weibo-article',
    platform: 'weibo',
    platformName: '新浪微博',
    name: '微博头条文章',
    contentType: 'article',
    badge: '头条专栏',
    description: '支持深度富文本文章、导语摘要、头条大图封面、粉丝专属阅读权限与同步微博动态',
    acceptMedia: 'image',
    defaultTitle: '深度头条观点：数字化转型下的新机遇'
  }
}

/**
 * 平台登录与创作者中心后台网址
 */
const PLATFORM_LOGIN_URLS = {
  wechat: 'https://mp.weixin.qq.com/',
  douyin: 'https://creator.douyin.com/',
  weibo: 'https://weibo.com/'
}

class NodeServicePublisher {
  constructor () {
    this.accountCache = new Map()
    this.customCookieStore = new Map() // 支持用户在界面手动指定的持久凭证
  }

  /**
   * 获取所有发布类型的定义列表
   */
  static getPublishTypes () {
    return Object.values(PUBLISH_TYPES)
  }

  /**
   * 格式化 Cookie 数组为标准 Cookie 请求头字符串
   */
  static formatCookies (cookieList) {
    if (!Array.isArray(cookieList)) return ''
    return cookieList
      .filter(c => c && c.name && c.value)
      .map(c => `${c.name}=${c.value}`)
      .join('; ')
  }

  /**
   * 从指纹环境数据目录中提取平台 Cookie
   */
  async extractEnvironmentCookies (dataDir, platform) {
    try {
      if (!dataDir || !electronSession) return ''
      const targetSession = electronSession.fromPath(dataDir)
      const allCookies = await targetSession.cookies.get({})
      if (!Array.isArray(allCookies) || allCookies.length === 0) return ''

      let filtered = []
      if (platform === 'wechat') {
        filtered = allCookies.filter(c => (c.domain || '').includes('qq.com'))
      } else if (platform === 'douyin') {
        filtered = allCookies.filter(c => (c.domain || '').includes('douyin.com') || (c.domain || '').includes('amemv.com'))
      } else if (platform === 'weibo') {
        filtered = allCookies.filter(c => (c.domain || '').includes('weibo.com') || (c.domain || '').includes('weibo.cn'))
      } else {
        filtered = allCookies
      }

      return NodeServicePublisher.formatCookies(filtered)
    } catch (err) {
      console.warn(`[NodeServicePublisher] 提取环境 Cookie 失败 (${dataDir}):`, err.message)
      return ''
    }
  }

  /**
   * 检测指定平台 Cookie 的登录态和账号详情
   */
  async checkAccountStatus (platform, cookieStr) {
    if (!cookieStr || typeof cookieStr !== 'string' || cookieStr.trim().length < 5) {
      return {
        online: false,
        error: '未检测到登录凭证，请先在环境中登录该平台'
      }
    }

    if (!nodeService) {
      return {
        online: false,
        error: '底层 nodeservice 引擎未就绪'
      }
    }

    try {
      if (platform === 'wechat') {
        const userInfo = await nodeService.Weixingongzhonghao.getWeixingongzhonghaoUserInfo(cookieStr)
        if (userInfo && (userInfo.code === 0 || userInfo.yixiaoerName || userInfo.data?.nick_name)) {
          return {
            online: true,
            platform: 'wechat',
            platformName: '微信公众号',
            userId: userInfo.yixiaoerId || userInfo.data?.author_id || '',
            nickname: userInfo.yixiaoerName || userInfo.data?.nick_name || '已登录公众号',
            avatar: userInfo.yixiaoerImageUrl || userInfo.data?.head_img || '',
            raw: userInfo.data || {}
          }
        }
        return {
          online: false,
          error: userInfo?.msg || '微信公众号登录已过期或未登录'
        }
      }

      if (platform === 'douyin') {
        const userInfo = await nodeService.Douyin.getDouyinUserInfo(cookieStr)
        if (userInfo && (userInfo.code === 0 || userInfo.data?.user_id || userInfo.data?.nickname || userInfo.yixiaoerName)) {
          return {
            online: true,
            platform: 'douyin',
            platformName: '抖音',
            userId: userInfo.data?.user_id || userInfo.yixiaoerId || '',
            nickname: userInfo.data?.nickname || userInfo.yixiaoerName || '已登录抖音号',
            avatar: userInfo.data?.avatar || userInfo.yixiaoerImageUrl || '',
            raw: userInfo.data || {}
          }
        }
        return {
          online: false,
          error: userInfo?.msg || '抖音登录已过期或未登录'
        }
      }

      if (platform === 'weibo') {
        const userInfo = await nodeService.Xinlangweibo.getXinlangweiboUserInfo(cookieStr)
        if (userInfo && (userInfo.code === 0 || userInfo.data?.id || userInfo.yixiaoerName || userInfo.data?.screen_name)) {
          return {
            online: true,
            platform: 'weibo',
            platformName: '新浪微博',
            userId: String(userInfo.data?.id || userInfo.yixiaoerId || ''),
            nickname: userInfo.data?.screen_name || userInfo.yixiaoerName || '已登录微博号',
            avatar: userInfo.data?.profile_image_url || userInfo.yixiaoerImageUrl || '',
            raw: userInfo.data || {}
          }
        }
        return {
          online: false,
          error: userInfo?.msg || '微博登录已过期或未登录'
        }
      }

      return {
        online: false,
        error: `未知平台类型: ${platform}`
      }
    } catch (err) {
      return {
        online: false,
        error: err.message || '检测账号状态失败'
      }
    }
  }

  /**
   * 获取并检测所有环境账号列表
   * @param {Object} options
   * @param {import('../environment-repository').EnvironmentRepository} options.environmentRepository
   * @param {boolean} [options.forceRefresh]
   */
  async listEnvironmentAccounts ({ environmentRepository, forceRefresh = false }) {
    if (!environmentRepository) return []
    const environments = environmentRepository.list() || []
    const results = []

    const platforms = [
      { key: 'wechat', name: '微信公众号' },
      { key: 'douyin', name: '抖音' },
      { key: 'weibo', name: '新浪微博' }
    ]

    for (const env of environments) {
      const envItem = {
        environmentId: env.id,
        environmentName: env.name || env.profileName || '未命名环境',
        groupName: env.groupName || '默认分组',
        status: env.status || 'closed',
        dataDir: env.dataDir,
        accounts: []
      }

      for (const p of platforms) {
        const cacheKey = `${env.id}:${p.key}`
        let cookieStr = this.customCookieStore.get(cacheKey) || ''

        if (!cookieStr) {
          cookieStr = await this.extractEnvironmentCookies(env.dataDir, p.key)
        }

        let status = null
        if (!forceRefresh && this.accountCache.has(cacheKey)) {
          status = this.accountCache.get(cacheKey)
        } else {
          status = await this.checkAccountStatus(p.key, cookieStr)
          this.accountCache.set(cacheKey, status)
        }

        envItem.accounts.push({
          accountId: `${env.id}__${p.key}`,
          environmentId: env.id,
          environmentName: envItem.environmentName,
          platform: p.key,
          platformName: p.name,
          loginUrl: PLATFORM_LOGIN_URLS[p.key],
          online: Boolean(status.online),
          userId: status.userId || '',
          nickname: status.nickname || `${p.name}账号`,
          avatar: status.avatar || '',
          error: status.error || '',
          hasCookie: Boolean(cookieStr && cookieStr.length > 5),
          cookieStr
        })
      }

      results.push(envItem)
    }

    return results
  }

  /**
   * 手动更新或存储某个环境账号的 Cookie 凭据
   */
  setCustomCookie (environmentId, platform, cookieStr) {
    const cacheKey = `${environmentId}:${platform}`
    if (cookieStr) {
      this.customCookieStore.set(cacheKey, cookieStr)
    } else {
      this.customCookieStore.delete(cacheKey)
    }
    this.accountCache.delete(cacheKey)
  }

  /**
   * 一键多账号发布执行核心调度
   * @param {Object} payload
   * @param {string} payload.publishType - 8大发布类型之一
   * @param {Array<Object>} payload.targetAccounts - 目标账号列表 [{ accountId, environmentId, platform, cookieStr }]
   * @param {Object} payload.commonConfig - 类型全局通用配置
   * @param {Object} [payload.accountConfigs] - 账号个性化独立配置字典 { [accountId]: { ... } }
   * @param {Function} [payload.onProgress] - 进度通知回调 (progressInfo) => void
   */
  async publishMultiAccounts ({ publishType, targetAccounts, commonConfig, accountConfigs = {}, onProgress }) {
    const typeMeta = PUBLISH_TYPES[publishType]
    if (!typeMeta) {
      throw new Error(`不支持的发布类型: ${publishType}`)
    }

    if (!Array.isArray(targetAccounts) || targetAccounts.length === 0) {
      throw new Error('请至少选择一个要发布的账号')
    }

    if (!nodeService) {
      throw new Error('底层 nodeservice 发布引擎尚未正确加载')
    }

    const taskId = `pub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const summary = {
      taskId,
      publishType,
      publishTypeName: typeMeta.name,
      platform: typeMeta.platform,
      totalCount: targetAccounts.length,
      successCount: 0,
      failCount: 0,
      startTime: Date.now(),
      results: []
    }

    // 逐个账号执行发布（支持进度上报与异常隔离）
    for (let i = 0; i < targetAccounts.length; i++) {
      const target = targetAccounts[i]
      const specificConfig = accountConfigs[target.accountId] || {}
      // 深度合并通用配置与账号独立个性化配置
      const finalConfig = {
        ...commonConfig,
        ...specificConfig
      }

      const accountResult = {
        accountId: target.accountId,
        environmentId: target.environmentId,
        environmentName: target.environmentName || '未知环境',
        nickname: target.nickname || '未命名账号',
        platform: typeMeta.platform,
        platformName: typeMeta.platformName,
        status: 'publishing', // 'publishing' | 'success' | 'failed'
        progress: 10,
        message: '正在准备发布载荷...',
        publishId: '',
        publishTime: Date.now(),
        error: null
      }

      summary.results.push(accountResult)

      const notify = (stepPercent, stepMsg) => {
        accountResult.progress = stepPercent
        accountResult.message = stepMsg
        if (typeof onProgress === 'function') {
          onProgress({
            taskId,
            summary,
            currentAccount: accountResult,
            currentIndex: i,
            totalCount: targetAccounts.length
          })
        }
      }

      notify(15, '正在验证账号环境登录凭据...')

      try {
        let cookie = target.cookieStr
        if (!cookie) {
          cookie = this.customCookieStore.get(`${target.environmentId}:${typeMeta.platform}`)
        }
        if (!cookie) {
          throw new Error('未获取到该环境账号的有效 Cookie，请先在环境中登录该平台')
        }

        // 调用对应 Worker 逻辑执行发布
        const res = await this.executePublishByWorker({
          publishType,
          cookie,
          config: finalConfig,
          target,
          onProgressStep: (pct, msg) => notify(pct, msg)
        })

        accountResult.status = 'success'
        accountResult.progress = 100
        accountResult.message = res.msg || '发布成功'
        accountResult.publishId = res.publishId || res.taskId || ''
        summary.successCount++
        notify(100, accountResult.message)
      } catch (err) {
        accountResult.status = 'failed'
        accountResult.message = `发布失败: ${err.message}`
        accountResult.error = err.message
        summary.failCount++
        notify(accountResult.progress, accountResult.message)
      }
    }

    summary.endTime = Date.now()
    summary.durationMs = summary.endTime - summary.startTime
    return summary
  }

  /**
   * 根据具体发布类型分发给对应平台的 Worker 实现
   */
  async executePublishByWorker ({ publishType, cookie, config, target, onProgressStep }) {
    const singleTaskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
    const emitter = new EventEmitter()

    emitter.on('progress', (data) => {
      const msg = typeof data === 'string' ? data : (data?.msg || data?.status || '正在发布中...')
      if (onProgressStep) onProgressStep(60, msg)
    })

    // 1. 微信公众号文章
    if (publishType === 'wechat-article') {
      onProgressStep(30, '正在获取微信公众号授权上下文...')
      const userInfo = await nodeService.Weixingongzhonghao.getWeixingongzhonghaoUserInfo(cookie)
      if (!userInfo || userInfo.code !== 0 || !userInfo.data) {
        throw new Error(userInfo?.msg || '获取公众号身份凭证失败，登录已过期')
      }

      onProgressStep(50, '正在处理文章封面与正文 HTML...')
      const contentItem = {
        title: config.title || '无标题文章',
        author: config.author || userInfo.data.nick_name || '栖界创作者',
        desc: config.desc || config.summary || '',
        content: config.content || '<p>文章正文内容</p>',
        cover: {
          pathOrUrl: (Array.isArray(config.covers) && config.covers[0]) ? config.covers[0] : (config.coverPath || '')
        },
        createType: config.createType !== undefined ? Number(config.createType) : 1,
        isOriginal: config.isOriginal !== undefined ? Number(config.isOriginal) : 1,
        needOpenComment: config.needOpenComment ? 1 : 0,
        onlyFansComment: config.onlyFansComment ? 1 : 0,
        needOpenReply: 5,
        disableRecommend: 0
      }

      const taskData = {
        taskId: singleTaskId,
        pubType: config.pubType !== undefined ? Number(config.pubType) : 1, // 1群发, 0存草稿
        sex: 0,
        notifySubscribers: config.notifySubscribers ? 1 : 0,
        contentList: [contentItem]
      }

      if (config.prePubTime) {
        taskData.publishTime = Math.floor(Number(config.prePubTime) / 1000)
      }

      onProgressStep(70, '正在向微信公众号官方接口提交发布...')
      const result = await nodeService.Weixingongzhonghao.publishArticle(
        cookie,
        taskData,
        userInfo.data.ticketId || '',
        userInfo.data.ticket || '',
        Number(userInfo.data.token || 0),
        String(userInfo.yixiaoerId || userInfo.data.author_id || ''),
        emitter
      )

      if (result && result.code === 0) {
        return { ok: true, msg: result.msg || '公众号文章已发布成功', publishId: result.taskId }
      }
      throw new Error(result?.msg || '微信公众号发布失败，请检查图文是否合规')
    }

    // 2. 微信公众号图文/贴图动态
    if (publishType === 'wechat-dynamic') {
      onProgressStep(30, '正在获取微信公众号授权上下文...')
      const userInfo = await nodeService.Weixingongzhonghao.getWeixingongzhonghaoUserInfo(cookie)
      if (!userInfo || userInfo.code !== 0 || !userInfo.data) {
        throw new Error(userInfo?.msg || '获取公众号身份凭证失败，登录已过期')
      }

      const imageList = Array.isArray(config.images) && config.images.length > 0
        ? config.images.map(img => (typeof img === 'string' ? { pathOrUrl: img } : img))
        : (config.coverPath ? [{ pathOrUrl: config.coverPath }] : [])

      if (imageList.length === 0) {
        throw new Error('公众号图文/贴图动态至少需要包含一张图片')
      }

      onProgressStep(50, `正在打包 ${imageList.length} 张贴图素材...`)

      // 若底层 SDK 支持原生 publishDynamic 则调用
      if (typeof nodeService.Weixingongzhonghao.publishDynamic === 'function') {
        const taskData = {
          taskId: singleTaskId,
          pubType: config.pubType !== undefined ? Number(config.pubType) : 1,
          title: config.title || '',
          desc: config.desc || config.content || '分享精美图文动态',
          images: imageList,
          needOpenComment: config.needOpenComment ? 1 : 0,
          disableRecommend: 0,
          notifySubscribers: config.notifySubscribers ? 1 : 0
        }

        if (config.prePubTime) {
          taskData.publishTime = Math.floor(Number(config.prePubTime) / 1000)
        }

        onProgressStep(70, '正在向公众号接口提交图文动态...')
        const result = await nodeService.Weixingongzhonghao.publishDynamic(
          cookie,
          taskData,
          userInfo.data.ticketId || '',
          userInfo.data.ticket || '',
          Number(userInfo.data.token || 0),
          String(userInfo.yixiaoerId || userInfo.data.author_id || ''),
          emitter
        )

        if (result && result.code === 0) {
          return { ok: true, msg: result.msg || '公众号图文动态已发布', publishId: result.taskId }
        }
        throw new Error(result?.msg || '发布公众号图文动态失败')
      }

      // 兼容模式：组装为微信公众号多图贴图画廊图文并调用 publishArticle
      const safeDesc = (config.desc || config.content || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
      const galleryHtml = `
        <div style="font-size:15px;line-height:1.8;color:#222;margin-bottom:16px;">
          ${safeDesc.replace(/\n/g, '<br/>')}
        </div>
        <div style="display:flex;flex-direction:column;gap:14px;align-items:center;">
          ${imageList.map(img => `<p><img src="${img.pathOrUrl}" style="max-width:100%;border-radius:6px;"/></p>`).join('')}
        </div>
      `
      const contentItem = {
        title: config.title || '今日精选贴图动态',
        author: config.author || userInfo.data.nick_name || '栖界创作者',
        desc: config.desc || '分享精美贴图动态',
        content: galleryHtml,
        cover: imageList[0],
        createType: 0,
        isOriginal: 0,
        needOpenComment: config.needOpenComment ? 1 : 0,
        onlyFansComment: 0,
        needOpenReply: 5,
        disableRecommend: 0
      }

      const taskData = {
        taskId: singleTaskId,
        pubType: config.pubType !== undefined ? Number(config.pubType) : 1,
        sex: 0,
        notifySubscribers: config.notifySubscribers ? 1 : 0,
        contentList: [contentItem]
      }

      onProgressStep(70, '正在向公众号接口提交图文贴图内容...')
      const result = await nodeService.Weixingongzhonghao.publishArticle(
        cookie,
        taskData,
        userInfo.data.ticketId || '',
        userInfo.data.ticket || '',
        Number(userInfo.data.token || 0),
        String(userInfo.yixiaoerId || userInfo.data.author_id || ''),
        emitter
      )

      if (result && result.code === 0) {
        return { ok: true, msg: result.msg || '公众号贴图图文已发布成功', publishId: result.taskId }
      }
      throw new Error(result?.msg || '发布公众号贴图动态失败')
    }

    // 3. 抖音视频
    if (publishType === 'douyin-video') {
      onProgressStep(30, '正在校验抖音视频文件与封面...')
      const videoPath = config.videoPath || (typeof config.video === 'string' ? config.video : config.video?.pathOrUrl)
      if (!videoPath) {
        throw new Error('未指定要发布的视频文件，请选择本地 MP4/MOV 视频')
      }

      const coverPath = config.coverPath || (Array.isArray(config.covers) && config.covers[0]) || ''
      if (!coverPath) {
        throw new Error('请为抖音视频指定一张封面图片')
      }

      const taskData = {
        taskId: singleTaskId,
        video: { pathOrUrl: videoPath },
        cover: { pathOrUrl: coverPath },
        horizontalCover: config.horizontalCover ? { pathOrUrl: config.horizontalCover } : undefined,
        title: config.title || '精选视频',
        text: config.desc || config.text || config.title || '',
        visibility_type: config.visibilityType !== undefined ? Number(config.visibilityType) : 0,
        download: config.allowSave === false ? 1 : 0,
        should_sync: config.syncXigua ? 1 : 0,
        declareInfo: config.aigcDeclared ? { choose_value: 'aigc' } : undefined
      }

      if (config.prePubTime) {
        taskData.timing = Math.floor(Number(config.prePubTime) / 1000)
      }

      onProgressStep(60, '正在分片上传抖音视频并配置发布参数...')
      const result = await nodeService.Douyin.publishVideo(cookie, taskData, emitter)
      if (result && (result.code === 0 || result.statusCode === 0)) {
        return { ok: true, msg: result.msg || '抖音视频已成功提交发布', publishId: result.taskId }
      }
      throw new Error(result?.msg || '抖音视频发布失败，请检查视频规格与登录状态')
    }

    // 4. 抖音图文动态
    if (publishType === 'douyin-dynamic') {
      const imageList = Array.isArray(config.images) && config.images.length > 0
        ? config.images.map(img => (typeof img === 'string' ? { pathOrUrl: img } : img))
        : (config.coverPath ? [{ pathOrUrl: config.coverPath }] : [])

      if (imageList.length === 0) {
        throw new Error('抖音图文动态至少需要选择 1 张图片')
      }

      onProgressStep(40, `正在处理 ${imageList.length} 张图文素材...`)
      const taskData = {
        taskId: singleTaskId,
        title: config.title || '精选图文',
        text: config.desc || config.content || config.text || '',
        images: imageList,
        topics: Array.isArray(config.topics) ? config.topics : (config.tags || []),
        visibility_type: config.visibilityType !== undefined ? Number(config.visibilityType) : 0,
        declareInfo: config.aigcDeclared ? { choose_value: 'aigc' } : undefined
      }

      if (config.prePubTime) {
        taskData.timing = Math.floor(Number(config.prePubTime) / 1000)
      }

      onProgressStep(70, '正在向抖音创作者后台提交图文动态...')
      const result = await nodeService.Douyin.publishDynamic(cookie, taskData, emitter)
      if (result && (result.code === 0 || result.statusCode === 0)) {
        return { ok: true, msg: result.msg || '抖音图文已成功发布', publishId: result.taskId }
      }
      throw new Error(result?.msg || '抖音图文发布失败')
    }

    // 5. 抖音文字
    if (publishType === 'douyin-text') {
      onProgressStep(40, '正在组织抖音文字随笔与排版...')
      const taskData = {
        taskId: singleTaskId,
        title: config.title || '今日随笔',
        text: config.desc || config.title || '',
        content: config.content || config.text || '',
        cover: config.coverPath ? { pathOrUrl: config.coverPath } : undefined,
        topics: Array.isArray(config.topics) ? config.topics : (config.tags || []),
        visibility_type: config.visibilityType !== undefined ? Number(config.visibilityType) : 0
      }

      if (config.prePubTime) {
        taskData.timing = Math.floor(Number(config.prePubTime) / 1000)
      }

      onProgressStep(70, '正在向抖音提交文字内容...')
      const authorId = target.userId || ''
      const result = await nodeService.Douyin.publishArticle(cookie, taskData, emitter, authorId)
      if (result && (result.code === 0 || result.statusCode === 0)) {
        return { ok: true, msg: result.msg || '抖音文字发布成功', publishId: result.taskId }
      }
      throw new Error(result?.msg || '抖音文字发布失败')
    }

    // 6. 微博视频
    if (publishType === 'weibo-video') {
      const videoPath = config.videoPath || (typeof config.video === 'string' ? config.video : config.video?.pathOrUrl)
      if (!videoPath) {
        throw new Error('未指定微博视频文件，请选择本地 MP4/MOV 视频')
      }

      const coverPath = config.coverPath || (Array.isArray(config.covers) && config.covers[0]) || ''
      if (!coverPath) {
        throw new Error('请为微博视频选择一张封面')
      }

      onProgressStep(40, '正在组织微博视频与封面参数...')
      const taskData = {
        taskId: singleTaskId,
        video: { pathOrUrl: videoPath },
        cover: { pathOrUrl: coverPath },
        title: config.title || '精选视频分享',
        desc: config.desc || config.text || config.title || '',
        allowDownload: false,
        createType: config.createType !== undefined ? Number(config.createType) : 0,
        visibilityType: config.visibilityType !== undefined ? Number(config.visibilityType) : 0
      }

      if (config.prePubTime) {
        taskData.publishTime = Number(config.prePubTime)
      }

      onProgressStep(70, '正在上传微博视频分片并提交审核发布...')
      const result = await nodeService.Xinlangweibo.publishVideo(cookie, taskData, emitter)
      if (result && (result.code === 0 || result.code === 100000)) {
        return { ok: true, msg: result.msg || '微博视频已发布成功', publishId: result.taskId }
      }
      throw new Error(result?.msg || '微博视频发布失败，请检查账号是否绑定手机或封禁')
    }

    // 7. 微博图文动态
    if (publishType === 'weibo-dynamic') {
      onProgressStep(30, '正在获取微博账号身份信息...')
      const userInfo = await nodeService.Xinlangweibo.getXinlangweiboUserInfo(cookie)
      if (!userInfo || !userInfo.data) {
        throw new Error(userInfo?.msg || '获取微博账号信息失败，登录态已失效')
      }

      const uid = Number(userInfo.data.id || target.userId || 0)
      const screenName = userInfo.data.screen_name || target.nickname || ''

      const imageList = Array.isArray(config.images) && config.images.length > 0
        ? config.images.map(img => (typeof img === 'string' ? { pathOrUrl: img } : img))
        : (config.coverPath ? [{ pathOrUrl: config.coverPath }] : [])

      onProgressStep(50, `正在处理微博正文与 ${imageList.length} 张配图...`)
      const taskData = {
        taskId: singleTaskId,
        contentText: config.content || config.desc || config.text || config.title || '微博图文分享',
        visible: config.visible !== undefined ? Number(config.visible) : 0,
        images: imageList,
        mblog_statement: config.statement || 0
      }

      if (config.prePubTime) {
        taskData.schedule_timestamp = Number(config.prePubTime)
      }

      onProgressStep(70, '正在向新浪微博提交图文动态...')
      const result = await nodeService.Xinlangweibo.publishDynamic(
        cookie,
        uid,
        1,
        `@${screenName}`,
        taskData,
        emitter
      )

      if (result && (result.code === 0 || result.code === 100000)) {
        return { ok: true, msg: result.msg || '微博图文动态已发布成功', publishId: result.taskId }
      }
      throw new Error(result?.msg || '微博动态发布失败')
    }

    // 8. 微博头条文章
    if (publishType === 'weibo-article') {
      onProgressStep(30, '正在获取微博作者凭证...')
      const userInfo = await nodeService.Xinlangweibo.getXinlangweiboUserInfo(cookie)
      if (!userInfo || !userInfo.data) {
        throw new Error(userInfo?.msg || '获取微博账号信息失败，登录态已失效')
      }

      const uid = Number(userInfo.data.id || target.userId || 0)
      const coverPath = config.coverPath || (Array.isArray(config.covers) && config.covers[0]) || ''
      if (!coverPath) {
        throw new Error('微博头条文章必须提供一张封面大图')
      }

      onProgressStep(50, '正在解析头条文章富文本与导语...')
      const taskData = {
        taskId: singleTaskId,
        pubType: config.pubType !== undefined ? Number(config.pubType) : 1, // 1发布, 0存草稿
        uid,
        title: config.title || '深度头条观点',
        summary: config.summary || config.desc || '',
        content: config.content || '<p>头条文章正文内容</p>',
        cover: { pathOrUrl: coverPath },
        follow_to_read: config.onlyFansRead ? 1 : 0,
        contentText: config.contentText || `【${config.title || '头条文章'}】阅读全文 链接：`,
        rank: 0,
        topics: Array.isArray(config.topics) ? config.topics : []
      }

      onProgressStep(70, '正在向微博头条文章平台提交正文排版...')
      const result = await nodeService.Xinlangweibo.publishArticle(cookie, taskData, emitter)
      if (result && (result.code === 0 || result.code === 100000)) {
        return { ok: true, msg: result.msg || '微博头条文章已发布成功', publishId: result.taskId }
      }
      throw new Error(result?.msg || '微博头条文章发布失败')
    }

    throw new Error(`未支持的发布类型分发: ${publishType}`)
  }
}

module.exports = {
  NodeServicePublisher,
  PUBLISH_TYPES,
  PLATFORM_LOGIN_URLS
}
