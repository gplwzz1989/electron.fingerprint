import {
  getAiqiyiArticleContentList,
  getAiqiyiVideoContentList,
  getAiqiyiDataOverview,
  getAiqiyiSingleDataOverview,
  getAiqiyiSingleDataOverviewStatistic,
  getAiqiyiUserHomeData,
  getAiqiyiUserIncome,
  getAiqiyiUserInfo,
  getAiqiyiVideoStatus,
  getAiqiyiArticleStatus,
  getAiqiyiContentListView,
  deleteAiqiyiContent,
  getAiqiYiVideoCategory,
} from './aiqiyi-common';
import { publishQiqiyiVideo } from './aiqiyi-video';
import { publishAiqiyiArticle } from './aiqiyi-article';

export const Aiqiyi = {
  publishVideo: publishQiqiyiVideo,
  publishArticle: publishAiqiyiArticle,
  getAiqiyiContentList: getAiqiyiVideoContentList,
  getAiqiyiVideoContentList,
  getAiqiyiDataOverview,
  getAiqiyiUserHomeData,
  getAiqiyiUserIncome,
  getAiqiyiSingleDataOverviewStatistic,
  getAiqiyiSingleDataOverview,
  getAiqiyiUserInfo,
  getAiqiyiArticleContentList,
  getAiqiyiVideoStatus,
  getAiqiyiArticleStatus,
  getAiqiyiContentListView,
  deleteAiqiyiContent,
  getAiqiYiVideoCategory,
};

export type {
  AiqiyiContentListOutput,
  AiqiyiDataOverviewOutput,
  AiqiyiUserHomeDataOutput,
  AiqiyiUserIncomeOutput,
  AiqiyiSingleDataOverviewStatisticOutput,
  AiqiyiSingleDataOverviewOutput,
  AiqiyiUserInfoOutput,
  AiqiyiArticleContentListOutput,
} from './aiqiyi-common';

export type { AiqiyiMediaContent } from './aiqiyi-content-list.service';
export type { AiqiyiDataOverviewItemResponse } from './aiqiyi-data-overview.service';
export type { AiqiyiVideoTaskInput, AiqiyiPublishResultOutput } from './aiqiyi-video';
export type { AiqiyiArticleTaskInput } from './aiqiyi-article';
