import { $http } from '@/http';
import { isJson } from '@/utils';

export const getCollectionResponse = async (cookie: string): Promise<KuaishouCollectionResponse> => {
  const url = 'https://cp.kuaishou.com/rest/cp/works/v2/collection/brief/list?__NS_sig3=';

  const headers = {
    cookie: cookie,
    Referer: 'https://cp.kuaishou.com/article/publish/video',
  };

  const postData = { 'kuaishou.web.cp.api_ph': cookie.split('kuaishou.web.cp.api_ph=')[1]?.split(';')[0] };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface KuaishouCollectionResponse {
  /**
   * 状态码 1正常 非1异常
   */
  result: number;
  currentTime: number;
  /**
   * 分类列表
   */
  data?: Array<{
    collectionId: number;
    title: string;
    photoSize: number;
  }>;
  /**
   * 提示消息
   */
  message: string;
}
