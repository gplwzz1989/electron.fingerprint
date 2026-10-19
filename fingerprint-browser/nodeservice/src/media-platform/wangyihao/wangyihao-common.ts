import { BaseResult } from '../baseResult';
import { getContentListAsync, WangyihaoMediaContent } from './wangyihao-content-list.service';
import { AxiosError } from 'axios';
import {
  getDataDailyFansStatisticAsync,
  getDataOverviewAsync,
  getDataOverviewFansAsync,
  getDataOverviewFansStatisticAsync,
  getDataOverviewIncomeAsync,
  getDataOverviewIncomeStatisticAsync,
  getDataOverviewIncomeStatisticV2Async,
  getDataOverviewStatisticAsync,
  getSingleDataOverviewAsync,
  getSingleDataOverviewStatisticAsync,
  WangyihaoDataOverviewItemResponse,
} from './wangyihao-data-overview.service';
import { getUserHomeDataAsync, getUserInfoAsync } from './wangyihao-user.service';
import { errorCode } from '../errorCode';
import { getVideoCategoryResponse, WangyiVideoCategory } from '../wangyihao/wangyihao-category.service';
import {
  getActivityTopicAsync,
  getHotTopicAsync,
  getSearchTopicAsync,
  WangyiVideoTopicInfo,
} from '../wangyihao/wangyihao-topic.service';
import { getPayContentAsync, PayContentResponse } from '../wangyihao/wangyihao-paycontent.service';
import {
  ListItemInfoLevel,
  ListLevelInfoResponse,
  MediaStatusResultOutput,
  PlatformAuthorInfo,
  PlatformContentItem,
  PlatformContentItemNum,
} from '../../media-platform/baseModel';
import { auditStatusEnum, formatNumber, formatNumberNo, Task } from '@/utils';
import { createKuaiProxyAgent, IWebProxy, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import {
  AccountContentListViewOutPut,
  AccountReportDataOutPut,
  syncContentEventName,
  syncContentMaxPage,
} from '../data-service';
import { HttpsProxyAgent } from 'https-proxy-agent';
import dayjs from 'dayjs';
import { EventEmitter } from 'events';
import { deleteContent } from '@/media-platform/wangyihao/wangyihao-content-delete.service';
import { PubContentEnum } from '@/cloud/model/TypeEnum';

/**
 * 网易号内容管理
 * @param cookie
 * @param realUserId 用户信息realUserId
 * @param wemediaId 用户信息wemediaId
 * @param page 页码
 * @param pageSize 每页数量
 * @param contentType 内容类型 默认全部（0：全部，4：图文，2：视频，6：动态）
 * @param contentState 内容状态 默认全部（-1：全部，3：已发布，2：未通过，1：审核中，8：待发布）
 * @param start 开始日期
 * @param end 结束日期
 */
export const getWangyihaoContentList = async (
  cookie: string,
  realUserId: string,
  wemediaId: string,
  page: number = 1,
  pageSize: number = 10,
  contentType: 0 | 2 | 4 | 6 = 0,
  contentState: -1 | 1 | 2 | 3 | 8 = -1,
  start?: Date | undefined,
  end?: Date | undefined,
) => {
  const result: WangyihaoContentListOutput = {
    code: 0,
    msg: '',
  };

  try {
    let start_date_str = '';
    if (start) {
      start_date_str = start.toISOString();
      if (start_date_str.length > 0) {
        start_date_str = start_date_str.slice(0, 10);
      }
    }

    let end_date_str = '';
    if (end) {
      end_date_str = end.toISOString();
      if (end_date_str.length > 0) {
        end_date_str = end_date_str.slice(0, 10);
      }
    }

    const contentListResult = await getContentListAsync(
      cookie,
      realUserId,
      wemediaId,
      page,
      pageSize,
      contentType,
      contentState,
      start_date_str,
      end_date_str,
    );

    result.code = contentListResult.code === 1 ? 0 : contentListResult.code;
    result.msg = contentListResult.msg;
    result.data = contentListResult.data;
    result.raw = contentListResult;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface WangyihaoContentListOutput extends BaseResult {
  data?: {
    total: number;
    list: Array<WangyihaoMediaContent>;
  };

  raw?: unknown;
}

/**
 * 网易号内容分析
 * @param cookie
 * @param realUserId 用户信息realUserId
 * @param wemediaId 用户信息wemediaId
 * @param start 开始日期 Date
 * @param end 结束日期 Date
 * @param contentType 数据类型（图文：article，视频：video）
 */
export const getWangyihaoDataOverview = async (
  cookie: string,
  realUserId: string,
  wemediaId: string,
  start: Date,
  end: Date,
  contentType: 'article' | 'video' = 'article',
) => {
  const result: WangyihaoDataOverviewOutput = {
    code: 0,
    msg: '',
  };

  try {
    let start_date_str = start.toISOString();
    if (start_date_str.length > 0) {
      start_date_str = start_date_str.slice(0, 10);
    }

    let end_date_str = end.toISOString();
    if (end_date_str.length > 0) {
      end_date_str = end_date_str.slice(0, 10);
    }

    const dataOverviewResult = await getDataOverviewAsync(
      cookie,
      realUserId,
      wemediaId,
      start_date_str,
      end_date_str,
      contentType,
    );

    result.code = dataOverviewResult.code === 1 ? 0 : dataOverviewResult.code;
    result.msg = dataOverviewResult.msg;
    result.data = dataOverviewResult.data;
    result.raw = dataOverviewResult;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface WangyihaoDataOverviewOutput extends BaseResult {
  data?: {
    total: number;
    list: Array<WangyihaoDataOverviewItemResponse>;
  };

  raw?: unknown;
}

/**
 * 网易号内容头部统计
 * @param cookie
 * @param realUserId 用户信息realUserId
 * @param wemediaId 用户信息wemediaId
 * @param contentType 数据类型 默认图文（article: 图文，video: 视频）
 */
export const getWangyihaoDataOverviewStatistics = async (
  cookie: string,
  realUserId: string,
  wemediaId: string,
  contentType: 'article' | 'video' = 'article',
) => {
  const result: WangyihaoDataOverviewStatisticsOutput = {
    code: 0,
    msg: '',
  };

  try {
    const dataOverviewStatisticsResult = await getDataOverviewStatisticAsync(
      cookie,
      realUserId,
      wemediaId,
      contentType,
    );

    result.code = dataOverviewStatisticsResult.code === 1 ? 0 : dataOverviewStatisticsResult.code;
    result.msg = dataOverviewStatisticsResult.msg;
    result.data = dataOverviewStatisticsResult.data;
    result.raw = dataOverviewStatisticsResult;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface WangyihaoDataOverviewStatisticsOutput extends BaseResult {
  data?: {
    wemediaId: string;

    /**
     * 总阅读数
     */
    totalCount: number;

    /**
     * 昨日阅读数
     */
    yesterdayReadCount: number;

    /**
     * 昨日展现
     */
    recommendCount: number;
  };

  raw?: unknown;
}

/**
 * 网易号收益分析
 * @param cookie
 * @param realUserId 用户信息realUserId
 * @param wemediaId 用户信息wemediaId
 * @param start 开始日期 Date
 * @param end 结束日期 Date
 */
export const getWangyihaoDataOverviewIncome = async (
  cookie: string,
  realUserId: string,
  wemediaId: string,
  start: Date,
  end: Date,
) => {
  const result: WangyihaoDataOverviewIncomeOutput = {
    code: 0,
    msg: '',
  };

  try {
    let start_date_str = start.toISOString();
    if (start_date_str.length > 0) {
      start_date_str = start_date_str.slice(0, 10);
    }

    let end_date_str = end.toISOString();
    if (end_date_str.length > 0) {
      end_date_str = end_date_str.slice(0, 10);
    }

    const dataOverviewIncomeResult = await getDataOverviewIncomeAsync(
      cookie,
      realUserId,
      wemediaId,
      start_date_str,
      end_date_str,
    );

    result.code = dataOverviewIncomeResult.code === 1 ? 0 : dataOverviewIncomeResult.code;
    result.msg = dataOverviewIncomeResult.msg;
    result.data = dataOverviewIncomeResult.data;
    result.raw = dataOverviewIncomeResult;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface WangyihaoDataOverviewIncomeOutput extends BaseResult {
  data?: {
    total: number;
    list: Array<{
      date: string;
      /**
       * 图文总收益
       */
      income: number;

      /**
       * 图文等级加成
       */
      starIncome: number;
      articleIncome: number;

      /**
       * 图文流量收益
       */
      articleFlowIncome: number;
      articleTalentIncome: number;

      /**
       * 视频总收益
       */
      videoIncome: number;
      dynamicIncome: number;

      /**
       * 图文原创加成
       */
      originalArticleIncome: number;

      /**
       * 视频原创加成
       */
      originalVideoIncome: number;

      /**
       * 视频等级加成
       */
      videoStarIncome: number;

      /**
       * 视频流量收益
       */
      videoFlowIncome: number;
      videoTalentIncome: number;
    }>;
  };

  raw?: unknown;
}

/**
 * 网易号收益头部统计数据
 * @param cookie
 * @param realUserId 用户信息realUserId
 * @param wemediaId 用户信息wemediaId
 */
export const getWangyihaoDataOverviewIncomeStatistics = async (
  cookie: string,
  realUserId: string,
  wemediaId: string,
) => {
  const result: WangyihaoDataOverviewIncomeStatisticsOutput = {
    code: 0,
    msg: '',
  };

  try {
    const dataOverviewIncomeStatisticsResult = await getDataOverviewIncomeStatisticAsync(cookie, realUserId, wemediaId);

    result.code = dataOverviewIncomeStatisticsResult.code === 1 ? 0 : dataOverviewIncomeStatisticsResult.code;
    result.msg = dataOverviewIncomeStatisticsResult.msg;
    result.data = dataOverviewIncomeStatisticsResult.data;
    result.raw = dataOverviewIncomeStatisticsResult;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface WangyihaoDataOverviewIncomeStatisticsOutput extends BaseResult {
  data?: {
    /**
     * 总收益
     */
    sumProfit: number;

    /**
     * 图文总收益
     */
    sumArticleProfit: number;

    /**
     * 视频总收益
     */
    sumVideoProfit: number;

    profit: number;

    /**
     * 图文昨日新增收益
     */
    articleProfit: number;

    /**
     * 视频昨日新增收益
     */
    videoProfit: number;
  };

  raw?: unknown;
}

/**
 * 网易号收益头部统计数据
 * @param cookie
 * @param realUserId 用户信息realUserId
 * @param wemediaId 用户信息wemediaId
 */
export const getWangyihaoDataOverviewNewIncomeStatistics = async (
  cookie: string,
  realUserId: string,
  wemediaId: string,
) => {
  const result: WangyihaoDataOverviewNewIncomeStatisticsOutput = {
    code: 0,
    msg: '',
  };

  try {
    const dataOverviewIncomeStatisticsResult = await getDataOverviewIncomeStatisticV2Async(
      cookie,
      realUserId,
      wemediaId,
    );

    result.code = dataOverviewIncomeStatisticsResult.code === 1 ? 0 : dataOverviewIncomeStatisticsResult.code;
    result.msg = dataOverviewIncomeStatisticsResult.msg;
    result.data = dataOverviewIncomeStatisticsResult.data;
    result.raw = dataOverviewIncomeStatisticsResult;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface WangyihaoDataOverviewNewIncomeStatisticsOutput extends BaseResult {
  data?: {
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

  raw?: unknown;
}

/**
 * 网易号粉丝分析
 * @param cookie
 * @param realUserId 用户信息realUserId
 * @param wemediaId 用户信息wemediaId
 * @param start 开始日期 Date
 * @param end 结束日期 Date
 */
export const getWangyihaoDataOverviewFans = async (
  cookie: string,
  realUserId: string,
  wemediaId: string,
  start: Date,
  end: Date,
) => {
  const result: WangyihaoDataOverviewFansOutput = {
    code: 0,
    msg: '',
  };

  try {
    let start_date_str = start.toISOString();
    if (start_date_str.length > 0) {
      start_date_str = start_date_str.slice(0, 10);
    }

    let end_date_str = end.toISOString();
    if (end_date_str.length > 0) {
      end_date_str = end_date_str.slice(0, 10);
    }

    const dataOverviewFansResult = await getDataOverviewFansAsync(
      cookie,
      realUserId,
      wemediaId,
      start_date_str,
      end_date_str,
    );

    result.code = dataOverviewFansResult.code === 1 ? 0 : dataOverviewFansResult.code;
    result.msg = dataOverviewFansResult.msg;
    result.data = dataOverviewFansResult.data;
    result.raw = dataOverviewFansResult;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface WangyihaoDataOverviewFansOutput extends BaseResult {
  data?: {
    ename: string;
    icon: string;
    tname: string;
    list: Array<{
      ename: string;

      /**
       * 日期
       */
      statsDate: string;

      /**
       * 总粉丝数
       */
      sum: number;

      /**
       * 新增粉丝数
       */
      incr: number;
    }>;
  };

  raw?: unknown;
}

/**
 * 网易号粉丝头部数据
 * @param cookie
 * @param realUserId 用户信息realUserId
 * @param wemediaId 用户信息wemediaId
 */
export const getWangyihaoDataOverviewFansStatistics = async (cookie: string, realUserId: string, wemediaId: string) => {
  const result: WangyihaoDataOverviewFansStatisticsOutput = {
    code: 0,
    msg: '',
  };

  try {
    const dataOverviewFansStatisticsResult = await getDataOverviewFansStatisticAsync(cookie, realUserId, wemediaId);

    result.code = dataOverviewFansStatisticsResult.code === 1 ? 0 : dataOverviewFansStatisticsResult.code;
    result.msg = dataOverviewFansStatisticsResult.msg;
    result.data = dataOverviewFansStatisticsResult.data;
    result.raw = dataOverviewFansStatisticsResult;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface WangyihaoDataOverviewFansStatisticsOutput extends BaseResult {
  data?: {
    mediaTotalPv: number;
    /**
     * 粉丝数
     */
    sumSubs: number;

    /**
     * 昨日新增粉丝
     */
    incr: number;
    pvsIncr: number;
  };

  raw?: unknown;
}

/**
 * 网易号首页数据
 * @param cookie
 * @param realUserId 用户信息realUserId
 * @param wemediaId 用户信息wemediaId
 */
export const getWangyihaoUserHomeData = async (cookie: string, realUserId: string, wemediaId: string) => {
  const result: WangyihaoUserHomeDataOutput = {
    code: 0,
    msg: '',
  };

  try {
    const userInfoHomeDataResult = await getUserHomeDataAsync(cookie, realUserId, wemediaId);

    result.code = userInfoHomeDataResult.code === 1 ? 0 : userInfoHomeDataResult.code;
    result.msg = userInfoHomeDataResult.msg;
    result.data = userInfoHomeDataResult.data;
    result.raw = userInfoHomeDataResult;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface WangyihaoUserHomeDataOutput extends BaseResult {
  data?: {
    wemediaId: string;

    /**
     * 总阅读数
     */
    totalReadCount: number;

    /**
     * 昨日阅读数
     */
    yesterdayReadCount: number;

    /**
     * 总粉丝数
     */
    totalSubscribeCount: number;

    /**
     * 昨日关注数
     */
    yesterdaySubscribeCount: number;
    totalIndex: number;

    /**
     * 总展现量
     */
    totalRecommendCount: number;

    /**
     * 昨日展现量
     */
    yesterdayRecommendCount: number;

    /**
     * 总收益
     */
    sumProfit: number;

    /**
     * 昨日收益
     */
    profit: number;

    /**
     * 总互动
     */
    totalInteract: number;

    /**
     * 昨日互动
     */
    yesterdayInteract: number;
  };

  raw?: unknown;
}

/**
 * 网易号用户信息
 * @param cookie
 */
export const getWangyihaoUserInfo = async (cookie: string, proxy?: IWebProxy) => {
  const result: WangyihaoUserInfoOutput = {
    code: 0,
    msg: '',
  };

  try {
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfoResult = await getUserInfoAsync(cookie, webProxy);

    result.yixiaoerId = userInfoResult?.data?.wemediaId?.toString();
    result.yixiaoerName = userInfoResult?.data?.tname?.toString();
    result.yixiaoerImageUrl = userInfoResult?.data?.icon?.toString();
    result.raw = userInfoResult?.data;
    result.code = userInfoResult.code === 1 ? 0 : userInfoResult.code;
    result.msg = userInfoResult.msg;
    result.data = userInfoResult.data;
    if (!(userInfoResult?.data?.maxDailyPublishCount > 0)) {
      result.verify = false;
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
    result.code = errorCode.exception;
  }

  return result;
};

export interface WangyihaoUserInfoOutput extends PlatformAuthorInfo {
  data?: {
    /**
     * 昵称
     */
    tname: string;

    /**
     * 头像
     */
    icon: string;

    /**
     * userid
     */
    userId: string;

    /**
     * 真实userid
     */
    realUserId: string;

    wemediaId: string;
  };
}

export interface WangyihaoTopicInfoOutput extends BaseResult {}

/**
 * 网易号单篇统计数据
 * @param cookie
 * @param contentId 作品id
 * @param realUserId 用户信息realUserId
 * @param wemediaId 用户信息wemediaId
 */
export const getWangyihaoSingleDataOverviewStatistic = async (
  cookie: string,
  contentId: string,
  realUserId: string,
  wemediaId: string,
): Promise<WangyihaoSingleDataOverviewStatisticOutput> => {
  const result: WangyihaoSingleDataOverviewStatisticOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const singleDataOverviewStatisticResult = await getSingleDataOverviewStatisticAsync(
      cookie,
      contentId,
      realUserId,
      wemediaId,
    );

    result.code = singleDataOverviewStatisticResult.code === 1 ? 0 : singleDataOverviewStatisticResult.code;
    result.msg = singleDataOverviewStatisticResult.msg;
    result.data = singleDataOverviewStatisticResult.data;
    result.raw = singleDataOverviewStatisticResult;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface WangyihaoSingleDataOverviewStatisticOutput extends BaseResult {
  data?: {
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

  raw?: unknown;
}

/**
 * 网易号单篇报表数据
 * @param cookie
 * @param contentId 作品id
 * @param realUserId 用户信息realUserId
 * @param wemediaId 用户信息wemediaId
 * @param startTime 开始日期 Date
 * @param endTime 结束日期 Date
 * @param contentType 数据类型 (0:图文，1：视频)
 */
export const getWangyihaoSingleDataOverview = async (
  cookie: string,
  contentId: string,
  realUserId: string,
  wemediaId: string,
  startTime: Date,
  endTime: Date,
  contentType: 0 | 1,
): Promise<WangyihaoSingleDataOverviewOutput> => {
  const result: WangyihaoSingleDataOverviewOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    let start_date_str = startTime.toISOString();
    if (start_date_str.length > 0) {
      start_date_str = start_date_str.slice(0, 10);
    }

    let end_date_str = endTime.toISOString();
    if (end_date_str.length > 0) {
      end_date_str = end_date_str.slice(0, 10);
    }

    const singleDataOverviewResult = await getSingleDataOverviewAsync(
      cookie,
      contentId,
      realUserId,
      wemediaId,
      start_date_str,
      end_date_str,
      contentType,
    );

    result.code = singleDataOverviewResult.code === 1 ? 0 : singleDataOverviewResult.code;
    result.msg = singleDataOverviewResult.msg;
    result.data = singleDataOverviewResult.data;
    result.raw = singleDataOverviewResult;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface WangyihaoSingleDataOverviewOutput extends BaseResult {
  data?: Array<{
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

  raw?: unknown;
}

/**
 * 获取分类
 * @param cookie
 * @param wemediaId  用户id
 */
export const getWangyihaoCategory = async (cookie: string, wemediaId: string): Promise<WangyihaoCategoryOutput> => {
  const result: WangyihaoCategoryOutput = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    if (!wemediaId) {
      const userInfo = await getUserInfoAsync(cookie);
      wemediaId = userInfo?.data?.wemediaId;
    }
    const categoryResult = await getVideoCategoryResponse(cookie, wemediaId);
    if (categoryResult.data?.length) {
      let i = 0;
      for (const item of categoryResult.data) {
        i++;
        const firstCate: ListItemInfoLevel = {
          yixiaoerId: i.toString() ?? '',
          yixiaoerName: item.categoryName,
        };
        if (item.subCategoryList?.length) {
          firstCate.child = [];
          let j = 0;
          for (const child of item.subCategoryList) {
            j++;
            if (child.subCategoryList?.length) {
              for (const chdr of child.subCategoryList) {
                j++;
                firstCate.child?.push({
                  yixiaoerId: j?.toString() ?? '',
                  yixiaoerName: `${child.categoryName}/${chdr.categoryName}`,
                  //raw: child,
                });
              }
              child.subCategoryList = [];
            } else {
              child.subCategoryList = [];
              firstCate.child?.push({
                yixiaoerId: j?.toString() ?? '',
                yixiaoerName: child.categoryName,
                raw: child,
              });
            }
          }
        }
        item.subCategoryList = [];
        firstCate.raw = item;
        result.dataList?.push(firstCate);
      }
    }
    result.code = categoryResult.code === 1 ? 0 : categoryResult.code;
    result.msg = categoryResult.msg;
    result.data = categoryResult.data;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface WangyihaoCategoryOutput extends ListLevelInfoResponse {
  /**
   * 分类数据列表
   */
  data?: Array<WangyiVideoCategory>;
}

/**
 * 获取活动话题
 * @param cookie
 * @param realUserId 用户信息realUserId
 * @param wemediaId 用户信息wemediaId
 */
export const getWangyihaoActivityTopic = async (
  cookie: string,
  realUserId: string,
  wemediaId: string,
): Promise<WangyihaoActivityTopicOutput> => {
  const result: WangyihaoActivityTopicOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const activityTopicResult = await getActivityTopicAsync(cookie, realUserId, wemediaId);

    result.code = activityTopicResult.code === 1 ? 0 : activityTopicResult.code;
    result.msg = activityTopicResult.msg;
    result.data = activityTopicResult.data;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface WangyihaoActivityTopicOutput extends BaseResult {
  data?: Array<{
    /**
     * 活动id
     */
    activityId: string;

    /**
     * 活动名称
     */
    activityName: string;

    /**
     * 活动地址
     */
    activityUrl: string;

    /**
     * 话题id
     */
    subjectId: string;

    /**
     * 话题名称
     */
    subjectTitle: string;
  }>;
}

/**
 * 获取热点话题
 * @param cookie
 * @param realUserId 用户信息realUserId
 * @param wemediaId 用户信息wemediaId
 */
export const getWangyihaoHotTopic = async (
  cookie: string,
  wemediaId: string,
  realUserId: string = '',
): Promise<WangyihaoTopTopicOutput> => {
  const result: WangyihaoTopTopicOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const topTopicResult = await getHotTopicAsync(cookie, realUserId, wemediaId);

    result.code = topTopicResult.code === 1 ? 0 : topTopicResult.code;
    result.msg = topTopicResult.msg;
    result.data = topTopicResult.data;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface WangyihaoTopTopicOutput extends BaseResult {
  data?: {
    total: number;
    list: Array<WangyiVideoTopicInfo>;
  };
}

/**
 * 搜索话题
 * @param cookie
 * @param realUserId 用户信息realUserId
 * @param wemediaId 用户信息wemediaId
 * @param keyword 搜索关键字
 * @param pageNo 页码
 * @param size 每页数量
 */
export const getWangyihaoSearchTopic = async (
  cookie: string,
  wemediaId: string,
  keyword: string,
  pageNo: number = 1,
  size: number = 10,
  realUserId: string = '',
): Promise<WangyihaoSearchTopicOutput> => {
  const result: WangyihaoSearchTopicOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const searchTopicResult = await getSearchTopicAsync(cookie, realUserId, wemediaId, keyword, pageNo, size);

    result.code = searchTopicResult.code === 1 ? 0 : searchTopicResult.code;
    result.msg = searchTopicResult.msg;
    result.data = searchTopicResult.data;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface WangyihaoSearchTopicOutput extends BaseResult {
  data?: {
    total: number;
    list: Array<WangyiVideoTopicInfo>;
  };
}

/**
 * 获取付费内容
 * @param cookie
 * @param realUserId 用户信息realUserId
 * @param wemediaId 用户信息wemediaId
 * @param keyword 搜索关键字
 * @param categoryStr 分类字符串（使用,分隔）
 * @param ename 用户ename
 * @param columnTypeList 付费类型 ‘’ 单篇付费， ‘1’ 文章专栏，‘3’ 视频专栏 ‘5’ 短剧专栏
 */
export const getWangyihaoPayContent = async (
  cookie: string,
  realUserId: string,
  wemediaId: string,
  keyword: string,
  categoryStr: string,
  ename: string,
  columnTypeList: '' | '1' | '3' | '5' = '',
): Promise<WangyihaoPayContentOutput> => {
  const result: WangyihaoPayContentOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const searchTopicResult = await getPayContentAsync(
      cookie,
      realUserId,
      wemediaId,
      keyword,
      categoryStr,
      ename,
      columnTypeList,
    );

    result.code = searchTopicResult.code === 1 ? 0 : searchTopicResult.code;
    result.msg = searchTopicResult.msg;
    result.data = searchTopicResult.data;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface WangyihaoPayContentOutput extends BaseResult {
  data?: Array<PayContentResponse>;
}

/**
 * 获取已发布作品的审核状态
 * @param cookie
 * @param publishId  发布时产生的publishId
 * @param mediaType 'video' | 'article' | 'dynamic'  视频  长图文  动态（短文）
 * @param realUserId 可选参数，来自获取用户信息接口
 * @param wemediaId
 * @param maxPage 可选参数, 查询最大翻页数，默认10页
 */
export const getWangyihaoMediaStatus = async (
  cookie: string,
  publishId: string,
  mediaType: 'video' | 'article' | 'dynamic' = 'video',
  realUserId?: string,
  wemediaId?: string,
  maxPage: number = 10,
): Promise<MediaStatusResultOutput> => {
  const result: MediaStatusResultOutput = {
    code: -1,
    msg: '',
    publishId: publishId,
  };

  try {
    if (!realUserId) {
      const userInfo = await getWangyihaoUserInfo(cookie);
      realUserId = userInfo?.data?.realUserId;
      wemediaId = userInfo.data?.wemediaId;
      if (!realUserId) {
        result.msg = '登录失效';
        return result;
      }
    }
    let mediaResult: WangyihaoContentListOutput | undefined = undefined;
    for (let i = 1; i < maxPage; i++) {
      mediaResult = await getWangyihaoContentList(cookie, realUserId, wemediaId ?? '', i);

      if (mediaResult?.data?.list?.length) {
        for (const item of mediaResult.data.list) {
          const findDocid =
            mediaType === 'video' ? item.skipId : mediaType === 'article' ? item.articleId : item.articleId;
          if (findDocid == publishId) {
            result.code = 0;
            result.msg = '';
            switch (item.contentState) {
              case 0:
                result.auditStatus = auditStatusEnum.draft;
                break;
              case 1:
                result.auditStatus = auditStatusEnum.inAudit;
                break;
              case 2:
                result.auditStatus = auditStatusEnum.deny;
                break;
              case 3:
                result.auditStatus = auditStatusEnum.published;
                break;
              case 4:
                result.auditStatus = auditStatusEnum.waitExecute;
                break;
              case 5:
                result.auditStatus = auditStatusEnum.executeFail;
                break;
              case 6:
                result.auditStatus = auditStatusEnum.customWithdrawn;
                break;
              case 7:
                result.auditStatus = auditStatusEnum.customWithdrawn;
                break;
              case 8:
                result.auditStatus = auditStatusEnum.prePublish;
                break;
              case 10:
                result.auditStatus = auditStatusEnum.executeFail;
                break;
              default:
                result.auditStatus = auditStatusEnum.draft;
                break;
            }

            result.create_time = item.publishTime;
            if (result.auditStatus === auditStatusEnum.published) {
              if (mediaType === 'article') {
                result.openUrl = `https://www.163.com/dy/article/${findDocid}.html`;
              } else if (mediaType === 'video') {
                result.openUrl = `https://www.163.com/v/video/${findDocid}.html`;
              }
            }

            result.publishId = findDocid;
            result.docId = item.articleId;
            result.coverUrl = item.picUrl;
            return result;
          }
        }
      } else {
        result.code = mediaResult?.code ?? -1;
        result.msg = '未找到作品';
        return result;
      }
    }
    result.code = mediaResult?.code ?? -1;
    result.msg = '未找到作品';
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }
  result.code = -1;
  result.msg = '未找到作品';
  return result;
};

/**
 *
 * @param cookie
 * @param days 1: 7天数据，2: 30天数据,3: 90天数据
 * @param type video:视频 dynamic:图文
 * @param proxy
 */
export const geWangyihaoOverViewDashboard = async (
  cookie: string,
  days: 1 | 2 | 3 = 2,
  type: 'video' | 'article',
  proxy?: KuaiDaiLiProxy,
): Promise<AccountReportDataOutPut> => {
  const result: AccountReportDataOutPut = {
    code: 0,
    msg: '',
    data: [],
  };

  const names =
    type === 'video'
      ? [
          { name: '总粉丝', key: 'totalFansCount' },
          { name: '总阅读', key: 'totalReadsCount' },
          { name: '总收益', key: 'totalProfitsCount' },
          { name: '播放', key: 'playCount' },
          { name: '展现', key: 'impressionCount' },
          { name: '跟帖', key: 'commentCount' },
          { name: '分享', key: 'shareCount' },
          { name: '新增粉丝', key: 'fansCount' },
        ]
      : [
          { name: '总粉丝', key: 'totalFansCount' },
          { name: '总阅读', key: 'totalReadsCount' },
          { name: '总收益', key: 'totalProfitsCount' },
          { name: '阅读', key: 'readCount' },
          { name: '展现', key: 'impressionCount' },
          { name: '跟帖', key: 'commentCount' },
          { name: '分享', key: 'shareCount' },
          { name: '新增粉丝', key: 'fansCount' },
        ];

  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }

    const newOverView = {
      all: {
        overview: {},
        thirtydays: {},
      },
      video: {
        overview: {},
        thirtydays: {},
      },
      article: {
        overview: {},
        thirtydays: {},
      },
    };
    result.dataObj = newOverView as never;
    const user = await getUserInfoAsync(cookie, webProxy);
    //总粉丝、总阅读、总收益
    //图文:
    // 展现、跟帖、分享
    // 视频:
    // 播放、展现、跟帖、分享
    const fansData = await getUserHomeDataAsync(cookie, user?.data?.realUserId, user?.data?.wemediaId, webProxy);
    if (fansData?.data?.totalReadCount != undefined) {
      result.data?.push({
        name: '总粉丝',
        key: 'totalFansCount',
        value: formatNumber(fansData?.data?.totalSubscribeCount),
        list: [],
      });
      result.data?.push({
        name: '总阅读',
        key: 'totalReadsCount',
        value: formatNumber(fansData?.data?.totalReadCount),
        list: [],
      });
      result.data?.push({
        name: '总收益',
        key: 'totalProfitsCount',
        value: formatNumber(fansData?.data?.sumProfit),
        list: [],
      });
      newOverView.all.overview['totalFansCount'] = formatNumberNo(fansData?.data?.totalSubscribeCount);
      newOverView.all.overview['totalReadsCount'] = formatNumberNo(fansData?.data?.totalReadCount);
      newOverView.all.overview['totalProfitsCount'] = formatNumberNo(fansData?.data?.sumProfit);
    } else {
      result.code = fansData?.code ?? errorCode.data_error;
      throw new Error(fansData?.msg ?? '未获取到数据');
    }

    const now = new Date();
    let startTs = new Date(now.setDate(now.getDate() - 30));
    if (days === 1) {
      startTs = new Date(now.setDate(now.getDate() - 7));
    } else if (days === 3) {
      startTs = new Date(now.setDate(now.getDate() - 90));
    }

    const endNow = dayjs().add(-1, 'days').toDate();

    const reportData = await getDataOverviewAsync(
      cookie,
      user.data.realUserId,
      user.data.wemediaId,
      dayjs(startTs).format('YYYY-MM-DD'),
      dayjs(endNow).format('YYYY-MM-DD'),
      type,
    );

    if (reportData?.data?.list?.length) {
      //图文:
      // 展现、跟帖、分享
      // 视频
      // 播放、展现、跟帖、分享
      const dateMap: Map<string, number> = new Map<string, number>();
      reportData.data.list.forEach((obj) => {
        dateMap.set(obj.statDate, new Date(obj.statDate).getTime());
      });
      let total = formatNumberNo(
        reportData?.data?.list
          .map((obj) => obj.readCount)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const playRead = {
        name: type === 'video' ? '播放' : '阅读',
        key: type === 'video' ? 'playCount' : 'readCount',
        value: formatNumber(total),
        list: reportData?.data?.list.map((obj) => ({
          date: dateMap.get(obj.statDate) ?? new Date(obj.statDate).getTime(),
          value: obj.readCount,
        })),
      };
      result.data?.push(playRead);
      if (type === 'video') {
        newOverView.video.overview[playRead.key] = total;
        newOverView.video.thirtydays[playRead.key] = playRead.list;
      } else {
        newOverView.article.overview[playRead.key] = total;
        newOverView.article.thirtydays[playRead.key] = playRead.list;
      }

      total = formatNumberNo(
        reportData?.data?.list
          .map((obj) => obj.recommendCount)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const recm = {
        name: '展现',
        key: 'impressionCount',
        value: formatNumber(total),
        list: reportData?.data?.list.map((obj) => ({
          date: dateMap.get(obj.statDate) ?? new Date(obj.statDate).getTime(),
          value: obj.recommendCount,
        })),
      };
      result.data?.push(recm);
      if (type === 'video') {
        newOverView.video.overview[recm.key] = total;
        newOverView.video.thirtydays[recm.key] = recm.list;
      } else {
        newOverView.article.overview[recm.key] = total;
        newOverView.article.thirtydays[recm.key] = recm.list;
      }

      total = formatNumberNo(
        reportData?.data?.list
          .map((obj) => obj.commentCount)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const comment = {
        name: '跟帖',
        key: 'commentCount',
        value: formatNumber(total),
        list: reportData?.data?.list.map((obj) => ({
          date: dateMap.get(obj.statDate) ?? new Date(obj.statDate).getTime(),
          value: obj.commentCount,
        })),
      };
      result.data?.push(comment);
      if (type === 'video') {
        newOverView.video.overview[comment.key] = total;
        newOverView.video.thirtydays[comment.key] = comment.list;
      } else {
        newOverView.article.overview[comment.key] = total;
        newOverView.article.thirtydays[comment.key] = comment.list;
      }

      total = formatNumberNo(
        reportData?.data?.list
          .map((obj) => obj.shareCount)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const share = {
        name: '分享',
        key: 'shareCount',
        value: formatNumber(total),
        list: reportData?.data?.list.map((obj) => ({
          date: dateMap.get(obj.statDate) ?? new Date(obj.statDate).getTime(),
          value: obj.shareCount,
        })),
      };
      result.data?.push(share);
      if (type === 'video') {
        newOverView.video.overview[share.key] = total;
        newOverView.video.thirtydays[share.key] = share.list;
      } else {
        newOverView.article.overview[share.key] = total;
        newOverView.article.thirtydays[share.key] = share.list;
      }
    } else {
      result.code = reportData['code'] ?? -1;
      result.msg = reportData?.msg;
    }

    //粉丝数
    const fansResult = await getDataDailyFansStatisticAsync(
      cookie,
      user.data.realUserId,
      user.data.wemediaId,
      dayjs(startTs).format('YYYY-MM-DD'),
      dayjs(endNow).format('YYYY-MM-DD'),
    );
    if (fansResult?.data?.list?.length) {
      const total = formatNumberNo(
        fansResult.data.list
          .map((obj) => obj.incr)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const fan = {
        name: '新增粉丝',
        key: 'fansCount',
        value: formatNumber(total),
        list: fansResult.data.list?.map((obj) => ({
          date: new Date(obj.statsDate).getTime() ?? 0,
          value: obj.incr,
        })),
      };
      result.data?.push(fan);
      newOverView.all.overview[fan.key] = total;
      newOverView.all.thirtydays[fan.key] = fan.list;
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  if (result?.data && result?.data?.length > 0) {
    result.code = 0;
  } else {
    result.code = -1;
  }
  const dataList = result.data ?? [];
  result.data = [];
  for (const { name, key } of names) {
    const tmp = dataList.find((item) => item.name === name);
    result.data.push(tmp ?? { name: name, key: key, value: '-', list: [] });
  }
  return result;
};

/**
 * 获取企网易号指定天数内公开作品数据
 * @param cookie
 * @param eventCallBack
 * @param type
 * @param days
 * @param maxCount
 * @param isHeader
 * @param proxy
 */
export const getWangyihaoContentListView = async (
  cookie: string,
  type: 'video' | 'article' | 'all',
  eventCallBack?: EventEmitter,
  days: number = 7,
  maxCount: number = 20,
  isHeader: boolean = false,
  proxy?: KuaiDaiLiProxy,
): Promise<AccountContentListViewOutPut> => {
  const result: AccountContentListViewOutPut = {
    code: 0,
    msg: '',
    data: [],
  };
  result.data = [];
  result.dataList = [];
  try {
    //封面、标题、发布时间、作品类型
    // 展现、观看、顶、跟帖互动
    const lastDate = dayjs().add(-days, 'days').toDate();
    result.headers = [
      { name: '封面', key: 'cover' },
      { name: '标题', key: 'title' },
      { name: '发布时间', key: 'date' },
      { name: '展现', key: 'reCommand' },
      { name: '观看', key: 'read' },
      { name: '顶', key: 'great' },
      { name: '跟帖互动', key: 'comment' },
      // { name: '分享', key: 'share' },
      // { name: '收藏', key: 'collect' },
      // { name: '喜欢', key: 'like' },
    ];
    if (isHeader) {
      return result;
    }
    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const user = await getUserInfoAsync(cookie, webProxy);
    let contenttMPiD = '';
    for (let i = 1; i < syncContentMaxPage; i++) {
      const contentList = await getContentListAsync(
        cookie,
        user?.data?.realUserId,
        user?.data?.wemediaId,
        i,
        10,
        type === 'video' ? 2 : type === 'article' ? 4 : 0,
        3,
        undefined,
        undefined,
        webProxy,
      );
      if (contentList?.data?.list?.length) {
        if (contentList.data.list[0].articleId === contenttMPiD) {
          break;
        } else {
          contenttMPiD = contentList.data.list[0].articleId;
        }
        let j = 0;
        for (const item of contentList?.data.list) {
          j++;
          if (item.contentType != 1 && item.contentType != 2) {
            continue;
          }
          const date = dayjs(item?.publishTime).toDate();
          if (lastDate > date || result.data.length >= maxCount) {
            //前面可能会有三个置顶的
            if (j <= 3) {
              continue;
            }
            eventCallBack?.emit(syncContentEventName, { ...result });
            return result;
          }
          const dateStr = dayjs(date).format('YYYY-MM-DD HH:mm:ss');
          const newItem: PlatformContentItem = {
            id: item.articleId,
            cover: item.picUrl,
            title: item.title,
            date: dateStr,
            reCommand: formatNumber(item.recommendCount),
            read: formatNumber(item.pvCount),
            comment: formatNumber(item.commentCount),
            great: formatNumber(item.praiseCount),
            type: item.contentType === 2 ? 'video' : item.contentType === 1 ? 'article' : 'dynamic',
          };
          const newItemNum: PlatformContentItemNum = {
            id: item.articleId,
            cover: item.picUrl,
            title: item.title,
            date: dateStr,
            reCommand: formatNumberNo(item.recommendCount),
            read: formatNumberNo(item.pvCount),
            comment: formatNumberNo(item.commentCount),
            great: formatNumberNo(item.praiseCount),
            type: item.contentType === 2 ? 'video' : item.contentType === 1 ? 'article' : 'dynamic',
          };
          if (item.contentType === 1) {
            newItem.pageUrl = `https://www.163.com/dy/article/${newItem.id}.html`;
          } else if (item.contentType === 2) {
            newItem.pageUrl = `https://www.163.com/v/video/${newItem.id}.html`;
          }
          newItemNum.pageUrl = newItem.pageUrl;
          result.data.push(newItem);
          result.dataList.push(newItemNum);
        }
        if (result.data?.length >= maxCount) {
          eventCallBack?.emit(syncContentEventName, { ...result });
          return result;
        }
        if (eventCallBack) {
          eventCallBack?.emit(syncContentEventName, { ...result });
          result.data = [];
          result.dataList = [];
        }
        await Task.Delay(1000);
      } else {
        if (!result.data.length) {
          result.code = contentList?.code === 1 ? 0 : contentList?.code === 0 ? -1 : contentList?.code ?? -1;
          result.msg = contentList?.msg;
        }
        break;
      }
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

/**
 *删除作品
 * @param cookie
 * @param contentType
 * @param docId 做作品唯一id
 * @param wemediaId
 * @param realUserId
 */
export const deleteWangyihaoContent = async (
  cookie: string,
  contentType: PubContentEnum,
  docId: string,
  wemediaId: string,
  realUserId: string,
): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    if (!wemediaId) {
      const userInfo = await getUserInfoAsync(cookie);
      wemediaId = userInfo?.data?.wemediaId;
      realUserId = userInfo?.data?.realUserId;
    }
    if (contentType === PubContentEnum.article || contentType === PubContentEnum.video) {
      const deleteResult = await deleteContent(
        cookie,
        docId,
        wemediaId,
        realUserId,
        contentType === PubContentEnum.article ? 1 : 2,
      );
      result.code = deleteResult?.code === 1 ? 0 : -1;
      result.msg = deleteResult?.msg;
    } else {
      result.code = -1;
      result.msg = '不支持的内容类型';
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};
