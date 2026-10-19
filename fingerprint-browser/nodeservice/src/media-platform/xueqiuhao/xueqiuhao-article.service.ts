import { Random } from '@/utils';
import { $http } from '@/http';
import buffer from 'buffer';
import FormData from 'form-data';
import { HttpsProxyAgent } from 'https-proxy-agent';

export const covertImgFromUrl = async (cookie: string, imgUrl: string): Promise<XueQiuImageConvertResponse> => {
  const url = 'https://mp.xueqiu.com/node/snowman/service/images/paste';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.xueqiu.com/write',
    Origin: 'https://mp.xueqiu.com',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const postData = `src=${encodeURIComponent(imgUrl)}`;

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

export interface XueQiuImageConvertResponse {
  width: number;
  filename: string;
  url: string; //'//xqimg.imedao.com';
  height: number;
  error_description: string;
  error_uri: string;
  error_data: null;
  error_code: string; //'400019';
}

export const uploadImageResponse = async (
  cookie: string,
  imageData: buffer.Buffer,
): Promise<XueQiuImageConvertResponse> => {
  const url = 'https://mp.xueqiu.com/xq/photo/upload.json';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.xueqiu.com/writeV2/?position=pc_creator_post',
  };

  const postData = new FormData();
  postData.append('file', imageData, {
    filename: `${new Random().Next(111111, 999999)}.png`,
    contentType: 'application/octet-stream',
  });

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

export const getSessionToken = async (
  cookie: string,
): Promise<{ session_token: string; error_description: string }> => {
  const url = 'https://mp.xueqiu.com/xq/provider/session/token.json?api_path=%2Fstatuses%2Fupdate.json';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.xueqiu.com/writeV2',
  };

  const result = await $http.get(url, { headers: headers });

  return result.data;
};

export const saveDraftXueQiuArticleResponse = async (
  cookie: string,
  postStr: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<XueQiuPublishResponse> => {
  const url = `https://mp.xueqiu.com/xq/statuses/draft/save.json`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.xueqiu.com/write',
    Origin: 'https://mp.xueqiu.com',
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
  };

  const result = await $http.post(url, postStr, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export const publishXueQiuArticleResponse = async (
  cookie: string,
  postStr: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<XueQiuPublishResponse> => {
  const url = `https://mp.xueqiu.com/xq/statuses/update.json`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.xueqiu.com/write',
    Origin: 'https://mp.xueqiu.com',
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
  };

  const result = await $http.post(url, postStr, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface XueQiuPublishResponse {
  created_at: number;
  id: number;
  error_description: string;
  error_uri: string;
  error_data: null;
  error_code: string; //'400019';
}
