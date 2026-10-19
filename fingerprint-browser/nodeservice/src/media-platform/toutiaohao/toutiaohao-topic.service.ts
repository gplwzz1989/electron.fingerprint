import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { isJson } from '../../utils';

/**
 * 头条号图文/动态话题列表
 * @param cookie
 * @param keyWord 搜索关键字
 * @param type 1:文章  2：微头条
 */
export const getArticleTopicResponse = async (
  cookie: string,
  keyWord: string,
  type: 1 | 2 = 1,
): Promise<ToutiaohaoArticleTopicResponse> => {
  const result = await $http.get<unknown, AxiosResponse<ToutiaohaoArticleTopicResponse>>(
    'https://mp.toutiao.com/mp/agw/creator_helper/suggest_words',
    {
      retryCondition: (error, response) => {
        return !isJson(response.data);
      },
      headers: {
        cookie: cookie,
        referer: 'https://mp.toutiao.com/profile_v4/graphic/publish',
        authority: 'mp.toutiao.com',
      },
      params: {
        type: type,
        words: keyWord ?? '',
      },
    },
  );

  return result.data;
};

/**
 * 搜索视频话题，keyWord必须，否则没有数据
 * @param cookie
 * @param keyWord
 */
export const getVideoTopicResponse = async (cookie: string, keyWord: string): Promise<ToutiaohaoVideoTopicResponse> => {
  const url = 'https://mp.toutiao.com/video/app/hashtag/sug';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.toutiao.com/profile_v4/xigua/upload-video',
  };

  const params = {
    keyword: keyWord,
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface ToutiaohaoArticleTopicResponse {
  /**
   * 状态码，0:正常，非0异常
   */
  code: number;

  /**
   * 热门话题
   */
  hots: Array<ToutiaohaoArticleTopicInfo>;
  /**
   * 提示消息
   */
  message: string;

  /**
   * 最近使用
   */
  recents: Array<ToutiaohaoArticleTopicInfo>;
}

export interface ToutiaohaoArticleTopicInfo {
  concern_id: string;
  /**
   * 话题id
   */
  id: string;

  /**
   * 讨论数量
   */
  talk_count: string;

  /**
   * 讨论数量文字
   */
  talk_count_str: string;
  type: number;

  /**
   * 话题名称
   */
  word: string;
}

export interface ToutiaohaoVideoTopicResponse {
  /**
   * 状态码,0:正常，非0异常
   */
  code: number;
  /**
   * 话题列表
   */
  data?: Array<{
    /**
     * 话题名称
     */
    hashtag_name: string;
  }>;
  /**
   * 提示消息
   */
  message: string;
}
