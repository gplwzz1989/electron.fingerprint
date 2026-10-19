import { $http } from '@/http';
import buffer from 'buffer';
import { HttpsProxyAgent } from 'https-proxy-agent';
import FormData from 'form-data';
import { Guid } from '@/utils';
import dayjs from 'dayjs';
import crypto from 'crypto';
import { FengWangUserInfo } from '@/media-platform/fengwang/fengwang-user.service';

export const getFengWangUploadHostResponse = async (cookie: string): Promise<string> => {
  const url = 'http://o.fun.tv/static/web/pgc/pgc_upload_aio_2_c00cbaf.js';

  const headers = {
    cookie: cookie,
    referer: 'http://o.fun.tv',
    Origin: 'http://o.fun.tv',
  };

  const result = await $http.get(url, { headers: headers, responseType: 'text' });

  return result.data;
};

export const getFengWangUploadArgsResponse = async (
  host: string,
  cookie: string,
  fileSize: number,
  fileName: string,
  fileId: string,
  partNums: number,
  userId: string,
  accountInfo: FengWangUserInfo,
): Promise<FengWangUploadArgsResponse> => {
  const url = `${host}/ajax/upload_video`;

  const headers = {
    cookie: cookie,
    referer: 'http://o.fun.tv',
    Origin: 'http://o.fun.tv',
  };

  const params = {
    size: fileSize,
    blocksize: 3145728,
    blockcount: partNums,
    fileid: fileId,
    file: fileId,
    name: encodeURIComponent(fileName),
    filetype: 'mp4',
    binary: '',
    pgc_id: userId,
  };

  const formData = new FormData();
  formData.append('file', '');
  formData.append('o_loginInfo', JSON.stringify(accountInfo.users));

  const result = await $http.post<FengWangUploadArgsResponse>(url, formData, { headers: headers, params: params });

  return result.data;
};

export interface FengWangUploadArgsResponse {
  //200为成功
  status: number;
  msg: string;
  data: { start: string; file: string; fileid: string };
}

export const uploadFengWangVideoPartResponse = async (
  host: string,
  cookie: string,
  videoData: buffer.Buffer,
  uploadArgs: FengWangUploadArgsResponse,
  startIndex: number,
  endIndex: number,
  partNum: number,
  partNums: number,
  fileName: string,
  fileSize: number,
  userId: string,
  accountInfo: FengWangUserInfo,
): Promise<FengWangUploadArgsResponse> => {
  const url = `${host}/ajax/upload_video`;

  const headers = {
    cookie: cookie,
    referer: 'http://o.fun.tv',
    Origin: 'http://o.fun.tv',
  };

  const params = {
    size: fileSize,
    blocksize: 3145728,
    blockcount: partNums,
    fileid: uploadArgs.data.fileid,
    file: uploadArgs.data.fileid,
    name: encodeURIComponent(fileName),
    filetype: 'mp4',
    binary: '',
    pgc_id: userId,
    start: startIndex,
    end: endIndex,
    blockidx: partNum,
  };

  const formData = new FormData();
  formData.append('file', videoData, { filename: 'blob', contentType: 'application/octet-stream' });
  formData.append('o_loginInfo', JSON.stringify(accountInfo.users));

  const result = await $http.post<FengWangUploadArgsResponse>(url, formData, { headers: headers, params: params });

  return result.data;
};

export const uploadFengWangImageResponse = async (
  cookie: string,
  imageData: buffer.Buffer,
  type: 'vertial' | 'horizontal' = 'horizontal',
): Promise<UploadImageInfoResponse> => {
  const url = 'http://o.fun.tv/ajax/upload_picture';

  const headers = {
    cookie: cookie,
    referer: 'http://o.fun.tv',
    Origin: 'http://o.fun.tv',
    'Content-type': 'application/x-www-form-urlencoded',
  };

  const postData = `filetype=base64&ratio=${type}&image=${buffer.Buffer.from(imageData).toString('base64')}`;

  const result = await $http.post<UploadImageInfoResponse>(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface UploadImageInfoResponse {
  status: number;
  msg: string;
  data: {
    type: string;
    name: string;
    oid: string;
    url: string;
  };
}

export const publishFengWangVideoResponse = async (
  cookie: string,
  postStr: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<FengWangVideoPublishResponse> => {
  const url = `http://o.fun.tv/ajax/upload_video/videoinfo`;

  const headers = {
    cookie: cookie,
    referer: 'http://o.fun.tv',
    Origin: 'http://o.fun.tv',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const result = await $http.post(url, postStr, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface FengWangVideoPublishResponse {
  status: number;
  msg: string;
  data: string;
}
