import { $http } from '../../http';
import { getNowTimeStamp } from '../../utils/use-date';
import { getSignServerUrl, isJson, Random, Task } from '../../utils';
import * as buffer from 'buffer';
import FormData from 'form-data';
import crypto from 'crypto';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { wangyiSign } from '@/media-platform/wangyihao/wangyihao-user.service';

/**
 * 获取上传参数
 * @param cookie
 * @param fileName 用户id
 */
export const getUploadArgsResponse = async (cookie: string, fileName: string): Promise<UploadArgsResponse> => {
  const url = 'https://mp.163.com/ugc/upload/token';

  const headers = {
    cookie: cookie,
    'Content-Type': 'application/x-www-form-urlencoded',
    Referer: 'https://mp.163.com/subscribe_v3/index.html',
    'X-B3-Sampled': '1',
    'X-B3-SpanId': '0',
  };

  const postData = `fileName=${encodeURIComponent(fileName)}`;

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface UploadArgsResponse {
  status: number;
  cdn_domain: string; // 'videosrc.ws.126.net';
  vid: string; // 'FBAC9943FACD74CB3F96699681C8AE3B';
  url: string; // 'https://videosrc.ws.126.net/vuposs/20250214/c4cke2cs622c78f2cl520.mp4';
  bucket: string; //'videosrc';
  token: string; // 'UPLOAD 2bc0913eea2748ce88aad5185a57ce9f:Iq7fx81bbXU+uCUcqUVGhPFNyUAu63RPlx8vPBGNTiI=:eyJFeHBpcmVzIjogMTczOTUyNDk3MSwgIlJlZ2lvbiI6ICJKRCIsICJPYmplY3QiOiAidnVwb3NzLzIwMjUwMjE0L2M0Y2tlMmNzNjIyYzc4ZjJjbDUyMC5tcDQiLCAiQnVja2V0IjogInZpZGVvc3JjIiwgIkNhbGxiYWNrQm9keSI6ICJidWNrZXQ9JChCdWNrZXQpJmtleT0kKE9iamVjdCkmZnJvbT0wJmFwcF9pZD1hbzZIMXBZRiZ1aWQ9eWQuNjkyYTM1N2U0YzFhNGI1ZjhAMTYzLmNvbSZ2aWQ9NWxmODcyNnNla2MiLCAiT3ZlcldyaXRlIjogZmFsc2UsICJDYWxsYmFja1VybCI6ICJodHRwOi8vdWdjdi53cy5uZXRlYXNlLmNvbS91Z2MvdXBsb2FkL2NhbGxiYWNrIn0=';
  key: string; // 'vuposs/20250214/c4cke2cs622c78f2cl520.mp4';
  msg: string; // 'success';
  /**
   * 获取上传id来填充
   */
  uploadId: string;
  /**
   * 上传校验成功来填充
   */
  md5: string;
}

/**
 * 获取上传id-uploadid
 * @param cookie
 * @param uploadArgs 获取的上传参数
 */
export const getUploadIdResponse = async (cookie: string, uploadArgs: UploadArgsResponse): Promise<string> => {
  const url = `https://nosup-jd1.127.net/videosrc/${uploadArgs.key}?uploads`;

  const headers = {
    cookie: cookie,
    'Content-Type': 'application/x-www-form-urlencoded',
    Referer: 'https://mp.163.com/subscribe_v3/index.html',
    'x-nos-token': uploadArgs.token,
  };

  const postData = '';

  const result = await $http.post(url, postData, {
    headers: headers,
    responseType: 'text',
  });

  return result.data;
};

/**
 * 上传视频分片
 * @param videoData 视频分片数据
 * @param partNum 当前分片编号
 * @param uploadArgs 上传参数
 */
export const uploadVideoPart = async (
  videoData: buffer.Buffer,
  partNum: number,
  uploadArgs: UploadArgsResponse,
): Promise<string> => {
  const url = `https://nosup-jd1.127.net/${uploadArgs.bucket}/${uploadArgs.key}`;

  const md5 = crypto.createHash('md5').update(videoData).digest('hex');
  const headers = {
    'x-nos-token': uploadArgs.token,
    Referer: 'https://mp.163.com/',
    Origin: 'https://mp.163.com',
    'Content-Type': null,
    'Content-MD5': md5,
  };

  const params = {
    partNumber: partNum,
    uploadId: uploadArgs.uploadId,
  };

  let result = await $http.put(url, buffer.Buffer.from(videoData), {
    headers: headers,
    params: params,
    responseType: 'text',
  });

  if (result?.status != 200) {
    result = await $http.put(url, buffer.Buffer.from(videoData), {
      headers: headers,
      params: params,
      responseType: 'text',
    });
  }

  if (result.status === 200) {
    return `${partNum}_${md5}`;
  }
  return `_${result.data}`;
};

/**
 * 上传完成确认
 * @param partListStr
 * @param uploadArgs
 */
export const uploadVideoFinishResponse = async (
  partListStr: string,
  uploadArgs: UploadArgsResponse,
): Promise<string> => {
  const url = `https://nosup-jd1.127.net/${uploadArgs.bucket}/${uploadArgs.key}`;

  const headers = {
    'x-nos-token': uploadArgs.token,
    Referer: 'https://mp.163.com/',
    Origin: 'https://mp.163.com',
    'Content-Type': 'text/html',
  };

  const params = {
    uploadId: uploadArgs.uploadId,
  };

  const result = await $http.post(url, partListStr, {
    headers: headers,
    params: params,
    responseType: 'text',
  });
  return `_${result.data}`;
};

export interface UploadFinishResponse {
  /**
   * 上传完成得视频id
   */
  vid: string;
  /**
   * 时长，秒
   */
  playlength: number;
  soureip: string;
  videocheck: boolean;
  /**
   * 视频高
   */
  height: number;
  filepath: string;
  duplicate: boolean;
  filename: string;
  /**
   * 视频宽
   */
  width: number;
  state: string;
  pageUrl: string;
  /**
   * 视频字节大小
   */
  filesize: string;
  /**
   * 提示消息
   */
  msg: string;
  /**
   * 状态码，字段和值时表示异常
   */
  code: number;
}

/**
 * 上传封面
 * @param cookie
 * @param wemediaId 用户id
 * @param imageData 图片数据
 */
export const uploadVideoCover = async (
  cookie: string,
  wemediaId: string,
  imageData: buffer.Buffer,
): Promise<UploadImageResponse> => {
  const url = 'https://mp.163.com/api/v3/upload/picupload?';

  const headers = {
    cookie: cookie,
    Referer: 'https://mp.163.com/subscribe_v3/index.html',
    'X-B3-Sampled': '1',
    'X-B3-SpanId': '0',
    Origin: 'https://mp.163.com',
  };

  const params = {
    _: getNowTimeStamp(13),
    wemediaId: wemediaId,
    realUserId: '',
  };

  const postData = new FormData();
  postData.append('file', buffer.Buffer.from(imageData), {
    filename: new Date().getTime() + '.png',
    contentType: 'image/png',
  });
  postData.append('from', 'neteasecode_mp');

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data) && response.status != 403;
    },
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface UploadImageResponse {
  /**
   * 状态码
   * 200 正常
   */
  code: number;
  /**
   * 提示消息
   */
  msg: string;
  /**
   * 图片信息
   */
  data: {
    /**
     * 图片地址
     */
    url: string;
    pid: string;
    width: number;
    height: number;
  };
}

/**
 * 推送发布数据
 * @param cookie
 * @param postData  组装后的字符串
 * @param wemediaId 用户id
 * @param proxyAgent
 */
export const pushWangyiVideo = async (
  cookie: string,
  postData: string,
  wemediaId: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<PublishVideoResponse> => {
  const url = 'https://mp.163.com/wemedia/video/publish.do?';

  const headers = {
    Accept: 'application/json',
    cookie: cookie,
    Referer: 'https://mp.163.com/subscribe_v4/index.html',
    'X-B3-Sampled': '1',
    'X-B3-SpanId': '0',
    'Content-Type': 'application/x-www-form-urlencoded',
    Origin: 'https://mp.163.com',
  };
  headers['X-NR-Trace-929'] = wangyiSign(postData);
  const rdm = new Random().Next(11111, 99999);
  headers['X-NR-Trace-Id'] = `${Date.now()}_5694${rdm}459584_${rdm}mp${rdm}`;
  const params = {
    _: getNowTimeStamp(13),
    wemediaId: wemediaId,
    realUserId: '',
  };

  const result = await $http.post(url, postData, {
    headers: headers,
    params: params,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

export interface PublishVideoResponse {
  /**
   * 状态码
   * 1 正常
   */
  code: number;
  /**
   * 提示消息
   */
  msg: string;
  /**
   * 发布后的数据 '/wemedia/video/mylist/W2905703798683225716/1-20.html,VKS5MIJT0'
   */
  data: string;
}

let portIndex = 0;
export const getSign = async (postStr: string = ''): Promise<string> => {
  portIndex++;
  for (let i = 0; i < 4; i++) {
    try {
      // 每两次重试更换一次端口
      if (i > 0 && i % 3 === 0) {
        portIndex++;
      }
      // 准备请求数据
      const postData = {
        url: '',
        cookie: postStr,
        signType: 'browser',
        signCommand: 'wangyi',
      };

      const url = getSignServerUrl('wangyi', portIndex);
      // 发送请求
      const result = await $http.post<{
        signature?: string;
      }>(`${url}/Sign/GetSign`, JSON.stringify(postData), {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      // 验证响应
      if (!result?.data?.signature || result.data?.signature === 'null') {
        await Task.Delay(1500);
        continue;
      }

      // 重置端口索引防止溢出
      if (portIndex > 100000) {
        portIndex = 0;
      }

      return result?.data?.signature;
    } catch (error) {
      // console.debug(`获取签名失败`, error);
    }
  }

  return '';
};
