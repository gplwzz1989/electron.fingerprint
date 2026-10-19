import { $http, HttpConfig } from '../../http';
import { isJson } from '../../utils';

export interface DouyinActivityCategory {
  /**
   * 分类编号id
   */
  id: number;
  /**
   * 分类名称
   */
  name: string;
}

export interface DouyinActivityCategoryResponse {
  /**
   *分类列表
   */
  query_tags: Array<DouyinActivityCategory>;
  /**
   * 状态码
   * 0 正常
   * 非0异常
   */
  status_code: number;

  /**
   * 提示消息
   */
  status_msg: string;
}

/**
 * 获取活动分类
 * @param cookie
 */
export const getActivityCategoryResponse = async (cookie: string): Promise<DouyinActivityCategoryResponse> => {
  const url = `https://creator.douyin.com/web/api/media/activity/tags/query?cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${encodeURIComponent(
    HttpConfig.userAgent,
  )}&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128`;

  const headers = {
    cookie: cookie,
    Referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface DouyinActivityListResponse {
  /**
   * 活动列表
   */
  activity_list: Array<DouyinActivityInfo>;
  /**
   * 状态码
   * 0 正常
   * 非0异常
   */
  status_code: number;

  /**
   * 提示消息
   */
  status_msg: string;
}

export interface DouyinActivityInfo {
  /**
   * 活动id
   */
  activity_id: string;
  /**
   * 活动名称
   */
  activity_name: string;
  /**
   * 活动状态
   */
  activity_status: number;
  /**
   * 活动类型
   */
  activity_type: number;

  challenge: Array<string>;
  challenge_ids: Array<number>;
  collect_id: number;
  collect_status: boolean;
  /**
   * 封面图
   */
  cover_image: string;
  /**
   * 热度
   */
  hot_score: number;
  if_well_chosen: boolean;
  jump_link: string;
  jump_type: number;
  query_tag: number;
  /**
   * 活动开始日期
   */
  show_end_time: string;
  /**
   * 活动结束日期
   */
  show_start_time: string;
}

/**
 * 获取指定分类下的活动，默认为0，表示全部/综合
 * @param cookie
 * @param categoryId
 */
export const getDouyinActivityList = async (
  cookie: string,
  categoryId: string = '0',
  pageNum: number = 1,
): Promise<DouyinActivityListResponse> => {
  const url = `https://creator.douyin.com/web/api/media/activity/get/?query_tag=${categoryId}&page=${pageNum}&size=9999&need_challenge=1&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${encodeURIComponent(
    HttpConfig.userAgent,
  )}&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128`;

  const headers = {
    cookie: cookie,
    Referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};
