import { $http } from '../../http';
import { Guid, isJson } from '../../utils';
import { regex } from './kuaishou-base.service';

/**
 * 获取话题列表
 * @param cookie
 * @param keyWord 搜索关键词，为空时，话题列表为空
 */
export const getTopicResponse = async (cookie: string, keyWord: string): Promise<KuaishouTopicResponse> => {
  const url = 'https://cp.kuaishou.com/rest/cp/works/v2/video/pc/tag/search';

  const headers = {
    cookie: cookie,
    Referer: 'https://cp.kuaishou.com/article/publish/video',
  };

  const match = regex.exec(cookie);
  const webapiId = match ? match[1] : Guid.NewGuid().toString().replace(/-/g, '');

  const postData = {
    count: 15,
    keyword: keyWord ?? '',
    page: '0',
    'kuaishou.web.cp.api_ph': webapiId,
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface KuaishouTopicResponse {
  /**
   * 状态码 1正常 非1异常
   */
  result: number;
  currentTime: number;
  data?: {
    /**
     * 话题列表
     */
    tags: Array<{
      /**
       * 话题详细数据
       */
      tag: KuaishouTopicInfo;
      /**
       * 阅读数.热度
       */
      viewCount: number;
    }>;
  };
  /**
   * 提示消息
   */
  message: string;
}

export interface KuaishouTopicInfo {
  /**
   * 话题id
   */
  id: number;
  /**
   * 话题名称
   */
  name: string;
  /**
   * 详细信息，暂时无用
   */
  data?: string;
  /**
   * 状态
   */
  status: number;
}
