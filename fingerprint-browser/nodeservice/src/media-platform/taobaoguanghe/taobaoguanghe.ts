import { getTaoBaoGuangHeUserInfo } from './taobaoguanghe-user.service';
import {
  buildTaoBaoGuangHeGoodsItems,
  buildTaoBaoGuangHeGoodsListRequest,
  buildTaoBaoGuangHeGoodsTabsRequest,
  deleteTaoBaoGuangHeContent,
  getTaoBaoGuangHeGoodsList,
  getTaoBaoGuangHeGoodsTabs,
  getTaoBaoGuangHeMediaStatus,
  publishTaoBaoGuangHeImageText,
  publishTaoBaoGuangHeVideo,
} from './taobaoguanghe-video.service';

export const TaoBaoGuangHe = {
  getTaoBaoGuangHeUserInfo,
  getTaoBaoGuangHeGoodsTabs,
  getTaoBaoGuangHeGoodsList,
  buildTaoBaoGuangHeGoodsTabsRequest,
  buildTaoBaoGuangHeGoodsListRequest,
  buildTaoBaoGuangHeGoodsItems,
  publishTaoBaoGuangHeVideo,
  publishTaoBaoGuangHeImageText,
  getTaoBaoGuangHeMediaStatus,
  deleteTaoBaoGuangHeContent,
};

export type { TaoBaoGuangHeUserInfo, TaoBaoGuangHeUserInfoResponse } from './taobaoguanghe-user.service';
export {
  buildTaoBaoGuangHeGoodsItems,
  buildTaoBaoGuangHeGoodsListRequest,
  buildTaoBaoGuangHeGoodsTabsRequest,
  deleteTaoBaoGuangHeContent,
  getTaoBaoGuangHeGoodsList,
  getTaoBaoGuangHeGoodsTabs,
  publishTaoBaoGuangHeImageText,
  publishTaoBaoGuangHeVideo,
  TaoBaoGuangHeImageText,
  TaoBaoGuangHeVideo,
  TaoBaoGuangHePublishError,
  buildTaoBaoGuangHeImageTextPublishRequest,
} from './taobaoguanghe-video.service';
export type {
  TaoBaoGuangHeGoodsFilter,
  TaoBaoGuangHeGoodsListResult,
  TaoBaoGuangHeGoodsPageType,
  TaoBaoGuangHeGoodsQueryOptions,
  TaoBaoGuangHeGoodsTab,
  TaoBaoGuangHeGoodsTabsResult,
  TaoBaoGuangHeImageTextPublishTask,
  TaoBaoGuangHePublishOptions,
  TaoBaoGuangHeImageTextPublishResult,
  TaoBaoGuangHeVideoPublishResult,
  TaoBaoGuangHeUploadBizConfig,
} from './taobaoguanghe-video.service';
