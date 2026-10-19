import { VideoFormItem } from '../common';
import { GoodsItemInfo, ImageInfo, ListItemInfo } from '@/media-platform';

/**
 * 小红书商家号图文平台表单
 * @description 除商品挂载外，参数与小红书图文发布一致
 */
export interface XiaoHongShuShopDynamicPlatformBody {
  /**
   * 要发布的图片列表
   * @type {ImageInfo[]}
   * @description 图文的图片列表
   *
   * 约束条件：
   * - 必填，至少1张图
   * - 最大体积20MB
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
   * - 最大长度20个字符
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
   */
  desc?: string;

  /**
   * 发布位置
   * 来源于地址搜索接口列表选项
   * @type {ListItemInfo}
   * @description 图文发布的地理位置信息
   */
  location?: ListItemInfo;

  /**
   * 定时发布时间
   * @type {number}
   * @description 图文的定时发布13位时间戳
   */
  prePubTime?: number;

  /**
   * 可见类型
   * @type {XiaoHongShuShopVisibleType}
   * @description 图文发布的可见类型
   * -
   * 0:公开
   * 1:私密
   * 3:好友可见
   */
  visibleType: XiaoHongShuShopVisibleType;

  /**
   * 添加商品列表
   * @type {GoodsItemInfo[]}
   */
  shopping_cart?: Array<GoodsItemInfo>;

  /**
   * 申明创作类型
   * -
   * 1:原创
   * 0:不申明
   * 默认不申明
   * @type {XiaoHongShuShopCreateType}
   */
  createType?: XiaoHongShuShopCreateType;
}

/**
 * 小红书商家号平台表单
 * @description 小红书视频发布表单的数据结构
 * @interface XiaoHongShuShopVideoPlatformBody
 * @note 小红书平台不包含声明字段
 */
export interface XiaoHongShuShopVideoPlatformBody {
  /**
   * 视频文件
   * @type {VideoFormItem}
   * @description 视频文件的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小20GB，最大时长60分钟
   */
  video: VideoFormItem;

  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 视频封面的表单项，必填字段
   */
  covers: ImageInfo[];

  /**
   * 视频标题
   * @type {string}
   * @description 视频的标题文本，必填字段
   *
   * 约束条件：
   * - 最大长度20个字符
   * @example "小红书生活分享"
   */
  title: string;

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
   * - 支持表情符号和特殊字符
   * - 可以混合使用HTML标签和话题标签
   * @example "<p>这是一个关于 <topic text="话题文本">#话题文本</topic> 的视频</p><p>记录美好时光</p>"
   */
  desc: string;

  /**
   * 发布位置
   * @type {ListItemInfo}
   * @description 视频发布的地理位置信息，可选字段，来源于地址接口
   *
   */
  location?: ListItemInfo;

  /**
   * 定时发布时间
   * @type { number}
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
   * @type {XiaoHongShuShopVisibleType}
   * @description 视频发布的可见类型
   *
   * 0:公开
   * 1:私密
   *
   */
  visibleType: XiaoHongShuShopVisibleType;

  /**
   * 声明创作类型
   * -
   * 1:原创
   * 0:不声明
   * 默认不声明
   * @description 选择原创且视频时长大于10秒时会声明原创
   * @type {XiaoHongShuShopCreateType}
   */
  createType?: XiaoHongShuShopCreateType;

  /**
   * 挂载商品列表
   * @type{GoodsItemInfo[]}
   */
  shopping_cart?: Array<GoodsItemInfo>;
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
export enum XiaoHongShuShopStatementType {
  ONLY_FOR_FUN = 1,
  AIGC = 2,
  MARK = 3,
  OWN = 4,
  FORWARD = 5,
}

/**
 * 小红书申明
 */
export interface XiaoHongShuShopContentStatement {
  /**
   * 内容类型申明
   * -
   * 1：虚构演绎，仅供娱乐
   * 2：笔记含ai合成内容
   */
  type: XiaoHongShuShopStatementType;
}

/**
 * 小红书商家号自主拍摄信息
 */
export interface XiaoHongShuShopPhotoInfo {
  /**
   * 拍摄地点
   * @type {ListItemInfo}
   */
  address: ListItemInfo;

  /**
   * 拍摄时间戳
   * @type {number}
   */
  time: number;
}

/**
 * 小红书商家号创作类型
 */
export enum XiaoHongShuShopCreateType {
  /**
   * 原创
   */
  original = 1,
  /**
   * 不声明原创
   */
  none = 0,
}

/**
 * 小红书可见类型
 */
export enum XiaoHongShuShopVisibleType {
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
