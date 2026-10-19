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
  const url = 'https://edith.xiaohongshu.com/web_api/sns/v1/local/poi/creator/search';

  const headers = {
    cookie: cookie,
    referer: 'https://creator.xiaohongshu.com/',
    Authorization: '',
    Origin: 'https://creator.xiaohongshu.com',
    'Content-Type': 'application/json;charset=UTF-8',
  };

  const postData = {
    latitude: 0,
    longitude: 0,
    keyword: keyWord,
    page: pageNum ?? 1,
    size: 30,
    source: 'WEB',
    type: 3,
  };

  const result = await $http.post(url, postData, {
    headers: headers,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
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
  data?: { poi_list: Array<XiaohongshuLocationInfo> };
}

export interface XiaohongshuLocationInfo {
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
