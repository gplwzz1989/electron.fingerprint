import { VideoFormItem, PubType, VideoFormItem2 } from '../common';
import { ActivityItemInfo, GoodsItemInfo, ImageInfo, ListItemInfo, MusicItemInfo } from '@/media-platform';

/**
 * 微信视频号原创类型枚举
 * @description 微信视频号平台支持的原创类型
 * 1:原创 2:非原创
 * @type {1 | 2}
 */
export enum WeiXinShiPinHaoOriginalType {
  '原创' = 1,
  '非原创' = 2,
}

/**
 * 微信视频号创作申明
 */
export enum WeiXinShiPinHaoStatementType {
  '无需标注' = 0,
  '含AI生成内容' = 1,
  '内容包含营销广告' = 2,
  '内容为虚构剧情，仅供娱乐' = 3,
  '内容为转载' = 7,
  '个人观点，仅供参考' = 8,
}

/**
 * 微信视频号创作申明
 */
export interface WeiXinShiPinHaoContentStatement {
  /**
   * 0:无需标注（默认值）
   * 1:含AI生成内容
   * 2:内容包含营销广告
   * 3:内容为虚构剧情，仅供娱乐
   * 7:内容为转载
   * 8:个人观点，仅供参考
   * @type{WeiXinShiPinHaoStatementType}
   */
  type: WeiXinShiPinHaoStatementType;

  /**
   * 内容为转载时，转载链接或者转载账号
   * @type{string}
   */
  repostSource?: string;
}

/**
 * 微信视频号平台表单
 * @description 微信视频号视频发布表单的数据结构
 * @interface WeiXinShiPinHaoVideoPlatformBody
 */
export interface WeiXinShiPinHaoVideoPlatformBody {
  /**
   * 视频文件
   * @type {VideoFormItem2}
   * @description 视频文件的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小4GB，最大时长120分钟
   */
  video: VideoFormItem2;

  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 视频封面的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小512KB
   */
  covers: ImageInfo[];

  /**
   * 横版封面(分享卡片)，视频为横版时支持
   * @type {ImageInfo}
   * @description 分享卡片显示的封面4:3
   */
  horizontalCover?: ImageInfo;

  /**
   * 短标题会出现在搜索、话题、活动、地点、订阅号消息、发现页红点等场景。
   * 6到16个字符
   */
  short_title?: string;

  /**
   * 视频描述
   * @type {string}
   * @description 视频的描述内容，必填字段，支持HTML格式和话题标签
   *
   * 约束条件：
   * - 最大长度1000个字符
   *
   * 格式要求：
   * - 支持HTML格式：内容应该用 `<p>` 标签包裹，支持多个 `<p>` 标签
   * - 可以混合使用HTML标签和话题标签
   * 话题标签使用<topic>
   * topic标签 属性raw，存放话题接口返回列表的完整选项对象的json序列化字符串，比如raw='{“yixiaoerId”:"12312","yixiaoerName":"搞",raw:{"id":"asdad","topic":"搞笑"}}'
   * topic标签 属性text，存放话题文本（不带任何前缀后缀），当raw有值时，直接使用raw中的话题数据，当没有数据时，会自动根据text进行匹配话题
   *
   * friend标签 @视频号,使用方法和topic标签一样使用raw属性存好友/用户数据，好友数据来源于 获取用户/好友列表 接口 raw='{"yixiaoerId":"123",raw:{"nick":"123\"}}'
   * @example "<p>这是一个关于 <topic text='搞笑' raw='{“yixiaoerId”:"1231","yixiaoerName":"搞笑",raw:{"id":"asdad","topic":"搞笑"}}'>#搞笑</topic> 的视频</p><p>记录美好时光</p>"
   */
  desc?: string;

  /**
   * 发布位置
   * 来源于地址搜索接口
   * @type {ListItemInfo}
   * @description 视频发布的地理位置信息，可选字段
   *
   */
  location?: ListItemInfo;

  /**
   * 定时发布时间
   * @type {number}
   * @description 视频的定时发布13位时间戳，可选字段
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：0分钟（立即发布）
   * - 最大间隔：30天
   */
  prePubTime?: number;

  /**
   * 原创类型
   * @type {WeiXinShiPinHaoOriginalType}
   * @description 视频的原创类型标识，必填字段
   * @warning 选择"原创"时，仅当账号支持原创功能时才有效
   */
  createType: WeiXinShiPinHaoOriginalType;

  /**
   * 创作申明（视频标注）
   */
  statement?: WeiXinShiPinHaoContentStatement;

  /**
   * 存草稿/直接发布
   * @type {number}
   * @description 发布类型选择
   * 0:存草稿
   * 1:直接发布
   */
  pubType: PubType;

  /**
   * 关联商品
   * 数据来源于获取商品列表选项
   * @type{GoodsItemInfo}
   */
  shopping_cart?: GoodsItemInfo;

  /**
   * 活动
   * 来源于活动接口列表选项
   * @type{ActivityItemInfo}
   */
  activity?: ActivityItemInfo;

  /**
   * 合集
   * @type{ListItemInfo}
   */
  collection?: ListItemInfo;

  /**
   * 视频号剧集（短剧）
   * 来源于短剧搜索接口列表选项
   * @type{ListItemInfo}
   */
  drama?: ListItemInfo;
}

/**
 * 微信视频号平台图文/动态表单
 * @description 微信视频号图文发布表单的数据结构
 * @interface WeiXinShiPinHaoVideoPlatformBody
 */
export interface WeiXinShiPinHaoDynamicPlatformBody {
  /**
   * 要发布的图片列表
   * @type {ImageInfo[]}
   * @description 图文的图片列表
   *
   * 约束条件：
   * - 必填，至少1张图
   * - 最大体积512KB
   * - 最多18张图
   */
  images: ImageInfo[];

  /**
   * 图文标题
   * @type {string}
   * @description 图文的标题文本
   *
   * 约束条件：
   * - 必填
   * - 最大长度22个字符
   * @example "微信视频号图文分享"
   */
  title?: string;

  /**
   * 图文描述
   * @type {string}
   * @description 图文的描述内容，支持HTML格式和话题标签
   *
   * 约束条件：
   * - 必填
   * - 最大长度1000个字符
   *
   * 格式要求：
   * - 支持HTML格式：内容应该用 `<p>` 标签包裹，支持多个 `<p>` 标签
   * - 可以混合使用HTML标签和话题标签
   * 话题标签使用<topic>
   * topic标签 属性raw，存放话题接口返回列表的完整选项对象的json序列化字符串，比如raw='{“yixiaoerId”:"12312","yixiaoerName":"搞",raw:{"id":"asdad","topic":"搞笑"}}'
   * topic标签 属性text，存放话题文本（不带任何前缀后缀），当raw有值时，直接使用raw中的话题数据，当没有数据时，会自动根据text进行匹配话题
   *
   * friend标签 @视频号,使用方法和topic标签一样使用raw属性存好友/用户数据，好友数据来源于 获取用户/好友列表 接口 raw='{"yixiaoerId":"123",raw:{"nick":"123\"}}'
   * @example "<p>这是一个关于 <topic text='搞笑' raw='{“yixiaoerId”:"1231","yixiaoerName":"搞笑",raw:{"id":"asdad","topic":"搞笑"}}'>#搞笑</topic> 的视频</p><p>记录美好时光</p>"
   */
  desc?: string;

  /**
   * 发布位置
   * 来源于位置搜索接口列表选项
   * @type {ListItemInfo}
   * @description 图文发布的地理位置信息
   *
   */
  location?: ListItemInfo;

  /**
   * 图文需要携带发布的音乐
   * 来源于音乐搜索接口列表选项
   * @type {MusicItemInfo}
   * @description 图文发布时携带的音乐
   *
   */
  music?: MusicItemInfo;

  /**
   * 定时发布时间
   * @type {number}
   * @description 图文的定时发布13位时间戳
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：2小时
   * - 最大间隔：30天

   */
  prePubTime?: number;

  /**
   * 创作申明（视频标注）
   */
  statement?: WeiXinShiPinHaoContentStatement;

  /**
   * 合集
   * @type{ListItemInfo}
   */
  collection?: ListItemInfo;

  /**
   * 关联商品
   * 数据来源于获取商品列表选项
   * @type{GoodsItemInfo}
   */
  shopping_cart?: GoodsItemInfo;

  /**
   * 视频号剧集
   * 来源于短剧搜索接口列表选项
   * @type{ListItemInfo}
   */
  drama?: ListItemInfo;

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
 * 视频号高权益
 */
export interface ShiPinHaoPrivilege {
  /**
   * 视频号剧集
   * @type{boolean}
   */
  drama: boolean;
}