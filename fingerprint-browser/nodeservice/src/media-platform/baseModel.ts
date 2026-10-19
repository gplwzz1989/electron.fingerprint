import { auditStatusEnum } from '@/utils';
import { BaseResult } from './baseResult';
import {
  CommentBackItem,
  ContentBackItem,
  MessageBackItem,
  MessageUserBackItem,
  Platforms,
} from '@/service/datasync-service-manager';

/**
 * 图片信息
 */
export interface ImageInfo {
  /**
   * 封面宽度
   */
  width?: number;
  /**
   * 封面高度
   */
  height?: number;
  /**
   * 封面字节数大小
   */
  size?: number;
  /**
   * 封面url或本地路径
   */
  pathOrUrl: string;

  /**
   * 图片格式
   */
  format?: string;
}

/**
 *
 */
export interface DataColumn {
  key: string;
  /**
   * 列头名称
   */
  name: string;
  /**
   * 对应合计值
   */
  value: string;
  /**
   * 按日期的列表每天值
   */
  list: Array<{
    /**
     * 日期时间戳13
     */
    date: number;
    /**
     * 对应日期的数量值
     */
    value: number;
  }>;
}

/**
 * 作品审核状态查询结果
 */
export interface MediaStatusResultOutput {
  /**
   * 结果状态
   */
  code: number;

  /**
   * 提示信息
   */
  msg: string;

  /**
   * 发布产生的id
   */
  publishId: string;

  /**
   * 作品唯一id
   */
  docId?: string;

  /**
   * 公开访问url
   */
  openUrl?: string;

  openUrls?: Array<{ title: string; openUrl: string; cover: string; documentId: string }>;

  /**
   * 封面url
   */
  coverUrl?: string;
  /**
   * 审核状态
   */
  auditStatus?: auditStatusEnum;
  /**
   * 作品创建时间13
   */
  create_time?: number;

  /**
   * 视频信息
   */
  data?: object;
}

/**
 * 统一标准官方用户信息后的结构
 */
export interface PlatformAuthorInfo extends BaseResult {
  /**
   * 用户id
   */
  yixiaoerId?: string;

  /**
   * 用户展示昵称
   */
  yixiaoerName?: string;

  /**
   * 用户头像url
   */
  yixiaoerImageUrl?: string;

  /**
   * 是否实名认证
   */
  verify?: boolean;

  /**
   * 微信公众号是否开启了发布内容需要扫码验证
   */
  publishCheck?: boolean;
  /**
   * 官方原始数据
   */
  raw?: object;
}

/**
 * 公开渠道作者搜索统一作者结构
 */
export enum PublicAuthorPlatformCode {
  BaiJiaHao = 'bjh',
  BiLiBiLi = 'bl',
  DouYin = 'dy',
  KuaiShou = 'ks',
  TouTiaoHao = 'tth',
  XinLangWeiBo = 'wb',
  XiaoHongShu = 'xhs',
  SouHuHao = 'sh',
}

export interface PlatformPublicAuthorInfo {
  platform_code: PublicAuthorPlatformCode;
  ext_author_id: string;
  nickname: string;
  avatar_url: string;
  description: string;
  aut_index: string;
  aut_spi_url?: string;
  follower_count: number;
  total_views: number;
  total_comments: number;
  total_likes: number;
  work_count: number;
}

/**
 * 公开渠道作者搜索统一返回结构
 */
export interface PlatformPublicAuthorListOutput extends BaseResult {
  dataList?: Array<PlatformPublicAuthorInfo>;
  nextPage?: string;
  raw?: unknown;
}

export type PlatformPublicWorkContentType = 'video' | 'miniVideo' | 'article' | 'dynamic';

export type PlatformPublicWorkSearchContentType = 'video' | 'miniVideo';

export interface PlatformPublicWorkInfo {
  platform_code: PublicAuthorPlatformCode;
  docid: string;
  title: string;
  url: string;
  cover_url: string;
  content_type: PlatformPublicWorkContentType;
  category: string;
  ext_category_id: string;
  ext_author_id: string;
  author?: PlatformPublicAuthorInfo;
  published_at: string;
  tags: Array<string>;
  metrics: {
    view: number;
    like: number;
    comment: number;
    share: number;
  };
  video_info?: {
    duration_ms: number;
    download_url: string;
  };
  raw?: unknown;
}

export interface PlatformPublicWorkListOutput extends BaseResult {
  dataList?: Array<PlatformPublicWorkInfo>;
  nextPage?: string;
  raw?: unknown;
}

/**
 * 媒体平台作品列表数据统一
 */
export interface PlatformContentItem {
  /**
   * 作品唯一id
   */
  id: string;
  /**
   * 标题
   */
  title?: string;
  /**
   * 封面url
   */
  cover?: string;

  /**
   * 描述
   */
  desc?: string;

  /**
   * 作品url地址
   */
  pageUrl?: string;
  /**
   * 作品类型
   */
  type?: 'video' | 'miniVideo' | 'dynamic' | 'article';

  /**
   * 发布时间,格式为'YYYY-MM-DD HH:mm:ss'，eg:2024-12-20 12:23:01
   */
  date?: string;

  /**
   * 推荐、展现
   */
  reCommand?: string;
  /**
   * 播放量
   */
  play?: string;

  /**
   * 阅读量
   */
  read?: string;

  /**
   * 点赞
   */
  great?: string;

  /**
   * 评论
   */
  comment?: string;

  /**
   * 分享
   */
  share?: string;

  /**
   * 收藏
   */
  collect?: string;

  /**
   * 涨粉数
   */
  addFans?: string;

  /**
   * 完播率
   */
  finishPlay?: string;

  /**
   * 封面点击率
   */
  coverClickRatio?: string;

  /**
   * 爱心
   */
  love?: string;

  /**
   * 弹幕数
   */
  danmu?: string;

  /**
   * 硬币数
   */
  coin?: string;

  /**
   * 喜欢
   */
  like?: string;

  /**
   * 投票数
   */
  vote?: string;

  /**
   * 播放时长
   */
  playTime?: string;

  /**
   * 平均播放时长
   */
  averagePlayTime?: string;

  /**
   * 转发聊天和朋友圈
   */
  forward?: string;

  /**
   * 设为铃声
   */
  ringSetCount?: string;

  /**
   * 设为状态
   */
  statusRefCount?: string;

  /**
   * 设为朋友圈封面
   */
  snscoverCount?: string;
}

/**
 * 媒体平台作品列表数据统一
 */
export interface PlatformContentItemNum {
  /**
   * 作品唯一id
   */
  id: string;
  /**
   * 标题
   */
  title?: string;
  /**
   * 封面url
   */
  cover?: string;

  /**
   * 描述
   */
  desc?: string;

  /**
   * 作品url地址
   */
  pageUrl?: string;
  /**
   * 作品类型
   */
  type?: 'video' | 'miniVideo' | 'dynamic' | 'article';

  /**
   * 发布时间,格式为'YYYY-MM-DD HH:mm:ss'，eg:2024-12-20 12:23:01
   */
  date?: string;

  /**
   * 推荐、展现
   */
  reCommand?: number;
  /**
   * 播放量
   */
  play?: number;

  /**
   * 阅读量
   */
  read?: number;

  /**
   * 点赞
   */
  great?: number;

  /**
   * 评论
   */
  comment?: number;

  /**
   * 分享
   */
  share?: number;

  /**
   * 收藏
   */
  collect?: number;

  /**
   * 涨粉数
   */
  addFans?: number;

  /**
   * 完播率,4位小数，如0.3123表示31.23%
   */
  finishPlay?: number;

  /**
   * 爱心
   */
  love?: number;

  /**
   * 弹幕数
   */
  danmu?: number;

  /**
   * 硬币数
   */
  coin?: number;

  /**
   * 喜欢
   */
  like?: number;

  /**
   * 投票数
   */
  vote?: number;

  /**
   * 播放时长，表留2位小数，单位为秒
   */
  playTime?: number;

  /**
   * 平均播放时间/秒
   */
  averagePlayTime?: number;
  /**
   * 转发聊天和朋友圈
   */
  forward?: number;

  /**
   * 设为铃声
   */
  ringSetCount?: number;

  /**
   * 设为状态
   */
  statusRefCount?: number;

  /**
   * 设为朋友圈封面
   */
  snscoverCount?: number;

  /**
   * 封面点击率
   */
  coverClickRatio?: number;

  /**
   * 主页访问量
   */
  homepageViewCount?: number;

  /**
   * 5秒完播率,4位小数，如0.3123表示31.23%
   */
  finishPlay_5s?: number;

  /**
   * 2秒跳出率
   */
  outView_2s?: number;
}

/**
 * 发布结果
 */
export interface PublishResult {
  /**
   * 状态码
   * -0成功，非0失败
   */
  code: number;

  /**
   *提示消息
   */
  msg: string;

  /**
   * 任务唯一标志id
   */
  taskId: string;

  /**
   * 详细错误
   */
  errorInfo?: string;

  /**
   * 发布产生唯一id
   */
  publishId?: string;

  /**
   * 平台已受理定时发布，回调时应进入定时发布状态而非最终发布成功。
   */
  scheduled?: boolean;

  /**
   * 发布风控验证参数，仅在需要用户验证时返回
   */
  checkStr?: string;

  /**
   * 首次发布已经组装完成的原始发布数据
   */
  postData?: string;

  /**
   * 当前风控支持的验证方式
   */
  verifyMethods?: PublishVerifyType[];
}

/**
 * 发布验证方式
 */
export type PublishVerifyType = 'password' | 'smscode';

/**
 * 等待用户完成发布验证时返回的信息
 */
export interface PublishVerifyRequired {
  checkStr: string;
  postData: string;
  verifyMethods: PublishVerifyType[];
}

/**
 * 验证并恢复发布的入参
 */
export interface CheckAndPublishInput {
  taskId: string;
  publishType: 'video' | 'dynamic';
  verifyType: PublishVerifyType;
  password?: string;
  codeNumber?: string;
  checkStr: string;
  postData: string;
  account: {
    id: string;
    cookie: string;
    localStorage?: string | object;
    proxy?: object;
  };
  callback: {
    authorization: string;
    recordId?: string;
    callBackData?: object;
  };
}

export interface AuditResult extends MediaStatusResultOutput {}

/**
 * 下拉列表选项信息,使用时完整携带,不要丢弃raw
 * @description 通用的列表选项数据结构，用于分类、位置、音乐等选择项，注意如果raw有值，使用时需要携带
 * @interface ListItemInfo
 */
export interface ListItemInfo {
  /**
   * 选项唯一标识符
   * @type {string}
   * @description 选项的唯一ID，用于标识和提交
   * @constraints
   * - 必填
   * - 唯一标识
   * @example "category_123" | "location_456" | "music_789"
   */
  yixiaoerId: string;

  /**
   * 选项显示名称
   * @type {string}
   * @description 选项的显示文本，用于界面展示
   * @constraints
   * - 必填
   * @example "科技" | "北京市朝阳区" | "背景音乐名称"
   */
  yixiaoerName: string;

  /**
   * 选项图片URL
   * @type {string}
   * @description 选项的缩略图或图标URL，可选字段
   * @example "https://example.com/category-icon.jpg"
   */
  yixiaoerImageUrl?: string;

  /**
   * 选项描述信息
   * @type {string}
   * @description 选项的详细描述或简介，可选字段
   * @example "科技类内容分类" | "音乐时长：3分30秒"
   */
  yixiaoerDesc?: string;

  /**
   * 观看数统计
   * @type {number}
   * @description 选项的观看或使用次数统计，可选字段
   * @example 12345
   */
  viewNum?: number;

  /**
   * 原始数据对象，如果获取信息时该字段有值，使用时需要带上
   * @type {Object}
   */
  raw?: object | unknown;
}

/**
 * 音乐选项信息
 */
export interface MusicItemInfo extends ListItemInfo {
  /**
   * 作者名称
   */
  authorName?: string;

  /**
   * 专辑名称
   */
  album?: string;
  /**
   * 时长，秒
   */
  duration: number;

  /**
   * 播放url
   */
  playUrl: string;

  /**
   * 使用人数
   */
  usedNum?: number;
}

/**
 * 带货地址参数
 */
export interface LocationItemInfo extends ListItemInfo {
  /**
   * 商品数量
   */
  productCount?: number;

  /**
   * 返佣商品数
   */
  cpsProductCount?: number;
}

export interface ActivityItemInfo extends ListItemInfo {
  /**
   * 显示开始日期
   */
  start_date?: string;

  /**
   * 显示借宿日志
   */
  end_date?: string;
}

/**
 * 地址位置统一
 */
export interface ListLocationInfoResponse extends BaseResult {
  /**
   * 数据列表
   */
  dataList?: Array<LocationItemInfo>;
  /**
   * 下一页参数
   */
  nextPage?: string;
}
export interface ListActivityInfoResponse extends BaseResult {
  /**
   * 数据列表
   */
  dataList?: Array<ActivityItemInfo>;
  /**
   * 下一页参数
   */
  nextPage?: string;
}
/**
 * 多层级列表选项
 */
export interface ListItemInfoLevel extends ListItemInfo {
  child?: Array<ListItemInfo>;
}
/**
 * 列表数据返回对象
 */
export interface ListInfoResponse extends BaseResult {
  /**
   * 数据列表
   */
  dataList?: Array<ListItemInfo>;
  /**
   * 下一页参数
   */
  nextPage?: string;
}

export interface CommentContentListInfoResponse extends BaseResult {
  /**
   * 数据列表
   */
  dataList?: Array<ContentBackItem>;
  /**
   * 下一页参数
   */
  nextPage?: string;
}
export interface CommentListInfoResponse extends BaseResult {
  /**
   * 数据列表
   */
  dataList?: Array<CommentBackItem>;
  /**
   * 下一页参数
   */
  nextPage?: string;
}

/**
 * 对话列表
 */
export interface MessageConversationListInfoResponse extends BaseResult {
  /**
   * 数据列表
   */
  dataList?: Array<MessageUserBackItem>;
  /**
   * 下一页参数
   */
  nextPage?: string;
}

/**
 * 消息列表
 */
export interface MessageListInfoResponse extends BaseResult {
  /**
   * 数据列表
   */
  dataList?: Array<MessageBackItem>;
  /**
   * 下一页参数
   */
  nextPage?: string;
}

/**
 * 具有层级关系的多层级列表数据返回对象，比如分类、合集
 */
export interface ListLevelInfoResponse extends BaseResult {
  /**
   * 数据列表
   */
  dataList?: Array<ListItemInfoLevel>;
}

/**
 * 音乐列表返回对象
 */
export interface ListMusicInfoResponse extends BaseResult {
  /**
   * 数据列表
   */
  dataList?: Array<MusicItemInfo>;

  /**
   * 下一页参数
   */
  nextPage?: string;
}

/**
 * 商品选项信息
 */
export interface GoodsItemInfo extends ListItemInfo {
  /**
   * 图片列表
   */
  images?: Array<string>;
  /**
   * 商品价格，单位/分
   */
  price?: number;

  /**
   * 数量、库存
   */
  count?: number;
  /**
   * 佣金，单位/分
   */
  earnPrice?: number;
}
export interface ListGoodsInfoResponse extends BaseResult {
  /**
   * 数据列表
   */
  dataList?: Array<GoodsItemInfo>;

  /**
   * 下一页参数
   */
  nextPage?: string;
}

/**
 * 定位信息
 */
export interface GeoLocation {
  accuracy?: number;
  latitude: number;
  longitude: number;
  altitude?: null;
  altitudeAccuracy?: null;
  heading?: null;
  speed?: null;
}

export interface UserCanPublishInfo extends BaseResult {
  data?: {
    status: UserStatus;
    /**
     * 不能发布的提示信息
     */
    msg?: string;
  };
}

export interface UserCanPublishNum extends BaseResult {
  data?: {
    /**
     * 剩余总量
     */
    remain_total_num?: number;
    /**
     * 当日剩余文章数
     */
    remain_article_num: number;
    /**
     * 当日剩余视频数
     */
    remain_video_num: number;

    /**
     * 当日剩余图文数
     */
    remain_dynamic_num: number;

    msg?: string;
  };
}

export enum UserStatus {
  /**
   * 正常
   */
  ok = 0,
  /**
   * 未入驻
   */
  unVerify = 172003,

  /**
   * 未认证
   */
  unRealAuth = 172004,
  /**
   * 禁言/封禁
   */
  ban = 172005,

  /**
   * 发文数用尽
   */
  pubNumLimit = 172006,
}
