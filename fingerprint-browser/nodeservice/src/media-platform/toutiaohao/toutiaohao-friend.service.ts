import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';

/**
 * 头条号获取好友
 * @param cookie
 * @param word 搜索关键字
 */
export const getFriendListAsync = async (cookie: string, word: string): Promise<ToutiaohaoFriendListResponse> => {
  const result = await $http.get<unknown, AxiosResponse<ToutiaohaoFriendListResponse>>(
    'https://mp.toutiao.com/mp/agw/creator_helper/suggest_words',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.toutiao.com/profile_v4/graphic/publish',
        authority: 'mp.toutiao.com',
      },
      params: {
        type: 1,
        word: word,
      },
    },
  );

  // 请求失败
  if (result.data.code !== 0) {
    throw new BadRequestException(result.data?.message, result.data?.code, result.data);
  }

  return result.data;
};

export interface ToutiaohaoFriendListResponse {
  code: number;
  message: string;
  recents: Array<{
    id: string;
    type: number;
    word: string;
  }>;
}
