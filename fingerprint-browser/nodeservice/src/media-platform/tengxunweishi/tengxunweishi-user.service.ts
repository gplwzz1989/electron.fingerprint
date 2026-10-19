import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 获取用户个人信息
 * @param cookie
 * @param personId 授权信息接口返回的personId
 * @param proxyAgent
 */
export const getPersonalInfoAsync = async (
  cookie: string,
  personId: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<TengxunweishiPersonalInfo> => {
  const result = await $http.get<unknown, AxiosResponse<TengxunweishiPersonalInfo>>(
    'https://media.weishi.qq.com/media-api/getPersonalInfo',
    {
      headers: {
        cookie: cookie,
        referer: 'https://media.weishi.qq.com/',
      },
      params: {
        data: JSON.stringify({ personId: personId }),
      },
      httpAgent: proxyAgent,
      httpsAgent: proxyAgent,
    },
  );

  return result.data;
};

/**
 * 腾讯微视授权信息
 * @param cookie
 * @param proxyAgent
 */
export const getAuthInfoAsync = async (
  cookie: string,
  proxyAgent?: HttpsProxyAgent<string> | object | undefined,
): Promise<TengxunweishiAuthInfo> => {
  const url: string = 'https://h5.weishi.qq.com/weishi/getauthinfo';

  const headers = {
    cookie: cookie,
    referer: 'https://media.weishi.qq.com',
    Origin: 'https://media.weishi.qq.com',
    authority: 'h5.weishi.qq.com',
  };

  const postData = {
    cmd: 'getLoginInfo',
  };

  const result = await $http.post<never, AxiosResponse<TengxunweishiAuthInfo>>(url, null, {
    headers: headers,
    params: postData,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

export interface TengxunweishiPersonalDetail {
  personId: string;
  avatar: string;
  nickName: string;
  fansNum: number;
  interestNum: number;
  receivePraiseNum: number;
  lastUpdateTime: string;
  totalVideoNum: string;
  incVideoNum: string;
  totalPlayVv: string;
  incPlayVv: string;
  incFansNum: string;
}

export interface TengxunweishiPersonalInfo {
  code: number;
  msg: string;
  personDetail: TengxunweishiPersonalDetail;
  isMainAccount: number;
  showSyncToOmBtn: number;
  isDataAlyEnabled: number;
  talentLevel: number;
}

export interface TengxunweishiAuthInfo {
  code: number;
  errorMsg: string;
  data: {
    weishiOpenid: string;
    personid: string;
    authType: string;
    openid: string;
    accessToken: string;
    appid: string;
    refreshToken: string;
    wsToken: '';
  };
}

/**
 * 刷新微信登录的accessToken
 * @param cookie
 */
export const getPersonalAccessTokenAsync = async (cookie: string): Promise<string> => {
  const result = await $http.get(
    'https://h5.weishi.qq.com/weishi/account/login?r_url=http%3A%2F%2Fmedia.weishi.qq.com%2F',
    {
      headers: {
        cookie: cookie,
        referer: 'https://media.weishi.qq.com/',
      },
      maxRedirects: 0,
    },
  );

  const cookies = result.headers['set-cookie'];
  if (cookies && cookies?.length > 0) {
    for (const key of cookies) {
      const item = key?.trim().split(';')[0]?.split('=');
      cookie = cookie.replace(item[0], `${item[0]}_Old`);
      cookie = `${cookie};${key.split(';')[0]}`;
    }
    return cookie;
  }

  return '';
};

/**
 * 访问上传页面
 * @param cookie
 * @param proxyAgent
 */
export const getUploadIndexPage = async (
  cookie: string,
  proxyAgent?: object,
): Promise<{ code: number; result: string }> => {
  const result = await $http.get('https://media.weishi.qq.com/', {
    headers: {
      cookie: cookie,
      referer: 'https://media.weishi.qq.com/',
    },
    responseType: 'text',
    maxRedirects: 0,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return { code: result.status, result: result.data };
};
