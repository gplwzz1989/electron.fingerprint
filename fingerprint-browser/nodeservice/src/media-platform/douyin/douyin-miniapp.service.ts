import { $http, HttpConfig } from '../../http';
import { isJson } from '../../utils';

export const parseMiniAppInfo = async (
  cookie: string,
  appUrl: string,
  sdkToken: string,
): Promise<douyinMiniAppInfoResponse> => {
  const url = `https://creator.douyin.com/web/api/media/anchor/search/?cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${encodeURIComponent(
    HttpConfig.userAgent,
  )}&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&_signature=`;
  const headers = {
    cookie: cookie,
    'x-secsdk-csrf-token': sdkToken,
    referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
  };
  const postData = 'keyword=' + encodeURIComponent(appUrl) + '&anchor_type=4';
  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });
  return result?.data;
};

export interface douyinMiniAppInfoResponse {
  /**
   * 状态码
   * -0正常，非0异常
   */
  status_code: number;

  /**
   * 提示消息
   */
  status_msg: string;

  /**
   * 小程序/挂载项目列表
   */
  anchor_list: Array<DouyinMiniAppInfo>;
}

/**
 * 抖音小程序信息
 */
export interface DouyinMiniAppInfo {
  enable_mount: boolean;
  extra: string;
  /**
   * 小程序id
   */
  id: string;
  /**
   *小程序名称
   */
  name: string;
  /**
   * 小程序图片
   */
  poster: {
    url_list: Array<string>;
  };
  /**
   * 描述
   */
  summary: string;
  /**
   * 挂载类型
   */
  type: 4;

  reason?: string;
}

export const checkMiniAppEnable = async (
  cookie: string,
  appId: string,
  sdkToken: string,
): Promise<DouYinMiniAppCheckResponse> => {
  const url = `https://creator.douyin.com/web/api/media/user/anchor/check?item_type=1&select_anchor=4&applet_id=${appId}&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${encodeURIComponent(
    HttpConfig.userAgent,
  )}&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&support_h265=1&msToken=&a_bogus=`;
  const headers = {
    cookie: cookie,
    'x-secsdk-csrf-token': sdkToken,
    referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
  };
  const result = await $http.get(url, {
    headers: headers,
  });
  return result?.data;
};
export interface DouYinMiniAppCheckResponse {
  ok: boolean;
  reason: string; //'不满足图文有效粉丝数门槛1000，无法使用{anchor_name}标签';
  status_code: number;
  status_msg: string;
  unavailable_type: string;
}
