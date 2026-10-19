import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';

/**
 * 东方号内容分析
 * @param cookie
 * @param stdate 开始日期 （20231025）
 * @param enddate 结束日期（20231108）
 */
export const getDataOverviewAsync = async (
  cookie: string,
  stdate: string,
  enddate: string,
): Promise<DongfanghaoDataOverviewResponse> => {
  const result = await $http.get<unknown, AxiosResponse<DongfanghaoDataOverviewResponse>>(
    'https://rong.tt.cn/east-other/hot/dataTotal',
    {
      headers: {
        cookie: cookie,
        referer: 'https://rong.tt.cn/pageindex',
        host: 'rong.tt.cn',
      },
      params: {
        stdate: stdate,
        enddate: enddate,
      },
    },
  );

  // 请求失败
  if (result.data.code !== 0) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface DongfanghaoDataOverviewResponse {
  code: number;
  msg: string;
  data: {
    bydaylist: Array<{
      dt: string;
      passtotal: number;
      comment_pv: number;
      collecttotal: number;
      read_pv: number;
      userid: string;
    }>;
    collections: number;
    commentpv: number;
    contentnum: number;
    readpv: number;
  };
}
