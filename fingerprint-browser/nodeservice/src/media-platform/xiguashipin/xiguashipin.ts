import {
  getXiguashipinContentList,
  getXiguashipinShortContentList,
  getXiguashipinDataOverview,
  getXiguashipinDataOverviewStatistic,
  getXiguashipinIncome,
  getXiguashipinUserHomeData,
  getXiguashipinSingleDataStatistic,
  getXiguashipinSingleDataOverview,
  getXiguashipinUserInfo,
  getXiguashipinTopicList,
  getXiguashipinFriendList,
  getXiguaVideoStatus,
  getXiguaMiniVideoStatus,
} from './xiguashipin-common';
import { xiguaPublishVideo } from './xiguashipin-video';
import { xiguaPublishMiniVideo } from '../xiguashipin/xiguashipin-minivideo';

export const Xiguashipin = {
  publishVideo: xiguaPublishVideo,
  publishMiniVideo: xiguaPublishMiniVideo,
  getXiguashipinContentList,
  getXiguashipinShortContentList,
  getXiguashipinDataOverview,
  getXiguashipinDataOverviewStatistic,
  getXiguashipinIncome,
  getXiguashipinUserHomeData,
  getXiguashipinSingleDataStatistic,
  getXiguashipinSingleDataOverview,
  getXiguashipinUserInfo,
  getXiguashipinTopicList,
  getXiguashipinFriendList,
  getXiguaVideoStatus,
  getXiguaMiniVideoStatus,
};

export type {
  XiguashipinUserHomeDataOutput,
  XiguashipinContentListOutput,
  XiguashipinShortContentListOutput,
  XiguashipinDataOverviewStatisticOutput,
  XiguashipinDataOverviewOutput,
  XiguashipinIncomeOutput,
  XiguashipinSingleDataStatisticOutput,
  XiguashipinSingleDataOverviewOutput,
  XiguashipinUserInfoOutput,
  XiguashipinFriendListOutPut,
  XiguashipinTopicListOutPut,
  XiguaVideoStatusResultOutput,
} from './xiguashipin-common';
export type { XiguaVideoTaskInput, XiguaPublishResult } from './xiguashipin-video';
export type { XiguashipinMediaContent, XiguashipinShortMediaContent } from './xiguashipin-content-list.service';
export type { XiguashipinOverviewStatisticResponse } from './xiguashipin-data-overview.service';
