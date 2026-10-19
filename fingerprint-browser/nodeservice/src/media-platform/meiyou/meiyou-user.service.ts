import { $http } from '@/http';

export const getMeiYouUserInfoResponse = async (
  cookie: string,
  proxyAgent?: object,
): Promise<MeiYouUserInfoResponse> => {
  const url = 'https://mp.meiyou.com/user';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.meiyou.com/',
    Origin: 'https://mp.meiyou.com',
  };

  const result = await $http.get(url, { headers: headers, httpAgent: proxyAgent, httpsAgent: proxyAgent });

  return result.data;
};

export interface MeiYouUserInfoResponse {
  /**
   * 0:正常
   */
  code: number;
  data: {
    user: {
      /**
       * 昵称
       */
      name: string;
      avatar: string;
      phone: string;
      vip_description: string;
      status: number;
      prefreeze_status: number;
      type: number;
      idcard: string;
      realname: string;
      phone_verified: number;
      reg_source: number;
      earning_switch: number;
      vip_verified: number;
      is_newcomer: number;
      guide_type: number;
      is_original: number;
      organization_name: string;
      is_headlines_power: number;
      is_youjia: number;
      is_had_account: number;
      is_main_account: number;
      /**
       * 用户id
       */
      user_id: string;
      forbidden_status: number;
      vip_type: number;
    };
    message: {
      system: number;
      comment: number;
      follow: number;
      repeat: number;
      favour: number;
      praise: number;
    };
  };
  message: string;
}

export const getMeiYouUserLoginResponse = async (
  cookie: string,
  proxyAgent?: object,
): Promise<MeiYouUserLoginResponse> => {
  const url = 'https://sso.meiyou.com/sso/login?type=grant';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.meiyou.com/',
    Origin: 'https://mp.meiyou.com',
  };

  const result = await $http.get(url, {
    headers: headers,
    responseType: 'text',
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  let reStr = result.data?.toString().trim();

  if (reStr?.startsWith('(')) {
    reStr = reStr.substring(1);
    reStr = reStr.substring(0, reStr.length - 1);
  }

  return JSON.parse(reStr) as MeiYouUserLoginResponse;
};

export interface MeiYouUserLoginResponse {
  code: number;
  data: {
    login: boolean;
    url: string;
  };
  message: string;
}
