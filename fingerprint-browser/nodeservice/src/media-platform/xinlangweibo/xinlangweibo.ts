import {
  getXinlangweiboContentList,
  getXinlangweiboUserHomeData,
  getXinlangweiboVideoInteractTrend,
  getXinlangweiboVideoPlayTrend,
  getXinlangweiboSingleVideoPlayTrend,
  getXinlangweiboSingleVideoInteract,
  getXinlangweiboArticleReadTrend,
  getXinlangweiboArticleInteractTrend,
  getXinlangweiboSingleArticleReadTrend,
  getXinlangweiboSingleArticleInteract,
  getXinlangweiboWeiboReadTrend,
  getXinlangweiboWeiboInteractTrend,
  getXinlangweiboSingleWeiboReadTrend,
  getXinlangweiboSingleWeiboInteract,
  getXinlangweiboVideoCollectionList,
  getXinlangweiboSchedulePostFrequency,
  getXinlangweiboUserInfo,
  getXinlangweiboFriendList,
  getXinlangweiboToutiaoCollectionList,
  getXinlangweiboTopicList,
  getXinlangweiboVideoStatus,
  getxinlangweiboLocationList,
  gettXinlangweiboContentListView,
  checkLogin,
  deleteXinlangweiboContent,
  getXinLangWeiBoArticleDraftNum,
  searchXinlangweiboPublicAuthorList,
} from './xinlangweibo-common';
import { xinlangweiboPublishMicroArticle } from './xinlangweibo-micro-article-service';
import { publishXinlangweiboVideo } from './xinlangweibo-video';
import { xinlangweiboPublishArticle } from './xinlangweibo-article.service';
import {
  addXinlangweiboComment,
  delXinlangweiboComment,
  digXinlangweiboComment,
  getXinlangweiboCommentByContent,
  getXinlangweiboCommentContent,
} from './xinlangweibo-comment';
import {
  getWeiBOMessageConversationInfo,
  getWeiBoMessageConversationList,
  getWeiBoMessageListByConversation,
  getWeiBoNewMessageList,
  sendWeiBoMessage,
} from './xinlangweibo-message';
import { getWeiboConnectClientResponse } from './xinlangweibo-message.service';
import { getWeiboCategory } from './xinlangweibo-category';
import { searchXinlangweiboPublicWorkList } from './xinlangweibo-public-work-search.service';

export const Xinlangweibo = {
  publishVideo: publishXinlangweiboVideo,
  publishDynamic: xinlangweiboPublishMicroArticle,
  publishArticle: xinlangweiboPublishArticle,
  getXinlangweiboUserInfo,
  getXinlangweiboSchedulePostFrequency,
  getXinlangweiboVideoCollectionList,
  getXinlangweiboUserHomeData,
  getXinlangweiboContentList,
  getXinlangweiboVideoPlayTrend,
  getXinlangweiboVideoInteractTrend,
  getXinlangweiboSingleVideoPlayTrend,
  getXinlangweiboSingleVideoInteract,
  getXinlangweiboArticleReadTrend,
  getXinlangweiboArticleInteractTrend,
  getXinlangweiboSingleArticleReadTrend,
  getXinlangweiboSingleArticleInteract,
  getXinlangweiboWeiboReadTrend,
  getXinlangweiboWeiboInteractTrend,
  getXinlangweiboSingleWeiboReadTrend,
  getXinlangweiboSingleWeiboInteract,
  getXinlangweiboFriendList,
  getXinlangweiboToutiaoCollectionList,
  getXinlangweiboTopicList,
  getXinlangweiboVideoStatus,
  getxinlangweiboLocationList,
  gettXinlangweiboContentListView,
  checkLogin,
  deleteXinlangweiboContent,
  getXinLangWeiBoArticleDraftNum,
  getXinlangweiboCommentContent,
  getXinlangweiboCommentByContent,
  addXinlangweiboComment,
  delXinlangweiboComment,
  digXinlangweiboComment,
  getWeiBoMessageConversationList,
  getWeiBOMessageConversationInfo,
  getWeiBoMessageListByConversation,
  getWeiboConnectClientResponse,
  getWeiBoNewMessageList,
  sendWeiBoMessage,
  getWeiboCategory,
  searchXinlangweiboPublicAuthorList,
  searchXinlangweiboPublicWorkList,
};

export type { WeiboToutiaoCollectionInfo } from './xinlangweibo-collection.service';
export type { XinlangweiboUserInfoResultOutput } from './xinlangweibo-common';
export type { XinlangweiboMicroArticleTaskInput } from './xinlangweibo-micro-article-service';
export type { XinlangweiboArticleTaskInput } from './xinlangweibo-article.service';
export type { WeiBoToutiaoCollection } from './xinlangweibo-article.service';
export type {
  XinlangweiboSchedulePostFrequencyResultOutput,
  XinlangweiboUserHomeDataOutput,
  XinlangweiboContentListOutput,
  XinlangweiboArticleReadTrendOutput,
  XinlangweiboArticleInteractTrendOutput,
  XinlangweiboSingleArticleReadTrendOutput,
  XinlangweiboSingleArticleInteractOutput,
  XinlangweiboVideoPlayTrendOutput,
  XinlangweiboVideoInteractTrendOutput,
  XinlangweiboSingleVideoInteractOutput,
  XinlangweiboSingleVideoPlayTrendOutput,
  XinlangweiboWeiboReadTrendOutput,
  XinlangweiboWeiboInteractTrendOutput,
  XinlangweiboSingleWeiboReadTrendOutput,
  XinlangweiboSingleWeiboInteractOutput,
  XinlangweiboFriendOutput,
  XinlangweiboToutiaoCollectionResultOutput,
  XinlangweiboVideoCollectionResultOutput,
  XinlangweiboTopicResult,
  XinlangweiboContentStatusResultOutput,
  XinlangweiboLocationResult,
} from './xinlangweibo-common';
export type { PlatformPublicAuthorInfo, PlatformPublicAuthorListOutput } from '../baseModel';
export type { PlatformPublicWorkInfo, PlatformPublicWorkListOutput } from '../baseModel';
export type { XinlangweiboPublicWorkSearchContentType } from './xinlangweibo-public-work-search.service';
export type { XinlangweiboVideoTaskInput, XinlangweiboPublishResultOutput } from './xinlangweibo-video';
export type { XinlangweiboCollectionInfo } from './xinlangweibo-collection.service';
export type { XinlangweiboLocationInfo } from './xinlangweibo-location.service';
export type { XinlangweiboFriendInfo } from './xinlangweibo-friend.service';
