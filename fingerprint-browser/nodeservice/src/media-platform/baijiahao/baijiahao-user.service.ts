import { $http, HttpConfig } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { GetMD5 } from '../../utils';

export let BaijiahaoPublicAuthorSearchDefaultCookie =
  'RT="z=1&dm=baidu.com&si=089744fd-cadc-46ca-9000-2acfffadfc5f&ss=mqozs9yo&sl=1&tt=2us&bcn=https%3A%2F%2Ffclog.baidu.com%2Flog%2Fweirwood%3Ftype%3Dperf&ld=3mz&ul=hjf"';
const BaijiahaoPublicAuthorSearchUserAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36';
const BaijiahaoPublicAuthorSearchSecChUa = '"Google Chrome";v="149", "Chromium";v="149", "Not)A;Brand";v="24"';
const BaijiahaoPublicAuthorSearchAcceptLanguage = 'zh-CN,zh;q=0.9';

const appendBaijiahaoPublicAuthorSearchCookie = (cookie: string, name: string, value: string): string => {
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

const mergeBaijiahaoPublicAuthorSearchResponseCookie = (cookie: string, setCookie: unknown): string => {
  const responseCookieList = Array.isArray(setCookie) ? setCookie : typeof setCookie === 'string' ? [setCookie] : [];
  return responseCookieList.reduce((currentCookie, responseCookie) => {
    const cookiePair = responseCookie.split(';')[0]?.trim();
    const equalIndex = cookiePair.indexOf('=');
    if (equalIndex <= 0) {
      return currentCookie;
    }
    return appendBaijiahaoPublicAuthorSearchCookie(
      currentCookie,
      cookiePair.slice(0, equalIndex).trim(),
      cookiePair.slice(equalIndex + 1).trim(),
    );
  }, cookie);
};

const syncBaijiahaoPublicAuthorSearchResponseCookie = (requestCookie: string, setCookie: unknown): string => {
  const nextDefaultCookie = mergeBaijiahaoPublicAuthorSearchResponseCookie(
    BaijiahaoPublicAuthorSearchDefaultCookie,
    setCookie,
  );
  BaijiahaoPublicAuthorSearchDefaultCookie = nextDefaultCookie;
  return mergeBaijiahaoPublicAuthorSearchResponseCookie(requestCookie, setCookie);
};

const buildBaijiahaoPublicAuthorSearchSign = (
  pageNum: number,
  keyWord: string,
  pageSize: number,
  timestamp: number,
  version: number,
): string => {
  return GetMD5([pageNum, encodeURIComponent(keyWord), pageSize, timestamp, version].join('_'));
};

/**
 * 百家号用户首页统计数据
 * @param cookie 账号cookie
 */
export const getUserHomeDataAsync = async (cookie: string): Promise<BaijiahaoUserHomeDataResponse> => {
  const result = await $http.get<unknown, AxiosResponse<BaijiahaoUserHomeDataResponse>>(
    'https://baijiahao.baidu.com/pcui/home/index',
    {
      headers: {
        cookie: cookie,
        referer: 'https://baijiahao.baidu.com/builder/rc/home',
        host: 'baijiahao.baidu.com',
      },
      params: {},
    },
  );

  // 请求失败
  if (result.data.errno !== 0) {
    throw new BadRequestException(result.data?.errmsg, result.data?.errno, result.data);
  }

  return result.data;
};

/**
 * 百家号用户收益
 * @param cookie
 */
export const getUserIncomeAsync = async (cookie: string): Promise<BaijiahaoUserIncomeResponse> => {
  const result = await $http.get<unknown, AxiosResponse<BaijiahaoUserIncomeResponse>>(
    'https://baijiahao.baidu.com/author/eco/income2/newtotalincome',
    {
      headers: {
        cookie: cookie,
        referer: 'https://baijiahao.baidu.com/builder/rc/home',
        host: 'baijiahao.baidu.com',
      },
      params: {},
    },
  );

  // 请求失败
  if (result.data.errno !== 0) {
    throw new BadRequestException(result.data?.errmsg, result.data?.errno, result.data);
  }

  return result.data;
};

export interface BaijiahaoUserHomeDataResponse {
  errno: number;
  errmsg: string;
  data: {
    coreData: {
      yesterdayIncome: string;
      viewCount: number;
      fansCount: string;
      monthIncome: number;
      fansYestedayCount: string;
    };
    commonData: {
      inviteNewsOriginal: number;
      strategyNewsOriginal: number;
      inviteVideoOriginalNotice: number;
      strategyVideoOriginalNotice: number;
      inviteNewsOriginalGuidance: boolean;
      inviteVideoOriginalGuidance: boolean;
      inviteOriginal: number;
      inviteVideoOriginal: number;
      inviteGalleryOriginal: number;
      isCeremony: number;
      maxPublishNumber: number;
    };
  };
}

export interface BaijiahaoUserIncomeResponse {
  errno: number;
  errmsg: string;
  data: {
    total_income: string;
    yesterday_income: string;
  };
}

/**
 * 获取百家号公开作者搜索初始化 cookie
 * @param cookie 为空时使用公开搜索默认 cookie
 * @param proxyAgent 代理
 */
export const getBaijiahaoPublicAuthorSearchCookie = async (
  cookie: string | undefined,
  proxyAgent: HttpsProxyAgent<string> | object | undefined = undefined,
): Promise<string> => {
  let requestCookie = cookie?.trim() ? cookie : BaijiahaoPublicAuthorSearchDefaultCookie;
  const result = await $http.head<unknown, AxiosResponse<unknown>>('https://haokan.baidu.com/', {
    headers: {
      cookie: requestCookie,
      Host: 'haokan.baidu.com',
      'User-Agent': BaijiahaoPublicAuthorSearchUserAgent,
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': BaijiahaoPublicAuthorSearchAcceptLanguage,
      'Upgrade-Insecure-Requests': '1',
      'sec-ch-ua': BaijiahaoPublicAuthorSearchSecChUa,
      'sec-ch-ua-mobile': HttpConfig.sec_ch_ua_mobile,
      'sec-ch-ua-platform': HttpConfig.sec_ch_ua_platform,
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-User': '?1',
      'Sec-Fetch-Dest': 'document',
    },
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });
  requestCookie = syncBaijiahaoPublicAuthorSearchResponseCookie(requestCookie, result.headers['set-cookie']);
  return requestCookie;
};

/**
 * 获取百家号公开作者搜索响应
 * @param cookie 为空时使用公开搜索默认 cookie
 * @param keyWord 搜索关键词
 * @param pageNum 页码
 * @param proxyAgent 代理
 */
export const getBaijiahaoPublicAuthorSearchResponse = async (
  cookie: string | undefined,
  keyWord: string,
  pageNum: number = 1,
  proxyAgent: HttpsProxyAgent<string> | object | undefined = undefined,
): Promise<BaijiahaoPublicAuthorSearchResponse> => {
  const pageSize = 10;
  const version = 1;
  const timestamp = Date.now();
  const requestCookie = await getBaijiahaoPublicAuthorSearchCookie(cookie, proxyAgent);
  const params = new URLSearchParams({
    pn: pageNum.toString(),
    rn: pageSize.toString(),
    type: 'author',
    query: keyWord ?? '',
    sign: buildBaijiahaoPublicAuthorSearchSign(pageNum, keyWord ?? '', pageSize, timestamp, version),
    version: version.toString(),
    timestamp: timestamp.toString(),
  });
  const result = await $http.get<unknown, AxiosResponse<BaijiahaoPublicAuthorSearchResponse>>(
    `https://haokan.baidu.com/haokan/ui-search/pc/search/author?${params.toString()}`,
    {
      headers: {
        cookie: requestCookie,
        Host: 'haokan.baidu.com',
        referer: `https://haokan.baidu.com/web/search/page?query=${encodeURIComponent(keyWord ?? '')}`,
        'User-Agent': BaijiahaoPublicAuthorSearchUserAgent,
        Accept: '*/*',
        'Accept-Language': BaijiahaoPublicAuthorSearchAcceptLanguage,
        'x-requested-with': 'xmlhttprequest',
        'sec-ch-ua': BaijiahaoPublicAuthorSearchSecChUa,
        'sec-ch-ua-mobile': HttpConfig.sec_ch_ua_mobile,
        'sec-ch-ua-platform': HttpConfig.sec_ch_ua_platform,
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
      },
      httpAgent: proxyAgent,
      httpsAgent: proxyAgent,
    },
  );
  syncBaijiahaoPublicAuthorSearchResponseCookie(requestCookie, result.headers['set-cookie']);
  return result.data;
};

export interface BaijiahaoPublicAuthorSearchItem {
  appid?: string;
  name?: string;
  author_icon?: string;
  intro?: string;
  fansCnt?: number;
  videoCnt?: number;
  author_ext?: Record<string, unknown>;
}

export interface BaijiahaoPublicAuthorSearchResponse {
  status: number;
  msg: string;
  data?: {
    has_more?: number;
    list?: Array<BaijiahaoPublicAuthorSearchItem>;
    pn?: number;
  };
  timestamp?: number;
  logid?: string;
  login_status?: number;
}

/**
 * 获取用户信息
 * @param cookie
 * @param proxyAgent
 */
export const getBaijiahaoUserInfoAsync = async (
  cookie: string,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<BaijiahaoUserInfoResponse> => {
  const result = await $http.get<unknown, AxiosResponse<BaijiahaoUserInfoResponse>>(
    'https://baijiahao.baidu.com/builder/app/appinfo',
    {
      headers: {
        cookie: cookie,
        referer: 'https://baijiahao.baidu.com/',
        host: 'baijiahao.baidu.com',
      },
      params: {},
      httpsAgent: proxyAgent,
      httpAgent: proxyAgent,
    },
  );

  return result.data;
};

export interface BaijiahaoUserInfo {
  user: {
    ability: {
      article_tag_num: number;
      auth_know_quora: number;
      bound_baidu_shop: number;
      can_auto_cut_pic: string;
      can_be_supported: number;
      can_be_supported_news: number;
      can_be_supported_video: boolean;
      can_create_serveral_group: number;
      can_dynamic_long: number;
      can_dynamic_mount_lightapp: number;
      can_dynamic_mount_pricelightapp: number;
      can_enter_homepage: number;
      can_fans_layer: number;
      can_gallery_subtitle: number;
      can_insert_multi_video: number;
      can_know_quora: number;
      can_lemma: boolean;
      can_live_goods: number;
      can_live_subtitle: number;
      can_manage_mapp: number;
      can_mount_shop: number;
      can_mount_wejianzhan: number;
      can_news_subtitle: number;
      can_news_to_video: number;
      can_open_shop: number;
      can_pay_for_show: number;
      can_pay_for_show_effect_status: number;
      can_pay_for_show_live: number;
      can_pay_for_show_video_status: number;
      can_pay_read: number;
      can_pay_separately: number;
      can_pub_serial: number;
      can_publish_original_article: number;
      can_quiz_profit: number;
      can_reprint: number;
      can_set_developer: number;
      can_set_dynamic: number;
      can_set_live: number;
      can_set_pay_live: number;
      can_set_set: number;
      can_set_voiceset: number;
      can_set_xpan: number;
      can_show_ad_mutual_pick: number;
      can_show_quality: number;
      can_show_yingxiao: number;
      can_split_mthvideo: number;
      can_use_brand: number;
      can_use_casher: number;
      can_use_charge_group: number;
      can_use_common_card: number;
      can_use_dynamic_goods: number;
      can_use_group: number;
      can_use_legal: number;
      can_use_live_shop: number;
      can_use_news_ad: number;
      can_use_video_ad: number;
      can_use_video_goods: number;
      can_use_video_procedure: number;
      can_use_wenda: number;
      can_use_write_knowledge: boolean;
      can_video_edit: number;
      can_video_mount_yxt: number;
      can_video_subtitle: number;
      can_videoset_nolimit: number;
      can_yingxiao_mount: number;
      dynamic_mount_column: number;
      get_ad_profit: boolean;
      got_support_news: number;
      grey: number;
      has_bind_telephone: number;
      have_recommend_ability: number;
      is_audio_pay_user: number;
      is_live_pay_user: number;
      is_news_pay_user: number;
      is_training_camp_user: number;
      is_video_pay_user: number;
      news_insert_inner_link: number;
      news_insert_outer_link: number;
      news_mount_column: number;
      pub_limitless: boolean;
      pub_limitless_news: boolean;
      pub_limitless_video: boolean;
      publish_num: number;
      search_card: boolean;
      support_news_threshold: boolean;
      total_fans: number;
      video_mount_column: number;
      video_size_unlimit: number;
    };
    account_excep_reason: string;
    alive_check: number;
    /**
     * 百家号作者id，userId，用户id
     */
    app_id: number;
    app_level: number;
    app_level_desc: string;
    audit_at: string;
    authUser: number;
    /**
     * 用户头像，可能不带http协议头
     */
    avatar: string;
    avatar_unify: string;
    bluev_business: number;
    can_bind_uc: boolean;
    child_profit_set: {
      can_modify: number;
      last_modify_time: string;
      self_profit: number;
      valid_date: string;
    };
    cms_pc_show_status: string;
    content_setting: number;
    domain: string;
    ext_info: string;
    finance_info: {
      accountType: string;
      account_status: number;
    };
    finance_redpoint: number;
    gallery_original_status: number;
    goverMedia: number;
    gray_author_growth: number;
    has_bind_telephone: number;
    has_consultation: number;
    hide_flag: string;
    id: number;
    identity_edit: number;
    identity_original: number;
    im_status: string;
    import: {
      canImport: number;
    };
    is_autocover: number;
    is_block_mcn: number;
    is_conflict: number;
    is_medical_auth: number;
    is_need_navigation_guide: number;
    is_new: number;
    is_novel_auth: number;
    is_official: number;
    is_proxy_user: number;
    is_qunfa: number;
    is_save_material: number;
    is_split_article: number;
    is_toAll: number;
    is_use_im: number;
    is_yxtcpa: number;
    level: number;
    location: string;
    masterId: string;
    media_type: string;
    /**
     * 用户昵称/作者昵称
     */
    name: string;
    org_info: {
      graphic_signed_status: number;
      invite_code: string;
      invite_status: number;
      is_owner: number;
      is_signed: number;
      live_signed_status: number;
      org_name: string;
      owner_appid: number;
      owner_name: string;
      video_signed_status: number;
    };
    org_name: string;
    original_auth_original_whitelist: number;
    original_auth_video_status: number;
    original_exclusive: number;
    original_material_audit: number;
    original_material_audit_deadline: string;
    original_status: number;
    pc_button_content: string;
    pc_jump_pop_url: string;
    pc_jump_url: string;
    pc_qr_code: string;
    pc_show_content: string;
    people_sync: number;
    perms: Array<string>;
    pic_water_log: number;
    plantform_auth: number;
    plat_auth_st: number;
    pop_diag_window: number;
    pop_mp_window: number;
    profession_check: number;
    protocol_status: number;
    qiyehao_child_type: number;
    qualification: number;
    register_basicinfo_status: string;
    register_realinfo_status: string;
    shoubai_c_appid: number;
    show_gains: number;
    show_msg_tab: number;
    show_spring: number;
    show_vane: number;
    source_type: string;
    status: string;
    status_cn: string;
    sub_type: string;
    telephone: [
      {
        uc_id: number;
        uc_name: string;
      },
    ];
    tpid: string;
    type: string;
    uc_bind_type: number;
    /**
     * 用户昵称/作者昵称
     */
    uname: string;
    user_status: string;
    user_type: string;
    userid: number;
    username: string;
    userstate: number;
    v_type: number;
    video_original_status: number;
    water_logo: string;
    wishes: string;
    ws_token: string;
    xpan_bind: number;
    yingxiaotong_cpa: number;
  };
}

export interface BaijiahaoUserInfoResponse {
  errmsg: string;
  errno: number;
  data: BaijiahaoUserInfo;
}
