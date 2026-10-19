import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { GetTimeStamp } from '../../utils';

/**
 * 搜狐号用户内容统计数据
 * @param cookie
 * @param accountId
 */
export const getUserNewsInfoAsync = async (
  cookie: string,
  accountId: number,
): Promise<SouhuhaoUserNewsInfoResponse> => {
  const sp_cm = cookie.split('mp-cv=')[1]?.split(';')[0];
  const result = await $http.get<unknown, AxiosResponse<SouhuhaoUserNewsInfoResponse>>(
    'https://mp.sohu.com/mpbp/bp/news/v4/users/newsInfo',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.sohu.com/mpfe/v4/contentManagement/first/page',
        host: 'mp.sohu.com',
        'sp-cm': sp_cm,
        'mp-cv': sp_cm,
      },
      params: {
        accountId: accountId,
        _: GetTimeStamp(13),
      },
    },
  );

  return result.data;
};

/**
 * 搜狐号用户统计数据
 * @param cookie
 * @param accountId
 */
export const getUserUserHomeDateAsync = async (
  cookie: string,
  accountId: number,
): Promise<SouhuhaoUserHomeDateResponse> => {
  const sp_cm = cookie.split('mp-cv=')[1]?.split(';')[0];
  const result = await $http.get<unknown, AxiosResponse<SouhuhaoUserHomeDateResponse>>(
    'https://mp.sohu.com/mpbp/bp/news/v4/users/stat',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.sohu.com/mpfe/v4/contentManagement/first/page',
        host: 'mp.sohu.com',
        'sp-cm': sp_cm,
        'mp-cv': sp_cm,
      },
      params: {
        type: 1,
        accountId: accountId,
        _: GetTimeStamp(13),
      },
    },
  );

  // 请求失败
  if (result.data.code !== 2000000) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

/**
 * 搜狐号用户信息
 * @param cookie
 * @param proxyAgent
 */
export const getUserInfoAsync = async (cookie: string, proxyAgent?: object): Promise<SouhuhaoUserInfoResponse> => {
  const sp_cm = cookie.split('mp-cv=')[1]?.split(';')[0];
  const result = await $http.get<unknown, AxiosResponse<SouhuhaoUserInfoResponse>>(
    'https://mp.sohu.com/mpbp/bp/account/listV2',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.sohu.com/mpfe/v4/contentManagement/first/page',
        host: 'mp.sohu.com',
        'sp-cm': sp_cm,
        'mp-cv': sp_cm,
      },
      params: {
        _: GetTimeStamp(13),
      },
      httpsAgent: proxyAgent,
      httpAgent: proxyAgent,
    },
  );

  return result.data;
};

export interface SouhuhaoUserNewsInfoResponse {
  data: {
    text_reject_cnt: number;
    video_draft_cnt: number;
    album_audit_cnt: number;
    text_total_cnt: number;
    text_audit_cnt: number;
    news_total_cnt: number;
    text_draft_cnt: number;
    news_audit_cnt: number;
    album_pass_cnt: number;
    video_total_cnt: number;
    video_pass_cnt: number;
    video_schedule_cnt: number;
    video_audit_cnt: number;
    album_draft_cnt: number;
    news_pass_cnt: number;
    news_reject_cnt: number;
    text_schedule_cnt: number;
    album_total_cnt: number;
    video_reject_cnt: number;
    news_draft_cnt: number;
    album_schedule_cnt: number;
    text_pass_cnt: number;
    news_schedule_cnt: number;
    album_reject_cnt: number;
  };
  code: number;
  msg: string;
  success: boolean;
}

export interface SouhuhaoUserHomeDateResponse {
  data: {
    date: string;
    totalPv: number;
    totalVv: number;
    diff: number;
  };
  code: number;
  msg: string;
  success: boolean;
}

export interface SouhuhaoUserInfoResponse {
  data: {
    total: number;
    data: [
      {
        orgId: number;
        orgType: number;
        isOwner: boolean;
        accounts: Array<{
          id: number;
          avatar: string;
          nickName: string;
          accountType: number;
          accountTypeName: string;
          status: number;
          auditType: number;
          orgId: number;
          statusName: string;
          channelId: number;
        }>;
        accountInfos: Array<{
          id: number;
          avatar: string;
          nickName: string;
          accountType: number;
          accountTypeName: string;
          status: number;
          auditTime?: number;
          auditType: number;
          orgId: number;
          statusName: string;
          channelId: number;
        }>;
        managerAccounts: Array<{
          id: number;
          avatar: string;
          nickName: string;
          accountType: number;
          accountTypeName: string;
          status: number;
          auditTime?: number;
          auditType: number;
          orgId: number;
          statusName: string;
          channelId: number;
        }>;
      },
    ];
  };
  code: number;
  msg: string;
  success: boolean;
}

/**
 * 搜狐收益数据
 * @param cookie
 * @param accountId 账号id
 */
export const getUserIncomeAsync = async (cookie: string, accountId: number): Promise<SouhuhaoUserIncomeResponse> => {
  const sp_cm = cookie.split('mp-cv=')[1]?.split(';')[0];
  const result = await $http.get<unknown, AxiosResponse<SouhuhaoUserIncomeResponse>>(
    'https://mp.sohu.com/mpbp/bp/withdraw/settlement/withdrawProfit',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.sohu.com/mpfe/v4/personalCenter/center/settlementCenter/overview',
        host: 'mp.sohu.com',
        'sp-cm': sp_cm,
        'mp-cv': sp_cm,
      },
      params: {
        accountId: accountId,
        bizCode: 0,
      },
    },
  );

  // 请求失败
  if (result.data.success === false) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface SouhuhaoUserIncomeResponse {
  validAmount: number;
  withdrawingAmount: number;
  withdrawAmount: number;
  code?: number;
  msg?: string;
  success?: boolean;
}
