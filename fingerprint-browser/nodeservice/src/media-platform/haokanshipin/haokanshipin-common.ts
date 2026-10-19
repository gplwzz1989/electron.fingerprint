import { BaseResult } from '../baseResult';
import { getContentListAsync, HaokanshipinMediaContent } from './haokanshipin-content-list.service';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import {
  getDataOverviewAsync,
  getDataOverviewFansAsync,
  getSingleDataOverviewAsync,
  getSingleDataOverviewStatisticAsync,
  HaokanshipinDataOverviewAllTrendInfo,
  HaokanshipinFansAllTrendInfo,
} from './haokanshipin-data-overview.service';
import { getUserHomeDataAsync, getUserInfoAsync } from '../haokanshipin/haokanshipin-user.service';
import { PlatformAuthorInfo } from '@/media-platform';

/**
 * 获取好看视频作品列表
 * @param cookie
 * @param status 数据状态（''：全部，'publish‘：已发布，'analyze'：待发布，'rejected'：未通过，'withdraw'：已撤回，'draft'：草稿）
 * @param page 页码
 * @param size 每页数量
 * @param videoType 数据类型 默认0（0是全部，1：视频，3：小视频，6：合集）
 */
export const getHaokanshipinContentList = async (
  cookie: string,
  status: '' | 'publish' | 'analyze' | 'rejected' | 'withdraw' | 'draft' = '',
  page: number = 1,
  size: number = 10,
  videoType: 0 | 1 | 3 | 6 = 0,
) => {
  const result: HaokanshipinContentListOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const contentListResult = await getContentListAsync(cookie, status, page, size, videoType);

    result.code = contentListResult.status;
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

export interface HaokanshipinContentListOutput extends BaseResult {
  data?: {
    pageNum: number;
    list: Array<HaokanshipinMediaContent>;
  };
  raw?: unknown;
}

/**
 * 获取好看视频报表数据-整体数据
 * @param cookie
 * @param start_day 开始日期 Date
 * @param end_day 结束日期 Date
 */
export const getHaokanshipinDataOverview = async (cookie: string, start_day: Date, end_day: Date) => {
  const result: HaokanshipinDataOverviewOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const startTime = start_day.getTime();
    const endTime = end_day.getTime();

    const startTs = Math.floor(startTime / 1000);
    const endTs = Math.floor(endTime / 1000);

    const dataOverviewResult = await getDataOverviewAsync(cookie, startTs, endTs);

    result.code = dataOverviewResult.status;
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

export interface HaokanshipinDataOverviewOutput extends BaseResult {
  data?: {
    allTrendInfo: HaokanshipinDataOverviewAllTrendInfo;
  };

  raw?: unknown;
}

/**
 * 好看视频粉丝报表数据
 * @param cookie
 * @param start_day 开始日期 Date
 * @param end_day 结束日期 Date
 */
export const getHaokanshipinDataOverviewFans = async (cookie: string, start_day: Date, end_day: Date) => {
  const result: HaokanshipinDataOverviewFansOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const startTime = start_day.getTime();
    const endTime = end_day.getTime();

    const startTs = Math.floor(startTime / 1000);
    const endTs = Math.floor(endTime / 1000);

    const dataOverviewFansResult = await getDataOverviewFansAsync(cookie, startTs, endTs);

    result.code = dataOverviewFansResult.status;
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

export interface HaokanshipinDataOverviewFansOutput extends BaseResult {
  data?: {
    allTrendInfo: HaokanshipinFansAllTrendInfo;
  };

  raw?: unknown;
}

/**
 * 获取好看视频用户首页数据
 * @param cookie
 */
export const getHaokanshipinUserHomeData = async (cookie: string) => {
  const result: HaokanshipinUserHomeDataOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const userHomeDataResult = await getUserHomeDataAsync(cookie);

    result.code = userHomeDataResult.status;
    result.msg = userHomeDataResult.msg;
    result.data = userHomeDataResult.data;
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

export interface HaokanshipinUserHomeDataOutput extends BaseResult {
  data?: {
    realNameCheck: number;
    videoShareIncomeApply: number;
    data: {
      /**
       * 播放量
       */
      video_view: {
        total: number;
        trend: number;
      };

      /**
       * 粉丝数据
       */
      fans_info: {
        total: number;
        trend: number;
      };

      /**
       * 收益数据
       */
      income_info: {
        total: number;
        trend: number;
        lastDate: number;
      };

      /**
       * 一圈三连互动量
       */
      yqsl_info: {
        total: string;
        trend: string;
      };

      /**
       * 一圈三连互动收益
       */
      yqsl_income_info: {
        total: string;
        trend: string;
      };
    };
  };
}

/**
 * 好看视频单篇统计数据
 * @param cookie
 * @param vid 作品id
 */
export const getHaokanshipinSingleDataOverviewStatistic = async (
  cookie: string,
  vid: string,
): Promise<HaokanshipinSingleDataOverviewStatisticOutput> => {
  const result: HaokanshipinSingleDataOverviewStatisticOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const singleDataOverviewStatisticResult = await getSingleDataOverviewStatisticAsync(cookie, vid);

    result.code = singleDataOverviewStatisticResult.status;
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

export interface HaokanshipinSingleDataOverviewStatisticOutput extends BaseResult {
  data?: {
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

  raw?: unknown;
}

/**
 * 好看视频单篇报表数据
 * @param cookie
 * @param vid 作品id
 * @param start_day 开始时间
 * @param end_day 结束时间
 * @param dimType 数据类型（recommend_count：推荐量, view_count：播放量, comment_count：评论量, likes_count：点赞量, share_count：分享量, collect_count：收藏量, yqsl_count：一圈三连互动量）
 */
export const getHaokanshipinSingleDataOverview = async (
  cookie: string,
  vid: string,
  start_day: Date,
  end_day: Date,
  dimType:
    | 'recommend_count'
    | 'view_count'
    | 'comment_count'
    | 'likes_count'
    | 'share_count'
    | 'collect_count'
    | 'yqsl_count' = 'recommend_count',
): Promise<HaokanshipinSingleDataOverviewOutput> => {
  const result: HaokanshipinSingleDataOverviewOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const startTime = start_day.getTime();
    const endTime = end_day.getTime();

    const startTs = Math.floor(startTime / 1000);
    const endTs = Math.floor(endTime / 1000);

    const dataOverviewFansResult = await getSingleDataOverviewAsync(cookie, vid, startTs, endTs, dimType);

    result.code = dataOverviewFansResult.status;
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

export interface HaokanshipinSingleDataOverviewOutput extends BaseResult {
  data?: {
    trendInfo: [Array<string>, Array<number>];
  };

  raw?: unknown;
}

export const getHaokanshipinUserInfo = async (cookie: string): Promise<HaokanshipinUserInfoOutput> => {
  const result: HaokanshipinUserInfoOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const userInfoResult = await getUserInfoAsync(cookie);

    result.yixiaoerId = userInfoResult?.data?.uk?.toString();
    result.yixiaoerName = userInfoResult?.data?.name?.toString();
    result.yixiaoerImageUrl = userInfoResult?.data?.avatar?.toString();
    result.raw = userInfoResult?.data;
    result.code = userInfoResult.status; // -1为未登录
    result.msg = userInfoResult.msg;
    result.data = userInfoResult.data;
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

export interface HaokanshipinUserInfoOutput extends PlatformAuthorInfo {
  data?: {
    avatar: string;
    desc: string;
    name: string;
    vlog: string;
    type: string;
    fans: number;
    follow: number;
    rights: {
      copyright_guard: boolean;
      paid_consultation: boolean;
      video_goods: boolean;
      creator_union: boolean;
      businessorder_offer: boolean;
      sign_type: number;
      nav_upload: boolean;
      upload_time_length: number;
      new_video_list: boolean;
      video_lab: boolean;
    };
    uk: string;
  };
}
