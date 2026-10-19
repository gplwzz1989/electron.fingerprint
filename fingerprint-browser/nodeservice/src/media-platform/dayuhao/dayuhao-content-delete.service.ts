import { $http } from '@/http';

/**
 *
 * @param cookie
 * @param docId
 * @param rid
 * @param utoken
 * @param type 1001:文章 1002:端视频-横版
 */
export const deleteContent = async (
  cookie: string,
  docId: string,
  rid: string,
  utoken: string,
  type?: 1001 | 1002,
): Promise<DayuhaoDeleteContentResponse> => {
  const url = `https://mp.dayu.com/dashboard/onOffArticle`;
  const headers = {
    cookie: cookie,
    referer: 'https://mp.dayu.com',
    origin: 'https://mp.dayu.com',
    'Content-Type': 'application/x-www-form-urlencoded',
    utoken: utoken,
  };

  const postData = `_rid=${rid}&articleId=${docId}&type=del&formatType=${type}&utoken=${utoken}`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface DayuhaoDeleteContentResponse {
  error:  { message: string };
}

export const deleteMiniVideoContent = async (
  cookie: string,
  docId: string,
  rid: string,
  utoken: string,
): Promise<DayuhaoDeleteContentResponse> => {
  const url = `https://mp.dayu.com/dashboard/minivideo/deleteVideo`;
  const headers = {
    cookie: cookie,
    referer: 'https://mp.dayu.com',
    origin: 'https://mp.dayu.com',
    'Content-Type': 'application/x-www-form-urlencoded',
    utoken: utoken,
  };

  const postData = `_rid=${rid}&cid=${docId}&utoken=${utoken}`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};
