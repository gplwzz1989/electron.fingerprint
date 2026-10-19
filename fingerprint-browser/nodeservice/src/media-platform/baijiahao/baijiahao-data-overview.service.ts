import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 百家号内容分析
 * @param cookie
 * @param start_day 开始日期(20231024)
 * @param end_day 结束日期(20231030)
 * @param proxyAgent
 */
export const getDataOverviewAsync = async (
  cookie: string,
  start_day: string,
  end_day: string,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<BaijiahaoDataOverviewResponse> => {
  const result = await $http.get<unknown, AxiosResponse<BaijiahaoDataOverviewResponse>>(
    'https://baijiahao.baidu.com/author/eco/statistics/appStatisticV3',
    {
      headers: {
        cookie: cookie,
        referer: 'https://baijiahao.baidu.com/builder/rc/analysiscontent',
        host: 'baijiahao.baidu.com',
      },
      params: {
        start_day: start_day,
        end_day: end_day,
        type: 'all',
        is_yesterday: false,
        stat: 0,
      },
      httpsAgent: proxyAgent,
      httpAgent: proxyAgent,
    },
  );

  // 请求失败
  if (result.data.errno !== 0) {
    throw new BadRequestException(result.data?.errmsg, result.data?.errno, result.data);
  }

  return result.data;
};

export interface BaijiahaoDataOverviewItemResponse {
  /**
   * 推荐量
   */
  recommend_count: number;

  /**
   * 评论数
   */
  comment_count: number;

  /**
   * 阅读（播放）数
   */
  view_count: number;

  /**
   * 点赞数
   */
  likes_count: number;

  /**
   * 收藏数
   */
  collect_count: number;

  /**
   * 分享数
   */
  share_count: number;

  /**
   * 搜索展现量
   */
  search_show: number;

  /**
   * 涨粉量
   */
  fans_increase: number;
  /**
   * 粉丝推荐数
   */
  fans_recommend_count: number;

  /**
   * 粉丝评论数
   */
  fans_comment_count: number;

  /**
   * 粉丝阅读（播放）数
   */
  fans_view_count: number;

  /**
   * 粉丝点赞数
   */
  fans_likes_count: number;

  /**
   * 粉丝收藏数
   */
  fans_collect_count: number;

  /**
   * 粉丝分享数
   */
  fans_share_count: number;

  /**
   * 粉丝播放时长
   */
  fans_play_duration: number;

  /**
   * 播放完成率
   */
  complete_rate: number;

  /**
   * 日期
   */
  event_day: string;
}

export interface BaijiahaoDataOverviewChartResponse {
  /**
   * 推荐量
   */
  recommend_count: number;

  /**
   * 评论数
   */
  comment_count: number;

  /**
   * 阅读（播放）量
   */
  view_count: number;

  /**
   * 点赞数
   */
  likes_count: number;

  /**
   * 收藏量
   */
  collect_count: number;

  /**
   * 分享量
   */
  share_count: number;

  /**
   * 搜索展现量
   */
  search_show: number;

  /**
   * 粉丝推荐量
   */
  fans_recommend_count: number;

  /**
   * 粉丝评论量
   */
  fans_comment_count: number;

  /**
   * 粉丝阅读（播放）量
   */
  fans_view_count: number;

  /**
   * 粉丝点赞数
   */
  fans_likes_count: number;

  /**
   * 粉丝收藏数
   */
  fans_collect_count: number;

  /**
   * 粉丝分享数
   */
  fans_share_count: number;

  /**
   * 粉丝播放时长
   */
  fans_play_duration: number;

  /**
   * 完播率
   */
  complete_rate: number;

  /**
   * 日期
   */
  event_day: string;
}

export interface BaijiahaoDataOverviewResponse {
  errno: number;
  errmsg: string;
  data: {
    data: {
      recommend_count: number;
      view_count: number;
      likes_count: number;
      collect_count: number;
      share_count: number;
      search_show: number;
      publish_count: number;
      origin_publish_count: number;
      publish_account_count: number;
      origin_publish_account_count: number;
      comment_count: number;
      all_view_duration: string;
      complete_rate: number;
      view_channel_count: {
        share: number;
        other: number;
        spider: number;
      };
      completion_view_count: number;
      total_view_count: number;
      event_day: string;
      news_quality: string;
      news_quality_rank: string;
      small_video_quality: string;
      small_video_quality_rank: string;
      small_video_v2_quality: string;
      small_video_v2_quality_rank: string;
      video_quality: string;
      video_quality_rank: string;
    };
    list: Array<BaijiahaoDataOverviewItemResponse>;
    chart: Array<BaijiahaoDataOverviewChartResponse>;
  };
}

/**
 * 百家号单篇统计数据
 * @param cookie
 * @param nid 作品id
 * @param type 作品类型 (news：图文，video：视频，small_video：小视频)
 */
export const getSingleDataOverviewStatisticAsync = async (
  cookie: string,
  nid: string,
  type: 'news' | 'video' | 'small_video',
): Promise<BaijiahaoSingleDataOverviewStatisticResponse> => {
  const result = await $http.get<unknown, AxiosResponse<BaijiahaoSingleDataOverviewStatisticResponse>>(
    'https://baijiahao.baidu.com/author/eco/statistics/ArticleStatisticV2',
    {
      headers: {
        cookie: cookie,
        referer:
          'https://baijiahao.baidu.com/builder/rc/content?currentPage=1&search=&pageSize=10&type=&collection=publish',
        host: 'baijiahao.baidu.com',
      },
      params: {
        nid: nid,
        type: type,
      },
    },
  );

  // 请求失败
  if (result.data.errno !== 0) {
    throw new BadRequestException(result.data?.errmsg, result.data?.errno, result.data);
  }

  return result.data;
};

export interface BaijiahaoSingleDataOverviewStatisticResponse {
  errno: 0;
  errmsg: 'success';
  data: {
    /**
     * 搜索推荐量
     */
    disp_pv: string;

    /**
     * 粉丝变化
     */
    fans_increase: string;

    /**
     * 收益
     */
    income_count: string;

    reward_count: string;

    /**
     * 播放完成率
     */
    complete_rate: number;

    /**
     * 3秒快滑率
     */
    view_3s_dis: number;

    /**
     * 平均播放时长
     */
    avg_view_duration: string;
    /**
     * 作品id
     */
    nid: string;
    app_id: string;

    /**
     * 播放量
     */
    view_count: number;

    /**
     * 点赞量
     */
    likes_count: number;

    /**
     * 评论数
     */
    comment_count: number;

    /**
     * 分享量
     */
    share_count: number;

    /**
     * 作品标题
     */
    title: string;

    /**
     * 展现量
     */
    rec_count: number;

    /**
     * 收藏量
     */
    collect_count: number;
    mount_mapp: number;
  };
}

/**
 * 百家号单篇报表数据
 * @param cookie
 * @param nid 作品id
 * @param start_day 开始日期
 * @param end_day 结束日期
 * @param type 作品类型 (news：图文，video：视频，small_video：小视频)
 */
export const getSingleDataOverview = async (
  cookie: string,
  nid: string,
  start_day: string,
  end_day: string,
  type: 'news' | 'video' | 'small_video',
): Promise<BaijiahaoSingleDataOverviewResponse> => {
  const result = await $http.get<unknown, AxiosResponse<BaijiahaoSingleDataOverviewResponse>>(
    'https://baijiahao.baidu.com/author/eco/statistics/articleDailyListStatisticV2',
    {
      headers: {
        cookie: cookie,
        referer:
          'https://baijiahao.baidu.com/builder/rc/content?currentPage=1&search=&pageSize=10&type=&collection=publish',
        host: 'baijiahao.baidu.com',
      },
      params: {
        nid: nid,
        start_day: start_day,
        end_day: end_day,
        type: type,
      },
    },
  );

  // 请求失败
  if (result.data.errno !== 0) {
    throw new BadRequestException(result.data?.errmsg, result.data?.errno, result.data);
  }

  return result.data;
};

export interface BaijiahaoSingleDataOverviewResponse {
  errno: number;
  errmsg: string;
  data: {
    list: Array<{
      /**
       * 推荐量
       */
      recommend_count: number;

      /**
       * 播放量（阅读量）
       */
      view_count: number;

      /**
       * 点赞量
       */
      likes_count: number;

      /**
       * 评论量
       */
      comment_count: number;

      /**
       * 收藏量
       */
      collect_count: number;

      /**
       * 分享量
       */
      share_count: number;

      /**
       * 搜索展现量
       */
      disp_pv: number;

      /**
       * 涨粉数
       */
      fans_increase: number;
      fans_view_count: number;
      fans_likes_count: number;
      fans_comment_count: number;
      fans_share_count: number;

      /**
       * 日期
       */
      event_day: string;
    }>;
  };
}
