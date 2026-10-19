import { $http } from '@/http';

export const getDouBanUserInfoResponse = async (cookie: string, proxyAgrn?: object): Promise<string> => {
  const url = 'https://accounts.douban.com/passport/setting';

  const headers = {
    cookie: cookie,
    referer: 'https://accounts.douban.com/passport/setting',
    Origin: 'https://accounts.douban.com/',
  };

  const result = await $http.get(url, {
    headers: headers,
    responseType: 'text',
    maxRedirects: 0,
    httpAgent: proxyAgrn,
    httpsAgent: proxyAgrn,
  });

  if (result.status === 301 || result.status === 302) {
    return 'accounts.douban.com/accounts/login';
  }
  return result.data;
};
