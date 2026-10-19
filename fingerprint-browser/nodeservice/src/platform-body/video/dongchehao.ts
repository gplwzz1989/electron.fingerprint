import { ImageInfo } from '@/media-platform';
import { ContentCreateTypeEnum } from '@/cloud/model/TypeEnum';
import { PubType, VideoFormItem2 } from '@/platform-body/common';

/**
 * 懂车号视频平台表单
 * @description 懂车号视频发布表单的数据结构，支持视频上传、自定义封面、内容声明、定时发布、存草稿和直接发布。
 * 竖版视频无需横版封面；横版视频需同时提供横版和竖版封面。
 * @interface DongCheHaoVideoPlatformBody
 */
export interface DongCheHaoVideoPlatformBody {
  /**
   * 视频文件
   * @type {VideoFormItem2}
   * @description 视频文件的表单项，必填字段。
   */
  video: VideoFormItem2;

  /**
   * 横版封面图
   * @type {ImageInfo[]}
   * @description 视频横版封面的表单项；竖版视频无需传递，横版视频至少提供1张。
   * 发布时使用第一张图片；未提供时使用视频上传后由平台返回的自动封面。
   */
  covers?: ImageInfo[];

  /**
   * 竖版封面图
   * @type {ImageInfo[]}
   * @description 视频竖版封面的表单项，必填字段。发布时使用第一张图片，发送为懂车号的
   * `vertical_cover_image` 字段。
   */
  verticalCovers: ImageInfo[];

  /**
   * 视频标题
   * @type {string}
   * @description 视频的标题文本，必填字段
   *
   * 约束条件：
   * - 最大长度30个字符
   * @example "懂车号视频分享"
   */
  title: string;

  /**
   * 视频描述
   * @type {string}
   * @description 视频摘要，非必填，发布时写入懂车号视频描述字段。
   */
  desc?: string;

  /**
   * 内容声明
   * @type {DongCheHaoContentStatement}
   * @description 视频内容声明，必填字段。无需标注时请传入 `type: 0`。
   */
  statement: DongCheHaoContentStatement;

  /**
   * 定时发布时间
   * @type {number}
   * @description 视频的定时发布13位毫秒时间戳，可选字段；发布时转换为懂车号接口的 timer_time 秒级时间戳。
   */
  prePubTime?: number;

  /**
   * 存草稿/直接发布
   * @type {PubType}
   * @description 发布类型选择
   * 0:存草稿
   * 1:直接发布
   */
  pubType: PubType;
}

/**
 * 懂车号内容声明
 * @description 懂车号视频发布时使用的内容声明类型。
 * @interface DongCheHaoContentStatement
 */
export interface DongCheHaoContentStatement {
  /**
   * 声明类型
   * @type {DongCheHaoStatementType}
   * 0:内容无需标注
   * 1:内容含AI生成
   * 2:内容含虚构演绎
   * 3:内容含营销信息
   * 4:个人观点，仅供参考
   */
  type: DongCheHaoStatementType;
}

/**
 * 懂车号内容声明类型
 * 0:内容无需标注
 * 1:内容含AI生成
 * 2:内容含虚构演绎
 * 3:内容含营销信息
 * 4:个人观点，仅供参考
 */
export enum DongCheHaoStatementType {
  /** 内容无需标注 */
  none = 0,
  /** 内容含AI生成 */
  AIGC = 1,
  /** 内容含虚构演绎 */
  fictional = 2,
  /** 内容含营销信息 */
  marketing = 3,
  /** 个人观点，仅供参考 */
  personalOpinion = 4,
}

/**
 * 懂车号图文平台表单
 * @description 懂车号官方“车友说”图文动态发布表单的数据结构，仅支持描述和图片。
 * 当前接口不支持标题、封面、内容声明、定时发布或存草稿。
 * @interface DongCheHaoDynamicPlatformBody
 */
export interface DongCheHaoDynamicPlatformBody {
  /**
   * 图文描述
   * @type {string}
   * @description 图文动态的文字内容，非必填，发布时写入 `content` 字段。
   */
  desc?: string;

  /**
   * 图文图片
   * @type {ImageInfo[]}
   * @description 图文动态的图片列表，必填字段。
   *
   * 约束条件：
   * - 最多9张图片
   * - 重复图片会按图片地址去重，发布时仅使用前9张
   */
  images: ImageInfo[];
}

/**
 * 懂车号文章平台表单
 * @description 懂车号文章发布表单的数据结构，支持HTML图文混编、横竖版封面、广告投放、原创标记、
 * 定时发布、存草稿和直接发布。
 * @interface DongCheHaoArticlePlatformBody
 */
export interface DongCheHaoArticlePlatformBody {
  /**
   * 文章标题
   * @type {string}
   * @description 文章标题，必填字段。
   */
  title: string;

  /**
   * 文章正文内容
   * @type {string}
   * @description 文章正文内容，必填字段，支持HTML格式。正文中的图片会在发布前上传并替换为懂车号图片地址。
   *
   * 格式要求：
   * - HTML格式：内容应该用 `<div>` 或 `<p>` 标签包裹
   */
  content: string;

  /**
   * 横版封面图
   * @type {ImageInfo}
   * @description 文章横版封面，可选。提供后优先使用该图片；未提供时兼容使用 `covers`。
   */
  horizontalCover?: ImageInfo;

  /**
   * 竖版封面图
   * @type {ImageInfo}
   * @description 文章竖版封面，可选；未提供时使用第一张横版封面作为竖版封面。
   */
  verticalCover?: ImageInfo;

  /**
   * 横版封面图列表
   * @type {ImageInfo[]}
   * @description 兼容通用任务的横版封面列表，可选，最多使用3张。
   * 当 `horizontalCover` 已提供时，以 `horizontalCover` 为准。
   */
  covers?: ImageInfo[];

  /**
   * 广告投放选项
   * @type {2 | 3}
   * @description 文章广告投放设置，可选字段；不提供时默认投放广告。
   * 2:不投放广告
   * 3:投放广告
   */
  advertisement?: 2 | 3;

  /**
   * 创作类型
   * @type {ContentCreateTypeEnum}
   * @description 文章创作类型，可选字段。当前发布流程仅将 `original` 标记为原创，其余类型按非原创处理。
   */
  createType?: ContentCreateTypeEnum;

  /**
   * 定时发布时间
   * @type {number}
   * @description 文章的定时发布13位时间戳；不提供时立即发布。
   */
  prePubTime?: number;

  /**
   * 存草稿/直接发布
   * @type {PubType}
   * @description 发布类型选择
   * 0:存草稿
   * 1:直接发布
   */
  pubType: PubType;
}
