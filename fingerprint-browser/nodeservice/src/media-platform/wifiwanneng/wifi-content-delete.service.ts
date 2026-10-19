import { $http } from '@/http';

export const deleteKuaiChuanArticle = async (cookie: string, docId: string): Promise<WiFiDeleteArticleResponse> => {
  const url = `https://mp.lsttnews.com/media-center/manager/news/delete.do`;

  const headers = {
    cookie: cookie,
    accept: 'application/json, text/plain, */*',
    referer: 'https://mp.lsttnews.com/',
    Origin: 'https://mp.lsttnews.com',
  };

  const postData = `newsid=${docId}`;

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

export interface WiFiDeleteArticleResponse {
  success: boolean;
  error?: { code: number; message: string };
}
