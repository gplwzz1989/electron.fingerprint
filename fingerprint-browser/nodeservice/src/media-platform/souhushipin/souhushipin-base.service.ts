import { HttpsProxyAgent } from 'https-proxy-agent';
import { $http } from '@/http';

export const getUserInfoResponse = async (
  cookie: string,
  proxyAgent?: HttpsProxyAgent<string>,
): Promise<SouHuShiPinUserResponse> => {
  const result = await $http.get('https://my.tv.sohu.com/user/a/profile/currinfo.do', {
    headers: {
      cookie: cookie,
      referer: 'https://my.tv.sohu.com',
    },
    params: {
      end: 0,
      appid: 107405,
      f: 0,
      platform_source: 'pc',
      _: Date.now(),
    },
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export const getUserHomeResponse = async (
  cookie: string,
  proxyAgent?: object | HttpsProxyAgent<string>,
): Promise<number> => {
  const result = await $http.get('https://my.tv.sohu.com/i/home', {
    headers: {
      cookie: cookie,
      referer: 'https://my.tv.sohu.com',
    },
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
    maxRedirects: 0,
  });

  return result.status;
};
export interface SouHuShiPinUserResponse {
  msg: string;
  data: {
    lastLogin: number;
    showContract: number;
    flag: number;
    fee: number;
    comefrom: number;
    video: number;
    /**
     *
     */
    score: number;
    /**
     * 认证？
     */
    isAuth: number;
    isWeixin: number;
    contractUrlType: number;
    feetype: number;
    /**
     * 用户id
     */
    id: number;
    /**
     * 头像，不带http，//开头
     */
    smallPhoto: string;
    isOpenedVip: boolean;
    /**
     * 等级
     */
    level: number;
    /**
     * 昵称
     */
    nickName: string;
    ent: 0;
    commend: 0;
    message: 0;
    snsList: string;
    bigPhoto: string;
    vipicon: string;
    bookmark: 0;
    cometUrl: '';
    isOpen: 0;
    createTime: number;
    jifen: number;
    userType: number;
  };
  /**
   * 1正常 非1 异常
   */
  status: number;
}

export const getUploadCapResponse = async (
  cookie: string,
  proxyAgent?: HttpsProxyAgent<string>,
): Promise<{ data: { value: string } }> => {
  const result = await $http.get('https://my.tv.sohu.com/user/a/wvideo/captcha?videoType=10', {
    headers: {
      cookie: cookie,
      referer: 'https://my.tv.sohu.com',
      Origin: 'https://tv.sohu.com',
    },
    params: {},
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};
