import { $http, HttpConfig } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { isJson } from '../../utils';
import { getSign } from './xiaohongshu-sign';
import { HttpsProxyAgent } from 'https-proxy-agent';
/**
 * 小红书笔记数据分析
 * @param cookie
 */
export const getDataOverviewNewAsync = async (cookie: string): Promise<XiaohongshuDataOverviewNewResponse> => {
  const result = await $http.get<unknown, AxiosResponse<XiaohongshuDataOverviewNewResponse>>(
    'https://creator.xiaohongshu.com/api/galaxy/creator/data/note_detail_new',
    {
      retryCondition: (error, response) => {
        return !isJson(response.data);
      },
      headers: {
        cookie: cookie,
        referer: 'https://creator.xiaohongshu.com/creator/notes',
        authority: 'creator.xiaohongshu.com',
      },
      params: {},
    },
  );

  return result.data;
};

/**
 * 小红书概览数据
 * @param cookie
 * @param proxyAgent
 */
export const getDataCenterOverviewNewAsync = async (
  cookie: string,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<XiaohongshuDataOverviewNewResponse> => {
  //签名
  const baseurl = '/api/galaxy/v2/creator/datacenter/account/base';
  const sign = getSign(baseurl, '');

  const headers = {
    cookie: cookie,
    referer: 'https://creator.xiaohongshu.com/statistics/account/v2',
    authority: 'creator.xiaohongshu.com',
  };

  headers['X-s'] = sign['X-s'];
  headers['X-t'] = sign['X-t'];
  const result = await $http.get<unknown, AxiosResponse<XiaohongshuDataOverviewNewResponse>>(
    'https://creator.xiaohongshu.com/api/galaxy/v2/creator/datacenter/account/base',
    {
      retryCondition: (error, response) => {
        return !isJson(response.data);
      },
      headers: headers,
      params: {},
      httpsAgent: proxyAgent,
      httpAgent: proxyAgent,
    },
  );

  return result.data;
};

/**
 * 小红书账号30天概览数据
 * @param cookie
 * @param proxyAgent
 */
export const getAccountDataCenterOverviewAsync = async (
  cookie: string,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<XiaohongshuAccountDataCenterOverviewResponse> => {
  //签名
  const baseurl = '/api/galaxy/v2/creator/datacenter/account/base';
  const sign = getSign(baseurl, '');

  const headers = {
    cookie: cookie,
    referer: 'https://creator.xiaohongshu.com/statistics/account/v2',
    authority: 'creator.xiaohongshu.com',
  };

  headers['X-s'] = sign['X-s'];
  headers['X-t'] = sign['X-t'];
  const result = await $http.get<unknown, AxiosResponse<XiaohongshuAccountDataCenterOverviewResponse>>(
    'https://creator.xiaohongshu.com/api/galaxy/v2/creator/datacenter/account/base',
    {
      retryCondition: (error, response) => {
        return !isJson(response.data);
      },
      headers: headers,
      params: {},
      httpsAgent: proxyAgent,
      httpAgent: proxyAgent,
    },
  );

  return result.data;
};

/**
 * 小红书笔记单篇数据
 * @param cookie
 * @param page 页码
 * @param page_size 每页数量（12，24，36，48）
 */
export const getDataOverviewSingleListAsync = async (
  cookie: string,
  page: number,
  page_size: 12 | 24 | 36 | 48 = 12,
): Promise<XiaohongshuDataOverviewSingleListResponse> => {
  const result = await $http.get<unknown, AxiosResponse<XiaohongshuDataOverviewSingleListResponse>>(
    'https://creator.xiaohongshu.com/api/galaxy/creator/data/note_stats/new',
    {
      retryCondition: (error, response) => {
        return !isJson(response.data);
      },
      headers: {
        cookie: cookie,
        referer: 'https://creator.xiaohongshu.com/creator/notes',
        authority: 'creator.xiaohongshu.com',
        'User-Agent': HttpConfig.userAgent,
      },
      params: {
        page: page,
        page_size: page_size,
        time: 7,
        sort_by: 'time',
        note_type: 0,
        is_recent: true,
      },
    },
  );

  // 请求失败
  if (result.data.result !== 0) {
    throw new BadRequestException(result.data?.msg, result.data?.result, result.data);
  }

  return result.data;
};

export interface XiaohongshuDataOverviewNewItem {
  /**
   * 7天数据分析
   */
  seven: {
    /**
     * 7天浏览数
     */
    view_count: number;

    /**
     * 7天观看总时长
     */
    view_time_avg: number;

    /**
     * 7天首页浏览数
     */
    home_view_count: number;

    /**
     * 7天点赞数
     */
    like_count: number;

    /**
     * 7天收藏数
     */
    collect_count: number;

    /**
     * 7天评论数
     */
    comment_count: number;

    /**
     * 7天弹幕数
     */
    danmaku_count: number;

    /**
     * 7天分享量
     */
    share_count: number;

    /**
     * 7天涨粉数
     */
    rise_fans_count: number;

    /**
     * 7天浏览列表截止当天总数据
     */
    view_list: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;

    /**
     * 7天观看时长列表截止当天总数据
     */
    view_time_list: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;

    /**
     * 7天首页浏览列表截止当天总数据
     */
    home_view_list: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;

    /**
     * 7天点赞列表截止当天总数据
     */
    like_list: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;

    /**
     * 7天收藏列表截止当天总数据
     */
    collect_list: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;

    /**
     * 7天评论列表截止当天总数据
     */
    comment_list: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;

    /**
     * 7天弹幕列表截止当天总数据
     */
    danmaku_list: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;

    /**
     * 7天分享列表截止当天总数据
     */
    share_list: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;

    /**
     * 7天新增粉丝列表截止当天总数据
     */
    rise_fans_list: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;
    view_count_rate: number;
    view_time_avg_rate: number;
    home_view_count_rate: number;
    like_count_rate: number;
    collect_count_rate: number;
    comment_count_rate: number;
    danmaku_count_rate: number;
    share_count_rate: number;
    rise_fans_count_rate: number;
    summary: string;
    view_list_size: number;

    /**
     * 7天浏览列表每天增量数据
     */
    view_list_iterator: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;
    set_view_list: boolean;
    view_time_list_size: number;

    /**
     * 7天观看时长每天增量数据
     */
    view_time_list_iterator: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;
    set_view_time_list: boolean;
    collect_list_size: number;

    /**
     * 7天收藏每天增量数据
     */
    collect_list_iterator: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;
    set_collect_list: boolean;
    rise_fans_list_size: number;

    /**
     * 7天新增粉丝每天增量数据
     */
    rise_fans_list_iterator: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;
    set_rise_fans_list: boolean;
    set_collect_count_rate: boolean;
    set_home_view_count: boolean;
    home_view_list_size: number;

    /**
     * 7天首页浏览每天增量数据
     */
    home_view_list_iterator: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;
    set_home_view_list: boolean;
    set_view_count_rate: boolean;
    set_view_time_avg_rate: boolean;
    set_home_view_count_rate: boolean;
    set_like_count_rate: boolean;
    set_comment_count_rate: boolean;
    set_danmaku_count_rate: boolean;
    set_share_count_rate: boolean;
    set_rise_fans_count_rate: boolean;
    set_summary: boolean;
    comment_list_size: number;

    /**
     * 7天评论每天增量数据
     */
    comment_list_iterator: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;
    set_comment_list: boolean;
    set_like_count: boolean;
    set_view_count: boolean;
    set_view_time_avg: boolean;
    set_collect_count: boolean;
    set_comment_count: boolean;
    set_danmaku_count: boolean;
    set_share_count: boolean;
    danmaku_list_size: number;

    /**
     * 7天弹幕每天增量数据
     */
    danmaku_list_iterator: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;
    set_danmaku_list: boolean;
    set_rise_fans_count: boolean;
    like_list_size: number;

    /**
     * 7天点赞每天增量数据
     */
    like_list_iterator: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;
    set_like_list: boolean;
    share_list_size: number;

    /**
     * 7天分享每天增量数据
     */
    share_list_iterator: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;
    set_share_list: boolean;
  };

  /**
   * 30天数据分析
   */
  thirty: {
    /**
     * 30天浏览数
     */
    view_count: number;

    /**
     * 30天观看总时长
     */
    view_time_avg: number;

    /**
     * 30天首页浏览数
     */
    home_view_count: number;

    /**
     * 30天点赞数
     */
    like_count: number;

    /**
     * 30天收藏数
     */
    collect_count: number;

    /**
     * 30天评论数
     */
    comment_count: number;

    /**
     * 30天弹幕数
     */
    danmaku_count: number;

    /**
     * 30天分享量
     */
    share_count: number;

    /**
     * 30天涨粉数
     */
    rise_fans_count: number;

    /**
     * 30天浏览列表每天总数据
     */
    view_list: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;

    /**
     * 30天观看时长每天总数据
     */
    view_time_list: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;

    /**
     * 30天首页浏览每天总数据
     */
    home_view_list: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;

    /**
     * 30天点赞每天总数据
     */
    like_list: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;

    /**
     * 30天收藏每天总数据
     */
    collect_list: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;

    /**
     * 30天评论每天总数据
     */
    comment_list: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;

    /**
     * 30天弹幕每天总数居
     */
    danmaku_list: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;
    /**
     * 笔记涨粉
     */
    rise_fans_list: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;
    /**
     * 30天分享每天总数据
     */
    share_list: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;
    view_count_rate: number;
    view_time_avg_rate: number;
    home_view_count_rate: number;
    like_count_rate: number;
    collect_count_rate: number;
    comment_count_rate: number;
    danmaku_count_rate: number;
    share_count_rate: number;
    rise_fans_count_rate: number;
    summary: string;
    view_list_size: number;

    /**
     * 30天浏览每天增量数据
     */
    view_list_iterator: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;
    set_view_list: boolean;
    view_time_list_size: number;

    /**
     * 30天观看每天增量数据
     */
    view_time_list_iterator: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;
    set_view_time_list: boolean;
    collect_list_size: number;

    /**
     * 30天收藏每天增量数据
     */
    collect_list_iterator: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;
    set_collect_list: boolean;
    rise_fans_list_size: number;

    /**
     * 30天涨粉每天新增数据
     */
    rise_fans_list_iterator: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;
    set_rise_fans_list: boolean;
    set_collect_count_rate: boolean;
    set_home_view_count: boolean;
    home_view_list_size: number;

    /**
     * 30天首页浏览每天增量数据
     */
    home_view_list_iterator: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;
    set_home_view_list: boolean;
    set_view_count_rate: boolean;
    set_view_time_avg_rate: boolean;
    set_home_view_count_rate: boolean;
    set_like_count_rate: boolean;
    set_comment_count_rate: boolean;
    set_danmaku_count_rate: boolean;
    set_share_count_rate: boolean;
    set_rise_fans_count_rate: boolean;
    set_summary: boolean;
    comment_list_size: number;

    /**
     * 30天评论每天增量数据
     */
    comment_list_iterator: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;
    set_comment_list: boolean;
    set_like_count: boolean;
    set_view_count: boolean;
    set_view_time_avg: boolean;
    set_collect_count: boolean;
    set_comment_count: boolean;
    set_danmaku_count: boolean;
    set_share_count: boolean;
    danmaku_list_size: number;

    /**
     * 30天弹幕每天增量数据
     */
    danmaku_list_iterator: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;
    set_danmaku_list: boolean;
    set_rise_fans_count: boolean;
    like_list_size: number;

    /**
     * 30天点赞每天增量数据
     */
    like_list_iterator: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;
    set_like_list: boolean;
    share_list_size: number;

    /**
     * 30天分享每天增量数据
     */
    share_list_iterator: Array<{
      /**
       * 日期
       */
      date: number;
      /**
       * 对应数据数量
       */
      count: number;
      set_count: boolean;
      set_date: boolean;
    }>;
    set_share_list: boolean;
  };
  result: {
    success: boolean;
    code: number;
    set_message: boolean;
    set_success: boolean;
    set_code: boolean;
  };
  analyse_infos: Array<{
    quota: string;
    count: number;
    scale: number;
    summary: string;
    priority: number;
    special_display: string;
    set_special_display: boolean;
    set_count: boolean;
    set_summary: boolean;
    set_priority: boolean;
    set_quota: boolean;
    set_scale: boolean;
  }>;
  set_seven: boolean;
  set_thirty: boolean;
  analyse_infos_size: number;
  analyse_infos_iterator: Array<{
    quota: string;
    count: number;
    scale: number;
    summary: string;
    priority: number;
    special_display: string;
    set_special_display: boolean;
    set_count: boolean;
    set_summary: boolean;
    set_priority: boolean;
    set_quota: boolean;
    set_scale: boolean;
  }>;
  set_analyse_infos: boolean;
  set_result: boolean;
}

export interface XiaohongshuDataOverviewNewResponse {
  result: number;
  code?: number;
  success: boolean;
  msg: string;
  data: XiaohongshuDataOverviewNewItem;
}

export interface XiaohongshuSingleDataOverview {
  /**
   * 评论数
   */
  comment: number;
  /**
   * 封面
   */
  cover_url: string;

  /**
   * 弹幕数量
   */
  danmaku_count: number;
  engage: number;

  /**
   * 收藏数
   */
  fav: number;

  /**
   * 涨粉数
   */
  follow: number;
  high_self: number;

  /**
   * 作品id
   */
  id: string;

  /**
   * 点赞数
   */
  like: number;

  /**
   * 链接
   */
  link: string;
  permission_code: number;

  /**
   * 发布时间
   */
  post_time: number;
  post_timing: boolean;
  promo_view: number;

  /**
   * 观看量
   */
  read: number;

  /**
   * 评论列表
   */
  comment_list: Array<{
    total_num: number;
    normal_num: number;
    video_num: number;
    date: string;
  }>;

  /**
   * 弹幕列表
   */
  danmaku_count_list: Array<{
    total_num: number;
    normal_num: number;
    video_num: number;
    date: string;
  }>;

  /**
   * 收藏列表
   */
  fav_list: Array<{
    total_num: number;
    normal_num: number;
    video_num: number;
    date: string;
  }>;

  /**
   * 关注列表
   */
  follow_list: Array<{
    total_num: number;
    normal_num: number;
    video_num: number;
    date: string;
  }>;

  /**
   * 点赞列表
   */
  like_list: Array<{
    total_num: number;
    normal_num: number;
    video_num: number;
    date: string;
  }>;

  /**
   * 阅读列表
   */
  read_lst: Array<{
    total_num: number;
    normal_num: number;
    video_num: number;
    date: string;
  }>;

  /**
   * 分享列表
   */
  share_list: Array<{
    total_num: number;
    normal_num: number;
    video_num: number;
    date: string;
  }>;

  /**
   * 平均观看时长列表
   */
  view_time_avg_list: Array<{
    total_num: number;
    normal_num: number;
    video_num: number;
    date: string;
  }>;
  schedule_post_time: number;

  /**
   * 分享数
   */
  share: number;

  /**
   * 标题
   */
  title: string;

  /**
   * 作品类型
   */
  type: string;
  video_task_push: number;
  video_view: number;

  /**
   * 人均观看时长
   */
  view_time_avg: number;
}

export interface XiaohongshuDataOverviewSingleListResponse {
  data?: {
    note_info: Array<XiaohongshuSingleDataOverview>;
    total: number;
  };
  result: number;
  success: boolean;
  msg?: string;
}

/**
 * 小红书账号30天概览数据响应
 */
export interface XiaohongshuAccountDataCenterOverviewResponse {
  code: number;
  success: boolean;
  msg: string;
  data: {
    /**
     * 7天数据
     */
    seven: XiaohongshuAccountPeriodData;
    /**
     * 30天数据
     */
    thirty: XiaohongshuAccountPeriodData;
  };
}

/**
 * 小红书账号周期数据
 */
export interface XiaohongshuAccountPeriodData {
  /**
   * 曝光数 (impl_count)
   */
  impl_count: number;
  /**
   * 曝光数列表
   */
  impl_count_list: Array<{ date: number; count: number; count_with_double: number }>;

  /**
   * 观看数 (view_count)
   */
  view_count: number;
  /**
   * 观看数列表
   */
  view_list: Array<{ date: number; count: number; count_with_double: number }>;

  /**
   * 封面点击率 (cover_click_rate)
   */
  cover_click_rate: number;
  /**
   * 封面点击率列表
   */
  cover_click_rate_list: Array<{ date: number; count: number; count_with_double: number }>;

  /**
   * 平均观看时长(秒) (avg_view_time)
   */
  avg_view_time: number;
  /**
   * 平均观看时长列表
   */
  avg_view_time_list: Array<{ date: number; count: number; count_with_double: number }>;

  /**
   * 观看总时长(秒) (view_time_avg)
   */
  view_time_avg: number;
  /**
   * 观看总时长列表
   */
  view_time_list: Array<{ date: number; count: number; count_with_double: number }>;

  /**
   * 视频完播率 (video_full_view_rate)
   */
  video_full_view_rate: number;
  /**
   * 视频完播率列表
   */
  video_full_view_rate_list: Array<{ date: number; count: number; count_with_double: number }>;

  /**
   * 点赞数 (like_count)
   */
  like_count: number;
  /**
   * 点赞数列表
   */
  like_list: Array<{ date: number; count: number; count_with_double: number }>;

  /**
   * 评论数 (comment_count)
   */
  comment_count: number;
  /**
   * 评论数列表
   */
  comment_list: Array<{ date: number; count: number; count_with_double: number }>;

  /**
   * 收藏数 (collect_count)
   */
  collect_count: number;
  /**
   * 收藏数列表
   */
  collect_list: Array<{ date: number; count: number; count_with_double: number }>;

  /**
   * 分享数 (share_count)
   */
  share_count: number;
  /**
   * 分享数列表
   */
  share_list: Array<{ date: number; count: number; count_with_double: number }>;

  /**
   * 净增关注/净涨粉 (net_rise_fans_count)
   */
  net_rise_fans_count: number;
  /**
   * 净增关注列表
   */
  net_rise_fans_count_list: Array<{ date: number; count: number; count_with_double: number }>;

  /**
   * 新增关注 (rise_fans_count)
   */
  rise_fans_count: number;
  /**
   * 新增关注列表
   */
  rise_fans_list: Array<{ date: number; count: number; count_with_double: number }>;

  /**
   * 取消关注 (loss_fans_count)
   */
  loss_fans_count: number;
  /**
   * 取消关注列表
   */
  loss_fans_count_list: Array<{ date: number; count: number; count_with_double: number }>;

  /**
   * 主页访客 (home_view_count)
   */
  home_view_count: number;
  /**
   * 主页访客列表
   */
  home_view_list: Array<{ date: number; count: number; count_with_double: number }>;

  /**
   * 主页转粉率 (home_conversion_rise_fans_rate)
   */
  home_conversion_rise_fans_rate: number;
  /**
   * 主页转粉率列表
   */
  home_conversion_rise_fans_rate_list: Array<{ date: number; count: number; count_with_double: number }>;

  /**
   * 开始时间
   */
  begin_time: number;
  /**
   * 结束时间
   */
  end_time: number;

  /**
   * 摘要
   */
  summary?: string;
}
