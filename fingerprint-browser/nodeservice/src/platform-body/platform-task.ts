import {
  BiLiBiLiPrivilege,
  DouYinPrivilege,
  KuaiShouPrivilege,
  PlatformBody,
  ShiPinHaoPrivilege,
  TouTiaoPrivilege,
  WangYiHaoPrivilege,
  WeiBoPrivilege,
  YiDianHaoPrivilege,
} from '@/platform-body/video';
import { Platforms } from '@/service/datasync-service-manager';
import { IWebProxy, KuaiDaiLiProxy } from '@/media-platform/webproxy';

/**
 * 发布任务集
 */
export type PlatformTaskSet = {
  /**
   * 发布类型，
   * @type {string}
   * @description 必选,video:视频，article:文章（图片和文字混编-html）,dynamic:动态（图片和文字分离-text）
   * @default null
   * @example F6152615277
   */
  publishType: 'video' | 'audio' | 'article' | 'dynamic';
  /**
   * 开放平台回调鉴权
   */
  authorization: string;

  /**
   * 自定义数据，回调原样返回
   */
  callBackData: object;

  /**
   * 子任务列表（每个媒体号的一次内容发布）
   */
  tasks: Array<PlatformTask>;

  /**
   * 开放平台后端使用
   */
  publishChannel: string;
  /**
   * 开放平台后端是会用
   */
  clientId: string;

  /**
   * 是否来自 App 内容发布任务。
   * 该标记只用于 App 发布链路的兼容处理，Web 任务保持原有行为。
   */
  isAppContent?: boolean;

  /**
   * 开放平台应用id
   */
  applicationId?: string;

  /**
   * 当前用户id
   */
  userId?: string;

  taskSetId?: string;

  /**
   * 需要回传分片进度
   */
  need_parts_back?: boolean;
};

export type PlatformTask = {
  /**
   * 子任务唯一id（一个媒体号的单次内容发布唯一标志id）
   */
  taskId: string;
  /**
   * 媒体号相关信息
   */
  authorInfo: PlatformAuthor;

  /**
   * 需要发布的数据信息
   */
  publishData: PlatformBody;
};
export type PlatformAuthor = {
  /**
   * 媒体号所属平台，
   * @type {Platforms}
   * @description 必选,来源于获取用户信息接种返回结果中 yixiaoerId
   * @default null
   * @example F6152615277
   */
  platform: Platforms;
  /**
   * 媒体号有效cookie，
   * @type {string}
   * @description 必选
   * @default null
   * @example 第一种: a=b;c=d;m=1  第二种:[{\"name\":\"cookie1\",\"value\":\"cookie1_value\"}]
   */
  cookie: string;

  /**
   * 媒体号在官方媒体的id，来源于授权获取到的id，
   * @type {string}
   * @description 必选,来源于获取用户信息接种返回结果中 yixiaoerId
   * @default null
   * @example F6152615277
   */
  authorId: string;

  authorName?: string;

  /**
   * 媒体号唯一id----在开放平台的备案id
   * @type {string}
   * @description 必选,来源于绑定媒体号接口返回
   * @default null
   * @example dhnasdh233hasjkj123
   */
  id: string;

  /**
   * 代理参数
   * @type {IWebProxy}
   * @description 可选,代理参数
   * @default null
   * @example {"serverAdd":"127.0.0.1","serverPort":2312}
   */
  proxy?: IWebProxy;
};

/**
 * 媒体号高权益
 */
export type PlatformPrivilegeBody =
  | DouYinPrivilege
  | KuaiShouPrivilege
  | WeiBoPrivilege
  | TouTiaoPrivilege
  | WangYiHaoPrivilege
  | YiDianHaoPrivilege
  | BiLiBiLiPrivilege
  | ShiPinHaoPrivilege;
