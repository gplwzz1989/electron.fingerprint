import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { GetTimeStamp } from '../../utils';
import { BadRequestException } from '../../error';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 大鱼号运营数据-作品数据
 * @param cookie
 * @param start_date
 * @param end_date
 * @param proxyAgent
 */
export const getDataOverviewAsync = async (
  cookie: string,
  start_date: string,
  end_date: string,
  proxyAgent?: HttpsProxyAgent<string> | object | undefined,
): Promise<DayuhaoDataOverviewResponse> => {
  const result = await $http.get<unknown, AxiosResponse<DayuhaoDataOverviewResponse>>(
    'https://mp.dayu.com/dashboard/stat/getNewConsumptionData',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.dayu.com/dashboard/stat/product?spm=a2s0i.db_contents.menu.13.2eac3caawE1Whf',
        authority: 'mp.dayu.com',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {
        product_type: 'all',
        platform: 'uc',
        start_date: start_date,
        end_date: end_date,
        isSummary: true,
        origin: 'manual',
        _: GetTimeStamp(13),
      },
      httpsAgent: proxyAgent,
      httpAgent: proxyAgent,
    },
  );

  return result.data;
};

export interface DayuhaoDataOverviewItemResponse {
  /**
   * 日期
   */
  date: string;
  date_published: boolean;

  /**
   * 推荐
   */
  show_pv: number;

  /**
   * 阅读
   */
  read_pv: number;

  /**
   * 播放
   */
  video_vv: number;

  /**
   * 点赞
   */
  like_pv: number;

  /**
   * 评论
   */
  comment_pv: number;

  /**
   * 分享
   */
  share_pv: number;
  fav_pv: number;
  fans_read_pv: number;
  fans_video_vv: number;
  total_follow_uv: number;
  ds: number;
}

export interface DayuhaoDataOverviewResponse {
  data: Array<DayuhaoDataOverviewItemResponse>;
  error: {
    code: string;
    message: string;
  };
}

/**
 * 大鱼号粉丝报表数据
 * @param cookie
 * @param beginDate
 * @param endDate
 */
export const getDayuhaoDataOverviewFansAsync = async (
  cookie: string,
  beginDate: string,
  endDate: string,
): Promise<DayuhaoDataOverviewFansResponse> => {
  const result = await $http.get<unknown, AxiosResponse<DayuhaoDataOverviewFansResponse>>(
    'https://mp.dayu.com/api/stat/user/fans/daylist_uc_v2',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.dayu.com/dashboard/stat/users?spm=a2s0i.db_index.menu.14.15fb3caazm3Pjf',
        authority: 'mp.dayu.com',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {
        beginDate: beginDate,
        endDate: endDate,
        _: GetTimeStamp(13),
      },
    },
  );
  return result.data;
};

export interface DayuhaoDataOverviewFansResponse {
  data: {
    list: Array<{
      ds: string;
      date: string;
      /**
       * 净增粉丝
       */
      follow_increase: number;
      /**
       * 总粉丝
       */
      total_follow_uv: number;

      /**
       * 取关数
       */
      unfollow_uv: number;

      /**
       * 涨粉数
       */
      follow_uv: number;
    }>;
  };
  error: {
    code: string;
    message: string;
  };
}

/**
 * 大鱼号粉丝报表顶部统计数据
 * @param cookie
 * @param proxyAgent
 */
export const getDayuhaoDataOverviewFansStatisticAsync = async (
  cookie: string,
  proxyAgent?: HttpsProxyAgent<string> | object | undefined,
): Promise<DayuhaoDataOverviewFansStatisticResponse> => {
  const result = await $http.get<unknown, AxiosResponse<DayuhaoDataOverviewFansStatisticResponse>>(
    'https://mp.dayu.com/api/stat/user/fans/summary_uc_v2',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.dayu.com/dashboard/stat/users?spm=a2s0i.db_index.menu.14.15fb3caazm3Pjf',
        authority: 'mp.dayu.com',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {
        _: GetTimeStamp(13),
      },
      httpsAgent: proxyAgent,
      httpAgent: proxyAgent,
    },
  );

  return result.data;
};

export interface DayuhaoDataOverviewFansStatisticResponse {
  data: Array<{
    value: string;
    text: string;
  }>;
  error: {
    code: string;
    message: string;
  };
}

/**
 * 大鱼号收益数据
 * @param cookie
 */
export const getDayuhaoDataOverviewIncomeAsync = async (cookie: string): Promise<DayuhaoDataOverviewIncomeResponse> => {
  const result = await $http.get<unknown, AxiosResponse<DayuhaoDataOverviewIncomeResponse>>(
    'https://mp.dayu.com/dashboard/unifiedSettlement/getJournals',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.dayu.com/dashboard/stat/overview?spm=a2s0i.db_stat_users.menu.15.2d893caa1kO3XC',
        authority: 'mp.dayu.com',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {
        action: 1,
        _: GetTimeStamp(13),
      },
    },
  );

  // 请求失败
  if (result.data?.error?.code !== undefined) {
    throw new BadRequestException(result.data?.error?.message, result.data?.error?.code, result.data);
  }

  return result.data;
};

export interface DayuhaoDataOverviewIncomeResponse {
  data: Array<{
    id: number;
    sn: string;
    apply_date: number;
    app_id: number;
    app_user_id: string;
    user_name: string;
    inout: number;
    action: number;
    result: number;

    /**
     * 税前总收益
     */
    pretax_amount: number;
    tax_amount: number;

    /**
     * 税后总收益
     */
    aftertax_amount: number;

    /**
     * 上月结算收益
     */
    previous_balance: number;
    next_balance: number;
    memo: string;
    status: string;
    created_at: string;
  }>;

  error: {
    code: string;
    message: string;
  };
}

/**
 * 大鱼号单篇统计数据
 * @param cookie
 * @param content_id 作品id
 * @param product_type 作品类型
 * @param start_date 开始日期
 * @param end_date 结束日期
 */
export const getSingleDataOverviewStatisticAsync = async (
  cookie: string,
  content_id: string,
  product_type: string,
  start_date: string,
  end_date: string,
): Promise<DayuhaoSingleDataOverviewStatisticResponse> => {
  const result = await $http.get<unknown, AxiosResponse<DayuhaoSingleDataOverviewStatisticResponse>>(
    'https://mp.dayu.com/dashboard/stat/getNewConsumptionData',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.dayu.com/dashboard/stat/single-product',
        authority: 'mp.dayu.com',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {
        content_id: content_id,
        product_type: product_type,
        start_date: start_date,
        end_date: end_date,
        isTotal: true,
        isSummary: true,
        _: GetTimeStamp(13),
      },
    },
  );

  // 请求失败
  if (result.data?.error?.code !== undefined) {
    throw new BadRequestException(result.data?.error?.message, result.data?.error?.code, result.data);
  }

  return result.data;
};

export interface DayuhaoSingleDataOverviewStatisticResponse {
  data: Array<{
    /**
     * 日期
     */
    date: string;
    date_published: boolean;

    /**
     * 总评论数
     */
    comment_pv_all: number;

    /**
     * 总点赞数
     */
    like_pv_all: number;

    /**
     * 总分享数
     */
    share_pv_all: number;

    /**
     * 总收藏数
     */
    fav_pv_all: number;

    /**
     * 展现量
     */
    show_pv_all: number;

    /**
     * 阅读量
     */
    read_pv_all: number;

    /**
     * 文章点击率
     */
    txt_list_click_ratio: number;
    txt_list_click_ratio_over: number;

    /**
     * 平均阅读完成率
     */
    scroll_read_ratio: number;
    scroll_read_ratio_over: number;

    /**
     * 平均阅读时长
     */
    avg_read_times: number;
    avg_read_time_over: number;
    fans_show_pv_all: number;
    fans_read_pv_all: number;
    fans_txt_list_click_ratio: number;
    fans_scroll_read_ratio: number;
    fans_avg_read_times: number;
    total_follow_uv: number;
    item_follow_uv_all: number;
    item_follow_uv_ratio: number;
    item_follow_uv_ratio_over: number;
    ds: number;

    /**
     * 超过同类作品平均播放时长数据（百分比）
     */
    avg_play_time_over: number;

    /**
     * 平均播放时长
     */
    avg_play_times: number;

    /**
     * 粉丝播放时长
     */
    fans_avg_play_time: number;

    /**
     * 粉丝平均播放完成率
     */
    fans_stop_play_ratio: number;
    fans_vdo_list_click_ratio: number;
    fans_video_vv_all: number;

    /**
     * 平均播放完成率
     */
    stop_play_ratio: number;

    /**
     * 超过同类作品平均完成率
     */
    stop_play_ratio_over: number;

    /**
     * 视频点击率
     */
    vdo_list_click_ratio: number;

    /**
     * 超过同类作品视频点击率
     */
    vdo_list_click_ratio_over: number;

    /**
     * 播放数
     */
    video_vv_all: number;
  }>;

  error: {
    code: string;
    message: string;
  };
}

/**
 * 大鱼号单篇报表数据
 * @param cookie
 * @param content_id
 * @param product_type
 * @param start_date
 * @param end_date
 */
export const getSingleDataOverviewAsync = async (
  cookie: string,
  content_id: string,
  product_type: string,
  start_date: string,
  end_date: string,
): Promise<DayuhaoSingleDataOverviewResponse> => {
  const result = await $http.get<unknown, AxiosResponse<DayuhaoSingleDataOverviewResponse>>(
    'https://mp.dayu.com/dashboard/stat/getNewConsumptionData',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.dayu.com/dashboard/stat/single-product',
        authority: 'mp.dayu.com',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {
        content_id: content_id,
        product_type: product_type,
        start_date: start_date,
        end_date: end_date,
        _: GetTimeStamp(13),
      },
    },
  );

  // 请求失败
  if (result.data?.error?.code !== undefined) {
    throw new BadRequestException(result.data?.error?.message, result.data?.error?.code, result.data);
  }

  return result.data;
};

export interface DayuhaoSingleDataOverviewResponse {
  error: {
    code: string;
    message: string;
  };

  data: Array<{
    /**
     * 日期
     */
    date: string;
    date_published: boolean;

    /**
     * 展现量
     */
    show_pv: number;

    /**
     * 评论量
     */
    comment_pv: number;

    /**
     * 分享量
     */
    share_pv: number;

    /**
     * 点赞数
     */
    like_pv: number;

    /**
     * 收藏数
     */
    fav_pv: number;

    /**
     * 阅读量
     */
    read_pv: number;

    /**
     * 平均阅读时长
     */
    avg_read_times: number;

    /**
     * 阅读完成率
     */
    scroll_read_ratio: number;
    item_follow_uv: number;
    ds: number;

    /**
     * 播放量
     */
    video_vv: number;

    /**
     * 平均播放时长
     */
    avg_play_times: number;

    /**
     * 播放完成率
     */
    stop_play_ratio: number;
  }>;
}
