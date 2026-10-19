import { VideoFormItem } from '@/cloud/model/UIFormModel';
import { ImageInfo, ListItemInfo } from '@/media-platform';
import { PubType, VideoFormItem2 } from '@/platform-body/common';

/**
 * 车家号视频平台表单
 * @description 车家号视频发布表单的数据结构
 * @interface CheJiaHaoVideoPlatformBody
 */
export interface CheJiaHaoVideoPlatformBody {
  /**
   * 视频文件
   * @type {VideoFormItem2}
   * @description 视频文件的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小1.5GB
   * -最大时长 15分钟
   */
  video: VideoFormItem2;

  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 视频封面的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小5MB
   * -最小分辨率360*360
   */
  covers: ImageInfo[];

  /**
   * 竖版封面
   * @type {ImageInfo[]}
   * @description 视频竖版封面的表单项，可选字段(横版视频生效)
   */
  verticalCovers?: ImageInfo[];

  /**
   * 视频标题
   * @type {string}
   * @description 视频的标题文本，必填字段
   *
   * 约束条件：
   * - 最大长度20个字符，最小长度6个字
   * @example "阿加莎"
   */
  title: string;

  /**
   * 视频描述
   * @type {string}
   * @description 视频的描述内容，必填字段
   *
   * 约束条件：
   * - 最大长度100个字符，最小长度10个字符
   *
   * 格式要求：
   * - 支持HTML格式：内容应该用 `<p>` 标签包裹，支持多个 `<p>` 标签
   * - 不支持话题标签（使用独立的tags字段）
   * @example "<p>这是一个精彩的视频内容</p><p>欢迎观看和分享</p>"
   */
  desc: string;

  /**
   * 定时发布时间
   * @type {number}
   * @description 视频的定时发布13位时间戳，可选字段
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：1小时
   * - 最大间隔：7天
   */
  prePubTime?: number;

  /**
   *  创作类型类型
   *  1:原创
   *  3:首发
   *  13:原创首发
   * @type {CheJiaHaoVideoContentType}
   */
  createType?: CheJiaHaoVideoContentType;

  /**
   * 存草稿/直接发布
   * @type{number}
   * 0:存草稿
   * 1:直接发布
   */
  pubType: PubType;
}

/**
 * 创作类型
 * 1:原创
 * 3:首发
 * 13:原创首发
 */
export enum CheJiaHaoVideoContentType {
  '原创' = 1,
  '首发' = 3,
  '原创首发' = 13,
}

/**
 * 车家号平台文章表单
 * @description 车家号文章发布表单的数据结构
 * @interface CheJiaHaoArticlePlatformBody
 */
export interface CheJiaHaoArticlePlatformBody {
  /**
   * 文章标题
   * @type {string}
   * @description 文章的标题文本
   *
   * 约束条件：
   * - 必填
   * - 最小长度6个字符
   * - 最大长度30个字符
   * @example "网易号文章分享"
   */
  title: string;

  /**
   * 横版封面，支持单封面和3封面，4：3
   */
  covers: Array<ImageInfo>;

  /**
   * 竖版封面，3:4,目前支持一张竖版封面
   */
  verticalCovers: Array<ImageInfo>;

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
   * 发布类型选择
   * 0:存草稿
   * 1:直接发布
   * @type {PubType}
   */
  pubType: PubType;

  /**
   *  创作类型类型
   *  1:原创
   *  3:首发
   *  13:原创首发
   * @type {CheJiaHaoVideoContentType}
   */
  createType?: CheJiaHaoVideoContentType;

  /**
   * 定时发布时间
   * @type {number}
   * @description 定时发布13位时间戳，可选字段
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：30分钟
   * - 最大间隔：15天
   */
  prePubTime?: number;
}
