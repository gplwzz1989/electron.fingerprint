import * as buffer from 'buffer';
import { $http } from '../../http';
import { generateRandomFileName, isJson } from '../../utils';
import FormData from 'form-data';
import fs from 'fs';
import { SouhuhaoImgFromUrlResponse } from '@/media-platform/souhuhao/souhuhao-article.service';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 封面上传
 * @param cookie
 * @param accountId 账号id
 * @param imageData 封面数据
 * @param fileExt 文件后缀
 * @param mediaType 发布类型
 */
export const uploadImageAsync = async (
  cookie: string,
  accountId: number,
  imageData: buffer.Buffer,
  fileExt: string = 'jpg',
  mediaType: 'article' | 'video' = 'video',
): Promise<SouhuhaoImgFromUrlResponse> => {
  const url = `https://mp.sohu.com/commons/front/outerUpload/image/file?accountId=${accountId}`;
  let referer = 'https://mp.sohu.com/mpfe/v4/contentManagement/news/addvideo';
  if (mediaType === 'article') {
    referer = 'https://mp.sohu.com/mpfe/v4/contentManagement/news/addarticle?contentStatus=1';
  }

  const headers = {
    cookie: cookie,
    Referer: referer,
  };

  const fileName = generateRandomFileName(10, fileExt);
  const multiFormData = new FormData();
  multiFormData.append('file', imageData, { filename: fileName, contentType: `image/${fileExt}` });
  multiFormData.append('accountId', accountId);

  const result = await $http.post(url, multiFormData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

/**
 * 搜狐号上传视频
 * @param cookie
 * @param accountId 账号id
 * @param videoData 视频数据
 * @param fileExt 文件后缀
 */
export const uploadVideoAsync = async (
  cookie: string,
  accountId: number,
  videoPath: string,
  fileName: string,
): Promise<SouhuhaoUploadVideoResponse> => {
  const url = `https://mp.sohu.com/commons/mp/uploadVideo?accountId=${accountId}`;

  const multiFormData = new FormData();
  multiFormData.append('video', fs.createReadStream(videoPath), {
    filename: fileName,
    contentType: 'video/mp4',
  });

  const headers = {
    cookie: cookie,
    referer: 'https://mp.sohu.com/mpfe/v4/contentManagement/news/addvideo',
    'Content-type': 'multipart/form-data',
  };

  const result = await $http.post(url, multiFormData, {
    headers: headers,
    timeout: 0,
  });

  return result.data;
};

export interface SouhuhaoUploadVideoResponse {
  code: number;
  id: string;
  passport: string;
  videoHtml: string;
}

/**
 * 发布视频
 * @param cookie
 * @param accountId
 * @param postData
 * @param pubType
 * @param proxyAgent
 */
export const publishVideoAsync = async (
  cookie: string,
  accountId: number,
  postData: string,
  pubType: number,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<SouhuhaoPublishResultResponse> => {
  let url: string;
  if (pubType === 1) {
    url = `https://mp.sohu.com/mpbp/bp/news/v4/news/publishVideo?accountId=${accountId}`;
  } else {
    url = `https://mp.sohu.com/mpbp/bp/news/v4/news/video/draft?accountId=${accountId}`;
  }
  const mpcv = cookie.split('mp-cv=')[1]?.split(';')[0];

  const headers = {
    cookie: cookie,
    referer: 'https://mp.sohu.com/mpfe/v4/contentManagement/news/addvideo',
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Requested-With': 'XMLHttpRequest',
    'sp-cm': mpcv,
  };

  const result = await $http.post(url, postData, {
    headers: headers,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

export interface SouhuhaoPublishResultResponse {
  code: number;
  data: number;
  msg: string;
  success: boolean;
}
