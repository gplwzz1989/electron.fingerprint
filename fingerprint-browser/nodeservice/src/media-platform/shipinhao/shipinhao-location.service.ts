import { $http } from '../../http';
import { GetTimeStamp, isJson } from '../../utils';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 获取/搜索地理位置列表
 * @param cookie
 * @param keyWord 搜索关键词
 * @param finderUsername 可选，默认空
 * @param proxyAgent
 */
export const getLocationListResponse = async (
  cookie: string,
  keyWord: string,
  finderUsername: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<ShipinhaoLocationResponse> => {
  const url = 'https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/helper/helper_search_location';

  const headers = {
    referer: 'https://channels.weixin.qq.com',
    cookie: cookie,
  };

  const postData = {
    query: keyWord ?? '',
    cookies: '',
    longitude: 0,
    latitude: 0,
    timestamp: GetTimeStamp(13),
    _log_finder_uin: '',
    _log_finder_id: finderUsername,
    rawKeyBuff: null,
    pluginSessionId: null,
    scene: 7,
    reqScene: 7,
  };

  const result = await $http.post(url, postData, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result?.data;
};

export interface ShipinhaoLocationResponse {
  /**
   *  错误码
   */
  errCode: number;
  /**
   * 提示消息
   */
  errMsg: string;
  data?: {
    /**
     * 地点列表信息
     */
    list: Array<ShipinhaoLocationInfo>;
    address: {
      /**
       * 当前所在地精度
       */
      longitude: number;
      /**
       * 当前所在地维度
       */
      latitude: number;
      /**
       * 当前国家
       */
      country: string;

      countryCode: string;
      /**
       * 当前省份
       */
      province: string;
      /**
       * 当前城市
       */
      city: string;
      /**
       * 当前区县
       */
      region: string;
      poiCheckSum:string;
    };
    continueFlag: number;
  };
}

export interface ShipinhaoLocationInfo {
  /**
   * 地理位置id
   */
  uid: string;
  /**
   * 地理位置名称
   */
  name: string;
  /**
   * 经度
   */
  longitude: number;
  /**
   * 维度
   */
  latitude: number;
  /**
   * 地址
   */
  address: string;
  /**
   * 省份
   */
  province: string;
  /**
   * 城市
   */
  city: string;
  /**
   * 区县
   */
  region: string;
  /**
   * 完整地址
   */
  fullAddress: string;
  source: number;
}
