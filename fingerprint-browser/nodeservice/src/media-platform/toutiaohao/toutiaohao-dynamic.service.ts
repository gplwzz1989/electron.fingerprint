import { $http } from '@/http';
import { HttpsProxyAgent } from 'https-proxy-agent';

export const publishTouTiaoDynamic = async (
  cookie: string,
  postData: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<TouTiaoDynamicPublishResponse> => {
  const publishUrl = 'https://mp.toutiao.com/mp/agw/article/wtt?mp_publish_ab_val=0&msToken=';

  const header = {
    cookie: cookie,
    referer: 'https://mp.toutiao.com/profile_v4/weitoutiao/publish',
    Origin: 'https://mp.toutiao.com',
    'Content-Type': 'application/json;charset=UTF-8',
  };

  const result = await $http.post(publishUrl, postData, {
    headers: header,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });
  return result.data;
};
export const saveDraftTouTiaoDynamic = async (
  cookie: string,
  postData: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<TouTiaoDynamicPublishResponse> => {
  const publishUrl = 'https://mp.toutiao.com/mp/agw/draft/save_ugc_draft?mp_publish_ab_val=0&msToken=&a_bogus=';

  const header = {
    cookie: cookie,
    referer: 'https://mp.toutiao.com/profile_v4/weitoutiao/publish',
    Origin: 'https://mp.toutiao.com',
    'Content-Type': 'application/json;charset=UTF-8',
  };

  const result = await $http.post(publishUrl, postData, {
    headers: header,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });
  return result.data;
};

export interface TouTiaoDynamicPublishResponse {
  code: number;
  data: { add_thread_limit: number; thread_id: number };
  gid: string;
  message: string;
}
