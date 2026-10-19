import {
  ListItemInfoLevel,
  ListLevelInfoResponse,
  MediaStatusResultOutput,
  PlatformAuthorInfo,
  UserCanPublishInfo,
  UserStatus,
} from '@/media-platform';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';

import { auditStatusEnum } from '@/utils';
import { BaseResult } from '@/media-platform/baseResult';
import { getFengWangUserInfoResponse } from '@/media-platform/fengwang/fengwang-user.service';
import { getFengWangMiniVideoListResponse } from '@/media-platform/fengwang/fengwang-content-list.service';
import { deleteYiCheVideoResponse } from '@/media-platform/fengwang/fengwang-content-delete.service';
import { FengWang } from '@/media-platform/fengwang/fengwang';
import { HtmlAgilityPack } from '@/article-parse/common/HtmlAgilityPack';
import { select1 } from 'xpath';
import { getVideoCategoryResponse } from '@/media-platform/fengwang/fengwang-category.service';
import { createKuaiProxyAgent, IWebProxy } from '@/media-platform/webproxy';

export const getFengWangUserInfo = async (cookie: string, proxy?: IWebProxy): Promise<PlatformAuthorInfo> => {
  const result: PlatformAuthorInfo = {
    code: 0,
    msg: '',
  };

  try {
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfo = await getFengWangUserInfoResponse(cookie, webProxy);
    if (!userInfo?.data?.users?.user_id) {
      result.code = userInfo.status == 200 ? 0 : userInfo.status?.toString() === '0' ? -1 : userInfo?.status;
      result.msg = userInfo?.msg ?? '获取用户信息失败';
      return result;
    }

    if (userInfo?.data?.pgcs?.length) {
      result.yixiaoerImageUrl = userInfo?.data.pgcs[0].icon;
      result.yixiaoerId = userInfo?.data.pgcs[0].id;
      result.yixiaoerName = userInfo?.data.pgcs[0].name;
    } else if (userInfo?.data?.users?.user_id) {
      result.code = errorCode.accountUnVerify;
      result.msg = '账号未完成作者认证，请打蜂网创作者中心认证后再试';
      return result;
      // result.yixiaoerId = userInfo?.data?.users?.user_id?.toString();
      // result.yixiaoerName = userInfo?.data?.users?.user_name;
      // result.yixiaoerImageUrl = userInfo?.data?.users?.shead;
    }

    result.raw = userInfo?.data;
    result.code = userInfo.status == 200 ? 0 : userInfo.status?.toString() === '0' ? -1 : userInfo?.status;
    result.msg = userInfo?.msg;
    if (!result?.yixiaoerId) {
      result.code = -1;
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

export const getFengWangUserCanPubInfo = async (cookie: string, proxy?: IWebProxy): Promise<UserCanPublishInfo> => {
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
    const userInfo = await getFengWangUserInfoResponse(cookie, webProxy);
    result.code = userInfo.status == 200 ? 0 : userInfo?.status === 0 ? -1 : userInfo?.status ?? -1;
    result.msg = userInfo?.msg ?? '';
    if (!userInfo?.data?.pgcs?.length && userInfo?.data?.users?.user_id) {
      result.data = { status: UserStatus.unVerify, msg: '账号未完成作者入驻，请打开蜂网创作者中心入驻后再试。' };
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
 * @param userId
 */
export const getFengWangMediaStatus = async (
  cookie: string,
  publishId: string,
  maxPage: number = 10,
  userId?: string,
): Promise<MediaStatusResultOutput> => {
  const result: MediaStatusResultOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };
  try {
    let geted = false;
    if (!userId) {
      const userInfo = await FengWang.getFengWangUserInfo(cookie);
      userId = userInfo?.yixiaoerId ?? '';
    }

    let contentList = '';
    for (let i = 1; i < maxPage; i++) {
      contentList = await getFengWangMiniVideoListResponse(cookie, i, userId);
      if (!contentList?.includes('暂时还没有数据')) {
        const html = new HtmlAgilityPack.HtmlDocument();
        html.LoadHtml(contentList);
        const contents = html.DocumentNode.SelectNodes("//div[@class='media']");

        for (const item of contents) {
          const findId = (
            select1(".//button[@class='multiselect dropdown-toggle btn btn-white addToGroup']", item) as HTMLElement
          )?.getAttribute('data-vid');

          if (findId === publishId) {
            geted = true;
            const statusStr = (select1(".//p[@class='item1 item1_fix']", item) as HTMLElement)?.textContent ?? '';
            if (statusStr?.includes('已发布')) {
              result.auditStatus = auditStatusEnum.published;
              result.openUrl = ``;
            } else if (statusStr?.includes('草稿')) {
              result.auditStatus = auditStatusEnum.draft;
            } else if (statusStr?.includes('已下线')) {
              result.auditStatus = auditStatusEnum.deny;
            } else if (statusStr?.includes('不通过')) {
              result.auditStatus = auditStatusEnum.deny;
              result.msg =
                (select1(".//span[@class='glyphicon glyphicon-question-sign']", item) as HTMLElement)?.getAttribute(
                  'data-original-title',
                ) ?? '';
            } else if (statusStr?.includes('转码中')) {
              result.auditStatus = auditStatusEnum.waitExecute;
            } else if (statusStr?.includes('转码失败')) {
              result.auditStatus = auditStatusEnum.executeFail;
            } else if (statusStr?.includes('定时')) {
              result.auditStatus = auditStatusEnum.prePublish;
            } else {
              result.auditStatus = auditStatusEnum.inAudit;
            }

            result.code = 0;
            const dateStr =
              (select1(".//span[@class='colorItem fix-time']", item) as HTMLElement)?.textContent
                ?.split('创建时间：')[1]
                ?.trim() ?? '';
            result.create_time = new Date(dateStr).getTime();
            result.docId = findId;
            result.coverUrl =
              (select1(".//img[@class='media-object']", item) as HTMLElement)?.getAttribute('src') ?? '';

            return result;
          }
        }
        if (geted) {
          break;
        }
      } else {
        result.code = contentList?.includes('暂时还没有数据') ? 0 : -1;
        result.msg = '未找到作品';
        return result;
      }
    }
    result.code = contentList?.includes('暂时还没有数据') ? 0 : -1;
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
 */
export const deleteFengWangContent = async (cookie: string, docId: string): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    const cateData = await deleteYiCheVideoResponse(cookie, docId);
    result.code = cateData?.status?.toString() == '1' ? 0 : -1;
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

let fengwangCategory: Array<ListItemInfoLevel> | null = null;
export const getFengWangVideoCategory = async (cookie: string): Promise<ListLevelInfoResponse> => {
  const result: ListLevelInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };

  if (fengwangCategory) {
    result.dataList = fengwangCategory;
    return result;
  }
  try {
    const categoryResult = await getVideoCategoryResponse(cookie);
    if (categoryResult?.data?.length) {
      for (const category of categoryResult?.data) {
        const firstCate: ListItemInfoLevel = {
          yixiaoerId: category.id?.toString(),
          yixiaoerName: category.name,
          child: [],
        };
        const subCategory = await getVideoCategoryResponse(cookie, 'subset', firstCate.yixiaoerId);
        if (subCategory?.data?.length) {
          for (const child of subCategory?.data) {
            const childCate: ListItemInfoLevel = {
              yixiaoerId: child.id.toString(),
              yixiaoerName: child.name,
              raw: child,
            };
            firstCate.child?.push(childCate);
          }
        }
        firstCate.raw = category;
        result.dataList?.push(firstCate);
      }
    }
    if (result.dataList?.length) {
      fengwangCategory = result.dataList;
    }
    result.code = 0;
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
