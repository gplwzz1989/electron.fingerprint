import { VideoFormItem } from '@/cloud/model/UIFormModel';
import { ImageInfo } from '@/media-platform';
import { VideoFormItem2 } from '@/platform-body/common';

/**
 * 美柚视频平台表单
 * @description 美柚视频发布表单的数据结构
 * @interface MeiYouVideoPlatformBody
 */
export interface MeiYouVideoPlatformBody {
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
   * 定时发布时间
   * @type {number}
   * @description 视频的定时发布13位时间戳，可选字段
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：2小时
   * - 最大间隔：7天
   */
  prePubTime?: number;
}
