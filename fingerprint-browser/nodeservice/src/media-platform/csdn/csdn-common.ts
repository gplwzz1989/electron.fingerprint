import { BaseResult } from '../baseResult';
import { CsdnContentListResponse, CsdnMediaContent, getContentListAsync } from './csdn-content-list.service';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import { getDataOverviewAsync, getDataOverviewCoreDataAsync } from '../csdn/csdn-data-overview.service';
import { getCSDNUserInfoResponse, getUserHomeDataAsync } from '../csdn/csdn-user.service';
import { MediaStatusResultOutput, PlatformAuthorInfo } from '@/media-platform';
import { auditStatusEnum } from '@/utils';
import { deleteCSDNArticleResponse } from '@/media-platform/csdn/csdn-content-delete.service';
import { createKuaiProxyAgent, IWebProxy } from '@/media-platform/webproxy';

/**
 * csdn内容列表
 * @param cookie
 * @param page 页码 默认1
 * @param pageSize 每页数量 默认20
 */
export const getCsdnContentList = async (
  cookie: string,
  page: number = 1,
  pageSize: number = 20,
): Promise<CsdnContentListOutput> => {
  const result: CsdnContentListOutput = {
    code: 0,
    msg: '',
  };

  try {
    const contentListResult = await getContentListAsync(cookie, page, pageSize);

    result.code = contentListResult.code;
    result.msg = contentListResult.message;
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

export interface CsdnContentListOutput extends BaseResult {
  data?: {
    list: Array<CsdnMediaContent>;
    /**
     * 当前页码
     */
    page: number;

    /**
     * 每页数量
     */
    size: number;
    listStatus: string;

    /**
     * 总数量
     */
    total: number;
  };

  raw?: unknown;
}

/**
 * csdn内容分析报表
 * @param cookie
 * @param start 开始时间（10位时间戳）
 * @param end 结束时间（10位时间戳）
 * @param page 页码 默认1
 * @param pageSize 每页数量 默认20
 */
export const getCsdnDataOverview = async (
  cookie: string,
  start: Date,
  end: Date,
  page: number = 1,
  pageSize: number = 20,
): Promise<CsdnDataOverviewOutput> => {
  const result: CsdnDataOverviewOutput = {
    code: 0,
    msg: '',
  };

  try {
    const startTime = start.getTime();
    const endTime = end.getTime();

    const startTs = Math.floor(startTime / 1000);
    const endTs = Math.floor(endTime / 1000);

    const dataOverviewResult = await getDataOverviewAsync(cookie, startTs, endTs, page, pageSize);

    result.code = dataOverviewResult.code;
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

export interface CsdnDataOverviewOutput extends BaseResult {
  data?: {
    list: Array<{
      /**
       * 阅读数
       */
      viewCount: number;

      /**
       * 评论数
       */
      commentCount: number;

      /**
       * 收藏数
       */
      favoriteCount: number;

      /**
       * 粉丝数
       */
      fanCount: number;

      /**
       * 日期
       */
      pdate: string;
    }>;

    /**
     * 总数
     */
    total: number;

    /**
     * 当前页码
     */
    page: number;

    /**
     * 每页数量
     */
    size: number;
  };

  raw?: unknown;
}

/**
 * csdn 内容分析核心数据
 * @param cookie
 */
export const getCsdnDataOverviewStatistic = async (cookie: string): Promise<CsdnDataOverviewStatisticDataOutput> => {
  const result: CsdnDataOverviewStatisticDataOutput = {
    code: 0,
    msg: '',
  };

  try {
    const dataOverviewStatisticResult = await getDataOverviewCoreDataAsync(cookie);

    result.code = dataOverviewStatisticResult.code;
    result.msg = dataOverviewStatisticResult.msg;
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

export interface CsdnDataOverviewStatisticDataOutput extends BaseResult {
  data?: Array<{
    /**
     * 数据名称
     */
    name: string;

    /**
     * 数据对应值
     */
    num: number;
  }>;

  raw?: unknown;
}

/**
 * CSDN 首页统计数据
 * @param cookie
 */
export const getCsdnUserHomeData = async (cookie: string): Promise<CsdnUserHomeDataOutput> => {
  const result: CsdnUserHomeDataOutput = {
    code: 0,
    msg: '',
  };

  try {
    const userHomeDataResult = await getUserHomeDataAsync(cookie);

    result.code = userHomeDataResult.code;
    result.msg = userHomeDataResult.message;
    result.data = userHomeDataResult.data;
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

export interface CsdnUserHomeDataOutput extends BaseResult {
  data?: {
    /**
     * 总阅读数
     */
    allViewCount: number;

    /**
     * 昨日阅读数
     */
    yesterdayViewCount: number;

    /**
     * 总粉丝数
     */
    allFansCount: number;

    /**
     * 昨日粉丝数
     */
    yesterdayFansCount: number;

    /**
     * 总收藏数
     */
    allFavoriteCount: number;

    /**
     * 昨日收藏数
     */
    yesterdayFavoriteCount: number;
  };
}

export const getCSDNUserInfo = async (cookie: string, proxy?: IWebProxy): Promise<PlatformAuthorInfo> => {
  const result: PlatformAuthorInfo = {
    code: 0,
    msg: '',
  };

  try {
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfo = await getCSDNUserInfoResponse(cookie, webProxy);

    result.yixiaoerId = userInfo?.data?.username;
    result.yixiaoerName = userInfo?.data?.nickname;
    result.yixiaoerImageUrl = userInfo?.data?.avatar;
    result.raw = userInfo.data;
    result.code = userInfo?.code === 200 ? 0 : userInfo?.code === 0 ? -1 : userInfo.code;
    result.msg = userInfo?.message ? userInfo?.message : userInfo.msg;
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

/**
 * 查询文章状态
 * @param cookie
 * @param publishId
 * @param maxPage
 */
export const getCSDNMediaStatus = async (
  cookie: string,
  publishId: string,
  maxPage: number = 2,
): Promise<MediaStatusResultOutput> => {
  const result: MediaStatusResultOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };
  try {
    let geted = false;
    let contentList: CsdnContentListResponse | undefined = undefined;
    for (let i = 1; i < maxPage; i++) {
      contentList = await getContentListAsync(cookie, i);
      if (contentList?.data?.list?.length) {
        for (const item of contentList?.data?.list) {
          const findId = item.articleId?.toString();

          if (findId === publishId) {
            geted = true;
            const statusStr = item.status;
            switch (statusStr) {
              //0草稿 2未通过 3已发布 5处理失败 6管理员下线 7作者下线 8待发布 10 作者删除
              case '2':
                result.auditStatus = auditStatusEnum.draft;
                break;
              case '32':
                result.auditStatus = auditStatusEnum.deny;
                break;

              case '64':
                result.auditStatus = auditStatusEnum.published;
                result.openUrl = `https://blog.csdn.net/${item.username}/article/details/${findId}`;
                break;
              case '16':
                result.auditStatus = auditStatusEnum.inAudit;
                break;
              case '6':
                result.auditStatus = auditStatusEnum.deny;
                break;
              case '1':
                result.auditStatus = auditStatusEnum.published;
                result.openUrl = `https://blog.csdn.net/${item.username}/article/details/${findId}`;
                break;

              default:
                result.auditStatus = auditStatusEnum.inAudit;
                break;
            }
            if (statusStr == '10' && item?.scheduledTime * 1000 > Date.now()) {
              result.auditStatus = auditStatusEnum.prePublish;
            }

            result.coverUrl = item?.coverImage?.length ? item.coverImage[0] : '';
            result.create_time = new Date(item.postTime).getTime();
            result.docId = findId;

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

/**
 * 删除文章
 * @param cookie
 * @param docId
 */
export const deleteCSDNMediaContent = async (cookie: string, docId: string): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    const cateData = await deleteCSDNArticleResponse(cookie, docId);
    if (cateData?.code === 200) {
      await deleteCSDNArticleResponse(cookie, docId, true);
    }
    result.code = cateData?.code === 200 ? 0 : cateData?.code === 0 ? -1 : cateData?.code;
    result.msg = cateData?.message;
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
