import { $http } from '@/http';

/**
 *
 * @param cookie
 * @param docId
 * @param wemediaId
 * @param realUserId
 * @param type 1:文章 ，2：视频
 */
export const deleteContent = async (
  cookie: string,
  docId: string,
  wemediaId: string,
  realUserId: string,
  type: 1 | 2,
): Promise<WangyihaoDeleteContentResponse> => {
  const url = `https://mp.163.com/wemedia/content/manage/oper.do`;
  const headers = {
    cookie: cookie,
    referer: 'https://mp.163.com/subscribe_v4/index.html',
    origin: 'https://mp.163.com',
  };

  const params = {
    _: Date.now(),
    wemediaId: wemediaId,
    realUserId: realUserId,
    articleId: docId,
    operation: 'offline',
    contentType: type,
  };

  const postData = '';

  const result = await $http.post(url, postData, {
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface WangyihaoDeleteContentResponse {
  msg: string;
  /**
   * 1:成功 其他为失败
   */
  code: number;
}
