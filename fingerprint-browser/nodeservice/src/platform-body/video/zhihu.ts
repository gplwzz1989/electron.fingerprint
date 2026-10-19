import { VideoFormItem, PubType } from '../common';
import { ImageInfo, ListItemInfo } from '@/media-platform';

/**
 * 知乎内容类型枚举
 * @description 知乎平台支持的视频内容类型
 * @type {'原创' | '转载'}
 */
export enum ZhiHuContentType {
  '原创' = 1,
  '转载' = 2,
}

/**
 * 知乎平台表单
 * @description 知乎视频发布表单的数据结构
 * @interface ZhiHuVideoPlatformBody
 */
export interface ZhiHuVideoPlatformBody {
  /**
   * 视频文件
   * @type {VideoFormItem}
   * @description 视频文件的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小5GB
   */
  video: VideoFormItem;

  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 视频封面的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小20MB
   */
  covers: ImageInfo[];

  /**
   * 视频标题
   * @type {string}
   * @description 视频的标题文本，必填字段
   *
   * 约束条件：
   * - 最小长度0个字符，最大长度50个字符
   * @example "知识分享：如何学习编程"
   */
  title?: string;

  /**
   * 视频描述
   * @type {string}
   * @description 视频的描述内容，必填字段
   *
   * 约束条件：
   * - 最大长度30个字符
   *
   * 格式要求：
   * - 支持HTML格式：内容应该用 `<p>` 标签包裹，支持多个 `<p>` 标签
   * 话题标签使用<topic>
   * topic标签 属性raw，存放话题接口返回列表的完整选项对象的json序列化字符串，比如raw='{“yixiaoerId”:"12312","yixiaoerName":"搞",raw:{"id":"asdad","topic":"搞笑"}}'
   * topic标签 属性text，存放话题文本（不带任何前缀后缀），当raw有值时，直接使用raw中的话题数据，当没有数据时，会自动根据text进行匹配话题
   * @example "<p>这是一个关于 <topic text='搞笑' raw='{“yixiaoerId”:"1231","yixiaoerName":"搞笑",raw:{"id":"asdad","topic":"搞笑"}}'>#搞笑</topic> 的视频</p><p>记录美好时光</p>"
   */
  desc?: string;

  /**
   * 视频一级分类
   * @type {ListItemInfo}
   * @description 视频的分类信息，必填字段，来源于分类接口
   *
   * 约束条件：
   * - 必须选择至少一个分类
   *
   */
  category: ListItemInfo;

  // /**
  //  * 内容声明
  //  * @type {string}
  //  * @description 内容声明选项，必填字段，用于标识内容类型或来源
  //  *
  //  * 约束条件：
  //  * 当不提供时，表示"无需声明"
  //  *
  //  * 选项说明：
  //  * - 不提供: 无需声明
  //  * - "内容由AI生成": AI生成内容声明
  //  * - 其他字符串值: 具体的声明内容
  //  */
  // declaration?: string;

  /**
   * 内容声明
   * @type {ZhiHuContentStatement}
   * @description 内容声明选项，可选字段，用于标识内容类型或来源
   *
   * 约束条件：
   * - 当不提供时，表示"无需声明"
   */
  statement?: ZhiHuContentStatement;

  /**
   * 内容类型
   * @type {ZhiHuContentType}
   * @description 视频的内容类型，必填字段
   *
   * 1:原创
   * 2:转载
   */
  createType: ZhiHuContentType;

  /**
   * 定时发布时间
   * @type {number}
   * @description 视频的定时发布13位时间戳
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：30分钟
   * - 最大间隔：14天
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
 * 知乎申明类型
 * -
 * 0:不声明
 * 2:图片/视频由AI生成
 */
export enum ZhiHuStatementType {
  '不声明' = 0,
  '图片/视频由AI生成' = 2,
}

/**
 * 知乎申明
 */
export interface ZhiHuContentStatement {
  /**
   * 知乎申明类型 0:不声明 2:图片/视频由AI生成
   */
  type: ZhiHuStatementType;
}

/**
 * 知乎平台文章表单
 * @description 知乎文章发布表单的数据结构
 * @interface ZhiHuArticlePlatformBody
 */
export interface ZhiHuArticlePlatformBody {
  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 文章封面的表单项，可选字段
   *
   * 约束条件：
   * - 最大文件大小10MB
   */
  covers?: ImageInfo[];

  /**
   * 文章标题
   * @type {string}
   * @description 文章的标题文本
   *
   * 约束条件：
   * - 必填
   * - 最小长度9个字符
   * - 最大长度100个字符
   * @example "知识分享：如何学习编程技术"
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
   * 知乎文章申明，默认不申明
   */
  statement?: ZhiHuArticleContentStatement;

  /**
   * 文章话题
   * @type {ListItemInfo[]}
   * @description 文章的话题,来自话题搜索接口
   *
   * - 最多3个话题
   * @example [{“yixiaoerId”:"12312","yixiaoerName":"搞笑","raw":{}}]
   */
  topics?: ListItemInfo[];

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
 * 知乎文章创作申明
 * -
 * 0:无申明
 * 1:包含剧透
 * 2:包含医疗建议
 * 3:虚构创作
 * 4:包含理财内容
 * 5:包含AI辅助创作
 *
 */
export enum ZhiHuArticleStatementType {
  '无申明' = 0,
  '包含剧透' = 1,
  '包含医疗建议' = 2,
  '虚构创作' = 3,
  '包含理财内容' = 4,
  '包含AI辅助创作' = 5,
}

/**
 * 知乎文章申明
 */
export interface ZhiHuArticleContentStatement {
  /**
   * 知乎文章创作申明
   * -
   * 0:无申明
   * 1:包含剧透
   * 2:包含医疗建议
   * 3:虚构创作
   * 4:包含理财内容
   * 5:包含AI辅助创作
   *
   */
  type: ZhiHuArticleStatementType;
}

/**
 * 知乎平台图文表单
 * @description 知乎图文发布表单的数据结构
 * @interface ZhiHuDynamicPlatformBody
 */
export interface ZhiHuDynamicPlatformBody {
  /**
   * 要发布的图片列表
   * @type {ImageInfo[]}
   * @description 要发布的图片列表
   *
   * 约束条件：
   * - 可选
   * - 最大体积10MB
   * - 最多9张图
   */
  images?: ImageInfo[];

  /**
   * 标题
   * 最多50个字
   */
  title?: string;

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
   * @example "<p>这是一个关于 <topic text="话题文本">#话题文本</topic> 的视频</p><p>记录美好时光</p>"
   */
  desc: string;
}
