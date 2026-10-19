import { $http } from '@/http';

export const deleteTengXunShiPinContentResponse = async (
  cookie: string,
  vid: string,
  vstk: number,
): Promise<{ code: number; msg: string }> => {
  const url = 'https://access.v.qq.com/trpc.creator_center.backend.VideoFusion/OperateVideo';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.v.qq.com/',
    Origin: 'https://mp.v.qq.com/',
  };

  const params = {
    g_vstk: vstk,
    refer: 'vcc_web',
    origin: 1,
  };
  const postData = { vid: vid, cid: '', operate: 3 };

  const result = await $http.post(url, postData, { headers: headers, params: params });

  return result.data;
};
