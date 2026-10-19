import { $http } from '../../http';
import { isJson } from '../../utils';
import * as buffer from 'buffer';
import FormData from 'form-data';
import { getSign } from '@/media-platform/kuaishou/kuaishou-base.service';
import { HttpsProxyAgent } from 'https-proxy-agent';
/**
 * 获取图片上传参数
 * @param cookie
 * @param fileId 图集id，当前接口返回数据中的参数，第一张图默认使用空
 * @param atlasId
 * @param webapiId cookie中的kuaishou.web.cp.api_ph
 */
export const getUploadImageArgs = async (
  cookie: string,
  fileId: number,
  atlasId: number,
  webapiId: string,
): Promise<UploadImageArgsResponse> => {
  const headers = {
    cookie: cookie,
    referer: 'https://cp.kuaishou.com/article/publish/video',
  };

  const postData = {
    uploadType: 10,
    pictureCount: 1,
    fileExtendNames: '[{"fileExtendName":"image/jpeg"}]',
    'kuaishou.web.cp.api_ph': webapiId,
  };
  if (fileId) {
    postData['fileId'] = fileId;
    postData['atlasId'] = atlasId;
  }
  const sign = await getSign(JSON.stringify(postData));
  const url = `https://cp.kuaishou.com/rest/cp/works/atlas/pc/upload/pre?__NS_sig3=${sign}`;
  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface UploadImageArgsResponse {
  /**
   * 状态码 1:正常 非1:异常
   */
  result: number;
  /**
   * 服务端时间戳
   */
  currentTime: number;
  /**
   * 数据体
   */
  data: {
    /**
     * 可能是图片集Id，同一次图文上传，后续上传请求需要带上这个参数
     */
    fileId: number;
    /**
     * 可能和fileId差不多
     */
    atlasId: number;
    /**
     * 图片上传需要的信息列表，一般默认一个
     */
    uploadInfo: Array<{
      /**
       * 当前上传图片的唯一标志id
       */
      blobKey: string;
      /**
       * 上传需要使用的token
       */
      token: string;
      /**
       * 上传需要使用的域名地址列表
       */
      endPoints: Array<string>;
    }>;
  };
  message: '成功';
}

/**
 * 上传图片数据
 * @param imageData 图片buffer
 * @param uploadToken 上传token，来自获取上传参数接口
 */
export const uploadImage = async (imageData: buffer.Buffer, uploadToken: string): Promise<UploadImageResponse> => {
  const url = `https://upload.kuaishouzt.com/api/upload/fragment?upload_token=${uploadToken}&fragment_id=0`;

  const headers = {
    referer: 'https://cp.kuaishou.com/',
    'Content-Type': 'application/octet-stream',
  };

  const result = await $http.post(url, imageData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface UploadImageResponse {
  /**
   * 状态码， 1:正常 非1:异常
   */
  result: number;

  checksum: string;
  /**
   * 服务端收到的图片大小
   */
  size: number;
}

/**
 * 上传图片数据完成通知
 * @param uploadToken 上传token，来自获取上传参数接口
 */
export const uploadImageComplete = async (uploadToken: string): Promise<UploadImageCompleteResponse> => {
  const url = `https://upload.kuaishouzt.com/api/upload/complete?upload_token=${uploadToken}&fragment_count=1`;

  const headers = {
    referer: 'https://cp.kuaishou.com/',
    'Content-Type': null,
  };

  const result = await $http.post(url, '', {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface UploadImageCompleteResponse {
  /**
   * 状态码， 1:正常 非1:异常
   */
  result: number;
}

/**
 * 校验上传完成的图片
 * @param cookie
 * @param fileId 图片所属id，来源于上传参数
 * @param atlasId 类似fileId
 * @param blobKey 图片唯一id
 * @param webapiId cookie中kuaishou.web.cp.api_ph
 */
export const uploadImageFinish = async (
  cookie: string,
  fileId: number,
  atlasId: number,
  blobKey: string,
  webapiId: string,
): Promise<UploadImageFinishResponse> => {
  const headers = {
    cookie: cookie,
    referer: 'https://cp.kuaishou.com/article/publish/video',
    'Content-Type': 'application/json;charset=UTF-8',
  };

  const postData = {
    fileId: fileId,
    atlasId: atlasId,
    blobKey: blobKey,
    'kuaishou.web.cp.api_ph': webapiId,
  };

  const sign = await getSign(JSON.stringify(postData));
  const url = `https://cp.kuaishou.com/rest/cp/works/atlas/pc/upload/single/finish?__NS_sig3=${sign}`;

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface UploadImageFinishResponse {
  /**
   * 状态码，1:正常 非1:异常
   */
  result: number;
  /**
   * 上传完成的图片相关信息
   */
  data: {
    /**
     * 所属集合id
     */
    fileId: number;
    /**
     * 和fileId差不多
     */
    atlasId: number;
    /**
     * 图片地址，目前无用
     */
    url: Array<{
      cdn: string;
      url: string;
    }>;
  };
  /**
   * 提示消息
   */
  message: string;
}

/**
 * 上传图文封面
 * @param cookie
 * @param imageData 封面buffer
 * @param blobKey 上传唯一id，使用正文第一张图的唯一id
 * @param webapiId cookie中 kuaishou.web.cp.api_ph
 */
export const uploadCoverImage = async (
  cookie: string,
  imageData: buffer.Buffer,
  blobKey: string,
  webapiId: string,
): Promise<UploadCoverImageResponse> => {
  const url = 'https://cp.kuaishou.com/rest/cp/works/atlas/pc/upload/cover/upload';

  const headers = {
    referer: 'https://cp.kuaishou.com/article/publish/video',
    cookie: cookie,
  };

  const multiFormData = new FormData();
  multiFormData.append('file', imageData, { filename: 'blob', contentType: 'image/jpeg' });
  multiFormData.append('kuaishou.web.cp.api_ph', webapiId);
  multiFormData.append('blobKey', blobKey);

  const result = await $http.post(url, multiFormData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface UploadCoverImageResponse {
  /**
   * 状态码,1:正常，非1异常
   */
  result: number;
  /**
   * 数据体
   */
  data: {
    /**
     * 封面唯一id
     */
    coverKey: string;
    /**
     * 封面地址
     */
    url: string;
  };
  /**
   * 提示消息
   */
  message: string;
}

/**
 * 保存上传完成的图片
 * @param cookie
 * @param fileId
 * @param atlasId
 * @param uploadedImageList 上传完成的图片列表
 * @param webapiId
 */
export const saveUploadedImages = async (
  cookie: string,
  fileId: number,
  atlasId: number,
  uploadedImageList: Array<string>,
  webapiId: string,
): Promise<SaveImagesResponse> => {
  const headers = {
    cookie: cookie,
    referer: 'https://cp.kuaishou.com/article/publish/video',
  };

  const postData = { fileId: fileId, atlasId: atlasId, blobKey: uploadedImageList, 'kuaishou.web.cp.api_ph': webapiId };

  const sign = await getSign(JSON.stringify(postData));
  const url = `https://cp.kuaishou.com/rest/cp/works/atlas/pc/upload/finish?__NS_sig3=${sign}`;

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface SaveImagesResponse {
  /**
   * 状态码，1:正常  非1:异常
   */
  result: number;
  /**
   * 提示消息
   */
  message: string;
}

/**
 * 推送图文数据
 * @param cookie 账号cookie
 * @param postData 组装好的需要推送的数据
 * @param proxyAgent
 */
export const publish = async (
  cookie: string,
  postData: string,
  proxyAgent: HttpsProxyAgent<string> | object | undefined,
): Promise<SubmitResponse> => {
  const headers = {
    cookie: cookie,
    referer: 'https://cp.kuaishou.com/article/publish/video',
    'Content-Type': 'application/json;charset=UTF-8',
  };

  const sign = await getSign(postData);
  const url = `https://cp.kuaishou.com/rest/cp/works/atlas/pc/publish/submit?__NS_sig3=${sign}`;

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

export interface SubmitResponse {
  /**
   * 状态码，1:正常  非1:异常
   */
  result: number;
  /**
   * 服务端时间戳13
   */
  currentTime: number;

  data: null;
  /**
   * 提示消息
   */
  message: string;
}
