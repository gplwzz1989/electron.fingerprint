import { BaseResult } from '../baseResult';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import { getDataOverviewAsync } from './dongfanghao-data-overview.service';
import { getUserHomeDataAsync } from './dongfanghao-user.service';

/**
 * 东方号内容分析
 * @param cookie
 * @param start_day 开始日期 （Date）
 * @param end_day 结束日期（Date）
 */
export const getDongfanghaoDataOverview = async (
  cookie: string,
  start_day: Date,
  end_day: Date,
): Promise<DongfanghaoDataOverviewOutput> => {
  const result: DongfanghaoDataOverviewOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    let start_date_str = start_day.toISOString();
    if (start_date_str.length > 0) {
      start_date_str = start_date_str.slice(0, 10);
      start_date_str = start_date_str.replaceAll('-', '');
    }

    let end_date_str = end_day.toISOString();
    if (end_date_str.length > 0) {
      end_date_str = end_date_str.slice(0, 10);
      end_date_str = end_date_str.replaceAll('-', '');
    }

    const dataOverviewResult = await getDataOverviewAsync(cookie, start_date_str, end_date_str);

    result.code = dataOverviewResult.code;
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

export interface DongfanghaoDataOverviewOutput extends BaseResult {
  data?: {
    bydaylist: Array<{
      /**
       * 日期
       */
      dt: string;

      /**
       * 文章量
       */
      passtotal: number;

      /**
       * 评论
       */
      comment_pv: number;

      /**
       * 收藏
       */
      collecttotal: number;

      /**
       * 阅读数
       */
      read_pv: number;
      userid: string;
    }>;

    /**
     * 收藏数
     */
    collections: number;

    /**
     * 评论数
     */
    commentpv: number;

    /**
     * 文章数
     */
    contentnum: number;

    /**
     * 阅读量
     */
    readpv: number;
  };

  raw?: unknown;
}

/**
 * 东方号账号首页数据
 * @param cookie
 */
export const getDongfanghaoUserHomeData = async (cookie: string): Promise<DongfanghaoUserHomeDataOutput> => {
  const result: DongfanghaoUserHomeDataOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const userHomeDataResult = await getUserHomeDataAsync(cookie);

    result.code = userHomeDataResult.code;
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

export interface DongfanghaoUserHomeDataOutput extends BaseResult {
  data?: {
    /**
     * 指数
     */
    allscore: string;

    /**
     * 评论数
     */
    comment_pv: string;

    /**
     * 昨日收益
     */
    ysdmoney: string;

    /**
     * 阅读量
     */
    read_pv: string;

    /**
     * 粉丝数
     */
    fans_num: string;
  };
}
