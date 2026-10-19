import { $http } from '@/http';

export const getFengWangUserInfoResponse = async (
  cookie: string,
  proxyAgent?: object,
): Promise<FengWangUserInfoResponse> => {
  const url = `http://o.fun.tv/ajax/check_account?_=${Date.now()}`;

  const headers = {
    cookie: cookie,
    referer: 'http://o.fun.tv',
    origin: 'http://o.fun.tv',
  };

  const result = await $http.get(url, { headers: headers, httpsAgent: proxyAgent, httpAgent: proxyAgent });

  return result.data;
};

export interface FengWangUserInfoResponse {
  //200为成功
  status: number;
  msg: string;
  data: FengWangUserInfo;
}

export interface FengWangUserInfo {
  users: {
    user_id: number;
    user_name: string;
    token: string;
    phone: string;
    focuser_id: number;
    shead: string;
  };
  pgcs: {
    name: string;
    icon: string;
    id: string;
  }[];
  partners: never[];
  playlets: never[];
  domain_duanju: boolean;
  domain_yingtao: boolean;
}
