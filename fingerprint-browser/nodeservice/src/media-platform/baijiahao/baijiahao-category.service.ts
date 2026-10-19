import { $http } from '../../http';
import { AxiosResponse } from 'axios';

/**
 * 获取百家号分类列表
 * @param cookie
 * @param mediaType 内容类型（news: 图文， videoV2: 视频）
 */
export const getCategoryListAsync = async (
  cookie: string,
  mediaType: 'news' | 'videoV2',
): Promise<BaijiahaoCategoryListResponse> => {
  const result = await $http.get<unknown, AxiosResponse<BaijiahaoCategoryListResponse>>(
    'https://baijiahao.baidu.com/pcui/article/cateusercms',
    {
      headers: {
        cookie: cookie,
        referer: `https://baijiahao.baidu.com/builder/rc/edit?type=${mediaType}`,
        host: 'baijiahao.baidu.com',
      },
      params: {},
    },
  );

  return result.data;
};

export interface BaijiahaoCategoryListResponse {
  /**
   * 状态码,0:正常 ，非0异常
   */
  errno: number;
  /**
   *  提示消息
   */
  errmsg: string;
  /**
   * 分类列表
   */
  data: Array<BaijiahaoCategoryInfo>;
}

export interface BaijiahaoCategoryInfo {
  /**
   * 分类名称
   */
  label: string;
  value: string;
  /**
   * 二级/三级分类
   */
  children: Array<BaijiahaoCategoryInfo>;
}
