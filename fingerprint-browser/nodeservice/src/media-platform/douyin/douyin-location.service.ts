import { $http, HttpConfig } from '../../http';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { GeoLocation, ListItemInfo } from '@/media-platform';
/**
 * 当前城市
 */
const currentDouYinCity: any = {};
export const getLocation = async (
  cookie: string,
  keyWord: string,
  locationType: number = 0,
  pageNum: number = 1,
  proxyAgent?: HttpsProxyAgent<string> | object,
  coords?: GeoLocation,
  pageSize: number = 12,
  load_interest_city_type: number = 0,
  city?: ListItemInfo,
  locationMode?: number,
): Promise<douyinLocationResponse> => {
  if (city?.yixiaoerId) {
    locationType = 7;
  }
  const proxyOptions = proxyAgent ? proxyAgent['connectOpts'] ?? proxyAgent['proxy'] : undefined;
  const cityKey = proxyAgent
    ? `${proxyOptions?.['host'] ?? 'unknown'}${proxyOptions?.['port'] ?? ''}`
    : 'common';
  if (currentDouYinCity[cityKey]) {
    city = {
      yixiaoerId: currentDouYinCity[cityKey].city_code,
      yixiaoerName: currentDouYinCity[cityKey].city.replace('市', ''),
    };
  } else {
    const reli = await getLocationByCoords(cookie, keyWord, locationType, 1, proxyAgent, undefined, 1, locationMode);
    if (reli?.poi_list?.length) {
      city = {
        yixiaoerId: reli.poi_list[0].address_info.city_code,
        yixiaoerName: reli.poi_list[0].address_info.city.replace('市', ''),
      };
      currentDouYinCity[cityKey] = reli.poi_list[0].address_info;
    }
  }
  let url = `https://creator.douyin.com/aweme/v1/life/video_api/search/poi/?count=${pageSize}&from_webapp=1&get_current_loc=1&keywords=${encodeURIComponent(
    keyWord ?? '',
  )}&search_type=${locationType}&poi_anchor_tab=2&page=${pageNum}&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${encodeURIComponent(
    HttpConfig.userAgent,
  )}&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&_signature=&poi_mode=${
    load_interest_city_type || city?.yixiaoerId ? 2 : 1
  }`;
  //poi_mode 1 带货 2 打卡
  if (load_interest_city_type) {
    url = `${url}&load_interest_city_type=1`;
  }
  if (city?.yixiaoerId) {
    url = `${url}&selected_city_code=${city.yixiaoerId}&selected_city_name=${encodeURIComponent(city.yixiaoerName)}`;
  }

  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
  };

  const result = await $http.get<douyinLocationResponse>(url, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });
  // if (currentDouYinCity && !currentDouYinCity[cityKey]?.city_code && result?.data?.poi_list?.length) {
  //   currentDouYinCity[cityKey] = {
  //     city: result.data.poi_list[0].address_info?.city,
  //     city_code: result.data.poi_list[0].address_info?.city_code,
  //   };
  // }

  return result.data;
};

export const getLocationAll = async (
  cookie: string,
  keyWord: string,
  locationType: number = 0,
  pageNum: number = 1,
  proxyAgent?: HttpsProxyAgent<string> | object,
  coords?: GeoLocation,
  pageSize: number = 12,
  load_interest_city_type: number = 0,
  city?: ListItemInfo,
  locationMode?: number,
): Promise<douyinLocationResponse> => {
  const url = `https://creator.douyin.com/aweme/v1/life/video_api/search/poi/?aid=1128&browser_language=zh-CN&browser_name=Mozilla&browser_online=true&browser_platform=Win32&browser_version=5.0+(Windows+NT+10.0%3B+Win64%3B+x64)+AppleWebKit%2F537.36+(KHTML%2C+like+Gecko)+360%2F4.6.9+Chrome%2F138.0.7204.185+Safari%2F537.36&cookie_enabled=true&count=12&from_webapp=1&get_current_loc=1&keywords=${encodeURIComponent(
    keyWord,
  )}&options=%7B%7D&page=1&poi_anchor_tab=2&poi_mode=1&screen_height=1080&screen_width=1920&search_type=2&support_h265=1&timezone_name=Asia%2FShanghai`;

  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
  };

  const result = await $http.get<douyinLocationResponse>(url, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });
  // if (currentDouYinCity && !currentDouYinCity[cityKey]?.city_code && result?.data?.poi_list?.length) {
  //   currentDouYinCity[cityKey] = {
  //     city: result.data.poi_list[0].address_info?.city,
  //     city_code: result.data.poi_list[0].address_info?.city_code,
  //   };
  // }

  return result.data;
};

export const getLocationByCity = async (
  cookie: string,
  keyWord: string,
  locationType: number = 0,
  pageNum: number = 1,
  proxyAgent?: HttpsProxyAgent<string> | object,
  coords?: GeoLocation,
  pageSize: number = 12,
  load_interest_city_type: number = 0,
  city?: ListItemInfo,
  locationMode?: number,
): Promise<douyinLocationResponse> => {
  if (city?.yixiaoerId) {
    locationType = 7;
  }
  let url = `https://creator.douyin.com/aweme/v1/life/video_api/search/poi/?count=${pageSize}&from_webapp=1&get_current_loc=1&keywords=${encodeURIComponent(
    keyWord ?? '',
  )}&search_type=${locationType}&poi_anchor_tab=2&page=${pageNum}&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${encodeURIComponent(
    HttpConfig.userAgent,
  )}&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&_signature=&poi_mode=2&latitude=${
    coords?.latitude ?? 0
  }&longitude=${coords?.longitude ?? 0}`;
  //poi_mode 1 带货 2 打卡
  if (load_interest_city_type) {
    url = `${url}&load_interest_city_type=1`;
  }
  if (city?.yixiaoerId) {
    url = `${url}&selected_city_code=${city.yixiaoerId}&selected_city_name=${encodeURIComponent(city.yixiaoerName)}`;
  }

  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
  };

  const result = await $http.get(url, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};
export const getLocationByCoords = async (
  cookie: string,
  keyWord: string,
  locationType: number = 0,
  pageNum: number = 1,
  proxyAgent?: HttpsProxyAgent<string> | object,
  coords?: GeoLocation,
  pageSize: number = 12,
  load_interest_city_type: number = 0,
  city?: ListItemInfo,
  locationMode?: number,
): Promise<douyinLocationResponse> => {
  if (city?.yixiaoerId) {
    locationType = 7;
  }
  let url = `https://creator.douyin.com/aweme/v1/life/video_api/search/poi/?count=${pageSize}&from_webapp=1&get_current_loc=1&keywords=${encodeURIComponent(
    keyWord ?? '',
  )}&search_type=${locationType}&poi_anchor_tab=2&page=${pageNum}&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${encodeURIComponent(
    HttpConfig.userAgent,
  )}&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&_signature=`;
  if (coords?.latitude && locationMode === 1) {
    url = `${url}&poi_mode=1&latitude=${coords?.latitude ?? 0}&longitude=${coords?.longitude ?? 0}`;
  } else if (coords?.latitude) {
    url = `${url}&poi_mode=2&latitude=${coords?.latitude ?? 0}&longitude=${coords?.longitude ?? 0}`;
  } else {
    url = `${url}&poi_mode=2`;
  }
  //poi_mode 1 带货 2 打卡
  if (load_interest_city_type) {
    url = `${url}&load_interest_city_type=1`;
  }
  if (city?.yixiaoerId) {
    url = `${url}&selected_city_code=${city.yixiaoerId}&selected_city_name=${encodeURIComponent(city.yixiaoerName)}`;
  }

  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
  };

  const result = await $http.get(url, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

//没有定位权限的默认带货地址
export const getLocationByDefaultGoods = async (
  cookie: string,
  keyWord: string,
  locationType: number = 0,
  pageNum: number = 1,
  proxyAgent?: HttpsProxyAgent<string> | object,
  pageSize: number = 12,
): Promise<douyinLocationResponse> => {
  const url = `https://creator.douyin.com/aweme/v1/life/video_api/search/poi/?count=${pageSize}&from_webapp=1&get_current_loc=1&keywords=${encodeURIComponent(
    keyWord ?? '',
  )}&search_type=${locationType}&poi_anchor_tab=2&page=${pageNum}&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${encodeURIComponent(
    HttpConfig.userAgent,
  )}&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&_signature=&poi_mode=1`;

  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
  };

  const result = await $http.get(url, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export const getLocationCityList = async (
  cookie: string,
  keyWord: string,
  locationType: number = 0,
  pageNum: number = 1,
  proxyAgent?: HttpsProxyAgent<string> | object,
  coords?: GeoLocation,
  pageSize: number = 12,
  load_interest_city_type: number = 0,
  city?: ListItemInfo,
): Promise<douyinLocationResponse> => {
  if (city?.yixiaoerId) {
    locationType = 7;
  }
  let url = `https://creator.douyin.com/aweme/v1/life/video_api/search/poi/?count=${pageSize}&from_webapp=1&get_current_loc=1&keywords=${encodeURIComponent(
    keyWord ?? '',
  )}&search_type=${locationType}&poi_anchor_tab=2&page=${pageNum}&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${encodeURIComponent(
    HttpConfig.userAgent,
  )}&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&_signature=&poi_mode=2&latitude=${
    coords?.latitude ?? 0
  }&longitude=${coords?.longitude ?? 0}`;
  //poi_mode 1 带货 2 打卡
  if (load_interest_city_type) {
    url = `${url}&load_interest_city_type=1`;
  }
  if (city?.yixiaoerId) {
    url = `${url}&selected_city_code=${city.yixiaoerId}&selected_city_name=${encodeURIComponent(city.yixiaoerName)}`;
  }

  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
  };

  const result = await $http.get(url, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface douyinLocationResponse {
  /**
   * 状态码
   */
  status_code: number;
  /**
   * 消息
   */
  status_msg: string;
  /**
   *地点列表
   */
  poi_list: Array<DouyinLocationInfo>;
  current_locs: Array<DouyinLocationInfo>;
  /**
   * 是否有更多
   */
  has_more: number;
  /**
   * 当前是多少也页
   */
  page: number;
  user_interest_city_code_list: Array<{
    code: string;
    interested_code_type: number;
    name: string;
    show_filter_option: boolean;
  }>;
}

export interface DouyinLocationInfo {
  /**
   * 商业圈名称
   */
  business_area_name: string;
  /**
   * 地点名称
   */
  poi_name: string;
  simple_address_str: string;
  /**
   * 地址编码
   */
  poi_id: string;

  /**
   * 商品数
   */
  spu_count: number;
  /**
   * 返佣商品数
   */
  cps_spu_count: number;
  /**
   * 经度
   */
  poi_latitude: number;

  /**
   * 纬度
   */
  poi_longitude: number;
  /**
   * 播放数
   */
  view_count: string;
  /**
   *  地点信息
   */
  address_info: {
    /**
     * 详细地址
     */
    addr_with_extra_info: string;
    /**
     * 省份名称
     */
    province: string;
    /**
     * 城市名称
     */
    city: string;
    /**
     * 街道名称
     */
    address: string;
    /**
     * 短地址
     */
    simple_addr: string;
    /**
     * 城市编码
     */
    city_code: string;
    /**
     * 区县
     */
    district: string;
  };
}
export const getLocationGoodsInfoResponse = async (
  cookie: string,
  poiId: string,
): Promise<DouYinLocationGoodsResponse> => {
  const url = `https://creator.douyin.com/aweme/v1/poi/cps/detail/v2/`;

  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
  };

  const params = {
    from_webapp: 1,
    poi_id: poiId,
    options: '{}',
    cookie_enabled: true,
    screen_width: 1920,
    screen_height: 1080,
    browser_language: 'zh-CN',
    browser_platform: 'Win32',
    browser_name: 'Mozilla',
    browser_version: HttpConfig.userAgent,
    browser_online: true,
    timezone_name: 'Asia/Shanghai',
    aid: 1128,
    support_h265: 0,
  };

  const result = await $http.get(url, {
    headers: headers,
    params: params,
  });

  return result.data;
};
export interface DouYinLocationGoodsResponse {
  /**
   * 商家信息
   */
  cps_detail: DouYinLocationGoodsDetail;
  /**
   * 0：正常，非0异常
   */
  status_code: number;
  status_msg: string;
}

export interface DouYinLocationGoodsDetail {
  /**
   * 详细地址
   */
  address: string;
  /**
   * 该地值的商家列表
   */
  platform_list: Array<{
    /**
     * 该商家返佣商品数
     */
    cps_spu_count: number;
    /**
     * 该商家的商品列表
     */
    cps_spu_list: Array<{
      /**
       * 可赚金额，单位为 分
       */
      earn_price?: number;
      /**
       * 图片信息
       */
      image_url: {
        /**
         * 图片url列表
         */
        url_list: Array<string>;
      };
      // product_sub_type: number;
      // product_type: number;
      /**
       * 售价 单位为分
       */
      sale_price: number;
      // sale_tags: null | any[];
      // sale_tags_separator: null;
      // spu_cate: number;
      // spu_entry: {
      //   schema_type: number;
      //   title: string;
      //   url: string;
      // };
      spu_id: string;
      /**
       * 商品名称
       */
      spu_name: string;
      // spu_type_name: string;
      /**
       * 返佣万分比
       */
      take_rate?: number;
      // take_rate_range: null;
    }>;

    is_cps: boolean;
    /**
     * 商家名称
     */
    platform_name: string;
    /**
     * 商家类型，发布时选择的商家需要用到
     */
    platform_source: number;
    /**
     * 小程序id
     */
    mini_app_id: string;
    /**
     * 该商家商品数
     */
    spu_count: number;
  }>;

  poi_id: string;
  /**
   * poi名称
   */
  poi_name: string;
}

export const getGoodsLocation = async (
  cookie: string,
  keyWord: string,
  locationType: number = 0,
  pageNum: number = 1,
  proxyAgent?: HttpsProxyAgent<string> | object,
  coords?: GeoLocation,
  pageSize: number = 12,
  load_interest_city_type: number = 0,
  city?: ListItemInfo,
): Promise<douyinLocationResponse> => {
  if (city?.yixiaoerId) {
    locationType = 7;
  }
  let url = `https://creator.douyin.com/aweme/v1/life/video_api/search/poi/?count=${pageSize}&from_webapp=1&get_current_loc=1&keywords=${encodeURIComponent(
    keyWord ?? '',
  )}&search_type=${locationType}&poi_anchor_tab=2&page=${pageNum}&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${encodeURIComponent(
    HttpConfig.userAgent,
  )}&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&_signature=&poi_mode=${
    load_interest_city_type ? 2 : 1
  }&latitude=${coords?.latitude ?? 0}&longitude=${coords?.longitude ?? 0}`;
  //poi_mode 1 带货 2 打卡
  if (load_interest_city_type) {
    url = `${url}&load_interest_city_type=1`;
  }
  if (city?.yixiaoerId) {
    url = `${url}&selected_city_code=${city.yixiaoerId}&selected_city_name=${encodeURIComponent(city.yixiaoerName)}`;
  }

  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
  };

  const result = await $http.get(url, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};
export const getLocationGoodsListResponse = async (
  cookie: string,
  keyWord?: string,
  cityCode: string = '000000',
  cursor: number = 0,
  pageSize: number = 10,
): Promise<DouYinLocationGoodsListResponse> => {
  const url = `https://creator.douyin.com/aweme/v1/poi/search/spu?`;

  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/content/publish?enter_from=publish_page',
    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
  };

  const params = {
    keyword: keyWord ?? '',
    cursor: cursor,
    city_code: cityCode,
    count: pageSize,
    scene: 0,
    edit_page: false,
    ignore_check_poi: false,
    edit_page_poi_id: '',
    device_city_code: cityCode,
    cookie_enabled: true,
    screen_width: 1920,
    screen_height: 1080,
    browser_language: 'zh-CN',
    browser_platform: 'Win32',
    browser_name: encodeURIComponent(HttpConfig.userAgent),
    browser_online: true,
    timezone_name: 'Asia%2FShanghai',
    aid: 1128,
    support_h265: 0,
    msToken: '',
    a_bogus: '',
  };

  const result = await $http.get(url, {
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface DouYinLocationGoodsListResponse {
  status_code: number;
  status_msg: string;
  cps_spu_list: Array<DouYinCpsSpuItem>;
  has_more: number;
}

export interface DouYinCpsSpuItem {
  /**
   * 售价，分
   */
  actual_price: number;
  /**
   * 佣金，分
   */
  earn_price: number;
  /**
   * 商品名称
   */
  spu_name: string;

  /**
   * 佣金率，万分比
   */
  take_rate: number;

  poi: {
    poi_id: string;
    /**
     * 地址名称?店铺名称?
     */
    poi_name: string;
  };

  /**
   * 图片列表
   */
  image_url: {
    url_list: Array<string>;
  };
  show_type: number;
  /**
   * 商品id
   */
  spu_id: string;

  product_type: number;
}
