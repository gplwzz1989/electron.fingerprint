import { $http } from '@/http';
import { isJson } from '@/utils';

export const deleteArticleResponse = async (cookie: string, docId: string): Promise<BiLiBiLiDeleteResponse> => {
  const url = 'https://member.bilibili.com/x/web/article/delete';

  const headers = {
    cookie: cookie,
    Referer: 'https://account.bilibili.com/',
  };

  const csrf = cookie.split('bili_jct=')[1]?.split(';')[0];

  const postData = `aid=${docId}&csrf=${csrf}`;

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface BiLiBiLiDeleteResponse {
  code: number;
  message: string;
  ttl: number;
}
