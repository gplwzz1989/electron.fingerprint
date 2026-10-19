import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 知乎内容管理列表
 * @param cookie
 * @param offset 起始数据 （页码-1）*每页数量
 * @param limit 每页数量
 * @param tab 内容类型 默认zvideo（article：图文，zvideo：视频）
 * @param start 开始时间
 * @param end 结束时间
 * @param proxyAgent
 */
export const getContentListAsync = async (
  cookie: string,
  offset: number,
  limit: number,
  tab: 'all' | 'article' | 'zvideo' | 'pin' = 'zvideo',
  start: number = 0,
  end: number = 0,
  proxyAgent?: HttpsProxyAgent<string> | undefined,
): Promise<ZhihuContentListResponse> => {
  const url = 'https://www.zhihu.com/api/v4/creators/creations/v2/' + tab;
  const referer = 'https://www.zhihu.com/creator/manage/creation/' + tab;

  const result = await $http.get(url, {
    headers: {
      cookie: cookie,
      referer: referer,
    },
    params: {
      start: start,
      end: end,
      limit: limit,
      offset: offset,
      need_co_creation: 1,
      sort_type: 'created',
    },
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

export interface ZhihuMediaContent {
  /**
   * 作品类型
   */
  type: string;
  data: {
    /**
     * 作品id
     */
    id: string;

    /**
     * 作品url(图文：https://zhuanlan.zhihu.com/p/加上url_token 视频：https://www.zhihu.com/zvideo/加上url_token)
     */
    url_token: string;

    /**
     * 作品标题
     */
    title: string;

    /**
     * 作品描述
     */
    excerpt: string;

    /**
     * 封面
     */
    thumbnail: string;

    /**
     * 时长
     */
    duration: number;

    /**
     * 创建时间（发布时间）
     */
    created_time: number;

    /**
     * 更新时间
     */
    updated_time: number;
  };
  reaction: {
    /**
     * 评论数
     */
    comment_count: number;
    reviewing_comment_count: number;
    vote_up_count: number;

    /**
     * 阅读量
     */
    read_count: number;

    /**
     * 喜欢数
     */
    like_count: number;

    /**
     * 收藏数
     */
    collect_count: number;

    /**
     * 播放数
     */
    play_count: number;
    repin_count: number;
    reaction_count: number;
    view_count: number;
    answer_count: number;
    follow_count: number;
  };
  status: Array<{
    reason: string;
    status_type: string;
  }>;
}

export interface ZhihuContentListResponse {
  paging: {
    is_end: boolean;
    is_start: boolean;
    next: string;
    previous: string;
    totals: number;
    totals_real: number;
  };
  data: Array<ZhihuMediaContent>;
}

/**
 * 知乎内容草稿
 * @param cookie
 * @param offset 起始数据 （页码-1）*每页数量
 * @param limit 每页数量
 * @param tab 内容类型 默认zvideos（articles：图文，zvideos：视频）
 */
export const getContentDraftAsync = async (
  cookie: string,
  offset: number,
  limit: number,
  tab: 'articles' | 'zvideos'|'pin' = 'pin',
): Promise<ZhihuContentDraftResponse> => {
  let url = `https://www.zhihu.com/api/v4/content/drafts?action=pin&offset=${offset}&limit=${limit}&include=data%5B*%5D.schedule`;
  if(tab==='articles')
  {
    url=`https://www.zhihu.com/api/v4/articles/my_drafts?offset=${offset}&limit=${limit}&include=data%5B*%5D.schedule`;
  }
  const referer = 'https://www.zhihu.com/creator/manage/creation/' + tab;

  const result = await $http.get(url, {
    headers: {
      cookie: cookie,
      referer: referer,
    },
    params: {
      offset: offset,
      limit: limit,
    },
  });

  return result.data;
};

export interface ZhihuContentDraftResponse {
  paging: {
    is_end: boolean;
    is_start: boolean;
    next: string;
    previous: string;
    totals: number;
    totals_real: number;
  };
  data: Array<ZhihuDraftContent>;
}
export interface ZhihuDraftContent {
  /**
   * 是否发布时间
   */
  schedule: { publish_at: number };

  content_id:string;
  plugin:string;
  /**
   * 发布id
   */
  id: string;

  /**
   * 用户发布时间
   */
  updated_at: number;

  /**
   * 封面图
   */
  image_url: string;
}
