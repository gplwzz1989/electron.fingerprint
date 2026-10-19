import { PubType } from '@/platform-body/common';
import { ImageInfo } from '@/media-platform';
import { YiDianHaoContentStatement } from '@/platform-body/video/yidianhao';

/**
 * 雪球号平台文章表单
 * @description 雪球号文章发布表单的数据结构
 * @interface XueQiuHaoArticlePlatformBody
 */
export interface XueQiuHaoArticlePlatformBody {
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

  /**
   * 雪球号可见类型
   * @type{XueQiuHaoVisibleType}
   * -
   * 0:公开
   * 1:私密
   */
  visibleType: XueQiuHaoVisibleType;
  /**
   * 创作声明
   * @type {XueQiuHaoStatement}
   * @description 内容声明选项，可选字段，用于标识内容类型或来源
   *
   * 约束条件：
   * - 当不提供时，表示"无声明"
   */
  statement?: XueQiuHaoStatement;

  /**
   * 发布类型选择
   * @type{number}
   * 0:存草稿
   * 1:直接发布
   */
  pubType: PubType;
}

/**
 * 雪球号可见类型
 */
export enum XueQiuHaoVisibleType {
  /**
   * 公开
   */
  public = 0,
  /**
   * 私密/尽自己可见
   */
  private = 1,
}

/**
 * 雪球号创作申明
 */
export interface XueQiuHaoStatement {
  /**
   * 0:不申明
   * 1:本文包含AI生产内容
   */
  type: XueQiuHaoStatementType;
}
/**
 * 雪球号申明
 * 0:不申明
 * 1:本文包含AI生产内容
 */
export enum XueQiuHaoStatementType {
  /**
   * 不申明
   */
  none = 0,
  /**
   * 私密/尽自己可见
   */
  AIGC = 1,
}
