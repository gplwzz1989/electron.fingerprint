import { $http } from '../../http';
import { getNowTimeStamp } from '../../utils/use-date';
import * as buffer from 'buffer';
import FormData from 'form-data';

/**
 * 获取上传参数的前置参数
 * @param cookie
 * @param uid 用户id
 * @param requestId 进入页面的时候产生，类似sessionid
 * @param filetype 类型，默认video
 */
export const getUploadSignResponse = async (
  cookie: string,
  uid: string,
  requestId: string,
  filetype: string = 'video',
): Promise<DayuUploadSignResponse> => {
  const url = 'https://mp.dayu.com/get_sign?';

  const headers = {
    cookie: cookie,
    'X-Requested-With': 'XMLHttpRequest',
    'bx-v': '2.5.11',
    Referer: 'https://mp.dayu.com/dashboard/video/write',
  };

  const params = {
    _rid: requestId,
    appid: 'wemedia',
    uid: uid,
    filetype: filetype,
    _: getNowTimeStamp(13),
  };

  const result = await $http.get(url, {
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface DayuUploadSignResponse {
  /**
   * 状态码
   * 0 正常
   */
  code: number;
  /**
   * 提示消息
   */
  message: string;
  error?:{
    message: string;
  }
  /**
   * 获取上传参数需要的前置参数
   */
  data: {
    appid: string;
    uid: string;
    tm: number;
    filetype: string;
    policy: string;
    accelerate_flag: number;
    sign: string;
  };
}

export const getUploadArgsResponse = async (
  uid: string,
  uploadSign: DayuUploadSignResponse,
): Promise<DayuUploadArgsResponse> => {
  const url = 'https://userapi-ums.uc.cn/3/certificate/init?';

  const headers = {
    Referer: 'https://mp.dayu.com/',
  };

  const params = {
    appid: 'wemedia',
    uid: uid,
    tm: uploadSign.data.tm,
    sign: uploadSign.data.sign,
    filetype: uploadSign.data.filetype,
    content_type: 'application/octet-stream',
    accelerate_flag: '',
    file_num: 1,
    _: getNowTimeStamp(13),
  };

  const result = await $http.get(url, {
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface DayuUploadArgsResponse {
  /**
   * 状态码
   * 0 正常
   */
  code: number;
  /**
   * 提示消息
   */
  message: string;
  /**
   * 上传参数
   */
  data: {
    bucket: string;
    //上传类型
    content_type: string;
    //域名
    endpoint: string;
    //文件数
    file_num: string;
    //上传视频的完整域名 eg:http://ums-origin-file.oss-cn-hangzhou.aliyuncs.com
    host: string;
    //上传认证校验的一些参数
    list: Array<{
      authorization: string;
      gmdate: string;
      //上海南path，和完整域名拼接
      object: string;
    }>;
  };
}

/**
 * 获取上传id，返回数据为xml格式
 *return <UploadId>4274FAC380B04E5783342A528948AF1D</UploadId>
 * @param uploadArgs
 */
export const getUploadIdResponse = async (uploadArgs: DayuUploadArgsResponse): Promise<string> => {
  const url = `${uploadArgs.data.host}/${uploadArgs.data.list[0].object}?uploads=`;

  const headers = {
    'Content-Type': 'application/octet-stream',
    Referer: 'https://mp.dayu.com/',
    'x-oss-date': uploadArgs.data.list[0].gmdate,
    Authorization: uploadArgs.data.list[0].authorization,
  };

  const result = await $http.post(url, buffer.Buffer.from(''), {
    headers: headers,
    responseType: 'text',
  });

  return result.data;
};

/**
 * 创建上传并获取参数，目前该步骤不是必须的，官方上传过程中会重复调用
 * @param preUploadArgs
 * @param uploadSign
 * @param uid
 * @param partNum
 * @param uploadId
 * @param action
 */
export const getUploadProcessResponse = async (
  preUploadArgs: DayuUploadArgsResponse,
  uploadSign: DayuUploadSignResponse,
  uid: string,
  partNum: number,
  uploadId: string,
  action: string = 'upload',
): Promise<UploadProcessResponse> => {
  const url = 'https://userapi-ums.uc.cn/3/certificate/get?';

  const headers = {
    Referer: 'https://mp.dayu.com/',
  };

  let sub_resource = '';
  if (partNum == 0) {
    sub_resource = Buffer.from(`uploadId=${uploadId}`).toString('base64');
  } else {
    sub_resource = Buffer.from(`partNumber=${partNum}&uploadId=${uploadId}`).toString('base64');
  }

  const params = {
    appid: 'wemedia',
    uid: uid,
    object: preUploadArgs.data.list[0].object,
    tm: uploadSign.data.tm,
    content_type: preUploadArgs.data.content_type,
    sign: uploadSign.data.sign,
    accelerate_flag: '',
    sub_resource: sub_resource,
    filetype: 'video',
    action: action,
    _: getNowTimeStamp(13),
  };

  const result = await $http.get(url, {
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface UploadProcessResponse {
  /**
   * 状态码
   * 0 正常
   */
  code: number;
  /**
   * 提示消息
   */
  message: string;
  /**
   * 上传参数
   */
  data: {
    authorization: string;
    bucket: string;
    content_type: string;
    endpoint: string;
    gmdate: string;
    //上传完整域名
    host: string;
    //上传路径，和域名拼接
    object: string;
    callback?: string;
  };
}

/**
 * 上传视频分片
 * @param videoData 分片数据
 * @param uploadId 上传id
 * @param partNum 分片编号
 * @param host
 * @param object
 * @param gmdate
 * @param authorization
 * @param uploadedList
 */
export const uploadVideoPart = async (
  videoData: buffer.Buffer,
  uploadId: string,
  partNum: number,
  host: string,
  object: string,
  gmdate: string,
  authorization: string,
  uploadedList: Map<number, string>,
): Promise<string> => {
  const url = `${host}/${object}?`;

  const headers = {
    Expires: 600000000,
    Referer: 'https://mp.dayu.com/',
    'x-oss-date': gmdate,
    Authorization: authorization,
    'Content-Type': 'application/octet-stream',
  };

  const params = {
    uploadId: uploadId,
    partNumber: partNum,
  };

  const result = await $http.put(url, buffer.Buffer.from(videoData), {
    headers: headers,
    params: params,
  });
  uploadedList.set(partNum, result.headers['etag']);
  return result.headers['etag'];
};

/**
 * 获取上传完成后的参数
 * @param uploadArgs
 * @param uploadSign
 * @param uid
 */
export const getFinishUploadInfoResponse = async (
  uploadArgs: UploadProcessResponse,
  uploadSign: DayuUploadSignResponse,
  uid: string,
): Promise<DayuUploadedArgsInfoResponse> => {
  const url = 'https://userapi-ums.uc.cn/3/certificate/get?';

  const headers = {
    Referer: 'https://mp.dayu.com/',
  };

  const params = {
    appid: 'wemedia',
    uid: uid,
    object: uploadArgs.data.object,
    tm: uploadSign.data.tm,
    content_type: uploadArgs.data.content_type,
    sign: uploadSign.data.sign,
    accelerate_flag: '',
    sub_resource: '',
    filetype: 'video',
    action: 'complete',
    _: getNowTimeStamp(13),
  };

  const result = await $http.get(url, {
    headers: headers,
    params: params,
  });

  return result.headers['etag'];
};

export interface DayuUploadedArgsInfoResponse {
  /**
   * 状态码
   * 0 正常
   */
  code: number;
  /**
   * 提示消息
   */
  message: string;
  data: {
    authorization: string;
    bucket: string;
    //下一步骤需要的参数
    callback: string;
    content_type: string;
    endpoint: string;
    gmdate: string;
    host: string;
    object: string;
  };
}

/**
 *
 * @param uploadedArgs 上传完成参数
 * @param uploadedListStr <CompleteMultipartUpload><Part><PartNumber>1</PartNumber><ETag>"A634DA0A07468B6083F4573642C73247"</ETag></Part><Part><PartNumber>2</PartNumber><ETag>"F593DFE3D03039C2A2CDFA174C85CB73"</ETag></Part><Part><PartNumber>3</PartNumber><ETag>"F677F38F60E75157E4448256955E776D"</ETag></Part><Part><PartNumber>4</PartNumber><ETag>"ED1B878CA4249C83D98EF789CB6380BA"</ETag></Part><Part><PartNumber>5</PartNumber><ETag>"91E71C66CCFD0161F05AFE4CF3C9644E"</ETag></Part><Part><PartNumber>6</PartNumber><ETag>"E06963D800258DF6B3E8FE392F388E86"</ETag></Part></CompleteMultipartUpload>
 * @param uploadId 上传id
 */
export const getUploadedVideoIdResponse = async (
  uploadedArgs: UploadProcessResponse,
  uploadedListStr: string,
  uploadId: string,
): Promise<DayuUploadedVideoIdResponse> => {
  const url = `${uploadedArgs.data.host}/${uploadedArgs.data.object}?`;

  const headers = {
    Referer: 'https://mp.dayu.com/',
    'x-oss-date': uploadedArgs.data.gmdate,
    Authorization: uploadedArgs.data.authorization,
    'Content-Type': 'application/octet-stream',
  };

  const params = {
    uploadId: uploadId,
    callback: uploadedArgs.data.callback,
  };

  const result = await $http.post(url, uploadedListStr, {
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface DayuUploadedVideoIdResponse {
  /**
   * 状态码
   * 0 正常
   */
  code: number;
  /**
   * 提示消息
   */
  message: string;
  data: {
    //视频id
    id: string;
  };
  sign?: string;
}

/**
 * 上传图片
 * @param cookie
 * @param imageData 图片数据
 * @param wmid 用户wmid
 * @param sign
 * @param fileName 文件名
 */
export const uploadImageInfoResponse = async (
  cookie: string,
  imageData: buffer.Buffer,
  wmid: string,
  sign: string,
  fileName: string = 'mypic.png',
): Promise<UploadImageInfoResponse> => {
  const url = 'https://ns.dayu.com/article/imageResave?';

  const headers = {
    cookie: cookie,
    Referer: 'https://mp.dayu.com/',
  };

  const params = {
    appid: 'website',
    wmid: wmid,
    sign: sign,
  };

  const postData = new FormData();
  postData.append('upfile', imageData, { filename: fileName, contentType: 'image/png' });

  const result = await $http.post(url, postData, {
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface UploadImageInfoResponse {
  /**
   * 状态码
   */
  code: number;
  message: string;
  data: { status: number; src: string };
}

/**
 * 裁剪图片
 * @param cookie
 * @param wmid
 * @param sign
 * @param imgUrl
 * @param utoken
 * @param width
 * @param height
 */
export const getCutImageInfoResponse = async (
  cookie: string,
  wmid: string,
  sign: string,
  imgUrl: string,
  utoken: string,
  width: number = 0,
  height: number = 0,
): Promise<CutImageInfoResponse> => {
  const url = 'https://ns.dayu.com/article/imagecut?';

  const headers = {
    cookie: cookie,
    Referer: 'https://mp.dayu.com/',
  };

  const postData = {
    imgSrc: imgUrl,
    cutX: 0,
    cutY: 0,
    oriWidth: width,
    oriHeight: height,
    saveWidth: width,
    saveHeight: height,
    utoken: utoken,
  };

  const params = {
    appid: 'website',
    wmid: wmid,
    sign: sign,
  };

  const result = await $http.post(url, postData, {
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface CutImageInfoResponse {
  /**
   * 状态码
   */
  code: number;
  /**
   * 提示消息
   */
  message: string;
  data: {
    status: number;
    url: string;
    src: string;
    oriUrl: string;
  };
}

/**
 *
 * @param cookie
 * @param postData
 * @param utoken
 * @param pushType 推送类型，直接发布还是保存草稿,submit-article:保存草稿,save-draft:发布
 */
export const pushVideoDataResponse = async (
  cookie: string,
  postData: string,
  utoken: string,
  pushType: 'submit-article' | 'save-draft',
): Promise<PushVideoResponse> => {
  const url = `https://mp.dayu.com/dashboard/${pushType}`;

  const headers = {
    cookie: cookie,
    'bx-v': '2.5.11',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    Referer: 'https://mp.dayu.com/dashboard/video/write',
    utoken: utoken,
  };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

/**
 *
 * @param cookie
 * @param postData
 * @param utoken
 */
export const pushMiniVideoDataResponse = async (
  cookie: string,
  postData: string,
  utoken: string,
): Promise<PushVideoResponse> => {
  const url = 'https://mp.dayu.com/dashboard/minivideo/submitVideo';

  const headers = {
    cookie: cookie,
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    Referer: 'https://mp.dayu.com/dashboard/minivideo/write',
    utoken: utoken,
  };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface PushVideoResponse {
  data?: {
    //发布产生的唯一id
    _id: string;
    //发布时间
    wm_update_at: string;
    //预览链接
    previewUrl: string;

    content_id: string;
  };
  //发布失败的错误信息
  error: string;
}
