import { $http } from '@/http';

export const deleteDuoDuoContentResponse = async (
  cookie: string,
  docId: string,
  anti_content,
): Promise<DeleteContentResponse> => {
  const url = 'https://live.pinduoduo.com/api/backbone/video/delete';

  const headers = {
    cookie: cookie,
    referer: 'https://live.pinduoduo.com',
    'Anti-Content': anti_content,
    'content-type': 'application/json',
  };

  const postData = { feedId: docId };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface DeleteContentResponse {
  success: boolean;
  // 1000000;
  errorCode: number;
  error_code:number;
  errorMsg: string;
  result: boolean;
}
