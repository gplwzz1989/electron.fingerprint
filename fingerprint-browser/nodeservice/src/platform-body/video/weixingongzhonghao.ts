import { ImageInfo, ListItemInfo } from '@/media-platform';
import { VideoFormItem } from '@/platform-body/common';

/**
 * 微信公众号平台消息表单
 * @description 微信公众号平台消息表单结构
 * @interface WeiXinGongZhongHaoMessagePlatformBody
 */
export interface WeiXinGongZhongHaoMessagePlatformBody {
  /**
   * 定时发布时间
   * @type {number}
   * @description 文章的定时发布13位时间戳，可选字段
   *
   * 格式要求：
   * - Unix时间戳（毫秒）
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：2小时
   * - 最大间隔：7天
   */
  prePubTime?: number;

  /**
   * 是否直接发布
   * 0:存草稿
   * 1:直接发布
   * @type {number}
   */
  pubType: 0 | 1;

  /**
   * 是否群发
   * 0:不群发
   * 1:群发
   * @type {number}
   */
  notifySubscribers: 0 | 1;

  /**
   * 群发性别，默认为全部
   * 0:全部
   * 1：男
   * 2:女
   * @type {number}
   */
  sex?: 0 | 1 | 2;

  /**
   * 群发地区-国家名称，默认全部
   */
  country?: string;
  /**
   * 群发地区-省份名称
   */
  province?: string;
  /**
   * 群发地区-城市名称
   */
  city?: string;

  /**
   * 消息中的文章列表，最多8篇
   * @type {WeiXinGongZhongHaoArticleContentItem[]}
   */
  contentList: Array<WeiXinGongZhongHaoArticleContentItem>;
}

/**
 * 是否原创
 * 0:不申明
 * 1:申明原创
 * @type {1 | 0}
 */
export enum WeiXinGongZhongHaoContentType {
  Original = 1,
  None = 0,
}

export interface WeiXinGongZhongHaoArticleContentItem {
  /**
   * 文章标题 ,纯文本，最多64字
   */
  title: string;

  /**
   * 内容的html字符串
   * 投票、公众号卡片、视频号内容等都嵌入到html里面相应位置
   * 公众号数据:
   * eg:公众号卡片使用自定义标签'account-card' data属性值为encodeURIComponent编码的公众号用户数据
   * 视频号内容数据:
   * eg:视频号内容卡片使用自定义标签'video-card' data属性值为encodeURIComponent编码的视频号内容数据
   * @example 公众号卡片: "<p><account-card data='%7B%22yixiaoerId%22%3A%22123%22%2C%22yixiaoerName%22%3A%22%E5%B0%8F%E4%BA%8C%22%2C%22raw%22%3A%7B%7D%7D'></account-card></p>"
   * @example 视频号卡片: "<p><video-card data='%7B%22yixiaoerId%22%3A%22123%22%2C%22yixiaoerName%22%3A%22%E5%B0%8F%E4%BA%8C%22%2C%22raw%22%3A%7B%7D%7D'></video-card></p>"
   */
  content: string;

  /**
   * 文章摘要,纯文本，最多129字
   */
  desc?: string;

  /**
   *  封面
   *  @type{ImageInfo}
   */
  cover: ImageInfo;

  /**
   * 创作类型,
   * 0:不申明
   * 1:申明原创
   * @type {number}
   */
  createType: WeiXinGongZhongHaoContentType;

  /**
   * 作者名称，可选。在申明原创时，必选
   * 最多8个字
   */
  authorName?: string;

  /**
   * 申明原创时,一级分类
   * @type{ListItemInfo}
   */
  category?: ListItemInfo;

  /**
   * 申明原创时,二级分类
   * @type{ListItemInfo}
   */
  subCategory?: ListItemInfo;

  // /**
  //  * 是否开启打赏
  //  * 1:开启
  //  * 0:不开启
  //  */
  // canReward?: 0 | 1;

  /**
   * 原文链接
   */
  contentSourceUrl?: string;

  // /**
  //  * 是否开启留言,和快捷私信互斥
  //  * 0:关闭 1:关注用户 2:关注7天以上用户 3:所有
  //  */
  // needOpenComment: 0 | 1 | 2 | 3;

  // /**
  //  * 允许回复留言的类型
  //  * 5:所有用户，精选后展示，2:所有用户,3:已关注的用户,4:已关注7天以上用户
  //  */
  // needOpenReply: 2 | 3 | 4 | 5;

  // /**
  //  * 创作来源
  //  * claim_source_type 4:个人观点 ,3:内容剧情演绎,2:素材来源于官方媒体，1:内容由AI生成 0:不声明
  //  */
  // contentSource?: 0 | 1 | 2 | 3 | 4;

  /**
   * 快捷私信，与开启留言互斥，申明原创后可开启
   * 0:不开启
   * 1:开启
   * @type {number}
   */
  openFansMsg?: 0 | 1;

  // /**
  //  * 不允许平台推荐
  //  * 0：允许
  //  * 1：不允许
  //  */
  // disableRecommend: 0 | 1;

  /**
   * 申明原创时，快捷转载
   * 0：关闭
   * 1：开启
   * @type {number}
   */
  allowFastReprint?: 0 | 1;
}

/**
 * 微信公众号贴图平台消息表单
 * @description 微信公众号贴图平台消息表单结构
 * @interface  WeiXinGongZhongHaoDynamicPlatformBody
 */
export interface WeiXinGongZhongHaoDynamicPlatformBody {
  /**
   * 定时发布时间
   * @type {number}
   * @description 文章的定时发布13位时间戳，可选字段
   *
   * 格式要求：
   * - Unix时间戳（毫秒）
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：2小时
   * - 最大间隔：7天
   */
  prePubTime?: number;

  /**
   * 是否直接发布
   * 0:存草稿
   * 1:直接发布
   * @type {number}
   */
  pubType: 0 | 1;

  /**
   * 是否群发
   * 0:不群发
   * 1:群发
   * @type {number}
   */
  notifySubscribers: 0 | 1;

  /**
   * 群发性别，默认为全部
   * 0:全部
   * 1：男
   * 2:女
   * @type {number}
   */
  sex?: 0 | 1 | 2;

  /**
   * 标题，最多20字
   * @type {string}
   */
  title?: string;

  /**
   * 描述，最多1000字
   * @type {string}
   */
  desc?: string;

  /**
   * 图片列表
   * @type {ImageInfo[]}
   */
  images: Array<ImageInfo>;

  /**
   * 权益选项:是否开启留言
   * 0:不开启，默认值
   * 1:开启，允许关注用户留言
   * 2:开启，允许关注7天及以上用户留言
   * 3:开启，允许所有留言
   */
  needOpenComment?: number;

  /**
   * 创作来源
   * @type{WeiXinGongZhongHaoDynamicStatement}
   */
  statement?: WeiXinGongZhongHaoDynamicStatement;

  /**
   * 不允许平台推荐
   * 默认0:允许
   * 0:允许
   * 1:不允许
   * @type {number}
   */
  disableRecommend: 0 | 1;
}

export interface WeiXinGongZhongHaoDynamicStatement {
  /**
   * 创作来源
   * 0:无需申明
   * 1:内容有AI生产
   * 3:内容剧情演绎，仅供娱乐
   * 4:个人观点，仅供参考
   * 5:健康医疗分享，仅供参考
   * 6:投资观点，仅供参考
   * @type {WeiXinGongZhongHaoDynamicStatementType}
   */
  type: WeiXinGongZhongHaoDynamicStatementType;
}

/**
 *来源类型
 */
export enum WeiXinGongZhongHaoDynamicStatementType {
  none = 0,
  aigc = 1,
  funny = 3,
  person = 4,
  healthy = 5,
  money = 6,
}

/**
 * 微信公众号平台视频消息表单
 * @description 微信公众号平台视频消息表单结构
 * @interface WeiXinGongZhongHaoMessagePlatformBody
 */
export interface WeiXinGongZhongHaoVideoMessagePlatformBody {
  /**
   * 定时发布时间
   * @type {number}
   * @description 文章的定时发布13位时间戳，可选字段
   *
   * 格式要求：
   * - Unix时间戳（毫秒）
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：2小时
   * - 最大间隔：7天
   */
  prePubTime?: number;

  /**
   * 是否直接发布
   * 0:存草稿
   * 1:直接发布
   * @type {number}
   */
  pubType: 0 | 1;

  /**
   * 是否群发
   * 0:不群发
   * 1:群发
   * @type {number}
   */
  notifySubscribers: 0 | 1;

  // /**
  //  * 群发性别，默认为全部
  //  * 0:全部
  //  * 1：男
  //  * 2:女
  //  * @type {number}
  //  */
  // sex?: 0 | 1 | 2;
  //
  // /**
  //  * 群发地区-国家名称，默认全部
  //  */
  // country?: string;
  // /**
  //  * 群发地区-省份名称
  //  */
  // province?: string;
  // /**
  //  * 群发地区-城市名称
  //  */
  // city?: string;

  /**
   * 消息中的视频列表，最多8篇
   * @type {WeiXinGongZhongHaoVideoContentItem[]}
   */
  contentList: Array<WeiXinGongZhongHaoVideoContentItem>;
}

export interface WeiXinGongZhongHaoVideoContentItem {
  /**
   * 文章标题 ,纯文本，最多64字
   */
  title: string;

  /**
   * 文章摘要,纯文本，最多300字
   */
  desc?: string;

  /**
   *  封面
   *  @type{ImageInfo}
   */
  cover: ImageInfo;

  /**
   * 视频文件
   * @type {VideoFormItem}
   * @description 视频文件的表单项，必填字段
   *
   * 约束条件：
   * - 不超过1小时
   */
  video: VideoFormItem;

  /**
   * 创作类型,
   * 0:不申明
   * 1:申明原创
   * @type {number}
   */
  createType: WeiXinGongZhongHaoContentType;

  /**
   * 权益选项:是否开启留言
   * 0:不开启，默认值
   * 1:开启，允许关注用户留言
   * 2:开启，允许关注7天及以上用户留言
   * 3:开启，允许所有留言
   */
  needOpenComment?: number;

  /**
   * 创作来源
   * @type{WeiXinGongZhongHaoDynamicStatement}
   */
  statement?: WeiXinGongZhongHaoDynamicStatement;

  /**
   * 不允许平台推荐
   * 默认0:允许
   * 0:允许
   * 1:不允许
   * @type {number}
   */
  disableRecommend: 0 | 1;
}
