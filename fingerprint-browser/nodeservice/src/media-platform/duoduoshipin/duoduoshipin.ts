import {
  deleteDuoDuoShiPinContent,
  getDuoduoshipinContentList,
  getDuoduoshipinDataOverview,
  getDuoduoshipinUserInfo,
  getDuoDuoVideoStatus,
} from './duoduoshipin-common';
import { publishDuoDuoVideo } from './duoduoshipin-video';
import { getDuoduoshipinGoodsList } from '@/media-platform/duoduoshipin/duoduoshipin-shop';

export const Duoduoshipin = {
  publishVideo: publishDuoDuoVideo,
  getDuoduoshipinContentList,
  getDuoduoshipinDataOverview,
  getDuoduoshipinUserInfo,
  deleteDuoDuoShiPinContent,
  getDuoDuoVideoStatus,
  getDuoduoshipinGoodsList,
};

export type {
  DuoduoshipinContentListOutput,
  DuoduoshipinDataOverviewOutput,
  DuoduoshipinUserInfoOutput,
} from './duoduoshipin-common';

export type { DuoduoshipinMediaContent } from './duoduoshipin-content-list.service';
export type { DuoduoshipinDataOverviewItemResponse } from './duoduoshipin-data-overview.service';
