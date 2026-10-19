import { BaseResult } from '../baseResult';
import { QiehaoMediaContent, getContentListAsync, QiehaoContentListResponse } from './qiehao-content-list.service';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import {
  getDataOverviewArticleAsync,
  getDataOverviewArticleListAsync,
  getDataOverviewFansAsync,
  getDataOverviewVideoAsync,
  getDataOverviewVideoListAsync,
  getSingleDataOverviewAsync,
  getSingleDataOverviewStatisticAsync,
  getTotalStatic,
  QiehaoDataOverviewArticleMediaContent,
  QiehaoDataOverviewVideoMediaContent,
  VideoTotalStatisticDetail,
} from './qiehao-data-overview.service';
import { getUserHomeDataAsync, getUserInfoAsync } from './qiehao-user.service';
import { getHotEventListAsync } from './qiehao-hotevents.service';
import { getArticleCategoryListResponse, getCategoryListAsync, QiehaoArticleCategory } from './qiehao-category.service';
import { getActivityListAsync, QiehaoActivityInfo } from './qiehao-activity.service';
import { auditStatusEnum, formatNumber, formatNumberNo, Task } from '../../utils';
import {
  ListItemInfoLevel,
  ListLevelInfoResponse,
  MediaStatusResultOutput,
  PlatformAuthorInfo,
  PlatformContentItem,
  PlatformContentItemNum,
} from '../baseModel';
import { createKuaiProxyAgent, IWebProxy, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import {
  AccountContentListViewOutPut,
  AccountReportDataOutPut,
  syncContentEventName,
} from '@/media-platform/data-service';
import { HttpsProxyAgent } from 'https-proxy-agent';
import dayjs from 'dayjs';
import { EventEmitter } from 'events';
import { PubContentEnum } from '@/cloud/model/TypeEnum';
import { deleteContent, deleteContentVideoSource } from '@/media-platform/qiehao/qiehao-content-delete.service';

/**
 * 企鹅号内容管理
 * @param cookie
 * @param category 数据状态（‘’：全部，‘published_new’：已发布，‘notpass’：未通过，‘draft_new’：草稿，‘schedule’：待发布）
 * @param pageSize 每页数量
 * @param refreshField 分页时间字符串（当前页最后一条数据中的pub_time）
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @param contentType 数据类型 此参数不传为全部（0: 图文， 1：组图，56：视频，92：视频合辑）
 */
export const getQiehaoContentList = async (
  cookie: string,
  category: '' | 'published_new' | 'notpass' | 'draft_new' | 'schedule' = '',
  pageSize: number,
  refreshField: string,
  startDate?: Date,
  endDate?: Date,
  contentType?: number,
) => {
  const result: QiehaoContentListOutput = {
    code: 0,
    msg: '',
  };

  try {
    let start_date_str = '';
    if (startDate) {
      start_date_str = startDate.toISOString();
      if (start_date_str.length > 0) {
        start_date_str = start_date_str.slice(0, 10);
      }
    }

    let end_date_str = '';

    if (endDate) {
      end_date_str = endDate.toISOString();
      if (end_date_str.length > 0) {
        end_date_str = end_date_str.slice(0, 10);
      }
    }

    const contentListResult = await getContentListAsync(
      cookie,
      category,
      pageSize,
      refreshField,
      start_date_str,
      end_date_str,
      contentType,
    );

    result.code = contentListResult.response.code;
    result.msg = contentListResult.response.msg;
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

export interface QiehaoContentListOutput extends BaseResult {
  data?: {
    articles: Array<QiehaoMediaContent>;
    cost: number;
    totalNumber: number;
  };

  raw?: unknown;
}

/**
 * 企鹅号数据总览视频分析
 * @param cookie
 * @param start_date 开始日期 Date
 * @param end_date 结束日期 Date
 */
export const getQiehaoDataOverviewVideo = async (cookie: string, start_date: Date, end_date: Date) => {
  const result: QiehaoDataOverviewVideoOutput = {
    code: 0,
    msg: '',
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

    const dataOverviewVideoResult = await getDataOverviewVideoAsync(cookie, start_date_str, end_date_str);

    result.code = dataOverviewVideoResult.response.code;
    result.msg = dataOverviewVideoResult.response.msg;
    result.data = dataOverviewVideoResult.data;
    result.raw = dataOverviewVideoResult;
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

export interface QiehaoDataOverviewVideoOutput extends BaseResult {
  data?: {
    app_statistic: string;

    /**
     * 统计数据（json字符串）
     */
    statistic: string;

    /**
     * 表格数据（json字符串）
     */
    tableStatistic: string;
  };

  raw?: unknown;
}

/**
 * 企鹅号数据总览图文分析
 * @param cookie
 * @param start_date 开始日期 Date
 * @param end_date 结束日期 Date
 */
export const getQiehaoDataOverviewArticle = async (cookie: string, start_date: Date, end_date: Date) => {
  const result: QiehaoDataOverviewArticleOutput = {
    code: 0,
    msg: '',
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

    const dataOverviewArticleResult = await getDataOverviewArticleAsync(cookie, start_date_str, end_date_str);

    result.code = dataOverviewArticleResult.response.code;
    result.msg = dataOverviewArticleResult.response.msg;
    result.data = dataOverviewArticleResult.data;
    result.raw = dataOverviewArticleResult;
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

export interface QiehaoDataOverviewArticleOutput extends BaseResult {
  data?: {
    app_statistic: string;

    /**
     * 统计数据（json字符串）
     */
    statistic: string;

    /**
     * 表格数据（json字符串）
     */
    tableStatistic: string;
  };

  raw?: unknown;
}

/**
 * 企鹅号数据总览粉丝数据分析
 * @param cookie
 * @param start_date 开始日期 Date
 * @param end_date 结束日期 Date
 */
export const getQiehaoDataOverviewFans = async (cookie: string, start_date: Date, end_date: Date) => {
  const result: QiehaoDataOverviewFansOutput = {
    code: 0,
    msg: '',
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

    result.code = dataOverviewFansResult.response.code;
    result.msg = dataOverviewFansResult.response.msg;
    result.data = dataOverviewFansResult.data;
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

export interface QiehaoDataOverviewFansOutput extends BaseResult {
  data?: {
    app_statistic: string;

    /**
     * 统计数据（json字符串）
     */
    statistic: string;

    /**
     * 表格数据（json字符串）
     */
    tableStatistic: string;
  };

  raw?: unknown;
}

/**
 * 企鹅号视频单篇列表
 * @param cookie
 * @param page 页码 默认1
 * @param pageSize 每页数量 默认10
 */
export const getQiehaoDataOverviewVideoList = async (cookie: string, page: number = 1, pageSize: number = 10) => {
  const result: QiehaoDataOverviewVideoListOutput = {
    code: 0,
    msg: '',
  };

  try {
    const dataOverviewVideoListResult = await getDataOverviewVideoListAsync(cookie, page, pageSize);

    result.code = dataOverviewVideoListResult.response.code;
    result.msg = dataOverviewVideoListResult.response.msg;
    result.data = dataOverviewVideoListResult.data;
    result.raw = dataOverviewVideoListResult;
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

export interface QiehaoDataOverviewVideoListOutput extends BaseResult {
  data?: {
    list: Array<QiehaoDataOverviewVideoMediaContent>;
    pageInfo: {
      /**
       * 当前页码
       */
      page: number;

      /**
       * 每页数量
       */
      limit: number;

      /**
       * 总数量
       */
      total: number;
    };
  };

  raw?: unknown;
}

/**
 * 企鹅号图文单篇列表
 * @param cookie
 * @param page 页码 默认1
 * @param pageSize 每页数量 默认10
 */
export const getQiehaoDataOverviewArticleList = async (cookie: string, page: number = 1, pageSize: number = 10) => {
  const result: QiehaoDataOverviewArticleListOutput = {
    code: 0,
    msg: '',
  };

  try {
    const dataOverviewArticleListResult = await getDataOverviewArticleListAsync(cookie, page, pageSize);

    result.code = dataOverviewArticleListResult.response.code;
    result.msg = dataOverviewArticleListResult.response.msg;
    result.data = dataOverviewArticleListResult.data;
    result.raw = dataOverviewArticleListResult;
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

export interface QiehaoDataOverviewArticleListOutput extends BaseResult {
  data?: {
    list: Array<QiehaoDataOverviewArticleMediaContent>;
    pageInfo: {
      /**
       * 当前页码
       */
      page: number;

      /**
       * 每页数量
       */
      limit: number;

      /**
       * 总数量
       */
      total: number;
    };
  };

  raw?: unknown;
}

/**
 * 用户首页数据
 * @param cookie
 */
export const getQiehaoUserHomeData = async (cookie: string, proxy?: KuaiDaiLiProxy) => {
  const result: QiehaoUserHomeDataOutput = {
    code: 0,
    msg: '',
  };

  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userHomeDataResult = await getUserHomeDataAsync(cookie, webProxy);

    result.code = userHomeDataResult?.response?.code ?? -1;
    result.msg = userHomeDataResult?.response?.msg;
    result.data = userHomeDataResult?.data;
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

export interface QiehaoUserHomeDataOutput extends BaseResult {
  data?: {
    /**
     * 昵称
     */
    name: string;

    /**
     * 封面
     */
    avatar: string;

    /**
     * 累计阅读量
     */
    pv: number;

    /**
     * 粉丝数
     */
    subscriberCount: number;

    /**
     * 累计播放量
     */
    vv: number;

    /**
     * 累计收益
     */
    totalIncome: number;
  };

  raw?: unknown;
}

/**
 * 企鹅号单篇统计数据
 * @param cookie
 * @param articleId 作品id
 */
export const getQiehaoSingleDataOverviewStatistic = async (
  cookie: string,
  articleId: string,
): Promise<QiehaoSingleDataOverviewStatisticOutput> => {
  const result: QiehaoSingleDataOverviewStatisticOutput = {
    code: 0,
    msg: '',
  };

  try {
    const singleStatisticDataResult = await getSingleDataOverviewStatisticAsync(cookie, articleId);

    result.code = singleStatisticDataResult.response.code;
    result.msg = singleStatisticDataResult.response.msg;
    result.data = singleStatisticDataResult.data;
    result.raw = singleStatisticDataResult;
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

export interface QiehaoSingleDataOverviewStatisticOutput extends BaseResult {
  data?: {
    statistic: {
      /**
       * 总播放量
       */
      playvv: string;

      /**
       * 播放完成率
       */
      aver_complete_rate: string;

      /**
       * 作品地址
       */
      Furl: string;
      Fuser_id: string;

      /**
       * 封面地址
       */
      Fimgurl: string;
      Fpub_flag: string;
      Fcan_redirect: string;
      Ftype: string;

      /**
       * 作品id
       */
      Farticle_id: string;
      Falt_time: string;

      /**
       * 平均播放时长（秒）
       */
      aver_time_long: string;

      /**
       * 总评论数
       */
      commentvv: string;

      /**
       * 总点赞数
       */
      likevv: string;

      /**
       * 总分享数
       */
      relayvv: string;
      Fhighlight: string;

      /**
       * 标题
       */
      Ftitle: string;

      /**
       * 发布时间
       */
      Fpub_time: string;
      Fsource: string;
    };
  };

  raw?: unknown;
}

/**
 * 企鹅号单篇作品报表数据
 * @param cookie
 * @param articleId 作品id
 * @param start_date 开始日期 Date
 * @param end_date 结束如期 Date
 */
export const getQiehaoSingleDataOverview = async (
  cookie: string,
  articleId: string,
  start_date: Date,
  end_date: Date,
) => {
  const result: QiehaoSingleDataOverviewOutput = {
    code: 0,
    msg: '',
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

    const dataOverviewFansResult = await getSingleDataOverviewAsync(cookie, articleId, start_date_str, end_date_str);

    result.code = dataOverviewFansResult.response.code;
    result.msg = dataOverviewFansResult.response.msg;
    result.data = dataOverviewFansResult.data;
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

export interface QiehaoSingleDataOverviewOutput extends BaseResult {
  data?: {
    tableStatistic: Array<{
      /**
       * 播放完成率
       */
      aver_complete_rate: string;

      /**
       * 平均播放时长（秒）
       */
      aver_time_long: string;

      /**
       * 评论数
       */
      commentvv: string;

      /**
       * 点赞数
       */
      likevv: string;

      /**
       * 分享数
       */
      relayvv: string;

      /**
       * 日期
       */
      imp_date: string;

      /**
       * 播放量
       */
      playvv: string;
    }>;
  };

  raw?: unknown;
}

/**
 * 企鹅号热门事件列表
 * @param cookie
 * @param keyword
 * @param page
 * @param limit
 */
export const getQiehaoHotEvents = async (
  cookie: string,
  keyword: string,
  page: number = 1,
  limit: number = 20,
): Promise<QiehaoHotEventsOutput> => {
  const result: QiehaoHotEventsOutput = {
    code: 0,
    msg: '',
  };

  try {
    const hotEventsResult = await getHotEventListAsync(cookie, keyword, page, limit);

    if (hotEventsResult?.code) {
      result.code = hotEventsResult.code;
      result.msg = hotEventsResult.msg;
    } else {
      result.data = hotEventsResult.list;
      result.total = hotEventsResult.total;
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

export interface QiehaoHotEventsOutput extends BaseResult {
  data?: Array<{
    id: number;
    event_id: string;
    name: string;
    heat: number;
    article_scope: number;
    imgurl: string;
    title: string;
    url: string;
    event_level: string;
    heat_data: {
      is_new: number;
      is_hot: number;
      is_boom: number;
    };
    article_scope_type: string;
    start_time: string;
    scarcity_icon: string;
    scarcity_desc: string;
    event_abstract: string;
  }>;
  total?: number;
}

/**
 * 企鹅号分类
 * @param cookie
 */
export const getQiehaoVideoCategory = async (cookie: string): Promise<QiehaoVideoCategoryOutput> => {
  const result: QiehaoVideoCategoryOutput = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    const categoryResult = await getCategoryListAsync(cookie);

    result.code = categoryResult.response.code;
    result.msg = categoryResult.response.msg;
    if (categoryResult.data?.length) {
      let i = 0;
      for (const item of categoryResult.data) {
        i++;
        const firstCate: ListItemInfoLevel = {
          yixiaoerId: i.toString() ?? '',
          yixiaoerName: item.cat,
        };
        if (item.subcats.length) {
          firstCate.child = [];
          let j = 0;
          for (const child of item.subcats) {
            j++;
            firstCate.child?.push({
              yixiaoerId: j.toString() ?? '',
              yixiaoerName: child,
            });
          }
        }
        item.subcats = [];
        result.dataList?.push(firstCate);
      }
    }
    result.data = categoryResult.data;
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

export interface QiehaoVideoCategoryOutput extends ListLevelInfoResponse {
  data?: Array<{
    cat: string;
    subcats: Array<string>;
  }>;
}
/**
 * 企鹅号分类
 * @param cookie
 */
export const getQiehaoArticleCategory = async (cookie: string): Promise<QiehaoArticleCategoryOutput> => {
  const result: QiehaoArticleCategoryOutput = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    const categoryResult = await getArticleCategoryListResponse(cookie);

    result.code = categoryResult.response.code;
    result.msg = categoryResult.response.msg;
    if (result.data?.length) {
      for (const item of result.data) {
        const firstCate: ListItemInfoLevel = {
          yixiaoerId: item.id?.toString() ?? '',
          yixiaoerName: item.name,
        };
        firstCate.raw = item;
        result.dataList?.push(firstCate);
      }
    }
    result.data = categoryResult.data;
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
export interface QiehaoArticleCategoryOutput extends ListLevelInfoResponse {
  data?: Array<QiehaoArticleCategory>;
}

/**
 * 企鹅号活动列表
 * @param cookie
 * @param page 页码
 * @param limit 每页数量
 */
export const getQiehaoActivity = async (
  cookie: string,
  page: number = 1,
  limit: number = 10,
): Promise<QiehaoActivityOutput> => {
  const result: QiehaoActivityOutput = {
    code: 0,
    msg: '',
  };

  try {
    const activityResult = await getActivityListAsync(cookie, page, limit);

    result.code = activityResult.response.code;
    result.msg = activityResult.response.msg;
    result.data = activityResult.data;
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

export interface QiehaoActivityOutput extends BaseResult {
  data?: {
    info: Array<QiehaoActivityInfo>;
    total: number;
    page: number;
  };
}

/**
 * 企鹅号视频状态
 * @param cookie
 * @param publishId 发布id
 * @param maxPage 最大页码
 */
export const getQiehaoVideoStatus = async (
  cookie: string,
  publishId: string,
  maxPage: number = 10,
): Promise<QiehaoVideoStatusOutput> => {
  const result: QiehaoVideoStatusOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };

  try {
    if (!maxPage) {
      maxPage = 1;
    }
    let refreshField = '';
    let contentList: QiehaoContentListResponse | undefined = undefined;
    for (let i = 0; i <= maxPage; i++) {
      //根据页码获取视频列表
      contentList = await getContentListAsync(cookie, '', i, refreshField, '', '', 56);

      if (contentList?.data?.articles?.length) {
        for (const content of contentList.data.articles) {
          const findId = content?.article_id?.toString();

          if (findId === publishId) {
            result.docId = `${findId}_${content.vid}`;
            result.create_time = new Date(content.pub_time).getTime();
            result.data = content;
            const mediaStatus = content?.status;
            switch (mediaStatus) {
              case '0':
                result.auditStatus = auditStatusEnum.draft;
                break;
              case '7':
                result.auditStatus = auditStatusEnum.inAudit;
                break;
              case '1':
                result.auditStatus = auditStatusEnum.published;
                break;
              case '3':
                result.auditStatus = auditStatusEnum.deny;
                break;
              case '4':
                result.auditStatus = auditStatusEnum.prePublish;
                break;
              default:
                result.auditStatus = auditStatusEnum.inAudit;
                break;
            }
            result.openUrl = content.url;
            return result;
          }
          refreshField = content.pub_time;
        }
      } else {
        result.code = contentList?.response?.code ?? -1;
        result.msg = '未找到作品';
        return result;
      }
    }
    result.code = contentList?.response?.code ?? -1;
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
 * 企鹅号文章状态
 * @param cookie
 * @param publishId 发布id
 * @param maxPage 最大页码
 */
export const getQiehaoArticleStatus = async (
  cookie: string,
  publishId: string,
  maxPage: number = 10,
): Promise<QiehaoVideoStatusOutput> => {
  const result: QiehaoVideoStatusOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };

  try {
    if (!maxPage) {
      maxPage = 1;
    }
    let refreshField = '';
    let contentList: QiehaoContentListResponse | undefined = undefined;
    for (let i = 0; i <= maxPage; i++) {
      //根据页码获取视频列表
      contentList = await getContentListAsync(cookie, '', i, refreshField, '', '', 0);

      if (contentList?.data?.articles?.length) {
        for (const content of contentList.data.articles) {
          const findId = content?.article_id?.toString();

          if (findId === publishId) {
            result.docId = findId;
            result.create_time = new Date(content.date).getTime();
            result.data = content;
            const mediaStatus = content?.status;
            switch (mediaStatus) {
              case '0':
                result.auditStatus = auditStatusEnum.draft;
                break;
              case '7':
                result.auditStatus = auditStatusEnum.inAudit;
                break;
              case '1':
                result.auditStatus = auditStatusEnum.published;
                break;
              case '3':
                result.auditStatus = auditStatusEnum.deny;
                break;
              case '4':
                result.auditStatus = auditStatusEnum.prePublish;
                break;
              default:
                result.auditStatus = auditStatusEnum.inAudit;
                break;
            }
            result.openUrl = content.url;
            return result;
          }
          refreshField = content.pub_time;
        }
      } else {
        result.code = contentList?.response?.code ?? -1;
        result.msg = '未找到作品';
        return result;
      }
    }
    result.code = contentList?.response?.code ?? -1;
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
export interface QiehaoVideoStatusOutput extends MediaStatusResultOutput {
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
   * 视频信息
   */
  data?: QiehaoMediaContent;
}

/**
 * 企鹅号用户信息
 * @param cookie
 * @param proxy
 */
export const getQiehaoUserInfo = async (cookie: string, proxy?: IWebProxy): Promise<QiehaoUserInfoOutput> => {
  const result: QiehaoUserInfoOutput = {
    code: 0,
    msg: '',
  };

  try {
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfoResult = await getUserInfoAsync(cookie, webProxy);

    result.yixiaoerId = userInfoResult?.data?.cpInfo?.mediaid?.toString();
    result.yixiaoerName = userInfoResult?.data?.cpInfo?.medianame?.toString();
    result.yixiaoerImageUrl = userInfoResult?.data?.cpInfo?.header?.toString();
    result.raw = userInfoResult?.data;
    result.code = userInfoResult?.response?.code ?? userInfoResult?.code;
    result.msg = userInfoResult?.response?.msg ?? userInfoResult?.msg;
    result.data = userInfoResult?.data ?? userInfoResult;
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

export interface QiehaoUserInfoOutput extends PlatformAuthorInfo {
  data?: {
    whitelist: {
      '10354': number;
      '10357': number;
      '10436': number;
      doubleTitle: number;
      rose_live: number;
      rose_live_pay: number;
      rtmp: number;
      sametitle: number;
      pic_nocheck: number;
      novel: number;
      howto: number;
      gongyi: number;
      suspectedblacklist: number;
      sports_category: number;
      weseeredpacket: number;
      rss: number;
      MMSCrawl: number;
      gaoxiaobaimingdan: number;
    };
    cpInfo: {
      influenceOrigin: string;
      /**
       * 账号id
       */
      mediaid: string;
      /**
       * 账号昵称
       */
      medianame: string;
      mediaLevel: string;
      mediaStatus: string;
      videoOrigin: string;
      mediaVCGStatus: string;
      omuin: string;
      qq_openid: string;
      isBindedQQ: false;
      wechat: string;
      golden_penguin_club: string;
      formal_status: string;
      /**
       * 头像
       */
      header: string;
      high_quality_pic: string;
      ugc_type: string;
      high_quality_video: string;
      accounttype: string;
      influence_category: string;
      mobile: string;
      maxcategoryid: string;
      category: string;
      ugc_status: string;
      weishi_quality: string;
      base_level_pic: string;
      punishtime: string;
      ugc_submittime: string;
      base_level_video: string;
      high_quality_small_video: string;
      heichanscore: string;
      copyright_content_creation: string;
      origin_statement: string;
      originalapply: string;
      ugc_formaltime: string;
      originalstatus: string;
      special_pub_num: string;
    };
  };
}

/**
 *
 * @param cookie
 * @param days 1: 7天数据，2: 30天数据,3: 90天数据
 * @param type video:视频 dynamic:图文
 * @param proxy
 */
export const getQieHaoOverViewDashboard = async (
  cookie: string,
  days: 1 | 2 | 3 = 2,
  type: 'video' | 'article',
  proxy?: KuaiDaiLiProxy,
): Promise<AccountReportDataOutPut> => {
  const result: AccountReportDataOutPut = {
    code: 0,
    msg: '',
    data: [],
  };

  const names =
    type === 'video'
      ? [
          { name: '累计阅读量', key: 'totalReadsCount' },
          { name: '累计播放量', key: 'totalPlaysCount' },
          { name: '粉丝量', key: 'totalFansCount' },
          { name: '播放量', key: 'playCount' },
          { name: '点赞量', key: 'likeCount' },
          { name: '评论量', key: 'commentCount' },
          { name: '分享量', key: 'shareCount' },
        ]
      : [
          { name: '累计阅读量', key: 'totalReadsCount' },
          { name: '累计播放量', key: 'totalPlaysCount' },
          { name: '粉丝量', key: 'totalFansCount' },
          { name: '阅读量', key: 'readCount' },
          { name: '点赞量', key: 'likeCount' },
          { name: '评论量', key: 'commentCount' },
          { name: '分享量', key: 'shareCount' },
        ];

  try {
    const newOverView = {
      all: {
        overview: {},
        thirtydays: {},
      },
      video: {
        overview: {},
        thirtydays: {},
      },
      article: {
        overview: {},
        thirtydays: {},
      },
    };
    result.dataObj = newOverView as never;
    //累计阅读量、累计播放量、粉丝量
    const fansData = await getQiehaoUserHomeData(cookie, proxy);
    if (fansData?.data?.name != undefined) {
      result.data?.push({
        name: '累计阅读量',
        key: 'totalReadsCount',
        value: formatNumber(fansData?.data?.vv),
        list: [],
      });
      result.data?.push({
        name: '累计播放量',
        key: 'totalPlaysCount',
        value: formatNumber(fansData?.data?.pv),
        list: [],
      });
      result.data?.push({
        name: '粉丝量',
        key: 'totalFansCount',
        value: formatNumber(fansData?.data?.subscriberCount),
        list: [],
      });
      newOverView.all.overview['totalReadsCount'] = formatNumberNo(fansData?.data?.vv);
      newOverView.all.overview['totalPlaysCount'] = formatNumberNo(fansData?.data?.pv);
      newOverView.all.overview['totalFansCount'] = formatNumberNo(fansData?.data?.subscriberCount);
    } else {
      result.code = fansData?.code ?? errorCode.data_error;
      throw new Error(fansData?.msg ?? '未获取到数据');
    }

    //视频分析:累计阅读量,累计播放量,粉丝量,播放量,播放视频数,播放完成率,平均播放时长(分钟),点赞量,评论量,分享量
    // 图文分析:累计阅读量,累计播放量,粉丝量,阅读量,阅读篇数,阅读完成率,点赞量,评论量,分享量
    const now = new Date();
    let startTs = new Date(now.setDate(now.getDate() - 29));
    if (days === 1) {
      startTs = new Date(now.setDate(now.getDate() - 7));
    } else if (days === 3) {
      startTs = new Date(now.setDate(now.getDate() - 90));
    }

    const endNow = new Date();

    const startDate = dayjs()
      .add(days === 2 ? -31 : -91, 'days')
      .format('YYYY-MM-DD');
    const endDate = dayjs(new Date()).format('YYYY-MM-DD');
    if (type === 'video') {
      const reportData = await getDataOverviewVideoAsync(cookie, startDate, endDate);
      if (reportData?.data?.tableStatistic) {
        const dataDetailStr = JSON.parse(reportData.data?.tableStatistic) as Array<QieEDailyDataItem>;
        if (dataDetailStr?.length) {
          const dataDetailNumObj = dataDetailStr.map((obj) => ({
            comment: parseInt(obj.comment),
            flow: parseInt(obj.flow),
            imp_date: obj.imp_date,
            like: parseInt(obj.like),
            relay: parseInt(obj.relay),
          }));
          const dateMap: Map<string, number> = new Map();
          dataDetailNumObj.forEach((obj) => {
            dateMap.set(obj.imp_date, new Date(obj.imp_date).getTime());
          });

          let total = formatNumberNo(
            dataDetailNumObj
              .map((obj) => obj.flow)
              .filter((num) => typeof num === 'number' && !isNaN(num))
              .reduce((acc, num) => acc + num, 0),
          );
          const play = {
            name: '播放量',
            key: 'playCount',
            value: formatNumber(total),
            list: dataDetailNumObj.map((obj) => ({
              date: dateMap.get(obj.imp_date) ?? new Date(obj.imp_date).getTime(),
              value: obj.flow,
            })),
          };
          result.data?.push(play);
          newOverView.video.overview[play.key] = total;
          newOverView.video.thirtydays[play.key] = play.list;

          total = formatNumberNo(
            dataDetailNumObj
              .map((obj) => obj.comment)
              .filter((num) => typeof num === 'number' && !isNaN(num))
              .reduce((acc, num) => acc + num, 0),
          );
          const comment = {
            name: '评论量',
            key: 'commentCount',
            value: formatNumber(total),
            list: dataDetailNumObj.map((obj) => ({
              date: dateMap.get(obj.imp_date) ?? new Date(obj.imp_date).getTime(),
              value: obj.flow,
            })),
          };
          result.data?.push(comment);
          newOverView.video.overview[comment.key] = total;
          newOverView.video.thirtydays[comment.key] = comment.list;

          total = formatNumberNo(
            dataDetailNumObj
              .map((obj) => obj.relay)
              .filter((num) => typeof num === 'number' && !isNaN(num))
              .reduce((acc, num) => acc + num, 0),
          );
          const share = {
            name: '分享量',
            key: 'shareCount',
            value: formatNumber(total),
            list: dataDetailNumObj.map((obj) => ({
              date: dateMap.get(obj.imp_date) ?? new Date(obj.imp_date).getTime(),
              value: obj.flow,
            })),
          };
          result.data?.push(share);
          newOverView.video.overview[share.key] = total;
          newOverView.video.thirtydays[share.key] = share.list;

          total = formatNumberNo(
            dataDetailNumObj
              .map((obj) => obj.like)
              .filter((num) => typeof num === 'number' && !isNaN(num))
              .reduce((acc, num) => acc + num, 0),
          );
          const great = {
            name: '点赞量',
            key: 'likeCount',
            value: formatNumber(total),
            list: dataDetailNumObj.map((obj) => ({
              date: dateMap.get(obj.imp_date) ?? new Date(obj.imp_date).getTime(),
              value: obj.flow,
            })),
          };
          result.data?.push(great);
          newOverView.video.overview['greatCount'] = total;
          newOverView.video.thirtydays['greatCount'] = great.list;
        }
      } else {
        result.code = reportData['code'] ?? -1;
        result.msg = reportData['msg'];
      }
    } else {
      const reportData = await getDataOverviewArticleAsync(cookie, startDate, endDate);
      if (reportData?.data?.tableStatistic) {
        const dataDetailStr = JSON.parse(reportData.data?.tableStatistic) as Array<QieEDailyDataItem>;
        if (dataDetailStr?.length) {
          const dataDetailNumObj = dataDetailStr.map((obj) => ({
            comment: parseInt(obj.comment),
            flow: parseInt(obj.flow),
            imp_date: obj.imp_date,
            like: parseInt(obj.like),
            relay: parseInt(obj.relay),
          }));
          const dateMap: Map<string, number> = new Map();
          dataDetailNumObj.forEach((obj) => {
            dateMap.set(obj.imp_date, new Date(obj.imp_date).getTime());
          });

          let total = formatNumberNo(
            dataDetailNumObj
              .map((obj) => obj.flow)
              .filter((num) => typeof num === 'number' && !isNaN(num))
              .reduce((acc, num) => acc + num, 0),
          );
          const read = {
            name: '阅读量',
            key: 'readCount',
            value: formatNumber(total),
            list: dataDetailNumObj.map((obj) => ({
              date: dateMap.get(obj.imp_date) ?? new Date(obj.imp_date).getTime(),
              value: obj.flow,
            })),
          };
          result.data?.push(read);
          newOverView.article.overview[read.key] = total;
          newOverView.article.thirtydays[read.key] = read.list;

          total = formatNumberNo(
            dataDetailNumObj
              .map((obj) => obj.comment)
              .filter((num) => typeof num === 'number' && !isNaN(num))
              .reduce((acc, num) => acc + num, 0),
          );
          const comment = {
            name: '评论量',
            key: 'commentCount',
            value: formatNumber(total),
            list: dataDetailNumObj.map((obj) => ({
              date: dateMap.get(obj.imp_date) ?? new Date(obj.imp_date).getTime(),
              value: obj.flow,
            })),
          };
          result.data?.push(comment);
          newOverView.article.overview[comment.key] = total;
          newOverView.article.thirtydays[comment.key] = comment.list;

          total = formatNumberNo(
            dataDetailNumObj
              .map((obj) => obj.relay)
              .filter((num) => typeof num === 'number' && !isNaN(num))
              .reduce((acc, num) => acc + num, 0),
          );
          const share = {
            name: '分享量',
            key: 'shareCount',
            value: formatNumber(total),
            list: dataDetailNumObj.map((obj) => ({
              date: dateMap.get(obj.imp_date) ?? new Date(obj.imp_date).getTime(),
              value: obj.flow,
            })),
          };
          result.data?.push(share);
          newOverView.article.overview[share.key] = total;
          newOverView.article.thirtydays[share.key] = share.list;

          total = formatNumberNo(
            dataDetailNumObj
              .map((obj) => obj.like)
              .filter((num) => typeof num === 'number' && !isNaN(num))
              .reduce((acc, num) => acc + num, 0),
          );
          const great = {
            name: '点赞量',
            key: 'likeCount',
            value: formatNumber(total),
            list: dataDetailNumObj.map((obj) => ({
              date: dateMap.get(obj.imp_date) ?? new Date(obj.imp_date).getTime(),
              value: obj.flow,
            })),
          };
          result.data?.push(great);
          newOverView.article.overview['greatCount'] = total;
          newOverView.article.thirtydays['greatCount'] = great.list;
        }
      } else {
        result.code = reportData['code'] ?? -1;
        result.msg = reportData['msg'];
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

interface QieEDailyDataItem {
  comment: string;
  flow: string;
  imp_date: string;
  like: string;
  relay: string;
}
interface QieEDailyDataItemNumObj {
  comment: number;
  flow: number;
  imp_date: string;
  like: number;
  relay: number;
}

/**
 * 获取企鹅号指定天数内公开作品数据
 * @param cookie
 * @param eventCallBack
 * @param type
 * @param days
 * @param maxCount
 * @param isHeader
 * @param proxy
 */
export const getQieHaoContentListView = async (
  cookie: string,
  type: 'video' | 'article',
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
      { name: type === 'video' ? '播放' : '阅读', key: type === 'video' ? 'play' : 'read' },
      // { name: '赞同', key: 'great' },
      { name: '评论', key: 'comment' },
      // { name: '收藏', key: 'collect' },
      // { name: '喜欢', key: 'like' },
    ];
    if (isHeader) {
      return result;
    }
    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const limit = 10;
    let lastTime = '';
    for (let i = 0; i < 70; i++) {
      const contentList = await getContentListAsync(
        cookie,
        'published_new',
        limit,
        lastTime,
        '',
        '',
        type === 'article' ? 0 : 56,
        webProxy,
      );
      if (contentList?.data?.articles?.length) {
        let j = 0;
        for (const item of contentList?.data?.articles) {
          j++;
          lastTime = contentList.data.articles[contentList.data.articles.length - 1].pub_time;
          // if (item.visibleType === 3) {
          //   continue;
          // }
          const date = dayjs(item.pub_time).toDate();
          if (lastDate > date || result.data.length >= maxCount) {
            //前面可能会有三个置顶的
            if (j <= 3) {
              continue;
            }
            eventCallBack?.emit(syncContentEventName, { ...result });
            return result;
          }
          const dateStr = dayjs(date).format('YYYY-MM-DD HH:mm:ss');
          const newItem: PlatformContentItem = {
            id: type === 'article' ? item.article_id : `${item.article_id}_${item.vid}`,
            cover: item.imgurl,
            title: item.title,
            date: dateStr,
            read: formatNumber(item.read),
            play: formatNumber(item.read),

            comment: formatNumber(item.commentnum),

            pageUrl: item.url,
            type: type,
          };
          const newItemNum: PlatformContentItemNum = {
            id: type === 'article' ? item.article_id : `${item.article_id}_${item.vid}`,
            cover: item.imgurl,
            title: item.title,
            date: dateStr,
            read: formatNumberNo(item.read),
            play: formatNumberNo(item.read),

            comment: formatNumberNo(item.commentnum),

            pageUrl: item.url,
            type: type,
          };
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
        }
        await Task.Delay(1000);
      } else {
        if (!result.data.length) {
          result.code = contentList?.response?.code ?? (contentList ? contentList['code'] : -1);
          result.msg = contentList?.response?.msg ?? (contentList ? contentList['msg'] : '');
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
 */
export const deleteQiehaoContent = async (
  cookie: string,
  contentType: PubContentEnum,
  docId: string,
): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    const docIds = docId?.split('_');
    if (contentType === PubContentEnum.video) {
      await deleteContentVideoSource(cookie, docIds[1]);
      const deleteRe = await deleteContent(cookie, docIds[0]);
      result.code = deleteRe?.response?.code ?? -1;
      result.msg = deleteRe?.response?.msg;
    } else if (contentType === PubContentEnum.article) {
      const deleteRe = await deleteContent(cookie, docIds[0]);
      result.code = deleteRe?.response?.code ?? -1;
      result.msg = deleteRe?.response?.msg;
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
