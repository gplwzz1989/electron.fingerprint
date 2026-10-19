import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';

export const getArticleIdAsync = async (cookie: string): Promise<YidianhaoArticleIdResponse> => {
  const result = await $http.get<unknown, AxiosResponse<YidianhaoArticleIdResponse>>(
    'https://mp.yidianzixun.com/api/get-Article-id',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.yidianzixun.com/',
        authority: 'mp.yidianzixun.com',
      },
      params: {
        id: 5,
      },
    },
  );

  // 请求失败
  if (result.data?.code != 0) {
    throw new BadRequestException(result.data?.status, result.data?.code, result.data);
  }

  return result.data;
};

export interface YidianhaoArticleIdResponse {
  status: string;
  code: number;
  result: string;
}
