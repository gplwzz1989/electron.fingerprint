import { $http } from '@/http';

export const deleteContent = async (cookie: string, docId: string): Promise<ShipinhaoDeleteContentResponse> => {
  const url = `https://channels.weixin.qq.com/micro/content/cgi-bin/mmfinderassistant-bin/post/post_delete`;
  const headers = {
    cookie: cookie,
    referer: 'https://channels.weixin.qq.com/micro/content/iframe/post-card.html',
    origin: 'https://channels.weixin.qq.com',
  };

  const postData = {
    objectId: docId,
    timestamp: Date.now().toString(),
    _log_finder_uin: '',
    _log_finder_id: '',
    rawKeyBuff: null,
    pluginSessionId: null,
    scene: 7,
    reqScene: 7,
  };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface ShipinhaoDeleteContentResponse {
  errCode: number;
  errMsg: string;
  data: { baseResp: { errcode: number } };
}
