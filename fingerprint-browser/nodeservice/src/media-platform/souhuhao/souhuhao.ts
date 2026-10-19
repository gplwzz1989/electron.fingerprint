import {
  deleteSouhuhaoContent,
  getSouhuhaoArticleStatus,
  getSouhuhaoColumn,
  getSouhuhaoContentList,
  getSouhuhaoContentListView,
  getSouhuhaoDataOverview,
  getSouhuhaoNewsInfo,
  getSouhuhaoTopic,
  getSouhuhaoUserHomeData,
  getSouhuhaoUserIncome,
  getSouhuhaoUserInfo,
  getSouhuhaoVideoCategory,
  getSouhuhaoVideoStatus,
} from './souhuhao-common';
import { publishSouhuhaoVideo } from './souhuhao-video';
import { publishSouhuhaoArticle } from './souhuhao-article';

export const Souhuhao = {
  publishVideo: publishSouhuhaoVideo,
  publishArticle: publishSouhuhaoArticle,
  getSouhuhaoContentList,
  getSouhuhaoDataOverview,
  getSouhuhaoNewsInfo,
  getSouhuhaoUserHomeData,
  getSouhuhaoUserInfo,
  getSouhuhaoUserIncome,
  getSouhuhaoTopic,
  getSouhuhaoColumn,
  getSouhuhaoVideoCategory,
  getSouhuhaoVideoStatus,
  getSouhuhaoArticleStatus,
  getSouhuhaoContentListView,
  deleteSouhuhaoContent,
};

export type {
  SouhuhaoContentListOutput,
  SouhuhaoDataOverviewOutput,
  SouhuhaoNewsInfoOutput,
  SouhuhaoUserHomeDataOutput,
  SouhuhaoUserInfoOutput,
  SouhuhaoUserIncomeOutput,
  SouhuhaoTopicOutput,
  SouhuhaoVideoCategoryOutput,
  SouhuhaoColumnOutput,
  SouhuhaoVideoCategoryItem,
} from './souhuhao-common';

export type { SouhuhaoVideoTaskInput } from './souhuhao-video';
export type { SouhuhaoMediaContent } from './souhuhao-content-list.service';
export type { SouhuhaoDataOverviewItemResponse } from './souhuhao-data-overview.service';
export type { SouhuhaoTopicItem } from './souhuhao-topic.service';
export type { SouhuhaoArticleTaskInput } from './souhuhao-article';
