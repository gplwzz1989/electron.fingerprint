import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';

/**
 * 雪球号-数据分析报表
 * @param cookie
 * @param data_type 数据类型 默认increment_status_view_count（increment_status_view_count：播放量，increment_status_reply_count：评论量，increment_status_retweet_count：转发量，increment_status_like_count：点赞量，increment_status_fav_count：收藏量）
 */
export const getDataOverviewAsync = async (
  cookie: string,
  data_type:
    | 'increment_status_view_count'
    | 'increment_status_reply_count'
    | 'increment_status_retweet_count'
    | 'increment_status_like_count'
    | 'increment_status_fav_count' = 'increment_status_view_count',
): Promise<XueqiuhaoDataOverviewResponse> => {
  const url: string = 'https://mp.xueqiu.com/xq/analysis/creator/data_center/analysis_overview.json';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.xueqiu.com/dataview',
    authority: 'mp.xueqiu.com',
    origin: 'https://mp.xueqiu.com',
  };

  const postData = {
    type: 90,
    data_type: data_type,
  };

  const result = await $http.post<never, AxiosResponse<XueqiuhaoDataOverviewResponse>>(url, postData, {
    headers: headers,
  });

  // 请求失败
  if (result.data?.code != 0) {
    throw new BadRequestException(result.data?.error_description, result.data?.error_code, result.data);
  }

  return result.data;
};

/**
 * 雪球号-数据分析核心数据
 * @param cookie
 * @param type 数据范围 默认90（1：昨天，7：7天，30：30天，90：累计）
 */
export const getDataOverviewCoreDataAsync = async (
  cookie: string,
  type: 1 | 7 | 30 | 90 = 90,
): Promise<XueqiuhaoDataOverviewCoreDataResponse> => {
  const url: string = 'https://mp.xueqiu.com/xq/analysis/creator/data_center/query_overview.json';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.xueqiu.com/dataview',
    authority: 'mp.xueqiu.com',
    origin: 'https://mp.xueqiu.com',
  };

  const postData = {
    type: type,
  };

  const result = await $http.post<never, AxiosResponse<XueqiuhaoDataOverviewCoreDataResponse>>(url, postData, {
    headers: headers,
  });

  // 请求失败
  if (result.data?.code != 0) {
    throw new BadRequestException(result.data?.error_description, result.data?.error_code, result.data);
  }

  return result.data;
};

export interface XueqiuhaoDataOverviewResponse {
  code: number;
  message: string;
  data: Array<{
    value: number;
    created_at: string;
    incr_value: number;
  }>;
  error_description: string;
  error_uri: string;
  error_code: string;
}

export interface XueqiuhaoDataOverviewCoreDataResponse {
  code: number;
  message: string;
  data: {
    increment_status_view_count: number;
    increment_status_reply_count: number;
    increment_status_retweet_count: number;
    increment_status_like_count: number;
    user_id: number;
    view_count: number;
    reply_count: number;
    retweet_count: number;
    like_count: number;
    fav_count: number;
    increment_status_fav_count: number;
    created_at: number;
    vod_count: number;
    incr_vod_count: number;
    vod_reply_count: number;
    incr_vod_reply_count: number;
    vod_retweet_count: number;
    incr_vod_retweet_count: number;
    vod_like_count: number;
    incr_vod_like_count: number;
    vod_fav_count: number;
    incr_vod_fav_count: number;
  };
  error_description: string;
  error_uri: string;
  error_code: string;
}
