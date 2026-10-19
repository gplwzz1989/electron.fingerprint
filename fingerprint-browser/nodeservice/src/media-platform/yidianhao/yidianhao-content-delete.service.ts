import { $http } from '@/http';

export const deleteContent = async (
  cookie: string,
  docId: string,
  mpCode?: string,
  token?: string,
): Promise<YidianhaoDeleteContentResponse> => {
  const url = `https://mp.yidianzixun.com/model/Article/${docId}?token=${token}`;
  const headers = {
    cookie: cookie,
    referer: 'https://mp.yidianzixun.com/',
    origin: 'https://mp.yidianzixun.com/',
    'x-mp-code': mpCode ?? '',
  };

  const result = await $http.delete(url, {
    headers: headers,
  });

  return result.data;
};

export interface YidianhaoDeleteContentResponse {
  status: string;
  result: boolean;
  code: number;
  reason: string;
}
