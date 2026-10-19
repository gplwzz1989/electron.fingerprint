import { $http } from '@/http';
import { getSignServerUrl, Guid, Task } from '@/utils';
import * as buffer from 'buffer';
import FormData from 'form-data';
import { HttpsProxyAgent } from 'https-proxy-agent';

export const getDuoduoUploadDomain = async (cookie: string, userId: number): Promise<DuoduoUploadDomainResponse> => {
  const url = 'https://api.pinduoduo.com/get_endpoint?sdk_version=js-0.0.15&tag_name=backbone-video-sign';

  const headers = {
    cookie: cookie,
    referer: 'https://live.pinduoduo.com/n-creator/video/video-all-data',
  };

  const postData = { consistent_hash_key: userId, bucket_tag: 'backbone-video' };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface DuoduoUploadDomainResponse {
  endpoint: string;
  endpoints: Array<string>;
  error_code: number;
  error_msg: string;
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
        signCommand: 'duoduo',
      };

      const url = getSignServerUrl('duoduo', portIndex);
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
      console.debug(`获取签名失败`, error);
    }
  }

  return '';
};

export const getDuoduoUploadSignature = async (
  cookie: string,
  anti_content,
): Promise<{ error_code: number; error_msg: string; signature: string }> => {
  const url = 'https://live.pinduoduo.com/live/galerie/signature?sdk_version=js-0.0.15&tag_name=backbone-video-sign';

  const headers = {
    cookie: cookie,
    referer: 'https://live.pinduoduo.com/n-creator/video/video-all-data',
    'Anti-Content': anti_content,
  };

  const postData = { bucket_tag: 'backbone-video-sign' };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export const getDuoduoUploadSign = async (
  cookie: string,
  anti_content: string,
  signature: string,
): Promise<{ error_code: number; error_msg: string; sign: string }> => {
  const url =
    'https://file-b.pinduoduo.com/api/galerie/large_file/v1/video/upload_init?sdk_version=js-0.0.10&tag_name=backbone-video';

  const headers = {
    cookie: cookie,
    referer: 'https://live.pinduoduo.com/n-creator/video/video-all-data',
    'Anti-Content': anti_content,
  };

  const postData = {
    content_type: 'video/mp4',
    create_media: true,
    sign: signature,
  };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export const uploadVideoPartResponse = async (
  uploadDomain: string,
  cookie: string,
  videoData: buffer.Buffer,
  partNum: number,
  sign: string,
): Promise<{ uploaded_part_num: number; error_code: number; error_msg: string }> => {
  const url = `https://${uploadDomain}/api/galerie/large_file/v1/video/upload_part`;

  const headers = {
    cookie: cookie,
    referer: 'https://live.pinduoduo.com',
    Origin: 'https://live.pinduoduo.com',
  };

  const postData = new FormData();
  postData.append('sign', sign);
  postData.append('part_num', partNum);
  postData.append('part_file', videoData, { filename: 'blob', contentType: 'application/octet-stream' });

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

export const checkUploadFinish = async (
  cookie: string,
  sign: string,
): Promise<{ error_code: number; error_msg: string; url: string; vid: string }> => {
  const url = 'https://file-b.pinduoduo.com/api/galerie/large_file/v1/video/upload_complete';

  const headers = {
    cookie: cookie,
    referer: 'https://live.pinduoduo.com',
  };

  const postData = { sign: sign };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export const getDuoduoUploadImageSignature = async (
  cookie: string,
  anti_content,
): Promise<{ error_code: number; error_msg: string; signature: string }> => {
  const url = 'https://live.pinduoduo.com/live/galerie/signature?sdk_version=js-0.0.32&tag_name=backbone-cover-b';

  const headers = {
    cookie: cookie,
    referer: 'https://live.pinduoduo.com/n-creator/video/video-all-data',
    'Anti-Content': anti_content,
  };

  const postData = { bucket_tag: 'backbone-cover-b' };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export const uploadImageResponse = async (
  uploadDomain: string,
  cookie: string,
  imageData: buffer.Buffer,
  signature: string,
): Promise<DuoDuoUploadImageResponse> => {
  const url = `https://${uploadDomain}/v3/store_image?sdk_version=js-0.0.32&tag_name=backbone-cover-b`;

  const headers = {
    cookie: cookie,
    referer: 'https://live.pinduoduo.com',
    Origin: 'https://live.pinduoduo.com',
  };

  const postData = new FormData();
  postData.append('url_width_height', 'true');
  postData.append('image', imageData, { filename: `89ccd09d-1c02-4a31-b6d4-b0822d68e52c.png`, contentType: 'image/png' });
  postData.append('upload_sign', signature);
  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

export interface DuoDuoUploadImageResponse {
  url: string;
  width: number;
  height: number;
  size: number;
  etag: string;
  error_code: number;
  error_msg: string;
}

export const publishDuoduoShipinResponse = async (
  cookie: string,
  postStr: string,
  anti_content,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<DuoDuoPublishResponse> => {
  const url = 'https://live.pinduoduo.com/api/backbone/video/publish';

  const headers = {
    cookie: cookie,
    referer: 'https://live.pinduoduo.com/n-creator/video/video-all-data',
    'Anti-Content': anti_content,
    'content-type': 'application/json',
  };

  const result = await $http.post(url, postStr, {
    headers: headers,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

export interface DuoDuoPublishResponse {
  success: boolean;
  //1000000;
  errorCode: number;
  errorMsg: string;
  error_code: number;
  error_msg: string;
  result: {
    feedIds: Array<string>;
    warnMsg: null;
    warnCode: null;
    pushPxqStatus: null;
  };
}
