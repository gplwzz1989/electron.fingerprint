import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';

/**
 * A站数据中心-视频
 * @param cookie
 * @param days 数据范围（1：昨天，7：7天，30：30天） 默认30天数据
 */
export const getDataOverviewAsync = async (
  cookie: string,
  days: 1 | 7 | 30 = 30,
): Promise<AzhanDataOverviewResponse> => {
  const url = 'https://member.acfun.cn/dataCenter/api/overview';

  const headers = {
    cookie: cookie,
    referer: 'https://member.acfun.cn/video-data-center',
    Origin: 'https://member.acfun.cn',
    authority: 'member.acfun.cn',
    'content-type': 'application/x-www-form-urlencoded',
  };
  const postData = {
    days: days,
  };

  const result = await $http.post<never, AxiosResponse<AzhanDataOverviewResponse>>(url, postData, {
    headers: headers,
  });

  if (result.data.result !== 0) {
    throw new BadRequestException(result.data?.errMsg?.message, result.data?.errMsg?.name, result.data);
  }

  return result.data;
};

export interface AzhanDataOverviewDailyDataResponse {
  /**
   * 日期
   */
  date: string;

  /**
   * 视频播放数
   */
  dougaPlayCount: number;

  /**
   * 视频评论数
   */
  dougaCommentCount: number;

  /**
   * 视频弹幕数
   */
  dougaDanmakuCount: number;

  /**
   * 视频收藏数
   */
  dougaStowCount: number;

  /**
   * 视频分享数
   */
  dougaShareCount: number;

  /**
   * 视频投蕉数
   */
  dougaBananaCount: number;

  /**
   * 视频喂桃数
   */
  dougaGiftPeachCount: number;

  /**
   * 视频点赞数
   */
  dougaLiketCount: number;

  /**
   * 文章阅读数
   */
  articleViewCount: number;

  /**
   * 文章评论数
   */
  articleCommentCount: number;

  /**
   * 文章收藏数
   */
  articleStowCount: number;

  /**
   * 文章分享数
   */
  articleShareCount: number;

  /**
   * 文章投蕉数
   */
  articleBananaCount: number;
  userFansCount: number;
}

export interface AzhanDataOverviewResponse {
  result: number;
  beginDate: string;
  overview: {
    dougaPlayCount: number;
    dougaPlayGrowth: number;
    dougaCommentCount: number;
    dougaCommentGrowth: number;
    dougaDanmakuCount: number;
    dougaDanmakuGrowth: number;
    dougaStowCount: number;
    dougaStowGrowth: number;
    dougaShareCount: number;
    dougaShareGrowth: number;
    dougaBananaCount: number;
    dougaBananaGrowth: number;
    dougaGiftPeachCount: number;
    dougaGiftPeachGrowth: number;
    dougaLiketCount: number;
    dougaLikeGrowth: number;
    pureDougaGiftPeachCount: number;
    articleViewCount: number;
    articleViewGrowth: number;
    articleCommentCount: number;
    articleCommentGrowth: number;
    articleStowCount: number;
    articleStowGrowth: number;
    articleShareCount: number;
    articleShareGrowth: number;
    articleBananaCount: number;
    articleBananaGrowth: number;
    userFansCount: number;
    userFansTotal: number;
  };
  dailyData: Array<AzhanDataOverviewDailyDataResponse>;
  endDate: string;
  days: number;
  errMsg: {
    message: string;
    name: string;
  };
  isError: boolean;
}
