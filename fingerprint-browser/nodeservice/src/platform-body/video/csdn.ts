import { PubType } from '@/platform-body/common';
import { ImageInfo } from '@/media-platform';

/**
 * CSDN平台文章表单
 * @description CSDN文章发布表单的数据结构
 * @interface CSDNArticlePlatformBody
 */
export interface CSDNArticlePlatformBody {
  /**
   * 文章标题
   * @type {string}
   * @description 文章的标题文本
   *
   * 约束条件：
   * - 必填
   * - 最小长度9个字符
   * - 最大长度30个字符
   */
  title: string;

  /**
   * 文章描述/摘要
   * @type {string}
   * @description 文章的摘要/描述
   *
   * 约束条件：
   * - 必填
   * - 最小长度9个字符
   * - 最大长度100个字符
   */
  desc: string;

  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 视频封面的表单项
   *
   * 约束条件：
   * - 必填，至少1张封面图
   */
  covers: ImageInfo[];

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

  // /**
  //  * 话题，最多1个   ---根据业务，调整为标签
  //  */
  // topics?: Array<ListItemInfo>;

  /**
   * 文章标签关键词
   * 最多7个标签
   */
  tags: Array<string>;

  /**
   * 创作类型,
   * 1:原创，原创时默认无声明
   * 2:转载
   * 4:翻译
   */
  createType: CSDNContentType;

  /**
   * 原文链接，当创作类型为转载时必须
   */
  contentSourceUrl?: string;

  /**
   * 可见类型
   *
   * 0:公开
   * 1：自己可见
   * @type {number}
   */
  visibleType: number;

  /**
   * 发布类型选择
   *
   * 0:存草稿
   * 1:直接发布
   * @type {number}
   */
  pubType: PubType;

  /**
   * CSDN创作申明
   * 默认不申明
   * @type{CSDNStatement}
   */
  statement?: CSDNStatement;

  /**
   * 定时发布时间
   * @type {number}
   * @description 视频的定时发布13位时间戳，可选字段
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：2小时
   * - 最大间隔：14天
   * @example 1672531200000 (表示2023-01-01 00:00:00)
   */
  prePubTime?: number;
}

/**
 * csdn内容类型枚举
 * @description 豆瓣平台支持的视频内容类型
 * 1:申明原创,原创时默认无声明
 * 2:转载
 * 4:翻译
 * @type {1 | 0| 2|4}
 */
export enum CSDNContentType {
  Original = 1,
  forward = 2,
  translate = 4,
}

/**
 * CSDN创作申明
 */
export interface CSDNStatement {
  /**
   * 0：无声明
   * 1:不分内容由AI辅助生成
   * 2:内容来源网络，继续整合/再创作
   * 3:个人观点，仅供参考
   */
  type: CSDNStatementType;
}

/**
 * 0：无声明
 * 1:不分内容由AI辅助生成
 * 2:内容来源网络，继续整合/再创作
 * 3:个人观点，仅供参考
 */
export enum CSDNStatementType {
  None = 0,
  AIGC = 1,
  NETWORK = 2,
  PERSONAL = 3,
}
