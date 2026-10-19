import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { GetTimeStamp } from '../../utils';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 网易号内容管理
 * @param cookie
 * @param realUserId 用户信息realUserId
 * @param wemediaId 用户信息wemediaId
 * @param page 页码
 * @param pageSize 每页数量
 * @param contentType 内容类型 默认全部（0：全部，4：图文，2：视频，6：动态）
 * @param contentState 内容状态 默认全部（-1：全部，3：已发布，2：未通过，1：审核中，8：待发布）
 * @param start 开始日期
 * @param end 结束日期
 * @param proxyAgent
 */
export const getContentListAsync = async (
  cookie: string,
  realUserId: string,
  wemediaId: string,
  page: number = 1,
  pageSize: number = 10,
  contentType: 0 | 2 | 4 | 6 = 0,
  contentState: -1 | 1 | 2 | 3 | 8 = -1,
  start?: string,
  end?: string,
  proxyAgent?: HttpsProxyAgent<string>,
): Promise<WangyihaoContentListResponse> => {
  const url = 'https://mp.163.com/wemedia/content/manage/list.do';

  let postData: {
    _: string;
    realUserId: string;
    pageNo: number;
    size: number;
    contentType: 0 | 2 | 4 | 6;
    contentState: -1 | 1 | 2 | 3 | 8;
    wemediaId: string;
    mergeUnPassed: boolean;
    start?: string;
    end?: string;
    filterState: number;
  } = {
    _: GetTimeStamp(13),
    realUserId: realUserId,
    pageNo: page,
    size: pageSize,
    contentType: contentType,
    contentState: contentState,
    wemediaId: wemediaId,
    mergeUnPassed: false,
    filterState: 0,
  };

  if (start && end) {
    postData = { ...postData, start: start, end: end };
  }

  const requestUrl = `${url}?${Object.keys(postData)
    .map((key) => `${key}=${postData[key]}`)
    .join('&')}`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.163.com/subscribe_v3/index.html',
    Origin: 'https://mp.163.com',
    Host: 'mp.163.com',
  };

  const result = await $http.post<never, AxiosResponse<WangyihaoContentListResponse>>(requestUrl, null, {
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface WangyihaoMediaContent {
  /**
   * 内容类型
   */
  contentType: number;

  /**
   * 内容状态
   */
  contentState: number;

  /**
   * 标题
   */
  title: string;

  /**
   * 发布时间
   */
  showTime: string;

  /**
   * 作品id
   */
  articleId: string;

  /**
   * 封面地址
   */
  picUrl: string;

  /**
   * 发布时间（时间戳）
   */
  publishTime: number;

  /**
   * 播放量
   */
  pvCount: number;

  /**
   * 展现量
   */
  recommendCount: number;

  /**
   * 评论数
   */
  commentCount: number;

  /**
   * 分享数
   */
  shareCount: number;

  /**
   * 视频作品id
   */
  skipId: string;
  /**
   * 顶 数量
   */
  praiseCount: number;
}

export interface WangyihaoContentListResponse {
  /**
   * 1:正常
   */
  code: number;
  msg: string;
  data: {
    total: number;
    list: Array<WangyihaoMediaContent>;
  };
}
