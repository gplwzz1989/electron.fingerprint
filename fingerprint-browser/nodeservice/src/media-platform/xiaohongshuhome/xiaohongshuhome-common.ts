import { BaseResult } from '@/media-platform/baseResult';
import { getSign } from '../xiaohongshu/xiaohongshu-sign';
import { $http } from '@/http';
import { isJson } from '@/utils';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';
import { createKuaiProxyAgent, IWebProxy } from '@/media-platform/webproxy';
import { requestXiaohongshuhome, XiaohongshuhomeApiResponse } from './xiaohongshuhome-http.service';

export interface XiaohongshuhomeUnreadCountData {
  likes?: number;
  connections?: number;
  mentions?: number;
  unread_count?: number;
}

export type XiaohongshuhomeUnreadCountResponse = XiaohongshuhomeApiResponse<XiaohongshuhomeUnreadCountData>;

/**
 * 获取小红书主页评论未读数。
 */
export const getXiaohongshuhomeUnreadCount = async (
  cookie: string,
  proxy?: IWebProxy,
): Promise<XiaohongshuhomeUnreadCountResponse> => {
  return requestXiaohongshuhome<XiaohongshuhomeUnreadCountData>(
    cookie,
    '/api/sns/web/unread_count',
    'GET',
    undefined,
    proxy,
  );
};

/**
 * 小红书笔记管理
 * @param cookie
 * @param tab 类型（0全部，1已发布，2审核中，3未通过）
 * @param pageNum 翻页页码，默认首页为0 -1为最后一页
 */
export const getXiaohongshuContentList = async (
  cookie: string,
  tab: number,
  pageNum: number = 0,
  proxy?: IWebProxy,
): Promise<XiaohongshuContentListOutput> => {
  const result: XiaohongshuContentListOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const webProxy = proxy?.serverAdd ? createKuaiProxyAgent(proxy) : undefined;
    const contentListResult = await getContentListAsync(cookie, tab, pageNum, webProxy);
    result.code = contentListResult?.code;
    result.msg = contentListResult.msg;
    result.data = contentListResult.data;
    result.raw = contentListResult;

    if (result.code == -100) {
      result.msg = '登录失效';
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

export interface XiaohongshuContentListOutput extends BaseResult {
  data?: {
    notes: Array<XiaohongshuMediaContent>;
    page: number;
  };

  raw?: unknown;
}

/**
 * 小红书笔记管理
 * @param cookie
 * @param tab 类型（0全部，1已发布，2审核中，3未通过）
 * @param pageNum 翻页页码，默认首页为0 -1为最后一页
 * @param proxyAgent
 */
export const getContentListAsync = async (
  cookie: string,
  tab: number,
  pageNum: number = 0,
  proxyAgent: object | undefined = undefined,
): Promise<XiaohongshuContentListResponse> => {
  const urlPath = `/web_api/sns/v5/creator/note/user/posted?tab=0&page=${pageNum}`;

  const headers = {
    cookie: cookie,
    referer: 'https://creator.xiaohongshu.com/publish/publish',
    Origin: 'https://creator.xiaohongshu.com/',
    Accept: 'application/json, text/plain, */*',
  };
  const url = 'https://edith.xiaohongshu.com' + urlPath;
  const sign = getSign(urlPath);

  headers['X-s'] = sign['X-s'];
  headers['X-t'] = sign['X-t'];
  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface XiaohongshuMediaContent {
  /**
   * 收藏数
   */
  collected_count: number;

  /**
   * 评论数
   */
  comments_count: number;

  /**
   * 标题
   */
  display_title: string;
  high_self: number;

  /**
   * 作品id
   */
  id: string;

  /**
   * 封面url
   */
  images_list: Array<{
    url: string;
  }>;
  level: number;

  /**
   * 点赞数
   */
  likes: number;

  /**
   * 权限 （0公开，1仅自己可见）
   */
  permission_code: number;
  post_timing: boolean;
  schedule_post_time: number;

  /**
   * 分享数
   */
  shared_count: number;
  sticky: boolean;

  /**
   * 作品状态
   */
  tab_status: number;

  /**
   * 发布时间
   */
  time: string;

  /**
   * 作品类型 （normal：图文，video：视频）
   */
  type: string;
  video_info: {
    duration: string;
  };

  /**
   * 播放数
   */
  view_count: number;
  xsec_token: string;
  xsec_source: string;
}

export interface XiaohongshuContentListResponse {
  data?: {
    notes: Array<XiaohongshuMediaContent>;
    page: number;
  };
  code: number;
  success: boolean;
  msg?: string;
}
