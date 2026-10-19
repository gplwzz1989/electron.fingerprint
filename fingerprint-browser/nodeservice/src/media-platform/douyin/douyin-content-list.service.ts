import { $http, HttpConfig } from '../../http';
import { AxiosResponse } from 'axios';
import { isJson } from '../../utils';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 *
 * @param cookie
 * @param max_cursor
 * @param status 0:全部 1:已发布 2:审核中 3:未通过
 * @param proxyAgent
 */
export const getContentListAsync = async (
  cookie: string,
  max_cursor: number,
  status: number = 1,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<DouyinContentListResponse> => {
  const result = await $http.get<unknown, AxiosResponse<DouyinContentListResponse>>(
    'https://creator.douyin.com/web/api/media/aweme/post/',
    {
      retryCondition: (error, response) => {
        return !isJson(response.data);
      },
      headers: {
        cookie: cookie,
        referer: 'https://creator.douyin.com/creator-micro/content/manage',
      },
      //params: {},
      params: {
        scene: 'star_atlas',
        device_platform: 'web',
        status: status,
        count: 12,
        max_cursor: max_cursor,
        cookie_enabled: true,
        screen_width: 1536,
        screen_height: 864,
        browser_language: 'zh - CN',
        browser_platform: 'Win32',
        browser_name: 'Mozilla',
        browser_version: HttpConfig.userAgent,
        browser_online: true,
        timezone_name: 'Asia / Shanghai',
        aid: 1128,
      },
      httpsAgent: proxyAgent,
      httpAgent: proxyAgent,
    },
  );

  return result.data;
};

export interface DouyinContentListResponse {
  /**
   * 状态码
   */
  status_code: number;
  /**
   * 状态消息
   */
  status_msg: string;

  /**
   * 内容分页最大数
   */
  max_cursor?: number;

  /**
   * 是否有更多数据
   */
  has_more?: boolean;

  /**
   * 内容分页最小数
   */
  min_cursor?: number;

  /**
   * 内容列表
   */
  aweme_list?: Array<DouyinMediaContent>;
}

export interface DouyinMediaContent {
  /**
   * 封面数组
   */
  Cover: { url_list: Array<string> };

  /**
   * 作者信息
   */
  author: {
    /**
     * 作品数
     */
    aweme_count: number;
    /**
     * 粉丝数
     */
    follower_count: number;
    /**
     * 关注
     */
    following_count: number;
    /**
     * 获赞数
     */
    total_favorited: string;
    /**
     * 抖音好
     */
    short_id: string;
  };

  /**
   * 作品id
   */
  aweme_id: string;

  /**
   * 内容类型
   */
  aweme_type: number;

  /**
   * 内容标题
   */
  item_title: string;

  /**
   * 描述
   */
  desc: string;

  /**
   * 发布时间
   */
  create_time: number;

  /**
   * 内容统计数据
   */
  statistics: {
    /**
     * 作品id
     */
    aweme_id: string;
    /**
     * 收藏数
     */
    collect_count: number;
    /**
     * 评论数
     */
    comment_count: number;
    /**
     * 点赞数
     */
    digg_count: number;

    forward_count: number;
    /**
     * 直播观看数
     */
    live_watch_count: number;
    /**
     * 播放量
     */
    play_count: number;
    /**
     * 分享数
     */
    share_count: number;
  };

  /**
   * 内容状态
   */
  status: {
    allow_comment: boolean;
    allow_share: boolean;
    aweme_id: string;
    in_reviewing: boolean;

    /**
     * 是否删除
     */
    is_delete: boolean;
    is_private: boolean;
    is_prohibited: boolean;
    /**
     * 是否为私密视频
     */
    private_status: number;
    reviewed: boolean;

    /**
     * 仅自己可见
     */
    self_see: boolean;
    with_fusion_goods: boolean;
    with_goods: boolean;
  };

  /**
   * 内容状态值 144未通过 102已发布
   */
  status_value: number;

  /**
   * 分享地址
   */
  share_url: string;
}

export const getAnalyzeContentListResponse = async (
  cookie: string,
  max_cursor: number,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<DouYinAnalyzeContentListResponse> => {
  const url = `https://creator.douyin.com/web/api/creator/item/list?max_cursor=${max_cursor}&count=10&order_by=1&fields=metrics%2Creview%2Cvisibility&need_cooperation=true&need_long_article=true&msToken=&a_bogus=`;
  const result = await $http.get(url, {
    headers: {
      cookie: cookie,
      referer: 'https://creator.douyin.com/creator-micro/data-center/content',
    },
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

export interface DouYinAnalyzeContentListResponse {
  /**
   * 是否有下一页
   */
  has_more: boolean;
  items: Array<{
    collaborative: boolean;
    /**
     * 封面
     */
    cover: {
      uri: string;
      url_list: string[];
    };
    /**
     *发布时间，10位
     */
    create_time: string; // 秒级时间戳字符串
    /**
     * 描述
     */
    description: string;
    downloadable: boolean;
    /**
     * 作品id
     */
    id: string;
    metrics: {
      avg_view_proportion?: string; // 部分item可能无该字段
      /**
       * 平均播放时长/秒
       */
      avg_view_second: string;
      /**
       * 2秒跳出率
       */
      bounce_rate_2s: string;
      /**
       * 评论数
       */
      comment_count: string;
      comment_rate: string;
      comment_entry_rate?: string; // 部分item可能无该字段
      /**
       * 完播率，7位小数
       */
      completion_rate: string;
      /**
       * 5秒完播率
       */
      completion_rate_5s: string;
      cover_show: string;
      /**
       * 封面点击率
       */
      cover_click_rate?: string; // 部分item可能无该字段
      /**
       * 弹幕数
       */
      danmaku_count: string;
      description_completion_rate?: string; // 部分item可能无该字段
      description_spread_rate?: string; // 部分item可能无该字段
      dislike_count: string;
      dislike_rate: string;
      download_count: string;
      fan_view_proportion: string;
      /**
       * 收藏数
       */
      favorite_count: string;
      favorite_rate: string;
      /**
       * 主页访问数
       */
      homepage_visit_count: string;
      image_avg_view_count?: string; // 图片类型item特有
      /**
       * 点赞数
       */
      like_count: string;
      like_rate: string;
      /**
       * 分享数
       */
      share_count: string;
      share_rate: string;
      /**
       * 粉丝增量
       */
      subscribe_count: string;
      subscribe_rate: string;
      unsubscribe_count: string;
      unsubscribe_rate: string;
      /**
       * 播放量
       */
      view_count: string;
    };
    review: {
      status: number;
    };
    /**
     * 1=图片，2=视频，3:长图文
     */
    type: number;
    user_id: string;
    video_info?: {
      // 视频类型item特有（可选）
      duration: string; // 毫秒数字符串
      is_vr: boolean;
    };
    picture_info?: {
      // 图片类型item特有（可选）
      count: number;
      images: Array<{
        uri: string;
        url_list: string[];
      }>;
    };
    visibility: {
      close_friend: number;
      part_see: number;
      status: number;
    };
  }>;
  /**
   * 下一页参数
   */
  max_cursor: string; // 毫秒级时间戳字符串
  min_cursor: string; // 毫秒级时间戳字符串
  /**
   * 0:正常 非0异常
   */
  status_code: number;
  /**
   * 提示消息
   */
  status_msg: string;
  /**
   * 总数
   */
  total: number;
}
