import { xiaohongshuPublishVideo } from './xiaohongshushop-video';
import { xiaohongshuPublishArticle } from './xiaohongshushop-article';
import {
  getXiaohongshushopFriendList,
  getXiaohongshushopLocationList,
  getXiaohongshushopUserInfo,
  getXiaohongshushopTopicList,
  getXiaohongshushopMediaStatus,
  getXiaohongshushopContentList,
  getXiaohongshushopFirstGoods,
  getXiaohongshushopSecondGoods,
} from './xiaohongshushop-common';

export const Xiaohongshushop = {
  publishVideo: xiaohongshuPublishVideo,
  publishArticle: xiaohongshuPublishArticle,
  getXiaohongshushopUserInfo,
  getXiaohongshushopFriendList,
  getXiaohongshushopLocationList,
  getXiaohongshushopMediaStatus,
  getXiaohongshushopTopicList,
  getXiaohongshushopContentList,
  getXiaohongshushopFirstGoods,
  getXiaohongshushopSecondGoods,
};

export type { XiaohongshushopVideoTaskInput } from './xiaohongshushop-video.service';
export type { XiaohongshushopArticleTaskInput } from './xiaohongshushop-article';
export type { XiaohongshushopPubGoodsInfo, XiaohongshushopShowGoodsInfo } from './xiaohongshushop-goods.service';
export type {
  XiaohongshushopUserInfoResultOutput,
  XiaohongshushopFriendListResultOutput,
  XiaohongshushopLocationListResultOutput,
  XiaohongshushopTopicListResultOutput,
  XiaohongshushopMediaStatusResultOutput,
  XiaohongshushopContentListOutput,
} from './xiaohongshushop-common';

export type { XiaohongshushopFriendInfo } from './xiaohongshushop-friend.service';
export type { XiaohongshushopLocationInfo } from './xiaohongshushop-location.service';
export type { XiaohongshushopTopicInfo } from './xiaohongshushop-topic.service';
export type { XiaohongshushopMediaContent } from './xiaohongshushop-content-list.service';
