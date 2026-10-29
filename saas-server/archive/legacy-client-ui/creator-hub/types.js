'use strict'

/**
 * 创作资产类型
 * @typedef {'video' | 'article' | 'post'} AssetType
 */

/**
 * 创作资产状态
 * @typedef {'draft' | 'ready' | 'publishing' | 'published'} AssetStatus
 */

/**
 * 目标社交媒体平台
 * @typedef {'xiaohongshu' | 'douyin' | 'bilibili' | 'wechat' | 'zhihu' | 'weibo'} TargetPlatform
 */

/**
 * 视频分镜单元
 * @typedef {Object} StoryboardScene
 * @property {number} index - 镜头序号
 * @property {string} title - 分镜标题
 * @property {string} voiceover - 旁白配音与字幕文案
 * @property {string} visualPrompt - 画面视觉描述
 * @property {number} durationSec - 镜头预估时长（秒）
 * @property {string} [mediaUrl] - 绑定的视频/图片素材路径
 */

/**
 * 创作资产模型
 * @typedef {Object} CreativeAsset
 * @property {string} id - 资产唯一 ID
 * @property {AssetType} type - 资产类型：video | article | post
 * @property {string} title - 主标题
 * @property {string} content - 正文 / 视频文案 / 动态文本
 * @property {string} [coverPath] - 封面图片路径
 * @property {string[]} mediaFiles - 产出的多媒体文件路径（MP4, PNG, JPG）
 * @property {string[]} tags - 平台热门标签/话题列表
 * @property {TargetPlatform} targetPlatform - 预设发布平台
 * @property {AssetStatus} status - 状态
 * @property {Object} [metadata] - 各模块专属扩展字段
 * @property {number} createdAt - 创建时间戳
 * @property {number} updatedAt - 更新时间戳
 */

module.exports = {}
