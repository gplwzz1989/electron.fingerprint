import { VideoFormItem } from '@/cloud/model/UIFormModel';
import { ImageInfo, ListItemInfo } from '@/media-platform';
import { VideoFormItem2 } from '@/platform-body/common';

/**
 * 美拍视频平台表单
 * @description 美拍视频发布表单的数据结构
 * @interface MeiPaiVideoPlatformBody
 */
export interface MeiPaiVideoPlatformBody {
  /**
   * 视频文件
   * @type {VideoFormItem2}
   * @description 视频文件的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小1.5GB
   * -最大时长 15分钟
   */
  video: VideoFormItem2;

  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 视频封面的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小5MB
   * -最小分辨率360*360
   */
  covers: ImageInfo[];

  /**
   * 视频标题
   * @type {string}
   * @description 视频的标题文本，必填字段
   *
   * 约束条件：
   * - 最大长度20个字符，最小长度1个字符
   * @example "阿加莎"
   */
  title: string;

  /**
   * 视频描述
   * @type {string}
   * @description 视频的描述内容，必填字段
   *
   * 约束条件：
   * - 最大长度140个字符，最小长度0个字符
   *
   * 格式要求：
   * - 支持HTML格式：内容应该用 `<p>` 标签包裹，支持多个 `<p>` 标签
   * - 不支持话题标签（使用独立的tags字段）
   * @example "<p>这是一个精彩的视频内容</p><p>欢迎观看和分享</p>"
   */
  desc?: string;

  /**
   * 视频一级分类
   * 来源于分类接口列表选项
   * @type {ListItemInfo}
   * @description 视频的分类信息，可选字段
   *
   *
   */
  category?: ListItemInfo;

  /**
   * 视频二级分类
   * 来源于一级分类子类
   * @type {ListItemInfo}
   * @description 视频的分类信息，可选字段
   *
   *
   */
  subCategory?: ListItemInfo;

  /**
   * 定时发布时间
   * @type {number}
   * @description 视频的定时发布13位时间戳，可选字段
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：1小时
   * - 最大间隔：7天
   */
  prePubTime?: number;
}
