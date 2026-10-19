import * as buffer from 'buffer';
import { $http } from '../../http';
import FormData from 'form-data';
import { isJson } from '../../utils';
import { PublishResultResponse } from './bilibili-video.service';

/**
 * 上传图片
 * @param cookie 账号登录cookie
 * @param imageData 图片二进制数据
 * @param csrfToken
 * @param fileExt 文件类型/后缀
 * @param fileName 文件名
 */
export const uploadImageBinary = async (
  cookie: string,
  imageData: buffer.Buffer,
  csrfToken: string,
  fileExt: string = 'jpeg',
  fileName: string = '123.jpeg',
): Promise<UploadBilibiliImageResponse> => {
  const url = 'https://api.bilibili.com/x/article/creative/article/upcover';

  const headers = {
    cookie: cookie,
    referer: 'https://member.bilibili.com',
  };

  const multiFormData = new FormData();
  multiFormData.append('binary', imageData, { filename: fileName, contentType: `image/${fileExt}` });
  multiFormData.append('csrf', csrfToken);

  const result = await $http.post(url, multiFormData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

/**
 * 上传base64的图片
 * @param cookie
 * @param imageBase64Data 图片base64数据
 * @param csrfToken
 */
export const uploadImageBase64 = async (
  cookie: string,
  imageBase64Data: string,
  csrfToken: string,
): Promise<UploadBilibiliImageResponse> => {
  const url = 'https://api.bilibili.com/x/article/creative/article/upcover';

  const headers = {
    cookie: cookie,
    referer: 'https://member.bilibili.com',
    'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
  };

  const postData = `cover=${encodeURIComponent(imageBase64Data)}&csrf=${csrfToken}`;

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

/**
 * 通过url直接转换为平台下url
 * @param cookie
 * @param imgUrl 图片原url
 * @param csrfToken
 */
export const getImgFromUrl = async (
  cookie: string,
  imgUrl: string,
  csrfToken: string,
): Promise<UploadBilibiliImageResponse> => {
  const url = 'https://api.bilibili.com/x/article/creative/article/capture';

  const headers = {
    cookie: cookie,
    referer: 'https://member.bilibili.com',
    'Content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
  };

  const postData = `url=${encodeURIComponent(imgUrl)}&csrf=${csrfToken}`;

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface UploadBilibiliImageResponse {
  /**
   * 状态码 0正常 非0不正常
   */
  code: number;
  /**
   * 提示信息
   */
  message?: string;
  data?: {
    /**
     * 图片url
     */
    url: string;
    width: number;
    height: number;
    size: number;
  };
}

/**
 * 推送发布数据到官方
 * @param cookie
 * @param postData 组装好的数据
 * @param csrfToken cookie中bili_jct值
 * @param pubType 发布类型 1直接发布 0存草稿
 * @param ua
 */
export const publish = async (
  cookie: string,
  postData: string,
  csrfToken: string,
  pubType: number = 1,
  ua: string = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) 360/4.6.9 Chrome/138.0.7204.185 Safari/537.36',
): Promise<PublishResultResponse> => {
  let url = 'https://api.bilibili.com/x/article/creative/article/submit';
  if (pubType == 0) {
    url = 'https://api.bilibili.com/x/article/creative/draft/addupdate';
  }

  const headers = {
    cookie: cookie,
    Referer: 'https://member.bilibili.com/article-text/home',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'User-Agent': ua,
  };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};
