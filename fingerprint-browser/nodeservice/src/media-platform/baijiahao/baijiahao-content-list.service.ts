import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 百家号内容管理
 * @param cookie
 * @param currentPage 页码
 * @param pageSize 每页数量
 * @param type 数据类型 默认全部 （'':全部，‘news’:图文，‘video’:视频，'ugc_video':小视频，'moment':动态，'live':直播，'video_set,live_set':合集,'gallery':图集）
 * @param collection 数据状态 默认全部 （‘’：全部，‘publish’：已发布，‘pre_publish’：待发布，‘rejected’：未通过，‘withdraw’：已撤回，‘draft’）
 * @param proxyAgent
 */
export const getContentListAsync = async (
  cookie: string,
  currentPage: number,
  pageSize: number,
  type: '' | 'news' | 'video' | 'ugc_video' | 'moment' | 'live' | 'video_set,live_set' | 'gallery' = '',
  collection: '' | 'publish' | 'pre_publish' | 'rejected' | 'withdraw' | 'draft' = '',
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<BaijiahaoContentListResponse> => {
  const url = 'https://baijiahao.baidu.com/pcui/article/lists';

  const params = {
    currentPage: currentPage,
    pageSize: pageSize,
    type: type,
    collection: collection,
    search: '',
    dynamic: 1,
  };
  if (type === 'ugc_video') {
    params['sub_type'] = 'vertical_small_video';
  }

  const headers = {
    cookie: cookie,
    referer: 'https://baijiahao.baidu.com/builder/rc/content',
  };

  const result = await $http.get<unknown, AxiosResponse<BaijiahaoContentListResponse>>(url, {
    headers: headers,
    params: params,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  // 请求失败
  if (result.data.errno !== 0) {
    throw new BadRequestException(result.data?.errmsg, result.data?.errno, result.data);
  }

  return result.data;
};

export interface BaijiahaoMediaContent {
  /**
   * 文章id
   */
  article_id: string;

  /**
   * 封面信息
   */
  cover_images: string;

  /**
   * 作品id
   */
  feed_id: string;
  /**
   * 小视频唯一id,删除时使用
   */
  nid: string;

  /**
   * 是否发布
   */
  is_published: number;

  /**
   * 发布时间
   */
  publish_at: string;

  /**
   * 推荐数
   */
  rec_count: number;

  /**
   * 状态
   */
  status: string;

  /**
   * 标题
   */
  title: string;

  /**
   * 内容类型
   */
  type: string;

  /**
   * 视频地址
   */
  url: string;

  /**
   * 播放量
   */
  read_amount: number;

  /**
   * 评论数
   */
  comment_amount: number;

  /**
   * 分享数
   */
  share_amount: number;

  /**
   * 点赞数
   */
  like_amount: number;

  /**
   * 收藏数
   */
  collection_amount: number;

  /**
   * 分享链接
   */
  share_url: string;

  content: string;

  create_time: number;

  sub_status:string;

  id: number;
}

export interface BaijiahaoContentListResponse {
  errno: number;
  errmsg: string;
  data: {
    list: Array<BaijiahaoMediaContent>;
    message_num: number;
    ability: {
      dynamic_tab_show: number;
      can_show_training_user_info: boolean;
      can_use_se_keyword: number;
    };
    page: {
      currentPage: number;
      pageSize: number;
      totalCount: number;
      totalPage: number;
    };
  };
}

export const getBaiJiaDynamicContentListAsync = async (
  cookie: string,
  currentPage: number,
  pageSize: number,
  collection: string = '',
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<BaijiahaoContentListResponse> => {
  const url = 'https://baijiahao.baidu.com/pcui/pcpublisher/listdynamic';

  const params = {
    currentPage: currentPage,
    pageSize: pageSize,
    type: 'moment',
    collection: collection,
    search: '',
    dynamic: 1,
  };

  const headers = {
    cookie: cookie,
    referer: 'https://baijiahao.baidu.com/builder/rc/content',
  };

  const result = await $http.get<unknown, AxiosResponse<BaijiahaoContentListResponse>>(url, {
    headers: headers,
    params: params,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};
