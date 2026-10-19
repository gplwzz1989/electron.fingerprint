import {
  getMiaopaiContentList,
  getMiaopaiDataOverview,
  getMiaopaiDataOverviewCoreData,
  getMiaopaiDataOverviewIncome,
  getMiaopaiUserHomeData,
  getMiaopaiUserInfo,
} from './miaopai-common';

export const Miaopai = {
  getMiaopaiContentList,
  getMiaopaiDataOverview,
  getMiaopaiDataOverviewCoreData,
  getMiaopaiDataOverviewIncome,
  getMiaopaiUserInfo,
  getMiaopaiUserHomeData,
};

export type {
  MiaopaiContentListOutput,
  MiaopaiDataOverviewOutput,
  MiaopaiDataOverviewCoreDataOutput,
  MiaopaiDataOverviewIncomeOutput,
  MiaopaiUserInfoOutput,
  MiaopaiUserHomeDataOutput,
} from './miaopai-common';

export type { MiaopaiMediaContent } from './miaopai-content-list.service';
export type { MiaopaiDataOverviewItemResponse } from './miaopai-data-overview.service';
