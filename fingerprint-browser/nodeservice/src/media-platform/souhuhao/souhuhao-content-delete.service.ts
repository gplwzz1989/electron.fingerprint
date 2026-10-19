import { $http } from '@/http';

export const deleteContent = async (
  cookie: string,
  docId: string,
  accountId: string,
): Promise<SouhuhaoDeleteContentResponse> => {
  const mpcv = cookie.split('mp-cv=')[1]?.split(';')[0];

  const url = `https://mp.sohu.com/mpbp/bp/news/v4/news/${docId}/delete?accountId=${accountId}`;
  const headers = {
    cookie: cookie,
    referer: 'https://mp.sohu.com/mpfe/v4/contentManagement/first/page',
    origin: 'https://mp.sohu.com',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'sp-cm': mpcv,
  };

  const postData = `newsId=${docId}}&accountId=${accountId}`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface SouhuhaoDeleteContentResponse {
  data: null;
  //2000000;
  code: number;
  msg: string;
  success: boolean;
}
