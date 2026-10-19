import { $http } from '@/http';

export const getJianShuContentListResponse = async (
  cookie: string,
  userId: string,
  page: number = 1,
): Promise<string> => {
  const url = `https://www.jianshu.com/u/${userId}`;

  const headers = {
    cookie: cookie,
    referer: `https://www.jianshu.com/u/${userId}`,
    Origin: 'https://www.jianshu.com',
  };

  const params = {
    page: page,
    order_by: 'shared_at',
  };

  const result = await $http.get(url, { headers: headers, params: params, responseType: 'text' });

  return result.data;
};
