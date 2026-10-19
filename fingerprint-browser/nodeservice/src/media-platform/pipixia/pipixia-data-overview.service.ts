import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';

/**
 * 皮皮虾数据分析-视频投稿
 * @param cookie
 * @param start_stat_time 开始日期（××××-××-××）
 * @param end_stat_time 结束日期（××××-××-××）
 */
export const getDataOverviewAsync = async (
  cookie: string,
  start_stat_time: string,
  end_stat_time: string,
): Promise<PipixiaDataOverviewResponse> => {
  const result = await $http.get<unknown, AxiosResponse<PipixiaDataOverviewResponse>>(
    'https://mp.pipix.com/api/mp/bds/webapi/media_type_stat/',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.pipix.com/mp/analyse',
        authority: 'mp.pipix.com',
      },
      params: {
        start_stat_time: start_stat_time,
        end_stat_time: end_stat_time,
        media_type: 3,
      },
    },
  );

  // 请求失败
  if (result.data.status_code !== 0) {
    throw new BadRequestException(result.data?.message, result.data?.status_code, result.data);
  }

  return result.data;
};

/**
 * 皮皮虾数据分析-粉丝数据
 * @param cookie
 * @param start_stat_time 开始日期（××××-××-××）
 * @param end_stat_time 结束日期（××××-××-××）
 */
export const getDataOverviewFansAsync = async (
  cookie: string,
  start_stat_time: string,
  end_stat_time: string,
): Promise<PipixiaDataOverviewFansResponse> => {
  const result = await $http.get<unknown, AxiosResponse<PipixiaDataOverviewFansResponse>>(
    'https://mp.pipix.com/api/mp/bds/webapi/fans_stat/',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.pipix.com/mp/analyse',
        authority: 'mp.pipix.com',
      },
      params: {
        start_stat_time: start_stat_time,
        end_stat_time: end_stat_time,
      },
    },
  );

  // 请求失败
  if (result.data.status_code !== 0) {
    throw new BadRequestException(result.data?.message, result.data?.status_code, result.data);
  }

  return result.data;
};

/**
 * 皮皮虾数据分析-整体数据
 * @param cookie
 * @param user_id 用户id
 */
export const getCoreDataAsync = async (cookie: string, user_id: string): Promise<PipixiaCoreDataResponse> => {
  const result = await $http.get<unknown, AxiosResponse<PipixiaCoreDataResponse>>(
    'https://mp.pipix.com/api/mp/bds/webapi/overall_stats/',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.pipix.com/mp/analyse',
        authority: 'mp.pipix.com',
      },
      params: {
        need_check_data_ready: false,
        user_id: user_id,
      },
    },
  );

  // 请求失败
  if (result.data.status_code !== 0) {
    throw new BadRequestException(result.data?.message, result.data?.status_code, result.data);
  }

  return result.data;
};

export interface PipixiaDataOverviewFansItemResponse {
  /**
   * 用户id
   */
  user_id: string;

  /**
   * 日期
   */
  stat_time: string;

  /**
   * 总粉丝
   */
  total_fans: string;

  /**
   * 新增关注
   */
  new_fans: string;

  /**
   * 取消关注
   */
  lost_fans: string;
}

export interface PipixiaDataOverviewFansResponse {
  status_code: number;
  message: string;
  prompt: string;
  time: number;
  data: {
    fans_stat: Array<PipixiaDataOverviewFansItemResponse>;
  };
}

export interface PipixiaCoreDataResponse {
  status_code: number;
  message: string;
  prompt: string;
  time: number;
  data: {
    overall_stat: {
      user_id: string;
      stat_time: string;
      total_fans: string;
      new_fans: string;
      lost_fans: string;
      total_play_count: string;
      play_count: string;
      total_comment_count: string;
      comment_count: string;
      total_item_count: string;
      item_count: string;
      total_digg_count: string;
      digg_count: string;
    };
    stat_date: string;
  };
}

export interface PipixiaOverviewItemResponse {
  media_type: number;

  /**
   * 播放数
   */
  play_count: string;

  /**
   * 评论数
   */
  comment_count: string;

  /**
   * 作品数
   */
  item_count: string;

  /**
   * 点赞数
   */
  digg_count: string;

  /**
   * 日期
   */
  stat_time: string;

  /**
   * 收藏数
   */
  favorite_count: string;
}

export interface PipixiaDataOverviewResponse {
  status_code: number;
  message: string;
  prompt: string;
  time: number;
  data: {
    media_type_stat: Array<PipixiaOverviewItemResponse>;
  };
}
