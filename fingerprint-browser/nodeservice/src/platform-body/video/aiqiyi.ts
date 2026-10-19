import { VideoFormItem, PubType } from '../common';
import { ImageInfo } from '@/media-platform';

/**
 * 爱奇艺内容类型枚举
 * @description 爱奇艺平台支持的视频内容创作类型
 * 1:原创
 * 2:转载
 */
export enum AiQiYiContentType {
  /**
   * 原创类型
   */
  '原创类型' = 1,
  /**
   * 转载类型
   */
  '转载类型' = 2,
}

/**
 * 爱奇艺申明
 * 0:无需申明
 * 5:个人观点仅供参考
 * 6:内容为转载
 * 4:内容包含营销信息
 * 2:含虚构演绎内容
 * 1:含AI生成内容
 */
export enum AiQiYiStatementType {
  '无需申明' = 0,

  '个人观点仅供参考' = 5,

  '内容为转载' = 6,

  '内容包含营销信息' = 4,

  '含虚构演绎内容' = 2,

  '含AI生成内容' = 1,
}
/**
 * 爱奇艺申明
 */
export interface AiQiYiContentStatement {
  /**
   * 爱奇艺申明
   * 0:无需申明
   * 5:个人观点仅供参考
   * 6:内容为转载
   * 4:内容包含营销信息
   * 2:含虚构演绎内容
   * 1:含AI生成内容
   */
  type: AiQiYiStatementType;
}

/**
 * 爱奇艺平台视频表单
 * @description 爱奇艺视频发布表单的数据结构
 * @interface AiQiYiVideoPlatformBody
 */
export interface AiQiYiVideoPlatformBody {
  /**
   * 视频信息
   * @type {VideoFormItem}
   * @description 视频文件的表单项，必填字段
   *
   * 约束条件：
   * - 最大时长10分钟
   */
  video: VideoFormItem;

  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 视频封面的表单项，必填字段
   *
   * 约束条件：
   * - 最大像素尺寸5000x5000
   */
  covers: ImageInfo[];
  /**
   * 竖版封面，3:4
   * @type {ImageInfo[]}
   */
  verticalCovers?: ImageInfo[];

  /**
   * 视频标题
   * @type {string}
   * @description 视频的标题文本，必填字段
   *
   * 约束条件：
   * - 最大长度30个字符
   */
  title: string;

  /**
   * 视频描述
   * @type {string}
   * @description 视频的描述内容，必填字段
   *
   * 约束条件：
   * - 无长度限制
   *
   * 格式要求：
   * - 支持HTML格式：内容应该用 `<p>` 标签包裹，支持多个 `<p>` 标签
   * - 不支持话题标签（使用独立的tags字段）
   * @example "<p>这是一个精彩的视频内容</p><p>欢迎大家观看</p>"
   */
  desc?: string;



  /**
   * 内容声明
   * @type {AiQiYiContentStatement}
   * @description 内容声明选项，可选字段，用于标识内容类型或来源
   *
   * 约束条件：
   * 当不提供时，表示"无需声明"
   */
  statement?: AiQiYiContentStatement;



  /**
   * 定时发布时间
   * @type {number}
   * @description 视频的定时发布13位时间戳，可选字段
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：2小时
   * - 最大间隔：15天
   */
  prePubTime?: number;

  /**
   * 存草稿/直接发布
   * @type {number}
   * @description 发布类型选择
   * 0:存草稿
   * 1:直接发布
   */
  pubType: PubType;
}

/**
 * 爱奇艺平台文章表单
 * @description 爱奇艺文章发布表单的数据结构
 * @interface AiQiYiArticlePlatformBody
 */
export interface AiQiYiArticlePlatformBody {
  /**
   * 文章标题
   * @type {string}
   * @description 文章的标题文本
   *
   * 约束条件：
   * - 必填
   * - 最小长度5个字符
   * - 最大长度60个字符
   * @example "爱奇艺文章分享"
   */
  title: string;

  /**
   * 文章内容
   * @type {string}
   * @description 文章的正文内容，HTML格式
   *
   * 约束条件：
   * - 必填
   * - 最大长度20000个字符
   *
   * 格式要求：
   * - HTML格式：内容应该用 `<div>` 标签包裹
   * @example "<div><p>我是爱奇艺文章</p></div>"
   */
  content: string;

  /**
   * 存草稿/直接发布
   * @type {number}
   * @description 发布类型选择
   * 0:存草稿
   * 1:直接发布
   */
  pubType: PubType;
}
