import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';

/**
 * 腾讯视频视频数据，数据分析
 * @param cookie
 * @param g_actk
 * @param g_vstk
 * @param start_date 开始日期（××××-××-××）
 * @param end_date 结束日期（××××-××-××）
 */
export const getDataOverviewAsync = async (
  cookie: string,
  g_actk: number,
  g_vstk: number,
  start_date: string,
  end_date: string,
): Promise<TengxunshipinDataOverviewResponse> => {
  const result = await $http.get<unknown, AxiosResponse<TengxunshipinDataOverviewResponse>>(
    'https://access.v.qq.com/trpc.creator_center.data_center.data_center/GetTrend',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.v.qq.com/',
        authority: 'access.v.qq.com',
        origin: 'https://mp.v.qq.com',
      },
      params: {
        g_actk: g_actk,
        g_vstk: g_vstk,
        refer: 'vcc_web',
        from: start_date,
        to: end_date,
        origin: 1,
      },
    },
  );

  // 请求失败
  if (result.data.code !== 0) {
    throw new BadRequestException(result.data?.msg, result.data?.ret, result.data);
  }

  return result.data;
};

/**
 * 腾讯视频收益管理-结算管理
 * @param cookie
 * @param g_actk
 * @param g_vstk
 */
export const getIncomeInfoListAsync = async (
  cookie: string,
  g_actk: number,
  g_vstk: number,
): Promise<TengxunshipinIncomeInfoListResponse> => {
  const result = await $http.get<unknown, AxiosResponse<TengxunshipinIncomeInfoListResponse>>(
    'https://access.v.qq.com/trpc.creator_center.settlement.Wallet/GetIncomeInfoList',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.v.qq.com/',
        authority: 'access.v.qq.com',
        origin: 'https://mp.v.qq.com',
      },
      params: {
        g_actk: g_actk,
        g_vstk: g_vstk,
        refer: 'vcc_web',
        origin: 1,
      },
    },
  );

  // 请求失败
  if (result.data.code !== 0) {
    throw new BadRequestException(result.data?.msg, result.data?.ret, result.data);
  }

  return result.data;
};

export interface TengxunshipinDataOverviewItemResponse {
  data: {
    /**
     * 日期
     */
    date: string;

    /**
     * 播放量
     */
    in_anti_vfinish_cnt: string;

    /**
     * 在追总人数
     */
    in_binge_uv: string;

    /**
     * 评论数
     */
    in_comment_cnt: string;

    /**
     * 鸡腿数
     */
    in_jitui_income_num: string;

    /**
     * 点赞数
     */
    in_like_cnt: string;

    /**
     * 粉丝数
     */
    in_subscribe_cnt: string;
  };
}

export interface TengxunshipinDataOverviewResponse {
  code: number;
  msg: string;
  ret?: number;
  data: {
    data: Array<TengxunshipinDataOverviewItemResponse>;
  };
}

export interface TengxunshipinIncomeInfoListResponse {
  code: number;
  msg: string;
  ret?: string;
  data: {
    items: Array<{
      name: string;
      cname: string;
      withdrawAmount: string;
      itemStatus: number;
      incomeCName: string;
      balance: string;
      sort: number;
    }>;
    totalIncome: string;
    totalWithdrawAmount: string;
    totalCantWithdrawAmount: string;
    info: {
      CantWithdrawAmount: string;
    };
    handInAmount: string;
  };
}

/**
 * 腾讯视频单篇数据
 * @param cookie
 * @param vid 作品id
 * @param start_date 开始日期
 * @param end_date 结束日期
 * @param g_actk
 * @param g_vstk
 */
export const getSingleDataOverviewAsync = async (
  cookie: string,
  vid: string,
  start_date: string,
  end_date: string,
  g_actk: number,
  g_vstk: number,
): Promise<TengxunshipinSingleDataOverviewResponse> => {
  const result = await $http.get<unknown, AxiosResponse<TengxunshipinSingleDataOverviewResponse>>(
    'https://access.v.qq.com/trpc.creator_center.data_center.data_center/GetTrend',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.v.qq.com/',
        authority: 'access.v.qq.com',
        origin: 'https://mp.v.qq.com',
      },
      params: {
        g_actk: g_actk,
        g_vstk: g_vstk,
        refer: 'vcc_web',
        from: start_date,
        to: end_date,
        vid: vid,
        origin: 1,
      },
    },
  );

  // 请求失败
  if (result.data.code !== 0) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface TengxunshipinSingleDataOverviewResponse {
  code: number;
  msg: string;
  data: {
    data: Array<{
      data: {
        /**
         * 在追用户播放量
         */
        binge_in_anti_vstart_cnt: string;

        /**
         * 日期
         */
        date: string;

        /**
         * 在追用户播放量
         */
        fans_in_anti_vstart_cnt: string;

        /**
         * 全部用户播放量
         */
        in_anti_vfinish_cnt: string;

        /**
         * 评论数
         */
        in_comment_cnt: string;

        /**
         * 点赞数
         */
        in_like_cnt: string;
      };
    }>;
    summaries: Array<{
      /**
       * 数据code
       */
      name: string;

      /**
       * 数据名称
       */
      cname: string;

      /**
       * 数值
       */
      count: string;
      ratio: string;

      /**
       * 数据包含字段
       */
      columns: Array<string>;
    }>;
  };
}
