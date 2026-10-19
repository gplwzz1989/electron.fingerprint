import { publishKuaishouVideo } from './kuaishou-video';
import {
  deleteKuaishouContent,
  getKuaishouCategory,
  getKuaishouContentList,
  getKuaishouDataOverview,
  getKuaishouFriend,
  getKuaishouGoods,
  getKuaishouLocation,
  getKuaishouMediaStatus,
  getKuaishouShopPrivilege,
  getKuaishouTopic,
  getKuaishouUserInfo,
  getKuaishouUserStatus,
  getKuaishouSingleDataOverview,
  getKuaishouUserHomeData,
  getKuaishouArticleStatus,
  getKuaishouMusicList,
  getKuaishouContentListView,
  getKuaishouCollection,
  checkKuaiShouLogin,
  getKuaishouMiniAppPrivilege,
  getKuaiShouMiniApp,
} from './kuaishou-common';
import { publishKuaishouDynamic } from './kuaishou-article';
import {
  addKuaishouComment,
  cancelKuaishouCommentTop,
  delKuaishouComment,
  digKuaishouComment,
  getKuaiShouComment,
  getKuaiShouCommentByContent,
  getKuaiShouCommentContent,
  setKuaishouCommentTop,
} from '@/media-platform/kuaishou/kuaishou-comment';
import { getKuaiShouActivityCategory, getKuaiShouActivityListInfo } from '@/media-platform/kuaishou/kuaishou-activity';

export const Kuaishou = {
  publishVideo: publishKuaishouVideo,
  publishDynamic: publishKuaishouDynamic,
  publishArticle: publishKuaishouDynamic,
  getKuaishouUserInfo,
  getKuaishouUserStatus,
  getKuaishouShopPrivilege,
  getKuaishouMiniAppPrivilege,
  getKuaishouCategory,
  deleteKuaishouContent,
  getKuaishouFriend,
  getKuaishouLocation,
  getKuaishouMediaStatus,
  getKuaishouGoods,
  getKuaishouTopic,
  getKuaishouDataOverview,
  getKuaishouContentList,
  getKuaishouSingleDataOverview,
  getKuaishouUserHomeData,
  getKuaishouArticleStatus,
  getKuaishouMusicList,
  getKuaiShouComment,
  getKuaiShouCommentContent,
  getKuaiShouCommentByContent,
  addKuaishouComment,
  delKuaishouComment,
  digKuaishouComment,
  setKuaishouCommentTop,
  cancelKuaishouCommentTop,
  getKuaishouContentListView,
  getKuaishouCollection,
  checkKuaiShouLogin,
  getKuaiShouActivityCategory,
  getKuaiShouActivityListInfo,
  getKuaiShouMiniApp,
};

export type {
  KuaishouUserInfoOutput,
  KuaishouAccountStatusOutput,
  KuaishouShopPrivilegeOutput,
  KuaishouCategoryOutput,
  KuaishouDeleteContentOutput,
  KuaishouFriendOutput,
  KuaishouLocationOutput,
  KuaishouMediaStatusResultOutput,
  KuaishouGoodsOutput,
  KuaishouTopicOutput,
  KuaishouDataOverviewOutput,
  KuaishouContentListOutput,
  KuaishouSingleDataOverviewOutput,
  KuaishouUserHomeDataOutput,
  KuaishouMusicListDataOutput,
} from './kuaishou-common';

export type { KuaishouFriendInfo } from './kuaishou-friend.service';
export type { KuaishouLocationInfo } from './kuaishou-location.service';
export type { KuaishouMediaContent, KuaishouContentData } from './kuaishou-content-list.service';
export type { KuaishouGoodsInfo } from './kuaishou-shop.service';
export type { KuaishouTopicInfo } from './kuaishou-topic.service';
export type { KuaishouVideoTaskInput } from './kuaishou-video.service';
export type { KuaishouDynamicTaskInput } from './kuaishou-article';
export type { KuaishouMusicInfo } from './kuaishou-music.service';
export type { KuaishouSingleDataOverviewTabDataResponse, KuaishouBasicData } from './kuaishou-data-overview.service';
