import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { getTimeStamp } from '../shipinhao/shipinhao-base.service';
import { BadRequestException } from '../../error';
import { SouhuhaoVideoCategoryItem } from '@/media-platform';

/**
 * 搜狐视频一级分类
 * @param cookie
 * @param accountId 账号id
 */
export const getSouhuVideoCategoryAsync = async (
  cookie: string,
  accountId: number,
): Promise<Array<SouhuhaoVideoCategoryResponse>> => {
  const mpcv = cookie.split('mp-cv=')[1]?.split(';')[0];
  const url = 'https://mp.sohu.com/mpbp/bp/account/common/channels-data-api';
  const result = await $http.get<unknown, AxiosResponse<Array<SouhuhaoVideoCategoryResponse>>>(url, {
    headers: {
      cookie: cookie,
      referer: 'https://mp.sohu.com/mpfe/v4/contentManagement/news/addvideo',
      host: 'mp.sohu.com',
      'X-Requested-With': 'XMLHttpRequest',
      'sp-cm': mpcv,
    },
    params: {
      status: 1,
      accountId: accountId,
      _: getTimeStamp(13),
    },
  });

  return result.data;
};

export interface SouhuhaoVideoCategoryResponse {
  /**
   * 分类id
   */
  id: number;

  /**
   * 分类名称
   */
  name: string;
  cmsChannelId: number;
  cmsPName: string;
  createTime: number;
  status: number;
  level: number;
}

/**
 * 搜狐号视频二级分类
 * @param cookie
 * @param accountId 账号id
 */
export const getSouhuhaoSubVideoCategoryAsync = async (
  cookie: string,
  accountId: number,
): Promise<SouhuhaoSubVideoCategoryResponse> => {
  const url = 'https://mp.sohu.com/mpbp/bp/news/v4/videoChannels';
  const mpcv = cookie.split('mp-cv=')[1]?.split(';')[0];
  const result = await $http.get<unknown, AxiosResponse<SouhuhaoSubVideoCategoryResponse>>(url, {
    headers: {
      cookie: cookie,
      referer: 'https://mp.sohu.com/mpfe/v4/contentManagement/news/addvideo',
      host: 'mp.sohu.com',
      'X-Requested-With': 'XMLHttpRequest',
      'sp-cm': mpcv,
    },
    params: {
      accountId: accountId,
      _: getTimeStamp(13),
    },
  });

  // 请求失败
  if (result.data.code !== 2000000) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface SouhuhaoSubVideoCategoryResponse {
  data: Array<SouhuhaoVideoCategoryItem>;
  code: number;
  msg: string;
  success: boolean;
}
