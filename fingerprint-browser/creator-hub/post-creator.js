'use strict'

const fs = require('node:fs/promises')
const path = require('node:path')
const { randomUUID } = require('node:crypto')

class PostCreator {
  /**
   * 生成贴图与动态草稿数据结构
   * @param {Object} options
   * @param {string} options.template - 'quote' | 'meme' | 'carousel'
   * @param {string} options.text - 主文本 / 金句
   * @param {string} [options.subText] - 副标题 / 作者名 / 补充说明
   * @param {string} [options.bgTheme] - 背景主题色系: 'dark' | 'gradient' | 'minimal' | 'warm'
   */
  static createPostConfig ({ template = 'quote', text = '', subText = '', bgTheme = 'dark' }) {
    const safeText = (text || '保持热爱，奔赴山海').trim()
    const safeSub = (subText || '—— 灵感随笔').trim()

    // 针对九宫格/轮播图模版，自动将长文本按换行或句号拆解为多张卡片
    let slides = []
    if (template === 'carousel') {
      const parts = safeText.split(/[\n\r]+|(?<=[。！？；])/).map(s => s.trim()).filter(Boolean)
      slides = parts.length > 0 ? parts : [safeText]
      if (slides.length > 9) slides = slides.slice(0, 9)
    }

    return {
      template,
      text: safeText,
      subText: safeSub,
      bgTheme,
      slides,
      canvasWidth: template === 'carousel' || template === 'quote' ? 1080 : 800,
      canvasHeight: template === 'carousel' || template === 'quote' ? 1440 : 800 // 3:4 黄金小红书比例或 1:1 方图
    }
  }

  /**
   * 将前端渲染好的 Base64 DataURL 图片保存为本地文件
   * @param {string} mediaDir - 存储目录
   * @param {string} base64Data - data:image/png;base64,...
   * @param {string} [prefix]
   */
  static async saveBase64Image (mediaDir, base64Data, prefix = 'post') {
    const match = String(base64Data).match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/)
    if (!match) throw new Error('无效的 Base64 图片数据格式')

    const ext = match[1] === 'jpeg' ? 'jpg' : match[1]
    const buffer = Buffer.from(match[2], 'base64')
    const fileName = `${prefix}-${Date.now()}-${randomUUID().slice(0, 6)}.${ext}`
    const fullPath = path.join(mediaDir, fileName)

    await fs.mkdir(mediaDir, { recursive: true })
    await fs.writeFile(fullPath, buffer)
    return fullPath
  }

  constructor (mediaDir = null) {
    this.mediaDir = mediaDir
  }

  static createPost (options) { return this.createPostConfig(options) }

  createPostConfig (options) { return PostCreator.createPostConfig(options) }
  createPost (options) { return PostCreator.createPostConfig(options) }

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
