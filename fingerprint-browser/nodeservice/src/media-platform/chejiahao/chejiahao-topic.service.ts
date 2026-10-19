import { $http } from '@/http';

export const getCheJiaHaoTopicResponse = async (cookie: string, keyWord?: string): Promise<ChejiahaoTopicResponse> => {
  const url = `https://club-open-api.autohome.com.cn/subject/fuzzyQuery?_appid=club&categoryName=${encodeURIComponent(
    keyWord ?? '',
  )}`;

  const headers = {
    cookie: cookie,
    referer: 'https://creator.autohome.com.cn/web/home',
  };

  const result = await $http.get(url, { headers: headers });

  return result.data;
};

export interface ChejiahaoTopicResponse {
  returncode: number;
  message: string;
  result: {
    total: number;
    items: Array<CheJiaHaoTopicInfo>;
    took: number;
  };
}

export interface CheJiaHaoTopicInfo {
  categoryId: number;
  categoryName: string;
  categoryImg: string;
  description: string;
  viewCount: null;
  keyword: string;
}
