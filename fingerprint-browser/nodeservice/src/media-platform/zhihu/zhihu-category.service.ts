import { $http } from '../../http';

export const getCategoryListAsync = async (cookie: string): Promise<ZhiHuCategoryListResponse> => {
  const url = 'https://api.zhihu.com/tagore/categories';

  const result = await $http.get(url, {
    headers: {
      cookie: cookie,
      referer: 'https://www.zhihu.com/zvideo/upload-video',
    },
  });

  return result.data;
};

export interface ZhiHuCategoryListResponse {
  data: Array<ZhihuCategoryInfo>;
}

/**
 * 知乎分类
 */
export class ZhihuCategoryInfo {
  /**
   * 分类id
   */
  id: number = 0;
  /**
   * 分类名称
   */
  name: string = '';
}
