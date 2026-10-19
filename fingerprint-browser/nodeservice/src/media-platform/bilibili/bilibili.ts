import { publishBilibiliVideo } from './bilibili-video';
import {
  getBilibiliMemberInfo,
  getBilibiliPrivilege,
  getBilibiliUserInfo,
  getBilibiliVideoCategory,
  getBilibiliArticleCategory,
  getBilibiliVideoStatus,
  getBilibiliVideoTopic,
  getBilibiliVideoParticipationTopic,
  searchBilibiliVideoParticipationTopic,
  getBilibiliContentList,
  getBilibiliDataOverview,
  getBilibiliDataOverviewCore,
  getBilibiliArticleContentList,
  getBilibiliIncomeStatistic,
  getBilibiliArticleDataOverviewCore,
  getBilibiliArticleDataOverview,
  getBilibiliFriend,
  getBilibiliContentListView,
  getBilibiliArticleStatus,
  deleteBiLiBiLiArticleContent,
  searchBilibiliPublicAuthorList,
} from './bilibili-common';
import { publishBilibiliArticle } from './bilibili-article';
import { searchBilibiliPublicWorkList } from './bilibili-public-work-search.service';
import { getBilibiliCollection, checkBilibiliCollectionEquity } from '@/media-platform/bilibili/bilibili-collection';

export const Bilibili = {
  publishVideo: publishBilibiliVideo,
  publishArticle: publishBilibiliArticle,
  getBilibiliUserInfo,
  getBilibiliMemberInfo,
  getBilibiliPrivilege,
  getBilibiliVideoCategory,
  getBilibiliArticleCategory,
  getBilibiliVideoTopic,
  getBilibiliVideoParticipationTopic,
  searchBilibiliVideoParticipationTopic,
  getBilibiliVideoStatus,
  getBilibiliContentList,
  getBilibiliDataOverview,
  getBilibiliDataOverviewCore,
  getBilibiliArticleContentList,
  getBilibiliIncomeStatistic,
  getBilibiliArticleDataOverviewCore,
  getBilibiliArticleDataOverview,
  getBilibiliFriend,
  getBilibiliContentListView,
  getBilibiliArticleStatus,
  deleteBiLiBiLiArticleContent,
  getBilibiliCollection,
  checkBilibiliCollectionEquity,
  searchBilibiliPublicAuthorList,
  searchBilibiliPublicWorkList,
};

export type { BilibiliPublishResultOutput } from './bilibili-video';
export type {
  BilibiliUserInfoOutput,
  BilibiliMemberInfoOutput,
  BilibiliPrivilegeOutput,
  BilibiliVideoCategoryOutput,
  BilibiliVideoTopicsOutput,
  BilibiliMediaStatusResultOutput,
  BilibiliContentListOutput,
  BilibiliDataOverviewOutput,
  BilibiliDataOverviewCoreOutput,
  BilibiliArticleContentListOutput,
  BilibiliIncomeStatisticOutput,
  BilibiliArticleDataOverviewCoreOutput,
  BilibiliArticleDataOverviewOutput,
  BilibiliFriendListOutput,
} from './bilibili-common';
export type {
  PlatformPublicAuthorInfo,
  PlatformPublicAuthorListOutput,
  PlatformPublicWorkInfo,
  PlatformPublicWorkListOutput,
} from '../baseModel';
export type { BilibiliPublicWorkSearchContentType } from './bilibili-public-work-search.service';
export type { BilibiliVideoCategoryInfo } from './bilibili-category.service';
export type { BilibiliVideoTopicInfo } from './bilibili-topic.service';
export type {
  BilibiliVideoParticipationTopicInfo,
  BilibiliVideoParticipationTopicQuery,
  BilibiliVideoParticipationTopicResponse,
  BilibiliVideoParticipationTopicSearchResponse,
  BilibiliVideoParticipationTopicSelection,
} from './bilibili-participation-topic.service';
export type { BilibiliMediaContent, BilibiliArticleMediaContent } from './bilibili-content-list.service';
export type { BilibiliVideoTaskInput } from './bilibili-video.service';
export type { BilibiliArticleTaskInput } from './bilibili-article';
export type { BilibiliVideoFriendInfo } from './bilibili-friend.service';
