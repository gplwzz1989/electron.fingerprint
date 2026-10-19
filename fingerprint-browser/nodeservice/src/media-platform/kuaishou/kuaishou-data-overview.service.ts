import { $http } from '../../http';
import { Guid, isJson } from '../../utils';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { getSign, regex } from './kuaishou-base.service';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 快手数据中心-视频数据
 * @param cookie
 * @param timeType 数据范围（1为近7天，2为近30天，3为近90天）
 * @param proxyAgent
 */
export const getDataOverviewAsync = async (
  cookie: string,
  timeType: 1 | 2 | 3 = 2,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<KuaishouDataOverviewResponse> => {
  const match = cookie.match(regex);
  const webapiId = match ? match[1] : Guid.NewGuid().replace(/-/g, '');

  const headers = {
    cookie: cookie,
    referer: 'https://cp.kuaishou.com/statistics/works',
    Origin: 'https://cp.kuaishou.com',
    Host: 'cp.kuaishou.com',
    'Content-Type': 'application/json;charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
  };

  const postData = {
    timeType: timeType,
    'kuaishou.web.cp.api_ph': webapiId,
  };

  const signStr = await getSign(JSON.stringify(postData));

  const url = 'https://cp.kuaishou.com/rest/cp/creator/analysis/pc/author/overview?__NS_sig3=' + signStr;

  const result = await $http.post<never, AxiosResponse<KuaishouDataOverviewResponse>>(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  if (result.data.result !== 1) {
    throw new BadRequestException(result.data?.message, result.data?.result, result.data);
  }

  return result.data;
};

export interface KuaishouBasicData {
  diagnoseResultType: string;

  /**
   * 头部昨日数据
   */
  endDayCount: number;
  interpretDesc: string;

  /**
   * 数据名称
   */
  name: string;

  /**
   * 头部总数据
   */
  sumCount: number;

  /**
   * 对应日期报表数据
   */
  trendData: Array<{
    /**
     * 对应数据
     */
    count: number;

    /**
     * 日期
     */
    date: string;
  }>;
}

export interface KuaishouDataOverviewResponse {
  currentTime?: number;
  data?: {
    basicData: Array<KuaishouBasicData>;

    /**
     * 数据更新时间
     */
    dataUpdateTime: number;
  };
  result: number;
  message: string;
}

/**
 * 快手单篇数据
 * @param cookie
 * @param workId 作品id
 * @param timeType 数据范围（1为近7天，2为近30天，3为近90天）
 */
export const getSingleDataOverviewAsync = async (
  cookie: string,
  workId: string,
  timeType: 1 | 2 | 3 = 2,
): Promise<KuaishouSingleDataOverviewResponse> => {
  const match = cookie.match(regex);
  const webapiId = match ? match[1] : Guid.NewGuid().replace(/-/g, '');

  const headers = {
    cookie: cookie,
    referer: 'https://cp.kuaishou.com/statistics/works',
    Origin: 'https://cp.kuaishou.com',
    Host: 'cp.kuaishou.com',
    'Content-Type': 'application/json;charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
  };

  const postData = {
    workId: workId,
    timeType: timeType,
    'kuaishou.web.cp.api_ph': webapiId,
  };

  const signStr = await getSign(JSON.stringify(postData));

  const url = 'https://cp.kuaishou.com/rest/cp/creator/pc/analysis/photo/single/overview?__NS_sig3=' + signStr;

  const result = await $http.post<never, AxiosResponse<KuaishouSingleDataOverviewResponse>>(url, postData, {
    headers: headers,
  });

  if (result.data.result !== 1) {
    throw new BadRequestException(result.data?.message, result.data?.result, result.data);
  }

  return result.data;
};

export interface KuaishouSingleDataOverviewTabDataResponse {
  /**
   * 数据类型名称
   */
  name: string;

  /**
   * 数据类型标识
   */
  tab: string;

  /**
   * 数据总和
   */
  sumCount: number;

  /**
   * 最后一条数据
   */
  endDayCount: number;
  interpretDesc: string;
  trendData: Array<{
    /**
     * 日期
     */
    date: string;

    /**
     * 日期对应值
     */
    count: number;
  }>;
  diagnoseResultType: string;
}

export interface KuaishouSingleDataOverviewResponse {
  data: {
    basicData: [
      {
        tabName: string;
        tabData: Array<KuaishouSingleDataOverviewTabDataResponse>;
      },
    ];

    /**
     * 数据更新时间
     */
    dataUpdateTime: number;
    canShowData: boolean;
    canShowEndDayData: boolean;
  };
  message: string;
  result: number;
}
