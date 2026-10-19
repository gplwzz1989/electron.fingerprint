import { GeoLocation, ListInfoResponse, MediaStatusResultOutput, PlatformAuthorInfo } from '@/media-platform';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';
import { auditStatusEnum } from '@/utils';
import { BaseResult } from '@/media-platform/baseResult';
import { getDeWuUserInfoResponse } from '@/media-platform/dewu/dewu-user.service';
import { DeWuContentApiResponse, getDeWuVideoListResponse } from '@/media-platform/dewu/dewu-content-list.service';
import { deleteDeWuVideoResponse } from '@/media-platform/dewu/dewu-content-delete.service';
import { createKuaiProxyAgent, IWebProxy, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { getLocationResponse } from '@/media-platform/dewu/dewu-location.service';
import { getDeWuTopicResponse } from '@/media-platform/dewu/dewu-topic.service';

export const getDeWuUserInfo = async (cookie: string, proxy?: IWebProxy): Promise<PlatformAuthorInfo> => {
  const result: PlatformAuthorInfo = {
    code: 0,
    msg: '',
  };

  try {
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfo = await getDeWuUserInfoResponse(cookie, webProxy);
    if (!userInfo?.userId) {
      result.code = 401;
      result.msg = '获取用户信息失败';
      return result;
    }

    result.yixiaoerId = userInfo?.userId?.toString();
    result.yixiaoerName = userInfo?.userName;
    result.yixiaoerImageUrl = userInfo?.icon;

    result.raw = userInfo;
    result.code = 0;

    if (!result?.yixiaoerId) {
      result.code = 401;
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
export const getDeWuMediaStatus = async (
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

    let contentList: DeWuContentApiResponse | undefined = undefined;
    for (let i = 1; i < maxPage; i++) {
      contentList = await getDeWuVideoListResponse(cookie, i);
      if (contentList?.data?.list) {
        for (const item of contentList?.data?.list) {
          const findId = item?.contentId?.toString();

          if (findId === publishId) {
            geted = true;
            result.auditStatus = auditStatusEnum.published;

            result.code = 0;
            result.create_time = item?.publishTime * 1000;
            result.docId = findId;
            result.coverUrl = item.cover;
            if (item.userSetStatus == 0) {
              result.openUrl = item.videoUrl;
            }
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
 * 删除得物号内容
 * @param cookie
 * @param docId
 */
export const deleteDeWuContent = async (cookie: string, docId: string): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    const cateData = await deleteDeWuVideoResponse(cookie, docId);
    result.code = cateData?.data?.result === true ? 0 : cateData.code ?? -1;
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

export const getDeWuLocation = async (
  cookie: string,
  keyWord: string,
  proxy?: KuaiDaiLiProxy,
  coords?: GeoLocation,
): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    if (!keyWord) {
      return result;
    }
    let webProxy: HttpsProxyAgent<string> | object | undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }

    const locationResult = await getLocationResponse(cookie, keyWord, webProxy, coords);

    result.code = locationResult?.code === 200 ? 0 : locationResult?.code === 0 ? -1 : locationResult?.code;
    result.msg = locationResult.msg ?? '';
    if (locationResult?.data?.position?.length) {
      let i = 0;
      for (const obj of locationResult?.data?.position) {
        i++;
        result.dataList?.push({
          yixiaoerId: `${i}_${obj.lat}_${obj.lng}`,
          yixiaoerName: obj.title ?? '',
          yixiaoerDesc: obj.address,
          raw: obj,
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

export const getDeWuTopics = async (cookie: string, keyWord: string): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    const locationResult = await getDeWuTopicResponse(cookie, keyWord ?? '');

    result.code = locationResult?.code === 200 ? 0 : locationResult?.code === 0 ? -1 : locationResult?.code;
    result.msg = locationResult.msg ?? '';
    if (locationResult?.data?.list?.length) {
      let i = 0;
      for (const obj of locationResult?.data?.list) {
        i++;
        result.dataList?.push({
          yixiaoerId: obj.tagId?.toString(),
          yixiaoerName: obj.tagName ?? '',
          raw: obj,
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
