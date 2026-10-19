import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';

/**
 * 刷新登录的accessToken
 * @param cookie
 * @param proxyAgent
 */
export const getPersonalAccessTokenAsync = async (
  cookie: string,
  proxyAgent?: object,
): Promise<{ code: number; cookie: string }> => {
  const postData = {
    type:
      cookie?.includes('qq_nick') || cookie?.includes('vqq_access_token')
        ? 'qq'
        : cookie?.includes('phone_')
        ? 'phone'
        : 'wx',
    si: { q36: '', h38: '', h42: '', uskey: '', uskey_src: '', o_data: '', s: '' },
  };
  const result = await $http.post<{ data: { access_token: string; vusession: string } }>(
    'https://pbaccess.video.qq.com/trpc.video_account_login.web_login_trpc.WebLoginTrpc/NewRefresh?video_appid=3000010',
    postData,
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.v.qq.com/',
        origin: 'https://mp.v.qq.com',
        'content-type': 'application/json',
      },
      maxRedirects: 0,
      httpAgent: proxyAgent,
      httpsAgent: proxyAgent,
    },
  );
  let re: any = {};
  const cookies = result.headers['set-cookie'];
  if (cookies && cookies?.length > 0) {
    for (const key of cookies) {
      const item = key?.trim().split(';')[0]?.split('=');
      const regex = new RegExp(item[0], 'g');
      cookie = cookie.replace(regex, `${item[0]}_Old`);
      cookie = `${cookie};${key.split(';')[0]}`;
    }
    re = { code: result?.data?.data?.access_token ? 0 : -1, cookie: cookie };
    if (postData.type === 'phone' && result?.data?.data?.vusession) {
      re.code = 0;
    }
    return re;
  }

  re = { code: result?.data?.data?.access_token ? 0 : -1, cookie: cookie };
  if (postData.type === 'phone' && result?.data?.data?.vusession) {
    re.code = 0;
  }
  return re;
};

/**
 * 腾讯视频用户信息
 * @param cookie
 * @param g_actk
 * @param g_vstk
 * @param proxyAgent
 */
export const getUserInfoAsync = async (
  cookie: string,
  g_actk: number,
  g_vstk: number,
  proxyAgent?: object,
): Promise<TengxunshipinUserInfoResponse> => {
  const result = await $http.get<unknown, AxiosResponse<TengxunshipinUserInfoResponse>>(
    'https://access.v.qq.com/trpc.creator_center.entrance.Entrance/GetAccountInfo',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.v.qq.com/',
        authority: 'access.v.qq.com',
        origin: 'https://mp.v.qq.com',
      },
      params: {
        g_actk: g_actk,
        g_vstk: g_vstk,
        refer: 'vcc_web',
        from: 'cc',
        origin: 1,
      },
      httpAgent: proxyAgent,
      httpsAgent: proxyAgent,
    },
  );

  return result.data;
};

export interface TengxunshipinUserInfoResponse {
  ret: number;
  code: number;
  msg: string;
  data: {
    creater_is_brand_account: number;
    creator_type: number;
    certification_type: number;
    certification_number: string;
    certification_name: string;
    agent_certification_type: number;
    agent_certification_number: string;
    agent_certification_name: string;
    guardian_certification_type: number;
    guardian_certification_number: string;
    guardian_certification_name: string;
    org_code: string;
    org_name: string;
    nick: string;
    head: string;
    desc: string;
    phone: string;
    slogan: string;
    location_id: string;
    location_cname: string;
    personal_date_birth: string;
    personal_gender: number;
    creater_app_background_pic: string;
    brand_official_accounts_QR_code: string;
    brand_tinyapp_QR_code: string;
    brand_official_website: string;
    brand_shop_website: string;
    isOmUser: boolean;
    whitelist: {
      data_center: boolean;
      zhiying: boolean;
    };
    nick_fake: string;
    head_fake: string;
    desc_fake: string;
    realname: number;
    creative_center_integration_notice: string;
    program_production_license_code: string;
    vcuid: string;
    is_merged_account: number;
    ever_phone_num: string;
  };
}

/**
 * 腾讯视频首页数据概览
 * @param cookie
 * @param g_actk
 * @param g_vstk
 */
export const getUserHomeDataAsync = async (
  cookie: string,
  g_actk: number,
  g_vstk: number,
): Promise<TengxunshipinUserHomeDataResponse> => {
  const result = await $http.get<unknown, AxiosResponse<TengxunshipinUserHomeDataResponse>>(
    'https://access.v.qq.com/trpc.creator_center.data_center.data_center/GetBasicFacts',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.v.qq.com/',
        authority: 'access.v.qq.com',
        origin: 'https://mp.v.qq.com',
      },
      params: {
        g_actk: g_actk,
        g_vstk: g_vstk,
        refer: 'vcc_web',
      },
    },
  );

  // 请求失败
  if (result.data.code !== 0) {
    throw new BadRequestException(result.data?.msg, result.data?.ret, result.data);
  }

  return result.data;
};

export interface TengxunshipinUserHomeDataResponse {
  code: number;
  msg: string;
  ret?: number;
  data: {
    yesterday: {
      comment_cnt: string;
      drumstick_cnt: string;
      follower_num_cnt: string;
      in_pdtm_ms: string;
      in_vid_cnt: string;
      like_cnt: string;
      play_cnt: string;
      subscribe_cnt: string;
    };
    total: {
      cid_count: string;
      comment_cnt: string;
      drumstick_cnt: string;
      follower_num_cnt: string;
      in_pdtm_ms: string;
      in_vid_cnt: string;
      income: string;
      like_cnt: string;
      play_cnt: string;
      subscribe_cnt: string;
      vid_count: string;
    };
  };
}
