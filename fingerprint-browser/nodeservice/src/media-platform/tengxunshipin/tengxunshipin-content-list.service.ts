import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 获取腾讯视频视频管理
 * @param cookie
 * @param g_actk
 * @param g_vstk
 * @param page 页码
 * @param page_size 每页数量
 * @param status 数据类型（1：全部，2：已发布，3：审核中，4：未通过，5：草稿），默认已发布
 * @param proxyAgent
 */
export const getContentListAsync = async (
  cookie: string,
  g_actk: number,
  g_vstk: number,
  page: number,
  page_size: number,
  status: 1 | 2 | 3 | 4 | 5 = 2,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<TengxunshipinContentListResponse> => {
  const result = await $http.get<unknown, AxiosResponse<TengxunshipinContentListResponse>>(
    'https://access.v.qq.com/trpc.creator_center.backend.VideoFusion/GetUserVideoList',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.v.qq.com/',
        authority: 'access.v.qq.com',
        origin: 'https://mp.v.qq.com',
      },
      params: {
        g_actk: g_actk,
        g_vstk: g_vstk,
        refer: 'vcc_web',
        sort_type: 0,
        sort_flag: 1,
        page: page,
        list_type: 0,
        origin: 1,
        page_size: page_size,
        status: status,
      },
      httpsAgent: proxyAgent,
      httpAgent: proxyAgent,
    },
  );

  return result.data;
};

export interface TengxunshipinMediaContent {
  /**
   * 作品id
   */
  vid: string;

  /**
   * 标题
   */
  title: string;

  /**
   * 封面
   */
  image_url: string;

  /**
   * 发布时间
   */
  upload_time: string;

  /**
   * 时长
   */
  duration: string;

  /**
   * 点赞数
   */
  like: string;

  /**
   * 评论数
   */
  comment: string;

  /**
   * 播放数
   */
  allnumc: string;

  /**
   * 是否置顶
   */
  is_top: boolean;
  is_delivery_successful: boolean;

  /**
   * 是否独家
   */
  is_exclusive: boolean;
  is_vip: boolean;
  like_rot_count: number;
  comment_rot_count: number;
  schedule_publish: string;
  payment_due_date: string;
  cid: string;

  status_show: {
    [key: number]: {
      content: string;
      status: number;
      title: string;
    };
  };
}

export interface TengxunshipinContentListResponse {
  code: number;
  ret?: number;
  msg: string;
  data: {
    pagination: {
      total: number;
      page: number;
      page_size: number;
      page_total: number;
    };
    list: Array<TengxunshipinMediaContent>;
  };
}
