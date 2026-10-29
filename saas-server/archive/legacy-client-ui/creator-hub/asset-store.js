'use strict'

const fs = require('node:fs')
const fsp = require('node:fs/promises')
const path = require('node:path')
const { randomUUID } = require('node:crypto')

class AssetStore {
  /**
   * @param {string} baseDir 用户数据根目录或指定存储目录
   */
  constructor (baseDir) {
    this.storageDir = path.join(baseDir, 'creator-hub')
    this.assetsFile = path.join(this.storageDir, 'assets.json')
    this.mediaDir = path.join(this.storageDir, 'media')
    this.assets = new Map() // id -> CreativeAsset
    this.isLoaded = false
  }

  async ensureReady () {
    if (this.isLoaded) return
    try {
      await fsp.mkdir(this.mediaDir, { recursive: true })
      if (fs.existsSync(this.assetsFile)) {
        const raw = await fsp.readFile(this.assetsFile, 'utf8')
        const list = JSON.parse(raw)
        if (Array.isArray(list)) {
          this.assets.clear()
          for (const item of list) {
            if (item && item.id) {
              this.assets.set(item.id, item)
            }
          }
        }
      }
    } catch (err) {
      console.warn('[AssetStore] 初始化或加载资产记录失败，已重置为空库:', err.message)
    } finally {
      this.isLoaded = true
    }
  }

  async persist () {
    const tempFile = `${this.assetsFile}.tmp-${Date.now()}`
    const list = Array.from(this.assets.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    const payload = JSON.stringify(list, null, 2)
    await fsp.writeFile(tempFile, payload, 'utf8')
    await fsp.rename(tempFile, this.assetsFile)
  }

  /**
   * 获取所有资产列表
   * @param {Object} [filter]
   * @param {string} [filter.type]
   * @param {string} [filter.status]
   */
  async list (filter = {}) {
    await this.ensureReady()
    let list = Array.from(this.assets.values())
    if (filter.type && filter.type !== 'all') {
      list = list.filter(item => item.type === filter.type)
    }
    if (filter.status && filter.status !== 'all') {
      list = list.filter(item => item.status === filter.status)
    }
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  }

  async get (id) {
    await this.ensureReady()
    return this.assets.get(id) || null
  }

  /**
   * 保存或新建资产
   * @param {Partial<import('./types').CreativeAsset>} data
   */
  async save (data) {
    await this.ensureReady()
    const now = Date.now()
    const id = data.id || `asset-${randomUUID().slice(0, 8)}`
    const existing = this.assets.get(id)

    const record = {
      id,
      type: data.type || 'article',
      title: (data.title || '无标题草稿').trim(),
      content: data.content || '',
      coverPath: data.coverPath || '',
      mediaFiles: Array.isArray(data.mediaFiles) ? data.mediaFiles : [],
      tags: Array.isArray(data.tags) ? data.tags : [],
      targetPlatform: data.targetPlatform || 'xiaohongshu',
      status: data.status || 'draft',
      metadata: data.metadata || {},
      createdAt: existing?.createdAt || now,
      updatedAt: now
    }

    this.assets.set(id, record)
    await this.persist()
    return record
  }

  async updateStatus (id, status) {
    await this.ensureReady()
    const existing = this.assets.get(id)
    if (!existing) {
      throw new Error(`找不到 ID 为 ${id} 的资产`)
    }
    existing.status = status
    existing.updatedAt = Date.now()
    this.assets.set(id, existing)
    await this.persist()
    return existing
  }

  async update (id, patch = {}) {
    await this.ensureReady()
    const existing = this.assets.get(id)
    if (!existing) {
      throw new Error(`找不到 ID 为 ${id} 的资产`)
    }
    const updated = { ...existing, ...patch, updatedAt: Date.now() }
    this.assets.set(id, updated)
    await this.persist()
    return updated
  }

  async delete (id) {
    await this.ensureReady()
    const existing = this.assets.get(id)
    if (!existing) return false

    // 尝试清理专属媒体文件（如果有）
    for (const filePath of existing.mediaFiles || []) {
      if (typeof filePath === 'string' && filePath.startsWith(this.mediaDir)) {
        try {
          if (fs.existsSync(filePath)) await fsp.unlink(filePath)
        } catch (_) {}
      }
    }

    this.assets.delete(id)
    await this.persist()
    return true
  }
}

module.exports = {
  AssetStore
}
