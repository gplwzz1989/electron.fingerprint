import { $http } from '@/http';

export const getDouBanContentListResponse = async (cookie: string, userId: string): Promise<string> => {
  const url = `https://www.douban.com/people/${userId}/notes`;

  const headers = {
    cookie: cookie,
    referer: 'https://accounts.douban.com/passport/setting',
    Origin: 'https://accounts.douban.com/',
  };

  const result = await $http.get(url, { headers: headers, responseType: 'text' });

  return result.data;
};