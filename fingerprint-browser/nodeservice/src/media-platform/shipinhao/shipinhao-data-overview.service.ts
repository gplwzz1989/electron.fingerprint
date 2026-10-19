import { $http } from '../../http';
import { GetTimeStamp, Guid, isJson } from '../../utils';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 视频号数据中心视频数据
 * @param cookie
 * @param startTs 开始时间（时间戳）
 * @param endTs 结束时间（时间戳）
 * @param finderUsername 用户信息返回的finderUsername
 * @param uin 用户信息返回的uin
 * @param type video:视频 ，dynamic:图文
 * @param proxyAgent
 */
export const getDataOverviewListAsync = async (
  cookie: string,
  startTs: string,
  endTs: string,
  finderUsername: string,
  uin: number,
  type: 'video' | 'dynamic' = 'video',
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<ShipinhaoDataOverviewResponse> => {
  const url: string = 'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/statistic/new_post_total_data';

  const headers = {
    cookie: cookie,
    referer: 'https://channels.weixin.qq.com/platform/statistic/post',
    Origin: 'https://channels.weixin.qq.com',
    'Content-Type': 'application/json',
    'X-WECHAT-UIN': uin,
    'finger-print-device-id': Guid.NewGuid().replaceAll('-', ''),
  };

  const postData = {
    startTs: startTs,
    endTs: endTs,
    interval: 3,
    timestamp: GetTimeStamp(13),
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
  const result = await $http.post<never, AxiosResponse<ShipinhaoDataOverviewResponse>>(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

export interface ShipinhaoDataOverviewResponse {
  errCode: number;
  errMsg: string;
  data: {
    totalData?: ShipinhaoTotalData;
    notExistFansData?: boolean;
  };
}

export interface ShipinhaoTotalData {
  /**
   * 播放
   */
  browse: Array<string>;
  /**
   * 评论
   */
  comment: Array<string>;
  /**
   * 喜欢数
   */
  fav: Array<string>;
  /**
   * 关注
   */
  follow: Array<string>;
  /**
   * 分享
   */
  forward: Array<string>;
  forwardAggregation: Array<string>;
  /**
   * 推荐
   */
  like: Array<string>;
  ringset: Array<string>;
  snscover: Array<string>;
  statusref: Array<string>;
}

/**
 * 视频号数据中心单篇数据
 * @param cookie
 * @param feedId 作品id
 * @param startTs 开始时间（时间戳）
 * @param endTs 结束时间（时间戳）
 * @param finderUsername 用户信息返回的finderUsername
 * @param uin 用户信息返回的uin
 */
export const getSingleDataOverviewAsync = async (
  cookie: string,
  feedId: string,
  startTs: string,
  endTs: string,
  finderUsername: string,
  uin: number,
): Promise<ShipinhaoSingleDataOverviewResponse> => {
  const url: string =
    'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/statistic/feed_aggreagate_data_by_tab_type';

  const headers = {
    cookie: cookie,
    referer: 'https://channels.weixin.qq.com/platform/statistic/postDetail',
    Origin: 'https://channels.weixin.qq.com',
    'Content-Type': 'application/json',
    'X-WECHAT-UIN': uin,
    'finger-print-device-id': Guid.NewGuid().replaceAll('-', ''),
  };

  const postData = {
    startTs: startTs,
    endTs: endTs,
    interval: 3,
    feedId: feedId,
    timestamp: GetTimeStamp(13),
    _log_finder_uin: '',
    _log_finder_id: finderUsername,
    rawKeyBuff: null,
    pluginSessionId: null,
    scene: 7,
    reqScene: 7,
  };

  const result = await $http.post<never, AxiosResponse<ShipinhaoSingleDataOverviewResponse>>(url, postData, {
    headers: headers,
  });

  if (result.data.errCode !== 0) {
    throw new BadRequestException(result.data?.errMsg, result.data?.errCode, result.data);
  }

  return result.data;
};

export interface ShipinhaoSingleDataOverviewResponse {
  errCode: number;
  errMsg: string;
  data: {
    feedData: Array<{
      totalData: {
        /**
         * 播放
         */
        browse: Array<string>;
        /**
         * 评论
         */
        comment: Array<string>;
        /**
         * 喜欢数
         */
        fav: Array<string>;
        /**
         * 关注
         */
        follow: Array<string>;
        /**
         * 分享
         */
        forward: Array<string>;
        forwardAggregation: Array<string>;
        /**
         * 推荐
         */
        like: Array<string>;
        ringset: Array<string>;
        snscover: Array<string>;
        statusref: Array<string>;
      };
    }>;
  };
}

/**
 * 粉丝日常数据
 * @param cookie
 * @param startTs
 * @param endTs
 * @param finderUsername
 * @param uin
 */
export const getFansDailyResponseAsync = async (
  cookie: string,
  startTs: string,
  endTs: string,
  finderUsername: string,
  uin: number,
): Promise<FansDataResponse> => {
  const url: string =
    'https://channels.weixin.qq.com/micro/statistic/cgi-bin/mmfinderassistant-bin/statistic/fans_trend';

  const headers = {
    cookie: cookie,
    referer: 'https://channels.weixin.qq.com/platform/statistic/postDetail',
    Origin: 'https://channels.weixin.qq.com',
    'Content-Type': 'application/json',
    'X-WECHAT-UIN': uin,
    'finger-print-device-id': Guid.NewGuid().replaceAll('-', ''),
  };

  const params = {
    _rid: '',
    _aid: '',
    _pageUrl: 'https://channels.weixin.qq.com/micro/statistic/follower',
  };

  const postData = {
    startTs: startTs,
    endTs: endTs,
    interval: 3,
    timestamp: Date.now().toString(),
    _log_finder_uin: null,
    _log_finder_id: finderUsername,
    rawKeyBuff: null,
    pluginSessionId: null,
    scene: 7,
    reqScene: 7,
  };

  const result = await $http.post(url, postData, {
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface FansDataResponse {
  errCode: number;
  errMsg: string;
  data: {
    add: number[];
    reduce: number[];
    netAdd: number[];
    total: number[];
    fansDataByTabtype: Array<{
      add: number[];
      reduce: number[];
      netAdd: number[];
      total: number[];
      tabType: number;
      tabTypeName: string;
    }>;
  };
}
