import { $http } from '../../http';
import { getSign } from './xiaohongshu-sign';
import { isJson } from '../../utils';
import { HttpsProxyAgent } from 'https-proxy-agent';

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

export interface XiaohongshushopMediaContent {
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
  post_timing: false;
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
    notes: Array<XiaohongshushopMediaContent>;
    page: number;
  };
  result: number;
  code:number;
  success: boolean;
  msg?: string;
}
