import { $http } from '@/http';
import { DayuhaoUserInfoResponse } from './dayuhao-user.service';
import { readImageData } from '@/utils';
import FormData from 'form-data';
import { HttpsProxyAgent } from 'https-proxy-agent';

export const saveDayuhaoArticleDraft = async (
  cookie: string,
  postData: string,
  utoken: string,
): Promise<dayuhaoSaveDraftResponse> => {
  const url = `https://mp.dayu.com/dashboard/save-draft`;

  const headers = {
    cookie: cookie,
    'bx-v': '2.5.11',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    Referer: 'https://mp.dayu.com/dashboard/video/write',
    utoken: utoken,
  };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface dayuhaoSaveDraftResponse {
  data: {
    _id: string;
    wm_update_at: string;
    previewUrl: string;
  };
  error: string;
}

export const publishDayuhaoArticle = async (
  cookie: string,
  postData: string,
  utoken: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<{ errorType: string; error: string; result?: { [key: string]: { link: string } } }> => {
  const url = `https://mp.dayu.com/dashboard/submit-article`;

  const headers = {
    cookie: cookie,
    'bx-v': '2.5.11',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    Referer: 'https://mp.dayu.com/dashboard/video/write',
    utoken: utoken,
  };

  const result = await $http.post(url, postData, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export const getDayuAutoCovers = async (
  cookie: string,
  coverStr: string,
  utoken: string,
): Promise<Array<{ origin: string; url: string }> | { error: string }> => {
  const url = 'https://mp.dayu.com/autoCovers';

  const headers = {
    cookie: cookie,
    utoken: utoken,
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    referer: 'https://mp.dayu.com/dashboard/video/write',
    origin: 'https://mp.dayu.com/',
  };

  const result = await $http.post(url, coverStr, { headers: headers });

  return result.data;
};

export const uploadArticleImage = async (
  cookie: string,
  imgUrl: string,
  userInfo: DayuhaoUserInfoResponse,
): Promise<{ data: { imgInfo: { url: string } } }> => {
  const imgBytes = await readImageData(imgUrl, 'jpeg');
  if (imgBytes == null || (imgBytes.data || []).length < 500) {
    throw '读取图片失败或太小:' + imgUrl;
  }

  const uploadUrl = `https://ns.dayu.com/article/imageUpload?appid=website&fromMaterial=0&wmid=${
    userInfo.data.uid
  }&wmname=${encodeURIComponent(userInfo.data.nickname)}&sign=${userInfo.data.localupSign}`;

  const headers = {
    cookie: cookie,
    Referer: 'https://mp.dayu.com/dashboard/article/write',
  };

  const multiItemContentType = `image/${imgBytes.ext}`;
  const fileName = `1.${imgBytes.ext}`;

  const multiPartKeyValuePair = new FormData();
  multiPartKeyValuePair.append('id', 'WU_FILE_0');
  multiPartKeyValuePair.append('name', '1.' + imgBytes.ext);
  multiPartKeyValuePair.append('type', multiItemContentType);
  multiPartKeyValuePair.append('lastModifiedDate', new Date().toString());
  multiPartKeyValuePair.append('size', imgBytes.data?.length);
  multiPartKeyValuePair.append('upfile', imgBytes.data, { filename: fileName, contentType: multiItemContentType });

  const uploadResult = await $http.post(uploadUrl, multiPartKeyValuePair, { headers: headers });

  return uploadResult.data;
};

export const getImgFromUrl = async (
  cookie: string,
  imgUrl: string,
  userInfo: DayuhaoUserInfoResponse,
): Promise<{ data: { imgInfo: { url: string } } }> => {
  const url = `https://ns.dayu.com/article/outsiteImgUpload?appid=website&wmid=${
    userInfo.data.uid
  }&wmname=${encodeURIComponent(userInfo.data.nickname)}&sign=${userInfo.data.sign}`;

  const headers = {
    cookie: cookie,
    Referer: 'https://mp.dayu.com/dashboard/article/write',
  };

  const postData = `_rid=${userInfo.data.requestId}&imgSrc=${encodeURIComponent(imgUrl)}&utoken=${
    userInfo.data.utoken
  }`;

  const uploadResult = await $http.post(url, postData, { headers: headers });

  return uploadResult.data;
};
