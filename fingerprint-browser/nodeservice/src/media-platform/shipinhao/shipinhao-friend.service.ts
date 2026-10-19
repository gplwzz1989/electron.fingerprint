import { $http } from '../../http';
import { GetTimeStamp, isJson } from '../../utils';

/**
 * 获取用户列表信息
 * @param cookie
 * @param keyWord  搜索关键词
 * @param finderUsername 可选，默认空
 * @param pageNum 翻页页码，默认首页为1
 */
export const getUserListResponse = async (
  cookie: string,
  keyWord: string,
  finderUsername: string,
  pageNum: number = 1,
): Promise<ShipinhaoFriendResponse> => {
  const url = 'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/helper/helper_search_finder_account';

  const headers = {
    referer: 'https://channels.weixin.qq.com/platform/post/create',
    cookie: cookie,
  };

  const postData = {
    pageSize: 10,
    currentPage: pageNum,
    offset: 0,
    query: keyWord ?? '',
    timestamp: GetTimeStamp(13),
    _log_finder_uin: '',
    _log_finder_id: finderUsername,
    rawKeyBuff: null,
    pluginSessionId: null,
    scene: 7,
    reqScene: 7,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface ShipinhaoFriendResponse {
  /**
   * 状态码
   */
  errCode: number;
  /**
   * 提示消息
   */
  errMsg: string;
  /**
   * 数据体
   */
  data: {
    /**
     *好友/用户信息列表
     */
    list: Array<ShipinhaoFriendInfo>;
    /**
     * 总数量
     */
    totalCount: 2224;
  };
}

export interface ShipinhaoFriendInfo {
  /**
   * 用户finderUsername
   */
  username: string;
  /**
   * 用户头像url
   */
  headImgUrl: string;
  /**
   * 用户昵称
   */
  nickName: string;
  /**
   *认证图标url
   */
  authImgUrl: string;
}
