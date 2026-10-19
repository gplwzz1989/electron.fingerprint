import { VideoFormItem, PubType } from '../common';
import { ImageInfo, ListItemInfo } from '@/media-platform';

/**
 * 搜狐号平台表单
 * @description 搜狐号视频发布表单的数据结构
 * @interface SouHuHaoVideoPlatformBody
 */
export interface SouHuHaoVideoPlatformBody {
  /**
   * 视频文件
   * @type {VideoFormItem}
   * @description 视频文件的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小4GB
   */
  video: VideoFormItem;

  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 视频封面的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小10MB
   */
  covers: ImageInfo[];

  /**
   * 视频标题
   * @type {string}
   * @description 视频的标题文本，必填字段
   *
   * 约束条件：
   * - 最大长度72个字符，最小长度5个字符
   * @example "搜狐号视频分享"
   */
  title: string;

  /**
   * 视频描述
   * @type {string}
   * @description 视频的描述内容，必填字段
   *
   * 约束条件：
   * - 最大长度200个字符，最小长度5个字符
   *
   * 格式要求：
   * - 支持HTML格式：内容应该用 `<p>` 标签包裹，支持多个 `<p>` 标签
   * - 不支持话题标签（使用独立的tags字段）
   * @example "<p>这是一个精彩的视频内容</p><p>欢迎观看和分享</p>"
   */
  desc: string;

  /**
   * 视频标签
   * @type {string[]}
   * @description 视频的标签列表，必填字段，用于分类和推荐
   *
   * 约束条件：
   * - 必须至少包含1个标签
   * @example ["生活", "娱乐", "分享"]
   */
  tags: string[];

  /**
   * 视频一级分类
   * 来源于分类接口列表选项
   * @type {ListItemInfo}
   * @description 视频的分类信息，必填字段
   *
   * 约束条件：
   * - 必须选择至少一个分类
   *
   */
  category: ListItemInfo;

  /**
   * 视频二级分类
   * 来源于一级分类子类
   * @type {ListItemInfo}
   * @description 视频的分类信息，必填字段，
   *
   * 约束条件：
   * - 必须选择至少一个分类
   *
   */
  subCategory: ListItemInfo;

  /**
   * 信息来源
   * @type {SouHuHaoContentStatement}
   * @description 信息来源选项，可选字段，用于标识内容类型或来源
   *
   * 约束条件：
   * - 当不提供时，表示"无需声明"
   */
  statement?: SouHuHaoContentStatement;

  /**
   * 定时发布时间
   * @type {number}
   * @description 视频的定时发布13位时间戳，可选字段
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 具体时间限制由平台决定
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
 * 信息来源
 * 0:无特别声明
 * 1:引用申明
 * 2:自行拍摄
 * 3:包含AI创作内容
 * 4:包含虚构创作
 */
export enum SouHuHaoStatementType {
  '无特别声明' = 0,
  '自行拍摄' = 2,
  '包含AI创作内容' = 3,
  '包含虚构创作' = 4,
}

/**
 * 信息来源
 * 0:无特别声明
 * 3:包含AI创作内容
 * 4:包含虚构创作
 */
export enum SouHuHaoArticleStatementType {
  '无特别声明' = 0,
  '包含AI创作内容' = 3,
  '包含虚构创作' = 4,
}
/**
 * 搜狐号申明
 */
export interface SouHuHaoContentStatement {
  /**
   * 信息来源
   * -
   * 0:无特别声明
   * 1引用申明
   * 2自行拍摄
   * 3包含AI创作内容
   * 4包含虚构创作
   */
  type: SouHuHaoStatementType;
}

/**
 * 搜狐号文章申明
 */
export interface SouHuHaoArticleContentStatement {
  /**
   * 信息来源
   * -
   * 0:无特别声明
   * 3包含AI创作内容
   * 4包含虚构创作
   */
  type: SouHuHaoArticleStatementType;
}

/**
 * 搜狐号平台文章表单
 * @description 搜狐号文章发布表单的数据结构
 * @interface SouHuHaoArticlePlatformBody
 */
export interface SouHuHaoArticlePlatformBody {
  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 文章封面的表单项
   *
   * 约束条件：
   * - 必填，至少1张封面图
   * - 最大文件大小10MB
   */
  covers: ImageInfo[];

  /**
   * 文章标题
   * @type {string}
   * @description 文章的标题文本
   *
   * 约束条件：
   * - 必填
   * - 最小长度5个字符
   * - 最大长度72个字符
   * @example "搜狐号文章分享"
   */
  title: string;

  /**
   * 文章描述
   * @type {string}
   * @description 文章的描述内容，可选字段
   *
   * 约束条件：
   * - 最大长度200个字符
   * - 最小长度5个字符
   *
   * 格式要求：
   * - 纯文本
   * @example "这是一个精彩的文章描述/摘要"
   */
  desc: string;

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
   * 信息来源
   * @type {SouHuHaoArticleContentStatement}
   * @description 信息来源，可选字段，用于标识内容类型或来源
   *
   * 约束条件：
   * - 当不提供时，表示"无需声明"
   */
  statement?: SouHuHaoArticleContentStatement;

  /**
   * 定时发布时间
   * @type {number}
   * @description 文章的定时发布13位时间戳，可选字段
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：30分钟
   * - 最大间隔：4天
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
