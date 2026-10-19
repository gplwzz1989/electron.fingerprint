import { GetMD5, Guid } from '@/utils';
import { $http } from '@/http';

export const searchYichehaoTopic = async (cookie: string, keyword?: string): Promise<YiCheHaoTopicResponse> => {
  const now = Date.now();

  const postData = {
    cid: '508',
    ver: undefined,
    param: { keyword: keyword ?? '', contentType: 56, searchId: Guid.NewGuid().toString() },
  };

  const signStr =
    'cid=' + postData.cid + '&param=' + JSON.stringify(postData.param) + `19DDD1FBDFF065D3A4DA777D2D7A81EC${now}`;
  const sign = GetMD5(signStr);
  const url = `https://mapi.yiche.com/information_api/api/v1/topic/get_topic_list_by_search_word`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yiche.com/',
    Origin: 'https://mp.yiche.com',
    'Content-Type': 'application/json',
    'x-city-id': '',
    'x-ip-address': '',
    'x-platform': 'pc',
    'x-sign': sign,
    'x-timestamp': now,
  };

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

export interface YiCheHaoTopicResponse {
  /**
   * '1':成功
   */
  status: string;
  message: string;
  data: {
    list: Array<YiCheHaoTopicItem>;
    userFlag: null;
    total: number;
  };
  ercd: string;
}

export interface YiCheHaoTopicItem {
  id: number;
  name: string;
  cover: string;
  coverWp: string;
  summary: string;
  createTime: string;
  pv: string;
  title: null;
  visitCount: null;
  categoryId: number;
  serialId: number;
  backgroundPicture: string;
}
