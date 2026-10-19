/**
 * 媒体账号数据概览
 * @type{ContentListItem}
 */
export type AccountOverView =
  | DouYinOverViewData
  | KuaiShouOverViewData
  | BiLiBiLiOverViewData
  | XiaoHongShuOverViewData
  | WeiXinGongZhongHaoOverViewData
  | ShiPinHaoOverViewData
  | BaiJiaHaoOverViewData
  | TouTiaoHaoOverViewData
  | XinLangWeiBoOverViewData
  | ZhiHuOverViewData
  | QiEHaoOverViewData
  | SouHuHaoOverViewData
  | YiDianHaoOverViewData
  | DaYuHaoOverViewData
  | AiQiYiOverViewData
  | WeiShiOverViewData
  | WangYiHaoOverViewData;

/**
 * 抖音概览
 */
export interface DouYinOverViewData {
  /**
   * 全部
   */
  all: DouYinAllView;
}
export interface DouYinAllView {
  /**
   * 概览
   */
  overview: DouYinAccountOverView;

  /**
   * 30天明细
   */
  thirtydays: DouYinThirtyDaysList;
}

/**
 * 抖音30天
 */
export interface DouYinThirtyDaysList {
  /**
   * 播放量
   */
  playCount: Array<DayKeyValue>;

  /**
   * 主页访问
   */
  homepageViewCount: Array<DayKeyValue>;
  /**
   * 点赞
   */
  greatCount: Array<DayKeyValue>;

  /**
   * 分享
   */
  shareCount: Array<DayKeyValue>;

  /**
   * 评论
   */
  commentCount: Array<DayKeyValue>;

  /**
   * 封面点击率
   */
  coverClickRatio: Array<DayKeyValue>;

  /**
   * 净增粉丝
   */
  netFansCount: Array<DayKeyValue>;

  /**
   * 取关粉丝
   */
  cancelFansCount: Array<DayKeyValue>;
}
/**
 * 抖音概览数据
 */
export interface DouYinAccountOverView {
  /**
   * 播放量
   */
  playCount: number;
  /**
   * 主页访问次数
   */
  homepageViewCount: number;
  /**
   * 作品点赞
   */
  greatCount: number;
  /**
   * 作品分享
   */
  shareCount: number;
  /**
   * 作品评论
   */
  commentCount: number;

  /**
   * 封面点击率百分比小数，保留4位小数
   */
  coverClickRatio: number;
  /**
   * 净增粉丝数
   */
  netFansCount: number;
  /**
   * 取关粉丝数
   */
  cancelFansCount: number;
  /**
   * 总粉丝量
   */
  totalFansCount: number;
}

/**
 * 快手概览
 */
export interface KuaiShouOverViewData {
  /**
   * 全部
   */
  all: KuaiShouAllView;
}

export interface KuaiShouAllView {
  /**
   * 概览
   */
  overview: KuaiShouAccountOverView;

  /**
   * 30天明细
   */
  thirtydays: KuaiShouThirtyDaysList;
}

/**
 * 快手30天
 */
export interface KuaiShouThirtyDaysList {
  /**
   * 播放量
   */
  playCount: Array<DayKeyValue>;

  /**
   * 点赞
   */
  greatCount: Array<DayKeyValue>;

  /**
   * 完播率
   */
  playCompletionRate: Array<DayKeyValue>;
  /**
   * 分享
   */
  shareCount: Array<DayKeyValue>;

  /**
   * 评论
   */
  commentCount: Array<DayKeyValue>;

  /**
   * 净增粉丝
   */
  netFansCount: Array<DayKeyValue>;
}
/**
 * 快手概览数据
 */
export interface KuaiShouAccountOverView {
  /**
   * 总粉丝数
   */
  totalFansCount: number;
  /**
   * 总获赞
   */
  totalGreatsCount: number;
  /**
   * 播放量
   */
  playCount: number;
  /**
   * 点赞量
   */
  greatCount: number;
  /**
   * 净增粉丝量
   */
  netFansCount: number;
  /**
   * 完播率百分比小数，保留4位小数
   */
  playCompletionRate: number;
  /**
   * 评论量
   */
  commentCount: number;

  /**
   * 分享量
   */
  shareCount: number;
}

/**
 * 视频号概览
 */
export interface ShiPinHaoOverViewData {
  /**
   * 全部
   */
  all: ShiPinHaoAllView;

  /**
   * 视频
   */
  video: ShiPinHaoVideoView;

  /**
   * 图文
   */
  dynamic: ShiPinHaoDynamicView;
}

export interface ShiPinHaoAllView {
  /**
   * 概览
   */
  overview: ShiPinHaoAllDetail;
  /**
   * 30天
   */
  thirtydays: ShiPinHaoAllThirtyDaysList;
}
export interface ShiPinHaoAllDetail {
  /**
   * 总关注者
   */
  totalFansCount: number;

  /**
   * 净增粉丝数
   */
  netFansCount: number;
}
export interface ShiPinHaoVideoView {
  /**
   * 概览
   */
  overview: ShiPinHaoVideoDetail;
  /**
   * 30天
   */
  thirtydays: ShiPinHaoVideoThirtyDaysList;
}
/**
 * 视频号视频30天
 */
export interface ShiPinHaoAllThirtyDaysList {
  /**
   * 净增关注
   */
  netFansCount: Array<DayKeyValue>;
}

/**
 * 视频号视频概览数据
 */
export interface ShiPinHaoVideoDetail {
  /**
   * 播放
   */
  playCount: number;

  /**
   * 推荐
   */
  recommendCount: number;

  /**
   * 喜欢
   */
  likeCount: number;

  /**
   * 点赞-！！已废弃
   */
  greatCount: number;

  /**
   * 评论
   */
  commentCount: number;

  /**
   * 分享
   */
  shareCount: number;

  /**
   * 关注
   */
  fansCount: number;
}
/**
 * 视频号视频30天
 */
export interface ShiPinHaoVideoThirtyDaysList {
  /**
   * 播放
   */
  playCount: Array<DayKeyValue>;
  /**
   * 推荐
   */
  recommendCount: Array<DayKeyValue>;

  /**
   * 喜欢
   */
  likeCount: Array<DayKeyValue>;

  /**
   * 点赞--！！已废弃
   */
  greatCount: Array<DayKeyValue>;

  /**
   * 评论
   */
  commentCount: Array<DayKeyValue>;

  /**
   * 分享
   */
  shareCount: Array<DayKeyValue>;

  /**
   * 关注
   */
  fansCount: Array<DayKeyValue>;
}

export interface ShiPinHaoDynamicView {
  /**
   * 概览
   */
  overview: ShiPinHaoDynamicDetail;
  /**
   * 30天
   */
  thirtydays: ShiPinHaoDynamicThirtyDaysList;
}

/**
 * 视频号图文概览数据
 */
export interface ShiPinHaoDynamicDetail {
  /**
   * 曝光量
   */
  impressionCount: number;

  /**
   * 推荐
   */
  recommendCount: number;

  /**
   * 喜欢
   */
  likeCount: number;

  /**
   * 点赞--！！已废弃
   */
  greatCount: number;

  /**
   * 评论
   */
  commentCount: number;

  /**
   * 分享
   */
  shareCount: number;

  /**
   * 新增关注
   */
  fansCount: number;
}
/**
 * 视频号图文30天
 */
export interface ShiPinHaoDynamicThirtyDaysList {
  /**
   * 曝光量
   */
  impressionCount: Array<DayKeyValue>;

  /**
   * 推荐
   */
  recommendCount: Array<DayKeyValue>;

  /**
   * 喜欢
   */
  likeCount: Array<DayKeyValue>;

  /**
   * 点赞--！！！已废弃
   */
  greatCount: Array<DayKeyValue>;

  /**
   * 评论
   */
  commentCount: Array<DayKeyValue>;

  /**
   * 分享
   */
  shareCount: Array<DayKeyValue>;

  /**
   * 关注
   */
  fansCount: Array<DayKeyValue>;
}

/**
 * 哔哩哔哩概览
 */
export interface BiLiBiLiOverViewData {
  /**
   * 全部
   */
  all: BiLiBiLiAllView;
}

export interface BiLiBiLiAllView {
  /**
   * 概览
   */
  overview: BiLiBiLiAccountOverView;

  /**
   * 30天明细
   */
  thirtydays: BiLiBiLiThirtyDaysList;
}
/**
 * 哔哩哔哩30天
 */
export interface BiLiBiLiThirtyDaysList {
  /**
   * 播放量
   */
  playCount: Array<DayKeyValue>;

  /**
   * 空间访客
   */
  homepageViewCount: Array<DayKeyValue>;
  /**
   * 净增粉丝
   */
  netFansCount: Array<DayKeyValue>;
  /**
   * 点赞
   */
  greatCount: Array<DayKeyValue>;
  /**
   * 收藏
   */
  collectCount: Array<DayKeyValue>;
  /**
   * 硬币
   */
  coinCount: Array<DayKeyValue>;
  /**
   * 评论
   */
  commentCount: Array<DayKeyValue>;
  /**
   * 弹幕
   */
  danmuCount: Array<DayKeyValue>;
  /**
   * 分享
   */
  shareCount: Array<DayKeyValue>;
  /**
   * 充电
   */
  chargeCount: Array<DayKeyValue>;
}
/**
 * 哔哩哔哩概览数据
 */
export interface BiLiBiLiAccountOverView {
  /**
   * 总粉丝数
   */
  totalFansCount: number;
  /**
   * 总获赞数
   */
  totalGreatsCount: number;
  /**
   * 总播放数
   */
  totalPlaysCount: number;
  /**
   * 播放量
   */
  playCount: number;

  /**
   * 空间访客
   */
  homepageViewCount: number;
  /**
   * 净增粉丝
   */
  netFansCount: number;
  /**
   * 点赞
   */
  greatCount: number;
  /**
   * 收藏
   */
  collectCount: number;
  /**
   * 硬币
   */
  coinCount: number;
  /**
   * 评论
   */
  commentCount: number;
  /**
   * 弹幕
   */
  danmuCount: number;
  /**
   * 分享
   */
  shareCount: number;
  /**
   * 充电
   */
  chargeCount: number;
}

/**
 * 百家号概览
 */
export interface BaiJiaHaoOverViewData {
  /**
   * 全部
   */
  all: BaiJiaHaoAllView;
}
export interface BaiJiaHaoAllView {
  /**
   * 概览
   */
  overview: BaijiahaoAccountOverView;

  /**
   * 30天明细
   */
  thirtydays: BaiJiaHaoThirtyDaysList;
}

/**
 * 百家号30天
 */
export interface BaiJiaHaoThirtyDaysList {
  /**
   * 阅读(播放)量
   */
  playCount: Array<DayKeyValue>;
  /**
   * 评论量
   */
  commentCount: Array<DayKeyValue>;

  /**
   * 点赞量
   */
  greatCount: Array<DayKeyValue>;
  /**
   * 收藏量
   */
  collectCount: Array<DayKeyValue>;
  /**
   * 分享量
   */
  shareCount: Array<DayKeyValue>;

  /**
   * 作品张粉量
   */
  fansCount: Array<DayKeyValue>;
}
/**
 * 百家号概览数据
 */
export interface BaijiahaoAccountOverView {
  /**
   * 总粉丝数
   */
  totalFansCount: number;
  /**
   * 阅读(播放)量
   */
  playCount: number;
  /**
   * 评论量
   */
  commentCount: number;

  /**
   * 点赞量
   */
  greatCount: number;
  /**
   * 收藏量
   */
  collectCount: number;
  /**
   * 分享量
   */
  shareCount: number;

  /**
   * 作品涨粉量
   */
  fansCount: number;
}

/**
 * 头条号概览
 */
export interface TouTiaoHaoOverViewData {
  /**
   * 全部
   */
  all: TouTiaoHaoAllView;
}
export interface TouTiaoHaoAllView {
  /**
   * 概览
   */
  overview: TouTiaoAccountOverView;

  /**
   * 30天明细
   */
  thirtydays: TouTiaoHaoThirtyDaysList;
}

/**
 * 头条号30天
 */
export interface TouTiaoHaoThirtyDaysList {
  /**
   * 展现量
   */
  impressionCount: Array<DayKeyValue>;

  /**
   * 阅读(播放)量
   */
  playCount: Array<DayKeyValue>;
  /**
   * 粉丝展现量
   */
  fansImpressionCount: Array<DayKeyValue>;
  /**
   * 点赞量
   */
  greatCount: Array<DayKeyValue>;

  /**
   * 评论量
   */
  commentCount: Array<DayKeyValue>;
  /**
   * 粉丝变化数
   */
  netFansCount: Array<DayKeyValue>;
}
/**
 * 头条号概览数据
 */
export interface TouTiaoAccountOverView {
  /**
   * 总粉丝数
   */
  totalFansCount: number;
  /**
   * 总阅读(播放)量
   */
  totalPlaysCount: number;
  /**
   * 总作品量
   */
  totalWorksCount: number;
  /**
   * 展现量
   */
  impressionCount: number;

  /**
   * 阅读(播放)量
   */
  playCount: number;
  /**
   * 粉丝展现量
   */
  fansImpressionCount: number;
  /**
   * 点赞量
   */
  greatCount: number;

  /**
   * 评论量
   */
  commentCount: number;
  /**
   * 粉丝变化数
   */
  netFansCount: number;
}

/**
 * 新浪微博概览
 */
export interface XinLangWeiBoOverViewData {
  /**
   * 全部
   */
  all: XinLangWeiBoAllView;

  /**
   * 视频
   */
  video: XinLangWeiBoVideoView;

  /**
   * 图文
   */
  dynamic: XinLangWeiBoDynamicView;
}

export interface XinLangWeiBoAllView {
  /**
   * 概览
   */
  overview: XinLangWeiBoAllDetail;
  /**
   * 30天
   */
  thirtydays: XinLangWeiBoAllThirtyDaysList;
}
export interface XinLangWeiBoAllDetail {
  /**
   * 总粉丝
   */
  totalFansCount: number;

  /**
   * 总转评赞
   */
  totalInterCount: number;

  /**
   * 净增粉丝数
   */
  netFansCount: number;
}
/**
 * 新浪微博总30天
 */
export interface XinLangWeiBoAllThirtyDaysList {
  /**
   * 净增粉丝数
   */
  netFansCount: Array<DayKeyValue>;
}
export interface XinLangWeiBoVideoView {
  /**
   * 概览
   */
  overview: XinLangWeiBoVideoDetail;
  /**
   * 30天
   */
  thirtydays: XinLangWeiBoVideoThirtyDaysList;
}

/**
 * 新浪微博视频概览数据
 */
export interface XinLangWeiBoVideoDetail {
  /**
   * 视频发布总数
   */
  workCount: number;

  /**
   * 视频播放总数
   */
  playCount: number;

  /**
   * 转评赞总数
   */
  interCount: number;

  /**
   * 评论总数
   */
  commentCount: number;

  /**
   * 点赞总数
   */
  greatCount: number;

  /**
   * 转发总数
   */
  shareCount: number;
}
/**
 * 新浪微博视频30天
 */
export interface XinLangWeiBoVideoThirtyDaysList {
  /**
   * 视频发布总数
   */
  workCount: Array<DayKeyValue>;

  /**
   * 视频播放总数
   */
  playCount: Array<DayKeyValue>;

  /**
   * 转评赞总数
   */
  interCount: Array<DayKeyValue>;

  /**
   * 评论总数
   */
  commentCount: Array<DayKeyValue>;

  /**
   * 点赞总数
   */
  greatCount: Array<DayKeyValue>;

  /**
   * 转发总数
   */
  shareCount: Array<DayKeyValue>;
}

export interface XinLangWeiBoDynamicView {
  /**
   * 概览
   */
  overview: XinLangWeiBoDynamicDetail;
  /**
   * 30天
   */
  thirtydays: XinLangWeiBoDynamicThirtyDaysList;
}

/**
 * 新浪微博图文概览数据
 */
export interface XinLangWeiBoDynamicDetail {
  /**
   * 阅读数
   */
  readCount: number;

  /**
   * 发博总数
   */
  workCount: number;

  /**
   * 转评赞总数
   */
  interCount: number;

  /**
   * 点赞数
   */
  greatCount: number;

  /**
   * 评论总数
   */
  commentCount: number;

  /**
   * 转发总数
   */
  shareCount: number;
}
/**
 * 新浪微博图文30天
 */
export interface XinLangWeiBoDynamicThirtyDaysList {
  /**
   * 阅读数
   */
  readCount: Array<DayKeyValue>;

  /**
   * 发博总数
   */
  workCount: Array<DayKeyValue>;

  /**
   * 转评赞总数
   */
  interCount: Array<DayKeyValue>;

  /**
   * 点赞数
   */
  greatCount: Array<DayKeyValue>;

  /**
   * 评论总数
   */
  commentCount: Array<DayKeyValue>;

  /**
   * 转发总数
   */
  shareCount: Array<DayKeyValue>;
}

/**
 * 知乎概览
 */
export interface ZhiHuOverViewData {
  /**
   * 全部
   */
  all: ZhiHuAllView;
}
export interface ZhiHuAllView {
  /**
   * 概览
   */
  overview: ZhiHuAccountOverView;

  /**
   * 30天明细
   */
  thirtydays: ZhiHuThirtyDaysList;
}

/**
 * 知乎30天
 */
export interface ZhiHuThirtyDaysList {
  /**
   * 阅读总量
   */
  readCount: Array<DayKeyValue>;
  /**
   * 播放总量
   */
  playCount: Array<DayKeyValue>;
  /**
   * 赞同总量
   */
  greatCount: Array<DayKeyValue>;
  /**
   * 喜欢总量
   */
  likeCount: Array<DayKeyValue>;
  /**
   * 评论总量
   */
  commentCount: Array<DayKeyValue>;
  /**
   * 收藏总量
   */
  collectCount: Array<DayKeyValue>;
  /**
   * 分享总量
   */
  shareCount: Array<DayKeyValue>;
  /**
   * 转发总量
   */
  forwardCount: Array<DayKeyValue>;
  /**
   * 关注者变化
   */
  netFansCount: Array<DayKeyValue>;
}
/**
 * 知乎概览数据
 */
export interface ZhiHuAccountOverView {
  /**
   * 关注者
   */
  totalFansCount: number;
  /**
   * 阅读总量
   */
  readCount: number;
  /**
   * 播放总量
   */
  playCount: number;
  /**
   * 赞同总量
   */
  greatCount: number;
  /**
   * 喜欢总量
   */
  likeCount: number;
  /**
   * 评论总量
   */
  commentCount: number;
  /**
   * 收藏总量
   */
  collectCount: number;
  /**
   * 分享总量
   */
  shareCount: number;
  /**
   * 转发总量
   */
  forwardCount: number;
  /**
   * 关注者变化
   */
  netFansCount: number;
}
/**
 * 小红书概览
 */
export interface XiaoHongShuOverViewData {
  /**
   * 全部
   */
  all: XiaoHongShuAllView;
}

export interface XiaoHongShuAllView {
  /**
   * 概览
   */
  overview: XiaoHongShuAccountOverView;

  /**
   * 30天明细
   */
  thirtydays: XiaoHongShuThirtyDaysList;
}
/**
 * 小红书30天
 */
export interface XiaoHongShuThirtyDaysList {
  /**
   * 曝光数
   */
  recommendCount: Array<DayKeyValue>;

  /** 观看数 */
  playCount: Array<DayKeyValue>;

  /**
   * 封面点击率
   */
  coverClickRatio: Array<DayKeyValue>;

  /**
   * 平均观看时长（秒）
   */
  averagePlayTime: Array<DayKeyValue>;

  /** 观看总时长(秒)，最多保留2位小数 */
  playDuration: Array<DayKeyValue>;

  /**
   * 完播率百分比小数，保留4位，0.0012
   */
  playCompletionRate: Array<DayKeyValue>;

  /** 主页访客 */
  homepageViewCount: Array<DayKeyValue>;

  /** 点赞数 */
  greatCount: Array<DayKeyValue>;

  /** 收藏数 */
  collectCount: Array<DayKeyValue>;

  /** 评论数 */
  commentCount: Array<DayKeyValue>;

  /** 分享数 */
  shareCount: Array<DayKeyValue>;

  /** 净增关注 */
  netFansCount: Array<DayKeyValue>;

  /**
   * 新增关注
   */
  fansCount: Array<DayKeyValue>;

  /**
   * 取消关注
   */
  cancelFansCount: Array<DayKeyValue>;

  /**
   * 主页转粉率百分比小数，保留4位，0.1111
   */
  homeConversionRate: Array<DayKeyValue>;
}
/**
 * 小红书概览数据
 */
export interface XiaoHongShuAccountOverView {
  /** 总粉丝数 */
  totalFansCount: number;

  /** 总获赞与收藏*/
  totalFavedCount: number;

  /**
   * 曝光数
   */
  recommendCount: number;

  /** 观看数 */
  playCount: number;

  /**
   * 封面点击率
   */
  coverClickRatio: number;

  /**
   * 平均观看时长（秒）
   */
  averagePlayTime: number;

  /** 观看总时长(秒)，最多保留2位小数 */
  playDuration: number;

  /**
   * 完播率百分比小数，保留4位，0.0012
   */
  playCompletionRate: number;

  /** 主页访客 */
  homepageViewCount: number;

  /** 点赞数 */
  greatCount: number;

  /** 收藏数 */
  collectCount: number;

  /** 评论数 */
  commentCount: number;

  /** 分享数 */
  shareCount: number;

  /** 净增关注 */
  netFansCount: number;

  /**
   * 新增关注
   */
  fansCount: number;

  /**
   * 取消关注
   */
  cancelFansCount: number;

  /**
   * 主页转粉率百分比小数，保留4位，0.1111
   */
  homeConversionRate: number;
}

/**
 * 微信公众号概览
 */
export interface WeiXinGongZhongHaoOverViewData {
  /**
   * 全部
   */
  all: WeiXinGongZhongHaoAllView;
}

export interface WeiXinGongZhongHaoAllView {
  /**
   * 概览
   */
  overview: WeiXinGongZhongHaoAccountOverView;

  /**
   * 30天明细
   */
  thirtydays: WeiXinGongZhongHaoThirtyDaysList;
}

/**
 * 微信公众号30天
 */
export interface WeiXinGongZhongHaoThirtyDaysList {
  /** 阅读数 */
  playCount: Array<DayKeyValue>;

  /** 分享数 */
  shareCount: Array<DayKeyValue>;

  /** 收藏数 */
  collectCount: Array<DayKeyValue>;

  /** 净增关注 */
  netFansCount: Array<DayKeyValue>;
}

/**
 * 微信公众号概览数据
 */
export interface WeiXinGongZhongHaoAccountOverView {
  /** 总用户数（粉丝数） */
  totalFansCount: number;

  /** 阅读数 */
  playCount: number;

  /** 分享数 */
  shareCount: number;

  /** 收藏数 */
  collectCount: number;

  /** 点赞数 */
  greatCount: number;

  /** 推荐数（在看数） */
  recommendCount: number;

  /** 留言数 */
  commentCount: number;

  /** 净增关注 */
  netFansCount: number;
}

/**
 *企鹅号概览
 */
export interface QiEHaoOverViewData {
  /**
   * 全部
   */
  all: QiEHaoAllView;

  /**
   * 视频
   */
  video: QiEHaoVideoView;

  /**
   * 文章
   */
  article: QiEHaoArticleView;
}

export interface QiEHaoAllView {
  /**
   * 概览
   */
  overview: QiEHaoAllDetail;
}
export interface QiEHaoAllDetail {
  /**
   * 粉丝量
   */
  totalFansCount: number;

  /**
   * 累计播放量
   */
  totalPlaysCount: number;

  /**
   * 累计阅读量
   */
  totalReadsCount: number;
}

export interface QiEHaoVideoView {
  /**
   * 概览
   */
  overview: QiEHaoVideoDetail;
  /**
   * 30天
   */
  thirtydays: QiEHaoVideoThirtyDaysList;
}

/**
 * 企鹅号视频概览数据
 */
export interface QiEHaoVideoDetail {
  /**
   * 播放数
   */
  playCount: number;

  /**
   * 评论量
   */
  commentCount: number;

  /**
   * 点赞量
   */
  greatCount: number;

  /**
   * 分享数
   */
  shareCount: number;
}
/**
 * 企鹅号视频30天
 */
export interface QiEHaoVideoThirtyDaysList {
  /**
   * 播放数
   */
  playCount: Array<DayKeyValue>;

  /**
   * 评论量
   */
  commentCount: Array<DayKeyValue>;

  /**
   * 点赞量
   */
  greatCount: Array<DayKeyValue>;

  /**
   * 分享数
   */
  shareCount: Array<DayKeyValue>;
}

export interface QiEHaoArticleView {
  /**
   * 概览
   */
  overview: QiEHaoArticleDetail;
  /**
   * 30天
   */
  thirtydays: QiEHaoArticleThirtyDaysList;
}

/**
 * 企鹅号文章概览数据
 */
export interface QiEHaoArticleDetail {
  /**
   * 阅读量
   */
  readCount: number;

  /**
   * 点赞量
   */
  greatCount: number;

  /**
   * 评论量
   */
  commentCount: number;

  /**
   * 分享量
   */
  shareCount: number;
}
/**
 * 企鹅号文章30天
 */
export interface QiEHaoArticleThirtyDaysList {
  /**
   * 阅读量
   */
  readCount: Array<DayKeyValue>;

  /**
   * 点赞量
   */
  greatCount: Array<DayKeyValue>;

  /**
   * 评论量
   */
  commentCount: Array<DayKeyValue>;

  /**
   * 分享量
   */
  shareCount: Array<DayKeyValue>;
}

/**
 * 搜狐号概览
 */
export interface SouHuHaoOverViewData {
  /**
   * 全部
   */
  all: SouHuHaoAllView;
}
export interface SouHuHaoAllView {
  /**
   * 概览
   */
  overview: SouHuHaoAccountOverView;

  /**
   * 30天明细
   */
  thirtydays: SouHuHaoThirtyDaysList;
}

/**
 * 搜狐号30天
 */
export interface SouHuHaoThirtyDaysList {
  /**
   * 获赞数
   */
  greatCount: Array<DayKeyValue>;

  /**
   * 阅读数
   */
  readCount: Array<DayKeyValue>;

  /**
   * 访问（播放）数
   */
  playCount: Array<DayKeyValue>;

  /**
   * 评论数
   */
  commentCount: Array<DayKeyValue>;

  /**
   * 分享数
   */
  shareCount: Array<DayKeyValue>;
}
/**
 * 搜狐号概览数据
 */
export interface SouHuHaoAccountOverView {
  /**
   * 阅读量
   */
  totalReadsCount: number;

  /**
   * 内容量
   */
  totalWorksCount: number;

  /**
   * 获赞数
   */
  greatCount: number;

  /**
   * 阅读数
   */
  readCount: number;

  /**
   * 访问（播放）数
   */
  playCount: number;

  /**
   * 评论数
   */
  commentCount: number;

  /**
   * 分享数
   */
  shareCount: number;
}

/**
 * 一点号概览
 */
export interface YiDianHaoOverViewData {
  /**
   * 全部
   */
  all: YiDianHaoAllView;
}
export interface YiDianHaoAllView {
  /**
   * 概览
   */
  overview: YiDianHaoAccountOverView;

  /**
   * 30天明细
   */
  thirtydays: YiDianHaoThirtyDaysList;
}

/**
 * 一点号30天
 */
export interface YiDianHaoThirtyDaysList {
  /** 推荐量 */
  recommendCount: Array<DayKeyValue>;

  /** 阅读量 */
  readCount: Array<DayKeyValue>;

  /** 粉丝量 */
  totalFansCount: Array<DayKeyValue>;

  /** 内容量 */
  workCount: Array<DayKeyValue>;

  /** 分享量 */
  shareCount: Array<DayKeyValue>;

  /** 评论量 */
  commentCount: Array<DayKeyValue>;

  /** 收藏量 */
  collectCount: Array<DayKeyValue>;

  /** 点赞量 */
  greatCount: Array<DayKeyValue>;

  /** 净增粉丝数 */
  netFansCount: Array<DayKeyValue>;
}
/**
 * 一点号概览数据
 */
export interface YiDianHaoAccountOverView {
  /** 累计推荐量 */
  totalRecommendsCount: number;

  /** 累计总阅读量 */
  totalReadsCount: number;

  /** 推荐量 */
  recommendCount: number;

  /** 阅读量 */
  readCount: number;

  /** 粉丝量 */
  totalFansCount: number;

  /** 内容量 */
  workCount: number;

  /** 分享量 */
  shareCount: number;

  /** 评论量 */
  commentCount: number;

  /** 收藏量 */
  collectCount: number;

  /** 点赞量 */
  greatCount: number;

  /** 净增粉丝数 */
  netFansCount: number;
}

/**
 * 大鱼号概览
 */
export interface DaYuHaoOverViewData {
  /**
   * 全部
   */
  all: DaYuHaoAllView;
}
export interface DaYuHaoAllView {
  /**
   * 概览
   */
  overview: DaYuHaoAccountOverView;

  /**
   * 30天明细
   */
  thirtydays: DaYuHaoThirtyDaysList;
}

/**
 * 大鱼号30天
 */
export interface DaYuHaoThirtyDaysList {
  /** 推荐 */
  recommendCount: Array<DayKeyValue>;
  /** 播放/阅读 */
  playCount: Array<DayKeyValue>;
  /** 点赞 */
  greatCount: Array<DayKeyValue>;
  /** 评论 */
  commentCount: Array<DayKeyValue>;
  /** 分享 */
  shareCount: Array<DayKeyValue>;
  /** 净增粉丝数 */
  netFansCount: Array<DayKeyValue>;
}
/**
 * 大鱼号概览数据
 */
export interface DaYuHaoAccountOverView {
  /** 粉丝数 */
  totalFansCount: number;
  /** 推荐 */
  recommendCount: number;
  /** 播放/阅读 */
  playCount: number;
  /** 点赞 */
  greatCount: number;
  /** 评论 */
  commentCount: number;
  /** 分享 */
  shareCount: number;
  /** 净增粉丝数 */
  netFansCount: number;
}

/**
 * 爱奇艺概览
 */
export interface AiQiYiOverViewData {
  /**
   * 全部
   */
  all: AiQiYiAllView;
}
export interface AiQiYiAllView {
  /**
   * 概览
   */
  overview: AiQiYiAccountOverView;

  /**
   * 30天明细
   */
  thirtydays: AiQiYiThirtyDaysList;
}

/**
 * 爱奇艺30天
 */
export interface AiQiYiThirtyDaysList {
  /** 展现量 */
  impressionCount: Array<DayKeyValue>;
  /** 播放量 */
  playCount: Array<DayKeyValue>;
  /** 播放时长(秒) */
  playDuration: Array<DayKeyValue>;
  /** 播放完成率 */
  playCompletionRate: Array<DayKeyValue>;
  /** 评论量 */
  commentCount: Array<DayKeyValue>;
  /** 点赞量 */
  greatCount: Array<DayKeyValue>;
  /** 弹幕量 */
  danmuCount: Array<DayKeyValue>;
  /** 分享量 */
  shareCount: Array<DayKeyValue>;
  /** 涨粉量 */
  fansCount: Array<DayKeyValue>;
}
/**
 * 爱奇艺概览数据
 */
export interface AiQiYiAccountOverView {
  /** 总播放量 */
  totalPlaysCount: number;
  /** 总粉丝量 */
  totalFansCount: number;
  /** 展现量 */
  impressionCount: number;
  /** 播放量 */
  playCount: number;
  /** 播放时长（秒），保留2位小数 */
  playDuration: number;
  /** 播放完成率百分比小数，最多保留4位小数 */
  playCompletionRate: number;
  /** 评论量 */
  commentCount: number;
  /** 点赞量 */
  greatCount: number;
  /** 弹幕量 */
  danmuCount: number;
  /** 分享量 */
  shareCount: number;
  /** 涨粉量 */
  fansCount: number;
}

/**
 * 微视概览
 */
export interface WeiShiOverViewData {
  /**
   * 全部
   */
  all: WeiShiAllView;
}
export interface WeiShiAllView {
  /**
   * 概览
   */
  overview: WeiShiAccountOverView;
}

/**
 * 微视概览数据
 */
export interface WeiShiAccountOverView {
  /** 点赞 */
  totalGreatsCount: number;
  /** 粉丝 */
  totalFansCount: number;
}

/**
 *网易号概览
 */
export interface WangYiHaoOverViewData {
  /**
   * 全部
   */
  all: WangYiHaoAllView;

  /**
   * 视频
   */
  video: WangYiHaoVideoView;

  /**
   * 文章
   */
  article: WangYiHaoArticleView;
}

export interface WangYiHaoAllView {
  /**
   * 概览
   */
  overview: WangYiHaoAllDetail;

  /**
   * 30天
   */
  thirtydays: WangYiHaoThirtyDetail;
}
export interface WangYiHaoAllDetail {
  /**
   * 总粉丝
   */
  totalFansCount: number;

  /**
   * 总收益
   */
  totalProfitsCount: number;

  /**
   * 总阅读
   */
  totalReadsCount: number;

  /**
   * 新增粉丝
   */
  fansCount: number;
}

export interface WangYiHaoThirtyDetail {
  /**
   * 新增粉丝
   */
  fansCount: Array<DayKeyValue>;
}

export interface WangYiHaoVideoView {
  /**
   * 概览
   */
  overview: WangYiHaoVideoDetail;
  /**
   * 30天
   */
  thirtydays: WangYiHaoVideoThirtyDaysList;
}

/**
 * 网易号视频概览数据
 */
export interface WangYiHaoVideoDetail {
  /** 播放 */
  playCount: number;
  /** 展现 */
  impressionCount: number;
  /** 跟帖 */
  commentCount: number;
  /** 分享 */
  shareCount: number;
}
/**
 * 网易号视频30天
 */
export interface WangYiHaoVideoThirtyDaysList {
  /** 播放 */
  playCount: Array<DayKeyValue>;
  /** 展现 */
  impressionCount: Array<DayKeyValue>;
  /** 跟帖 */
  commentCount: Array<DayKeyValue>;
  /** 分享 */
  shareCount: Array<DayKeyValue>;
}

export interface WangYiHaoArticleView {
  /**
   * 概览
   */
  overview: WangYiHaoArticleDetail;
  /**
   * 30天
   */
  thirtydays: WangYiHaoArticleThirtyDaysList;
}

/**
 * 网易号文章概览数据
 */
export interface WangYiHaoArticleDetail {
  /** 阅读 */
  readCount: number;
  /** 展现 */
  impressionCount: number;
  /** 跟帖 */
  commentCount: number;
  /** 分享 */
  shareCount: number;
}
/**
 * 网易文章30天
 */
export interface WangYiHaoArticleThirtyDaysList {
  /** 阅读 */
  readCount: Array<DayKeyValue>;
  /** 展现 */
  impressionCount: Array<DayKeyValue>;
  /** 跟帖 */
  commentCount: Array<DayKeyValue>;
  /** 分享 */
  shareCount: Array<DayKeyValue>;
}

export interface DayKeyValue {
  /**
   * 日期时间戳
   */
  date: number;
  /**
   * 数值
   */
  value: number;
}
