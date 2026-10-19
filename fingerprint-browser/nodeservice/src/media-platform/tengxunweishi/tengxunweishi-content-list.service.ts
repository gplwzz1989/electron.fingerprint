import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 腾讯微视视频数据
 * @param cookie
 * @param personId 授权信息接口返回的personId
 * @param attachInfo 首页传空字符串，下一页传上一页返回的attachInfo
 * @param proxyAgent
 */
export const getContentListAsync = async (
  cookie: string,
  personId: string,
  attachInfo: string,
  proxyAgent?: HttpsProxyAgent<string>,
): Promise<TengxunweishiContentListResponse> => {
  const result = await $http.get<unknown, AxiosResponse<TengxunweishiContentListResponse>>(
    'https://media.weishi.qq.com/media-api/getVideoList',
    {
      headers: {
        cookie: cookie,
        referer: 'https://media.weishi.qq.com/media/video-manage',
        host: 'media.weishi.qq.com',
      },
      params: {
        data: JSON.stringify({ personId: personId, attachInfo: attachInfo }),
      },
      httpAgent: proxyAgent,
      httpsAgent: proxyAgent,
    },
  );

  // 请求失败
  if (result.data.code !== 0) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface TengxunweishiMediaContent {
  /**
   * 作品id
   */
  feedId: string;
  wording: string;

  /**
   * 视频信息
   */
  video: {
    fileId: string;
    fileSize: string;
    sha1: string;
    duration: string;
    width: number;
    height: number;
    md5: string;
    orientation: number;
    isH265Hvc1: number;
  };

  /**
   * 封面信息
   */
  imgList: Array<{
    url: string;
    width: number;
    height: number;
  }>;

  /**
   * 浏览数
   */
  playNum: number;

  /**
   * 评论数
   */
  commentNum: number;

  /**
   * 点赞数
   */
  likeNum: number;

  /**
   * 是否已发布
   */
  isPublish: number;

  /**
   * 发布时间
   */
  publishTime: string;

  /**
   * 是否设置仅自己可见
   */
  isLocked: number;
  isSyncToOm: number;

  /**
   * 标题
   */
  desc: string;
  isLegal: number;
  isRecommed: boolean;
  collectionID: string;
  isPrePub: boolean;
}

export interface TengxunweishiContentListResponse {
  code: number;
  msg: string;
  feedDetailList: Array<TengxunweishiMediaContent>;
  isFinished: number;
  attachInfo: string;
  total: number;
}
