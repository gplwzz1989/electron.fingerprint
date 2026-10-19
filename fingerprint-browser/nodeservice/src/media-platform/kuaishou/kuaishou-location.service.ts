import { $http } from '../../http';
import { regex } from './kuaishou-base.service';
import { Guid, isJson } from '../../utils';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { GeoLocation } from '@/media-platform';

/**
 * 当前城市
 */
const currentCity: KuaishouLocationIpResponse = {};
/**
 * 经纬度定位获得的城市列表
 */
const cityNameList: { posStr?: string } = {};

/**
 * 获取地点列表
 * @param cookie
 * @param keyWord  搜索关键词，当为空时，地点列表为推荐列表
 * @param proxyAgent
 * @param coords
 */
export const getLocationResponse = async (
  cookie: string,
  keyWord: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
  coords?: GeoLocation,
): Promise<KuaishouLocationResponse> => {
  const match = regex.exec(cookie);
  const webapiId = match ? match[1] : Guid.NewGuid().toString().replace(/-/g, '');

  const cityKey = proxyAgent ? proxyAgent['connectOpts']['host'] + proxyAgent['connectOpts']['port'] : 'common';
  const url = `https://cp.kuaishou.com/rest/zt/location/wi/poi/search?kpn=kuaishou_cp&subBiz=CP%2FCREATOR_PLATFORM&kpf=PC_WEB&kuaishou.web.cp.api_ph=${webapiId}`;

  const headers = {
    cookie: cookie,
    Referer: 'https://cp.kuaishou.com/article/publish/video',
  };
  if (coords) {
    const posStr = coords ? JSON.stringify(coords) : '';
    let cityName = cityNameList[posStr];
    if (!cityName) {
      const cityRe = await getLocationNearByResponse(cookie, coords, proxyAgent);
      cityNameList[posStr] = cityRe.cityName;
      cityName = cityNameList[posStr];
    }
    const postData = {
      cityName: cityName ? cityName : currentCity[cityKey]?.data?.city ?? '',
      count: 20,
      keyword: keyWord ? keyWord : cityName,
      pcursor: '',
      'kuaishou.web.cp.api_ph': webapiId,
    };

    const result = await $http.post(url, postData, {
      headers: headers,
      httpsAgent: proxyAgent,
      httpAgent: proxyAgent,
    });

    return result.data;
  } else {
    if (!currentCity[cityKey]?.data?.city) {
      currentCity[cityKey] = await getCurrentCity(cookie, proxyAgent);
    }
    const city = currentCity[cityKey]?.data?.city.data?.city?.includes('自治')
      ? currentCity[cityKey]?.data?.city
      : `${currentCity[cityKey]?.data?.city}市`;
    const postData = {
      cityName: city,
      count: 20,
      keyword: keyWord ? keyWord : city,
      pcursor: '',
      'kuaishou.web.cp.api_ph': webapiId,
    };

    const result = await $http.post(url, postData, {
      headers: headers,
      httpsAgent: proxyAgent,
      httpAgent: proxyAgent,
    });

    return result.data;
  }
};

export const getLocationNearByResponse = async (
  cookie: string,
  coords: GeoLocation,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<KuaishouLocationResponse> => {
  const match = regex.exec(cookie);
  const webapiId = match ? match[1] : Guid.NewGuid().toString().replace(/-/g, '');

  const url = `https://cp.kuaishou.com/rest/zt/location/wi/poi/nearby?kpn=kuaishou_cp&subBiz=CP%2FCREATOR_PLATFORM&kpf=PC_WEB&kuaishou.web.cp.api_ph=${webapiId}`;

  const headers = {
    cookie: cookie,
    Referer: 'https://cp.kuaishou.com/article/publish/video',
  };

  //const posStr = coords ? JSON.stringify(coords) : '';
  //const cityName = cityNameList[posStr];
  const postData = {
    location: `${coords.latitude},${coords.longitude}`,
    count: 20,
    'kuaishou.web.cp.api_ph': webapiId,
  };
  const result = await $http.post(url, postData, {
    headers: headers,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

export interface KuaishouLocationResponse {
  /**
   * 状态码 1正常 非1异常
   */
  result: number;
  cityName: string;
  /**
   * 地址列表
   */
  locations: Array<KuaishouLocationInfo>;
  /**
   * 提示消息
   */
  message: string;
}

export interface KuaishouLocationInfo {
  /**
   * 地点id
   */
  id: number;
  /**
   * 地点名称
   */
  title?: string;
  /**
   * 地点详细地址
   */
  address?: string;
  /**
   * 城市
   */
  city?: string;

  category?: number;
  /**
   * 精度
   */
  latitude?: number;
  /**
   * 维度
   */
  longitude?: number;
  idString?: string;
}

/**
 * 获取当前地址城市
 * @param cookie
 * @param proxyAgent
 */
const getCurrentCity = async (
  cookie: string,
  proxyAgent: object | undefined = undefined,
): Promise<KuaishouLocationIpResponse> => {
  const url = 'https://cp.kuaishou.com/rest/cp/works/v2/common/pc/ip2poi';

  const headers = {
    cookie: cookie,
    Referer: 'https://cp.kuaishou.com/article/publish/video',
  };

  const match = cookie.match(regex);
  const webapiId = match ? match[1] : Guid.NewGuid().toString().replace(/-/g, '');
  const postData = { 'kuaishou.web.cp.api_ph': webapiId };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

interface KuaishouLocationIpResponse {
  /**
   * 状态码
   */
  result?: number;
  data?: {
    country: string;
    countryOrRegion: string;
    /**
     *  省份
     */
    province: string;
    /**
     * 网络运营商
     */
    isp: string;
    /**
     * 城市
     */
    city: string;
    /**
     * 经度
     */
    longitude: number;
    /**
     * 维度
     */
    latitude: number;
    inChina: boolean;
  };
  message?: string;
}
