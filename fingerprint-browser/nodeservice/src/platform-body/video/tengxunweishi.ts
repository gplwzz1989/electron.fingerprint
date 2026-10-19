import { VideoFormItem, VideoFormItem2 } from '../common';
import { ImageInfo } from '@/media-platform';

/**
 * 微视可见类型
 */
export enum WeiShiVisibleType {
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
 * 腾讯微视平台表单
 * @description 腾讯微视视频发布表单的数据结构
 * @interface TengXunWeiShiVideoPlatformBody
 */
export interface TengXunWeiShiVideoPlatformBody {
  /**
   * 视频文件
   * @type {VideoFormItem2}
   * @description 视频文件的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小300MB，最大时长3分钟，编码格式限制：AVC
   */
  video: VideoFormItem2;

  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 视频封面的表单项，必填字段
   *
   * 约束条件：
   * - 最小像素尺寸300x400
   */
  covers: ImageInfo[];

  /**
   * 视频标题
   * @type {string}
   * @description 视频的标题文本，必填字段
   *
   * 约束条件：
   * - 无长度限制
   * @example "腾讯微视短视频"
   */
  title: string;

  /**
   * 视频描述
   * @type {string}
   * @description 视频的描述内容，必填字段，支持HTML格式和话题标签
   *
   * 约束条件：
   * - 最大长度200个字符
   *
   * 格式要求：
   * - 支持HTML格式：内容应该用 `<p>` 标签包裹，支持多个 `<p>` 标签
   * - 可以混合使用HTML标签和话题标签
   * @example "<p>这是一个关于 <topic text="话题文本">#话题文本</topic> 的视频</p><p>记录美好时光</p>"
   */
  desc: string;

  /**
   * 定时发布时间
   * @type {number}
   * @description 视频的定时发布13位时间戳，可选字段
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：1小时
   * - 最大间隔：14天
   */
  prePubTime?: number;

  /**
   * 可见类型
   * @type {WeiShiVisibleType}
   * @description 视频发布的可见类型
   * 0:公开
   * 1:私密
   *
   *
   */
  visibleType: WeiShiVisibleType;
}
