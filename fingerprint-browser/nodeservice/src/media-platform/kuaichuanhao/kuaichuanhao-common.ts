import { MediaStatusResultOutput, PlatformAuthorInfo } from '@/media-platform';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';
import { getKuaiChuanHaoUserInfo } from './kuaichuanhao-user.service';
import {
  getKuaiChunContentListResponse,
  KuaichuanhaoContentListResponse,
} from '@/media-platform/kuaichuanhao/kuaichuanhao-content-list.service';
import dayjs from 'dayjs';
import { auditStatusEnum } from '@/utils';
import { BaseResult } from '@/media-platform/baseResult';
import { deleteKuaiChuanArticle } from '@/media-platform/kuaichuanhao/kuaichuanhao-content-delete.service';
import { createKuaiProxyAgent, IWebProxy } from '@/media-platform/webproxy';

export const getKuaiChuanUserInfo = async (cookie: string, proxy?: IWebProxy): Promise<PlatformAuthorInfo> => {
  const result: PlatformAuthorInfo = {
    code: 0,
    msg: '',
  };

  try {
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfo = await getKuaiChuanHaoUserInfo(cookie, webProxy);
    if (!userInfo?.data?.user_info?.id) {
      result.code = userInfo?.errno ?? -1;
      result.msg = userInfo?.errmsg ?? '获取用户信息失败，请确认账号是否入住快传号';
      if (userInfo?.errmsg?.includes('未注册快传号')) {
        result.code = errorCode.accountUnVerify;
      }
      return result;
    }

    result.yixiaoerId = userInfo?.data?.user_info?.qid;
    result.yixiaoerImageUrl = userInfo?.data?.user_info?.image;
    result.yixiaoerName = userInfo?.data?.user_info?.name;

    result.raw = userInfo?.data.user_info;
    result.code = userInfo?.errno ?? -1;
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
export const getKuaiChuanArticleStatus = async (
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

    const statDate = dayjs().format('YYYY-MM-DD');
    const endDate = dayjs().add(-7, 'days').format('YYYY-MM-DD');
    let contentList: KuaichuanhaoContentListResponse | undefined = undefined;
    for (let i = 1; i < maxPage; i++) {
      contentList = await getKuaiChunContentListResponse(cookie, endDate, statDate, i);
      if (contentList?.data?.list?.length) {
        for (const item of contentList?.data?.list) {
          const findId = item?.id;

          if (findId === publishId) {
            geted = true;
            if (item.status === '2') {
              result.auditStatus = auditStatusEnum.published;
              result.openUrl = item.trans_url;
            } else if (item.status === '3') {
              result.auditStatus = auditStatusEnum.deny;
            } else if (item.status === '5') {
              result.auditStatus = auditStatusEnum.prePublish;
            } else if (item.status === '1') {
              result.auditStatus = auditStatusEnum.inAudit;
            } else {
              result.auditStatus = auditStatusEnum.inAudit;
            }

            result.code = 0;
            result.msg = '';
            result.data = item;
            result.create_time = new Date(item.create_time).getTime();
            result.docId = item.id;
            result.coverUrl = item.image_list[0];

            return result;
          }
        }
        if (geted) {
          break;
        }
      } else {
        result.code = contentList?.errno ?? -1;
        result.msg = '未找到作品';
        return result;
      }
    }
    result.code = contentList?.errno ?? -1;
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
 * @param createTime 作品发布时间，状态查询中的create_time
 */
export const deleteKuaiChuanArticleContent = async (
  cookie: string,
  docId: string,
  createTime?: number,
): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    const cateData = await deleteKuaiChuanArticle(
      cookie,
      docId,
      createTime ? dayjs(createTime).format('YYYY-MM-DD HH:mm:ss') : dayjs().format('YYYY-MM-DD HH:mm:ss'),
    );
    result.code = cateData?.errno ?? -1;
    result.msg = cateData?.errmsg ?? '';
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
