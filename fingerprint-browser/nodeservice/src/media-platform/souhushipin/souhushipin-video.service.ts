import { HttpsProxyAgent } from 'https-proxy-agent';
import { $http } from '@/http';
import * as buffer from 'buffer';
import FormData from 'form-data';
import { Task } from '@/utils';

export const getUploadArgResponse = async (
  cookie: string,
  title: string,
  fileSize: number,
  ndltk: string,
  proxyAgent?: HttpsProxyAgent<string>,
): Promise<SouHuShiPinUploadArgResponse> => {
  const headers = {
    cookie: cookie,
    referer: 'https://my.tv.sohu.com',
    'content-type': 'application/x-www-form-urlencoded',
    Origin: 'http://my.tv.sohu.com',
  };

  const params = {};

  const postData = `m=add&outType=3&uploadFrom=8&title=${encodeURIComponent(
    title,
  )}&desp=&t=${Date.now()}&videosize=${fileSize}&videoType=10&videomd5=&retEncode=0&ssl=0&ndltk=${ndltk}&introduction=&playLimit=0&isToken=1`;

  const result = await $http.post('https://my.tv.sohu.com/user/a/wvideo/save.do', postData, {
    headers: headers,
    params: params,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface SouHuShiPinUploadArgResponse {
  age: string;
  backVtos: Array<string>;
  cateCode: number;
  categoriesId: number;
  education: string;

  fwd: string;
  /**
   * 上传id
   */
  id: string;
  introduction: string;
  isold: false;
  job: string;
  location: number;
  md5status: number;
  payStatus: number;
  pcatecode: number;
  photoUrls: string;
  pid: number;
  playLimit: number;
  playType: number;
  plevel: number;
  plevelEditAble: true;
  pname: string;
  publisher: number;
  sex: number;
  smallCover: string;
  srcip: string;
  status: number;
  statusText: string;
  tag: string;
  title: string;
  token: string; //'1001_1749691819_f3b38571075ce2329a93bed1ac8fbbfc';
  userId: number;
  videoLevel: number;
  videoType: number;
  videostatus: number;
  /**
   * 上传地址不带http头
   */
  vto: string; //'//v134.hd.sohu.com.cn/upload?';
  vtos: string;
}

export const uploadVideoBinaryPart = async (
  uploadArgs: SouHuShiPinUploadArgResponse,
  cookie: string,
  videoData: buffer.Buffer,
  partNum: number,
  blockSize: number,
): Promise<UploadPartResponse> => {
  const url = `${uploadArgs.vto?.startsWith('//') ? `https:${uploadArgs.vto}` : uploadArgs.vto}&type=6&outType=3&id=${
    uploadArgs.id
  }&partNo=${partNum}&partsize=${blockSize}`;

  const multiFormData = new FormData();
  multiFormData.append('file', videoData, { filename: 'blob', contentType: `application/octet-stream` });

  const headers = {
    cookie: cookie,
    referer: 'https://my.tv.sohu.com/user/video/upload.do',
    Origin: 'https://my.tv.sohu.com',
  };

  const result = await $http.post(url, multiFormData, {
    headers: headers,
  });

  return result.data;
};

export interface UploadPartResponse {
  //100;
  code: number;
  partNo: number;
  id: string;
  type: number;
}

export const reportProcess = async (
  title: string,
  sizeM: number,
  process: string,
  upArgs: SouHuShiPinUploadArgResponse,
): Promise<void> => {
  for (let i = 0; i < 2; i++) {
    try {
      let url = '';
      if (process === 'init')
        url = `http://up.hd.sohu.com.cn/stat.gif?type=html5&title=${encodeURIComponent(
          title,
        )}&filesize=${sizeM}M&step=init&userId=${upArgs.userId}`;
      else if (process == 'progress')
        url = `http://up.hd.sohu.com.cn/stat.gif?type=html5&title=${encodeURIComponent(title)}&vid=${
          upArgs.id
        }&filesize=${sizeM}&step=progress&vto=${upArgs.vto}&userId=${upArgs.userId}`;
      else
        url = `http://up.hd.sohu.com.cn/stat.gif?type=html5&title=${encodeURIComponent(title)}&vid=${
          upArgs.id
        }&filesize=${sizeM}M&step=success&vto=${upArgs.vto}&percent=100&userId=${upArgs.userId}`;

      const result = await $http.get(url);

      if (result.status != 200) {
        if (i < 2) {
          await Task.Delay(2000);
          continue;
        }
      }

      break;
    } catch (e) {}
  }
  return;
};

export const uploadImageResponse = async (
  cookie: string,
  imageData: buffer.Buffer,
  fileName: string = '123.jpg',
): Promise<UploadImageResponse> => {
  const url = 'https://uploadpic.tv.sohu.com/v2/ndfs/uploadPhoto.do';

  const multiFormData = new FormData();
  multiFormData.append('appid', '100114');
  multiFormData.append('appidKey', 'ea86bbbe07094484fefdf9a5f7037dee');
  multiFormData.append('allowGif', '1');
  multiFormData.append('needCompress', 'true');
  multiFormData.append('isSupportHttps', 'true');
  multiFormData.append('file', imageData, { filename: fileName, contentType: `image/png` });

  const headers = {
    cookie: cookie,
    referer: 'https://my.tv.sohu.com/user/video/upload.do',
    Origin: 'https://my.tv.sohu.com',
  };

  const result = await $http.post(url, multiFormData, {
    headers: headers,
  });

  return result.data;
};

export interface UploadImageResponse {
  size: number;
  width: number;
  /**
   * 不带http头
   */
  url: string;
  /**
   * 1为正常
   */
  status: number;
  urlKey: string;
  height: number;
}

export const checkFinishUpload = async (
  uploadArgs: SouHuShiPinUploadArgResponse,
  cookie: string,
  fileSize: number,
): Promise<FinishResponse> => {
  const url = `${
    uploadArgs.vto?.startsWith('//') ? `https:${uploadArgs.vto}` : uploadArgs.vto
  }&type=7&file=.mp4&outType=3&id=${uploadArgs.id}&size=${fileSize}`;

  const headers = {
    cookie: cookie,
    referer: 'https://my.tv.sohu.com/user/video/upload.do',
    Origin: 'https://my.tv.sohu.com',
  };

  const result = await $http.get(url, {
    headers: headers,
  });

  return result.data;
};

export interface FinishResponse {
  code: number; //100;
  partNo: number;
  id: string;
  type: string;
}

export const publishVideoResponse = async (
  cookie: string,
  postStr: string,
  isDraft: boolean,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<SouHuShiPinPublishResponse> => {
  const url = `http://my.tv.sohu.com/user/a/wvideo/${isDraft ? 'draft' : 'update.do'}`;

  const headers = {
    cookie: cookie,
    referer: 'https://my.tv.sohu.com',
    'content-type': 'application/x-www-form-urlencoded',
    Origin: 'http://my.tv.sohu.com',
  };

  const params = {};

  const result = await $http.post(url, postStr, {
    headers: headers,
    params: params,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface SouHuShiPinPublishResponse {
  data: string;
  id: number;
  /**
   * 1 为正常
   */
  status: number;
  statusText: string;
}
