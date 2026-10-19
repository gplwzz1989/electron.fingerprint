import {
  deleteXueQiuArticleContent, getXueQiuArticleStatus,
  getXueqiuhaoContentList,
  getXueqiuhaoDataOverview,
  getXueqiuhaoDataOverviewStatistic,
  getXueqiuhaoUserInfo,
} from './xueqiuhao-common';
import { publishXueQiuHaoArticle } from '@/media-platform/xueqiuhao/xueqiuhao-article';

export const Xueqiuhao = {
  publishArticle: publishXueQiuHaoArticle,
  getXueqiuhaoContentList,
  getXueqiuhaoDataOverviewStatistic,
  getXueqiuhaoDataOverview,
  getXueqiuhaoUserInfo,
  getXueQiuArticleStatus,
  deleteXueQiuArticleContent,
};

export type {
  XueqiuhaoContentListOutput,
  XueqiuhaoDataOverviewOutput,
  XueqiuhaoDataOverviewStatisticOutput,
  XueqiuhaoUserInfoOutput,
} from './xueqiuhao-common';

export type { XueqiuhaoMediaContent } from './xueqiuhao-content-list.service';
