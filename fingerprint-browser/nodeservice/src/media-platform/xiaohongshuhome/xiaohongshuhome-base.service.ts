import { $http } from '../../http';
import crypto from 'crypto';
import { Task } from '../../utils';


//region 签名服务参数
const signUrl = 'http://qianming.yixiaoer.cn:';
let signIndex = 0;
const signPorts = ['5061', '5062', '5063'];
//endregion

const XIAOHONGSHUHOME_HOST = 'https://edith.xiaohongshu.com';
const XIAOHONGSHUHOME_ALT_PATH = '/api/sns/web/v1/celestial/lt';
const XIAOHONGSHUHOME_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';

export interface XiaohongshuhomeAltResponse {
  result?: number;
  code: number;
  success?: boolean;
  msg?: string;
  data?: {
    a_lt?: string;
    r_lt?: string;
    expired_time?: number;
  };
  deviceId?: string;
}

/**
 * 获取小红书主页 WebSocket 使用的 aLt 参数。
 * @param cookie
 * @param proxyAgent
 * @param deviceId 设备标识，对应抓包中的 c_device_id
 */
export const getXiaohongshuhomeAlt = async (
  cookie: string,
  proxyAgent?: object,
  deviceId?: string,
): Promise<XiaohongshuhomeAltResponse> => {
  const signStr = await getNewSign(XIAOHONGSHUHOME_ALT_PATH, undefined);
  if (!signStr) {
    throw new Error('获取小红书主页WebSocket登录参数签名失败，请稍后重试');
  }

  let sign: Record<string, string | number>;
  try {
    sign = JSON.parse(signStr) as Record<string, string | number>;
  } catch {
    throw new Error('解析小红书主页WebSocket登录参数签名失败，请稍后重试');
  }

  if (!sign['X-s']) {
    throw new Error('小红书主页WebSocket登录参数签名缺少X-s，请稍后重试');
  }

  const resolvedDeviceId = deviceId?.trim() || crypto.randomUUID();
  let requestCookie = cookie;
  if (sign['a1']) {
    if (/(^|;\s*)a1=/.test(requestCookie)) {
      requestCookie = requestCookie.replace(/(^|;\s*)a1=[^;]*/, `$1a1old=${sign['a1']}`);
    }
    requestCookie = `${requestCookie};a1=${sign['a1']}`;
  }

  const response = await $http.get<XiaohongshuhomeAltResponse>(
    `${XIAOHONGSHUHOME_HOST}${XIAOHONGSHUHOME_ALT_PATH}`,
    {
      headers: {
        cookie: requestCookie,
        c_device_id: resolvedDeviceId,
        referer: 'https://www.xiaohongshu.com/',
        Origin: 'https://www.xiaohongshu.com',
        Accept: 'application/json, text/plain, */*',
        'User-Agent': XIAOHONGSHUHOME_USER_AGENT,
        'X-s': sign['X-s'].toString(),
        'X-t': sign['X-t']?.toString() ?? Date.now().toString(),
        'X-S-Common': sign['X-S-Common']?.toString() ?? '',
      },
      httpAgent: proxyAgent,
      httpsAgent: proxyAgent,
    },
  );

  if (!response?.data || typeof response.data !== 'object') {
    throw new Error('小红书主页WebSocket登录参数返回数据格式异常，请稍后重试');
  }

  const responseData = response.data;
  responseData.code = responseData.code ?? responseData.result ?? -1;
  responseData.deviceId = resolvedDeviceId;
  return responseData;
};

/**
 * 获取用户基础信息/判断登录是否有效
 * @param cookie
 * @param proxyAgent
 */
export const getUserInfo = async (cookie: string, proxyAgent?: object): Promise<XiaohongshuUserInfoResponse> => {
  const urlPath = '/api/sns/web/v2/user/me';
  const url = `https://edith.xiaohongshu.com${urlPath}`;

  const signStr = await getNewSign(urlPath, undefined);
  if (!signStr) {
    throw new Error('获取小红书首页用户信息签名失败，请稍后重试');
  }

  let sign: Record<string, string | number> = {};
  try {
    sign = JSON.parse(signStr);
  } catch (e) {
    //throw new Error('获取小红书首页用户信息签名失败，请稍后重试');
  }

  if (!sign['X-s']) {
    //throw new Error('获取小红书首页用户信息签名失败，请稍后重试');
  }

  if (sign['a1']) {
    cookie = cookie.replace('a1=', 'a1old=');
    cookie = `${cookie};a1=${sign['a1']}`;
  }

  const headers: Record<string, string> = {
    cookie: cookie,
    referer: 'https://www.xiaohongshu.com/',
    Origin: 'https://www.xiaohongshu.com',
    Accept: 'application/json, text/plain, */*',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36',
    Authorization: '',
  };
  headers['X-s'] = sign['X-s'].toString();
  headers['X-t'] = sign['X-t']?.toString() ?? Date.now().toString();
  headers['X-S-Common'] = sign['X-S-Common']?.toString() ?? '';

  const result = await $http.get(url, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  const responseData = result.data as XiaohongshuUserInfoResponse;
  responseData.result = responseData.code ?? responseData.result ?? -1;
  responseData.code = responseData.result;
  if (responseData.data) {
    responseData.data.userId = responseData.data.user_id ?? responseData.data.userId ?? '';
    responseData.data.userName = responseData.data.nickname ?? responseData.data.userName ?? '';
    responseData.data.userAvatar =
      responseData.data.images ?? responseData.data.imageb ?? responseData.data.userAvatar ?? '';
    responseData.data.redId = responseData.data.red_id ?? responseData.data.redId ?? '';
    responseData.data.role = responseData.data.role ?? '';
    responseData.data.permissions = responseData.data.permissions ?? [];
  }

  return responseData;
};

export interface XiaohongshuUserInfoResponse {
  /**
   * 状态码 -100表示登录失效/过期
   */
  result: number;
  code: number;
  /**
   * 接口是否成功
   */
  success: boolean;
  /**
   * 数据体
   */
  data?: {
    /**
     * 用户id
     */
    userId: string;
    user_id?: string;
    /**
     * 用户昵称
     */
    userName: string;
    nickname?: string;
    /**
     * 用户头像
     */
    userAvatar: string;
    images?: string;
    imageb?: string;
    /**
     *小红书号
     */
    redId: string;
    red_id?: string;
    gender?: number;
    guest?: boolean;
    desc?: string;
    /**
     * 角色 创作者/商家/等等
     */
    role: string;
    permissions: Array<string>;
  };

  /**
   * 提示消息  比如:登录已过期
   */
  msg?: string;
}

/**
 * 签名
 * @param urlPath
 * @param postStr
 */
export const getNewSign = async (urlPath: string, postStr: string | undefined): Promise<string> => {
  let tmpIndex = signIndex;
  signIndex++;
  for (let i = 0; i < 3; i++) {
    try {
      const url = `${signUrl}${signPorts[tmpIndex % signPorts.length]}/Sign/GetSign`;
      tmpIndex++;

      // noinspection SpellCheckingInspection
      const signDataList = [urlPath];
      if (postStr) {
        signDataList.push(encodeURIComponent(postStr));
      }
      const postData = {
        url: '',
        cookie: JSON.stringify(signDataList),
        signType: 'browser',
        signCommand: 'newxiaohongshu',
      };

      let result = await $http.post(url, postData);

      if (!result.data?.signature) {
        await Task.Delay(1000);
        result = await $http.post(url, postData);
      }

      const signStr = result.data?.signature?.toString()?.replace(/\\/g, '"');

      if (signStr) {
        return signStr;
      }
    } catch (e) {
      console.debug('小红书签名异常', e?.toString());
    }
  }
  return '';
};
