import { $http, HttpConfig } from '../../http';
import { isJson } from '../../utils';

export const getHotEvents = async (cookie: string, keyWord: string): Promise<hotEventsResponse> => {
  let url = `https://creator.douyin.com/aweme/v1/hotspot/recommend/?zip_uri=&aid=1128&aweme_name=aweme&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${encodeURIComponent(
    HttpConfig.userAgent,
  )}&browser_online=true&timezone_name=Asia%2FShanghai`;
  if (keyWord) {
    url = `https://creator.douyin.com/aweme/v1/hotspot/search/?query=${encodeURIComponent(
      keyWord,
    )}&count=50&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${encodeURIComponent(
      HttpConfig.userAgent,
    )}&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&_signature=`;
  }
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
  if (result.data && !result.data.sentences) {
    result.data.sentences = result.data.all_sentences;
  }

  return result.data;
};

export interface hotEventsResponse {
  /**
   * 状态码
   */
  status_code: number;

  /**
   * 提示消息
   */
  status_msg: string;

  /**
   * 热点列表
   */
  sentences: Array<DouyinHotEventInfo>;
}

/**
 *  热点信息
 */
export interface DouyinHotEventInfo {
  /**
   * 热点下视频数量
   */
  video_count: number;
  /**
   * 热点类型
   */
  word_type: number;
  /**
   * 热点名称
   */
  word: string;
  /**
   * 分组id，暂时无用
   */
  group_id: string;
  /**
   * 热点id，发布时使用
   */
  sentence_id: string;
  hot_value:number;
  /**
   * 热点封面
   */
  word_cover: {
    uri: string;
    url_list: Array<string>;
  };
}
