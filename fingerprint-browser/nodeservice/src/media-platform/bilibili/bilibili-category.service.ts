import { $http } from '../../http';
import { isJson } from '../../utils';

/**
 * 获取视频分类
 * @param cookie
 */
export const getVideoCategoryResponse = async (cookie: string): Promise<BilibiliVideoCategoryResponse> => {
  const url = `https://member.bilibili.com/x/vupre/web/archive/human/type2/list?t=${new Date().getTime()}`;

  const headers = {
    cookie: cookie,
    Referer: 'https://member.bilibili.com/platform/upload/video/frame?page_from=creative_home_top_upload',
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

// noinspection SpellCheckingInspection
export interface BilibiliVideoCategoryResponse {
  /**
   * 状体码 0正常，非0异常
   */
  code: number;
  /**
   *  提示消息
   */
  message: string;
  /**
   * 数据体
   */
  data: {
    /**
     * 分类列表
     */
    type_list: Array<BilibiliVideoCategoryInfo>;
  };
}

export interface BilibiliVideoCategoryInfo {
  /**
   * 分类id
   */
  id: number;
  /**
   * 分类名称
   */
  name: string;
  /**
   * 二级分类
   */
  children?: Array<BilibiliVideoCategoryInfo>;
}

export const getArticleCategoryResponse = async (cookie: string): Promise<BilibiliArticleCategoryResponse> => {
  const url = 'https://member.bilibili.com/x/web/article/pre';

  const headers = {
    cookie: cookie,
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface BilibiliArticleCategoryResponse {
  /**
   * 状态码 0正 非0异常
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
     * 分类列表
     */
    categories: Array<BilibiliArticleCategoryInfo>;
  };
}

export interface BilibiliArticleCategoryInfo {
  /**
   * 分类id
   */
  id: number;
  /**
   * 上级id
   */
  parent_id: 0;
  /**
   * 分类明显
   */
  name: string;
  /**
   * 二级分类
   */
  children: Array<BilibiliArticleCategoryInfo>;
}
