import { $http } from '../../http';
import { getNowTimeStamp } from '../../utils/use-date';
import { isJson } from '../../utils';

/**
 * 获取视频分类
 * @param cookie
 * @param wemediaId 用户id
 */
export const getVideoCategoryResponse = async (
  cookie: string,
  wemediaId: string,
): Promise<WangyiVideoCategoryResponse> => {
  const url = 'https://mp.163.com/wemedia/video/categoryV6/getTree.do';

  const headers = {
    cookie: cookie,
    Referer: 'https://mp.163.com/subscribe_v3/index.html',
    'X-B3-Sampled': '1',
    'X-B3-SpanId': '0',
  };

  const params = {
    _: getNowTimeStamp(13),
    wemediaId: wemediaId,
    realUserId: '',
  };
  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data) && response.status != 403;
    },
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface WangyiVideoCategoryResponse {
  /**
   * 状态码
   * 1 正常
   */
  code: number;
  /**
   * 提示消息
   */
  msg: string;
  /**
   * 分类数据列表
   */
  data: Array<WangyiVideoCategory>;
}

export interface WangyiVideoCategory {
  /**
   * 分类名称
   */
  categoryName: string;
  /**
   * 分类等级-一级，二级
   */
  level: number;
  /**
   * 下一级分类列表
   */
  subCategoryList?: Array<WangyiVideoCategory>;
}
