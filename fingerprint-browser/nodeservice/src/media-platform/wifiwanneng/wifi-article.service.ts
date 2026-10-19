import { $http } from '@/http';
import buffer from 'buffer';
import FormData from 'form-data';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ImageInfo } from '@/media-platform';

export const convertWiFiImageResponse = async (cookie: string, imgUrl: string): Promise<WiFiImageConvertResponse> => {
  const url = `https://mp.lsttnews.com/media-center/pic/replace.do?&`;

  const headers = {
    cookie: cookie,
    accept: 'application/json, text/plain, */*',
    referer: 'https://mp.lsttnews.com/',
    Origin: 'https://mp.lsttnews.com',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const postData = `remoteimgs=["${imgUrl}"]`;

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

export interface WiFiImageConvertResponse {
  // 嵌套的 data 对象
  data: {
    // data 下的 list 数组，每个元素包含 source、state、url 三个属性
    list: Array<{
      // 图片源地址，字符串类型
      source: string;
      // 状态标识，字符串类型（固定为 SUCCESS，可根据实际情况扩展为联合类型）
      state: string;
      // 图片访问地址，字符串类型
      url: string;
    }>;
  };
  // 根层级的 list 数组，结构与 data.list 一致
  list: Array<{
    source: string;
    state: string;
    url: string;
  }>;
  // 接口请求成功标识，布尔类型
  success: boolean;
  error: { code: number; message: string };
}

export const uploadImageResponse = async (
  cookie: string,
  imageData: buffer.Buffer,
  fileName: string,
): Promise<WiFiWanNengImageUploadResponse> => {
  const url = 'https://mp.lsttnews.com/media-center/pic/upload.do?action=/media-center/pic/upload.do&encode=utf-8';

  const headers = {
    cookie: cookie,
    accept: 'application/json, text/plain, */*',
    referer: 'https://mp.lsttnews.com/',
    Origin: 'https://mp.lsttnews.com',
  };

  const postData = new FormData();
  postData.append('id', 'WU_FILE_0');
  postData.append('name', fileName);
  postData.append('type', 'image/png');
  postData.append('lastModifiedDate', new Date().toUTCString());
  postData.append('size', imageData.length);
  postData.append('file', imageData, {
    filename: fileName ?? `${Date.now()}.png`,
    contentType: 'image/png',
  });

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

export interface WiFiWanNengImageUploadResponse {
  // 嵌套 data 对象的结构定义
  data: {
    // 图片ID，字符串类型
    imgid: string;
    // 图片访问URL，字符串类型
    url: string;
    // 状态描述文本，字符串类型
    statusText: string;
    // 状态码，数字类型（根据数据示例为整数）
    status: number;
  };
  // 根层级请求成功标识，布尔类型
  success: boolean;
  // 根层级图片访问URL，字符串类型（与 data.url 内容一致）
  url: string;
  // 根层级状态值，字符串类型（注意与 data.status 数字类型区分）
  status: string;
  error: { code: number; message: string };
}

export const cutWiFiImageResponse = async (
  cookie: string,
  imgUrl: string,
  imgInfo: ImageInfo,
): Promise<WiFiWanNengCutImageResponse> => {
  const url = `https://mp.lsttnews.com/media-center/pic/cutCoverImgs.do`;

  const headers = {
    cookie: cookie,
    accept: 'application/json, text/plain, */*',
    referer: 'https://mp.lsttnews.com/',
    Origin: 'https://mp.lsttnews.com',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const imgData = {};
  imgData[imgUrl] = {
    x: 0,
    y: 0,
    x2: imgInfo?.width ? imgInfo?.width : 376,
    y2: imgInfo?.height ? imgInfo.height : 282,
    w: imgInfo?.width ? imgInfo?.width : 376,
    h: imgInfo?.height ? imgInfo?.height : 282,
  };
  const postData = 'cutdata=' + encodeURIComponent(JSON.stringify(imgData));

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

export interface WiFiWanNengCutImageResponse {
  // 嵌套的 data 对象
  data: {
    // data 下的 list 数组，每个元素包含 source、state、url 三个属性
    result: Array<{
      // 图片源地址，字符串类型
      ori: string;
      // 状态标识，字符串类型（固定为 SUCCESS，可根据实际情况扩展为联合类型）
      state: string;
      // 图片访问地址，字符串类型
      url: string;
    }>;
    success: boolean;
  };

  // 接口请求成功标识，布尔类型
  success: boolean;
  error: { code: number; message: string };
}

export const publishWiFiArticleResponse = async (
  cookie: string,
  postStr: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<WiFiPublishResponse> => {
  const url = `https://mp.lsttnews.com/media-center/manager/news/saveedit.do`;

  const headers = {
    cookie: cookie,
    accept: 'application/json, text/plain, */*',
    referer: 'https://mp.lsttnews.com/',
    Origin: 'https://mp.lsttnews.com',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const result = await $http.post(url, postStr, { headers: headers, httpsAgent: proxyAgent, httpAgent: proxyAgent });

  return result.data;
};

export interface WiFiPublishResponse {
  data: { to: string,newsId:string };
  success: boolean;
  error: { code: number; message: string };
}
