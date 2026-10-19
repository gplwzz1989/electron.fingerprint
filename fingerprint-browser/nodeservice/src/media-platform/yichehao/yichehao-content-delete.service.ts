import { $http } from '@/http';
import { getHeaderSign } from '@/media-platform/yichehao/yichehao-user.service';
import { GetMD5, Guid } from '@/utils';

/**
 *
 * @param cookie
 * @param docId
 */
export const deleteYiCheVideoResponse = async (
  cookie: string,
  docId: string,
): Promise<YiCheDeleteMiniVideoResponse> => {
  const now = parseInt((Date.now() / 1000).toFixed(0));
  const url = `https://mp.yiche.com/web_mp/api/v1/small_video/del_small_video?cid=500&ver=1.0.0&uid=&t=${now}&sign=${getHeaderSign(
    now,
  )}&param=%7B%22videoId%22%3A%22${docId}%22%7D`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yiche.com/',
    Origin: 'https://mp.yiche.com',
    cid: 500,
    ver: '1.0.4',
    'x-user-guid': Guid.NewGuid().toString(),
    encrypttype: '2',
  };

  const result = await $http.get(url, { headers: headers });

  return result.data;
};

export interface YiCheDeleteMiniVideoResponse {
  status: string;
  message: string;
  data: null;
  ercd: '';
}

export const deleteYiCheManageVideoResponse = async (
  cookie: string,
  docId: string,
): Promise<YiCheDeleteMiniVideoResponse> => {
  const now = parseInt((Date.now() / 1000).toFixed(0));

  const postData = {
    cid: 500,
    ver: '1.0.0',
    uid: '',
    t: now,
    sign: '',
    param: { id: parseInt(docId), type: 4 },
  };

  const signStr =
    'cid=' +
    postData.cid +
    ';param=' +
    JSON.stringify(postData.param) +
    ';ver=' +
    postData.ver +
    ';t=' +
    postData.t +
    ';' +
    '6AC46B43FC8DCD6E49F66F6C016F393F';
  postData.sign = GetMD5(signStr);
  const url = `https://mp.yiche.com/web_mp/api/v1/manage/deletevideo`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yiche.com/detailManage/videos',
    Origin: 'https://mp.yiche.com',
    encrypttype: '2',
    'Content-Type': 'application/json',
  };

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

export const deleteYiCheArticleResponse = async (
  cookie: string,
  docId: string,
): Promise<YiCheDeleteMiniVideoResponse> => {
  const now = parseInt((Date.now() / 1000).toFixed(0));

  const postData = {
    cid: 500,
    ver: '1.0.0',
    uid: '',
    t: now,
    sign: '',
    param: { id: parseInt(docId) },
  };

  const signStr =
    'cid=' +
    postData.cid +
    ';param=' +
    JSON.stringify(postData.param) +
    ';ver=' +
    postData.ver +
    ';t=' +
    postData.t +
    ';' +
    '6AC46B43FC8DCD6E49F66F6C016F393F';
  postData.sign = GetMD5(signStr);
  const url = `https://mp.yiche.com/web_mp/api/v1/manage/deletecontent`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yiche.com/',
    Origin: 'https://mp.yiche.com',
    encrypttype: '2',
    'Content-Type': 'application/json',
  };

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};
