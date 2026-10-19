import {
  getHaokanshipinContentList,
  getHaokanshipinDataOverview,
  getHaokanshipinDataOverviewFans,
  getHaokanshipinSingleDataOverview,
  getHaokanshipinSingleDataOverviewStatistic,
  getHaokanshipinUserHomeData,
  getHaokanshipinUserInfo,
} from './haokanshipin-common';

export const Haokanshipin = {
  getHaokanshipinContentList,
  getHaokanshipinDataOverview,
  getHaokanshipinDataOverviewFans,
  getHaokanshipinUserHomeData,
  getHaokanshipinSingleDataOverviewStatistic,
  getHaokanshipinSingleDataOverview,
  getHaokanshipinUserInfo,
};

export type {
  HaokanshipinContentListOutput,
  HaokanshipinDataOverviewOutput,
  HaokanshipinDataOverviewFansOutput,
  HaokanshipinUserHomeDataOutput,
  HaokanshipinSingleDataOverviewStatisticOutput,
  HaokanshipinSingleDataOverviewOutput,
  HaokanshipinUserInfoOutput,
} from './haokanshipin-common';

export type {
  HaokanshipinDataOverviewAllTrendInfo,
  HaokanshipinFansAllTrendInfo,
} from './haokanshipin-data-overview.service';
