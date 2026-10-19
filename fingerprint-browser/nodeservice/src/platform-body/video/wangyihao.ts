import { VideoFormItem, PubType } from '../common';
import { ImageInfo, ListItemInfo } from '@/media-platform';
import { WeiXinShiPinHaoOriginalType } from '@/platform-body/video/weixinshipinhao';

/**
 * 网易号平台表单
 * @description 网易号视频发布表单的数据结构
 * @interface WangYiHaoVideoPlatformBody
 */
export interface WangYiHaoVideoPlatformBody {
  /**
   * 视频文件
   * @type {VideoFormItem}
   * @description 视频文件的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小8GB
   */
  video: VideoFormItem;

  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 视频封面的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小10MB
   */
  covers: ImageInfo[];

  /**
   * 视频标题
   * @type {string}
   * @description 视频的标题文本，必填字段
   *
   * 约束条件：
   * - 最小长度5个字符，最大长度30个字符
   * @example "网易号视频分享"
   */
  title: string;

  /**
   * 视频描述
   * @type {string}
   * @description 视频的描述内容，必填字段
   *
   * 约束条件：
   * - 无长度限制
   *
   * 格式要求：
   * - 支持HTML格式：内容应该用 `<p>` 标签包裹，支持多个 `<p>` 标签
   * - 不支持话题标签（使用独立的tags字段）
   * @example "<p>这是一个精彩的视频内容</p><p>欢迎大家观看</p>"
   */
  desc?: string;

  /**
   * 视频标签
   * @type {string[]}
   * @description 视频的标签列表，必填字段，用于分类和推荐
   *
   * 约束条件：
   * - 必须包含3-5个标签
   * - 每个标签无长度限制
   * @example ["生活", "娱乐", "分享", "记录", "美好"]
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
   * 来源于以及分类的子类
   * @type {ListItemInfo}
   * @description 视频的分类信息
   *
   *
   */
  subCategory: ListItemInfo;

  /**
   * 创作内容声明
   * @type {WangYiHaoContentStatement}
   * @description 内容声明选项，可选字段，用于标识内容类型或来源
   *
   * 约束条件：
   * - 当不提供时，表示"无需声明"
   */
  statement?: WangYiHaoContentStatement;

  /**
   * 原创
   * 默认不勾选
   * 0：不勾选
   * 1：勾选原创
   * @type {WangYiHaoOriginalType}
   * @description 勾选原创
   * @warning 选择"原创"时，仅当账号支持原创功能时才有效
   */
  createType?: WangYiHaoOriginalType;
  /**
   * 定时发布时间
   * @type {number}
   * @description 视频的定时发布13位时间戳，可选字段
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：5小时
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
export enum WangYiHaoOriginalType {
  None = 0,
  Original = 1,
}

/**
 *创作申明
 * -
 * 1：内容由AI生成
 * 2：个人原创，仅供参考
 * 3：取材网络，谨慎辨别
 * 4：虚构演绎，仅供娱乐
 */
export enum WangYiHaoStatementType {
  '内容由AI生成' = 1,
  '个人原创，仅供参考' = 2,
  '取材网络，谨慎辨别' = 3,
  '虚构演绎，仅供娱乐' = 4,
}

/**
 * 网易号申明,默认留空
 */
export interface WangYiHaoContentStatement {
  /**
   *创作申明
   * -
   * 1：内容由AI生成
   * 2：个人原创，仅供参考
   * 3：取材网络，谨慎辨别
   * 4：虚构演绎，仅供娱乐
   */
  type: WangYiHaoStatementType;
}

/**
 * 网易号平台文章表单
 * @description 网易号文章发布表单的数据结构
 * @interface WangYiHaoArticlePlatformBody
 */
export interface WangYiHaoArticlePlatformBody {
  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 文章封面的表单项
   *
   * 约束条件：
   * - 必填，至少1张封面图
   * - 最小像素尺寸160x160
   * - 最大文件大小10MB
   */
  covers: ImageInfo[];

  /**
   * 文章标题
   * @type {string}
   * @description 文章的标题文本
   *
   * 约束条件：
   * - 必填
   * - 最小长度5个字符
   * - 最大长度30个字符
   * @example "网易号文章分享"
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
   * 原创
   * 默认不勾选
   * 0：不勾选
   * 1：勾选原创
   * @type {WangYiHaoOriginalType}
   * @description 勾选原创
   * @warning 选择"原创"时，仅当账号支持原创功能时才有效
   */
  createType?: WangYiHaoOriginalType;

  /**
   * 创作内容声明
   * @type {WangYiHaoContentStatement}
   * @description 内容声明选项，可选字段，用于标识内容类型或来源
   *
   * 约束条件：
   * - 当不提供时，表示"无需声明"
   */
  statement?: WangYiHaoContentStatement;

  /**
   * 定时发布时间
   * @type {number}
   * @description 文章的定时发布13位时间戳，可选字段
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：2小时
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
 * 网易号高权益
 */
export interface WangYiHaoPrivilege {
  /**
   * 文章原创
   * @type{boolean}
   */
  article_original: boolean;
  /**
   * 视频原创
   * @type{boolean}
   */
  video_original: boolean;
}
