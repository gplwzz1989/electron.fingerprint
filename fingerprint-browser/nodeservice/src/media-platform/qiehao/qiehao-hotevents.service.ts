import { $http } from '../../http';
import { isJson } from '../../utils';
import { BadRequestException } from '../../error';

/**
 * 获取热门事件列表
 * @param cookie
 * @param page 页数
 * @param limit 每页数量
 * @param keyword 搜索关键字
 */
export const getHotEventListAsync = async (
  cookie: string,
  keyword: string,
  page: number,
  limit: number,
): Promise<QiehaoHotEventsResponse> => {
  const url = 'https://om.qq.com/mother/hot-events/getList';

  const headers = {
    cookie: cookie,
    Referer: 'https://om.qq.com/main/creation/video',
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: {
      page: page,
      limit: limit,
      keyword: keyword,
      currentChannel: 0,
      relogin: 1,
    },
  });

  if (result?.data?.code) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface QiehaoHotEventsResponse {
  code?: number;
  msg?: string;
  list: Array<{
    id: number;
    event_id: string;
    name: string;
    heat: number;
    article_scope: number;
    imgurl: string;
    title: string;
    url: string;
    event_level: string;
    heat_data: {
      is_new: number;
      is_hot: number;
      is_boom: number;
    };
    article_scope_type: string;
    start_time: string;
    scarcity_icon: string;
    scarcity_desc: string;
    event_abstract: string;
  }>;
  total: number;
}
