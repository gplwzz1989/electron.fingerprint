import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { getTimeStamp } from '../shipinhao/shipinhao-base.service';
import { BadRequestException } from '../../error';

/**
 * 获取专栏列表
 * @param cookie
 * @param accountId
 */
export const getSouhuhaoColumnAsync = async (cookie: string, accountId: number): Promise<SouhuhaoColumnResponse> => {
  const url = 'https://mp.sohu.com/mpbp/bp/account/column/v2/list';
  const result = await $http.get<unknown, AxiosResponse<SouhuhaoColumnResponse>>(url, {
    headers: {
      cookie: cookie,
      referer: 'https://mp.sohu.com/mpfe/v4/contentManagement/news/addvideo',
      host: 'mp.sohu.com',
      'X-Requested-With': 'XMLHttpRequest',
    },
    params: {
      accountId: accountId,
      size: 100,
      page: 1,
      _: getTimeStamp(13),
    },
  });

  // 请求失败
  if (result.data.code !== 2000000) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface SouhuhaoColumnResponse {
  data: {
    total: number;
    data: Array<{
      id: number;
      name: string;
      description: string;
      cover: string;
      status: number;
      statusName: string;
      topicId: number;
      createTime: string;
      newsId: number;
      newsReadNum: number;
      newsNum: number;
      columnPv: number;
      order: number;
      topicUrl: string;
      operateType: number;
      canShowOrder: boolean;
    }>;
    totalPages: number;
  };
  code: number;
  msg: string;
  success: boolean;
}
