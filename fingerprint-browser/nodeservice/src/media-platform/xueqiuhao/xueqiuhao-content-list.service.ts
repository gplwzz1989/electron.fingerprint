import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';

/**
 * 雪球号-内容长文管理
 * @param cookie
 * @param page 页码
 * @param count 每页数量 默认10
 * @param keyword 搜索关键字
 * @param start_time 搜索起始时间（13位时间戳）
 * @param end_time 搜索结束时间（13位时间戳）
 */
export const getContentListAsync = async (
  cookie: string,
  page: number,
  count: number = 10,
  keyword?: string,
  start_time?: number,
  end_time?: number,
): Promise<XueqiuhaoContentListResponse> => {
  const result = await $http.get<unknown, AxiosResponse<XueqiuhaoContentListResponse>>(
    'https://mp.xueqiu.com/xq/query/v1/search/long',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.xueqiu.com/list',
        authority: 'mp.xueqiu.com',
      },
      params: {
        type: 'success',
        page: page,
        count: count,
        q: keyword,
        start_time: start_time,
        end_time: end_time,
      },
    },
  );

  // 请求失败
  if (result.data?.success == false) {
    throw new BadRequestException(result.data?.message, result.data?.code, result.data);
  }

  return result.data;
};

export interface XueqiuhaoMediaContent {
  category_name: string;
  /**
   * 封面
   */
  cover_pic: string;

  /**
   * 发布时间
   */
  created_at: number;

  /**
   * 描述
   */
  description: string;

  /**
   * 收藏数
   */
  fav_count: number;
  first_img: string;

  /**
   * 作品id
   */
  id: number;

  /**
   * 是否为隐私作品
   */
  is_private: boolean;
  legal_user_visible: boolean;

  /**
   * 点赞数
   */
  like_count: number;
  mark: number;

  /**
   * 评论数
   */
  reply_count: number;

  /**
   * 转发数
   */
  retweet_count: number;
  status_tag: string;
  text: string;

  /**
   * 标题
   */
  title: string;
  type: string;
  user_id: number;

  /**
   * 阅读数
   */
  view_count: number;
}

export interface XueqiuhaoContentListResponse {
  count: number;
  list: Array<XueqiuhaoMediaContent>;
  maxPage: number;
  page: number;
  query_id: number;
  size: number;
  code: number;
  message: string;
  success: boolean;
}
