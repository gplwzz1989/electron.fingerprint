import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';

/**
 * 好看视频首页数据
 * @param cookie
 */
export const getUserHomeDataAsync = async (cookie: string): Promise<HaokanshipinUserHomeDataResponse> => {
  const result = await $http.get<unknown, AxiosResponse<HaokanshipinUserHomeDataResponse>>(
    'https://dream.haokan.com/creator/authorpcdatacenter',
    {
      headers: {
        cookie: cookie,
        referer: 'https://dream.haokan.com/author',
        authority: 'dream.haokan.com',
      },
    },
  );

  // 请求失败
  if (result.data.status !== 0) {
    throw new BadRequestException(result.data?.msg, result.data?.status, result.data);
  }

  return result.data;
};

export interface HaokanshipinUserHomeDataResponse {
  status: number;
  msg: string;
  data: {
    realNameCheck: number;
    videoShareIncomeApply: number;
    data: {
      video_view: {
        total: number;
        trend: number;
      };
      fans_info: {
        total: number;
        trend: number;
      };
      income_info: {
        total: number;
        trend: number;
        lastDate: number;
      };
      yqsl_info: {
        total: string;
        trend: string;
      };
      yqsl_income_info: {
        total: string;
        trend: string;
      };
    };
  };
}

/**
 * 获取用户信息
 * @param cookie
 */
export const getUserInfoAsync = async (cookie: string): Promise<HaokanshipinUserInfoResponse> => {
  const result = await $http.get<unknown, AxiosResponse<HaokanshipinUserInfoResponse>>(
    'https://dream.haokan.com/creator/getauthorinfo',
    {
      headers: {
        cookie: cookie,
        referer: 'https://dream.haokan.com/author',
        authority: 'dream.haokan.com',
      },
    },
  );

  // 请求失败
  if (result.status !== 200) {
    throw new BadRequestException(result.data?.msg, result.data?.status, result.data);
  }

  return result.data;
};

export interface HaokanshipinUserInfoResponse {
  timestamp: number;
  logid: string;
  /**
   * 状态 -1 未登录
   */
  status: number;
  msg: string;
  data: {
    avatar: string;
    desc: string;
    name: string;
    vlog: string;
    type: string;
    fans: number;
    follow: number;
    rights: {
      copyright_guard: boolean;
      paid_consultation: boolean;
      video_goods: boolean;
      creator_union: boolean;
      businessorder_offer: boolean;
      sign_type: number;
      nav_upload: boolean;
      upload_time_length: number;
      new_video_list: boolean;
      video_lab: boolean;
    };
    uk: string;
  };
}
