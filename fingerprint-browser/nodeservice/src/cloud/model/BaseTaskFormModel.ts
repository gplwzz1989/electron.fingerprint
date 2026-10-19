import { ContentCreateTypeEnum, PubContentEnum, VisibleTypeEnum } from './TypeEnum';
import { ImageInfo, ListItemInfo, MusicItemInfo } from '../../media-platform/baseModel';
import { Platforms } from '../../service/datasync-service-manager';
import { IWebProxy, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { CancelToken } from '@/utils/CancelToken';
import { PlatformTaskSet } from '../../platform-body/platform-task';

/**
 * 任务集基础
 */
export interface BaseCloudPublishTaskFormModel {
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
   * 发布执行来源
   */
  publishChannel?: string;

  /**
   * 本地发布指定的客户端id
   */
  clientId?: string;

  /**
   * 开放平台应用id
   */
  applicationId?: string;

  /**
   * 当前用户id
   */
  userId?: string;
}

/**
 * 视频任务
 */
export interface CloudPublishTaskFormModelVideo extends BaseCloudPublishTaskFormModel {
  /**
   * 视频资源
   */
  data: Array<BasePublishTaskFormModelSingleVideo>;
}

/** 音频任务 */
export interface CloudPublishTaskFormModelAudio extends BaseCloudPublishTaskFormModel {
  data: Array<BasePublishTaskFormModelSingleAudio>;
}

/**
 * 文章任务
 */
export interface CloudPublishTaskFormModelArticle extends BaseCloudPublishTaskFormModel {
  /**
   * 正文html
   */
  data: Array<BasePublishTaskFormModelSingleArticle>;
}

/**
 * 动态/图文任务
 */
export interface CloudPublishTaskFormModelDynamic extends BaseCloudPublishTaskFormModel {
  /**
   * 图片资源
   */
  data: Array<BasePublishTaskFormModelSingleDynamic>;
}

export interface BaseFromData {
  /**
   * 封面
   */
  covers: Array<ImageInfo>;
  /**
   * 标题
   */
  title: string;
  /**
   * 描述-html超文本
   */
  desc: string;
  /**
   * 创作类型
   */
  createType?: ContentCreateTypeEnum;

  /**
   * 定时发布时间戳
   */
  prePubTime?: number;

  /**
   * 可见类型
   */
  visibleType?: VisibleTypeEnum;

  /**
   * 群发性别
   */
  sex?: 0 | 1 | 2;

  /**
   * 群发国家
   */
  country?: string;

  /**
   * 群发省份
   */
  province?: string;

  /**
   * 群发城市
   */
  city?: string;

  /**
   * 发布媒体号列表及配置
   */
  platformAccounts: Array<{
    /**
     * 媒体平台
     */
    platform: Platforms;

    /**
     * 媒体号业务id
     */
    platformAccountId: string;

    /**
     * 需要区分平台或者账号的配置
     */
    extConfig?: {
      /**
       * 地理位置信息
       */
      location?: ListItemInfo;

      /**
       * 一级分类
       */
      category?: ListItemInfo;

      /**
       * 二级分类
       */
      subCategory?: ListItemInfo;

      /**
       * 标签
       */
      tags?: Array<string>;

      /**
       * 音乐信息
       */
      music?: MusicItemInfo;

      /**
       * B站视频参与话题，与普通话题独立。
       */
      participationTopic?: ListItemInfo;
    };
  }>;
}
export interface VideoFormData extends BaseFromData {
  /**
   * 视频
   */
  video: {
    /**
     * 时长-秒
     */
    duration: number;
    /**
     * 视频宽度
     */
    width?: number;
    /**
     * 视频高度
     */
    height?: number;
    /**
     * 视频字节数大小
     */
    size?: number;
    /**
     * 视频本地路径
     */
    localPath: string;
  };
}
export interface DynamicFormData extends BaseFromData {
  /**
   * 图片
   */
  images: Array<ImageInfo>;
}
export interface ArticleFormData extends BaseFromData {
  /**
   * 正文内容html
   */
  content: string;

  /**
   * 横版封面
   */
  horizontalCover?: ImageInfo;

  /**
   * 竖版封面
   */
  verticalCover?: ImageInfo;

  /**
   * 广告投放选项，2：不投放广告，3：投放广告
   */
  advertisement?: 2 | 3;
}
/**
 * 基础任务集
 */
export interface BasePublishTaskFormModelSingle {
  platformAccounts: Array<{
    /**
     * 子任务id，由服务端生成进行填充
     */
    taskId: string;
    /**
     * 微信Token
     */
    wxkey: string | null;
    /**
     * 媒体平台
     */
    platform: Platforms;

    platformAccount: PlatformAccountInfo;

    /**
     * 代理信息
     */
    proxy?: KuaiDaiLiProxy;
  }>;
}

/**
 * 视频任务集
 */
export interface BasePublishTaskFormModelSingleVideo extends BasePublishTaskFormModelSingle {
  formData: VideoFormData;
}

export interface AudioFormData extends BaseFromData {
  audio: {
    duration?: number;
    size?: number;
    localPath?: string;
    url?: string;
  };
}

export interface BasePublishTaskFormModelSingleAudio extends BasePublishTaskFormModelSingle {
  formData: AudioFormData;
}

/**
 * 图文任务集
 */
export interface BasePublishTaskFormModelSingleDynamic extends BasePublishTaskFormModelSingle {
  formData: DynamicFormData;
}

/**
 * 文章任务集
 */
export interface BasePublishTaskFormModelSingleArticle extends BasePublishTaskFormModelSingle {
  formData: ArticleFormData;
}

/**
 * 子任务
 */
export interface BaseSinglePublishTask {
  /**
   * 发布作品类型(编辑类型)
   */
  publishType: PubContentEnum;

  /**
   * 服务端鉴权token
   */
  authToken?: string;
  /**
   * 子任务id，由服务端生成进行填充
   */
  taskId: string;
  /**
   * 微信Token
   */
  wxkey?: string | null;
  /**
   * 媒体平台
   */
  platform: Platforms;
  /**
   * 封面
   */
  covers: Array<ImageInfo>;

  /**
   * 竖版封面
   */
  verticalCovers?: Array<ImageInfo>;

  /**
   * 竖版封面
   */
  verticalCover?: ImageInfo;

  /**
   * 横版封面
   */
  horizontalCover?: ImageInfo;
  /**
   * 标题
   */
  title: string;

  /**
   * 短标题
   */
  short_title: string;
  /**
   * 描述-html超文本
   */
  desc: string;
  /**
   * 创作类型
   */
  createType?: ContentCreateTypeEnum;

  /**
   * 发布时关联的群聊/群组
   */
  group?: ListItemInfo;

  /**
   * 原文链接,一般转自啊时需要
   */
  contentSourceUrl?: string;

  /**
   * 定时发布时间戳
   */
  prePubTime?: number;
  /**
   * 可见类型
   */
  visibleType?: VisibleTypeEnum;
  /**
   * 媒体账号信息
   */
  platformAccount: PlatformAccountInfo;
  /**
   * 代理信息
   */
  proxy?: KuaiDaiLiProxy;

  /**
   * 是否来自 App 内容发布任务。
   */
  isAppContent?: boolean;

  /**
   * 1:直接发布，非1草稿
   */
  pubType: 0 | 1;

  /**
   * 取消任务的参数
   */
  cancelToken?: CancelToken;
  /**
   * 抖音需要的
   */
  localStorage?: object;

  /**
   * 微信公众号专用
   */
  notifySubscribers?: number;

  /**
   * 微信公众号专用
   */
  sex?: 0 | 1 | 2;

  /**
   * 微信公众号专用
   */
  country?: string;

  /**
   * 微信公众号专用
   */
  province?: string;

  /**
   * 微信公众号专用
   */
  city?: string;

  /**
   * 微信公众号专用
   */
  groupId?: string;

  /**
   * 微信公众号专用
   */
  needOpenComment?: 0 | 1 | 2 | 3;

  /**
   * 微信公众号专用
   */
  disableRecommend?: 0 | 1;

  /**
   * 微信公众号专用
   */
  contentList?: Array<object>;

  /**
   * 团购信息
   */
  group_shopping: object;

  /**
   * 挂载小程序信息
   */
  mini_app?: ListItemInfo;

  /**
   * 购物车
   */
  shopping_cart: object;

  /**
   * 合集
   */
  collection: object;

  /**
   * 合集选集
   */
  sub_collection?: ListItemInfo;

  /**
   * 活动
   */
  activity?: object;

  /**
   * B站视频发布页参与话题，与普通话题独立；需携带查询/搜索结果的完整列表项。
   */
  participationTopic?: ListItemInfo;

  /**
   * 热点
   */
  hot_event?: ListItemInfo;

  /**
   * 挑战
   */
  challenge?: ListItemInfo;

  /**
   * 是否同城展示
   */
  nearby_show?: boolean;

  needParts?:boolean;
}

/**
 * 媒体号信息
 */
export interface PlatformAccountInfo {
  platformAccountId?: string;

  /**
   * 媒体号空间id，用于获取cookie等数据
   */
  platformAccountSpaceId?: string;
  /**
   *媒体号名称
   */
  platformAccountName?: string;
  /**
   * 媒体号官方id
   */
  platformAuthorId?: string;
  /**
   * 媒体号官方原始数据
   */
  platformAuthorData?: object;

  /**
   * 媒体号cookie，发布时由发布服务获取并填充
   */
  cookie: string;

  /**
   * 抖音需要
   */
  localStorage?: object;

  /**
   * 父账号Id
   */
  parentId?: string | null;

  /**
   * 微信key
   */
  wxkey?: string | null;

  /**
   * 开放平台回调鉴权token
   */
  authorization?: string;

  /**
   * 数据回调时原样返回的数据
   */
  callBackData?: object;

  proxy?: IWebProxy;
}

/**
 * 子任务
 */
export interface BaseSinglePublishTaskVideo extends BaseSinglePublishTask {
  /**
   * 视频
   */
  video: {
    /**
     * 时长-秒
     */
    duration: number;
    /**
     * 视频宽度
     */
    width: number;
    /**
     * 视频高度
     */
    height: number;
    /**
     * 视频字节数大小
     */
    size?: number;
    /**
     * 视频本地路径
     */
    localPath: string;
  };

  /**
   * 地理位置信息，来自未知接口的选项
   */
  location?: ListItemInfo;

  /**
   * 挂载小程序信息
   */
  mini_app?: ListItemInfo;

  /**
   * 一级分类
   */
  category?: ListItemInfo;
  /**
   * 二级分类
   */
  subCategory?: ListItemInfo;

  /**
   * 标签
   */
  tags?: Array<string>;

  /**
   * 知乎话题
   */
  topics?: ListItemInfo[];

  /**
   * 创作申明
   */
  statement?: {
    type: number;
  };

  /**
   * 视频号短剧
   */
  drama?: ListItemInfo;
}

/** 通用音频发布任务。当前由喜马拉雅使用。 */
export interface BaseSinglePublishTaskAudio extends BaseSinglePublishTask {
  audio: {
    duration?: number;
    size?: number;
    localPath?: string;
    url?: string;
  };
  /** 待上传的封面文件；未传时可继续使用已上传的 soundCoverPath。 */
  cover?: ImageInfo;

  /** 兼容旧调用；新调用请使用 album，并由适配层取 yixiaoerId。 */
  albumId?: number | string;
  /** 外部选择的完整专辑项；raw 用于校验分类与可见范围。 */
  album?: ListItemInfo;
  /** 喜马拉雅分类 ID。 */
  categoryId?: number | string;
  soundRichIntro?: string;
  soundCoverPath?: { fileId: number; fileUrl?: string };
  tags?: string[];
  topics?: ListItemInfo[];
  visibleCrowdType?: number;
  isFree?: boolean;
  isTrailer?: boolean;
  trackVipFirst?: boolean;
  statement?: { type: StatementTypeEnum };
  isAiTrack?: boolean;
  lrcPath?: string;
  anchorActivity?: { isSynActivity?: boolean; shareContent?: string };
  communityWidget?: object;
  activityId?: string;
  /**
   * 喜马拉雅创作中心生成的设备签名。
   * TODO: 后续由内置浏览器签名服务自动生成。
   */
  xmSign?: string;
}

export enum StatementTypeEnum {
  '不声明' = 0,
  'AI创作声明' = 1,
  '图片视频由AI生成' = 2,
}

export interface BaseSinglePublishTaskArticle extends BaseSinglePublishTask {
  /**
   * 正文html
   */
  content: string;

  /**
   * 广告投放选项，2：不投放广告，3：投放广告
   */
  advertisement?: 2 | 3;

  /**
   * 获取内容的url，小二内部使用
   */
  contentPublishUrl: string;

  /**
   * 地理位置关键字
   */
  locationKeyword?: string;

  /**
   * 地理位置信息
   */
  location?: ListItemInfo;

  /**
   * 头条首发
   */
  isFirst?: boolean;

  /**
   * 一级分类
   */
  category?: ListItemInfo;

  /**
   * 二级分类
   */
  subCategory?: ListItemInfo;

  /**
   * 话题
   */
  topics?: ListItemInfo[];

  /**
   * 标签
   */
  tags?: Array<string>;

  /**
   * 暂时只有百家，类型不明确
   */
  statement?: {
    type: number;
  };
}

export interface BaseSinglePublishTaskDynamic extends BaseSinglePublishTask {
  /**
   * 正文html
   */
  images: Array<ImageInfo>;

  /**
   * 地理位置信息
   */
  location?: ListItemInfo;

  /**
   * 音乐信息
   */
  music?: MusicItemInfo;

  /**
   * 申明
   */
  statement?: {
    type: StatementTypeEnum;
  };

  /**
   * 视频号短剧
   */
  drama?: ListItemInfo;
}

export interface OpenPlatformTaskSet extends PlatformTaskSet {
  platform: Array<OpenPlatformAuthorInfo>;
}

export interface OpenPlatformAuthorInfo {
  /**
   * 开放平台媒体号备案id
   */
  id: string;
  /**
   * 平台
   */
  platformCode: Platforms;

  /**
   * 媒体平台账号id
   */
  platformUserId: string;
  /**
   * 昵称
   */
  platformUserName: string;
  platformAvatar: string;
  /**
   * 媒体号cookie字符串
   */
  platformCookie: string;
  /**
   * 抖音用
   */
  platformLocalStorage?: string;
}
