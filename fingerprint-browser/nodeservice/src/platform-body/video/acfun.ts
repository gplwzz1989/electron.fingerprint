import { VideoFormItem } from '@/cloud/model/UIFormModel';
import { ImageInfo, ListItemInfo } from '@/media-platform';

/**
 * ACFun视频平台表单
 * @description AcFun视频发布表单的数据结构
 * @interface ACFunVideoPlatformBody
 */
export interface ACFunVideoPlatformBody {
  /**
   * 视频文件
   * @type {VideoFormItem}
   * @description 视频文件的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小20GB
   * -最大时长 30分钟
   */
  video: VideoFormItem;

  /**
   * 封面图
   * @type {ImageInfo[]}
   * @description 视频封面的表单项，必填字段
   *
   * 约束条件：
   * - 最大文件大小10MB
   * -最小分辨率240*135
   */
  covers: ImageInfo[];

  /**
   * 视频标题
   * @type {string}
   * @description 视频的标题文本，必填字段
   *
   * 约束条件：
   * - 最大长度50个字符，最小长度1个字符
   * @example "阿加莎"
   */
  title: string;

  /**
   * 视频描述
   * @type {string}
   * @description 视频的描述内容，必填字段
   *
   * 约束条件：
   * - 最大长度1000个字符，最小长度0个字符
   *
   * 格式要求：
   * - 支持HTML格式：内容应该用 `<p>` 标签包裹，支持多个 `<p>` 标签
   * - 不支持话题标签（使用独立的tags字段）
   * @example "<p>这是一个精彩的视频内容</p><p>欢迎观看和分享</p>"
   */
  desc?: string;

  /**
   * 视频标签
   * @type {string[]}
   * @description 可选，最多6个标签，单个标签最多10个字
   *
   * 约束条件：
   * - 可选
   * @example ["生活", "娱乐", "分享"]
   */
  tags?: string[];
  /**
   * 视频一级分类
   * @type {ListItemInfo}
   * @description 视频的分类信息，必选字段，来源于分类接口
   *
   * 约束条件：
   *
   *
   */
  category: ListItemInfo;

  /**
   * 视频二级分类
   * @type {ListItemInfo}
   * @description 当一级分类在二级分类时必选，来源于一级分类
   *
   * 约束条件：
   * -
   *
   */
  subCategory: ListItemInfo;

  /**
   * 内容类型
   * @type {ACFunContentType}
   * @description 视频的内容类型，1:原创 0:非原创
   */
  createType: ACFunContentType;
  /**
   * 定时发布时间
   * @type {number}
   * @description 可选，13位毫秒时间戳
   *
   * 约束条件：
   * - 当不提供时，表示立即发布
   * - 时间戳必须为未来时间
   * - 最小间隔：4小时
   * - 最大间隔：14天
   */
  prePubTime?: number;
}

/**
 * AcFun创作类型
 * @description AcFun平台支持的视频内容类型
 * 1:原创
 * 2:转载
 */
export enum ACFunContentType {
  /**
   * 申明原创
   */
  Original = 1,
  /**
   * 不申明
   */
  Forward = 2,
}

/**
 * AcFun平台文章表单
 * @description AcFun文章发布表单的数据结构
 * @interface ACFunArticlePlatformBody
 */
export interface ACFunArticlePlatformBody {
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
   * - 最小长度1个字
   * - 最大长度50个字
   */
  title: string;

  /**
   * 文章描述/摘要
   */
  desc?: string;

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
   * 话题标签关键词，最多1个 ，实际对应官方的话题
   */
  tags?: Array<string>;

  /**
   * 一级分类
   */
  category: ListItemInfo;

  /**
   * 二级分类
   */
  subCategory: ListItemInfo;

  /**
   * 创作类型,0:不申明  1:申明原创
   */
  createType: ACFunContentType;
}
