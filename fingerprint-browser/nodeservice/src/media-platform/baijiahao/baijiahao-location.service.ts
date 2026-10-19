import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { getSign } from './baijiahao-base.service';
import { GetTimeStamp } from '../../utils';
import { HttpsProxyAgent } from 'https-proxy-agent';

const ak = 'Rrgce2Zp0Q91B5xm11ekeIL4BrGYHznz';

/**
 * 搜索地区关键字
 * @param cookie
 * @param keyword 搜索关键字
 * @param city_code 城市编码
 * @param proxyAgent
 */
export const getLocationListBySearch = async (
  cookie: string,
  keyword: string,
  city_code: number,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<SearchLocationListResponse> => {
  const timeStamp = GetTimeStamp(13);
  const signUrl =
    'https://map.baidu.com/su?wd=' +
    encodeURIComponent(keyword) +
    '&callback=BMap._rd._cbk72231&cid=' +
    city_code +
    '&type=0&t=' +
    timeStamp +
    '&from=jsapi&ak=&v=3.0&seckey=&timeStamp=' +
    timeStamp +
    '&sign=';

  const url = await getSign(signUrl);

  const result = await $http.get<unknown, AxiosResponse<string>>(url, {
    headers: {
      cookie: cookie,
      referer: 'https://baijiahao.baidu.com/',
      host: 'api.map.baidu.com',
    },
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  if (result.status !== 200) {
    throw new BadRequestException(result.statusText, result.status, result.data);
  }

  result.data = result.data.split('cbk72231(')[1];
  result.data = result.data.slice(0, result.data.length - 1);

  const content: SearchLocationListResponse = {
    errno: 0,
    errmsg: '',
    data: [],
  };

  const jsonData = JSON.parse(result.data);

  if (jsonData?.s && jsonData?.s?.length > 0) {
    for (let i = 0; i < jsonData?.s?.length; i++) {
      const item = jsonData?.s[i];
      const strSplit = item.toString().split('$');
      content.data.push({
        id: i,
        name: strSplit[3],
        city_code: strSplit[4],
        city: strSplit[0] + strSplit[1],
        address: strSplit[0] + strSplit[1] + strSplit[3],
      });
    }
  }

  return content;
};

export interface SearchLocationListResponse {
  errno: number;
  errmsg: string;
  data: Array<{
    id: number;
    name: string;
    city_code: number;
    city: string;
    address: string;
  }>;
}

/**
 * 获取城市编码
 * @param cookie
 * @param proxyAgent
 */
export const getLocationCityCodeAsync = async (
  cookie: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<number> => {
  let city_code = 1;
  const signUrl =
    'https://api.map.baidu.com/?qterm=pc&coding=utf-8&coord=bd09ll&extensions=1&callback_type=jsonp&ak=Rrgce2Zp0Q91B5xm11ekeIL4BrGYHznz&qt=hip&v=3.0&ie=utf-8&oue=1&fromproduct=jsapi&res=api&ak=' +
    ak +
    '&callback=BMap._rd._cbk17583';

  const url = await getSign(signUrl);

  const result = await $http.get<unknown, AxiosResponse<string>>(url, {
    headers: {
      cookie: cookie,
      referer: 'https://baijiahao.baidu.com/',
      host: 'api.map.baidu.com',
    },
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  result.data = result.data.split('cbk17583(')[1];
  result.data = result.data.slice(0, result.data.length - 1);

  const jsonData = JSON.parse(result.data);

  if (jsonData?.content?.address_component?.city_code) {
    city_code = jsonData?.content?.address_component?.city_code;
  }

  return city_code;
};

/**
 * 获取位置搜索信息
 * @param cookie
 * @param keyword 关键字
 * @param city_code 城市code
 * @param proxyAgent
 */
export const getLocationAsync = async (
  cookie: string,
  keyword: string,
  city_code: number = 1,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<BaijiahaoLocationResponse> => {
  const signUrl =
    'https://api.map.baidu.com/?qt=s&c=' +
    city_code +
    '&wd=' +
    encodeURIComponent(keyword) +
    '&rn=10&ie=utf-8&oue=1&fromproduct=jsapi&res=api&ak=' +
    ak +
    '&callback=BMap._rd._cbk12992';

  const url = await getSign(signUrl);

  const result = await $http.get<unknown, AxiosResponse<string>>(url, {
    headers: {
      cookie: cookie,
      referer: 'https://baijiahao.baidu.com/',
      host: 'api.map.baidu.com',
    },
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  const content: BaijiahaoLocationResponse = {
    errno: 0,
    errmsg: '',
    content: [],
  };

  result.data = result.data.split('cbk12992(')[1];
  result.data = result.data.slice(0, result.data.length - 1);
  const jsonData = JSON.parse(result.data);

  if (jsonData?.content && jsonData?.content?.length > 0) {
    content.content = jsonData?.content;
  }

  return content;
};

export interface BaijiahaoLocationItem {
  /**
   * 地址全称，发布用
   */
  addr: string;

  area: number;
  area_name: string;
  biz_type: number;
  catalogID: number;
  /**
   * 城市id，发布用
   */
  city_id: number;
  /**
   * 街道/地点id，发布用
   */
  street_id: string;
  /**
   * 城市名称，发布用
   */
  city_name: string;
  /**
   * 商业标签，发布用
   */
  cla: [];
  class_similar_score: number;
  click_flag: number;
  detail: number;
  diPointX: number;
  diPointY: number;
  di_tag: string;
  dis: number;
  dist2route: number;
  dist2start: number;
  ernie_score: number;
  ext_type: number;
  f_flag: number;
  father_son: number;
  flag_type: string;
  geo: string;
  geo_type: number;
  history_address: string;
  hit_tag_press: number;
  is_top_nat: number;
  /**
   * 地点显示名称，发布也用
   */
  name: string;
  navi_update_time: number;
  navi_x: string;
  navi_y: string;
  new_catalog_id: string;
  poiType: number;
  poi_click_num: number;
  poi_profile: number;
  primary_uid: string;
  query_guide: string;
  route_flag: number;
  status: number;
  std_tag: string;
  std_tag_id: string;
  storage_src: string;
  tag: string;
  ty: number;
  /**
   * 街道/地点id，发布用
   */
  uid: string;
  view_type: number;
  x: number;
  y: number;
}

export interface BaijiahaoLocationResponse {
  errno: number;
  errmsg: string;
  content: Array<BaijiahaoLocationItem>;
}
