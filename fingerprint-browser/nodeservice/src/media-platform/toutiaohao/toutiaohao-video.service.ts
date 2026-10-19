import { $http, HttpConfig } from '../../http';
import { AxiosInstance, AxiosResponse } from 'axios';
import * as buffer from 'buffer';
import crc from 'crc';
import { isJson, readImageData } from '../../utils';
import { errorCode } from '../errorCode';
import { ToutiaohaoPublishResultOutput } from './toutiaohao-article';
import crypto from 'crypto';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 上传分片结果（仅包含所需字段）
 */
export interface UploadPartResult {
  /**
   * 分片序号
   */
  partNum: number;
  /**
   * 分片数据
   */
  data?: {
    /**
     * 分片序号
     */
    part_number: string;
    /**
     * CRC32校验码
     */
    crc32: string;
  };
  /**
   * 状态码
   * -2000为正常
   */
  code: number;

  /**
   *  提示消息
   */
  message?: string;
}

/**
 * 提交图片上传输出项
 */
export interface CommitImageUploadResponse {
  ResponseMetadata: {
    RequestId: string;
    Action: string;
    Version: string;
    Service: string;
    Region: string;
    Error?: {
      CodeN: string;
      Code: string;
      Message: string;
    };
  };
  Result: {
    Results: Array<{ Uri: string; UriStatus: number }>;
    RequestId: string;
    PluginResult: Array<{
      FileName: string;
      SourceUri: string;
      ImageUri: string;
      ImageWidth: number;
      ImageHeight: number;
      ImageMd5: number;
      ImageFormat: string;
      ImageSize: number;
      FrameCnt: number;
    }>;
  };
}

/**
 * 提交图片上传
 * @param $http Axios 实例
 * @param {string} userId 当前用户ID
 * @param {string} sessionKey 上传会话信息
 * @return {Promise<CommitImageUploadResponse>}
 */
export const commitImageUpload = async (
  $http: AxiosInstance,
  userId: string,
  sessionKey: string,
): Promise<CommitImageUploadResponse> => {
  const postData = {
    SessionKey: sessionKey,
  };

  const result = await $http.post<never, AxiosResponse<CommitImageUploadResponse>>(
    'https://imagex.bytedanceapi.com',
    postData,
    {
      retryCondition: (error, response) => {
        return !isJson(response.data);
      },
      headers: {
        Accept: '*/*',
        Origin: 'https://creator.douyin.com',
        Referer: 'https://creator.douyin.com/',
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
    },
  );

  return result.data;
};

/**
 * 获取上传参数，后续视频上传需要
 * @param videoSize
 * @param userId
 * @param $http
 * @param fileType
 * @param spaceNmae
 */
export const getVideoUploadArgs = async (
  videoSize: number,
  userId: string,
  $http: AxiosInstance,
  fileType: string = 'video',
  spaceNmae: string = 'middlevideo_toutiao',
): Promise<UploadVideoArgs> => {
  const sId = Math.random().toString(36).substring(2);
  const headers = {};
  headers['Referer'] = 'https://mp.toutiao.com/';

  const result = await $http.get<never, AxiosResponse<UploadVideoArgs>>('https://vod.bytedanceapi.com', {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    params: {
      Action: 'ApplyUploadInner',
      Version: '2020-11-19',
      SpaceName: spaceNmae,
      FileType: fileType,
      IsInner: 1,
      FileSize: videoSize,
      EnOID: 1,
      app_id: 1231,
      user_id: userId,
      s: sId,
    },
    headers: headers,
  });

  return result?.data;
};

/**
 * 上传视频，并返回视频的crc32值，后续校验需要
 * @param videoData 视频二进制数据
 * @param partNum 视频分片编号
 * @param blockSize 分片大小固定值
 * @param userId 用户id
 * @param uploadId 上传id,随机Guid值，同一个视频多个分辨需要一致
 * @param uploadArgs 上传参数
 */
export const uploadVideoPart = async (
  videoData: buffer.Buffer,
  partNum: number,
  blockSize: number,
  userId: string,
  uploadId: string,
  uploadArgs: UploadVideoArgs,
): Promise<UploadPartResult> => {
  let uploadNode = uploadArgs?.Result?.InnerUploadAddress?.UploadNodes[0];
  if (
    uploadArgs?.Result?.InnerUploadAddress?.UploadNodes?.length > 1 &&
    (!uploadNode.SessionKey?.toString() || !uploadNode.UploadHost?.toString() || !(uploadNode?.StoreInfos?.length > 0))
  ) {
    uploadNode = uploadArgs?.Result?.InnerUploadAddress?.UploadNodes[1];
  }

  const crc32Str = crc.crc32(videoData).toString(16).replace('-', '');
  const headers = {
    'Content-CRC32': crc32Str,
    Authorization: uploadNode?.StoreInfos[0].Auth,
    'Content-Type': 'application/octet-stream',
    'X-Storage-U': userId,
    'User-Agent': HttpConfig.userAgent,
    Referer: 'https://mp.toutiao.com/',
  };

  const uploadUrl = `https://${uploadNode.UploadHost}/upload/v1/${uploadNode.StoreInfos[0]
    ?.StoreUri}?uploadid=${uploadId}&part_number=${partNum}&phase=transfer&part_offset=${(partNum - 1) * blockSize}`;
  let result = await $http.post(uploadUrl, buffer.Buffer.from(videoData), {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });
  if (!(result.data && typeof result.data == 'object')) {
    result = await $http.post(uploadUrl, buffer.Buffer.from(videoData), {
      retryCondition: (error, response) => {
        return !isJson(response.data);
      },
      headers: headers,
    });
  }
  if (result.data && typeof result.data == 'object') {
    result.data.partNum = partNum;
    const reData: UploadPartResult = result.data as UploadPartResult;
    if (!reData?.data?.crc32) {
      // console.debug(`分片上传失败:${partNum}`, result.data);
    }
  } else {
    return { code: result.status, message: '服务异常', partNum: -1 };
  }

  return result?.data;
};

/**
 * 分片上传完成后进行整体校验是否成功
 * @param userId 用户uid
 * @param uploadId 上传id
 * @param uploadPartListStr 分片上传结果的列表链接字符串，格式partNum:crc32 eg: 1:5071ef55,2:a38225ca,3:24236b53,4:e37922fa
 * @param uploadArgs 上传参数
 * @constructor
 */
export const checkVideoUpload = async (
  userId: string,
  uploadId: string,
  uploadPartListStr: string,
  uploadArgs: UploadVideoArgs,
): Promise<CheckUploadResultResponse> => {
  let uploadNode = uploadArgs?.Result?.InnerUploadAddress?.UploadNodes[0];
  if (
    uploadArgs?.Result?.InnerUploadAddress?.UploadNodes?.length > 1 &&
    (!uploadNode.SessionKey?.toString() || !uploadNode.UploadHost?.toString() || !(uploadNode?.StoreInfos?.length > 0))
  ) {
    uploadNode = uploadArgs?.Result?.InnerUploadAddress?.UploadNodes[1];
  }
  const headers = {
    Authorization: uploadNode?.StoreInfos[0].Auth,
    'Content-Type': 'text/plain;charset=UTF-8',
    Referer: 'https://mp.toutiao.com/',
    'X-Storage-U': userId,
    'User-Agent': HttpConfig.userAgent,
  };

  const uploadUrl = `https://${uploadNode.UploadHost}/upload/v1/${uploadNode.StoreInfos[0]?.StoreUri}?uploadid=${uploadId}&phase=finish&uploadmode=part`;
  const result = await $http.post(uploadUrl, uploadPartListStr, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result?.data;
};

export interface CheckUploadResultResponse {
  /**
   *  状态码，0：正常，非0异常
   */
  code: number;
  apiversion: string;
  message: string;
  data?: {
    /**
     *上传完成的crc32
     */
    hash: string;
    /**
     *视频唯一key
     */
    key: string;
  };
}

/**
 * 获取上传完成视频信息
 * @param userId
 * @param uploadArgs
 * @param spaceName
 * @param $http
 */
export const getUploadedVideoInfo = async (
  userId: string,
  uploadArgs: UploadVideoArgs,
  spaceName: string,
  $http: AxiosInstance,
): Promise<UploadedVideoInfo> => {
  let uploadNode = uploadArgs?.Result?.InnerUploadAddress?.UploadNodes[0];
  if (
    uploadArgs?.Result?.InnerUploadAddress?.UploadNodes?.length > 1 &&
    (!uploadNode.SessionKey?.toString() || !uploadNode.UploadHost?.toString() || !(uploadNode?.StoreInfos?.length > 0))
  ) {
    uploadNode = uploadArgs?.Result?.InnerUploadAddress?.UploadNodes[1];
  }

  const requestBody = {
    SessionKey: uploadNode?.SessionKey,
    Functions: [{ name: 'GetMeta' }],
  };

  const headers = {
    Referer: 'https://mp.toutiao.com/',
    'User-Agent': HttpConfig.userAgent,
    'X-Amz-Content-Sha256': CalcSha256Hex(JSON.stringify(requestBody)),
  };

  const result = await $http.post<never, AxiosResponse<UploadedVideoInfo>>(
    'https://vod.bytedanceapi.com',
    requestBody,
    {
      retryCondition: (error, response) => {
        return !isJson(response.data);
      },
      headers: headers,
      params: {
        Action: 'CommitUploadInner',
        Version: '2020-11-19',
        SpaceName: spaceName,
        app_id: 1231,
        user_id: userId,
      },
    },
  );

  return result?.data;
};
/**
 * 推送数据
 * @param cookie
 * @param sdkToken
 * @param csrfToken
 * @param postData
 * @param taskId
 * @param proxyAgent
 */
export const publish = async (
  cookie: string,
  sdkToken: string,
  csrfToken: string,
  postData: string,
  taskId: string,
  proxyAgent: HttpsProxyAgent<string> | object | undefined,
): Promise<ToutiaohaoVideoPublishResponse> => {
  const headers = {
    cookie: cookie,
    'x-secsdk-csrf-token': sdkToken,
    'x-csrf-token': csrfToken,
    Referer: 'https://mp.toutiao.com/profile_v4/xigua/upload-video',
    'Content-Type': 'application/json',
  };

  const url = 'https://mp.toutiao.com/xigua/api/upload/PublishVideo';

  // console.debug('头条视频推送数据', taskId, cookie, postData);
  const publishResult = await $http.post(url, postData, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });
  // console.debug('头条视频返回数据', taskId, publishResult.data);

  if (isJson(publishResult.data)) {
    return publishResult.data;
  } else {
    return {
      status: publishResult.status ?? errorCode.data_error,
      message: '服务异常',
    };
  }
};

export interface ToutiaohaoVideoPublishResponse {
  data?: {
    /**
     * 作品唯一publishId
     */
    ItemId: string;
    ItemType: number;
    GroupSource: number;
    Code: number;
    Message: string;
    AwemeEditResult: { StatusMessage: string; StatusCode: number };
    BaseResp?: {
      StatusMessage: string;
      StatusCode: number;
      Extra: { traceparent: string };
    };
  };
  /**
   * 状态码，0:正常，非0异常
   */
  status: number;
  /**
   * 提示消息
   */
  message: string;
}

/**
 * 获取的上传参数结构
 */
export interface UploadVideoArgs {
  status_code: number;
  status_msg: string;
  Result: {
    InnerUploadAddress: {
      UploadNodes: Array<{
        Vid: string;
        Vids: Array<string>;
        StoreInfos: Array<{
          StoreUri: string;
          Auth: string;
          UploadID: string;
        }>;
        UploadHost: string;
        SessionKey: string;
      }>;
      AdvanceOption: {
        EncryptionKey: string;
      };
    };
  };
  Error: {
    CodeN: number;
    Code: string;
    Message: string;
  };
}

/**
 * 上传视频结果
 */
export interface UploadedVideoInfo {
  status_code: number;
  status_msg?: string;
  Result: {
    Results: Array<{
      Vid: string;
      VideoMeta: {
        Uri: string;
        Height: number;
        Width: number;
        OriginHeight: number;
        OriginWidth: number;
        Duration: number;
        Bitrate: number;
        Md5: string;
        Format: string;
        Size: number;
        FileType: string;
        Codec: string;
      };
      PosterUri: string;
    }>;
  };
  //文章嵌入视频的额外自动获取封面，上传结果无此信息
  posterUrl?: string;
}

/**
 * 获取sdktoken后续接口需要添加到头部
 * @param cookie
 * @constructor
 */
export const getSdkToken = async (cookie: string): Promise<string> => {
  const url = 'https://mp.toutiao.com/mp/agw/media/get_im_user_info';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.toutiao.com/profile_v4/xigua/upload-video',
    'x-secsdk-csrf-request': 1,
    'x-secsdk-csrf-version': '1.2.17',
  };

  const result = await $http.head(url, {
    headers: headers,
  });

  return (result.headers['x-ware-csrf-token']?.toString() ?? ',')?.split(',')[1];
};

/**
 *获取认证参数,后续获取上传参数请求头部签名计算需要
 * @param cookie
 * @param typeStr
 * @constructor
 */
export const getAuthKey = async (cookie: string, typeStr: 'video' | 'image_tmp' = 'video'): Promise<AuthDataOutput> => {
  const result = await $http.get(
    `https://mp.toutiao.com/xigua/api/upload/getAuthKey/?params=%7B%22type%22%3A%22${typeStr}%22%2C%22column%22%3Afalse%2C%22ugc%22%3Afalse%2C%22useImageX%22%3Atrue%2C%22useStsToken%22%3Atrue%7D`,
    {
      retryCondition: (error, response) => {
        return !isJson(response.data);
      },
      headers: {
        cookie: cookie,
        Accept: '*/*',
        referer: 'https://mp.toutiao.com/profile_v4/xigua/upload-video',
      },
    },
  );

  return result.data;
};

export const uploadCover = async (
  cookie: string,
  userId: string,
  imgUrl: string,
  taskId: string,
  pubResult: ToutiaohaoPublishResultOutput,
): Promise<UploadedImageInfo | null> => {
  //获取上传认证key
  const authData = await getAuthKey(cookie, 'image_tmp');
  if (!authData?.data?.uploadToken) {
    // console.debug('获取认证参数失败', taskId, authData);
    pubResult.code = authData.status;
    pubResult.msg = '获取认证参数失败:' + (authData.message ?? '');
    return null;
  }

  //读取他图片数据
  const imgDataRes = await readImageData(imgUrl);
  if (!imgDataRes?.data || !(imgDataRes?.data?.length > 0)) {
    // console.debug('封面读取失败', taskId, imgUrl);
    pubResult.code = 2;
    pubResult.msg = `读取封面失败${imgUrl}`;
    return null;
  }

  //获取上传参数
  const uploadImageArgs = await getImageUploadArgs(cookie, authData, imgDataRes.data.length);
  if (!uploadImageArgs?.data?.tos_sign) {
    // console.debug('获取封面上传参数失败', taskId, uploadImageArgs);
    pubResult.code = 2;
    pubResult.msg = `获取封面上传参数失败${uploadImageArgs.message ?? ''}`;
    return null;
  }

  //上传图片
  const imgResult = await uploadImage(userId, imgDataRes.data, uploadImageArgs);
  if (!imgResult?.payload?.key) {
    // console.debug('封面上传失败', taskId, imgUrl, imgResult);
    pubResult.code = 2;
    pubResult.msg = `封面上传失败${imgUrl}-${imgResult?.error ?? imgResult.success}`;
    return null;
  }

  //提取上传信息
  const imgInfo = await getUploadedImageInfo(uploadImageArgs.data.object_ids[0], authData);
  if (imgInfo?.data && imgInfo?.data?.length > 0) {
    pubResult.code = 0;
    pubResult.msg = '';
    return imgInfo;
  } else {
    return null;
  }
};

/**
 * 获取图片上传参数
 * @param cookie
 * @param authData
 * @param fileSize
 */
const getImageUploadArgs = async (
  cookie: string,
  authData: AuthDataOutput,
  fileSize: number,
): Promise<UploadImageArgs> => {
  const authStr = JSON.stringify(authData.data?.uploadToken);
  const headers = {
    cookie: cookie,
    referer: 'https://mp.toutiao.com/',
    'X-TT-Access': authData.data?.accessKey,
    Authorization: authStr.substring(1, authStr.length - 1),
  };

  const result = await $http.get<never, AxiosResponse<UploadImageArgs>>(
    'https://vas-lf-x.ixigua.com/video/openapi/v1/',
    {
      retryCondition: (error, response) => {
        return !isJson(response.data);
      },
      params: {
        // 固定参数
        action: 'GetImageUploadParams',
        use_edge_node: 1,
        file_size: fileSize,
        app_id: 1231,
        // 随机字符
        s: Math.random().toString(36).substring(2),
      },
      headers: headers,
    },
  );

  return result?.data;
};

/**
 * 上传图片
 * @param userId
 * @param imageData
 * @param uploadArgs
 */
const uploadImage = async (
  userId: string,
  imageData: Buffer,
  uploadArgs: UploadImageArgs,
): Promise<UploadImageResult> => {
  const crc32Str = crc.crc32(imageData).toString(16).replace('-', '');

  const headers = {
    'Content-CRC32': crc32Str,
    Authorization: uploadArgs.data?.tos_sign,
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': 'attachment;filename="undefined"',
    'X-Storage-U': userId,
    referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
  };

  const uploadUrl = `https://${uploadArgs.data?.tos_host}/${uploadArgs.data?.object_ids[0]}`;

  const result = await $http.post(uploadUrl, imageData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result?.data;
};
export const CalcSha256Hex = (data: string): string => {
  return crypto.createHash('sha256').update(data).digest('hex').toString();
};
/**
 * 获取图片上传 成功数据
 * @param imgKeyUri
 * @param authData
 */
const getUploadedImageInfo = async (imgKeyUri: string, authData: AuthDataOutput): Promise<UploadedImageInfo> => {
  const authStr = JSON.stringify(authData.data?.uploadToken);
  const headers = {
    referer: 'https://mp.toutiao.com/',
    'X-TT-Access': authData.data?.accessKey,
    Authorization: authStr.substring(1, authStr.length - 1),
  };

  const postData = [{ uri: imgKeyUri }];

  const result = await $http.post<never, AxiosResponse<UploadedImageInfo>>(
    'https://vas-lf-x.ixigua.com/video/openapi/v1/?action=GetImageUploadInfos&',
    postData,
    {
      retryCondition: (error, response) => {
        return !isJson(response.data);
      },
      headers: headers,
    },
  );

  return result?.data;
};

export interface UploadedImageInfo {
  /**
   * 状态码 2000:正常，否则异常
   */
  code: number;
  /**
   * 提示消息
   */
  message: string;
  /**
   * 图片信息
   */
  data: Array<{
    /**
     * 图片uri
     */
    uri: string;
    result_uri: string;
    /**
     * 图片基础信息
     */
    info?: {
      height: number;
      width: number;
      size: number;
      /**
       * 图片格式/后缀
       */
      format: string;
      dyn: boolean;
      md5: string;
    };
    custom: '';
  }>;
}

export interface UploadImageResult {
  Version: string;
  /**
   * 状态码 0:正常,非0异常
   */
  success: number;
  error?: {
    /**
     * 内部服务状态码 200:正常
     */
    code: number;
    /**
     * 内务错误信息
     */
    error: string;
    /**
     * 错误码,0:正常
     */
    error_code: 0;
    /**
     * 提示消息
     */
    message: string;
  };
  payload?: {
    /**
     * 上传到服务端的数据crc32
     */
    hash: string;
    /**
     * 图片唯一key
     */
    key: string;
  };
}

export interface UploadImageArgs {
  /**
   * 状态码  2000:正常，否则异常
   */
  code: number;
  /**
   * 提示消息
   */
  message: string;

  /**
   * 上传信息体
   */
  data?: {
    /**
     * 上传域名
     */
    tos_host: string;
    /**
     * 上传authorization
     */
    tos_sign: string;
    /**
     * 上传路径列表
     */
    object_ids: Array<string>;
    /**
     * 存储桶
     */
    bucket: string;
    //空的
    access_key: string;
    delay_upload: number;
    trace_id: string;
  };
}

/**
 * 获取的认证参数结构
 */
export interface AuthDataOutput {
  data?: {
    spaceName: string;
    accessKey: string;
    uploadToken?: {
      //日期,0时区 CurrentTime=2024-01-15T08:14:19.689Z
      CurrentTime: string;
      //日期，0时区
      ExpiredTime: string;
      SessionToken: string;
      AccessKeyId: string;
      SecretAccessKey: string;
    };
  };
  /**
   * 状态码 0:正常,非0异常
   */
  status: number;
  /**
   * 提示消息
   */
  message: string;
}
//备用
export interface AwgAuthDataOutPut {
  signature: string;
  status_code: number;
  status_msg: string;
}

export const createTopicResponse = async (
  cookie: string,
  topics: Array<string>,
  sdkToken: string,
): Promise<CreateTopicResponse> => {
  const url = 'https://mp.toutiao.com/video/app/hashtag/create';

  const headers = {
    cookie: cookie,
    'x-secsdk-csrf-token': sdkToken,
    'Content-Type': 'application/json',
    Origin: 'https://mp.toutiao.com',
    referer: 'https://mp.toutiao.com/profile_v4/xigua/upload-video',
  };

  const postDta = { hashtag_name: topics };

  const result = await $http.post(url, postDta, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface CreateTopicResponse {
  /**
   * 状态码,0:正常，非0异常
   */
  code: number;
  data: Array<{
    /**
     * 话题id
     */
    id: number;
    /**
     * 话题id字符串
     */
    id_str: string;
    /**
     * 话题名字
     */
    name: string;
  }>;
  message: string;
}
