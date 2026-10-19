import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';

/**
 * 西瓜视频数据中心-视频相关数据（概览，播放分析，互动分析，粉丝分析）
 * @param cookie
 * @param timeRangeType 时间类型，（0为累计，1为指定日期）
 * @param tab 数据类型（0：概览，1：播放分析，2：互动分析，4：粉丝分析）
 * @param startDate 开始日期 （昨天往前推对应的天数：如：7天，15天，30天）
 * @param endDate 结束日期（昨天）
 */
export const getDataOverviewStatisticAsync = async (
  cookie: string,
  timeRangeType: 0 | 1,
  tab: 0 | 1 | 2 | 4,
  startDate: string,
  endDate: string,
): Promise<XiguashipinDataOverviewStatisticResponse> => {
  const params = {
    timeRangeType: timeRangeType,
    tab: tab,
    startDate: startDate,
    endDate: endDate,
  };

  const result = await $http.get<unknown, AxiosResponse<XiguashipinDataOverviewStatisticResponse>>(
    'https://studio.ixigua.com/api/data/overview_data_v3',
    {
      headers: {
        cookie: cookie,
        referer: 'https://studio.ixigua.com/data',
        authority: 'studio.ixigua.com',
      },
      params: {
        params: JSON.stringify(params),
      },
    },
  );

  // 请求失败
  if (result.data.status !== 0) {
    throw new BadRequestException(result.data?.message, result.data?.status, result.data);
  }

  return result.data;
};

/**
 * 西瓜视频数据中心-报表数据
 * @param cookie
 * @param startDate 开始日期，（结束日期往前30天）
 * @param endDate 结束日期（昨天）
 * @param timeRangeType 时间类型，（0为累计，1为指定日期）
 * @param dataType 数据类型（1：播放量，3评论量，4昨日净增粉，5展现量，6粉丝量，7播放时长，8弹幕量，9点赞量，10强烈推荐，11收藏量，12分享量，13视频收益，14播放转粉率，15新增粉丝，16取消关注）
 */
export const getDataOverviewAsync = async (
  cookie: string,
  startDate: string,
  endDate: string,
  timeRangeType: 0 | 1,
  dataType: 1 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15,
): Promise<XiguashipinDataResponse> => {
  const params = {
    startDate: startDate,
    endDate: endDate,
    timeRangeType: timeRangeType,
    metricList: [dataType, 16],
  };

  const result = await $http.get<unknown, AxiosResponse<XiguashipinDataResponse>>(
    'https://studio.ixigua.com/api/data/data_trend_v2',
    {
      headers: {
        cookie: cookie,
        referer: 'https://studio.ixigua.com/data',
        authority: 'studio.ixigua.com',
      },
      params: {
        params: JSON.stringify(params),
      },
    },
  );

  // 请求失败
  if (result.data.status !== 0) {
    throw new BadRequestException(result.data?.message, result.data?.status, result.data);
  }

  return result.data;
};

/**
 * 西瓜视频总收益
 * @param cookie
 */
export const getIncomeAsync = async (cookie: string): Promise<XiguashipinIncomeResponse> => {
  const params = { StartDay: '', EndDay: '', IsYesterdayTab: false };

  const result = await $http.get<unknown, AxiosResponse<XiguashipinIncomeResponse>>(
    'https://studio.ixigua.com/api/income/creator_income_by_time',
    {
      headers: {
        cookie: cookie,
        referer: 'https://studio.ixigua.com/data',
        authority: 'studio.ixigua.com',
      },
      params: {
        params: JSON.stringify(params),
      },
    },
  );

  // 请求失败
  if (result.data.status !== 0) {
    throw new BadRequestException(result.data?.message, result.data?.status, result.data);
  }

  return result.data;
};

export interface XiguashipinOverviewStatisticResponse {
  MeetCondition: boolean;

  /**
   * 数据
   */
  TotalCount: number;
  FansCount: number;

  /**
   * 数据类新
   */
  DataType: number;

  /**
   * 数据类型中文
   */
  TotalCountText: string;

  /**
   * 更新时间
   */
  LatestUpdateDateTotal: string;
  FansCountText: string;
  LatestUpdateDateFans: string;
}

export interface XiguashipinDataOverviewStatisticResponse {
  status: number;
  message: string;
  data: {
    isShowLoyal: boolean;
    isNewLoyal: boolean;
    overviewList: Array<XiguashipinOverviewStatisticResponse>;
  };
}

export interface XiguashipinDataResponse {
  status: number;
  message: string;
  data: {
    data: Array<number>;
    dates: Array<string>;
  };
}

export interface XiguashipinIncomeResponse {
  status: number;
  message: string;
  data: {
    HasRealTimePayment: boolean;
    IsTotalIncomeSynced: boolean;
    LastReadyDate: string;
    TotalIncome: number;
  };
}

/**
 * 西瓜视频单篇统计数据
 * @param cookie
 * @param groupId 作品id
 * @param startDate 发布日期
 * @param endDate 昨日日期
 * @param tab 数据类型（0：概览，1：播放分析，2：互动分析，3：粉丝分析，4：收益分析）
 */
export const getSingleDataStatisticAsync = async (
  cookie: string,
  groupId: string,
  startDate: string,
  endDate: string,
  tab: 0 | 1 | 2 | 4 = 0,
): Promise<XiguashipinSingleDataStatisticResponse> => {
  const params = {
    groupId: groupId,
    startDate: startDate,
    endDate: endDate,
    timeRangeType: 0,
    tab: tab,
  };

  const result = await $http.get<unknown, AxiosResponse<XiguashipinSingleDataStatisticResponse>>(
    'https://studio.ixigua.com/api/data/overview_data_v3',
    {
      headers: {
        cookie: cookie,
        referer:
          'https://studio.ixigua.com/upload?gid=' +
          groupId +
          '&from=content_button&article_type=1&pub=content_manage_remake',
        authority: 'studio.ixigua.com',
      },
      params: {
        params: JSON.stringify(params),
      },
    },
  );

  // 请求失败
  if (result.data.status !== 0) {
    throw new BadRequestException(result.data?.message, result.data?.status, result.data);
  }

  return result.data;
};

export interface XiguashipinSingleDataStatisticResponse {
  status: number;
  data: {
    overviewList: Array<{
      MeetCondition: boolean;

      /**
       * 对应类型时间范围类总数据
       */
      TotalCount: number;

      /**
       * 对应类型时间范围内粉丝总数居
       */
      FansCount: number;

      /**
       * 数据类型
       */
      DataType: number;

      /**
       * 数据文本
       */
      TotalCountText: string;

      /**
       * 最后更新总数据日期
       */
      LatestUpdateDateTotal: string;

      /**
       * 粉丝数据文本
       */
      FansCountText: string;

      /**
       * 最后更新粉丝总数居日期
       */
      LatestUpdateDateFans: string;
    }>;
  };
  message: string;
}

/**
 * 西瓜视频单篇报表分析
 * @param cookie
 * @param groupId 作品id
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @param timeRangeType 查询日期范围（0累计，1日期范围）
 * @param dataType 数据类型（1：播放量，3评论量，4昨日净增粉，5展现量，6粉丝量，7平均播放时长，8弹幕量，9点赞量，10强烈推荐，11收藏量，12分享量，13视频收益，14播放转换率，15涨粉量，16：掉粉量，25：10秒跳出率，26：播放完成率）
 */
export const getXiguashipinSingleDataOverviewAsync = async (
  cookie: string,
  groupId: string,
  startDate: string,
  endDate: string,
  timeRangeType: 0 | 1,
  dataType: 1 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 25 | 26,
): Promise<XiguashipinSingleDataOverviewResponse> => {
  const params = {
    groupId: groupId,
    timeRangeType: timeRangeType,
    startDate: startDate,
    endDate: endDate,
    metricList: [dataType],
  };

  const result = await $http.get<unknown, AxiosResponse<XiguashipinSingleDataOverviewResponse>>(
    'https://studio.ixigua.com/api/data/overview_data_v3',
    {
      headers: {
        cookie: cookie,
        referer:
          'https://studio.ixigua.com/upload?gid=' +
          groupId +
          '&from=content_button&article_type=1&pub=content_manage_remake',
        authority: 'studio.ixigua.com',
      },
      params: {
        params: JSON.stringify(params),
      },
    },
  );

  // 请求失败
  if (result.data.status !== 0) {
    throw new BadRequestException(result.data?.message, result.data?.status, result.data);
  }

  return result.data;
};

export interface XiguashipinSingleDataOverviewResponse {
  status: number;
  message: string;
  data: {
    IsShowLoyal: false;
    /**
     * 日期
     */
    dates: Array<string>;

    /**
     * 相应数据
     */
    data: Array<number>;

    /**
     * 相应粉丝数据
     */
    fansData: Array<number>;
  };
}
