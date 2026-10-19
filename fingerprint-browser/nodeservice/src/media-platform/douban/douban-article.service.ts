import { $http } from '@/http';
import buffer from 'buffer';
import FormData from 'form-data';
import { HttpsProxyAgent } from 'https-proxy-agent';

export const getPublishToken = async (cookie: string): Promise<string> => {
  const url = 'https://www.douban.com/note/create';

  const headers = {
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    cookie: cookie,
    referer: 'https://www.douban.com/',
    origin: 'https://www.douban.com',
  };

  const result = await $http.get(url, { headers: headers, responseType: 'text' });

  return result.data;
};

export const covertImgFromUrl = async (
  cookie: string,
  imgUrl: string,
  noteId: string,
): Promise<DouBanImageConvertResponse> => {
  const url = 'https://www.douban.com/j/group/topic/fetch_photo';

  const headers = {
    cookie: cookie,
    referer: 'https://www.douban.com/',
    origin: 'https://www.douban.com',
  };

  const formData = new FormData();
  formData.append('photo_url', imgUrl);
  formData.append('note_id', noteId);
  formData.append('ck', cookie.split('ck=')[1]?.split(';')[0]);

  const result = await $http.post(url, formData, { headers: headers });

  return result.data;
};

export interface DouBanImageConvertResponse {
  photo: {
    width: number;
    primary_color: string;
    thumb: string;
    seq: number;
    file_size: number;
    url: string;
    file_name: string;
    is_animated: boolean;
    id: string;
    height: number;
  };
  //0:为正常
  r: number;
  code: number;
}

export const uploadImageResponse = async (
  cookie: string,
  imageData: buffer.Buffer,
  noteId: string,
  uploadToken: string,
): Promise<DouBanImageConvertResponse> => {
  const url = 'https://www.douban.com/j/group/topic/add_photo';

  const headers = {
    cookie: cookie,
    referer: 'https://www.douban.com/',
    origin: 'https://www.douban.com',
  };

  const formData = new FormData();
  formData.append('folder', '/note/');
  formData.append('note_id', noteId);
  formData.append('ck', cookie.split('ck=')[1]?.split(';')[0]);
  formData.append('upload_auth_token', uploadToken);
  formData.append('image_file', imageData, { filename: `${Date.now()}.png`, contentType: 'image/png' });

  const result = await $http.post(url, formData, { headers: headers });

  return result.data;
};

export const publishDouBanArticleResponse = async (
  cookie: string,
  postStr: object,
  pubType: 0 | 1,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<DouBanHaoPublishResponse> => {
  const url = `https://m.douban.com/rexxar/api/v2/topic/post`;

  const headers = {
    cookie: cookie,
    referer: 'https://www.douban.com/',
    origin: 'https://www.douban.com',
    'Content-Type': 'application/json;charset=UTF-8',
  };

  const result = await $http.post(url, postStr, { headers: headers, httpsAgent: proxyAgent, httpAgent: proxyAgent });

  return result.data;
};

export interface DouBanHaoPublishResponse {
  url: string; //'https://www.douban.com/note/875394677/';
  error: boolean | string;
  code?: number;
  msg?: string;
  id:string;
}
