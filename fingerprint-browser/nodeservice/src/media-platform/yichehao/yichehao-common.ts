import { ListInfoResponse, MediaStatusResultOutput, PlatformAuthorInfo } from '@/media-platform';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';

import { auditStatusEnum } from '@/utils';
import { BaseResult } from '@/media-platform/baseResult';
import { getYiCheHaoUserInfoResponse } from '@/media-platform/yichehao/yichehao-user.service';
import {
  getYiCheHaoArticleListResponse,
  getYiCheHaoMiniVideoListResponse,
  getYiCheHaoVideoListResponse,
  YiCheHaoArticleListResponse,
  YiCheHaoMiniVideoListResponse,
  YiCheHaoVideoListItem,
  YiCheHaoVideoListResponse,
} from '@/media-platform/yichehao/yichehao-content-list.service';
import {
  deleteYiCheArticleResponse,
  deleteYiCheManageVideoResponse,
  deleteYiCheVideoResponse,
} from '@/media-platform/yichehao/yichehao-content-delete.service';
import { createKuaiProxyAgent, IWebProxy } from '@/media-platform/webproxy';
import { PubContentEnum } from '@/cloud/model/TypeEnum';
import { searchYichehaoTopic } from '@/media-platform/yichehao/yichehao-topic.service';

export const getYiCheHaoUserInfo = async (cookie: string, proxy?: IWebProxy): Promise<PlatformAuthorInfo> => {
  const result: PlatformAuthorInfo = {
    code: 0,
    msg: '',
  };

  try {
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfo = await getYiCheHaoUserInfoResponse(cookie, webProxy);
    if (!userInfo?.data?.id) {
      result.code =
        userInfo.status?.toString() == '1'
          ? 0
          : userInfo.status?.toString() === '0'
          ? -1
          : parseInt(userInfo.status ? userInfo.status : '-1');
      result.msg = userInfo?.message ?? '获取用户信息失败';
      return result;
    }

    result.yixiaoerImageUrl = userInfo?.data?.avatarPath;
    if (result?.yixiaoerImageUrl?.startsWith('//')) {
      result.yixiaoerImageUrl = 'https:' + result?.yixiaoerImageUrl;
    }
    result.yixiaoerImageUrl = result?.yixiaoerImageUrl?.replace('{0}', '120');
    result.yixiaoerName = userInfo?.data?.showName;
    result.yixiaoerId = userInfo?.data?.id?.toString();

    result.raw = userInfo.data;
    result.code = result.code =
      userInfo.status?.toString() == '1'
        ? 0
        : userInfo.status?.toString() === '0'
        ? -1
        : parseInt(userInfo.status ? userInfo.status : '-1');
    if (!result?.yixiaoerId) {
      result.code = result?.code ?? -1;
    }
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
 * 查询作品状态
 * @param cookie
 * @param publishId
 * @param maxPage
 */
export const getYiCheHaoMediaStatus = async (
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
    let contentList: YiCheHaoMiniVideoListResponse | undefined = undefined;
    let videoList: YiCheHaoVideoListResponse | undefined = undefined;
    for (let i = 1; i < maxPage; i++) {
      videoList = await getYiCheHaoVideoListResponse(cookie, i);
      if (videoList?.data?.list) {
        for (const item of videoList?.data?.list) {
          const findId = item?.videoId?.toString();

          if (findId === publishId) {
            geted = true;
            buildYiCheHaoVideoStatusResult(result, item, findId);
            return result;
          }
        }
        if (geted) {
          break;
        }
      }

      contentList = await getYiCheHaoMiniVideoListResponse(cookie, i);
      if (contentList?.data?.dataList) {
        for (const item of contentList?.data?.dataList) {
          const findId = item?.id?.toString();

          if (findId === publishId) {
            geted = true;
            if (item.status == 2) {
              result.auditStatus = auditStatusEnum.published;
              result.openUrl = `https://sv.yiche.com/detail/?id=${findId}`;
            } else if (item.status == 4) {
              if (parseInt(item.publishTime) > Date.now()) {
                result.auditStatus = auditStatusEnum.prePublish;
              } else {
                result.auditStatus = auditStatusEnum.inAudit;
              }
            } else if (item.status == 3) {
              result.auditStatus = auditStatusEnum.deny;
            } else {
              result.auditStatus = auditStatusEnum.inAudit;
            }

            result.code = 0;
            result.msg = '';
            result.data = item;
            result.create_time = parseInt(item.publishTime);
            result.docId = findId;
            result.coverUrl = item.imageUrl;

            return result;
          }
        }
        if (geted) {
          break;
        }
      } else {
        result.code = contentList?.status === '1' || videoList?.status === '1' ? 0 : -1;
        result.msg = '未找到作品';
        return result;
      }
    }
    result.code = contentList?.status === '1' || videoList?.status === '1' ? 0 : -1;
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

const buildYiCheHaoVideoStatusResult = (
  result: MediaStatusResultOutput,
  item: YiCheHaoVideoListItem,
  findId: string,
) => {
  if (item.status === 10) {
    result.auditStatus = auditStatusEnum.published;
    result.openUrl = item.playUrl ? item.playUrl : `https://sv.yiche.com/detail/?id=${findId}`;
  } else if (item.status === 80 && item.isTimedPublish === 1) {
    result.auditStatus = auditStatusEnum.prePublish;
  } else if (item.status === 20 || item.status === 40 || item.status === 80) {
    result.auditStatus = auditStatusEnum.inAudit;
  } else {
    result.auditStatus = auditStatusEnum.deny;
  }

  result.code = 0;
  result.msg = '';
  result.data = item;
  result.create_time = new Date(item.createTime ?? item.pubTime ?? item.publishTime).getTime();
  result.docId = findId;
  result.coverUrl = item.imageUrl;
};

export const getYiCheHaoArticleStatus = async (
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
    let contentList: YiCheHaoArticleListResponse | undefined = undefined;
    for (let i = 1; i < maxPage; i++) {
      contentList = await getYiCheHaoArticleListResponse(cookie, i);
      if (contentList?.data?.list) {
        for (const item of contentList?.data?.list) {
          const findId = item?.newsId?.toString();

          if (findId === publishId) {
            geted = true;
            if (item.publishStatus == 2) {
              result.auditStatus = auditStatusEnum.published;
              result.openUrl = item.url ? item.url : `https://sv.yiche.com/detail/?id=${findId}`;
            } else if (item.publishStatus == 1 || item.publishStatus == 3) {
              if (new Date(item.publishTime) > new Date()) {
                result.auditStatus = auditStatusEnum.prePublish;
              } else {
                result.auditStatus = auditStatusEnum.inAudit;
              }
            } else if (item.publishStatus == 4) {
              result.auditStatus = auditStatusEnum.deny;
            } else if (item.publishStatus === 0) {
              result.auditStatus = auditStatusEnum.draft;
            } else {
              result.auditStatus = auditStatusEnum.inAudit;
            }

            result.code = 0;
            result.msg = '';
            result.data = item;
            result.create_time = new Date(item.publishTime).getTime();
            result.docId = findId;
            result.coverUrl = item.cover[0];

            return result;
          }
        }
        if (geted) {
          break;
        }
      } else {
        result.code = contentList?.status === '1' ? 0 : -1;
        result.msg = '未找到作品';
        return result;
      }
    }
    result.code = contentList?.status === '1' ? 0 : -1;
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
 * 删除车家号内容
 * @param cookie
 * @param docId
 * @param contentType
 */
export const deleteYiCheHaoContent = async (
  cookie: string,
  docId: string,
  contentType?: PubContentEnum,
): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    if (contentType === PubContentEnum.article) {
      const cateData = await deleteYiCheArticleResponse(cookie, docId);
      result.code = cateData?.status?.toString() == '1' ? 0 : -1;
      result.msg = cateData?.message ?? '';
    } else {
      let cateData;
      try {
        cateData = await deleteYiCheManageVideoResponse(cookie, docId);
      } catch {
        cateData = undefined;
      }
      if (cateData?.status?.toString() != '1') {
        cateData = await deleteYiCheVideoResponse(cookie, docId);
      }
      result.code = cateData?.status?.toString() == '1' ? 0 : -1;
      result.msg = cateData?.message ?? '';
    }
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

export const getYiCheTopics = async (cookie: string, keyWord: string): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    const locationResult = await searchYichehaoTopic(cookie, keyWord ?? '');

    result.code = locationResult?.status === '1' ? 0 : -1;
    result.msg = locationResult.message ?? '';
    if (locationResult?.data?.list?.length) {
      let i = 0;
      for (const obj of locationResult?.data?.list) {
        i++;
        result.dataList?.push({
          yixiaoerId: obj.id?.toString(),
          yixiaoerName: obj.name ?? '',
          raw: {},
        });
      }
    }
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
