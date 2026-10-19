import { VideoFormItem } from '../common';
import { GoodsItemInfo, ImageInfo, ListItemInfo, MusicItemInfo } from '../../media-platform';

/**
 * 快手可见类型
 */
export enum KuaiShouVisibleType {
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
/**
 * 快手平台视频表单
 * @description 快手视频发布表单的数据结构
 * @interface KuaiShouVideoPlatformBody
 */
export interface KuaiShouVideoPlatformBody {
  /**
   * 视频文件
   * @type {VideoFormItem}
   * @description 视频文件的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小8GB，最大时长30分钟
   */
  video: VideoFormItem;

  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 视频封面的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小5MB
   */
  covers: ImageInfo[];

  /**
   * pk封面图
   * @type {ImageInfo}
   * @description pk封面开启发布后，系统会在10小时左右自动选取点击更高的封面作为最终封面
   *
   * 约束条件：
   * - 最大文件大小5MB
   */
  pk_cover?: ImageInfo;

  /**
   * 视频标题
   * @type {string}
   * @description 视频的标题文本，必填字段
   *
   * 约束条件：
   * - 无长度限制（快手平台不限制标题长度）
   * @example "快手短视频分享"
   */
  title?: string;

  /**
   * 视频描述
   * @type {string}
   * @description 视频的描述内容，必填字段，支持HTML格式和话题标签
   *
   * 约束条件：
   * - 最大长度500个字符
   *
   * 格式要求：
   * - 支持HTML格式：内容应该用 `<p>` 标签包裹，支持多个 `<p>` 标签
   * - 可以混合使用HTML标签和话题标签
   * 话题标签使用<topic>
   * topic标签 属性raw，存放话题接口返回列表的完整选项对象的json序列化字符串，比如raw='{“yixiaoerId”:"12312","yixiaoerName":"搞",raw:{"id":"asdad","topic":"搞笑"}}'
   * topic标签 属性text，存放话题文本（不带任何前缀后缀），当raw有值时，直接使用raw中的话题数据，当没有数据时，会自动根据text进行匹配话题
   *
   * 活动推荐 实际上就是话题，获取活动列表使用活动接口，发布使用topic标签和话题使用方法一致
   *
   * friend标签 @好友/用户使用,使用方法和topic标签一样使用raw属性存好友/用户数据，好友数据来源于 获取用户/好友列表 接口 raw='{"yixiaoerId":"123",raw:{"nick":"123\"}}'
   * @example "<p>这是一个关于 <topic text='搞笑' raw='{“yixiaoerId”:"1231","yixiaoerName":"搞笑",raw:{"id":"asdad","topic":"搞笑"}}'>#搞笑</topic> 的视频</p><p>记录美好时光</p>"
   */
  desc?: string;

  /**
   * 创作内容声明
   * @type {KuaiShouContentStatement}
   * @description 内容声明选项，可选字段，用于标识内容类型或来源
   *
   * 约束条件：
   * - 当不提供时，表示"无需声明"
   */
  statement?: KuaiShouContentStatement;

  /**
   * 发布位置
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
   * - 最小间隔：1小时
   * - 最大间隔：14天
   */
  prePubTime?: number;

  /**
   * 可见类型
   * @type {KuaiShouVisibleType}
   * @description 视频发布的可见类型
   * -
   * 0:公开
   * 1:私密
   * 3:好友可见
   *
   */
  visibleType: KuaiShouVisibleType;

  /**
   * 关联商品
   * @type{GoodsItemInfo}
   * 数据来源于获取商品列表选项
   */
  shopping_cart?: GoodsItemInfo;

  /**
   * 挂载小程序
   * 数据来源于获取/解析小程序接口列表的选项
   * @description 购物车和小程序互斥
   * @type{ListItemInfo}
   */
  mini_app?: ListItemInfo;

  /**
   * 合集信息
   * 来源于获取合集列表接口选项
   * @type{ListItemInfo}
   */
  collection?: ListItemInfo;

  /**
   * 是否同城展示,默认为true
   * @type{boolean}
   */
  nearby_show?: boolean;

  /**
   * 是否允许同框，默认false不允许
   * @type{boolean}
   */
  allow_same_frame?: boolean;

  /**
   * 是否允许下载，默认false，不允许
   * @type{boolean}
   */
  allow_download?: boolean;
}

/**
 * -
 * 1：内容为ai生成
 * 2：演绎情节，仅供娱乐
 * 3:个人观点，仅供参考
 */
export enum KuaiShouStatementType {
  AIGC = 1,
  ONLY_FOR_FUN = 2,
  PERSONAL_VIEW = 3,
}

/**
 * 快手申明
 */
export interface KuaiShouContentStatement {
  /**
   * 创作申明
   * -
   * 1：内容为ai生成
   * 2：演绎情节，仅供娱乐
   * 3:个人观点，仅供参考
   */
  type: KuaiShouStatementType;
}

/**
 * 快手平台图文表单
 * @description 快手图文发布表单的数据结构
 * @interface KuaiShouDynamicPlatformBody
 */
export interface KuaiShouDynamicPlatformBody {
  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 图文封面的表单项
   *
   * 约束条件：
   * - 必填，至少1张封面图
   */
  covers: ImageInfo[];

  /**
   * 要发布的图片列表
   * @type {ImageInfo[]}
   * @description 要发布的图片列表
   *
   * 约束条件：
   * - 必填，至少1张图
   * - 最大体积15MB
   * - 最多31张图
   */
  images: ImageInfo[];

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
   * - 可以混合使用HTML标签和话题标签
   * 话题标签使用<topic>
   * topic标签 属性raw，存放话题接口返回列表的完整选项对象的json序列化字符串，比如raw='{“yixiaoerId”:"12312","yixiaoerName":"搞",raw:{"id":"asdad","topic":"搞笑"}}'
   * topic标签 属性text，存放话题文本（不带任何前缀后缀），当raw有值时，直接使用raw中的话题数据，当没有数据时，会自动根据text进行匹配话题
   *
   * 活动推荐  实际上就是话题，获取活动列表使用活动接口，发布使用topic标签和话题使用方法一致
   *
   * friend标签 @好友/用户使用,使用方法和topic标签一样使用raw属性存好友/用户数据，好友数据来源于 获取用户/好友列表 接口 raw='{"yixiaoerId":"123",raw:{"nick":"123\"}}'
   * @example "<p>这是一个关于 <topic text='搞笑' raw='{“yixiaoerId”:"1231","yixiaoerName":"搞笑",raw:{"id":"asdad","topic":"搞笑"}}'>#搞笑</topic> 的视频</p><p>记录美好时光</p>"
   */
  desc?: string;

  /**
   * 创作内容声明
   * @type {KuaiShouContentStatement}
   * @description 内容声明选项，可选字段，用于标识内容类型或来源
   *
   * 约束条件：
   * - 当不提供时，表示"无需声明"
   */
  statement?: KuaiShouContentStatement;

  /**
   * 发布位置
   * 来源于地址搜索接口列表选项
   * @type {ListItemInfo}
   * @description 图文发布的地理位置信息，可选字段
   *
   */
  location?: ListItemInfo;

  /**
   * 图文需要携带发布的音乐
   * 来源于搜索音乐接口列表选项
   * @type {MusicItemInfo}
   * @description 图文发布时携带的音乐，可选，来源与音乐接口
   *
   */
  music?: MusicItemInfo;

  /**
   * 定时发布时间
   * @type {number}
   * @description 图文的定时发布13位时间戳，可选字段
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
   * @type {KuaiShouVisibleType}
   * @description 视频发布的可见类型
   * -
   * 0:公开
   * 1：私密
   * 3:好友可见
   *
   */
  visibleType: KuaiShouVisibleType;

  /**
   * 关联商品
   * 数据来源于获取商品列表选项
   * @type{GoodsItemInfo}
   */
  shopping_cart?: GoodsItemInfo;

  /**
   * 挂载小程序
   * 数据来源于获取/解析小程序接口列表的选项
   * @description 购物车和小程序互斥
   * @type{ListItemInfo}
   */
  mini_app?: ListItemInfo;

  /**
   * 合集信息
   * 来源于获取合集列表接口选项
   * @type{ListItemInfo}
   */
  collection?: ListItemInfo;
}

/**
 * 快手高权益
 */
export interface KuaiShouPrivilege {
  /**
   * 小程序挂载权限
   * @type{boolean}
   */
  has_app_permission: boolean;

  /**
   * 购物车权限
   * @type{boolean}
   */
  shopping_cart: boolean;
}
