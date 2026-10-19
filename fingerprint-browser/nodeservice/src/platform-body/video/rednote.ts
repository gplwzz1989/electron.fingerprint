import { VideoFormItem2 } from '../common';
import { ImageInfo, ListItemInfo } from '@/media-platform';

/**
 * 小红书海外视频发布表单
 */
export interface RedNoteVideoPlatformBody {
  /** 视频文件，最大20GB、最长60分钟 */
  video: VideoFormItem2;

  /** 视频封面，发布时使用第一张 */
  covers: ImageInfo[];

  /** 视频标题，最大20个字符 */
  title?: string;

  /** 视频描述，最大1000个字符，支持话题和用户标签 */
  desc?: string;

  /** 发布位置，来源于地址搜索接口 */
  location?: ListItemInfo;

  /** 定时发布时间，13位时间戳；不传表示立即发布 */
  prePubTime?: number;

  /** 可见范围 */
  visibleType: RedNoteVisibleType;

  /** 创作内容声明 */
  statement?: RedNoteContentStatement;

  /** 群聊，来源于群聊列表接口 */
  group?: ListItemInfo;

  /** 原创声明 */
  createType?: RedNoteCreateType;
}

/**
 * 小红书海外图文发布表单
 */
export interface RedNoteDynamicPlatformBody {
  /** 图片列表，1至18张 */
  images: ImageInfo[];

  /** 图文标题，最大20个字符 */
  title?: string;

  /** 图文描述，最大1000个字符，最多10个话题 */
  desc?: string;

  /** 发布位置，来源于地址搜索接口 */
  location?: ListItemInfo;

  /** 定时发布时间，13位时间戳；不传表示立即发布 */
  prePubTime?: number;

  /** 可见范围 */
  visibleType: RedNoteVisibleType;

  /** 创作内容声明 */
  statement?: RedNoteContentStatement;

  /** 群聊，来源于群聊列表接口 */
  group?: ListItemInfo;

  /** 原创声明 */
  createType?: RedNoteCreateType;
}

export enum RedNoteCreateType {
  original = 1,
  none = 0,
}

export enum RedNoteStatementType {
  ONLY_FOR_FUN = 1,
  AIGC = 2,
  MARK = 3,
  OWN = 4,
  FORWARD = 5,
}

export interface RedNoteContentStatement {
  /** 内容声明类型 */
  type: RedNoteStatementType;

  /** 自行拍摄信息，仅在声明为自行拍摄时使用 */
  photoInfo?: RedNotePhotoInfo;

  /** 转载来源，仅在声明为转载时使用 */
  forward_source?: string;
}

export interface RedNotePhotoInfo {
  /** 拍摄地点 */
  address: ListItemInfo;

  /** 拍摄时间戳 */
  time: number;
}

export enum RedNoteVisibleType {
  public = 0,
  private = 1,
  friend = 3,
}
