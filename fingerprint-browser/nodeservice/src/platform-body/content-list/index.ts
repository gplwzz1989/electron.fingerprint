/**
 * 内容列表平台字段
 * @type{ContentListItem}
 */
export type ContentListItem =
  | DouYinContentItem
  | KuaiShouContentItem
  | ShiPinHaoContentItem
  | BiLiBiLiContentItem
  | BaijiahaoContentItem
  | TouTiaoContentItem
  | XinLangWeiBoContentItem
  | ZhiHuContentItem
  | XiaoHongShuContentItem
  | QiEHaoContentItem
  | SouHuHaoContentItem
  | YiDianHaoContentItem
  | DaYuHaoContentItem
  | WangYiHaoContentItem
  | AiQiYiHaoContentItem
  | WeiShiContentItem
  | WeiXinGongZhongHaoContentItem;

/**
 * 抖音内容
 */
export type DouYinContentItem = DouYinManageContentItem | DouYinAnalyzeContentItem;

/**
 * 抖音内容管理manage
 */
interface DouYinManageContentItem {
  /**
   * 作品唯一id，对应发布进度返回的docId
   */
  id: string;
  /**
   * 封面url
   */
  cover: string;
  /**
   * 描述
   */
  desc: string;
  /**
   * 发布日期
   */
  date: string;
  /**
   * 类型 video dynamic article
   */
  type: string;
  /**
   * 播放量
   */
  play: number;
  /**
   * 点赞量
   */
  great: number;
  /**
   * 评论量
   */
  comment: number;
  /**
   * 分享量
   */
  share: number;
  /**
   * 收藏量
   */
  collect: number;
  /**
   * 作品url
   */
  pageUrl: string;
}

/**
 * 抖音作品分析analyze
 */
interface DouYinAnalyzeContentItem {
  /**
   * 作品唯一id，对应发布进度返回的docId
   */
  id: string;
  /**
   * 封面url
   */
  cover: string;
  /**
   * 描述
   */
  desc: string;
  /**
   * 发布日期
   */
  date: string;
  /**
   * 类型 video dynamic article
   */
  type: string;
  /**
   * 播放量
   */
  play: number;
  /**
   * 完播率，最多4位小数
   */
  finishPlay: number;
  /**
   * 完5秒播率，最多4位小数
   */
  finishPlay_5s: number;
  /**
   * 封面点击率，最多4位小数
   */
  coverClickRatio: number;

  /**
   * 2秒跳出率，最多4位小数
   */
  outView_2s: number;

  /**
   * 平均播放时长/秒，最多2位小数
   */
  averagePlayTime: number;
  /**
   * 点赞量
   */
  great: number;
  /**
   * 评论量
   */
  comment: number;
  /**
   * 分享量
   */
  share: number;
  /**
   * 收藏量
   */
  collect: number;
  /**
   * 主页访问数
   */
  homepageViewCount: number;

  /**
   * 粉丝增量
   */
  addFans: number;
  /**
   * 作品url
   */
  pageUrl: string;
}

/**
 * 快手内容
 */
interface KuaiShouContentItem {
  /**
   * 作品唯一id，对应发布进度返回的docId
   */
  id: string;
  /**
   * 封面url
   */
  cover: string;
  /**
   * 描述
   */
  desc: string;
  /**
   * 发布日期
   */
  date: string;
  /**
   * 类型 video dynamic article
   */
  type: string;
  /**
   * 播放量
   */
  play: string;
  /**
   * 完播率%
   */
  finishPlay: string;

  /**
   * 点赞量
   */
  great: string;
  /**
   * 评论量
   */
  comment: string;
  /**
   * 收藏量
   */
  collect: string;

  /**
   * 涨粉数
   */
  addFans: string;
  /**
   * 作品url
   */
  pageUrl: string;
}

/**
 * 视频号内容
 */
interface ShiPinHaoContentItem {
  /**
   * 作品唯一id，对应发布进度返回的docId
   */
  id: string;
  /**
   * 封面url
   */
  cover: string;
  /**
   * 描述
   */
  desc: string;
  /**
   * 发布日期
   */
  date: string;

  /**
   * 图文标题
   */
  title: string;
  /**
   * 类型 video dynamic article
   */
  type: string;

  /**
   * 播放量
   */
  play: string;
  /**
   * 曝光量
   */
  read: string;
  /**
   * 关注
   */
  addFans: string;
  /**
   * 作品url
   */
  pageUrl: string;

  /**
   * 点赞量
   */
  great: string;
  /**
   * 评论量
   */
  comment: string;
  /**
   * 分享量
   */
  share: string;
  /**
   * 爱心
   */
  love: string;
  /**
   *转发聊天和朋友圈
   */
  forward: string;
  /**
   * 设为铃声
   */
  ringSetCount: string;
  /**
   * 设为朋友圈风格面
   */
  snscoverCount: string;

  /**
   * 设置为状态
   */
  statusRefCount?: string;
  /**
   * 时佩璞完播率
   */
  finishPlay?: string;

  /**
   * 平均播放时长/秒
   */
  playTime?: string;
}

/**
 * 哔哩哔哩内容
 */
interface BiLiBiLiContentItem {
  /**
   * 作品唯一id，对应发布进度返回的docId
   */
  id: string;
  /**
   * 封面url
   */
  cover: string;
  /**
   * 发布日期
   */
  date: string;
  /**
   * 类型 video dynamic article
   */
  type: string;

  /**
   * 图文标题
   */
  title: string;
  /**
   * 播放量
   */
  play: string;
  /**
   * 阅读数
   */
  read: string;
  /**
   * 点赞量
   */
  great: string;
  /**
   * 弹幕数
   */
  danmu: string;
  /**
   * 评论量
   */
  comment: string;
  /**
   * 硬币数
   */
  coin: string;
  /**
   * 收藏量
   */
  collect: string;
  /**
   * 分享数
   */
  share: string;

  /**
   * 作品url
   */
  pageUrl: string;
}

/**
 * 百家号内容
 */
interface BaijiahaoContentItem {
  /**
   * 作品唯一id，对应发布进度返回的docId
   */
  id: string;
  /**
   * 封面url
   */
  cover: string;
  /**
   * 发布日期
   */
  date: string;
  /**
   * 类型 video dynamic article
   */
  type: string;

  /**
   * 图文标题
   */
  title: string;
  /**
   * 推荐数
   */
  reCommand: string;
  /**
   * 播放数
   */
  play: string;

  /**
   * 阅读数
   */
  read: string;
  /**
   * 评论数
   */
  comment: string;
  /**
   * 点赞数
   */
  great: string;
  /**
   * 收藏数
   */
  collect: string;
  /**
   * 分享数
   */
  share: string;
  /**
   * 页面url
   */
  pageUrl: string;
}

/**
 * 头条内容
 */
interface TouTiaoContentItem {
  /**
   * 作品唯一id，对应发布进度返回的docId
   */
  id: string;
  /**
   * 封面url
   */
  cover: string;
  /**
   * 发布日期
   */
  date: string;
  /**
   * 类型 video dynamic article
   */
  type: string;

  /**
   * 图文标题
   */
  title: string;
  /**
   * 推荐数
   */
  reCommand: string;
  /**
   * 播放数
   */
  play: string;

  /**
   * 阅读数
   */
  read: string;
  /**
   * 评论数
   */
  comment: string;
  /**
   * 点赞数
   */
  great: string;
  /**
   * 页面url
   */
  pageUrl: string;
}

/**
 * 新浪微博哦内容
 */
interface XinLangWeiBoContentItem {
  /**
   * 作品唯一id，对应发布进度返回的docId
   */
  id: string;
  /**
   * 封面url
   */
  cover: string;
  /**
   * 发布日期
   */
  date: string;
  /**
   * 类型 video dynamic article
   */
  type: string;
  /**
   * 播放数
   */
  play: string;
  /**
   * 分享数
   */
  share: string;
  /**
   * 评论数
   */
  comment: string;
  /**
   * 点赞数
   */
  great: string;
  /**
   * 页面url
   */
  pageUrl: string;
}

/**
 * 知乎内容
 */
interface ZhiHuContentItem {
  /**
   * 作品唯一id，对应发布进度返回的docId
   */
  id: string;
  /**
   * 封面url
   */
  cover: string;
  /**
   * 发布日期
   */
  date: string;
  /**
   * 类型 video dynamic article
   */
  type: string;
  /**
   * 阅读量
   */
  read: string;
  /**
   * 播放量
   */
  play: string;
  /**
   * 点赞量
   */
  great: string;
  /**
   * 评论量
   */
  comment: string;
  /**
   * 收藏量
   */
  collect: string;
  /**
   * 喜欢数
   */
  like: string;
  /**
   * 页面url
   */
  pageUrl: string;
}

/**
 * 小红书内容
 */
export type XiaoHongShuContentItem = XiaoHongShuManageContentItem | XiaoHongShuAnalyzeContentItem;

/**
 * 小红书笔记管理manage
 */
interface XiaoHongShuManageContentItem {
  /**
   * 作品唯一id，对应发布进度返回的docId
   */
  id: string;
  /**
   * 封面url
   */
  cover: string;
  /**
   * 发布日期
   */
  date: string;
  /**
   * 类型 video dynamic article
   */
  type: string;
  /**
   * 标题
   */
  title: string;

  /**
   * 阅读数
   */
  read: number;
  /**
   * 评论数
   */
  comment: number;
  /**
   * 点赞数
   */
  great: number;
  /**
   * 收藏量
   */
  collect: number;
  /**
   * 分享数
   */
  share: number;

  /**
   * 页面url
   */
  pageUrl: string;
}

/**
 * 小红书内容分析analyze
 */
interface XiaoHongShuAnalyzeContentItem {
  /**
   * 作品唯一id，对应发布进度返回的docId
   */
  id: string;
  /**
   * 封面url
   */
  cover: string;
  /**
   * 发布日期
   */
  date: string;
  /**
   * 类型 video dynamic article
   */
  type: string;
  /**
   * 标题
   */
  title: string;

  /**
   * 曝光
   */
  reCommand: number;
  /**
   * 阅读数
   */
  read: number;

  /**
   * 封面点击率
   */
  coverClickRatio: number;
  /**
   * 评论数
   */
  comment: number;

  /**
   * 涨粉
   */
  addFans: number;
  /**
   * 点赞数
   */
  great: number;
  /**
   * 收藏量
   */
  collect: number;
  /**
   * 分享数
   */
  share: number;

  /**
   * 平均播放时长/秒
   */
  averagePlayTime: number;

  /**
   * 弹幕
   */
  danmu: number;
  /**
   * 页面url,作品分析下改字段无效
   */
  pageUrl?: string;
}

/**
 * 企鹅号内容
 */
interface QiEHaoContentItem {
  /**
   * 作品唯一id，对应发布进度返回的docId
   */
  id: string;
  /**
   * 封面url
   */
  cover: string;
  /**
   * 发布日期
   */
  date: string;
  /**
   * 类型 video dynamic article
   */
  type: string;
  /**
   * 标题
   */
  title: string;
  /**
   * 阅读数
   */
  read: string;
  /**
   * 播放数
   */
  play: string;

  /**
   * 评论数
   */
  comment: string;

  /**
   * 页面url
   */
  pageUrl: string;
}

/**
 * 搜狐号内容
 */
interface SouHuHaoContentItem {
  /**
   * 作品唯一id，对应发布进度返回的docId
   */
  id: string;
  /**
   * 封面url
   */
  cover: string;
  /**
   * 发布日期
   */
  date: string;
  /**
   * 类型 video dynamic article
   */
  type: string;
  /**
   * 标题
   */
  title: string;

  /**
   * 阅读数
   */
  read: string;
  /**
   * 播放数
   */
  play: string;
  /**
   * 点赞数
   */
  great: string;
  /**
   * 评论数
   */
  comment: string;
  /**
   * 分享数
   */
  share: string;
  /**
   * 投票数
   */
  vote: string;

  /**
   * 页面url
   */
  pageUrl: string;
}

/**
 * 一点号内容
 */
interface YiDianHaoContentItem {
  /**
   * 作品唯一id，对应发布进度返回的docId
   */
  id: string;
  /**
   * 封面url
   */
  cover: string;
  /**
   * 发布日期
   */
  date: string;
  /**
   * 类型 video dynamic article
   */
  type: string;
  /**
   * 标题
   */
  title: string;
  /**
   * 推荐数
   */
  reCommand: string;
  /**
   * 阅读数
   */
  read: string;
  /**
   * 评论数
   */
  comment: string;
  /**
   * 分享数
   */
  share: string;
  /**
   * 收藏数
   */
  collect: string;
  /**
   * 页面url
   */
  pageUrl: string;
}

/**
 * 大鱼号内容
 */
interface DaYuHaoContentItem {
  /**
   * 作品唯一id，对应发布进度返回的docId
   */
  id: string;
  /**
   * 封面url
   */
  cover: string;
  /**
   * 发布日期
   */
  date: string;
  /**
   * 类型 video dynamic article
   */
  type: string;
  /**
   * 标题
   */
  title: string;
  /**
   * 阅读数
   */
  read: string;
  /**
   * 播放数
   */
  play: string;
  /**
   * 评论数
   */
  comment: string;
  /**
   * 分享数
   */
  share: string;
  /**
   * 收藏数
   */
  collect: string;
  /**
   * 点赞数
   */
  great: string;
  /**
   * 页面url
   */
  pageUrl: string;
}

/**
 * 网易号内容
 */
interface WangYiHaoContentItem {
  /**
   * 作品唯一id，对应发布进度返回的docId
   */
  id: string;
  /**
   * 封面url
   */
  cover: string;
  /**
   * 发布日期
   */
  date: string;
  /**
   * 类型 video dynamic article
   */
  type: string;
  /**
   * 标题
   */
  title: string;
  /**
   * 推荐
   */
  reCommand: string;
  /**
   * 阅读数
   */
  read: string;
  /**
   * 评论数
   */
  comment: string;
  /**
   * 点赞数
   */
  great: string;
  /**
   * 页面url
   */
  pageUrl: string;
}

/**
 * 爱奇艺内容
 */
interface AiQiYiHaoContentItem {
  /**
   * 作品唯一id，对应发布进度返回的docId
   */
  id: string;
  /**
   * 封面url
   */
  cover: string;
  /**
   * 发布日期
   */
  date: string;
  /**
   * 类型 video dynamic article
   */
  type: string;
  /**
   * 标题
   */
  title: string;
  /**
   * 推荐数
   */
  reCommand: string;
  /**
   * 播放数
   */
  play: string;
  /**
   * 平均播放时长
   */
  playTime: string;
  /**
   * 完播率
   */
  finishPlay: string;
  /**
   * 评论数
   */
  comment: string;
  /**
   * 点赞数
   */
  great: string;
  /**
   * 弹幕数
   */
  danmu: string;
  /**
   * 分享数
   */
  share: string;
}

/**
 * 微视内容
 */
interface WeiShiContentItem {
  /**
   * 作品唯一id，对应发布进度返回的docId
   */
  id: string;
  /**
   * 封面url
   */
  cover: string;
  /**
   * 发布日期
   */
  date: string;
  /**
   * 类型 video dynamic article
   */
  type: string;
  /**
   * 标题
   */
  title: string;

  /**
   * 播放数
   */
  play: string;
  /**
   * 评论数
   */
  comment: string;
  /**
   * 点赞数
   */
  great: string;
  /**
   * 页面地址url
   */
  pageUrl: string;
}

/**
 * 微信公众号内容
 */
interface WeiXinGongZhongHaoContentItem {
  /**
   * 作品唯一id，对应发布进度返回的docId
   */
  id: string;
  /**
   * 封面url
   */
  cover: string;
  /**
   * 发布日期
   */
  date: string;
  /**
   * 类型  article
   */
  type: string;
  /**
   * 标题
   */
  title: string;
  /**
   * 阅读数
   */
  read: string;
  /**
   * 点赞数
   */
  great: string;
  /**
   * 分享数
   */
  share: string;
  /**
   * 推荐数（在看数）
   */
  reCommand: string;
  /**
   * 留言数
   */
  comment: string;
  /**
   * 页面地址url
   */
  pageUrl: string;
}
