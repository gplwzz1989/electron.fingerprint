import { $http } from '../../http';
import { regex } from './kuaishou-base.service';
import { Guid, isJson } from '../../utils';


export const getFriendResponse = async (cookie: string): Promise<KuaishouFriendResponse> => {
  const url = 'https://cp.kuaishou.com/rest/cp/works/v2/video/pc/at/list';

  const headers = {
    cookie: cookie,
    Referer: 'https://cp.kuaishou.com/article/publish/video',
  };

  const match = regex.exec(cookie);
  const webapiId = match ? match[1] : Guid.NewGuid().toString().replace(/-/g, '');
  const postData = {
    atType: 4,
    pageCount: 1,
    pageSize: 20,
    'kuaishou.web.cp.api_ph': webapiId,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export const searchFriendResponse = async (cookie: string, keyWord: string): Promise<KuaishouFriendResponse> => {
  const url = 'https://cp.kuaishou.com/rest/cp/works/v2/video/pc/at/search';

  const headers = {
    cookie: cookie,
    Referer: 'https://cp.kuaishou.com/article/publish/video',
  };

  const match = regex.exec(cookie);
  const webapiId = match ? match[1] : Guid.NewGuid().toString().replace(/-/g, '');
  const postData = {
    count: 30,
    page: 0,
    keyword: keyWord,
    'kuaishou.web.cp.api_ph': webapiId,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface KuaishouFriendResponse {
  /**
   * 状态码
   * 1正常 非1异常
   */
  result: number;
  currentTime: number;
  /**
   * 数据体
   */
  data?: {
    /**
     * 关注/好友列表
     */
    list: Array<KuaishouFriendInfo>;
  };
  message: string;
}

export interface KuaishouFriendInfo {
  /**
   * 用户昵称
   */
  userName: string;
  /**
   * 用户id
   */
  userId: number;
  /**
   * 粉丝数
   */
  fansCount: number;
  /**
   * 用户头像
   */
  headUrl: string;
}
