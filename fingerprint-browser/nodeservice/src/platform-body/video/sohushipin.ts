/*
 *创作内容申明
 * 0：无需申明
 * 3：AI生成
 * 4：虚构演绎
 * 5：AI数字人生成
 */
import { PubType, VideoFormItem } from '@/platform-body/common';
import { ImageInfo } from '@/media-platform';

export enum SouHuShiPinStatementType {
  '无需申明' = 0,
  'AI生成' = 3,
  '虚构演绎' = 4,
  'AI数字人生成' = 5,
}

/**
 * 搜狐视频申明
 * -
 * 0：无需申明
 * 3：AI生成
 * 4：虚构演绎
 * 5：AI数字人生成
 *
 */
export interface SouHuShiPinContentStatement {
  /**
   * -
   * 0：无需申明
   * 3：AI生成
   * 4：虚构演绎
   * 5：AI数字人生成
   */
  type: SouHuShiPinStatementType;
}

/**
 * 搜狐视频平台表单
 * @description 搜狐视频好视频发布表单的数据结构
 * @interface SouHuShiPinVideoPlatformBody
 */
export interface SouHuShiPinVideoPlatformBody {
  /**
   * 视频文件
   * @type {VideoFormItem}
   * @description 视频文件的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小4GB
   */
  video: VideoFormItem;

  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 视频封面的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小8MB
   * -最小分辨率640*480
   */
  covers: ImageInfo[];

  /**
   * 视频标题
   * @type {string}
   * @description 视频的标题文本，必填字段
   *
   * 约束条件：
   * - 最大长度100个字符，最小长度1个字符
   * @example "搜狐号视频分享"
   */
  title: string;

  /**
   * 视频描述
   * @type {string}
   * @description 视频的描述内容，必填字段
   *
   * 约束条件：
   * - 最大长度300个字符，最小长度0个字符
   *
   * 格式要求：
   * - 支持HTML格式：内容应该用 `<p>` 标签包裹，支持多个 `<p>` 标签
   * - 不支持话题标签（使用独立的tags字段）
   * @example "<p>这是一个精彩的视频内容</p><p>欢迎观看和分享</p>"
   */
  desc?: string;

  /**
   * 视频标签
   * @type {string[]}
   * @description 视频的标签列表，必填字段，用于分类和推荐
   *
   * 约束条件：
   * - 可选
   * @example ["生活", "娱乐", "分享"]
   */
  tags?: string[];

  /**
   * 创作内容声明
   * @type {SouHuShiPinContentStatement}
   * @description 内容声明选项，可选字段，用于标识内容类型或来源
   *
   * 约束条件：
   * - 当不提供时，表示"无需声明"
   */
  statement?: SouHuShiPinContentStatement;

  /**
   * 存草稿/直接发布
   * 0:存草稿
   * 1:直接发布
   * @type{number}
   */
  pubType: PubType;

  /**
   * 可见类型
   * @type {SoHuShiPinVisibleType}
   * @description 视频发布的可见类型
   * 0:公开
   * 1:私密
   * 默认公开
   *
   */
  visibleType: SoHuShiPinVisibleType;
}

/**
 * 搜狐视频可见类型
 * 0:公开
 * 1:私密
 */
export enum SoHuShiPinVisibleType {
  /**
   * 公开
   */
  public = 0,
  /**
   * 私密/尽自己可见
   */
  private = 1,
}
