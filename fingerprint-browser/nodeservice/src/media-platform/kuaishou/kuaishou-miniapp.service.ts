import { regex } from '@/media-platform/kuaishou/kuaishou-base.service';
import { Guid, isJson } from '@/utils';
import { $http } from '@/http';

export const getMiniAppResponse = async (cookie: string, keyWord: string): Promise<KuaishouMiniappResponse> => {
  const url = 'https://cp.kuaishou.com/rest/cp/works/v2/video/pc/relation/list?__NS_sig3=';

  const headers = {
    cookie: cookie,
    Referer: 'https://cp.kuaishou.com/article/publish/video',
  };

  const match = regex.exec(cookie);
  const webapiId = match ? match[1] : Guid.NewGuid().toString().replace(/-/g, '');
  const postData = { type: 9, cursor: '', 'kuaishou.web.cp.api_ph': webapiId, title: keyWord ?? '' };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface KuaishouMiniappResponse {
  result: number;
  data: {
    list: [KuaiShouMiniAppInfo];
    cursor: number;
  };
  message: string;
}

export interface KuaiShouMiniAppInfo {
  title: string;
  url: string;
  associateTaskId: { bindId: string };
  bannerTask: string;
  desc: string;
  validMessage: string;
}
