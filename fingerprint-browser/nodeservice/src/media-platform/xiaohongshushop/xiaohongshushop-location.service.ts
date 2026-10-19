import { $http } from '../../http';
import { isJson } from '../../utils';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 搜索地理位置西悉尼
 * @param cookie
 * @param keyWord 搜索关键词
 * @param pageNum 翻页页码，默认1
 * @param proxyAgent
 */
export const getLocationListResponse = async (
  cookie: string,
  keyWord: string,
  pageNum: number = 1,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<XiaohongshuLocationResponse> => {
  const url = 'https://www.xiaohongshu.com/web_api/sns/v5/creator/poi/search';

  const headers = {
    cookie: cookie,
    referer: 'https://ark.xiaohongshu.com',
    Authorization: '',
    Origin: 'https://ark.xiaohongshu.com',
  };

  const postData = {
    locations: [{ longitude: 0, latitude: 0 }],
    keyword: keyWord ?? '',
    page_num: pageNum > 0 ? pageNum : 1,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface XiaohongshuLocationResponse {
  /**
   * 状态码
   * 0正常 非0异常
   */
  code: number;
  success: boolean;
  /**
   * 提示消息
   */
  msg?: string;
  /**
   * 地点列表
   */
  data?: Array<XiaohongshushopLocationInfo>;
}

export interface XiaohongshushopLocationInfo {
  cityNameSpell: string;
  originSource: number;
  /**
   * 地点id
   */
  poiOid: string;
  recommendType: number;
  sortScore: number;
  /**
   * 地点名称
   */
  name: string;
  /**
   * 城市名称
   */
  cityName: string;
  source: number;
  link: string;
  latitude: number;
  category: number;
  distance: number;
  longitude: number;
  rateScore: number;
  poiLongId: number;
  poiPageId: string;
  // noinspection SpellCheckingInspection
  /**
   * 地点描述
   */
  subname: string;
}
