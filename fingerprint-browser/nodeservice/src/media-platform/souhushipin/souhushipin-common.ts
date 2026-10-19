import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';
import { MediaStatusResultOutput, PlatformAuthorInfo } from '../../media-platform';
import { getUserInfoResponse } from './souhushipin-base.service';
import { getVideoContentListResponse, SouHuShiPinContentListResponse } from './souhushipin-content-list.service';
import { auditStatusEnum } from '@/utils';
import { BaseResult } from '../../media-platform/baseResult';
import { deleteSouhushipinVideoResponse } from './souhushipin-content-delete.service';
import crypto from 'crypto';
import { createKuaiProxyAgent, IWebProxy } from '@/media-platform/webproxy';

export const getSouHuShiPinUserInfo = async (cookie: string, proxy?: IWebProxy): Promise<PlatformAuthorInfo> => {
  const result: PlatformAuthorInfo = {
    code: 0,
    msg: '',
  };

  try {
    let webproxy;
    if (proxy?.serverAdd) {
      webproxy = createKuaiProxyAgent(proxy);
    }
    const userInfo = await getUserInfoResponse(cookie, webproxy);
    result.yixiaoerId = userInfo?.data?.id?.toString();
    result.yixiaoerName = userInfo?.data?.nickName?.toString();
    result.yixiaoerImageUrl = userInfo?.data?.smallPhoto?.toString();
    if (result.yixiaoerImageUrl?.startsWith('//')) {
      result.yixiaoerImageUrl = `https:${result.yixiaoerImageUrl}`;
    }

    const escapedStr = result.yixiaoerName.replace(/%u/g, '\\u');
    const decodedStr = eval(`'${escapedStr}'`);
    result.yixiaoerName = decodedStr;

    console.log(decodedStr); // 输出：小狐狸
    result.raw = userInfo.data;
    result.code = userInfo?.status === 1 ? 0 : -1;
    result.msg = userInfo?.msg;
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
 * 查询视频状态
 * @param cookie
 * @param publishId
 * @param maxPage
 */
export const getSouHuShiPinVideoStatus = async (
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
    let nextPageInfo = '';
    let contentList: SouHuShiPinContentListResponse | undefined = undefined;
    for (let i = 1; i < maxPage; i++) {
      contentList = await getVideoContentListResponse(cookie, nextPageInfo, 6);
      if (contentList?.data?.length) {
        nextPageInfo = contentList.hasNext ? contentList.nextCursor : '';
        for (const item of contentList?.data) {
          const findId = item?.id?.toString();

          if (findId === publishId) {
            geted = true;
            if (item.status === 21) {
              result.auditStatus = auditStatusEnum.waitExecute;
            } else if (item.status === 22) {
              result.auditStatus = auditStatusEnum.executeFail;
            } else if (item.status === 33 || item.status === 40) {
              result.auditStatus = auditStatusEnum.published;
            } else {
              result.auditStatus = auditStatusEnum.inAudit;
            }
            result.code = 0;
            result.msg = '';
            result.data = item;
            result.create_time = item.uploadTime;
            result.docId = item.id.toString();
            result.coverUrl = item.bigCover ?? item.smallCover;
            result.openUrl = item.url;
            return result;
          }
        }
        if (geted || !nextPageInfo) {
          break;
        }
      } else {
        result.code = contentList?.status === 1 ? 0 : contentList?.status === 0 ? -1 : contentList?.status ?? -1;
        result.msg = '未找到作品';
        return result;
      }
    }
    result.code = contentList?.status === 1 ? 0 : contentList?.status === 0 ? -1 : contentList?.status ?? -1;
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
 *删除作品
 * @param cookie
 * @param docId 做作品唯一id
 * @param userId
 */
export const deleteSouhushipinContent = async (cookie: string, docId: string, userId: string): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    if (!userId) {
      const user = await getUserInfoResponse(cookie);
      if (user?.data?.id) {
        userId = user.data.id.toString();
      } else {
        result.code = user?.status === 0 ? -1 : user?.status;
        result.msg = user?.msg;
        return result;
      }
    }

    const keyStr = Date.now().toString();
    cookie = cookie.replace(/tv-vlt/g, 'ootv-vltold');
    cookie = `${cookie};tv-vlt=${keyStr}`;
    const ketStr = `23DB79C859A861584E13B7807E7631C5_${userId}_${keyStr}`;
    const md5 = crypto.createHash('md5').update(ketStr).digest('hex');

    const deleteResult = await deleteSouhushipinVideoResponse(cookie, docId, md5);
    result.code = deleteResult?.status === 1 ? 0 : -1;
    result.msg = deleteResult?.msg;
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
