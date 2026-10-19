import { $http } from '@/http';

export const getDouBaoIndexInfo = async (cookie: string): Promise<string> => {
  const url = 'https://www.doubao.com/chat/';
  const headers = {
    Cookie: cookie,
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7',
  };

  const response = await $http.get<string>(url, { headers });

  if (response.status === 200) {
    return response.data;
  } else {
    return response?.status?.toString() ?? null;
  }
};
