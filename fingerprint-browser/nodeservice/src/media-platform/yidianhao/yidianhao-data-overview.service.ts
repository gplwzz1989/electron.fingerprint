import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 一点号收益报表
 * @param cookie
 */
export const getDataOverviewIncomeListAsync = async (
  cookie: string,
): Promise<YidianhaoDataOverviewIncomeListResponse> => {
  const result = await $http.get<unknown, AxiosResponse<YidianhaoDataOverviewIncomeListResponse>>(
    'https://mp.yidianzixun.com/api/settlement-system/income-info',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.yidianzixun.com/',
        authority: 'mp.yidianzixun.com',
      },
      params: {},
    },
  );

  if (result.status !== 200) {
    throw new BadRequestException(result.statusText, result.status, result.data);
  }

  // 请求失败
  if (result.data?.status != 'success') {
    throw new BadRequestException('获取失败', result.data?.status, result.data);
  }

  return result.data;
};

/**
 * 一点号结算中心收益数据
 * @param cookie
 */
export const getDataOverviewIncomeAsync = async (cookie: string): Promise<YidianhaoDataOverviewIncomeResponse> => {
  const result = await $http.get<unknown, AxiosResponse<YidianhaoDataOverviewIncomeResponse>>(
    'https://mp.yidianzixun.com/api/outlaySettle/current-info',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.yidianzixun.com/',
        authority: 'mp.yidianzixun.com',
      },
      params: {},
    },
  );

  // 请求失败
  if (result.data?.code != 0) {
    throw new BadRequestException(result.data?.reason, result.data?.code, result.data);
  }

  return result.data;
};

/**
 * 一点号内容分析
 * @param cookie
 * @param start_time
 * @param end_time
 * @param proxyAgent
 */
export const getDataOverviewAsync = async (
  cookie: string,
  start_time: number,
  end_time: number,
  proxyAgent?: HttpsProxyAgent<string>|object,
): Promise<YidianhaoDataOverviewResponse> => {
  const url: string = 'https://mp.yidianzixun.com/api/source-data';
  const headers = {
    cookie: cookie,
    referer: 'https://mp.yidianzixun.com/',
    Origin: 'https://mp.yidianzixun.com',
    'Content-Type': 'application/json;charset=UTF-8',
  };

  const postData = {
    bizKey: 'refact-media-post-data-detail',
    bizObject: {
      params: {
        start_time: start_time,
        end_time: end_time,
        type_list: [1],
      },
    },
  };

  const result = await $http.post<never, AxiosResponse<YidianhaoDataOverviewResponse>>(url, postData, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface YidianhaoDataOverviewIncomeListResponse {
  result: Array<{
    click_fee: number;
    cpm_fee: number;
    fixed_fee: number;
    operate_fee: number;
    tax_free_fee: number;
    invite_fee: number;
    tip_fee: number;
    total_fee: number;
    tort_fee: number;
    media_id: number;
    day: string;
  }>;
  status: string;
}

export interface YidianhaoDataOverviewIncomeResponse {
  result: {
    outlay_income_latest: string;
    outlay_latest_time: string;
    outlay_income_wait: string;
    outlay_income_balance: string;
    outlay_income_frozen: string;
    outlay_income_history: string;
    status: number;
  };
  status: string;
  reason: string;
  code: number;
}

export interface YidianhaoDataOverviewItem {
  /**
   * 日期
   */
  day: string;
  sumCmuLike: number;
  postNum: number;
  media_id: number;
  doc_id: string;
  r_doc_id: string;
  title_sn: string;

  /**
   * 阅读量
   */
  clickDoc: number;

  /**
   * 推荐量
   */
  viewDoc: number;

  /**
   * 分享量
   */
  shareDoc: number;

  /**
   * 收藏量
   */
  likeDoc: number;

  /**
   * 评论量
   */
  addCommentDoc: number;

  /**
   * 点赞数
   */
  thumbUpDoc: number;
  thumbDownDoc: number;
}

export interface YidianhaoDataOverviewResponse {
  code: number;
  status: string;
  reason: string;
  result: {
    res: {
      total: YidianhaoDataOverviewItem;
    };
    count: number;
  };
}

export const getDataFansDailyAsync = async (cookie: string, days: number = 30): Promise<FansDailyResponse> => {
  const url = `https://mp.yidianzixun.com/api/get-fans-everyday?ret_days=${days}`;
  const result = await $http.get(url, {
    headers: {
      cookie: cookie,
      referer: 'https://mp.yidianzixun.com/',
      authority: 'mp.yidianzixun.com',
    },
    params: {},
  });

  return result.data;
};

export interface FansDailyResponse {
  result: Array<{
    fans_add: number; // 新增粉丝数
    fans_reduce: number; // 减少粉丝数
    fans_pure_add: number; // 净增粉丝数（新增 - 减少）
    fans_total: number; // 粉丝总数
    date: string; // 日期（格式：YYYY-MM-DD）
  }>;
  status: string; // 状态（如"success"表示成功）
  reason: string | null; // 原因（成功时为null，失败时可能返回具体信息）
  code: number; // 状态码（0通常表示成功）
}
