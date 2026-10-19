import { $http } from '@/http';
import { generateRandomFileName, Random } from '@/utils';
import FormData from 'form-data';
import * as buffer from 'buffer';
import { getNowTimeStamp } from '@/utils/use-date';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { wangyiSign } from '@/media-platform/wangyihao/wangyihao-user.service';

/**
 *
 * @param cookie
 * @param imgUrl 图片url地址
 */
export const getImgFromUrl = async (cookie: string, imgUrl: string): Promise<WangyihaoImgFromUrlResponse> => {
  const url = `http://mp.163.com/api/v2/upload/batchUploadImgUrl?_=${new Date().getTime()}`;

  const headers = {
    cookie: cookie,
    referer: `http://mp.163.com/subscribe_v4/index.html`,
    'X-Requested-With': 'XMLHttpRequest',
    Origin: 'http://mp.163.com',
  };

  const postData = `uploadtype=cms&from=neteasecode_mp&bucketName=dingyue&urls=${imgUrl}`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface WangyihaoImgFromUrlResponse {
  code: number;
  msg: string;
  data: {
    [key: string]: string;
  };
  errmsg: {
    msg: '';
  };
}

/**
 * 上传图片
 * @param cookie
 * @param imageData 图片数据
 * @param nickname
 * @param wemediaid
 * @param fileExt 文件格式/后缀
 */
export const uploadImageBinary = async (
  cookie: string,
  imageData: buffer.Buffer,
  nickname: string,
  wemediaid: string,
  fileExt: string = 'jpeg',
): Promise<UploadWangyihaoImageResponse> => {
  const url = `http://mp.163.com/api/v3/upload/picupload?_=${Date.now()}&wemediaId=${wemediaid}`;
  const fileName = generateRandomFileName(10, fileExt);

  const multiFormData = new FormData();
  multiFormData.append('from', 'neteasecode_mp');
  multiFormData.append('logoText', nickname);
  multiFormData.append('file', imageData, { filename: fileName, contentType: `image/${fileExt}` });

  const headers = {
    cookie: cookie,
    referer: `http://mp.163.com/subscribe_v4/index.html`,
    'X-Requested-With': 'XMLHttpRequest',
    Origin: 'http://mp.163.com',
  };

  const result = await $http.post(url, multiFormData, {
    headers: headers,
  });

  return result.data;
};

export interface UploadWangyihaoImageResponse {
  /**
   * 状态码 200:正常，否则异常
   */
  code: number;
  /**
   * 错误提示
   */
  msg: string;
  data: {
    url: string;
    pid: string;
    width: number;
    height: number;
  };
}

export const publishArticle = async (
  cookie: string,
  postData: string,
  wemediaId: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<PublishArticleResponse> => {
  const url = 'https://mp.163.com/wemedia/article/status/api/publishV2.do';

  const headers = {
    Accept: 'application/json',
    cookie: cookie,
    Referer: 'https://mp.163.com/subscribe_v4/index.html',
    'X-B3-Sampled': '1',
    'X-B3-SpanId': '0',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    Origin: 'https://mp.163.com',
  };
  headers['X-NR-Trace-929'] = wangyiSign(postData);
  const rdm = new Random().Next(11111, 99999);
  headers['X-NR-Trace-Id'] = `${Date.now()}_5694${rdm}459584_${rdm}mp${rdm}`;
  const params = {
    _: getNowTimeStamp(13),
    wemediaId: wemediaId,
    realUserId: '',
  };

  const result = await $http.post(url, postData, {
    headers: headers,
    params: params,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface PublishArticleResponse {
  /**
   * 1:正常 ，非1异常
   */
  code: number;
  msg: string;
  data: string; //'/wemedia/article/mylist/W2905703798683225716/1-20.html,JIV8RH4P0552ZF94';
}
