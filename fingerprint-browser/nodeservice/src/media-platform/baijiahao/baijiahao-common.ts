import { BaseResult } from '../baseResult';
import {
  BaijiahaoContentListResponse,
  BaijiahaoMediaContent,
  getBaiJiaDynamicContentListAsync,
  getContentListAsync,
} from './baijiahao-content-list.service';
import { AxiosError, AxiosResponse } from 'axios';
import { errorCode } from '../errorCode';
import {
  BaijiahaoDataOverviewChartResponse,
  BaijiahaoDataOverviewItemResponse,
  getDataOverviewAsync,
  getSingleDataOverview,
  getSingleDataOverviewStatisticAsync,
} from './baijiahao-data-overview.service';
import {
  BaijiahaoPublicAuthorSearchResponse,
  BaijiahaoUserInfo,
  getBaijiahaoPublicAuthorSearchResponse,
  getBaijiahaoUserInfoAsync,
  getUserHomeDataAsync,
  getUserIncomeAsync,
} from './baijiahao-user.service';
import { auditStatusEnum, formatNumber, formatNumberNo, Task } from '../../utils';
import { $http } from '../../http';
import { BaijiahaoTopicItem, getTopicListAsync } from './baijiahao-topic.service';
import {
  BaijiahaoLocationItem,
  getLocationAsync,
  getLocationCityCodeAsync,
  getLocationListBySearch,
} from './baijiahao-location.service';
import { BaijiahaoActivityInfo, getActivityAsync } from './baijiahao-activity.service';
import { BaijiahaoCategoryInfo, getCategoryListAsync } from './baijiahao-category.service';
import {
  AccountContentListViewOutPut,
  AccountReportDataOutPut,
  syncContentEventName,
  syncContentMaxPage,
} from '../data-service';
import {
  DataColumn,
  ListActivityInfoResponse,
  ListInfoResponse,
  ListItemInfoLevel,
  ListLevelInfoResponse,
  PlatformAuthorInfo,
  PlatformContentItem,
  PlatformContentItemNum,
  PublicAuthorPlatformCode,
  PlatformPublicAuthorInfo,
  PlatformPublicAuthorListOutput,
} from '../baseModel';
import dayjs from 'dayjs';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../webproxy';
import { EventEmitter } from 'events';
import { PubContentEnum } from '@/cloud/model/TypeEnum';
import {
  deleteBaiJiaDynamicContent,
  deleteContent,
  deleteMiniVideoContent,
  withDrawContent,
} from '@/media-platform/baijiahao/baijiahao-content-delete.service';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 百家号内容管理
 * @param cookie
 * @param currentPage 页码
 * @param pageSize 每页数量
 * @param type 数据类型 默认全部 （'':全部，‘news’:图文，‘video’:视频，'ugc_video':小视频，'moment':动态，'live':直播，'video_set,live_set':合集,'gallery':图集）
 * @param collection 数据状态 默认已发布 （‘’：全部，‘publish’：已发布，‘pre_publish’：待发布，‘rejected’：未通过，‘withdraw’：已撤回，‘draft’）
 */
export const getBaijiahaoContentList = async (
  cookie: string,
  currentPage: number = 1,
  pageSize: number = 10,
  type: '' | 'news' | 'video' | 'ugc_video' | 'moment' | 'live' | 'video_set,live_set' | 'gallery' = '',
  collection: '' | 'publish' | 'pre_publish' | 'rejected' | 'withdraw' | 'draft' = 'publish',
) => {
  const result: BaijiahaoContentListOutput = {
    code: 0,
    msg: '',
  };

  try {
    const contentListResult = await getContentListAsync(cookie, currentPage, pageSize, type, collection);

    result.code = contentListResult.errno;
    result.data = contentListResult.data;
    result.raw = contentListResult;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface BaijiahaoContentListOutput extends BaseResult {
  data?: {
    list: Array<BaijiahaoMediaContent>;
    message_num: number;
    ability: {
      dynamic_tab_show: number;
      can_show_training_user_info: boolean;
      can_use_se_keyword: number;
    };
    page: {
      /**
       * 当前页码
       */
      currentPage: number;

      /**
       * 每页数量
       */
      pageSize: number;

      /**
       * 总数量
       */
      totalCount: number;

      /**
       * 总页码数
       */
      totalPage: number;
    };
  };
  raw?: unknown;
}

/**
 * 百家号内容分析
 * @param cookie
 * @param start_day 开始日期 Date类型
 * @param end_day 结束日期 Date类型
 * @param proxy
 */
export const getBaijiahaoDataOverview = async (
  cookie: string,
  start_day: Date,
  end_day: Date,
  proxy?: KuaiDaiLiProxy,
) => {
  const result: BaijiahaoDataOverviewOutput = {
    code: 0,
    msg: '',
  };

  try {
    let proxyAgent;
    if (proxy?.serverAdd) {
      proxyAgent = createKuaiProxyAgent(proxy);
    }
    let start_date_str = start_day.toISOString();
    if (start_date_str.length > 0) {
      start_date_str = start_date_str.slice(0, 10);
      start_date_str = start_date_str.replaceAll('-', '');
    }

    let end_date_str = end_day.toISOString();
    if (end_date_str.length > 0) {
      end_date_str = end_date_str.slice(0, 10);
      end_date_str = end_date_str.replaceAll('-', '');
    }

    const dataOverviewResult = await getDataOverviewAsync(cookie, start_date_str, end_date_str, proxyAgent);

    result.code = dataOverviewResult.errno;
    result.data = dataOverviewResult.data;
    result.raw = dataOverviewResult;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface BaijiahaoDataOverviewOutput extends BaseResult {
  data?: {
    list: Array<BaijiahaoDataOverviewItemResponse>;
    chart: Array<BaijiahaoDataOverviewChartResponse>;
  };

  raw?: unknown;
}

/**
 * 百家号账号首页数据
 * @param cookie
 */
export const getBaijiahaoUserHomeData = async (cookie: string) => {
  const result: BaijiahaoUserHomeDataOutput = {
    code: 0,
    msg: '',
  };

  try {
    const userHomeDataResult = await getUserHomeDataAsync(cookie);

    result.code = userHomeDataResult.errno;
    result.data = userHomeDataResult.data;
    result.raw = userHomeDataResult;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface BaijiahaoUserHomeDataOutput extends BaseResult {
  data?: {
    coreData: {
      /**
       * 昨日收益
       */
      yesterdayIncome: string;

      /**
       * 累计阅读量
       */
      viewCount: number;

      /**
       * 粉丝总数
       */
      fansCount: string;

      /**
       * 本月多元收入
       */
      monthIncome: number;
    };
  };

  raw?: unknown;
}

/**
 * 百家号收益数据
 * @param cookie
 */
export const getBaijiahaoUserIncome = async (cookie: string) => {
  const result: BaijiahaoUserIncomeOutput = {
    code: 0,
    msg: '',
  };

  try {
    const userIncomeDataResult = await getUserIncomeAsync(cookie);

    result.code = userIncomeDataResult.errno;
    result.data = userIncomeDataResult.data;
    result.raw = userIncomeDataResult;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface BaijiahaoUserIncomeOutput extends BaseResult {
  data?: {
    /**
     * 累计收益
     */
    total_income: string;

    /**
     * 昨日收益
     */
    yesterday_income: string;
  };

  raw?: unknown;
}

/**
 * 百家号单篇统计数据
 * @param cookie
 * @param nid 作品id
 * @param type 作品类型 (news：图文，video：视频，small_video：小视频)
 */
export const getBaijiahaoSingleDataOverviewStatistic = async (
  cookie: string,
  nid: string,
  type: 'news' | 'video' | 'small_video',
): Promise<BaijiahaoSingleDataOverviewStatisticOutput> => {
  const result: BaijiahaoSingleDataOverviewStatisticOutput = {
    code: 0,
    msg: '',
  };

  try {
    const singleDataOverviewStatisticResult = await getSingleDataOverviewStatisticAsync(cookie, nid, type);

    result.code = singleDataOverviewStatisticResult.errno;
    result.data = singleDataOverviewStatisticResult.data;
    result.raw = singleDataOverviewStatisticResult;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface BaijiahaoSingleDataOverviewStatisticOutput extends BaseResult {
  data?: {
    /**
     * 搜索推荐量
     */
    disp_pv: string;

    /**
     * 粉丝变化
     */
    fans_increase: string;

    /**
     * 收益
     */
    income_count: string;

    reward_count: string;

    /**
     * 播放完成率
     */
    complete_rate: number;

    /**
     * 3秒快滑率
     */
    view_3s_dis: number;

    /**
     * 平均播放时长
     */
    avg_view_duration: string;
    /**
     * 作品id
     */
    nid: string;
    app_id: string;

    /**
     * 播放量
     */
    view_count: number;

    /**
     * 点赞量
     */
    likes_count: number;

    /**
     * 评论数
     */
    comment_count: number;

    /**
     * 分享量
     */
    share_count: number;

    /**
     * 作品标题
     */
    title: string;

    /**
     * 展现量
     */
    rec_count: number;

    /**
     * 收藏量
     */
    collect_count: number;
    mount_mapp: number;
  };

  raw?: unknown;
}

/**
 * 百家号单篇报表数据
 * @param cookie
 * @param nid 作品id
 * @param start_day 开始日期 Date
 * @param end_day 结束日期 Date
 * @param type 作品类型 (news：图文，video：视频，small_video：小视频)
 */
export const getBaijiahaoSingleDataOverview = async (
  cookie: string,
  nid: string,
  start_day: Date,
  end_day: Date,
  type: 'news' | 'video' | 'small_video',
): Promise<BaijiahaoSingleDataOverviewOutput> => {
  const result: BaijiahaoSingleDataOverviewOutput = {
    code: 0,
    msg: '',
  };

  try {
    let start_date_str = start_day.toISOString();
    if (start_date_str.length > 0) {
      start_date_str = start_date_str.slice(0, 10);
      start_date_str = start_date_str.replaceAll('-', '');
    }

    let end_date_str = end_day.toISOString();
    if (end_date_str.length > 0) {
      end_date_str = end_date_str.slice(0, 10);
      end_date_str = end_date_str.replaceAll('-', '');
    }

    const singleDataOverviewResult = await getSingleDataOverview(cookie, nid, start_date_str, end_date_str, type);

    result.code = singleDataOverviewResult.errno;
    result.data = singleDataOverviewResult.data;
    result.raw = singleDataOverviewResult;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface BaijiahaoSingleDataOverviewOutput extends BaseResult {
  data?: {
    list: Array<{
      /**
       * 推荐量
       */
      recommend_count: number;

      /**
       * 播放量（阅读量）
       */
      view_count: number;

      /**
       * 点赞量
       */
      likes_count: number;

      /**
       * 评论量
       */
      comment_count: number;

      /**
       * 收藏量
       */
      collect_count: number;

      /**
       * 分享量
       */
      share_count: number;

      /**
       * 搜索展现量
       */
      disp_pv: number;

      /**
       * 涨粉数
       */
      fans_increase: number;
      fans_view_count: number;
      fans_likes_count: number;
      fans_comment_count: number;
      fans_share_count: number;

      /**
       * 日期
       */
      event_day: string;
    }>;
  };

  raw?: unknown;
}

/**
 * 查询图文作品的审核状态
 * @param cookie
 * @param publishId 发布产生的唯一publishId
 * @param maxPage 最大翻页数，超出后不再继续查询，默认10页
 */
export const getBaijiahaoArticleStatus = async (
  cookie: string,
  publishId: string,
  maxPage: number = 10,
): Promise<BaijiahaoArticleStatusOutput> => {
  const result: BaijiahaoArticleStatusOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };

  try {
    if (!maxPage) {
      maxPage = 1;
    }
    let contentList: BaijiahaoContentListResponse | undefined = undefined;
    for (let i = 0; i <= maxPage; i++) {
      //根据页码获取视频列表
      contentList = await getContentListAsync(cookie, i, 10, 'news');

      if (contentList?.data?.list?.length) {
        for (const content of contentList.data.list) {
          const findId = content?.article_id?.toString();

          if (findId === publishId) {
            result.docId = findId;
            result.create_time = new Date(content.publish_at).getTime() / 1000;
            result.data = content;
            const mediaStatus = content?.status;
            switch (mediaStatus) {
              case 'publish':
                result.auditStatus = auditStatusEnum.published;
                break;
              case 'rejected':
                result.auditStatus = auditStatusEnum.deny;
                break;
              case 'draft':
                result.auditStatus = auditStatusEnum.draft;
                break;
              case 'withdraw':
                result.auditStatus = auditStatusEnum.customWithdrawn;
                break;
              case 'audit':
                result.auditStatus = auditStatusEnum.inAudit;
                break;
              case 'pre_publish':
                result.auditStatus = auditStatusEnum.prePublish;
                break;
              default:
                result.auditStatus = auditStatusEnum.inAudit;
                break;
            }
            if (result.auditStatus == auditStatusEnum.published) {
              result.openUrl = content.share_url;
            }
            return result;
          }
        }
      } else {
        result.code = contentList?.errno ?? -1;
        result.msg = '未找到作品';
        return result;
      }
    }
    result.code = contentList?.errno ?? -1;
    result.msg = '未找到作品';
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface BaijiahaoArticleStatusOutput extends BaseResult {
  /**
   * 发布产生的id
   */
  publishId: string;

  /**
   * 作品唯一id
   */
  docId?: string;
  /**
   * 审核状态
   */
  auditStatus?: auditStatusEnum;
  /**
   * 作品创建时间,10位时间戳
   */
  create_time?: number;

  /**
   * 审核成功后公开访问的url地址
   */
  openUrl?: string;
  /**
   * 封面url
   */
  coverUrl?: string;
  /**
   * 视频信息
   */
  data?: BaijiahaoMediaContent;
}

/**
 * 查询横版视频作品的审核状态
 * @param cookie
 * @param publishId 发布产生的唯一publishId
 * @param maxPage 最大翻页数，超出后不再继续查询，默认10页
 */
export const getBaijiahaoVideoStatus = async (
  cookie: string,
  publishId: string,
  maxPage: number = 10,
): Promise<BaijiahaoVideoStatusOutput> => {
  const result: BaijiahaoVideoStatusOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };

  try {
    if (!maxPage) {
      maxPage = 1;
    }
    let contentList: BaijiahaoContentListResponse | undefined = undefined;
    for (let i = 0; i <= maxPage; i++) {
      //根据页码获取视频列表
      contentList = await getContentListAsync(cookie, i, 10, 'video');

      if (contentList?.data?.list?.length) {
        for (const content of contentList.data.list) {
          const findId = content?.article_id?.toString();

          if (findId === publishId) {
            result.docId = findId;
            result.create_time = new Date(content.publish_at).getTime() / 1000;
            result.data = content;
            if (content.cover_images?.startsWith('[')) {
              result.coverUrl = JSON.parse(content.cover_images)[0]?.src;
            }
            const mediaStatus = content?.status;
            switch (mediaStatus) {
              case 'publish':
                result.auditStatus = auditStatusEnum.published;
                break;
              case 'rejected':
                result.auditStatus = auditStatusEnum.deny;
                break;
              case 'draft':
                result.auditStatus = auditStatusEnum.draft;
                break;
              case 'withdraw':
                result.auditStatus = auditStatusEnum.customWithdrawn;
                break;
              case 'audit':
                result.auditStatus = auditStatusEnum.inAudit;
                break;
              case 'analyze':
                result.auditStatus = auditStatusEnum.inAudit;
                break;
              case 'pre_publish':
                result.auditStatus = auditStatusEnum.prePublish;
                break;
              default:
                result.auditStatus = auditStatusEnum.inAudit;
                break;
            }

            if (result.auditStatus == auditStatusEnum.published) {
              result.openUrl = content.share_url;
            } else {
              const msg = content['audit_msg'] ?? '';
              result.msg = msg;
              if (msg.includes('转码失败')) {
                result.auditStatus = auditStatusEnum.executeFail;
              }
            }
            return result;
          }
        }
      } else {
        result.code = contentList?.errno ?? -1;
        result.msg = '未找到作品';
        break;
      }
    }
    result.code = contentList?.errno ?? -1;
    result.msg = '未找到作品';
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
    //TODO 更多错误处理
  }

  return result;
};

/**
 * 查询动态作品的审核状态
 * @param cookie
 * @param publishId 发布产生的唯一publishId（时间戳）
 * @param maxPage 最大翻页数，超出后不再继续查询，默认10页
 */
export const getBaijiahaoDynamicStatus = async (
  cookie: string,
  publishId: string,
  maxPage: number = 10,
): Promise<BaijiahaoVideoStatusOutput> => {
  const result: BaijiahaoVideoStatusOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };

  try {
    if (!maxPage) {
      maxPage = 1;
    }
    let contentList: BaijiahaoContentListResponse | undefined = undefined;
    for (let i = 1; i <= maxPage; i++) {
      //根据页码获取视频列表
      contentList = await getBaiJiaDynamicContentListAsync(cookie, i, 10);

      if (contentList?.data?.list?.length) {
        for (const content of contentList.data.list) {
          if (publishId.length === 10) {
            const findId = content?.create_time;
            const pubNumId = parseInt(publishId);

            if (Math.abs(pubNumId - findId) < 30) {
              result.docId = `${content.id}_${content.feed_id}`;
              result.create_time = content.create_time;
              result.data = content;
              if (content.cover_images?.startsWith('[')) {
                result.coverUrl = JSON.parse(content.cover_images)[0]?.src;
              }
              const mediaStatus = content?.sub_status;
              switch (mediaStatus) {
                case 'publish':
                  result.auditStatus = auditStatusEnum.published;
                  break;
                case 'rejected':
                  result.auditStatus = auditStatusEnum.deny;
                  break;
                case 'draft':
                  result.auditStatus = auditStatusEnum.draft;
                  break;
                case 'withdraw':
                  result.auditStatus = auditStatusEnum.customWithdrawn;
                  break;
                case 'audit':
                  result.auditStatus = auditStatusEnum.inAudit;
                  break;
                case 'analyze':
                  result.auditStatus = auditStatusEnum.inAudit;
                  break;
                case 'pre_publish':
                  result.auditStatus = auditStatusEnum.prePublish;
                  break;
                default:
                  result.auditStatus = auditStatusEnum.inAudit;
                  break;
              }

              if (result.auditStatus == auditStatusEnum.published) {
                result.openUrl = content.share_url;
              } else {
                const msg = content['audit_msg'] ?? '';
                result.msg = msg;
                if (msg.includes('转码失败')) {
                  result.auditStatus = auditStatusEnum.executeFail;
                }
              }
              return result;
            }
          } else {
            const findId = content?.article_id?.toString();

            if (findId === publishId) {
              result.docId = `${content.id}_${content.feed_id}`;
              result.create_time = content.create_time;
              result.data = content;
              if (content.cover_images?.startsWith('[')) {
                result.coverUrl = JSON.parse(content.cover_images)[0]?.src;
              }
              const mediaStatus = content?.sub_status;
              switch (mediaStatus) {
                case 'publish':
                  result.auditStatus = auditStatusEnum.published;
                  break;
                case 'rejected':
                  result.auditStatus = auditStatusEnum.deny;
                  break;
                case 'draft':
                  result.auditStatus = auditStatusEnum.draft;
                  break;
                case 'withdraw':
                  result.auditStatus = auditStatusEnum.customWithdrawn;
                  break;
                case 'audit':
                  result.auditStatus = auditStatusEnum.inAudit;
                  break;
                case 'analyze':
                  result.auditStatus = auditStatusEnum.inAudit;
                  break;
                case 'pre_publish':
                  result.auditStatus = auditStatusEnum.prePublish;
                  break;
                default:
                  result.auditStatus = auditStatusEnum.inAudit;
                  break;
              }

              if (result.auditStatus == auditStatusEnum.published) {
                result.openUrl = content.share_url;
              } else {
                const msg = content['audit_msg'] ?? '';
                result.msg = msg;
                if (msg.includes('转码失败')) {
                  result.auditStatus = auditStatusEnum.executeFail;
                }
              }
              return result;
            }
          }
        }
      } else {
        result.code = contentList?.errno ?? -1;
        result.msg = '未找到作品';
        break;
      }
    }
    result.code = contentList?.errno ?? -1;
    result.msg = '未找到作品';
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
    //TODO 更多错误处理
  }

  return result;
};

/**
 * 查询竖版视频作品的审核状态
 * @param cookie
 * @param publishId 发布产生的唯一publishId
 * @param maxPage 最大翻页数，超出后不再继续查询，默认10页
 */
export const getBaijiahaoMiniVideoStatus = async (
  cookie: string,
  publishId: string,
  maxPage: number = 10,
): Promise<BaijiahaoMiniVideoStatusOutput> => {
  const result: BaijiahaoMiniVideoStatusOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };

  try {
    if (!maxPage) {
      maxPage = 1;
    }
    let contentList: BaijiahaoContentListResponse | undefined = undefined;
    for (let i = 0; i <= maxPage; i++) {
      //根据页码获取视频列表
      contentList = await getContentListAsync(cookie, i, 10, 'ugc_video');

      if (contentList?.data?.list?.length) {
        for (const content of contentList.data.list) {
          const findId = content?.nid ?? content.feed_id;

          if (findId === publishId) {
            result.docId = findId;
            result.create_time = new Date(content.publish_at).getTime() / 1000;
            result.data = content;
            if (content.cover_images?.startsWith('[')) {
              result.coverUrl = JSON.parse(content.cover_images)[0]?.src;
            }
            const mediaStatus = content?.status;
            switch (mediaStatus) {
              case 'publish':
                result.auditStatus = auditStatusEnum.published;
                break;
              case 'rejected':
                result.auditStatus = auditStatusEnum.deny;
                break;
              case 'draft':
                result.auditStatus = auditStatusEnum.draft;
                break;
              case 'withdraw':
                result.auditStatus = auditStatusEnum.customWithdrawn;
                break;
              case 'audit':
                result.auditStatus = auditStatusEnum.inAudit;
                break;
              case 'pre_publish':
                result.auditStatus = auditStatusEnum.prePublish;
                break;
              default:
                result.auditStatus = auditStatusEnum.inAudit;
                break;
            }
            if (result.auditStatus == auditStatusEnum.published) {
              result.openUrl = content.share_url;
            }
            return result;
          }
        }
      } else {
        result.code = contentList?.errno ?? -1;
        result.msg = '未找到作品';
        break;
      }
    }
    result.code = contentList?.errno ?? -1;
    result.msg = '未找到作品';
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
    //TODO 更多错误处理
  }

  return result;
};

export interface BaijiahaoVideoStatusOutput extends BaijiahaoArticleStatusOutput {}

export interface BaijiahaoMiniVideoStatusOutput extends BaijiahaoArticleStatusOutput {}
/**
 * 获取图文发布token
 * @param cookie
 * @param token 基础token
 */
export const getBaijiahaoPublishArticleToken = async (
  cookie: string,
  token: string,
): Promise<BaijiahaoPublishTokenOutput> => {
  let result: BaijiahaoPublishTokenOutput = {
    code: 0,
    msg: '',
    publishToken: '',
  };

  try {
    const data = await $http.get<BaijiahaoPublishTokenOutput>(
      'https://baijiahao.baidu.com/pcui/article/edit?type=news',
      {
        headers: {
          cookie: cookie,
          referer: 'https://baijiahao.baidu.com/builder/rc/edit?type=news',
          host: 'baijiahao.baidu.com',
          token: token,
        },
        params: {},
      },
    );
    result = { ...data.data };
    result.publishToken = data?.headers?.token.toString();
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface BaijiahaoPublishTokenOutput extends BaseResult {
  publishToken: string;
  errno?: number;
  errmsg?: string;
  data?: {
    ability: {
      can_auto_cut_pic: null;
      can_quora: null;
      article_tag_num: 5;
      grey: true;
      //单日总发布数
      publish_num: number;
      pub_limitless: false;
      pub_limitless_news: false;
      pub_limitless_video: false;
      can_lemma: false;
      can_use_write_knowledge: 1;
      search_card: false;
      get_ad_profit: false;
      can_news_subtitle: 0;
      can_gallery_subtitle: 0;
      can_video_subtitle: 0;
      can_live_subtitle: 0;
      can_publish_original_article: 0;
      can_mount_shop: 0;
      bound_baidu_shop: 0;
      can_use_video_goods: 0;
      news_mount_column: 0;
      video_mount_column: 0;
      dynamic_mount_column: 0;
      can_use_dynamic_goods: 0;
      can_be_supported: 0;
      can_be_supported_video: false;
      can_be_supported_news: 0;
      can_use_casher: 0;
      got_support_news: 0;
      support_news_threshold: false;
      can_open_shop: 0;
      can_pay_read: 0;
      can_show_ad_mutual_pick: 1;
      can_use_charge_group: 0;
      news_insert_inner_link: 0;
      news_insert_outer_link: 0;
      can_use_live_shop: 0;
      can_live_goods: 0;
      can_reprint: 1;
      can_set_video: 1;
      can_set_music: 1;
      can_set_link: 1;
      can_set_vote: 1;
      can_set_table: 1;
      can_set_novel: 1;
      can_set_authorcard: 1;
      can_split_mthvideo: 0;
      can_mount_shop_subvideo: 0;
      can_pub_playlet_pay_set: 0;
      can_mount_playlet_pay_set: 0;
      can_pub_playlet_ad_set: 0;
      can_distribute_movie: 0;
      can_pay_subscribe: 0;
      can_distribution_game: 0;
      content_distribution: 0;
      is_content_distribution: 0;
      can_playlet_virtual_pay_set: false;
      subscribe_price_limit: false;
      feed_cat_grey: 1;
      video_size_unlimit: 0;
      can_set_advertising_unlock: 0;
      can_set_live: 1;
      can_video_mount_live_review: 1;
      can_set_tinyvideo_original: 0;
      is_image_editor_template: 1;
      can_use_se_keyword: 0;
      can_set_goods: 0;
      can_set_pay: 0;
      can_set_ar: 0;
      can_set_dynamic: 1;
      title80: 0;
      picdesc200: 0;
      can_set_pay_live: 0;
      can_video_finger_printing: 0;
      can_video_mount_game: 0;
      can_set_lightapp: 0;
      can_use_video_procedure: 0;
      can_mount_column_union: 0;
      can_dynamic_mount_pricelightapp: 0;
      can_cover_layout_zero: 0;
      can_insert_baidulink: 0;
      can_insert_inner_link: 0;
      can_insert_outer_link: 0;
      can_insert_redpack: 0;
      can_add_group: 0;
      can_use_group: 0;
      can_create_serveral_group: 0;
      can_use_legal: 0;
      can_generate_title: 0;
      can_use_common_card: 0;
      is_audio_pay_user: 0;
      is_news_pay_user: 0;
      is_video_pay_user: 0;
      can_insert_topic: 1;
      can_timer_publish: 1;
      video_pick_info: [];
      is_auto_optimize_cover: 1;
      show_selected_comment_option: 0;
      can_video_mount_novel: 1;
      can_mount_group: false;
      can_video_auto_mount_goods: 2;
      can_connect_long_movie: 0;
      /**
       * 当日剩余可发布数
       */
      publish_num_left: number;
      publish_num_text: string;
      can_publish: 1;
      can_set_key_number: 5;
      left_edit_times: 3;
      can_set_live_key_number: 5;
      can_hang_video_askgoods: false;
      can_add_cate: false;
      can_auto_mount_goods: 1;
      can_mount_vote: 0;
      auto_summary: 1;
    };
  };
}

export const getBaijiahaoBaseToken = async (
  cookie: string,
  proxyAgent?: object | undefined,
): Promise<BaijiahaoTokenOutput> => {
  const result: BaijiahaoTokenOutput = {
    code: 0,
    msg: '',
    token: '',
  };

  try {
    const content = await $http.get<unknown, AxiosResponse<string>>('https://baijiahao.baidu.com/?source=inner', {
      headers: {
        cookie: cookie,
        host: 'baijiahao.baidu.com',
      },
      params: {},
      httpsAgent: proxyAgent,
      httpAgent: proxyAgent,
    });

    const tokenPattern = /BJH__INIT__AUTH__\s*=\s*['"]{1,2}.*['"]{1,2}/;
    const token = tokenPattern.exec(content.data);

    if (token && token[0]) {
      result.token = token[0].split('"')[1] ?? token[0].split("'")[1];
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};
export interface BaijiahaoTokenOutput extends BaseResult {
  token: string;
}

/**
 * 获取用户信息
 * @param cookie
 * @param proxy
 */
export const getBaijiahaoUserInfo = async (
  cookie: string,
  proxy?: KuaiDaiLiProxy,
): Promise<BaijiahaoUserInfoOutput> => {
  const result: BaijiahaoUserInfoOutput = {
    code: 0,
    msg: '',
  };

  try {
    let proxyAgent;
    if (proxy?.serverAdd) {
      proxyAgent = createKuaiProxyAgent(proxy);
    }
    const userInfoResult = await getBaijiahaoUserInfoAsync(cookie, proxyAgent);
    if (userInfoResult?.data?.user?.avatar?.startsWith('//')) {
      userInfoResult.data.user.avatar = `https:${userInfoResult.data.user.avatar}`;
    }

    result.yixiaoerId = userInfoResult?.data?.user?.app_id?.toString();
    result.yixiaoerImageUrl = userInfoResult?.data?.user?.avatar?.toString();
    result.yixiaoerName = userInfoResult?.data?.user?.name;
    result.raw = userInfoResult?.data?.user;
    result.code = userInfoResult.errno;
    result.msg = userInfoResult.errmsg;
    result.data = userInfoResult.data;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
    result.code = errorCode.exception;
  }

  return result;
};

export interface BaijiahaoUserInfoOutput extends PlatformAuthorInfo {
  data?: BaijiahaoUserInfo;
}

/**
 * 解析百家号公开作者搜索响应
 * @param response 百家号公开作者搜索响应
 */
export const parseBaijiahaoPublicAuthorSearchResponse = (
  response: BaijiahaoPublicAuthorSearchResponse,
): Array<PlatformPublicAuthorInfo> => {
  const exists = new Set<string>();
  const dataList: Array<PlatformPublicAuthorInfo> = [];
  if (!response?.data?.list?.length) {
    return dataList;
  }
  for (const item of response.data.list) {
    const extAuthorId = item?.appid?.toString() ?? '';
    if (!extAuthorId || exists.has(extAuthorId)) {
      continue;
    }
    exists.add(extAuthorId);
    dataList.push({
      platform_code: PublicAuthorPlatformCode.BaiJiaHao,
      ext_author_id: extAuthorId,
      nickname: item?.name ?? '',
      avatar_url: item?.author_icon ?? '',
      description: item?.intro ?? '',
      aut_index: `https://baijiahao.baidu.com/u?app_id=${extAuthorId}`,
      aut_spi_url: '',
      follower_count: Number(item?.fansCnt ?? 0),
      total_views: 0,
      total_comments: 0,
      total_likes: 0,
      work_count: Number(item?.videoCnt ?? 0),
    });
  }
  return dataList;
};

/**
 * 搜索百家号公开作者列表
 * @param keyWord 搜索关键词
 * @param cookie 为空时使用公开搜索默认 cookie
 * @param nextPage 下一页参数，当前仅支持第一页
 * @param proxy 代理
 */
export const searchBaijiahaoPublicAuthorList = async (
  keyWord: string,
  cookie?: string | undefined,
  nextPage?: string,
  proxy?: KuaiDaiLiProxy,
): Promise<PlatformPublicAuthorListOutput> => {
  const result: PlatformPublicAuthorListOutput = {
    code: 0,
    msg: '',
    dataList: [],
  };
  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const offset = Number(nextPage ?? 0) || 0;
    if (offset > 0) {
      return result;
    }
    const authorSearchResponse = await getBaijiahaoPublicAuthorSearchResponse(cookie, keyWord, 1, webProxy);
    result.code = authorSearchResponse?.status ?? -1;
    result.msg = authorSearchResponse?.msg ?? '';
    result.dataList = parseBaijiahaoPublicAuthorSearchResponse(authorSearchResponse);
    if (authorSearchResponse?.data?.has_more) {
      result.nextPage = '10';
    }
    //result.raw = authorSearchResponse;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = '请求百家号作者搜索失败';
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = '解析百家号作者搜索结果失败';
    } else {
      result.msg = '百家号作者搜索失败';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};

/**
 * 获取话题列表
 * @param cookie
 * @param keyword 搜索关键字
 * @param title 作品标题
 */
export const getBaijiahaoTopicList = async (
  cookie: string,
  keyword: string,
  title: string,
): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    const singleDataOverviewResult = await getTopicListAsync(cookie, keyword, title);

    result.code = singleDataOverviewResult.errno;
    result.msg = singleDataOverviewResult.errmsg;
    if (singleDataOverviewResult?.data) {
      if (singleDataOverviewResult?.data?.hot?.length) {
        for (const item of singleDataOverviewResult.data.hot) {
          result.dataList?.push({
            yixiaoerId: item.id,
            yixiaoerName: item.title,
            raw: item,
          });
        }
      }
      if (singleDataOverviewResult?.data?.recommend?.length) {
        for (const item of singleDataOverviewResult.data.recommend) {
          result.dataList?.push({
            yixiaoerId: item.id,
            yixiaoerName: item.title,
            raw: item,
          });
        }
      }
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface BaijiahaoTopicListOutput extends BaseResult {
  data?: {
    recommend: Array<BaijiahaoTopicItem>;
    hot: Array<BaijiahaoTopicItem>;
  };
}

/**
 * 获取搜索地点列表
 * @param cookie
 * @param keyword 关键字
 * @param proxy
 */
export const getBaijiahaoLocationListBySearch = async (
  cookie: string,
  keyword: string,
  proxy?: KuaiDaiLiProxy,
): Promise<BaijiahaoLocationListBySearchOutput> => {
  const result: BaijiahaoLocationListBySearchOutput = {
    code: 0,
    msg: '',
  };

  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }

    const city_code = await getLocationCityCodeAsync(cookie, webProxy);

    const singleDataOverviewResult = await getLocationListBySearch(cookie, keyword, city_code, webProxy);
    result.code = singleDataOverviewResult.errno;
    result.msg = singleDataOverviewResult.errmsg;
    result.data = singleDataOverviewResult.data;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface BaijiahaoLocationListBySearchOutput extends BaseResult {
  data?: Array<{
    id: number;
    name: string;
    city_code: number;
    city: string;
    address: string;
  }>;
}

/**
 * 获取地点列表
 * @param cookie
 * @param keyword
 * @param city_code
 * @param proxy
 */
export const getBaijiahaoLocationList = async (
  cookie: string,
  keyword: string,
  city_code: number,
  proxy?: KuaiDaiLiProxy,
): Promise<BaijiahaoLocationListOutput> => {
  const result: BaijiahaoLocationListOutput = {
    code: 0,
    msg: '',
  };

  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }

    if (!city_code) {
      city_code = await getLocationCityCodeAsync(cookie, webProxy);
    }

    const singleDataOverviewResult = await getLocationAsync(cookie, keyword, city_code, webProxy);

    if (singleDataOverviewResult?.content?.length) {
      result.dataList = singleDataOverviewResult?.content.map((obj) => ({
        yixiaoerId: obj.street_id ? obj?.street_id : obj.uid,
        yixiaoerName: obj.name,
        yixiaoerDesc: obj.addr,
        raw: obj,
      }));
    }

    result.code = singleDataOverviewResult.errno;
    result.msg = singleDataOverviewResult.errmsg;
    result.data = singleDataOverviewResult.content;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface BaijiahaoLocationListOutput extends ListInfoResponse {
  data?: Array<BaijiahaoLocationItem>;
}

export const getBaijiahaoActivityList = async (
  cookie: string,
  mediaType: 'news' | 'video' | 'miniVideo' | 'microArticle',
  activity_type: 'market' | 'all' = 'market',
  page_no: number = 1,
  page_size: number = 18,
): Promise<ListActivityInfoResponse> => {
  const result: ListActivityInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    const singleDataOverviewResult = await getActivityAsync(cookie, mediaType, activity_type, page_no, page_size);

    result.code = singleDataOverviewResult?.errno;
    result.msg = singleDataOverviewResult?.errmsg;
    if (singleDataOverviewResult?.data?.list) {
      for (const item of singleDataOverviewResult?.data?.list) {
        result.dataList?.push({
          yixiaoerId: item.id,
          yixiaoerName: item.task_name,
          yixiaoerDesc: item.reward_description,
          yixiaoerImageUrl: item.brief_image,
          viewNum: item.participant_num,
          raw: mediaType === 'microArticle' ? item : undefined,
        });
      }
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface BaijiahaoActivityListOutput extends BaseResult {
  data?: Array<BaijiahaoActivityInfo>;
}

export const getBaijiahaoCategoryList = async (
  cookie: string,
  mediaType: 'news' | 'videoV2',
): Promise<BaijiahaoCategoryListOutput> => {
  const result: BaijiahaoCategoryListOutput = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    const singleDataOverviewResult = await getCategoryListAsync(cookie, mediaType);

    result.code = singleDataOverviewResult.errno ?? errorCode.data_error;
    result.msg = singleDataOverviewResult.errmsg ?? '获取分类失败';
    if (singleDataOverviewResult.data?.length) {
      let i = 0;
      for (const item of singleDataOverviewResult.data) {
        i++;
        const firstCate: ListItemInfoLevel = {
          yixiaoerId: i.toString() ?? '',
          yixiaoerName: item.value,
        };
        if (item.children?.length) {
          firstCate.child = [];
          let j = 1;
          for (const child of item.children) {
            if (child?.children?.length) {
              for (const thd of child.children) {
                firstCate.child?.push({
                  yixiaoerId: j.toString() ?? '',
                  yixiaoerName: `${child.value}/${thd.value}`,
                });
                j++;
              }
            } else {
              firstCate.child?.push({
                yixiaoerId: j.toString() ?? '',
                yixiaoerName: child.value,
              });
              j++;
            }

            child.children = [];
          }
        }
        item.children = [];
        result.dataList?.push(firstCate);
      }
    }
    result.data = singleDataOverviewResult.data;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface BaijiahaoCategoryListOutput extends ListLevelInfoResponse {
  data?: Array<BaijiahaoCategoryInfo>;
}

/**
 *
 * @param cookie
 * @param days 1: 7天数据，2: 30天数据,3: 90天数据
 * @param proxy
 */
export const getBaijiahaoOverViewDashboard = async (
  cookie: string,
  days: 1 | 2 | 3 = 2,
  proxy?: KuaiDaiLiProxy,
): Promise<AccountReportDataOutPut> => {
  const result: AccountReportDataOutPut = {
    code: 0,
    msg: '',
    data: [],
  };

  const names = [
    { name: '总粉丝数', key: 'totalPlaysCount' },
    { name: '阅读(播放)量', key: 'playCount' },
    { name: '评论量', key: 'commentCount' },
    { name: '点赞量', key: 'greatCount' },
    { name: '收藏量', key: 'collectCount' },
    { name: '分享量', key: 'shareCount' },
    { name: '作品涨粉量', key: 'fansCount' },
  ];

  try {
    const newOverView = {
      all: {
        overview: {},
        thirtydays: {},
      },
    };
    result.dataObj = newOverView as never;
    const fansData = await getBaijiahaoUserInfo(cookie, proxy);
    if (fansData?.code === 0 && fansData?.data?.user?.ability) {
      result.data?.push({
        name: '总粉丝数',
        key: 'totalPlaysCount',
        value: formatNumber(fansData.data.user.ability.total_fans),
        list: [],
      });
      newOverView.all.overview['totalFansCount'] = formatNumberNo(fansData.data.user?.ability?.total_fans);
    } else {
      result.code = fansData?.code ?? -1;
      result.msg = fansData?.msg ?? '';
      return result;
    }

    const now = new Date();
    let startTs = new Date(now.setDate(now.getDate() - 30));
    if (days === 1) {
      startTs = new Date(now.setDate(now.getDate() - 7));
    } else if (days === 3) {
      startTs = new Date(now.setDate(now.getDate() - 90));
    }

    const endNow = new Date();
    const endTs = new Date(endNow.setDate(endNow.getDate() - 1));

    const tiaoResult = await getBaijiahaoDataOverview(cookie, startTs, endTs, proxy);
    result.code = tiaoResult?.code;
    result.msg = tiaoResult?.msg ?? '';
    if (tiaoResult?.data?.list) {
      if (tiaoResult?.data?.list?.length > 0) {
        if (tiaoResult.data.list[0].view_count == -1) {
          tiaoResult.data.list = tiaoResult.data.list.slice(1);
        }

        let total = 0;

        total = 0;
        tiaoResult?.data.list.forEach((x) => (total += Number(x.view_count)));
        const dataItemplay: DataColumn = {
          name: '阅读(播放)量',
          key: 'playCount',
          value: formatNumber(total),
          list: [],
        };
        result.data?.push(dataItemplay);
        newOverView.all.overview[dataItemplay.key] = formatNumberNo(total);
        for (const item of tiaoResult?.data?.list) {
          const dateStr = new Date(
            `${item.event_day.substring(0, 4)}-${item.event_day.substring(4, 6)}-${item.event_day.substring(6, 8)}`,
          ).getTime();
          dataItemplay.list.push({ date: dateStr, value: Number(item.view_count ?? 0) });
        }
        newOverView.all.thirtydays[dataItemplay.key] = dataItemplay.list;
        total = 0;
        tiaoResult?.data.list.forEach((x) => (total += Number(x.comment_count)));
        const dataItemcomment: DataColumn = {
          name: '评论量',
          key: 'commentCount',
          value: formatNumber(total),
          list: [],
        };
        result.data?.push(dataItemcomment);
        newOverView.all.overview[dataItemcomment.key] = formatNumberNo(total);
        for (const item of tiaoResult?.data?.list) {
          const dateStr = new Date(
            `${item.event_day.substring(0, 4)}-${item.event_day.substring(4, 6)}-${item.event_day.substring(6, 8)}`,
          ).getTime();
          dataItemcomment.list.push({ date: dateStr, value: Number(item.comment_count ?? 0) });
        }
        newOverView.all.thirtydays[dataItemcomment.key] = dataItemcomment.list;
        total = 0;
        tiaoResult?.data.list.forEach((x) => (total += Number(x.likes_count)));
        const dataItemlike: DataColumn = {
          name: '点赞量',
          key: 'greatCount',
          value: formatNumber(total),
          list: [],
        };
        result.data?.push(dataItemlike);
        newOverView.all.overview[dataItemlike.key] = formatNumberNo(total);
        for (const item of tiaoResult?.data?.list) {
          const dateStr = new Date(
            `${item.event_day.substring(0, 4)}-${item.event_day.substring(4, 6)}-${item.event_day.substring(6, 8)}`,
          ).getTime();
          dataItemlike.list.push({ date: dateStr, value: Number(item.likes_count ?? 0) });
        }
        newOverView.all.thirtydays[dataItemlike.key] = dataItemlike.list;
        total = 0;
        tiaoResult?.data.list.forEach((x) => (total += Number(x.collect_count)));
        const dataItemcollect: DataColumn = {
          name: '收藏量',
          key: 'collectCount',
          value: formatNumber(total),
          list: [],
        };
        result.data?.push(dataItemcollect);
        newOverView.all.overview[dataItemcollect.key] = formatNumberNo(total);
        for (const item of tiaoResult?.data?.list) {
          const dateStr = new Date(
            `${item.event_day.substring(0, 4)}-${item.event_day.substring(4, 6)}-${item.event_day.substring(6, 8)}`,
          ).getTime();
          dataItemcollect.list.push({ date: dateStr, value: Number(item.collect_count ?? 0) });
        }
        newOverView.all.thirtydays[dataItemcollect.key] = dataItemcollect.list;
        total = 0;
        tiaoResult?.data.list.forEach((x) => (total += Number(x.share_count)));
        const dataItemshare: DataColumn = {
          name: '分享量',
          key: 'shareCount',
          value: formatNumber(total),
          list: [],
        };
        result.data?.push(dataItemshare);
        newOverView.all.overview[dataItemshare.key] = formatNumberNo(total);
        for (const item of tiaoResult?.data?.list) {
          const dateStr = new Date(
            `${item.event_day.substring(0, 4)}-${item.event_day.substring(4, 6)}-${item.event_day.substring(6, 8)}`,
          ).getTime();
          dataItemshare.list.push({ date: dateStr, value: Number(item.share_count ?? 0) });
        }
        newOverView.all.thirtydays[dataItemshare.key] = dataItemshare.list;
        total = 0;
        tiaoResult?.data.list.forEach((x) => (total += Number(x.fans_increase)));
        const dataItemFans: DataColumn = {
          name: '作品涨粉量',
          key: 'fansCount',
          value: formatNumber(total),
          list: [],
        };
        result.data?.push(dataItemFans);
        newOverView.all.overview[dataItemFans.key] = formatNumberNo(total);
        for (const item of tiaoResult?.data?.list) {
          const dateStr = new Date(
            `${item.event_day.substring(0, 4)}-${item.event_day.substring(4, 6)}-${item.event_day.substring(6, 8)}`,
          ).getTime();
          dataItemFans.list.push({ date: dateStr, value: Number(item.fans_increase ?? 0) });
        }
        newOverView.all.thirtydays[dataItemFans.key] = dataItemFans.list;
      }
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  if (result?.data && result?.data?.length > 0) {
    result.code = 0;
  } else {
    result.code = -1;
  }
  const dataList = result.data ?? [];
  result.data = [];
  for (const { name, key } of names) {
    const tmp = dataList.find((item) => item.name === name);
    result.data.push(tmp ?? { name: name, key: key, value: '-', list: [] });
  }
  return result;
};

/**
 * 获取百家指定天数内，最多20条公开作品数据
 * @param cookie
 * @param type
 * @param eventCallBack
 * @param days
 * @param maxCount
 * @param isHeader
 * @param proxy
 */
export const getBaijiaContentListView = async (
  cookie: string,
  type: 'video' | 'miniVideo' | 'article',
  eventCallBack?: EventEmitter,
  days: number = 7,
  maxCount: number = 20,
  isHeader: boolean = false,
  proxy?: KuaiDaiLiProxy,
): Promise<AccountContentListViewOutPut> => {
  const result: AccountContentListViewOutPut = {
    code: 0,
    msg: '',
    data: [],
  };
  result.data = [];
  result.dataList = [];
  try {
    const lastDate = dayjs().add(-days, 'days').toDate();
    result.headers = [
      { name: '封面', key: 'cover' },
      { name: '标题', key: 'title' },
      { name: '发布时间', key: 'date' },
    ];

    if (type === 'video' || type === 'article') {
      result.headers.push({ name: '推荐量', key: 'reCommand' });
    }
    if (type === 'miniVideo' || type === 'article') {
      result.headers.push({ name: '阅读量', key: 'read' });
    } else {
      result.headers.push({ name: '播放量', key: 'play' });
    }

    result.headers.push(
      ...[
        { name: '评论量', key: 'comment' },
        { name: '点赞量', key: 'great' },
        { name: '收藏量', key: 'collect' },
        { name: '分享量', key: 'share' },
      ],
    );
    if (isHeader) {
      return result;
    }
    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    let contentTmpId = '';
    for (let i = 1; i < syncContentMaxPage; i++) {
      const contentList = await getContentListAsync(
        cookie,
        i,
        10,
        type === 'video' ? 'video' : type === 'miniVideo' ? 'ugc_video' : 'news',
        'publish',
        webProxy,
      );
      if (contentList?.data?.list?.length) {
        if (contentList.data.list[0].article_id && contentList.data.list[0].article_id === contentTmpId) {
          break;
        } else {
          contentTmpId = contentList.data.list[0].article_id;
        }
        let j = 0;
        for (const item of contentList?.data?.list) {
          j++;
          // if (item.Archive.state === -50) {
          //   continue;
          // }
          const date = dayjs(item.publish_at).toDate();
          if (lastDate > date || result.data.length >= maxCount) {
            //前面可能会有三个置顶的
            if (j <= 3) {
              continue;
            }
            eventCallBack?.emit(syncContentEventName, { ...result });
            return result;
          }
          const dateStr = dayjs(date).format('YYYY-MM-DD HH:mm:ss');
          const coverJo = JSON.parse(item.cover_images);
          const newItem: PlatformContentItem = {
            id: type === 'miniVideo' ? item.nid : item.article_id,
            cover: coverJo[0]?.src ?? '',
            title: item.title ?? '',
            date: dateStr,
            reCommand: formatNumber(item.rec_count),
            play: formatNumber(item?.read_amount),
            read: formatNumber(item?.read_amount),
            comment: formatNumber(item.comment_amount),
            great: formatNumber(item.like_amount),
            collect: formatNumber(item.collection_amount),
            share: formatNumber(item.share_amount),
            type: type,
            pageUrl: item.share_url,
          };
          const newItemNum: PlatformContentItemNum = {
            id: type === 'miniVideo' ? item.nid : item.article_id,
            cover: coverJo[0]?.src ?? '',
            title: item.title ?? '',
            date: dateStr,
            reCommand: formatNumberNo(item.rec_count),
            play: formatNumberNo(item?.read_amount),
            read: formatNumberNo(item?.read_amount),
            comment: formatNumberNo(item.comment_amount),
            great: formatNumberNo(item.like_amount),
            collect: formatNumberNo(item.collection_amount),
            share: formatNumberNo(item.share_amount),
            type: type,
            pageUrl: item.share_url,
          };
          if (type === 'miniVideo') {
            newItem.pageUrl = `https://mbd.baidu.com/newspage/data/videolanding?nid=sv_${item.nid}`;
            newItemNum.pageUrl = newItem.pageUrl;
          }
          result.data.push(newItem);
          result.dataList?.push(newItemNum);
        }
        if (result.data?.length >= maxCount) {
          eventCallBack?.emit(syncContentEventName, { ...result });
          return result;
        }
        if (eventCallBack) {
          eventCallBack?.emit(syncContentEventName, { ...result });
          result.data = [];
          result.dataList = [];
        }
        await Task.Delay(1000);
      } else {
        if (!result.data.length) {
          result.code = contentList?.errno ?? -1;
          result.msg = contentList?.errmsg ?? '';
        }
        break;
      }
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

/**
 *
 * @param cookie
 * @param contentType
 * @param docId
 * @param tokenStr
 */
export const deleteBaijiahaoContent = async (
  cookie: string,
  contentType: PubContentEnum,
  docId: string,
  tokenStr?: string,
): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    if (!tokenStr) {
      const tRe = await getBaijiahaoBaseToken(cookie);
      tokenStr = tRe?.token ?? '';
    }
    if (contentType === PubContentEnum.video) {
      if (docId.startsWith('1')) {
        await withDrawContent(cookie, docId, tokenStr);
        const deleteRe = await deleteContent(cookie, docId, tokenStr);
        if (deleteRe?.errno === 0) {
          return result;
        }
        const deleteMi = await deleteMiniVideoContent(cookie, docId, tokenStr);
        if (deleteMi?.errno === 0) {
          return result;
        }
        result.code = deleteRe?.errno ?? deleteMi?.errno ?? -1;
        result.msg = `${deleteRe?.errmsg}-${deleteMi?.errmsg}`;
      } else {
        const deleteMi = await deleteMiniVideoContent(cookie, docId, tokenStr);
        if (deleteMi?.errno === 0) {
          return result;
        }
        result.code = deleteMi?.errno ?? -1;
        result.msg = deleteMi?.errmsg;
      }
    } else if (contentType === PubContentEnum.article) {
      await withDrawContent(cookie, docId, tokenStr);
      const deleteRe = await deleteContent(cookie, docId, tokenStr);
      result.code = deleteRe?.errno ?? -1;
      result.msg = deleteRe?.errmsg;
    } else if (contentType === PubContentEnum.dynamic || contentType === PubContentEnum.ImageText) {
      const deleteRe = await deleteBaiJiaDynamicContent(cookie, docId, tokenStr);
      result.code = deleteRe?.errno ?? -1;
      result.msg = deleteRe?.errmsg;
    } else {
      result.code = -1;
      result.msg = '不支持的内容类型';
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};
