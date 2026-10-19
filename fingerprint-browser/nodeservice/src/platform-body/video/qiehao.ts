import { VideoFormItem, PubType } from '../common';
import { ImageInfo, ListItemInfo } from '@/media-platform';

/**
 * 企鹅号平台表单
 * @description 企鹅号视频发布表单的数据结构
 * @interface QiEHaoVideoPlatformBody
 */
export interface QiEHaoVideoPlatformBody {
  /**
   * 视频文件
   * @type {VideoFormItem}
   * @description 视频文件的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小16GB，最大时长10小时
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
   * - 最大长度60个字符，最小长度5个字符
   * @example "企鹅号视频分享"
   */
  title: string;

  /**
   * 视频描述
   * @type {string}
   * @description 视频的描述内容，必填字段
   *
   * 约束条件：
   * - 最大长度200个字符
   *
   * 格式要求：
   * - 支持HTML格式：内容应该用 `<p>` 标签包裹，支持多个 `<p>` 标签
   * - 不支持话题标签（使用独立的tags字段）
   * @example "<p>这是一个精彩的视频内容</p><p>欢迎观看和分享</p>"
   */
  desc: string;

  /**
   * 视频标签
   * @type {string[]}
   * @description 视频的标签列表，必填字段，用于分类和推荐
   *
   * 约束条件：
   * - 必须包含2-9个标签
   * - 每个标签最大长度8个字符
   * @example ["生活", "娱乐", "分享"]
   */
  tags: string[];

  /**
   * 视频一级分类
   * 来源于分类接口列表选项
   * @type {ListItemInfo}
   * @description 视频的分类信息，必填字段
   *
   * 约束条件：
   * - 必须选择至少一个分类
   *
   */
  category: ListItemInfo;

  /**
   * 视频二级分类
   * 来源于一级分类子类
   * @type {ListItemInfo}
   * @description 视频的分类信息，必填字段
   *
   * 约束条件：
   * - 必须选择至少一个分类
   *
   */
  subCategory: ListItemInfo;

  /**
   * 自主申明
   * @type {QiEHaoContentStatement}
   * @description 内容声明选项，可选字段，用于标识内容类型或来源
   *
   * 约束条件：
   * - 当不提供时，表示"无需声明"
   */
  statement?: QiEHaoContentStatement;

  /**
   * 定时发布时间
   * @type {number}
   * @description 视频的定时发布13位时间戳，可选字段
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：0分钟（立即发布）
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
 * 自主申明
 * -
 * 0:暂不申明
 * 2:个人观点，仅供参考
 * 3:剧情演绎，仅供娱乐
 * 8:健康医疗分享，仅供参考
 * 9:危险行为，请勿模仿
 */
export enum QiEHaoStatementType {
  '不声明' = 0,
  '个人观点，仅供参考' = 2,
  '剧情演绎，仅供娱乐' = 3,
  '健康医疗分享，仅供参考' = 8,
  '危险行为，请勿模仿' = 9,
}

/**
 * 企鹅文章自主申明
 * -
 * 0:不申明
 * 1:该文章由AI生成
 * 2:个人观点，仅供参考
 * 3:剧情演绎，仅供娱乐
 * 7:该文章由AI辅助创作
 * 8:健康医疗分享，仅供参考
 * 9:危险行为，请勿模仿
 */
export enum QiEHaoArticleStatementType {
  '不声明' = 0,
  '该文章由AI生成' = 1,
  '个人观点仅供参考' = 2,
  '剧情演绎仅供娱乐' = 3,
  '该文章由AI辅助创作' = 7,
  '健康医疗分仅供参考' = 8,
  '危险行为请勿模仿' = 9,
}

/**
 * 企鹅号自主申明
 */
export interface QiEHaoContentStatement {
  /**
   * 自主申明
   * -
   * 0:暂不申明
   * 2:个人观点，仅供参考
   * 3:剧情演绎，仅供娱乐
   * 8:健康医疗分享，仅供参考
   * 9:危险行为，请勿模仿
   */
  type: QiEHaoStatementType;
}

/**
 * 企鹅号文章自主申明
 */
export interface QiEHaoArticleContentStatement {
  /**
   * 自主申明
   * -
   * 0:不申明
   * 1:该文章由AI生成
   * 2:个人观点，仅供参考
   * 3:剧情演绎，仅供娱乐
   * 7:该文章由AI辅助创作
   * 8:健康医疗分享，仅供参考
   * 9:危险行为，请勿模仿
   */
  type: QiEHaoArticleStatementType;
}

/**
 * 企鹅号平台文章表单
 * @description 企鹅号文章发布表单的数据结构
 * @interface QiEHaoArticlePlatformBody
 */
export interface QiEHaoArticlePlatformBody {
  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 文章封面的表单项，可选字段
   *
   * 约束条件：
   * - 最大文件大小20MB
   */
  covers?: ImageInfo[];

  /**
   * 文章标题
   * @type {string}
   * @description 文章的标题文本
   *
   * 约束条件：
   * - 必填
   * - 最小长度5个字符
   * - 最大长度64个字符
   * @example "企鹅号文章分享"
   */
  title: string;

  /**
   * 文章正文内容
   * @type {string}
   * @description 文章的正文内容，HTML格式
   *
   * 约束条件：
   * - 必填
   * - 最大长度20000个字符
   *
   * 格式要求：
   * - HTML格式：内容应该用 `<div>` 标签包裹
   * @example "<div><p>这是一篇精彩的文章内容</p></div>"
   */
  content: string;

  /**
   * 文章标签
   * @type {string[]}
   * @description 文章的标签列表，用于分类和推荐
   *
   * 约束条件：
   * - 最多9个标签
   * - 每个标签最大长度8个字符
   * @example ["生活", "娱乐", "分享"]
   */
  tags?: string[];

  /**
   * 文章自主申明
   * @type {QiEHaoArticleContentStatement}
   * @description 内容声明选项，可选字段，用于标识内容类型或来源
   *
   * 约束条件：
   * - 当不提供时，表示"无需声明"
   */
  statement?: QiEHaoArticleContentStatement;

  /**
   * 定时发布时间
   * @type {PubType}
   * @description 文章的定时发布13位时间戳，可选字段
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：4小时
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
