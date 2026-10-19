import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';

/**
 * A站视频管理
 * @param cookie
 * @param page 页码
 * @param authorId 用户id
 * @param resourceType 数据类型 默认2（2：视频稿件，3：文章稿件）
 * @param status 0:全部 1：已发布 2：发布中 3：已退回
 */
export const getContentListAsync = async (
  cookie: string,
  page: number,
  authorId: number,
  resourceType: 2 | 3 = 2,
  status: 0 | 1 | 2 | 3 = 0,
): Promise<AzhanContentListResponse> => {
  const url = 'https://member.acfun.cn/list/api/queryContributeList';

  const headers = {
    cookie: cookie,
    referer: 'https://member.acfun.cn/video-history',
    Origin: 'https://member.acfun.cn',
    authority: 'member.acfun.cn',
    'content-type': 'application/x-www-form-urlencoded',
  };
  const postData = {
    pcursor: page,
    resourceType: resourceType,
    sortType: 3,
    authorId: authorId,
    status: status,
  };

  const result = await $http.post<never, AxiosResponse<AzhanContentListResponse>>(url, postData, {
    headers: headers,
  });


  return result.data;
};

export interface AzhanMediaContent {
  /**
   * 作品id
   */
  groupId: string;

  /**
   * 点赞数
   */
  likeCount: number;

  /**
   * 发布时间
   */
  createTime: string;

  /**
   * 标题
   */
  title: string;
  hasHotComment: boolean;
  isLike: boolean;

  /**
   * 分享链接
   */
  shareUrl: string;
  picShareUrl: string;
  isDislike: boolean;
  originalDeclare: number;

  /**
   * 播放数
   */
  viewCount: number;

  /**
   * 评论数
   */
  commentCount: number;

  /**
   * 收藏数
   */
  stowCount: number;

  /**
   * 投蕉数
   */
  bananaCount: number;

  /**
   * 封面
   */
  coverUrl: string;

  /**
   * 发布时间戳
   */
  createTimeMillis: number;

  contributeTime:number;
  /**
   * 弹幕数
   */
  danmakuCount: number;
  commentCountRealValue: number;

  /**
   * 转发数
   */
  shareCount: number;

  /**
   * 喂桃数
   */
  giftPeachCount: number;

  /**
   * 时长（毫秒）
   */
  durationMillis: number;
  description: string;

  /**
   * 状态
   */
  status: number;
  reason:string;
  dougaId: string;
  contentId:number;
  superUbb: boolean;
  isRewardSupportted: boolean;
  isThrowBanana: boolean;
  isFavorite: boolean;

  /**
   * 图文标题
   */
  contentTitle: string;

  /**
   * 图文封面
   */
  videoCover: string;
}

export interface AzhanContentListResponse {
  result: number;
  feed: Array<AzhanMediaContent>;
  pcursor: string;
  totalNum: number;
  requestId: string;
  errMsg: {
    result: number;
    error_msg: string;
  };
  isError: boolean;
}
