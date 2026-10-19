import { $http } from '../../http';
import { isJson } from '../../utils';

/**
 * 获取B站视频话题
 * @param cookie
 * @param keyWord 搜索关键词
 * @param mid 用户id
 */
export const getVideoFriendResponse = async (
  cookie: string,
  keyWord: string = '',
  mid?: number,
): Promise<BilibiliVideoTopicResponse> => {
  const url = 'https://api.bilibili.com/x/polymer/web-dynamic/v1/mention/search';

  const headers = {
    cookie: cookie,
    Referer: 'https://member.bilibili.com/',
  };

  const params = {
    uid: mid ?? '',
  };
  if (keyWord) {
    params['keyword'] = keyWord;
  }

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface BilibiliVideoTopicResponse {
  /**
   * 状态码 0正常 非0异常
   */
  code: number;
  /**
   * 提示消息
   */
  message: string;
  /**
   * 数据体
   */
  data: {
    /**
     * 用户组
     */
    groups: Array<{
      group_name: string;
      /**
       * 关注/用户列表
       */
      items: Array<BilibiliVideoFriendInfo>;
    }>;
  };
}

export interface BilibiliVideoFriendInfo {
  /**
   *  头像
   */
  face: string;
  /**
   * 粉丝数
   */
  fans: number;
  /**
   * 用户昵称
   */
  name: string;
  /**
   * 用户id
   */
  uid: string;
}
