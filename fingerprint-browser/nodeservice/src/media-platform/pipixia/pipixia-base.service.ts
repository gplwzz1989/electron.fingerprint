import { $http } from '@/http';

export const getUserInfoResponse = async (cookie: string, proxyAgent?: object): Promise<PipixiaUserInfoResponse> => {
  const url = 'https://mp.pipix.com/api/mp/bds/webapi/author_profile/info/';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.pipix.com/mp/manage',
  };
  const result = await $http.get(url, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface PipixiaUserInfoResponse {
  /**
   * 0:正常 非0异常
   */
  status_code: number;
  message: string;
  prompt: string;
  time: number;
  data: {
    user: {
      id: number;
      /**
       * 用户id
       */
      id_str: string;
      /**
       * 用户昵称
       */
      name: string;
      /**
       * 头像信息
       */
      avatar: {
        /**
         * 头像图片列表
         */
        url_list: Array<{
          url: string;
        }>;
      };
      is_following: null;
      followers_count: null;
      followings_count: null;
      like_count: null;
      level: 0;
      description: '';
      profile_schema: string;
      is_followed: null;
      god_comment_count: null;
      vote_count: 0;
      certify_info: null;
      achievements: null;
      status: 0;
      author_info: null;
      broadcast_info: null;
      live_auth: false;
      region: 'cn';
      language: 'zh';
      punishments: null;
      recommend_tag: null;
      recommend_reason: null;
      commerce_permission_list: null;
      decoration_list: null;
      interaction_limitation: null;
      creative_level_info: null;
      gender: 0;
      age: '';
      horoscope: '';
      hide_age: false;
      liveing_info: null;
      medal_info: null;
    };
    profile_data: { apply_info: null; profile_info: null };
  };
}
