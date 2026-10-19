import { $http } from '../../http';
import { isJson } from '../../utils';
import * as buffer from 'buffer';
import { WeiboUploadArgs } from './xinlangweibo-video';
import { calculateBufferMd5, hasImageCs, XinlangweiboImageInfoResultResponse } from './xinlangweibo-base.service';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 获取视频发布相关url
 * @param cookie
 * @param xsrfToken
 * @param source
 */
export const getDispatchResponse = async (
  cookie: string,
  xsrfToken: string,
  source: number = 339644097,
): Promise<XinlangweiboDispatchResponse> => {
  const url = 'https://weibo.com/ajax/multimedia/dispatch?';

  const headers = {
    cookie: cookie,
    'Content-Type': 'application/json;charset=UTF-8',
    referer: 'https://weibo.com/upload/channel',
    'X-XSRF-TOKEN': xsrfToken,
  };

  const postData = {
    source: source,
    types: 'video',
    version: 4,
    auth_accept: 'video',
    size: 1048576,
    timeout: 180000,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

/**
 * 获取视频上传参数
 * @param cookie
 * @param initUrl
 * @param xsrfToken
 */
export const getUploadArgsResponse = async (
  cookie: string,
  initUrl: string,
  xsrfToken: string,
): Promise<XinlangweiboUploadArgsResponse> => {
  const url = initUrl;

  const boundary = `2067456weiboPro${(new Date().getTime() / 1000).toString().split('.')[0]}`;

  const headers = {
    cookie: cookie,
    referer: 'https://weibo.com/',
    'X-XSRF-TOKEN': xsrfToken,
    'Content-Type': `multipart/mixed; boundary=${boundary}`,
  };

  let requestBody = '';
  requestBody += `--${boundary}\r\n`;
  requestBody += 'Content-Disposition: form-data; name="biz_file"\r\n';
  requestBody += '\r\n{"mediaprops":"{\\"screenshot\\":1}"}\r\n';
  requestBody += `--${boundary}--\r\n`;

  const result = await $http.post(url, requestBody, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

/**
 * 上传视频分片
 * @param videoData 视频buffer数据
 * @param uploadArgs 上传单数
 * @param startLoc 分片其实索引
 * @param blockSize 分片大小
 * @param totalPartNum 总分片数
 * @param xsrfToken
 * @param source
 */
export const uploadVideoPart = async (
  videoData: buffer.Buffer,
  uploadArgs: WeiboUploadArgs,
  startLoc: number,
  blockSize: number,
  totalPartNum: number,
  xsrfToken: string,
  source: number = 339644097,
): Promise<XinlangweiboUploadPartResponse> => {
  const headers = {
    'X-Up-Auth': uploadArgs.auth,
    'X-XSRF-TOKEN': xsrfToken,
    'Content-Type': 'application/octet-stream',
    Referer: 'https://weibo.com/',
    Accept: 'application/json, text/plain, */*',
  };

  const partMd5 = calculateBufferMd5(videoData);

  const url = `${uploadArgs.upload_url}?source=${source}&upload_id=${uploadArgs.upload_id}&media_id=${
    uploadArgs.media_id
  }&upload_protocol=binary&type=video&client=web&check=${partMd5}&index=${startLoc}&size=${
    videoData.length
  }&start_loc=${startLoc * blockSize}&count=${totalPartNum}`;

  const result = await $http.post(url, buffer.Buffer.from(videoData), {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

/**
 * 检测上传结果
 * @param cookie
 * @param uploadArgs 上传参数
 * @param xsrfToken
 * @param totalPartNum 总分片数
 * @param fileSize 视频文件大小
 * @param source
 */
export const checkUploadResponse = async (
  cookie: string,
  uploadArgs: WeiboUploadArgs,
  xsrfToken: string,
  totalPartNum: number,
  fileSize: number,
  source: number = 339644097,
): Promise<XinlangweiboUploadCheckResponse> => {
  const url = uploadArgs.check_url;

  const headers = {
    cookie: cookie,
    'Content-Type': 'application/x-www-form-urlencoded',
    Referer: 'https://weibo.com/',
    'X-Up-Auth': uploadArgs.auth,
    'X-XSRF-TOKEN': xsrfToken,
  };

  const postData = `source=${source}&upload_id=${uploadArgs.upload_id}&media_id=${uploadArgs.media_id}&upload_protocol=binary&count=${totalPartNum}&action=finish&size=${fileSize}&client=web&status=`;

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

/**
 *  推送发布数据
 * @param cookie
 * @param postData 组装台的推送数据字符串
 * @param xsrfToken
 * @param proxyAgent
 * @param isPrePub
 */
export const publishResponse = async (
  cookie: string,
  postData: string,
  xsrfToken: string,
  proxyAgent: HttpsProxyAgent<string> | object | undefined,
  isPrePub: boolean,
): Promise<XinlangweiboPublishResponse> => {
  const url = isPrePub ? 'https://weibo.com/ajax/statuses/schedule/upload' : 'https://weibo.com/ajax/statuses/update';

  const headers = {
    cookie: cookie,
    'Content-Type': 'application/x-www-form-urlencoded',
    Referer: 'https://weibo.com/upload/channel',
    'X-XSRF-TOKEN': xsrfToken,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

/**
 * 新浪微博视频图片上传
 * @param cookie
 * @param uid
 * @param markpos 水印信息来自用户信息中的watermark（1表示有水印，0表示没有水印）
 * @param nick 水印信息来自用户信息中的watermark
 * @param imageUrl
 */
export const uploadVideoImage = async (
  cookie: string,
  uid: number,
  markpos: number,
  nick: number | string,
  imageBuffer: buffer.Buffer,
): Promise<XinlangweiboImageInfoResultResponse> => {
  // 文件上传地址
  const url = 'https://picupload.weibo.com/interface/upload.php';
  const header = {
    referer: 'https://weibo.com/',
    cookie: cookie,
    origin: 'https://weibo.com',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  // 参数组装
  const params = {
    file_source: 1,
    cs: hasImageCs(imageBuffer.toString('binary')),
    ent: 'miniblog',
    appid: 339644097,
    uid: uid,
    raw_md5: calculateBufferMd5(imageBuffer),
    ori: 1,
    mpos: markpos,
    nick: nick,
    pri: 0,
    request_id: new Date().getTime(),
    file_size: imageBuffer.length,
  };

  // 发送请求
  const result = await $http.post(url, imageBuffer, {
    params: params,
    headers: header,
  });

  return result.data;
};

export interface XinlangweiboDispatchResponse {
  data: {
    video: {
      internal_init_url: string;
      bypass: string;
      check_direct_url: string;
      upload_direct_url: string;
      init_url: string;
      internal_upload_url: string;
      internal_check_url: string;
      upload_url: string;
      upload_urls: Array<string>;
      init_direct_url: string;
      check_url: string;
    };
    request_id: string;
  };
  /**
   * 状态码 1:正常，非1:异常
   */
  ok: number;

  /**
   * 提示消息
   */
  message: string;
}

export interface XinlangweiboUploadArgsResponse {
  upload_id: string;
  media_id: string;
  strategy: {
    upload_protocol: string;
    chunk_retry: number;
    chunk_delay: number;
    chunk_timeout: number;
    chunk_read_timeout: number;
    chunk_slow_speed: number;
    threads: number;
    url_tag: string;
    chunk_size: number;
  };
  auth: string;
  init_log_info: string;

  request_id: string;
  /**
   * 错误码
   */
  error_code: number;
  /**
   * 提示消息
   */
  error: string;
}

export interface XinlangweiboUploadPartResponse {
  /**
   * 状态标志，true为成功，否则为失败
   */
  result: boolean;
  /**
   * 错误码
   */
  error_code: number;

  /**
   * 错误消息
   */
  error: string;
  request_id: string;
}

export interface XinlangweiboUploadCheckResponse {
  /**
   * 结果标志，true为成功
   */
  result: true;
  upload_id: string;
  media_id: string;
  auth: string;
  request_id: string;
  /**
   * 错误消息
   */
  error: string;
  /**
   * 错误码
   */
  error_code: number;
}

export interface XinlangweiboPublishResponse {
  data: {
    user: null;
    source: '';
    showFeedRepost: false;
    showFeedComment: false;
    pictureViewerSign: false;
    showPictureViewer: false;
    rcList: [];
    text: '';
    customIcons: [];
    statuses: Array<{
      schedule_id: string;
    }>;
  };
  /**
   * 提示消息
   */
  msg: string;
  /**
   * 状态码，1:正常，否则异常
   */
  ok: number;
}
