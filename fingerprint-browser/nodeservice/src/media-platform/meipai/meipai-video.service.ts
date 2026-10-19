import { $http } from '@/http';
import buffer from 'buffer';
import { HttpsProxyAgent } from 'https-proxy-agent';

export const getMeiPaiUploadArgsResponse = async (cookie: string): Promise<MeipaiUploadVideoArgsResponse> => {
  const url = 'https://www.meipai.com/medias/get_upload_token?a=30';

  const headers = {
    cookie: cookie,
    referer: 'https://www.meipai.com/medias/upload',
    Origin: 'https://www.meipai.com',
  };

  const result = await $http.get(url, { headers: headers });

  return result.data;
};

export interface MeiPaiBaseResponse {
  error_code: number; // 10001;
  error: string; // '请先登录！';
}

export interface MeipaiUploadVideoArgsResponse extends MeiPaiBaseResponse {
  token: string;
  key: string;
  upload_domain: string;
}

export const uploadMeiPaiVideoPartResponse = async (
  cookie: string,
  videoData: buffer.Buffer,
  uploadDomain: string,
  token: string,
  partNum: number,
  ctxs: Map<number, string>,
): Promise<MeiPaiUploadPartResponse> => {
  const url = `${uploadDomain}/mkblk/${videoData.length}`;

  const headers = {
    cookie: cookie,
    referer: 'https://www.meipai.com/medias/upload',
    Origin: 'https://www.meipai.com/',
    'content-type': 'application/octet-stream',
    Authorization: `UpToken ${token}`,
  };

  const result = await $http.post<MeiPaiUploadPartResponse>(url, videoData, {
    headers: headers,
  });
  if (result.data.ctx) {
    ctxs.set(partNum, result.data.ctx);
  }
  return result.data;
};

export interface MeiPaiUploadPartResponse extends MeiPaiBaseResponse {
  ctx: string;
  checksum: string;
  crc32: number;
  offset: number;
  host: string;
  expired_at: number;
}

export const finishUploadMeiPaiVideoResponse = async (
  cookie: string,
  postStr: string,
  fileName: string,
  fileLength: number,
  uploadDomain: string,
  token: string,
): Promise<MeiPaiUploadFinishResponse> => {
  const fileNameBase64Str = Buffer.from(fileName, 'utf-8').toString('base64')?.replace(/\//g, '_').replace(/\+/g, '-');

  const url = `${uploadDomain}/mkfile/${fileLength}/key/${fileNameBase64Str}/fname/${fileNameBase64Str}`;

  const headers = {
    cookie: cookie,
    referer: 'https://www.meipai.com/medias/upload',
    Origin: 'https://www.meipai.com/',
    'content-type': 'text/plain',
    Authorization: `UpToken ${token}`,
  };

  const result = await $http.post(url, postStr, {
    headers: headers,
  });

  return result.data;
};

export interface MeiPaiUploadFinishResponse extends MeiPaiBaseResponse {
  key: string;
  hash: string;
  token?: string;
}

export const getMeiPaiUploadImageArgs = async (
  cookie: string,
): Promise<Array<MeiPaiUploadImageArgsResponse> | MeiPaiBaseResponse> => {
  const url = `https://www.meipai.com/medias/get_token?ext=jpg&timestamp=${Date.now()}`;

  const headers = {
    cookie: cookie,
    referer: 'https://www.meipai.com/medias/upload',
    Origin: 'https://www.meipai.com',
  };

  const result = await $http.get(url, { headers: headers });

  return result.data;
};

export interface MeiPaiUploadImageArgsResponse {
  mtyun: {
    backup_url: string;
    chunk_size: number;
    connect_timeout: number;
    key: string;
    socket_timeout: number;
    token: string;
    ttl: number;
    url: string;
  };
  order: Array<string>;
  uid: number;
}

export const uploadMeiPaiImageResponse = async (
  cookie: string,
  imageData: buffer.Buffer,
  uploadArgs: MeiPaiUploadImageArgsResponse,
): Promise<MeiPaiUploadFinishResponse> => {
  const url = `${uploadArgs.mtyun.url}putb64/-1/key/${uploadArgs.mtyun.token?.split(':')[2].substring(28, 56)}`;

  const headers = {
    cookie: cookie,
    referer: 'https://www.meipai.com/medias/upload',
    Origin: 'https://www.meipai.com/',
    'content-type': 'application/octet-stream',
    Authorization: `UpToken ${uploadArgs.mtyun.token}`,
  };

  const postData = Buffer.from(imageData).toString('base64');

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export const publishMeiPaiVideoResponse = async (
  cookie: string,
  postStr: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<MeiPaiPublishResponse> => {
  const url = `https://www.meipai.com/medias/convert_request`;

  const headers = {
    cookie: cookie,
    referer: 'https://www.meipai.com/medias/upload',
    Origin: 'https://www.meipai.com/',
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
  };

  const result = await $http.post(url, postStr, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface MeiPaiPublishResponse {
  /**
   * 0:正常
   */
  error_code: number;
  error: string;
}
