import { $http } from '@/http';
import * as buffer from 'buffer';
import { HttpsProxyAgent } from 'https-proxy-agent';

export const getInitUploadResponse = async (
  cookie: string,
  vstk: string,
  reqId: string,
): Promise<TengXunShiPinInitResponse> => {
  const url = `https://access.v.qq.com/trpc.creator_center.backend.UploadSvc/UploadWebInit?g_vstk=${vstk}&refer=vcc_web&origin=1&method=GET&params=%7B%22req_id%22%3A%22${reqId}%22%7D`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.v.qq.com/',
    authority: 'access.v.qq.com',
    origin: 'https://mp.v.qq.com',
  };

  const result = await $http.get(url, {
    headers: headers,
  });

  return result.data;
};

export interface TengXunShiPinInitResponse {
  /**
   * 0:正常
   */
  code: number;
  msg: string;
  data: {
    bizid: number;
    //'a29e2a069c758abc83e1e5c93e075408';
    bztoken: string;
    //'1000035_20210316073029_6IzT7LK1';
    serverid: string;
    //'75cc1d06-5729-4987-88b5-c5d2f5729a36';
    uploadReqId: string;
  };
}

export const getUploadArgsResponse = async (
  cookie: string,
  initData: TengXunShiPinInitResponse,
  reqId: string,
): Promise<UploadArgsResponse> => {
  const url = `https://videotranspondplus.3g.qq.com/v2/video/prepare`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.v.qq.com/',
    origin: 'https://mp.v.qq.com',
    Seq: reqId,
  };

  let vuid = cookie.includes('vqq_vuserid')
    ? cookie.split('vqq_vuserid=')[1]?.split(';')[0]
    : cookie.split('vuserid=')[1]?.split(';')[0];
  if (!vuid) {
    vuid = cookie.split('vuserid=')[1]?.split(';')[0];
  }
  const postData = {
    bizId: initData.data.bizid,
    needVid: 1,
    serviceId: initData.data.serverid,
    type: 0,
    vUid: vuid,
  };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface UploadArgsResponse {
  /**
   * 0正常
   */
  code: number;
  fileId: string;
  msg: string;
  reRoute: { cmdid: number; modid: number };
  ukey: string;
  vid: string;
  videoId: string;
  bizId?: number;
  bizToken?: string;
}

export const uploadVideoPartResponse = async (
  uploadArgs: UploadArgsResponse,
  cookie: string,
  videoData: buffer.Buffer,
  partNum: number,
  uploadList: Map<number, string>,
  seqId: string,
  bizToken: string,
): Promise<UploadPartResponse> => {
  const url = 'https://videotranspondplus.3g.qq.com/v2/upload/uploadpart';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.v.qq.com/',
    Origin: 'https://mp.v.qq.com/',
    'User-ReturnCode': '',
    Seq: seqId,
    'Upload-Sid': `${uploadArgs.reRoute.modid}:uploadArgs.reRoute.cmdid`,
    'Video-token': bizToken,
  };

  const params = {
    filename: uploadArgs.fileId,
    ukey: uploadArgs.ukey,
    partnum: partNum,
  };

  const result = await $http.post<UploadPartResponse>(url, videoData, { headers: headers, params: params });
  if (result.data?.partSha) {
    uploadList.set(partNum, result.data.partSha);
  }
  return result.data;
};

export interface UploadPartResponse {
  /**
   * 0正常
   */
  code: number;
  msg: string;
  partSha: string;
}

export const checkUploadFinishResponse = async (
  cookie: string,
  postStr: string,
  uploadArgs: UploadArgsResponse,
  seqId: string,
  bizToken: string,
): Promise<CheckUploadFinishResponse> => {
  const url = 'https://videotranspondplus.3g.qq.com/v2/upload/finishupload';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.v.qq.com/',
    Origin: 'https://mp.v.qq.com/',
    'Content-Type': 'application/json',
    Seq: seqId,
    'Upload-Sid': `${uploadArgs.reRoute.modid}:uploadArgs.reRoute.cmdid`,
    'Video-token': bizToken,
  };

  const params = {};

  const result = await $http.post(url, postStr, { headers: headers, params: params });

  return result.data;
};

export interface CheckUploadFinishResponse {
  code: number;
  crcCheckCode: number;
  msg: string;
}

export const notifyUploadSucResponse = async (
  cookie: string,
  uploadArgs: UploadArgsResponse,
  seqId: string,
  initData: TengXunShiPinInitResponse,
  fileSha: string,
  fileSize: number,
  vsak: number,
  vstk: number,
): Promise<NotifuUploadFinishResponse> => {
  const url = 'https://access.v.qq.com/trpc.creator_center.backend.VideoFusion/UploadNotify';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.v.qq.com/',
    Origin: 'https://mp.v.qq.com/',
    'Content-Type': 'application/json',
    Seq: seqId,
    'Upload-Sid': `${uploadArgs.reRoute.modid}:uploadArgs.reRoute.cmdid`,
    'Video-token': initData.data.bztoken,
  };

  const params = {
    g_actk: vsak,
    g_vstk: vstk,
    refer: 'vcc_cover_web',
    origin: 1,
  };

  const postData = {
    seqid: seqId,
    video_id: uploadArgs.videoId,
    file_name: 'myvideo.mp4',
    file_sha1: fileSha,
    file_md5: '',
    file_size: fileSize,
    file_id: uploadArgs.fileId,
    vid: uploadArgs.vid,
    bizid: initData.data.bizid,
    serverid: initData.data.serverid,
    bztoken: initData.data.bztoken,
    uploadReqId: initData.data.uploadReqId,
    aspect_ratio: '640x360',
    duration: 126,
    aspect_ratio_float: 1.7777777777777777,
    status: 2,
  };

  const result = await $http.post(url, postData, { headers: headers, params: params });

  return result.data;
};

export interface NotifuUploadFinishResponse {
  code: number;
  data: object;
  msg: string;
}

export const uploadImageResponse = async (
  cookie: string,
  imageData: buffer.Buffer,
  vstk: string,
  vsak: string,
  imgWidth: number,
  imgHeight: number,
  vid: string,
): Promise<UploadImageResponse> => {
  const url = 'https://access.v.qq.com/trpc.creator_center.entrance.ImageUpload/BlobUpload';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.v.qq.com/',
    Origin: 'https://mp.v.qq.com/',
    'Content-Type': 'application/json',
  };

  const params = {
    g_vstk: vstk,
    g_actk: vsak,
    refer: 'vcc_web',
    filename: 'mypic744.jpeg',
    width: imgWidth ?? 2000,
    height: imgHeight ?? 2000,
    vid: vid,
    origin: 1,
  };

  const result = await $http.post(url, imageData, { headers: headers, params: params });

  return result.data;
};

export interface UploadImageResponse {
  code: number;
  msg: string;
  data: { url: string };
}

export const publishTengxunshipinResponse = async (
  cookie: string,
  postStr: string,
  vstk: number,
  vsak: number,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<PublishResultResponse> => {
  const url = 'https://access.v.qq.com/trpc.creator_center.backend.VideoFusion/CreateVideo';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.v.qq.com/',
    Origin: 'https://mp.v.qq.com/',
    'Content-Type': 'application/json',
  };

  const params = {
    g_vstk: vstk,
    g_actk: vsak,
    refer: 'vcc_web',
    origin: 1,
  };

  const result = await $http.post(url, postStr, {
    headers: headers,
    params: params,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

export interface PublishResultResponse {
  code?: number;
  msg: string;
  data: object;
}
