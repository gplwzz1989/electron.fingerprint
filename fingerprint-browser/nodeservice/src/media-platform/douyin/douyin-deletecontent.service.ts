import { $http, HttpConfig } from '../../http';
import { isJson } from '../../utils';

export const deleteContent = async (cookie: string, docId: string): Promise<deleteContentResponse> => {
  const url = `https://creator.douyin.com/web/api/media/aweme/delete/?cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${encodeURIComponent(
    HttpConfig.userAgent,
  )}&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&msToken=`;
  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/content/manage',
    origin: 'https://creator.douyin.com',
    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
  };

  const postData = `item_id=${docId}`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface deleteContentResponse {
  /**
   * 状态码
   * -0:成功 ，非0表示出错
   */
  status_code: number;
  /**
   * 提示消息
   */
  status_msg: string;
}
