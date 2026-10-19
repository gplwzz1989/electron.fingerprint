import { $http } from '../../http';
import crypto from 'crypto';
import * as buffer from 'buffer';
import { HttpsProxyAgent } from 'https-proxy-agent';
import FormData from 'form-data';
import fs from 'fs';

/**
 * 获取视频上传参数
 * @param cookie
 * @param fileName
 */
export const getVideoUploadKeyResponse = async (cookie: string, fileName: string): Promise<UploadArgsResponse> => {
  const url = `https://mp.meiyou.com/uploadtoken?names=${encodeURIComponent(fileName)}`;

  const headers = {
    referer: 'https://mp.meiyou.com/page/home/publish/2',
    cookie: cookie,
  };

  const result = await $http.get(url, {
    headers: headers,
  });

  return result.data;
};

export const getImageUploadKeyResponse = async (cookie: string, fileName: string): Promise<UploadArgsResponse> => {
  const url = `https://mp.meiyou.com/uploadtoken?names=${encodeURIComponent(fileName)}`;

  const headers = {
    referer: 'https://mp.meiyou.com/page/home/publish/2',
    cookie: cookie,
  };

  const result = await $http.get(url, {
    headers: headers,
  });

  return result.data;
};

export interface UploadArgsResponse {
  /** code：状态码（0 表示成功，非 0 表示失败） */
  code: number;
  /** data：业务核心数据（上传凭证集合） */
  data: UploadTokenData;
  /** message：提示信息（成功时为空字符串，失败时返回错误描述） */
  message: string;
}

/**
 * 上传凭证核心结构（image/video/news_image 共用此结构）
 * 包含阿里云 OSS 上传所需的密钥、过期时间、端点等信息
 */
interface UploadCredential {
  /** AccessKeyId：OSS 临时访问密钥 ID */
  AccessKeyId: string;
  /** AccessKeySecret：OSS 临时访问密钥密钥 */
  AccessKeySecret: string;
  /** Expiration：凭证过期时间（ISO 格式，如 "2025-09-05T02:19:04Z"） */
  Expiration: string;
  /** SecurityToken：OSS 临时安全令牌（STS Token） */
  SecurityToken: string;
  /** endpoint：OSS 服务端点（如 "https://pic-meiyou.oss-cn-hangzhou.aliyuncs.com/"） */
  endpoint: string;
  /** bucketName：OSS 存储桶名称（如 "pic-meiyou"） */
  bucketName: string;
  /** domain：资源访问域名（如 "https://sc.seeyouyima.com/"） */
  domain: string;
  /** user_id：用户 ID（关联上传者身份） */
  user_id: number;
  /** my_var：自定义变量（可能用于业务标识或签名校验） */
  my_var: string;
}

/**
 * 接口返回数据的核心业务数据结构
 * 包含不同类型资源（图片/视频/新闻图片）的上传凭证
 */
interface UploadTokenData {
  /** image：普通图片上传凭证 */
  image: UploadCredential;
  /** video：视频上传凭证 */
  video: UploadCredential;
  /** news_image：新闻类图片上传凭证 */
  news_image: UploadCredential;
}

/**
 * 上传视频分片
 * @param filePath
 * @param fileName
 * @param fileKey
 * @param uploadArgs 上传参数，来自上传接口
 * @param fileType
 */
export const uploadVideoPartStream = async (
  filePath: string,
  fileName: string,
  fileKey: string,
  uploadArgs: UploadArgsResponse,
  fileType: 'video/mp4' | 'image/png',
): Promise<MeiYouUploadResponse> => {
  const keyObject = fileType === 'video/mp4' ? uploadArgs.data.video : uploadArgs.data.image;

  const url = keyObject.endpoint;

  const policy = buffer.Buffer.from(
    `{"expiration":"${keyObject.Expiration}","conditions":[["content-length-range",0,104857600000]]}`,
  ).toString('base64');
  const authorization = crypto
    .createHmac('sha1', keyObject.AccessKeySecret)
    .update(buffer.Buffer.from(policy))
    .digest('base64');
  const formData = new FormData();
  formData.append('name', fileName);
  formData.append('key', fileKey);
  formData.append('policy', policy);
  formData.append('OSSAccessKeyId', keyObject.AccessKeyId);
  formData.append('success_action_status', 200);
  formData.append('x-oss-security-token', keyObject.SecurityToken);
  formData.append(
    'callback',
    'eyJjYWxsYmFja1VybCI6Imh0dHBzOi8vbXAubWVpeW91LmNvbS9Pc3NDYWxsYmFjay9jaGVjayIsImNhbGxiYWNrQm9keSI6ImJ1Y2tldD0ke2J1Y2tldH0mb2JqZWN0PSR7b2JqZWN0fSZldGFnPSR7ZXRhZ30mc2l6ZT0ke3NpemV9Jm1pbWVUeXBlPSR7bWltZVR5cGV9JmltYWdlSW5mby5oZWlnaHQ9JHtpbWFnZUluZm8uaGVpZ2h0fSZpbWFnZUluZm8ud2lkdGg9JHtpbWFnZUluZm8ud2lkdGh9JmltYWdlSW5mby5mb3JtYXQ9JHtpbWFnZUluZm8uZm9ybWF0fSZteV92YXI9JHt4Om15X3Zhcn0ifQ==',
  );
  formData.append('signature', authorization);
  formData.append('x:my_var', keyObject.my_var);
  formData.append('file', fs.createReadStream(filePath), { filename: fileName, contentType: fileType });

  const headers = {
    Referer: 'https://mp.meiyou.com/',
  };

  const result = await $http.post(url, formData, {
    headers: headers,
  });

  return result.data;
};

export const uploadVideoPartBytes = async (
  fileData: buffer.Buffer,
  fileName: string,
  fileKey: string,
  uploadArgs: UploadArgsResponse,
  fileType: 'video/mp4' | 'image/png',
): Promise<MeiYouUploadResponse> => {
  const keyObject = fileType === 'video/mp4' ? uploadArgs.data.video : uploadArgs.data.image;

  const url = keyObject.endpoint;

  const policy = buffer.Buffer.from(
    `{"expiration":"${keyObject?.Expiration}","conditions":[["content-length-range",0,104857600000]]}`,
  ).toString('base64');
  const authorization = crypto
    .createHmac('sha1', keyObject.AccessKeySecret)
    .update(buffer.Buffer.from(policy))
    .digest('base64');
  const formData = new FormData();
  formData.append('name', fileName);
  formData.append('key', fileKey);
  formData.append('policy', policy);
  formData.append('OSSAccessKeyId', keyObject.AccessKeyId);
  formData.append('success_action_status', 200);
  formData.append('x-oss-security-token', keyObject.SecurityToken);
  formData.append(
    'callback',
    'eyJjYWxsYmFja1VybCI6Imh0dHBzOi8vbXAubWVpeW91LmNvbS9Pc3NDYWxsYmFjay9jaGVjayIsImNhbGxiYWNrQm9keSI6ImJ1Y2tldD0ke2J1Y2tldH0mb2JqZWN0PSR7b2JqZWN0fSZldGFnPSR7ZXRhZ30mc2l6ZT0ke3NpemV9Jm1pbWVUeXBlPSR7bWltZVR5cGV9JmltYWdlSW5mby5oZWlnaHQ9JHtpbWFnZUluZm8uaGVpZ2h0fSZpbWFnZUluZm8ud2lkdGg9JHtpbWFnZUluZm8ud2lkdGh9JmltYWdlSW5mby5mb3JtYXQ9JHtpbWFnZUluZm8uZm9ybWF0fSZteV92YXI9JHt4Om15X3Zhcn0ifQ==',
  );
  formData.append('signature', authorization);
  formData.append('x:my_var', keyObject.my_var);
  formData.append('file', fileData, { filename: fileName, contentType: fileType });

  const headers = {
    Referer: 'https://mp.meiyou.com/',
  };

  const result = await $http.post(url, formData, {
    headers: headers,
  });

  return result.data;
};

export interface MeiYouUploadResponse {
  code: number;
  data: [];
  message: string;
  key: string;
  url:string
}

/**
 * 上传视频分片
 * @param imgUrl
 * @param cookie
 */
export const cutCoverImage = async (
  imgUrl: string,
  cookie: string,
): Promise<{
  code: number;
  data: { url: string };
  message: string;
}> => {
  const url = 'https://mp.meiyou.com/upload/shotVideoThumb';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.meiyou.com/page/home/publish/2',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const postData = `url=${encodeURIComponent(imgUrl)}`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

/**
 * 视频普通发布
 * @param cookie
 * @param postData
 * @param proxyAgent
 */
export const publishMeiYouVideoResponse = async (
  cookie: string,
  postData: string,
  proxyAgent?: HttpsProxyAgent<string>|object,
): Promise<MeiYouPublishResponse> => {
  const url = 'https://mp.meiyou.com/news';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.meiyou.com/page/home/publish/2',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const result = await $http.post(url, postData, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface MeiYouPublishResponse {
  code: number;
  data: { newsId: string };
  message: string;
}
