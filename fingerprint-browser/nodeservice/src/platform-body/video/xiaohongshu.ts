import { VideoFormItem, VideoFormItem2 } from '../common';
import { GoodsItemInfo, ImageInfo, ListItemInfo } from '@/media-platform';

/**
 * 小红书平台表单
 * @description 小红书视频发布表单的数据结构
 * @interface XiaoHongShuVideoPlatformBody
 * @note 小红书平台不包含声明字段
 */
export interface XiaoHongShuVideoPlatformBody {
  /**
   * 视频文件
   * @type {VideoFormItem2}
   * @description 视频文件的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小20GB，最大时长60分钟
   */
  video: VideoFormItem2;

  /**
   * 封面图
   * @type {XiaoHongShuImageInfo[]}
   * @description 视频封面的表单项，必填字段
   */
  covers: XiaoHongShuImageInfo[];

  /**
   * 视频标题
   * @type {string}
   * @description 视频的标题文本，必填字段
   *
   * 约束条件：
   * - 最大长度20个字符
   * @example "小红书生活分享"
   */
  title?: string;

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
   * 活动话题 实际上就是话题，获取活动列表使用活动接口，发布使用topic标签和话题使用方法一致
   *
   * friend标签@好友/用户使用,使用方法和topic标签一样使用raw属性存好友/用户数据，好友数据来源于 获取用户/好友列表 接口 raw='{"yixiaoerId":"123",raw:{"nick":"123\"}}'
   * @example "<p>这是一个关于 <topic text='搞笑' raw='{“yixiaoerId”:"1231","yixiaoerName":"搞笑",raw:{"id":"asdad","topic":"搞笑"}}'>#搞笑</topic> 的视频</p><p>记录美好时光</p>"
   */
  desc?: string;

  /**
   * 发布位置
   * 来源于地址搜索接口列表选项
   * @type {ListItemInfo}
   * @description 视频发布的地理位置信息
   *
   */
  location?: ListItemInfo;

  /**
   * 定时发布时间
   * @type { number}
   * @description 视频的定时发布13位时间戳
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
   * @type {XiaoHongShuVisibleType}
   * @description 视频发布的可见类型
   * -
   * 0：公开
   * 1：私密
   * 3：好友可见
   *
   */
  visibleType: XiaoHongShuVisibleType;

  /**
   * 创作内容声明
   * @type {XiaoHongShuContentStatement}
   * @description 内容声明选项，可选字段，用于标识内容类型或来源
   *
   * 约束条件：
   * - 当不提供时，表示"无需声明"
   */
  statement?: XiaoHongShuContentStatement;

  /**
   * 合集
   * @type{ListItemInfo}
   */
  collection?: ListItemInfo;

  /**
   * 申明创作类型
   * -
   * 1:原创
   * 0:不申明
   * 默认不申明
   * @type {XiaoHongShuCreateType}
   */
  createType?: XiaoHongShuCreateType;

  /**
   * 群聊
   * @type{ListItemInfo}
   */
  group?: ListItemInfo;

  /**
   * 关联直播预告
   * @type{ListItemInfo}
   */
  bind_live_info?: ListItemInfo;

  /**
   * 添加商品列表
   * @type{GoodsItemInfo[]}
   */
  shopping_cart?: Array<GoodsItemInfo>;
}

export enum XiaoHongShuCreateType {
  original = 1,
  none = 0,
}
/**
 * 内容类型申明
 * -
 * 1：虚构演绎，仅供娱乐
 * 2：笔记含ai合成内容
 * 3：已在正文中自主标注
 * 4：自行拍摄
 * 5：转载
 */
export enum XiaoHongShuStatementType {
  ONLY_FOR_FUN = 1,
  AIGC = 2,
  MARK = 3,
  OWN = 4,
  FORWARD = 5,
}

/**
 * 小红书申明
 */
export interface XiaoHongShuContentStatement {
  /**
   * 内容类型申明
   * -
   * 1：虚构演绎，仅供娱乐
   * 2：笔记含ai合成内容
   * 3：已在正文中自主标注
   * 4：自行拍摄
   * 5：转载
   */
  type: XiaoHongShuStatementType;

  /**
   * 自主拍摄信息，自主拍摄是可选
   * @type{PhotoInfo}
   */
  photoInfo?: PhotoInfo;

  /**
   * 转载来源，转载时可选
   * @type{string}
   */
  forward_source?: string;
}

export interface PhotoInfo {
  /**
   * 拍摄地点
   * @type{ListItemInfo}
   */
  address: ListItemInfo;
  /**
   * 拍摄时间戳
   * @type{number}
   */
  time: number;
}

/**
 * 小红书平台图文表单
 * @description 小红书图文发布表单的数据结构
 * @interface XiaoHongShuDynamicPlatformBody
 * @note 小红书平台不包含声明字段
 */
export interface XiaoHongShuDynamicPlatformBody {
  /**
   * 要发布的图片列表
   * @type {XiaoHongShuImageInfo[]}
   * @description 图文的图片列表
   *
   * 约束条件：
   * - 必填，至少1张图
   * - 最大体积20MB
   * - 最多18张图
   */
  images: XiaoHongShuImageInfo[];

  /**
   * 图文标题
   * @type {string}
   * @description 图文的标题文本
   *
   * 约束条件：
   * - 必填
   * - 最大长度20个字符
   * @example "小红书生活分享"
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
   * - 最多10个话题，每个话题最大长度14个字符
   *
   * 格式要求：
   * - 支持HTML格式：内容应该用 `<p>` 标签包裹，支持多个 `<p>` 标签
   * - 可以混合使用HTML标签和话题标签
   * 话题标签使用<topic>
   * topic标签 属性raw，存放话题接口返回列表的完整选项对象的json序列化字符串，比如raw='{“yixiaoerId”:"12312","yixiaoerName":"搞",raw:{"id":"asdad","topic":"搞笑"}}'
   * topic标签 属性text，存放话题文本（不带任何前缀后缀），当raw有值时，直接使用raw中的话题数据，当没有数据时，会自动根据text进行匹配话题
   *
   * 活动话题 实际上就是话题，获取活动列表使用活动接口，发布使用topic标签和话题使用方法一致
   *
   * friend标签@好友/用户使用,使用方法和topic标签一样使用raw属性存好友/用户数据，好友数据来源于 获取用户/好友列表 接口 raw='{"yixiaoerId":"123",raw:{"nick":"123\"}}'
   * @example "<p>这是一个关于 <topic text='搞笑' raw='{“yixiaoerId”:"1231","yixiaoerName":"搞笑",raw:{"id":"asdad","topic":"搞笑"}}'>#搞笑</topic> 的视频</p><p>记录美好时光</p>"
   */
  desc?: string;

  /**
   * 发布位置
   * 来源于地址搜索接口列表选项
   * @type {ListItemInfo}
   * @description 图文发布的地理位置信息
   *
   */
  location?: ListItemInfo;

  /**
   * 定时发布时间
   * @type {number}
   * @description 图文的定时发布13位时间戳
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：1小时
   * - 最大间隔：14天
   */
  prePubTime?: number;

  /**
   * 合集
   * @type{ListItemInfo}
   */
  collection?: ListItemInfo;

  /**
   * 可见类型
   * @type {XiaoHongShuVisibleType}
   * @description 视频发布的可见类型
   * -
   * 0:公开
   * 1:私密
   * 3:好友可见
   *
   */
  visibleType: XiaoHongShuVisibleType;
  /**
   * 创作内容声明
   * @type {XiaoHongShuContentStatement}
   * @description 内容声明选项，可选字段，用于标识内容类型或来源
   *
   * 约束条件：
   * - 当不提供时，表示"无需声明"
   */
  statement?: XiaoHongShuContentStatement;

  /**
   * 群聊
   * @type{ListItemInfo}
   */
  group?: ListItemInfo;

  /**
   * 关联直播预告
   * @type{ListItemInfo}
   */
  bind_live_info?: ListItemInfo;

  /**
   * 添加商品列表
   * @type{GoodsItemInfo[]}
   */
  shopping_cart?: Array<GoodsItemInfo>;

  /**
   * 申明创作类型
   * -
   * 1:原创
   * 0:不申明
   * 默认不申明
   * @type {XiaoHongShuCreateType}
   */
  createType?: XiaoHongShuCreateType;
}

/**
 * 小红书可见类型
 */
export enum XiaoHongShuVisibleType {
  /**
   * 公开
   */
  public = 0,
  /**
   * 私密/尽自己可见
   */
  private = 1,

  /**
   * 好友可见
   */
  friend = 3,
}

export interface XiaoHongShuImageInfo {
  /**
   * 封面宽度
   */
  width: number;
  /**
   * 封面高度
   */
  height: number;
  /**
   * 封面字节数大小
   */
  size: number;
  /**
   * 封面url或本地路径
   */
  pathOrUrl: string;

  /**
   * 图片格式
   */
  format: string;
}
