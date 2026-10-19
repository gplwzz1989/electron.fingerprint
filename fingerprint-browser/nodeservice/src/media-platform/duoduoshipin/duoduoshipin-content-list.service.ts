import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';

/**
 * 多多视频视频管理
 * @param cookie
 * @param page 页面
 * @param pageSize 每页数量
 * @param status 数据类型（0：全部，5：已发布，4：待发布，2：审核中，3：未通过），默认全部
 */
export const getContentListAsync = async (
  cookie: string,
  page: number,
  pageSize: number,
  status: 0 | 5 | 4 | 2 | 3 = 0,
  sign?: string,
): Promise<DuoduoshipinContentListResponse> => {
  const url: string = 'https://live.pinduoduo.com/api/backbone/video/query';

  const headers = {
    cookie: cookie,
    referer: 'https://live.pinduoduo.com/n-creator/video/video-manage',
    Origin: 'https://live.pinduoduo.com',
    authority: 'live.pinduoduo.com',
    'Anti-Content': sign,
  };

  const postData = {
    status: status,
    page: page,
    pageSize: pageSize,
  };

  const result = await $http.post<never, AxiosResponse<DuoduoshipinContentListResponse>>(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface DuoduoshipinMediaContent {
  /**
   * 作品id
   */
  feedId: string;
  title: string;

  /**
   * 视频标题
   */
  desc: string;

  /**
   * 视频地址
   */
  mediaUrl: string;
  memo: string;

  /**
   * 封面地址
   */
  coverUrl: string;
  initial: boolean;
  status: number;
  liveStatus: number;

  /**
   * 点赞数
   */
  likes: number;

  /**
   * 播放数
   */
  views: number;

  /**
   * 评论数
   */
  comments: number;

  /**
   * 发布时间
   */
  publishTime: number;

  /**
   * 分享数
   */
  shares: number;
  isHotTag: boolean;

  /**
   * 是否置顶
   */
  isTop: boolean;
  totalFlowerNum: number;
  vv: number;
  linkUrl: string;
}

export interface DuoduoshipinContentListResponse {
  success: boolean;
  errorCode: number;
  errorMsg: string;
  result: {
    feeds: Array<DuoduoshipinMediaContent>;
    total: number;
    maxAllowed: number;
    notDisplayComment: boolean;
    ifHeadAcc: string;
  };
}
