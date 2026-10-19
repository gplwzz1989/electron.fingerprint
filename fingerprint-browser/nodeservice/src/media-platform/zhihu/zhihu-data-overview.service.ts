import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { errorCode } from '../../media-platform/errorCode';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 知乎收益分析头部统计
 * @param cookie
 */
export const getDataOverviewIncomeStatisticAsync = async (
  cookie: string,
): Promise<ZhihuDataOverviewIncomeStatisticResponse> => {
  const result = await $http.get<unknown, AxiosResponse<ZhihuDataOverviewIncomeStatisticResponse>>(
    'https://www.zhihu.com/api/v4/creators/money/card',
    {
      headers: {
        cookie: cookie,
        referer: 'https://www.zhihu.com/creator/income-analysis?pageSource=creator_center_index_sidebar',
        authority: 'www.zhihu.com',
      },
      params: {},
    },
  );

  if (result.headers.statusCode !== 200) {
    if (result.headers.statusCode === 401) {
      throw new BadRequestException('登录失效', errorCode.data_error, result.data);
    } else {
      throw new BadRequestException('请求错误', errorCode.request_error, result.data);
    }
  }

  return result.data;
};

/**
 * 知乎收益报表
 * @param cookie
 * @param start_date 开始日期 （××××-××-××）
 * @param end_date 结束日期（××××-××-××）
 */
export const getDataOverviewIncomeAsync = async (
  cookie: string,
  start_date: string,
  end_date: string,
): Promise<ZhihuDataOverviewIncomeResponse> => {
  const result = await $http.get<unknown, AxiosResponse<ZhihuDataOverviewIncomeResponse>>(
    'https://www.zhihu.com/api/v4/creators/money/range',
    {
      headers: {
        cookie: cookie,
        referer: 'https://www.zhihu.com/creator/income-analysis?pageSource=creator_center_index_sidebar',
        authority: 'www.zhihu.com',
      },
      params: {
        start_date: start_date,
        end_date: end_date,
      },
    },
  );

  if (result.headers.statusCode !== 200) {
    if (result.headers.statusCode === 401) {
      throw new BadRequestException('登录失效', errorCode.data_error, result.data);
    } else {
      throw new BadRequestException('请求错误', errorCode.request_error, result.data);
    }
  }

  return result.data;
};

/**
 * 知乎内容分析头部统计
 * @param cookie
 * @param start 开始日期 （××××-××-××）
 * @param end 结束日期（××××-××-××）
 * @param tab 数据类型 （article：图文，zvideo：视频）
 * @param proxyAgent
 */
export const getDataOverviewStatisticAsync = async (
  cookie: string,
  tab: 'all' | 'article' | 'zvideo' = 'zvideo',
  end: string,
  start?: string,
  proxyAgent?: HttpsProxyAgent<string> | undefined,
): Promise<ZhihuDataOverviewStatisticResponse> => {
  const referer = 'https://www.zhihu.com/creator/analytics/work/' + tab;

  let params: {
    tab: string;
    start?: string;
    end: string;
  } = {
    tab: tab,
    end: end,
    start: start,
  };

  if (start) {
    params = { ...params, start: start };
  }
  const result = await $http.get<unknown, AxiosResponse<ZhihuDataOverviewStatisticResponse>>(
    'https://www.zhihu.com/api/v4/creators/analysis/realtime/member/aggr',
    {
      headers: {
        cookie: cookie,
        referer: referer,
        authority: 'www.zhihu.com',
      },
      params: params,
      httpAgent: proxyAgent,
      httpsAgent: proxyAgent,
    },
  );
  return result.data;
};

/**
 * 知乎内容分析
 * @param cookie
 * @param start 开始日期 （××××-××-××）
 * @param end 结束日期（××××-××-××）
 * @param tab 数据类型 （article：图文，zvideo：视频）
 */
export const getDataOverviewAsync = async (
  cookie: string,
  start: string,
  end: string,
  tab: 'article' | 'zvideo' | 'all' = 'all',
): Promise<Array<ZhihuDataOverviewResponse>> => {
  const referer = 'https://www.zhihu.com/creator/analytics/work/' + tab;

  const result = await $http.get<unknown, AxiosResponse<Array<ZhihuDataOverviewResponse>>>(
    'https://www.zhihu.com/api/v4/creators/analysis/realtime/member/daily',
    {
      headers: {
        cookie: cookie,
        referer: referer,
        authority: 'www.zhihu.com',
      },
      params: {
        tab: tab,
        start: start,
        end: end,
      },
    },
  );

  // if (result.headers.statusCode !== 200) {
  //   if (result.headers.statusCode === 401) {
  //     throw new BadRequestException('登录失效', errorCode.data_error, result.data);
  //   } else {
  //     throw new BadRequestException('请求错误', errorCode.request_error, result.data);
  //   }
  // }

  return result.data;
};

export interface ZhihuDataOverviewIncomeStatisticResponse {
  today: number;
  yesterday: number;
  this_week: number;
  last_week: number;
  total: number;
  balance: number;
  diff: number;
}

export interface ZhihuDataOverviewIncomeResponse {
  data: Array<{
    date: string;
    total: number;
    channel_paid: number;
    channel_content_money: number;
    channel_good_good: number;
    channel_zhi_plus: number;
    channel_brand_task: number;
    channel_other: number;
  }>;
}

export interface ZhihuDataOverviewStatisticResponse {
  updated: string;
  pv: number;
  play: number;
  show: number;
  upvote: number;
  comment: number;
  like: number;
  collect: number;
  share: number;
  reaction: number;
  re_pin: number;
  like_and_reaction: number;
  incr_upvote_num: number;
  desc_upvote_num: number;
  incr_like_num: number;
  desc_like_num: number;
  yesterday: {
    updated: number;
    pv: number;
    play: number;
    show: number;
    upvote: number;
    comment: number;
    like: number;
    collect: number;
    share: number;
    reaction: number;
    re_pin: number;
    like_and_reaction: number;
    incr_upvote_num: number;
    desc_upvote_num: number;
    incr_like_num: number;
    desc_like_num: number;
  };
  today: {
    updated: number;
    pv: number;
    play: number;
    show: number;
    upvote: number;
    comment: number;
    like: number;
    collect: number;
    share: number;
    reaction: number;
    re_pin: number;
    like_and_reaction: number;
    incr_upvote_num: number;
    desc_upvote_num: number;
    incr_like_num: number;
    desc_like_num: number;
  };
}

export interface ZhihuDataOverviewResponse {
  p_date: string;
  pv: number;
  play: number;
  show: number;
  upvote: number;
  comment: number;
  like: number;
  collect: number;
  share: number;
  reaction: number;
  re_pin: number;
  like_and_reaction: number;
  incr_upvote_num: number;
  desc_upvote_num: number;
  incr_like_num: number;
  desc_like_num: number;
  yesterday: number;
  today: number;
  advanced: number;
}

/**
 * 知乎单篇统计数据
 * @param cookie
 * @param token 作品类别中url_token
 * @param type 作品类型 （图文：article, 视频：zvideo）
 * @param end 结束日期 (××××-××-××)
 */
export const getSingleDataOverviewStatisticAsync = async (
  cookie: string,
  token: string,
  type: 'article' | 'zvideo',
  end: string,
): Promise<ZhihuSingleDataOverviewStatisticResponse> => {
  const referer = `https://www.zhihu.com/creator/analytics/work/${type}/${token}`;

  const result = await $http.get<unknown, AxiosResponse<ZhihuSingleDataOverviewStatisticResponse>>(
    'https://www.zhihu.com/api/v4/creators/analysis/realtime/content/aggr',
    {
      headers: {
        cookie: cookie,
        referer: referer,
        authority: 'www.zhihu.com',
      },
      params: {
        token: token,
        type: type,
        end: end,
      },
    },
  );

  if (result.data.code && result.data.msg) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface ZhihuSingleDataOverviewStatisticResponse {
  msg?: string;
  code?: string;
  /**
   * 阅读量
   */
  pv: number;

  /**
   * 播放量
   */
  play: number;
  show: number;

  /**
   * 赞同总量
   */
  upvote: number;

  /**
   * 评论总量
   */
  comment: number;

  /**
   * 喜欢总量
   */
  like: number;

  /**
   * 收藏总量
   */
  collect: number;

  /**
   * 分享总量
   */
  share: number;
  reaction: number;
  re_pin: number;
  like_and_reaction: number;

  article: {
    url_token: string;
    title: string;
  };
  zvideo: {
    url_token: string;
    title: string;
  };
  answer: {
    url_token: string;
    title: string;
  };
}

/**
 * 知乎单篇报表分析
 * @param cookie
 * @param token 作品类别中url_token
 * @param type 作品类型 （图文：article, 视频：zvideo）
 * @param start 开始日期 (××××-××-××)
 * @param end 结束日期 (××××-××-××)
 */
export const getSingleDataOverviewAsync = async (
  cookie: string,
  token: string,
  type: 'article' | 'zvideo',
  start: string,
  end: string,
): Promise<Array<ZhihuSingleDataOverviewResponse>> => {
  const referer = `https://www.zhihu.com/creator/analytics/work/${type}/${token}`;

  const result = await $http.get<unknown, AxiosResponse<Array<ZhihuSingleDataOverviewResponse>>>(
    'https://www.zhihu.com/api/v4/creators/analysis/realtime/content/daily',
    {
      headers: {
        cookie: cookie,
        referer: referer,
        authority: 'www.zhihu.com',
      },
      params: {
        token: token,
        type: type,
        start: start,
        end: end,
      },
    },
  );

  if (result.headers.statusCode !== 200) {
    if (result.headers.statusCode === 401) {
      throw new BadRequestException('登录失效', errorCode.data_error, result.data);
    } else {
      throw new BadRequestException('请求错误', errorCode.request_error, result.data);
    }
  }

  return result.data;
};

export interface ZhihuSingleDataOverviewResponse {
  /**
   * 日期
   */
  p_date: string;

  /**
   * 阅读量
   */
  pv: number;

  /**
   * 播放量
   */
  play: number;
  show: number;

  /**
   * 赞同数
   */
  upvote: number;

  /**
   * 评论数
   */
  comment: number;

  /**
   * 喜欢数
   */
  like: number;

  /**
   * 收藏数
   */
  collect: number;

  /**
   * 分享数
   */
  share: number;
  reaction: number;
  re_pin: number;
  like_and_reaction: number;
}

/**
 * 知乎粉丝报表
 * @param cookie
 * @param days
 */
export const getDataOverviewFansAsync = async (cookie: string, days: number = 30): Promise<ZhiHuFansResponse> => {
  const url = `https://www.zhihu.com/api/v4/creators/analysis/aggregation/tab/follow/detail?day=-${days ? days : 30}`;

  const result = await $http.get(url, {
    headers: {
      cookie: cookie,
      referer: 'https://www.zhihu.com/creator/income-analysis?pageSource=creator_center_index_sidebar',
    },
  });

  if (result.status !== 200) {
    if (result.headers.statusCode === 401) {
      return { code: result?.status ?? -1, msg: '登录失效' };
    } else {
      return { code: result?.status ?? -1, msg: '请求失败' };
    }
  }

  return result.data;
};

export interface ZhiHuFansResponse {
  code?: number;
  msg?: string;
  List?: Array<{
    date: string;
    pre_follow: number;
    post_follow: number;
    cancel_follow: number;
    total_follow: number;
    active_follow: number;
    active_follow_ratio: string;
  }>;
}
