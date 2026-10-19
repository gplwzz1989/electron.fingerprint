import {
  getContentListAsync,
  TengxunshipinContentListResponse,
  TengxunshipinMediaContent,
} from './tengxunshipin-content-list.service';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import { BaseResult } from '../baseResult';
import {
  getDataOverviewAsync,
  getIncomeInfoListAsync,
  getSingleDataOverviewAsync,
  TengxunshipinDataOverviewItemResponse,
} from './tengxunshipin-data-overview.service';
import { getUserInfoAsync, getUserHomeDataAsync, getPersonalAccessTokenAsync } from './tengxunshipin-user.service';
import { calculateVS_ACTK, getCookieAccessTokenValue, getCookieVusessionValue } from './tengxunshipin-base.service';
import { createKuaiProxyAgent, IWebProxy, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { ListInfoResponse, MediaStatusResultOutput, PlatformAuthorInfo } from '@/media-platform';
import { getTengXunShiPinTopicResponse } from '@/media-platform/tengxunshipin/tengxunshipin-topic.service';
import { auditStatusEnum } from '@/utils';
import { deleteTengXunShiPinContentResponse } from '@/media-platform/tengxunshipin/tengxunshipin-content-delete.service';

/**
 * 腾讯视频内容列表
 * @param cookie
 * @param page 页码
 * @param page_size 每页数量
 * @param status 数据类型（1：全部，2：已发布，3：审核中，4：未通过，5：草稿），默认已发布
 * @param proxy
 */
export const getTengxunshipinContentList = async (
  cookie: string,
  page: number = 1,
  page_size: number = 10,
  status: 1 | 2 | 3 | 4 | 5 = 2,
  proxy?: KuaiDaiLiProxy,
) => {
  const result: TengxunshipinContentListOutput = {
    code: 0,
    msg: 'ok',
  };

  const g_actk = calculateVS_ACTK(getCookieAccessTokenValue(cookie));
  const g_vstk = calculateVS_ACTK(getCookieVusessionValue(cookie));

  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }

    const contentListResult = await getContentListAsync(cookie, g_actk, g_vstk, page, page_size, status, webProxy);

    result.code = contentListResult.code;
    result.msg = contentListResult.msg;
    result.data = contentListResult.data;
    result.raw = contentListResult;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface TengxunshipinContentListOutput extends BaseResult {
  data?: {
    pagination: {
      /**
       * 内容数
       */
      total: number;

      /**
       * 页码
       */
      page: number;

      /**
       * 每页数量
       */
      page_size: number;

      /**
       * 总页数
       */
      page_total: number;
    };
    list: Array<TengxunshipinMediaContent>;
  };

  raw?: unknown;
}

/**
 * 腾讯视频视频数据，数据分析
 * @param cookie
 * @param start_date 开始日期 Date
 * @param end_date 结束日期 Date
 */
export const getTengxunshipinDataOverview = async (cookie: string, start_date: Date, end_date: Date) => {
  const result: TengxunshipinDataOverviewOutput = {
    code: 0,
    msg: 'ok',
  };

  const g_actk = calculateVS_ACTK(getCookieAccessTokenValue(cookie));
  const g_vstk = calculateVS_ACTK(getCookieVusessionValue(cookie));

  let start_date_str = start_date.toISOString();
  if (start_date_str.length > 0) {
    start_date_str = start_date_str.slice(0, 10);
  }

  let end_date_str = end_date.toISOString();
  if (end_date_str.length > 0) {
    end_date_str = end_date_str.slice(0, 10);
  }

  try {
    const dataOverviewResult = await getDataOverviewAsync(cookie, g_actk, g_vstk, start_date_str, end_date_str);

    result.code = dataOverviewResult.code;
    result.msg = dataOverviewResult.msg;
    result.data = dataOverviewResult.data;
    result.raw = dataOverviewResult;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface TengxunshipinDataOverviewOutput extends BaseResult {
  data?: {
    data: Array<TengxunshipinDataOverviewItemResponse>;
  };
  raw?: unknown;
}

/**
 * 腾讯视频首页概览数据
 * @param cookie
 */
export const getTengxunshipinUserHomeData = async (cookie: string) => {
  const result: TengxunshipinUserHomeDataOutput = {
    code: 0,
    msg: 'ok',
  };

  const g_actk = calculateVS_ACTK(getCookieAccessTokenValue(cookie));
  const g_vstk = calculateVS_ACTK(getCookieVusessionValue(cookie));

  try {
    const userHomeDataResult = await getUserHomeDataAsync(cookie, g_actk, g_vstk);

    result.code = userHomeDataResult.code;
    result.msg = userHomeDataResult.msg;
    result.data = userHomeDataResult.data;
    result.raw = userHomeDataResult;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface TengxunshipinUserHomeDataOutput extends BaseResult {
  data?: {
    total: {
      cid_count: string;

      /**
       * 评论数
       */
      comment_cnt: string;
      drumstick_cnt: string;
      follower_num_cnt: string;
      in_pdtm_ms: string;
      in_vid_cnt: string;

      /**
       * 总收益
       */
      income: string;

      /**
       * 总点赞数
       */
      like_cnt: string;

      /**
       * 总播放数
       */
      play_cnt: string;

      /**
       * 总粉丝数
       */
      subscribe_cnt: string;
      vid_count: string;
    };
  };

  raw?: unknown;
}

/**
 * 腾讯视频收益数据
 * @param cookie
 */
export const getTengxunshipinDataOverviewIncome = async (cookie: string) => {
  const result: TengxunshipinDataOverviewIncomeOutput = {
    code: 0,
    msg: 'ok',
  };

  const g_actk = calculateVS_ACTK(getCookieAccessTokenValue(cookie));
  const g_vstk = calculateVS_ACTK(getCookieVusessionValue(cookie));

  try {
    const dataOverviewIncomeResult = await getIncomeInfoListAsync(cookie, g_actk, g_vstk);

    result.code = dataOverviewIncomeResult.code;
    result.msg = dataOverviewIncomeResult.msg;
    result.data = dataOverviewIncomeResult.data;
    result.raw = dataOverviewIncomeResult;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface TengxunshipinDataOverviewIncomeOutput extends BaseResult {
  data?: {
    /**
     * 总收益
     */
    totalIncome: string;

    /**
     * 已提现金额
     */
    totalWithdrawAmount: string;

    /**
     * 可提现金额
     */
    totalCantWithdrawAmount: string;
    info: {
      CantWithdrawAmount: string;
    };
    handInAmount: string;
  };

  raw?: unknown;
}

/**
 * 腾讯视频用户信息
 * @param cookie
 */
export const getTengxunshipinUserInfo = async (cookie: string, proxy?: IWebProxy): Promise<PlatformAuthorInfo> => {
  const result: PlatformAuthorInfo = {
    code: 0,
    msg: 'ok',
  };

  cookie = (await getPersonalAccessTokenAsync(cookie))?.cookie ?? cookie;
  const g_actk = calculateVS_ACTK(getCookieAccessTokenValue(cookie));
  const g_vstk = calculateVS_ACTK(getCookieVusessionValue(cookie));

  try {
    let webproxy;
    if (proxy?.serverAdd) {
      webproxy = createKuaiProxyAgent(proxy);
    }
    const userInfoResult = await getUserInfoAsync(cookie, g_actk, g_vstk, webproxy);

    result.code = userInfoResult.ret;
    result.msg = userInfoResult.msg;
    result.yixiaoerName = decodeURIComponent(userInfoResult?.data?.nick ?? '');
    result.yixiaoerId = userInfoResult?.data?.vcuid;
    result.yixiaoerImageUrl = userInfoResult?.data?.head;
    if (!(result.yixiaoerId?.length > 2)) {
      result.code = -1;
      result.msg = '未开通创作者';
    }
    result.raw = userInfoResult.data;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
    result.code = errorCode.exception;
  }

  return result;
};

export interface TengxunshipinUserInfoOutput extends BaseResult {
  data?: {
    /**
     * 昵称
     */
    nick: string;

    /**
     * 头像
     */
    head: string;

    /**
     * 详情
     */
    desc: string;

    /**
     * uid
     */
    vcuid: string;
  };

  raw?: unknown;
}

/**
 * 腾讯视频单篇数据
 * @param cookie
 * @param vid 作品id
 * @param start_date 开始日期
 * @param end_date 结束日期
 */
export const getTengxunshipinSingleDataOverview = async (
  cookie: string,
  vid: string,
  start_date: Date,
  end_date: Date,
): Promise<TengxunshipinSingleDataOverviewOutput> => {
  const result: TengxunshipinSingleDataOverviewOutput = {
    code: 0,
    msg: 'ok',
  };

  const g_actk = calculateVS_ACTK(getCookieAccessTokenValue(cookie));
  const g_vstk = calculateVS_ACTK(getCookieVusessionValue(cookie));

  let start_date_str = start_date.toISOString();
  if (start_date_str.length > 0) {
    start_date_str = start_date_str.slice(0, 10);
  }

  let end_date_str = end_date.toISOString();
  if (end_date_str.length > 0) {
    end_date_str = end_date_str.slice(0, 10);
  }

  try {
    const dataOverviewResult = await getSingleDataOverviewAsync(
      cookie,
      vid,
      start_date_str,
      end_date_str,
      g_actk,
      g_vstk,
    );

    result.code = dataOverviewResult.code;
    result.msg = dataOverviewResult.msg;
    result.data = dataOverviewResult.data;
    result.raw = dataOverviewResult;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface TengxunshipinSingleDataOverviewOutput extends BaseResult {
  data?: {
    data: Array<{
      data: {
        /**
         * 在追用户播放量
         */
        binge_in_anti_vstart_cnt: string;

        /**
         * 日期
         */
        date: string;

        /**
         * 在追用户播放量
         */
        fans_in_anti_vstart_cnt: string;

        /**
         * 全部用户播放量
         */
        in_anti_vfinish_cnt: string;

        /**
         * 评论数
         */
        in_comment_cnt: string;

        /**
         * 点赞数
         */
        in_like_cnt: string;
      };
    }>;
    summaries: Array<{
      /**
       * 数据code
       */
      name: string;

      /**
       * 数据名称
       */
      cname: string;

      /**
       * 数值
       */
      count: string;
      ratio: string;

      /**
       * 数据包含字段
       */
      columns: Array<string>;
    }>;
  };

  raw?: unknown;
}

/**
 * 查询视频状态
 * @param cookie
 * @param publishId
 * @param maxPage
 */
export const getTengXunShiPinVideoStatus = async (
  cookie: string,
  publishId: string,
  maxPage: number = 10,
): Promise<MediaStatusResultOutput> => {
  const result: MediaStatusResultOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };
  try {
    let geted = false;
    const astk = calculateVS_ACTK(getCookieAccessTokenValue(cookie));
    const vstk = calculateVS_ACTK(getCookieVusessionValue(cookie));
    let contentList: TengxunshipinContentListResponse | undefined = undefined;
    for (let i = 1; i < maxPage; i++) {
      contentList = await getContentListAsync(cookie, astk, vstk, i, 10, 1);
      if (contentList?.data?.list?.length) {
        for (const item of contentList?.data?.list) {
          const findId = item?.vid;

          if (findId === publishId) {
            geted = true;
            if (item.status_show['1']?.title === '草稿') {
              result.auditStatus = auditStatusEnum.draft;
            } else if (item.status_show['1']?.title === '审核通过') {
              result.auditStatus = auditStatusEnum.published;
            } else if (
              item.status_show['1']?.title.includes('审核通过') &&
              item.status_show['1']?.title.includes('发布')
            ) {
              result.auditStatus = auditStatusEnum.prePublish;
            } else if (item.status_show['1']?.title?.includes('通过')) {
              result.auditStatus = auditStatusEnum.deny;
            } else {
              result.auditStatus = auditStatusEnum.inAudit;
            }
            result.code = 0;
            result.msg = '';
            result.data = item;
            result.create_time = new Date(item.upload_time).getTime();
            result.docId = item.vid;
            result.coverUrl = item.image_url;
            result.openUrl = `https://v.qq.com/x/page/${item.vid}.html`;
            return result;
          }
        }
        if (geted) {
          break;
        }
      } else {
        result.code = contentList?.code ?? -1;
        result.msg = '未找到作品';
        return result;
      }
    }
    result.code = contentList?.code ?? -1;
    result.msg = '未找到作品';
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }
  result.code = -1;
  result.msg = '未找到作品';
  return result;
};

export const searchTengXunShiPinTopicList = async (
  cookie: string,
  keyWord: string,
  vstk?: number,
  astk?: number,
): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };
  try {
    if (!vstk) {
      astk = calculateVS_ACTK(getCookieAccessTokenValue(cookie));
      vstk = calculateVS_ACTK(getCookieVusessionValue(cookie));
    }
    const cateData = await getTengXunShiPinTopicResponse(cookie, keyWord, vstk, astk ?? 0);
    if (cateData?.data?.items?.length) {
      for (const item of cateData?.data.items) {
        result.dataList?.push({
          yixiaoerId: item?.id,
          yixiaoerName: item?.title,
          yixiaoerImageUrl: item?.image,
          yixiaoerDesc: item?.sub_title[0],
          raw: item,
        });
      }
    }
    result.code = cateData?.code ?? -1;
    result.msg = cateData?.msg ?? '';
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};

export const deleteTengXunShiPinContent = async (cookie: string, docId: string, vstk?: number): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    if (!vstk) {
      vstk = calculateVS_ACTK(getCookieVusessionValue(cookie));
    }
    const cateData = await deleteTengXunShiPinContentResponse(cookie, docId, vstk);
    result.code = cateData?.code ?? -1;
    result.msg = cateData?.msg ?? '';
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};
