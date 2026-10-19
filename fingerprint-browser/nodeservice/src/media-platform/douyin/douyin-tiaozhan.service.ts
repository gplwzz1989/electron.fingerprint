import { $http } from '../../http';
import { isJson } from '../../utils';

export const getTiaoZhanResponse = async (cookie: string, sdkToken?: string): Promise<DouyinTiaozhanResponse> => {
  const url =
    'https://creator.douyin.com/aweme/v1/flashmob/rank/?source=1&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=5.0+(Windows+NT+10.0%3B+Win64%3B+x64)+AppleWebKit%2F537.36+(KHTML%2C+like+Gecko)+Chrome%2F108.0.5359.215+Safari%2F537.36&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&msToken=';
  const headers = {
    cookie: cookie,
    'x-secsdk-csrf-token': sdkToken,
    referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });
  return result?.data;
};
export interface DouyinTiaozhanResponse {
  /**
   * 状态码
   */
  status_code: number;
  /**
   * 提示消息
   */
  status_msg: string;
  /**
   * 挑战列表
   */
  rank_cell_list: Array<DouyinTiaozhanInfo>;
}
export interface DouyinTiaozhanInfo {
  /**
   * 挑战id
   */
  flash_mob_id: string;

  /**
   * 更拍数
   */
  count: number;
  /**
   * 挑战名称
   */
  text: string;
  /**
   * 排序序号
   */
  order: number;

  /**
   * 封面
   */
  cover: {
    /**
     * 封面列表
     */
    url_list: Array<string>;
  };
}

export const searchTiaoZhanResponse = async (
  cookie: string,
  keyWords?: Array<string>,
): Promise<DouyinSearchTiaozhanResponse> => {
  const url = `https://creator.douyin.com/web/api/media/flash_mob/infos?flash_mob_text=${encodeURIComponent(
    JSON.stringify(keyWords),
  )}&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=5.0+(Windows+NT+10.0%3B+Win64%3B+x64)+AppleWebKit%2F537.36+(KHTML%2C+like+Gecko)+Chrome%2F108.0.5359.215+Safari%2F537.36&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&support_h265=0&msToken=&a_bogus=`;
  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });
  return result?.data;
};

export interface DouyinSearchTiaozhanResponse {
  status_code: number;
  status_msg: string;
  flash_mob_info_map: [
    {
      flash_mob_infos: {
        count: number;
        cover: {
          url_list: Array<string>;
        };
        id: string;
        user_avatar_list: null;
      };
      flash_mob_text: string;
    },
  ];
}

export const getTiaoZhanRecommendKeyResponse = async (
  cookie: string,
  keyWord?: string,
): Promise<DouYinTiaoZhanRecommendKeyResponse> => {
  const url = `https://creator.douyin.com/aweme/v1/flashmob/shoot/recommend/?recommend_type=2&query=${
    keyWord ?? ''
  }&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=5.0+%28Windows+NT+10.0%3B+Win64%3B+x64%29+AppleWebKit%2F537.36+%28KHTML%2C+like+Gecko%29+Chrome%2F108.0.5359.215+Safari%2F537.36&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&support_h265=0&msToken=`;
  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });
  return result?.data;
};

export interface DouYinTiaoZhanRecommendKeyResponse {
  recommend_list: [
    {
      text: string;
    },
  ];
}
