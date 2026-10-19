import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import * as buffer from 'buffer';
import { generateRandomFileName, isJson } from '../../utils';
import FormData from 'form-data';
import { QiehaoSm3 } from './qiehao-sm3';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 获取视频上传参数
 * @param cookie
 * @param fileName 文件名
 * @param fileSize 文件大小
 * @param seq
 */
export const getQiehaoVideoArgsAsync = async (
  cookie: string,
  fileName: string,
  fileSize: number,
  seq: string,
): Promise<QiehaoVideoArgsResponse> => {
  const result = await $http.get<unknown, AxiosResponse<QiehaoVideoArgsResponse>>(
    'https://om.qq.com/marticlepublish/upload/omPrepareUpload',
    {
      headers: {
        cookie: cookie,
        referer: 'https://om.qq.com/main/creation/video',
        host: 'om.qq.com',
        'X-Requested-With': 'XMLHttpRequest',
      },
      params: {
        seq: seq,
        source: 10,
        fileName: encodeURIComponent(fileName),
        fileSize: fileSize,
        relogin: 1,
      },
    },
  );

  // 请求失败
  if (result.data.response.code !== 0) {
    throw new BadRequestException(result.data?.response.msg, result.data?.response.code, result.data);
  }

  return result.data;
};

export interface QiehaoVideoArgsResponse {
  response: {
    code: number;
    msg: string;
  };
  data: {
    type: number;
    extFields: {
      biz_id: string;
      service_id: string;
      source: string;
    };
    head: {
      msg: string;
    };
    videoID: string;
    fileID: string;
    vid: string;
    uKey: string;
    uploadSID: string;
    token: string;
    reportToken: string;
    svrToken: string;
    cost: number;
  };
}

/**
 * 上传视频分片
 * @param cookie
 * @param seq
 * @param videoData
 * @param partNum
 * @param uploadArgs
 */
export const uploadPartAsync = async (
  cookie: string,
  seq: string,
  videoData: buffer.Buffer,
  partNum: number,
  uploadArgs: QiehaoVideoArgsResponse,
): Promise<QiehaoUploadPartResponse> => {
  const url = 'https://videotranspond.3g.qq.com/v2/upload/uploadpart';

  const params = {
    filename: uploadArgs.data.fileID,
    ukey: uploadArgs.data.uKey,
    partnum: partNum,
  };

  // noinspection SpellCheckingInspection
  const headers = {
    Referer: 'https://om.qq.com/',
    Origin: 'https://om.qq.com',
    Host: 'videotranspond.3g.qq.com',
    'Content-Type': 'application/octet-stream',
    'Video-Token': uploadArgs.data.token,
    cookie: cookie,
    seq: seq,
    'Upload-Sid': uploadArgs.data.uploadSID,
  };

  const result = await $http.post(url, buffer.Buffer.from(videoData), {
    headers: headers,
    params: params,
  });

  result.data.partNum = partNum;

  return result.data;
};

export interface QiehaoUploadPartResponse {
  code: number;
  msg: string;
  /**
   * 分片序号
   */
  partNum: number;

  /**
   * 文件的 sha1 值
   */
  partSha: string;
}

/**
 * 上传封面
 * @param cookie
 * @param imageData 文件内容
 * @param fileExt 文件后缀
 */
export const uploadCoverAsync = async (
  cookie: string,
  imageData: buffer.Buffer,
  fileExt: string = 'jpeg',
): Promise<QiehaoUploadCoverResponse> => {
  const url = 'https://image.om.qq.com/cpom_pimage/ListImageUploadViaFile';
  const fileName = generateRandomFileName(10, fileExt);

  const multiFormData = new FormData();
  multiFormData.append('file', imageData, { filename: fileName, contentType: `image/${fileExt}` });
  multiFormData.append('appid', 'LA6zXi1lWzAioIzdiAD6iM10aHarlHF6');
  multiFormData.append('isUpOrg', 1);
  multiFormData.append('endpoint', 1);
  multiFormData.append('isRetImgAttr', 1);
  multiFormData.append('opCode', 169);

  const headers = {
    cookie: cookie,
    referer: 'https://om.qq.com/',
    'Content-type': 'multipart/form-data',
    'X-Requested-With': 'XMLHttpRequest',
  };

  const result = await $http.post(url, multiFormData, {
    retryCondition: (_error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface QiehaoUploadCoverResponse {
  code: number;
  message: string;
  data: {
    width: string;
    height: string;
    type: number;
    url: {
      '1'?: string;
      '300240'?: string;
      '7201280'?: string;
      '640360'?: string;
      '640480'?: string;
      '150120'?: string;
      '196130'?: string;
      '294195'?: string;
      '496280'?: string;
    };
    isqrcode: number;
    length: string;
  };
}

/**
 * 检测视频参数
 * @param cookie
 * @param title
 * @param desc
 * @param tags
 */
export const getCheckVideoParamAsync = async (
  cookie: string,
  title: string,
  desc: string,
  tags: string,
): Promise<QiehaoCheckVideoParamResponse> => {
  const result = await $http.get<unknown, AxiosResponse<QiehaoCheckVideoParamResponse>>(
    'https://om.qq.com/VideoManager/checkVideoParam',
    {
      headers: {
        cookie: cookie,
        referer: 'https://om.qq.com/main/creation/video',
        host: 'om.qq.com',
        'X-Requested-With': 'XMLHttpRequest',
      },
      params: {
        title: encodeURIComponent(title),
        tags: encodeURIComponent(tags),
        desc: encodeURIComponent(desc),
        relogin: 1,
      },
    },
  );

  // 请求失败
  if (result.data.response.code !== 0) {
    throw new BadRequestException(result.data?.response.msg, result.data?.response.code, result.data);
  }

  return result.data;
};

export interface QiehaoCheckVideoParamResponse {
  response: {
    code: 0;
    msg: 'suc';
  };
  data: true;
}

export const QiehaoActivityHaveSignedAsync = async (
  cookie: string,
  activityId: string,
): Promise<QiehaoActivityHaveSignedResponse> => {
  const result = await $http.get<unknown, AxiosResponse<QiehaoActivityHaveSignedResponse>>(
    'https://om.qq.com/mother/crowdsource/haveSigned',
    {
      headers: {
        cookie: cookie,
        referer: 'https://om.qq.com/main/creation/video',
        host: 'om.qq.com',
        'X-Requested-With': 'XMLHttpRequest',
      },
      params: {
        activity_id: activityId,
        relogin: 1,
      },
    },
  );

  // 请求失败
  if (result.data.response.code !== 0) {
    throw new BadRequestException(result.data?.response.msg, result.data?.response.code, result.data);
  }

  return result.data;
};

export interface QiehaoActivityHaveSignedResponse {
  response: {
    code: 0;
    msg: '';
  };
  data: {
    result: true;
  };
}

export const getVideoSm3 = async (filePath: string): Promise<string> => {
  return await new QiehaoSm3().GetSM3String(filePath);
};

/**
 * 合并视频
 * @param cookie
 * @param uploadArgs 视频上传参数
 * @param finishParts 分片信息
 */
export const finishUploadAsync = async (
  cookie: string,
  uploadArgs: QiehaoVideoArgsResponse,
  finishParts: Array<{
    partNum: number;
    partSha: string;
  }>,
): Promise<QiehaoFinishUploadResponse> => {
  const params = {
    bizid: uploadArgs.data.extFields.biz_id,
    fileName: uploadArgs.data.fileID,
    uKey: uploadArgs.data.uKey,
    skipAudit: 1,
    finishParts: finishParts,
  };

  const header = {
    cookie: cookie,
    referer: 'https://om.qq.com/',
    'Content-Type': 'application/json;charset=UTF-8',
  };

  const result = await $http.post('https://videotranspondplus.3g.qq.com/v2/upload/finishupload', params, {
    headers: header,
  });

  // 请求失败
  if (result.data.code !== 0) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface QiehaoFinishUploadResponse {
  code: number;
  crcCheckCode: number;
  msg: string;
}

export const getQiehaoOmFinishUploadResponse = async (
  cookie: string,
  fileSha: string,
  file_sm3: string,
  uploadArgs: QiehaoVideoArgsResponse,
): Promise<QiehaoOmFinishUploadResponse> => {
  const result = await $http.get<unknown, AxiosResponse<QiehaoOmFinishUploadResponse>>(
    'https://om.qq.com/marticlepublish/upload/omFinishUpload',
    {
      headers: {
        cookie: cookie,
        referer: 'https://om.qq.com/main/creation/video',
        host: 'om.qq.com',
        'X-Requested-With': 'XMLHttpRequest',
      },
      params: {
        videoID: uploadArgs.data.videoID,
        fileSHA: fileSha,
        fileID: uploadArgs.data.fileID,
        extFields: {
          source: uploadArgs.data.extFields.source,
          biz_id: uploadArgs.data.extFields.biz_id,
          service_id: uploadArgs.data.extFields.service_id,
          file_sm3: file_sm3,
        },
        relogin: 1,
      },
    },
  );

  // 请求失败
  if (result.data.response.code !== 0) {
    throw new BadRequestException(result.data?.response.msg, result.data?.response.code, result.data);
  }

  return result.data;
};

export interface QiehaoOmFinishUploadResponse {
  response: {
    code: number;
    msg: string;
  };
  data: {
    type: number;
    extFields: {
      service_id: string;
      source: string;
      vid: string;
      biz_id: string;
      file_sm3: string;
    };
    head: {
      msg: string;
    };
    videoID: string;
    vid: string;
    cost: number;
  };
}

export const publish = async (
  cookie: string,
  pubType: number,
  postData: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<PublishResultResponse> => {
  let url: string;
  if (pubType === 1) {
    url = 'https://om.qq.com/marticlepublish/omBatchPublish';
  } else {
    url = 'https://om.qq.com/marticlepublish/omBatchSave';
  }

  const headers = {
    cookie: cookie,
    referer: 'https://om.qq.com/main/creation/video',
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/json;charset=UTF-8',
  };

  const result = await $http.post(url, postData, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface PublishResultResponse {
  response: {
    code: number;
    msg: string;
  };
  data: Array<{
    articleId: string;
  }>;
}
