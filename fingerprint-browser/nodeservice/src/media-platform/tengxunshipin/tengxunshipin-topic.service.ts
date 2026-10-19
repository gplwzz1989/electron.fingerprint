import { $http } from '@/http';

export const getTengXunShiPinTopicResponse = async (
  cookie: string,
  keyWord: string,
  vstk: number,
  vsak: number,
): Promise<TengXunShiPinTopicsResponse> => {
  const url = 'https://access.v.qq.com/trpc.creator_center.backend.VideoTagsWeb/ListTags';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.v.qq.com/',
    Origin: 'https://mp.v.qq.com/',
  };

  const params = {
    g_vstk: vstk,
    g_actk: vsak,
    refer: 'vcc_web',
    origin: 1,
  };
  const postData = { video_tag_type: 13, query: keyWord, page_context: {}, refer: 'vcc_web' };

  const result = await $http.post(url, postData, { headers: headers, params: params });

  return result.data;
};

export interface TengXunShiPinTopicInfo {
  image: string;
  title: string;
  sub_title: string[];
  id: string;
  web_detail_url: string;
  extra: { is_reward: boolean };
}

export interface TengXunShiPinTopicsResponse {
  code: number;
  msg: string;
  data: {
    items: TengXunShiPinTopicInfo[];
    hasNextPage: boolean;
    page_context: Record<string, any>;
    extra: Record<string, any>;
  };
}
