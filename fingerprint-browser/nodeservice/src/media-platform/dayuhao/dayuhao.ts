import {
  deleteDayuhaooContent,
  getDayuhaoContentList,
  getDayuhaoContentListView,
  getDayuhaoContentSingleList,
  getDayuhaoDataOverview,
  getDayuhaoDataOverviewFans,
  getDayuhaoDataOverviewFansStatistic,
  getDayuhaoDataOverviewIncome,
  getDayuhaoMediaStatus,
  getDayuhaoMiniVideoCategoryList,
  getDayuhaoSingleDataOverview,
  getDayuhaoSingleDataOverviewStatistic,
  getDayuhaoUserInfo,
  getDayuhaoVideoCategoryList,
} from './dayuhao-common';
import { publishDayuhaoVideo } from './dayuhao-video';
import { publishDayuhaoMiniVideo } from './dayuhao-mini-video';
import { publishArticle } from './dayuhao-article';

export const Dayuhao = {
  publishVideo: publishDayuhaoVideo,
  publishMiniVideo: publishDayuhaoMiniVideo,
  publishArticle: publishArticle,
  getDayuhaoContentList,
  getDayuhaoContentSingleList,
  getDayuhaoDataOverview,
  getDayuhaoDataOverviewFans,
  getDayuhaoDataOverviewFansStatistic,
  getDayuhaoDataOverviewIncome,
  getDayuhaoSingleDataOverviewStatistic,
  getDayuhaoSingleDataOverview,
  getDayuhaoUserInfo,
  getDayuhaoVideoCategoryList,
  getDayuhaoMiniVideoCategoryList,
  getDayuhaoMediaStatus,
  getDayuhaoContentListView,
  deleteDayuhaooContent,
};

export type {
  DayuhaoContentListOutput,
  DayuhaoContentSingleListOutput,
  DayuhaoDataOverviewOutput,
  DayuhaoDataOverviewFansOutput,
  DayuhaoDataOverviewFansStatisticOutput,
  DayuhaoDataOverviewIncomeOutput,
  DayuhaoSingleDataOverviewStatisticOutput,
  DayuhaoSingleDataOverviewOutput,
  DayuhaoUserInfoOutput,
  DayuhaoCategoryOutput,
} from './dayuhao-common';

export type { DayuhaoMediaContent, DayuhaoMediaContentSingle } from './dayuhao-content-list.service';
export type { DayuhaoDataOverviewItemResponse } from './dayuhao-data-overview.service';
export type { DayuhaoTopicInfo } from './dayuhao-topic';
export type { DayuhaoMiniVideoTaskInput } from './dayuhao-mini-video';
export type { DayuhaoVideoTaskInput, DayuhaoPublishResultOutput } from './dayuhao-video';
export type { IDayuhaoArticleData } from './dayuhao-article';
