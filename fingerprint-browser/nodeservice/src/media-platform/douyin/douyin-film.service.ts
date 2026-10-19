import { $http, HttpConfig } from '@/http';

export const getFilmListResponse = async (cookie: string, keyWord?: string): Promise<DouYinFilmResponse> => {
  const url = `https://creator.douyin.com/web/api/medium/search/?count=12&keyword=${encodeURIComponent(
    keyWord ?? '',
  )}&offset=0&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${encodeURIComponent(
    HttpConfig.userAgent,
  )}&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&support_h265=1&msToken=&a_bogus=`;
  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/content/post/video?enter_from=publish_page',
  };
  const result = await $http.get(url, {
    headers: headers,
  });

  return result.data;
};

export interface DouYinFilmResponse {
  offset: number;
  has_more: boolean;
  extra: {
    now: number; // 毫秒级时间戳
    logid: string;
  };
  status_code: number;
  status_msg: string;
  search_list: Array<{
    /**
     * 类型
     */
    type: number;
    /**
     * 播放量
     */
    play_cnt: number;
    /**
     * 封面
     */
    poster: {
      uri: string;
      url_list: string[];
    };
    /**
     * 类型名称 '电影'
     */
    type_name: string;
    /**
     * 电影id
     */
    id: string;
    /**
     * 影片名称
     */
    name: string;
  }>;
}
