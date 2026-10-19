import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { GetTimeStamp } from '../../utils';
import { BadRequestException } from '../../error';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 网易号粉丝头部数据
 * @param cookie
 * @param realUserId 用户信息realUserId
 * @param wemediaId 用户信息wemediaId
 */
export const getDataOverviewFansStatisticAsync = async (
  cookie: string,
  realUserId: string,
  wemediaId: string,
): Promise<WangyihaoDataOverviewFansStatisticsResponse> => {
  const result = await $http.get<unknown, AxiosResponse<WangyihaoDataOverviewFansStatisticsResponse>>(
    'https://mp.163.com/wemedia/general.json',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.163.com/subscribe_v3/index.html',
        Origin: 'https://mp.163.com',
        Host: 'mp.163.com',
      },
      params: {
        _: GetTimeStamp(13),
        realUserId: realUserId,
        wemediaId: wemediaId,
      },
    },
  );

  // 请求失败
  if (result.data.code !== 1) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

/**
 * 网易号粉丝分析
 * @param cookie
 * @param realUserId 用户信息realUserId
 * @param wemediaId 用户信息wemediaId
 * @param start 开始日期（××××-××-××）
 * @param end 结束日期（××××-××-××）
 */
export const getDataOverviewFansAsync = async (
  cookie: string,
  realUserId: string,
  wemediaId: string,
  start: string,
  end: string,
): Promise<WangyihaoDataOverviewFansResponse> => {
  const result = await $http.get<unknown, AxiosResponse<WangyihaoDataOverviewFansResponse>>(
    'https://mp.163.com/wemedia/subs.json',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.163.com/subscribe_v3/index.html',
        Origin: 'https://mp.163.com',
        Host: 'mp.163.com',
      },
      params: {
        _: GetTimeStamp(13),
        realUserId: realUserId,
        wemediaId: wemediaId,
        start: start,
        end: end,
      },
    },
  );

  // 请求失败
  if (result.data.code !== 1) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

/**
 * 网易号收益头部统计数据
 * @param cookie
 * @param realUserId 用户信息realUserId
 * @param wemediaId 用户信息wemediaId
 */
export const getDataOverviewIncomeStatisticAsync = async (
  cookie: string,
  realUserId: string,
  wemediaId: string,
): Promise<WangyihaoDataOverviewIncomeStatisticsResponse> => {
  const result = await $http.get<unknown, AxiosResponse<WangyihaoDataOverviewIncomeStatisticsResponse>>(
    'https://mp.163.com/wemedia/profit/view.do',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.163.com/subscribe_v3/index.html',
        Origin: 'https://mp.163.com',
        Host: 'mp.163.com',
      },
      params: {
        _: GetTimeStamp(13),
        realUserId: realUserId,
        wemediaId: wemediaId,
      },
    },
  );

  // 请求失败
  if (result.data.code !== 1) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

/**
 * 网易号收益分析
 * @param cookie
 * @param realUserId 用户信息realUserId
 * @param wemediaId 用户信息wemediaId
 * @param start 开始日期（××××-××-××）
 * @param end 结束日期（××××-××-××）
 */
export const getDataOverviewIncomeAsync = async (
  cookie: string,
  realUserId: string,
  wemediaId: string,
  start: string,
  end: string,
): Promise<WangyihaoDataOverviewIncomeResponse> => {
  const result = await $http.get<unknown, AxiosResponse<WangyihaoDataOverviewIncomeResponse>>(
    'https://mp.163.com/wemedia/profit/list.do',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.163.com/subscribe_v3/index.html',
        Origin: 'https://mp.163.com',
        Host: 'mp.163.com',
      },
      params: {
        _: GetTimeStamp(13),
        realUserId: realUserId,
        wemediaId: wemediaId,
        start: start,
        end: end,
      },
    },
  );

  // 请求失败
  if (result.data.code !== 1) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

/**
 * 网易号内容头部统计
 * @param cookie
 * @param realUserId 用户信息realUserId
 * @param wemediaId 用户信息wemediaId
 * @param contentType 数据类型 默认图文（article: 图文，video: 视频）
 */
export const getDataOverviewStatisticAsync = async (
  cookie: string,
  realUserId: string,
  wemediaId: string,
  contentType: 'article' | 'video' = 'article',
): Promise<WangyihaoDataOverviewStatisticsResponse> => {
  let url = 'https://mp.163.com/wemedia/data/content/article/count.do';

  if (contentType === 'video') {
    url = 'https://mp.163.com/wemedia/data/content/video/count.do';
  }

  const result = await $http.get<unknown, AxiosResponse<WangyihaoDataOverviewStatisticsResponse>>(url, {
    headers: {
      cookie: cookie,
      referer: 'https://mp.163.com/subscribe_v3/index.html',
      Origin: 'https://mp.163.com',
      Host: 'mp.163.com',
    },
    params: {
      _: GetTimeStamp(13),
      realUserId: realUserId,
      wemediaId: wemediaId,
    },
  });

  // 请求失败
  if (result.data.code !== 1) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

/**
 * 网易号内容分析
 * @param cookie
 * @param realUserId 用户信息realUserId
 * @param wemediaId 用户信息wemediaId
 * @param start 开始日期（××××-××-××）
 * @param end 结束日期（××××-××-××）
 * @param contentType 数据类型 默认图文（article: 图文，video: 视频）
 * @param proxyAgent
 */
export const getDataOverviewAsync = async (
  cookie: string,
  realUserId: string,
  wemediaId: string,
  start: string,
  end: string,
  contentType: 'article' | 'video' = 'article',
  proxyAgent?: HttpsProxyAgent<string>,
): Promise<WangyihaoDataOverviewResponse> => {
  let url = 'https://mp.163.com/wemedia/data/content/article/pv/list.do';

  if (contentType === 'video') {
    url = 'https://mp.163.com/wemedia/data/content/video/pv/list.do';
  }

  const result = await $http.get<unknown, AxiosResponse<WangyihaoDataOverviewResponse>>(url, {
    headers: {
      cookie: cookie,
      referer: 'https://mp.163.com/subscribe_v3/index.html',
      Origin: 'https://mp.163.com',
      Host: 'mp.163.com',
    },
    params: {
      _: GetTimeStamp(13),
      realUserId: realUserId,
      wemediaId: wemediaId,
      start: start,
      end: end,
    },
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  // 请求失败
  if (result.data.code !== 1) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface WangyihaoDataOverviewFansStatisticsResponse {
  code: number;
  msg: string;
  data: {
    mediaTotalPv: number;
    sumSubs: number;
    incr: number;
    pvsIncr: number;
  };
}

export interface WangyihaoDataOverviewFansResponse {
  code: number;
  msg: string;
  data: {
    ename: string;
    icon: string;
    tname: string;
    list: Array<{
      ename: string;
      statsDate: string;
      sum: number;
      incr: number;
    }>;
  };
}

export interface WangyihaoDataOverviewIncomeStatisticsResponse {
  code: number;
  msg: string;
  data: {
    sumProfit: number;
    sumArticleProfit: number;
    sumVideoProfit: number;
    profit: number;
    articleProfit: number;
    videoProfit: number;
  };
}

/**
 * 网易号收益头部统计数据
 * @param cookie
 * @param realUserId 用户信息realUserId
 * @param wemediaId 用户信息wemediaId
 */
export const getDataOverviewIncomeStatisticV2Async = async (
  cookie: string,
  realUserId: string,
  wemediaId: string,
): Promise<WangyihaoDataOverviewNewIncomeStatisticsResponse> => {
  const result = await $http.get<unknown, AxiosResponse<WangyihaoDataOverviewNewIncomeStatisticsResponse>>(
    'https://mp.163.com/wemedia/profit/incomePage.do',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.163.com/subscribe_v3/index.html',
        Origin: 'https://mp.163.com',
        Host: 'mp.163.com',
      },
      params: {
        _: GetTimeStamp(13),
        realUserId: realUserId,
        wemediaId: wemediaId,
      },
    },
  );

  // 请求失败
  if (result.data.code !== 1) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface WangyihaoDataOverviewNewIncomeStatisticsResponse {
  code: number;
  msg: string;
  data: {
    profit: number;
    totalProfit: number;
    wybState: number;
    drawFlag: boolean;
    hasIncomeContract: boolean;
    hasBankCard: boolean;
    wyb: string;
    start: string;
    end: string;
    business: boolean;
  };
}

export interface WangyihaoDataOverviewIncomeResponse {
  code: number;
  msg: string;
  data: {
    total: number;
    list: Array<{
      date: string;
      income: number;
      articleIncome: number;
      videoIncome: number;
      dynamicIncome: number;
      originalArticleIncome: number;
      starIncome: number;
      articleFlowIncome: number;
      articleTalentIncome: number;
      originalVideoIncome: number;
      videoStarIncome: number;
      videoFlowIncome: number;
      videoTalentIncome: number;
    }>;
  };
}

export interface WangyihaoDataOverviewStatisticsResponse {
  code: number;
  msg: string;
  data: {
    wemediaId: string;
    totalCount: number;
    yesterdayReadCount: number;
    recommendCount: number;
  };
}

export interface WangyihaoDataOverviewItemResponse {
  /**
   * 阅读
   */
  readCount: number;

  /**
   * 展现
   */
  recommendCount: number;

  /**
   * 评论
   */
  commentCount: number;

  /**
   * 分享
   */
  shareCount: number;

  /**
   * 日期
   */
  statDate: string;
  tname: string;
  voteCount: number;
}

export interface WangyihaoDataOverviewResponse {
  code: number;
  msg: string;
  data: {
    total: number;
    list: Array<WangyihaoDataOverviewItemResponse>;
  };
}

/**
 * 网易号单篇统计数据
 * @param cookie
 * @param contentId 作品id
 * @param realUserId 用户信息realUserId
 * @param wemediaId 用户信息wemediaId
 */
export const getSingleDataOverviewStatisticAsync = async (
  cookie: string,
  contentId: string,
  realUserId: string,
  wemediaId: string,
): Promise<WangyihaoSingleDataOverviewStatisticResponse> => {
  const result = await $http.get<unknown, AxiosResponse<WangyihaoSingleDataOverviewStatisticResponse>>(
    'https://mp.163.com/wemedia/content/manage/dataView.do',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.163.com/subscribe_v3/index.html',
        Origin: 'https://mp.163.com',
        Host: 'mp.163.com',
      },
      params: {
        _: GetTimeStamp(13),
        realUserId: realUserId,
        wemediaId: wemediaId,
        contentId: contentId,
      },
    },
  );

  // 请求失败
  if (result.data.code !== 1) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface WangyihaoSingleDataOverviewStatisticResponse {
  code: number;
  msg: string;
  data: {
    /**
     * 展现量
     */
    recommendCount: number;

    /**
     * 阅读总量（播放量）
     */
    pvCount: number;

    /**
     * 平均阅读进度（平均观看时长（毫秒））
     */
    processRate: number;

    /**
     * 点赞量
     */
    voteCount: number;
    againstCount: number;

    /**
     * 评论量
     */
    commentCount: number;

    /**
     * 分享量
     */
    shareCount: number;

    /**
     * 道具获取量
     */
    propCount: number;

    /**
     * 作品id
     */
    articleId: string;
    skipId: string;
    wemediaId: string;

    /**
     * 作品标题
     */
    title: string;
  };
}

/**
 * 网易号单篇报表数据
 * @param cookie
 * @param contentId 作品id
 * @param realUserId 用户信息realUserId
 * @param wemediaId 用户信息wemediaId
 * @param startTime 开始日期
 * @param endTime 结束日期
 * @param contentType 数据类型 (0:图文，1：视频)
 */
export const getSingleDataOverviewAsync = async (
  cookie: string,
  contentId: string,
  realUserId: string,
  wemediaId: string,
  startTime: string,
  endTime: string,
  contentType: 0 | 1,
): Promise<WangyihaoSingleDataOverviewResponse> => {
  const result = await $http.get<unknown, AxiosResponse<WangyihaoSingleDataOverviewResponse>>(
    'https://mp.163.com/wemedia/contentDailyStat/list.do',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.163.com/subscribe_v3/index.html',
        Origin: 'https://mp.163.com',
        Host: 'mp.163.com',
      },
      params: {
        _: GetTimeStamp(13),
        realUserId: realUserId,
        wemediaId: wemediaId,
        contentId: contentId,
        contentType: contentType,
        startTime: startTime,
        endTime: endTime,
      },
    },
  );

  // 请求失败
  if (result.data.code !== 1) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface WangyihaoSingleDataOverviewResponse {
  code: number;
  msg: string;
  data: Array<{
    /**
     * 作品id
     */
    docId: string;

    /**
     * 作品标题
     */
    title: string;

    /**
     * 日期
     */
    date: string;

    /**
     * 阅读量（播放量）
     */
    pvWeightCount: number;

    /**
     * 展现量
     */
    recommendWeightCount: number;

    /**
     * 评论量
     */
    commentCount: number;

    /**
     * 分享量
     */
    shareCount: number;

    /**
     * 点赞
     */
    upVote: number;

    /**
     * 取消点赞
     */
    downVote: number;

    /**
     * 道具数
     */
    prop: string;
    gold: number;
  }>;
}

export const getDataDailyFansStatisticAsync = async (
  cookie: string,
  realUserId: string,
  wemediaId: string,
  startDate: string,
  endDate: string,
): Promise<DailyFansResponse> => {
  const url = 'https://mp.163.com/wemedia/subs.json';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.163.com/subscribe_v3/index.html',
    Origin: 'https://mp.163.com',
    Host: 'mp.163.com',
  };

  const params = {
    _: GetTimeStamp(13),
    realUserId: realUserId,
    wemediaId: wemediaId,
    start: startDate,
    end: endDate,
  };

  const result = await $http.get(url, {
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface DailyFansResponse {
  code: number;
  msg: string;
  data: {
    ename: string;
    icon: string;
    tname: string;
    list: Array<{
      ename: string;
      statsDate: string;
      /**
       * 总粉丝
       */
      sum: number;
      subs: number | null;
      unsubs: number | null;
      /**
       * 新增粉丝
       */
      incr: number;
      tname: string | null;
      id: string | number | null;
    }>;
  };
}
