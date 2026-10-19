import { $http, HttpConfig } from '../../http';
import { isJson } from '../../utils';

export const getTopics = async (cookie: string, keyWord: string): Promise<douyinTopicsResponse> => {
  const url = `https://creator.douyin.com/aweme/v1/search/challengesug/?_signature=&aid=2906&browser_language=zh-CN&browser_name=Mozilla&browser_online=true&browser_platform=Win32&browser_version=${encodeURIComponent(
    HttpConfig.userAgent,
  )}&cookie_enabled=true&keyword=${encodeURIComponent(
    keyWord ?? '',
  )}&screen_height=1080&screen_width=1920&source=challenge_create&timezone_name=Asia%2FShanghai`;
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
  return result.data;
};

export interface douyinTopicsResponse {
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
   * 话题列表
   */
  sug_list: Array<DouyinTopicInfo>;
}

/**
 * 抖音话题
 */
export interface DouyinTopicInfo {
  /**
   * 话题名称
   */
  cha_name: string;
  /**
   * 阅读数
   */
  view_count: number;
  /**
   * 话题id
   */
  cid: string;
}
