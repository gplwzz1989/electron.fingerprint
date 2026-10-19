import {
  getToutiaohaoArticleCollection,
  getToutiaohaoArticleLocationList,
  getToutiaohaoArticleTopiclist,
  getToutiaohaoArticleStatus,
  getToutiaohaoContentList,
  getToutiaohaoDataOverview,
  getToutiaohaoDataOverviewFans,
  getToutiaohaoPlaceList,
  getToutiaohaoSingleDataOverview,
  getToutiaohaoSingleDataOverviewStatistic,
  getToutiaohaoUserHomeData,
  getToutiaohaoVideoTopiclist,
  getToutiaohaoVideoCollectionList,
  getToutiaohaoVideoActivityList,
  getToutiaohaoVideoActivityCategory,
  getToutiaohaoVideoStatus,
  getToutiaohaoMiniVideoStatus,
  getToutiaohaoUserInfo,
  getToutiaohaoNewContentList,
  getToutiaoContentListView,
  deleteToutiaohaoContent,
  getToutiaohaoDynamicStatus,
  getTouTiaoUserCanPubInfo,
  searchToutiaohaoPublicAuthorList,
} from './toutiaohao-common';
import { searchToutiaohaoPublicWorkList } from './toutiaohao-public-work-search.service';
import { publishToutiaohaoArticle } from './toutiaohao-article';
import { publishToutiaohaoVideo } from './toutiaohao-video';
import { publishToutiaohaoMiniVideo } from './toutiaohao-mini-video';
import { publishToutiaohaoDynamic } from './toutiaohao-dynamic';

export const Toutiaohao = {
  publishArticle: publishToutiaohaoArticle,
  publishVideo: publishToutiaohaoVideo,
  publishMiniVideo: publishToutiaohaoMiniVideo,
  publishDynamic: publishToutiaohaoDynamic,
  getToutiaohaoContentList,
  getToutiaohaoDataOverview,
  getToutiaohaoDataOverviewFans,
  getToutiaohaoUserHomeData,
  getToutiaohaoSingleDataOverviewStatistic,
  getToutiaohaoSingleDataOverview,
  getToutiaohaoArticleLocationList,
  getToutiaohaoArticleCollection,
  getToutiaohaoPlaceList,
  getToutiaohaoVideoTopiclist,
  getToutiaohaoArticleTopiclist,
  getToutiaohaoArticleStatus,
  getToutiaohaoVideoCollectionList,
  getToutiaohaoVideoActivityList,
  getToutiaohaoVideoActivityCategory,
  getToutiaohaoVideoStatus,
  getToutiaohaoMiniVideoStatus,
  getToutiaohaoUserInfo,
  getToutiaohaoNewContentList,
  getToutiaoContentListView,
  deleteToutiaohaoContent,
  getToutiaohaoDynamicStatus,
  getTouTiaoUserCanPubInfo,
  searchToutiaohaoPublicAuthorList,
  searchToutiaohaoPublicWorkList,
};

export type {
  ToutiaohaoContentListOutput,
  ToutiaohaoDataOverviewOutput,
  ToutiaohaoDataOverviewFansOutput,
  ToutiaohaoUserHomeDataOutput,
  ToutiaohaoSingleDataOverviewStatisticOutput,
  ToutiaohaoSingleDataOverviewOutput,
  ToutiaohaoLocationOutput,
  ToutiaohaoArticleCollectionOutput,
  ToutiaohaoPlaceListOutput,
  ToutiaohaoVideoTopicOutput,
  ToutiaohaoArticleTopicOutput,
  ToutiaohaoVideoCollectionOutput,
  ToutiaohaoVideoActivityOutput,
  ToutiaohaoUserInfoOutput,
  ToutiaohaoNewContentListOutput,
} from './toutiaohao-common';
export type {
  PlatformPublicAuthorInfo,
  PlatformPublicAuthorListOutput,
  PlatformPublicWorkInfo,
  PlatformPublicWorkListOutput,
} from '../baseModel';
export type { ToutiaohaoPublicWorkSearchContentType } from './toutiaohao-public-work-search.service';

export type {
  ToutiaohaoMediaContent,
  ToutiaohaoArticleMediaContent,
  ToutiaohaoVideoMediaContent,
} from './toutiaohao-content-list.service';
export type { ToutiaohaoPublishResultOutput, ToutiaohaoArticleTaskInput } from './toutiaohao-article';
export type { ToutiaohaoVideoTaskInput, SyncAwemeTask } from './toutiaohao-video';
export type { ToutiaohaoMiniVideoTaskInput } from './toutiaohao-mini-video';
export type { ToutiaohaoArticleTopicInfo } from './toutiaohao-topic.service';
export type { ToutiaohaoVideoCollectionInfo } from './toutiaohao-collection.service';
export type { ToutiaohaoVideoActivityInfo } from './toutiaohao-activity.service';
export type {
  ToutiaohaoDataOverviewDailyResponse,
  ToutiaohaoFansDailyResponse,
} from './toutiaohao-data-overview.service';
