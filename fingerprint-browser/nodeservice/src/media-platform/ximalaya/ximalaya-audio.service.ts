import { $http } from '@/http';
import * as buffer from 'buffer';
// 使用经真实抓包验证的签名实现；xmSignAuto 会在 Node VM 中运行数盟 SDK。
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { xfmSignature, xmSignAuto, makeTId } = require('./_sign/sign.js') as {
  xfmSignature: (input: {
    appKey: string;
    uploadType: string;
    fileName: string;
    timestamp?: number;
    serverIp?: string;
    bodyData?: object | string;
    queryData?: Record<string, string | number>;
  }) => { headers: Record<string, string | number | boolean>; signature: string };
  xmSignAuto: () => Promise<string>;
  makeTId: () => { tId: string; sessionId: string };
};

const XIMALAYA_REFERER = 'https://studio.ximalaya.com/reform-upload/page/upload';

/** 每次发布任务生成一套数盟 browserID && sessionID。 */
export const getXimalayaXmSign = (): Promise<string> => xmSignAuto();
export const createXimalayaUploadTraceId = (): string => makeTId().tId;

export const getUploadTokenResponse = async (
  cookie: string,
  fileName: string,
  fileSize: number,
  traceId: string,
  uploadType: string = 'tingWebAudio',
): Promise<XimalayaUploadTokenResponse> => {
  const url = 'https://cupload.ximalaya.com/clamper-token/token';

  const headers = {
    cookie: cookie,
    referer: 'https://studio.ximalaya.com/upload',
    'x-tId': traceId,
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
  };

  const postData = `fileName=${encodeURIComponent(
    fileName,
  )}&fileSize=${fileSize}&uploadType=${encodeURIComponent(uploadType)}&callerType=tingWeb`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface XimalayaUploadTokenResponse {
  ret: number;
  msg: string | null;
  errorCode: null;
  token: string;
  newTx: true;
  dispatchFast: true;
  info: null;
  uploadDomain: string; //'http://cupload.ximalaya.com';
  data: null;
}

export const uploadAudioData = async (
  cookie: string,
  audioData: buffer.Buffer,
  fileName: string,
  fileSize: number,
  partNum: number,
  totalParts: number,
  fileMd5: string,
  uid: number,
  uploadToken: string,
  traceId: string,
  multipartId: string = '',
  serverIp: string = '',
  uploadType: string = 'tingWebAudio',
  mimeType: string = 'audio/mpeg',
): Promise<XimalayaUploadPartResponse> => {
  const url = 'https://cupload.ximalaya.com/upload/file/blk';
  const timeStart = Date.now();
  const params = {
    id: 'WU_FILE_0',
    name: fileName,
    // 签名使用原始值；Axios 会在实际 URL 中完成编码。
    type: mimeType,
    lastModifiedDate: new Date().toString(),
    size: fileSize,
    timeStart,
    chunks: totalParts,
    chunk: partNum,
    multipartId,
    md5: fileMd5,
    uid,
  };
  const signed = xfmSignature({
    appKey: 'tingWeb',
    uploadType,
    fileName,
    serverIp,
    queryData: params,
  });

  const headers = {
    cookie: cookie,
    referer: 'https://studio.ximalaya.com/upload',
    'content-type': 'application/octet-stream',
    Authorization: uploadToken,
    'x-tId': traceId,
    ...signed.headers,
  };

  const result = await $http.post(url, audioData, {
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface XimalayaUploadPartResponse {
  // '000000';
  code: string;
  message: string;
  data: {
    md5: string;
    ctx: string;
    serverIp: string;
    cdnIp: string;
    multipartId: string;
  };
}

export interface XimalayaMergeUploadInput {
  uid: number;
  uploadType: string;
  fileSize: number;
  fileExtName: string;
  fileName: string;
  ctxList: string[];
  multipartId: string;
}

export interface XimalayaMergeUploadResponse {
  code: string;
  message: string;
  data?: {
    uploadId: number;
    freeFileUrl?: string;
    fileExtName?: string;
    metaInfo?: { duration?: number };
  };
}

/** 合并已上传的分片。 */
export const mergeXimalayaUpload = async (
  cookie: string,
  input: XimalayaMergeUploadInput,
  uploadToken: string,
  traceId: string,
  serverIp: string = '',
): Promise<XimalayaMergeUploadResponse> => {
  const body = {
    ...input,
    appkey: 'tingWeb',
    deviceType: 'web',
    clientIp: '',
    codeOrNot: '0',
  };
  const signed = xfmSignature({
    appKey: 'tingWeb',
    uploadType: input.uploadType,
    fileName: input.fileName,
    serverIp,
    bodyData: body,
  });
  const result = await $http.post(
    'https://cupload.ximalaya.com/upload/merge/mkfile',
    body,
    {
      headers: {
        cookie,
        referer: XIMALAYA_REFERER,
        'content-type': 'application/json;charset=UTF-8',
        Authorization: uploadToken,
        'x-tId': traceId,
        ...signed.headers,
      },
    },
  );
  return result.data;
};

export interface XimalayaCreateAudioInput {
  albumId?: number | string | null;
  soundTitle: string;
  soundIntro?: string;
  soundRichIntro?: string;
  soundTags?: string;
  soundCoverPath?: { fileId: number; fileUrl?: string };
  soundFile: { fileId: number; fileName: string };
  categoryId?: number | string;
  isFree?: boolean;
  isTrailer?: boolean;
  trackVipFirst?: boolean;
  visibleCrowdType?: number;
  isAiTrack?: boolean;
  topicTags?: string;
  time?: number;
  lrcPath?: string;
  anchorActivity?: { isSynActivity?: boolean; shareContent?: string };
  communityWidget?: object;
  activityId?: string;
  businessNum?: string | null;
  adMissionOrderId?: string | null;
}

export interface XimalayaCreateAudioResponse {
  ret: number;
  msg?: string;
  data?: { trackId?: number; uploadId?: number; albumId?: number };
}

/** 创建喜马拉雅音频作品。 */
export const createXimalayaAudio = async (
  cookie: string,
  input: XimalayaCreateAudioInput,
  xmSign: string,
): Promise<XimalayaCreateAudioResponse> => {
  const result = await $http.post(
    'https://www.ximalaya.com/reform-upload/upload/create',
    {
      isVideo: false,
      albumId: input.albumId ?? null,
      soundTitle: input.soundTitle,
      soundIntro: input.soundIntro ?? '',
      soundRichIntro: input.soundRichIntro ?? '',
      soundTags: input.soundTags ?? '[]',
      soundCoverPath: input.soundCoverPath,
      videoCoverPath: null,
      activityId: input.activityId ?? '',
      time: input.time ?? 0,
      soundFile: input.soundFile,
      isFree: input.isFree ?? false,
      isTrailer: input.isTrailer ?? false,
      trackVipFirst: input.trackVipFirst ?? false,
      // 抓包确认：喜马拉雅网页端公开值为 2。
      visibleCrowdType: input.visibleCrowdType ?? 2,
      isAiTrack: input.isAiTrack ?? false,
      topicTags: input.topicTags ?? '[]',
      anchorActivity: input.anchorActivity ?? { isSynActivity: false, shareContent: '' },
      communityWidget: input.communityWidget ?? {},
      categoryId: input.categoryId,
      lrcPath: input.lrcPath,
      businessNum: input.businessNum ?? null,
      adMissionOrderId: input.adMissionOrderId ?? null,
    },
    {
      headers: {
        cookie,
        referer: XIMALAYA_REFERER,
        'content-type': 'application/json;charset=UTF-8',
        'xm-sign': xmSign,
      },
    },
  );
  return result.data;
};
