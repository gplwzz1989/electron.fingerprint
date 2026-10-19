import { $http } from '@/http';

export const deleteXueQiuArticle = async (
  cookie: string,
  docId: string,
  isDraft: boolean,
): Promise<XueQiuDeleteResponse> => {
  let url = `https://mp.xueqiu.com/xq/statuses/draft/delete.json?id=${docId}`;
  if (!isDraft) {
    url = `https://mp.xueqiu.com/xq/statuses/destroy/${docId}.json`;
  }
  const headers = {
    cookie: cookie,
    referer: 'https://mp.xueqiu.com',
    Origin: 'https://mp.xueqiu.com',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const postData = '';

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

export interface XueQiuDeleteResponse {
  success: boolean;
  error_description: string;
  error_uri: string;
  error_data: null;
  error_code: string; //'400019';
}
