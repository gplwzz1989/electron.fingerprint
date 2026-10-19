import {
  deleteCSDNMediaContent,
  getCsdnContentList,
  getCsdnDataOverview,
  getCsdnDataOverviewStatistic,
  getCSDNMediaStatus,
  getCsdnUserHomeData,
  getCSDNUserInfo,
} from './csdn-common';
import { publishCSDNArticle } from '@/media-platform/csdn/csdn-article';

export const Csdn = {
  publishArticle: publishCSDNArticle,
  getCSDNUserInfo,
  deleteCSDNMediaContent,
  getCSDNMediaStatus,
  getCsdnContentList,
  getCsdnDataOverview,
  getCsdnDataOverviewStatistic,
  getCsdnUserHomeData,
};

export type {
  CsdnContentListOutput,
  CsdnDataOverviewOutput,
  CsdnDataOverviewStatisticDataOutput,
  CsdnUserHomeDataOutput,
} from './csdn-common';

export type { CsdnMediaContent } from './csdn-content-list.service';
