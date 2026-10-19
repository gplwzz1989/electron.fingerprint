import { BaseResult } from '../baseResult';
import { AzhanContentListResponse, AzhanMediaContent, getContentListAsync } from './azhan-content-list.service';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import { AzhanDataOverviewDailyDataResponse, getDataOverviewAsync } from './azhan-data-overview.service';
import { getUserInfoAsync } from './azhan-user.service';
import {
  ListItemInfoLevel,
  ListLevelInfoResponse,
  MediaStatusResultOutput,
  PlatformAuthorInfo,
} from '@/media-platform';
import { auditStatusEnum } from '@/utils';
import {
  deleteAZhanArticleContentResponse,
  deleteAZhanVideoContentResponse,
} from '@/media-platform/azhan/azhan-content-delete.service';
import { getAzhanMediaCategory } from '@/media-platform/azhan/azhan-category.service';
import { PubContentEnum } from '@/cloud/model/TypeEnum';
import { createKuaiProxyAgent, IWebProxy } from '@/media-platform/webproxy';

/**
 * A站稿件列表
 * @param cookie
 * @param authorId 用户id
 * @param page 页码 默认1
 * @param resourceType 数据类型 默认2（2：视频稿件，3：文章稿件）
 */
export const getAzhanContentList = async (
  cookie: string,
  authorId: number,
  page: number = 0,
  resourceType: 2 | 3 = 2,
) => {
  const result: AzhanContentListOutput = {
    code: 0,
    msg: '',
  };

  try {
    const contentListResult = await getContentListAsync(cookie, page, authorId, resourceType);

    result.code = contentListResult.result;
    result.data = contentListResult.feed;
    result.pcursor = contentListResult.pcursor;
    result.totalNum = contentListResult.totalNum;
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

export interface AzhanContentListOutput extends BaseResult {
  data?: Array<AzhanMediaContent>;
  pcursor?: string;
  totalNum?: number;
  raw?: unknown;
}

/**
 * A站数据中心
 * @param cookie
 * @param days 筛选天数，默认30（1，7，30）
 */
export const getAzhanDataOverview = async (cookie: string, days: 1 | 7 | 30 = 30) => {
  const result: AzhanDataOverviewOutput = {
    code: 0,
    msg: '',
  };

  try {
    const dataOverviewResult = await getDataOverviewAsync(cookie, days);

    result.code = dataOverviewResult.result;
    result.dailyData = dataOverviewResult.dailyData;
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

export interface AzhanDataOverviewOutput extends BaseResult {
  dailyData?: Array<AzhanDataOverviewDailyDataResponse>;
  raw?: unknown;
}

/**
 * 获取A站用户信息
 * @param cookie
 */
export const getAzhanUserInfo = async (cookie: string, proxy?: IWebProxy): Promise<PlatformAuthorInfo> => {
  const result: PlatformAuthorInfo = {
    code: 0,
    msg: '',
  };

  try {
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfoResult = await getUserInfoAsync(cookie, webProxy);

    result.code = userInfoResult?.result ?? -1;
    result.yixiaoerId = userInfoResult?.info?.userId?.toString();
    result.yixiaoerName = userInfoResult?.info?.userName;
    result.yixiaoerImageUrl = userInfoResult?.info?.headUrl;
    result.raw = userInfoResult?.info;
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

export interface AzhanUserInfoOutput extends BaseResult {
  data?: {
    /**
     * 用户id
     */
    userId: number;

    /**
     * 香蕉数
     */
    banana: number;

    /**
     * 用户主页地址
     */
    shareUrl: string;

    /**
     * 内容数
     */
    contentCount: string;

    /**
     * 头像
     */
    headUrl: string;

    /**
     * 昵称
     */
    userName: string;
  };

  raw?: unknown;
}

/**
 * 查询视频状态
 * @param cookie
 * @param publishId
 * @param contentType
 * @param maxPage
 */
export const getAZhanMediaStatus = async (
  cookie: string,
  publishId: string,
  contentType: PubContentEnum = PubContentEnum.video,
  maxPage: number = 10,
): Promise<MediaStatusResultOutput> => {
  const result: MediaStatusResultOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };
  try {
    let geted = false;
    const userInfo = await getUserInfoAsync(cookie);
    if (!userInfo?.info?.userId) {
      result.code = -1;
      result.msg = '登录失效';
      return result;
    }
    let contentList: AzhanContentListResponse | undefined = undefined;
    for (let i = 0; i < maxPage; i++) {
      contentList = await getContentListAsync(
        cookie,
        i,
        userInfo.info.userId,
        contentType === PubContentEnum.video ? 2 : 3,
      );
      if (contentList?.feed?.length) {
        for (const item of contentList?.feed) {
          const findId = contentType === PubContentEnum.video ? item?.dougaId : item?.contentId?.toString();

          if (findId === publishId) {
            geted = true;
            switch (item.status) {
              case 2:
                result.auditStatus = auditStatusEnum.published;
                result.openUrl =
                  item?.shareUrl ??
                  `https://www.acfun.cn/${contentType === PubContentEnum.video ? 'v' : 'a'}/ac${findId}`;
                break;
              case 1:
                result.auditStatus = auditStatusEnum.inAudit;
                break;
              case 3:
                result.auditStatus = auditStatusEnum.deny;
                result.msg = item.reason;
                break;
              case 5:
                result.auditStatus = auditStatusEnum.waitExecute;
                break;
              case 7:
                result.auditStatus = auditStatusEnum.deny; //撤回
                break;
              case 9:
                result.auditStatus = auditStatusEnum.prePublish;
                break;
              default:
                result.auditStatus = auditStatusEnum.inAudit;
                break;
            }
            result.code = 0;
            result.data = item;
            result.create_time = item.createTimeMillis ? item?.createTimeMillis : item.contributeTime;
            result.docId = findId;
            result.coverUrl = item.coverUrl ? item.coverUrl : item.videoCover;

            return result;
          }
        }
        if (geted) {
          break;
        }
      } else {
        result.code = contentList?.result ?? -1;
        result.msg = '未找到作品';
        return result;
      }
    }
    result.code = contentList?.result ?? -1;
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
 * 删除多多视频
 * @param cookie
 * @param docId
 * @param contentType
 */
export const deleteAZhanMediaContent = async (
  cookie: string,
  docId: string,
  contentType: PubContentEnum = PubContentEnum.video,
): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    const cateData =
      contentType === PubContentEnum.article
        ? await deleteAZhanArticleContentResponse(cookie, docId)
        : await deleteAZhanVideoContentResponse(cookie, docId);
    result.code = cateData?.result ?? -1;
    result.msg = (cateData?.message ? cateData?.message : cateData?.errMsg?.error_msg) ?? '';
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

export const getAZhanMediaCategory = async (
  cookie: string,
  contentType: PubContentEnum,
): Promise<ListLevelInfoResponse> => {
  const result: ListLevelInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };
  try {
    const cateData = await getAzhanMediaCategory(cookie, contentType === PubContentEnum.video ? 2 : 1);
    if (cateData?.length) {
      if (cateData.length == 1 && cateData[0].children?.length) {
        for (const item of cateData[0].children) {
          const firstCategory: ListItemInfoLevel = {
            yixiaoerId: item?.channelId,
            yixiaoerName: item?.name,
            child: [],
          };
          if (item.realms?.length) {
            for (const child of item.realms) {
              const secCate = {
                yixiaoerId: child.realmId,
                yixiaoerName: child.realmName,
                raw: { ...child },
              };
              firstCategory.child?.push(secCate);
            }
          }
          item.children = undefined;
          item.realms = undefined;
          firstCategory.raw = item;
          result.dataList?.push(firstCategory);
        }
      } else {
        for (const item of cateData) {
          const firstCategory: ListItemInfoLevel = {
            yixiaoerId: item?.channelId,
            yixiaoerName: item?.name,
            child: [],
          };
          if (item.children?.length) {
            for (const child of item.children) {
              child.children = undefined;
              const secCate = {
                yixiaoerId: child.channelId,
                yixiaoerName: child.name,
                raw: { ...child },
              };
              firstCategory.child?.push(secCate);
            }
          }
          item.children = undefined;
          firstCategory.raw = item;
          result.dataList?.push(firstCategory);
        }
      }
    }
    result.code = cateData?.length > 0 ? 0 : -1;
    result.msg = cateData?.length > 0 ? '' : '获取分类失败';
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
