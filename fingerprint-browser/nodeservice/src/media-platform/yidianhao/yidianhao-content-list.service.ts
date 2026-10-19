import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 一点号内容管理
 * @param cookie
 * @param page 页码
 * @param page_size 每页数量
 * @param token 平台token
 * @param status 内容状态 （'0,1,2,3,4,5,6,7,9,14,15'：全部，'2,6,7'：已发布，'1,4,5,14,15'：审核中，'3'：未通过，'0'：草稿，'9'：已删除）
 * @param from_time 开始日期
 * @param to_time 结束日期
 * @param article_type 内容类型，不传为全部，（-1000001：文章，-1000002：图集，-1000003：视频，-1000004：短内容）
 * @param proxyAgent
 */
export const getContentListAsync = async (
  cookie: string,
  page: number,
  page_size: number,
  token: string,
  status: '0,1,2,3,4,5,6,7,9,14,15' | '2,6,7' | '1,4,5,14,15' | '3' | '0' | '9' = '2,6,7',
  from_time?: number,
  to_time?: number,
  article_type?: -1000001 | -1000002 | -1000003 | -1000004,
  proxyAgent?: HttpsProxyAgent<string>,
): Promise<YidianhaoContentListResponse> => {
  let params: {
    token: string;
    page: number;
    page_size: number;
    status: '0,1,2,3,4,5,6,7,9,14,15' | '2,6,7' | '1,4,5,14,15' | '3' | '0' | '9';
    has_data: number;
    type: string;
    article_type?: -1000001 | -1000002 | -1000003 | -1000004;
    from_time?: number;
    to_time?: number;
    push_status: string;
    date: string;
  } = {
    token: token,
    page: page,
    page_size: page_size,
    status: status,
    has_data: 1,
    type: 'original',
    push_status: '',
    date: '',
  };

  if (from_time && to_time) {
    params = { ...params, from_time, to_time };
  }

  if (article_type) {
    params = { ...params, article_type };
  }

  const result = await $http.get<unknown, AxiosResponse<YidianhaoContentListResponse>>(
    'https://mp.yidianzixun.com/model/Article',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.yidianzixun.com/',
        authority: 'mp.yidianzixun.com',
      },
      params: params,
      httpsAgent: proxyAgent,
      httpAgent: proxyAgent,
    },
  );

  return result.data;
};

export interface YidianhaoMediaContent {
  /**
   * 作品id
   */
  id: number;

  /**
   * 标题
   */
  title: string;

  covers: [
    {
      /**
       * 封面地址
       */
      url: string;
    },
  ];

  /**
   * 副标题
   */
  subTitle: string;

  /**
   * 状态 （5：审核中，3：未通过，2：已发布）
   */
  status: number;

  all_data: {
    /**
     * 收藏数
     */
    likeDoc: number;

    /**
     * 分享数
     */
    shareDoc: number;

    /**
     * 评论数
     */
    addCommentDoc: number;
    /**
     * 推荐量
     */
    viewDoc: number;
    /**
     * 阅读量
     */
    clickDoc: number;
  };

  /**
   * 封面地址
   */
  showCover: string;

  /**
   * 发布时间
   */
  date: number;

  /**
   * 定时时间
   */
  scheduleTime: number;

  /**
   * 是否是视频
   */
  ugcVideo: number;

  feature: {
    ctype: string; //video
  };
  /**
   * 类型 0：文章， 5：视频，257:竖版视频， 513：短内容
   */
  type: number;
}

export interface YidianhaoContentListResponse {
  total: number;
  page_total: number;
  posts: Array<YidianhaoMediaContent>;
  page_current: number;
  errorCode: number;
  reason: string;
}
