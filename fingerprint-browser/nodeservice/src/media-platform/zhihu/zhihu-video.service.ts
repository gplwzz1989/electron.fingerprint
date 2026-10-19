import { $http } from '../../http';
import crypto from 'crypto';
import * as buffer from 'buffer';
import { HttpsProxyAgent } from 'https-proxy-agent';

const xUserAgent = 'aliyun-sdk-js/6.8.0 Chrome 108.0.5359.215 on Windows 10 64-bit';

/**
 * 获取视频上传参数
 * @param cookie
 * @param fileMd5
 * @param fileSize
 * @param typeStr
 */
export const getVideoUploadKeyResponse = async (
  cookie: string,
  fileMd5: string,
  fileSize: number,
  typeStr: string,
): Promise<UploadArgsResponse> => {
  const url = 'https://lens.zhihu.com/api/v5/videos';

  const headers = {
    'X-Upload-Content-Length': fileSize,
    'X-Upload-Content-Type': `video/${typeStr}`,
    'Content-Type': 'application/json',
    referer: 'https://www.zhihu.com/zvideo/upload-video',
    Origin: 'https://www.zhihu.com/',
    cookie: cookie,
  };

  const postData = '{"file_md5":"' + fileMd5 + '","source":"zvideo"}';

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface UploadArgsResponse {
  upload_vendor: {
    upload_token: {
      access_key: string;
      access_token: string;
      access_timestamp: number;
      access_id: string;
    };
    use_cdn: boolean;
    endpoint: string;
    vendor_code: string;
  };
  upload_file: {
    state: number;
    video_id: string;
    object_key: string;
  };
  uploadId: string;
  /**
   * 错误信息
   */
  error: {
    message: string;
    code: number;
    name: string;
  };
}

/**
 * 获取视频上传id和上传路径
 * @param cookie
 * @param uploadKeyObj
 * @param typeStr  视频格式
 */
export const getUploadArgsResponse = async (
  cookie: string,
  uploadKeyObj: UploadArgsResponse,
  typeStr: string = 'mp4',
): Promise<string> => {
  const url = `https://${uploadKeyObj.upload_vendor.endpoint}/${uploadKeyObj.upload_file.object_key}?uploads=`;

  const timeStr = new Date().toUTCString();

  const stringToSign: Array<string> = [];
  stringToSign.push('POST');
  stringToSign.push('');
  stringToSign.push(`video/${typeStr}`);
  stringToSign.push(timeStr);
  stringToSign.push(`x-oss-date:${timeStr}`);
  stringToSign.push('x-oss-security-token:' + uploadKeyObj?.upload_vendor?.upload_token?.access_token?.toString());
  stringToSign.push(`x-oss-user-agent:${xUserAgent}`);
  stringToSign.push(`/zhihu-video-input/${uploadKeyObj?.upload_file?.object_key}?uploads`);

  const authorization = crypto
    .createHmac('sha1', uploadKeyObj.upload_vendor.upload_token.access_key)
    .update(stringToSign.join('\n'))
    .digest('base64');

  const headers = {
    'x-oss-date': timeStr,
    'x-oss-security-token': uploadKeyObj?.upload_vendor?.upload_token?.access_token,
    'x-oss-user-agent': xUserAgent,
    'Content-Type': `video/${typeStr}`,
    referer: 'https://www.zhihu.com/zvideo/upload-video',
    Origin: 'https://www.zhihu.com/',
    cookie: cookie,
    authorization: `OSS ${uploadKeyObj?.upload_vendor?.upload_token?.access_id}:${authorization}`,
  };

  const postData = '';

  const result = await $http.post(url, postData, {
    headers: headers,
    responseType: 'text',
  });

  return result.data;
};

/**
 * 获取图片上传参数
 * @param cookie
 * @param fileMd5
 */
export const getImageUploadKeyResponse = async (cookie: string, fileMd5: string): Promise<UploadImageResponse> => {
  const url = 'https://api.zhihu.com/images';

  const headers = {
    'Content-Type': 'application/json',
    referer: 'https://www.zhihu.com/zvideo/upload-video',
    Origin: 'https://www.zhihu.com/',
    cookie: cookie,
  };

  const postData = `{"image_hash":"${fileMd5}","source":"zvideo"}`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

/**
 * 图片上传参数结构
 */
export interface UploadImageResponse {
  upload_token: {
    access_key: string;
    access_token: string;
    access_timestamp: number;
    access_id: string;
  };
  upload_vendor: string;
  upload_file: {
    image_id: string;
    state: number;
    object_key: string;
  };
  /**
   * 错误信息
   */
  error: {
    message: string;
    code: number;
    name: string;
  };
}

/**
 * 上传视频分片
 * @param videoData 视频分片数据
 * @param partNum 分片编号
 * @param uploadArgs 上传参数，来自上传接口
 * @param uploadId 上传id，来气获取上传id接口
 * @param typeStr 资源类型
 */
export const uploadVideoPart = async (
  videoData: buffer.Buffer,
  partNum: number,
  uploadArgs: UploadArgsResponse,
  uploadId: string,
  typeStr: string = 'mp4',
): Promise<{ partNum: number; msg: string }> => {
  const url = `https://${uploadArgs.upload_vendor.endpoint}/${
    uploadArgs.upload_file.object_key
  }?partNumber=${partNum}&uploadId=${uploadId ?? uploadArgs.uploadId}`;

  const timeStr = new Date().toUTCString();

  const keyParamList = [
    'PUT',
    '',
    `video/${typeStr}`,
    timeStr,
    `x-oss-date:${timeStr}`,
    `x-oss-security-token:${uploadArgs?.upload_vendor?.upload_token?.access_token?.toString()}`,
    'x-oss-user-agent:' + xUserAgent,
    `/zhihu-video-input/${uploadArgs.upload_file?.object_key}?partNumber=${partNum}&uploadId=${uploadArgs.uploadId}`,
  ];

  const authorization = crypto
    .createHmac('sha1', uploadArgs.upload_vendor.upload_token.access_key)
    .update(keyParamList.join('\n'))
    .digest('base64');

  const headers = {
    'x-oss-date': timeStr,
    'x-oss-security-token': uploadArgs?.upload_vendor?.upload_token?.access_token,
    'x-oss-user-agent': xUserAgent,
    'Content-type': `video/${typeStr}`,

    referer: 'https://www.zhihu.com/zvideo/upload-video',
    Origin: 'https://www.zhihu.com',
    Authorization: `OSS ${uploadArgs?.upload_vendor?.upload_token?.access_id}:${authorization}`,
  };

  const result = await $http.put(url, buffer.Buffer.from(videoData), {
    headers: headers,
    responseType: 'text',
  });

  return { partNum: partNum, msg: result.headers['etag'] };
};

/**
 * 获取上传完成的视频etag，确保上传正常完成
 * @param uploadArgs 上传参数，来自获取上传参数接口
 * @param uploadId 上传id，来自获取上传id接口
 * @param uploadedList 上传完成的分片信息列表，业务处理
 */
export const getUploadedVideoEtag = async (
  uploadArgs: UploadArgsResponse,
  uploadId: string,
  uploadedList: Map<number, string>,
): Promise<string> => {
  const url = `https://${uploadArgs.upload_vendor?.endpoint}/${uploadArgs.upload_file?.object_key}?uploadId=${uploadId}`;

  const partStrList: Array<string> = [];
  for (let i = 1; i <= uploadedList.size; i++) {
    const partEtag = uploadedList.get(i);
    partStrList.push(`<Part><PartNumber>${i}</PartNumber><ETag>${partEtag}</ETag></Part>`);
  }

  const postData = `<?xml version="1.0" encoding="UTF-8"?>
  <CompleteMultipartUpload>${partStrList.join('')}</CompleteMultipartUpload>`;
  const md5 = crypto.createHash('md5').update(postData).digest('base64');

  const timeStr = new Date().toUTCString();

  const keyParamList = [
    'POST',
    md5,
    'application/xml',
    timeStr,
    `x-oss-date:${timeStr}`,
    `x-oss-security-token:${uploadArgs?.upload_vendor?.upload_token?.access_token?.toString()}`,
    `x-oss-user-agent:${xUserAgent}`,
    `/zhihu-video-input/${uploadArgs.upload_file?.object_key}?uploadId=${uploadArgs.uploadId}`,
  ];

  const authorization = crypto
    .createHmac('sha1', uploadArgs.upload_vendor?.upload_token?.access_key)
    .update(keyParamList.join('\n'))
    .digest('base64');

  const headers = {
    'x-oss-date': timeStr,
    'x-oss-security-token': uploadArgs?.upload_vendor?.upload_token?.access_token,
    'x-oss-user-agent': xUserAgent,
    'Content-type': 'application/xml',
    referer: 'https://www.zhihu.com/zvideo/upload-video',
    Origin: 'https://www.zhihu.com',
    Authorization: `OSS ${uploadArgs?.upload_vendor?.upload_token?.access_id}:${authorization}`,
    'Content-MD5': md5,
  };

  const result = await $http.post(url, postData, {
    headers: headers,
    responseType: 'text',
  });

  return result.data;
};

/**
 * 上传视频分片
 * @param imageData 视频分片数据
 * @param uploadArgs 上传参数，来自上传接口
 * @param typeStr 资源类型
 */
export const uploadImagePart = async (
  imageData: buffer.Buffer,
  uploadArgs: UploadImageResponse,
  typeStr: string = 'jpg',
): Promise<string> => {
  const url = `https://zhihu-pics-upload.zhimg.com/${uploadArgs?.upload_file?.object_key}`;

  const timeStr = new Date().toUTCString();

  const keyParamList = [
    'PUT',
    '',
    `image/${typeStr}`,
    timeStr,
    'x-oss-date:' + timeStr,
    `x-oss-security-token:${uploadArgs.upload_token?.access_token}`,
    'x-oss-user-agent:' + xUserAgent,
    //
    `/zhihu-pics/${uploadArgs.upload_file?.object_key}`,
  ];

  const authorization = crypto
    .createHmac('sha1', uploadArgs.upload_token?.access_key)
    .update(keyParamList.join('\n'))
    .digest('base64');

  const headers = {
    'x-oss-date': timeStr,
    'x-oss-security-token': uploadArgs.upload_token?.access_token,
    'x-oss-user-agent': xUserAgent,
    'Content-type': `image/${typeStr}`,

    referer: 'https://www.zhihu.com/zvideo/upload-video',
    Origin: 'https://www.zhihu.com',
    Authorization: `OSS ${uploadArgs?.upload_token?.access_id}:${authorization}`,
  };

  const result = await $http.put(url, buffer.Buffer.from(imageData), {
    headers: headers,
    responseType: 'text',
  });

  return result.headers['etag'];
};

/**
 * 获取图片上传完成后的状态
 * @param cookie
 * @param uploadArgs
 */
export const uploadImageStatus = async (cookie: string, uploadArgs: UploadImageResponse): Promise<number> => {
  const url = `https://api.zhihu.com/images/${uploadArgs?.upload_file?.image_id}/uploading_status`;

  const headers = {
    cookie: cookie,
    'Content-type': 'application/json',
    referer: 'https://www.zhihu.com/zvideo/upload-video',
    Origin: 'https://www.zhihu.com',
  };

  const postData = '{"upload_result":"success"}';
  const result = await $http.put(url, postData, {
    headers: headers,
    responseType: 'text',
  });

  return result.status;
};

/**
 * 获取图片上传完成后的西信息
 * @param cookie
 * @param uploadArgs
 */
export const getUploadedImageInfo = async (
  cookie: string,
  uploadArgs: UploadImageResponse,
): Promise<UploadedImageInfo> => {
  const url = `https://api.zhihu.com/images/${uploadArgs?.upload_file?.image_id}`;

  const headers = {
    cookie: cookie,
    'Content-type': 'application/json',
    referer: 'https://www.zhihu.com/zvideo/upload-video',
    Origin: 'https://www.zhihu.com',
  };

  const result = await $http.get(url, {
    headers: headers,
    responseType: 'json',
  });

  return result.data;
};

/**
 * 上传完成的图片信息
 */
export interface UploadedImageInfo {
  status: string;
  src: string;
  animation_cover_src: string;
  watermark: string;
  watermark_hash: string;
  watermark_src: string;
  original_hash: string;
  original_src: string;
}

/**
 * 视频普通发布
 * @param cookie
 * @param postData
 * @param save
 * @param proxyAgent
 */
export const publish = async (
  cookie: string,
  postData: string,
  save: number,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<ZhiHuVideoPublishResponse> => {
  const url = save === 1 ? 'https://www.zhihu.com/api/v4/content/publish' : 'https://api.zhihu.com/content/drafts';

  const headers = {
    cookie: cookie,
    referer: 'https://www.zhihu.com/zvideo/upload-video',
    Origin: 'https://www.zhihu.com',
    'Content-Type': 'application/json;charset=UTF-8',
    'x-xsrftoken': cookie.split('_xsrf=')[1]?.split(';')[0]?.trim(),
  };

  const result = await $http.post(url, postData, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

/**
 * 定时发布视频
 * @param cookie
 * @param draftId
 * @param publishTime
 * @param proxyAgent
 */
export const prePublish = async (
  cookie: string,
  draftId: string,
  publishTime: number,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<number> => {
  const url = `https://www.zhihu.com/api/v4/auto-publish/${draftId}/zvideo`;

  const postData = `{"publish_at":${publishTime}}`;

  const headers = {
    cookie: cookie,
    referer: 'https://www.zhihu.com/zvideo/upload-video',
    Origin: 'https://www.zhihu.com',
    'Content-Type': 'application/json;charset=UTF-8',
  };

  const result = await $http.post(url, postData, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.status;
};

export interface ZhiHuVideoPublishResponse {
  code: number;
  message: string;
  toast_message: string;
  data: {
    publish_type: string;
    /**
     * 数据体，json字符串，下有id和content_id字段
     */
    result: string;
    content_id:string;
  };
}

/**
 * 保存视频草稿
 * @param cookie
 * @param postData
 * @param draftId
 */
export const saveDraft = async (cookie: string, postData: string, draftId?: string): Promise<ZhihuDraftResponse> => {
  const url = `https://www.zhihu.com/api/v4/zvideos/drafts${draftId ? `/${draftId}` : ''}`;

  const headers = {
    cookie: cookie,
    referer: 'https://www.zhihu.com/zvideo/upload-video',
    Origin: 'https://www.zhihu.com',
    'Content-Type': 'application/json;charset=UTF-8',
    'x-xsrftoken': cookie.split('_xsrf=')[1]?.split(';')[0]?.trim(),
  };

  const result = draftId
    ? await $http.patch(url, postData, { headers: headers })
    : await $http.post(url, postData, { headers: headers });

  return result.data;
};

export interface ZhihuDraftResponse {
  /**
   * 草稿id
   */
  id: string;
  /**
   * 错误信息
   */
  error: {
    message: string;
    code: number;
    name: string;
  };
}
