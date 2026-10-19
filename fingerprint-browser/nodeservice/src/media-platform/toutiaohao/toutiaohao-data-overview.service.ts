import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 头条号粉丝分析
 * @param cookie
 * @param start_date 开始日期
 * @param end_date 结束日期
 */
export const getDataOverviewFansAsync = async (
  cookie: string,
  start_date: string,
  end_date: string,
): Promise<ToutiaohaoDataOverviewFansResponse> => {
  const result = await $http.get<unknown, AxiosResponse<ToutiaohaoDataOverviewFansResponse>>(
    'https://mp.toutiao.com/mp/agw/statistic/v2/fans/trends',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.toutiao.com/profile_v4/analysis/fans/overview',
        authority: 'mp.toutiao.com',
      },
      params: {
        from: start_date,
        to: end_date,
        type: 0,
      },
    },
  );

  return result.data;
};

/**
 * 头条号作品数据流量分析
 * @param cookie
 * @param start_date 开始日期
 * @param end_date 结束日期
 * @param proxyAgent
 */
export const getDataOverviewAsync = async (
  cookie: string,
  start_date: string,
  end_date: string,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<ToutiaohaoDataOverviewResponse> => {
  const result = await $http.get<unknown, AxiosResponse<ToutiaohaoDataOverviewResponse>>(
    'https://mp.toutiao.com/mp/agw/statistic/v2/content/stat_trends',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.toutiao.com/profile_v4/analysis/works-overall/all',
        authority: 'mp.toutiao.com',
      },
      params: {
        from: start_date,
        to: end_date,
        type: 0,
      },
      httpAgent: proxyAgent,
      httpsAgent: proxyAgent,
    },
  );

  // 请求失败
  if (result.data.code !== 0) {
    throw new BadRequestException(result.data?.message, result.data?.code, result.data);
  }

  return result.data;
};

export interface ToutiaohaoFansDailyResponse {
  date: string;
  fans_stat: {
    /**
     * 活跃粉丝数
     */
    active_fans_count: number;
    active_fans_rate: number;

    /**
     * 粉丝变化数
     */
    change_count: number;

    /**
     * 掉粉数
     */
    decrease_count: number;

    /**
     * 涨粉数
     */
    increase_count: number;

    /**
     * 总粉丝数
     */
    total_fans_count: number;
  };
}

export interface ToutiaohaoDataOverviewFansResponse {
  code: number;
  daily_fans_stats: Array<ToutiaohaoFansDailyResponse>;
  message: string;
}

export interface ToutiaohaoDataOverviewDailyResponse {
  author_stat: {
    consume_data: {
      /**
       * 粉丝播放量
       */
      fans_go_detail_count: number;
      fans_go_detail_count_new: number;

      /**
       * 粉丝展现量
       */
      fans_impression_count: number;
      fans_impression_count_new: number;
      fans_play_count: number;
      fans_play_count_new: number;

      /**
       * 播放量（阅读量）
       */
      go_detail_count: number;
      go_detail_count_new: number;

      /**
       * 展现量
       */
      impression_count: number;
      impression_count_new: number;
      play_count: number;
      play_count_new: number;
    };
    fans_change_count: number;
    interaction_data: {
      /**
       * 评论数
       */
      comment_count: number;

      /**
       * 点赞数
       */
      digg_count: number;
    };
  };

  /**
   * 日期
   */
  date: string;
}

export interface ToutiaohaoDataOverviewResponse {
  code: number;
  daily_stat_datas: Array<ToutiaohaoDataOverviewDailyResponse>;
  message: string;
  total_stat: {
    consume_data: {
      fans_go_detail_count: number;
      fans_go_detail_count_new: number;
      fans_impression_count: number;
      fans_impression_count_new: number;
      fans_play_count: number;
      fans_play_count_new: number;
      go_detail_count: number;
      go_detail_count_new: number;
      impression_count: number;
      impression_count_new: number;
      play_count: number;
      play_count_new: number;
      quality_support_impression_count: number;
      quality_support_read_count: number;
    };
    fans_change_count: number;
    interaction_data: {
      comment_count: number;
      digg_count: number;
    };
  };
}

/**
 * 头条号单篇统计数据
 * @param cookie
 * @param item_id
 * @param type 数据类型（1：文章，2：视频，3：微头条，5：小视频）
 */
export const getSingleDataOverviewStatisticAsync = async (
  cookie: string,
  item_id: string,
  type: 1 | 2 | 3 | 5,
): Promise<ToutiaohaoSingleDataOverviewStatisticResponse> => {
  const result = await $http.get<unknown, AxiosResponse<ToutiaohaoSingleDataOverviewStatisticResponse>>(
    'https://mp.toutiao.com/mp/agw/statistic/v2/item/info',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.toutiao.com/profile_v4/manage/content/all',
        authority: 'mp.toutiao.com',
      },
      params: {
        item_id: item_id,
        type: type,
        app_id: 1231,
      },
    },
  );

  // 请求失败
  if (result.data.code !== 0) {
    throw new BadRequestException(result.data?.message, result.data?.code, result.data);
  }

  return result.data;
};

export interface ToutiaohaoSingleDataOverviewStatisticResponse {
  code: 0;
  item_data: {
    /**
     * 标题
     */
    title: string;

    /**
     * 封面
     */
    cover_url: string;

    /**
     * 发布时间
     */
    create_time: number;

    /**
     * 时长
     */
    duration: number;
    genre_type: number;

    /**
     * 作品id
     */
    item_id: string;
    item_stat: {
      consume_data: {
        /**
         * 粉丝阅读量
         */
        fans_go_detail_count: number;
        fans_go_detail_count_new: number;
        /**
         * 粉丝展现量
         */
        fans_impression_count: number;
        fans_impression_count_new: number;

        /**
         * 粉丝播放量
         */
        fans_play_count: number;
        fans_play_count_new: number;

        /**
         * 阅读量
         */
        go_detail_count: number;
        go_detail_count_new: number;

        /**
         * 展现量
         */
        impression_count: number;
        impression_count_new: number;

        /**
         * 播放量
         */
        play_count: number;
        play_count_new: number;
      };
      consume_detail: {
        /**
         * 点击率
         */
        click_rate: number;

        /**
         * 平均播放完成率
         */
        read_complete_rate: number;

        /**
         * 播放时长
         */
        read_duration: number;
      };
      fans_change_count: number;
      fans_data: {
        /**
         * 粉丝变化
         */
        change_count: number;

        /**
         * 掉粉
         */
        decrease_count: number;

        /**
         * 涨粉
         */
        increase_count: number;

        /**
         * 播放转粉率
         */
        to_fans_rate: number;
      };
      fans_data_v2: {
        /**
         * 粉丝变化
         */
        change_count: number;

        /**
         * 掉粉
         */
        decrease_count: number;

        /**
         * 涨粉
         */
        increase_count: number;

        /**
         * 播放转粉率
         */
        to_fans_rate: number;
      };
      income_data: {
        basic_income: number;
        subsidy_income: number;
        /**
         * 收益
         */
        total_income: number;
      };
      interaction_data: {
        /**
         * 评论数
         */
        comment_count: number;

        /**
         * 点赞数
         */
        digg_count: number;

        /**
         * 收藏数
         */
        forward_count: number;

        /**
         * 转发数
         */
        repin_count: number;

        /**
         * 收藏数
         */
        share_count: number;
      };
    };
  };
  message: string;
}

/**
 * 头条号单篇报表数据
 * @param cookie
 * @param item_id 作品id
 * @param start_date 开始日期
 * @param end_date 结束日期
 * @param type 数据类型（1：文章，2：视频，3：微头条，5：小视频）
 */
export const getSingleDataOverview = async (
  cookie: string,
  item_id: string,
  start_date: string,
  end_date: string,
  type: 1 | 2 | 3 | 5,
): Promise<ToutiaohaoSingleDataOverviewResponse> => {
  const result = await $http.get<unknown, AxiosResponse<ToutiaohaoSingleDataOverviewResponse>>(
    'https://mp.toutiao.com/mp/agw/statistic/v2/item/traffic_analyse',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.toutiao.com/profile_v4/manage/content/all',
        authority: 'mp.toutiao.com',
      },
      params: {
        from: start_date,
        to: end_date,
        item_id: item_id,
        platform: '全部',
        type: type,
        app_id: 1231,
      },
    },
  );

  // 请求失败
  if (result.data.code !== 0 && result?.data?.daily_stats.length === 0) {
    throw new BadRequestException(result.data?.message, result.data?.code, result.data);
  }

  return result.data;
};

export interface ToutiaohaoSingleDataOverviewResponse {
  code: number;
  daily_stats: Array<{
    consume_data: {
      /**
       * 粉丝阅读量
       */
      fans_go_detail_count: number;
      fans_go_detail_count_new: number;

      /**
       * 粉丝展现量
       */
      fans_impression_count: number;
      fans_impression_count_new: number;

      /**
       * 粉丝播放量
       */
      fans_play_count: number;
      fans_play_count_new: number;

      /**
       * 阅读量
       */
      go_detail_count: number;
      go_detail_count_new: number;

      /**
       * 展现量
       */
      impression_count: number;
      impression_count_new: number;

      /**
       * 播放量
       */
      play_count: number;
      play_count_new: number;
    };
    /**
     * 日期
     */
    date: string;
  }>;
  message: string;
}
