import { $http } from '@/http';

export const deleteVideoContent = async (cookie: string, docId: string): Promise<AiqiyiDeleteVideoContentResponse> => {
  const url = `https://mp-api.iqiyi.com/v-catalog/api/1.0/mp/videoCatalog/delete`;
  const headers = {
    cookie: cookie,
  };

  const postData = { qipuId: parseInt(docId), episodeType: 'RUGC' };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export const deleteVideoDraftContent = async (
  cookie: string,
  docId: string,
): Promise<AiqiyiDeleteVideoContentResponse> => {
  const url = `https://mp-api.iqiyi.com/v-catalog/api/1.0/rugc/videoCatalog/draft/delete`;
  const headers = {
    cookie: cookie,

    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
  };

  const postData = `draftId=${docId}`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface AiqiyiDeleteVideoContentResponse {
  httpStatus: 200;
  code: number;
  msg: string;
  data: null;
  msgCode: null;
}

export const deleteArticleContent = async (
  cookie: string,
  docId: string,
): Promise<AiqiyiDeleteArticleContentResponse> => {
  const docids = docId.split('_');

  const url = `https://mp-api.iqiyi.com/kol/api/1.0/feeds/${docids[0]}?feedId=${docids[0]}&circleId=${docids[1]}`;
  const headers = {
    cookie: cookie,
    // referer: 'https://mp.iqiyi.com/',
    // origin: 'https://mp.iqiyi.com/',
  };

  const result = await $http.delete(url, {
    headers: headers,
  });

  return result.data;
};

export const deleteArticleDraftContent = async (
  cookie: string,
  docId: string,
): Promise<AiqiyiDeleteArticleContentResponse> => {
  const url = `https://mp-api.iqiyi.com/kol/api/1.0/editor/draft/${docId}`;
  const headers = {
    cookie: cookie,
    // referer: 'https://mp.iqiyi.com/',
    // origin: 'https://mp.iqiyi.com/',
  };

  const result = await $http.delete(url, {
    headers: headers,
  });

  return result.data;
};

export interface AiqiyiDeleteArticleContentResponse {
  code: string; //'A00000';
  msg: string; //'success';
}
