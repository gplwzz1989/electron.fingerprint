import { $http } from '@/http';
import { GetMD5, Guid } from '@/utils';
import crypto from 'crypto';

export const getHeaderSign = (time: number, param: string = '{}'): string => {
  const signStr = `cid=508&param=${param}19DDD1FBDFF065D3A4DA777D2D7A81EC${time}`;
  const hashSer = crypto.createHash('md5');
  hashSer.update(signStr);
  return hashSer.digest('hex');
};

export const getYiCheHaoUserInfoResponse = async (
  cookie: string,
  proxyAgent?: object,
): Promise<YiCheHaoUserInfoResponse> => {
  const url = 'https://mapi.yiche.com/user_center_api/api/v1/user/get_my_info_by_id?cid=508&param=%7B%7D';

  const now = Date.now();
  const headers = {
    cookie: cookie,
    referer: 'https://mp.yiche.com/',
    cid: 500,
    ver: '1.0.4',
    'x-platform': 'pc',
    'x-user-guid': Guid.NewGuid().toString(),
    'x-timestamp': now.toString(),
    'x-sign': getHeaderSign(now),
  };

  const result = await $http.get(url, { headers: headers, httpAgent: proxyAgent, httpsAgent: proxyAgent });

  return result.data;
};

export interface YiCheHaoUserInfoResponse {
  /** 状态码，1表示成功 */
  status: string;
  /** 状态描述信息 */
  message: string;
  /** 核心数据对象 */
  data: {
    authStatus: number;
    /** 用户ID */
    id: number;
    /** 唯一标识，可能为null */
    onlyKey: string | null;
    /** 用户票据，可能为null */
    userTicket: string | null;
    /** 显示名称 */
    showName: string;
    /** 真实姓名，为空字符串 */
    realName: string;
    /** 手机号码 */
    mobile: string;
    /** 粉丝数量 */
    fansCount: number;
    /** 关注数量 */
    attentionCount: number;
    /** 头像路径 */
    avatarPath: string;
    /** 宽屏头像路径 */
    avatarPathWp: string;
    /** 关注状态，可能为null */
    attentionStatus: unknown | null;
    /** 获得的支持数 */
    winSupportCount: number;
    /** 用户描述，可能为null */
    userDesc: string | null;
    /** 用户等级 */
    level: number;
    /** 视频数量，可能为null */
    videoCount: number | null;
    /** 性别，1表示男性（推测） */
    gender: number;
    /** 城市ID */
    cityId: number;
    /** 城市名称 */
    cityName: string;
    /** 车辆认证类型 */
    carIdentificationType: number;
    /** 车辆信息，可能为null */
    carInfo: unknown | null;
    /** 关注类型 */
    followType: number;
    /** 是否有手机号 */
    haveMobile: boolean;
    /** 用户封禁列表，可能为null */
    userBanList: unknown | null;
    /** 创建时间 */
    createtime: string;
    /** 信息完善度百分比 */
    infoPercent: number;
    /** IP所在地 */
    ipLocation: string;
    /** 用户来源标识 */
    userFrom: number;
    /** 用户身份列表，可能为null */
    userIdentityList: unknown | null;
    /** 内容展示等级，可能为null */
    contentShowLevel: unknown | null;
    /** 隐私内容标识，可能为null */
    privacyContentFlag: unknown | null;
    /** 推送开关设置，可能为null */
    pushSwitch: unknown | null;
    /** 是否为直播主播 */
    liveAnchorFlag: boolean;
  };
  /** 错误代码，为空字符串表示无错误 */
  ercd: string;
}

export const getYiCheHaoUserHomeInfoResponse = async (
  cookie: string,
  proxyAgent?: object,
): Promise<YiCheHaoUserHomeInfoResponse> => {
  const url = 'https://mp.yiche.com/web_mp/api/v1/home/userinfo';

  const now = parseInt((Date.now() / 1000).toFixed(0));

  const postData = {
    cid: 500,
    ver: '1.0.0',
    uid: '',
    t: now,
    sign: '',
    param: {},
  };

  const signStr =
    'cid=' +
    postData.cid +
    ';param=' +
    JSON.stringify(postData.param) +
    ';ver=' +
    postData.ver +
    ';t=' +
    postData.t +
    ';' +
    '6AC46B43FC8DCD6E49F66F6C016F393F';
  postData.sign = GetMD5(signStr);
  const headers = {
    cookie: cookie,
    referer: 'https://mp.yiche.com/',
    encrypttype: '2',
    'Content-Type': 'application/json; charset=UTF-8',
  };

  const result = await $http.post(url, postData, { headers: headers, httpAgent: proxyAgent, httpsAgent: proxyAgent });

  return result.data;
};

export interface YiCheHaoUserHomeInfoResponse {
  status: string;
  message: string;
  data: {
    userId: number;
    avator: string;
    avatorWp: string;
    mediaName: string;
    /**
     * 0:未实名
     * 1:正常账号
     */
    authStatus: number;
    type: 0;
    fanCount: 0;
    influenceIndex: 0.0;
    visitCount: 0;
    playCount: 0;
    commentCount: 0;
    mediaType: null;
    mediaStatus: 0;
    mediaNoPassReason: null;
    isCreatorMember: 0;
  };
  ercd: '';
}

export const getYiCheHaoUserRealAuthResponse = async (
  cookie: string,
  proxyAgent?: object,
): Promise<YiCheHaoRealAuthStateResponse> => {
  const url = `https://mp.yiche.com/web_mp/api/v1/auth/real/get_auth_status?cid=500&ver=1.0.0&uid=&t=${(
    Date.now() / 1000
  ).toFixed(0)}`;

  const now = Date.now();
  const headers = {
    cookie: cookie,
    referer: 'https://mp.yiche.com/',
  };

  const result = await $http.get(url, { headers: headers, httpAgent: proxyAgent, httpsAgent: proxyAgent });

  return result.data;
};

export interface YiCheHaoRealAuthStateResponse {
  status: string;
  message: string;
  data: {
    id: number;
    userId: number;
    /**
     * 1:实名认证通过
     */
    status: number;
    rejectType: null;
    message: string;
    level: 0;
  };
  ercd: '';
}
