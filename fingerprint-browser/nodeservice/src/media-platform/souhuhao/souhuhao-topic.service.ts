import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { getTimeStamp } from '../shipinhao/shipinhao-base.service';

/**
 * 获取话题列表
 * @param cookie
 * @param accountId
 * @param keyword
 */
export const getSouhuhaoTopicAsync = async (
  cookie: string,
  accountId: number,
  keyword: string,
): Promise<SouhuhaoTopicResponse> => {
  let url: string;
  if (keyword) {
    url = 'https://mp.sohu.com/mpbp/bp/news/v4/label/topic/search';
  } else {
    url = 'https://mp.sohu.com/mpbp/bp/news/v4/label/topic/list';
  }

  const result = await $http.get<unknown, AxiosResponse<SouhuhaoTopicResponse>>(url, {
    headers: {
      cookie: cookie,
      referer: 'https://mp.sohu.com/mpfe/v4/contentManagement/news/addvideo',
      host: 'mp.sohu.com',
      'X-Requested-With': 'XMLHttpRequest',
    },
    params: {
      accountId: accountId,
      keyword: keyword,
      _: getTimeStamp(13),
    },
  });

  // 请求失败
  if (result.data.code !== 2000000) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface SouhuhaoTopicResponse {
  code: number;
  msg: string;
  success: boolean;
  data: Array<SouhuhaoTopicItem>;
}

export interface SouhuhaoTopicItem {
  /**
   * 标签id
   */
  id: string;

  /**
   * 标签名称
   */
  name: string;

  /**
   * 标签类型
   */
  type: number;

  uid?: string;
}
