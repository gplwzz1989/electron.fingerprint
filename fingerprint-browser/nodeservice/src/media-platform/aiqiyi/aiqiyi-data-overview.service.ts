import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 爱奇艺作品数据-数据详情
 * @param cookie
 * @param startDate 开始日期（××××-××-××）
 * @param endDate 结束日期（××××-××-××）
 * @param dateType 数据日期范围（2：7天，3：15天，4：30天），默认数据4
 * @param proxyAgent
 */
export const getDataOverviewAsync = async (
  cookie: string,
  startDate: string,
  endDate: string,
  dateType: 2 | 3 | 4 = 4,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<AiqiyiDataOverviewResponse> => {
  const result = await $http.get<unknown, AxiosResponse<AiqiyiDataOverviewResponse>>(
    'https://mp-api.iqiyi.com/stat/api/1.0/video/data/user_trend',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.iqiyi.com/',
        origin: 'https://mp.iqiyi.com',
      },
      params: {
        pgcType: 'wemedia_v2',
        startDate: startDate,
        endDate: endDate,
        dateType: dateType,
      },
      httpAgent: proxyAgent,
      httpsAgent: proxyAgent,
    },
  );

  // 请求失败
  if (result.data.code !== 0) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface AiqiyiDataOverviewItemResponse {
  /**
   * 日期
   */
  date: string;

  /**
   * 展现量
   */
  pv: number;

  /**
   * 播放量
   */
  vv: number;

  /**
   * 播放时长（单位毫秒）
   */
  playtime: number;

  /**
   * 评论数
   */
  commentNum: number;

  /**
   * 点赞数
   */
  likeNum: number;

  /**
   * 分享量
   */
  shareNum: number;

  /**
   * 弹幕量
   */
  barrageNum: number;
  fansIncrNum: number;

  /**
   * 播放完成率
   */
  completionDegree: number;

  /**
   * 粉丝播放量
   */
  fansVv: number;

  /**
   * 粉丝播放时长
   */
  fansPlaytime: number;

  /**
   * 粉丝评论量
   */
  fansCommentNum: number;

  /**
   * 粉丝点赞量
   */
  fansLikeNum: number;

  /**
   * 粉丝弹幕量
   */
  fansBarrageNum: number;

  /**
   * 粉丝播放完成率
   */
  fansCompletionDegree: number;
}

export interface AiqiyiDataOverviewResponse {
  code: number;
  msg: string;
  data: {
    resultSize: number;
    status: string;
    data: Array<AiqiyiDataOverviewItemResponse>;
  };
}

/**
 * 爱奇艺单篇统计数据
 * @param cookie
 * @param qipuId 作品id
 */
export const getSingleDataOverviewStatisticAsync = async (
  cookie: string,
  qipuId: number,
): Promise<AiqiyiSingleDataOverviewStatisticResponse> => {
  const result = await $http.get<unknown, AxiosResponse<AiqiyiSingleDataOverviewStatisticResponse>>(
    'https://mp-api.iqiyi.com/stat/api/1.0/video/data/video_total_stat',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.iqiyi.com/',
        origin: 'https://mp.iqiyi.com',
      },
      params: {
        pgcType: 'wemedia_v2',
        qipuId: qipuId,
      },
    },
  );

  // 请求失败
  if (result.data.code !== 0) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface AiqiyiSingleDataOverviewStatisticResponse {
  code: number;
  msg: string;
  data: {
    /**
     * 总播放
     */
    totalVv: number;

    /**
     * 总播放
     */
    totalPv: number;

    /**
     * 总评论
     */
    totalCommentNum: number;

    /**
     * 总新增粉丝数
     */
    totalFansIncrNum: number;

    /**
     * 总点赞
     */
    totalLikeNum: number;

    /**
     * 总播放时长（毫秒）
     */
    totalPlaytime: number;
    totalBvvDuration: number;

    /**
     * 总播放完成率
     */
    playCompletePercent: number;
  };
}

/**
 * 爱奇艺单篇报表数据
 * @param cookie
 * @param qipuId 作品id
 * @param startDate 开始日期
 * @param endDate 结束日期
 */
export const getSingleDataOverviewAsync = async (
  cookie: string,
  qipuId: number,
  startDate: string,
  endDate: string,
): Promise<AiqiyiSingleDataOverviewResponse> => {
  const result = await $http.get<unknown, AxiosResponse<AiqiyiSingleDataOverviewResponse>>(
    'https://mp-api.iqiyi.com/stat/api/1.0/video/data/video_total_stat',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.iqiyi.com/',
        origin: 'https://mp.iqiyi.com',
      },
      params: {
        pgcType: 'wemedia_v2',
        startDate: startDate,
        endDate: endDate,
        dateType: 7,
        qipuId: qipuId,
      },
    },
  );

  // 请求失败
  if (result.data.code !== 0) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface AiqiyiSingleDataOverviewResponse {
  code: number;
  msg: string;
  data: {
    resultSize: number;
    status: string;
    videoDetailData: Array<{
      /**
       * 日期
       */
      dt: string;

      /**
       * 评论数
       */
      commentNum: number;

      /**
       * 展现量
       */
      pv: number;

      /**
       * 播放量
       */
      vv: number;

      /**
       * 新增粉丝数
       */
      fansIncrNum: number;

      /**
       * 播放时长
       */
      playtime: number;

      /**
       * 播放完成率
       */
      completionDegree: number;

      /**
       * 点赞数
       */
      likeNum: number;

      /**
       * 分享数
       */
      shareNum: number;

      /**
       * 弹幕数
       */
      barrageNum: number;
      vvXDuration: number;

      /**
       * 粉丝播放量
       */
      fansVv: number;

      /**
       * 粉丝播放时长
       */
      fansPlaytime: number;

      /**
       * 粉丝完成播放率
       */
      fansCompletionDegree: number;

      /**
       * 粉丝评论量
       */
      fansCommentNum: number;

      /**
       * 粉丝点赞量
       */
      fansLikeNum: number;

      /**
       * 粉丝弹幕数
       */
      fansBarrageNum: number;
    }>;
  };
}

export const getDailyFansOverviewAsync = async (
  cookie: string,
  size: number,
  startDate: string,
  endDate: string,
): Promise<DailyFansStatisticsResponse> => {
  const url = 'https://mp-api.iqiyi.com/stat/api/1.0/fans/trend';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.iqiyi.com/',
    origin: 'https://mp.iqiyi.com',
  };

  const params = {
    page: 1,
    size: size,
    startDate: startDate,
    endDate: endDate,
  };

  const result = await $http.get(url, {
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface DailyFansStatisticsResponse {
  code: number;
  msg: string;
  data: {
    content: Array<{
      dt: string; // 日期或"合计"标识
      total_num: number; // 总数量
      /**
       * 涨粉数
       */
      incr_num: number; // 新增数量
      lost_num: number; // 流失数量
      fans_vv: number; // 粉丝访问量（推测）
      fans_income: number; // 粉丝相关收入
    }>;
    totalPages: number; // 总页数
    last: boolean; // 是否为最后一页
    totalElements: number; // 总元素数量
    numberOfElements: number; // 当前页元素数量
    first: boolean; // 是否为第一页
    size: number; // 每页大小
    number: number; // 当前页码（从0开始）
  };
}
