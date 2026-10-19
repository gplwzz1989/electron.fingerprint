import { getAuthKey, getSdkToken } from '../douyin/douyin-base.service';
import { AxiosError } from 'axios';
import {
  DouyinUserInfo,
  getMediaUserAnchor,
  getMediaUserInfo,
  getSyncAppListResponse,
  getUserPositionPrivilege,
  getUserShopPrivilege,
} from '../douyin/douyin-user.service';
import { errorCode } from '../errorCode';
import { ListInfoResponse, PlatformAuthorInfo } from '@/media-platform';
import { createKuaiProxyAgent, IWebProxy } from '@/media-platform/webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { BaseResult } from '@/media-platform/baseResult';

/**
 * 获取抖音账号状态
 * -返回 code为0表示正常，非0表示异常，msg为提示消息
 * @param cookie
 */
export const getDouyinUserStatus = async (cookie: string): Promise<DouyinUserStatusOutput> => {
  const result = { code: 0, msg: '' };

  try {
    const checkResult = await getAuthKey(cookie);
    result.code = checkResult.status_code;
    result.msg = checkResult.status_msg;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

/**
 * 获取账号能使用的地点类型
 * @param cookie
 * @return locationType 支持的类型数组，默认所有账号都有默认值0，表示本地地点，2表示支持国内地点，3表示支持海外地点
 */
export const getDouyinLocationType = async (cookie: string): Promise<DouyinUserLocationTypeOutput> => {
  const result: DouyinUserLocationTypeOutput = {
    code: 0,
    msg: '',
    locationType: [0],
  };
  try {
    const locationResult = await getUserPositionPrivilege(cookie);
    result.code = locationResult.status_code;
    result.msg = locationResult.status_msg;
    if (locationResult?.has_promote_auth == true) {
      result.locationType.push(2);
    }
    if (locationResult?.is_oversea == true) {
      result.locationType.push(3);
    }
    result.hasPromoteAuth = locationResult.has_promote_auth ?? false;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};

export const getDouyinSyncAppList = async (cookie: string): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
  };
  result.dataList = [];
  try {
    const locationResult = await getSyncAppListResponse(cookie);
    result.code = locationResult.status_code;
    result.msg = locationResult.status_msg;
    if (locationResult?.data?.limit_app_groups?.length) {
      let i = 1;
      for (const item of locationResult.data.limit_app_groups) {
        const id = item?.client_keys?.length ? item.client_keys[0] : i.toString();
        result.dataList.push({ yixiaoerId: id, yixiaoerName: item.name, yixiaoerImageUrl: item.icon, raw: item });
        i++;
      }
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};

/**
 * 获取账号是否有商品挂车权限
 * @param cookie
 * @return isOverBindCnt 为true表示有权限，否则没有
 */
export const getDouyinShopOverLimit = async (cookie: string): Promise<DouyinUserShopEnableOutput> => {
  const result: DouyinUserShopEnableOutput = {
    code: 0,
    msg: '',
    isOverBindCnt: false,
    is_over_bind_cnt: false,
  };
  try {
    const shopResult = await getUserShopPrivilege(cookie);
    result.code = shopResult.status_code;
    result.msg = shopResult.status_message;
    if (shopResult?.is_over_bind_cnt == true) {
      result.isOverBindCnt = true;
      result.is_over_bind_cnt = true;
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};

/**
 * 获取sdkToken，整个账号通用
 * @param cookie
 */
export const getDouyinUserSdkToken = async (
  cookie: string,
  proxy?: undefined | object,
): Promise<DouyinSdkTokenOutput> => {
  const result: DouyinSdkTokenOutput = {
    code: 0,
    msg: '',
  };
  try {
    result.token = await getSdkToken(cookie, 0, proxy);
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};

/**
 * 获取账号是否有挂载小程序权限
 * @param cookie
 * @return isEnableAnchor4 为true表示有权限，否则没有
 */
export const getDouyinUserMiniAppPrivilege = async (cookie: string): Promise<DouyinUserMiniAppEnableOutput> => {
  const result: DouyinUserMiniAppEnableOutput = {
    code: 0,
    msg: '',
    isEnableAnchor4: false,
  };
  try {
    const appResult = await getMediaUserInfo(cookie);
    result.code = appResult.status_code;
    result.msg = appResult.status_msg;
    result.isEnableAnchor4 = appResult?.user?.permission?.anchor?.includes(4) ?? false;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};

/**
 * 获取用户信息
 * @param cookie
 * @param proxy
 */
export const getDouyinUserInfo = async (cookie: string, proxy?: IWebProxy): Promise<DouyinUserInfoOutput> => {
  const result: DouyinUserInfoOutput = {
    code: 0,
    msg: '',
  };
  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userResult = await getMediaUserInfo(cookie, webProxy);
    result.yixiaoerId = userResult?.user?.uid?.toString();
    result.yixiaoerName = userResult?.user?.nickname?.toString();
    result.yixiaoerImageUrl = userResult?.user?.avatar_thumb?.url_list[0];
    result.raw = userResult?.user;
    result.code = userResult.status_code;
    result.msg = userResult.status_msg;
    result.user = userResult.user;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
    result.code = errorCode.exception;
  }

  return result;
};

declare interface DouyinUserInfoOutput extends PlatformAuthorInfo {
  /**
   * 状态码
   *  - 0：正常，非0异常
   *  - 8：登录失效/未登录
   */
  code: number;
  /**
   * 提示消息
   * - 提示消息:用户未登录 表示登录无效/失效
   */
  msg?: string;
  /**
   * 用户消息
   */
  user?: DouyinUserInfo;
}
export type { DouyinUserInfoOutput };

export interface DouyinUserMiniAppEnableOutput {
  /**
   *  状态码
   *  -0表示账号正常，非0异常
   */
  code: number;
  /**
   * 提示消息
   */
  msg?: string;

  /**
   * 是否支持挂小程序
   */
  isEnableAnchor4: boolean;
}

export interface DouyinSdkTokenOutput {
  /**
   * 状态码
   * -0正常，非0异常
   */
  code: number;
  /**
   * 提示消息
   */
  msg: string;
  /**
   * sdktoken，部分接口需要
   */
  token?: string;
}
export interface DouyinUserShopEnableOutput {
  /**
   *  状态码
   *  -0表示账号正常，非0异常
   */
  code: number;
  /**
   * 提示消息
   */
  msg: string;

  /**
   * 已使用挂车数量是否超出限制
   */
  isOverBindCnt: boolean;
  /**
   * 已使用挂车数量是否超出限制
   */
  is_over_bind_cnt?: boolean;
}

export interface DouyinUserLocationTypeOutput {
  /**
   *  状态码
   *  -0表示账号正常，非0异常
   */
  code: number;
  /**
   * 提示消息
   */
  msg: string;

  /**
   * 地点类型数组
   * 0:表示本地地点
   * 2:表示国内地址
   * 3:表示海外地址
   */
  locationType: Array<number>;

  /**
   * 是否具有推广权限，当为true时为有权限，否则为没有权限
   */
  hasPromoteAuth?: boolean;
}

export interface DouyinUserStatusOutput {
  /**
   *  状态码
   *  0表示账号正常，非0异常
   */
  code: number;
  /**
   * 提示消息
   */
  msg: string;
}

export const getDouyinPublishAnchorPrivilege = async (cookie: string): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    const appResult = await getMediaUserAnchor(cookie);
    result.code = appResult.status_code;
    result.msg = appResult.status_msg;
    result.data = appResult.availableAnchor;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};
