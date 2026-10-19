import { BaseResult } from '../baseResult';
import { PipixiaMediaContent, getContentListAsync, PipixiaContentListResponse } from './pipixia-content-list.service';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import {
  getCoreDataAsync,
  getDataOverviewAsync,
  getDataOverviewFansAsync,
  PipixiaDataOverviewFansItemResponse,
  PipixiaOverviewItemResponse,
} from './pipixia-data-overview.service';
import { ListInfoResponse, MediaStatusResultOutput, PlatformAuthorInfo } from '../../media-platform';
import { getUserInfoResponse } from './pipixia-base.service';
import { getPipixiaTopicResponse } from './pipixia-topic.service';
import { auditStatusEnum, Task } from '@/utils';
import { createKuaiProxyAgent, IWebProxy } from '@/media-platform/webproxy';

/**
 * 皮皮虾作品管理列表
 * @param cookie
 * @param status 数据类型（1：已通过，2：审核中，3：未通过）
 * @param page 页码 默认1
 * @param count 每页数量 默认10
 */
export const getPipixiaContentList = async (
  cookie: string,
  status: 1 | 2 | 3 = 1,
  page: number = 1,
  count: number = 10,
) => {
  const result: PipixiaContentListOutput = {
    code: 0,
    msg: '',
  };

  try {
    let offset = (page - 1) * count;

    if (offset < 0) {
      offset = 0;
    }

    const contentListResult = await getContentListAsync(cookie, status, offset, count);

    result.code = contentListResult.status_code;
    result.msg = contentListResult.message;
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

export interface PipixiaContentListOutput extends BaseResult {
  data?: {
    total: number;
    items: Array<PipixiaMediaContent>;
  };
  raw?: unknown;
}

/**
 * 获取皮皮虾数据分析-视频投稿
 * @param cookie
 * @param start_date 开始日期 Date
 * @param end_date 结束日期 Date
 */
export const getPipixiaDataOverview = async (cookie: string, start_date: Date, end_date: Date) => {
  const result: PipixiaDataOverviewOutput = {
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

    const dataOverviewResult = await getDataOverviewAsync(cookie, start_date_str, end_date_str);

    result.code = dataOverviewResult.status_code;
    result.msg = dataOverviewResult.message;
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

export interface PipixiaDataOverviewOutput extends BaseResult {
  data?: {
    media_type_stat: Array<PipixiaOverviewItemResponse>;
  };
  raw?: unknown;
}

/**
 * 皮皮虾数据分析-整体数据
 * @param cookie
 * @param user_id 用户id
 */
export const getPipixiaDataOverviewCore = async (cookie: string, user_id: string) => {
  const result: PipixiaDataOverviewCoreOutput = {
    code: 0,
    msg: '',
  };

  try {
    const dataOverviewCoreResult = await getCoreDataAsync(cookie, user_id);

    result.code = dataOverviewCoreResult.status_code;
    result.msg = dataOverviewCoreResult.message;
    result.data = dataOverviewCoreResult.data;
    result.raw = dataOverviewCoreResult;
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

export interface PipixiaDataOverviewCoreOutput extends BaseResult {
  data?: {
    overall_stat: {
      /**
       * 用户id
       */
      user_id: string;
      stat_time: string;

      /**
       * 总粉丝数
       */
      total_fans: string;

      /**
       * 昨日新增关注数
       */
      new_fans: string;

      /**
       * 昨日取消关注数
       */
      lost_fans: string;

      /**
       * 总观看了
       */
      total_play_count: string;

      /**
       * 昨日观看量
       */
      play_count: string;

      /**
       * 总评论数
       */
      total_comment_count: string;

      /**
       * 昨日评论数
       */
      comment_count: string;

      /**
       * 总作品数
       */
      total_item_count: string;

      /**
       * 昨日作品数
       */
      item_count: string;

      /**
       * 总点赞数
       */
      total_digg_count: string;

      /**
       * 昨日点赞数
       */
      digg_count: string;
    };
    stat_date: string;
  };

  raw?: unknown;
}

/**
 * 皮皮虾数据分析-粉丝数据
 * @param cookie
 * @param start_date 开始日期 Date
 * @param end_date 结束日期 Date
 */
export const getPipixiaDataOverviewFans = async (cookie: string, start_date: Date, end_date: Date) => {
  const result: PipixiaDataOverviewFansOutput = {
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

    result.code = dataOverviewFansResult.status_code;
    result.msg = dataOverviewFansResult.message;
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

export interface PipixiaDataOverviewFansOutput extends BaseResult {
  data?: {
    fans_stat: Array<PipixiaDataOverviewFansItemResponse>;
  };

  raw?: unknown;
}

export const getPipixiaTopics = async (cookie: string, keyWord?: string): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    const topicResult = await getPipixiaTopicResponse(cookie, keyWord);

    result.code = topicResult?.code === 200 ? 0 : topicResult?.code === 0 ? -1 : topicResult?.code;
    result.msg = topicResult.msg ?? '';
    if (topicResult?.data?.list?.length) {
      for (const obj of topicResult.data.list) {
        result.dataList?.push({
          yixiaoerId: obj.tagId?.toString(),
          yixiaoerName: obj.tagName ?? '',
          yixiaoerImageUrl: obj.tagTypeIcon,
          viewNum: obj.hotNumber,
          raw: obj,
        });
      }
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = '请求皮皮虾话题失败，请检查网络或账号状态';
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = '处理皮皮虾话题数据失败';
    } else {
      result.msg = '获取皮皮虾话题失败';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export const getPiPiXiaUserInfo = async (cookie: string, proxy?: IWebProxy): Promise<PlatformAuthorInfo> => {
  const result: PlatformAuthorInfo = {
    code: 0,
    msg: '',
  };

  try {
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfo = await getUserInfoResponse(cookie, webProxy);
    result.yixiaoerId = userInfo?.data?.user?.id_str;
    result.yixiaoerName = userInfo?.data?.user?.name;
    result.yixiaoerImageUrl = userInfo?.data?.user?.avatar?.url_list[0]?.url;
    if (result.yixiaoerImageUrl?.startsWith('//')) {
      result.yixiaoerImageUrl = `https:${result.yixiaoerImageUrl}`;
    }

    result.raw = userInfo?.data?.user;
    result.code = userInfo?.status_code ?? -1;
    result.msg = userInfo?.message;
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

/**
 * 查询视频状态
 * @param cookie
 * @param publishId
 * @param maxPage
 */
export const getPiPiXiaVideoStatus = async (
  cookie: string,
  publishId: string,
  maxPage: number = 10,
): Promise<MediaStatusResultOutput> => {
  const result: MediaStatusResultOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };
  try {
    let geted = false;
    let contentList: PipixiaContentListResponse | undefined = undefined;
    for (let i = 0; i < maxPage; i++) {
      contentList = await getContentListAsync(cookie, 1, i * 10);
      if (contentList?.data?.items?.length) {
        for (const item of contentList?.data?.items) {
          const findId = item?.item_id_str;

          if (findId === publishId) {
            geted = true;
            result.auditStatus = auditStatusEnum.published;
            result.code = 0;
            result.msg = '';
            result.data = item;
            result.create_time = item.create_time * 1000;
            result.docId = item.item_id_str;
            result.coverUrl = item.cover?.url_list[0]?.url;
            result.openUrl = item.share?.douyin_url;
            return result;
          }
        }
        if (geted) {
          break;
        }
      }

      contentList = await getContentListAsync(cookie, 3, i * 10);
      if (contentList?.data?.items?.length) {
        for (const item of contentList?.data?.items) {
          const findId = item?.item_id_str;

          if (findId === publishId) {
            geted = true;
            result.auditStatus = auditStatusEnum.deny;
            result.code = 0;
            result.msg = '';
            result.data = item;
            result.create_time = item.create_time * 1000;
            result.docId = item.item_id_str;
            result.coverUrl = item.cover?.url_list[0]?.url;
            result.openUrl = '';
            return result;
          }
        }
        if (geted) {
          break;
        }
      }

      contentList = await getContentListAsync(cookie, 3, i * 10);
      if (contentList?.data?.items?.length) {
        for (const item of contentList?.data?.items) {
          const findId = item?.item_id_str;

          if (findId === publishId) {
            geted = true;
            result.auditStatus = auditStatusEnum.inAudit;
            result.code = 0;
            result.msg = '';
            result.data = item;
            result.create_time = item.create_time * 1000;
            result.docId = item.item_id_str;
            result.coverUrl = item.cover?.url_list[0]?.url;
            result.openUrl = item.share?.douyin_url;
            return result;
          }
        }
        if (geted) {
          break;
        }
      }
      await Task.Delay(500);
    }
    result.code = contentList?.status_code ?? 404;
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
  result.code = -1;
  result.msg = '未找到作品';
  return result;
};
