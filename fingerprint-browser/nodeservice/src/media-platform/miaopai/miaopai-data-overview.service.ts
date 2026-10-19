import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';

/**
 * 秒拍结算中心
 * @param cookie
 */
export const getDataOverviewIncomeAsync = async (cookie: string): Promise<MiaopaiDataOverviewIncomeResponse> => {
  const result = await $http.get<unknown, AxiosResponse<MiaopaiDataOverviewIncomeResponse>>(
    'https://creator.miaopai.com/Checkout/getAmount',
    {
      headers: {
        cookie: cookie,
        referer: 'https://creator.miaopai.com/balance',
        authority: 'creator.miaopai.com',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {},
    },
  );

  // 请求失败
  if (result.data.code !== 200) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

/**
 * 秒拍数据分析-视频分析-概览数据（全部视频数据）
 * @param cookie
 */
export const getDataOverviewCoreDataAsync = async (cookie: string): Promise<MiaopaiDataOverviewCoreDataResponse> => {
  const result = await $http.get<unknown, AxiosResponse<MiaopaiDataOverviewCoreDataResponse>>(
    'https://creator.miaopai.com/statis/getuservideodata',
    {
      headers: {
        cookie: cookie,
        referer: 'https://creator.miaopai.com/statisinfo/video',
        authority: 'creator.miaopai.com',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {},
    },
  );

  // 请求失败
  if (result.data.code !== 200) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

/**
 * 秒拍数据分析-视频分析-数据明细
 * @param cookie
 * @param days 数据范围（1：1天，7：7天，30：30天）默认30天
 */
export const getDataOverviewAsync = async (
  cookie: string,
  days: 1 | 7 | 30 = 30,
): Promise<MiaopaiDataOverviewResponse> => {
  const result = await $http.get<unknown, AxiosResponse<MiaopaiDataOverviewResponse>>(
    'https://creator.miaopai.com/statis/getvideoalldatalist',
    {
      headers: {
        cookie: cookie,
        referer: 'https://creator.miaopai.com/statisinfo/video',
        authority: 'creator.miaopai.com',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {
        page: 1,
        pageSize: days,
      },
    },
  );

  // 请求失败
  if (result.data.code !== 200) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface MiaopaiDataOverviewIncomeResponse {
  code: number;
  msg: string;
  data: {
    /**
     * 累计提现金额
     */
    extract: number;

    /**
     * 剩余金额
     */
    surplus: number;

    /**
     * 允许提现
     */
    allow_extract: number;

    /**
     * 最先提现金额
     */
    min_take: number;
    extract_msg: string;
  };
}

export interface MiaopaiDataOverviewCoreDataResponse {
  code: number;
  msg: string;
  data: {
    today: {
      validFansCnt: number;
      fansChangeStatus: number;
      fansChangeCnt: number;
      sumVcnt: number;

      /**
       * 总发布数
       */
      totalChanCnt: number;
      pubChanCnt: number;

      /**
       * 总播放数
       */
      vcnt: number;

      /**
       * 总点赞数
       */
      lcnt: number;

      /**
       * 总评论数
       */
      ccnt: number;
    };
  };
}

export interface MiaopaiDataOverviewItemResponse {
  /**
   * 日期
   */
  date: string;

  /**
   * 评论数
   */
  ccnt: string;

  /**
   * 点赞数
   */
  lcnt: string;

  /**
   * 播放数
   */
  vcnt: string;

  /**
   * 发布数
   */
  pubChanCnt: string;
  validFansCnt: string;
  newFansCnt: string;
}

export interface MiaopaiDataOverviewResponse {
  code: number;
  msg: string;
  data: {
    list: Array<MiaopaiDataOverviewItemResponse>;
    total: number;
  };
}
