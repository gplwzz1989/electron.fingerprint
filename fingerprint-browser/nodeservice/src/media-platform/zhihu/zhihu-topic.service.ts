import { $http } from '../../http';
import { AxiosResponse } from 'axios';

/**
 * 获取话题列表
 * @param cookie
 * @param keyword 搜索关键字
 */
export const getTopicListAsync = async (cookie: string, keyword: string): Promise<Array<ZhihuTopicInfo>> => {
  const url = 'https://zhuanlan.zhihu.com/api/autocomplete/topics';
  const result = await $http.get<unknown, AxiosResponse<Array<ZhihuTopicInfo>>>(url, {
    headers: {
      cookie: cookie,
      authority: 'zhuanlan.zhihu.com',
    },
    params: {
      token: keyword ?? '',
      max_matches: 5,
      use_similar: 0,
      topic_filter: 1,
    },
  });

  return result.data;
};

export interface ZhihuTopicInfo {
  introduction: string;
  avatar_url: string;
  /**
   * 话题名称
   */
  name: string;
  url: string;
  type: string;
  excerpt: string;
  /**
   * 话题id
   */
  id: string;
}
