import { $http } from '@/http';
import { BadRequestException } from '@/error';

export const getYidianVideoCategoryResponse = async (cookie: string): Promise<YidianhaoCategoryResponse> => {
  const url = 'https://mp.yidianzixun.com/api/video-types';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yidianzixun.com/',
  };

  const result = await $http.get(url, {
    headers: headers,
    params: {},
  });

  // 请求失败
  if (result.data?.status != 'success') {
    throw new BadRequestException('获取失败', result.data?.status, result.data);
  }

  return result.data;
};

export interface YidianhaoCategoryResponse {
  status: string; //status=success
  types: {
    [key: string]: Array<string>;
  };
}
