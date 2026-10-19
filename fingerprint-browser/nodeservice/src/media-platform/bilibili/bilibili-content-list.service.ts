import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { isJson } from '../../utils';
import { HttpsProxyAgent } from 'https-proxy-agent';

// noinspection SpellCheckingInspection
/**
 * b站稿件列表
 * @param cookie
 * @param pn 翻页页码，从1开始，默认1
 * @param ps 每页数量(默认10)
 * @param pubStatus 发布状态 is_pubing审核中，pubed已发布,not_pubed未通过，合在一起'is_pubing,pubed,not_pubed'表示全部状态
 * @param proxyAgent
 */
export const getContentListAsync = async (
  cookie: string,
  pn: number = 1,
  ps: number = 10,
  pubStatus: 'is_pubing,pubed,not_pubed' | 'is_pubing' | 'pubed' | 'not_pubed' = 'is_pubing,pubed,not_pubed',
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<BilibiliContentListResponse> => {
  // noinspection SpellCheckingInspection
  const result = await $http.get<unknown, AxiosResponse<BilibiliContentListResponse>>(
    'https://member.bilibili.com/x/web/archives',
    {
      retryCondition: (error, response) => {
        return !isJson(response.data);
      },
      headers: {
        cookie: cookie,
        referer: 'https://member.bilibili.com/platform/upload-manager/article',
        authority: 'member.bilibili.com',
      },
      params: {
        status: pubStatus,
        pn: pn,
        ps: ps,
        coop: 1,
        interactive: 1,
      },
      httpsAgent: proxyAgent,
      httpAgent: proxyAgent,
    },
  );

  // 请求失败
  if (result.data.code !== 0) {
    throw new BadRequestException(result.data?.message, result.data?.code, result.data);
  }

  return result.data;
};

export interface BilibiliMediaContent {
  Archive: {
    /**
     * 作品id
     */
    aid: number;

    /**
     * 标题
     */
    title: string;

    /**
     * 封面
     */
    cover: string;

    /**
     * 标签
     */
    tag: string;

    /**
     * 视频时长
     */
    duration: number;

    /**
     * 是否原创
     */
    copyright: number;
    desc: string;
    /**
     * 状态
     */
    state: number;

    /**
     * 中文状态
     */
    state_desc: string;

    /**
     * 审核相关提示信息
     */
    reject_reason: string;

    // noinspection SpellCheckingInspection
    /**
     * 视频id
     */
    bvid: string;
    /**
     * 创建时间戳 10位
     */
    ctime: number;

    /**
     * 发布时间戳 10位
     */
    ptime: number;

    // noinspection SpellCheckingInspection
    /**
     * 定时发布时间戳 10位
     */
    dtime: number;
    attrs: {
      is_coop: number;
      is_owner: number;
      is_dynamic: number;
      is_360: number;
      no_public: number;
      live: number;
      is_premiere: number;
      is_played: number;
    };
  };
  stat: {
    aid: number;

    /**
     * 浏览量
     */
    view: number;
    // noinspection SpellCheckingInspection

    /**
     * 弹幕数
     */
    danmaku: number;

    /**
     * 评论数
     */
    reply: number;

    /**
     * 收藏数
     */
    favorite: number;

    /**
     * 硬币数
     */
    coin: number;

    /**
     * 分享数
     */
    share: number;
    now_rank: number;
    his_rank: number;

    /**
     * 点赞数
     */
    like: number;
    dislike: number;
    vt: number;
    vv: number;
  };
}

export interface BilibiliContentListResponse {
  code: number;
  message: string;
  data?: {
    arc_audits: Array<BilibiliMediaContent>;
    page: {
      count: number;
      pn: number;
      ps: number;
    };
  };
}

/**
 * b站图文列表
 * @param cookie
 * @param pn 页码 默认1
 * @param group 作品状态（0：全部，1：进行中，2：已通过，3：未通过）
 * @param proxyAgent
 */
export const getArticleContentListAsync = async (
  cookie: string,
  pn: number,
  group: 0 | 1 | 2 | 3 = 2,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<BilibiliArticleContentListResponse> => {
  const result = await $http.get<unknown, AxiosResponse<BilibiliArticleContentListResponse>>(
    'https://api.bilibili.com/x/article/creative/article/list',
    {
      headers: {
        cookie: cookie,
        referer: 'https://member.bilibili.com/',
        authority: 'member.bilibili.com',
      },
      params: {
        group: group,
        pn: pn,
        mobi_app: 'pc',
      },
      httpsAgent: proxyAgent,
      httpAgent: proxyAgent,
    },
  );

  // 请求失败
  if (result.data.code !== 0) {
    throw new BadRequestException(result.data?.message, result.data?.code, result.data);
  }

  return result.data;
};

export interface BilibiliArticleMediaContent {
  /**
   * 作品id
   */
  id: number;

  /**
   * 作品标题
   */
  title: string;

  /**
   * 发布时间
   */
  publish_time: number;

  /**
   * 作品地址
   */
  view_url: string;

  /**
   * 作品类型
   */
  type: number;

  /**
   * 作品状态
   */
  state: number;
  ctime:number;
  dtime:number;

  /**
   * 封面地址
   */
  image_urls: Array<string>;
  origin_image_urls: Array<string>;
  stats: {
    /**
     * 浏览量
     */
    view: number;

    /**
     * 收藏
     */
    favorite: number;

    /**
     * 点赞
     */
    like: number;
    dislike: number;

    /**
     * 评论
     */
    reply: number;

    /**
     * 分享
     */
    share: number;

    /**
     * 投币
     */
    coin: number;
    dynamic: number;
  };
}

export interface BilibiliArticleContentListResponse {
  artlist: {
    articles: Array<BilibiliArticleMediaContent>;
    type: {
      /**
       * 作品总数
       */
      all: number;

      /**
       * 进行中
       */
      audit: number;

      /**
       * 已通过
       */
      passed: number;

      /**
       * 未通过
       */
      not_passed: number;

      /**
       * 定时通过
       */
      timing_passed: number;
    };
    page: {
      /**
       * 当前页
       */
      pn: number;

      /**
       * 每页数量
       */
      ps: number;

      /**
       * 总数量
       */
      total: number;
    };
  };
  code: number;
  message: string;
}
