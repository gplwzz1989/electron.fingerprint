import { $http } from '@/http';

/**
 * 删除作品
 * @param cookie
 * @param docId
 */
export const deleteAZhanVideoContentResponse = async (
  cookie: string,
  docId: string,
): Promise<{ result: number; message: string; errMsg: { error_msg: string } }> => {
  const url = `https://member.acfun.cn/list/api/deleteDouga`;

  const headers = {
    cookie: cookie,
    referer: 'https://member.acfun.cn',
    Origin: 'https://member.acfun.cn',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const postData = `dougaId=${docId}`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export const deleteAZhanArticleContentResponse = async (
  cookie: string,
  docId: string,
): Promise<{ result: number; message: string; errMsg: { error_msg: string } }> => {
  const url = `https://member.acfun.cn/list/api/deleteArticle`;

  const headers = {
    cookie: cookie,
    referer: 'https://member.acfun.cn',
    Origin: 'https://member.acfun.cn',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const postData = `articleId=${docId}`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};
