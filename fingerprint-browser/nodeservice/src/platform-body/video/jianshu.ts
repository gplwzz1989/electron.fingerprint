import { PubType } from '@/platform-body/common';

/**
 * 简书平台文章表单
 * @description 简书文章发布表单的数据结构
 * @interface JianShuArticlePlatformBody
 */
export interface JianShuArticlePlatformBody {
  /**
   * 文章标题
   * @type {string}
   * @description 文章的标题文本
   *
   * 约束条件：
   * - 必填
   * - 最小长度1个字符
   * - 最大长度100个字符
   * @example "文章分享"
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
   * 发布类型选择
   * -
   * 0:存草稿
   * 1:直接发布
   * @type {number}
   */
  pubType: PubType;
}
