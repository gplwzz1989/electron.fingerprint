import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';

/**
 * 好看视频数据分析-整体数据
 * @param cookie
 * @param start_day 开始日期（10位时间戳）
 * @param end_day 结束日期（10位时间戳）
 */
export const getDataOverviewAsync = async (
  cookie: string,
  start_day: number,
  end_day: number,
): Promise<HaokanshipinDataOverviewResponse> => {
  const result = await $http.get<unknown, AxiosResponse<HaokanshipinDataOverviewResponse>>(
    'https://dream.haokan.com/creator/authorpcdailystatistic',
    {
      headers: {
        cookie: cookie,
        referer: 'https://dream.haokan.com/author/data',
        authority: 'dream.haokan.com',
      },
      params: {
        start_day: start_day,
        end_day: end_day,
        fans: 0,
      },
    },
  );

  // 请求失败
  if (result.data.status !== 0) {
    throw new BadRequestException(result.data?.msg, result.data?.status, result.data);
  }

  return result.data;
};

/**
 * 获取好看视频粉丝分析
 * @param cookie
 * @param start_day 开始日期（10位时间戳）
 * @param end_day 结束日期（10位时间戳）
 */
export const getDataOverviewFansAsync = async (
  cookie: string,
  start_day: number,
  end_day: number,
): Promise<HaokanshipinDataOverviewFansResponse> => {
  const result = await $http.get<unknown, AxiosResponse<HaokanshipinDataOverviewFansResponse>>(
    'https://dream.haokan.com/creator/pcfansdetail',
    {
      headers: {
        cookie: cookie,
        referer: 'https://dream.haokan.com/author/data',
        authority: 'dream.haokan.com',
      },
      params: {
        start_day: start_day,
        end_day: end_day,
      },
    },
  );

  // 请求失败
  if (result.data.status !== 0) {
    throw new BadRequestException(result.data?.msg, result.data?.status, result.data);
  }

  return result.data;
};

export interface HaokanshipinDataOverviewAllTrendInfo {
  /**
   * 日期
   */
  date: Array<string>;

  /**
   * 日期对应数据
   */
  data: Array<{
    /**
     * 数据名称（推荐量，播放量，播放完成率，评论量，点赞数，收藏数，分享量）
     */
    name: string;

    /**
     * 数据对应值
     */
    data: Array<number>;
  }>;
}

export interface HaokanshipinDataOverviewResponse {
  status: number;
  msg: string;
  data: {
    allTrendInfo: HaokanshipinDataOverviewAllTrendInfo;
  };
}

export interface HaokanshipinFansAllTrendInfo {
  /**
   * 日期
   */
  date: Array<string>;
  data: Array<{
    /**
     * 数据名称（新增粉丝，取消关注，净增粉丝，粉丝总数）
     */
    name: string;

    /**
     * 数据对应值
     */
    data: Array<number>;
  }>;
}

export interface HaokanshipinDataOverviewFansResponse {
  status: number;
  msg: string;
  data: {
    allTrendInfo: HaokanshipinFansAllTrendInfo;
  };
}

/**
 * 好看视频单篇统计数据
 * @param cookie
 * @param vid 作品id
 */
export const getSingleDataOverviewStatisticAsync = async (
  cookie: string,
  vid: string,
): Promise<HaokanshipinSingleDataOverviewStatisticResponse> => {
  const result = await $http.get<unknown, AxiosResponse<HaokanshipinSingleDataOverviewStatisticResponse>>(
    'https://dream.haokan.com/creator/pcauthorarticlestatistic',
    {
      headers: {
        cookie: cookie,
        referer: 'https://dream.haokan.com/author/data/' + vid,
        authority: 'dream.haokan.com',
      },
      params: {
        vid: vid,
      },
    },
  );

  // 请求失败
  if (result.data.status !== 0) {
    throw new BadRequestException(result.data?.msg, result.data?.status, result.data);
  }

  return result.data;
};

export interface HaokanshipinSingleDataOverviewStatisticResponse {
  status: number;
  msg: string;
  data: {
    baseData: Array<{
      /**
       * 数据对应名称
       */
      name: string;

      /**
       * 对应数量
       */
      num: number;
    }>;
    videoInfo: {
      /**
       * 标题
       */
      title: string;

      /**
       * 封面
       */
      poster: string;

      /**
       * 封面小图
       */
      poster_small: string;

      /**
       * 封面大图
       */
      poster_big: string;

      /**
       * 时长
       */
      time_length: string;

      /**
       * 来源
       */
      source_name: string;

      /**
       * 发布时间
       */
      publishTime: string;

      /**
       * 昵称
       */
      displayname: string;
    };
  };
}

/**
 * 好看视频单篇报表数据
 * @param cookie
 * @param vid 作品id
 * @param start_day 开始时间
 * @param end_day 结束时间
 * @param dimType 数据类型（recommend_count：推荐量, view_count：播放量, comment_count：评论量, likes_count：点赞量, share_count：分享量, collect_count：收藏量, yqsl_count：一圈三连互动量）
 */
export const getSingleDataOverviewAsync = async (
  cookie: string,
  vid: string,
  start_day: number,
  end_day: number,
  dimType:
    | 'recommend_count'
    | 'view_count'
    | 'comment_count'
    | 'likes_count'
    | 'share_count'
    | 'collect_count'
    | 'yqsl_count' = 'recommend_count',
): Promise<HaokanshipinSingleDataOverviewResponse> => {
  const result = await $http.get<unknown, AxiosResponse<HaokanshipinSingleDataOverviewResponse>>(
    'https://dream.haokan.com/creator/authorarticledailystatistic',
    {
      headers: {
        cookie: cookie,
        referer: 'https://dream.haokan.com/author/data/' + vid,
        authority: 'dream.haokan.com',
      },
      params: {
        vid: vid,
        start_day: start_day,
        end_day: end_day,
        dimType: dimType,
      },
    },
  );

  // 请求失败
  if (result.data.status !== 0) {
    throw new BadRequestException(result.data?.msg, result.data?.status, result.data);
  }

  return result.data;
};

export interface HaokanshipinSingleDataOverviewResponse {
  status: number;
  msg: string;
  data: {
    trendInfo: [Array<string>, Array<number>];
  };
}
