import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { getCsdnSign } from '../csdn/csdn-base.service';
import { Guid } from '../../utils';

/**
 * csdn内容列表
 * @param cookie
 * @param page 页码
 * @param pageSize 每页数量
 */
export const getContentListAsync = async (
  cookie: string,
  page: number,
  pageSize: number=20,
  status:string='all_v3'
): Promise<CsdnContentListResponse> => {
  const xNonce = Guid.NewGuid();
  const signature = await getCsdnSign(
    'GET',
    'https://bizapi.csdn.net/blog/phoenix/console/v1/article/list',
    'application/json, text/plain, */*',
    '',
    '',
    { status: status, page: page, pageSize: pageSize },
    {
      'X-Ca-Key': '203803574',
      'X-Ca-Nonce': xNonce,
      common: { Accept: 'application/json, text/plain, */*' },
      delete: {},
      get: {},
      head: {},
      post: { 'Content-Type': 'application/json;charset=UTF-8' },
      put: { 'Content-Type': 'application/x-www-form-urlencoded' },
      patch: { 'Content-Type': 'application/x-www-form-urlencoded' },
    },
  );

  const result = await $http.get<unknown, AxiosResponse<CsdnContentListResponse>>(
    'https://bizapi.csdn.net/blog/phoenix/console/v1/article/list',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.csdn.net/mp_blog/manage/article',
        origin: 'https://mp.csdn.net',
        Accept: 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Content-Type': null,
        'X-Ca-Key': '203803574',
        'X-Ca-Nonce': xNonce,
        'X-Ca-Signature': signature,
        'X-Ca-Signature-Headers': 'x-ca-key,x-ca-nonce',
      },
      params: {
        status: status,
        page: page,
        pageSize: pageSize,
      },
    },
  );


  return result.data;
};

export interface CsdnMediaContent {
  /**
   * 作品id
   */
  articleId: string;

  /**
   * 作品标题
   */
  title: string;

  /**
   * 发布时间
   */
  postTime: string;

  /**
   * 阅读量
   */
  viewCount: string;

  /**
   * 评论量
   */
  commentCount: string;
  commentAuth: string;

  /**
   * 是否置顶
   */
  isTop: string;
  status: string;
  username: string;
  type: string;
  isNeedFans: string;
  isNeedVip: string;
  isVipArticle: boolean;
  editorType: number;
  isRecommend: boolean;
  totalExposures: number;

  /**
   * 粉丝数
   */
  fansCount: number;

  /**
   * 点赞数
   */
  diggCount: number;

  /**
   * 收藏数
   */
  collectCount: number;

  /**
   * 封面信息
   */
  coverImage: Array<string>;
  voteId: number;
  isLock: boolean;
  deprecated: boolean;
  isShowFeedback: boolean;
  complaintArticleId: number;
  scheduledTime: number;
  downloadShareDataUrl: string;
  qualityScore: number;
  qualitySpecification: string;
}

export interface CsdnContentListResponse {
  code: number;
  message: string;
  traceId: string;
  data: {
    count: {
      all: number;
      private: number;
      deleted: number;
      original: number;
      enable: number;
      audit: number;
      draft: number;
    };
    list: Array<CsdnMediaContent>;
    /**
     * 当前页码
     */
    page: number;

    /**
     * 每页数量
     */
    size: number;
    listStatus: string;

    /**
     * 总数量
     */
    total: number;
  };
}
