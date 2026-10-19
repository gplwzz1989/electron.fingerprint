import { BaseResult } from '../baseResult';
import {
  getArticleContentListAsync,
  getContentListAsync,
  getDynamicContentListAsync,
  getMiniVideoContentListResponse,
  getNewContentListAsync,
  getVideoContentListResponse,
  TouTiaoDynamicListResponse,
  ToutiaohaoArticleContentListResponse,
  ToutiaohaoMediaContent,
  ToutiaohaoNewMediaContent,
  ToutiaohaoVideoContentListResponse,
  ToutiaohaoVideoMediaContent,
} from './toutiaohao-content-list.service';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import {
  getDataOverviewAsync,
  getDataOverviewFansAsync,
  getSingleDataOverview,
  getSingleDataOverviewStatisticAsync,
  ToutiaohaoDataOverviewDailyResponse,
  ToutiaohaoDataOverviewResponse,
  ToutiaohaoFansDailyResponse,
} from './toutiaohao-data-overview.service';
import { getToutiaohaoPublicAuthorSearchHtml, getUserStatisticAsync } from './toutiaohao-user.service';
import { getLocationListAsync } from './toutiaohao-location.service';
import {
  getArticleCollectionAsync,
  getVideoCollectionResponse,
  ToutiaohaoVideoCollectionInfo,
} from './toutiaohao-collection.service';
import { getToutiaohaoPlaceListAsync } from './toutiaohao-article.service';
import { getArticleTopicResponse, getVideoTopicResponse, ToutiaohaoArticleTopicInfo } from './toutiaohao-topic.service';
import { auditStatusEnum, formatNumber, formatNumberNo, Guid, Task } from '../../utils';
import { getVideoActivityResponse, ToutiaohaoVideoActivityInfo } from './toutiaohao-activity.service';
import { getUserInfoAsync, getUserStatusInfoAsync, ToutiaohaoUserInfoResponse } from './toutiaohao-base.service';
import {
  AccountContentListViewOutPut,
  AccountReportDataOutPut,
  syncContentEventName,
  syncContentMaxPage,
} from '../data-service';
import {
  AuditResult,
  DataColumn,
  ListInfoResponse,
  PlatformAuthorInfo,
  PlatformContentItem,
  PlatformContentItemNum,
  PublicAuthorPlatformCode,
  PlatformPublicAuthorInfo,
  PlatformPublicAuthorListOutput,
  UserCanPublishInfo,
  UserStatus,
} from '../baseModel';
import dayjs from 'dayjs';
import { createKuaiProxyAgent, IWebProxy, KuaiDaiLiProxy } from '../webproxy';
import { EventEmitter } from 'events';
import { PubContentEnum } from '@/cloud/model/TypeEnum';
import {
  deleteArticleContent,
  deleteMiniVideoContent,
  deleteTouTiaoMediaContent,
  deleteVideoContent,
} from '@/media-platform/toutiaohao/toutiaohao-content-delete.service';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { getFengWangUserInfoResponse } from '@/media-platform/fengwang/fengwang-user.service';

/**
 * 头条号作品管理
 * @param cookie
 * @param page 页码
 * @param pageSize 每页数量
 * @param status 内容状态（8：全部，2：已通过，1：审核中，3：未通过，4：仅我可见）
 */
export const getToutiaohaoContentList = async (
  cookie: string,
  page: number = 1,
  pageSize: number = 10,
  status: 8 | 2 | 1 | 3 | 4 = 2,
) => {
  const result: ToutiaohaoContentListOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const contentListResult = await getContentListAsync(cookie, page, pageSize, status);

    result.code = contentListResult.code;
    result.msg = contentListResult.message;
    result.data = contentListResult.contents;
    result.has_more = contentListResult.has_more;
    result.total_count = contentListResult.total_count;
    result.count = contentListResult.count;
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

export interface ToutiaohaoContentListOutput extends BaseResult {
  data?: Array<ToutiaohaoMediaContent>;

  /**
   * 每页数量
   */
  count?: number;

  /**
   * 是否还有更多
   */
  has_more?: boolean;

  /**
   * 内容总数
   */
  total_count?: number;
  raw?: unknown;
}

export const getToutiaohaoNewContentList = async (
  cookie: string,
  page: number,
  pageSize: number,
  uid: number,
  status: 8 | 2 | 1 | 3 | 4 = 2,
  keyword: string | '',
  start_date?: Date,
  end_date?: Date,
): Promise<ToutiaohaoNewContentListOutput> => {
  const result: ToutiaohaoNewContentListOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    let start_time = 0;
    let end_time = 0;

    if (start_date && end_date) {
      start_time = start_date.getTime();
      end_time = end_date.getTime();
    }

    const newContentListResult = await getNewContentListAsync(
      cookie,
      page,
      pageSize,
      uid,
      status,
      'mp_all',
      keyword,
      start_time,
      end_time,
    );

    result.code = newContentListResult.errno;
    result.msg = newContentListResult.message;
    result.data = newContentListResult.data;
    result.has_more = newContentListResult.has_more;
    result.total_number = newContentListResult.total_number;
    result.offset = newContentListResult.offset;
    result.raw = newContentListResult;
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

export interface ToutiaohaoNewContentListOutput extends BaseResult {
  data?: Array<ToutiaohaoNewMediaContent>;
  code: number;
  msg: string;
  total_number?: number;
  has_more?: boolean;
  offset?: number;
  raw?: unknown;
}

/**
 * 获取头条号作品数据
 * @param cookie
 * @param start_date 开始日期 Date类型
 * @param end_date 结束日期 Date类型
 * @param proxy
 */
export const getToutiaohaoDataOverview = async (
  cookie: string,
  start_date: Date,
  end_date: Date,
  proxy?: KuaiDaiLiProxy,
) => {
  const result: ToutiaohaoDataOverviewOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    let proxyAgent;
    if (proxy?.serverAdd) {
      proxyAgent = createKuaiProxyAgent(proxy);
    }
    let start_date_str = start_date.toISOString();
    if (start_date_str.length > 0) {
      start_date_str = start_date_str.slice(0, 10);
    }

    let end_date_str = end_date.toISOString();
    if (end_date_str.length > 0) {
      end_date_str = end_date_str.slice(0, 10);
    }

    const dataOverviewResult = await getDataOverviewAsync(cookie, start_date_str, end_date_str, proxyAgent);

    result.code = dataOverviewResult.code;
    result.msg = dataOverviewResult.message;
    result.data = dataOverviewResult.daily_stat_datas;
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

export interface ToutiaohaoDataOverviewOutput extends BaseResult {
  data?: Array<ToutiaohaoDataOverviewDailyResponse>;
  raw?: unknown;
}

/**
 * 获取头条号粉丝数据
 * @param cookie
 * @param start_date 开始日期 Date类型
 * @param end_date 结束日期 Date类型
 */
export const getToutiaohaoDataOverviewFans = async (cookie: string, start_date: Date, end_date: Date) => {
  const result: ToutiaohaoDataOverviewFansOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    let start_date_str = start_date.toISOString();
    if (start_date_str.length > 0) {
      start_date_str = start_date_str.slice(0, 10);
    }

    let end_date_str = end_date.toISOString();
    if (end_date_str.length > 0) {
      end_date_str = end_date_str.slice(0, 10);
    }

    const dataOverviewFansResult = await getDataOverviewFansAsync(cookie, start_date_str, end_date_str);

    result.code = dataOverviewFansResult.code;
    result.msg = dataOverviewFansResult.message;
    result.data = dataOverviewFansResult.daily_fans_stats;
    result.raw = dataOverviewFansResult;
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

export interface ToutiaohaoDataOverviewFansOutput extends BaseResult {
  data?: Array<ToutiaohaoFansDailyResponse>;

  raw?: unknown;
}

export const getToutiaohaoUserHomeData = async (cookie: string) => {
  const result: ToutiaohaoUserHomeDataOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const userHomeDataResult = await getUserStatisticAsync(cookie);

    result.code = userHomeDataResult.code;
    result.msg = userHomeDataResult.message;
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

export interface ToutiaohaoUserHomeDataOutput extends BaseResult {
  data?: {
    statistic: {
      data: {
        fans_data: {
          /**
           * 总粉丝数
           */
          total: string;
        };
        /**
         * 粉丝数
         */
        total_subscribe_count: string;

        /**
         * 总收益
         */
        total_income: number;

        /**
         * 总阅读（播放）量
         */
        total_read_play_count: string | number;
      };
    };
  };

  raw?: unknown;
}

/**
 * 头条号单篇统计数据
 * @param cookie
 * @param item_id 作品id
 * @param type 数据类型（1：文章，2：视频，3：微头条，5：小视频）
 */
export const getToutiaohaoSingleDataOverviewStatistic = async (
  cookie: string,
  item_id: string,
  type: 1 | 2 | 3 | 5,
): Promise<ToutiaohaoSingleDataOverviewStatisticOutput> => {
  const result: ToutiaohaoSingleDataOverviewStatisticOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const singleDataOverviewStatisticResult = await getSingleDataOverviewStatisticAsync(cookie, item_id, type);

    result.code = singleDataOverviewStatisticResult.code;
    result.msg = singleDataOverviewStatisticResult.message;
    result.data = singleDataOverviewStatisticResult.item_data;
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

export interface ToutiaohaoSingleDataOverviewStatisticOutput extends BaseResult {
  data?: {
    /**
     * 标题
     */
    title: string;

    /**
     * 封面
     */
    cover_url: string;

    /**
     * 发布时间
     */
    create_time: number;

    /**
     * 时长
     */
    duration: number;
    genre_type: number;

    /**
     * 作品id
     */
    item_id: string;
    item_stat: {
      consume_data: {
        /**
         * 粉丝阅读量
         */
        fans_go_detail_count: number;
        fans_go_detail_count_new: number;
        /**
         * 粉丝展现量
         */
        fans_impression_count: number;
        fans_impression_count_new: number;

        /**
         * 粉丝播放量
         */
        fans_play_count: number;
        fans_play_count_new: number;

        /**
         * 阅读量
         */
        go_detail_count: number;
        go_detail_count_new: number;

        /**
         * 展现量
         */
        impression_count: number;
        impression_count_new: number;

        /**
         * 播放量
         */
        play_count: number;
        play_count_new: number;
      };
      consume_detail: {
        /**
         * 点击率
         */
        click_rate: number;

        /**
         * 平均播放完成率
         */
        read_complete_rate: number;

        /**
         * 播放时长
         */
        read_duration: number;
      };
      fans_change_count: number;
      fans_data: {
        /**
         * 粉丝变化
         */
        change_count: number;

        /**
         * 掉粉
         */
        decrease_count: number;

        /**
         * 涨粉
         */
        increase_count: number;

        /**
         * 播放转粉率
         */
        to_fans_rate: number;
      };
      fans_data_v2: {
        /**
         * 粉丝变化
         */
        change_count: number;

        /**
         * 掉粉
         */
        decrease_count: number;

        /**
         * 涨粉
         */
        increase_count: number;

        /**
         * 播放转粉率
         */
        to_fans_rate: number;
      };
      income_data: {
        basic_income: number;
        subsidy_income: number;
        /**
         * 收益
         */
        total_income: number;
      };
      interaction_data: {
        /**
         * 评论数
         */
        comment_count: number;

        /**
         * 点赞数
         */
        digg_count: number;

        /**
         * 收藏数
         */
        forward_count: number;

        /**
         * 转发数
         */
        repin_count: number;

        /**
         * 收藏数
         */
        share_count: number;
      };
    };
  };

  raw?: unknown;
}

/**
 * 头条号单篇报表数据
 * @param cookie
 * @param item_id 作品id
 * @param start_date 开始日期 Date
 * @param end_date 结束日期 Date
 * @param type 数据类型（1：文章，2：视频，3：微头条，5：小视频）
 */
export const getToutiaohaoSingleDataOverview = async (
  cookie: string,
  item_id: string,
  start_date: Date,
  end_date: Date,
  type: 1 | 2 | 3 | 5,
): Promise<ToutiaohaoSingleDataOverviewOutput> => {
  const result: ToutiaohaoSingleDataOverviewOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    let start_date_str = start_date.toISOString();
    if (start_date_str.length > 0) {
      start_date_str = start_date_str.slice(0, 10);
    }

    let end_date_str = end_date.toISOString();
    if (end_date_str.length > 0) {
      end_date_str = end_date_str.slice(0, 10);
    }

    const singleDataOverviewResult = await getSingleDataOverview(cookie, item_id, start_date_str, end_date_str, type);

    result.code = singleDataOverviewResult.daily_stats.length > 0 ? 0 : singleDataOverviewResult.code;
    result.msg = singleDataOverviewResult.message;
    result.data = singleDataOverviewResult.daily_stats;
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

export interface ToutiaohaoSingleDataOverviewOutput extends BaseResult {
  data?: Array<{
    consume_data: {
      /**
       * 粉丝阅读量
       */
      fans_go_detail_count: number;
      fans_go_detail_count_new: number;

      /**
       * 粉丝展现量
       */
      fans_impression_count: number;
      fans_impression_count_new: number;

      /**
       * 粉丝播放量
       */
      fans_play_count: number;
      fans_play_count_new: number;

      /**
       * 阅读量
       */
      go_detail_count: number;
      go_detail_count_new: number;

      /**
       * 展现量
       */
      impression_count: number;
      impression_count_new: number;

      /**
       * 播放量
       */
      play_count: number;
      play_count_new: number;
    };
    /**
     * 日期
     */
    date: string;
  }>;

  raw?: unknown;
}

/**
 * 头条号位置列表
 * @param cookie
 */
export const getToutiaohaoArticleLocationList = async (cookie: string, proxy: IWebProxy): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: 'ok',
  };
  result.dataList = [];
  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const locationListResult = await getLocationListAsync(cookie, webProxy);
    if (locationListResult?.data?.city_list) {
      const tmpSet = new Set<string>();
      if (locationListResult?.data?.gps_location?.city_name) {
        const cityCode = locationListResult.data.gps_location.city_code?.toString();
        result.dataList.push({ yixiaoerId: cityCode, yixiaoerName: locationListResult?.data?.gps_location?.city_name });
        tmpSet.add(cityCode);
      }
      for (const item of locationListResult?.data?.city_list) {
        for (const itemin of item.cities) {
          const cityCode = itemin.code?.toString();
          if (tmpSet.has(cityCode)) {
            continue;
          }
          result.dataList.push({ yixiaoerId: cityCode, yixiaoerName: itemin.name });
          tmpSet.add(cityCode);
        }
      }
    }

    result.code = locationListResult.status;
    result.msg = locationListResult.message;
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

export interface ToutiaohaoLocationOutput extends BaseResult {
  data?: {
    city_list: Array<{
      cities: Array<{
        /**
         * 城市名称
         */
        name: string;

        /**
         * 城市code
         */
        code: string;
      }>;

      /**
       * 首字母
       */
      name: string;
    }>;
    gps_location: {
      /**
       * 城市名称
       */
      city_name: string;

      /**
       * 城市code
       */
      city_code: string;
      district_name: string;
      district_code: string;
    };
  };
}

/**
 * 头条号合集列表
 * @param cookie
 * @param user_id 账号id
 * @param page_num 页码
 * @param page_size 每页数量
 */
export const getToutiaohaoArticleCollection = async (
  cookie: string,
  user_id: number,
  page_num: number,
  page_size: number,
): Promise<ToutiaohaoArticleCollectionOutput> => {
  const result: ToutiaohaoArticleCollectionOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const collectionResult = await getArticleCollectionAsync(cookie, user_id, page_num, page_size);

    result.code = collectionResult.code;
    result.msg = collectionResult.message;
    result.data = collectionResult.data;
    result.total_count = collectionResult.total_count;
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

export interface ToutiaohaoArticleCollectionOutput extends BaseResult {
  data?: Array<{
    /**
     * 合集id
     */
    id: string;
    collection_attr: {
      /**
       * 合集内容标题
       */
      title: string;

      /**
       * 内容封面信息
       */
      cover_image: {
        url: string;
        uri: string;
        width: number;
        height: number;
        mime_type: string;
      };

      /**
       * 合集内容状态
       */
      item_status: number;
      visibility_level: number;

      /**
       * 创建时间
       */
      create_time: string;
      suppress_reason: string;

      /**
       * 用户id
       */
      user_id: string;
    };
    collection_stat: {
      impression_count: string;
      go_detail_count: string;
      repin_count: string;
      forward_count: string;
    };
    sub_item_count: number;
    item_status_desc: string;
  }>;
  total_count?: string;
}

/**
 * 获取头条引用站点地点列表
 * @param cookie
 * @param page 页码
 * @param pageSize 每页数量
 * @param keyword 搜索关键字
 */
export const getToutiaohaoPlaceList = async (
  cookie: string,
  page: number,
  pageSize: number,
  keyword: string,
): Promise<ToutiaohaoPlaceListOutput> => {
  const result: ToutiaohaoPlaceListOutput = {
    code: 0,
    msg: 'ok',
  };
  try {
    const placeListResult = await getToutiaohaoPlaceListAsync(cookie, page, pageSize, keyword);

    result.code = placeListResult.code;
    result.msg = placeListResult.mesg;
    result.data = placeListResult.data;
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

export interface ToutiaohaoPlaceListOutput extends BaseResult {
  data?: {
    total: number;
    length: number;
    page: number;
    size: number;
    logid: string;
    poi: Array<{
      id: string;
      name: string;
      latitude: number;
      longitude: number;
      address: string;
      district: string;
      city: string;
      province: string;
      country: string;
      formatted_address: string;
      tel: string;
      distance: string;
      service_id: string;
      details: {
        awe: string;
      };
      type_code: string;
      type_name: string;
    }>;
  };
}

/**
 * 查询图文作品的审核状态
 * @param cookie
 * @param publishId 发布产生的唯一publishId
 * @param maxPage 最大翻页数，超出后不再继续查询，默认10页
 */
export const getToutiaohaoArticleStatus = async (
  cookie: string,
  publishId: string,
  maxPage: number = 10,
): Promise<ToutiaohaoArticleStatusOutput> => {
  const result: ToutiaohaoArticleStatusOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };

  try {
    if (!maxPage) {
      maxPage = 1;
    }
    let contentList: ToutiaohaoArticleContentListResponse | undefined = undefined;
    for (let i = 0; i <= maxPage; i++) {
      //根据页码获取视频列表
      contentList = await getArticleContentListAsync(cookie, i, 10, 8);

      if (contentList?.contents?.length) {
        for (const content of contentList.contents) {
          const findId = content?.article_attr?.item_id;

          if (findId === publishId) {
            result.docId = findId;
            result.create_time = content?.article_attr?.create_time;
            result.data = content;
            const mediaStatus = content.article_attr.status;
            switch (mediaStatus) {
              case 1:
                result.auditStatus = auditStatusEnum.inAudit;
                break;
              case 2:
                result.auditStatus = auditStatusEnum.published;
                break;
              case 3:
                result.auditStatus = auditStatusEnum.deny;
                break;
              case 4:
                result.auditStatus = auditStatusEnum.notSuitableForPublicity;
                break;
              case 5:
                result.auditStatus = auditStatusEnum.prePublish;
                break;
              case 11:
                result.auditStatus = auditStatusEnum.customWithdrawn;
                break;
              default:
                result.auditStatus = auditStatusEnum.inAudit;
                break;
            }
            if (result.auditStatus == auditStatusEnum.published) {
              result.openUrl = content.article_attr?.action_urls['2']?.share;
              if (!result.openUrl || !result.openUrl.startsWith('http')) {
                result.openUrl = `https://www.toutiao.com/item/${publishId}/`;
              }
            }
            return result;
          }
        }
      } else {
        result.code = contentList?.code ?? -1;
        result.msg = '未找到作品';
        return result;
      }
    }
    result.code = contentList?.code ?? -1;
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

/**
 * 查询竖版小视频状态
 * @param cookie
 * @param publishId 发布产生的publishid
 * @param maxPage 查询最大翻页数
 */
export const getToutiaohaoMiniVideoStatus = async (
  cookie: string,
  publishId: string,
  maxPage: number = 10,
): Promise<ToutiaohaoArticleStatusOutput> => {
  const result: ToutiaohaoArticleStatusOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };

  try {
    if (!maxPage) {
      maxPage = 1;
    }
    let endCursor = 0;
    const now = new Date();
    let totalEndCursor = 0;
    let contentList: ToutiaohaoArticleContentListResponse | undefined = undefined;
    for (let i = 0; i <= maxPage; i++) {
      //翻页参数
      if (endCursor > 0) {
        totalEndCursor = parseInt(
          now
            .setHours(now.getHours() - 3)
            .toString()
            .substring(0, 10),
        );
      } else {
        totalEndCursor = parseInt(now.getTime().toString().substring(0, 10));
      }

      const endcursor = endCursor > 0 ? endCursor : parseInt(now.getTime().toString().substring(0, 10));
      //根据页码获取视频列表
      contentList = await getMiniVideoContentListResponse(cookie, endcursor, totalEndCursor);

      if (contentList?.contents?.length) {
        for (const content of contentList.contents) {
          const findId = content?.article_attr?.item_id;

          if (findId === publishId) {
            result.docId = findId;
            result.create_time = content?.article_attr?.create_time;
            result.data = content;
            const mediaStatus = content.article_attr.status;
            switch (mediaStatus) {
              case 1:
                result.auditStatus = auditStatusEnum.inAudit;
                break;
              case 2:
                result.auditStatus = auditStatusEnum.published;
                break;
              case 3:
                result.auditStatus = auditStatusEnum.deny;
                break;
              case 4:
                result.auditStatus = auditStatusEnum.notPublic;
                break;
              default:
                result.auditStatus = auditStatusEnum.inAudit;
                break;
            }
            if (result.auditStatus == auditStatusEnum.published) {
              result.openUrl = content.article_attr?.action_urls['2']?.share;
              if (!result.openUrl || !result.openUrl.startsWith('http')) {
                result.openUrl = `https://www.toutiao.com/item/${publishId}/`;
              }
            }
            result.coverUrl = content.article_attr?.cover_image?.image_url;
            return result;
          }
        }
        endCursor = contentList.end_cursor;
        if (!contentList.has_more) {
          break;
        }
      } else {
        const comResult = await getToutiaohaoVideoStatus(cookie, publishId);
        if (comResult.docId) {
          result.docId = comResult.docId;
          result.coverUrl = comResult.coverUrl;
          result.create_time = comResult.create_time;
          result.auditStatus = comResult.auditStatus;
          result.openUrl = comResult.openUrl;
          return result;
        }
        result.code = comResult?.code ?? -1;
        result.msg = '未找到作品';
        return result;
      }
    }
    result.code = contentList?.code ?? -1;
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
/**
 * 查询横版视频作品的审核状态
 * @param cookie
 * @param publishId 发布产生的唯一publishId
 * @param maxPage 最大翻页数，超出后不再继续查询，默认10页
 */
export const getToutiaohaoVideoStatus = async (
  cookie: string,
  publishId: string,
  maxPage: number = 10,
): Promise<ToutiaohaoVideoStatusOutput> => {
  const result: ToutiaohaoVideoStatusOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };

  try {
    if (!maxPage) {
      maxPage = 1;
    }
    let contentList: ToutiaohaoVideoContentListResponse | undefined = undefined;
    for (let i = 0; i <= maxPage; i++) {
      //根据索引获取视频列表
      const offset = i * 20;
      contentList = await getVideoContentListResponse(cookie, offset, 1);

      if (contentList?.data?.ArticleList?.length) {
        for (const content of contentList.data.ArticleList) {
          const findId = content?.ItemId.toString();

          if (findId === publishId) {
            result.docId = findId;
            result.create_time = content.CreateTime;
            result.data = content;
            const mediaStatus = content.ArticleStatusText;
            switch (mediaStatus) {
              case '已发布':
                result.auditStatus = auditStatusEnum.published;
                break;
              case '未通过':
                result.auditStatus = auditStatusEnum.deny;
                break;
              case '仅我可见':
                result.auditStatus = auditStatusEnum.notPublic;
                break;
              case '待发布':
                result.auditStatus = auditStatusEnum.prePublish;
                break;
              default:
                result.auditStatus = auditStatusEnum.inAudit;
                break;
            }
            result.coverUrl = content.VideoData?.CoverUrl;
            if (result.auditStatus == auditStatusEnum.published) {
              result.openUrl = content.ShareUrl;
              if (!result.openUrl || !result.openUrl.startsWith('http')) {
                result.openUrl = `https://www.toutiao.com/item/${publishId}/`;
              }
            }
            return result;
          }
        }
      } else {
        const miniResult = await getToutiaohaoMiniVideoStatus(cookie, publishId);
        if (miniResult.docId) {
          result.docId = miniResult.docId;
          result.auditStatus = miniResult.auditStatus;
          result.create_time = miniResult.create_time;
          result.coverUrl = miniResult.coverUrl;
          result.openUrl = miniResult.openUrl;
          return result;
        }
        result.code = miniResult?.code ?? -1;
        result.msg = '未找到作品';
        break;
      }
    }
    result.code = contentList?.status ?? -1;
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

export interface ToutiaohaoArticleStatusOutput extends BaseResult {
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
   * 公开访问url
   */
  openUrl?: string;

  /**
   * 封面url
   */
  coverUrl?: string;

  data?: ToutiaohaoMediaContent;
}
export interface ToutiaohaoVideoStatusOutput extends BaseResult {
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
   * 公开访问url
   */
  openUrl?: string;

  /**
   * 封面url
   */
  coverUrl?: string;

  data?: ToutiaohaoVideoMediaContent;
}
export const getToutiaohaoDynamicStatus = async (
  cookie: string,
  publishId: string,
  userId: string,
  maxPage: number = 10,
): Promise<AuditResult> => {
  const result: AuditResult = {
    code: 0,
    msg: '',
    publishId: publishId,
  };

  try {
    if (!maxPage) {
      maxPage = 1;
    }
    if (!userId) {
      const userInfo = await getToutiaohaoUserInfo(cookie);
      userId = userInfo?.yixiaoerId ?? '';
    }
    let contentList: TouTiaoDynamicListResponse | undefined = undefined;
    for (let i = 0; i <= maxPage; i++) {
      //根据页码获取视频列表
      contentList = await getDynamicContentListAsync(cookie, userId, i, 10);

      if (contentList?.data?.length) {
        for (const content of contentList.data) {
          const findId = content?.assembleCell?.itemCell?.articleBase?.gidStr;

          if (findId === publishId) {
            result.docId = findId;
            result.create_time = content?.assembleCell?.itemCell?.articleBase?.publishTime;
            //result.data = content;
            const mediaStatus = content.assembleCell?.itemCell?.articleBase?.itemStatus;
            switch (mediaStatus) {
              case 10:
                result.auditStatus = auditStatusEnum.inAudit;
                break;
              case 20:
                result.auditStatus = auditStatusEnum.published;
                break;
              case 30:
                result.auditStatus = auditStatusEnum.deny;
                break;
              case 40:
                result.auditStatus = auditStatusEnum.notSuitableForPublicity;
                break;
              case 50:
                result.auditStatus = auditStatusEnum.prePublish;
                break;
              case 110:
                result.auditStatus = auditStatusEnum.customWithdrawn;
                break;
              default:
                result.auditStatus = auditStatusEnum.inAudit;
                break;
            }
            if (result.auditStatus == auditStatusEnum.published) {
              result.openUrl = content.assembleCell.itemCell.articleBase.articleURL;
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
/**
 * 获取视频话题
 * @param cookie
 * @param keyWord
 * @param pubContentType
 */
export const getToutiaohaoArticleTopiclist = async (
  cookie: string,
  keyWord: string,
  pubContentType: PubContentEnum = PubContentEnum.article,
): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: 'ok',
    dataList: [],
  };
  try {
    const placeListResult = await getArticleTopicResponse(
      cookie,
      keyWord,
      pubContentType === PubContentEnum.article ? 1 : 2,
    );

    result.code = placeListResult.code ?? errorCode.data_error;
    result.msg = placeListResult.message;
    if (placeListResult?.recents?.length) {
      result.dataList = placeListResult.recents.map((obj) => ({
        yixiaoerId: obj.id?.toString(),
        yixiaoerName: obj.word,
        //viewNum: parseInt(obj.talk_count)?parseInt(obj.talk_count):0,
        raw: obj,
      }));
    } else if (placeListResult?.hots?.length) {
      placeListResult.hots.forEach((obj) => {
        result.dataList?.push({ yixiaoerId: obj.id, yixiaoerName: obj.word, raw: obj });
      });
    } else if (keyWord) {
      const id = Date.now().toString();
      result.dataList?.push({
        yixiaoerId: id,
        yixiaoerName: keyWord,
        raw: { id: id, word: keyWord },
      });
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

export interface ToutiaohaoArticleTopicOutput {
  /**
   * 状态码,0:正常，非0异常
   */
  code: number;
  /**
   * 话题列表
   */
  data?: Array<ToutiaohaoArticleTopicInfo>;
  /**
   * 提示消息
   */
  msg?: string;
}

/**
 * 获取视频话题
 * @param cookie
 * @param keyWord
 */
export const getToutiaohaoVideoTopiclist = async (cookie: string, keyWord: string): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: 'ok',
    dataList: [],
  };
  try {
    const placeListResult = await getVideoTopicResponse(cookie, keyWord);

    result.code = placeListResult.code ?? errorCode.data_error;
    result.msg = placeListResult.message;
    if (placeListResult?.data?.length) {
      result.dataList = placeListResult.data.map((obj) => ({
        yixiaoerId: Guid.NewGuid().toString(),
        yixiaoerName: obj.hashtag_name,
        raw: obj,
      }));
    } else if (keyWord) {
      result.dataList?.push({
        yixiaoerId: Date.now().toString(),
        yixiaoerName: keyWord,
        raw: { hashtag_name: keyWord },
      });
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

export interface ToutiaohaoVideoTopicOutput {
  /**
   * 状态码,0:正常，非0异常
   */
  code: number;
  /**
   * 话题列表
   */
  data?: Array<string>;
  /**
   * 提示消息
   */
  msg?: string;
}

/**
 * 获取视频合集
 * @param cookie
 * @param offset 翻页参数，合集索引值，默认0开始
 */
export const getToutiaohaoVideoCollectionList = async (
  cookie: string,
  offset: number = 0,
): Promise<ToutiaohaoVideoCollectionOutput> => {
  const result: ToutiaohaoVideoCollectionOutput = {
    code: 0,
    msg: 'ok',
    data: [],
  };
  try {
    const collectionListResult = await getVideoCollectionResponse(cookie, offset);

    result.code = collectionListResult.status ?? errorCode.data_error;
    result.msg = collectionListResult.message;
    if (collectionListResult.data) {
      Object.keys(collectionListResult.data).forEach((key) => {
        const videoData = collectionListResult.data[key];
        videoData.collectionId = key;
        result.data?.push(videoData);
      });
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

export interface ToutiaohaoVideoCollectionOutput {
  /**
   * 状态码,0:正常，非0异常
   */
  code: number;
  /**
   * 合集列表
   */
  data?: Array<ToutiaohaoVideoCollectionInfo>;
  /**
   * 提示消息
   */
  msg?: string;
}

/**
 * 获取视频活动分类
 */
export const getToutiaohaoVideoActivityCategory = async (): Promise<Array<{ id: number; name: string }>> => {
  return [
    { id: 1, name: '推荐' },
    { id: 2, name: '生活' },
    { id: 3, name: '知识' },
    { id: 4, name: '影视' },
    { id: 5, name: '游戏' },
    { id: 6, name: '音乐' },
    { id: 7, name: '少儿' },
    { id: 8, name: '动漫' },
    { id: 9, name: '搞笑' },
    { id: 10, name: '美食' },
    { id: 11, name: '三农' },
  ];
};

/**
 * 获取视频活动列表
 * @param cookie
 * @param categoryName 默认值:'推荐'
 */
export const getToutiaohaoVideoActivityList = async (
  cookie: string,
  categoryName: string = '推荐',
): Promise<ToutiaohaoVideoActivityOutput> => {
  const result: ToutiaohaoVideoActivityOutput = {
    code: 0,
    msg: 'ok',
    data: [],
  };
  try {
    const activityListResult = await getVideoActivityResponse(cookie, categoryName ?? '推荐');

    result.code = activityListResult?.data?.Activities?.length > 0 ? 0 : errorCode.data_error;
    result.msg = activityListResult?.message;
    result.data = activityListResult?.data?.Activities;
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

export interface ToutiaohaoVideoActivityOutput {
  /**
   * 状态码,0:正常，非0异常
   */
  code: number;
  /**
   * 合集列表
   */
  data?: Array<ToutiaohaoVideoActivityInfo>;
  /**
   * 提示消息
   */
  msg?: string;
}

export const getToutiaohaoUserInfo = async (cookie: string, proxy?: IWebProxy): Promise<ToutiaohaoUserInfoOutput> => {
  const result: ToutiaohaoUserInfoOutput = {
    code: 0,
    msg: 'ok',
  };
  try {
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfoResult = await getUserInfoAsync(cookie, webProxy);

    result.yixiaoerId = userInfoResult?.data?.user?.id?.toString();
    result.yixiaoerName = userInfoResult?.data?.user?.screen_name?.toString();
    result.yixiaoerImageUrl = userInfoResult?.data?.user?.https_avatar_url?.toString();
    result.raw = userInfoResult?.data;
    result.code = userInfoResult.code;
    result.msg = userInfoResult.message;
    result.data = userInfoResult.data;
    if (userInfoResult?.data?.media.has_already_authentication === false) {
      result.verify = false;
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
    result.code = errorCode.exception;
  }

  return result;
};

export interface ToutiaohaoUserInfoOutput extends PlatformAuthorInfo {
  data?: {
    account_status_info: {
      authorize_uri_status: number;
      company_name_status: number;
      license_uri_status: number;
      media_qualification_status: number;
      overall_status: number;
      overall_status_with_institution: number;
      tip_type: number;
    };
    author_info: {
      column_attach_card_permission: number;
      media_impr_boost_pkg_permission: number;
      media_keep_bjh_permission: number;
      media_keep_bjh_personal_page: string;
      media_type: number;
      need_confirm_info_src: boolean;
      plog_genre: number;
      primary_classification: number;
    };
    creator_project_info: {
      creator_project_banned_flag: boolean;
      praise_count_remained: number;
    };
    grayscale_test_permission: number;
    media: {
      ad_cooperation_permission: number;
      allow_reaudit_count: number;
      article_media_level: number;
      audio_cp_permission: number;
      audio_mp_cp_role: number;
      audio_original_permission: number;
      audio_permission: number;
      audio_track_permission: number;
      audited_special_qualification: number;
      avoid_confirm_sms_permission: number;
      ban_income_module: boolean;
      breaking_news_permission: number;
      can_appeal_modify_mobile: number;
      can_modify_type: number;
      can_sync_aweme_tuwen: boolean;
      can_user_modify: boolean;
      cancel_custom_menu: number;
      category: string;
      circumvent_tax_agreement: number;
      circumvent_tax_permission: number;
      claim_origin_permission: boolean;
      claim_video_origin_permission: boolean;
      column_quintessence_permission: number;
      comic_permission: number;
      comic_share_card_permission: number;
      commission_level: string;
      community_card_permission: number;
      community_column_permission: number;
      community_paid_checkin: boolean;
      community_sync: number;
      complaint_black_draft_permission: number;
      complaint_no_need_auth_permission: number;
      confirm_result: string;
      create_time: string;
      creative_lab_permission: number;
      display_name: string;
      display_submit_ocr_tip: boolean;
      doctor_id: string;
      edu_channel_permission: number;
      email_pending_verify: boolean;
      extra_spell_check: number;
      fans_article_count_remained: number;
      fans_red_packet: number;
      flipchat_permission: number;
      force_modify_base_info_in_audit: boolean;
      force_modify_base_info_to_submit: boolean;
      force_ocr_in_audit: boolean;
      force_ocr_to_submit: boolean;
      from_ad: number;
      full_member_qualification_info: string;
      full_member_qualification_type: number;
      gov_type_name: string;
      has_abtest_permission: boolean;
      has_ad_permission: boolean;
      has_already_authentication: boolean;
      has_app_permission: boolean;
      has_avoid_bind_phone_permission: boolean;
      has_column_card_permission: number;
      has_column_permission: boolean;
      has_comment_2_fans_permission: boolean;
      has_deal_platform_permission: number;
      has_feed_insert_permission: number;
      has_film_review_permission: boolean;
      has_hide_comment_permission: boolean;
      has_live_permission: boolean;
      has_media_lab_permission: boolean;
      has_praise_permission: boolean;
      has_private_letter_permission: boolean;
      has_product_permission: boolean;
      has_qingyun_self_recommendation_permission: number;
      has_quote_hot_permission: number;
      has_referral_permission: boolean;
      has_rss_permission: boolean;
      has_set_external_cover_permission: number;
      has_shown_annual_review_2019: number;
      has_shown_impr_boost_pkg_protocol_on_editor: number;
      has_shown_ocr_notify_on_editor: number;
      has_shown_ocr_notify_onboard: number;
      has_spread_applied: boolean;
      has_third_party_ad_permission: boolean;
      has_toutiao_ad_permission: boolean;
      has_toutiao_store_permission: number;
      has_view_media_lab: boolean;
      has_weixin_permission: boolean;
      has_wenda_contract_permission: number;
      has_wqqs_permission: boolean;
      hide_inspiration_item: number;
      highest_category: string;
      hot_article_flag: number;
      https_avatar_url: string;
      https_display_avatar_url: string;
      id: number;
      id_str: string;
      impr_boost_pkg_permission: number;
      in_guidance_white_list: boolean;
      in_mobile_appeal: number;
      income_belong_to_primary_media: number;
      income_type: number;
      invalid_creative_way: boolean;
      invalid_quality_score: boolean;
      invalid_security_grade: boolean;
      is_enable: boolean;
      is_hotkeys_whitelist: number;
      is_low_media: number;
      is_new_register: boolean;
      is_silent: boolean;
      keep_wx_permission: number;
      limit_date: string;
      live_product_permission: number;
      manual_publish_ad: number;
      matrix_collection: number;
      matrix_manage_permission: boolean;
      matrix_only_primary_function: boolean;
      matrix_withdraw_income_permission: number;
      mcn_pay_column_permission: number;
      media_invite_register_permission: number;
      media_matrix_invite_permission: boolean;
      media_status_str: string;
      media_writing_space_status: number;
      modify_type_status: number;
      month_salary_10k_count: number;
      new_hand: boolean;
      no_check_modify_time_permission: number;
      normative_information_area: string;
      not_claim_origin_cnt: number;
      novel_serial_cp: number;
      novel_serial_person: number;
      novel_share_card_permission: number;
      ocr_status: number;
      origin_debut_check_pgc_gallery: boolean;
      origin_debut_check_pgc_normal: boolean;
      overseas_account: number;
      pay_column_permission: number;
      pay_live_permission: number;
      pay_wenda_permission: number;
      pgc_custom_menu_permission: boolean;
      praise_count_remained: number;
      primary_classification: string;
      professional_media_service: number;
      profit_delegation: number;
      public_sentiment_analyze_permission: number;
      retain_third_party_ad_when_buyout: number;
      rss_origin_permission: number;
      rumor_library_permission: number;
      search_task_permission: number;
      self_recommendation_remained: number;
      serial_freeze_withdraw: number;
      short_video_profit: number;
      short_video_relate_game: string;
      show_creation_btn: number;
      show_fans_advance_func: boolean;
      show_guidance_bubble: boolean;
      show_paid_column_tab: boolean;
      show_wenda_corner_sign: boolean;
      status: number;
      story_account: number;
      story_depress_whitelist: number;
      third_title_permission: number;
      tie_fans: boolean;
      tma_permission: number;
      tree_plan_permission: number;
      type: number;
      use_financial_stock_card_permission: number;
      video_copyright_permission: boolean;
      video_product_permission: number;
      visit_task_plaza: number;
      watermark: number;
      weibo_crawl_permission: number;
      white_sync_aweme: string;
      writing_race_2020_count: number;
      writing_race_count_remained: number;
      wx_content_source_bayout: number;
      xigua_media_level: number;
      xigua_yangshimeiti: number;
    };
    media_enum_info: {
      video_ai_title: number;
    };
    other_biz_info: {
      show_creation_task: boolean;
    };
    pii_info: {
      enhance_picboolean: boolean;
    };
    profile_completeness_info: {
      authorization_info: {
        detail: string;
        status: number;
      };
      company_name_info: {
        detail: string;
        status: number;
      };
      license_info: {
        detail: string;
        status: number;
      };
      news_media_qualification_info: {
        detail: string;
        status: number;
      };
    };
    tag_info: {
      article_modify_white: number;
    };
    user: {
      allow_modify_white: number;
      attach_card_column: number;
      author_benefit_gray: number;
      author_benefit_hot_gallery: number;
      author_benefit_pay_column: number;
      author_benefit_praise: number;
      author_benefit_video_praise: number;
      ban_status: number;
      breaking_news_permission: number;
      check_mobile_exemption: number;
      create_time: number;
      creator_project: number;
      draft_to_cloud: number;
      flipchat_sync: number;
      https_avatar_url: string;
      id: number;
      id_str: string;
      live_room_permission: number;
      overseas_account: number;
      punish_status: number;
      screen_name: string;
      thread_product_permission: boolean;
      user_auth_info: string;
    };
  };
}

/**
 *
 * @param cookie
 * @param days 1: 7天数据，2: 30天数据,3: 90天数据
 * @param proxy
 */
export const getToutiaohaoOverViewDashboard = async (
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
    { name: '总粉丝数', key: 'totalFansCount' },
    { name: '总阅读(播放)量', key: 'totalPlaysCount' },
    { name: '总作品量', key: 'totalWorksCount' },
    { name: '展现量', key: 'impressionCount' },
    { name: '阅读(播放)量', key: 'playCount' },
    { name: '粉丝展现量', key: 'fansImpressionCount' },
    { name: '点赞量', key: 'greatCount' },
    { name: '评论量', key: 'commentCount' },
    { name: '粉丝变化数', key: 'netFansCount' },
  ];

  try {
    let proxyAgent;
    if (proxy?.serverAdd) {
      proxyAgent = createKuaiProxyAgent(proxy);
    }
    const newOverView = {
      all: {
        overview: {},
        thirtydays: {},
      },
    };
    result.dataObj = newOverView as never;
    const fansData = await getUserStatisticAsync(cookie, proxyAgent);
    if (fansData?.code === 0 && fansData?.data?.statistic?.data) {
      result.data?.push({
        name: '总粉丝数',
        key: 'totalFansCount',
        value: formatNumber(parseInt(fansData.data?.statistic?.data?.fans_data?.total)),
        list: [],
      });
      result.data?.push({
        name: '总阅读(播放)量',
        key: 'totalPlaysCount',
        value: formatNumber(fansData.data?.statistic?.data?.total_read_play_count),
        list: [],
      });
      newOverView.all.overview['totalFansCount'] = formatNumberNo(
        parseInt(fansData.data?.statistic?.data?.fans_data?.total ?? '0'),
      );
      newOverView.all.overview['totalPlaysCount'] = formatNumberNo(
        parseInt(fansData.data?.statistic?.data?.total_read_play_count?.toString() ?? '0'),
      );
    } else {
      result.code = fansData?.code ?? -1;
      result.msg = fansData?.message ?? '';
      return result;
    }

    const content = await getContentListAsync(cookie, 1, 1, 8, proxyAgent);
    if (content.code === 0) {
      result.data?.push({
        name: '总作品量',
        key: 'totalWorksCount',
        value: formatNumber(content.total_count),
        list: [],
      });
      newOverView.all.overview['totalWorksCount'] = formatNumberNo(content.total_count);
    } else {
      result.code = content?.code ?? -1;
      result.msg = content?.message ?? '';
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

    const tiaoResult = await getToutiaohaoDataOverview(cookie, startTs, endTs, proxy);
    result.code = tiaoResult?.code;
    result.msg = tiaoResult?.msg ?? '';
    if (tiaoResult?.data) {
      if (tiaoResult?.data?.length > 0) {
        const totalData = tiaoResult.raw as ToutiaohaoDataOverviewResponse;
        //推荐
        let total = totalData.total_stat.consume_data.impression_count_new;
        const dataItem: DataColumn = {
          name: '展现量',
          key: 'impressionCount',
          value: formatNumber(total),
          list: [],
        };
        result.data?.push(dataItem);
        newOverView.all.overview[dataItem.key] = formatNumberNo(total);
        for (const item of tiaoResult?.data) {
          const dateStr = new Date(item.date).getTime();
          dataItem.list.push({ date: dateStr, value: item.author_stat.consume_data.impression_count_new });
        }
        newOverView.all.thirtydays[dataItem.key] = dataItem.list;

        total = totalData.total_stat.consume_data.go_detail_count_new;
        const dataItemplay: DataColumn = {
          name: '阅读(播放)量',
          key: 'playCount',
          value: formatNumber(total),
          list: [],
        };
        result.data?.push(dataItemplay);
        newOverView.all.overview[dataItemplay.key] = formatNumberNo(total);
        for (const item of tiaoResult?.data) {
          const dateStr = new Date(item.date).getTime();
          dataItemplay.list.push({ date: dateStr, value: item.author_stat.consume_data.go_detail_count_new });
        }
        newOverView.all.thirtydays[dataItemplay.key] = dataItemplay.list;

        total = totalData.total_stat.consume_data.fans_impression_count_new;
        const dataItemcomment: DataColumn = {
          name: '粉丝展现量',
          key: 'fansImpressionCount',
          value: formatNumber(total),
          list: [],
        };
        result.data?.push(dataItemcomment);
        newOverView.all.overview[dataItemcomment.key] = formatNumberNo(total);
        for (const item of tiaoResult?.data) {
          const dateStr = new Date(item.date).getTime();
          dataItemcomment.list.push({ date: dateStr, value: item.author_stat.consume_data.fans_impression_count_new });
        }
        newOverView.all.thirtydays[dataItemcomment.key] = dataItemcomment.list;

        total = totalData.total_stat.interaction_data.digg_count;
        const dataItemlike: DataColumn = {
          name: '点赞量',
          key: 'greatCount',
          value: formatNumber(total),
          list: [],
        };
        result.data?.push(dataItemlike);
        newOverView.all.overview[dataItemlike.key] = formatNumberNo(total);
        for (const item of tiaoResult?.data) {
          const dateStr = new Date(item.date).getTime();
          dataItemlike.list.push({ date: dateStr, value: item.author_stat.interaction_data.digg_count });
        }
        newOverView.all.thirtydays[dataItemlike.key] = dataItemlike.list;

        total = totalData.total_stat.interaction_data.comment_count;
        const dataItemcollect: DataColumn = {
          name: '评论量',
          key: 'commentCount',
          value: formatNumber(total),
          list: [],
        };
        result.data?.push(dataItemcollect);
        newOverView.all.overview[dataItemcollect.key] = formatNumberNo(total);
        for (const item of tiaoResult?.data) {
          const dateStr = new Date(item.date).getTime();
          dataItemcollect.list.push({ date: dateStr, value: item.author_stat.interaction_data.comment_count });
        }
        newOverView.all.thirtydays[dataItemcollect.key] = dataItemcollect.list;
      }
    }
    if (result.code != 0) {
      return result;
    }

    const fanResult = await getDataOverviewFansAsync(
      cookie,
      dayjs(startTs).format('YYYY-MM-DD'),
      dayjs(endTs).format('YYYY-MM-DD'),
    );
    result.code = fanResult.code ?? -1;
    result.msg = fanResult?.message;
    if (fanResult?.daily_fans_stats?.length) {
      //粉丝变化数
      let total = 0;
      fanResult?.daily_fans_stats.forEach((x) => (total += x.fans_stat.change_count));
      const dataItemFansChange: DataColumn = {
        name: '粉丝变化数',
        key: 'netFansCount',
        value: formatNumber(total),
        list: [],
      };
      result.data?.push(dataItemFansChange);
      newOverView.all.overview[dataItemFansChange.key] = formatNumberNo(total);
      for (const item of fanResult?.daily_fans_stats) {
        const dateStr = new Date(item.date).getTime();
        dataItemFansChange.list.push({ date: dateStr, value: item.fans_stat.change_count });
      }
      newOverView.all.thirtydays[dataItemFansChange.key] = dataItemFansChange.list;
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
 * 获取头条指定天数内，最多20条公开作品数据
 * @param cookie
 * @param type
 * @param eventCallBack
 * @param days
 * @param maxCount
 * @param isHeader
 * @param proxy
 */
export const getToutiaoContentListView = async (
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
      { name: '展现', key: 'reCommand' },
      { name: type === 'article' ? '阅读' : '播放', key: type === 'article' ? 'read' : 'play' },
      { name: '点赞', key: 'great' },
      { name: '评论', key: 'comment' },
    ];

    if (isHeader) {
      return result;
    }

    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }

    let userinfo: ToutiaohaoUserInfoResponse | null = null;
    if (type != 'miniVideo') {
      userinfo = await getUserInfoAsync(cookie, webProxy);
      if (userinfo?.code != 0) {
        result.code = userinfo?.code ?? -1;
        result.msg = userinfo?.message ?? '';
        return result;
      }
    }
    let miniCursor = parseInt((Date.now() / 1000).toFixed(0));
    const totalEndCursor = miniCursor;
    let contentTmpId = '';
    for (let i = 1; i < syncContentMaxPage; i++) {
      if (type === 'miniVideo') {
        const contentList = await getMiniVideoContentListResponse(cookie, miniCursor, totalEndCursor, 2, webProxy);
        if (contentList?.contents?.length) {
          if (contentList.contents[0].article_attr?.gid === contentTmpId) {
            break;
          } else {
            contentTmpId = contentList.contents[0].article_attr?.gid;
          }
          miniCursor = contentList.end_cursor;
          let j = 0;
          for (const item of contentList?.contents) {
            j++;
            // if (item.Archive.state === -50) {
            //   continue;
            // }
            const date = dayjs(item.article_attr.create_time * 1000).toDate();
            if (lastDate > date || result.data.length >= maxCount) {
              //前面可能会有三个置顶的
              if (j <= 3) {
                continue;
              }
              eventCallBack?.emit(syncContentEventName, { ...result });
              return result;
            }
            const dateStr = dayjs(date).format('YYYY-MM-DD HH:mm:ss');
            const coverJo = item.article_attr.cover_image;
            const dataItem = item.article_stat;
            const newItem: PlatformContentItem = {
              id: item.article_attr.gid.toString(),
              cover: coverJo.image_url,
              title: item.article_attr?.title ?? '',
              date: dateStr,
              reCommand: formatNumber(dataItem.impression_count),
              play: formatNumber(dataItem.play_count),
              great: formatNumber(dataItem.digg_count),
              comment: formatNumber(dataItem.comment_count),
              type: type,
            };
            const newItemNum: PlatformContentItemNum = {
              id: item.article_attr.gid.toString(),
              cover: coverJo.image_url,
              title: item.article_attr?.title ?? '',
              date: dateStr,
              reCommand: formatNumberNo(dataItem.impression_count),
              play: formatNumberNo(dataItem.play_count),
              great: formatNumberNo(dataItem.digg_count),
              comment: formatNumberNo(dataItem.comment_count),
              type: type,
            };
            newItem.pageUrl = `https://www.toutiao.com/video/${newItem.id}`;
            newItemNum.pageUrl = newItem.pageUrl;
            result.data.push(newItem);
            result.dataList.push(newItemNum);
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
            result.code = contentList?.code ?? -1;
            result.msg = contentList?.message ?? '';
          }
          break;
        }
      } else {
        const contentList = await getNewContentListAsync(
          cookie,
          i,
          10,
          userinfo?.data?.user?.id,
          2,
          type === 'video' ? 'mp_videos' : 'mp_article',
          webProxy,
        );
        if (contentList?.data?.length) {
          if (contentList.data[0].assembleCell?.itemCell?.articleBase?.gidStr === contentTmpId) {
            break;
          } else {
            contentTmpId = contentList.data[0].assembleCell?.itemCell?.articleBase?.gidStr;
          }
          let j = 0;
          for (const item of contentList?.data) {
            j++;
            // if (item.Archive.state === -50) {
            //   continue;
            // }
            const date = dayjs(item.assembleCell.itemCell.articleBase.publishTime * 1000).toDate();
            if (lastDate > date || result.data.length >= maxCount) {
              //前面可能会有三个置顶的
              if (j <= 3) {
                continue;
              }
              eventCallBack?.emit(syncContentEventName, { ...result });
              return result;
            }
            const dateStr = dayjs(date).format('YYYY-MM-DD HH:mm:ss');
            const coverJo = item.assembleCell.itemCell.imageList.staggerFeedCover;
            const dataItem = item.assembleCell.itemCell.itemCounter;
            const newItem: PlatformContentItem = {
              id: item.assembleCell.itemCell.articleBase.gidStr,
              cover: coverJo[0].url,
              title: item.assembleCell.itemCell.articleBase.title ?? '',
              date: dateStr,
              reCommand: formatNumber(dataItem.showCount),
              play: formatNumber(dataItem.videoWatchCount),
              read: formatNumber(dataItem.readCount),
              great: formatNumber(dataItem.diggCount),
              comment: formatNumber(dataItem.commentCount),
              type: type,
            };
            const newItemNum: PlatformContentItemNum = {
              id: item.assembleCell.itemCell.articleBase.gidStr,
              cover: coverJo[0].url,
              title: item.assembleCell.itemCell.articleBase.title ?? '',
              date: dateStr,
              reCommand: formatNumberNo(dataItem.showCount),
              play: formatNumberNo(dataItem.videoWatchCount),
              read: formatNumberNo(dataItem.readCount),
              great: formatNumberNo(dataItem.diggCount),
              comment: formatNumberNo(dataItem.commentCount),
              type: type,
            };
            newItem.pageUrl = `https://www.toutiao.com/${type === 'video' ? 'video' : 'article'}/${newItem.id}`;
            newItemNum.pageUrl = newItem.pageUrl;
            result.data.push(newItem);
            result.dataList.push(newItemNum);
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
            result.code = contentList?.errno === 20100 ? 0 : -1;
            result.msg = contentList?.message ?? '';
          }
          break;
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

/**
 * 删除作品
 * @param cookie
 * @param contentType
 * @param docId
 * @param isDraft
 */
export const deleteToutiaohaoContent = async (
  cookie: string,
  contentType: PubContentEnum,
  docId: string,
): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    if (contentType === PubContentEnum.video) {
      const deleteRe = await deleteMiniVideoContent(cookie, docId);
      if (deleteRe?.err_code === 0) {
        return result;
      }
      const token = cookie.split('xigua_csrf_token=')[1]?.split(';')[0];
      let deleteVideo = await deleteVideoContent(cookie, docId, token);
      if (deleteVideo?.code === 0) {
        return result;
      }
      if (deleteVideo?.csrfToekn) {
        cookie = cookie.replace('xigua_csrf_token', 'xigua_csrf_token_old');
        cookie = `${cookie};xigua_csrf_token=${deleteVideo.csrfToekn}`;
        deleteVideo = await deleteVideoContent(cookie, docId, deleteVideo.csrfToekn);
        if (deleteVideo?.code === 0) {
          return result;
        }
      }
      result.code = deleteVideo?.code ?? -1;
      result.msg = deleteRe?.message ?? '';
    } else if (contentType === PubContentEnum.article) {
      const deleteRe = await deleteArticleContent(cookie, docId);
      result.code = deleteRe?.code ?? -1;
      result.msg = deleteRe?.message ?? '';
    } else if (contentType === PubContentEnum.dynamic) {
      const deleteRe = await deleteTouTiaoMediaContent(cookie, docId);
      result.code = deleteRe?.code ?? -1;
      result.msg = deleteRe?.message ?? '';
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

export const getTouTiaoUserCanPubInfo = async (cookie: string, proxy?: IWebProxy): Promise<UserCanPublishInfo> => {
  const result: UserCanPublishInfo = {
    code: 0,
    msg: '',
    data: { status: 0 },
  };

  try {
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfo = await getUserStatusInfoAsync(cookie, webProxy);
    result.code = userInfo?.code ?? -1;
    result.msg = userInfo?.message ?? '';
    if (userInfo?.is_auth === false) {
      result.data = { status: UserStatus.unRealAuth, msg: '账号未完善账号信息，请打开头条号创作者中心完善后再试。' };
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
    result.code = errorCode.exception;
  }
  return result;
};

interface ToutiaohaoPublicAuthorSearchCard {
  data?: {
    id?: string;
    user_id?: string;
    media_id?: string;
    name?: string;
    screen_name?: string;
    avatar_url?: string;
    description?: string;
    verified_content?: string;
    verify_content?: string;
    follow_count?: number;
    share_url?: string;
    source_url?: string;
    aladdin_doc?: {
      search_result_id?: string;
      items?: Array<{
        doc_url?: string;
        search_result_id?: string;
      }>;
    };
    cell_type?: number;
    template_key?: string;
  };
}

const decodeToutiaohaoPublicHtmlText = (value: string): string => {
  return value
    .replace(/&#x([0-9a-fA-F]+);/g, (_match, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
};

const parseToutiaohaoPublicAuthorSearchCard = (
  card: ToutiaohaoPublicAuthorSearchCard,
): PlatformPublicAuthorInfo | undefined => {
  const item = card?.data;
  if (!item || (item.template_key !== '26-user_cluster' && item.cell_type !== 60)) {
    return undefined;
  }
  const extAuthorId = (item.user_id || item.id || item.media_id || '').toString();
  if (!extAuthorId) {
    return undefined;
  }
  const searchResultId = item.aladdin_doc?.search_result_id ?? item.aladdin_doc?.items?.[0]?.search_result_id ?? '';
  const autIndex =
    item.aladdin_doc?.items?.[0]?.doc_url ||
    item.share_url ||
    (item.id ? `https://www.toutiao.com/c/user/${item.id}/` : `https://www.toutiao.com/c/user/${extAuthorId}/`);
  const autSpiUrl = new URLSearchParams({
    user_id: item.user_id ?? '',
    media_id: item.media_id ?? '',
  }).toString();

  return {
    platform_code: PublicAuthorPlatformCode.TouTiaoHao,
    ext_author_id: extAuthorId,
    nickname: decodeToutiaohaoPublicHtmlText(item.screen_name || item.name || ''),
    avatar_url: item.avatar_url ?? '',
    description: decodeToutiaohaoPublicHtmlText(item.description || item.verified_content || item.verify_content || ''),
    aut_index: autIndex,
    aut_spi_url: undefined, // autSpiUrl,
    follower_count: Number(item.follow_count ?? 0),
    total_views: 0,
    total_comments: 0,
    total_likes: 0,
    work_count: 0,
  };
};

/**
 * 解析头条号公开作者搜索 HTML
 * @param html 头条号公开搜索页 HTML
 */
export const parseToutiaohaoPublicAuthorSearchHtml = (html: string): Array<PlatformPublicAuthorInfo> => {
  const result: Array<PlatformPublicAuthorInfo> = [];
  const exists = new Set<string>();
  const cardReg =
    /<script\b(?=[^>]*data-druid-card-data-id=)(?=[^>]*type="application\/json")[^>]*>([\s\S]*?)<\/script>/g;
  let match: RegExpExecArray | null;
  while ((match = cardReg.exec(html))) {
    try {
      const card = JSON.parse(match[1].trim()) as ToutiaohaoPublicAuthorSearchCard;
      const author = parseToutiaohaoPublicAuthorSearchCard(card);
      if (!author || exists.has(author.ext_author_id)) {
        continue;
      }
      exists.add(author.ext_author_id);
      result.push(author);
    } catch (e) {
      continue;
    }
  }
  return result;
};

/**
 * 搜索头条号公开作者列表
 * @param keyWord 搜索关键词
 * @param cookie 为空时使用抓包中的公开搜索默认 cookie
 * @param nextPage 下一页参数，当前仅支持第一页
 * @param proxy 代理
 */
export const searchToutiaohaoPublicAuthorList = async (
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
    const html = await getToutiaohaoPublicAuthorSearchHtml(cookie, keyWord, webProxy);
    result.dataList = parseToutiaohaoPublicAuthorSearchHtml(html);
    //result.raw = html;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = '请求头条号作者搜索失败';
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = '解析头条号作者搜索结果失败';
    } else {
      result.msg = '头条号作者搜索失败';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};
