import { BadRequestException, UnknownException } from '../../error';
import { $http, HttpConfig } from '../../http';
import { AxiosInstance, AxiosResponse } from 'axios';
import * as buffer from 'buffer';
import crc from 'crc';
import { CalcSha256Hex } from './xiguashipin-base.service';
import { UploadPartResult } from './xiguashipin-video';
import { isJson } from '../../utils';

/**
 * 获取上传认证输出项
 */
export interface GetUploadAuthTokenOutput {
  /**
   * 状态码
   */
  status_code: number;
  /**
   * 状态消息
   */
  status_msg?: string;
  /**
   * ak
   */
  ak: string;
  /**
   * 认证信息
   *  - 结果为json序列化后的字符串，需要手动反序列化，类型为 UploadAuthInfo
   */
  auth: string;
}

/**
 * 上传认证信息
 */
export interface UploadAuthInfo {
  AccessKeyID: string;
  SecretAccessKey: string;
  SessionToken: string;
  AccessKeyId?: string;
}

/**
 * 获取上传认证参数
 * @param {string} cookie
 * @return {Promise<any>}
 */
const getUploadAuthToken = async (cookie: string): Promise<GetUploadAuthTokenOutput> => {
  const result = await $http.get<never, AxiosResponse<GetUploadAuthTokenOutput>>(
    'https://creator.douyin.com/web/api/media/upload/auth/v5/',
    {
      retryCondition: (error, response) => {
        return !isJson(response.data);
      },
      headers: {
        Cookie: cookie,
      },
    },
  );

  // 非正常请求，抛出异常
  if (result.data.status_code !== 0) {
    throw new BadRequestException(result.data.status_msg, result.data.status_code, result.data);
  }

  return result.data;
};

/**
 * 获取封面上传参数输出项
 */
export interface GetUploadCoverArgsOutput {
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
    UploadAddress: {
      StoreInfos: Array<{ StoreUri: string; Auth: string; UploadID: string }>;
      UploadHosts: Array<string>;
      SessionKey: string;
    };
  };
}

/**
 * 获取封面上传参数
 * @param {AxiosInstance} $http
 * @param {string} userId 当前用户ID
 */
const getCoverUploadArgs = async ($http: AxiosInstance, userId: string): Promise<GetUploadCoverArgsOutput> => {
  const result = await $http.get<never, AxiosResponse<GetUploadCoverArgsOutput>>('https://imagex.bytedanceapi.com', {
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
  });

  // 请求失败
  if (result.status === 400) {
    const error = result.data?.ResponseMetadata?.Error ?? undefined;
    throw new BadRequestException(error?.Message, error?.Code, result.data);
  }

  // 请求成功
  if (result.status === 200) {
    // 出现业务错误，如：AccessKey 无效
    const error = result.data.ResponseMetadata.Error;
    if (error?.Code) {
      throw new BadRequestException(error?.Message, error?.Code, result.data);
    }

    // 返回明确的成功
    return result.data;
  }

  throw new UnknownException();
};

/**
 * 上传封面图片输入项
 */
export interface UploadCoverImageInput {
  /**
   * 授权信息
   */
  authorization: string;
  /**
   * 上传主机
   */
  uploadHost: string;
  /**
   * store URI
   */
  storeUri: string;
  /**
   * 用户ID
   */
  userId: string;
  /**
   * CRC32 值
   */
  crc32: string;
  /**
   * 文件数据
   */
  data: Buffer;
}

/**
 * 上传封面图片输出项
 */
export interface UploadCoverImageOutput {
  crc32: string;
}

/**
 * 上传封面视频
 * @param {UploadCoverImageInput} input
 * @return {Promise<UploadCoverImageOutput>}
 */
const uploadCoverImage = async (input: UploadCoverImageInput): Promise<UploadCoverImageOutput> => {
  // 组装上传地址
  // 如：`https://tos-d-x-hl.snssdk.com/upload/v1/tos-cn-i-jm8ajry58r/b766820191cd4895992ea80d2c7010c5`
  const url = `https://${input.uploadHost}/upload/v1/${input.storeUri}`;

  // 执行上传
  const result = await $http.post(url, input.data, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: {
      Origin: 'https://creator.douyin.com',
      Referer: 'https://creator.douyin.com/',
      Authorization: input.authorization,
      Accept: '*/*',
      'Content-Disposition': 'attachment; filename="undefined"',
      'X-Storage-U': input.userId,
      'Content-Type': 'application/octet-stream',
      'Content-CRC32': input.crc32,
    },
  });

  return result.data;
};

/**
 * 提交图片上传输出项
 */
export interface CommitImageUploadOutput {
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
 * @return {Promise<CommitImageUploadOutput>}
 */
const commitImageUpload = async (
  $http: AxiosInstance,
  userId: string,
  sessionKey: string,
): Promise<CommitImageUploadOutput> => {
  const postData = {
    SessionKey: sessionKey,
  };

  const result = await $http.post<never, AxiosResponse<CommitImageUploadOutput>>(
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

  // 请求失败
  if (result.data.ResponseMetadata?.Error) {
    throw new BadRequestException(
      result.data.ResponseMetadata.Error.Message,
      result.data.ResponseMetadata.Error.Code,
      result.data,
    );
  }

  return result.data;
};

export const xiguaVideoService = {
  getUploadAuthToken: getUploadAuthToken,
  getCoverUploadArgs: getCoverUploadArgs,
  uploadCoverImage: uploadCoverImage,
  commitImageUpload: commitImageUpload,
};

/**
 * 获取上传参数，后续视频上传需要
 * @param videoSize
 * @param userId
 * @param $http
 */
export const getVideoUploadArgs = async (
  videoSize: number,
  userId: string,
  $http: AxiosInstance,
): Promise<uploadVideoArgs> => {
  const sId = Math.random().toString(36).substring(2);
  const headers = {};
  headers['Referer'] = 'https://studio.ixigua.com/';
  headers['User-Agent'] = HttpConfig.userAgent;

  const result = await $http.get<never, AxiosResponse<uploadVideoArgs>>('https://vod.bytedanceapi.com', {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    params: {
      Action: 'ApplyUploadInner',
      Version: '2020-11-19',
      SpaceName: 'pgc',
      FileType: 'video',
      IsInner: 1,
      FileSize: videoSize,
      app_id: 3062,
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
  uploadArgs: uploadVideoArgs,
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
    Referer: 'https://studio.ixigua.com/',
    Origin: 'https://studio.ixigua.com/',
  };

  const uploadUrl = `https://${uploadNode.UploadHost}/upload/v1/${uploadNode.StoreInfos[0]
    ?.StoreUri}?uploadid=${uploadId}&part_number=${partNum}&phase=transfer&part_offset=${(partNum - 1) * blockSize}`;
  const result = await $http.post(uploadUrl, buffer.Buffer.from(videoData), {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });
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
  uploadArgs: uploadVideoArgs,
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
    Referer: 'https://studio.ixigua.com/',
    Origin: 'https://studio.ixigua.com/',
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
  code: number;
  apiversion: string;
  message: string;
  data?: { hash: string; key: string };
}

export const getUploadedVideoInfo = async (
  userId: string,
  uploadArgs: uploadVideoArgs,
  $http: AxiosInstance,
): Promise<uploadedVideoInfo> => {
  let uploadNode = uploadArgs?.Result?.InnerUploadAddress?.UploadNodes[0];
  if (
    uploadArgs?.Result?.InnerUploadAddress?.UploadNodes?.length > 1 &&
    (!uploadNode.SessionKey?.toString() || !uploadNode.UploadHost?.toString() || !(uploadNode?.StoreInfos?.length > 0))
  ) {
    uploadNode = uploadArgs?.Result?.InnerUploadAddress?.UploadNodes[1];
  }

  const requestBody = {
    SessionKey: uploadNode?.SessionKey,
    Functions: [{ name: 'GetMeta' }, { name: 'Snapshot', input: { SnapshotTime: 0 } }],
  };

  const headers = {
    Referer: 'https://studio.ixigua.com/',
    Origin: 'https://studio.ixigua.com/',
    'User-Agent': HttpConfig.userAgent,
    'X-Amz-Content-Sha256': CalcSha256Hex(JSON.stringify(requestBody)),
  };

  const result = await $http.post<never, AxiosResponse<uploadedVideoInfo>>(
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
        SpaceName: 'pgc',
        app_id: 23062,
        user_id: userId,
      },
    },
  );
  return result?.data;
};

/**
 * 获取的上传参数结构
 */
export interface uploadVideoArgs {
  status_code: number;
  status_msg: string;
  Result: {
    InnerUploadAddress: {
      UploadNodes: Array<{
        Vid: string;
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
export interface uploadedVideoInfo {
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
}
