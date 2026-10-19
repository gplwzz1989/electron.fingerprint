import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';

/**
 * 秒拍视频管理
 * @param cookie
 * @param page 页码
 * @param count 每页数量
 */
export const getContentListAsync = async (
  cookie: string,
  page: number,
  count: number,
): Promise<MiaopaiContentListResponse> => {
  const url = 'https://creator.miaopai.com/video/getList';

  const headers = {
    cookie: cookie,
    referer: 'https://creator.miaopai.com/video',
    Origin: 'https://creator.miaopai.com',
    authority: 'creator.miaopai.com',
    'content-type': 'application/x-www-form-urlencoded',
    'x-requested-with': 'XMLHttpRequest',
  };
  const postData = {
    page: page,
    count: count,
  };

  const result = await $http.post<never, AxiosResponse<MiaopaiContentListResponse>>(url, postData, {
    headers: headers,
  });

  if (result.data.code !== 200) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface MiaopaiMediaContent {
  /**
   * 作品id
   */
  scid: string;

  /**
   * 视频地址
   */
  video_url: string;

  /**
   * 标题
   */
  title: string;
  desc: string;

  /**
   * 封面
   */
  cover: string;

  /**
   * 发布时间
   */
  createtime: string;

  /**
   * 是否原创
   */
  is_original: number;
}

export interface MiaopaiContentListResponse {
  code: number;
  msg: string;
  data: {
    list: Array<MiaopaiMediaContent>;
    total: number;
    page: string;
    count: string;
  };
}
