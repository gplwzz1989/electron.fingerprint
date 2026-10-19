import { $http } from '@/http';
import crypto from 'crypto';
import * as buffer from 'buffer';
import XMLWriter from 'xml-writer';
import { generateRandomFileName, isJson } from '@/utils';
import FormData from 'form-data';
import { YidianhaoVideoTaskInput } from '@/media-platform/yidianhao/yidianhao-video';
import { HttpsProxyAgent } from 'https-proxy-agent';

export const getAKAndSK = async (url: string): Promise<{ code: number; ak: string; sk: string }> => {
  if (url.startsWith('//')) {
    url = `https:${url}`;
  }

  const headers = {
    referer: 'https://mp.yidianzixun.com',
    Origin: 'https://mp.yidianzixun.com',
  };

  const result = await $http.get(url, { headers: headers });

  const SKObject = /config\.SK=".*"/.exec(result?.data ?? '');
  const AKObject = /config\.AK=".*"/.exec(result?.data ?? '');
  const AK = AKObject ? AKObject[0]?.split('"')[1] : '';
  const SK = SKObject ? SKObject[0]?.split('"')[1] : '';
  return { code: AK ? 0 : result.status, ak: AK, sk: SK };
};

export const getYidianHaoUploadArgs = async (
  cookie: string,
  mpCode: string,
  type: string = 'video',
  fileExt: string = 'mp4',
): Promise<YidianhaoVideoUploadArgs> => {
  const url = `https://mp.yidianzixun.com/upload?action=sign&ext=${fileExt}&fn=20231123-${parseInt(
    String(Math.random() * (99999 - 11111) + 1),
  )}&type=${type}`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yidianzixun.com/',
    Origin: 'https://mp.yidianzixun.com',
    'x-mp-code': mpCode,
  };

  const result = await $http.get(url, { headers: headers });

  return result.data;
};

export interface YidianhaoVideoUploadArgs {
  status: string; //'success';
  result: Array<string>;
  uploadId?: string;
  error?: string;
  // result: [
  //   '/BuBx5t7pKxexhua31BW',
  //   'user_upload/1733886011027e67a60861e24537ab2cd25b71fd7adbc.mp4',
  //   'eyJleHBpcmF0aW9uIjoiMjAyNC0xMi0xMVQwNDowMDoxMS4wMjZaIiwiY29uZGl0aW9ucyI6W3siYWNsIjoicHJpdmF0ZSJ9LHsiYnVja2V0IjoidmlkZW8teWlkaWFuIn0sWyJzdGFydHMtd2l0aCIsIiRrZXkiLCIiXSxbInN0YXJ0cy13aXRoIiwiJG5hbWUiLCIiXV19',
  //   '/GWKMyLGH9JS5VisfuFDLIqB43I=',
  // ];
}

export const getYidianhaoUploadId = async (
  cookie: string,
  fileLength: number,
  uploadArgs: YidianhaoVideoUploadArgs,
  mpCode: string,
  sk: string,
  ak: string,
): Promise<{ code: number; uploadId: string }> => {
  const url = `https://ks3-cn-beijing.ksyun.com/video-yidian/${uploadArgs.result[1]}?uploads`;

  const string2Sign = `POST\n\n\n\nx-kss-acl:private\nx-kss-meta-content-length:${fileLength}\n/video-yidian/${uploadArgs.result[1]}?uploads`;
  const sign = crypto.createHmac('sha1', sk).update(string2Sign).digest('base64');

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yidianzixun.com/',
    Origin: 'https://mp.yidianzixun.com',
    'x-mp-code': mpCode,
    'x-kss-meta-content-length': fileLength,
    'x-kss-acl': 'private',
    Authorization: `KSS ${ak ?? uploadArgs?.result[0]}:${sign}`,
    'content-type': null,
  };

  const result = await $http.post(url, '', { headers: headers });

  const uploadId = result?.data?.split('UploadId>')[1]?.split('<')[0];
  return { code: uploadId ? 0 : result.status, uploadId: uploadId };
};

export const uploadYidianhaoVideoPart = async (
  cookie: string,
  videoData: buffer.Buffer,
  partNum: number,
  uploadId: string,
  ak: string,
  sk: string,
  mpCode: string,
  uploadArgs: YidianhaoVideoUploadArgs,
  uploadListMap: Map<number, string>,
): Promise<{ code: number; etag: string }> => {
  const qrString = `${uploadArgs.result[1]}?partNumber=${partNum}&uploadId=${uploadId}`;

  const url = `https://ks3-cn-beijing.ksyun.com/video-yidian/${qrString}`;

  const string2Sign = `PUT\n\n\n\n/video-yidian/${qrString}`;
  const sign = crypto.createHmac('sha1', sk).update(string2Sign).digest('base64');

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yidianzixun.com/',
    Origin: 'https://mp.yidianzixun.com',
    'x-mp-code': mpCode,
    Authorization: `KSS ${ak ?? uploadArgs?.result[0]}:${sign}`,
    'content-type': null,
  };

  let result = await $http.put(url, videoData, {
    headers: headers,
  });

  if (!result?.headers['etag']?.toString()) {
    result = await $http.put(url, videoData, {
      headers: headers,
    });
  }

  const etag = result?.headers['etag']?.toString();
  if (etag) {
    uploadListMap.set(partNum, etag);
  }
  return { code: etag ? 0 : result.status, etag: etag };
};

export const checkUploadedVideo = async (
  cookie: string,
  uploadId: string,
  ak: string,
  sk: string,
  mpCode: string,
  uploadArgs: YidianhaoVideoUploadArgs,
  uploadListMap: Map<number, string>,
): Promise<{ code: number; crc64: string; etag: string }> => {
  const url = `https://ks3-cn-beijing.ksyun.com/video-yidian/${uploadArgs.result[1]}?uploadId=${uploadId}`;

  const xmlETag = new XMLWriter();
  xmlETag.startElement('CompleteMultipartUpload');
  for (let i = 1; i <= uploadListMap.size; i++) {
    xmlETag.startElement('Part');
    xmlETag.writeElement('PartNumber', i);
    xmlETag.writeElement('ETag', uploadListMap.get(i));
    xmlETag.endElement();
  }
  xmlETag.endElement();

  const string2Sign = `POST\n\ntext/plain;charset=UTF-8\n\n/video-yidian/${uploadArgs.result[1]}?uploadId=${uploadId}`;
  const sign = crypto.createHmac('sha1', sk).update(string2Sign).digest('base64');

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yidianzixun.com/',
    Origin: 'https://mp.yidianzixun.com',
    'x-mp-code': mpCode,
    Authorization: `KSS ${ak ?? uploadArgs?.result[0]}:${sign}`,
    'content-type': 'text/plain;charset=UTF-8',
  };

  const result = await $http.post(url, xmlETag.toString(), { headers: headers });

  const crc64 = result.data?.split('ChecksumCRC64ECMA>')[1]?.split('<')[0];
  const etag = result.data?.split('ETag>')[1]?.split('<')[0];

  return { code: crc64 ? 0 : result.status ?? -1, crc64: crc64, etag: etag };
};

export const extraFrameVideo = async (
  cookie: string,
  mpCode: string,
  uploadArgs: YidianhaoVideoUploadArgs,
): Promise<void> => {
  const url = `https://mp.yidianzixun.com/model/Video?action=extractFrameAdd&video_id=${
    uploadArgs.result[1]
  }&_rk=node77${Date.now()}`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yidianzixun.com/',
    Origin: 'https://mp.yidianzixun.com',
    'x-mp-code': mpCode,
  };

  await $http.get(url, { headers: headers });
};

export const getVideoDuration = async (
  cookie: string,
  mpCode: string,
  uploadArgs: YidianhaoVideoUploadArgs,
): Promise<void> => {
  const url = `https://mp.yidianzixun.com/model/Video?action=getVideoDuration&videoID=${
    uploadArgs.result[1]
  }&_rk=node77${Date.now()}`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yidianzixun.com/',
    Origin: 'https://mp.yidianzixun.com',
    'x-mp-code': mpCode,
  };

  await $http.get(url, { headers: headers });
};

export const getImageFromUrl = async (
  cookie: string,
  imgUrl: string,
  mpCode: string,
): Promise<YidianhaoImageFromUrlResponse> => {
  const url = `https://mp.yidianzixun.com/api/getImageFromUrl?src=${encodeURIComponent(imgUrl)}`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yidianzixun.com/',
    Origin: 'https://mp.yidianzixun.com',
    'x-mp-code': mpCode,
  };

  const result = await $http.get(url, { headers: headers });

  return result.data;
};

export interface YidianhaoImageFromUrlResponse {
  /**
   * 成功后的图片url
   */
  inner_addr: string;
  status: string;
  error: string;
}

/**
 * 上传图片
 * @param cookie
 * @param imageData 图片数据
 * @param mpCode
 * @param fileExt 文件格式/后缀
 */
export const uploadImageBinary = async (
  cookie: string,
  imageData: buffer.Buffer,
  mpCode: string,
  fileExt: string = 'jpeg',
): Promise<YidianhaoImageUploadResponse> => {
  fileExt = fileExt ? fileExt : 'png';
  const url = `https://mp.yidianzixun.com/upload?action=uploadimage&picType=wemedia_cnt`;
  const fileName = generateRandomFileName(10, fileExt);

  const multiFormData = new FormData();
  multiFormData.append('upfile', imageData, { filename: fileName, contentType: `image/${fileExt}` });

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yidianzixun.com/',
    Origin: 'https://mp.yidianzixun.com',
    'x-mp-code': mpCode,
  };
  const result = await $http.post(url, multiFormData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface YidianhaoImageUploadResponse {
  /**
   * 成功后的图片url
   */
  url: string;
  format: string;
  status: string;
  error: string;
}

export const saveYidianhaoVideoDraft = async (
  cookie: string,
  postData: string,
  mpCode: string,
): Promise<YidianhaoVideoSaveDraftResponse> => {
  const url = `https://mp.yidianzixun.com/model/Article?action=postSaveBatch&_rk=node77${Date.now()}`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yidianzixun.com/',
    Origin: 'https://mp.yidianzixun.com',
    'x-mp-code': mpCode,
    'content-type': 'application/json',
  };

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

export interface YidianhaoVideoSaveDraftResponse {
  result: {
    status: string;
    result: {
      success: Array<{
        created_time: number;
        id: number;
        media_id: number;
        country: string;
      }>;
      failed: [];
    };
    /**
     * 0正常
     */
    code: number;
  };
}

export const getArticleScheduleTime = async (cookie: string, publishId: string, mpCode: string): Promise<void> => {
  const url = `https://mp.yidianzixun.com/model/Article?action=get_article_schedule_time&id=${publishId}&_rk=node77${Date.now()}`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yidianzixun.com/',
    Origin: 'https://mp.yidianzixun.com',
    'x-mp-code': mpCode,
  };

  const result = await $http.get(url, { headers: headers });

  return result.data;
};

export const prePubYidianhaoVideo = async (
  cookie: string,
  publishId: string,
  taskData: YidianhaoVideoTaskInput,
  mpCode: string,
): Promise<{ result: Array<{ id: string }> }> => {
  const url = `https://mp.yidianzixun.com/api/post/schedule/create?id=${publishId}&pub_time=${
    taskData['pub_time']
  }&min_timing_hour=6&max_timing_day=7&_rk=node77${Date.now()}`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yidianzixun.com/',
    Origin: 'https://mp.yidianzixun.com',
    'x-mp-code': mpCode,
  };

  const result = await $http.get(url, { headers: headers });

  return result.data;
};

export const publishYidianhaoVideoResponse = async (
  cookie: string,
  publishId: string,
  mpCode: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<{ result: { status: string } }> => {
  const url = `https://mp.yidianzixun.com/model/Article?action=postPublishBatch&_rk=${Date.now()}`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yidianzixun.com/',
    Origin: 'https://mp.yidianzixun.com',
    'x-mp-code': mpCode,
    'content-type': 'application/json',
  };

  const postData = { post_id: publishId };

  const result = await $http.post(url, postData, { headers: headers, httpsAgent: proxyAgent, httpAgent: proxyAgent });

  return result.data;
};
