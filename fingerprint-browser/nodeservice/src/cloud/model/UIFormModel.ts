import { KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { PubContentEnum } from '@/cloud/model/TypeEnum';
import { Platforms } from '@/service/datasync-service-manager';

export interface SingleVideoDataModel {
  /**
   * 平台中文名称
   */
  platform: Platforms;
  /**
   * 媒体号信息
   */
  platformAccount: PlatformAccountInfoResponse;
  videoPath?: string;
  cover?: string;
  taskId: string;
  wxkey: string | null;
  /**
   * 代理
   */
  proxy?: KuaiDaiLiProxy;
}

/**
 * 媒体号信息
 */
export interface PlatformAccountInfoResponse {
  platformAccountId: string;

  /**
   * 媒体号空间id，用于获取cookie等数据
   */
  platformAccountSpaceId: string;
  /**
   *媒体号名称
   */
  platformAccountName: string;
  /**
   * 媒体号官方id
   */
  platformAuthorId: string;
  /**
   * 父账号Id
   */
  parentId: string | null;

  /**
   * 媒体账号有效登录cookie
   */
  cookie?: string;

  /**
   * 媒体号登录后的localstorage，抖音需要，也可以将参数按规则放到cookie，忽略localstorage
   */
  localStorage?: object;
}

/**
 * 视频任务
 */
export interface CloudPublishTaskVideoFromLite {
  /**
   * 发布作品类型(编辑类型)
   */
  publishType: PubContentEnum;

  /**
   * 服务端鉴权token
   */
  authToken: string;

  /**
   * 回调鉴权token，开放平台
   */
  authorization?: string;

  /**
   * 自定义数据，数据回传时会以字段名callBackData原样返回
   */
  callBackData?: object;

  /**
   * 视频资源
   */
  data: Array<SingleVideoDataModel>;
  formData: TaskSetForm;
}

export interface TaskSetCreateRequest {
  /**
   * 任务集封面存储Key
   */
  coverKey?: string;
  /**
   * 描述
   */
  desc?: string;
  /**
   * 是否为草稿
   */
  isDraft: boolean;
  /**
   * 是否定时任务
   */
  isTimed?: number;
  /**
   * 账号媒体数组信息
   */
  platformAccounts: PublishAccountRequest[];
  /**
   * 账号媒体ID数组
   */
  platforms: string[];
  /**
   * 发布参数(动态结构, 服务端不做任何处理, 会原封不动的下发给客户端用于发布)
   */
  publishArgs: TaskSetForm;
  /**
   * 发布渠道本机发布:local,云端:cloud
   */
  publishChannel?: 'local' | 'cloud';
  /**
   * 是否来自 App 内容发布任务
   */
  isAppContent?: boolean;
  /**
   * 任务集发布类型
   */
  publishType: string;
}
// 服务端账号项
export interface PublishAccountRequest {
  /**
   * 封面地址(上传到OSS)
   */
  coverKey?: string;
  /**
   * 媒体账号id
   */
  platformAccountId: string;
  /**
   * 视频地址(上传到天翼云)
   */
  videoKey?: string;
}

export type TaskSetForm = VideoTaskSetForm | ArticleTaskSetForm | ImageTextTaskSetForm;

// 视频内容表单
export interface VideoTaskSetForm {
  accounts: {
    video: VideoFormItem;
    cover: ImageFormItem;
    accountId: string;
  }[];
  aPlatform: {
    title: string;
    description: string;
  };
  bPlatform: {
    title: string;
    description: string;
    tags: string[];
  };
  isOriginal?: boolean;
  timing?: number;
  categories?: {
    [key: string]: CascadingDataItem[] | undefined;
  };
  location?: {
    [key: string]: DataItem | undefined;
  };
  isDraft: boolean;

  aiStatement?: {
    [key: string]: Statement | undefined;
  };
}

// 图文内容表单
export interface ImageTextTaskSetForm {
  accounts: {
    accountId: string;
  }[];
  title: string;
  description: string;
  location: {
    [key: string]: DataItem | undefined;
  };
  images: ImageFormItem[];
  cover: ImageFormItem | undefined;
  music: {
    [key: string]: MusicPlatformDataItem | undefined;
  };
  timing?: number;
  isDraft: boolean;
}

// 文章内容表单
export interface ArticleTaskSetForm {
  accounts: {
    accountId: string;
  }[];
  cover?: ImageFormItem;
  /** 横版封面；cover 保留作为通用表单的兼容字段 */
  horizontalCover?: ImageFormItem;
  verticalCover?: ImageFormItem;
  /** 广告投放选项，2：不投放广告，3：投放广告 */
  advertisement?: 2 | 3;
  isFirst: boolean;
  categories?: {
    [key: string]: CascadingDataItem[] | undefined;
  };
  locationKeyword?: string;
  title: string;
  content: string;
  timing?: number;
  topic?: {
    [key: string]: DataItem[] | undefined;
  };
  isDraft: boolean;
}

export interface ImageFormItem {
  width: number;
  height: number;
  size: number; // Byte
  key?: string;
  path?: string;
}

export interface VideoFormItem {
  duration: number; // 秒
  width: number;
  height: number;
  size: number; // Byte
  key?: string;
  path?: string;
}

// 平面数据项
interface DataItem<TRaw = unknown> {
  id: string;
  text: string;
  raw: TRaw;
}
// 级联数据项
interface CascadingDataItem<TRaw = unknown> extends DataItem<TRaw> {
  children?: CascadingDataItem<TRaw>[];
}
interface MusicPlatformDataItem<TRaw = unknown> {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
  raw: TRaw;
}

interface Statement {
  isAigc: boolean;
}
