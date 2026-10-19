import { $http } from '@/http';
import { IYiDianHaoArticleData } from './yidianhao-article';
import { HttpsProxyAgent } from 'https-proxy-agent';

export const saveYidianhaoArticleDraft = async (
  cookie: string,
  postData: string,
  mpCode: string,
  proxyAgent?: HttpsProxyAgent<string>,
): Promise<YidianhaoArticleSaveDraftResponse> => {
  const url = `https://mp.yidianzixun.com/model/Article`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yidianzixun.com/',
    Origin: 'https://mp.yidianzixun.com',
    'x-mp-code': mpCode,
    'content-type': 'application/json;charset=UTF-8',
  };

  const result = await $http.post(url, postData, { headers: headers, httpAgent: proxyAgent, httpsAgent: proxyAgent });

  return result.data;
};

export interface YidianhaoArticleSaveDraftResponse {
  id: number;
  reason?: string;
}

export const prePubYidianhaoArticle = async (
  cookie: string,
  publishId: string,
  taskData: IYiDianHaoArticleData,
  mpCode: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<{ status: string; reason: string; code: number; result: Array<{ id: number }> }> => {
  const url = `https://mp.yidianzixun.com/api/post/schedule/create?id=${publishId}&pub_time=${
    taskData['pub_time']
  }&min_timing_hour=6&max_timing_day=7&_rk=node77${Date.now()}`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yidianzixun.com/',
    Origin: 'https://mp.yidianzixun.com',
    'x-mp-code': mpCode,
  };

  const result = await $http.get(url, { headers: headers, httpAgent: proxyAgent, httpsAgent: proxyAgent });

  return result.data;
};

export const publishYidianhaoArticleResponse = async (
  cookie: string,
  publishId: string,
  mpCode: string,
  proxy?: HttpsProxyAgent<string> | object,
): Promise<{ code: number; result: boolean; status: string }> => {
  const url = `https://mp.yidianzixun.com/api/post/publish?post_id=${publishId}&_rk=${Date.now()}`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yidianzixun.com/',
    Origin: 'https://mp.yidianzixun.com',
    'x-mp-code': mpCode,
    'content-type': 'application/json',
  };

  const result = await $http.get(url, { headers: headers, httpAgent: proxy, httpsAgent: proxy });

  return result.data;
};
