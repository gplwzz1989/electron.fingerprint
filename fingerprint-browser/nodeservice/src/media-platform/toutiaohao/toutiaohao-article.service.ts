import { $http, HttpConfig } from '../../http';
import { GetTimeStamp, isJson } from '../../utils';
import * as buffer from 'buffer';
import { BadRequestException } from '../../error';
import FormData from 'form-data';
import { getPubSign } from '@/media-platform/toutiaohao/toutiaohao-base.service';
import { HttpsProxyAgent } from 'https-proxy-agent';
/**
 * 通过url直接转换为平台下url
 * @param cookie
 * @param imgUrl 图片原url
 */
export const getImgFromUrl = async (cookie: string, imgUrl: string): Promise<UploadToutiaohaoImageResponse> => {
  const url = 'https://mp.toutiao.com/spice/image?upload_source=20020003&aid=1231&device_platform=web&need_cover_url=1';

  const headers = {
    Accept: 'application/json, text/plain, */*',
    cookie: cookie,
    referer: 'https://mp.toutiao.com/profile_v4/graphic/publish',
    'Content-type': 'application/x-www-form-urlencoded',
  };

  const postData = {
    imageUrl: imgUrl,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

/**
 * 上传图片
 * @param cookie
 * @param imageData
 * @param fileName
 * @param fileType
 */
export const uploadImageBinary = async (
  cookie: string,
  imageData: buffer.Buffer,
  fileName: string,
  fileType: string,
): Promise<UploadToutiaohaoImageResponse> => {
  const url = 'https://mp.toutiao.com/spice/image?upload_source=20020003&aid=1231&device_platform=web';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.toutiao.com/profile_v4/graphic/publish',
    'Content-type': 'application/x-www-form-urlencoded',
  };

  const multiFormData = new FormData();
  multiFormData.append('image', buffer.Buffer.from(imageData), {
    filename: fileName,
    contentType: `image/${fileType ?? 'jpeg'}`,
  });

  const result = await $http.post(url, multiFormData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

/**
 * 头条图文发布
 * @param cookie
 * @param postData
 * @param proxyAgent
 */
export const publish = async (
  cookie: string,
  postData: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<PublishResultResponse> => {
  const queryStr = 'source=mp&type=article&aid=1231';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.toutiao.com/profile_v4/graphic/publish',
    'Content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
  };

  const signStr = await getPubSign(HttpConfig.userAgent, queryStr, postData);

  const url = `https://mp.toutiao.com/mp/agw/article/publish?${queryStr}&a_bogus=${signStr}`;

  const result = await $http.post(url, postData, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface PublishResultResponse {
  code: number;
  data: {
    pgc_id: string;
  };
  err_no: number;
  message: string;
  now: number;
  reason: string;
}

export interface UploadToutiaohaoImageInfoResponse {
  image_uri: string;
  image_url: string;
  image_width: number;
  image_height: number;
  image_format: string;
  image_size: number;
  image_mime_type: string;
  image_type: number;
  origin_image_uri: string;
  origin_image_url: string;
  cover_url: string;
}

export interface UploadToutiaohaoImageResponse {
  code: number;
  message?: string;
  data?: UploadToutiaohaoImageInfoResponse;
}

/**
 * 获取头条引用站点地点列表
 * @param cookie
 * @param page 页码
 * @param pageSize 每页数量
 * @param keyword 搜索关键字
 */
export const getToutiaohaoPlaceListAsync = async (
  cookie: string,
  page: number,
  pageSize: number,
  keyword: string,
): Promise<ToutiaohaoPlaceListResponse> => {
  const url = 'https://mp.toutiao.com/poi/api/searchplace';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.toutiao.com/profile_v4/graphic/publish',
    'Content-type': 'application/json; charset=UTF-8',
    biz: 1231,
  };

  const postData = {
    region: 'CN',
    language: 'zh-CN',
    offset: pageSize,
    page: page,
    device: 2,
    appid: 1231,
    location: '-1,-1',
    timestamp: Number(GetTimeStamp(10)),
    scenario: 'TIPS',
    keywords: keyword,
  };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface ToutiaohaoPlaceListResponse {
  code: number;
  data: {
    total: number;
    length: number;
    page: number;
    size: number;
    logid: string;
    poi: Array<{
      id: string;
      name: string;
      latitude: number;
      longitude: number;
      address: string;
      district: string;
      city: string;
      province: string;
      country: string;
      formatted_address: string;
      tel: string;
      distance: string;
      service_id: string;
      details: {
        awe: string;
      };
      type_code: string;
      type_name: string;
    }>;
  };
  mesg: string;
}
