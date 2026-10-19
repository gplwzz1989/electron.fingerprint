import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 企鹅号内容管理
 * @param cookie
 * @param category 数据状态（‘’：全部，‘published_new’：已发布，‘notpass’：未通过，‘draft_new’：草稿，‘schedule’：待发布）
 * @param pageSize 页码
 * @param refreshField 分页时间字符串（当前页最后一条数据中的pub_time）
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @param ftype 数据类型 此参数不传为全部（0: 图文， 1：组图，56：视频，92：视频合辑）
 * @param proxyAgent
 */
export const getContentListAsync = async (
  cookie: string,
  category: '' | 'published_new' | 'notpass' | 'draft_new' | 'schedule' = '',
  pageSize: number,
  refreshField: string,
  startDate?: string,
  endDate?: string,
  ftype?: number,
  proxyAgent?: HttpsProxyAgent<string> | undefined,
): Promise<QiehaoContentListResponse> => {
  let params: {
    category: string;
    search: string;
    source: string;
    startDate?: string;
    endDate?: string;
    num: number;
    ftype?: number;
    readChannel: string;
    dstChannel: string;
    isPartDst: number;
    isQBQA: boolean;
    refreshField: string;
    relogin: number;
  } = {
    category: category,
    search: '',
    source: '',
    num: pageSize,
    readChannel: 'all',
    dstChannel: '',
    isPartDst: 0,
    isQBQA: false,
    refreshField: refreshField,
    relogin: 1,
  };

  if (startDate && endDate) {
    params = { ...params, startDate, endDate };
  }

  if (ftype != undefined) {
    params = { ...params, ftype };
  }

  const result = await $http.get<unknown, AxiosResponse<QiehaoContentListResponse>>(
    'https://om.qq.com/marticle/article/list',
    {
      headers: {
        cookie: cookie,
        referer: 'https://om.qq.com/main/management/articleManage',
        host: 'om.qq.com',
      },
      params: params,
      httpAgent: proxyAgent,
      httpsAgent: proxyAgent,
    },
  );

  return result.data;
};

export interface QiehaoMediaContent {
  /**
   * 作品id
   */
  article_id: string;

  /**
   * 评论数
   */
  commentnum: number;

  /**
   * 封面地址
   */
  imgurl: string;

  /**
   * 发布时间
   */
  pub_time: string;

  /**
   * 阅读数
   */
  read: number;

  /**
   * 状态，3：未通过，1：已发布，0：草稿，
   */
  status: string;

  /**
   * 标题
   */
  title: string;

  /**
   * 作品地址
   */
  url: string;

  /**
   * 发布提起时间
   */
  date: string;

  /**
   * 视频id
   */
  vid?: string;
}

export interface QiehaoContentListResponse {
  response: {
    code: number;
    msg: string;
  };
  data: {
    articles: Array<QiehaoMediaContent>;
    cost: number;
    totalNumber: number;
  };
}
