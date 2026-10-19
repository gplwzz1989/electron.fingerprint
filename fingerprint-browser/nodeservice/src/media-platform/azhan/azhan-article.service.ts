import { $http } from '@/http';
import { HttpsProxyAgent } from 'https-proxy-agent';

export const publishAZhanArticleResponse = async (
  cookie: string,
  postStr: string,
  proxyAgent?: HttpsProxyAgent<string>|object,
): Promise<AZhanArticlePublishResponse> => {
  const url = `https://member.acfun.cn/article/api/postArticle`;

  const headers = {
    Accept: 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br',
    cookie: cookie,
    referer: 'https://member.acfun.cn/post-article',
    Origin: 'https://member.acfun.cn',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const result = await $http.post(url, postStr, { headers: headers, httpsAgent: proxyAgent, httpAgent: proxyAgent });

  return result.data;
};

export interface AZhanArticlePublishResponse {
  /**
   * 0为正常
   */
  result: number;
  error_msg: string;
  articleId: string;
}
