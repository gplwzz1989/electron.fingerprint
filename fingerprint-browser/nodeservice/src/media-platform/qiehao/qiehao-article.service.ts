import * as buffer from 'buffer';
import { $http } from '../../http';
import { generateRandomFileName } from '../../utils';
import FormData from 'form-data';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 获取图片并上传
 * @param cookie
 * @param imgUrl 图片地址
 */
export const getImgFromUrl = async (cookie: string, imgUrl: string): Promise<QieUrlUploadQiehaoImageByUrlResponse> => {
  const url = 'https://image.om.qq.com/cpom_pimage/ContentImageUploadViaUrl';

  const headers = {
    cookie: cookie,
    referer: `https://om.qq.com`,
    'X-Requested-With': 'XMLHttpRequest',
    'Content-type': 'application/json',
  };

  const postData = {};
  postData['auth'] = {};
  postData['auth']['appid'] = 'LA6zXi1lWzAioIzdiAD6iM10aHarlHF6';
  postData['auth']['endpoint'] = 1;
  postData['relogin'] = 1;
  const reqData = {};
  postData['reqData'] = reqData;
  reqData['appid'] = 'LA6zXi1lWzAioIzdiAD6iM10aHarlHF6';
  reqData['endpoint'] = 1;
  reqData['isRetImgAttr'] = 1;
  reqData['isUpOrg'] = 1;
  reqData['opCode'] = 151;
  reqData['urls'] = [imgUrl];

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface QieUrlImageItem {
  width: string;
  height: string;
  faceSize: object;
  imageUrl: string;
}
export interface QieUrlUploadQiehaoImageByUrlResponse {
  code: number;
  message: string;
  data: {
    [key: string]: {
      url: string;
      size: {
        '1000': QieUrlImageItem;
        '640': QieUrlImageItem;
        '641': QieUrlImageItem;
        '0': QieUrlImageItem;
      };
      islong: number;
      length: string;
      isqrcode: number;
      face: string;
      type: number;
      count: number;
      copyright: number;
      errCode: number;
      msg: string;
    };
  };
}

/**
 * 上传图片
 * @param cookie
 * @param imageData 图片数据
 * @param fileExt 文件格式/后缀
 */
export const uploadImageBinary = async (
  cookie: string,
  imageData: buffer.Buffer,
  fileExt: string = 'jpeg',
): Promise<UploadQiehaoImageResponse> => {
  const url = 'https://image.om.qq.com/cpom_pimage/ArchacaleUploadViaFile';
  const fileName = generateRandomFileName(10, fileExt);

  const multiFormData = new FormData();
  multiFormData.append('isUpOrg', '1');
  multiFormData.append('appid', 'LA6zXi1lWzAioIzdiAD6iM10aHarlHF6');
  multiFormData.append('endpoint', '1');
  multiFormData.append('isRetImgAttr', 1);
  multiFormData.append('opCode', 151);
  multiFormData.append('file', imageData, { filename: fileName, contentType: `image/${fileExt}` });

  const headers = {
    cookie: cookie,
    referer: `https://om.qq.com`,
    'Content-type': 'multipart/form-data',
    'X-Requested-With': 'XMLHttpRequest',
  };

  const result = await $http.post(url, multiFormData, {
    headers: headers,
  });

  return result.data;
};

export interface UploadQiehaoImageResponse {
  code: number;
  message: string;
  data: {
    url: {
      errCode: number;
      islong: number;
      length: string;
      isqrcode: number;
      face: string;
      copyright: number;
      count: number;
      type: number;
      url: string;
      size: {
        '0': QieUrlImageItem;
        '1000': QieUrlImageItem;
        '640': QieUrlImageItem;
        '641': QieUrlImageItem;
      };
    };
  };
}

/**
 *
 * @param cookie
 * @param imgUrl  已经通过getImgFromUrl或者上传转换后的url，不能是非企鹅内的图片地址
 */
export const getCoverImageResponse = async (cookie: string, imgUrl: string): Promise<QiehaoCoverImageResponse> => {
  const url = 'https://image.om.qq.com/cpom_pimage/ListImageUploadViaUrl';

  const headers = {
    cookie: cookie,
    referer: `https://om.qq.com/main/creation/article`,
    'X-Requested-With': 'XMLHttpRequest',
    'Content-type': 'application/json',
  };

  const postData = {};
  postData['auth'] = {};
  postData['auth']['appid'] = 'LA6zXi1lWzAioIzdiAD6iM10aHarlHF6';
  postData['auth']['endpoint'] = 1;
  postData['relogin'] = 1;
  const reqData = {};
  postData['reqData'] = reqData;
  reqData['appid'] = 'LA6zXi1lWzAioIzdiAD6iM10aHarlHF6';
  reqData['endpoint'] = 1;
  reqData['isRetImgAttr'] = 1;
  reqData['isUpOrg'] = 1;
  reqData['opCode'] = 155;
  reqData['imageUrl'] = imgUrl;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface QiehaoCoverImageResponse {
  code: number;
  message: string;
  data: {
    isqrcode: number;
    images: object;
    ocr: string;
    length: string;
    type: number;
    /**
     * 图片不同大小列表
     */
    url: QieCoverImageItem;
    face: string;
    width: string;
    height: string;
  };
}
export interface QieCoverImageItem {
  '1': string;
  '150120': string;
  '196130': string;
  '240180': string;
  '294195': string;
}

export const publishArticle = async (
  cookie: string,
  pubType: number,
  postData: string,
  isPre: boolean = false,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<PublishArticleResponse> => {
  let url: string;
  if (pubType === 1) {
    url = 'https://om.qq.com/marticlepublish/omPublish';
  } else {
    url = 'https://om.qq.com/marticlepublish/omSave';
  }
  if (isPre) {
    url = 'https://om.qq.com/marticlepublish/omSchedulePublish';
  }

  const headers = {
    cookie: cookie,
    referer: 'https://om.qq.com/main/creation/article',
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

export interface PublishArticleResponse {
  response: { code: number; msg: string };
  data: { articleId: string; article?: { Farticle_id: string } } | Array<{ articleId: string }>;
}
