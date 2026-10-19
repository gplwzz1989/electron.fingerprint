import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { errorCode } from '../../media-platform/errorCode';

export const getUserInfoAsync = async (cookie: string, proxyAgent?: object): Promise<DayuhaoUserInfoResponse> => {
  const url = 'https://mp.dayu.com/dashboard/article/write';
  const result = await $http.get<unknown, AxiosResponse<string>>(url, {
    headers: {
      cookie: cookie,
    },
    maxRedirects: 0,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  const data: DayuhaoUserInfoResponse = {
    code: 0,
    msg: '',
    data: {
      uid: '',
      nickname: '',
      avatar: '',
      imageUpSign: '',
      imageCutSign: '',
      requestId: '',
      utoken: '',
      allowPublishNum: 0,
      allowAllPublishNum: 0,
      sign: '',
      localupSign: '',
    },
  };

  if (
    result.status === 302 ||
    result.status === 401 ||
    result.data?.includes('/api/mp/user/auth') ||
    result.data?.includes('mp.dayu.com/logout')
  ) {
    data.code = 401;
    data.msg = '登录失效';
    if (result.data?.includes('Redirecting to /register.html')) {
      data.msg = '账号未入驻大鱼号';
      data.code = errorCode.accountUnVerify;
    }
    return data;
  }

  const regex = /globalConfig\s*=\s*(\{.*\});/;

  const userInfoJsonResult = regex.exec(result.data);

  if (userInfoJsonResult != null && userInfoJsonResult.length > 0) {
    const userInfo = JSON.parse(userInfoJsonResult[1]);

    if (userInfo['wmid'] === undefined || userInfo['weMediaName'] === undefined) {
      data.code = 401;
      data.msg = '登录失效';
      return data;
    }

    data.data.uid = userInfo['wmid'] ?? '';
    data.data.nickname = userInfo['weMediaName'] ?? '';
    data.data.avatar = userInfo['wmAvator'] ?? '';
    data.data.imageUpSign = userInfo['nsImageResaveSign'] ?? '';
    data.data.imageCutSign = userInfo['nsImgCutSign'] ?? '';
    data.data.requestId = userInfo['requestId'] ?? '';
    data.data.utoken = userInfo['utoken'] ?? '';

    data.data.sign = userInfo['nsOutsiteImgUploadSign'] ?? '';
    data.data.localupSign = userInfo['nsImageUploadSign'] ?? '';

    const allowPublishNum = new RegExp('globalConfig\\.submitNum[\\s]{0,}=[\\s]{0,}[0-9]{1,}[\\s]{0,};').exec(
      result.data,
    );

    if (allowPublishNum != null && allowPublishNum.length > 0) {
      data.data.allowPublishNum = Number(allowPublishNum[0].split('=')[1].split(';')[0]);
    }

    const allowAllPublishNum = new RegExp(
      'globalConfig\\.maxMessageSubmitNumEachDayByConf[\\s]{0,}=[\\s]{0,}[0-9]{1,}[\\s]{0,};',
    ).exec(result.data);

    if (allowAllPublishNum != null && allowAllPublishNum.length > 0) {
      data.data.allowAllPublishNum = Number(allowAllPublishNum[0].split('=')[1].split(';')[0]);
    }

    return data;
  }

  data.code = 401;
  data.msg = '登录失效';
  return data;
};

export interface DayuhaoUserInfoResponse {
  code: number;
  msg: string;
  data: {
    localupSign: string;
    sign: string;
    uid: string;
    nickname: string;
    avatar: string;
    imageUpSign: string;
    imageCutSign: string;
    requestId: string;
    utoken: string;
    allowPublishNum: number;
    allowAllPublishNum: number;
  };
}
