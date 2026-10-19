import { $http } from '../../http';
import { isJson } from '../../utils';

/**
 * 获取B站视频话题
 * @param cookie
 * @param subCategoryId 分类id，必传，没有二级分类的情况传一级分类
 * @param pageNum 翻页页码，从0开始，默认0
 * @param title
 */
export const getVideoTopicResponse = async (
  cookie: string,
  subCategoryId: number,
  pageNum: number = 0,
  title: string | null = null,
): Promise<BilibiliVideoTopicResponse> => {
  const url = 'https://member.bilibili.com/x/vupre/web/topic/type';

  const headers = {
    cookie: cookie,
    Referer: 'https://member.bilibili.com/platform/upload/video/frame',
  };

  const params = {
    type_id: subCategoryId,
    pn: pageNum,
    ps: 200,
    title: title,
    t: new Date().getTime(),
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: params,
  });

  return result.data;
};

export const searchVideoTopicResponse = async (
  cookie: string,
  pageNum: number = 0,
  keyWord: string | null = null,
): Promise<BilibiliVideoSearchTopicResponse> => {
  const url = 'https://member.bilibili.com/x/vupre/web/topic/search';

  const headers = {
    cookie: cookie,
    Referer: 'https://member.bilibili.com/platform/upload/video/frame',
  };

  const params = {
    keywords: keyWord,
    page_size: 20,
    offset: pageNum * 20,
    t: new Date().getTime(),
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface BilibiliVideoTopicResponse {
  /**
   * 状态码 0正常 非0异常
   */
  code: number;
  /**
   * 提示消息
   */
  message: string;
  /**
   * 数据体
   */
  data: {
    /**
     * 活动/话题列表
     */
    topics: Array<BilibiliVideoTopicInfo>;
    /**
     * 推荐标签，暂时无用
     */
    tags: null;
    // noinspection SpellCheckingInspection
    /**
     * 总页数
     */
    maxpage: number;
  };
}

export interface BilibiliVideoTopicInfo {
  /**
   * 话题id
   */
  topic_id: number;
  /**
   * 话题名称
   */
  topic_name: string;
  /**
   * 描述
   */
  description?: string;
  /**
   * 任务id
   */
  mission_id: number;
  /**
   * 当话题是活动时，活动描述  如:'有奖活动'
   */
  activity_text?: string;
  /**
   * 活动发起方
   */
  activity_description?: string;
}

export interface BilibiliVideoSearchTopicResponse {
  /**
   * 状态码 0正常 非0异常
   */
  code: number;
  /**
   * 提示消息
   */
  message: string;

  data: {
    /**
     * 数据体
     */
    result: {
      /**
       * 活动/话题列表
       */
      topics: Array<BilibiliVideoTopicInfo>;
      /**
       * 推荐标签，暂时无用
       */
      tags: null;
      // noinspection SpellCheckingInspection
      /**
       * 总页数
       */
      maxpage: number;
    };
  };
}
