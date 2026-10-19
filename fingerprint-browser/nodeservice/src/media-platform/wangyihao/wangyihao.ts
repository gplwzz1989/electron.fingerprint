import {
  getWangyihaoActivityTopic,
  getWangyihaoCategory,
  getWangyihaoContentList,
  getWangyihaoDataOverview,
  getWangyihaoDataOverviewFans,
  getWangyihaoDataOverviewFansStatistics,
  getWangyihaoDataOverviewIncome,
  getWangyihaoDataOverviewIncomeStatistics,
  getWangyihaoDataOverviewNewIncomeStatistics,
  getWangyihaoDataOverviewStatistics,
  getWangyihaoPayContent,
  getWangyihaoSearchTopic,
  getWangyihaoSingleDataOverview,
  getWangyihaoSingleDataOverviewStatistic,
  getWangyihaoHotTopic,
  getWangyihaoUserHomeData,
  getWangyihaoUserInfo,
  getWangyihaoMediaStatus,
  getWangyihaoContentListView,
  deleteWangyihaoContent,
} from './wangyihao-common';
import { publishWangyiVideo } from './wangyihao-video';
import { publishWangyihaoArticle } from './wangyihao-article';

export const Wangyihao = {
  publishVideo: publishWangyiVideo,
  publishArticle: publishWangyihaoArticle,
  getWangyihaoContentList,
  getWangyihaoDataOverview,
  getWangyihaoDataOverviewStatistics,
  getWangyihaoDataOverviewIncome,
  getWangyihaoDataOverviewIncomeStatistics,
  getWangyihaoDataOverviewFans,
  getWangyihaoDataOverviewFansStatistics,
  getWangyihaoUserHomeData,
  getWangyihaoUserInfo,
  getWangyihaoSingleDataOverviewStatistic,
  getWangyihaoSingleDataOverview,
  getWangyihaoDataOverviewNewIncomeStatistics,
  getWangyihaoCategory,
  getWangyihaoActivityTopic,
  getWangyihaoHotTopic,
  getWangyihaoSearchTopic,
  getWangyihaoPayContent,
  getWangyihaoMediaStatus,
  getWangyihaoContentListView,
  deleteWangyihaoContent,
};

export type {
  WangyihaoContentListOutput,
  WangyihaoDataOverviewOutput,
  WangyihaoDataOverviewFansOutput,
  WangyihaoDataOverviewFansStatisticsOutput,
  WangyihaoDataOverviewIncomeOutput,
  WangyihaoDataOverviewIncomeStatisticsOutput,
  WangyihaoDataOverviewStatisticsOutput,
  WangyihaoUserInfoOutput,
  WangyihaoUserHomeDataOutput,
  WangyihaoSingleDataOverviewStatisticOutput,
  WangyihaoSingleDataOverviewOutput,
  WangyihaoDataOverviewNewIncomeStatisticsOutput,
  WangyihaoCategoryOutput,
  WangyihaoActivityTopicOutput,
  WangyihaoTopTopicOutput,
  WangyihaoSearchTopicOutput,
  WangyihaoPayContentOutput,
} from './wangyihao-common';

export type { WangyihaoMediaContent } from './wangyihao-content-list.service';
export type { WangyihaoDataOverviewItemResponse } from './wangyihao-data-overview.service';
export type { WangyiVideoTaskInput, WangyiPublishResultOutput } from './wangyihao-video';
export type { WangyiVideoCategory } from './wangyihao-category.service';
export type { WangyiVideoTopicInfo } from './wangyihao-topic.service';
export type { WangyihaoArticleTaskInput } from './wangyihao-article';
