import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { Guid, GetTimeStamp, isJson } from '../../utils';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 视频号作品数据
 * @param cookie
 * @param finderUsername 用户信息返回的finderUsername
 * @param uin 用户信息返回的uin
 * @param currentPage 页码
 * @param pageSize 每页数量
 * @param type 11:视频 10:图文,不传为默认全部
 * @param proxyAgent
 */
export const getContentListAsync = async (
  cookie: string,
  finderUsername: string,
  uin: number,
  currentPage: number,
  pageSize: number,
  type: number | undefined | null = 11,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<ShipinhaoContentListResponse> => {
  const url: string = 'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/post/post_list';
  const headers = {
    cookie: cookie,
    referer: 'https://channels.weixin.qq.com/platform/post/list',
    Origin: 'https://channels.weixin.qq.com',
    'Content-Type': 'application/json',
    'X-WECHAT-UIN': uin,
    'finger-print-device-id': Guid.NewGuid().replaceAll('-', ''),
  };

  const postData = {
    currentPage: currentPage,
    pageSize: pageSize,
    timestamp: GetTimeStamp(13),
    _log_finder_uin: '',
    _log_finder_id: finderUsername,
    rawKeyBuff: null,
    pluginSessionId: null,
    scene: 7,
    reqScene: 7,
  };
  if (type) {
    postData['userpageType'] = type;
  }

  const result = await $http.post<never, AxiosResponse<ShipinhaoContentListResponse>>(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

export interface ShipinhaoMediaContent {
  /**
   * 作品id
   */
  objectId: string;
  /**
   * 发布时间
   */
  createTime: number;
  /**
   * 推荐数
   */
  likeCount: number;
  /**
   * 评论数
   */
  commentCount: number;
  /**
   * 播放量
   */
  readCount: number;
  /**
   * 分享数
   */
  forwardCount: number;
  /**
   * 喜欢数
   */
  favCount: number;
  commentClose: number;
  /**
   * 可见类型
   */
  visibleType: number;
  /**
   * 状态
   */
  status: number;
  desc: {
    /**
     * 作品描述
     */
    description: string;
    mediaType: number;
    media: Array<{
      /**
       * 视频地址
       */
      url: string;

      /**
       * 封面
       */
      coverUrl: string;

      /**
       * 封面2
       */
      fullCoverUrl: string;

      /**
       * 图文封面地址
       */
      thumbUrl: string;

      fullThumbUrl:string;
    }>;
    finderNewlifeDesc: {
      richTextTitle: string;
    };
  };
  objectType: number;
  flag: number;
  objectNonce: string;
  permissionFlag: number;
  canSetOriginalsoundTitle: boolean;
  fullPlayRate: number;
  avgPlayTimeSec: number;
  disableInfo: {
    isDisabled: boolean;
  };
  /**
   * 视频处理进度,1:转码中 2:转码完成定时发布,5:转码失败
   */
  handleStatus?: number;
  showOriginal: boolean;
  exportId: string;
  ringsetCount: number;
  snscoverCount: number;
  statusrefCount: number;
  forwardAggregationCount: number;
  originalInfo: {
    auditOriginalFlag: number;
    isDeclared: number;
    isOriginalUpgrad: number;
  };
  /**
   * 关注数
   */
  followCount: number;
  fastFlipRate: number;
}

export interface ShipinhaoContentListResponse {
  errCode: number;
  errMsg: string;
  data?: {
    /**
     * 作品列表
     */
    list: Array<ShipinhaoMediaContent>;
    /**
     * 作品总数
     */
    totalCount: number;
  };
}

/**
 * 视频号单篇列表
 * @param cookie
 * @param finderUsername 用户信息返回的finderUsername
 * @param uin 用户信息返回的uin
 * @param startTime 开始日期 时间戳
 * @param endTime 结束日期 时间戳
 * @param currentPage 页码
 * @param pageSize 每页数量
 * @param type
 * @param proxyAggent
 */
export const getShipinhaoSingleContentListAsync = async (
  cookie: string,
  finderUsername: string,
  uin: number,
  startTime: number,
  endTime: number,
  currentPage: number,
  pageSize: number,
  type: 'video' | 'dynamic' = 'video',
  proxyAggent?: object,
): Promise<ShipinhaoSingleContentListResponse> => {
  const url: string = 'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/statistic/post_list';

  const headers = {
    cookie: cookie,
    referer: 'https://channels.weixin.qq.com/platform/statistic/post',
    Origin: 'https://channels.weixin.qq.com',
    'Content-Type': 'application/json',
    'X-WECHAT-UIN': uin,
    'finger-print-device-id': Guid.NewGuid().replaceAll('-', ''),
  };

  const postData = {
    currentPage: currentPage,
    pageSize: pageSize,
    timestamp: GetTimeStamp(13),
    sort: 0,
    order: 0,
    startTime: startTime,
    endTime: endTime,
    _log_finder_uin: '',
    _log_finder_id: finderUsername,
    rawKeyBuff: null,
    pluginSessionId: null,
    scene: 7,
    reqScene: 7,
  };
  if (type === 'dynamic') {
    postData['baseReq'] = { busiType: 1 };
  }

  const result = await $http.post<never, AxiosResponse<ShipinhaoSingleContentListResponse>>(url, postData, {
    headers: headers,
    httpsAgent: proxyAggent,
    httpAgent: proxyAggent,
  });

  return result.data;
};

/**
 * 获取视频号作品列表
 * @param cookie
 * @param finderUsername 用户信息返回的finderUsername
 * @param uin 用户信息返回的uin
 * @param currentPage 页码
 * @param pageSize 每页数量
 * @param type video:视频 dynamic:图文
 * @param proxyAgent
 */
export const getShipinhaoPostListAsync = async (
  cookie: string,
  finderUsername: string,
  uin: number,
  currentPage: number,
  pageSize: number,
  type: 'video' | 'dynamic' = 'video',
  proxyAgent?: object,
): Promise<ShipinhaoContentListResponse> => {
  const url: string = 'https://channels.weixin.qq.com/micro/content/cgi-bin/mmfinderassistant-bin/post/post_list';
  const headers = {
    cookie: cookie,
    referer:
      type === 'video'
        ? 'https://channels.weixin.qq.com/micro/content/post/list'
        : 'https://channels.weixin.qq.com/micro/content/post/finderNewLifePostList',
    Origin: 'https://channels.weixin.qq.com',
    'Content-Type': 'application/json',
    'X-WECHAT-UIN': uin,
    'finger-print-device-id': Guid.NewGuid().replaceAll('-', ''),
  };

  const postData = {
    pageSize: pageSize,
    currentPage: currentPage,
    userpageType: type === 'video' ? 11 : 10,
    stickyOrder: true,
    timestamp: GetTimeStamp(13),
    _log_finder_uin: '',
    _log_finder_id: finderUsername,
    rawKeyBuff: '',
    pluginSessionId: null,
    scene: 7,
    reqScene: 7,
  };

  const result = await $http.post<never, AxiosResponse<ShipinhaoContentListResponse>>(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

export interface ShipinhaoSingleMediaContent {
  /**
   * 单篇数据详情id
   */
  objectId: string;

  /**
   * 发布时间
   */
  createTime: number;
  /**
   * 推荐数
   */
  likeCount: number;
  /**
   * 评论数
   */
  commentCount: number;
  /**
   * 播放量
   */
  readCount: number;
  /**
   * 分享数
   */
  forwardCount: number;
  /**
   * 喜欢数
   */
  favCount: number;
  commentClose: number;
  visibleType: number;
  status: number;
  desc: {
    /**
     * 作品描述
     */
    description: string;
    mediaType: number;
    media: Array<{
      /**
       * 视频地址
       */
      url: string;

      /**
       * 封面
       */
      coverUrl: string;

      /**
       * 封面2
       */
      fullCoverUrl: string;
      fullThumbUrl: string;

      /**
       * 图文封面地址
       */
      thumbUrl: string;
    }>;
    finderNewlifeDesc: {
      richTextTitle: string;
    };
  };
  flag: number;
  objectNonce: string;
  permissionFlag: number;
  canSetOriginalsoundTitle: true;
  fullPlayRate: number;
  avgPlayTimeSec: number;
  showOriginal: false;
  exportId: string;

  /**
   * 转发数
   */
  forwardAggregationCount: number;

  /**
   * 关注数
   */
  followCount: number;
  fastFlipRate: number;
  snscoverCount:number;
  ringsetCount:number;
  forwardSnsCount:number;
  forwardAllChatCount:number;
  statusrefCount:number;
}

export interface ShipinhaoSingleContentListResponse {
  errCode: number;
  errMsg: string;
  data: {
    list: Array<ShipinhaoSingleMediaContent>;
    totalCount: 1;
  };
}
