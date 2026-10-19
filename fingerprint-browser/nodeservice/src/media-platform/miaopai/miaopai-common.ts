import { MiaopaiMediaContent, getContentListAsync } from './miaopai-content-list.service';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import { BaseResult } from '../baseResult';
import {
  getDataOverviewAsync,
  getDataOverviewCoreDataAsync,
  getDataOverviewIncomeAsync,
  MiaopaiDataOverviewItemResponse,
} from './miaopai-data-overview.service';
import { getUserInfoAsync, getUserStatisticAsync } from './miaopai-user.service';
import { PlatformAuthorInfo } from '@/media-platform';

/**
 * 秒拍视频管理
 * @param cookie
 * @param page 页码 默认1
 * @param count 每页数量 默认20
 */
export const getMiaopaiContentList = async (cookie: string, page: number = 1, count: number = 20) => {
  const result: MiaopaiContentListOutput = {
    code: 0,
    msg: '',
  };

  try {
    const contentListResult = await getContentListAsync(cookie, page, count);

    result.code = contentListResult.code === 200 ? 0 : contentListResult.code;
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

export interface MiaopaiContentListOutput extends BaseResult {
  data?: {
    list: Array<MiaopaiMediaContent>;
    total: number;
    page: string;
    count: string;
  };
  raw?: unknown;
}

/**
 * 秒拍数据分析-视频分析-数据明细
 * @param cookie
 * @param days 数据范围（1：1天，7：7天，30：30天）默认30天
 */
export const getMiaopaiDataOverview = async (cookie: string, days: 1 | 7 | 30 = 30) => {
  const result: MiaopaiDataOverviewOutput = {
    code: 0,
    msg: '',
  };

  try {
    const dataOverviewResult = await getDataOverviewAsync(cookie, days);

    result.code = dataOverviewResult.code === 200 ? 0 : dataOverviewResult.code;
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

export interface MiaopaiDataOverviewOutput extends BaseResult {
  data?: {
    list: Array<MiaopaiDataOverviewItemResponse>;
    total: number;
  };

  raw?: unknown;
}

/**
 * 秒拍数据分析-视频分析-概览数据（全部视频数据）
 * @param cookie
 */
export const getMiaopaiDataOverviewCoreData = async (cookie: string) => {
  const result: MiaopaiDataOverviewCoreDataOutput = {
    code: 0,
    msg: '',
  };

  try {
    const dataOverviewCoreDataResult = await getDataOverviewCoreDataAsync(cookie);

    result.code = dataOverviewCoreDataResult.code === 200 ? 0 : dataOverviewCoreDataResult.code;
    result.data = dataOverviewCoreDataResult.data;
    result.raw = dataOverviewCoreDataResult;
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

export interface MiaopaiDataOverviewCoreDataOutput extends BaseResult {
  data?: {
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

  raw?: unknown;
}

/**
 * 秒拍结算中心
 * @param cookie
 */
export const getMiaopaiDataOverviewIncome = async (cookie: string) => {
  const result: MiaopaiDataOverviewIncomeOutput = {
    code: 0,
    msg: '',
  };

  try {
    const dataOverviewIncomeResult = await getDataOverviewIncomeAsync(cookie);

    result.code = dataOverviewIncomeResult.code === 200 ? 0 : dataOverviewIncomeResult.code;
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
export interface MiaopaiDataOverviewIncomeOutput extends BaseResult {
  data?: {
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

  raw?: unknown;
}

/**
 * 秒拍用户信息
 * @param cookie
 */
export const getMiaopaiUserInfo = async (cookie: string) => {
  const result: MiaopaiUserInfoOutput = {
    code: 0,
    msg: '',
  };

  try {
    const dataOverviewIncomeResult = await getUserInfoAsync(cookie);

    result.yixiaoerId = dataOverviewIncomeResult?.data?.id?.toString();
    result.yixiaoerName = dataOverviewIncomeResult?.data?.nick?.toString();
    result.yixiaoerImageUrl = dataOverviewIncomeResult?.data?.cover?.toString();
    result.raw = dataOverviewIncomeResult?.data;
    result.code = dataOverviewIncomeResult.code === 200 ? 0 : dataOverviewIncomeResult.code;
    result.data = dataOverviewIncomeResult.data;
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

export interface MiaopaiUserInfoOutput extends PlatformAuthorInfo {
  data?: {
    /**
     * 用户id
     */
    id: number;

    /**
     * 用户昵称
     */
    nick: string;

    /**
     * 用户地区
     */
    area: string;

    /**
     * 用户性别
     */
    gender: number;

    /**
     * 用户头像
     */
    iconSafe: string;
  };
}

/**
 * 秒拍首页统计数据
 * @param cookie
 */
export const getMiaopaiUserHomeData = async (cookie: string) => {
  const result: MiaopaiUserHomeDataOutput = {
    code: 0,
    msg: '',
  };

  try {
    const userHomeDataResult = await getUserStatisticAsync(cookie);

    result.code = userHomeDataResult.code === 200 ? 0 : userHomeDataResult.code;
    result.data = userHomeDataResult.data;
    result.raw = userHomeDataResult;
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

export interface MiaopaiUserHomeDataOutput extends BaseResult {
  data?: {
    /**
     * 近7日总收益
     */
    income: number;

    /**
     * 昨日播放量
     */
    play_cnt: number;

    /**
     * 粉丝数
     */
    fans_cnt: number;

    /**
     * 信用分
     */
    credit: number;
  };

  raw?: unknown;
}
