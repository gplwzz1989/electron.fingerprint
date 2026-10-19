import { $http } from '@/http';
import { isJson } from '@/utils';
import { HttpsProxyAgent } from 'https-proxy-agent';

export const getLocationListResponse = async (
  cookie: string,
  keyWord: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<XinlangweiboLocationResponse> => {
  const url = 'https://www.weibo.com/ajax/statuses/place?page=1';

  const headers = {
    cookie: cookie,
    'X-XSRF-TOKEN': cookie?.split('XSRF-TOKEN=')[1]?.split(';')[0],
    Referer: 'https://weibo.com/',
    'client-version': 'v2.46.6',
    'server-version': 'v2024.08.27.1',
  };
  const result = await $http.get(url, {
    headers: headers,
    params: {
      q: keyWord ? keyWord : undefined,
    },
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });
  return result.data;
};
export interface XinlangweiboLocationResponse {
  data: {
    /**
     * 地点列表
     */
    pois: Array<XinlangweiboLocationInfo>;
  };
  ok: number;
}

export interface XinlangweiboLocationInfo {
  /**
   * 当前列表唯一id
   */
  yixiaoerId: string;
  /**
   * 显示名称
   */
  yixiaoerName: string;
  /**
   * 地点id
   */
  poiid: string;
  /**
   * 地点名称
   */
  title: string;
  /**
   * 地点详细地址
   */
  address: string;

  lat: string;
  category: number;
  base_weight: number;
  /**
   * 城市区号/编码
   */
  city: number;

  district: string;
  dis: string;
  dis_calc_score: string;
  dis_score: string;
  score: number;
  /**
   * 地点显示名称，发布时需要
   */
  pc_title: string;
  /**
   * 城市id
   */
  city_id: number;

  lon: string;
  categorys: string;
  checkin_user_num: string;
  client_show: string;
}
