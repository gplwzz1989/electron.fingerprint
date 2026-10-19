import { $http } from '@/http';
import buffer from 'buffer';
import { HttpsProxyAgent } from 'https-proxy-agent';
import FormData from 'form-data';
import { GetMD5, Task } from '@/utils';

export const getCheJiaHaoUploadPreResponse = async (cookie: string): Promise<CheJiaHaoUploadVideoPreResponse> => {
  const url = 'https://clubajax.autohome.com.cn/ClubVideo/GetVideoTag';

  const headers = {
    cookie: cookie,
    referer: 'https://creator.autohome.com.cn/web/publish/video',
    Origin: 'https://creator.autohome.com.cn',
  };
  await $http.get('https://creator.autohome.com.cn/web/publish/video', { headers: headers });
  await $http.get('https://creator.autohome.com.cn/openapi/ypttd/yjc/csc/creator/creatorinfo?is_check_state=1', {
    headers: headers,
  });
  await Task.Delay(3000);
  const result = await $http.get(url, { headers: headers });

  return result.data;
};

export interface CheJiaHaoBaseResponse {
  returncode: number;
  message: string;
}

export interface CheJiaHaoUploadVideoPreResponse extends CheJiaHaoBaseResponse {
  result: {
    sign: string;
    appId: string;
    callBack: string;
    timestamp: number;
  };
}

export const getCheJiaHaoUploadArgsResponse = async (
  cookie: string,
  fileName: string,
  fileSize: number,
  uploadPre: CheJiaHaoUploadVideoPreResponse,
): Promise<CheJiaHaoUploadArgsResponse> => {
  const url = `https://vc-vp.autohome.com.cn/api/media/create?title=${encodeURIComponent(
    fileName,
  )}&filename=${encodeURIComponent(fileName)}&filesize=${fileSize}&userid=${uploadPre.result.appId}&_appid=${
    uploadPre.result.appId
  }&_timestamp=${uploadPre.result.timestamp}&_sign=${
    uploadPre.result.sign
  }&mt=1&iw=0&isvr=undefined&ut=2&type=r&t=1766633873498&callback=http%3A%2F%2Fclubapi.in.autohome.com.cn%2FVideoUploadCallback%2FCallback&jp=`;

  const headers = {
    cookie: cookie,
    referer: 'https://creator.autohome.com.cn/web/publish/video',
    Origin: 'https://creator.autohome.com.cn',
  };

  const params = undefined;

  const result = await $http.get<CheJiaHaoUploadArgsResponse>(url, { headers: headers, params: params });
  if (result?.data?.result?.server) {
    const data = result?.data?.result;
    const urlCre = `${result.data.result.server}/api/media/multi/resume/create?mediaid=${data.id}&userid=${
      uploadPre.result.appId
    }&token=${data.token}&fileHash=&filename=${encodeURIComponent(
      fileName,
    )}&filesize=${fileSize}&mt=1&iw=0&isvr=undefined&t=${Date.now()}&hashType=0&version=2.2.9&areaType=pgc&param=lt%3D30%26gt%3D3`;
    await $http.get(urlCre);
  }

  return result.data;
};

export interface CheJiaHaoUploadArgsResponse extends CheJiaHaoBaseResponse {
  result: {
    id: string;
    server: string;
    mf: number;
    token: string;
  };
}

export const uploadCheJiaHaoVideoPartResponse = async (
  cookie: string,
  videoData: buffer.Buffer,
  uploadPre: CheJiaHaoUploadVideoPreResponse,
  uploadArgs: CheJiaHaoUploadArgsResponse,
  partNum: number,
  offset: number,
  ctxs: Map<number, string>,
): Promise<CheJiaHaoBaseResponse> => {
  const url =
    `${uploadArgs.result.server}/api/media/multi/resume/upload?mediaid=${uploadArgs.result.id}&userid=${uploadPre.result.appId}&token=${uploadArgs.result.token}` +
    `&segNum=${partNum}` +
    `&range=${offset}` +
    `&t=${Date.now()}`;

  await $http.options(url, {
    headers: {
      'Access-Control-Request-Method': 'POST',
    },
  });
  const headers = {
    cookie: cookie,
    referer: 'https://creator.autohome.com.cn/web/publish/video',
    Origin: 'https://creator.autohome.com.cn',
  };

  const formData = new FormData();
  formData.append('file', videoData, { filename: 'blob', contentType: `application/octet-stream` });

  const result = await $http.post<CheJiaHaoBaseResponse>(url, formData, {
    headers: headers,
  });
  ctxs.set(partNum, GetMD5(videoData));
  return result.data;
};

export const finishUploadCheJiaHaoVideoResponse = async (
  cookie: string,
  uploadPre: CheJiaHaoUploadVideoPreResponse,
  uploadArgs: CheJiaHaoUploadArgsResponse,
  partlist: Array<object>,
): Promise<{ returncode: number; message: string; result: { list: [] } }> => {
  const url = `${uploadArgs.result.server}/api/media/multi/resume/commit?mediaid=${uploadArgs.result.id}&userid=${uploadPre.result.appId}&token=${uploadArgs.result.token}`;

  const headers = {
    cookie: cookie,
    referer: 'https://creator.autohome.com.cn/web/publish/video',
    Origin: 'https://creator.autohome.com.cn',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const postData = `mediaid=${uploadArgs.result.id}&userid=${uploadPre.result.appId}&token=${
    uploadArgs.result.token
  }&segHash=${JSON.stringify(partlist)}&t=${Date.now()}`;

  const result = await $http.post(url, postData, {
    headers: headers,
    transformRequest: [
      function (data, headers) {
        // 不进行任何转换/编码，原样返回拼接好的字符串
        return data;
      },
    ],
  });

  return result.data;
};

export const getVideoStateResponse = async (
  cookie: string,
  mediaId: string,
): Promise<{ returncode: number; result: { status: number } }> => {
  const url = `https://creator.autohome.com.cn/openapi/content-api/video/frames?mid=${mediaId}`;

  const headers = {
    cookie: cookie,
    referer: 'https://creator.autohome.com.cn/web/publish/video',
    Origin: 'https://creator.autohome.com.cn',
  };
  const result = await $http.get(url, {
    headers: headers,
  });

  return result.data;
};

export const getCheJiaHaoImageUploadToken = async (cookie: string): Promise<string> => {
  const url = `https://creator.autohome.com.cn/openapi/content-api/upload/getUploadToken?t=${Date.now()}`;

  const headers = {
    cookie: cookie,
    referer: 'https://creator.autohome.com.cn/',
    Origin: 'https://creator.autohome.com.cn',
    Accept: 'application/json, text/plain, */*',
  };

  const result = await $http.get<{ returncode: number; result: string }>(url, {
    headers: headers,
  });

  return result.data?.result || '';
};

export const uploadCheJiaHaoImageResponse = async (
  cookie: string,
  imageData: buffer.Buffer,
  token: string,
  fileExtension: string = 'jpg',
): Promise<UploadImageInfoResponse> => {
  const url = `https://afs.autohome.com.cn/creator/proxy/service/fastUp?t=${Date.now()}`;

  const headers = {
    cookie: cookie,
    referer: 'https://creator.autohome.com.cn/',
    Origin: 'https://creator.autohome.com.cn',
    'X-Requested-With': 'XMLHttpRequest',
  };

  const formData = new FormData();
  formData.append('biztype', '1');
  formData.append('exName', fileExtension);
  formData.append('_appid', 'chejiatong');
  formData.append('source', 'chejiahao');
  formData.append('token', token);
  formData.append('file', imageData, { 
    filename: `${Date.now()}.${fileExtension}`, 
    contentType: `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}` 
  });

  const result = await $http.post<UploadImageInfoResponse>(url, formData, {
    headers: headers,
  });

  return result.data;
};

export interface UploadImageInfoResponse {
  code: number;
  message: string;
  result: string;
  url: string;
  md5Check: boolean;
}

export const saveDraftCheJiaHaoVideoResponse = async (
  cookie: string,
  postStr: string,
  save: number,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<CheJiaHaoVideoPublishResponse> => {
  //https://creator.autohome.com.cn/openapi/content-api/gc/video/publish?t=1766570462463&publishType=0
  const url = `https://creator.autohome.com.cn/openapi/content-api/gc/video/publish?t=${Date.now()}&publishType=${save}`;

  const headers = {
    cookie: cookie,
    referer: 'https://creator.autohome.com.cn/web/publish/video',
    Origin: 'https://creator.autohome.com.cn',
    'content-type': 'application/json; charset=UTF-8',
  };

  const result = await $http.post(url, postStr, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface CheJiaHaoVideoPublishResponse {
  returncode: number;
  message: string;
  result: {
    role: number;
    publishType: number;
    id: number;
    draftId: number;
    videoInfo: {
      vid: string;
      width: number;
      height: number;
      duration: number;
      firstframe: string;
    };
    videoType: number;
    title: string;
    summary: string;
    isMultiTitle: number;
    coverImageUrl: string;
    isFirst: number;
    isOriginal: number;
    timerStatus: number;
    timerTime: string;
    columnId: number;
    activityIds: number[];
    infoType: number;
  };
}

export const publishCheJiaHaoVideoResponse = async (
  cookie: string,
  postStr: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<{ returncode: number; message: string; result: string }> => {
  const url = `https://club-open-api.autohome.com.cn/topic/topicAdd?t=${Date.now()}`;

  const headers = {
    cookie: cookie,
    referer: 'https://creator.autohome.com.cn/web/publish/video',
    Origin: 'https://creator.autohome.com.cn',
    'content-type': 'application/x-www-form-urlencoded',
  };

  const result = await $http.post(url, postStr, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};
export const deleteDraftResponse = async (
  cookie: string,
  draftId: string,
): Promise<{ returncode: number; message: string; result: number }> => {
  const url = `https://creator.autohome.com.cn/openapi/content-api/draft/delete?draftId=${draftId}`;

  const headers = {
    cookie: cookie,
    referer: 'https://creator.autohome.com.cn/web/publish/video',
    Origin: 'https://creator.autohome.com.cn',
    'content-type': 'application/json; charset=UTF-8',
  };

  const result = await $http.get(url, {
    headers: headers,
  });

  return result.data;
};
