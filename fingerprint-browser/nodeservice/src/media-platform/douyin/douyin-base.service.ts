import { $http, createHttpInstance, HttpConfig } from '../../http';

import crc from 'crc';
import fs from 'fs';
import { AxiosInstance, AxiosProxyConfig, AxiosResponse } from 'axios';
import { UploadAuthInfo } from '../douyin/douyin-video.service';
import { aws4Interceptor } from 'aws4-axios';
import crypto from 'crypto';
import { isJson } from '../../utils';
import { DouyinPublishResult } from './douyin-video';

/**
 * 获取sdktoken后续接口需要添加到头部
 * @param cookie
 * @param i
 * @param proxy
 * @constructor
 */
export const getSdkToken = async (
  cookie: string,
  i: number = 0,
  proxy: object | undefined = undefined,
): Promise<string> => {
  const urls = [
    'https://creator.douyin.com/web/api/media/anchor/search',
    'https://creator.douyin.com/web/api/media/aweme/create/',
    'https://creator.douyin.com/aweme/v1/creator/homepage/module/',
  ];
  const url = urls[i % urls.length];
  const result = await $http.head(url, {
    headers: {
      cookie: cookie,
      Accept: 'application/json, text/plain, */*',
      referer: 'https://creator.douyin.com/content/upload',
      // TODO: 需要注意secsdk参数变化
      'x-secsdk-csrf-request': 1,
      'x-secsdk-csrf-version': '1.2.7',
    },
    httpsAgent: proxy,
    httpAgent: proxy,
  });

  return result.headers['x-ware-csrf-token']?.toString()?.split(',')[1] ?? '';
};

/**
 *获取认证参数,后续获取上传参数请求头部签名计算需要
 * @param cookie
 * @param proxy
 * @constructor
 */
export const getAuthKey = async (
  cookie: string,
  proxy: AxiosProxyConfig | undefined = undefined,
): Promise<AuthDataOutput> => {
  const result = await $http.get('https://creator.douyin.com/web/api/media/upload/auth/v5/', {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: {
      cookie: cookie,
      Accept: 'application/json, text/plain, */*',
      referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
    },
    proxy: proxy,
  });

  return result.data;
};

/**
 * 部分接口会用，备用
 * @param cookie
 */
export const getAgwAuthKey = async (cookie: string): Promise<AwgAuthDataOutPut> => {
  const url = `https://creator.douyin.com/web/api/media/aweme/search/post/auth?cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${encodeURIComponent(
    HttpConfig.userAgent,
  )}&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&msToken=&a_bogus=`;
  const headers = {
    cookie: cookie,
    Accept: 'application/json, text/plain, */*',
    referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
  };
  const result = await $http.get(url, {
    headers: headers,
  });

  return result.data;
};

export const uploadCover = async (
  userId: string,
  imgUrl: string,
  authData: AuthDataOutput,
  taskId: string,
  pubResult: DouyinPublishResult,
  encrypt: boolean = false,
  proxy: AxiosProxyConfig | undefined = undefined,
): Promise<uploadedImageInfo | null> => {
  // 提取认证信息
  const authResult: UploadAuthInfo = JSON.parse(authData.auth);
  if (proxy) {
    console.log('proxy', proxy.host);
  }
  // 初始化 http
  const $http = createHttpInstance();
  $http.interceptors.request.use(
    aws4Interceptor({
      instance: $http,
      options: {
        region: 'cn-north-1',
        service: 'imagex',
      },
      credentials: {
        accessKeyId: authResult.AccessKeyID,
        secretAccessKey: authResult.SecretAccessKey,
        sessionToken: authResult.SessionToken,
      },
    }),
  );

  //获取上传参数
  const uploadImageArgs = await getImageUploadArgs(userId, $http);
  if (!(uploadImageArgs?.Result?.InnerUploadAddress?.UploadNodes?.length > 0)) {
    // console.debug('获取封面上传参数失败', taskId, uploadImageArgs);
    pubResult.code = 2;
    pubResult.msg = `获取封面上传参数失败${uploadImageArgs?.ResponseMetadata?.Error?.Message ?? ''}`;
    return null;
  }
  //读取他图片数据
  const imgDataRes = await convertImageFileToBuffer(imgUrl);
  if (!imgDataRes || !(imgDataRes?.length > 0)) {
    // console.debug('封面读取失败', taskId, imgUrl);
    pubResult.code = 2;
    pubResult.msg = `读取封面失败${imgUrl}`;
    return null;
  }
  //上传图片
  const imgResult = await uploadImage(userId, imgDataRes, uploadImageArgs);
  if (!imgResult?.data?.crc32) {
    // console.debug('封面上传失败', taskId, imgUrl, imgResult);
    pubResult.code = 2;
    pubResult.msg = `封面上传失败${imgUrl}-${imgResult?.message}`;
    return null;
  }

  //提取上传信息
  const imgInfo = await getUploadedImageInfo(userId, $http, uploadImageArgs, encrypt);
  if (imgInfo?.Result?.Results?.length > 0) {
    pubResult.code = 0;
    pubResult.msg = '';
    return imgInfo;
  } else {
    return null;
  }
};

/**
 * 获取图片上传参数
 * @param userId 用户id
 * @param $http
 * @param proxy
 */
const getImageUploadArgs = async (
  userId: string,
  $http: AxiosInstance,
  proxy: AxiosProxyConfig | undefined = undefined,
): Promise<uploadImageArgs> => {
  const headers = {};
  headers['Referer'] = 'https://creator.douyin.com/';
  headers['Origin'] = 'https://creator.douyin.com';
  headers['User-Agent'] = HttpConfig.userAgent;
  const result = await $http.get<never, AxiosResponse<uploadImageArgs>>('https://imagex.bytedanceapi.com', {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    params: {
      // 固定参数
      Action: 'ApplyImageUpload',
      Version: '2018-08-01',
      ServiceId: 'jm8ajry58r',
      app_id: 2906,

      // 当前用户ID
      user_id: userId,

      // 随机字符
      s: Math.random().toString(36).substring(2),
    },
    headers: headers,
    proxy: proxy,
  });
  return result?.data;
};

/**
 * 上传图片
 * @param userId
 * @param imageData
 * @param uploadArgs
 * @param proxy
 */
const uploadImage = async (
  userId: string,
  imageData: Buffer,
  uploadArgs: uploadImageArgs,
  proxy: AxiosProxyConfig | undefined = undefined,
): Promise<uploadImageResult> => {
  let uploadNode = uploadArgs?.Result?.InnerUploadAddress?.UploadNodes[0];
  if (
    uploadArgs?.Result?.InnerUploadAddress?.UploadNodes?.length > 1 &&
    (!uploadNode.SessionKey?.toString() || !uploadNode.UploadHost?.toString() || !(uploadNode?.StoreInfos?.length > 0))
  ) {
    uploadNode = uploadArgs?.Result?.InnerUploadAddress?.UploadNodes[1];
  }

  const crc32Str = crc.crc32(imageData).toString(16).replace('-', '');
  const headers = {
    'Content-CRC32': crc32Str,
    Authorization: uploadNode?.StoreInfos[0].Auth,
    'Content-Type': 'application/octet-stream',
    'X-Storage-U': userId,
    'User-Agent': HttpConfig.userAgent,
    referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
  };

  const uploadUrl = `https://${uploadNode.UploadHost}/upload/v1/${uploadNode.StoreInfos[0]?.StoreUri}`;
  const result = await $http.post(uploadUrl, imageData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    proxy: proxy,
  });

  return result?.data;
};
export const CalcSha256Hex = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex').toString();
};
/**
 * 获取图片上传参数
 * @param userId
 * @param $http
 * @param uploadArgs
 * @param encrypt
 * @param proxy
 */
const getUploadedImageInfo = async (
  userId: string,
  $http: AxiosInstance,
  uploadArgs: uploadImageArgs,
  encrypt: boolean = false,
  proxy: AxiosProxyConfig | undefined = undefined,
): Promise<uploadedImageInfo> => {
  const headers = {};
  headers['Referer'] = 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page';
  headers['Origin'] = 'https://creator.douyin.com';
  headers['User-Agent'] = HttpConfig.userAgent;
  const postData = {
    SessionKey: uploadArgs.Result.InnerUploadAddress.UploadNodes[0].SessionKey,
  };
  if (encrypt) {
    postData['Functions'] = [
      {
        name: 'Encryption',
        input: { Config: { copies: 'cipher_v2' }, PolicyParams: { 'policy-set': 'check,thumb,medium,large' } },
      },
    ];
  }

  const result = await $http.post<never, AxiosResponse<uploadedImageInfo>>(
    'https://imagex.bytedanceapi.com',
    postData,
    {
      retryCondition: (error, response) => {
        return !isJson(response.data);
      },
      headers: {
        'User-Agent': HttpConfig.userAgent,
        Accept: '*/*',
        Origin: 'https://creator.douyin.com',
        Referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
        'X-Amz-Content-Sha256': CalcSha256Hex(JSON.stringify(postData)),
      },
      params: {
        // 固定参数
        Action: 'CommitImageUpload',
        Version: '2018-08-01',
        ServiceId: 'jm8ajry58r',
        app_id: 2906,

        // 当前用户ID
        user_id: userId,
      },
      proxy: proxy,
    },
  );
  return result?.data;
};

export const convertImageFileToBuffer = async (filePath: string): Promise<Buffer> => {
  // 网络图片
  if (filePath.startsWith('http')) {
    const result = await $http.get(filePath, {
      responseType: 'arraybuffer',
    });
    return result.data;
  } else {
    return await fs.promises.readFile(filePath);
  }
};

/**
 * 发布时挂载商品的单个结构
 */
export interface douyinPublishGoodsInfo {
  promotion_id: string;
  elastic_title: string;
  elastic_img: string;
  label: null;
  product_id: string;
  promotion_source: number;
  third_party: 2;
}

export interface uploadedImageInfo {
  status_msg?: string;
  Result: {
    Results: Array<{
      Uri: string;
      UriStatus: number;
      Encryption: {
        Extra: {
          img_size: number;
          img_width: number;
          img_height: number;
          img_format: string;
        };
        SecretKey: string;
        SourceMd5: string;
        Uri: string;
      };
    }>;
    PluginResult: Array<ImagePartInfo>;
  };
  ResponseMetadata?: {
    Error?: {
      CodeN?: number;
      Code?: string;
      Message: string;
    };
  };
}

export interface ImagePartInfo {
  FileName: string;
  SourceUri: string;
  ImageUri: string;
  ImageWidth: number;
  ImageHeight: number;
  ImageMd5: string;
  ImageFormat: string;
  ImageSize: number;
  FrameCnt: number;
}

export interface uploadImageResult {
  code: number;
  apiversion: string;
  message: string;
  data: { crc32: string };
}

export interface uploadImageArgs {
  Result: {
    InnerUploadAddress: {
      UploadNodes: Array<{
        StoreInfos: Array<{
          StoreUri: string;
          Auth: string;
          UploadID: string;
        }>;
        UploadHost: string;
        SessionKey: string;
      }>;
    };
  };
  ResponseMetadata?: {
    Error?: {
      CodeN?: number;
      Code?: string;
      Message: string;
    };
  };
}

/**
 * 获取的认证参数结构
 */
export interface AuthDataOutput {
  ak: string;
  auth: string;
  /**
   * 状态码
   * -0正常，非0异常
   */
  status_code: number;
  /**
   *提示信息/可用于判断账号被封禁
   */
  status_msg: string;
}

export interface AwgAuthDataOutPut {
  signature: string;
  status_code: number;
  status_msg: string;
}

export const getViewHistoryListResponse = async (
  cookie: string,
  maxCursor: number = 0,
): Promise<DouyinViewHistoryResponse> => {
  const url = `https://creator.douyin.com/aweme/v1/view/history/list/?max_cursor=${maxCursor}&min_cursor=0&count=20&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${encodeURIComponent(
    HttpConfig.userAgent,
  )}&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&msToken=`;

  const headers = {
    cookie: cookie,
    Referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=draft',
  };

  const result = await $http.get(url, {
    headers: headers,
  });

  return result.data;
};

export interface DouyinViewHistoryResponse {
  /**
   * 状态码
   */
  status_code: number;
  /**
   * 状态消息
   */
  status_msg: string;

  /**
   * 下一页参数
   */
  max_cursor?: number;

  /**
   * 是否有下一页
   * 1:是
   * 0:否
   */
  has_more?: 1 | 0;

  /**
   * 内容列表
   */
  aweme_list?: Array<DouyinHistoryMediaContent>;
}

export interface DouyinHistoryMediaContent {
  video: {
    cover: {
      //封面列表
      url_list: Array<string>;
    };
  };
  /**
   * 作品id
   */
  aweme_id: string;

  /**
   * 内容类型
   */
  aweme_type: number;

  /**
   * 内容标题
   */
  item_title: string;

  /**
   * 描述
   */
  desc: string;

  /**
   * 发布时间
   */
  create_time: number;

  /**
   * 内容统计数据
   */
  statistics: {
    /**
     * 作品id
     */
    aweme_id: string;
    /**
     * 收藏数
     */
    collect_count: number;
    /**
     * 评论数
     */
    comment_count: number;
    /**
     * 点赞数
     */
    digg_count: number;

    forward_count: number;
    /**
     * 直播观看数
     */
    live_watch_count: number;
    /**
     * 播放量
     */
    play_count: number;
    /**
     * 分享数
     */
    share_count: number;
  };
}
