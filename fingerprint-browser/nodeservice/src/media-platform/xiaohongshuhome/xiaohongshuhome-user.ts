import { AxiosError } from 'axios';
import { PlatformAuthorInfo } from '@/media-platform/baseModel';
import { errorCode } from '@/media-platform/errorCode';
import { createKuaiProxyAgent, IWebProxy } from '@/media-platform/webproxy';
import { getUserInfo, getXiaohongshuhomeAlt as getXiaohongshuhomeAltRequest } from './xiaohongshuhome-base.service';

export interface XiaohongshuhomeAltResult {
  code: number;
  msg?: string;
  aLt?: string;
  rLt?: string;
  expiredTime?: number;
  deviceId?: string;
}

/**
 * 获取小红书主页 WebSocket 登录参数。
 * @param cookie
 * @param proxy
 * @param deviceId 设备标识
 */
export const getXiaohongshuhomeAlt = async (
  cookie: string,
  proxy?: IWebProxy,
  deviceId?: string,
): Promise<XiaohongshuhomeAltResult> => {
  const result: XiaohongshuhomeAltResult = { code: 0, msg: '成功' };

  try {
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }

    const altResult = await getXiaohongshuhomeAltRequest(cookie, webProxy, deviceId);
    result.code = altResult.code ?? altResult.result ?? -1;
    result.msg = altResult.msg;
    result.aLt = altResult.data?.a_lt;
    result.rLt = altResult.data?.r_lt;
    result.expiredTime = altResult.data?.expired_time;
    result.deviceId = altResult.deviceId;

    if (result.code === 0 && !result.aLt) {
      result.code = errorCode.exception;
      result.msg = '小红书主页WebSocket登录参数缺少aLt，请稍后重试';
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.msg = '获取小红书主页WebSocket登录参数网络异常，请稍后重试';
    } else if (e instanceof Error) {
      result.msg = e.message;
    } else {
      result.msg = '获取小红书主页WebSocket登录参数失败，请稍后重试';
    }
    result.code = errorCode.exception;
  }

  return result;
};

/**
 * 获取小红书首页用户信息
 * @param cookie
 * @param proxy
 */
export const getXiaohongshuhomeUserInfo = async (
  cookie: string,
  proxy?: IWebProxy,
): Promise<XiaohongshuhomeUserInfoResultOutput> => {
  const result: XiaohongshuhomeUserInfoResultOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfoResult = await getUserInfo(cookie, webProxy);

    result.yixiaoerId = userInfoResult?.data?.userId?.toString();
    result.yixiaoerName = userInfoResult?.data?.userName?.toString();
    result.yixiaoerImageUrl = userInfoResult?.data?.userAvatar;
    result.raw = userInfoResult.data;
    result.code = userInfoResult.code ?? userInfoResult.result;
    result.msg = userInfoResult.msg;
    result.data = userInfoResult.data;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.msg = '获取小红书首页用户信息网络异常，请稍后重试';
    } else if (e instanceof Error) {
      result.msg = e.message;
    } else {
      result.msg = '获取小红书首页用户信息失败，请稍后重试';
    }
    result.code = errorCode.exception;
  }

  return result;
};

export interface XiaohongshuhomeUserInfoResultOutput extends PlatformAuthorInfo {
  /**
   * 状态码 0:正常，非0异常，-100:登录失效
   */
  code: number;
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
  };
}
