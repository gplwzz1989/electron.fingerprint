import { $http } from '@/http';

export const deleteKuaiChuanArticle = async (cookie: string, docId: string): Promise<JianShuDeleteArticleResponse> => {
  const url = `https://www.jianshu.com/author/notes/${docId}/soft_destroy`;

  const headers = {
    accept: 'application/json',
    cookie: cookie,
    referer: `https://www.jianshu.com`,
    Origin: 'https://www.jianshu.com',
  };

  const postData = '';

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

export interface JianShuDeleteArticleResponse {
  id: number;
  title: string;
  deleted_at: number;
  error?: string;
}
