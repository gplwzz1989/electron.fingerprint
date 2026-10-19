import { BaseResult } from '../baseResult';
import {
  getContentDraftAsync,
  getContentListAsync,
  ZhihuContentListResponse,
  ZhihuDraftContent,
  ZhihuMediaContent,
} from './zhihu-content-list.service';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import {
  getDataOverviewAsync,
  getDataOverviewFansAsync,
  getDataOverviewIncomeAsync,
  getDataOverviewIncomeStatisticAsync,
  getDataOverviewStatisticAsync,
  getSingleDataOverviewAsync,
  getSingleDataOverviewStatisticAsync,
} from './zhihu-data-overview.service';
import { getUserHomeDataAsync, getUserInfoAsync, ZhihuUserInfoResponse } from './zhihu-user.service';
import { auditStatusEnum, formatNumber, formatNumberNo, Task } from '../../utils';
import { getTopicListAsync, ZhihuTopicInfo } from './zhihu-topic.service';
import { getCategoryListAsync, ZhihuCategoryInfo } from './zhihu-category.service';
import {
  AuditResult,
  ListInfoResponse,
  ListItemInfoLevel,
  ListLevelInfoResponse,
  PlatformAuthorInfo,
  PlatformContentItem,
  PlatformContentItemNum,
} from '../baseModel';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../webproxy';
import {
  AccountContentListViewOutPut,
  AccountReportDataOutPut,
  syncContentEventName,
  syncContentMaxPage,
} from '../data-service';
import { HttpsProxyAgent } from 'https-proxy-agent';
import dayjs from 'dayjs';
import { EventEmitter } from 'events';
import { PubContentEnum } from '@/cloud/model/TypeEnum';
import {
  deleteArticleContent,
  deleteDynamicContent,
  deleteVideoContent,
} from '@/media-platform/zhihu/zhihu-content-delete.service';

/**
 * 知乎内容管理列表
 * @param cookie
 * @param offset 起始数据 默认0 （页码-1）*每页数量
 * @param limit 每页数量 默认10
 * @param tab 内容类型 默认zvideo（all: 全部，article：图文，zvideo：视频）
 * @param start_date 开始日期
 * @param end_date 结束日期
 */
export const getZhihuContentList = async (
  cookie: string,
  offset: number = 0,
  limit: number = 10,
  tab: 'all' | 'article' | 'zvideo' = 'zvideo',
  start_date?: Date,
  end_date?: Date,
) => {
  const result: ZhihuContentListOutput = {
    code: 0,
    msg: '',
  };

  try {
    let start_time = 0;
    let end_time = 0;

    if (start_date && end_date) {
      start_time = start_date.getTime() / 1000;
      end_time = end_date.getTime() / 1000;
    }

    const contentListResult = await getContentListAsync(cookie, offset, limit, tab, start_time, end_time);

    result.data = contentListResult.data;
    result.paging = contentListResult.paging;
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

export interface ZhihuContentListOutput extends BaseResult {
  paging?: {
    /**
     * 是否为最后一页数据
     */
    is_end: boolean;

    /**
     * 是否为第一页数据
     */
    is_start: boolean;
    next: string;
    previous: string;

    /**
     * 作品总数
     */
    totals: number;
    totals_real: number;
  };
  data?: Array<ZhihuMediaContent>;

  raw?: unknown;
}

/**
 * 知乎内容分析
 * @param cookie
 * @param tab 数据类型 默认视频（article：图文，zvideo：视频）
 * @param end 结束日期（Date）
 * @param start 开始日期 （Date）
 */
export const getZhihuDataOverview = async (
  cookie: string,
  start: Date,
  end: Date,
  tab: 'article' | 'zvideo' | 'all' = 'zvideo',
) => {
  const result: ZhihuDataOverviewOutput = {
    code: 0,
    msg: '',
  };

  try {
    let start_date_str = start.toISOString();
    if (start_date_str.length > 0) {
      start_date_str = start_date_str.slice(0, 10);
    }

    let end_date_str = end.toISOString();
    if (end_date_str.length > 0) {
      end_date_str = end_date_str.slice(0, 10);
    }

    result.data = await getDataOverviewAsync(cookie, start_date_str, end_date_str, tab);
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

export interface ZhihuDataOverviewOutput extends BaseResult {
  data?: Array<{
    /**
     * 日期
     */
    p_date: string;

    /**
     * 阅读量
     */
    pv: number;

    /**
     * 播放量
     */
    play: number;
    show: number;

    /**
     * 赞同数
     */
    upvote: number;

    /**
     * 评论数
     */
    comment: number;

    /**
     * 喜欢数
     */
    like: number;

    /**
     * 收藏数
     */
    collect: number;

    /**
     * 分享数
     */
    share: number;
    reaction: number;
    re_pin: number;
    like_and_reaction: number;
    incr_upvote_num: number;
    desc_upvote_num: number;
    incr_like_num: number;
    desc_like_num: number;
    yesterday: number;
    today: number;
    advanced: number;
  }>;
}

/**
 * 知乎内容分析头部统计
 * @param cookie
 * @param end 结束日期（Date）
 * @param start 开始日期 开始日期不传为累计数据 （Date）
 * @param tab 数据类型 默认视频 （all: 全部，article：图文，zvideo：视频）
 */
export const getZhihuDataOverviewStatistic = async (
  cookie: string,
  tab: 'all' | 'article' | 'zvideo' = 'zvideo',
  end: Date,
  start?: Date,
) => {
  const result: ZhihuDataOverviewStatisticOutput = {
    code: 0,
    msg: '',
  };

  try {
    let start_date_str = '';
    if (start) {
      start_date_str = start.toISOString();
      if (start_date_str.length > 0) {
        start_date_str = start_date_str.slice(0, 10);
      }
    }

    let end_date_str = end.toISOString();
    if (end_date_str.length > 0) {
      end_date_str = end_date_str.slice(0, 10);
    }

    const re = await getDataOverviewStatisticAsync(cookie, tab, end_date_str, start_date_str);
    result.data = re;
    result.code = re['code'];
    result.msg = re['msg'];
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

export interface ZhihuDataOverviewStatisticOutput extends BaseResult {
  data?: {
    /**
     * 更新日期
     */
    updated: string;

    /**
     * 阅读总量
     */
    pv: number;

    /**
     * 播放总量
     */
    play: number;
    show: number;

    /**
     * 赞同总量
     */
    upvote: number;

    /**
     * 评论总量
     */
    comment: number;

    /**
     * 喜欢总量
     */
    like: number;

    /**
     * 收藏总量
     */
    collect: number;

    /**
     * 分享总量
     */
    share: number;
    reaction: number;
    re_pin: number;
    like_and_reaction: number;
    incr_upvote_num: number;
    desc_upvote_num: number;
    incr_like_num: number;
    desc_like_num: number;
    yesterday: {
      updated: number;

      /**
       * 今日阅读量
       */
      pv: number;

      /**
       * 今日播放量
       */
      play: number;
      show: number;

      /**
       * 今日赞同量
       */
      upvote: number;

      /**
       * 今日评论量
       */
      comment: number;

      /**
       * 今日喜欢数
       */
      like: number;

      /**
       * 今日收藏数
       */
      collect: number;

      /**
       * 今日分享数
       */
      share: number;
      reaction: number;
      re_pin: number;
      like_and_reaction: number;
      incr_upvote_num: number;
      desc_upvote_num: number;
      incr_like_num: number;
      desc_like_num: number;
    };
    today: {
      updated: number;

      /**
       * 昨日阅读量
       */
      pv: number;

      /**
       * 昨日播放量
       */
      play: number;
      show: number;

      /**
       * 昨日赞同量
       */
      upvote: number;

      /**
       * 昨日评论量
       */
      comment: number;

      /**
       * 昨日喜欢数
       */
      like: number;

      /**
       * 昨日收藏数
       */
      collect: number;

      /**
       * 昨日分享数
       */
      share: number;
      reaction: number;
      re_pin: number;
      like_and_reaction: number;
      incr_upvote_num: number;
      desc_upvote_num: number;
      incr_like_num: number;
      desc_like_num: number;
    };
  };
}

/**
 * 知乎收益报表
 * @param cookie
 * @param start_date 开始日期 （Date）
 * @param end_date 结束日期（Date）
 */
export const getZhihuDataOverviewIncome = async (cookie: string, start_date: Date, end_date: Date) => {
  const result: ZhihuDataOverviewIncomeOutput = {
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
    const dataOverviewIncomeResult = await getDataOverviewIncomeAsync(cookie, start_date_str, end_date_str);

    result.data = dataOverviewIncomeResult.data;
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

export interface ZhihuDataOverviewIncomeOutput extends BaseResult {
  data?: Array<{
    date: string;

    /**
     * 总收益
     */
    total: number;

    /**
     * 付费咨询
     */
    channel_paid: number;

    /**
     * 内容收益
     */
    channel_content_money: number;

    /**
     * 好物推荐
     */
    channel_good_good: number;

    /**
     * 知+自选
     */
    channel_zhi_plus: number;

    /**
     * 品牌任务
     */
    channel_brand_task: number;

    /**
     * 其他
     */
    channel_other: number;
  }>;
}

/**
 * 知乎收益分析头部统计
 * @param cookie
 */
export const getZhihuDataOverviewIncomeStatistic = async (cookie: string) => {
  const result: ZhihuDataOverviewIncomeStatisticOutput = {
    code: 0,
    msg: '',
  };

  try {
    result.data = await getDataOverviewIncomeStatisticAsync(cookie);
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
export interface ZhihuDataOverviewIncomeStatisticOutput extends BaseResult {
  data?: {
    /**
     * 今日收益
     */
    today: number;

    /**
     * 昨日收益
     */
    yesterday: number;

    /**
     * 这周收益
     */
    this_week: number;

    /**
     * 上周收益
     */
    last_week: number;

    /**
     * 总收益
     */
    total: number;

    /**
     * 余额
     */
    balance: number;
    diff: number;
  };
}

/**
 * 知乎首页数据
 * @param cookie
 * @param proxy
 */
export const getZhihuUserHomeData = async (cookie: string, proxy?: KuaiDaiLiProxy) => {
  const result: ZhihuUserHomeDataOutput = {
    code: 0,
    msg: '',
  };

  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userHomeDataResult = await getUserHomeDataAsync(cookie, webProxy);

    result.list = userHomeDataResult.list;
    result.msg = userHomeDataResult?.msg;
    result.code = parseInt(userHomeDataResult?.code) ?? 0;
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

export interface ZhihuUserHomeDataOutput extends BaseResult {
  list?: [
    {
      token: string;
      data: {
        /**
         * 今日收益
         */
        today_income: number;

        /**
         * 总收益
         */
        total_income: number;

        /**
         * 昨日收益
         */
        yesterday_income: number;
      };
    },
    {
      token: string;
      data: {
        interaction: {
          /**
           * 总关注者数
           */
          total_follower_count: number;

          /**
           * 近7日阅读（播放）
           */
          total_7d_read_count: number;

          /**
           * 近7日赞同
           */
          total_7d_upvoted_count: number;
        };
      };
    },
  ];
}

/**
 * 知乎单篇统计数据
 * @param cookie
 * @param token 作品类别中url_token
 * @param type 作品类型 （图文：article, 视频：zvideo）
 * @param end_date 结束日期
 */
export const getZhihuSingleDataOverviewStatistic = async (
  cookie: string,
  token: string,
  type: 'article' | 'zvideo',
  end_date: Date,
): Promise<ZhihuSingleDataOverviewStatisticOutput> => {
  const result: ZhihuSingleDataOverviewStatisticOutput = {
    code: 0,
    msg: '',
  };

  try {
    let end_date_str = end_date.toISOString();
    if (end_date_str.length > 0) {
      end_date_str = end_date_str.slice(0, 10);
    }

    result.data = await getSingleDataOverviewStatisticAsync(cookie, token, type, end_date_str);
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

export interface ZhihuSingleDataOverviewStatisticOutput extends BaseResult {
  data?: {
    /**
     * 阅读量
     */
    pv: number;

    /**
     * 播放量
     */
    play: number;
    show: number;

    /**
     * 赞同总量
     */
    upvote: number;

    /**
     * 评论总量
     */
    comment: number;

    /**
     * 喜欢总量
     */
    like: number;

    /**
     * 收藏总量
     */
    collect: number;

    /**
     * 分享总量
     */
    share: number;
    reaction: number;
    re_pin: number;
    like_and_reaction: number;

    /**
     * 图文
     */
    article: {
      url_token: string;
      title: string;
    };

    /**
     * 视频
     */
    zvideo: {
      url_token: string;
      title: string;
    };

    /**
     * 问答
     */
    answer: {
      url_token: string;
      title: string;
    };
  };
}

/**
 * 知乎单篇报表分析
 * @param cookie
 * @param token 作品类别中url_token
 * @param type 作品类型 （图文：article, 视频：zvideo）
 * @param start_date 开始日期  Date
 * @param end_date 结束日期  Date
 */
export const getZhihuSingleDataOverview = async (
  cookie: string,
  token: string,
  type: 'article' | 'zvideo',
  start_date: Date,
  end_date: Date,
): Promise<ZhihuSingleDataOverviewOutput> => {
  const result: ZhihuSingleDataOverviewOutput = {
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
    result.data = await getSingleDataOverviewAsync(cookie, token, type, start_date_str, end_date_str);
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

export interface ZhihuSingleDataOverviewOutput extends BaseResult {
  data?: Array<{
    /**
     * 日期
     */
    p_date: string;

    /**
     * 阅读量
     */
    pv: number;

    /**
     * 播放量
     */
    play: number;
    show: number;

    /**
     * 赞同数
     */
    upvote: number;

    /**
     * 评论数
     */
    comment: number;

    /**
     * 喜欢数
     */
    like: number;

    /**
     * 收藏数
     */
    collect: number;

    /**
     * 分享数
     */
    share: number;
    reaction: number;
    re_pin: number;
    like_and_reaction: number;
  }>;
}

/**
 * 检测知乎文章状态
 * @param cookie
 * @param publishId 发布id
 * @param maxPage 最大检测页数
 */
export const getZhihuArticleStatus = async (
  cookie: string,
  publishId: string,
  maxPage: number = 10,
): Promise<ZhihuArticleStatusOutput> => {
  const result: ZhihuArticleStatusOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };

  try {
    if (!maxPage) {
      maxPage = 1;
    }
    let contentList: ZhihuContentListResponse | undefined = undefined;
    for (let i = 0; i <= maxPage; i++) {
      //根据页码获取视频列表
      contentList = await getContentListAsync(cookie, i, 10, 'article');

      if (contentList?.data?.length) {
        for (const content of contentList.data) {
          const findId = content?.data?.id?.toString();

          if (findId === publishId) {
            result.docId = findId;
            result.create_time = new Date(content.data.updated_time).getTime() / 1000;
            result.data = content;
            const mediaStatus = content?.status;
            if (mediaStatus?.length > 0) {
              if (mediaStatus[0].status_type === 'reviewing') {
                result.auditStatus = auditStatusEnum.inAudit;
              } else {
                result.auditStatus = auditStatusEnum.deny;
              }
            } else {
              result.auditStatus = auditStatusEnum.published;
              result.openUrl = `https://zhuanlan.zhihu.com/p/${findId}`;
            }
            return result;
          }
        }
      } else {
        result.code = contentList?.paging?.totals > 0 ? 0 : -1;
        result.msg = '未找到作品';
        return result;
      }
    }
    result.code = contentList?.paging?.totals ? 0 : -1;
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

export interface ZhihuArticleStatusOutput extends BaseResult {
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

  data?: ZhihuMediaContent;

  /**
   * 公开访问url
   */
  openUrl?: string;
}

export const getZhihuDynamicStatus = async (
  cookie: string,
  publishId: string,
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
    for (let i = 0; i <= maxPage; i++) {
      //根据页码获取视频列表
      const contentList = await getContentListAsync(cookie, i, 10, 'pin');

      if (contentList?.data?.length) {
        for (const content of contentList.data) {
          const findId = content?.data?.id?.toString();

          if (findId === publishId) {
            result.docId = findId;
            result.create_time = content.data.created_time;
            result.data = content;
            const mediaStatus = content?.status;
            if (mediaStatus?.length > 0) {
              if (mediaStatus[0].status_type === 'reviewing') {
                result.auditStatus = auditStatusEnum.inAudit;
              } else {
                result.auditStatus = auditStatusEnum.deny;
              }
            } else {
              result.auditStatus = auditStatusEnum.published;
              result.openUrl = `https://www.zhihu.com/pin/${findId}`;
            }
            return result;
          }
        }
      } else {
        result.code = -1;
        result.msg = '未找到作品';
        break;
      }
    }
    result.code = -1;
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
 * 获取知乎话题列表
 * @param cookie
 * @param keyword 搜索关键字
 */
export const getZhihuTopicList = async (cookie: string, keyword: string): Promise<ZhihuTopicListOutput> => {
  const result: ZhihuTopicListOutput = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    const re = await getTopicListAsync(cookie, keyword);
    if (re?.length > 0) {
      re.forEach((item) => {
        result.dataList?.push({ yixiaoerId: item.id, yixiaoerName: item.name, raw: item });
      });
      result.data = re;
    } else {
      result.data = [];
      if (re['error']) {
        result.msg = re['error']['message']?.toString() ?? JSON.stringify(re['error']);
        result.code = re['error']['code'] ?? -1;
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

export interface ZhihuTopicListOutput extends ListInfoResponse {
  data?: Array<ZhihuTopicInfo>;
}

/**
 * 获取知乎视频分类列表
 * @param cookie
 */
export const getZhihuCategoryList = async (cookie: string): Promise<ZhihuCategoryListOutput> => {
  const result: ZhihuCategoryListOutput = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    const re = await getCategoryListAsync(cookie);
    if (re.data?.length) {
      for (const item of re.data) {
        const firstCate: ListItemInfoLevel = {
          yixiaoerId: item?.id?.toString() ?? '',
          yixiaoerName: item?.name,
        };
        firstCate.raw = item;
        result.dataList?.push(firstCate);
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
 * 视频分类数据
 */
export interface ZhihuCategoryListOutput extends ListLevelInfoResponse {
  data?: Array<{
    //一级分类
    data: ZhihuCategoryInfo;
    //二级分类
    children: Array<{
      data: ZhihuCategoryInfo;
    }>;
  }>;
}

export const getZhihuUserInfo = async (cookie: string, proxy?: KuaiDaiLiProxy): Promise<ZhihuUserInfoOutput> => {
  const result: ZhihuUserInfoOutput = {
    code: 0,
    msg: '',
  };

  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfoResult = await getUserInfoAsync(cookie, webProxy);

    result.yixiaoerId = userInfoResult?.id?.toString();
    result.yixiaoerName = userInfoResult?.name?.toString();
    result.yixiaoerImageUrl = userInfoResult?.avatar_url?.toString();
    result.raw = userInfoResult;
    const ct =
      userInfoResult.question_count +
      userInfoResult.answer_count +
      userInfoResult.articles_count +
      userInfoResult.zvideo_count +
      userInfoResult.thanked_count;
    if (userInfoResult?.error) {
      result.code = userInfoResult?.error?.code;
      result.msg = userInfoResult?.error?.message;
      return result;
    }
    if (userInfoResult?.is_realname === false || !ct) {
      result.verify = false;
      result.msg = '未开通知乎创作中心';
      result.code = errorCode.accountUnVerify;
      return result;
    }
    result.data = userInfoResult; // await getUserInfoAsync(cookie);
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

export interface ZhihuUserInfoOutput extends PlatformAuthorInfo {
  data?: ZhihuUserInfoResponse;
}
/**
 * 查询发布视频额度审核状态
 * @param cookie
 * @param publishId
 * @param maxPage
 */
export const getZhihuVideoStatus = async (
  cookie: string,
  publishId: string,
  maxPage: number = 10,
): Promise<ZhihuVideoStatusResultOutput> => {
  const result: ZhihuVideoStatusResultOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };
  try {
    let statusResult: ZhihuContentListResponse | undefined = undefined;
    for (let i = 0; i < maxPage; i++) {
      statusResult = await getContentListAsync(cookie, i * 10, 10, 'zvideo');
      if (statusResult?.data?.length > 0) {
        for (const item of statusResult.data) {
          const findDocId = item.data.id;
          if (findDocId === publishId) {
            result.code = 0;
            result.auditStatus = auditStatusEnum.published;
            if (item.status?.length) {
              if (item.status[0].status_type === 'reviewing') {
                result.auditStatus = auditStatusEnum.inAudit;
              } else {
                result.auditStatus = auditStatusEnum.deny;
              }
            }
            result.docId = findDocId;
            result.create_time = item.data.created_time;
            result.openUrl = 'https://www.zhihu.com/pin/' + findDocId;
            result.coverUrl = item?.data?.thumbnail;
            result.data = item;
            return result;
          }
        }
      }

      const draftResult = await getContentDraftAsync(cookie, i * 10, 10);
      if (draftResult?.data?.length > 0) {
        for (const item of draftResult.data) {
          const findDocId = item.id??item.content_id;
          if (findDocId === publishId) {
            result.code = 0;
            if (item?.plugin?.includes('schedule')) {
              result.auditStatus = auditStatusEnum.prePublish;
            } else {
              result.auditStatus = auditStatusEnum.draft;
            }
            result.docId = findDocId;
            result.create_time = item.updated_at;
            result.coverUrl = item?.image_url;
            result.data = item;
            return result;
          }
        }
      }
      if (!statusResult?.data?.length && !draftResult?.data?.length) {
        break;
      }
    }
    result.code = statusResult?.paging?.totals ? 0 : -1;
    result.msg = '未找到作品';
    return result;
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

export interface ZhihuVideoStatusResultOutput {
  /**
   * 结果状态
   */
  code: number;

  /**
   * 提示信息
   */
  msg: string;

  /**
   * 发布产生的id
   */
  publishId: string;

  /**
   * 作品唯一id
   */
  docId?: string;

  openUrl?: string;

  /**
   * 封面url
   */
  coverUrl?: string;
  /**
   * 审核状态
   */
  auditStatus?: auditStatusEnum;
  /**
   * 作品创建时间
   */
  create_time?: number;

  /**
   * 视频信息
   */
  data?: ZhihuDraftContent | ZhihuMediaContent;
}

/**
 *
 * @param cookie
 * @param days 1: 7天数据，2: 30天数据,3: 90天数据
 * @param type video:视频 dynamic:图文
 * @param proxy
 */
export const getZhihuOverViewDashboard = async (
  cookie: string,
  days: 1 | 2 | 3 = 2,
  type: 'video' | 'article' | 'all' = 'all',
  proxy?: KuaiDaiLiProxy,
): Promise<AccountReportDataOutPut> => {
  const result: AccountReportDataOutPut = {
    code: 0,
    msg: '',
    data: [],
  };

  const names = [
    { name: '关注者', key: 'totalFansCount' },
    { name: '阅读总量', key: 'readCount' },
    { name: '播放总量', key: 'playCount' },
    { name: '赞同总量', key: 'greatCount' },
    { name: '喜欢总量', key: 'likeCount' },
    { name: '评论总量', key: 'commentCount' },
    { name: '收藏总量', key: 'collectCount' },
    { name: '分享总量', key: 'shareCount' },
    { name: '转发总量', key: 'forwardCount' },
    { name: '关注者变化', key: 'netFansCount' },
  ];

  try {
    const newOverView = {
      all: {
        overview: {},
        thirtydays: {},
      },
    };
    result.dataObj = newOverView as never;
    const fansData = await getZhihuUserHomeData(cookie, proxy);
    const staticData = fansData?.list?.find((x) => x.token === 'creation_statistics');
    if (staticData?.data) {
      result.data?.push({
        name: '关注者',
        key: 'totalFansCount',
        value: formatNumber(staticData.data['interaction']?.total_follower_count),
        list: [],
      });
      newOverView.all.overview['totalFansCount'] = formatNumberNo(staticData.data['interaction']?.total_follower_count);
    } else {
      result.code = fansData?.code ?? -1;
      result.msg = fansData?.msg ?? '';
      return result;
    }

    const now = new Date();
    let startTs = new Date(now.setDate(now.getDate() - 29));
    if (days === 1) {
      startTs = new Date(now.setDate(now.getDate() - 7));
    } else if (days === 3) {
      startTs = new Date(now.setDate(now.getDate() - 90));
    }

    const endNow = new Date();
    const reportData = await getDataOverviewAsync(
      cookie,
      dayjs(startTs).format('YYYY-MM-DD'),
      dayjs(endNow).format('YYYY-MM-DD'),
      type === 'video' ? 'zvideo' : type,
    );

    if (reportData?.length) {
      const dateMap: Map<string, number> = new Map<string, number>();
      reportData.forEach((item) => {
        dateMap.set(item.p_date, new Date(item.p_date).getTime());
      });
      let total = formatNumberNo(
        reportData
          .map((obj) => obj.pv)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const read = {
        name: '阅读总量',
        key: 'readCount',
        value: formatNumber(total),
        list: reportData?.map((obj) => ({ date: dateMap.get(obj.p_date) ?? 0, value: obj.pv })),
      };
      result.data?.push(read);
      newOverView.all.overview[read.key] = total;
      newOverView.all.thirtydays[read.key] = read.list;

      total = formatNumberNo(
        reportData
          .map((obj) => obj.play)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const play = {
        name: '播放总量',
        key: 'playCount',
        value: formatNumber(total),
        list: reportData?.map((obj) => ({ date: dateMap.get(obj.p_date) ?? 0, value: obj.play })),
      };
      result.data?.push(play);
      newOverView.all.overview[play.key] = total;
      newOverView.all.thirtydays[play.key] = play.list;

      total = formatNumberNo(
        reportData
          .map((obj) => obj.upvote)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const great = {
        name: '赞同总量',
        key: 'greatCount',
        value: formatNumber(total),
        list: reportData?.map((obj) => ({ date: dateMap.get(obj.p_date) ?? 0, value: obj.upvote })),
      };
      result.data?.push(great);
      newOverView.all.overview[great.key] = total;
      newOverView.all.thirtydays[great.key] = great.list;

      total = formatNumberNo(
        reportData
          .map((obj) => obj.like)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const like = {
        name: '喜欢总量',
        key: 'likeCount',
        value: formatNumber(total),
        list: reportData?.map((obj) => ({ date: dateMap.get(obj.p_date) ?? 0, value: obj.like })),
      };
      result.data?.push(like);
      newOverView.all.overview[like.key] = total;
      newOverView.all.thirtydays[like.key] = like.list;

      total = formatNumberNo(
        reportData
          .map((obj) => obj.comment)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const comment = {
        name: '评论总量',
        key: 'commentCount',
        value: formatNumber(total),
        list: reportData?.map((obj) => ({ date: dateMap.get(obj.p_date) ?? 0, value: obj.comment })),
      };
      result.data?.push(comment);
      newOverView.all.overview[comment.key] = total;
      newOverView.all.thirtydays[comment.key] = comment.list;

      total = formatNumberNo(
        reportData
          .map((obj) => obj.collect)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const collect = {
        name: '收藏总量',
        key: 'collectCount',
        value: formatNumber(total),
        list: reportData?.map((obj) => ({ date: dateMap.get(obj.p_date) ?? 0, value: obj.collect })),
      };
      result.data?.push(collect);
      newOverView.all.overview[collect.key] = total;
      newOverView.all.thirtydays[collect.key] = collect.list;

      total = formatNumberNo(
        reportData
          .map((obj) => obj.share)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const share = {
        name: '分享总量',
        key: 'shareCount',
        value: formatNumber(total),
        list: reportData?.map((obj) => ({ date: dateMap.get(obj.p_date) ?? 0, value: obj.share })),
      };
      result.data?.push(share);
      newOverView.all.overview[share.key] = total;
      newOverView.all.thirtydays[share.key] = share.list;

      total = formatNumberNo(
        reportData
          .map((obj) => obj.re_pin)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const forward = {
        name: '转发总量',
        key: 'forwardCount',
        value: formatNumber(total),
        list: reportData?.map((obj) => ({ date: dateMap.get(obj.p_date) ?? 0, value: obj.re_pin })),
      };
      result.data?.push(forward);
      newOverView.all.overview[forward.key] = total;
      newOverView.all.thirtydays[forward.key] = forward.list;
    }

    //粉丝数
    const fansResult = await getDataOverviewFansAsync(cookie, days === 1 ? 7 : days === 2 ? 30 : 90);
    if (fansResult?.List?.length) {
      const total = formatNumberNo(
        fansResult.List.map((obj) => obj.pre_follow)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const fans = {
        name: '关注者变化',
        key: 'netFansCount',
        value: formatNumber(total),
        list: fansResult.List?.map((obj) => ({ date: new Date(obj.date).getTime() ?? 0, value: obj.pre_follow })),
      };
      result.data?.push(fans);
      newOverView.all.overview[fans.key] = total;
      newOverView.all.thirtydays[fans.key] = fans.list;
    } else {
      result.code = reportData['code'] ?? -1;
      result.msg = reportData['msg'];
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
 * 获取知乎号指定天数内公开作品数据
 * @param cookie
 * @param eventCallBack
 * @param type
 * @param days
 * @param maxCount
 * @param isHeader
 * @param proxy
 */
export const getZhihuContentListView = async (
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
      { name: '赞同', key: 'great' },
      { name: '评论', key: 'comment' },
      { name: '收藏', key: 'collect' },
      { name: '喜欢', key: 'like' },
    ];
    if (isHeader) {
      return result;
    }
    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const limit = 10;
    let contentTmpId = '';
    for (let i = 0; i < syncContentMaxPage; i++) {
      const contentList = await getContentListAsync(
        cookie,
        i * limit,
        limit,
        type === 'video' ? 'zvideo' : 'article',
        webProxy,
      );
      if (contentList?.data?.length) {
        if (contentList.data[0]?.data?.id === contentTmpId) {
          break;
        } else {
          contentTmpId = contentList.data[0]?.data?.id;
        }
        let j = 0;
        for (const item of contentList?.data) {
          j++;
          // if (item.visibleType === 3) {
          //   continue;
          // }
          const date = dayjs(item.data.created_time * 1000).toDate();
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
            id: item.data.id,
            cover: item.data.thumbnail,
            title: item.data.title,
            date: dateStr,
            read: formatNumber(item.reaction?.read_count),
            play: formatNumber(item.reaction?.play_count),
            great: formatNumber(item.reaction?.vote_up_count),
            comment: formatNumber(item.reaction?.comment_count),
            collect: formatNumber(item.reaction?.collect_count),
            like: formatNumber(item.reaction?.like_count),
            pageUrl:
              type === 'article'
                ? `https://zhuanlan.zhihu.com/p/${item.data.url_token}`
                : `https://www.zhihu.com/zvideo/${item.data.url_token}`,
            type: type,
          };
          const newItemNum: PlatformContentItemNum = {
            id: item.data.id,
            cover: item.data.thumbnail,
            title: item.data.title,
            date: dateStr,
            read: formatNumberNo(item.reaction?.read_count),
            play: formatNumberNo(item.reaction?.play_count),
            great: formatNumberNo(item.reaction?.vote_up_count),
            comment: formatNumberNo(item.reaction?.comment_count),
            collect: formatNumberNo(item.reaction?.collect_count),
            like: formatNumberNo(item.reaction?.like_count),
            pageUrl:
              type === 'article'
                ? `https://zhuanlan.zhihu.com/p/${item.data.url_token}`
                : `https://www.zhihu.com/zvideo/${item.data.url_token}`,
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
          result.dataList = [];
        }
        await Task.Delay(1000);
      } else {
        if (!result?.data?.length) {
          result.code = contentList?.paging?.is_end != undefined ? 0 : -1;
          result.msg = contentList?.paging?.is_end != undefined ? contentList['msg'] : '';
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
 *删除作品
 * @param cookie
 * @param docId 做作品唯一id
 * @param contentType
 * @param isDraft
 */
export const deleteZhihuhaoContent = async (
  cookie: string,
  docId: string,
  contentType: PubContentEnum,
  isDraft: boolean,
): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    if (contentType === PubContentEnum.video) {
      const deRe = await deleteVideoContent(cookie, docId, isDraft);
      result.code = !deRe?.error ? 0 : deRe?.error?.code ?? -1;
      result.msg = deRe?.error?.message;
    } else if (contentType === PubContentEnum.article) {
      const deRe = await deleteArticleContent(cookie, docId, isDraft);
      result.code = !deRe?.error ? 0 : deRe?.error?.code ?? -1;
      result.msg = deRe?.error?.message;
    } else if (contentType === PubContentEnum.dynamic || contentType === PubContentEnum.ImageText) {
      const deRe = await deleteDynamicContent(cookie, docId);
      result.code = !deRe?.error && deRe.success ? 0 : deRe?.error?.code ?? -1;
      result.msg = deRe?.error?.message;
    } else {
      result.code = -1;
      result.msg = '';
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
