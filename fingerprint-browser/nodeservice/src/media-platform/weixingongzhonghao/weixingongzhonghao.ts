import {
  createWeiXinGongZhongHaoVote,
  getGongZhongHaoArticleStatus,
  getWeixingongzhonghaoContentList,
  getWeixingongzhonghaoDataOverview,
  getWeixingongzhonghaoDataOverviewSingleContentList,
  getWeiXinGongZhongHaoMiniApp,
  getWeixingongzhonghaoSingleDataOverview,
  getWeixingongzhonghaoUserHomeData,
  getWeixingongzhonghaoUserIncome,
  getWeixingongzhonghaoUserInfo,
  getWeiXinGongZhongHaoVoteDetail,
  getWeiXinGongZhongHaoVoteList,
  getWeiXinShipinhaoUserContentList,
  searchWeiXinGongZhongHaoUserList,
  searchWeiXinShipinhaoUserList,
  uploadWeiXinGongZhongHaoVoteImage,
  getWeiXinGongZhongHaoOverViewDashboard,
  getWeixingongzhonghaoContentListView,
} from './weixingongzhonghao-common';
import { publishGongZhongHaoArticle } from './weixingongzhonghao-article';
import { publishGongZhongHaoDynamic } from './weixingongzhonghao-dynamic';
import { publishWeiXinGongZhongHaoVideo } from './weixingongzhonghao-video';
import { checkQrcodeOpen } from '@/media-platform/weixingongzhonghao/weixingongzhonghao-user.service';

export const Weixingongzhonghao = {
  publishArticle: publishGongZhongHaoArticle,
  publishDynamic: publishGongZhongHaoDynamic,
  publishVideo: publishWeiXinGongZhongHaoVideo,
  getWeixingongzhonghaoContentList,
  getWeixingongzhonghaoDataOverview,
  getWeixingongzhonghaoDataOverviewSingleContentList,
  getWeixingongzhonghaoUserHomeData,
  getWeixingongzhonghaoUserInfo,
  getWeixingongzhonghaoUserIncome,
  getWeixingongzhonghaoSingleDataOverview,
  searchWeiXinGongZhongHaoUserList,
  searchWeiXinShipinhaoUserList,
  getWeiXinShipinhaoUserContentList,
  createWeiXinGongZhongHaoVote,
  getWeiXinGongZhongHaoVoteList,
  uploadWeiXinGongZhongHaoVoteImage,
  getWeiXinGongZhongHaoVoteDetail,
  checkQrcodeOpen,
  getGongZhongHaoArticleStatus,
  getWeiXinGongZhongHaoMiniApp,
  getWeiXinGongZhongHaoOverViewDashboard,
  getWeixingongzhonghaoContentListView,
};

export type {
  WeixingongzhonghaoContentListOutput,
  WeixingongzhonghaoDataOverviewOutput,
  WeixingongzhonghaoDataOverviewSingleContentListOutput,
  WeixingongzhonghaoUserHomeDataOutput,
  WeixingongzhonghaoUserInfoOutput,
  WeixingongzhonghaoUserIncomeOutput,
  WeixingongzhonghaoSingleDataOverviewOutput,
} from './weixingongzhonghao-common';

export type { WeixinMsgTaskInput } from './weixingongzhonghao-article';
export type { WeixinDynamicTaskInput } from './weixingongzhonghao-dynamic';
export type { WeiXinGongZhongHaoVideoTaskInput } from './weixingongzhonghao-video';
export type { WeiXinGongZhongHaoCreateVoteRequest } from './weixingongzhonghao-model';
export type {
  WeixingongzhonghaoDataOverviewItem,
  WeixingongzhonghaoDataOverviewSingleResponse,
} from './weixingongzhonghao-data-overview.service';
