import { $http } from '@/http';

export const getIqiYiVideoCategoryResponse = async (cookie: string): Promise<ClassifyResponse> => {
  const url = 'https://mp-api.iqiyi.com/video/api/1.0/channel/classify-list?type=RUGC';

  const headers = {
    cookie: cookie,
    referer: 'https://mp-api.iqiyi.com/',
    Origin: 'https://mp.iqiyi.com',
  };

  const result = await $http.get(url, {
    headers: headers,
  });

  return result?.data;
};

export interface AiqiyiCategoryInfo {
  channelId: number;
  /**
   * 分类id
   */
  classifyId: string;
  /**
   * 分类名称
   */
  classifyName: string;
  /**
   * 分类名称
   */
  showName: string;
  twClassifyName: string;
  twShowName: string;
}

export interface ClassifyResponse {
  httpStatus: number;

  code: number;

  msg: string;

  data: {
    classifyDataList: AiqiyiCategoryInfo[];

    type: string;
  };
}
