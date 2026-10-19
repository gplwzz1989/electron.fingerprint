import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { GetTimeStamp, isJson } from '../../utils';
import { regex } from './bilibili-base.service';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * b站 核心数据(累计)
 * @param cookie
 * @param tab 数据类型 默认0（0：播放量、粉丝数，1：点赞数、收藏数，2：弹幕、分享、评论，4：充电）
 */
export const getDataOverviewCoreAsync = async (
  cookie: string,
  tab: 0 | 1 | 2 | 3 = 0,
): Promise<BilibiliDataOverviewCoreResponse> => {
  const result = await $http.get<unknown, AxiosResponse<BilibiliDataOverviewCoreResponse>>(
    'https://member.bilibili.com/x/web/data/v2/overview/stat/num',
    {
      retryCondition: (error, response) => {
        return !isJson(response.data);
      },
      headers: {
        cookie: cookie,
        referer: 'https://member.bilibili.com/platform/data-up/video/dataCenter/video',
        authority: 'member.bilibili.com',
      },
      params: {
        period: 3,
        s_locale: 'zh_CN',
        tab: tab,
        t: GetTimeStamp(13),
      },
    },
  );

  // 请求失败
  if (result.data.code !== 0) {
    throw new BadRequestException(result.data?.message, result.data?.code, result.data);
  }

  return result.data;
};

// noinspection SpellCheckingInspection
/**
 * b站报表数据
 * @param cookie
 * @param period 数据跨度（0：昨日&7天，1：30天，2：90天，3：累计（实际返回90天））
 * @param type 数据类型 （play：播放量，visitor：空间访客，fan：净增粉丝，like：点赞，fav：收藏，coin：硬币，comment：评论，dm：弹幕，share：分享，elec：充电）
 */
export const getDataOverviewAsync = async (
  cookie: string,
  period: 0 | 1 | 2 | 3 = 0,
  type: 'play' | 'visitor' | 'fan' | 'like' | 'fav' | 'coin' | 'comment' | 'dm' | 'share' | 'elec' = 'play',
): Promise<BilibiliDataOverviewResponse> => {
  const result = await $http.get<unknown, AxiosResponse<BilibiliDataOverviewResponse>>(
    'https://member.bilibili.com/x/web/data/v2/overview/stat/graph',
    {
      retryCondition: (error, response) => {
        return !isJson(response.data);
      },
      headers: {
        cookie: cookie,
        referer: 'https://member.bilibili.com/platform/data-up/video/dataCenter/video',
        authority: 'member.bilibili.com',
      },
      params: {
        period: period,
        s_locale: 'zh_CN',
        type: type,
        t: GetTimeStamp(13),
      },
    },
  );

  // 请求失败
  if (result.data.code !== 0) {
    throw new BadRequestException(result.data?.message, result.data?.code, result.data);
  }

  return result.data;
};

export interface BilibiliCoreData {
  /**
   * 播放量
   */
  play: number;
  play_last: number;
  visitor: number;
  visitor_last: number;
  /**
   * 粉丝数
   */
  fan: number;
  fan_last: number;
  /**
   * 点赞数
   */
  like: number;
  like_last: number;
  /**
   * 收藏数
   */
  fav: number;
  fav_last: number;
  /**
   * 硬币数
   */
  coin: number;
  coin_last: number;
  /**
   * 弹幕数
   */
  dm: number;
  dm_last: number;
  /**
   * 评论数
   */
  comment: number;
  comment_last: number;
  /**
   * 分享数
   */
  share: number;
  share_last: number;
  // noinspection SpellCheckingInspection
  /**
   * 充电数
   */
  elec: number;
  // noinspection SpellCheckingInspection
  elec_last: number;
  vt: number;
  vt_last: number;
}

export interface BilibiliDataOverviewCoreResponse {
  code: number;
  message: string;
  data?: BilibiliCoreData;
}

export interface BilibiliTendencyData {
  /**
   * 日期时间戳
   */
  date_key: number;

  /**
   * 对应类型值
   */
  total_inc: number;
  sub_total_inc: number;
}

export interface BilibiliDataOverviewResponse {
  code: number;
  message: string;
  data?: {
    tendency: Array<BilibiliTendencyData>;
  };
}

/**
 * B站收益统计
 * @param cookie
 */
export const getIncomeStatisticAsync = async (cookie: string): Promise<BilibiliIncomeStatisticResponse> => {
  const csrfTokenMatch = regex.exec(cookie);
  const csrfToken = csrfTokenMatch ? csrfTokenMatch[1] : '';

  const result = await $http.get<unknown, AxiosResponse<BilibiliIncomeStatisticResponse>>(
    'https://api.bilibili.com/x/earnings/up/index/income',
    {
      headers: {
        cookie: cookie,
        referer: 'https://member.bilibili.com/',
        authority: 'member.bilibili.com',
      },
      params: {
        s_locale: 'zh_CN',
        csrf: csrfToken,
      },
    },
  );

  // 请求失败
  if (result.data.code !== 0) {
    throw new BadRequestException(result.data?.message, result.data?.code, result.data);
  }

  return result.data;
};

export interface BilibiliIncomeStatisticResponse {
  code: 0;
  message: '0';
  data: {
    summary: {
      state: number;
      daily_amt: number;
      annual_amt: number;
      thirty_days_amt: number;
      last_thirty_days_amt: number;
      over_last_day_amt: number;
      over_last_thirty_days_amt: number;
      over_last_year_amt: number;
      daily1_amt: number;
      annual1_amt: number;
    };
  };
}

/**
 * B站专栏统计数据
 * @param cookie
 */
export const getArticleDataOverviewCoreAsync = async (
  cookie: string,
): Promise<BilibiliArticleDataOverviewCoreResponse> => {
  const result = await $http.get<unknown, AxiosResponse<BilibiliArticleDataOverviewCoreResponse>>(
    'https://member.bilibili.com/x/web/data/article',
    {
      headers: {
        cookie: cookie,
        referer: 'https://member.bilibili.com/platform/data-up/index',
        authority: 'member.bilibili.com',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {},
    },
  );

  // 请求失败
  if (result.data.code !== 0) {
    throw new BadRequestException(result.data?.message, result.data?.code, result.data);
  }

  return result.data;
};

export interface BilibiliArticleDataOverviewCoreResponse {
  code: number;
  message: string;
  data: {
    /**
     * 浏览量
     */
    view: number;

    /**
     * 评论数
     */
    reply: number;

    /**
     * 点赞数
     */
    like: number;

    /**
     * 硬币数
     */
    coin: number;

    /**
     * 收藏数
     */
    fav: number;

    /**
     * 分享数
     */
    share: number;

    /**
     * 浏览数增量
     */
    incr_view: number;

    /**
     * 评论数增量
     */
    incr_reply: number;

    /**
     * 点赞数增量
     */
    incr_like: number;

    /**
     * 硬币增量
     */
    incr_coin: number;

    /**
     * 收藏增量
     */
    incr_fav: number;

    /**
     * 分享增量
     */
    incr_share: number;
  };
}

/**
 * B站专栏报表数据
 * @param cookie
 * @param type 数据类型（1：浏览，2：评论，3：分享，4：硬币，5：收藏，6：点赞）
 */
export const getArticleDataOverviewAsync = async (
  cookie: string,
  type: 1 | 2 | 3 | 4 | 5 | 6 = 1,
): Promise<BilibiliArticleDataOverviewResponse> => {
  const result = await $http.get<unknown, AxiosResponse<BilibiliArticleDataOverviewResponse>>(
    'https://member.bilibili.com/x/web/data/article/thirty',
    {
      headers: {
        cookie: cookie,
        referer: 'https://member.bilibili.com/platform/data-up/index',
        authority: 'member.bilibili.com',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {
        type: type,
      },
    },
  );

  // 请求失败
  if (result.data.code !== 0) {
    throw new BadRequestException(result.data?.message, result.data?.code, result.data);
  }

  return result.data;
};

export interface BilibiliArticleDataOverviewResponse {
  code: number;
  message: string;
  data: Array<{
    /**
     * 日期
     */
    date_key: number;

    /**
     * 对应类型数据
     */
    total_inc: number;
  }>;
}

/**
 * b站报表数据
 * @param cookie
 * @param period 数据跨度（0：7天，1：30天，2：90天，3：累计（实际返回90天））
 * @param proxyAgent
 */
export const getDataOverviewAllAsync = async (
  cookie: string,
  period: 0 | 1 | 2 | 3 = 1,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<BilibiliOverViewAll> => {
  const result = await $http.get<unknown, AxiosResponse<BilibiliOverViewAll>>(
    'https://member.bilibili.com/x/web/data/v2/overview/stat/graph',
    {
      retryCondition: (error, response) => {
        return !isJson(response.data);
      },
      headers: {
        cookie: cookie,
        referer: 'https://member.bilibili.com/platform/data-up/video/dataCenter/video',
        authority: 'member.bilibili.com',
      },
      params: {
        period: period,
        s_locale: 'zh_CN',
        type: 'play,visitor,fan,like,fav,coin,comment,dm,share,elec',
        t: GetTimeStamp(13),
      },
      httpsAgent: proxyAgent,
      httpAgent: proxyAgent,
    },
  );

  return result.data;
};

export interface BilibiliOverViewAll {
  code: number;
  message: string;
  data: {
    tendency: Array<{ date_key: number; total_inc: number; sub_total_inc: number }>;
    data_tendency: {
      coin: Array<{ date_key: number; total_inc: number; sub_total_inc: number }>;
      comment: Array<{ date_key: number; total_inc: number; sub_total_inc: number }>;
      dm: Array<{ date_key: number; total_inc: number; sub_total_inc: number }>;
      elec: Array<{ date_key: number; total_inc: number; sub_total_inc: number }>;
      fan: Array<{ date_key: number; total_inc: number; sub_total_inc: number }>;
      fav: Array<{ date_key: number; total_inc: number; sub_total_inc: number }>;
      like: Array<{ date_key: number; total_inc: number; sub_total_inc: number }>;
      play: Array<{ date_key: number; total_inc: number; sub_total_inc: number }>;
      share: Array<{ date_key: number; total_inc: number; sub_total_inc: number }>;
      visitor: Array<{ date_key: number; total_inc: number; sub_total_inc: number }>;
    };
  };
}
