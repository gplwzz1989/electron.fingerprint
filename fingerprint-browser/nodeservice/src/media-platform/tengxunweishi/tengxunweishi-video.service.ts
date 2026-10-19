import { $http } from '@/http';
import { TengxunweishiAuthInfo } from './tengxunweishi-user.service';
import * as buffer from 'buffer';
import crypto from 'crypto';
import { HttpsProxyAgent } from 'https-proxy-agent';
export const getWeishiVideoAuthAcc = async (
  cookie: string,
  fileLength: number,
  authInfo: TengxunweishiAuthInfo,
): Promise<WeiShiAuthResponse> => {
  const url: string = 'https://videotranspond.3g.qq.com/busiproxy/auth';

  const headers = {
    cookie: cookie,
    referer: 'https://media.weishi.qq.com',
    Origin: 'https://media.weishi.qq.com',
  };

  const postData = {
    bizId: '1047',
    serviceId: '1047_20210511042421_nzWdIPkJ',
    uin: authInfo.data.personid,
    fileSize: fileLength,
    userIp: '',
    authInfo: {
      iChild: 17,
      iAuthType: authInfo.data.authType,
      sAccessToken: authInfo.data.accessToken,
      sRefreshToken: authInfo.data.refreshToken,
      sSessionKey: authInfo.data.accessToken,
      sUid: authInfo.data.weishiOpenid,
      sThrAppid: authInfo.data.appid,
    },
    meta: { width: 0, height: 0, duration: 0, templateBusinessType: 0, bitrate: 10 },
  };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface WeiShiAuthResponse {
  /**
   * 0正常
   */
  code: number;
  msg: string;
  svrToken: string;
}

export const getWeishiVideoUploadArgs = async (
  cookie: string,
  authAccInfo: WeiShiAuthResponse,
): Promise<WeiShiUploadArgs> => {
  const url: string = 'https://videotranspond.3g.qq.com/v2/video/prepare';

  const headers = {
    cookie: cookie,
    referer: 'https://media.weishi.qq.com',
    Origin: 'https://media.weishi.qq.com',
  };

  const postData = {
    bizId: '1047',
    serviceId: '1047_20210511042421_nzWdIPkJ',
    type: '0',
    svrToken: authAccInfo.svrToken,
  };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface WeiShiUploadArgs {
  /**
   * 0正常
   */
  code: number;
  fileId?: string;
  msg: string;
  reRoute?: { cmdid: number; modid: number };
  ukey?: string;
  vid?: string;
  videoId?: string;
  sha1?: string;
  ms5?: string;
}

export const uploadWeishiVideoPart = async (
  cookie: string,
  videoData: buffer.Buffer,
  partNum: number,
  uploadArgs: WeiShiUploadArgs,
  accAuth: WeiShiAuthResponse,
  uploadList: Map<number, string>,
): Promise<WeishiUploadResponse> => {
  const url: string = 'https://videotranspond.3g.qq.com/v2/upload/uploadpart';

  const headers = {
    cookie: cookie,
    referer: 'https://media.weishi.qq.com',
    Origin: 'https://media.weishi.qq.com',
    BizId: 1047,
    Seq: `f${Date.now()}04385858864192653`,
    ServiceId: '1047_20210511042421_nzWdIPkJ',
    'Upload-Sid': '65374849:131073',
    'Svr-Token': accAuth.svrToken,
  };

  const params = {
    filename: uploadArgs.fileId,
    ukey: uploadArgs.ukey,
    partnum: partNum,
  };

  const result = await $http.post(url, videoData, {
    headers: headers,
    params: params,
  });
  const re = result.data as WeishiUploadResponse;
  if (re?.partSha) {
    uploadList.set(partNum, re.partSha);
  }
  return re;
};

export interface WeishiUploadResponse {
  /**
   * 0正常
   */
  code: number;
  msg: string;
  partSha: string;
}

export const finishWeishiUpload = async (
  cookie: string,
  uploadArgs: WeiShiUploadArgs,
  uploadedList: Map<number, string>,
): Promise<UploadFinishResponse> => {
  const url: string = 'https://videotranspondplus.3g.qq.com/v2/upload/finishupload';

  const headers = {
    cookie: cookie,
    referer: 'https://media.weishi.qq.com',
    Origin: 'https://media.weishi.qq.com',
  };

  const partList: Array<{ partNum: number; partSha: string }> = [];
  for (let i = 1; i <= uploadedList.size; i++) {
    partList.push({ partNum: i, partSha: uploadedList.get(i) ?? '' });
  }

  const postData = {
    bizId: '1047',
    fileName: uploadArgs.fileId,
    uKey: uploadArgs.ukey,
    finishParts: partList,
    skipAudit: 1,
  };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface UploadFinishResponse {
  /**
   * 0正常
   */
  code: number;
  crcCheckCode: number;
  msg: string;
}

/**
 * 封面图片上传
 * @param cookie
 * @param imageData 图片buffer
 * @param fileName 文件名
 */
export const uploadVideoCover = async (
  cookie: string,
  imageData: buffer.Buffer,
  fileName: string,
): Promise<WeiShiUploadImageResponse> => {
  const url = 'https://api.weishi.qq.com/trpc.weishi.weishi_h5_proxy.weishi_h5_proxy/UploadPic';

  const headers = {
    cookie: cookie,
    referer: 'https://media.weishi.qq.com',
    Origin: 'https://media.weishi.qq.com',
  };

  const md5 = crypto.createHash('md5').update(imageData).digest('hex');
  const base64Str = imageData.toString('base64');
  const postData = {
    req_header: {},
    req_body: {
      app_id: 'feedpic',
      scene_id: 'upload',
      pic_uri: fileName,
      md5_hex: md5,
      pic_data_base64: base64Str,
    },
  };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result?.data;
};

export interface WeiShiUploadImageResponse {
  rsp_header: { ret: number; errMsg: string };
  rsp_body: {
    /**
     * 上传成功的图片url
     */
    pic_cdn_url: string;
  };
}

export const publishWeishiVideoResponse = async (
  cookie: string,
  postData: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<WeishiPublishResponse> => {
  const url = 'https://media.weishi.qq.com/media-api/PublishVideo';

  const headers = {
    cookie: cookie,
    referer: 'https://media.weishi.qq.com',
    Origin: 'https://media.weishi.qq.com',
    'Content-Type': 'application/json;charset=UTF-8',
  };

  const result = await $http.post(url, postData, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result?.data;
};

export interface WeishiPublishResponse {
  /**
   * 0正常
   */
  code: number;
  msg: string;
  feedDetailList: [];

  resultMap: {
    /**
     * videoId=0 正常
     */
    [key: string]: number;
  };
  publishResultMap: object;
}
