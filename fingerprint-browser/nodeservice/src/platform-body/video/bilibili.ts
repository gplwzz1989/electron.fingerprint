import { VideoFormItem, PubType } from '../common';
import { ImageInfo, ListItemInfo } from '@/media-platform';

/**
 * 哔哩哔哩视频内容类型枚举
 * @description 哔哩哔哩平台支持的视频内容类型
 */
export enum BilibiliVideoContentType {
  /**
   * 自制
   */
  '自制' = 1,
  /**
   * 转载
   */
  '转载' = 2,
}
/**
 * 哔哩哔哩文章内容类型枚举
 * @description 哔哩哔哩平台支持的视频内容类型
 */
export enum BilibiliArticleContentType {
  /**
   * 申明原创
   */
  '申明原创' = 1,
  /**
   * 不申明
   */
  '不申明' = 0,
}
/**
 * 哔哩哔哩创作者申明
 * 0:不申明
 * 1：作者声明：该视频使用人工智能合成技术
 * 2：作者声明：视频内含有危险行为，请勿轻易模仿
 * 3：作者声明：该内容仅供娱乐，请勿过分解读
 * 4：作者声明：该内容可能引人不适，请谨慎选择观看
 * 5：作者声明：请理性适度消费
 * 6：作者声明：个人观点，仅供参考
 */
export enum BiLiBiLiStatementType {
  '不声明' = 0,
  '该视频使用人工智能合成技术' = 1,
  '视频内含有危险行为，请勿轻易模仿' = 2,
  '该内容仅供娱乐，请勿过分解读' = 3,
  '该内容可能引人不适，请谨慎选择观看' = 4,
  '请理性适度消费' = 5,
  '个人观点，仅供参考' = 6,
}

/**
 * B站创作者申明
 */
export interface BiLiBiLiContentStatement {
  /**
   * 创作者申明
   * 0:不申明
   * 1：作者声明：该视频使用人工智能合成技术
   * 2：作者声明：视频内含有危险行为，请勿轻易模仿
   * 3：作者声明：该内容仅供娱乐，请勿过分解读
   * 4：作者声明：该内容可能引人不适，请谨慎选择观看
   * 5：作者声明：请理性适度消费
   * 6：作者声明：个人观点，仅供参考
   */
  type: BiLiBiLiStatementType;
}

/**
 * 哔哩哔哩平台视频表单
 * @description 哔哩哔哩视频发布表单的数据结构
 * @interface BilibiliVideoPlatformBody
 */
export interface BilibiliVideoPlatformBody {
  /**
   * 视频文件
   * @type {VideoFormItem}
   * @description 视频文件的表单项
   *
   * 约束条件：
   * - 必填
   * - 最大文件大小16GB
   * - 最大时长10小时
   */
  video: VideoFormItem;

  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 视频封面的表单项
   *
   * 约束条件：
   * - 必填，至少1张封面图
   * - 最大文件大小5MB
   */
  covers: ImageInfo[];

  /**
   * 视频标题
   * @type {string}
   * @description 视频的标题文本
   *
   * 约束条件：
   * - 必填
   * - 最大长度80个字符
   * @example "我的第一个B站视频"
   */
  title: string;

  /**
   * 视频描述
   * @type {string}
   * @description 视频的描述内容
   *
   * 约束条件：
   * - 必填
   * - 最大长度2000个字符
   *
   * 格式要求：
   * - 支持HTML格式：内容应该用 `<p>` 标签包裹，支持多个 `<p>` 标签
   * - 支持B站特殊标签和格式
   * - 不支持话题标签（使用独立的tags字段）
   * @example "<p>这是一个关于技术分享的视频</p><p>欢迎大家观看和讨论</p>"
   */
  desc?: string;

  /**
   * 视频标签
   * @type {string[]}
   * @description 视频的标签列表，用于分类和搜索
   *
   * 约束条件：
   * - 必填，至少1个标签
   * - 最多10个标签
   * - 每个标签最大长度20个字符
   * @example ["技术", "编程", "教程"]
   */
  tags: string[];

  /**
   * 参与话题，与普通视频标签/话题搜索独立。
   *
   * 数据来源于 Bilibili.getBilibiliVideoParticipationTopic 或
   * Cloud.QueryWorker.getParticipationTopicList/getActivityList，需完整保留 raw。
   */
  participationTopic?: ListItemInfo;

  /**
   * 兼容统一发布任务中的 activity 字段；在B站仅表示参与话题，不表示普通话题。
   */
  activity?: ListItemInfo;

  /**
   * 视频分类
   * @type {ListItemInfo}
   * @description 视频的一级分类信息，来源于分类接口的选项
   *
   * 约束条件：
   * - 必填，至少选择1个分类
   */
  category: ListItemInfo;

  /**
   * 内容声明
   * @type {BiLiBiLiContentStatement}
   * @description 内容声明选项，可选字段，用于标识内容类型或来源
   *
   * 约束条件：
   * - 当不提供时，表示"无需声明"
   */
  statement?: BiLiBiLiContentStatement;

  /**
   * 内容类型
   * @type {BilibiliVideoContentType}
   * @description 视频的内容类型，可选字段，默认为不设置
   * 1:自制
   * 2:转载
   */
  createType?: BilibiliVideoContentType;

  /**
   * 原文url链接，当内容类型为转载时，必填
   */
  contentSourceUrl?: string;

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
   *
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

  /**
   * 合集信息
   * 来源于获取合集列表接口选项
   * @type{ListItemInfo}
   */
  collection?: ListItemInfo;
}

/**
 * 哔哩哔哩平台文章表单
 * @description 哔哩哔哩文章发布表单的数据结构
 * @interface BilibiliArticlePlatformBody
 */
export interface BilibiliArticlePlatformBody {
  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 文章封面的表单项
   *
   * 约束条件：
   * - 最小像素尺寸160x160
   * - 最大文件大小10MB
   */
  covers?: ImageInfo[];

  /**
   * 文章标题
   * @type {string}
   * @description 文章的标题文本
   *
   * 约束条件：
   * - 必填
   * - 最小长度9个字符
   * - 最大长度100个字符
   */
  title: string;

  /**
   * 文章正文内容
   * @type {string}
   * @description 文章的正文内容，HTML格式
   *
   * 约束条件：
   * - 必填
   * - 最大长度20000个字符
   *
   * 格式要求：
   * - HTML格式：内容应该用 `<div>` 标签包裹
   * @example "<div><p>这是一篇精彩的文章内容</p></div>"
   */
  content: string;

  /**
   * 标签，可选
   */
  tags?: Array<string>;

  /**
   * 创作类型
   * 0:不申明
   * 1:申明原创
   * 默认不申明
   */
  createType?: BilibiliArticleContentType;

  /**
   * 一级分类
   * @type {ListItemInfo}
   * @description 视频的分类信息，可选字段，来源与分类接口
   *
   */
  category?: ListItemInfo;

  /**
   * 视频二级分类
   * @type {ListItemInfo}
   * @description 对应的一级分类没有二级分类时，可选，来源分类接口
   *
   */
  subCategory?: ListItemInfo;

  /**
   * 定时发布时间
   * @type {number}
   * @description 文章的定时发布13位时间戳，可选字段
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：2小时
   * - 最大间隔：7天
   */
  prePubTime?: number;

  /**
   * 存搞搞/直接发布
   * 0:存草稿
   * 1:直接发布
   * @type {number}
   */
  pubType: PubType;
}

/**
 * 哔哩哔哩高权益
 */
export interface BiLiBiLiPrivilege {
  /**
   * 合集权限
   * @type{boolean}
   */
  collection_permission: boolean;
}
