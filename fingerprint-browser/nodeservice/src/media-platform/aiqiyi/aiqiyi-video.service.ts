import { $http } from '@/http';
import FormData from 'form-data';
import { isJson } from '@/utils';
import * as buffer from 'buffer';
import { HttpsProxyAgent } from 'https-proxy-agent';

export const getAiqiyiAccToken = async (
  cookie: string,
  type: 'person' | 'iqiyi',
  name: 'UGC' | 'COMMON',
): Promise<AccTokenResponse> => {
  const url = 'https://mp-api.iqiyi.com/base/api/1.0/person-authorize';

  const headers = {
    cookie: cookie,
    referer: 'https://mp-api.iqiyi.com/',
    Origin: 'https://mp.iqiyi.com',
  };

  const params = {
    _t_mp: Date.now(),
    name: name,
  };

  const result = await $http.get(url, {
    headers: headers,
    params: params,
  });

  return result?.data;
};

export interface AccTokenResponse {
  httpStatus: number;
  /**
   * 状态码,0:正常，非0 异常
   */
  code: number;
  msg: string;
  /**
   * accToken
   */
  data: string;
}

/**
 * 获取上传视频需要的参数
 * @param cookie
 * @param fileSize
 * @param accToken
 * @param fileExt
 */
export const getAiqiyiUploadVideoArgs = async (
  cookie: string,
  fileSize: number,
  accToken: string,
  fileExt: string = 'mp4',
): Promise<AiqiyiVideoUploadArgsResponse> => {
  const url = 'https://upload.iqiyi.com/split_upload_request';

  const headers = {
    cookie: cookie,
    referer: 'https://mp-api.iqiyi.com/',
    Origin: 'https://mp.iqiyi.com',
  };

  const params = {
    _t_mp: Date.now(),
    access_token: accToken,
    file_type: fileExt,
    file_size: fileSize,
  };

  const result = await $http.get(url, {
    headers: headers,
    params: params,
  });

  return result?.data;
};

export interface AiqiyiVideoUploadArgsResponse {
  code: string; // 'A00000';
  msg: string; //'success';
  data?: {
    upload_urls: Array<string>; //'https://hzu1-n26-node2.if.iqiyi.com/upload',
    upload_url: string; // 'https://hzu1-n26-node2.if.iqiyi.com/upload';
    file_id: string; // '21eb532c13ba40c9a91ae0071578e348';
  };
}

/**
 * 上传视频分片
 * @param uploadArgs
 * @param cookie
 * @param videoData 视频分片数据
 * @param partNum 分片序号
 * @param totalPartNum 总分片数
 * @param startOffset 分片字节其实索引
 * @param endOffset 分片字节终止索引
 * @param fileLength 视频文件总字节数
 * @param fileName 文件名
 * @param timestamp 上传时间戳
 */
export const uploadVideoBinaryPart = async (
  uploadArgs: AiqiyiVideoUploadArgsResponse,
  cookie: string,
  videoData: buffer.Buffer,
  partNum: number,
  totalPartNum: number,
  startOffset: number,
  endOffset: number,
  fileLength: number,
  fileName: string,
  timestamp: number,
): Promise<AiqiyiVideoUploadPartResponse> => {
  const url = `${uploadArgs.data?.upload_url ?? ''}?_t_mp=${timestamp}`;

  const multiFormData = new FormData();
  multiFormData.append('file', videoData, { filename: 'blob', contentType: `application/octet-stream` });
  multiFormData.append('name', fileName);
  multiFormData.append('chunk', partNum - 1);
  multiFormData.append('chunks', totalPartNum);
  multiFormData.append('file_size', fileLength);
  multiFormData.append('file_id', uploadArgs.data?.file_id ?? '');
  multiFormData.append('range', `${startOffset}-${endOffset}`);
  multiFormData.append('part_number', partNum);

  const headers = {
    cookie: cookie,
    referer: 'https://mp-api.iqiyi.com/',
    Origin: 'https://mp.iqiyi.com',
  };

  const result = await $http.post(url, multiFormData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface AiqiyiVideoUploadPartResponse {
  code: string; //'A00000';
  file_id: string; // '21eb532c13ba40c9a91ae0071578e348';
  file_range_accepted: number; // 8388608;
  range_md5: string; // '3dea07ec4910bf9302b89d5e5b73ff18';
  msg: string;
}

/**
 * 视频上传完成
 * @param cookie
 * @param uploadFileId 上传参数下的file_id
 */
export const finishAiqiyiUploadVideo = async (
  cookie: string,
  uploadFileId: string,
): Promise<AiqiyiUploadFinishResponse> => {
  const url = 'https://upload.iqiyi.com/split_upload_finish';

  const headers = {
    cookie: cookie,
    referer: 'https://mp-api.iqiyi.com/',
    Origin: 'https://mp.iqiyi.com',
  };

  const params = {
    _t_mp: Date.now(),
    file_id: uploadFileId,
  };

  const result = await $http.get(url, {
    headers: headers,
    params: params,
  });

  return result?.data;
};

export interface AiqiyiUploadFinishResponse {
  code: string; //'A00000';
  msg: string; //'success';
  data: null;
}

/**
 * 检查视频是否已经存在，冲突
 * @param cookie
 * @param uploadFileId 上传参数下的file_id
 * @param fileSha 文件计算的sha
 */
export const checkAiqiyiUploadVideoExist = async (
  cookie: string,
  uploadFileId: string,
  fileSha: string,
): Promise<AiqiyiCheckVideoResponse> => {
  const url = 'https://mp-api.iqiyi.com/v-catalog/api/1.0/videoCatalog/check/materialExist';
  //
  const headers = {
    cookie: cookie,
    referer: 'https://mp-api.iqiyi.com/',
    Origin: 'https://mp.iqiyi.com',
  };

  const params = {
    fileId: uploadFileId,
    sha1y: fileSha,
  };

  const result = await $http.get(url, {
    headers: headers,
    params: params,
  });

  return result?.data;
};

export interface AiqiyiCheckVideoResponse {
  httpStatus: number;
  /**
   * 0:正常，非0异常
   */
  code: number;
  msg: string;
  data: {
    /**
     * 0:不存在，1:已经纯在该视频
     */
    exist: number;
    result: null;
  };
  msgCode: null;
}

/**
 * 封面图片上传
 * @param cookie
 * @param imageData 图片buffer
 * @param accToken 图片上传参数
 * @param fileExt 文件后缀
 * @param fileName 文件名
 */
export const uploadVideoCover = async (
  cookie: string,
  imageData: buffer.Buffer,
  accToken: string,
  fileExt: string,
  fileName: string,
): Promise<AiqiyiUploadCoverResponse> => {
  const url = 'https://secupload.iqiyi.com/common_upload';

  const headers = {
    cookie: cookie,
    referer: 'https://mp-api.iqiyi.com/',
    Origin: 'https://mp.iqiyi.com',
    'content-type': 'application/octet-stream',
  };

  const params = {
    _t_mp: Date.now(),
    name: fileName,
    file_type: fileExt,
    access_token: accToken,
    share_type: 'external',
    business_type: 'image',
    share_expire: 0,
    file_size: imageData.length,
  };

  const result = await $http.post(url, imageData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: params,
  });

  return result?.data;
};

export interface AiqiyiUploadCoverResponse {
  code: string; // 'A00000';
  msg: string; // 'success';
  data: {
    httpInnerUrl: string;
    file_path: string;
    share_url: string;
    file_id: string;
  };
}

/**
 * 保存上传的封面，和视频做关联
 * @param cookie
 * @param uploadCoverFileId 图片上传参数下的file_id
 * @param uploadVideoFileId 视频上传参数下的file_id
 * @param coverShareUrl 上传完成额封面url
 * @param coverWidth
 * @param coverHeight
 */
export const saveAiqiyiCover = async (
  cookie: string,
  uploadCoverFileId: string,
  uploadVideoFileId: string,
  coverShareUrl: string,
  coverWidth: number,
  coverHeight: number,
): Promise<object> => {
  const url = 'https://mp-api.iqiyi.com/v-tool/api/1.0/cover/upload_crop_save';

  const headers = {
    cookie: cookie,
    referer: 'https://mp-api.iqiyi.com/',
    Origin: 'https://mp.iqiyi.com',
  };

  const params = {
    fileId: uploadCoverFileId,
    imageSource: 'LOCAL_UPLOAD',
    fileId_video: uploadVideoFileId,
    is_vertical_video: '',
  };

  const postData = {
    originalUrl: coverShareUrl,
    x: 0,
    y: 0,
    width: coverWidth,
    height: coverHeight,
  };

  const result = await $http.post(url, postData, {
    headers: headers,
    params: params,
  });

  return result?.data;
};

/**
 * 图片违规检测
 * @param cookie
 * @param uploadCoverFileId
 * @param coverShareUrl
 * @param uid 用户id
 */
export const checkAiqiyiCoverPorn = async (
  cookie: string,
  uploadCoverFileId: string,
  coverShareUrl: string,
  uid: number,
): Promise<object> => {
  const url = 'https://mp-api.iqiyi.com/v-tool/api/1.0/porn_detect/check';

  const headers = {
    cookie: cookie,
    referer: 'https://mp-api.iqiyi.com/',
    Origin: 'https://mp.iqiyi.com',
  };

  const params = {
    img_url: coverShareUrl,
    fileId: uploadCoverFileId,
    uid: uid,
  };

  const postData = {
    img_url: coverShareUrl,
    fileId: uploadCoverFileId,
    uid: uid,
  };

  const result = await $http.post(url, postData, {
    headers: headers,
    params: params,
  });

  return result?.data;
};

/**
 *
 * @param cookie
 * @param coverShareUrl
 * @param uid 用户id
 */
export const resolutionAiqiyiCover = async (cookie: string, coverShareUrl: string, uid: number): Promise<object> => {
  const url = 'https://mp-api.iqiyi.com/v-tool/api/1.0/image/image/resolution';

  const headers = {
    cookie: cookie,
    referer: 'https://mp-api.iqiyi.com/',
    Origin: 'https://mp.iqiyi.com',
  };

  const params = {
    imageUrl: coverShareUrl,
    uid: uid,
  };

  const result = await $http.post(url, '', {
    headers: headers,
    params: params,
  });

  return result?.data;
};

/**
 * 确认封面数据
 * @param cookie
 * @param coverShareUrl
 * @param uid
 */
export const enhanceAiqiyiCover = async (
  cookie: string,
  coverShareUrl: string,
  uid: number,
): Promise<AiqiyiVideoCoverResponse> => {
  const url = 'https://mp-api.iqiyi.com/v-tool/api/1.0/image/covers_enhance';

  const headers = {
    cookie: cookie,
    referer: 'https://mp-api.iqiyi.com/',
    Origin: 'https://mp.iqiyi.com',
  };

  const params = {
    coverImageUrl: coverShareUrl,
    uid: uid,
  };

  const result = await $http.get(url, {
    headers: headers,
    params: params,
  });

  return result?.data;
};

export interface AiqiyiVideoCoverResponse {
  httpStatus: number;
  /**
   * 状态码 0正常，非0异常
   */
  code: number;
  msg: string;
  data: {
    code: string;
    /**
     * 封面数据
     */
    data: {
      id: null;
      location: string;
      locationPlus: string;
      innerUrl: string;
      outerUrl: string;
      width: number;
      height: number;
      plusType: string;
      /**
       * 封面处理状态 'A00000'为可用
       */
      state: string; // 'A00000';
      useState: number;
      createTime: number;
    };
  };
  msgCode: null;
}

/**
 * 保存草稿
 * @param cookie
 * @param postData
 * @param proxyAgent
 */
export const saveAiqiyiVideoDraft = async (
  cookie: string,
  postData: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<AiqiyiVideoDraftResponse> => {
  const url = 'https://mp-api.iqiyi.com/v-catalog/api/1.0/union-catalog/saveDraft?site=cn';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.iqiyi.com/wemedia/video/ugc/add',
    Origin: 'https://mp.iqiyi.com',
    'content-type': 'application/json; charset=UTF-8',
    dfp: cookie.includes('__dfp=') ? cookie.split('__dfp=')[1].split(';')[0]?.split('@')[0]?.trim() : '',
  };

  const params = {};

  const result = await $http.post(url, postData, {
    headers: headers,
    params: params,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result?.data;
};

export interface AiqiyiVideoDraftResponse {
  httpStatus: number;
  /**
   * 0正常
   */
  code: number;
  msg: string;
  data: {
    code: string; //'A00000';
    msg: string;
    data: { episodeType: string; id: number };
    returnCode: string; //'A00000';
    success: true;
  };
  msgCode: null;
}

/**
 *
 * @param cookie
 * @param uploadVideoFileId
 * @param postData
 * @param proxyAgent
 */
export const publishAiqiyiVideo = async (
  cookie: string,
  uploadVideoFileId: string,
  postData: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<AiqiyiVideoPublishResponse> => {
  const url = `https://mp-api.iqiyi.com/v-catalog/api/1.0/union-catalog/save?site=cn`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.iqiyi.com/wemedia/video/ugc/add',
    Origin: 'https://mp.iqiyi.com',
    'content-type': 'application/json; charset=UTF-8',
    dfp: cookie.includes('__dfp=') ? cookie.split('__dfp=')[1].split(';')[0]?.split('@')[0]?.trim() : '',
  };

  const params = {};

  const result = await $http.post(url, postData, {
    headers: headers,
    params: params,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result?.data;
};

export interface AiqiyiVideoPublishResponse {
  httpStatus: number;
  /**
   * 0 正常
   */
  code: number;
  msg: string;
  data: {
    code: string; //'A00000';
    msg: string;
    draftId: string | null;
    qipuId: number;
    entityId: number;
    returnCode: string;
    success: boolean;
  };
  msgCode: null;
}
