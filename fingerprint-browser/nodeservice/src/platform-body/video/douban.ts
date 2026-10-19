import { PubType } from '@/platform-body/common';

/**
 * 豆瓣平台文章表单
 * @description豆瓣文章发布表单的数据结构
 * @interface DouBanArticlePlatformBody
 */
export interface DouBanArticlePlatformBody {
  /**
   * 文章标题
   * @type {string}
   * @description 文章的标题文本
   *
   * 约束条件：
   * - 必填
   * - 最小长度9个字符
   * - 最大长度100个字符
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
   * 话题标签关键词
   */
  tags?: Array<string>;

  /**
   * 创作类型
   * 0:不申明
   * 1:申明原创
   */
  createType: DouBanContentType;

  /**
   * 可见类型
   * 0:公开
   * 1：自己可见
   * @type {number}
   */
  visibleType: number;

  /**
   * 发布类型选择(废弃-不再支持)
   * 0:存草稿
   * 1:直接发布
   * @type {number}
   */
  pubType: PubType;
}

/**
 * 豆瓣内容类型枚举
 * @description 豆瓣平台支持的视频内容类型0:不申明  1:申明原创
 * @type {1 | 0}
 */
export enum DouBanContentType {
  Original = 1,
  None = 0,
}
