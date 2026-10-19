import {
  deleteZhihuhaoContent,
  getZhihuArticleStatus,
  getZhihuCategoryList,
  getZhihuContentList,
  getZhihuContentListView,
  getZhihuDataOverview,
  getZhihuDataOverviewIncome,
  getZhihuDataOverviewIncomeStatistic,
  getZhihuDataOverviewStatistic, getZhihuDynamicStatus,
  getZhihuSingleDataOverview,
  getZhihuSingleDataOverviewStatistic,
  getZhihuTopicList,
  getZhihuUserHomeData,
  getZhihuUserInfo,
  getZhihuVideoStatus,
} from './zhihu-common';
import { publishZhihuArticle } from './zhihu-article';
import { zhihuPublishVideo } from './zhihu-video';
import { zhihuPublishDynamic } from '@/media-platform/zhihu/zhihu-dynamic';

export const Zhihu = {
  publishArticle: publishZhihuArticle,
  publishVideo: zhihuPublishVideo,
  publishDynamic: zhihuPublishDynamic,
  getZhihuContentList,
  getZhihuDataOverview,
  getZhihuDataOverviewStatistic,
  getZhihuDataOverviewIncome,
  getZhihuDataOverviewIncomeStatistic,
  getZhihuUserHomeData,
  getZhihuSingleDataOverviewStatistic,
  getZhihuSingleDataOverview,
  getZhihuArticleStatus,
  getZhihuTopicList,
  getZhihuUserInfo,
  getZhihuCategoryList,
  getZhihuVideoStatus,
  getZhihuContentListView,
  deleteZhihuhaoContent,
  getZhihuDynamicStatus
};

export type {
  ZhihuContentListOutput,
  ZhihuDataOverviewStatisticOutput,
  ZhihuDataOverviewOutput,
  ZhihuDataOverviewIncomeOutput,
  ZhihuDataOverviewIncomeStatisticOutput,
  ZhihuUserHomeDataOutput,
  ZhihuSingleDataOverviewStatisticOutput,
  ZhihuSingleDataOverviewOutput,
  ZhihuArticleStatusOutput,
  ZhihuTopicListOutput,
  ZhihuUserInfoOutput,
  ZhihuCategoryListOutput,
  ZhihuVideoStatusResultOutput,
} from './zhihu-common';

export type { ZhihuMediaContent } from './zhihu-content-list.service';
export type { ZhiHuVideoTaskInput, ZhihuPublishVideoResultOutput } from './zhihu-video';
