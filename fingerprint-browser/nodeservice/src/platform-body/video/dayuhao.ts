import { VideoFormItem, PubType } from '../common';
import { ImageInfo, ListItemInfo } from '@/media-platform';

/**
 * 大鱼号内容类型枚举
 * @description 爱奇艺平台支持的视频内容创作类型
 * 0:非原创
 * 1:原创
 */
export enum DaYuHaoContentType {
  '非原创' = 0,
  '原创' = 1,
}
/**
 * 大鱼号平台视频表单
 * @description 大鱼号视频发布表单的数据结构
 * @interface DaYuHaoVideoPlatformBody
 */
export interface DaYuHaoVideoPlatformBody {
  /**
   * 视频文件
   * @type {VideoFormItem}
   * @description 视频文件的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小12GB，必须包含音频轨道
   */
  video: VideoFormItem;

  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 视频封面的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小5MB
   */
  covers: ImageInfo[];

  /**
   * 视频标题
   * @type {string}
   * @description 视频的标题文本，必填字段
   *
   * 约束条件：
   * - 最大长度30个字符
   * @example "大鱼号视频分享"
   */
  title: string;

  /**
   * 视频描述
   * @type {string}
   * @description 视频的描述内容，必填字段
   *
   * 约束条件：
   * - 最大长度100个字符
   *
   * 格式要求：
   * - 支持HTML格式：内容应该用 `<p>` 标签包裹，支持多个 `<p>` 标签
   * - 不支持话题标签（使用独立的tags字段）
   * @example "<p>这是一个精彩的视频内容</p>"
   */
  desc: string;

  /**
   * 视频标签
   * @type {string[]}
   * @description 视频的标签列表，必填字段，用于分类和推荐
   *
   * 约束条件：
   * - 必须至少包含1个标签
   * - 最多支持5个标签
   * - 每个标签最大长度30个字符
   * @example ["生活", "娱乐", "分享"]
   */
  tags: string[];

  /**
   * 创作类型，1:原创，0:非原创
   * @type {DaYuHaoContentType}
   * @description 视频的内容类型，可选字段
   *
   * 默认值：
   * - "原创类型"
   */
  createType?: DaYuHaoContentType;

  /**
   * 内容分类
   * @type {ListItemInfo}
   * @description 视频的内容分类，可选字段

   */
  category?: ListItemInfo;

  /**
   * 定时发布时间
   * @type {number}
   * @description 视频的定时发布13位时间戳，可选字段
   *
   * 约束条件：
   * - 当值为null时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：1小时
   * - 最大间隔：7天
   */
  prePubTime?: number;

  /**
   * 存草稿/直接发布
   * @type {number}
   * @description 发布类型选择
   * 0:草稿
   * 1:直接发布
   */
  pubType: PubType;

  /**
   * 信息来源
   * @type {DaYuHaoContentStatement}
   * @description 内容声明选项，可选字段，用于标识内容类型或来源
   *
   * 约束条件：
   * - 当不提供时，表示"无需声明"
   */
  statement?: DaYuHaoContentStatement;
}

/**
 * 0:无需申明
 * 3:虚构演绎
 * 4:AI生成
 */
export enum DaYuHaoStatementType {
  NONE = 0,
  FICTION = 3,
  AIGC = 4,
}

/**
 * 大鱼号申明
 */
export interface DaYuHaoContentStatement {
  /**
   * -
   * 0:无需申明
   * 3:虚构演绎
   * 4:AI生成
   */
  type: DaYuHaoStatementType;
}

/**
 * 大鱼号平台文章表单
 * @description 大鱼号文章发布表单的数据结构
 * @interface DaYuHaoArticlePlatformBody
 */
export interface DaYuHaoArticlePlatformBody {
  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 文章封面的表单项
   *
   * 约束条件：
   * - 可选，至少1张封面图
   * - 最小像素尺寸200x96
   */
  covers?: ImageInfo[];

  /**
   * 竖版封面图
   * @type {ImageInfo[]}
   * @description 文章竖版封面的表单项
   *
   * 约束条件：
   * - 可选，至少1张竖版封面图
   */
  verticalCovers?: ImageInfo[];

  /**
   * 文章标题
   * @type {string}
   * @description 文章的标题文本
   *
   * 约束条件：
   * - 必填
   * - 最小长度5个字符
   * - 最大长度50个字符
   * @example "大鱼号文章分享"
   */
  title: string;

  /**
   * 文章正文内容
   * @type {string}
   * @description 文章的正文内容，HTML格式
   *
   * 约束条件：
   * - 必填
   * - 最小长度9个字符
   * - 最大长度20000个字符
   *
   * 格式要求：
   * - HTML格式：内容应该用 `<div>` 标签包裹
   * @example "<div><p>这是一篇精彩的文章内容</p></div>"
   */
  content: string;

  /**
   * 信息来源
   * @type {DaYuHaoContentStatement}
   * @description 内容声明选项，可选字段，用于标识内容类型或来源
   *
   * 约束条件：
   * - 当不提供时，表示"无需声明"
   */
  statement?: DaYuHaoContentStatement;

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
   * 存草稿/直接发布
   * @type {number}
   * @description 发布类型选择
   * 0:存草稿
   * 1:直接发布
   */
  pubType: PubType;
}
