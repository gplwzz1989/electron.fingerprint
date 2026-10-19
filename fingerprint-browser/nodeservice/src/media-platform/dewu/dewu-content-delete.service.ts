import { $http } from '@/http';


/**
 *
 * @param cookie
 * @param docId
 */
export const deleteDeWuVideoResponse = async (cookie: string, docId: string): Promise<DeWuDeleteMiniVideoResponse> => {
  const url = 'https://creator.dewu.com/sns-creator-center/v1/h5/content/video-del?sign=';

  const headers = {
    cookie: cookie,
    referer: 'https://creator.dewu.com/',
    Origin: 'https://creator.dewu.com',
    'Content-Type': 'application/json;charset=UTF-8',
    appVersion: '5.40.0',
    v: '5.45.0',
    'x-auth-token': decodeURIComponent(cookie.split('dewu_creator_x-auth-token=')[1]?.split(';')[0]),
  };

  const postData = { contentId: parseInt(docId) };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface DeWuDeleteMiniVideoResponse {
  code: number;
  status: number;
  msg: string;
  data: { result: boolean };
  timestamp: number;
  traceId: string;
}
