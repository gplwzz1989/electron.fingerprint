import { VideoFormItem } from '@/cloud/model/UIFormModel';
import { ImageInfo, ListItemInfo } from '@/media-platform';
import { PubType, VideoFormItem2 } from '@/platform-body/common';
import { ContentCreateTypeEnum } from '@/cloud/model/TypeEnum';

/**
 * 易车号视频平台表单
 * @description 易车号视频发布表单的数据结构，包含标题、描述、标签、分类、声明和定时发布等字段
 * @interface YiCheHaoVideoPlatformBody
 */
export interface YiCheHaoVideoPlatformBody {
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
   * 竖版封面图
   * @type {ImageInfo[]}
   * @description 视频竖版封面的表单项，可选字段
   */
  verticalCovers?: ImageInfo[];

  /**
   * 视频标题
   * @type {string}
   * @description 视频的标题文本，必填字段
   *
   * 约束条件：
   * - 最大长度50个字符，最小长度1个字符
   * @example "阿加莎"
   */
  title: string;

  /**
   * 视频描述
   * @type {string}
   * @description 视频的描述内容，必填字段
   *
   * 约束条件：
   * - 最大长度400个字符，最小长度8个字符
   *
   * 格式要求：
   * - 支持HTML格式：内容应该用 `<p>` 标签包裹，支持多个 `<p>` 标签
   * - 不支持话题标签（使用独立的tags字段）
   * @example "<p>这是一个精彩的视频内容</p><p>欢迎观看和分享</p>"
   */
  desc?: string;

  /**
   * 作品声明
   * @type {YiCheHaoStatement}
   * @description 内容声明选项，可选字段，用于标识内容类型或来源
   */
  statement?: YiCheHaoStatement;

  /**
   * 允许转发，默认true
   * @type{boolean}
   */
  allowForward?: boolean;

  /**
   * 创作类型
   * 1:原创
   * 2:非原创
   * @type {number}
   * @description 目前支持原创、非原创
   */
  createType: number;

  /**
   * 定时发布时间
   * @type {number}
   * @description 视频的定时发布13位时间戳
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：1小时
   * - 最大间隔：7天
   */
  prePubTime?: number;
}

/**
 * 易车号文章平台表单
 * @description
 * @interface YiCheHaoHaoArticlePlatformBody
 */
export interface YiCheHaoHaoArticlePlatformBody {
  /**
   * 文章标题
   * @type {string}
   * @description 文章的标题文本
   *
   * 约束条件：
   * - 必填
   * - 最小长度1个字符
   * - 最大长度28个字符
   * @example "网易号文章分享"
   */
  title: string;

  /**
   * 文章正文内容
   * @type {string}
   * @description 文章的正文内容，HTML格式
   *
   * 约束条件：
   * - 必填
   *
   * 格式要求：
   * - HTML格式：内容应该用 `<div>` 标签包裹
   * @example "<div><p>这是一篇精彩的文章内容</p></div>"
   */
  content: string;

  /**
   * 封面图
   * 支持单封面和三封面
   * @type {ImageInfo[]}
   * @description 文章封面的表单项
   *
   * 约束条件：
   * - 最大文件大小10MB
   */
  covers: ImageInfo[];

  /**
   * 竖版封面图
   * 支持单个竖版封面
   * @type {ImageInfo[]}
   * @description 文章竖版封面的表单项
   *
   */
  verticalCovers: ImageInfo[];

  /**
   * 作品声明
   * @type {YiCheHaoStatement}
   * @description 内容声明选项，可选字段，用于标识内容类型或来源
   *
   * 约束条件：
   * - 当不提供时，表示"无声明"
   */
  statement?: YiCheHaoStatement;

  /**
   * 定时发布时间
   * @type {number}
   * @description 定时发布13位时间戳
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：1小时
   * - 最大间隔：7天
   */
  prePubTime?: number;

  /**
   * 发布类型选择
   * @type{number}
   * 0:存草稿
   * 1:直接发布
   */
  pubType: 0 | 1;

  /**
   * 话题
   * @type{ListItemInfo}
   */
  topics?: Array<ListItemInfo>;

  /**
   * 允许转发
   * @type{boolean}
   */
  allowForward?: boolean;

  /**
   * 允许生成摘要
   * @type{boolean}
   */
  allowAbstract?: boolean;
}

/**
 * 易车号创作申明
 */
export interface YiCheHaoStatement {
  /**
   * 易车号申明
   * 0:不申明
   * 1:个人观点，仅供参考
   * 2:内容来源于网络
   * 3:AI生成
   */
  type: YiCheHaoHaoStatementType;
}
/**
 * 易车号申明
 * 0:不申明
 * 1:个人观点，仅供参考
 * 2:内容来源于网络
 * 3:AI生成
 * 4:引用站内
 */
export enum YiCheHaoHaoStatementType {
  /**
   * 不申明
   */
  none = 0,
  /**
   * 私密/尽自己可见
   */
  PERSION = 1,
  NETWORK = 2,
  AIGC = 3,
  FROM_OWN = 4,
}
