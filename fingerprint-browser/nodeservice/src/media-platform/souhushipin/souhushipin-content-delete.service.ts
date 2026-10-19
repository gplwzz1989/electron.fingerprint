import { HttpsProxyAgent } from 'https-proxy-agent';
import { $http } from '@/http';

export const deleteSouhushipinVideoResponse = async (
  cookie: string,
  docId: string,
  ndltk: string,
  proxyAgent?: HttpsProxyAgent<string>,
): Promise<SouhushipinContentDeleteResponse> => {
  const headers = {
    cookie: cookie,
    referer: 'https://my.tv.sohu.com',
    'content-type': 'application/x-www-form-urlencoded',
    Origin: 'http://my.tv.sohu.com',
  };

  const params = {};

  const postData = `ndltk=${ndltk}&vids=${docId}`;

  const result = await $http.post('https://my.tv.sohu.com/user/a/wvideo/deletevideos.do', postData, {
    headers: headers,
    params: params,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface SouhushipinContentDeleteResponse {
  /**
   * 1:正常
   */
  status: number;
  statusText: string;
  msg: string;
}
