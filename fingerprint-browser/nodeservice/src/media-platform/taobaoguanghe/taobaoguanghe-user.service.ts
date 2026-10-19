import { AxiosResponse } from 'axios';
import { $http } from '../../http';

export const TaoBaoGuangHeUserInfoUrl = 'https://creator.guanghe.taobao.com/creator/v2/queryPerson';

export interface TaoBaoGuangHeUserInfo {
  id?: string | number;
  userNick?: string;
  avatar?: string;
  [key: string]: unknown;
}

export interface TaoBaoGuangHeUserInfoResponse {
  code?: number | string;
  msg?: string;
  message?: string;
  success?: boolean;
  data?: TaoBaoGuangHeUserInfo | null;
  [key: string]: unknown;
}

/**
 * 使用淘宝光合网页端接口校验登录态并获取当前账号信息。
 *
 * 该接口依赖浏览器登录 Cookie，不需要也不接受开放平台 AppKey/AppSecret。
 */
export const getTaoBaoGuangHeUserInfo = async (
  cookie: string,
  proxyAgent?: object,
): Promise<TaoBaoGuangHeUserInfoResponse> => {
  const result = await $http.post<unknown, AxiosResponse<TaoBaoGuangHeUserInfoResponse>>(
    TaoBaoGuangHeUserInfoUrl,
    {},
    {
      headers: {
        cookie,
        Accept: '*/*',
        'Content-Type': 'application/json',
        Origin: 'https://creator.guanghe.taobao.com',
        Referer: 'https://creator.guanghe.taobao.com/page',
      },
      httpAgent: proxyAgent,
      httpsAgent: proxyAgent,
    },
  );

  if (typeof result.data === 'string') {
    try {
      return JSON.parse(result.data) as TaoBaoGuangHeUserInfoResponse;
    } catch {
      return {
        code: result.status,
        msg: result.data,
      };
    }
  }

  return (
    result.data ?? {
      code: result.status,
      msg: result.statusText,
    }
  );
};
