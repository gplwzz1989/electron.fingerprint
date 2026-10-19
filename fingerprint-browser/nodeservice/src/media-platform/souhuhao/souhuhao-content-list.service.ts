import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 搜狐号内容管理
 * @param cookie
 * @param page 页码
 * @param pageSize 每页数量
 * @param accountId 账号id
 * @param newsType 数据类型 默认全部（0：全部，1：图文，3：图集，4：视频）
 * @param statusType 数据状态 默认全部（1：全部，2：已发布，4：审核中，7：未通过，6：草稿，5：定时发布）
 */
export const getContentListAsync = async (
  cookie: string,
  page: number,
  pageSize: number,
  accountId: number,
  newsType: 0 | 1 | 3 | 4 = 0,
  statusType: 1 | 2 | 4 | 5 | 6 | 7 = 1,
): Promise<SouhuhaoContentListResponse> => {
  const mpcv = cookie.split('mp-cv=')[1]?.split(';')[0];

  const result = await $http.get<unknown, AxiosResponse<SouhuhaoContentListResponse>>(
    'https://mp.sohu.com/mpbp/bp/news/v4/users/news',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.sohu.com/mpfe/v4/contentManagement/first/page',
        host: 'mp.sohu.com',
        'sp-cm': mpcv,
      },
      params: {
        pno: page,
        psize: pageSize,
        newsType: newsType,
        statusType: statusType,
        accountId: accountId,
      },
    },
  );

  // 请求失败
  if (result.data.code !== 2000000) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface SouhuhaoMediaContent {
  /**
   * 阅读量
   */
  pv: number;

  /**
   * 评论数
   */
  cmt: number;

  /**
   * 标题
   */
  title: string;

  /**
   * 数据类型
   */
  type: number;

  /**
   * 封面
   */
  cover: string;

  /**
   * 发布时间
   */
  postTime: number;

  /**
   * 作品id
   */
  id: number;

  /**
   * 是否原创
   */
  original: boolean;

  /**
   * 状态
   */
  status: number;

  /**
   * 用户id
   */
  userId: number;
}

export interface SouhuhaoContentListResponse {
  data: {
    news: Array<SouhuhaoMediaContent>;
    videos: Array<SouhuhaoMediaContent>;
    totalCount: number;
  };
  code: number;
  msg: string;
  success: boolean;
}

/**
 *
 * @param cookie
 * @param startDateStr
 * @param endDateStr
 * @param page
 * @param accountId
 * @param newsType 0:全部 1：图文 2：视频
 * @param proxyAgent
 */
export const getContentSingleListAsync = async (
  cookie: string,
  accountId: number,
  startDateStr: string,
  endDateStr: string,
  page: number = 1,
  newsType: 0 | 1 | 2 = 0,
  proxyAgent?: HttpsProxyAgent<string>,
): Promise<SouhuhaoSingleContentListResponse> => {
  const mpcv = cookie.split('mp-cv=')[1]?.split(';')[0];
  const url = 'https://mp.sohu.com/mpbp/bp/news/v4/users/stat/single/list';
  const result = await $http.get(url, {
    headers: {
      cookie: cookie,
      referer: 'https://mp.sohu.com/mpfe/v4/contentManagement/first/page',
      'sp-cm': mpcv,
    },
    params: {
      page: page,
      type: newsType,
      startDate: startDateStr,
      endDate: endDateStr,
      accountId: accountId,
    },
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface SouhuhaoSingleContentListResponse {
  data: {
    news: Array<{
      date: string; //'2025-05-14';
      title: string;
      cover: string; //'//q9.itc.cn/images01/20250514/db7df7768c414485a2dc7eec9a799fff.jpeg';
      type: number;
      pv: number;
      pvValid: number;
      interactionCount: number;
      likeCount: number;
      commentCount: number;
      shareCount: number;
      voteCount: number;
    }>;
    totalCount: number;
  };
  code: number; //2000000;
  msg: '';
  success: true;
}
