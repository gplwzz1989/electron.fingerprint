import { VideoFormItem, PubType } from '../common';
import { ImageInfo, ListItemInfo } from '@/media-platform';

/**
 * 头条可见类型
 */
export enum TouTiaoHaoVisibleType {
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
 * 头条号平台表单
 * @description 头条号视频发布表单的数据结构
 * @interface TouTiaoHaoVideoPlatformBody
 */
export interface TouTiaoHaoVideoPlatformBody {
  /**
   * 视频文件
   * @type {VideoFormItem}
   * @description 视频文件的表单项
   *
   * 约束条件：
   * - 必填
   * - 最大文件大小32GB
   * - 最大时长180分钟
   */
  video: VideoFormItem;

  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 视频封面的表单项
   *
   * 约束条件：
   * - 必填，至少1张封面图
   * - 最大文件大小20MB
   */
  covers: ImageInfo[];

  /**
   * 视频标题
   * @type {string}
   * @description 视频的标题文本
   *
   * 约束条件：
   * - 必填
   * - 最大长度80个字符
   * @example "头条号视频分享"
   */
  title: string;

  /**
   * 视频描述
   * @type {string}
   * @description 视频的描述内容
   *
   * 约束条件：
   * - 必填
   * - 最大长度400个字符
   *
   * 格式要求：
   * - 支持HTML格式：内容应该用 `<p>` 标签包裹，支持多个 `<p>` 标签
   * - 支持头条号特殊标签和格式
   * - 不支持话题标签（使用独立的tags字段）
   * @example "<p>这是一个精彩的视频内容</p><p>欢迎大家观看和分享</p>"
   */
  desc: string;

  /**
   * 视频标签
   * @type {string[]}
   * @description 视频的标签列表，必填字段，用于分类和推荐
   *
   * 约束条件：
   * - 必须至少包含1个标签
   * - 最多支持5个标签
   * - 每个标签无长度限制
   * @example ["科技", "生活", "分享"]
   */
  tags: string[];

  /**
   * 创作内容声明
   * @type {TouTiaoContentStatement}
   * @description 内容声明选项，可选字段，用于标识内容类型或来源
   *
   * 约束条件：
   * - 当不提供时，表示"无需声明"
   */
  statement?: TouTiaoContentStatement;

  /**
   * 定时发布时间
   * @type {number}
   * @description 视频的定时发布13位时间戳，可选字段
   *
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：2小时
   * - 最大间隔：7天
   */
  prePubTime?: number;

  /**
   * 存草稿/直接发布
   * @type {number}
   * @description 发布类型选择
   * 0:存草稿
   * 1:直接发布
   */
  pubType: PubType;

  /**
   * 可见类型
   * @type {TouTiaoHaoVisibleType}
   * @description 视频发布的可见类型
   * 0:公开
   * 1:私密
   *
   *
   */
  visibleType: TouTiaoHaoVisibleType;
}

/**
 * 1:自行拍摄
 * 2:取自站外
 * 3:AI生成
 * 6:虚构演绎，故事经历
 * 7:投资观点，仅供参考
 * 8:健康医疗分享，仅供参考
 */
export enum TouTiaoStatementType {
  SELF_SHOT = 1,
  FROM_OUT = 2,
  AIGC = 3,
  LIFE_STORY = 6,
  INVESTMENT_VIEW = 7,
  HEALTH_SHARE = 8,
}

/**
 * 1:取材网络
 * 2:个人观点，仅供参考
 * 3:引用AI
 * 6:虚构演绎,故事经历
 * 7:投资观点,仅供参考
 * 8:健康医疗分享,仅供参考
 */
export enum TouTiaoArticleStatementType {
  NET_WORK = 1,
  PERSON = 2,
  AIGC = 3,
  STORY = 6,
  MONEY = 7,
  HEALTH = 8,
}

/**
 * 头条申明
 */
export interface TouTiaoContentStatement {
  /**
   * 申明类型
   * -
   * 1:自行拍摄
   * 2:取自站外
   * 3:AI生成
   * 6:虚构演绎，故事经历
   * 7:投资观点，仅供参考
   * 8:健康医疗分享，仅供参考
   */
  type: TouTiaoStatementType;
}
/**
 * 头条文章申明
 */
export interface TouTiaoArticleContentStatement {
  /**
   * 申明类型
   * -
   * 1:取材网络
   * 2:个人观点，仅供参考
   * 3:引用AI
   * 6:虚构演绎,故事经历
   * 7:投资观点,仅供参考
   * 8:健康医疗分享,仅供参考
   *  */
  type: TouTiaoArticleStatementType;
}
/**
 * 头条号平台文章表单
 * @description 头条号文章发布表单的数据结构
 * @interface TouTiaoHaoArticlePlatformBody
 */
export interface TouTiaoHaoArticlePlatformBody {
  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 文章封面的表单项
   *
   * 约束条件：
   * - 必填，至少1张封面图
   * - 最小像素尺寸372x248
   * - 最大文件大小20MB
   */
  covers: ImageInfo[];

  /**
   * 文章标题
   * @type {string}
   * @description 文章的标题文本
   *
   * 约束条件：
   * - 必填
   * - 最小长度2个字符
   * - 最大长度30个字符
   * @example "头条号文章分享"
   */
  title: string;

  /**
   * 头条首发
   * @type {boolean}
   * @description 是否在头条首发，可选字段
   *
   * 约束条件：
   * - 需要权限
   * @example true
   */
  isFirst: boolean;

  /**
   * 发布位置(城市)
   * @type {ListItemInfo}
   * @description 文章发布的地理位置信息（标记城市），可选字段，使用"获取地理位置"接口获取
   *
   */
  location?: ListItemInfo;

  /**
   * 文章正文内容
   * @type {string}
   * @description 文章的正文内容，HTML格式
   *
   * 约束条件：
   * - 必填
   * - 最小长度1个字符
   * - 最大长度20000个字符
   *
   * 格式要求：
   * - HTML格式：内容应该用 `<div>` 标签包裹
   * @example "<div><p>这是一篇精彩的文章内容</p></div>"
   */
  content: string;

  /**
   * 广告投放赚取收益
   * @type{TouTiaoAdType}
   * 2：不投广告
   * 3：投放广告赚取收益
   */
  advertisement: TouTiaoAdType;

  /**
   * 作品申明
   * @type {TouTiaoArticleContentStatement}
   * @description 内容声明选项，可选字段，用于标识内容类型或来源
   *
   * 约束条件：
   * - 当不提供时，表示"无需声明"
   */
  statement?: TouTiaoArticleContentStatement;

  /**
   * 定时发布时间
   * @type {number}
   * @description 文章的定时发布13位时间戳，可选字段
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：2小时
   * - 最大间隔：7天
   */
  prePubTime?: number;

  /**
   * 存草稿/直接发布
   * @type {number}
   * @description 发布类型选择
   * 0:存草稿
   * 1:直接发布
   */
  pubType: PubType;
}

/**
 * 头条平台图文表单
 * @description 头条图文发布表单的数据结构
 * @interface TouTiaoDynamicPlatformBody
 */
export interface TouTiaoDynamicPlatformBody {
  /**
   * 要发布的图片列表
   * @type {ImageInfo[]}
   * @description 要发布的图片列表
   *
   * 约束条件：
   * - 可选
   * - 最大体积15MB
   * - 最多18张图
   */
  images?: ImageInfo[];

  /**
   * 图文描述
   * @type {string}
   * @description 图文的描述内容，支持HTML格式和话题标签
   *
   * 约束条件：
   * - 必填
   * - 最大长度500个字符
   * - 最多4个话题，每个话题最大长度500个字符
   *
   * 格式要求：
   * - 支持HTML格式：内容应该用 `<p>` 标签包裹，支持多个 `<p>` 标签
   * - 支持话题标签：使用 `<topic text="话题文本">#话题文本</topic>` 格式，每个话题最大长度9个字符
   * - 可以混合使用HTML标签和话题标签
   * @example "<p>这是一个关于 <topic text="话题文本">#话题文本</topic> 的视频</p><p>记录美好时光</p>"
   */
  desc: string;

  /**
   * 作品申明
   * @type {TouTiaoArticleContentStatement}
   * @description 内容声明选项，可选字段，用于标识内容类型或来源
   *
   * 约束条件：
   * - 当不提供时，表示"无需声明"
   */
  statement?: TouTiaoArticleContentStatement;

  /**
   * 存草稿/直接发布
   * @type {number}
   * @description 发布类型选择，默认直接发布
   * 0:存草稿
   * 1:直接发布
   */
  pubType?: PubType;
}

export enum TouTiaoAdType {
  disable = 2,
  enable = 3,
}

/**
 * 头条高权益
 */
export interface TouTiaoPrivilege {
  /**
   *  是否有定投放广告权限
   *  @type{boolean}
   */
  has_ad_permission: boolean;
}
