import { BaseResult } from '../baseResult';
import {
  getContentListAsync,
  DuoduoshipinMediaContent,
  DuoduoshipinContentListResponse,
} from './duoduoshipin-content-list.service';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import { getDataOverviewAsync, DuoduoshipinDataOverviewItemResponse } from './duoduoshipin-data-overview.service';
import { getUserInfoAsync } from '../duoduoshipin/duoduoshipin-user.service';
import { MediaStatusResultOutput, PlatformAuthorInfo } from '../../media-platform';
import { deleteDuoDuoContentResponse } from './duoduoshipin-content-delete.service';
import { getSign } from './duoduoshipin-video.service';
import { auditStatusEnum } from '@/utils';
import { createKuaiProxyAgent, IWebProxy } from '@/media-platform/webproxy';

/**
 * 多多视频视频管理
 * @param cookie
 * @param page 页面 默认1
 * @param pageSize 每页数量 默认5
 * @param status 数据类型（0：全部，5：已发布，4：待发布，2：审核中，3：未通过），默认全部
 */
export const getDuoduoshipinContentList = async (
  cookie: string,
  page: number = 1,
  pageSize: number = 5,
  status: 0 | 5 | 4 | 2 | 3 = 0,
) => {
  const result: DuoduoshipinContentListOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const contentListResult = await getContentListAsync(cookie, page, pageSize, status);

    result.code = contentListResult.errorCode == 1000000 ? 0 : contentListResult.errorCode;
    result.msg = contentListResult.errorMsg;
    result.data = contentListResult.result;
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

export interface DuoduoshipinContentListOutput extends BaseResult {
  data?: {
    feeds: Array<DuoduoshipinMediaContent>;
    total: number;
    maxAllowed: number;
    notDisplayComment: boolean;
    ifHeadAcc: string;
  };

  raw?: unknown;
}

/**
 * 多多视频视频数据-总览数据
 * @param cookie
 */
export const getDuoduoshipinDataOverview = async (cookie: string) => {
  const result: DuoduoshipinDataOverviewOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const dataOverviewResult = await getDataOverviewAsync(cookie);

    result.code = dataOverviewResult.errorCode == 1000000 ? 0 : dataOverviewResult.errorCode;
    result.msg = dataOverviewResult.errorMsg;
    result.data = dataOverviewResult.result;
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

export interface DuoduoshipinDataOverviewOutput extends BaseResult {
  data?: {
    overallStatistic: Array<{
      /**
       * 数据名称
       */
      title: string;

      /**
       * 数据值
       */
      value: number;
    }>;
    daysStatistic: Array<DuoduoshipinDataOverviewItemResponse>;
  };

  raw?: unknown;
}

/**
 * 多多视频用户信息
 * @param cookie
 * @param proxy
 */
export const getDuoduoshipinUserInfo = async (cookie: string, proxy?: IWebProxy): Promise<PlatformAuthorInfo> => {
  const result: PlatformAuthorInfo = {
    code: 0,
    msg: 'ok',
  };

  try {
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfoResult = await getUserInfoAsync(cookie, webProxy);

    result.code =
      userInfoResult.errorCode == 1000000 ? 0 : userInfoResult.errorCode ?? userInfoResult?.error_code ?? -1;
    result.msg = userInfoResult.error_msg;
    result.yixiaoerId = userInfoResult?.result?.anchorUid?.toString();
    result.yixiaoerName = userInfoResult?.result?.name;
    result.yixiaoerImageUrl = userInfoResult?.result?.image;
    result.raw = userInfoResult?.result;
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

export interface DuoduoshipinUserInfoOutput extends PlatformAuthorInfo {}

/**
 * 删除多多视频
 * @param cookie
 * @param docId
 */
export const deleteDuoDuoShiPinContent = async (cookie: string, docId: string): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    const sign = await getSign();
    const cateData = await deleteDuoDuoContentResponse(cookie, docId, sign);
    result.code = cateData?.errorCode === 1000000 ? 0 : cateData?.errorCode ?? cateData?.error_code ?? -1;
    result.msg = cateData?.errorMsg ?? '';
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
 * 查询视频状态
 * @param cookie
 * @param publishId
 * @param maxPage
 */
export const getDuoDuoVideoStatus = async (
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
    const antiSign = await getSign();
    let contentList: DuoduoshipinContentListResponse | undefined = undefined;
    for (let i = 1; i < maxPage; i++) {
      contentList = await getContentListAsync(cookie, i, 10, 0, antiSign);
      if (contentList?.result?.feeds?.length) {
        for (const item of contentList?.result.feeds) {
          const findId = item?.feedId;

          if (findId === publishId) {
            geted = true;
            if (item.liveStatus === 1) {
              result.auditStatus = auditStatusEnum.published;
              result.openUrl = item.mediaUrl;
            } else if (item.liveStatus === 0 && item.publishTime > Date.now()+100000) {
              result.auditStatus = auditStatusEnum.prePublish;
            } else if (item.liveStatus === 2) {
              result.auditStatus = auditStatusEnum.deny;
            } else if (item.liveStatus === 4) {
              result.auditStatus = auditStatusEnum.waitExecute;
            } else {
              result.auditStatus = auditStatusEnum.inAudit;
            }
            if (item.memo) {
              result.auditStatus = auditStatusEnum.deny;
              result.msg = item.memo;
              result.openUrl = '';
            }
            result.code = 0;
            result.data = item;
            result.create_time = item.publishTime;
            result.docId = item.feedId;
            result.coverUrl = item.coverUrl;

            return result;
          }
        }
        if (geted) {
          break;
        }
      } else {
        result.code =
          contentList?.errorCode === 1000000 ? 0 : contentList?.errorCode === 0 ? -1 : contentList?.errorCode ?? -1;
        result.msg = '未找到作品';
        return result;
      }
    }
    result.code =
      contentList?.errorCode === 1000000 ? 0 : contentList?.errorCode === 0 ? -1 : contentList?.errorCode ?? -1;
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
