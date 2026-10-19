import {
  getBaijiahaoArticleStatus,
  getBaijiahaoBaseToken,
  getBaijiahaoContentList,
  getBaijiahaoDataOverview,
  getBaijiahaoSingleDataOverview,
  getBaijiahaoSingleDataOverviewStatistic,
  getBaijiahaoUserHomeData,
  getBaijiahaoUserIncome,
  getBaijiahaoUserInfo,
  getBaijiahaoPublishArticleToken,
  getBaijiahaoTopicList,
  getBaijiahaoLocationListBySearch,
  getBaijiahaoLocationList,
  getBaijiahaoActivityList,
  getBaijiahaoCategoryList,
  getBaijiahaoMiniVideoStatus,
  getBaijiahaoVideoStatus,
  getBaijiaContentListView,
  deleteBaijiahaoContent,
  getBaijiahaoDynamicStatus,
  searchBaijiahaoPublicAuthorList,
} from './baijiahao-common';
import { searchBaijiahaoPublicWorkList } from './baijiahao-public-work-search.service';
import { publishBaijiahaoArticle } from './baijiahao-article';
import { publishBaijiahaoVideo } from './baijiahao-video';
import { publishBaijiahaoMiniVideo } from './baijiahao-mini-video';
import { publishBaijiahaoDynamic } from './baijiahao-dynamic';
import { BaseResult } from '@/media-platform/baseResult';
import { errorCode } from '@/media-platform/errorCode';
import { getBaijiahaoCollection } from './baijiahao-collection';

export const Baijiahao = {
  publishArticle: publishBaijiahaoArticle,
  publishVideo: publishBaijiahaoVideo,
  publishMiniVideo: publishBaijiahaoMiniVideo,
  publishDynamic: publishBaijiahaoDynamic,
  getBaijiahaoContentList,
  getBaijiahaoDataOverview,
  getBaijiahaoUserHomeData,
  getBaijiahaoUserIncome,
  getBaijiahaoSingleDataOverviewStatistic,
  getBaijiahaoSingleDataOverview,
  getBaijiahaoArticleStatus,
  getBaijiahaoPublishArticleToken,
  getBaijiahaoBaseToken,
  getBaijiahaoUserInfo,
  getBaijiahaoTopicList,
  getBaijiahaoLocationListBySearch,
  getBaijiahaoLocationList,
  getBaijiahaoActivityList,
  getBaijiahaoCategoryList,
  getBaijiahaoVideoStatus,
  getBaijiahaoMiniVideoStatus,
  getBaijiaContentListView,
  deleteBaijiahaoContent,
  getBaijiahaoDynamicStatus,
  getBaijiahaoCollection,
  searchBaijiahaoPublicAuthorList,
  searchBaijiahaoPublicWorkList,
};

export type {
  BaijiahaoContentListOutput,
  BaijiahaoDataOverviewOutput,
  BaijiahaoUserHomeDataOutput,
  BaijiahaoUserIncomeOutput,
  BaijiahaoSingleDataOverviewStatisticOutput,
  BaijiahaoSingleDataOverviewOutput,
  BaijiahaoArticleStatusOutput,
  BaijiahaoPublishTokenOutput,
  BaijiahaoTokenOutput,
  BaijiahaoUserInfoOutput,
  BaijiahaoTopicListOutput,
  BaijiahaoLocationListBySearchOutput,
  BaijiahaoLocationListOutput,
  BaijiahaoActivityListOutput,
  BaijiahaoCategoryListOutput,
} from './baijiahao-common';
export type {
  PlatformPublicAuthorInfo,
  PlatformPublicAuthorListOutput,
  PlatformPublicWorkInfo,
  PlatformPublicWorkListOutput,
} from '../baseModel';
export type { BaijiahaoPublicWorkSearchContentType } from './baijiahao-public-work-search.service';

export type { BaijiahaoMediaContent } from './baijiahao-content-list.service';
export type { BaijiahaoPublishResultOutput } from './baijiahao-article';
export type { BaijiahaoActivityInfo } from './baijiahao-activity.service';
export type { BaijiahaoLocationItem } from './baijiahao-location.service';
export type { BaijiahaoTopicItem } from './baijiahao-topic.service';
export type { BaijiahaoVideoTaskInput } from './baijiahao-video';
export type { BaijiahaoCategoryInfo } from './baijiahao-category.service';
export type {
  BaijiahaoDataOverviewItemResponse,
  BaijiahaoDataOverviewChartResponse,
} from './baijiahao-data-overview.service';
