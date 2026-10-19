import { VideoFormItem } from '@/cloud/model/UIFormModel';
import { ImageInfo } from '@/media-platform';
import { PubType, VideoFormItem2 } from '@/platform-body/common';

/**
 * 1：内容由AI生成
 * 2：剧情演绎，仅供娱乐
 * 3：取材网络，谨慎甄别
 * 4：个人观点，仅供参考
 */
export enum TengXunShiPinStatementType {
  AIGC = 1,
  ONLY_FOR_FUN = 2,
  FROM_OUTSITE = 3,
  PERSONAL_VIEW = 4,
}
/**
 * 腾讯视频申明
 * -
 * 1：内容由AI生成
 * 2：剧情演绎，仅供娱乐
 * 3：取材网络，谨慎甄别
 * 4：个人观点，仅供参考
 */
export interface TengXunShiPinContentStatement {
  /**
   *创作内容申明
   * -
   * 1：内容由AI生成
   * 2：剧情演绎，仅供娱乐
   * 3：取材网络，谨慎甄别
   * 4：个人观点，仅供参考
   */
  type: TengXunShiPinStatementType;
}

/**
 * 腾讯视频平台表单
 * @description 腾讯视频发布表单的数据结构
 * @interface TengXunShiPinVideoPlatformBody
 */
export interface TengXunShiPinVideoPlatformBody {
  /**
   * 视频文件
   * @type {VideoFormItem2}
   * @description 视频文件的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小20GB
   * -最短时长 5秒
   * -最大时长 90分钟
   */
  video: VideoFormItem2;

  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 视频封面的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小5MB
   * -最小分辨率640*360
   */
  covers: ImageInfo[];

  /**
   * 视频标题
   * @type {string}
   * @description 视频的标题文本，必填字段
   *
   * 约束条件：
   * - 最大长度80个字符，最小长度1个字符
   * @example "阿加莎"
   */
  title: string;

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
   * @type {TengXunShiPinContentStatement}
   * @description 内容声明选项，可选字段，用于标识内容类型或来源
   *
   * 约束条件：
   * - 当不提供时，表示"无需声明"
   */
  statement?: TengXunShiPinContentStatement;

  /**
   * 布类型选择
   * @type {number}
   * 0:存草稿
   * 1:直接发布
   */
  pubType: PubType;

  /**
   * 定时发布时间
   * @type {number}
   * @description 视频的定时发布13位时间戳，可选字段
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：0分钟（立即发布）,15分钟以上为定时发布
   * - 最大间隔：15天
   */
  prePubTime?: number;
}
