import {
  ListItemInfoLevel,
  ListLevelInfoResponse,
  MediaStatusResultOutput,
  PlatformAuthorInfo,
} from '@/media-platform';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';
import { getMeiPaiIndexPage } from './meipai-user.service';
import { HtmlAgilityPack } from '@/article-parse/common/HtmlAgilityPack';
import { getMeiPaiContentIndexPage, MeiPaiContentItem } from './meipai-content-list.service';
import { BaseResult } from '@/media-platform/baseResult';
import { auditStatusEnum } from '@/utils';
import { deleteMeiPaiVideoResponse } from '@/media-platform/meipai/meipai-content-delete.service';
import { getYidianVideoCategoryResponse } from '@/media-platform/yidianhao/yidianhao-category.service';
import { getMeiPaiCategoryResponse } from '@/media-platform/meipai/meipai-category-service';
import { createKuaiProxyAgent, IWebProxy } from '@/media-platform/webproxy';

export const getMeiPaiUserInfo = async (cookie: string, proxy?: IWebProxy): Promise<PlatformAuthorInfo> => {
  const result: PlatformAuthorInfo = {
    code: 0,
    msg: '',
  };

  try {
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfo = await getMeiPaiIndexPage(cookie, webProxy);
    if (!userInfo) {
      result.code = -1;
      result.msg = '获取用户信息失败';
      return result;
    }
    const html = new HtmlAgilityPack.HtmlDocument();
    html.LoadHtml(userInfo);

    const userHn = html.DocumentNode.GetElementbyId('headerUser');
    if (userInfo?.indexOf('请先登录') > -1 || userHn == null) {
      result.code = 10001;
      result.msg = '用户未登录';
      return result;
    }

    const userHeaserHn = html.DocumentNode.SelectSingleNode(
      ".//div[@id='headerUser']/a[@class='header-fun-item user-info']",
    );
    if (userHeaserHn == null) {
      result.code = 10001;
      result.msg = '用户未登录';
      return result;
    }

    const hrefStr = userHeaserHn?.getAttribute('href');
    if (!hrefStr) {
      result.code = 10001;
      result.msg = '用户未登录';
      return result;
    }

    const userId = hrefStr.split('/')[2];

    result.yixiaoerId = userId;

    let userLogo = html.DocumentNode.SelectSingleNode(
      ".//div[@id='headerUser']/a[@class='header-fun-item user-info']/img",
    )?.getAttribute('src');

    if (userLogo?.startsWith('//')) {
      userLogo = 'https:' + userLogo;
    }
    result.yixiaoerImageUrl = userLogo ?? '';
    result.yixiaoerName = userHeaserHn.textContent?.trim();

    result.raw = { text: userInfo };
    result.code = userId ? 0 : -1;
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

const regex = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/;

export const getMeiPaiContentList = async (cookie: string, page: number = 0) => {
  const result: MeiPaiContentListOutput = {
    code: 0,
    msg: '',
    data: [],
  };

  try {
    const contentListResult = await getMeiPaiContentIndexPage(cookie, page);

    const html = new HtmlAgilityPack.HtmlDocument();
    html.LoadHtml(contentListResult);
    const contentList = html.DocumentNode.doc.getElementsByClassName('row'); // html.DocumentNode.SelectNodes("//tr[@class='row']");
    if (contentList.length > 0) {
      for (let i = 0; i < contentList.length; i++) {
        const item = contentList[i];

        const match = item.textContent?.toString().match(regex);

        const href = item.getElementsByTagName('a')[0]?.getAttribute('href');
        const statusEl = item.getElementsByTagName('div')[0];
        result.data?.push({
          docId: item.getAttribute('data-vid') ?? '',
          publishId: item.getElementsByTagName('img')[0]?.getAttribute('src')?.split('/')[3]?.split('.')[0] ?? '',
          publishTime: match ? match[0] : '',
          status: statusEl?.innerText ?? statusEl?.textContent ?? statusEl.innerHTML ?? statusEl?.toString(),
          href: href ?? '',
          coverUrl: item.getElementsByTagName('img')[0]?.getAttribute('src') ?? '',
        });
      }
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

export interface MeiPaiContentListOutput extends BaseResult {
  data?: Array<MeiPaiContentItem>;
}

/**
 * 查询视频状态
 * @param cookie
 * @param publishId
 * @param maxPage
 */
export const getMeiPaiVideoStatus = async (
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

    let contentList: MeiPaiContentListOutput | undefined = undefined;
    for (let i = 1; i < maxPage; i++) {
      contentList = await getMeiPaiContentList(cookie, i);
      if (contentList?.data?.length) {
        for (const item of contentList?.data) {
          const findId = item?.publishId;

          if (findId === publishId) {
            geted = true;
            if (item.status?.includes('已发布')) {
              result.auditStatus = auditStatusEnum.published;
              result.openUrl = `https://www.meipai.com${item.href}`;
            } else if (item.status?.includes('将于')) {
              result.auditStatus = auditStatusEnum.prePublish;
            } else if (item.status?.includes('审核')) {
              result.auditStatus = auditStatusEnum.inAudit;
            } else if (item.status?.includes('转码') || item?.status?.includes('截帧中')) {
              result.auditStatus = auditStatusEnum.waitExecute;
            } else if (item.status?.includes('转码失败')) {
              result.auditStatus = auditStatusEnum.executeFail;
            } else {
              result.auditStatus = auditStatusEnum.inAudit;
            }

            result.code = 0;
            result.msg = '';
            result.data = item;
            result.create_time = new Date(item.publishTime).getTime();
            result.docId = item.docId;
            result.coverUrl = 'https:' + item.coverUrl;

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
 * 删除美拍视频
 * @param cookie
 * @param docId
 */
export const deleteMeiPaiShiPinContent = async (cookie: string, docId: string): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    const cateData = await deleteMeiPaiVideoResponse(cookie, docId);
    result.code = cateData?.error_code ?? -1;
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

export const getMeiPaiVideoCategory = async (cookie: string): Promise<ListLevelInfoResponse> => {
  const result: ListLevelInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    const categoryResult = await getMeiPaiCategoryResponse(cookie);
    if (categoryResult?.category_list?.length) {
      for (const category of categoryResult?.category_list) {
        const firstCate: ListItemInfoLevel = {
          yixiaoerId: category.id?.toString(),
          yixiaoerName: category.name,
          child: [],
        };
        if (category.child_list?.length) {
          for (const child of category.child_list) {
            const childCate: ListItemInfoLevel = {
              yixiaoerId: child.id.toString(),
              yixiaoerName: child.name,
              raw: child,
            };
            firstCate.child?.push(childCate);
          }
        }
        category.child_list = [];
        firstCate.raw = category;
        result.dataList?.push(firstCate);
      }
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
