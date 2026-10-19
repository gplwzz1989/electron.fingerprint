import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';

/**
 * 秒拍首页统计数据
 * @param cookie
 */
export const getUserStatisticAsync = async (cookie: string): Promise<MiaopaiUserStatisticResponse> => {
  const result = await $http.get<unknown, AxiosResponse<MiaopaiUserStatisticResponse>>(
    'https://creator.miaopai.com/profile/getstatis',
    {
      headers: {
        cookie: cookie,
        referer: 'https://creator.miaopai.com/',
        authority: 'creator.miaopai.com',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {},
    },
  );

  // 请求失败
  if (result.data.code !== 200) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

/**
 * 秒拍用户信息
 * @param cookie
 */
export const getUserInfoAsync = async (cookie: string): Promise<MiaopaiUserInfoResponse> => {
  const result = await $http.get<unknown, AxiosResponse<MiaopaiUserInfoResponse>>(
    'https://creator.miaopai.com/profile/getInfo',
    {
      headers: {
        cookie: cookie,
        referer: 'https://creator.miaopai.com/statisinfo/video',
        authority: 'creator.miaopai.com',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {
        type: 'full',
        ptype: 0,
      },
    },
  );

  // 请求失败
  if (result.data.code !== 200) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface MiaopaiUserStatisticResponse {
  code: number;
  msg: string;
  data: {
    income: number;
    play_cnt: number;
    fans_cnt: number;
    credit: number;
  };
}

export interface MiaopaiUserInfoResponse {
  code: number;
  msg: string;
  data: {
    id: number;
    birthday: string;
    email: string;
    phone: string;
    nick: string;
    area: string;
    gender: number;
    createTime: number;
    createTimeNice: string;
    iconSafe: string;
    icon: string;
    lastModifyTime: string;
    desc: string;
    loginName: string;
    otherLoginMode: number;
    coverSafe: string;
    cover: string;
    profileUrl: string;
  };
}
