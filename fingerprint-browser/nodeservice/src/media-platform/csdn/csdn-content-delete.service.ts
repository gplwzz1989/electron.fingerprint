import { $http } from '@/http';
import { Guid } from '@/utils';
import { getCsdnSign } from '@/media-platform/csdn/csdn-base.service';

export const deleteCSDNArticleResponse = async (
  cookie: string,
  docId: string,
  deep: boolean = false,
): Promise<CSDNDetailResponse> => {
  const url = `https://bizapi.csdn.net/blog/phoenix/console/v1/article/del`;

  const xNonce = Guid.NewGuid();

  const headers = {
    cookie: cookie,
    referer: 'https://mp.csdn.net/',
    origin: 'https://mp.csdn.net',
    Accept: 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'Accept-Encoding': 'gzip, deflate, br',
    'X-Ca-Key': '203803574',
    'X-Ca-Nonce': xNonce,
    'X-Ca-Signature': '',
    'X-Ca-Signature-Headers': 'x-ca-key,x-ca-nonce',
  };

  headers['X-Ca-Signature'] = await getCsdnSign(
    'POST',
    url,
    'application/json, text/plain, */*',
    '',
    headers['Content-Type'] ?? '',
    {},
    {
      'X-Ca-Key': '203803574',
      'X-Ca-Nonce': xNonce,
      'Content-Type': headers['Content-Type'],
      common: { Accept: headers.Accept },
      delete: {},
      get: {},
      head: {},
      post: { 'Content-Type': 'application/json;charset=UTF-8' },
      put: { 'Content-Type': 'application/x-www-form-urlencoded' },
      patch: { 'Content-Type': 'application/x-www-form-urlencoded' },
    },
  );

  const postData = { articleId: docId, deep: deep };

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

export interface CSDNDetailResponse {
  code: number;
  message: string;
  traceId: string;
  data: boolean;
}
