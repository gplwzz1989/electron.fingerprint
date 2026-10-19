import { $http } from '../../http';
import { isJson } from '../../utils';

/**
 * 获取好友数据
 * @param cookie
 * @param keyWord 搜索关键词
 * @param pageNum 翻页页码，默认1
 */
export const getFriendListResponse = async (
  cookie: string,
  keyWord: string,
  pageNum: number = 1,
): Promise<XiaohongshuFriendResponse> => {
  const url = 'https://edith.xiaohongshu.com/web_api/sns/v1/search/user_info';

  const headers = {
    cookie: cookie,
    referer: 'https://ark.xiaohongshu.com',
    Authorization: '',
    Origin: 'https://ark.xiaohongshu.com',
  };

  const postData = {
    keyword: keyWord ?? '',
    search_id: new Date().getTime().toString(),
    page: { page_size: 20, page: pageNum > 0 ? pageNum : 1 },
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface XiaohongshuFriendResponse {
  /**
   * 状态码 0正常 非0异常
   */
  code: number;
  /**
   * 错误消息
   */
  msg?: string;
  /**
   * 数据体
   */
  data?: {
    /**
     * 用户列表
     */
    user_info_dtos: [
      {
        /**
         * 用户详细信息
         */
        user_base_dto: XiaohongshushopFriendInfo;
        /**
         * 粉丝数
         */
        fans_total: number;
      },
    ];
  };
}

export interface XiaohongshushopFriendInfo {
  desc?: string;
  /**
   * 头像url
   */
  image: string;
  red_official_verify_type?: number;
  show_red_official_verify_icon?: boolean;
  group_id?: string;
  /**
   * 小红书号
   */
  red_id: string;
  /**
   * 用户id
   */
  user_id: string;
  /**
   * 用户昵称
   */
  user_nickname: string;
  /**
   * 头像大图
   */
  image_size_large: string;
  /**
   * 是否关注
   */
  followed: boolean;
  /**
   * 是否小红书官方认证
   */
  red_official_verified: boolean;
}
