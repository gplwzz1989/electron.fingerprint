import { $http } from '@/http';
import * as buffer from 'node:buffer';
import FormData from 'form-data';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { isJson } from '@/utils';

//上传视频

export const getAZhanUploadArgsResponse = async (
  cookie: string,
  fileName: string,
  fileSize: number,
): Promise<AzhanUploadArgsResponse> => {
  const url = 'https://member.acfun.cn/video/api/getKSCloudToken';

  const headers = {
    cookie: cookie,
    referer: 'https://member.acfun.cn',
    Origin: 'https://member.acfun.cn',
    'content-type': 'application/x-www-form-urlencoded',
  };
  const postData = `fileName=${encodeURIComponent(fileName)}&size=${fileSize}&template=1`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

interface AzhanUploadArgsResponse {
  result: number;
  'host-name': string;
  taskId: string;
  message: string;
  token: string;
  uploadConfig: {
    partSize: number;
    parallel: number;
    retryCount: number;
    retryDurationSeconds: number;
    dynamicPartThreshold: number;
    dynamicPartCount: number;
  };
}

export const getAZhanUploadTokenResponse = async (cookie: string, token: string): Promise<AzhanUploadTokenResponse> => {
  const url = `https://mediacloud.kuaishou.com/api/upload/resume?upload_token=${token}`;

  const headers = {
    cookie: cookie,
    referer: 'https://member.acfun.cn',
    Origin: 'https://member.acfun.cn',
    'content-type': 'application/x-www-form-urlencoded',
  };
  const postData = ``;

  const result = await $http.get(url, {
    headers: headers,
  });

  return result.data;
};

interface AzhanUploadTokenResponse {
  /**
   * 1:正常
   */
  result: number;
  existed: boolean;
  fragment_index: number; //-1
  fragment_list: [];
  endpoint: Array<{ protocol: string; host: string; port: number }>;
  fragment_index_bytes: number;
  token_id: string;
  prefer_http: boolean;
  message: string;
}

export const uploadAZhanVideoPartResponse = async (
  cookie: string,
  videoData: buffer.Buffer,
  partNum: number,
  startIndex: number,
  endIndex: number,
  fileSize: number,
  token: string,
): Promise<AzhanUploadPartResponse> => {
  const url = `https://mediacloud.kuaishou.com/api/upload/fragment?fragment_id=${partNum - 1}&upload_token=${token}`;

  const headers = {
    cookie: cookie,
    referer: 'https://member.acfun.cn',
    Origin: 'https://member.acfun.cn',
    'content-type': 'application/octet-stream',
    'Content-Range': `bytes ${startIndex}-${endIndex}/${fileSize}`,
  };

  const result = await $http.post(url, videoData, {
    headers: headers,
  });

  return result.data;
};

export interface AzhanUploadPartResponse {
  result: number;
  checksum: string;
  size: number;
  message: string;
}

/**
 * 返回1为正常
 * @param cookie
 * @param partNums
 * @param token
 */
export const checkUploadedVideo = async (
  cookie: string,
  partNums: number,
  token: string,
): Promise<{ result: number; message: number }> => {
  const url = `https://mediacloud.kuaishou.com/api/upload/complete?fragment_count=${partNums}&upload_token=${token}`;

  const headers = {
    cookie: cookie,
    referer: 'https://member.acfun.cn',
    Origin: 'https://member.acfun.cn',
  };

  const result = await $http.post(url, '', {
    headers: headers,
  });

  return result.data;
};

export const getCreateAZhanVideoResponse = async (
  cookie: string,
  taskIdToken: string,
  fileName: string,
): Promise<AzhanCreateVideoResponse> => {
  const url = `https://member.acfun.cn/video/api/createVideo`;

  const headers = {
    cookie: cookie,
    referer: 'https://member.acfun.cn',
    Origin: 'https://member.acfun.cn',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const postData = `videoKey=${taskIdToken}&fileName=${encodeURIComponent(fileName)}&vodType=ksCloud`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface AzhanCreateVideoResponse {
  /**
   * 0:正常
   */
  result: number;
  videoId: number;
  message: string;
}

/**
 * 返回1为正常
 * @param cookie
 * @param taskIdToken
 */
export const finishUploadResponse = async (
  cookie: string,
  taskIdToken: string,
): Promise<{ result: number; message: number }> => {
  const url = `https://member.acfun.cn/video/api/uploadFinish`;

  const headers = {
    cookie: cookie,
    referer: 'https://member.acfun.cn',
    Origin: 'https://member.acfun.cn',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const postData = `taskId=${taskIdToken}`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

//上传封面

export const getAZhanImageUploadArgsResponse = async (
  cookie: string,
  fileName: string,
): Promise<AZhanUploadImageArgsResponse> => {
  const url = `https://member.acfun.cn/rest/pc-direct/image/upload/getToken`;

  const headers = {
    cookie: cookie,
    referer: 'https://member.acfun.cn',
    Origin: 'https://member.acfun.cn',
  };

  const postData = new FormData();
  postData.append('fileName', fileName);

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

interface AZhanUploadImageArgsResponse {
  /**
   * 0:正常
   */
  result: number;
  info: {
    token: string;

    httpEndpointList: Array<string>;
  };
  'host-name': string;
  message: string;
}

/**
 * 返回1正常
 * @param cookie
 * @param imageUpToken
 * @param uploadDomain
 */
export const getAZhanImageUploadTokenResponse = async (
  cookie: string,
  imageUpToken: string,
  uploadDomain: string,
): Promise<{ result: number; message: string }> => {
  const url = `https://${uploadDomain}/api/upload/resume?upload_token=${imageUpToken}&fragment_id=0`;

  const headers = {
    cookie: cookie,
    referer: 'https://member.acfun.cn',
    Origin: 'https://member.acfun.cn',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const result = await $http.get(url, {
    headers: headers,
  });

  return result.data;
};

/**
 * 返回1正常
 * @param cookie
 * @param imageData
 * @param token
 * @param uploadDomain
 */
export const uploadAZhanImageResponse = async (
  cookie: string,
  imageData: buffer.Buffer,
  token: string,
  uploadDomain: string,
): Promise<{ result: number; checksum: string; message: string }> => {
  const url = `https://${uploadDomain}/api/upload/fragment?upload_token=${token}&fragment_id=0`;

  const headers = {
    cookie: cookie,
    referer: 'https://member.acfun.cn',
    Origin: 'https://member.acfun.cn',
    'content-type': 'application/octet-stream',
  };

  const result = await $http.post(url, imageData, {
    headers: headers,
  });

  return result.data;
};

/**
 * 返回1正常
 * @param cookie
 * @param token
 * @param uploadDomain
 */
export const checkUploadAZhanImageResponse = async (
  cookie: string,
  token: string,
  uploadDomain: string,
): Promise<{ result: number; message: string }> => {
  const url = `https://${uploadDomain}/api/upload/complete?fragment_count=1&upload_token=${token}`;

  const headers = {
    cookie: cookie,
    referer: 'https://member.acfun.cn',
    Origin: 'https://member.acfun.cn',
  };

  const result = await $http.post(url, '', {
    headers: headers,
  });

  return result.data;
};

export const getUploadedAZhanImageInfoResponse = async (
  cookie: string,
  token: string,
): Promise<AZhanUploadedImageInfoResponse> => {
  const url = `https://member.acfun.cn/rest/pc-direct/image/upload/getUrlAfterUpload`;

  const headers = {
    cookie: cookie,
    referer: 'https://member.acfun.cn',
    Origin: 'https://member.acfun.cn',
  };

  const postData = new FormData();
  postData.append('token', token);
  postData.append('bizFlag', 'web-article-text');

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface AZhanUploadedImageInfoResponse {
  /**
   * 0 正常
   */
  result: number;
  url: string;
  message: string;
}

export const publishAZhanVideoResponse = async (
  cookie: string,
  postStr: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<AZhanPublishVideoResponse> => {
  const url = `https://member.acfun.cn/video/api/createDouga`;

  const headers = {
    cookie: cookie,
    referer: 'https://member.acfun.cn',
    Origin: 'https://member.acfun.cn',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const result = await $http.post(url, postStr, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

interface AZhanPublishVideoResponse {
  /**
   * 0:正常
   */
  result: number;
  dougaId: number;
  errMsg?: {
    error_msg: string;
    message: string;
    result: number;
  };
}
