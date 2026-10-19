import { $http } from '@/http';
import buffer from 'buffer';
import { HttpsProxyAgent } from 'https-proxy-agent';
import FormData from 'form-data';
import { GetMD5, Guid } from '@/utils';
import dayjs from 'dayjs';

export const yicheSalt = '6AC46B43FC8DCD6E49F66F6C016F393F';

export const getYiCheHaoUploadArgsResponse = async (cookie: string): Promise<YiCheHaoUploadArgsResponse> => {
  const url = 'https://ark-fileservice.bitauto.com/api/v1/vod/login';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yiche.com/',
    Origin: 'https://mp.yiche.com',
    'Content-Type': 'application/json',
    cid: 500,
    ver: '1.0.4',
    'x-user-guid': Guid.NewGuid().toString(),
  };

  const postData = { username: 'yongyan', password: 'UhFKywmvY4KGihZv' };

  const result = await $http.post<YiCheHaoUploadArgsResponse>(url, postData, { headers: headers });
  if (result.data) {
    result.data.uploadId = Guid.NewGuid().toString();
  }
  return result.data;
};

export interface YiCheHaoUploadArgsResponse {
  //200 成功
  code: number;
  status: boolean;
  message: string;
  data: string;
  uploadId: string;
  fileKey?: string;
  videoId?: number;
  fileId?: string;
}

export const uploadYiCheHaoVideoPartResponse = async (
  cookie: string,
  videoData: buffer.Buffer,
  uploadArgs: YiCheHaoUploadArgsResponse,
  partNum: number,
  partNums: number,
  fileName: string,
  fileSize: number,
): Promise<YiCheHaoUploadVideoResponse> => {
  const url = `https://ark-fileservice.bitauto.com/api/v1/vod/concurrencyUpload?token=${uploadArgs.data}`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yiche.com/',
    Origin: 'https://mp.yiche.com',
    cid: 500,
    ver: '1.0.4',
    'x-user-guid': Guid.NewGuid().toString(),
  };

  const formData = new FormData();
  formData.append('shardIndex', partNum);
  formData.append('shardTotal', partNums);
  formData.append('name', fileName);
  formData.append('suffix', 'mp4');
  formData.append('use', '视频上传');
  formData.append('key', uploadArgs.uploadId);
  formData.append('coverName', '');
  formData.append('coverBase64', '');
  formData.append('size', fileSize);
  formData.append('shardSize', 1048576);

  formData.append('shard', videoData, { filename: 'blob', contentType: `application/octet-stream` });

  const result = await $http.post<YiCheHaoUploadVideoResponse>(url, formData, {
    headers: headers,
  });

  return result.data;
};

export interface YiCheHaoUploadVideoResponse {
  code: number;
  status: boolean;
  message: string;
  data: {
    requestId: null;
    fileId: null;
    progress: number;
    speed: number;
    fileKey: string;
  };
}

export const finishUploadYiCheHaoVideoResponse = async (
  cookie: string,
  uploadArgs: YiCheHaoUploadArgsResponse,
): Promise<finishUploadResponse> => {
  const url = `https://ark-fileservice.bitauto.com/api/v1/vod/concurrencyMerge?token=${uploadArgs.data}`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yiche.com/',
    Origin: 'https://mp.yiche.com',
    'Content-Type': 'application/json',
    cid: 500,
    ver: '1.0.4',
    'x-user-guid': Guid.NewGuid().toString(),
  };

  const postData = { fileUploadId: uploadArgs.uploadId };

  const result = await $http.post<finishUploadResponse>(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface finishUploadResponse {
  code: number;
  status: boolean;
  message: boolean;
  data: number;
}

export const saveUploadYiCheHaoVideoResponse = async (
  cookie: string,
  uploadArgs: YiCheHaoUploadArgsResponse,
  fileName: string,
  startDate: Date,
  fileSize: number,
): Promise<saveUploadResponse> => {
  const url = `https://mp.yiche.com/web_mp/api/v1/manage/publish_video_new`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yiche.com/',
    Origin: 'https://mp.yiche.com',
    'Content-Type': 'application/json',
    encrypttype: '2',
  };

  const now = parseInt((Date.now() / 1000).toFixed(0));

  const postData = {
    cid: 500,
    ver: '1.0.0',
    uid: '',
    t: now,
    sign: '',
    param: {
      fileName: fileName,
      fileId: uploadArgs.uploadId,
      fileSize: Math.max(1, Math.floor(fileSize / 1024 / 1024)),
      uploadBeginTime: dayjs(startDate).format('YYYY-MM-DD HH:mm:ss'),
      uploadEndTime: dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss'),
    },
  };

  postData.sign = buildYiCheHaoVideoSign(postData);

  const result = await $http.post<saveUploadResponse>(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface saveUploadResponse {
  //'1'为正常
  status: string;
  message: string;
  data:
    | number
    | {
        videoId?: number;
        fileId?: string;
      };
  ercd: '';
}

export const uploadYiCheHaoImageResponse = async (
  cookie: string,
  imageData: buffer.Buffer,
  width: number,
  height: number,
): Promise<UploadImageInfoResponse> => {
  const url = 'https://baaappfile.yiche.com/api/upload_image/website_upload';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yiche.com/',
    Origin: 'https://mp.yiche.com',
    cid: 500,
    ver: '1.0.4',
    'x-user-guid': Guid.NewGuid().toString(),
  };

  const formData = new FormData();
  formData.append('type', 5);
  formData.append('width', width);
  formData.append('height', height);
  formData.append('file', imageData, { filename: `file.png`, contentType: `image/png` });

  const result = await $http.post<UploadImageInfoResponse>(url, formData, {
    headers: headers,
  });

  return result.data;
};

export interface UploadImageInfoResponse {
  /** 状态码，"1" 表示成功 */
  status: string;
  /** 状态描述信息 */
  message: string;
  /** 错误代码，空字符串表示无错误 */
  ercd: string;
  /** 图片相关数据 */
  data: {
    /** 完整图片 URL，可能为 null */
    fullUrl: string | null;
    /** 图片宽度 */
    width: number;
    /** 图片高度 */
    height: number;
    /** 文件大小（字节数） */
    fileSize: number;
    /** 图片的唯一标识键 */
    imgKey: string;
    /** 图片的 Base64 编码字符串，可能为 null */
    imgBase64: string | null;
    /** 序列号，可能为 null */
    serialId: string | null;
  };
}

export const publishYiCheHaoVideoResponse = async (
  cookie: string,
  postStr: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<YiCheHaoVideoPublishResponse> => {
  const url = `https://mp.yiche.com/web_mp/api/v1/manage/update_video`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yiche.com/videos/video',
    Origin: 'https://mp.yiche.com',
    'Content-Type': 'application/json',
    encrypttype: '2',
  };

  const result = await $http.post(url, postStr, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface YiCheHaoVideoPublishResponse {
  // '1' 为成功
  status: string;
  message: string;
  data: boolean;
  ercd: '';
}

export const buildYiCheHaoVideoSign = (postData: {
  cid: number;
  ver: string;
  t: number;
  param: object;
}): string => {
  const signStr =
    'cid=' +
    postData.cid +
    ';param=' +
    JSON.stringify(postData.param) +
    ';ver=' +
    postData.ver +
    ';t=' +
    postData.t +
    ';' +
    yicheSalt;
  return GetMD5(signStr);
};
