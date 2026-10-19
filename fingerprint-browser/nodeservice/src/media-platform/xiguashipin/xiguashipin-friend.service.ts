import { $http } from '../../http';
import { isJson } from '../../utils';

export const getFriendResponse = async (cookie: string, keyWord: string): Promise<XiguashipinFriendResponse> => {
  const url = `https://studio.ixigua.com/ugc/publish/post/v1/suggest/?words=${encodeURIComponent(keyWord)}&offset=0`;
  const headers = {
    cookie: cookie,
    referer: 'https://studio.ixigua.com/upload?from=post_article',
  };
  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });
  return result.data;
};

export class XiguashipinFriendResponse {
  err_no: number = 0;
  message: string = '';
  data?: {
    suggest: Array<{ user: { info: XiguashipinFriendInfo } }>;
  };
}

export class XiguashipinFriendInfo {
  /**
   * 名称
   */
  name: string = '';
  /**
   * 名称
   */
  userName: string = '';
  /**
   * 用户id
   */
  user_id: string = '';

  /**
   * 头像url
   */
  avatar_url: string = '';
}
