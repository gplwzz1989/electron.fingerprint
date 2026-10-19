import { $http } from '@/http';

export const deleteContent = async (cookie: string, docId: string): Promise<DelteQiehaoContentResponse> => {
  const url = `https://om.qq.com/marticlepublish/deleteV2`;
  const headers = {
    cookie: cookie,
    referer: 'https://om.qq.com/main/management/articleManage',
    origin: 'https://om.qq.com',
  };

  const postData = {
    articleId: docId,
    operation: 'user_self_deleted',
    reason: '全平台分发文章删除',
    source: 0,
    subSource: 0,
    relogin: 1,
  };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface DelteQiehaoContentResponse {
  response: { code: number; msg: string };
  data: { result: true };
}

export const deleteContentVideoSource = async (cookie: string, vid: string): Promise<DelteQiehaoContentResponse> => {
  const url = `https://om.qq.com/VideoManager/DeleteVideo`;
  const headers = {
    cookie: cookie,
    referer: 'https://om.qq.com/main/management/articleManage',
    origin: 'https://om.qq.com',
  };

  const postData = `vid=${vid}`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};
