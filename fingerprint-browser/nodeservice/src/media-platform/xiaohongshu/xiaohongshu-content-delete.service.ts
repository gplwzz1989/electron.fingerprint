import { $http } from '@/http';
import { getSign } from './xiaohongshu-sign';

export const deleteContent = async (cookie: string, docId: string): Promise<XiaohongshuDeleteContentResponse> => {
  const url = `https://edith.xiaohongshu.com/web_api/sns/capa/postgw/note/delete`;
  const headers = {
    cookie: cookie,
    referer: 'https://creator.xiaohongshu.com/',
    origin: 'https://creator.xiaohongshu.com/',
    'Content-Type': 'application/json;charset=UTF-8',
  };

  const postData = { note_id: docId };

  //签名
  const baseurl = '/web_api/sns/capa/postgw/note/delete';
  const sign = getSign(baseurl, postData);

  headers['X-s'] = sign['X-s'];
  headers['X-t'] = sign['X-t'];

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface XiaohongshuDeleteContentResponse {
  code: number;
  success: boolean;
  msg: string;
}
