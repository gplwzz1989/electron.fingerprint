import { $http } from '../../http';
import { getNowTimeStamp } from '../../utils/use-date';
import { isJson } from '../../utils';

/**
 * 获取视频分类
 * @param cookie
 * @param type
 * @param channel_id
 */
export const getVideoCategoryResponse = async (
  cookie: string,
  type: 'base'|'subset' = 'base',
  channel_id: string = '',
): Promise<FengWangVideoCategoryResponse> => {
  //https://o.fun.tv/ajax/get_tag?type=base&channel_id=78&_=1755867468541
  const url = `https://o.fun.tv/ajax/get_channel?type=topic&channel_type=${type}${
    channel_id ? `&channel_id=${channel_id}` : ''
  }&_=${Date.now()}`;

  const headers = {
    cookie: cookie,
    referer: 'http://o.fun.tv',
    origin: 'http://o.fun.tv',
  };

  const params = {};
  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data) && response.status != 403;
    },
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface FengWangVideoCategoryResponse {
  /**
   * 状态码
   * 1 正常
   */
  status: number;
  /**
   * 提示消息
   */
  msg: string;
  /**
   * 分类数据列表
   */
  data: Array<FengWangVideoCategory>;
}

export interface FengWangVideoCategory {
  id: string;

  name: string;
}
