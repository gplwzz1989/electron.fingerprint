import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { GetTimeStamp } from '../../utils';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 大鱼号-我的作品
 * @param cookie
 * @param page 页码
 * @param currentView 内容状态 默认全部（'all'：全部，'released'：已发布，'timedRelease'：待发布，'pending'：审核中，'spam'：发布失败，'offline'：已下线）
 * @param currentTab 数据类型 默认全部（'all'：全部，'article'：图文，'shortvideo'：短视频，'minivideo'：小视频，'album'：图集）
 * @param proxyAgent
 */
export const getContentListAsync = async (
  cookie: string,
  page: number,
  currentView: 'all' | 'released' | 'timedRelease' | 'pending' | 'spam' | 'offline' = 'all',
  currentTab: 'all' | 'article' | 'shortvideo' | 'minivideo' | 'album' = 'all',
  proxyAgent?: HttpsProxyAgent<string>,
): Promise<DayuhaoContentListResponse> => {
  const result = await $http.get<unknown, AxiosResponse<DayuhaoContentListResponse>>(
    'https://mp.dayu.com/dashboard/getNewContentList',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.dayu.com/dashboard/contents?spm=a2s0i.db_index.menu.9.6a2d3caaXK2xa4',
        authority: 'mp.dayu.com',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {
        page: page,
        currentView: currentView,
        currentTab: currentTab,
        source: 'all',
        _: GetTimeStamp(13),
      },
      httpAgent: proxyAgent,
      httpsAgent: proxyAgent,
    },
  );

  // 请求失败
  if (result.data?.error?.code !== undefined) {
    throw new BadRequestException(result.data?.error?.message, result.data?.error?.code, result.data);
  }

  return result.data;
};

export interface DayuhaoMediaContent {
  /**
   * 内容id
   */
  content_id: string;

  /**
   * 标题
   */
  title: string;

  /**
   * 封面地址
   */
  cover_url: string;
  vertical_cover_url: string;

  /**
   * 发布时间
   */
  publish_at: string;
  article_category?: number;

  /**
   * 状态
   */
  status: number;

  origin_id: string;

  /**
   * 竖版视频信息
   */
  body?: { videos?: Array<object> };

  /**
   * 竖版视频id
   */
  xss_item_id: number;
  realData: {
    cid: string;

    /**
     * 阅读数
     */
    click_pv: number;

    /**
     * 播放数
     */
    video_vv: number;

    /**
     * 点赞数
     */
    like_pv: number;

    /**
     * 分享数
     */
    share_pv: number;

    /**
     * 评论数
     */
    comment_pv: number;

    /**
     * 收藏数
     */
    fav_pv: number;
  };
  second_title: string;
  previewUrl: string;

  /**
   * 作品地址
   */
  ucUrl: string;
  _app_extra?: {
    audit_remark: string;
  };
}

export interface DayuhaoContentListResponse {
  dataList: {
    data: Array<DayuhaoMediaContent>;
    totalPage: number;
    metadata: {
      total: number;
      max_pos: number;
    };
  };
  error: {
    code: string;
    message: string;
  };
}

/**
 * 大鱼号内容单篇数据
 * @param cookie
 * @param beginDate 开始日期（××××-××-××）
 * @param endDate 结束日期（××××-××-××）
 * @param page 页码
 * @param size 每页数量
 */
export const getDayuhaoContentSingleListAsync = async (
  cookie: string,
  beginDate: string,
  endDate: string,
  page: number,
  size: number,
): Promise<DayuhaoContentSingletListResponse> => {
  const result = await $http.get<unknown, AxiosResponse<DayuhaoContentSingletListResponse>>(
    'https://mp.dayu.com/api/stat/productList',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.dayu.com/dashboard/stat/product?spm=a2s0i.db_stat_overview.menu.13.508d3caaSKuEZY',
        authority: 'mp.dayu.com',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {
        beginDate: beginDate,
        endDate: endDate,
        page: page,
        size: size,
        _: GetTimeStamp(13),
      },
    },
  );

  // 请求失败
  if (result.data?.error?.code !== undefined) {
    throw new BadRequestException(result.data?.error?.message, result.data?.error?.code, result.data);
  }

  return result.data;
};

export interface DayuhaoMediaContentSingle {
  /**
   * 作品id
   */
  content_id: string;
  aid: string;
  wm_id: string;

  /**
   * 标题
   */
  title: string;

  /**
   * 封面
   */
  cover_url: string;

  /**
   * 发布时间
   */
  publish_at: string;

  /**
   * 作品类型（1图文，3短视频，4小视频，）
   */
  item_type: number;
  status: number;
  horizontal_cover_url: string;
  format_type: number;
  biz_id: number;
  vugc_object_id: string;
  read_pv_all: number;

  /**
   * 阅读/播放量
   */
  video_vv_all: number;
  txt_list_click_ratio: string;
  vdo_list_click_ratio: number;
  avg_read_times: number;

  /**
   * 阅读/播放时长
   */
  avg_play_times: number;

  /**
   * 推荐量
   */
  show_pv_all: number;

  /**
   * 点赞量
   */
  like_pv_all: number;

  /**
   * 评论量
   */
  comment_pv_all: number;
  share_url: string;
  ds: number;
}

export interface DayuhaoContentSingletListResponse {
  data: Array<DayuhaoMediaContentSingle>;
  total: number;
  metadata: {
    total: number;
    max_pos: number;
    since_pos: number;
  };
  error: {
    code: string;
    message: string;
  };
}
