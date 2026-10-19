import { VideoFormItem, PubType, VideoFormItem2 } from '../common';
import { ActivityItemInfo, ImageInfo, ListItemInfo } from '@/media-platform';

/**
 * 百家号平台视频表单
 * @description 百家号视频发布表单的数据结构
 * @interface BaiJiaHaoVideoPlatformBody
 */
export interface BaiJiaHaoVideoPlatformBody {
  /**
   * 视频文件
   * @type {VideoFormItem2}
   * @description 视频文件的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小12GB，必须包含音频轨道
   */
  video: VideoFormItem2;

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
   * 竖版封面图
   * @type {ImageInfo[]}
   * @description 视频竖版封面的表单项，可选字段；仅在提供时上传并提交竖版封面
   */
  verticalCovers?: ImageInfo[];

  // /**
  //  * 视频标题
  //  * @type {string}
  //  * @description 视频的标题文本，必填字段
  //  *
  //  * 约束条件：
  //  * - 最大长度30个字符
  //  * @example "百家号视频分享"
  //  */
  // title: string;

  /**
   * 视频描述
   * @type {string}
   * @description 视频的描述内容，必填字段
   *
   * 约束条件：
   * - 最大长度100个字符
   *
   * 格式要求：
   * - 支持HTML格式：内容应该用 `<p>` 标签包裹，支持多个 `<p>` 标签
   * 话题标签使用<topic>
   * topic标签 属性raw，存放话题接口返回列表的完整选项对象的json序列化字符串，比如raw='{“yixiaoerId”:"12312","yixiaoerName":"搞",raw:{"id":"asdad","topic":"搞笑"}}'
   * topic标签 属性text，存放话题文本（不带任何前缀后缀），当raw有值时，直接使用raw中的话题数据，当没有数据时，会自动根据text进行匹配话题
   * @example "<p>这是一个关于 <topic text='搞笑' raw='{“yixiaoerId”:"1231","yixiaoerName":"搞笑",raw:{"id":"asdad","topic":"搞笑"}}'>#搞笑</topic> 的视频</p><p>记录美好时光</p>"
   */
  desc: string;

  // /**
  //  * 视频标签
  //  * @type {string[]}
  //  * @description 视频的标签列表，必填字段，用于分类和推荐
  //  *
  //  * 约束条件：
  //  * - 必须至少包含1个标签
  //  * - 最多支持5个标签
  //  * - 每个标签最大长度30个字符
  //  * @example ["生活", "娱乐", "分享"]
  //  */
  // tags: string[];

  /**
   * 内容声明
   * @type {BaiJiaHaoContentStatement}
   * @description 内容声明选项，可选字段，用于标识内容类型或来源
   *
   * 约束条件：
   * - 当不提供时，表示"无需声明"
   */
  statement?: BaiJiaHaoContentStatement;

  /**
   * 发布位置
   * @type {ListItemInfo}
   * @description 视频发布的地理位置信息，可选字段
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
   * - 最大间隔：7天
   *
   */
  prePubTime?: number;

  /**
   * 存草稿/直接发布
   * @type {number}
   * @description 发布类型选择
   * 0:存草噶
   * 1:直接发布
   */
  pubType: PubType;

  /**
   * 征文活动数据，来源于获取活动接口列表选项
   * @type{ActivityItemInfo}
   */
  activity?: ActivityItemInfo;

  /**
   * 合集
   * @description 若视频质量及主题不满足要求，加入合集可能不生效。
   * @type{ListItemInfo}
   */
  collection?: ListItemInfo;

  // /**
  //  * 分类
  //  * @type {ListItemInfo}
  //  * @description 分类信息，来源于分类接口的选项
  //  */
  // category?: ListItemInfo;
  //
  // /**
  //  * 二级分类
  //  * @type {ListItemInfo}
  //  * @description 分类信息，来源于分类接口的选项
  //  *
  //  */
  // subCategory?: ListItemInfo;
}

/**
 * 百家号文章表单
 * @description 百家号文章发布表单的数据结构
 * @interface BaiJiaHaoArticlePlatformBody
 */
export interface BaiJiaHaoArticlePlatformBody {
  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 文章封面的表单项
   *
   * 约束条件：
   * - 必填，支持1/3封面
   * - 最小像素尺寸372x248
   * - 最大文件大小5MB
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
   * @example "百家号文章分享"
   */
  title: string;

  /**
   * 文章正文内容
   * @type {string}
   * @description 文章的正文内容，HTML格式
   *
   * 约束条件：
   * - 必填
   * - 最小长度9个字符
   * - 最大长度10000个字符
   *
   * 格式要求：
   * - HTML格式：内容应该用 `<div>` 标签包裹
   * @example "<div><p>这是一篇精彩的文章内容</p></div>"
   */
  content: string;

  /**
   * 文章分类
   * @type {ListItemInfo}
   * @description 文章的分类信息，来源于分类接口的选项
   *
   * 约束条件：
   * -必填，至少选择1个分类
   */
  category: ListItemInfo;

  /**
   * 文章二级分类
   * @type {ListItemInfo}
   * @description 文章的分类信息，来源于分类接口的选项
   *
   * 约束条件：
   * -必填，至少选择1个分类
   */
  subCategory: ListItemInfo;

  /**
   * 内容声明
   * @type {BaiJiaHaoContentStatement}
   * @description 内容声明选项，可选字段，用于标识内容类型或来源
   *
   * 约束条件：
   * -当不提供时，表示"无需声明"
   */
  statement?: BaiJiaHaoContentStatement;

  /**
   * 定时发布时间
   * @type {number}
   * @description 文章的定时发布时间戳，可选字段
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：1小时
   * - 最大间隔：7天
   *
   * 格式要求：
   * - Unix时间戳（毫秒）
   */
  prePubTime?: number;

  /**
   * 存草稿/直接发布
   * @type {PubType}
   * @description 发布类型选择
   * @example 0
   */
  pubType: PubType;

  /**
   * 征文活动数据，来源于获取活动接口
   * @type{ActivityItemInfo}
   */
  activity?: ActivityItemInfo;
}

/**
 * 百家号申明
 * 0:不声明
 * 1:内容由AI生成
 * 16:内容为转载
 * 4:含虚构演绎内容
 * 8:内容含有营销信息
 * 32:个人观点，仅供参考
 */
export enum BaiJiaHaoStatementType {
  '不申明' = 0,
  '含AI生产内容' = 1,
  '内容为转载' = 16,
  '含虚构演绎内容' = 4,
  '内容含有营销信息' = 8,
  '个人观点，仅供参考' = 32,
}

/**
 * 百家号补充申明
 * 1:内容可能引人不适
 * 2:内容含有高危险行为
 * 4:请理性适度消费
 * 8:未成年人请在监护人指导下浏览
 */
export enum BaiJiaHaoStatementSubType {
  '内容可能引人不适' = 1,
  '内容含有高危险行为' = 2,
  '请理性适度消费' = 4,
  '未成年人请在监护人指导下浏览' = 8,
}
/**
 * 百家号申明
 */
export interface BaiJiaHaoContentStatement {
  /**
   * 百家号申明
   * 0:不声明
   * 1:内容由AI生成
   * 16:内容为转载
   * 4:含虚构演绎内容
   * 8:内容含有营销信息
   * 32:个人观点，仅供参考
   */
  type: BaiJiaHaoStatementType;

  /**
   * 百家号补充申明
   * 1:内容可能引人不适
   * 2:内容含有高危险行为
   * 4:请理性适度消费
   * 8:未成年人请在监护人指导下浏览
   */
  subType?: BaiJiaHaoStatementSubType;
}

/**
 * 百家号平台图文/动态表单
 * @description 百家号图文发布表单的数据结构
 * @interface BaiJiaHaoDynamicPlatformBody
 */
export interface BaiJiaHaoDynamicPlatformBody {
  /**
   * 封面
   * @type {ImageInfo[]}
   * @description 封面
   *
   * 约束条件：
   * - 最大体积5MB
   * -
   */
  covers: ImageInfo[];

  /**
   * 要发布的图片列表
   * @type {ImageInfo[]}
   * @description 图文的图片列表
   *
   * 约束条件：
   * - 最大体积20MB
   * - 最多18张图
   */
  images: ImageInfo[];

  /**
   * 标题，最多20字
   */
  title: string;

  /**
   * 图文描述
   * @type {string}
   * @description 图文的描述内容，支持HTML格式和话题标签
   *
   * 约束条件：
   * - 必填
   * - 最大长度2000个字符
   *
   * 格式要求：
   * - 支持HTML格式：内容应该用 `<p>` 标签包裹，支持多个 `<p>` 标签
   * - 支持@用户功能和其他微博特殊格式
   * - 可以混合使用HTML标签和话题标签
   * @example "<p>这是一个关于 <topic text="话题文本">#话题文本</topic> 的视频</p><p>记录美好时光</p>"
   */
  desc: string;

  /**
   * 发布位置
   * @type {ListItemInfo}
   * @description 图文发布的地理位置信息，可选字段
   *
   */
  location?: ListItemInfo;

  /**
   * 定时发布时间
   * @type {number}
   * @description 图文的定时发布13位时间戳，可选字段
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 支持定时发布功能
   */
  prePubTime?: number;

  /**
   * 内容声明
   * @type {BaiJiaHaoContentStatement}
   * @description 内容声明选项，可选字段，用于标识内容类型或来源
   *
   * 约束条件：
   * - 当不提供时，表示"无需声明"
   */
  statement?: BaiJiaHaoContentStatement;

  /**
   * 征文活动数据，来源于获取活动接口
   * @type{ActivityItemInfo}
   */
  activity?: ActivityItemInfo;
}
