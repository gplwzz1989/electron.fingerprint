import { xiaohongshuPublishVideo } from './xiaohongshu-video';
import {
  generateXiaohongshuArticleImages,
  generateXiaohongshuSingleImage,
  getXiaohongshuArticleTemplateList,
  xiaohongshuPublishDynamic,
} from './xiaohongshu-article';
import {
  getXiaohongshuFriendList,
  getXiaohongshuLocationList,
  getXiaohongshuUserInfo,
  getXiaohongshuLiveDataOverview,
  getXiaohongshuTopicList,
  getXiaohongshuMediaStatus,
  getXiaohongshuContentList,
  getXiaohongshuDataOverviewNewList,
  getXiaohongshuDataOverviewSingleList,
  getXiaohongshuPersonalInfo,
  getXiaohongshuContentListView,
  deleteXiaohongshuContent,
  getXiaoHongShuUserCanPubInfo,
  getXiaohongshuAnalyzeContentListView,
} from './xiaohongshu-common';
import {
  addXiaohongshuComment,
  delXiaohongshuComment,
  digXiaohongshuComment,
  getXiaohongshuComment,
  getXiaoHongShuCommentByContent,
  getXiaoHongShuCommentContent,
} from './xiaohongshu-comment';
import {
  getXiaohongshuProMessage,
  getXiaoHongShuProMessageConversationList,
  getXiaoHongShuProMessageListByConversation,
  getXiaohongshuProUserInfo,
  sendXiaohongshuProMessage,
} from './xiaohongshu-message';
import { getXiaoHongShuActivityListInfo } from '@/media-platform/xiaohongshu/xiaohongshu-activity';
import { getXiaohongshuCollection } from '@/media-platform/xiaohongshu/xiaohongshu-collection';
import { getXiaohongshuGroup } from '@/media-platform/xiaohongshu/xiaohongshu-group';
import {
  getXiaoHongShuGoodsList,
  getXiaoHongShuShopPrivilege,
  getXiaoHongShuZhiBoPlanList,
} from '@/media-platform/xiaohongshu/xiaohongshu-shop';
export const Xiaohongshu = {
  publishVideo: xiaohongshuPublishVideo,
  publishDynamic: xiaohongshuPublishDynamic,
  publishArticle: xiaohongshuPublishDynamic,
  generateArticleImages: generateXiaohongshuArticleImages,
  generateSingleImage: generateXiaohongshuSingleImage,
  getArticleTemplateList: getXiaohongshuArticleTemplateList,
  getXiaohongshuUserInfo,
  getXiaohongshuLiveDataOverview,
  getXiaohongshuFriendList,
  getXiaohongshuLocationList,
  getXiaohongshuMediaStatus,
  getXiaohongshuTopicList,
  getXiaohongshuContentList,
  getXiaohongshuDataOverviewNewList,
  getXiaohongshuDataOverviewSingleList,
  getXiaohongshuPersonalInfo,
  getXiaohongshuContentListView,
  getXiaohongshuAnalyzeContentListView,
  getXiaohongshuComment,
  getXiaoHongShuCommentContent,
  getXiaoHongShuCommentByContent,
  addXiaohongshuComment,
  delXiaohongshuComment,
  digXiaohongshuComment,
  deleteXiaohongshuContent,
  getXiaoHongShuUserCanPubInfo,
  getXiaoHongShuActivityListInfo,
  getXiaohongshuCollection,
  getXiaohongshuGroup,
  getXiaoHongShuShopPrivilege,
  getXiaoHongShuZhiBoPlanList,
  getXiaoHongShuGoodsList,
  Pro: {
    getXiaohongshuProUserInfo,
    sendXiaohongshuProMessage,
    getXiaoHongShuProMessageConversationList,
    getXiaoHongShuProMessageListByConversation,
    getXiaohongshuProMessage,
  },
};

export type { XiaohongshuVideoTaskInput } from './xiaohongshu-video.service';
export type {
  XiaohongshuArticleImageGenerateOutput,
  XiaohongshuArticleImageGenerateInput,
  XiaohongshuSingleImageGenerateOutput,
  XiaohongshuSingleImageGenerateInput,
  XiaohongshuArticleImageModel,
  XiaohongshuArticleTemplate,
  XiaohongshuArticleTemplateColor,
  XiaohongshuArticleTemplateListItem,
  XiaohongshuArticleTemplateListOutput,
  XiaohongshuDynamicTaskInput,
  XiaohongshuLongTextArticleContent,
} from './xiaohongshu-article';

export type {
  XiaohongshuUserInfoResultOutput,
  XiaohongshuLiveDataOverviewResultOutput,
  XiaohongshuFriendListResultOutput,
  XiaohongshuLocationListResultOutput,
  XiaohongshuTopicListResultOutput,
  XiaohongshuMediaStatusResultOutput,
  XiaohongshuContentListOutput,
  XiaohongshuDataOverviewNewListOutput,
  XiaohongshuDataOverviewSingleListOutput,
  XiaohongshuPersonalInfoOutput,
} from './xiaohongshu-common';

export type { XiaohongshuFriendInfo } from './xiaohongshu-friend.service';
export type { XiaohongshuLocationInfo } from './xiaohongshu-location.service';
export type { XiaohongshuTopicInfo } from './xiaohongshu-topic.service';
export type { XiaohongshuMediaContent } from './xiaohongshu-content-list.service';
export type {
  XiaohongshuDataOverviewNewItem,
  XiaohongshuSingleDataOverview,
} from './xiaohongshu-data-overview.service';
