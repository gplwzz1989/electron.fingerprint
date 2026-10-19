import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 爱奇艺作品管理
 * @param cookie
 * @param pageNo 页码
 * @param pageSize 每页数量
 * @param publishStatus 不传为全部，1为已发布，9为草稿
 * @param publishSituation 可不传 0为发布中，1为发布失败
 */

/**
 * 爱奇艺作品管理
 * @param cookie
 * @param aiqiyiContentListInput
 * @param proxyAgent
 */
export const getVideoContentListAsync = async (
  cookie: string,
  aiqiyiContentListInput: AiqiyiContentListInput,
  proxyAgent?: HttpsProxyAgent<string>|object|undefined,
): Promise<AiqiyiContentListResponse> => {
  const result = await $http.get<unknown, AxiosResponse<AiqiyiContentListResponse>>(
    'https://mp-api.iqiyi.com/video/api/1.0/upgc/mp/selfmedia/videos',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.iqiyi.com/',
        host: 'mp-api.iqiyi.com',
        origin: 'https://mp.iqiyi.com',
      },
      params: aiqiyiContentListInput,
      httpAgent: proxyAgent,
      httpsAgent: proxyAgent,
    },
  );

  return result.data;
};

export interface AiqiyiContentListInput {
  /**
   * 页码
   */
  pageNo: number;

  /**
   * 每页数量
   */
  pageSize: number;

  /**
   * 排序
   */
  order: string;

  /**
   * 排序字段
   */
  orderBy: string;

  /**
   * 不传为全部，1为已发布，9为草稿
   */
  publishStatus?: number;

  /**
   * 可不传 0为发布中，1为发布失败
   */
  publishSituation?: number;
}

export interface AiqiyiMediaContent {
  /**
   * 分类id
   */
  channelId: number;

  /**
   * 分类名称
   */
  channelName: string;

  /**
   * 作品封面
   */
  coverImage: string;

  /**
   * 发布时间
   */
  createTime: string;

  /**
   * 作品标题
   */
  displayName: string;

  /**
   * 作品时长
   */
  duration: number;

  /**
   * 作品链接
   */
  pageUrl: string;

  /**
   * 作品id
   */
  qipuId: number;

  /**
   * 播放量
   */
  vvNum: number;

  /**
   * 点赞数
   */
  upCount: number;

  /**
   * 评论数
   */
  commentCount: number;

  /**
   * 发布状态
   */
  publishStatus: number;

  /**
   * 发布状态code
   */
  videoStatusCode: string;

  /**
   * 发布状态
   */
  videoStatus: string;
}

export interface AiqiyiContentListResponse {
  code: number;
  msg: string;
  data: {
    order: string;
    orderBy: string;
    pageNo: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    result: Array<AiqiyiMediaContent>;
  };
}

export const getArticleContentListAsync = async (
  cookie: string,
  page: number,
  size: number,
  status: 'NORMAL' | 'DELETE',
): Promise<AiyiqiArticleContentListResponse> => {
  const result = await $http.get<unknown, AxiosResponse<AiyiqiArticleContentListResponse>>(
    'https://mp-api.iqiyi.com/kol/api/1.0/editor/pgc/published',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.iqiyi.com/',
        host: 'mp-api.iqiyi.com',
        origin: 'https://mp.iqiyi.com',
      },
      params: {
        page: page,
        size: size,
        status: status,
      },
    },
  );

  return result.data;
};

export interface AiqiyiArticleMediaContent {
  fid: string;
  exposureCount: number;
  welFareHotNum: number;
  counts: number;
  score: number;
  welFareDelete: boolean;
  isAppAgentFilter: boolean;
  recom: number;
  isStarCom: number;
  wallId: number;
  welFareId: number;
  userShutUp: boolean;
  welFareEndTime: number;
  wallIcon: string;
  agree: number;
  topStartTime: number;
  eventType: number;
  welFareValid: boolean;
  wallBussinessType: number;
  commentCount: number;
  isHide: number;
  isAnonymous: boolean;
  size: string;
  hasMorePlaylist: boolean;
  sourceType: number;
  commentId: number;
  topSetTime: number;
  feedTitle: string;
  extendType: number;
  wallDesc: string;
  isStarRep: number;
  status: number;
  wallName: string;
  eventCreator: number;
  flag: number;
  agentType: number;
  videoFeedInIdolTrainee2: number;
  wallFansName: string;
  icon: string;
  mid: number;
  recommend: number;
  isPrivate: number;
  recomLevel: number;
  pictures: [
    {
      shape: number;
      size: string;
      clipArea: string;
      detailPage: string;
      smallPage: string;
      type: number;
      url: string;
      listPage: string;
    },
  ];
  cometType: number;
  uidConcern: boolean;
  eventTodayHot: boolean;
  uid: number;
  recomEvent: number;
  top: number;
  welFareAwardNum: number;
  isStarLiked: number;
  cloudControl: {
    isDisplayLike: boolean;
    isDisplayComment: boolean;
    userCheckIcon: number;
  };
  userConfessionIndex: number;
  eventHotNum: number;
  starActivityDataType: number;
  snsAble: number;
  wallType: number;
  blockStatus: number;
  isAuthorCommented: number;
  starInterview: number;
  noticeType: number;
  recomCardFeed: number;
  isVip: number;
  officialTopEndTime: number;
  isFan: boolean;
  agreeCount: number;
  extendSourceType: number;
  nowUserLevel: number;
  hasMoreRelatedVideo: boolean;
  imageText: {
    hasVideo: boolean;
    videoCount: number;
    contents: [
      {
        image: string;
        text: string;
        size: string;
        row: boolean;
        type: number;
        order: number;
      },
    ];
    source: string;
    title: string;
    url: string;
  };
  bestSelected: boolean;
  isRejectRec: boolean;
  baseAlbumId: number;
  cometId: number;
  userJoin: boolean;
  isInStarActivity: boolean;
  sharedCount: number;
  ipId: number;
  feedId: number;
  isMaster: number;
  uvCount: number;
  txtOnly: number;
  pgcUid: number;
  isAdministrator: number;
  eventId: number;
  officialTop: boolean;
  modifyDate: number;
  level: number;
  isStarLikedCom: number;
  eventValid: boolean;
  dataType: number;
  eventForm: number;
  deleteType: number;
  recTag: number;
  fansAddCount: number;
  welFareBeginTime: number;
  crawlSourceIsStar: boolean;
  recommendCount: number;
  name: string;
  playlistType: number;
  shutUpTime: number;
  shareUrl: string;
  userType: number;
  hittingReason: number;
  circleQipuId: number;
  vPayOnDemand: boolean;
  itemType: number;
  isGif: number;
  description: string;
  albumId: number;
  topEndTime: number;
  isAuthorCreated: number;
  showMaster: boolean;
  collectionId: number;
  notice: number;
  releaseDate: number;
  starComingActivity: number;
  welFareAddTime: number;
  isTopLegoAutoFeed: boolean;
  master: number;
  wallAnonymous: boolean;
  crawlSource: number;
  snsTime: number;
  businessType: number;
}

export interface AiyiqiArticleContentListResponse {
  code: string;
  msg: string;
  data: {
    total: number;
    num: number;
    list: Array<AiqiyiArticleMediaContent>;
  };
}

export const getAiqiyiArticleDraftListResponse = async (
  cookie: string,
  page: number = 1,
  size: number = 20,
): Promise<AiqiyiArticleMediaDraftResponse> => {
  const url = `https://mp-api.iqiyi.com/kol/api/1.0/editor/draft?page=${page}&size=${size}`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.iqiyi.com/',
    host: 'mp-api.iqiyi.com',
    origin: 'https://mp.iqiyi.com',
  };

  const result = await $http.get(url, { headers: headers });

  return result.data;
};

export interface AiqiyiArticleMediaDraftResponse {
  code: string;
  msg: string;
  data: {
    pages: number;
    total: number;
    drafts: Array<{
      draftId: number;
      title: string;
      summary: string;
      lastEditTime: number;
      feedType: string;
      type: string;
    }>;
  };
}

/**
 * 爱奇艺作品管理
 * @param cookie
 * @param startDate
 * @param endDate
 * @param pageNum
 * @param pageSize
 * @param proxyAgent
 */
export const getVideoSingleContentListAsync = async (
  cookie: string,
  startDate: string,
  endDate: string,
  pageNum: number = 1,
  pageSize: number = 10,
  proxyAgent?: HttpsProxyAgent<string>,
): Promise<AiqiyiSingleContentListResponse> => {
  //https://mp-api.iqiyi.com/stat/api/1.0/video/data/list?pgcType=wemedia_v2&startDate=2025-05-07&endDate=2025-05-20&dateType=3&needCoverImage=true&page=1&size=10
  const url = `https://mp-api.iqiyi.com/stat/api/1.0/video/data/list?pgcType=wemedia_v2&startDate=${encodeURIComponent(
    startDate,
  )}&endDate=${encodeURIComponent(endDate)}&dateType=3&needCoverImage=true&page=${pageNum}&size=${pageSize}`;
  const result = await $http.get(url, {
    headers: {
      cookie: cookie,
      referer: 'https://mp.iqiyi.com/',
      origin: 'https://mp.iqiyi.com',
    },
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface AiqiyiSingleContentListResponse {
  httpStatus: number;
  code: number;
  msg: string;
  data: {
    resultSize: number;
    status: string;
    videoDetailData: Array<{
      qipuId: number;
      displayName: string;
      availableStatus: true;
      /**
       * 评论
       */
      commentNum: number;
      /**
       * 展现
       */
      pv: number;
      /**
       * 播放
       */
      vv: number;
      /**
       *
       */
      fansIncrNum: 0;
      /**
       * 播放时长，毫秒
       */
      playtime: number;
      /**
       * 玩爆破率
       */
      completionDegree: number;
      /**
       * 封面
       */
      coverImage: string;
      createTime: string;
      /**
       * 点赞
       */
      likeNum: number;
      /**
       * 分享
       */
      shareNum: number;
      /**
       * 弹幕
       */
      barrageNum: 0;
      vvXDuration: 3450;
      fansVv: 0;
      fansPlaytimeAvg: 0.0;
      fansCompletionDegree: 0.0;
      fansPlaytime: 0.0;
      fansCommentNum: 0;
      fansLikeNum: 0;
      fansBarrageNum: 0;
    }>;
  };
}
