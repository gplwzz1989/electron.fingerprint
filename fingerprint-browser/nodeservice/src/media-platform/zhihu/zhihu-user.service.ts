import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 知乎首页数据
 * @param cookie
 * @param proxyAgent
 */
export const getUserHomeDataAsync = async (
  cookie: string,
  proxyAgent?: HttpsProxyAgent<string> | object | undefined,
): Promise<ZhihuUserHomeDataResponse> => {
  const result = await $http.get<unknown, AxiosResponse<ZhihuUserHomeDataResponse>>(
    'https://www.zhihu.com/api/v4/creators/new_task/homepage_card',
    {
      headers: {
        cookie: cookie,
        referer: 'https://www.zhihu.com/creator',
        authority: 'www.zhihu.com',
      },
      params: {},
      httpsAgent: proxyAgent,
      httpAgent: proxyAgent,
    },
  );

  return result.data;
};

export interface ZhihuUserHomeDataResponse {
  msg: string;
  code: string;
  list: [
    {
      token: string;
      data: {
        today_income: number;
        total_income: number;
        yesterday_income: number;
      };
    },
    {
      token: string;
      data: {
        interaction: {
          total_follower_count: number;
          yesterday_follower_count: number;
          total_read_count: number;
          yesterday_read_count: number;
          today_read_count: number;
          total_upvoted_count: number;
          yesterday_upvoted_count: number;
          today_upvoted_count: number;
          total_video_play_num: number;
          yesterday_video_play_num: number;
          total_comment_num: number;
          yesterday_comment_num: number;
          total_thanked_num: number;
          yesterday_thanked_num: number;
          total_collected_num: number;
          yesterday_collected_num: number;
          total_7d_read_count: number;
          total_7d_upvoted_count: number;
        };
      };
    },
  ];
}

/**
 * 获取用户信息
 * @param cookie
 * @param proxyAgent
 */
export const getUserInfoAsync = async (
  cookie: string,
  proxyAgent?: HttpsProxyAgent<string> | object | undefined,
): Promise<ZhihuUserInfoResponse> => {
  const result = await $http.get<unknown, AxiosResponse<ZhihuUserInfoResponse>>('https://www.zhihu.com/api/v4/me', {
    headers: {
      cookie: cookie,
      referer: 'https://www.zhihu.com/creator',
      authority: 'www.zhihu.com',
    },
    params: {
      include:
        'is_realname,available_message_types,default_notifications_count,follow_notifications_count,vote_thank_notifications_count,messages_count,email,account_status,is_bind_phone,name,is_destroy_waiting',
    },
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface ZhihuUserInfoResponse {
  error?: {
    code: number;
    name: string;
    message: string;
  };
  id: string;
  url_token: string;
  name: string;
  use_default_avatar: boolean;
  avatar_url: string;
  avatar_url_template: string;
  is_org: boolean;
  type: string;
  url: string;
  user_type: string;
  headline: string;
  headline_render: string;
  gender: number;
  is_advertiser: boolean;
  ip_info: string;
  vip_info: {
    is_vip: boolean;
    vip_type: number;
    rename_days: string;
    entrance_v2: null;
    rename_frequency: number;
    rename_await_days: number;
  };
  account_status: Array<string>;
  is_destroy_waiting: boolean;
  answer_count: number;
  question_count: number;
  articles_count: number;
  columns_count: number;
  zvideo_count: number;
  favorite_count: number;
  pins_count: number;
  voteup_count: number;
  thanked_count: number;
  available_medals_count: number;
  uid: string;
  email: string;
  default_notifications_count: number;
  follow_notifications_count: number;
  vote_thank_notifications_count: number;
  messages_count: number;
  creation_count: number;
  is_bind_phone: boolean;
  is_realname: boolean;
  has_applying_column: boolean;
  has_add_baike_summary_permission: boolean;
  editor_info: Array<string>;
  available_message_types: Array<string>;
}
