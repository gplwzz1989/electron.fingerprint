import { $http } from '../../http';
import { isJson } from '../../utils';

export const getTopics = async (cookie: string, keyWords: Array<string>): Promise<XiguashipinTopicSearchResponse> => {
  const url = 'https://studio.ixigua.com/video/app/hashtag/create';
  const postDataStr = JSON.stringify({ hashtag_name: keyWords });
  const headers = {
    cookie: cookie,
    'Content-type': 'application/json',
    referer: 'https://studio.ixigua.com/upload?from=post_article',
  };
  const result = await $http.post(url, postDataStr, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });
  return result.data;
};

export const getTopicsWords = async (cookie: string, keyWord: string): Promise<XiguashipinTopicSearchResponse> => {
  const url = `https://studio.ixigua.com/video/app/hashtag/sug?keyword=${encodeURIComponent(keyWord ?? '')}`;
  const headers = {
    cookie: cookie,
    referer: 'https://studio.ixigua.com/upload?from=post_article',
  };
  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });
  return result.data;
};

export class XiguashipinTopicSearchResponse {
  code: number = 0;
  data: Array<XiguashipinTopicInfo> = [];
  message: string = '';
}
export class XiguashipinTopicInfo {
  /**
   * 话题名称
   */
  hashtag_name: string = '';

  /**
   * 话题名称
   */
  name: string = '';
  /**
   * 话题id
   */
  id_str?: string = '';
}
