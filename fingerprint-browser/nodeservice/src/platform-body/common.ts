/**
 * 发布类型枚举
 * 0:存草稿
 * 1:直接发布
 * @description 用于指定是存草稿还是直接发布
 */
export enum PubType {
  /**
   * 草稿
   */
  DRAFT = 0,
  /**
   * 直接发布
   */
  PUBLISH = 1,
}

/**
 * 视频表单项
 * @description 视频宽高可选
 */
export interface VideoFormItem {
  /**
   * 视频时长，单位秒
   */
  duration?: number;
  /**
   * 视频宽度，单位px
   */
  width?: number;
  /**
   * 视频高度，单位px
   */
  height?: number;
  /**
   * 视频大小，单位Byte
   */
  size?: number;
  /**
   * 视频的url，云发布时必填（和localPath必选一个）
   */
  url?: string;
  /**
   * 视频的本地路径，不支持云发布（本地发布时和url必选一个）
   */
  localPath?: string;
}
/**
 * 视频表单项2
 * @description 视频宽高必选
 */
export interface VideoFormItem2 {
  /**
   * 视频时长，单位秒
   */
  duration: number;
  /**
   * 视频宽度，单位px
   */
  width: number;
  /**
   * 视频高度，单位px
   */
  height: number;
  /**
   * 视频大小，单位Byte
   */
  size?: number;
  /**
   * 视频的url，云发布时必填（和localPath必选一个）
   */
  url?: string;
  /**
   * 视频的本地路径，不支持云发布（本地发布时和url必选一个）
   */
  localPath?: string;
}

/**
 * 地址类型
 * @description 用于指定搜索地址时的类型
 */
export enum LocationType {
  /**
   * 默认，不区分类型
   */
  default = 0,

  /**
   * 本地地址（ip所在地）
   */
  local = 1,

  /**
   * 全国、国内地址
   */
  country = 2,

  /**
   * 海外地址
   */
  oversea = 3,
}
