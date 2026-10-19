import { GoodsItemInfo, ImageInfo } from '@/media-platform';
import { VideoFormItem } from '@/platform-body/common';

/**
 * 创作内容声明类型
 */
export enum TaoBaoGuangHeStatementType {
  '内容无需标注' = 0,
  '含AI生成内容' = 1,
  '含虚构演绎内容' = 2,
  '内容为转载' = 4,
  '个人观点，仅供参考' = 5,
  '内容含营销信息' = 6,
}

export interface TaoBaoGuangHeContentStatement {
  /**
   * 声明类型
   */
  type: TaoBaoGuangHeStatementType;

  /**
   * 当 type 为 4（内容为转载）时填写转载来源链接
   */
  forwardFrom?: string;
}

/**
 * 淘宝光合平台视频表单
 * @description 淘宝光合视频发布表单的数据结构
 * @interface TaoBaoGuangHeVideoPlatformBody
 *
 * 约束条件：
 * - title 和 desc 均为非必填
 */
export interface TaoBaoGuangHeVideoPlatformBody {
  /**
   * 视频文件
   * @type {VideoFormItem}
   * @description 视频文件的表单项，必填字段
   *
   * 约束条件：
   * - 必填
   * - localPath 和 url 至少提供一个
   */
  video: VideoFormItem;

  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 视频封面图的表单项，必填字段
   *
   * 约束条件：
   * - 必填，至少 1 张
   * - pathOrUrl 必填
   */
  covers: ImageInfo[];

  /**
   * 光合页面顶部标题
   * @type {string}
   * @description 光合页面顶部标题文本，可选字段，运行时映射为淘宝官方请求的 shortTitle
   *
   * 约束条件：
   * - 可选
   * - 最多 30 个字符
   */
  title?: string;

  /**
   * 视频描述
   * @type {string}
   * @description 视频描述文本，可选字段，支持普通文本、HTML 段落/换行和话题。
   *
   * 约束条件：
  
   * - 最多 1000 个字符
   */
  desc?: string;

  /**
   * 创作内容声明
   * @type {TaoBaoGuangHeContentStatement}
   * @description 内容声明选项，可选字段，用于标识内容类型或来源
   */
  statement?: TaoBaoGuangHeContentStatement;

  /**
   * 定时发布时间
   * @type {number}
   * @description 视频的定时发布时间，13 位毫秒时间戳，可选字段
   *
       * 约束条件：
       * - 未提供时立即发布
       */
  prePubTime?: number;

  /**
   * 是否允许下载
   * @type {boolean}
   * @description 是否允许用户下载视频，可选字段
   *
   * 约束条件：
   * - 默认值为 false
   */
  allow_download?: boolean;

  /**
   * 话题
   * @type {string[]}
   * @description 视频话题名称，可选字段
   *
   * 约束条件：
   * - 最多 4 个
   */
  tags?: string[];

  /**
   * 关联商品列表
   * @type {GoodsItemInfo[]}
   * @description 从淘宝光合商品选择器选择的商品，发布时最多关联 6 个
   *
   * 约束条件：
   * - 可选
   * - 最多 6 个
   * - 建议直接使用商品查询接口返回的完整选项（包括 raw）
   */
  shopping_cart?: Array<GoodsItemInfo>;
}

/**
 * 淘宝光合平台图文表单
 * @description 淘宝光合图文发布表单的数据结构
 *
 * 约束条件：
 * - title 和 desc 至少填写一个
 */
export interface TaoBaoGuangHeDynamicPlatformBody {
  /**
   * 图文图片
   * @type {ImageInfo[]}
   * @description 图文图片的表单项，必填字段
   *
   * 约束条件：
   * - 至少 1 张
   * - pathOrUrl 必填
   */
  images: ImageInfo[];

  /**
   * 光合页面顶部标题
   * @type {string}
   * @description 光合页面顶部标题文本，可选字段；与 desc 至少填写一个，运行时映射为淘宝官方请求的 shortTitle
   *
   * 约束条件：
   * - 最多 30 个字符
   */
  title?: string;

  /**
   * 图文描述
   * @type {string}
   * @description 图文描述文本，可选字段，支持普通文本、HTML 和话题
   *
   * 约束条件：
   * - 与 title 至少填写一个
   * - 最少 10 个字符
   * - 最多 1000 个字符
   */
  desc?: string;

  /**
   * 创作内容声明
   * @type {TaoBaoGuangHeContentStatement}
   * @description 内容声明选项，可选字段，用于标识内容类型或来源
   */
  statement?: TaoBaoGuangHeContentStatement;

  /**
   * 定时发布时间
   * @type {number}
   * @description 图文的定时发布时间，13 位毫秒时间戳，可选字段
   *
       * 约束条件：
       * - 未提供时立即发布
       */
  prePubTime?: number;

  /**
   * 话题
   * @type {string[]}
   * @description 图文话题名称，可选字段
   *
   * 约束条件：
   * - 最多 4 个
   */
  tags?: string[];

  /**
   * 关联商品列表
   * @type {GoodsItemInfo[]}
   * @description 从淘宝光合商品选择器选择的商品，发布时最多关联 6 个
   *
   * 约束条件：
   * - 可选
   * - 最多 6 个
   * - 建议直接使用商品查询接口返回的完整选项（包括 raw）
   */
  shopping_cart?: Array<GoodsItemInfo>;
}
