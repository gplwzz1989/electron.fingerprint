import { MediaStatusResultOutput, PlatformAuthorInfo, UserCanPublishInfo, UserStatus } from '@/media-platform';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';
import { getMeiYouUserInfoResponse } from '@/media-platform/meiyou/meiyou-user.service';
import { BaseResult } from '@/media-platform/baseResult';
import { deleteMeiYouContentResponse } from '@/media-platform/meiyou/meiyou-content-delete';
import { auditStatusEnum } from '@/utils';
import { PubContentEnum } from '@/cloud/model/TypeEnum';
import { ContentListResponse, getMeiYouContentResponse } from '@/media-platform/meiyou/meiyou-content-list.service';
import { createKuaiProxyAgent, IWebProxy } from '@/media-platform/webproxy';

export const getMeiYouUserInfo = async (cookie: string, proxy?: IWebProxy): Promise<PlatformAuthorInfo> => {
  const result: PlatformAuthorInfo = {
    code: 0,
    msg: '',
  };

  try {
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfo = await getMeiYouUserInfoResponse(cookie, webProxy);
    if (!userInfo?.data?.user?.user_id) {
      result.code = userInfo.code ?? -1;
      result.msg = userInfo?.message ?? '获取用户信息失败';
      return result;
    }

    result.yixiaoerImageUrl = userInfo?.data?.user?.avatar;
    result.yixiaoerName = userInfo?.data?.user?.name;
    result.yixiaoerId = userInfo?.data?.user?.user_id;

    result.raw = userInfo;
    result.code = userInfo.code ?? -1;
    if (!result?.yixiaoerId) {
      result.code = -1;
    }
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

export const getMeiYouUserCAanPubInfo = async (cookie: string, proxy?: IWebProxy): Promise<UserCanPublishInfo> => {
  const result: UserCanPublishInfo = {
    code: 0,
    msg: '',
    data: { status: 0 },
  };

  try {
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfo = await getMeiYouUserInfoResponse(cookie, webProxy);
    result.code = userInfo.code ?? -1;
    result.msg = userInfo?.message ?? '';
    result.data = {
      status: userInfo?.data?.user?.status > 1 ? UserStatus.unRealAuth : 0,
      msg: userInfo?.data?.user?.status > 1 ? '账号未完成作者认证，请打开美柚创作者中心认证后再试。' : '',
    };
    // if (userInfo?.data?.user?.forbidden_status > 0) {
    //   result.data = {
    //     status: UserStatus.ban,
    //     msg: '账号已封禁',
    //   };
    // }
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

export const deleteMeiYouContent = async (cookie: string, docId: string): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    const cateData = await deleteMeiYouContentResponse(cookie, docId);
    result.code = cateData?.code ?? -1;
    result.msg = cateData?.message ?? '';
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

export const getMeiYouMediaStatus = async (
  cookie: string,
  publishId: string,
  pubContenType: PubContentEnum = PubContentEnum.video,
  maxPage: number = 10,
): Promise<MediaStatusResultOutput> => {
  const result: MediaStatusResultOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };
  try {
    let geted = false;

    let contentList: ContentListResponse | undefined = undefined;
    for (let i = 1; i < maxPage; i++) {
      contentList = await getMeiYouContentResponse(cookie, i, pubContenType == PubContentEnum.article ? 2 : 12);
      if (contentList?.data?.data?.length) {
        for (const item of contentList?.data?.data) {
          const findId = item?.id?.toString();

          if (findId === publishId) {
            geted = true;
            const statusStr = item.status;
            const inAuditStr = [4, 11, 12, 14, 18];

            if (statusStr == 1 || statusStr == 6) {
              result.auditStatus = auditStatusEnum.published;
              result.openUrl = 'https://mp.meiyou.com/preview?news_id=' + findId + '&news_type=12';
            } else if (inAuditStr.includes(statusStr)) {
              result.auditStatus = auditStatusEnum.inAudit;
            } else if (statusStr == 3 || statusStr == 10) {
              result.auditStatus = auditStatusEnum.deny;
            } else if (statusStr == 7) {
              result.auditStatus = auditStatusEnum.notPublic;
            } else if (statusStr == 8) {
              result.auditStatus = auditStatusEnum.draft;
            } else if (statusStr == 15) {
              result.auditStatus = auditStatusEnum.prePublish;
            } else if (statusStr == 5 || statusStr == 13) {
              result.auditStatus = auditStatusEnum.customWithdrawn;
            } else {
              result.auditStatus = auditStatusEnum.inAudit;
            }

            result.code = 0;
            result.create_time = new Date(item?.published_date).getTime();
            result.docId = findId;
            result.coverUrl = item.flat_images;
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
