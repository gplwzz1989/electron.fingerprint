import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { isJson } from '../../utils';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { getSign } from './xiaohongshu-sign';

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
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
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

/**
 *
 * @param cookie
 * @param tab 0:全部 1:图文 2:视频
 * @param pageNum
 * @param proxyAgent
 */
export const getAnalyzeContentListResponse = async (
  cookie: string,
  tab: number = 0,
  pageNum: number = 1,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<XiaohongshuAnalyzeContentListResponse> => {
  if (!pageNum) {
    pageNum = 1;
  }
  const urlPath = `/api/galaxy/creator/datacenter/note/analyze/list?type=${tab}&page_size=10&page_num=${pageNum}`;

  const headers = {
    cookie: cookie,
    referer: 'https://creator.xiaohongshu.com/publish/publish',
    Origin: 'https://creator.xiaohongshu.com/',
    Accept: 'application/json, text/plain, */*',
  };
  const url = 'https://creator.xiaohongshu.com' + urlPath;
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

export interface XiaohongshuAnalyzeContentListResponse {
  msg: string;
  data: {
    result: { code: number; message: string; success: boolean };
    note_infos: Array<XiaohongshuAnalyzeContentItem>;
    total: number;
  };
  code: number;
  success: boolean;
}

export interface XiaohongshuAnalyzeContentItem {
  user_update_time: number;
  audit_status: number;
  /**
   * 曝光量
   */
  imp_count: number;
  type: number;
  /**
   * 评论
   */
  comment_count: number;
  /**
   * 分享
   */
  share_count: number;
  /**
   * 人均观看时长
   */
  view_time_avg: number;
  title: string;
  /**
   * 点赞
   */
  like_count: number;
  update_time: number;
  /**
   * 封面点击率
   */
  coverClickRate: number;
  id: string;
  cover_url: string;
  post_time: number;
  /**
   * 阅读播放
   */
  read_count: number;
  /**
   * 收藏
   */
  fav_count: 0;
  /**
   * 弹幕
   */
  danmaku_count: 0;
  /**
   * 涨粉
   */
  increase_fans_count: 0;
}
