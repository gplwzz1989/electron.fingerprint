import { $http, HttpConfig } from '../../http';
import { isJson } from '../../utils';

export const getCollectionList = async (cookie: string): Promise<douyinCollectionResponse> => {
  const url = `https://creator.douyin.com/web/api/mix/list/?should_query_new_mix=1&status=0,2&count=15&cursor=0&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${encodeURIComponent(
    HttpConfig.userAgent,
  )}&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&_signature=`;
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

export interface douyinCollectionResponse {
  /**
   *  状态码
   *  -0正常，非0异常
   */
  status_code: number;

  /**
   * 提示消息
   */
  status_msg: string;

  /**
   *合集列表
   */
  mix_list: Array<DouyinCollectionInfo>;
}

/**
 * 抖音合集
 */
export interface DouyinCollectionInfo {
  cover_url: {
    /**
     * 封面url
     */
    url_list: Array<string>;
  };
  /**
   * 创建时间
   */
  create_time: number;
  /**
   * 描述
   */
  desc: string;
  /**
   * 合集ID
   */
  mix_id: string;
  /**
   * 合集名称
   */
  mix_name: string;
  statis: {
    collect_vv: number;
    current_episode: number;
    play_vv: number;
    /**
     * 已经更新的集数,下一次使用合集时用该值
     */
    updated_to_episode: number;
  };
  type: number;
}
