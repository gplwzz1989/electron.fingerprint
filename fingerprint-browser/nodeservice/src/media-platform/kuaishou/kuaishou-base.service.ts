import { $http } from '../../http';
import { Guid, isJson, Task } from '../../utils';
import crypto from 'crypto';
import * as buffer from 'buffer';
import FormData from 'form-data';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 签名缓存
 */
const cacheSign = {};
//region 签名服务参数
const signUrl = 'http://qianming.yixiaoer.cn:';
let signIndex = 0;
const signPorts = ['5004', '5005', '5006', '5007', '5008'];
//endregion

/**
 * 统一正则
 */
export const regex = /kuaishou\.web\.cp\.api_ph=([a-z0-9]+)/;

/**
 * 签名
 * @param needSignStr 要签名的字符出纳
 */
export const getSign = async (needSignStr: string): Promise<string> => {
  try {
    const md5 = crypto.createHash('md5').update(needSignStr).digest('hex');
    if (cacheSign[md5]) {
      return cacheSign[md5];
    }

    const url = `${signUrl}${signPorts[signIndex % signPorts.length]}/Sign/GetSign`;
    signIndex++;

    // noinspection SpellCheckingInspection
    const postData = { url: '', cookie: md5, signType: 'browser', signCommand: 'kuaishou' };

    let result = await $http.post(url, postData);

    if (!result.data?.signature) {
      await Task.Delay(1000);
      result = await $http.post(url, postData);
    }

    const signStr = result.data?.signature ?? '';

    if (signStr) {
      cacheSign[md5] = signStr;
    }
    return signStr;
  } catch (e) {
    console.debug('快手签名异常', e?.toString());
  }

  return '';
};

/**
 * 获取用户信息，检测登录是否有效
 * @param cookie
 * @param proxyAgent
 */
export const getUserInfoResponse = async (cookie: string, proxyAgent?: object): Promise<KuaishouUserInfoResponse> => {
  const match = regex.exec(cookie);
  const webapiId = match ? match[1] : Guid.NewGuid().toString().replace(/-/g, '');
  // noinspection SpellCheckingInspection
  const postData = JSON.stringify({ 'kuaishou.web.cp.api_ph': webapiId });

  const sign = await getSign(postData);
  const url = `https://cp.kuaishou.com/rest/v2/creator/pc/authority/account/current?__NS_sig3=${sign}`;

  const headers = {
    cookie: cookie,
    'X-Requested-With': 'XMLHttpRequest',
    Referer: 'https://cp.kuaishou.com/profile',
    returnSetRootDomainLoginUrl: true,
    'Content-Type': 'application/json;charset=UTF-8',
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

// noinspection SpellCheckingInspection
export interface KuaishouUserInfoResponse {
  /**
   * 状态码 1正常 非1异常
   * 109 登录失效/未登录
   */
  result: number;
  currentTime: number;
  /**
   * 数据体
   */
  data?: {
    role: number;
    isGrOrPr: boolean;
    appType: number;
    roles: Array<number>;
    /**
     * 用户头像
     */
    userAvatar: string;
    userKwaiId: string | null;
    /**
     * 用户昵称
     */
    userName: string;
    /**
     * 用户id
     */
    userId: number;
    article: boolean;
    showCreator: boolean;
    logined: boolean;
  };
  message?: string;
  loginUrl?: string;
}

export const getUserFansNumResponse = async (
  cookie: string,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<object> => {
  const match = regex.exec(cookie);
  const webapiId = match ? match[1] : Guid.NewGuid().toString().replace(/-/g, '');
  // noinspection SpellCheckingInspection
  const postData = JSON.stringify({ 'kuaishou.web.cp.api_ph': webapiId });

  const sign = await getSign(postData);
  const url = `https://cp.kuaishou.com/rest/cp/creator/pc/home/infoV2?__NS_sig3=${sign}`;

  const headers = {
    cookie: cookie,
    'X-Requested-With': 'XMLHttpRequest',
    Referer: 'https://cp.kuaishou.com/profile',
    returnSetRootDomainLoginUrl: true,
    'Content-Type': 'application/json;charset=UTF-8',
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

/**
 * 首页数据
 * @param cookie
 */
export const getUserHomeDataAsync = async (cookie: string): Promise<KuaishouUserHomeDataResponse> => {
  const match = cookie.match(regex);
  const webapiId = match ? match[1] : Guid.NewGuid().replace(/-/g, '');

  const headers = {
    cookie: cookie,
    referer: 'https://cp.kuaishou.com/profile',
    Origin: 'https://cp.kuaishou.com',
    Host: 'cp.kuaishou.com',
    'Content-Type': 'application/json;charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
  };

  const postData = {
    'kuaishou.web.cp.api_ph': webapiId,
  };

  const signStr = await getSign(JSON.stringify(postData));

  const infoUrl = 'https://cp.kuaishou.com/rest/cp/creator/pc/home/infoV2?__NS_sig3=' + signStr;

  const result = await $http.post<never, AxiosResponse<KuaishouUserHomeInfoResponse>>(infoUrl, postData, {
    headers: headers,
  });

  if (result.data.result !== 1) {
    throw new BadRequestException(result.data?.message, result.data?.result, result.data);
  }

  const incomeUrl = 'https://cp.kuaishou.com/rest/cp/creator/pc/home/account/overviewV2?__NS_sig3=' + signStr;

  const incomeResult = await $http.post<never, AxiosResponse<KuaishouUserHomeIncomeResponse>>(incomeUrl, postData, {
    headers: headers,
  });

  if (incomeResult.data.result !== 1) {
    throw new BadRequestException(incomeResult.data?.message, incomeResult.data?.result, incomeResult.data);
  }

  const data: KuaishouUserHomeDataResponse = {
    result: 1,
    message: '成功',
    data: {
      likeCnt: 0,
      userName: '',
      fansCnt: 0,
      userId: 0,
      followCnt: 0,
      desc: '',
      incomes: 0,
      ksCoin: 0,
      diamond: 0,
    },
  };

  data.data.likeCnt = result.data.data.likeCnt;
  data.data.userName = result.data.data.userName;
  data.data.fansCnt = result.data.data.fansCnt;
  data.data.userId = result.data.data.userId;
  data.data.followCnt = result.data.data.followCnt;
  data.data.desc = result.data.data.desc;
  data.data.incomes = incomeResult.data.data.incomes;
  data.data.ksCoin = incomeResult.data.data.ksCoin;
  data.data.diamond = incomeResult.data.data.diamond;

  return data;
};

export interface KuaishouUserHomeDataResponse {
  result: number;
  message: string;
  data: {
    likeCnt: number;
    userName: string;
    fansCnt: number;
    userId: number;
    followCnt: number;
    desc: string;
    incomes: number;
    ksCoin: number;
    diamond: number;
  };
}

export interface KuaishouUserHomeInfoResponse {
  result: number;
  message: string;
  data: {
    likeCnt: number;
    userName: string;
    fansCnt: number;
    userId: number;
    followCnt: number;
    desc: string;
  };
}

export interface KuaishouUserHomeIncomeResponse {
  result: number;
  message: string;
  data: {
    incomes: number;
    ksCoin: number;
    diamond: number;
  };
}

/**
 * 获取上传参数
 * @param cookie
 * @param uploadType 上传类型，默认位视频1，可能后续会有图片，音频等
 */
export const getUploadArgsResponse = async (cookie: string, uploadType: number = 1): Promise<UploadArgsResponse> => {
  const match = regex.exec(cookie);
  const webapiId = match ? match[1] : Guid.NewGuid().toString().replace(/-/g, '');

  const headers = {
    cookie: cookie,
    Referer: 'https://cp.kuaishou.com/article/publish/video',
    'Content-Type': 'application/json',
  };

  const postData = JSON.stringify({ uploadType: uploadType, 'kuaishou.web.cp.api_ph': webapiId });

  const sign = await getSign(postData);
  const url = `https://cp.kuaishou.com/rest/cp/works/v2/video/pc/upload/pre?__NS_sig3=${sign}`;

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

// noinspection SpellCheckingInspection
export interface UploadArgsResponse {
  /**
   * 状态码 1 正常 非1异常
   *
   */
  result: number;
  currentTime: number;
  data?: {
    token: string;
    endPoints: Array<string>;
  };
  /**
   * 提示消息，如果账号被禁言等，可以通过这个消息来判断
   */
  message: string;
}

/**
 * 获取用户购物车权益
 * @param cookie
 */
export const getUserPrivilegeResponse = async (cookie: string): Promise<KuaishouShopPrivilegeResponse> => {
  const url = 'https://cp.kuaishou.com/rest/cp/works/v2/video/pc/realize/entrance';

  const headers = {
    cookie: cookie,
    Referer: 'https://cp.kuaishou.com/article/publish/video',
  };

  const match = regex.exec(cookie);
  const webapiId = match ? match[1] : Guid.NewGuid().toString().replace(/-/g, '');

  const postData = {
    movieId: '',
    'kuaishou.web.cp.api_ph': webapiId,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface KuaishouShopPrivilegeResponse {
  /**
   * 状态码 1 正常 非1异常
   *
   */
  result: number;
  data: {
    /**
     * 权益项
     */
    items: Array<{
      /**
       * 值为1时表示有商品购物车权限 9:小程序  5:招聘
       */
      type: number;
    }>;
  };
  message: string;
}

/**
 * 上传图片
 * @param cookie
 * @param imageData 图片二进制buffer
 * @constructor
 */
export const uploadImage = async (cookie: string, imageData: buffer.Buffer): Promise<UploadImageResponse> => {
  const url = 'https://cp.kuaishou.com/rest/cp/works/v2/video/pc/upload/cover/upload';

  const headers = {
    cookie: cookie,
    Referer: 'https://cp.kuaishou.com/article/publish/video',
  };

  const match = regex.exec(cookie);
  const webapiId = match ? match[1] : Guid.NewGuid().toString().replace(/-/g, '');
  const multiFormData = new FormData();
  multiFormData.append('file', imageData, { filename: 'blob', contentType: 'image/jpeg' });
  multiFormData.append('kuaishou.web.cp.api_ph', webapiId);

  const result = await $http.post(url, multiFormData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface UploadImageResponse {
  /**
   * 状态码
   * 1正常 非1异常
   */
  result: number;
  /**
   * 数据体
   */
  data?: {
    /**
     * 上传完成的图片key
     */
    coverKey: string;
  };
  /**
   * 提示消息
   */
  message: string;
}

export const refreshUserTokenResponse = async (cookie: string, proxyAgent?: object): Promise<KuaiShouTokenResponse> => {
  const match = regex.exec(cookie);
  const webapiId = match ? match[1] : Guid.NewGuid().toString().replace(/-/g, '');
  // noinspection SpellCheckingInspection
  const postData = JSON.stringify({ 'kuaishou.web.cp.api_ph': webapiId });

  const url = `https://id.kuaishou.com/pass/kuaishou/login/passToken?callback=https%3A%2F%2Fcp.kuaishou.com%2Frest%2Finfra%2Fsts%3FfollowUrl%3Dhttps%253A%252F%252Fpassport.kuaishou.com%252Fpc%252Faccount%252FpassToken%252Fresult%253Fsuccessful%253Dtrue%2526id%253DSSO_1762256569046%2526for%253DpassTokenSuccess%26failUrl%3Dhttps%253A%252F%252Fpassport.kuaishou.com%252Fpc%252Faccount%252FpassToken%252Fresult%253Fsuccessful%253Dfalse%2526id%253DSSO_${Date.now()}%2526for%253DpassTokenSuccess%26setRootDomain%3Dtrue&__loginPage=https%3A%2F%2Fpassport.kuaishou.com%2Fpc%2Faccount%2FpassToken%2Fresult%3Fsuccessful%3Dfalse%26id%3DSSO_${Date.now()}%26for%3DpullTokenFail&sid=kuaishou.web.cp.api`;

  const headers = {
    cookie: cookie,
    Referer: 'https://cp.kuaishou.com/profile',
    returnSetRootDomainLoginUrl: true,
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
    maxRedirects: 0,
  });

  return result.data;
};

export interface KuaiShouTokenResponse {
  result: number;
  ssecurity: string;
  'kuaishou.web.cp.api_st': string;
  'kuaishou.web.cp.api.at': string;
  bUserId: number;
  userId: number;
  error_msg: string;
}
