'use strict'

const fs = require('node:fs/promises')
const fss = require('node:fs')
const path = require('node:path')
const { randomUUID } = require('node:crypto')

class PostCreator {
  /**
   * 校验商业级图文创作数据契约 (标题 + 富文本 + 多张图片)
   * @param {Object} payload
   * @param {string} payload.title - 笔记标题
   * @param {string} payload.content - 富文本正文/文案
   * @param {Array<string>} payload.images - 多张图片本地路径或 URL
   * @param {string} [payload.platform] - 目标平台: xiaohongshu | douyin | weibo
   */
  static validatePostData ({ title = '', content = '', images = [], platform = 'xiaohongshu' }) {
    const safeTitle = (title || '').trim()
    const safeContent = (content || '').trim()
    const validImages = Array.isArray(images) ? images.filter(Boolean) : []

    const issues = []
    if (!safeTitle) {
      issues.push('标题不能为空')
    } else if (safeTitle.length > 30) {
      issues.push('标题长度超出限制（建议控制在 20 字以内，更容易被推荐）')
    }

    if (validImages.length === 0) {
      issues.push('图文创作至少需要 1 张图片素材（建议 3~9 张，算法推荐权重更高）')
    } else if (validImages.length > 18) {
      issues.push('图片数量超出单篇图文上限（最多支持 18 张图片）')
    }

    if (!safeContent) {
      issues.push('正文文案不能为空')
    }

    return {
      ok: issues.length === 0,
      issues,
      title: safeTitle,
      content: safeContent,
      imageCount: validImages.length,
      coverImage: validImages[0] || null,
      platform
    }
  }

  /**
   * 生成贴图与动态草稿数据结构（保持向下兼容）
   * @param {Object} options
   * @param {string} [options.template] - 'quote' | 'meme' | 'carousel'
   * @param {string} options.text - 主文本 / 金句
   * @param {string} [options.subText] - 副标题 / 作者名 / 补充说明
   * @param {string} [options.bgTheme] - 背景主题色系: 'dark' | 'gradient' | 'minimal' | 'warm'
   */
  static createPostConfig ({ template = 'quote', text = '', subText = '', bgTheme = 'dark', type }) {
    const actualTemplate = template || type || 'quote'
    const safeText = (text || '保持热爱，奔赴山海').trim()
    const safeSub = (subText || '—— 灵感随笔').trim()

    let slides = []
    if (actualTemplate === 'carousel') {
      const parts = safeText.split(/[\n\r]+|(?<=[。！？；])/).map(s => s.trim()).filter(Boolean)
      slides = parts.length > 0 ? parts : [safeText]
      if (slides.length > 9) slides = slides.slice(0, 9)
    }

    return {
      template: actualTemplate,
      text: safeText,
      subText: safeSub,
      bgTheme,
      slides,
      canvasWidth: actualTemplate === 'carousel' || actualTemplate === 'quote' ? 1080 : 800,
      canvasHeight: actualTemplate === 'carousel' || actualTemplate === 'quote' ? 1440 : 800
    }
  }

  /**
   * 将前端渲染好的 Base64 DataURL 图片保存为本地文件
   * @param {string} mediaDir - 存储目录
   * @param {string} base64Data - data:image/png;base64,...
   * @param {string} [prefix]
   */
  static async saveBase64Image (mediaDir, base64Data, prefix = 'post') {
    const match = String(base64Data).match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/)
    if (!match) throw new Error('无效的 Base64 图片数据格式')

    const rawExt = match[1].toLowerCase()
    const ext = rawExt === 'jpeg' ? 'jpg' : rawExt.includes('png') ? 'png' : rawExt
    const buffer = Buffer.from(match[2], 'base64')
    const fileName = `${prefix}-${Date.now()}-${randomUUID().slice(0, 6)}.${ext}`
    const fullPath = path.join(mediaDir, fileName)

    await fs.mkdir(mediaDir, { recursive: true })
    await fs.writeFile(fullPath, buffer)
    return fullPath
  }

  /**
   * 批量转存多张图片到媒体目录
   * @param {string} mediaDir
   * @param {Array<string>} imageSources - Base64 DataURL 或现有文件路径
   */
  static async persistPostImages (mediaDir, imageSources = []) {
    await fs.mkdir(mediaDir, { recursive: true })
    const results = []

    for (const src of imageSources) {
      if (!src) continue
      if (src.startsWith('data:image/')) {
        const p = await PostCreator.saveBase64Image(mediaDir, src, 'img')
        results.push(p)
      } else if (fss.existsSync(src)) {
        // 如果已是本地已存在的文件，直接保留或复制
        results.push(src)
      }
    }

    return results
  }

  constructor (mediaDir = null) {
    this.mediaDir = mediaDir
  }

  static createPost (options) { return this.createPostConfig(options) }

  createPostConfig (options) { return PostCreator.createPostConfig(options) }
  createPost (options) { return PostCreator.createPostConfig(options) }
  validatePostData (options) { return PostCreator.validatePostData(options) }

  async saveBase64Image (base64Data, prefix = 'post') {
    const dir = this.mediaDir || path.join(process.cwd(), 'temp')
    const filePath = await PostCreator.saveBase64Image(dir, base64Data, prefix)
    const stat = await fs.stat(filePath)
    return { filePath, fileSize: stat.size }
  }
}

module.exports = {
  PostCreator
}
