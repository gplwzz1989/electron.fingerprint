import { $http } from '../../http';
import crypto from 'crypto';
import * as buffer from 'buffer';
import { HttpsProxyAgent } from 'https-proxy-agent';
import FormData from 'form-data';

const xUserAgent = 'aliyun-sdk-js/6.17.1 Chrome 138.0.7204.185 on Windows 10 64-bit';

/**
 * 获取视频上传参数
 * @param cookie
 * @param fileName
 * @param typeStr
 */
export const getVideoUploadKeyResponse = async (
  cookie: string,
  fileName: string,
  typeStr: string = 'mp4',
  fileInfo?: UploadFileInfo,
): Promise<UploadArgsResponse> => {
  return getUploadArgsResponse(cookie, 'creator-video', {
    byte: fileInfo?.byte ?? 0,
    w: fileInfo?.w ?? 0,
    h: fileInfo?.h ?? 0,
    fileExtension: fileInfo?.fileExtension ?? typeStr,
  });
};

export const getImageUploadKeyResponse = async (
  cookie: string,
  fileName: string,
  typeStr: string = 'png',
  fileInfo?: UploadFileInfo,
): Promise<UploadArgsResponse> => {
  return getUploadArgsResponse(cookie, 'creator-image', {
    byte: fileInfo?.byte ?? 0,
    w: fileInfo?.w ?? 0,
    h: fileInfo?.h ?? 0,
    fileExtension: fileInfo?.fileExtension ?? `.${typeStr}`,
  });
};

export interface UploadFileInfo {
  /** 文件字节数 */
  byte: number;
  /** 文件宽度 */
  w: number;
  /** 文件高度 */
  h: number;
  /** 文件扩展名，按接口要求传入 */
  fileExtension: string;
}

export interface UploadFileObject {
  /** STS临时访问密钥ID */
  accessKeyId: string;
  /** STS临时访问密钥密钥 */
  accessKeySecret: string;
  /** CDN访问域名 */
  cdnHost: string;
  /** OSS存储桶名称 */
  bucketName: string;
  /** OSS存储区域 */
  region: string;
  /** OSS原生访问域名 */
  ossHost: string;
  /** 凭证过期时间戳 */
  expiration: number;
  /** 上传签名 */
  signature: string;
  /** 上传策略 */
  policy: string;
  /** 安全令牌 */
  securityToken: string;
  /** OSS文件访问权限 */
  xOssObjectAcl: string;
  /** 资源唯一标识 */
  resourceId: string;
  /** OSS对象路径 */
  file: string;
}

export interface UploadArgsResponse {
  /** 业务状态码，200表示成功 */
  code: number;
  /** 状态标识，与code保持一致 */
  status: number;
  /** 响应消息，成功时为"成功" */
  msg: string;
  /** 核心数据：OSS上传凭证及配置信息 */
  data: {
    /** STS临时访问密钥ID */
    accessKeyId: string;
    /** STS临时访问密钥密钥 */
    accessKeySecret: string;
    /** 安全令牌 */
    securityToken: string;
    /** OSS存储桶名称 */
    bucket: string;
    /** OSS存储区域 */
    region: string;
    /** CDN访问域名 */
    cdnHost: string;
    /** OSS原生访问域名 */
    ossHost: string;
    /** 凭证过期时间戳（0表示使用policy中的过期时间） */
    expiration: number;
    /** 文件存储路径前缀 */
    startsWith: string;
    /** 上传签名 */
    signature: string;
    /** STS令牌 */
    stsToken: string;
    /** 上传策略（Base64编码） */
    policy: string;
    /** 预留字段，用于跨服务关联 */
    transcordWith: string;
    /** 最大文件上传大小（单位：KB） */
    maxSize: number;
    /** OSS文件访问权限 */
    objectAcl: string;
    /** 资源唯一标识 */
    resourceId: string;
    /** 具体文件路径 */
    filePath: string;
    /** 新版接口返回的OSS对象信息 */
    fileObject?: UploadFileObject;
  };
  /** 响应生成时间戳（毫秒级） */
  timestamp: number;
  /** 请求追踪ID，用于日志排查 */
  traceId: string;
}

const normalizeUploadArgsResponse = (response: UploadArgsResponse): UploadArgsResponse => {
  const fileObject = response?.data?.fileObject;
  if (!fileObject) {
    return response;
  }

  response.data = {
    accessKeyId: fileObject.accessKeyId ?? '',
    accessKeySecret: fileObject.accessKeySecret ?? '',
    securityToken: fileObject.securityToken ?? '',
    bucket: fileObject.bucketName ?? '',
    region: fileObject.region ?? '',
    cdnHost: fileObject.cdnHost ?? '',
    ossHost: fileObject.ossHost ?? '',
    expiration: fileObject.expiration ?? 0,
    startsWith: '',
    signature: fileObject.signature ?? '',
    stsToken: fileObject.securityToken ?? '',
    policy: fileObject.policy ?? '',
    transcordWith: '',
    maxSize: 0,
    objectAcl: fileObject.xOssObjectAcl ?? '',
    resourceId: fileObject.resourceId ?? '',
    filePath: fileObject.file ?? '',
    fileObject: fileObject,
  };
  return response;
};

const getUploadFileObject = (uploadArgs: UploadArgsResponse): UploadFileObject => {
  const data = uploadArgs.data;
  return (
    data.fileObject ?? {
      accessKeyId: data.accessKeyId,
      accessKeySecret: data.accessKeySecret,
      cdnHost: data.cdnHost,
      bucketName: data.bucket,
      region: data.region,
      ossHost: data.ossHost,
      expiration: data.expiration,
      signature: data.signature,
      policy: data.policy,
      securityToken: data.securityToken || data.stsToken,
      xOssObjectAcl: data.objectAcl,
      resourceId: data.resourceId,
      file: data.filePath,
    }
  );
};

const getUploadObjectPath = (uploadArgs: UploadArgsResponse): string => {
  const fileObject = getUploadFileObject(uploadArgs);
  return fileObject.file || uploadArgs.data.filePath;
};

export const getUploadObjectUrl = (uploadArgs: UploadArgsResponse): string => {
  const fileObject = getUploadFileObject(uploadArgs);
  const path = getUploadObjectPath(uploadArgs);
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${fileObject.cdnHost.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
};

const normalizeOssHost = (host: string): string => {
  if (host.startsWith('http://') || host.startsWith('https://')) {
    return host;
  }
  return `https://${host}`;
};

const getOssObjectUrl = (uploadArgs: UploadArgsResponse, query: string): string => {
  const fileObject = getUploadFileObject(uploadArgs);
  const path = getUploadObjectPath(uploadArgs).replace(/^\/+/, '');
  return `${normalizeOssHost(fileObject.ossHost).replace(/\/+$/, '')}/${path}?${query}`;
};

const getOssCanonicalPath = (uploadArgs: UploadArgsResponse): string => {
  const fileObject = getUploadFileObject(uploadArgs);
  return `/${fileObject.bucketName}/${getUploadObjectPath(uploadArgs).replace(/^\/+/, '')}`;
};

/**
 * 获取视频上传id和上传路径
 * @param cookie
 * @param uploadKeyObj
 * @param typeStr  视频格式
 *
 * 获取新版OSS上传参数，兼容旧版响应下的分片上传初始化。
 */
export function getUploadArgsResponse(
  cookie: string,
  scene: 'creator-image' | 'creator-video',
  fileInfo: UploadFileInfo,
): Promise<UploadArgsResponse>;
export function getUploadArgsResponse(
  cookie: string,
  uploadKeyObj: UploadArgsResponse,
  typeStr?: string,
): Promise<string>;
export async function getUploadArgsResponse(
  cookie: string,
  sceneOrUploadKeyObj: 'creator-image' | 'creator-video' | UploadArgsResponse,
  fileInfoOrTypeStr: UploadFileInfo | string = 'mp4',
): Promise<UploadArgsResponse | string> {
  if (typeof sceneOrUploadKeyObj !== 'string') {
    const uploadKeyObj = sceneOrUploadKeyObj;
    const typeStr = typeof fileInfoOrTypeStr === 'string' ? fileInfoOrTypeStr : 'mp4';
    const url = getOssObjectUrl(uploadKeyObj, 'uploads=');
    const timeStr = new Date().toUTCString();
    const fileObject = getUploadFileObject(uploadKeyObj);
    const objectPath = getOssCanonicalPath(uploadKeyObj);

    const stringToSign: Array<string> = [];
    stringToSign.push('POST');
    stringToSign.push('');
    stringToSign.push(`video/${typeStr}`);
    stringToSign.push(timeStr);
    stringToSign.push(`x-oss-date:${timeStr}`);
    stringToSign.push('x-oss-security-token:' + fileObject.securityToken);
    stringToSign.push(`x-oss-user-agent:${xUserAgent}`);
    stringToSign.push(`${objectPath}?uploads`);

    const authorization = crypto
      .createHmac('sha1', fileObject.accessKeySecret)
      .update(buffer.Buffer.from(stringToSign.join('\n'), 'utf-8'))
      .digest('base64');

    const headers = {
      'x-oss-date': timeStr,
      'x-oss-security-token': fileObject.securityToken,
      'x-oss-user-agent': xUserAgent,
      'Content-Type': `video/${typeStr}`,
      referer: 'https://creator.dewu.com/release',
      Origin: 'https://creator.dewu.com',
      cookie: cookie,
      authorization: `OSS ${fileObject.accessKeyId}:${authorization}`,
    };

    const result = await $http.post(url, '', {
      headers: headers,
      responseType: 'text',
    });

    return result.data;
  }

  const url = 'https://creator.dewu.com/sns-creator-center/v1/h5/config/get-oss-info-v2?sign=';
  const headers = {
    'Content-Type': 'application/json;charset=UTF-8',
    referer: 'https://creator.dewu.com/release',
    Origin: 'https://creator.dewu.com',
    cookie: cookie,
    appVersion: '5.40.0',
    v: '5.45.0',
    'x-auth-token': decodeURIComponent(cookie.split('dewu_creator_x-auth-token=')[1]?.split(';')[0]),
    //traceparent: 00-f545518468aeba63b5616d9f0f825f90-d95c8eaee45455a4-01
  };
  const result = await $http.post<UploadArgsResponse>(
    url,
    {
      scene: sceneOrUploadKeyObj,
      fileInfo: fileInfoOrTypeStr,
    },
    { headers: headers },
  );
  return normalizeUploadArgsResponse(result.data);
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
  const url = getOssObjectUrl(uploadArgs, `partNumber=${partNum}&uploadId=${uploadId}`);
  const fileObject = getUploadFileObject(uploadArgs);

  const timeStr = new Date().toUTCString();

  const keyParamList = [
    'PUT',
    '',
    `video/${typeStr}`,
    timeStr,
    `x-oss-date:${timeStr}`,
    `x-oss-security-token:${fileObject.securityToken}`,
    'x-oss-user-agent:' + xUserAgent,
    `${getOssCanonicalPath(uploadArgs)}?partNumber=${partNum}&uploadId=${uploadId}`,
  ];

  const authorization = crypto
    .createHmac('sha1', fileObject.accessKeySecret)
    .update(buffer.Buffer.from(keyParamList.join('\n'), 'utf-8'))
    .digest('base64');

  const headers = {
    'x-oss-date': timeStr,
    'x-oss-security-token': fileObject.securityToken,
    'x-oss-user-agent': xUserAgent,
    'Content-type': `video/${typeStr}`,

    referer: 'https://creator.dewu.com/',
    Authorization: `OSS ${fileObject.accessKeyId}:${authorization}`,
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
  const url = getOssObjectUrl(uploadArgs, `uploadId=${uploadId}`);
  const fileObject = getUploadFileObject(uploadArgs);

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
    `x-oss-object-acl:${fileObject.xOssObjectAcl}`,
    `x-oss-security-token:${fileObject.securityToken}`,
    `x-oss-user-agent:${xUserAgent}`,
    `${getOssCanonicalPath(uploadArgs)}?uploadId=${uploadId}`,
  ];

  const authorization = crypto
    .createHmac('sha1', fileObject.accessKeySecret)
    .update(buffer.Buffer.from(keyParamList.join('\n'), 'utf-8'))
    .digest('base64');

  const headers = {
    'x-oss-date': timeStr,
    'x-oss-object-acl': fileObject.xOssObjectAcl,
    'x-oss-security-token': fileObject.securityToken,
    'x-oss-user-agent': xUserAgent,
    'Content-type': 'application/xml',
    referer: 'https://creator.dewu.com/',
    origin: 'https://creator.dewu.com/',
    Authorization: `OSS ${fileObject.accessKeyId}:${authorization}`,
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
 * @param fileName
 */
export const uploadImagePart = async (
  imageData: buffer.Buffer,
  uploadArgs: UploadArgsResponse,
  typeStr: string = 'png',
  fileName: string,
): Promise<string> => {
  const fileObject = getUploadFileObject(uploadArgs);
  const url = `${normalizeOssHost(fileObject.ossHost).replace(/\/+$/, '')}/`;

  const formData = new FormData();
  formData.append('OSSAccessKeyId', fileObject.accessKeyId);

  formData.append('policy', fileObject.policy || uploadArgs.data.policy);
  formData.append('key', fileObject.file || `${uploadArgs.data.startsWith}${fileName}`);
  formData.append('success_action_status', '200');
  formData.append('signature', fileObject.signature || uploadArgs.data.signature);
  formData.append('x-oss-security-token', fileObject.securityToken || uploadArgs.data.stsToken);
  formData.append('x-oss-content-type', `image/${typeStr}`);
  formData.append('x-oss-object-acl', fileObject.xOssObjectAcl || uploadArgs.data.objectAcl);
  formData.append('file', imageData, { filename: fileName, contentType: `image/${typeStr}` });

  const headers = {
    ...formData.getHeaders(),
    referer: 'https://creator.dewu.com/',
    Origin: 'https://creator.dewu.com/',
  };

  const result = await $http.post(url, formData, {
    headers: headers,
    responseType: 'text',
  });

  return result.headers['etag'] ?? result?.data;
};

/**
 * 视频普通发布
 * @param cookie
 * @param postData
 * @param proxyAgent
 */
export const publish = async (
  cookie: string,
  postData: string,
  proxyAgent?: HttpsProxyAgent<string>|object,
): Promise<DeWuPublishResponse> => {
  const url = 'https://creator.dewu.com/sns-creator-center/v1/h5/content/video-publish?sign=';

  const headers = {
    cookie: cookie,
    referer: 'https://creator.dewu.com/',
    Origin: 'https://creator.dewu.com',
    'Content-Type': 'application/json;charset=UTF-8',
    appVersion: '5.40.0',
    v: '5.45.0',
    'x-auth-token': decodeURIComponent(cookie.split('dewu_creator_x-auth-token=')[1]?.split(';')[0]),
  };

  const result = await $http.post(url, postData, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface DeWuPublishResponse {
  /** 业务状态码，200表示成功 */
  code: number;
  /** 状态标识，与code保持一致 */
  status: number;
  /** 响应消息，成功时为"成功" */
  msg: string;
  /** 核心数据，包含趋势ID */
  data: {
    /** 趋势唯一标识ID */
    TrendId: number;
  };
  /** 响应生成时间戳（毫秒级） */
  timestamp: number;
  /** 请求追踪ID，用于日志排查和问题定位 */
  traceId: string;
}
