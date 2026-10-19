import { MediaStatusResultOutput, PlatformAuthorInfo } from '@/media-platform';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';
import { getDouBanUserInfoResponse } from './douban-user.service';
import { auditStatusEnum } from '@/utils';
import { BaseResult } from '@/media-platform/baseResult';

import { Regex } from '@/article-parse/common/Common';
import { HtmlAgilityPack } from '@/article-parse/common/HtmlAgilityPack';
import { DouBan } from './douban';
import { select1 } from 'xpath';
import { getDouBanContentListResponse } from './douban-content-list.service';
import { deleteDouBanArticle } from './douban-content-delete.service';
import { createKuaiProxyAgent, IWebProxy } from '@/media-platform/webproxy';

interface DouBanSettingConfig {
  uid?: string;
  user_id?: string;
  nick?: string;
  large_pic?: string;
  pic?: string;
}

interface DouBanGlobalNav {
  USER_ID?: string;
  UPLOAD_AUTH_TOKEN?: string;
}

const getDouBanScriptObject = <T extends object>(html: string, configName: string): T | undefined => {
  const scriptIndex = html.indexOf(`window.${configName}`);
  if (scriptIndex < 0) {
    return undefined;
  }

  const startIndex = html.indexOf('{', scriptIndex);
  if (startIndex < 0) {
    return undefined;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = startIndex; i < html.length; i++) {
    const char = html[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === '{') {
      depth++;
    } else if (char === '}') {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.substring(startIndex, i + 1)) as T;
        } catch {
          return undefined;
        }
      }
    }
  }
  return undefined;
};

const getDouBanAccountName = (userName?: string): string => {
  return userName?.replace(/的[账帐]号$/, '').trim() ?? '';
};

export const getDouBanUserInfo = async (cookie: string, proxy?: IWebProxy): Promise<PlatformAuthorInfo> => {
  const result: PlatformAuthorInfo = {
    code: 0,
    msg: '',
  };

  try {
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfo = await getDouBanUserInfoResponse(cookie, webProxy);

    if (userInfo?.includes('/accounts/login')) {
      result.code = 301;
      result.msg = userInfo;
      return result;
    }

    const config = getDouBanScriptObject<DouBanSettingConfig>(userInfo, '_CONFIG');
    const globalNav = getDouBanScriptObject<DouBanGlobalNav>(userInfo, '_GLOBAL_NAV');
    const userIdStr =
      Regex.Match(userInfo, 'USER_ID:[\\s]{0,}"[0-9]{3,}"').Value() ??
      Regex.Match(userInfo, 'UPLOAD_AUTH_TOKEN:[\\s]{0,}"[0-9]{3}').Value();
    const userIdFromAuthToken = globalNav?.UPLOAD_AUTH_TOKEN?.split(':')[0];
    result.yixiaoerId = config?.uid ?? config?.user_id ?? globalNav?.USER_ID ?? userIdFromAuthToken;
    if (!result.yixiaoerId && userIdStr) {
      result.yixiaoerId = userIdStr.split('"')[1];
    }

    const html = new HtmlAgilityPack.HtmlDocument();
    html.LoadHtml(userInfo);
    const userLogoHn = html.DocumentNode.doc.getElementsByClassName('thumb-large')[0]?.getElementsByTagName('img')[0];
    result.yixiaoerImageUrl = config?.large_pic ?? config?.pic ?? userLogoHn?.getAttribute('src') ?? '';
    let userName = html.DocumentNode.doc.getElementsByTagName('title')[0]?.textContent?.trim();
    if (!userName?.includes('的账号') && !userName?.includes('的帐号')) {
      userName = html.DocumentNode.doc
        .getElementsByClassName('bn-more')[0]
        ?.getElementsByTagName('span')[0]
        ?.textContent?.trim();
    }
    result.yixiaoerName = config?.nick ?? getDouBanAccountName(userName);

    if (!result.yixiaoerId) {
      result.code = 301;
    } else {
      result.code = 0;
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
 * 查询文章状态
 * @param cookie
 * @param publishId
 * @param userId
 * @param maxPage
 */
export const getDouBanArticleStatus = async (
  cookie: string,
  publishId: string,
  userId: string,
  maxPage: number = 2,
): Promise<MediaStatusResultOutput> => {
  const result: MediaStatusResultOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };
  try {
    let geted = false;
    if (!userId) {
      const userInfo = await DouBan.getDouBanUserInfo(cookie);
      userId = userInfo.yixiaoerId ?? '';
    }

    let contentList = '';
    for (let i = 1; i < maxPage; i++) {
      contentList = await getDouBanContentListResponse(cookie, userId);
      if (!contentList?.includes('/accounts/login')) {
        const html = new HtmlAgilityPack.HtmlDocument();
        html.LoadHtml(contentList);
        const contents =
          html.DocumentNode.SelectNodes("//div[@class='note-item']") ??
          html.DocumentNode.SelectNodes("//div[@class='note-item ']");

        for (const item of contents) {
          const al = item.getElementsByTagName('a')[0];
          const url = (al as Element).getAttribute('href');
          const findId = url?.split('topic/')[1]?.split('/')[0] ?? '';

          if (findId === publishId) {
            geted = true;
            result.auditStatus = auditStatusEnum.published;
            result.openUrl = url ?? '';

            result.code = 0;
            try {
              const dateTimeStr = decodeURIComponent(
                (select1("//span[@class='note-date']", item) as HTMLElement)?.textContent?.trim() ?? '',
              )?.trim();

              const dateTimeRegStr = Regex.Match(
                dateTimeStr,
                '[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}',
              )?.Value();
              result.create_time = new Date(dateTimeRegStr ? dateTimeRegStr : '').getTime();
            } catch (e) {}

            result.docId = findId;

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
export const deleteDouBanArticleContent = async (cookie: string, docId: string): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    const cateData = await deleteDouBanArticle(cookie, docId);
    if (cateData?.includes('Your browser should have redirected ')) {
      result.code = 0;
    } else {
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
  }
  return result;
};
