import { MediaStatusResultOutput, PlatformAuthorInfo } from '@/media-platform';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';
import { getJianShuHaoUserInfo } from './jianshu-user.service';
import dayjs from 'dayjs';
import { auditStatusEnum } from '@/utils';
import { BaseResult } from '@/media-platform/baseResult';
import { HtmlAgilityPack } from '@/article-parse/common/HtmlAgilityPack';
import { select1 } from 'xpath';
import { Regex } from '@/article-parse/common/Common';
import { getJianShuContentListResponse } from '@/media-platform/jianshu/jianshu-content-list.service';
import { deleteKuaiChuanArticle } from '@/media-platform/jianshu/jianshu-content-delete.service';
import { createKuaiProxyAgent, IWebProxy } from '@/media-platform/webproxy';

export const getJianShuUserInfo = async (cookie: string, proxy?: IWebProxy): Promise<PlatformAuthorInfo> => {
  const result: PlatformAuthorInfo = {
    code: 0,
    msg: '',
  };

  try {
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfo = await getJianShuHaoUserInfo(cookie, webProxy);
    if (!userInfo?.slug) {
      result.code = userInfo?.error?.includes('登录') ? 301 : 404;
      result.msg = userInfo?.error ?? '获取用户信息失败';
      return result;
    }

    result.yixiaoerId = userInfo?.slug?.toString();
    result.yixiaoerImageUrl = userInfo?.avatar;
    result.yixiaoerName = userInfo?.nickname;

    result.raw = userInfo;
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
 * @param userId
 */
export const getJianShuArticleStatus = async (
  cookie: string,
  publishId: string,
  maxPage: number = 10,
  userId: string = '',
): Promise<MediaStatusResultOutput> => {
  const result: MediaStatusResultOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };
  try {
    let geted = false;

    if (!userId) {
      const userInfo = await getJianShuUserInfo(cookie);
      userId = userInfo?.yixiaoerId ?? '';
      if (!userId) {
        result.code = userInfo?.code ?? -1;
        result.msg = userInfo?.code === 301 ? '登录失效' : '获取用户信息失败';
        return result;
      }
    }

    let contentList = '';
    for (let i = 1; i < maxPage; i++) {
      contentList = await getJianShuContentListResponse(cookie, userId, i);
      if (!contentList?.includes('/accounts/login')) {
        const html = new HtmlAgilityPack.HtmlDocument();
        html.LoadHtml(contentList);
        const contents = html.DocumentNode.SelectNodes("//ul[@class='note-list']/li");

        for (const item of contents) {
          const findId = item.getAttribute('data-note-id') ?? '';
          if (findId === publishId) {
            geted = true;
            result.auditStatus = auditStatusEnum.published;
            const titleHn = select1(".//a[@class='title']", item) as HTMLElement;
            result.openUrl = 'https://www.jianshu.com' + titleHn?.getAttribute('href');
            const dateStr =
              (select1(".//span[@class='time']", item) as HTMLElement)?.getAttribute('data-shared-at') ?? '';

            result.create_time = new Date(dateStr).getTime();
            result.docId = findId;
            result.code = 0;
            return result;
          }
        }
        if (geted) {
          break;
        }
      } else {
        result.code = !contentList?.includes('/accounts/login') ? 0 : -1;
        result.msg = '未找到作品';
        return result;
      }
    }
    result.code = !contentList?.includes('/accounts/login') ? 0 : -1;
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
export const deleteJianShuArticleContent = async (cookie: string, docId: string): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    const cateData = await deleteKuaiChuanArticle(cookie, docId);
    result.code = cateData?.error || !cateData?.id ? -1 : 0;
    result.msg = cateData?.error ?? '';
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
