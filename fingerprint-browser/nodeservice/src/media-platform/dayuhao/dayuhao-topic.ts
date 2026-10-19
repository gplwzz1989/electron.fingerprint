import { $http } from '../../http';
import { getNowTimeStamp } from '../../utils/use-date';

/**
 * 获取话题列表
 * @param cookie
 * @param pageNum
 */
export const getDayuhaoTopicResponse = async (cookie: string, pageNum: number): Promise<DayuhaoTopicResponse> => {
  const url = 'https://mp.dayu.com/api/v1/ws/wemedias/notices?';

  const headers = {
    Referer: 'https://mp.dayu.com/dashboard/index',
    'bx-v': '2.5.11',
    type: 'notice',
    page: pageNum,
    size: 10,
    _max_pos: '',
    is_update_status: 0,
    _: getNowTimeStamp(13),
  };

  const result = await $http.get(url, {
    headers: headers,
  });

  return result.data;
};

export interface DayuhaoTopicResponse {
  data: {
    code: number;
    msg: string;
    data: Array<DayuhaoTopicInfo>;
    metadata: {
      _size: number;
      _max_pos: number;
      _next_pos: number;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface DayuhaoTopicInfo {
  /**
   * 话题id
   */
  id: string;
  type: number;
  /**
   * 话题名称 不带#
   */
  title: string;
  published_at: string;
  expired_at: string;
  read: boolean;
  is_new_status: boolean;
  is_read: boolean;
  new_tip_expire_time: number;
  /**
   * 话题发布日期
   */
  announcement_published_at: string;
}
