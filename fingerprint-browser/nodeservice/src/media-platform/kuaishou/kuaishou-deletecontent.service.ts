import { $http } from '../../http';
import { Guid, isJson } from '../../utils';
import { regex } from './kuaishou-base.service';

/**
 * 删除指定作品
 * @param cookie
 * @param docId 状态查询时返回的docId
 */
export const deleteContentResponse = async (cookie: string, docId: string): Promise<KuaishouDeleteContentResponse> => {
  const match = cookie.match(regex);
  const webapiId = match ? match[1] : Guid.NewGuid().toString().replace(/-/g, '');

  const postData = JSON.stringify({ photoId: docId, 'kuaishou.web.cp.api_ph': webapiId });

  const url = 'https://cp.kuaishou.com/rest/cp/works/v2/video/pc/delete';

  const headers = {
    cookie: cookie,
    Referer: 'https://cp.kuaishou.com/article/manage/video',
    returnSetRootDomainLoginUrl: 'true',
    'Content-Type': 'application/json',
  };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface KuaishouDeleteContentResponse {
  /**
   * 状态码 1正常，非1异常
   */
  result: number;
  /**
   * 提示消息 如'成功'，已经删除的id会提示'用户没有权限'
   */
  message: string;
}
