import { $http, HttpConfig } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { isJson } from '../../utils';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 抖音数据报表分析
 * @param cookie
 * @param option_type 数据类型 默认播放量 （1：播放量，2：主页访问，3：作品点赞，4：作品分享，5：作品评论，6：作品粉丝）
 * @param last_days_type 数据范围 默认30天 （0：昨天，1：7天，3：30天）
 */
export const getDataOverviewListAsync = async (
  cookie: string,
  option_type: 1 | 2 | 3 | 4 | 5 | 6 = 1,
  last_days_type: 0 | 1 | 3 = 3,
): Promise<DouyinDataOverviewResponse> => {
  const result = await $http.get<unknown, AxiosResponse<DouyinDataOverviewResponse>>(
    'https://creator.douyin.com/aweme/v1/creator/data/overview/option/',
    {
      retryCondition: (error, response) => {
        return !isJson(response.data);
      },
      headers: {
        cookie: cookie,
        referer: 'https://creator.douyin.com/creator-micro/data/stats/overview',
        authority: 'creator.douyin.com',
      },
      params: {
        aid: 2906,
        app_name: 'aweme_creator_platform',
        device_platform: 'web',
        user_agent: HttpConfig.userAgent,
        cookie_enabled: true,
        screen_width: 1536,
        screen_height: 864,
        browser_language: 'zh-CN',
        browser_platform: 'Win32',
        browser_name: 'Mozilla',
        browser_version:
          '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
        browser_online: true,
        timezone_name: 'Asia/Shanghai',
        option_type: option_type,
        last_days_type: last_days_type,
      },
    },
  );

  // 请求失败
  if (result.data.status_code !== 0) {
    throw new BadRequestException(result.data['status_message'], result.data?.status_code, result.data);
  }

  return result.data;
};

export interface DouyinDataOverviewResponse {
  /**
   * 每页的数量
   */
  current_count?: number;
  option_list?: Array<{
    /**
     * 数量
     */
    count: string;
    /**
     * 日期
     */
    date: string;
    /**
     * 与前一天的对比
     */
    last_day_incr_rate?: string;
  }>;
  /**
   * 数据类型
   */
  option_type?: number;
  permission_key?: string;
  status_code: number;
  status_msg: string;
}

/**
 * 抖音单篇数据
 * @param cookie
 * @param item_id 作品id
 * @param publish_time 作品发布时间
 * @param index_type 数据类型（1：播放量，2：完播率，8：平均播放是机舱，3：点赞量，4：评论量，5：分享量，9：新增粉丝量）
 */
export const getSingleDataOverviewAsync = async (
  cookie: string,
  item_id: string,
  publish_time: number,
  index_type: 1 | 2 | 3 | 4 | 5 | 8 | 9 = 1,
): Promise<DouyinSingleDataOverviewResponse> => {
  const result = await $http.get<unknown, AxiosResponse<DouyinSingleDataOverviewResponse>>(
    'https://creator.douyin.com/web/api/creator/data/item/option/',
    {
      headers: {
        cookie: cookie,
        referer: 'https://creator.douyin.com/creator-micro/data/stats/video/' + item_id + '?enter_from=item_data',
        authority: 'creator.douyin.com',
      },
      params: {
        aid: 2906,
        app_name: 'aweme_creator_platform',
        device_platform: 'web',
        user_agent: HttpConfig.userAgent,
        cookie_enabled: true,
        screen_width: 1536,
        screen_height: 864,
        browser_language: 'zh-CN',
        browser_platform: 'Win32',
        browser_name: 'Mozilla',
        browser_version:
          '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36',
        browser_online: true,
        timezone_name: 'Asia/Shanghai',
        item_id: item_id,
        index_type: index_type,
        publish_time: publish_time,
        index_data_window: 2,
        // todo 暂时不传
        // msToken: 4pDM6zS0bHZl9L6NUzPJsqigevxHo5lrXnlbtTdDulawqVWgbqyZjz1gZD5axl6sQjyviwQhEeRUd97T1xo9JFt3CUBGmZmtd6I490TuqsdSdTampTQl,
        // X-Bogus: DFSzsdVuQ6XANnrNtTJl4l9WX7nA,
        // _signature: _02B4Z6wo00001fhT8KAAAIDBeFEK4nu8.734V.QAABs-CtdsLoBxgjeCZumV8NcIU0TehtXSS8WwdC9j4QfOJ0s4a7ZQiwckORLPwMAxNMvXtm0Nc2aIn1az67mGJhsPEO3vpsjyJzL7nx8d89,
      },
    },
  );

  // 请求失败
  if (result.data.status_code !== 0) {
    throw new BadRequestException(result.data?.status_msg, result.data?.status_code, result.data);
  }

  return result.data;
};

export interface DouyinSingleDataOverviewResponse {
  trend_data: Array<{
    /**
     * 日期
     */
    key: string;

    /**
     * 对应的值
     */
    value: number;
  }>;
  status_code: number;
  status_msg: string;
}

/**
 *
 * @param cookie
 * @param days 1: 昨天，7: 7天，30: 30天
 * @param proxyAgent
 */
export const getDouYinOverViewDashboardResponse = async (
  cookie: string,
  days: number = 30,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<DouYinOverViewDashboardResponse> => {
  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/data-center/operation',
  };

  const url = `https://creator.douyin.com/janus/douyin/creator/data/overview/dashboard`;

  const postData = { recent_days: days };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface DouYinOverViewDashboardResponse {
  metrics: Array<{
    english_metric_name: string;
    /**
     * 列名称
     */
    metric_name: string;
    /**
     * 列总值
     */
    metric_value: number;
    /**
     * 日期列表值
     */
    trends: Array<{
      date_time: string;
      value: number;
    }>;
  }>;
  status_code: number;
  status_msg: string;
}
