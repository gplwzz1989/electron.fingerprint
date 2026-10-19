import { publishDynamic } from './douyin-dynamic';
import { douyinPublishVideo, getFileSize } from './douyin-video';
import {
  getDouyinCategory,
  getDouyinCollection,
  deleteDouyinContent,
  getDouyinFriend,
  getDouyinHotEvents,
  getDouyinTopics,
  getDouyinLocation,
  getDouyinVideoStatus,
  getDouyinMiniApp,
  getDouyinGoods,
  checkDouyinGoodsCanPublish,
  getDouyinContentList,
  getDouyinDataOverview,
  getDouyinCategoryMusicList,
  searchDouyinMusicList,
  getDouyinSingleDataOverview,
  getDouyinActivityCategory,
  getDouyinActivityListInfo,
  checkDouyinHasDataManage,
  openDouyinDataManage,
  getDouyinViewHistoryList,
  getDouyinShenMingLocationList,
  getDouyinTiaozhanList,
  getDouYinContentListView,
  getDouYinLocationGoodsDetail,
  getDouyinLocationGoodsList,
  getDouyinCity,
  checkDouYinLogin,
  getDouYinAnalyzeContentListView,
  searchDouyinPublicAuthorList,
} from './douyin-common';
import { searchDouyinPublicWorkList } from './douyin-public-work-search.service';
import { getDouyinMusicCategory } from './douyin-music.service';
import {
  getDouyinLocationType,
  getDouyinShopOverLimit,
  getDouyinUserStatus,
  getDouyinUserSdkToken,
  getDouyinUserMiniAppPrivilege,
  getDouyinUserInfo,
  getDouyinPublishAnchorPrivilege,
  getDouyinSyncAppList,
} from './douyin-user';
import {
  addDouYinComment,
  delDouYinComment,
  digDouYinComment,
  getDouYinComment,
  getDouYinCommentByContent,
  getDouYinCommentContent,
  getDouYinLatestCommentNoticeList,
  monitDouYinCommentContent,
} from './douyin-comment';
import {
  getDouYinMessageConversationInfo,
  getDouYinMessageConversationList,
  getDouYinMessageListByConversation,
  getDouYinMessageStrangerMessageList,
  getDouYinNewMessageList,
  sendDouYinMessage,
} from '@/media-platform/douyin/douyin-private-msg';
import { publishDouYinArticle } from '@/media-platform/douyin/douyin-article';
import { getDouyinCoCreation } from '@/media-platform/douyin/douyin-cocreation';
import { getDouyinGameList } from '@/media-platform/douyin/douyin-game';
import { getDouyinFilmList } from '@/media-platform/douyin/douyin-film';
import { getPublishCheckStr, sendVerifySmsCode, verifyPublish } from '@/media-platform/douyin/douyin-verrify';

export const Douyin = {
  publishDynamic: publishDynamic,

  publishArticle: publishDouYinArticle,
  /**
   * 发布视频
   */
  publishVideo: douyinPublishVideo,
  getFileSize,
  /**
   * 获取用户信息/检测登录是否有效
   */
  getDouyinUserInfo,
  /**
   * 获取当前账号是否能挂载小程序
   */
  getDouyinUserMiniAppPrivilege,
  /**
   * 获取当前账号支持的地理位置类型
   */
  getDouyinLocationType,
  /**
   * 获取当前账号是否支持购物车
   */
  getDouyinShopOverLimit,
  /**
   * 查询当前账号是否正常
   */
  getDouyinUserStatus,
  /**
   * 获取分类
   */
  getDouyinCategory,
  /**
   * 获取合集
   */
  getDouyinCollection,
  /**
   * 删除作品
   */
  deleteDouyinContent,
  /**
   * 获取好友/用户列表
   */
  getDouyinFriend,
  /**
   * 获取热点
   */
  getDouyinHotEvents,
  /**
   * 获取话题
   */
  getDouyinTopics,
  /**
   * 获取地点
   */
  getDouyinLocation,

  /**
   * 获取团购商品列表
   */
  getDouyinLocationGoodsList,
  /**
   * 查询作品审核/发布状态
   */
  getDouyinVideoStatus,
  /**
   * 获取sdktoken，账号单次登录可一直使用
   */
  getDouyinUserSdkToken,
  /**
   * 解析小程序
   */
  getDouyinMiniApp,
  /**
   * 解析商品
   */
  getDouyinGoods,
  /**
   * 检测商品是否可挂车
   */
  checkDouyinGoodsCanPublish,

  /**
   * 作品列表
   */
  getDouyinContentList,

  /**
   * 数据统计
   */
  getDouyinDataOverview,
  getDouyinSingleDataOverview,
  /**
   * 获取抖音音乐分类
   */
  getDouyinMusicCategory,
  /**
   * 根据分类获取抖音音乐
   */
  getDouyinCategoryMusicList,
  /**
   * 根据关键词搜索音乐
   */
  searchDouyinMusicList,
  /**
   * 获取活动分类列表
   */
  getDouyinActivityCategory,

  /**
   * 获取抖音活动列表
   */
  getDouyinActivityListInfo,
  /**
   * 检测抖音号是否开通数据管理分析
   */
  checkDouyinHasDataManage,

  /**
   * 开启抖音数据管理分析面板
   */
  openDouyinDataManage,

  /**
   * 获取观看历史
   */
  getDouyinViewHistoryList,

  /**
   * 获取什么拍摄的地点
   */
  getDouyinShenMingLocationList,

  /**
   * 获取挑战列表
   */
  getDouyinTiaozhanList,
  /**
   * 获取抖音指定天数+条数作品
   */
  getDouYinContentListView,
  /**
   * 获取抖音评论
   */
  getDouYinComment,

  getDouYinCommentContent,
  getDouYinLatestCommentNoticeList,
  /**
   * 根据作品和评论获取指定页评论数据
   */
  getDouYinCommentByContent,

  /**
   * 监控作品评论数是否变化
   */
  monitDouYinCommentContent,

  /**
   *  添加抖音评论
   */
  addDouYinComment,

  /**
   * 删除评论
   */
  delDouYinComment,

  /**
   * 点赞，点踩评论
   */
  digDouYinComment,

  /**
   * 获取地址下的商家/商品详情
   */
  getDouYinLocationGoodsDetail,

  /**
   * 标签权限
   */
  getDouyinPublishAnchorPrivilege,
  getDouyinCity,
  checkDouYinLogin,

  getDouYinMessageConversationList,

  getDouYinMessageStrangerMessageList,

  getDouYinMessageConversationInfo,

  getDouYinMessageListByConversation,

  getDouYinNewMessageList,

  sendDouYinMessage,
  getDouyinSyncAppList,
  getDouYinAnalyzeContentListView,
  searchDouyinPublicAuthorList,
  searchDouyinPublicWorkList,
  getDouyinCoCreation,
  getDouyinGameList,
  getDouyinFilmList,
  verify: {
    getPublishCheckStr,
    sendVerifySmsCode,
    verifyPublish,
  },
};
export type { DouyinVideoStatusResultOutput } from '../douyin/douyin-mediastatus.service';
export { type DouyinGoodsInfo } from '../douyin/douyin-shop.service';
export type { DouyinMusicInfo, DouyinMusicCategory } from './douyin-music.service';
export { type DouyinVideoTaskInput, type DouyinPublishResult } from '../douyin/douyin-video';
export { type DouyinActivityInfo } from '../douyin/douyin-activity.service';
export { type DouyinHistoryMediaContent } from '../douyin/douyin-base.service';
export { type DouyinTiaozhanInfo } from '../douyin/douyin-tiaozhan.service';
export {
  type DouyinUserInfoOutput,
  type DouyinUserMiniAppEnableOutput,
  type DouyinUserLocationTypeOutput,
  type DouyinSdkTokenOutput,
  type DouyinUserShopEnableOutput,
  type DouyinUserStatusOutput,
} from '../douyin/douyin-user';

export type {
  DouyinTopicResultOutput,
  DouyinGoodsResultOutput,
  DouyinMiniAppResultOutput,
  DouyinLocationResultOutput,
  DouyinHotEventsResultOutput,
  DouyinFriendResultOutput,
  DouyinDeleteContentResultOutput,
  DouyinCollectionResultOutput,
  DouyinCategoryResultOutput,
  DouyinContentListResultOutput,
  DouyinSingleDataOverviewOutput,
  DouyinMusicResultOutput,
  DouyinActivityCategoryOutput,
  DouyinActivityOutput,
  DouyinHasDataManage,
  DouyinOpenDataManage,
  DouyinViewHistory,
  DouyinShenMingLocation,
  DouyinTiaozhanList,
} from '../douyin/douyin-common';
export type {
  PlatformPublicAuthorInfo,
  PlatformPublicAuthorListOutput,
  PlatformPublicWorkInfo,
  PlatformPublicWorkListOutput,
} from '../baseModel';
export type { DouyinPublicWorkSearchContentType } from './douyin-public-work-search.service';
