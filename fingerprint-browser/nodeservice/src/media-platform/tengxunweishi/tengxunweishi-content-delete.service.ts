import { $http } from '@/http';

export const deleteContent = async (
  cookie: string,
  docId: string,
  personId: string,
): Promise<TengxunweishiDeleteContentResponse> => {
  const url = `https://media.weishi.qq.com/media-api/delVideo`;
  const headers = {
    cookie: cookie,
    referer: 'https://media.weishi.qq.com/media/video-manage',
    origin: 'https://media.weishi.qq.com',
    'Content-Type': 'application/json;charset=UTF-8',
  };

  const postData = { data: `{"feedId":"${docId}","personId":"${personId}","isPrePub":false}` };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface TengxunweishiDeleteContentResponse {
  code: number;
  msg: string;
}
