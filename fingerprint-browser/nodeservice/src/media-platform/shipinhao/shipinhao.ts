import { shipinhaoPublishVideo } from './shipinhao-video';
import {
  getShipinhaoMediaStatus,
  getShipinhaoActivity,
  getShipinhaoCollection,
  getShipinhaoDrama,
  getShipinhaoFriend,
  getShipinhaoGoods,
  getShipinhaoLocation,
  getShipinhaoUserInfo,
  getShipinhaoMessageInitInfo,
  getShipinhaoPrivilege,
  getShipinhaoUserStatus,
  getShipinhaoContentList,
  getShipinhaoDataOverview,
  getShipinhaoSingleDataOverview,
  getShipinhaoSingleContent,
  getShipinhaoTopicList,
  getShipinhaoContentListView,
  getShipinhaoMusicList,
  deleteShipinhaoContent,
} from './shipinhao-common';
import { shipinhaoPublishDynamic } from './shipinhao-article';
import {
  addShipinhaoComment,
  delShipinhaoComment,
  digShipinhaoComment,
  getShipinhaoComment,
  getShiPinHaoCommentByContent,
  getShiPinHaoCommentContent,
  setTopShipinhaoCommentTop,
} from '@/media-platform/shipinhao/shipinhao-comment';
import {
  getShipinhaoMessage,
  getShiPinHaoMessageConversationInfo,
  getShiPinHaoMessageConversationList,
  getShiPinHaoNewMessageList,
  getShiPinHaoNewMsg,
  parseShipinhaoMessageImageResponse,
  parseShipinhaoMessageMediaResponse,
  sendShipinhaoMessage,
} from '@/media-platform/shipinhao/shipinhao-message';
import {
  createXiaodianLoginQrCode,
  getChannelsAuthorInfo,
  getChannelsSessionByXiaodianCredential,
  keepaliveXiaodianCredential,
  refreshShipinhaoByXiaodianCookie,
  startXiaodianLoginPolling,
  browserCookieJsonToCookieHeader,
  CHANNELS_COOKIE_DOMAIN,
  cookieHeaderToBrowserCookieJson,
  filterBrowserCookieJsonByDomain,
  isXiaodianCredentialCookie,
  mergeBrowserCookieJson,
  mergeCookieHeaderIntoBrowserCookieJson,
  normalizeBrowserCookieJson,
  parseBrowserCookieJson,
  setCookieHeaderToBrowserCookieJson,
  XIAODIAN_COOKIE_DOMAIN,
} from './xiaodian-login';
export const Shipinhao = {
  publishVideo: shipinhaoPublishVideo,
  publishDynamic: shipinhaoPublishDynamic,
  getShipinhaoActivity,
  getShipinhaoUserInfo,
  getShipinhaoMessageInitInfo,
  getShipinhaoCollection,
  getShipinhaoDrama,
  getShipinhaoFriend,
  getShipinhaoLocation,
  getShipinhaoGoods,
  getShipinhaoMediaStatus,
  getShipinhaoPrivilege,
  getShipinhaoUserStatus,
  getShipinhaoContentList,
  getShipinhaoDataOverview,
  getShipinhaoSingleDataOverview,
  getShipinhaoSingleContent,
  getShipinhaoTopicList,
  getShipinhaoContentListView,
  getShipinhaoMusicList,
  getShiPinHaoCommentContent,
  getShiPinHaoCommentByContent,
  getShipinhaoComment,
  addShipinhaoComment,
  delShipinhaoComment,
  digShipinhaoComment,
  setTopShipinhaoCommentTop,
  getShipinhaoMessage,
  getShiPinHaoMessageConversationList,
  getShiPinHaoMessageConversationInfo,
  getShiPinHaoNewMessageList,
  getShiPinHaoNewMsg,
  parseShipinhaoMessageImageResponse,
  parseShipinhaoMessageMediaResponse,
  sendShipinhaoMessage,
  deleteShipinhaoContent,
  createXiaodianLoginQrCode,
  startXiaodianLoginPolling,
  keepaliveXiaodianCredential,
  getChannelsSessionByXiaodianCredential,
  getChannelsAuthorInfo,
  refreshShipinhaoByXiaodianCookie,
  browserCookieJsonToCookieHeader,
  CHANNELS_COOKIE_DOMAIN,
  cookieHeaderToBrowserCookieJson,
  filterBrowserCookieJsonByDomain,
  isXiaodianCredentialCookie,
  mergeBrowserCookieJson,
  mergeCookieHeaderIntoBrowserCookieJson,
  normalizeBrowserCookieJson,
  parseBrowserCookieJson,
  setCookieHeaderToBrowserCookieJson,
  XIAODIAN_COOKIE_DOMAIN,
};
/**
 * 一级类型
 */
export type {
  ShipinhaoActivityListResultOutput,
  ShipinhaoUserInfoResultOutput,
  ShipinhaoCollectionListResultOutput,
  ShipinhaoDramaListResultOutput,
  ShipinhaoFriendListResultOutput,
  ShipinhaoLocationListResultOutput,
  ShipinhaoGoodsListResultOutput,
  ShipinhaoMediaStatusResultOutput,
  ShipinhaoPrivilegeResultOutput,
  ShipinhaoStatusResultOutput,
  ShipinhaoContentListOutput,
  ShipinhaoDataOverviewOutput,
  ShipinhaoDataOverviewSingleOutput,
  ShipinhaoSingleContentListOutput,
} from './shipinhao-common';

/**
 * 子类型
 */
export type { ShipinhaoActivityInfo } from './shipinhao-activity.service';
export type { MediaType } from './shipinhao-types';
export type { ShipinhaoCollectionInfo } from './shipinhao-collection.service';
export type { ShipinhaoDramaInfo } from './shipinhao-drama.service';
export type { ShipinhaoFriendInfo } from './shipinhao-friend.service';
export type { ShipinhaoLocationInfo } from './shipinhao-location.service';
export type { ShipinhaoGoodsInfo } from './shipinhao-shop.service';
export type { ShipinhaoVideoInfo } from './shipinhao-mediastatus.service';
export type { ShipinhaoMediaContent, ShipinhaoSingleMediaContent } from './shipinhao-content-list.service';
export type { ShipinhaoTotalData } from './shipinhao-data-overview.service';
export type { ShipinhaoDynamicTaskInput } from './shipinhao-article';
export * from './xiaodian-login';
