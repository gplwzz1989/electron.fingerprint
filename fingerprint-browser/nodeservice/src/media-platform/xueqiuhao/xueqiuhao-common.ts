import { BaseResult } from '../baseResult';
import {
  getContentListAsync,
  XueqiuhaoContentListResponse,
  XueqiuhaoMediaContent,
} from './xueqiuhao-content-list.service';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import { getDataOverviewAsync, getDataOverviewCoreDataAsync } from '../xueqiuhao/xueqiuhao-data-overview.service';
import { getUserInfoAsync, getXueQiuUserInfoResponse } from '../xueqiuhao/xueqiuhao-user.service';
import { MediaStatusResultOutput, PlatformAuthorInfo } from '@/media-platform';
import { deleteXueQiuArticle } from '@/media-platform/xueqiuhao/xueqiuhao-content-delete.service';
import dayjs from 'dayjs';
import { auditStatusEnum } from '@/utils';
import { createKuaiProxyAgent, IWebProxy } from '@/media-platform/webproxy';

/**
 * 雪球号-内容长文管理
 * @param cookie
 * @param page 页码
 * @param count 每页数量
 * @param keyword 搜索关键字
 */
export const getXueqiuhaoContentList = async (
  cookie: string,
  page: number = 1,
  count: number = 10,
  keyword?: string,
): Promise<XueqiuhaoContentListOutput> => {
  const result: XueqiuhaoContentListOutput = {
    code: 0,
    msg: '',
    count: 0,
    maxPage: 0,
    page: 0,
  };

  try {
    const contentListResult = await getContentListAsync(cookie, page, count, keyword);

    result.code = contentListResult?.success == false ? contentListResult?.code : 0;
    result.msg = contentListResult.message;
    result.count = contentListResult.count;
    result.maxPage = contentListResult.maxPage;
    result.page = contentListResult.page;
    result.data = contentListResult.list;
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

export interface XueqiuhaoContentListOutput extends BaseResult {
  /**
   * 作品数
   */
  count: number;
  data?: Array<XueqiuhaoMediaContent>;

  /**
   * 最大页码
   */
  maxPage: number;

  /**
   * 当前页码
   */
  page: number;

  raw?: unknown;
}

/**
 * 雪球号-数据分析核心数据
 * @param cookie
 * @param type 数据范围 默认90（1：昨天，7：7天，30：30天，90：累计）
 */
export const getXueqiuhaoDataOverviewStatistic = async (
  cookie: string,
  type: 1 | 7 | 30 | 90 = 90,
): Promise<XueqiuhaoDataOverviewStatisticOutput> => {
  const result: XueqiuhaoDataOverviewStatisticOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const dataOverviewStatisticResult = await getDataOverviewCoreDataAsync(cookie, type);

    result.code = dataOverviewStatisticResult?.code;
    result.msg = dataOverviewStatisticResult.message;
    result.data = dataOverviewStatisticResult.data;
    result.raw = dataOverviewStatisticResult;
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

export interface XueqiuhaoDataOverviewStatisticOutput extends BaseResult {
  data?: {
    user_id: number;
    /**
     * 阅读量
     */
    view_count: number;

    /**
     * 评论量
     */
    reply_count: number;

    /**
     * 转发量
     */
    retweet_count: number;

    /**
     * 点赞量
     */
    like_count: number;

    /**
     * 收藏量
     */
    fav_count: number;
  };

  raw?: unknown;
}

/**
 * 雪球号-数据分析报表
 * @param cookie
 * @param data_type 数据类型 默认increment_status_view_count（increment_status_view_count：播放量，increment_status_reply_count：评论量，increment_status_retweet_count：转发量，increment_status_like_count：点赞量，increment_status_fav_count：收藏量）
 */
export const getXueqiuhaoDataOverview = async (
  cookie: string,
  data_type:
    | 'increment_status_view_count'
    | 'increment_status_reply_count'
    | 'increment_status_retweet_count'
    | 'increment_status_like_count'
    | 'increment_status_fav_count' = 'increment_status_view_count',
): Promise<XueqiuhaoDataOverviewOutput> => {
  const result: XueqiuhaoDataOverviewOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const dataOverviewResult = await getDataOverviewAsync(cookie, data_type);

    result.code = dataOverviewResult?.code;
    result.msg = dataOverviewResult.message;
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

export interface XueqiuhaoDataOverviewOutput extends BaseResult {
  data?: Array<{
    /**
     * 阅读量
     */
    value: number;

    /**
     * 日期
     */
    created_at: string;

    /**
     * 较昨日数据
     */
    incr_value: number;
  }>;

  raw?: unknown;
}

/**
 * 雪球号-首页数据
 * @param cookie
 */
export const getXueqiuhaoUserInfoOld = async (cookie: string): Promise<XueqiuhaoUserInfoOutput> => {
  const result: XueqiuhaoUserInfoOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const userInfoResult = await getUserInfoAsync(cookie);

    result.data = userInfoResult.data;
    result.currentUser = userInfoResult.currentUser;
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

export const getXueqiuhaoUserInfo = async (cookie: string, proxy?: IWebProxy): Promise<PlatformAuthorInfo> => {
  const result: XueqiuhaoUserInfoOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfoResult = await getXueQiuUserInfoResponse(cookie, webProxy);

    result.yixiaoerId = userInfoResult?.user?.id?.toString();
    result.yixiaoerName =
      (userInfoResult?.user?.screen_name ? userInfoResult?.user?.screen_name : userInfoResult?.user?.name) ?? '';
    result.yixiaoerImageUrl = `https:${userInfoResult?.user
      ?.photo_domain}${userInfoResult?.user?.profile_image_url?.split(',')[0]}`; //userInfoResult?.user?.profile_image_url;
    result.raw = userInfoResult.user;
    result.code = result.yixiaoerId ? 0 : -1;
    result.msg = userInfoResult?.error_description;
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

export interface XueqiuhaoUserInfoOutput extends PlatformAuthorInfo {
  data?: {
    /**
     * 粉丝数
     */
    fans_count: number;

    /**
     * 阅读量
     */
    read_count: number;

    /**
     * 评论数
     */
    reply_count: number;

    /**
     * 点赞数
     */
    like_count: number;

    /**
     * 转发数
     */
    retweet_count: number;

    /**
     * 收藏数
     */
    fav_count: number;
  };
  currentUser?: unknown;
}

/**
 * 删除文章
 * @param cookie
 * @param docId
 * @param isDraft 是否是草稿
 */
export const deleteXueQiuArticleContent = async (
  cookie: string,
  docId: string,
  isDraft: boolean,
): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    const cateData = await deleteXueQiuArticle(cookie, docId, isDraft);
    result.code = cateData?.success ? 0 : -1;
    result.msg = cateData?.error_description ?? '';
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

/**
 * 查询文章状态
 * @param cookie
 * @param publishId
 * @param maxPage
 */
export const getXueQiuArticleStatus = async (
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

    const endDate = Date.now();
    const startDate = dayjs().add(-7, 'days').unix() * 1000;
    let contentList: XueqiuhaoContentListResponse | undefined = undefined;
    for (let i = 1; i < maxPage; i++) {
      contentList = await getContentListAsync(cookie, i, 10, undefined, startDate, endDate);
      if (contentList?.list?.length) {
        for (const item of contentList?.list) {
          const findId = item?.id?.toString();

          if (findId === publishId) {
            geted = true;
            const process = item?.type;
            switch (process) {
              case 'success':
                result.auditStatus = auditStatusEnum.published;
                result.openUrl = `https://xueqiu.com/${item.user_id}/${item.id}`;
                break;
              case 'fail':
                result.auditStatus = auditStatusEnum.deny;
                break;
              case 'draft':
                result.auditStatus = auditStatusEnum.draft;
                break;
              case 'process':
                result.auditStatus = auditStatusEnum.inAudit;
                break;
              default:
                result.auditStatus = auditStatusEnum.waitExecute;
                break;
            }
            result.code = 0;
            result.msg = '';
            result.data = item;
            result.create_time = item.created_at;
            result.docId = item.id.toString();
            result.coverUrl = item.cover_pic;

            return result;
          }
        }
        if (geted) {
          break;
        }
      } else {
        result.code = contentList?.success === true ? 0 : -1;
        result.msg = '未找到作品';
        return result;
      }
    }
    result.code = contentList?.success === true ? 0 : -1;
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
