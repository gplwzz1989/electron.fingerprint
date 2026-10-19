import { VideoFormItem, PubType } from '../common';
import { ImageInfo, ListItemInfo } from '@/media-platform';

/**
 * 新浪微博内容类型枚举
 * @description 新浪微博平台支持的视频内容类型
 * @type {'原创' | '二创' | '转载'}
 */
export enum XinLangWeiBoContentType {
  '原创' = 1,
  '二创' = 3,
  '转载' = 2,
}

/**
 * 新浪微博平台表单
 * @description 新浪微博视频发布表单的数据结构
 * @interface XinLangWeiBoVideoPlatformBody
 */
export interface XinLangWeiBoVideoPlatformBody {
  /**
   * 视频文件信息
   * @type {VideoFormItem}
   * @description
   *
   * 约束条件：
   * - 最大文件大小15GB
   */
  video: VideoFormItem;

  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description
   *
   * 约束条件：
   * - 最大文件大小5MB
   */
  covers: ImageInfo[];

  /**
   * 视频标题
   * @type {string}
   * @description
   *
   * 约束条件：
   * - 最大长度30个字符
   * @example "新浪微博视频分享"
   */
  title: string;

  /**
   * 视频描述
   * @type {string}
   * @description
   *
   * 约束条件：
   * - 最大长度5000个字符
   *
   * 格式要求：
   * - 支持HTML格式：内容应该用 `<p>` 标签包裹，支持多个 `<p>` 标签
   * - 支持@用户功能和其他微博特殊格式
   * - 可以混合使用HTML标签和话题标签
   * 话题标签使用<topic>
   * topic标签 属性raw，存放话题接口返回列表的完整选项对象的json序列化字符串，比如raw='{“yixiaoerId”:"12312","yixiaoerName":"搞",raw:{"id":"asdad","topic":"搞笑"}}'
   * topic标签 属性text，存放话题文本（不带任何前缀后缀），当raw有值时，直接使用raw中的话题数据，当没有数据时，会自动根据text进行匹配话题
   * @example "<p>这是一个关于 <topic text="话题文本">#话题文本</topic> 的视频</p><p>记录美好时光</p>"
   */
  desc: string;

  /**
   * 内容类型
   * @type {XinLangWeiBoContentType}
   * @description
   *
   * 默认值：
   * - "原创"
   *
   * 选项说明：
   * - 1: 原创内容
   * - 3: 二次创作内容
   * - 2: 转载内容
   */
  createType: XinLangWeiBoContentType;

  /**
   * 发布位置
   * 来源于地址搜索接口
   * @type {ListItemInfo}
   * @description
   *
   */
  location?: ListItemInfo;

  /**
   * 定时发布时间
   * @type {number}
   * @description 视频的定时发布13位时间戳
   *
   * 约束条件：
   * 注意账号权限
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 支持定时发布功能
   */
  prePubTime?: number;

  /**
   * 可见类型
   * @type {XinLangWeiBoVisibleType}
   * @description
   * -
   * 0:公开
   * 1:私密
   *
   */
  visibleType: XinLangWeiBoVisibleType;

  /**
   * 合集列表
   * 来源于获取合集结构列表多选项
   * @type{ListItemInfo[]}
   */
  collection?: Array<ListItemInfo>;

  /**
   * 视频一级分类
   * @type {ListItemInfo}
   * @description 视频的分类信息，来源于分类接口
   *
   */
  category?: ListItemInfo;

  /**
   * 视频二级分类
   * @type {ListItemInfo}
   * @description 视频的分类信息，来源于分类接口
   *
   */
  subCategory?: ListItemInfo;
}

/**
 * 新浪微博平台图文/动态表单
 * @description 新浪微博图文发布表单的数据结构
 * @interface XinLangWeiBoDynamicPlatformBody
 */
export interface XinLangWeiBoDynamicPlatformBody {
  /**
   * 要发布的图片列表
   * @type {ImageInfo[]}
   * @description
   *
   * 约束条件：
   * - 最大体积20MB
   * - 最多18张图
   */
  images?: ImageInfo[];

  /**
   * 图文描述
   * @type {string}
   * @description
   *
   * 约束条件：
   * - 必填
   * - 最大长度5000个字符
   *
   * 格式要求：
   * - 支持HTML格式：内容应该用 `<p>` 标签包裹，支持多个 `<p>` 标签
   * 话题标签使用<topic>
   * topic标签 属性raw，存放话题接口返回列表的完整选项对象的json序列化字符串，比如raw='{“yixiaoerId”:"12312","yixiaoerName":"搞",raw:{"id":"asdad","topic":"搞笑"}}'
   * topic标签 属性text，存放话题文本（不带任何前缀后缀），当raw有值时，直接使用raw中的话题数据，当没有数据时，会自动根据text进行匹配话题
   *
   * @example "<p>分享生活中的美好时光 <topic>生活记录</topic></p><p>@朋友 一起来看看</p>"
   */
  desc: string;

  /**
   * 发布位置
   * 来源于地址搜索接口列表选项
   * @type {ListItemInfo}
   * @description
   *
   */
  location?: ListItemInfo;

  /**
   * 定时发布时间
   * @type {number}
   * @description 图文动态的定时发布13位时间戳
   *
   * 约束条件：
   * 注意账号权限
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 支持定时发布功能
   */
  prePubTime?: number;

  /**
   * 可见类型
   * @type {XinLangWeiBoVisibleType}
   * @description
   *
   * 0:公开
   * 1:私密
   *
   */
  visibleType: XinLangWeiBoVisibleType;

  /**
   * 图文申明
   * @type{WeiboDynamicStatement}
   */
  statement?: WeiboDynamicStatement;
}

/**
 * 微博图文申明
 */
export interface WeiboDynamicStatement {
  /**
   * 留空默认为不申明
   * 1:内容由AI生成
   * 2:内容为虚构演绎
   * 3:内容为转载
   * 4:内容为自主创作
   * @type{WeiBoStatementType}
   */
  type: WeiBoStatementType;
}

/**
 * 微博图文申明类型
 */
export enum WeiBoStatementType {
  AIGC = 1,
  JIADE = 2,
  FORWARD = 3,
  ORIGINAL = 4,
}
/**
 * 新浪微博平台文章表单
 * @description 新浪微博文章发布表单的数据结构
 * @interface XinLangWeiBoArticlePlatformBody
 */
export interface XinLangWeiBoArticlePlatformBody {
  /**
   * 文章标题
   * @type {string}
   * @description
   *
   * 约束条件：
   * - 必填
   * - 最小长度1个字符
   * - 最大长度32个字符
   * @example "微博文章分享"
   */
  title: string;

  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description
   *
   * 约束条件：
   * - 必填，至少1张封面图
   * - 最大文件大小20MB
   */
  covers: ImageInfo[];

  /**
   * 文章正文内容
   * @type {string}
   * @description
   *
   * 约束条件：
   * - 必填
   * - 最大长度10000个字符
   *
   * 格式要求：
   * - HTML格式：内容应该用 `<div>` 标签包裹
   * @example "<div><p>这是一篇精彩的文章内容</p></div>"
   */
  content: string;

  /**
   * 定时发布时间
   * @type {number}
   * @description 文章的定时发布13位时间戳
   *
   * 格式要求：
   * - Unix时间戳（毫秒）
   *
   * 约束条件：
   * -注意账号权限
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 支持定时发布功能
   */
  prePubTime?: number;

  /**
   * 存草稿/直接发布
   * @type {number}
   * @description
   * 0:存草稿
   * 1:直接发布
   */
  pubType: PubType;
}
/**
 * 新浪微博可见类型
 */
export enum XinLangWeiBoVisibleType {
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
 * 微博高权益
 */
export interface WeiBoPrivilege {
  /**
   *  是否有定时发布的权限
   *  @type{boolean}
   */
  scheduled_enable: boolean;
}
