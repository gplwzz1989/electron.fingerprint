import {
  deleteYidianhaoContent,
  getYidianhaoContentList,
  getYidianhaoContentListView,
  getYidianhaoDataOverview,
  getYidianhaoDataOverviewIncome,
  getYidianhaoDataOverviewIncomeList,
  getYidianhaoMediaStatus,
  getYidianhaoToken,
  getYidianhaoUserHomeData,
  getYidianhaoUserInfo,
  getYidianhaoVideoCategory,
} from './yidianhao-common';
import { publishYidianhaoVideo } from './yidianhao-video';
import { publishArticle } from './yidianhao-article';

export const Yidianhao = {
  publishVideo: publishYidianhaoVideo,
  publishArticle: publishArticle,
  getYidianhaoContentList,
  getYidianhaoDataOverview,
  getYidianhaoDataOverviewIncome,
  getYidianhaoDataOverviewIncomeList,
  getYidianhaoUserHomeData,
  getYidianhaoToken,
  getYidianhaoUserInfo,
  getYidianhaoMediaStatus,
  getYidianhaoContentListView,
  deleteYidianhaoContent,
  getYidianhaoVideoCategory,
};

export type {
  YidianhaoContentListOutput,
  YidianhaoDataOverviewOutput,
  YidianhaoDataOverviewIncomeOutput,
  YidianhaoDataOverviewIncomeListOutput,
  YidianhaoUserHomeDataOutput,
  YidianhaoTokenOutput,
  YidianhaoUserInfoOutput,
} from './yidianhao-common';

export type { YidianhaoMediaContent } from './yidianhao-content-list.service';
export type { YidianhaoDataOverviewItem } from './yidianhao-data-overview.service';
export type { YidianhaoVideoTaskInput, YidianhaoPublishResultOutput } from './yidianhao-video';
export type { IYiDianHaoArticleData } from './yidianhao-article';
