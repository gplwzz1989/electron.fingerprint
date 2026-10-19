import { $http } from '@/http';

export const getMeiPaiIndexPage = async (cookie: string, proxyAgent?: object): Promise<string> => {
  const url = 'https://www.meipai.com/users/update';

  const headers = {
    cookie: cookie,
    referer: 'https://www.meipai.com/medias/upload',
    Origin: 'https://www.meipai.com',
  };

  const result = await $http.get(url, { headers: headers, httpAgent: proxyAgent, httpsAgent: proxyAgent });

  return result.data;
};
