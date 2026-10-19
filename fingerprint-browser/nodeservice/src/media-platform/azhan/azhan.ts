import {
  deleteAZhanMediaContent,
  getAzhanContentList,
  getAzhanDataOverview,
  getAzhanUserInfo,
  getAZhanMediaCategory,
  getAZhanMediaStatus,
} from './azhan-common';
import { publishAZhanVideo } from './azhan-video';
import { publishAZhanArticle } from '@/media-platform/azhan/azhan-article';

export const Azhan = {
  publishVideo: publishAZhanVideo,
  publishArticle: publishAZhanArticle,
  getAzhanContentList,
  getAzhanDataOverview,
  getAzhanUserInfo,
  getAZhanMediaStatus,
  deleteAZhanMediaContent,
  getAZhanMediaCategory,
};

export type { AzhanContentListOutput, AzhanDataOverviewOutput, AzhanUserInfoOutput } from './azhan-common';
export type { AzhanMediaContent } from './azhan-content-list.service';
export type { AzhanDataOverviewDailyDataResponse } from './azhan-data-overview.service';
