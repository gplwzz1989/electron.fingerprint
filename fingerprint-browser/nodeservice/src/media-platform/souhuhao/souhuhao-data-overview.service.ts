import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 搜狐号数据分析视频数据
 * @param cookie
 * @param accountId 账号id
 * @param startDate 开始日期（××××-××-××）
 * @param endDate 结束日期（××××-××-××）
 * @param type 数据类型 默认视频 （0：视频，1：图文 2：短内容）
 */
export const getDataOverviewAsync = async (
  cookie: string,
  accountId: number,
  startDate: string,
  endDate: string,
  type: 0 | 1 | 2 = 0,
): Promise<SouhuhaoDataOverviewResponse> => {
  const mpcv = cookie.split('mp-cv=')[1]?.split(';')[0];
  const result = await $http.get<unknown, AxiosResponse<SouhuhaoDataOverviewResponse>>(
    'https://mp.sohu.com/mpbp/bp/news/v4/users/stat/overall',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.sohu.com/mpfe/v4/data/stat/total/video',
        host: 'mp.sohu.com',
        'sp-cm': mpcv,
      },
      params: {
        accountId: accountId,
        type: type,
        startDate: startDate,
        endDate: endDate,
      },
    },
  );

  // 请求失败
  // if (result.data.code !== 2000000) {
  //   throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  // }

  return result.data;
};

export interface SouhuhaoDataOverviewItemResponse {
  /**
   * 日期
   */
  date: string;

  /**
   * 总播放（阅读）
   */
  totalPv: number;
  totalVv: number;

  /**
   * 新增播放（阅读）
   */
  diff: number;
}

export interface SouhuhaoDataOverviewResponse {
  data: {
    result: {
      list: Array<SouhuhaoDataOverviewItemResponse>;
    };
    diff: number;
    history: number;
    status: string;
  };
  code: number;
  msg: string;
  success: boolean;
}

/**
 *
 * @param cookie
 * @param accountId
 * @param type 0:全部 1：文章 2：视频
 * @param timeRange 数据天数
 * @param proxyAgent
 */
export const getDataOverviewDetailAll = async (
  cookie: string,
  accountId: number,
  type: 0 | 1 | 2 = 0,
  timeRange: 7 | 15 | 30 = 30,
  proxyAgent?: HttpsProxyAgent<string>,
): Promise<SouhuhaoDataOverviewDetailAllResponse> => {
  const url = 'https://mp.sohu.com/mpbp/bp/news/v4/users/stat/overall/detail';
  const result = await $http.get(url, {
    headers: {
      cookie: cookie,
      referer: 'https://mp.sohu.com/mpfe/v4/data/stat/total/video',
    },
    params: {
      accountId: accountId,
      type: type,
      timeRange: timeRange,
    },
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

export interface SouhuhaoDataOverviewDetailAllResponse {
  //type pv pvValid interaction
  data: Array<{ type: string; all: number; sub: number; rate: number; increase: boolean }>;
  code: number; // 2000000;
  msg: string;
  success: boolean;
}

/**
 *
 * @param cookie
 * @param accountId
 * @param type 0:全部 1：文章 2：视频
 * @param page
 * @param startDate
 * @param endDate
 * @param size
 * @param proxyAgent
 */
export const getRangeDataOverview = async (
  cookie: string,
  accountId: number,
  type: 0 | 1 | 2 = 0,
  page: number = 1,
  startDate: string,
  endDate: string,
  size: number = 30,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<SouhuhaoRangeDataOverviewResponse> => {
  const sp_cm = cookie.split('mp-cv=')[1]?.split(';')[0];

  const url = 'https://mp.sohu.com/mpbp/bp/news/v4/users/stat/data/list';
  const result = await $http.get(url, {
    headers: {
      cookie: cookie,
      referer: 'https://mp.sohu.com/mpfe/v4/data/stat/total',
      'sp-cm': sp_cm,
      'mp-cv': sp_cm,
    },
    params: {
      accountId: accountId,
      type: type,
      startDate: startDate,
      endDate: endDate,
      page: page,
      size: size,
    },
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

export interface SouhuhaoRangeDataOverviewResponse {
  data: {
    pvInfo: Array<{
      date: string;
      pv: number;
      pvValid: number;
      likeCount: number;
      commentCount: number;
      shareCount: number;
      voteCount: number;
    }>;
    totalCount: number;
  };
  code: number; //2000000;
  msg: string;
  success: boolean;
}
