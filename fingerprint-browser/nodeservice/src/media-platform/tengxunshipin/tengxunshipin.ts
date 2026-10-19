import {
  deleteTengXunShiPinContent,
  getTengxunshipinContentList,
  getTengxunshipinDataOverview,
  getTengxunshipinDataOverviewIncome,
  getTengxunshipinSingleDataOverview,
  getTengxunshipinUserHomeData,
  getTengxunshipinUserInfo,
  getTengXunShiPinVideoStatus,
  searchTengXunShiPinTopicList,
} from './tengxunshipin-common';
import { publishTengXunShiPinVideo } from './tengxunshipin-video';
import { getPersonalAccessTokenAsync } from '@/media-platform/tengxunshipin/tengxunshipin-user.service';

export const Tengxunshipin = {
  publishVideo: publishTengXunShiPinVideo,
  getTengxunshipinContentList,
  getTengxunshipinDataOverview,
  getTengxunshipinUserHomeData,
  getTengxunshipinDataOverviewIncome,
  getTengxunshipinUserInfo,
  getTengxunshipinSingleDataOverview,
  searchTengXunShiPinTopicList,
  getTengXunShiPinVideoStatus,
  deleteTengXunShiPinContent,
  getPersonalAccessTokenAsync,
};

export type {
  TengxunshipinContentListOutput,
  TengxunshipinDataOverviewIncomeOutput,
  TengxunshipinDataOverviewOutput,
  TengxunshipinUserHomeDataOutput,
  TengxunshipinUserInfoOutput,
  TengxunshipinSingleDataOverviewOutput,
} from './tengxunshipin-common';

export type { TengxunshipinMediaContent } from './tengxunshipin-content-list.service';

export type { TengxunshipinDataOverviewItemResponse } from './tengxunshipin-data-overview.service';
