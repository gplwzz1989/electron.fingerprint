import { DouyinUserInfo } from './douyin-user.service';
import { $http, HttpConfig } from '../../http';
import { isJson } from '../../utils';

export const getUserList = async (
  cookie: string,
  keyWord: string,
  cursor: number = 0,
): Promise<DouyinUserListResponse> => {
  let url: string;
  if (!keyWord) {
    url = `https://creator.douyin.com/web/api/v2/user/recent/contact/?cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${encodeURIComponent(
      HttpConfig.userAgent,
    )}&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&_signature=_`;
  } else {
    url = `https://creator.douyin.com/web/api/v2/discover/search/?keyword=${encodeURIComponent(keyWord)}&cursor=${
      cursor * 10
    }&scene=1&search_source=publish_web&count=30&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${encodeURIComponent(
      HttpConfig.userAgent,
    )}&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128`;
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

  return result.data;
};

export interface DouyinUserListResponse {
  /**
   * 状态码
   * -0正常，非0异常
   */
  status_code: number;
  /**
   *提示消息
   */
  status_msg: string;

  /**
   * 用户列表
   */
  user_list: Array<DouyinUserInfo>;

  /**
   *是否还有更多
   */
  has_more: boolean;

  /**
   * 索引游标值
   */
  cursor: number;
}
