import { ListInfoResponse, MediaStatusResultOutput, PlatformAuthorInfo } from '@/media-platform';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';
import { getCheJiaHaoUserInfoResponse } from '@/media-platform/chejiahao/chejiahao-user.service';
import {
  CheJiaHaoContentListResponse,
  getCheJiaHaoContentListResponse,
} from '@/media-platform/chejiahao/chejiahao-content-list.service';
import { auditStatusEnum } from '@/utils';
import { BaseResult } from '@/media-platform/baseResult';
import { deleteCheJiaHaoMediaResponse } from '@/media-platform/chejiahao/chejiahao-content-delete.service';
import { PubContentEnum } from '@/cloud/model/TypeEnum';
import { createKuaiProxyAgent, IWebProxy } from '@/media-platform/webproxy';
import { getCheJiaHaoTopicResponse } from '@/media-platform/chejiahao/chejiahao-topic.service';

export const getCheJiaHaoUserInfo = async (cookie: string, proxy?: IWebProxy): Promise<PlatformAuthorInfo> => {
  const result: PlatformAuthorInfo = {
    code: 0,
    msg: '',
  };

  try {
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfo = await getCheJiaHaoUserInfoResponse(cookie, webProxy);
    if (!userInfo?.result?.userid) {
      result.code = userInfo.returncode ?? -1;
      result.msg = userInfo?.message ?? '获取用户信息失败';
      return result;
    }

    result.yixiaoerImageUrl = userInfo?.result?.headimage;
    result.yixiaoerName = userInfo?.result?.nickname;
    result.yixiaoerId = userInfo?.result?.userid?.toString();

    result.raw = userInfo;
    result.code = userInfo.returncode ?? -1;
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

/**
 * 查询作品状态
 * @param cookie
 * @param publishId
 * @param maxPage
 */
export const getCheJiaHaoMediaStatus = async (
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

    let contentList: CheJiaHaoContentListResponse | undefined = undefined;
    for (let i = 1; i < maxPage; i++) {
      contentList = await getCheJiaHaoContentListResponse(cookie, i);
      if (contentList?.result?.result?.length) {
        for (const item of contentList?.result?.result) {
          const findId = item.creator_infoid?.toString();

          if (findId === publishId) {
            geted = true;
            if (item.status == 1) {
              result.auditStatus = auditStatusEnum.published;
              result.openUrl = item.pc_url;
            } else if (item.status == 0) {
              result.auditStatus = auditStatusEnum.inAudit;
              if (item.content_icon_dto?.videostatus == 0) {
                result.auditStatus = auditStatusEnum.waitExecute;
              }
            } else if (item.status == 2) {
              result.auditStatus = auditStatusEnum.deny;
            } else {
              result.auditStatus = auditStatusEnum.inAudit;
            }
            if (item.status != 2 && item.publish_timing) {
              const pubTime = new Date(item.publish_timing).getTime();
              if (pubTime > Date.now()) {
                result.auditStatus = auditStatusEnum.prePublish;
              }
            }
            result.code = 0;
            result.msg = item.reject_reason;
            result.data = item;
            result.create_time = new Date(item.biz_update_time).getTime();
            result.docId = item.biz_id?.toString();
            result.coverUrl = item.img_url;

            return result;
          }
        }
        if (geted) {
          break;
        }
      } else {
        result.code = contentList?.returncode ?? -1;
        result.msg = '未找到作品';
        return result;
      }
    }
    result.code = contentList?.returncode ?? -1;
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
 * @param type
 */
export const deleteCheJiaHaoContent = async (
  cookie: string,
  docId: string,
  type: PubContentEnum = PubContentEnum.video,
): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    const cateData = await deleteCheJiaHaoMediaResponse(cookie, docId);
    result.code = cateData?.returncode ?? -1;
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

export const getCheJiaHaoTopicInfo = async (cookie: string, keyWord?: string): Promise<PlatformAuthorInfo> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    const topics = await getCheJiaHaoTopicResponse(cookie, keyWord);

    if (topics?.result?.items?.length) {
      result.dataList = topics?.result?.items.map((obj) => ({
        yixiaoerId: obj.categoryId.toString(),
        yixiaoerName: obj.categoryName,
        //raw: obj,
      }));
    }
    result.code = topics.returncode ?? -1;
    result.msg = topics.message;
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
