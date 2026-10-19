import { PubType } from '@/platform-body/common';
import { ImageInfo, ListItemInfo } from '@/media-platform';

/**
 * 快传号平台文章表单
 * @description 快传号文章发布表单的数据结构
 * @interface KuaiChuanHaoArticlePlatformBody
 */
export interface KuaiChuanHaoArticlePlatformBody {
  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 文章封面的表单项
   *
   * 约束条件：
   * - 必填，至少1张封面图
   * - 最小像素尺寸160x160
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
   * - 最小长度9个字符
   * - 最大长度100个字符
   * @example "快传号文章分享"
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
   * 最多1个 ，实际对应官方的话题
   */
  tags?: Array<string>;

  /**
   * 创作类型
   * -
   * 0:不申明
   * 1:申明原创
   */
  createType: KuaiChuanContentType;

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
   * 发布类型选择
   * -
   * 0:存草稿
   * 1:直接发布
   * @type {number}
   */
  pubType: PubType;
}

/**
 * 快传号内容类型枚举
 * @description 快传号平台支持的视频内容类型
 * 0:不申明
 * 1:申明原创
 * @type {1 | 0}
 */
export enum KuaiChuanContentType {
  Original = 1,
  None = 0,
}
