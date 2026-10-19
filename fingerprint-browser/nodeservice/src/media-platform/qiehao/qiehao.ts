import {
  getQiehaoActivity,
  getQiehaoVideoCategory,
  getQiehaoContentList,
  getQiehaoDataOverviewArticle,
  getQiehaoDataOverviewArticleList,
  getQiehaoDataOverviewFans,
  getQiehaoDataOverviewVideo,
  getQiehaoDataOverviewVideoList,
  getQiehaoHotEvents,
  getQiehaoSingleDataOverview,
  getQiehaoSingleDataOverviewStatistic,
  getQiehaoUserHomeData,
  getQiehaoUserInfo,
  getQiehaoVideoStatus,
  getQiehaoArticleCategory,
  getQiehaoArticleStatus,
  getQieHaoContentListView,
  deleteQiehaoContent,
} from './qiehao-common';
import { publishQiehaoVideo } from './qiehao-video';
import { publishQiehaoArticle } from './qiehao-article';

export const Qiehao = {
  publishVideo: publishQiehaoVideo,
  publishArticle: publishQiehaoArticle,
  getQiehaoContentList,
  getQiehaoDataOverviewVideo,
  getQiehaoDataOverviewArticle,
  getQiehaoDataOverviewFans,
  getQiehaoDataOverviewVideoList,
  getQiehaoDataOverviewArticleList,
  getQiehaoUserHomeData,
  getQiehaoSingleDataOverviewStatistic,
  getQiehaoSingleDataOverview,
  getQiehaoHotEvents,
  getQiehaoVideoCategory,
  getQiehaoArticleCategory,
  getQiehaoActivity,
  getQiehaoVideoStatus,
  getQiehaoUserInfo,
  getQiehaoArticleStatus,
  getQieHaoContentListView,
  deleteQiehaoContent,
};

export type {
  QiehaoContentListOutput,
  QiehaoDataOverviewVideoOutput,
  QiehaoDataOverviewArticleOutput,
  QiehaoDataOverviewFansOutput,
  QiehaoDataOverviewVideoListOutput,
  QiehaoDataOverviewArticleListOutput,
  QiehaoUserHomeDataOutput,
  QiehaoSingleDataOverviewStatisticOutput,
  QiehaoSingleDataOverviewOutput,
  QiehaoHotEventsOutput,
  QiehaoVideoCategoryOutput,
  QiehaoActivityOutput,
  QiehaoVideoStatusOutput,
  QiehaoUserInfoOutput,
  QiehaoArticleCategoryOutput,
} from './qiehao-common';

export type { QiehaoMediaContent } from './qiehao-content-list.service';
export type { QiehaoVideoTaskInput } from './qiehao-video';
export type { QiehaoArticleTaskInput, QiehaoPublishResultOutput } from './qiehao-article';
export type { QiehaoArticleCategory } from './qiehao-category.service';
export type {
  QiehaoDataOverviewArticleMediaContent,
  QiehaoDataOverviewVideoMediaContent,
} from './qiehao-data-overview.service';
