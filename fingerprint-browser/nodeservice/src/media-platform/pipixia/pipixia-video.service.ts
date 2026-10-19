import { HttpsProxyAgent } from 'https-proxy-agent';
import { $http } from '@/http';
import { getSignServerUrl, Task } from '@/utils';
import * as buffer from 'buffer';
import crc from 'crc';

export interface AuthResponse {
  status_code: number;
  message: string;
  prompt: string;
  time: number;
  data: {
    AuthSha1: string;
  };
}

export const getAuthorization = async (cookie: string, proxyAgent?: HttpsProxyAgent<string>): Promise<AuthResponse> => {
  // 获取或生成msToken
  let msToken = cookie.split('msToken=')[1]?.split(';')[0];
  if (!msToken) {
    msToken = generateRandomString(16);
  }

  // 获取签名
  const sign = await getSign(msToken);

  // 发送请求获取授权信息
  const result = await $http.get<AuthResponse>(
    `https://pipix.com/api/mp/bds/webapi/get_auth/?action=1&msToken=${msToken}&a_bogus=${sign}`,
    {
      headers: {
        Accept: 'application/json, text/plain, */*',
        Referer: 'https://mp.pipix.com/mp/upload',
        cookie: cookie,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/110.0.0.0',
      },
      httpAgent: proxyAgent,
      httpsAgent: proxyAgent,
    },
  );

  // 返回授权信息
  return result.data;
};

// 辅助函数：生成随机字符串
export const generateRandomString = (length: number): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export interface SignResponse {
  signature?: string;
}

// 原有函数保持不变...
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
        signCommand: 'pipixia',
      };

      const url = getSignServerUrl('pipixia', portIndex);
      // 发送请求
      const result = await $http.post<SignResponse>(`${url}/Sign/GetSign`, JSON.stringify(postData), {
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

let portIndexNew = 0;
export const getSignNew = async (postStr: string = ''): Promise<string> => {
  portIndexNew++;
  for (let i = 0; i < 4; i++) {
    try {
      // 每两次重试更换一次端口
      if (i > 0 && i % 3 === 0) {
        portIndexNew++;
      }
      // 准备请求数据
      const postData = {
        url: '',
        cookie: postStr,
        signType: 'browser',
        signCommand: 'pipixia_new',
      };

      const url = getSignServerUrl('pipixia_new', portIndexNew);
      // 发送请求
      const result = await $http.post<SignResponse>(`${url}/Sign/GetSign`, JSON.stringify(postData), {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 50000,
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

export interface UploadVideoArgs {
  vid: string;
  oid: string;
  tos_host: string;
  tos_debug_host: string;
  tos_headers: Record<string, string>;
  tos_sign: string;
  token: string;
  extra_param: string;
  bucket: string;
  dns_info: any;
  upload_mode: string;
  edge_nodes: Array<{
    vid: string;
    oid: string;
    tos_host: string;
    tos_debug_host: string;
    tos_headers: Record<string, string>;
    tos_sign: string;
    token: string;
    extra_param: string;
    bucket: string;
    dns_info: any;
    upload_mode: string;
  }>;
  delay_upload: number;
  trace_id: string;
  upload_id: string;
  encryption_key: string;
  uploadurl?: string;
}

export interface UploadImageArgs {
  tos_host: string;
  tos_sign: string;
  object_ids: string[];
  bucket: string;
  access_key: string;
  delay_upload: number;
  trace_id: string;
  uploadurl?: string;
}

interface VideoUploadResponse {
  code: number;
  message: string;
  data: UploadVideoArgs | UploadImageArgs;
}

export const getMediaUploadArgs = async (
  cookie: string,
  fileSize: number,
  action: 'GetVideoUploadParams' | 'GetImageUploadParams',
  authorization: string,
  proxyAgent?: HttpsProxyAgent<string>,
): Promise<VideoUploadResponse> => {
  // 创建请求URL
  const argUrl = `https://vas-lf-x.snssdk.com/video/openapi/v1/?action=${action}&s=${Math.random()
    .toString(36)
    .substr(2)}&use_edge_node=1&file_size=${fileSize}`;

  // 发送GET请求获取上传参数
  const result = await $http.get<VideoUploadResponse>(argUrl, {
    headers: {
      Authorization: authorization,
      'X-TT-Access': authorization.split(':')[3],
      'Content-Type': 'application/json',
      cookie: cookie,
    },
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  const data = result.data.data;

  // 如果是获取视频上传参数，处理上传URL
  if (action.startsWith('GetVideo')) {
    const uploadArgs = data as UploadVideoArgs;
    let uploadUrl: string | undefined;

    // 优先使用edge_nodes中的第一个节点
    if (uploadArgs.edge_nodes?.length > 0) {
      uploadUrl = `https://${uploadArgs.edge_nodes[0].tos_host}/${uploadArgs.edge_nodes[0].oid}`;
    }
    // 其次使用tos_host
    else if (uploadArgs.tos_host) {
      uploadUrl = `https://${uploadArgs.tos_host}/${uploadArgs.oid}`;
    }

    // 如果找不到上传节点信息，且不是最后一次重试，则继续重试
    if (!uploadUrl) {
      throw new Error('上传参数中未找到节点信息');
    }

    uploadArgs.uploadurl = uploadUrl;
    result.data.data = uploadArgs;
  }
  // 处理图片上传参数
  else if (action === 'GetImageUploadParams') {
    const imageArgs = data as UploadImageArgs;

    // 构建图片上传URL
    if (imageArgs.tos_host && imageArgs.object_ids?.length > 0) {
      imageArgs.uploadurl = `https://${imageArgs.tos_host}/${imageArgs.object_ids[0]}`;
    } else {
      throw new Error('图片上传参数中未找到节点信息');
    }
    result.data.data = imageArgs;
  }

  return result.data;
};

export const getUploadId = async (
  cookie: string,
  uploadArgs: VideoUploadResponse,
  proxyAgent?: HttpsProxyAgent<string>,
): Promise<PiPiXiaUploadIdResponse> => {
  const url = `${uploadArgs?.data?.uploadurl}?uploads`;

  // 发送请求获取授权信息
  const result = await $http.post(url, '------WebKitFormBoundaryxjKyummOEGmnyH9P--', {
    headers: {
      cookie: cookie,
      Accept: 'application/json, text/plain, */*',
      Referer: 'https://mp.pipix.com/mp/upload',
      Authorization: uploadArgs.data.tos_sign,
    },
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface PiPiXiaUploadIdResponse {
  Version: string;
  success: number;
  error: { code: number; error: number; error_code: number; message: string };
  payload: { uploadID: string };
}

export const uploadVideoPartResponse = async (
  uploadArgs: VideoUploadResponse,
  cookie: string,
  videoData: buffer.Buffer,
  partNum: number,
  uploadId: string,
  totalPartNums: number,
  crc32: string,
): Promise<PiPiXiaUploadPartResponse> => {
  const url =
    totalPartNums > 1
      ? `${uploadArgs.data.uploadurl}?partNumber=${partNum}&uploadID=${uploadId}`
      : uploadArgs.data.uploadurl ?? '';

  //const crc32 = crc.crc32(videoData).toString(16).replace('-', '');

  const headers = {
    cookie: cookie,
    referer: 'https://mp.pipix.com/mp/upload',
    Origin: 'https://mp.pipix.com',
    Authorization: uploadArgs.data.tos_sign,
    'X-Storage-U': 0, //userid
    'Content-CRC32': crc32,
  };

  const result = await (totalPartNums > 1
    ? $http.put(url, videoData, {
        headers: headers,
      })
    : $http.post(url, videoData, { headers: headers }));

  return result.data;
};

export interface PiPiXiaUploadPartResponse {
  Version: string;
  success: number;
  error: { code: number; error: string; error_code: number; message: string };
}

export const checkVideoUploadFinish = async (
  uploadArgs: VideoUploadResponse,
  cookie: string,
  uploadId: string,
  postStr: string,
): Promise<CheckUploadedVideoResponse> => {
  const url = `${uploadArgs.data.uploadurl}?uploadID=${uploadId}`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.pipix.com/mp/upload',
    Origin: 'https://mp.pipix.com',
    Authorization: uploadArgs.data.tos_sign,
    'X-Storage-U': 0, //userid
    'Content-Type': 'text/plain',
  };

  const result = await $http.post(url, postStr, { headers: headers });

  return result.data;
};

export interface CheckUploadedVideoResponse {
  Version: string;
  success: number;
  error: { code: number; error: number; error_code: number; message: string };
  payload: { hash: string; key: string };
}

export const uploadImageResponse = async (
  uploadArgs: VideoUploadResponse,
  cookie: string,
  imageData: buffer.Buffer,
): Promise<CheckUploadedVideoResponse> => {
  const url = uploadArgs.data.uploadurl ?? '';

  const crc32 = crc.crc32(imageData).toString(16).replace('-', '');

  const headers = {
    cookie: cookie,
    referer: 'https://mp.pipix.com/mp/upload',
    Origin: 'https://mp.pipix.com',
    Authorization: uploadArgs.data.tos_sign,
    'X-Storage-U': 0, //userid
    'Content-CRC32': crc32,
    'Content-Type': 'application/octet-stream',
  };

  const result = await $http.post(url, imageData, { headers: headers });

  return result.data;
};

export const getUploadedVideoInfoResponse = async (
  uploadArgs: VideoUploadResponse,
  cookie: string,
  authorKeyStr: string,
): Promise<UploadedVideoInfoResponse> => {
  const args = uploadArgs.data as UploadVideoArgs;

  const url = `https://vas-lf-x.snssdk.com/video/openapi/v1/?action=UpdateVideoUploadInfos&${args.edge_nodes[0].extra_param}`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.pipix.com/mp/upload',
    Origin: 'https://mp.pipix.com',
    Authorization: authorKeyStr,
    'X-TT-Access': authorKeyStr?.split(':')[3],
  };

  const postData = {};
  postData['vid'] = args.edge_nodes[0].vid;
  postData['oid'] = args.edge_nodes[0].oid;
  postData['token'] = args.edge_nodes[0].token;
  postData['poster_ss'] = 0;
  postData['user_reference'] = '';
  postData['is_exact_poster'] = true;

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

export interface UploadedVideoInfoResponse {
  code: number;
  message: string;
  data: {
    vid: string;
    file_type: string;
    fps: string | number; // 可能为字符串或数字类型
    v_bit_depth: number;
    v_duration: number;
    v_bitrate: number;
    v_nb_streams: number;
    a_duration: number;
    a_bitrate: number;
    a_sample_rate: number;
    a_nb_streams: number;
    s_duration: number;
    s_nb_streams: number;
    s_tags: null;
    sha256: string;
    video: {
      oid: string;
      height: number;
      width: number;
      origin_height: number;
      origin_width: number;
      duration: number;
      bitrate: number;
      md5: string;
      format: 'MP4';
      size: number;
      definition: 'unknown';
      codec: 'h264';
    };
    poster: {
      oid: string;
    };
    user_reference: string;
    storage_node: 'hl';
  };
}

export const getUploadedImageInfoResponse = async (
  uploadArgs: VideoUploadResponse,
  cookie: string,
  authorKeyStr: string,
): Promise<UploadedImageInfoResponse> => {
  const args = uploadArgs.data as UploadImageArgs;

  const url = `https://vas-lf-x.snssdk.com/video/openapi/v1/?action=GetImageUploadInfos&`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.pipix.com/mp/upload',
    Origin: 'https://mp.pipix.com',
    Authorization: authorKeyStr,
    'X-TT-Access': authorKeyStr?.split(':')[3],
  };

  const postData = [{ uri: args.object_ids[0] }];

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

export interface UploadedImageInfoResponse {
  //2000;
  code: number;
  message: string;
  data: Array<{
    uri: string;
    result_uri: string;
    info: {
      height: number;
      width: number;
      size: number;
      format: string;
      dyn: boolean;
      framecnt: number;
      md5: string;
    };
    custom: '';
  }>;
}

export const getCsrfToken = async (cookie: string): Promise<string> => {
  const url = `https://mp.pipix.com/api`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.pipix.com/mp/upload',
    Origin: 'https://mp.pipix.com',
    'x-secsdk-csrf-request': '1',
    'x-secsdk-csrf-version': '1.2.10',
  };

  const result = await $http.head(url, { headers: headers });

  return result.headers['x-ware-csrf-token']?.split(',')[1];
};

export const publishPiPiXiaVideoResponse = async (
  cookie: string,
  postStr: string,
  csrfToken: string,
  proxyAgent?: HttpsProxyAgent<string>|object,
): Promise<PiPiXiaPublishResponse> => {
  const url = `https://mp.pipix.com/api/mp/bds/webapi/item_post/`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.pipix.com/mp/upload',
    Origin: 'https://mp.pipix.com',
    'x-secsdk-csrf-token': csrfToken,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const result = await $http.post(url, postStr, { headers: headers, httpAgent: proxyAgent, httpsAgent: proxyAgent });

  return result.data;
};

export interface PiPiXiaPublishResponse {
  status_code: number;
  status_message: string;
  message: string;
  data: {
    item: {
      item_id_str: string;
    };
  };
}
