import { VideoFormItem } from '../common';
import { GoodsItemInfo, ImageInfo, ListItemInfo, MusicItemInfo } from '../../media-platform';

/**
 * 抖音地址/带货地址，来源于获取地址接口列表选项
 */
export interface DouYinLocationData {
  /**
   * 是否设置为带货地址（注意权限问题，需要有权限的账号）
   */
  isScp: boolean;

  /**
   * 地理位置数据项（老版本的珍格格数据）
   * @type{ListItemInfo}
   */
  data: ListItemInfo;
}

/**
 * 抖音可见类型
 */
export enum DouYinVisibleType {
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
 * 抖音平台视频表单
 * @description 抖音视频发布表单的数据结构
 * @interface DouYinVideoPlatformBody
 */
export interface DouYinVideoPlatformBody {
  /**
   * 视频文件
   * @type {VideoFormItem}
   * @description 视频文件的表单项
   *
   * 约束条件：
   * - 必填
   * - 最大文件大小16GB
   * - 最大时长60分钟
   */
  video: VideoFormItem;

  /**
   * 默认封面图
   * @type {ImageInfo[]}
   * @description 视频封面的表单项
   *
   * 约束条件：
   * - 必填，至少1张封面图
   */
  covers: ImageInfo[];

  /**
   * 横版封面
   * @type {ImageInfo}
   * @description 独立的横版封面
   */
  horizontalCover?: ImageInfo;

  /**
   * 视频标题
   * @type {string}
   * @description 视频的标题文本
   *
   * 约束条件：
   * - 必填
   * - 最大长度30个字符
   * @example "我的第一个抖音视频"
   */
  title?: string;

  /**
   * 视频描述
   * @type {string}
   * @description 视频的描述内容，支持HTML格式和话题标签
   *
   * 约束条件：
   * - 必填
   * - 最大长度1000个字符
   * - 最多5个话题，每个话题最大长度500个字符
   *
   * 格式要求：
   * - 支持HTML格式：内容应该用 `<p>` 标签包裹，支持多个 `<p>` 标签
   * - 可以混合使用HTML标签和话题标签
   * 话题标签使用<topic>
   * topic标签 属性raw，存放话题接口返回列表的完整选项对象的json序列化字符串，比如raw='{“yixiaoerId”:"12312","yixiaoerName":"搞",raw:{"id":"asdad","topic":"搞笑"}}'
   * topic标签 属性text，存放话题文本（不带任何前缀后缀），当raw有值时，直接使用raw中的话题数据，当没有数据时，会自动根据text进行匹配话题
   *
   * friend标签 @好友/用户使用,使用方法和topic标签一样使用raw属性存好友/用户数据，好友数据来源于 获取用户/好友列表 接口 raw='{"yixiaoerId":"123",raw:{"nick":"123"}}'
   * activity标签 参与活动使用，raw属性存储活动数据，raw='{“yixiaoerId”:"123","raw":{}}'
   * @example "<p>这是一个关于 <topic text='搞笑' raw='{“yixiaoerId”:"1231","yixiaoerName":"搞笑",raw:{"id":"asdad","topic":"搞笑"}}'>#搞笑</topic> 的视频</p><p>记录美好时光</p>"
   */
  desc?: string;

  /**
   * 创作内容声明
   * @type {DouYinContentStatement}
   * @description 内容声明选项，可选字段，用于标识内容类型或来源
   *
   * 约束条件：
   * - 当不提供时，表示"无需声明"
   */
  statement?: DouYinContentStatement;

  /**
   * 发布位置（打卡/带货/普通）
   * @type {DouYinLocationData}
   * @description 视频发布的地理位置信息，可选字段,来源于地址接口中的选项,地理位置、购物车、团购、小程序,游戏手柄，影视演绎
   *
   */
  location?: DouYinLocationData;

  /**
   * 定时发布时间
   * @type {number}
   * @description 文章的定时发布13位时间戳，可选字段
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：2小时
   * - 最大间隔：14天
   */
  prePubTime?: number;

  /**
   * 可见类型
   * -
   * 0:公开
   * 1:私密
   * 3:好友可见
   */
  visibleType: DouYinVisibleType;

  // /**
  //  * 授权后获得的浏览器localStorage对象
  //  *
  //  * 需要两个key-value
  //  * security-sdk/s_sdk_crypt_sdk=xxx
  //  * security-sdk/s_sdk_sign_data_key/web_protect=xxx
  //  * @type {DouYinLocalStorage}
  //  * @description 授权后获得的浏览器localStorage对象，用于平台认证
  //  *
  //  */
  // localStorage: DouYinLocalStorage;

  /**
   * 挂载团购信息
   * 其中data来源于获取商品列表的选项，sale_title和brand来源于用户输入
   *
   * @type{DouYinGroupShopping}
   * @description 地理位置、购物车、团购、小程序,游戏手柄，影视演绎

   */
  group_shopping?: DouYinGroupShopping;

  /**
   * 挂载购物车列表
   * 其中data来源于解析链接中商品选项，sale_title来源于用户输入
   * @description 地理位置、购物车、团购、小程序,游戏手柄，影视演绎
   * @type{DouYinShoppingCart[]}
   */
  shopping_cart?: Array<DouYinShoppingCart>;

  /**
   * 挂载小程序
   * 数据来源于获取/解析小程序接口列表的选项
   * @description 地理位置、购物车、团购、小程序,游戏手柄，影视演绎 等互斥
   * @type{ListItemInfo}
   */
  mini_app?: ListItemInfo;

  /**
   * 游戏手柄
   * @type{ListItemInfo}
   * @description 地理位置、购物车、团购、小程序,游戏手柄，影视演绎 等互斥
   */
  game?: ListItemInfo;

  /**
   * 影视演绎
   * @type{ListItemInfo}
   * @description 地理位置、购物车、团购、小程序,游戏手柄，影视演绎 等互斥
   */
  film?: ListItemInfo;

  /**
   * 合集信息
   * 来源于获取合集接口列表的选项
   *
   * @type{ListItemInfo}
   */
  collection?: ListItemInfo;

  /**
   * 合集选集
   * 默认为最后一集的下一集，比如当前合集有8集，如果不指定改参数，会默认为第9集
   *
   * @type{ListItemInfo}
   */
  sub_collection?: ListItemInfo;

  /**
   * 热点
   * 数据来源于获取热点接口列表的选项
   *
   * @type{ListItemInfo}
   */
  hot_event?: ListItemInfo;

  /**
   * 挑战
   * 数据来源于获取挑战接口列表选项
   *
   * @type{ListItemInfo}
   */
  challenge?: ListItemInfo;

  /**
   * 同时发布到的应用列表，注意需要根据权益接口给出的app列表选择
   * @type{ListItemInfo[]}
   */
  sync_apps?: Array<ListItemInfo>;

  /**
   * 当前抖音号登录密码，用于在发布时自动解除发布风控
   * @type{string}
   */
  password?: string;

  /**
   * 保存权限，默认0,不允许
   * 1:允许
   * 0:不允许
   * @type{number}
   */
  allow_save?: number;

  /**
   * 音乐
   * 来自音乐搜索接口列表选项，和图文一样
   * @description 添加音乐只会显示音乐相关的信息，不会改变视频的声音
   * @type{MusicItemInfo}
   *
   */
  music?: MusicItemInfo;

  /**
   * 共创信息
   * @type{DouYinCoCreationInfo[]}
   * @description 共创信息，注意可见类型必须是公开才能使用共创，注意需要根据共创信息接口获取是否有权限
   */
  cooperation_info?: Array<DouYinCoCreationInfo>;
}

/**
 * 抖音共创信息
 */
export interface DouYinCoCreationInfo {
  /**
   * 共创身份类型
   * @type{ListItemInfo}
   * @description 来自于共创信息接口下的类型选项
   */
  co_type: ListItemInfo;

  /**
   * 共创用户列表
   * @type{ListItemInfo[]}
   * @description 参与共创的都用用户信息，来自于用户/好友列表接口，注意共创身份类型是否有数量限制
   */
  user_list: Array<ListItemInfo>;
}

/**
 * 抖音团购挂载信息
 * 其中data来源于解析链接中的商品选项，sale_title为用户输入标题，
 */
export interface DouYinGroupShopping {
  /**
   * -
   * 0:不推荐
   * 1:推荐其他品牌商品
   * 2:只推荐相同品牌商品
   * @type{number}
   */
  brand_switch_value: number;
  /**
   * 推广标题，最多10个字
   */
  sale_title: string;
  /**
   * 团购商品数据，来源于商品列表接口列表选项
   *
   * @type{GoodsItemInfo}
   */
  data: GoodsItemInfo;
}

/**
 * 抖音购物车单个商品
 */
export interface DouYinShoppingCart {
  /**
   * 短标题，最多10个字
   */
  sale_title: string;
  /**
   * 商品数据，来源于商品解析接口
   *
   * @type{GoodsItemInfo}
   */
  data: GoodsItemInfo;

  /**
   * 排序后的图片，无需排序时，留空就好
   */
  images?: Array<string>;
}

/**
 * 创作申明
 * 3:内容由AI生成
 * 4:可能引人不适
 * 5:虚构演绎，仅供娱乐
 * 6:危险行为，请勿模仿
 * 7:内容为个人观点或见解
 * 8:内容含营销推广信息,
 */
export enum DouYinStatementType {
  '内容由AI生成' = 3,
  '可能引人不适' = 4,
  '虚构演绎仅供娱乐' = 5,
  '危险行为请勿模仿' = 6,
  '内容为个人观点或见解' = 7,
  '内容含营销推广信息' = 8,
}

/**
 *抖音创作申明
 */
export interface DouYinContentStatement {
  /**
   * 创作申明
   * -
   * 3:内容由AI生成
   * 4:可能引人不适
   * 5:虚构演绎，仅供娱乐
   * 6:危险行为，请勿模仿
   * 7:内容为个人观点或见解
   * 8:内容含营销推广信息,
   */
  type: DouYinStatementType;
}

/**
 * 抖音平台图文/动态表单
 * @description 抖音图文发布表单的数据结构
 * @interface DouYinDynamicPlatformBody
 */
export interface DouYinDynamicPlatformBody {
  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 图文封面的表单项
   *
   * 约束条件：
   * 必填，至少1张封面图
   */
  covers: ImageInfo[];

  /**
   * 要发布的图片列表
   * @type {ImageInfo[]}
   * @description 要发布的图片列表
   *
   * 约束条件：
   * - 必填，至少1张图
   * - 最大体积50MB
   * - 最多35张图
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
   * @example "我的第一个抖音图文"
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
   * - 最多5个话题，每个话题最大长度500个字符
   *
   * 格式要求：
   * - 支持HTML格式：内容应该用 `<p>` 标签包裹，支持多个 `<p>` 标签
   * - 可以混合使用HTML标签和话题标签
   * 话题标签使用<topic>
   * topic标签 属性raw，存放话题接口返回列表的完整选项对象的json序列化字符串，比如raw='{“yixiaoerId”:"12312","yixiaoerName":"搞",raw:{"id":"asdad","topic":"搞笑"}}'
   * topic标签 属性text，存放话题文本（不带任何前缀后缀），当raw有值时，直接使用raw中的话题数据，当没有数据时，会自动根据text进行匹配话题
   *
   * friend标签 @好友/用户使用,使用方法和topic标签一样使用raw属性存好友/用户数据，好友数据来源于 获取用户/好友列表 接口 raw='{"yixiaoerId":"123",raw:{"nick":"123"}}'
   * activity标签 参与活动使用，raw属性存储活动数据，raw='{“yixiaoerId”:"123","raw":{}}'
   * @example "<p>这是一个关于 <topic text='搞笑' raw='{“yixiaoerId”:"1231","yixiaoerName":"搞笑",raw:{"id":"asdad","topic":"搞笑"}}'>#搞笑</topic> 的视频</p><p>记录美好时光</p>"
   */
  desc?: string;

  /**
   * 发布位置地址/带货地址（注意权限）
   * 来源于地址搜索接口选项和用户输入
   *
   * @type {DouYinLocationData}
   * @description 地理位置、购物车、团购、小程序 等互斥
   */
  location?: DouYinLocationData;

  /**
   * 图文发布的音乐
   * 来自音乐搜索接口列表选项
   *
   * @type{MusicItemInfo}
   *
   */
  music?: MusicItemInfo;

  /**
   * 定时发布时间
   * @type {number}
   * @description 文章的定时发布13位时间戳，可选字段
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：2小时
   * - 最大间隔：14天
   */
  prePubTime?: number;

  /**
   * 可见类型
   *
   * @type {DouYinVisibleType}
   * -
   * 0:公开
   * 1:私密
   * 3:好友可见
   */
  visibleType: DouYinVisibleType;

  /**
   * 挂载团购信息
   * 其中data来源于获取商品列表的选项，sale_title和brand来源于用户输入
   *
   * @type{DouYinGroupShopping}
   * @description 挂在团购信息，地理位置、购物车、团购、小程序 等互斥

   */
  group_shopping?: DouYinGroupShopping;

  /**
   * 挂载购物车列表
   * 其中data来源于解析链接中商品选项，sale_title来源于用户输入
   *
   * @type{DouYinShoppingCart[]}
   * @description 地理位置、购物车、团购、小程序 等互斥
   */
  shopping_cart?: Array<DouYinShoppingCart>;

  /**
   * 挂载小程序
   * 数据来源于获取/解析小程序接口列表的选项
   * @description 地理位置、购物车、团购、小程序 等互斥
   * @type{ListItemInfo}
   */
  mini_app?: ListItemInfo;

  /**
   * 合集信息
   * 来源于获取合集接口列表的选项
   *
   * @type{ListItemInfo}
   */
  collection?: ListItemInfo;

  /**
   * 合集选集
   * 默认为最后一集的下一集，比如当前合集有8集，如果不指定改参数，会默认为第9集
   *
   * @type{ListItemInfo}
   */
  sub_collection?: ListItemInfo;

  /**
   * 热点
   * 数据来源于获取热点接口列表的选项
   *
   * @type{ListItemInfo}
   */
  hot_event?: ListItemInfo;

  /**
   * 挑战
   * 数据来源于获取挑战接口列表选项
   *
   * @type{ListItemInfo}
   */
  challenge?: ListItemInfo;

  /**
   * 当前抖音号登录密码，用于在发布时自动解除发布风控
   * @type{string}
   */
  password?: string;

  /**
   * 创作内容声明
   * @type {DouYinContentStatement}
   * @description 内容声明选项，可选字段，用于标识内容类型或来源
   *
   * 约束条件：
   * - 当不提供时，表示"无需声明"
   */
  statement?: DouYinContentStatement;
}

/**
 * 抖音发布需要的localstorage信息，抖音登录授权后获得
 * 需要两个key-value
 * security-sdk/s_sdk_crypt_sdk
 * security-sdk/s_sdk_sign_data_key/web_protect
 */
export interface DouYinLocalStorage {
  /**
   * key1
   */
  'security-sdk/s_sdk_crypt_sdk': string;
  /**
   * key2
   */
  'security-sdk/s_sdk_sign_data_key/web_protect': string;
}
/**
 * 抖音平台文章表单
 * @description 抖音文章频发布表单的数据结构
 * @interface DouYinArticlePlatformBody
 */
export interface DouYinArticlePlatformBody {
  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 图文封面的表单项
   *
   * 约束条件：
   * 必填，至少1张封面图
   */
  covers: ImageInfo[];

  /**
   * 文章头图
   * @type {ImageInfo}
   * @description 要发布的文章头图
   *
   * 约束条件：
   * - 选填
   * - 最大体积50MB
   */
  headImage?: ImageInfo;

  /**
   * 图文标题
   * @type {string}
   * @description 图文的标题文本
   *
   * 约束条件：
   * - 必填
   * - 最大长度30个字符
   * @example "我的第一个抖音图文"
   */
  title: string;

  /**
   * 摘要，最多30字
   * @type {string}
   * @description
   */
  desc?: string;

  /**
   * 正文html，正文内容最大8000字
   * @type {string}
   * @description
   */
  content: string;

  /**
   * 话题列表，最多5个
   * @type{ListItemInfo[]}
   */
  topics?: Array<ListItemInfo>;

  /**
   * 文章发布的音乐
   * 来自音乐搜索接口列表选项
   *
   * @type{MusicItemInfo}
   *
   */
  music?: MusicItemInfo;

  /**
   * 定时发布时间
   * @type {number}
   * @description 文章的定时发布13位时间戳，可选字段
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：2小时
   * - 最大间隔：14天
   */
  prePubTime?: number;

  /**
   * 可见类型
   *
   * @type {DouYinVisibleType}
   * -
   * 0:公开
   * 1:私密
   * 3:好友可见
   */
  visibleType: DouYinVisibleType;

  /**
   * 当前抖音号登录密码，用于在发布时自动解除发布风控
   * @type{string}
   */
  password?: string;
}

/**
 * 抖音高权益
 */
export interface DouYinPrivilege {
  /**
   * 0:默认值,不区分类型
   * 1:本地地址
   * 2:全国地址（含本地）
   * 3:海外地址（含全国/本地）
   * @type{number}
   */
  locationType: number;

  /**
   *  地址带货权限
   *  @type{boolean}
   */
  locationSalesPermission: boolean;

  // /**
  //  * 抖音同步到
  //  * @description 可以同步到的应用选项
  //  * @type{ListItemInfo[]}
  //  */
  // sync_app_list?: Array<ListItemInfo>;

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

  /**
   * 团购权限
   */
  group_shopping: boolean;

  /**
   * 游戏手柄
   * @type{boolean}
   */
  game_permission: boolean;

  /**
   * 影视演绎
   * @type{boolean}
   */
  film_permission: boolean;
}
