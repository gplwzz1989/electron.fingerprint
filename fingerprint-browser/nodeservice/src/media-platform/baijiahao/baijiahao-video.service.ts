import { $http } from '../../http';
import { isJson } from '../../utils';
import * as buffer from 'buffer';
import FormData from 'form-data';
import { HttpsProxyAgent } from 'https-proxy-agent';
/**
 * 获取视频上传参数
 * @param cookie
 * @param videoMd5 完整视频的md5
 * @param appId 用户id
 * @param tokenStr 进入发布页面的token
 * @param typeStr 视频类型，short:横版视频,tiny:竖版视频
 */
export const getUploadArgsResponse = async (
  cookie: string,
  videoMd5: string,
  appId: number,
  tokenStr: string,
  typeStr: 'short' | 'tiny',
): Promise<UploadArgsResponse> => {
  const url = `https://baijiahao.baidu.com/builder/author/video/preuploadVideo?app_id=${appId}`;

  const headers = {
    cookie: cookie,
    token: tokenStr,
    Origin: 'https://baijiahao.baidu.com',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const postData = `app_id=${appId}&md5=${videoMd5}&is_pay_column=0&video_type=${typeStr}`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface UploadArgsResponse {
  /**
   * 状态码，20000:正常
   */
  error_code: number;
  /**
   * 错误提示消息
   */
  error_msg: string;
  /**
   * 错误码
   */
  errno?: number;
  /**
   * 错误消息
   */
  errmsg?: string;
  /**
   * 上传id
   */
  upload_key: string;
  /**
   * 媒体文件唯一id
   */
  mediaId: string;
  /**
   * 视频已经上传的分片，这个参数可重试时，避免分片重复上传浪费流量时间
   */
  list: Array<number>;
}

/**
 * 上传视频分片
 * @param cookie
 * @param videoData 视频分片数据
 * @param partNum 分片编号，从0开始
 * @param totalParts 总分片数
 * @param appId 用户id
 * @param videoMd5 完整视频的md5
 * @param fileName 文件名，带后缀
 * @param videoSize 视频总大小
 * @param uploadKey 上传key，来自获取上传参数
 * @param videoTypeStr 视频文件类型，默认mp4
 */
export const uploadVideoPart = async (
  cookie: string,
  videoData: buffer.Buffer,
  partNum: number,
  totalParts: number,
  appId: number,
  videoMd5: string,
  fileName: string,
  videoSize: number,
  uploadKey: string,
  videoTypeStr: string = 'mp4',
): Promise<UploadVideoPartResponse> => {
  let url = `https://rsbjh.baidu.com/builder/author/video/uploadVideo?app_id=${appId}`;

  const headers = {
    cookie: cookie,
    referer: 'https://baijiahao.baidu.com',
    Origin: 'https://baijiahao.baidu.com',
  };

  const multiFormData = new FormData();
  multiFormData.append('app_id', appId);
  multiFormData.append('md5', videoMd5);
  multiFormData.append('id', 'WU_FILE_0');
  multiFormData.append('type', `video/${videoTypeStr}`);
  multiFormData.append('lastModifiedDate', Date().toString());
  multiFormData.append('size', videoSize);
  multiFormData.append('name', fileName);
  multiFormData.append('upload_key', uploadKey);

  //multiFormData.append('file', buffer.Buffer.from(videoData), fileName, { type: 'application/octet-stream', size: videoSize });
  multiFormData.append('file', buffer.Buffer.from(videoData), {
    filename: fileName,
    contentType: 'application/octet-stream',
  });
  if (totalParts > 1) {
    multiFormData.append('chunks', totalParts);
    multiFormData.append('chunk', partNum);
  }
  let result = await $http.post(url, multiFormData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  if (result.data['error_msg']?.toString()?.includes('存储服务异常')) {
    for (let i = 0; i < 3; i++) {
      if (result.data['error_msg']?.toString()?.includes('存储服务异常')) {
        url = `https://rsbjh1${i % 3}.baidu.com/materialui/video/uploadvideo?app_id=${appId}`;
        result = await $http.post(url, multiFormData, {
          retryCondition: (error, response) => {
            return !isJson(response.data);
          },
          headers: headers,
        });
      } else {
        break;
      }
    }
  }

  return result.data;
};

export interface UploadVideoPartResponse {
  /**
   * 视频上传后的唯一id
   */
  uploadId: string;
  /**
   * 状态码,20000:正常
   */
  error_code: number;

  errno: number;

  /**
   * 提示信息
   */
  error_msg: string;

  errmsg?: string;
}

/**
 * 上传完成后校验上传结果
 * @param cookie
 * @param appId 用户id
 * @param tokenStr 进入发布页时的token
 * @param uploadKey 上传key
 * @param totalParts 总分片数
 * @param fileName 文件名，带后缀
 * @param videoSize 视频文件大小
 * @param videoType 视频类型,video:横版,tiny:竖版
 */
export const uploadCompleteResponse = async (
  cookie: string,
  appId: number,
  tokenStr: string,
  uploadKey: string,
  totalParts: number,
  fileName: string,
  videoSize: number,
  videoType: 'short' | 'tiny',
): Promise<UploadCompleteResponse> => {
  const url = `https://baijiahao.baidu.com/builder/author/video/compuploadVideo?app_id=${appId}`;

  const headers = {
    cookie: cookie,
    token: tokenStr,
    referer: 'https://baijiahao.baidu.com/builder/rc/edit?type=videoV2',
    Origin: 'https://baijiahao.baidu.com',
  };

  const postData = `upload_key=${uploadKey}&chunks=${totalParts}&name=${encodeURIComponent(
    fileName,
  )}&size=${videoSize}&is_pay_column=0&column_videotype=&type=video&video_type=${videoType}`;

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface UploadCompleteResponse {
  /**
   * 视频文件名，带后缀名
   */
  name?: string;
  /**
   * 用户id
   */
  app_id?: string;
  /**
   * 类型 video
   */
  type?: string;
  /**
   * MIME类型
   */
  mime?: string;
  /**
   *  视频总大小
   */
  size?: string;
  bos_url?: string;
  /**
   * 媒体文件资源id
   */
  mediaId: string;
  /**
   * 状态码,0:正常
   */
  error_code?: number;
  /**
   * 提示信息
   */
  error_msg?: string;
  /**
   * 错误码
   */
  errno?: number;
  /**
   * 错误消息
   */
  errmsg?: string;
  uploadKey: string;
}

export const publish = async (
  cookie: string,
  postData: string,
  tokenStr: string,
  pubType: 'save' | 'publish',
  proxyAgent: HttpsProxyAgent<string> | object | undefined,
  type?: 'video' | 'ugc_video',
): Promise<PublishResponse> => {
  let url = `https://baijiahao.baidu.com/pcui/article/${pubType}`;
  if (type) {
    url = `${url}?type=${type}`;
  }
  const headers = {
    cookie: cookie,
    'Content-Type': 'application/x-www-form-urlencoded',
    referer: 'https://baijiahao.baidu.com/builder/rc/edit?type=videoV2',
    Origin: 'https://baijiahao.baidu.com',
    token: tokenStr,
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

export interface PublishResponse {
  /**
   * 状态码,0:正常
   */
  errno: number;
  /**
   * 提示消息
   */
  errmsg: string;
  /**
   * 发布完成的信息
   */
  ret: {
    /**
     * 作品唯一id，横版用
     */
    article_id: string;
    /**
     * 作品唯一id,竖版用
     */
    nid: string;
    /**
     * 视频id，竖版可能用到
     */
    vid?: string;
    /**
     * 作品唯一id,横版用
     */
    id: string;
    /**
     * 预览链接
     */
    url: string;
    /**
     * 发布创建时间
     */
    created_at: number;
    /**
     *  更新时间
     */
    updated_at: number;
    /**
     * 发布时间
     */
    publish_at: number;
    /**
     *
     */
    issue_status: number;
    /**
     * 发布类型，draft:草稿
     */
    status: string;
  };
}
