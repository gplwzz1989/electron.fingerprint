import { HttpsProxyAgent } from 'https-proxy-agent';
import { $http } from '@/http';

export const publishBaiJiaDynamicResponse = async (
  cookie: string,
  token: string,
  postData: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<BaijiahaoDynamicPubResponse> => {
  const url = 'https://baijiahao.baidu.com/pcui/pcpublisher/publishdynamic';

  const headers = {
    cookie: cookie,
    referer: 'https://baijiahao.baidu.com/builder/rc/edit?type=news',
    'Content-type': 'application/x-www-form-urlencoded;',
    token: token,
  };

  const postStr = `params=${encodeURIComponent(postData)}`;

  const result = await $http.post(url, postStr, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface BaijiahaoDynamicPubResponse {
  errno: number;
  errmsg: string;
  data: null;
  request_id: string;
  ret: null;
  ie: 'utf-8';
}
