import { $http } from '@/http';

export const getWeishiTopicsResponse = async (cookie: string, keyWord?: string): Promise<WeishiTopicResponse> => {
  const url = `https://media.weishi.qq.com/media-api/GetTopicListByKeyword?data=%7B%22keyword%22%3A%22${encodeURIComponent(
    keyWord ?? '',
  )}%22%2C%22attachInfo%22%3A%22%22%7D`;

  const headers = {
    cookie: cookie,
    referer: 'https://media.weishi.qq.com',
    Origin: 'https://media.weishi.qq.com',
  };

  const result = await $http.get(url, { headers: headers });

  return result.data;
};

export interface WeishiTopicResponse {
  code: number;
  msg: string;
  topicList: Array<WeishiTopicInfo>;
  isFinished: 0;
  attachInfo: '{"start":5,"stop":9}';
}

export interface WeishiTopicInfo {
  /**
   *   话题id
   */
  id: string;
  /**
   * 话题显示名称
   */
  name: string;
}
