import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { Guid } from '../../utils';
import { getCsdnSign } from '../csdn/csdn-base.service';

/**
 * csdn 内容分析核心数据
 * @param cookie
 */
export const getDataOverviewCoreDataAsync = async (cookie: string): Promise<CsdnDataOverviewCoreDataResponse> => {
  const xNonce = Guid.NewGuid();
  const signature = await getCsdnSign(
    'GET',
    'https://bizapi.csdn.net/blog-console-api/v1/data/blog_statistics',
    'application/json, text/plain, */*',
    '',
    '',
    {},
    {
      'X-Ca-Key': '203803574',
      'X-Ca-Nonce': xNonce,
      common: { Accept: 'application/json, text/plain, */*' },
      delete: {},
      get: {},
      head: {},
      post: { 'Content-Type': 'application/json;charset=UTF-8' },
      put: { 'Content-Type': 'application/x-www-form-urlencoded' },
      patch: { 'Content-Type': 'application/x-www-form-urlencoded' },
    },
  );

  const result = await $http.get<unknown, AxiosResponse<CsdnDataOverviewCoreDataResponse>>(
    'https://bizapi.csdn.net/blog-console-api/v1/data/blog_statistics',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.csdn.net/mp_blog/analysis/article/all',
        origin: 'https://mp.csdn.net',
        Accept: 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate, br',
        authority: 'bizapi.csdn.net',
        'Content-Type': null,
        'X-Ca-Key': '203803574',
        'X-Ca-Nonce': xNonce,
        'X-Ca-Signature': signature,
        'X-Ca-Signature-Headers': 'x-ca-key,x-ca-nonce',
      },
    },
  );

  // 请求失败
  if (result.data.code !== 200) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

/**
 * csdn内容分析报表
 * @param cookie
 * @param page 页码
 * @param pageSize 每页数量
 * @param start 开始时间（10位时间戳）
 * @param end 结束时间（10位时间戳）
 */
export const getDataOverviewAsync = async (
  cookie: string,
  page: number,
  pageSize: number,
  start: number,
  end: number,
): Promise<CsdnDataOverviewResponse> => {
  const xNonce = Guid.NewGuid();
  const signature = await getCsdnSign(
    'GET',
    'https://bizapi.csdn.net/blog/phoenix/console/v1/data/all-article',
    'application/json, text/plain, */*',
    '',
    '',
    { page: page, size: pageSize, start: start, end: end, type: 'date', action: 'down' },
    {
      'X-Ca-Key': '203803574',
      'X-Ca-Nonce': xNonce,
      common: { Accept: 'application/json, text/plain, */*' },
      delete: {},
      get: {},
      head: {},
      post: { 'Content-Type': 'application/json;charset=UTF-8' },
      put: { 'Content-Type': 'application/x-www-form-urlencoded' },
      patch: { 'Content-Type': 'application/x-www-form-urlencoded' },
    },
  );

  const result = await $http.get<unknown, AxiosResponse<CsdnDataOverviewResponse>>(
    'https://bizapi.csdn.net/blog/phoenix/console/v1/data/all-article',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.csdn.net/mp_blog/analysis/article/all',
        origin: 'https://mp.csdn.net',
        Accept: 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Content-Type': null,
        'X-Ca-Key': '203803574',
        'X-Ca-Nonce': xNonce,
        'X-Ca-Signature': signature,
        'X-Ca-Signature-Headers': 'x-ca-key,x-ca-nonce',
      },
      params: {
        page: page,
        size: pageSize,
        start: start,
        end: end,
        type: 'date',
        action: 'down',
      },
    },
  );

  // 请求失败
  if (result.data.code !== 200) {
    throw new BadRequestException(result.data?.message, result.data?.code, result.data);
  }

  return result.data;
};

export interface CsdnDataOverviewCoreDataResponse {
  code: number;
  msg: string;
  data: Array<{
    /**
     * 数据名称
     */
    name: string;

    /**
     * 数据对应值
     */
    num: number;
  }>;
}

export interface CsdnDataOverviewResponse {
  code: number;
  message: string;
  traceId: string;
  data: {
    dateList: Array<string>;
    chartData: {
      view: Array<string>;
      comment: Array<string>;
      collect: Array<string>;
      fans: Array<string>;
    };
    list: Array<{
      /**
       * 阅读数
       */
      viewCount: number;

      /**
       * 评论数
       */
      commentCount: number;

      /**
       * 收藏数
       */
      favoriteCount: number;

      /**
       * 粉丝数
       */
      fanCount: number;

      /**
       * 日期
       */
      pdate: string;
    }>;
    total: number;
    page: number;
    size: number;
  };
}
