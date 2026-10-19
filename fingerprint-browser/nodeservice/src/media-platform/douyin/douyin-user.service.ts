import { $http, HttpConfig } from '../../http';
import { isJson } from '../../utils';
import { AxiosResponse } from 'axios';

export let DouyinPublicAuthorSearchDefaultCookie = 'pre_reload_logid=20260721221832667A010C1206B25EA9E0; douyin_search_screen=1478*679; x_mac_env=2; ttwid=1%7Cgmg23-nXbNZpm9g2-tuq3iL73yxPLXT1L1byXPeczzM%7C1784643512%7Ce4fef3ed87abe029679a75ad913fca769d84ce772430f58cffa009f92855e743; s_recover_ttwid=1%7Cgmg23-nXbNZpm9g2-tuq3iL73yxPLXT1L1byXPeczzM%7C1784643512%7Ce4fef3ed87abe029679a75ad913fca769d84ce772430f58cffa009f92855e743; ttwid=1%7Cgmg23-nXbNZpm9g2-tuq3iL73yxPLXT1L1byXPeczzM%7C1784643512%7Ce4fef3ed87abe029679a75ad913fca769d84ce772430f58cffa009f92855e743; tti_opt_long_task=0; inline_source_cdn=0; __tea_cache_tokens_581610={%22_type_%22:%22default%22}; x-use-dcz=0; use-esr=0; browser_font_scale=1; search_webid=7664985473421035060; gfkadpd=581610,29095; __security_mc_1_s_sdk_crypt_sdk=ead32e08-4fc7-93ee; s_v_web_id=verify_mruqo4ac_cjAMnukR_WPVR_4gCs_A6Mp_UlYsg5R8XcT6; passport_csrf_token=aa842f26de448e44b73c7808412d7f17; passport_csrf_token_default=aa842f26de448e44b73c7808412d7f17; biz_trace_id=bbc5a0f3';
const DouyinPublicAuthorSearchUserAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0';
const DouyinPublicAuthorSearchSecChUa = '"Microsoft Edge";v="149", "Chromium";v="149", "Not)A;Brand";v="24"';
const DouyinPublicAuthorSearchAcceptLanguage = 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7,en-GB;q=0.6';

const appendDouyinPublicAuthorSearchCookie = (cookie: string, name: string, value: string): string => {
  if (!name) {
    return cookie;
  }
  const cookieList = cookie
    .split(';')
    .map((item) => item.trim())
    .filter((item) => item && !item.startsWith(`${name}=`));
  cookieList.push(`${name}=${value}`);
  return `${cookieList.join('; ')};`;
};

const mergeDouyinPublicAuthorSearchResponseCookie = (cookie: string, setCookie: unknown): string => {
  const responseCookieList = Array.isArray(setCookie) ? setCookie : typeof setCookie === 'string' ? [setCookie] : [];
  return responseCookieList.reduce((currentCookie, responseCookie) => {
    const cookiePair = responseCookie.split(';')[0]?.trim();
    const equalIndex = cookiePair.indexOf('=');
    if (equalIndex <= 0) {
      return currentCookie;
    }
    return appendDouyinPublicAuthorSearchCookie(
      currentCookie,
      cookiePair.slice(0, equalIndex).trim(),
      cookiePair.slice(equalIndex + 1).trim(),
    );
  }, cookie);
};

const syncDouyinPublicAuthorSearchResponseCookie = (requestCookie: string, setCookie: unknown): string => {
  const nextDefaultCookie = mergeDouyinPublicAuthorSearchResponseCookie(DouyinPublicAuthorSearchDefaultCookie, setCookie);
  DouyinPublicAuthorSearchDefaultCookie = nextDefaultCookie;
  return mergeDouyinPublicAuthorSearchResponseCookie(requestCookie, setCookie);
};

const hasDouyinPublicAuthorSearchData = (html: string | undefined): boolean => {
  return !!(
    html?.includes('douyin.doctype_aweme_user') ||
    html?.includes('predictAckData') ||
    html?.includes('business_data') ||
    html?.includes('userInfo-oWHbVJ')
  );
};

/**
 * 获取地理位置权益
 * @param cookie
 */
export const getUserPositionPrivilege = async (cookie: string): Promise<LocationAnchorResponse> => {
  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/home',
    Origin: 'https://creator.douyin.com',
  };
  const url = `https://creator.douyin.com/aweme/v1/poi/recommend/?from_webapp=1&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${encodeURIComponent(
    HttpConfig.userAgent,
  )}&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&_signature=_`;

  const result = await $http.get(url, {
    headers: headers,
  });

  return result.data;
};

export const getUserPositionPrivilegeNew = async (cookie: string): Promise<LocationAnchorResponse> => {
  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/home',
    Origin: 'https://creator.douyin.com',
  };
  const url = `https://creator.douyin.com/aweme/v1/life/video_api/post/permission/?from_webapp=1&is_image_album_style=0&options=%7B%7D&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${encodeURIComponent(
    HttpConfig.userAgent,
  )}&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&support_h265=0&msToken=`;

  const result = await $http.get(url, {
    headers: headers,
  });

  return result.data;
};

export interface LocationAnchorResponse {
  /**
   * 普通号:'你在哪里',带货号:'添加位置/门店推广';
   */
  default_text: string;
  /**
   * 知否支持全局搜索
   */
  enable_global_search: boolean;
  has_posted: false;
  has_promote_auth: boolean;
  /**
   * 支持海外权限
   */
  is_oversea: boolean;

  poi_anchor_tab_list: [0, 1];
  poi_anchor_tab_open_default: 1;

  post_role: 1;
  select_first_recommend: false;
  status_code: number;
  status_msg: string;
}

/**
 * 获取商品挂车权益
 * @param cookie
 * @param proxyAgent
 */
export const getUserShopPrivilege = async (
  cookie: string,
  proxyAgent: object | undefined = undefined,
): Promise<{ is_over_bind_cnt: boolean; status_code: number; status_message: string }> => {
  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/home',
    Origin: 'https://creator.douyin.com',
  };
  const url = `https://creator.douyin.com/web/api/media/user/cart/?cookie_enabled=true&screen_width=1366&screen_height=768&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=${encodeURIComponent(
    HttpConfig.userAgent,
  )}&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&_signature=`;

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });
  return result.data;
};

/**
 * 抖音好友/用户信息
 */
export interface DouyinUserInfo {
  /**
   * 头像url列表
   */
  avatar_larger: {
    url_list: Array<string>;
  };
  avatar_medium: {
    url_list: Array<string>;
  };
  avatar_thumb: {
    url_list: Array<string>;
  };
  /**
   * 挂载权限列表 包含4时表示有小程序挂载权限
   * 4:小程序  11:影视  13003:购票
   *
   */
  permission?: {
    anchor: Array<number>;
  };
  /**
   * 作品数
   */
  aweme_count: number;
  card_entries: string;
  /**
   * 个人认证
   */
  custom_verify: string;
  /**
   * 企业认证
   */
  enterprise_verify_reason: string;
  /**
   * 是否具有挂车权限
   */
  with_commerce_entry: boolean;
  /**
   * 喜欢数
   */
  favoriting_count: number;
  /**
   * 粉丝数
   */
  follower_count: number;
  /**
   * 关注数
   */
  following_count: number;
  /**
   * 昵称
   */
  nickname: string;
  /**
   * 地域
   */
  region: string;
  /**
   * 加密安全用户id
   */
  sec_uid: string;
  /**
   *默认抖音号
   */
  short_id: string;
  /**
   * 个性签名
   */
  signature: string;
  /**
   * 状态
   */
  status: number;
  /**
   * 总收藏数
   */
  total_favorited: string;
  /**
   * 支持挂在类型列表
   */
  type_label: Array<number>;
  /**
   * 用户userid/uid
   */
  uid: string;
  /**
   * 自定义抖音号
   */
  unique_id: string;
  /**
   * 认证类型
   */
  verification_type: number;
  /**
   * 是否有合集权限
   */
  mix_permission: boolean;

  /**
   * 是否同步到西瓜
   */
  sync_to_xigua: number;
}

/**
 * 获取创作用户信息
 * @param {string} cookie cookie
 * @param proxy
 * @return {Promise<getCreatorUserInfoOutput>}
 */
export const getCreatorUserInfo = async (
  cookie: string,
  proxy: object | undefined = undefined,
): Promise<getCreatorUserInfoOutput> => {
  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/home',
    Origin: 'https://creator.douyin.com',
  };
  const result = await $http.get<unknown, AxiosResponse<getCreatorUserInfoOutput>>(
    'https://creator.douyin.com/aweme/v1/creator/user/info/',
    {
      retryCondition: (error, response) => {
        const a = !isJson(response.data);
        console.log('retryCondition:', a);
        return a;
      },
      headers: headers,
      httpAgent: proxy,
      httpsAgent: proxy,
      params: {},
    },
  );

  return result.data;
};

/**
 * 获取创作用户信息输出项
 */
export interface getCreatorUserInfoOutput {
  /**
   * 抖音用户验证信息
   */
  douyin_user_verify_info: {
    /**
     * 头像地址
     */
    avatar_url: string;
    /**
     * 抖音号ID
     */
    douyin_unique_id: string;
    /**
     * 关注数
     */
    follower_count: number;
    /**
     * 粉丝数
     */
    following_count: number;
    /**
     * 是否超级标签用户
     */
    is_super_tag_user: boolean;
    /**
     * 账号昵称
     */
    nick_name: string;
    /**
     * 同步至西瓜视频
     */
    sync_to_xigua: boolean;
    teen_model: boolean;
    /**
     * 获赞总数
     */
    total_favorited: number;
  };
  /**
   * 是否商业用户
   */
  is_commerce_user: boolean;
  /**
   * 是否注册
   */
  is_registered: boolean;
  /**
   * 人信息
   */
  person_info: {
    /**
     * 分类
     *  - 如：生活记录
     */
    category: string;
  };
  /**
   * 角色
   */
  roles: Array<{ id: number; key: string; name: string }>;
  /**
   * 状态码
   */
  status_code: number;
  /**
   * 状态消息
   */
  status_msg?: string;
  /**
   * 用户信息
   */
  user_profile: {
    /**
     * 账号地区
     */
    account_region: string;
    /**
     * 头像地址
     */
    avatar_url: number;
    /**
     * 关注数
     */
    follower_count: number;
    /**
     * 粉丝数
     */
    following_count: number;
    /**
     * 地区
     */
    location: string;
    /**
     * 是否仅使用TC登录
     */
    login_with_only_tc: boolean;
    /**
     * 手机号码（加密）
     *  - 如：133******76
     */
    mobile: string;
    /**
     * 昵称
     *  - 如：Midnight
     */
    nick_name: string;
    /**
     * 加密ID
     *  - 如：MS4wLjABAAAATVL-tW8PUSOZlcNwKJ4guFrOS_ECR9uMkogBON3rPmg
     */
    secret_id: string;
    /**
     * 个性签名
     */
    signature: string;
    /**
     * 获赞总数
     */
    total_favorited: number;
    /**
     * 抖音号ID
     */
    unique_id: string;
  };
}

/**
 * 获取媒体用户信息
 * @param {string} cookie
 * @param proxy
 * @return {Promise<getMediaUserInfoOutput>}
 */
export const getMediaUserInfo = async (
  cookie: string,
  proxy: object | undefined = undefined,
): Promise<getMediaUserInfoOutput> => {
  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/home',
    Origin: 'https://creator.douyin.com',
  };
  const result = await $http.get<never, AxiosResponse<getMediaUserInfoOutput>>(
    'https://creator.douyin.com/web/api/media/user/info',
    {
      headers: headers,
      httpAgent: proxy,
      httpsAgent: proxy,
    },
  );

  // 请求失败
  // if (result.data.status_code !== 0) {
  //   throw new BadRequestException(result.data?.status_msg, result.data?.status_code, result.data);
  // }

  return result.data;
};

/**
 * 获取媒体用户信息输出项
 */
export interface getMediaUserInfoOutput {
  /**
   * 状态码
   */
  status_code: number;

  /**
   * 提示信息
   */
  status_msg: string;
  /**
   * 用户信息
   */
  user: DouyinUserInfo;
}

export const getMediaUserAnchor = async (
  cookie: string,
  proxy: object | undefined = undefined,
): Promise<DouYinAnchorResponse> => {
  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/home',
    Origin: 'https://creator.douyin.com',
  };
  const url =
    'https://creator.douyin.com/web/api/media/user/anchor/list?item_type=1&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=5.0+%28Windows+NT+10.0%3B+Win64%3B+x64%29+AppleWebKit%2F537.36+%28KHTML%2C+like+Gecko%29+Chrome%2F108.0.5359.215+Safari%2F537.36&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&support_h265=0&msToken=&a_bogus=';

  const result = await $http.get(url, {
    headers: headers,
    httpAgent: proxy,
    httpsAgent: proxy,
  });
  return result.data;
};

export interface DouYinAnchorResponse {
  abTestCode: number;
  /**
   * 2:位置
   * 3:购物车
   * 4:小程序
   * 11:影视演绎
   * 13010:团购
   * 13017:游戏手柄
   * 13093:标记万物
   */
  availableAnchor: Array<number>;
  status_code: number;
  status_msg: '';
  /**
   * 未开通权限
   */
  unavailableAnchor: [
    { anchor: 15; reason: '' },
    { anchor: 11002; reason: '' },
    { anchor: 13002; reason: '' },
    { anchor: 13034; reason: '' },
    { anchor: 13051; reason: '' },
    { anchor: 13006; reason: '' },
    { anchor: 13009; reason: '' },
    { anchor: 14; reason: '' },
  ];
}

export const getPCUserInfo = async (
  cookie: string,
  proxy: object | undefined = undefined,
): Promise<{ status_code: number; status_ms: string }> => {
  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/home',
    Origin: 'https://creator.douyin.com',
  };
  const url = 'https://creator.douyin.com/aweme/v1/creator/pc/user/info/';
  const result = await $http.get(url, {
    headers: headers,
    httpAgent: proxy,
    httpsAgent: proxy,
  });

  return result.data;
};

export const getXiGuaUserInfo = async (
  cookie: string,
  proxy: object | undefined = undefined,
): Promise<{ status_code: number; status_ms: string }> => {
  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/home',
    Origin: 'https://creator.douyin.com',
  };
  const url = 'https://creator.douyin.com/web/api/v2/creator/xigua/user/info';
  const result = await $http.get(url, {
    headers: headers,
    httpAgent: proxy,
    httpsAgent: proxy,
  });

  return result.data;
};

export const getSyncAppListResponse = async (
  cookie: string,
  proxy: object | undefined = undefined,
): Promise<DouYinSyncAppListResponse> => {
  const headers = {
    cookie: cookie,
    referer: 'https://creator.douyin.com/creator-micro/home',
    Origin: 'https://creator.douyin.com',
  };
  const url =
    'https://creator.douyin.com/aweme/v1/open/publish/limit_app_groups/?device_platform=pc&cookie_enabled=true&screen_width=1920&screen_height=1080&browser_language=zh-CN&browser_platform=Win32&browser_name=Mozilla&browser_version=5.0+%28Windows+NT+10.0%3B+Win64%3B+x64%29+AppleWebKit%2F537.36+%28KHTML%2C+like+Gecko%29+360%2F4.6.9+Chrome%2F138.0.7204.185+Safari%2F537.36&browser_online=true&timezone_name=Asia%2FShanghai&aid=1128&support_h265=1&msToken=&a_bogus=';
  const result = await $http.post(url, '', {
    headers: headers,
    httpAgent: proxy,
    httpsAgent: proxy,
  });

  return result.data;
};

export interface DouYinSyncAppListResponse {
  data: {
    limit_app_groups: Array<DouYinSyncAppInfo>;
    tip_message: string;
    remember_choice: boolean;
    enable_new_video_sync: boolean;
    old_version_keys_need_remove: Array<string>;
    sync_hint_text: string;
    sync_auth_text: string;
    sync_auth_title: string;
    sync_auth_text_alignment: string;
  };
  status_code: number;
  status_msg: string;
}

export interface DouYinSyncAppInfo {
  name: string; //'今日头条';
  icon: string;
  client_keys: Array<string>;
  selected: boolean;
  old_version_field: { sync_to_toutiao: string };
  tag_name: string;
}

/**
 * 获取抖音公开作者搜索页 HTML
 * @param cookie 为空时使用抓包中的公开搜索默认 cookie
 * @param keyWord 搜索关键词
 * @param proxy 代理
 */
export const getDouyinPublicAuthorSearchHtml = async (
  cookie: string | undefined,
  keyWord: string,
  proxy: object | undefined = undefined,
): Promise<string> => {
  let requestCookie = cookie?.trim() ? cookie : DouyinPublicAuthorSearchDefaultCookie;
  const params = new URLSearchParams({
    search_entrance: 'aweme',
    keyword: keyWord ?? '',
    enter_method: 'search_sug',
    group_id: '',
    pd: 'user',
  });

  const buildHeaders = () => ({
    cookie: requestCookie,
    referer: `https://so.douyin.com/s?${params.toString()}`,
    'User-Agent': DouyinPublicAuthorSearchUserAgent,
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': DouyinPublicAuthorSearchAcceptLanguage,
    'Upgrade-Insecure-Requests': '1',
    'sec-ch-ua': DouyinPublicAuthorSearchSecChUa,
    'sec-ch-ua-mobile': HttpConfig.sec_ch_ua_mobile,
    'sec-ch-ua-platform': HttpConfig.sec_ch_ua_platform,
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-User': '?1',
    'Sec-Fetch-Dest': 'document',
  });

  const requestSearchHtml = async (): Promise<string> => {
    const url = `https://so.douyin.com/s?${params.toString()}`;
    const result = await $http.get<unknown, AxiosResponse<string>>(url, {
      headers: buildHeaders(),
      httpAgent: proxy,
      httpsAgent: proxy,
      responseType: 'text',
    });
    requestCookie = syncDouyinPublicAuthorSearchResponseCookie(requestCookie, result.headers['set-cookie']);
    return result.data;
  };

  let html = await requestSearchHtml();
  if (html?.includes('reload_from') && html?.includes('abnormal_wh_3') && !hasDouyinPublicAuthorSearchData(html)) {
    requestCookie = appendDouyinPublicAuthorSearchCookie(requestCookie, 'douyin_search_screen', '1469*716');
    requestCookie = appendDouyinPublicAuthorSearchCookie(requestCookie, 'x_mac_env', '2');
    params.set('reload_from', 'abnormal_wh_3');
    html = await requestSearchHtml();
  }
  if (!hasDouyinPublicAuthorSearchData(html)) {
    params.set('enter_method', 'normal_search');
    params.delete('group_id');
    params.delete('reload_from');
    html = await requestSearchHtml();
  }
  return html;
};

/**
 * 获取抖音公开作者搜索加载更多数据
 * @param cookie 为空时使用抓包中的公开搜索默认 cookie
 * @param keyWord 搜索关键词
 * @param offset 搜索偏移量
 * @param searchId 首屏搜索结果中的 search_id
 * @param proxy 代理
 */
export const getDouyinPublicAuthorSearchMoreResponse = async (
  cookie: string | undefined,
  keyWord: string,
  offset: number,
  searchId: string,
  proxy: object | undefined = undefined,
): Promise<unknown> => {
  const requestCookie = cookie?.trim() ? cookie : DouyinPublicAuthorSearchDefaultCookie;
  const params = new URLSearchParams({
    aid: '581610',
    device_platform: 'webapp',
    search_source: 'normal_search',
    app_version: '290000',
    version_code: '290000',
    version_name: '29.0.0',
    webapp_platform: 'mac',
    webapp_platform_version: '',
    search_entrance: 'aweme',
    keyword: keyWord ?? '',
    enter_method: 'normal_search',
    pd: 'user',
    app_theme: 'light',
    count: '20',
    sort_params: '',
    appTheme: 'light',
    type: '1',
    need_filter_settings: '1',
    location_access: '',
    offset: offset.toString(),
    search_id: searchId,
    currentPage: (Math.floor(offset / 20) + 2).toString(),
    'options[stream]': 'false',
    cursor: offset.toString(),
  });
  const url = `https://so.douyin.com/aweme/v2/search/msite/discover/single/?${params.toString()}`;
  const headers = {
    cookie: requestCookie,
    referer: 'https://so.douyin.com/s',
    'User-Agent': HttpConfig.userAgent,
    Accept: '*/*',
    'Accept-Language': HttpConfig.acceptLanguage,
    'Content-Type': 'application/x-www-form-urlencoded',
    'sec-ch-ua': HttpConfig.sec_ch_ua,
    'sec-ch-ua-mobile': HttpConfig.sec_ch_ua_mobile,
    'sec-ch-ua-platform': HttpConfig.sec_ch_ua_platform,
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Dest': 'empty',
  };

  const result = await $http.get<unknown, AxiosResponse<unknown>>(url, {
    headers: headers,
    httpAgent: proxy,
    httpsAgent: proxy,
  });
  syncDouyinPublicAuthorSearchResponseCookie(requestCookie, result.headers['set-cookie']);
  return result.data;
};
