import { $http } from '../../http';
import { Guid, isJson } from '../../utils';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { getSign, regex } from './kuaishou-base.service';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 快手视频数据
 * @param cookie
 * @param cursor 第一页可设置结束时间，下一页为前一页返回的对应数据
 * @param startTime 开始时间（13位时间戳）
 * @param endTime 结束时间（13位时间戳，可固定传9007199254740991）
 * @param limit 每页数量（平台默认30）
 * @param queryType 数据类型（0：全部，1：已发布，2：待发布，3：未通过）
 */
export const getContentListAsync = async (
  cookie: string,
  cursor: string,
  startTime: number,
  endTime: number,
  limit: number,
  queryType: '0' | '1' | '2' | '3' = '0',
): Promise<KuaishouContentListResponse> => {
  const url = 'https://cp.kuaishou.com/rest/cp/works/v2/video/pc/photo/list';

  const match = cookie.match(regex);
  const webapiId = match ? match[1] : Guid.NewGuid().replace(/-/g, '');

  const headers = {
    cookie: cookie,
    referer: 'https://cp.kuaishou.com/article/manage/video',
    Origin: 'https://cp.kuaishou.com',
    Host: 'cp.kuaishou.com',
    'Content-Type': 'application/json;charset=UTF-8',
  };
  const postData = {
    queryType: queryType,
    cursor: cursor,
    startTime: startTime,
    endTime: endTime,
    limit: limit,
    'kuaishou.web.cp.api_ph': webapiId,
  };

  const params = { __NS_sig3: await getSign(JSON.stringify(postData)) };

  const result = await $http.post<never, AxiosResponse<KuaishouContentListResponse>>(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    params: params,
  });

  if (result.data.result !== 1) {
    throw new BadRequestException(result.data?.message, result.data?.result, result.data);
  }

  return result.data;
};

export interface KuaishouContentListResponse {
  currentTime: number;
  data?: KuaishouContentData;
  message: string;
  result: number;
  error_id?: string;
}

export interface KuaishouContentData {
  list: Array<KuaishouMediaContent>;
  nextCursor: string;
  total: number;
}

export interface KuaishouMediaContent {
  awdId: number;
  collectionId: number;
  collectionTitle: string;

  /**
   * 评论数
   */
  commentCount: number;
  durationSecond: number;
  judgementStatus: number;
  judgementTitle: string;

  /**
   * 点赞数
   */
  likeCount: number;

  /**
   * 是否是私密 0 正常 1 私密 3 仅好友可见
   */
  photoStatus: number;

  /**
   * 是否置顶
   */
  photoTop: boolean;

  /**
   * 播放数
   */
  playCount: number;

  /**
   * 封面
   */
  publishCoverUrl: string;
  publishId: number;
  publishStatus: number;
  publishType: number;

  /**
   * 作品标题
   */
  title: string;

  /**
   * 发布时间
   */
  uploadTime: number;

  /**
   * 作品id
   */
  workId: string;

  /**
   * 定时发布时间
   */
  publishTime?: number;
  /**
   * 审核完成前的封面key
   */
  unPublishCoverKey: string;
}

/**
 *
 * @param cookie
 * @param pageNum
 * @param type 0:公开 6:隐私  11:违规  12:平台助推
 * @param proxyAgent
 */
export const getKuaishouContentDetailList = async (
  cookie: string,
  pageNum: number = 0,
  type: number = 0,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<KuaishouContentDetailListResponse> => {
  const url = 'https://cp.kuaishou.com/rest/cp/creator/analysis/pc/photo/list';

  const match = cookie.match(regex);
  const webapiId = match ? match[1] : Guid.NewGuid().replace(/-/g, '');

  const headers = {
    cookie: cookie,
    referer: 'https://cp.kuaishou.com/article/manage/video',
    Origin: 'https://cp.kuaishou.com',
    Host: 'cp.kuaishou.com',
    'Content-Type': 'application/json;charset=UTF-8',
  };
  const postData = {
    orderType: 2,
    sortType: 1,
    type: type,
    count: 10,
    page: pageNum,
    'kuaishou.web.cp.api_ph': webapiId,
  };

  //const params = { __NS_sig3: await getSign(JSON.stringify(postData)) };

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    //params: params,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface KuaishouContentDetailListResponse {
  /**
   * 1:正常
   */
  result: number;

  data: {
    /**
     * 作品列表
     */
    photoList: {
      photoItems: Array<{
        title: string;
        cover: string;
        photoId: string;
        playUrl: string;
        duration: number;
        publishTime: number;
        playCount: number;
        likeCount: number;
        commentCount: number;
        collectCount: number;
        followCount: number;
        /**
         * 完播率
         */
        fpr: number;
        /**
         * 是否是视频
         */
        video: boolean;
        photoStatusTags: [];
      }>;
      totalCount: number;
    };
  };
  message: string;
}
