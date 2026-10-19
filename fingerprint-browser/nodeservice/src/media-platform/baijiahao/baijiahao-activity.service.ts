import { $http } from '../../http';
import { AxiosResponse } from 'axios';

/**
 * 获取活动列表
 * @param cookie
 * @param page_no 页码,默认首页从1开始
 * @param page_size 每页数量，默认18
 * @param mediaType 内容类型（news: 图文，video: 横版视频, miniVideo:竖版视频,microArticle:动态），
 * @param activity_type 活动类型（market: 推荐，all: 已收藏），默认推荐
 */
export const getActivityAsync = async (
  cookie: string,
  mediaType: 'news' | 'video' | 'miniVideo' | 'microArticle',
  activity_type: 'market' | 'all' = 'market',
  page_no: number = 1,
  page_size: number = 18,
): Promise<BaijiahaoActivityResponse> => {
  let params: {
    page_no: number;
    article_type: number;
    page_size: number;
    task_attend: number;
    task_origin: 'market' | 'all';
    task_type: number;
    collection_flag?: number;
    from: string;
  };

  let articleType = 1;
  switch (mediaType) {
    case 'news':
      articleType = 1;
      break;
    case 'video':
      articleType = 2;
      break;
    case 'miniVideo':
      articleType = 4;
      break;
    case 'microArticle':
      articleType = 3;
      break;
    default:
      articleType = 1;
      break;
  }

  if (activity_type === 'market') {
    params = {
      page_no: page_no,
      article_type: articleType,
      page_size: page_size,
      task_attend: 1,
      task_origin: activity_type,
      task_type: -1,
      from: 'pc_edit',
    };
  } else {
    params = {
      page_no: page_no,
      article_type: articleType,
      page_size: page_size,
      task_attend: 1,
      task_origin: activity_type,
      task_type: -1,
      collection_flag: 1,
      from: 'pc_edit',
    };
  }

  const result = await $http.get<unknown, AxiosResponse<BaijiahaoActivityResponse>>(
    'https://baijiahao.baidu.com/author/eco/tasksystem/getSquareMissionList',
    {
      headers: {
        cookie: cookie,
        referer: `https://baijiahao.baidu.com/builder/rc/edit?type=${mediaType}`,
        host: 'baijiahao.baidu.com',
      },
      params: params,
    },
  );

  return result.data;
};

export interface BaijiahaoActivityResponse {
  /**
   * 状态码,0:正常，非0异常
   */
  errno: number;
  /**
   * 提示消息
   */
  errmsg: string;
  data: {
    /**
     * 当前数量
     */
    count: number;
    /**
     * 当前页码
     */
    page_no: number;
    /**
     * 单页最大数量
     */
    page_size: number;
    /**
     * 活动列表
     */
    list: Array<BaijiahaoActivityInfo>;
  };
}

export interface BaijiahaoActivityInfo {
  /**
   * 任务id/活动id，发布时需要
   */
  id: string;
  /**
   * 活动名称
   */
  task_name: string;
  /**
   * 活动封面图url
   */
  brief_image: string;
  is_inspire: number;
  /**
   * 参与数
   */
  participant_num: number;
  task_type: string;
  task_subtitle: string;
  reward_description: string;
  task_url: string;
  has_perm: number;
  task_character: string;
  /**
   * 活动剩余时间，秒
   */
  remain_time: number;
  topic_list: Array<{
    id: string;
    title: string;
  }>;
  is_need: number;
  task_origin: string;
  scheme: string;
  collection: number;
  task_tag: string;
  /**
   * 活动开始时间戳
   */
  start_time: number;
}
