import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 获取用户首页数据
 * @param cookie
 * @param proxyAgent
 */
export const getUserHomeDataAsync = async (
  cookie: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<AiqiyiUserHomeDataResponse> => {
  const result = await $http.get<unknown, AxiosResponse<AiqiyiUserHomeDataResponse>>(
    'https://mp-api.iqiyi.com/stat/api/1.0/user/yesterday',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.iqiyi.com/',
        origin: 'https://mp.iqiyi.com',
      },
      params: {
        pgcType: 'wemedia',
      },
      httpsAgent: proxyAgent,
      httpAgent: proxyAgent,
    },
  );

  // 请求失败
  if (result.data.code !== 0) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

/**
 * 获取用户首页收益数据
 * @param cookie
 */
export const getUserIncomeAsync = async (cookie: string): Promise<AiqiyiUserIncomeResponse> => {
  const result = await $http.get<unknown, AxiosResponse<AiqiyiUserIncomeResponse>>(
    'https://mp-api.iqiyi.com/income/api/1.0/home_aggregate',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.iqiyi.com/',
        origin: 'https://mp.iqiyi.com',
      },
    },
  );

  // 请求失败
  if (result.data.code !== 0) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface AiqiyiUserHomeDataResponse {
  code: number;
  msg: string;
  data: {
    totalVv: number;
    yestodayVv: number;
    vvUpdated: boolean;
    totalLikeNum: number;
    yesterdayLikeNum: number;
    totalPv: number;
    totalPlaytime: number;
    totalBvvDuration: number;
    playCompletePercent: number;
    totalCommentNum: number;
    fansTotalNum: number;
    fansChange: number;
    fansUpdated: boolean;
  };
}

export interface AiqiyiUserIncomeResponse {
  code: number;
  msg: string;
  data: {
    totalIncome: number;
  };
}

/**
 * 获取用户信息
 * @param cookie
 * @param proxyAgent
 */
export const getUserInfoAsync = async (cookie: string, proxyAgent?: object): Promise<AiqiyiUserInfoResponse> => {
  const result = await $http.get('https://mp-api.iqiyi.com/uc/api/2.0/auth/basic_info?site=cn', {
    headers: {
      cookie: cookie,
      referer: 'https://mp.iqiyi.com/',
      origin: 'https://mp.iqiyi.com',
    },
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  if (result.status === 401 && result.statusText === 'Unauthorized') {
    return {
      code: 401,
      msg: result?.data ?? 'Unauthorized',
      data: {
        uid: 0,
        nickname: '',
        icon: '',
      },
    };
  }

  return result.data;
};

export interface AiqiyiUserInfoResponse {
  code: number;
  msg: string;
  data: {
    uid: number;
    nickname: string;
    icon: string;
    certificateType?: number;
    verified?: boolean;
  };
}
