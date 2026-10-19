import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';

/**
 * 多多视频视频数据-总览数据
 * @param cookie
 */
export const getDataOverviewAsync = async (cookie: string): Promise<DuoduoshipinDataOverviewResponse> => {
  const url: string = 'https://live.pinduoduo.com/api/backbone/video/statistic/view';

  const headers = {
    cookie: cookie,
    referer: 'https://live.pinduoduo.com/n-creator/video/video-all-data',
    Origin: 'https://live.pinduoduo.com',
    authority: 'live.pinduoduo.com',
  };

  const postData = {};

  const result = await $http.post<never, AxiosResponse<DuoduoshipinDataOverviewResponse>>(url, postData, {
    headers: headers,
  });

  if (result.data.errorCode !== 1000000) {
    throw new BadRequestException(result.data?.errorMsg, result.data?.errorCode, result.data);
  }

  return result.data;
};

export interface DuoduoshipinDataOverviewItemResponse {
  /**
   * 数据名称
   */
  title: string;

  /**
   * 近7天增加量
   */
  sevenDaysAdd: number;

  /**
   * 上一个7天增加数据
   */
  lastSevenDaysAdd: number;

  /**
   * 最近1个月增加量
   */
  oneMonthAdd: number;

  /**
   * 日期对应数据值
   */
  dayValues: Array<{
    /**
     * 日期
     */
    date: string;

    /**
     * 日期对应数据值
     */
    value: number;
  }>;
}

export interface DuoduoshipinDataOverviewResponse {
  success: boolean;
  errorCode: number;
  errorMsg: string;
  result: {
    overallStatistic: Array<{
      title: string;
      value: number;
    }>;
    daysStatistic: Array<DuoduoshipinDataOverviewItemResponse>;
  };
}
