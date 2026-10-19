import { $http } from '@/http';
import { Random } from '@/utils';
import buffer from 'buffer';
import FormData from 'form-data';
import { HttpsProxyAgent } from 'https-proxy-agent';

export const getJianShuArticleBaseInfo = async (cookie: string): Promise<Array<JianShuBaseArticleInfo>> => {
  const url = 'https://www.jianshu.com/author/notebooks';

  const headers = {
    Accept: 'application/json',
    cookie: cookie,
    referer: 'https://www.jianshu.com/writer',
    Origin: 'https://www.jianshu.com/',
  };

  const result = await $http.get(url, { headers: headers });

  return result.data;
};

export interface JianShuBaseArticleInfo {
  id: number;
  name: string;
  seq: null;
  error?: string;
}

export const createJianShuArticle = async (
  cookie: string,
  noteBookId: number,
  title: string,
): Promise<JianShuCreateArticleResponse> => {
  const url = 'https://www.jianshu.com/author/notes';

  const headers = {
    accept: 'application/json',
    cookie: cookie,
    referer: 'https://www.jianshu.com/writer',
    Origin: 'https://www.jianshu.com/',
  };

  const postData = { notebook_id: noteBookId.toString(), title: title, at_bottom: false };

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

export interface JianShuCreateArticleResponse {
  id: number;
  title: string;
  slug: string;
  shared: boolean;
  notebook_id: number;
  seq_in_nb: number;
  note_type: number;
  autosave_control: number;
  content_updated_at: number;
  last_compiled_at: number;
  error?: string;
}

export const getJianShuImageUploadArgs = async (
  cookie: string,
  fileName: string = `${Date.now()}-${Date.now()}.png`,
): Promise<JianShuUploadImageArgs> => {
  const url = `https://www.jianshu.com/upload_images/token.json?filename=${encodeURIComponent(fileName)}`;

  const headers = {
    cookie: cookie,
    accept: 'application/json',
    referer: 'https://www.jianshu.com/writer',
    Origin: 'https://www.jianshu.com/',
  };
  const result = await $http.get(url, { headers: headers });

  return result.data;
};

export interface JianShuUploadImageArgs {
  token: string;
  key: string;
  error?: string;
}

export const uploadImageResponse = async (
  cookie: string,
  imageData: buffer.Buffer,
  fileName: string,
  uploadArgs: JianShuUploadImageArgs,
): Promise<JianShuImageUploadResponse> => {
  const url = 'https://upload.qiniup.com/';

  const headers = {
    cookie: cookie,
    accept: 'application/json',
    referer: 'https://www.jianshu.com/writer',
    Origin: 'https://www.jianshu.com/',
  };

  const postData = new FormData();
  postData.append('key', uploadArgs.key);
  postData.append('token', uploadArgs.token);
  postData.append('x:protocol', 'https');
  postData.append('file', imageData, {
    filename: fileName ?? `${Date.now()}.png`,
    contentType: 'image/png',
  });

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

export interface JianShuImageUploadResponse {
  format: string;
  height: number;
  url: string;
  width: number;
  error?: string;
}

export const saveJianShuDraftResponse = async (
  cookie: string,
  postStr: string,
  noteId: string,
): Promise<JianShuDraftResponse> => {
  const url = `https://www.jianshu.com/author/notes/${noteId}`;

  const headers = {
    cookie: cookie,
    accept: 'application/json',
    referer: 'https://www.jianshu.com/writer',
    Origin: 'https://www.jianshu.com/',
    'Content-Type': 'application/json',
  };

  const result = await $http.put(url, postStr, { headers: headers });

  return result.data;
};

export interface JianShuDraftResponse {
  id: number;
  content_updated_at: number;
  content_size_status: string;
  last_compiled_at: number;
  error?: [{ code: number; message: string }];
}

export const publishJianShuArticleResponse = async (
  cookie: string,
  noteId: number,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<JianShuPublishResponse> => {
  const url = `https://www.jianshu.com/author/notes/${noteId}/publicize`;

  const headers = {
    cookie: cookie,
    accept: 'application/json',
    referer: 'https://www.jianshu.com/writer',
    Origin: 'https://www.jianshu.com/',
    'Content-Type': 'application/json',
  };

  const result = await $http.post(url, '{}', { headers: headers, httpsAgent: proxyAgent, httpAgent: proxyAgent });

  return result.data;
};

export interface JianShuPublishResponse {
  last_compiled_at: number;
  error?: string|object;
}
