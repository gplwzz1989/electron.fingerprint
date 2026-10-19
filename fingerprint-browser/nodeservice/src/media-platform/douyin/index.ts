export { Douyin } from './douyin';
export { parseDouyinPublicAuthorSearchHtml, searchDouyinPublicAuthorList } from './douyin-common';
export { parseDouyinPublicWorkSearchHtml, searchDouyinPublicWorkList } from './douyin-public-work-search.service';
export { sendDouyinAssistSmsCode, verifyDouyinAssistSmsCode } from './douyin-assist-sms.service';

export { HttpConfig } from '../../http';
//region 接口函数出入类型
export type {
  DouyinTopicResultOutput,
  DouyinVideoStatusResultOutput,
  DouyinGoodsInfo,
  DouyinVideoTaskInput,
  DouyinPublishResult,
  DouyinUserInfoOutput,
  DouyinUserMiniAppEnableOutput,
  DouyinUserLocationTypeOutput,
  DouyinSdkTokenOutput,
  DouyinUserShopEnableOutput,
  DouyinUserStatusOutput,
  DouyinGoodsResultOutput,
  DouyinMiniAppResultOutput,
  DouyinLocationResultOutput,
  DouyinHotEventsResultOutput,
  DouyinFriendResultOutput,
  DouyinDeleteContentResultOutput,
  DouyinCollectionResultOutput,
  DouyinCategoryResultOutput,
} from './douyin';
export type {
  PlatformPublicAuthorInfo,
  PlatformPublicAuthorListOutput,
  PlatformPublicWorkInfo,
  PlatformPublicWorkListOutput,
} from '../baseModel';
export type { DouyinPublicWorkSearchContentType } from './douyin-public-work-search.service';
//endregion

//region 二级类型
export type { DouyinTopicInfo } from '../douyin/douyin-topic.service';
export type { DouyinMiniAppInfo } from '../douyin/douyin-miniapp.service';
export type { douyinVideoInfo, douyinVideoListInfo } from '../douyin/douyin-mediastatus.service';
export type { DouyinLocationInfo } from '../douyin/douyin-location.service';
export type { DouyinHotEventInfo } from '../douyin/douyin-hotevents.service';
export type { DouyinCollectionInfo } from '../douyin/douyin-collection.service';
export type { DouyinCategoryInfo } from '../douyin/douyin-category.service';
//endregion
