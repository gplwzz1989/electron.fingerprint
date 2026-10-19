import { $http } from '../../http';
import { isJson } from '../../utils';
import { BadRequestException } from '../../error';

/**
 * 企鹅号分类信息
 * @param cookie
 */
export const getCategoryListAsync = async (cookie: string): Promise<QiehaoCategoryResponse> => {
  const url = 'https://om.qq.com/VideoManager/VideoCatagory';

  const headers = {
    cookie: cookie,
    Referer: 'https://om.qq.com/main/creation/video',
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: { relogin: 1 },
  });

  if (result.data.response.code !== 0) {
    throw new BadRequestException(result.data?.response.msg, result.data?.response.code, result.data);
  }

  return result.data;
};

export interface QiehaoCategoryResponse {
  response: {
    code: number;
    msg: string;
  };
  data: Array<{
    cat: string;
    subcats: Array<string>;
  }>;
}

/**
 * 企鹅号分类信息
 * @param cookie
 */
export const getArticleCategoryListResponse = async (cookie: string): Promise<QiehaoArticleCategoryResponse> => {
  const url = 'https://om.qq.com/article/categoryList?relogin=1';

  const headers = {
    cookie: cookie,
    Referer: 'https://om.qq.com/main/creation/article',
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface QiehaoArticleCategoryResponse {
  data: Array<QiehaoArticleCategory>;
  response: {
    code: number;
    msg: string;
  };
}

export interface QiehaoArticleCategory {
  id: string;
  name: string;
  quanpin: string;
}
