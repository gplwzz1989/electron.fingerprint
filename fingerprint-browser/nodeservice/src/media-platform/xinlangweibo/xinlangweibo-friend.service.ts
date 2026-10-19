import { getXsrfToken } from './xinlangweibo-base.service';
import { $http } from '../../http';

/**
 * 获取好友列表
 * @param cookie
 * @param keyWord 筛选关键词，默认位空
 */
export const getFriendListResponse = async (
  cookie: string,
  keyWord: string = '',
): Promise<XinlangweiboFriendResponse> => {
  const url = 'https://www.weibo.com/ajax/mblog/attention?';

  const token = getXsrfToken(cookie);

  const params = {
    q: keyWord ?? '',
  };

  const headers = {
    cookie: cookie,
    'X-Requested-With': 'XMLHttpRequest',
    'client-version': 'v2.44.74',
    Referer: 'https://www.weibo.com/',
    'server-version': 'v2024.03.04.2',
    'X-XSRF-TOKEN': token,
  };

  const result = await $http.get(url, {
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface XinlangweiboFriendResponse {
  /**
   * 状态码
   * 1 正常
   * 非1异常
   */
  ok: number;
  /**
   * 好友列表信息
   */
  data: Array<XinlangweiboFriendInfo>;
}

export interface XinlangweiboFriendInfo {
  /**
   * 好友/用户id
   */
  uid: number;
  /**
   * 好友/用户昵称
   */
  screen_name: string;
  /**
   *
   */
  remark: string;
}
