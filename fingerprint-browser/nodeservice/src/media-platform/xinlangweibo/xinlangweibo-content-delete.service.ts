import { $http } from '@/http';

export const deleteContent = async (cookie: string, docId: string): Promise<XinlangweiboDeleteContentResponse> => {
  const url = `https://weibo.com/ajax/statuses/destroy`;
  const seps = cookie.split('XSRF-TOKEN=');
  const headers = {
    cookie: cookie,
    referer: 'https://weibo.com/u/3987146287?tabtype=feed',
    origin: 'https://weibo.com',
    'Content-Type': 'application/json;charset=UTF-8',
    'X-XSRF-TOKEN': seps?.length ? seps[1]?.split(';')[0] : '',
  };

  const postData = { id: docId };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface XinlangweiboDeleteContentResponse {
  /**
   * 1:正常 非1，失败
   */
  ok: number;
  message: string;
  error_code: number;
}

export const deleteArticleDraftContent = async (
  cookie: string,
  docId: string,
  uid: string,
): Promise<XinlangweiboDeleteArticleDraftResponse> => {
  const seps = cookie.split('XSRF-TOKEN=');
  const url = `https://card.weibo.com/article/v3/aj/editor/draft/delete?uid=${uid}&id=${docId}&vuid=&source=&_rid=`;
  const headers = {
    cookie: cookie,
    referer: 'https://weibo.com/u/',
    origin: 'https://weibo.com',
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-XSRF-TOKEN': seps?.length ? seps[1]?.split(';')[0] : '',
  };

  const postData = `id=${docId}&source=0&_rid=`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface XinlangweiboDeleteArticleDraftResponse {
  //100000;
  code: number;
  msg: string;
  data: { id: string };
}
