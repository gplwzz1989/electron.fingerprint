import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { errorCode } from '../../media-platform/errorCode';
import { HttpsProxyAgent } from 'https-proxy-agent';

export const getUserHomeDataAsync = async (
  cookie: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<YidianhaoUserHomeDataResponse> => {
  const result = await $http.get<unknown, AxiosResponse<YidianhaoUserHomeDataResponse>>(
    'https://mp.yidianzixun.com/api/refact-get-main-data2',
    {
      headers: {
        cookie: cookie,
        referer: 'https://www.zhihu.com/creator',
        authority: 'mp.yidianzixun.com',
      },
      params: {},
      httpsAgent: proxyAgent,
      httpAgent: proxyAgent,
    },
  );

  if (result.status !== 200) {
    throw new BadRequestException(result.statusText, result.data?.code, result.data);
  }

  // 请求失败
  if (result.data?.code != 0) {
    throw new BadRequestException(result.data?.reason, result.data?.code, result.data);
  }

  return result.data;
};

export interface YidianhaoUserHomeDataResponse {
  result: {
    /**
     * 推荐量
     */
    viewSum: number;

    /**
     * 做i日推荐量
     */
    viewYesterday: number;

    /**
     * 阅读量
     */
    clickSum: number;

    /**
     * 昨日阅读量
     */
    clickYesterday: number;

    /**
     * 粉丝量
     */
    fansSum: number;

    /**
     * 昨日粉丝量
     */
    fansYesterday: number;
    desc: string;
  };
  code: number;
  errorCode: number;
  status: string;
  reason: string;
}

export const getUserInfoAsync = async (cookie: string, proxyAgent?: object): Promise<YidianhaoUserInfoResponse> => {
  const url = 'https://mp.yidianzixun.com/';
  const result = await $http.get<unknown, AxiosResponse<string>>(url, {
    headers: {
      cookie: cookie,
    },
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  const data: YidianhaoUserInfoResponse = {
    code: 0,
    msg: '',
  };

  if (
    result?.data?.includes('全网唯一获得互联网新闻信息服务许可的自媒体平台') &&
    result?.data?.includes('账号登录成功，请入驻一点号')
  ) {
    data.code = 401;
    data.msg = '登录失效';
    return data;
  }

  if (result.status !== 200) {
    throw new BadRequestException(result.statusText, result.status, result.data);
  }

  const regex = /window\.mpuser\s*=\s*(\{.*\});/;

  const userInfoJsonResult = regex.exec(result.data);

  if (userInfoJsonResult != null && userInfoJsonResult.length > 0) {
    const userInfo = JSON.parse(userInfoJsonResult[1]);

    if (userInfo['id'] === undefined || userInfo['uid'] === undefined) {
      data.code = 204;
      if (result.data?.includes('static.yidianzixun.com/modules/mp/mp/Pages/register/register')) {
        data.code = errorCode.accountUnVerify;
        data.msg = '未入驻一点号';
      } else {
        data.msg = '登录失效';
      }

      return data;
    } else {
      data.data = {
        ...userInfo,
        copyright: userInfo['copyright'],
        media_name: userInfo['media_name'],
        id: userInfo['id'],
        media_pic: userInfo['media_pic'],
        uid: userInfo['uid'],
        media_summary: userInfo['media_summary'],
        mpCode: /window\.mpcode\s*=\s*'.*';/.exec(result.data)?.[0].split("'")[1] || '',
        skUrl: /\/\/static.yidianzixun.com\/modules\/mp\/mp\/Pages\/manage\/manage-[0-9a-z]{5,}.js/.exec(
          result.data,
        )?.[0],
      };

      return data;
    }
  } else {
    data.code = 204;
    data.msg = '登录失效';
    return data;
  }
};

export interface YidianhaoUserInfoResponse {
  code: number;
  msg: string;
  data?: {
    copyright: number;
    /**
     * 用户昵称
     */
    media_name: string;
    /**
     * 用户id
     */
    id: number;
    /**
     * 用户头像
     */
    media_pic: string;
    uid: string;
    media_summary: string;
    mpCode?: string;
    skUrl?: string;
    original?:number;
  };
}
