import { PubType } from '@/platform-body/common';
import { ImageInfo, ListItemInfo } from '@/media-platform';

/**
 * wifi万能钥匙平台文章表单
 * @description wifi万能钥匙文章发布表单的数据结构
 * @interface WifiWanNengArticlePlatformBody
 */
export interface WifiWanNengArticlePlatformBody {
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
   * 封面，支持单封面和3封面
   */
  covers: Array<ImageInfo>;

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
   * 分类
   * @type{ListItemInfo}
   */
  category?: ListItemInfo;

  /**
   * 发布类型选择
   * -
   * 0:存草稿
   * 1:直接发布
   * @type {number}
   */
  pubType: PubType;
}
