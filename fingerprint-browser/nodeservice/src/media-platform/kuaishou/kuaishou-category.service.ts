import { $http } from '../../http';
import { isJson } from '../../utils';

/**
 * 获取分类信息
 * @param cookie
 */
export const getCategoryResponse = async (cookie: string): Promise<KuaishouCategoryResponse> => {
  const url = 'https://cp.kuaishou.com/rest/cp/works/v2/video/pc/upload/domain/list';

  const headers = {
    cookie: cookie,
    Referer: 'https://cp.kuaishou.com/article/publish/video',
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface KuaishouCategoryResponse {
  /**
   * 状态码 1正常 非1异常
   */
  result: number;
  currentTime: number;
  /**
   * 分类列表
   */
  data?: Array<{
    /**
     * 一级分类名称
     */
    firstDomain: string;
    /**
     * 二级分类名称列表
     */
    secondDomain: Array<string>;
  }>;
  /**
   * 提示消息
   */
  message: string;
}
