import { $http } from '../../http';
import { AxiosResponse, AxiosResponseHeaders } from 'axios';
import { parseSetCookie } from '@/utils';

/**
 * A站用户信息
 * @param cookie
 */
export const getUserInfoAsync = async (cookie: string, proxyAgent?: object): Promise<AzhanUserInfoResponse> => {
  const url = 'https://member.acfun.cn/common/api/getPersonalInfo';

  const headers = {
    cookie: cookie,
    referer: 'https://member.acfun.cn/video-history',
    Origin: 'https://member.acfun.cn',
    authority: 'member.acfun.cn',
    'content-type': 'application/x-www-form-urlencoded',
  };
  const postData = {};

  const result = await $http.post<never, AxiosResponse<AzhanUserInfoResponse>>(url, postData, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  if (result.status === 401) {
    return {
      result: 401,
      errMsg: result?.data?.errMsg,
      isError: true,
    };
  }

  return result.data;
};

export interface AzhanUserInfoResponse {
  result: number;
  info?: {
    userId: number;
    gender: number;
    banana: number;
    followedNum: number;
    shareUrl: string;
    contentCount: string;
    headUrl: string;
    userName: string;
  };
  errMsg: {
    message: string;
    name: string;
  };
  isError: boolean;
}
export const refreshUserCookie = async (cookie: string, proxyAgent?: object): Promise<string> => {
  const url = 'https://member.acfun.cn/';

  const headers = {
    cookie: cookie,
    referer: 'https://member.acfun.cn/video-history',
    Origin: 'https://member.acfun.cn',
  };

  const result = await $http.head(url, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  const cookieRe = parseSetCookie(result.headers as AxiosResponseHeaders);
  return cookieRe;
};
