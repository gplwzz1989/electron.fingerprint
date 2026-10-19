import { $http } from '@/http';
import { HttpsProxyAgent } from 'https-proxy-agent';

export const publishZhiHuDynamic = async (
  cookie: string,
  postData: string,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<ZhiHuDynamicPublishResponse> => {
  const publishUrl = 'https://www.zhihu.com/api/v4/content/publish';

  const header = {
    cookie: cookie,
    referer: 'https://www.zhihu.com/creator',
    Origin: 'https://www.zhihu.com',
    'Content-Type': 'application/json;charset=UTF-8',
    'x-xsrftoken': cookie.split('_xsrf=')[1]?.split(';')[0]?.trim(),
  };

  const result = await $http.post(publishUrl, postData, {
    headers: header,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });
  return result.data;
};

export interface ZhiHuDynamicPublishResponse {
  code: number;
  message: string;
  toast_message: string;
  data: {
    publish_type: string;
    result: string;
  };
}

export interface ZhiHuDynamicPyvlishDetail {
  id: string;
  type: string;
  state: string;
  url: string;
  view_permission: string;
  source_pin_id: number;
  created: number;
  updated: number;
  is_deleted: false;
  self_create: true;
}
