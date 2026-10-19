import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { GetTimeStamp } from '../../utils';
import { HttpsProxyAgent } from 'https-proxy-agent';
import crypto from 'crypto';

const WANGYI_SIGN_KEY = Buffer.from('neteasenewsboard', 'utf8');

export const wangyiSign = (input: unknown): string => {
  const text = Date.now().toString();
  const cipher = crypto.createCipheriv('aes-128-ecb', WANGYI_SIGN_KEY, null);

  cipher.setAutoPadding(true);

  return cipher.update(text, 'utf8', 'base64') + cipher.final('base64');
};

/**
 * 网易号首页数据
 * @param cookie
 * @param realUserId 用户信息realUserId
 * @param wemediaId 用户信息wemediaId
 * @param proxyAgent
 */
export const getUserHomeDataAsync = async (
  cookie: string,
  realUserId: string,
  wemediaId: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<WangyihaoUserHomeDataResponse> => {
  const result = await $http.get<unknown, AxiosResponse<WangyihaoUserHomeDataResponse>>(
    'https://mp.163.com/wemedia/index/count.do',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.163.com/subscribe_v3/index.html',
        Origin: 'https://mp.163.com',
        Host: 'mp.163.com',
      },
      params: {
        _: GetTimeStamp(13),
        realUserId: realUserId,
        wemediaId: wemediaId,
      },
      httpsAgent: proxyAgent,
      httpAgent: proxyAgent,
    },
  );

  return result.data;
};

/**
 * 网易号用户信息
 * @param cookie
 * @param proxyAgent
 */
export const getUserInfoAsync = async (
  cookie: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<WangyihaoUserInfoResponse> => {
  const result = await $http.get('https://mp.163.com/wemedia/navinfo.do', {
    headers: {
      cookie: cookie,
      referer: 'https://mp.163.com/subscribe_v3/index.html',
      Origin: 'https://mp.163.com',
      Host: 'mp.163.com',
    },
    params: {
      _: GetTimeStamp(13),
    },
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

export interface WangyihaoUserHomeDataResponse {
  code: number;
  msg: string;
  data: {
    wemediaId: string;
    totalReadCount: number;
    yesterdayReadCount: number;
    totalSubscribeCount: number;
    yesterdaySubscribeCount: number;
    totalIndex: number;
    totalRecommendCount: number;
    yesterdayRecommendCount: number;
    sumProfit: number;
    profit: number;
    totalInteract: number;
    yesterdayInteract: number;
  };
}

export interface WangyihaoUserInfoResponse {
  code: number;
  msg: string;
  data: WangYiHaoUserInfoResponseData;
}

export interface WangYiHaoUserInfoResponseData {
  aiOnline: boolean;
  aiImgOnline: boolean;
  unreadCnt: number;
  auditState: number;
  accountType: number;
  onlineState: number;
  /**
   * 用户id
   */
  wemediaId: string;
  ename: string;
  tname: string;
  cname: string;
  icon: string;
  tdesc: string;
  nftIcon: string;
  loginUser: string;
  userId: string;
  realUserId: string;
  local: number;
  thresh: number;
  articleCount: number;
  fetchFlag: boolean;
  liveRoomFlag: boolean;
  pushFlag: boolean;
  repostFlag: boolean;
  original: number;
  originalVideo: number;
  applyOriginalFlag: number;
  applyOriginalVideoFlag: number;
  refuseOriginalReason: string;
  refuseOriginalVideoReason: string;
  star: number;
  authorityFlag: boolean;
  newProminent: number;
  transFlag: number;
  tid: string;
  ownerType: number;
  accountQuality: number;
  videoQuality: number;
  shortInfoFlag: boolean;
  essayActivityFlag: boolean;
  verifyState: number;
  paidContentType: number;
  paidContentAuth: string;
  paidContentSign: boolean;
  paidVideoType: number;
  paidCopyrightFlag: number;
  paidShortPlayType: number;
  canApplyIdentity: boolean;
  creditLevel: number;
  videoSync: number;
  hotEventFlag: boolean;
  poiFlag: boolean;
  piyaoFlag: boolean;
  customizeTabFlag: boolean;
  mcnUnreadCnt: number;
  videoContract: number;
  todayPubCount: number;
  maxDailyPublishCount: number;
  videoTodayPubCount: number;
  videoMaxDailyPublishCount: number;
  keepSilent: boolean;
  silentTTL: number;
  playListAuthorityFlag: boolean;
  openCourseOffLine: number;
  certificationFlag: boolean;
  idcardFlag: boolean;
  faceDetectFlag: boolean;
  availableFaceDetectCount: number;
  achieveRewardFlag: boolean;
  receivedAchieveIntegral: number;
  unReceivedAchieveIntegral: number;
  middleQualityType: number;
  publishReaderFlag: boolean;
  remake: number;
  publishInspireFlag: boolean;
  schoolInspireFlag: boolean;
  videoAccountClassify: number;
  dynamicUmcnMainFlag: boolean;
  activityBillFlag: boolean;
  incomeCategoryFlag: boolean;
  selfRecommendFlag: boolean;
  userInviteRegisterVideo: boolean;
  selfRecommendCount: number;
  videoTag: number;
  pkVoteFlag: boolean;
  videoVoteFlag: boolean;
  articleAssistantFlag: boolean;
  videoBackendFlag: boolean;
  xianzhiFlag: boolean;
  eleContractFlag: boolean;
  newDailyTaskStartTime: string;
  indexLastStateDate: string;
  newsLicenseExpireDate: string;
  verifyFlag: boolean;
  quickDynamicFlag: boolean;
  ts: number;
  shareIncome: boolean;
  admin: boolean;
  shareIncomeOpen: boolean;
  comment: boolean;
}
