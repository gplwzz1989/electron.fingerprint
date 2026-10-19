import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';

/**
 * 东方号账号首页数据
 * @param cookie
 */
export const getUserHomeDataAsync = async (cookie: string): Promise<DongfanghaoUserHomeDataResponse> => {
  const result = await $http.get<unknown, AxiosResponse<DongfanghaoUserHomeDataResponse>>(
    'https://rong.tt.cn/east-other/hot/dataTotal',
    {
      headers: {
        cookie: cookie,
        referer: 'https://rong.tt.cn/pageindex',
        host: 'rong.tt.cn',
      },
      params: {},
    },
  );

  // 请求失败
  if (result.data.code !== 0) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface DongfanghaoUserHomeDataResponse {
  code: number;
  data: {
    allscore: string;
    comment_pv: string;
    ysdmoney: string;
    read_pv: string;
    fans_num: string;
  };
  msg: string;
}
