import { $http } from '@/http';

export const deleteMeiYouContentResponse = async (cookie: string, docId: string): Promise<MeiYouDeleteResponse> => {
  const url = 'https://mp.meiyou.com/newsaction';

  const headers = {
    cookie: cookie,
    Referer: 'https://mp.meiyou.com/page/home/manager/2',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const postData = `action=delete&id=${docId}`;

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

export interface MeiYouDeleteResponse {
  code: number;
  data: [];
  message: string;
}
