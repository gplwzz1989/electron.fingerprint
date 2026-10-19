import {
  ListItemInfoLevel,
  ListLevelInfoResponse,
  MediaStatusResultOutput,
  PlatformAuthorInfo,
} from '@/media-platform';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';
import { getWiFiHaoUserInfo } from './wifi-user.service';
import { auditStatusEnum } from '@/utils';
import { BaseResult } from '@/media-platform/baseResult';
import {
  getWiFiContentListResponse,
  WiFiContentListResponse,
} from '@/media-platform/wifiwanneng/wifi-content-list.service';
import { deleteKuaiChuanArticle } from '@/media-platform/wifiwanneng/wifi-content-delete.service';
import { PubContentEnum } from '@/cloud/model/TypeEnum';
import { getAzhanMediaCategory } from '@/media-platform/azhan/azhan-category.service';
import { createKuaiProxyAgent, IWebProxy } from '@/media-platform/webproxy';

export const getWiFiUserInfo = async (cookie: string, proxy?: IWebProxy): Promise<PlatformAuthorInfo> => {
  const result: PlatformAuthorInfo = {
    code: 0,
    msg: '',
  };

  try {
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfo = await getWiFiHaoUserInfo(cookie, webProxy);
    if (!userInfo?.data?.entryInfo?.user_id) {
      result.code = userInfo?.error?.code ?? 400;
      result.msg = userInfo?.error?.message ?? '获取用户信息失败';
      return result;
    }

    result.yixiaoerId = userInfo?.data?.entryInfo?.user_id?.toString();
    result.yixiaoerImageUrl = userInfo?.data?.entryInfo?.portrait_photo;
    result.yixiaoerName = userInfo?.data?.entryInfo?.name;

    result.raw = userInfo?.data?.entryInfo;
    result.code = 0;
    result.msg = '';
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
export const getWiFiArticleStatus = async (
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

    let contentList: WiFiContentListResponse | undefined = undefined;
    for (let i = 0; i < maxPage; i++) {
      contentList = await getWiFiContentListResponse(cookie, i, 10);
      if (contentList?.data?.length) {
        for (const item of contentList?.data) {
          const findId = item.id;
          if (findId === publishId) {
            geted = true;
            switch (item.statusLabel) {
              case '通过':
                result.auditStatus = auditStatusEnum.published;
                result.openUrl = 'https://i.lsttapp.com/content/' + findId + '.html#';
                break;
              case '已推荐':
                result.auditStatus = auditStatusEnum.published;
                result.openUrl = 'https://i.lsttapp.com/content/' + findId + '.html#';
                break;
              case '审核不通过':
                result.auditStatus = auditStatusEnum.deny;
                break;
              case '草稿':
                result.auditStatus = auditStatusEnum.draft;
                break;
              case '已提交':
                result.auditStatus = auditStatusEnum.inAudit;
                break;
              case '视频审核中':
                result.auditStatus = auditStatusEnum.inAudit;
                break;
              default:
                result.auditStatus = auditStatusEnum.inAudit;
                break;
            }

            result.create_time = item.create_date;
            result.docId = findId;
            result.code = 0;
            return result;
          }
        }
        if (geted) {
          break;
        }
      } else {
        result.code = contentList?.success ? 0 : -1;
        result.msg = '未找到作品';
        return result;
      }
    }
    result.code = contentList?.success ? 0 : -1;
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
export const deleteWiFiArticleContent = async (cookie: string, docId: string): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    const cateData = await deleteKuaiChuanArticle(cookie, docId);
    result.code = cateData?.error?.message || !cateData?.success ? -1 : 0;
    result.msg = cateData?.error?.message ?? '';
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

export const getWifiMediaCategory = async (
  cookie: string,
  contentType: PubContentEnum,
): Promise<ListLevelInfoResponse> => {
  const result: ListLevelInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };
  try {
    const cateData = await getWiFiHaoUserInfo(cookie);
    if (cateData?.data?.category) {
      for (const item of Object.keys(cateData?.data?.category)) {
        const firstCategory: ListItemInfoLevel = {
          yixiaoerId: item?.toString(),
          yixiaoerName: cateData?.data?.category[item],
          child: [],
        };
        result.dataList?.push(firstCategory);
      }
    }
    result.code = cateData?.data?.entryInfo?.user_id ? 0 : -1;
    result.msg = cateData?.error?.message ?? '获取分类失败';
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
