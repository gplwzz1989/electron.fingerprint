import { $http } from '../../http';
import { isJson } from '../../utils';

/**
 * 搜索话题
 * @param cookie
 * @param keyWord
 */
export const getTopicListResponse = async (cookie: string, keyWord: string): Promise<XinlangweiboTopicResponse> => {
  const url = 'https://weibo.com/ajax/mblog/topic';

  const headers = {
    cookie: cookie,
    'X-XSRF-TOKEN': cookie?.split('XSRF-TOKEN=')[1]?.split(';')[0],
    Referer: 'https://weibo.com/',
    'client-version': 'v2.46.6',
    'server-version': 'v2024.08.27.1',
  };
  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: {
      q: keyWord ?? '',
    },
  });
  return result.data;
};

export interface XinlangweiboTopicResponse {
  ok: number;
  data: Array<WeiboTopicInfo>;
}

export interface WeiboTopicInfo {
  /**
   * 话题名称
   */
  topic: string;

  /**
   * 话题id,新浪微博没有id，这里是随机guid
   */
  id: string;
}
