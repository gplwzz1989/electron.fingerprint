import { BaseResult } from '../baseResult';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import { getUserDataAsync, getUserInfoAsync } from './xiguashipin-user.service';
import {
  getContentListAsync,
  getShortContentListAsync,
  XiguashipinMediaContent,
  XiguashipinShortMediaContent,
} from './xiguashipin-content-list.service';
import {
  getDataOverviewAsync,
  getDataOverviewStatisticAsync,
  getIncomeAsync,
  getSingleDataStatisticAsync,
  getXiguashipinSingleDataOverviewAsync,
  XiguashipinOverviewStatisticResponse,
} from './xiguashipin-data-overview.service';
import { getTopics, getTopicsWords, XiguashipinTopicInfo } from './xiguashipin-topics.service';
import { getFriendResponse, XiguashipinFriendInfo } from './xiguashipin-friend.service';
import { auditStatusEnum, Task } from '../../utils';
import { PlatformAuthorInfo } from '@/media-platform';

/**
 * 西瓜视频个人主页基本信息
 * @param cookie
 * @param user_id 用户user_id
 */
export const getXiguashipinUserHomeData = async (cookie: string, user_id: string) => {
  const result: XiguashipinUserHomeDataOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const userHomeDataResult = await getUserDataAsync(cookie, user_id);

    result.code = userHomeDataResult.status;
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

export interface XiguashipinUserHomeDataOutput extends BaseResult {
  data?: {
    /**
     * 粉丝数
     */
    fansNum: string;

    /**
     * 关注数
     */
    followNum: string;

    /**
     * 获赞数
     */
    diggNum: string;
  };

  raw?: unknown;
}

/**
 * 西瓜是内容管理（视频数据）
 * @param cookie
 * @param keyword 搜索关键字
 * @param status 数据类型 默认已发布（1：全部，2：已发布，3：未通过，4：审核中，5：仅我可见）
 * @param offset 分页起始数字 默认0（首页为0，下一页返回的NextOffset）
 * @param size 每页数量 默认20 （20）
 */
export const getXiguashipinContentList = async (
  cookie: string,
  keyword: string,
  status: 1 | 2 | 3 | 4 | 5 = 2,
  offset: number = 0,
  size: number = 20,
) => {
  const result: XiguashipinContentListOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const contentListResult = await getContentListAsync(cookie, status, keyword, offset, size);

    result.code = contentListResult.status;
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

export interface XiguashipinContentListOutput extends BaseResult {
  data?: {
    NextOffset: number;

    /**
     * 总数
     */
    Total: number;
    IncomeReadyTs: number;
    IndexTotal: number;
    ArticleList: Array<XiguashipinMediaContent>;
  };
  raw?: unknown;
}

/**
 * 西瓜视频小视频列表
 * @param cookie
 * @param cursor 分页起始位置（首页为0，下一页使用上一页返回对应EndCursor参数）
 * @param pageSize 每页数量（20）
 */
export const getXiguashipinShortContentList = async (cookie: string, cursor: number = 0, pageSize: number = 20) => {
  const result: XiguashipinShortContentListOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const contentListResult = await getShortContentListAsync(cookie, cursor, pageSize);

    result.code = contentListResult.status;
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

export interface XiguashipinShortContentListOutput extends BaseResult {
  data?: {
    /**
     * 小视频总数
     */
    TotalCount: number;
    StartCursor: number;

    /**
     * 下一页cursor参数
     */
    EndCursor: number;

    /**
     * 是否还有分页
     */
    HasMore: boolean;
    Contents: Array<XiguashipinShortMediaContent>;
  };

  raw?: unknown;
}

/**
 * 西瓜视频数据分析顶部统计数据
 * @param cookie
 * @param timeRangeType 时间类型，（0为累计，2为指定日期）
 * @param tab 数据类型（0：概览，1：播放分析，2：互动分析，4：粉丝分析）
 * @param startDate 开始日期 （昨天往前推对应的天数：如：7天，15天，30天）
 * @param endDate 结束日期（昨天）
 */
export const getXiguashipinDataOverviewStatistic = async (
  cookie: string,
  timeRangeType: 0 | 1,
  tab: 0 | 1 | 2 | 4,
  startDate: Date,
  endDate: Date,
) => {
  const result: XiguashipinDataOverviewStatisticOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    let start_date_str = startDate.toISOString();
    if (start_date_str.length > 0) {
      start_date_str = start_date_str.slice(0, 10);
    }

    let end_date_str = endDate.toISOString();
    if (end_date_str.length > 0) {
      end_date_str = end_date_str.slice(0, 10);
    }

    const dataOverviewStatisticResult = await getDataOverviewStatisticAsync(
      cookie,
      timeRangeType,
      tab,
      start_date_str,
      end_date_str,
    );

    result.code = dataOverviewStatisticResult.status;
    result.msg = dataOverviewStatisticResult.message;
    result.data = dataOverviewStatisticResult.data;
    result.raw = dataOverviewStatisticResult;
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

export interface XiguashipinDataOverviewStatisticOutput extends BaseResult {
  data?: {
    overviewList: Array<XiguashipinOverviewStatisticResponse>;
  };
  raw?: unknown;
}

/**
 * 西瓜视频报表数据
 * @param cookie
 * @param startDate 开始日期，Date（结束日期往前指定天数）
 * @param endDate 结束日期 Date（昨天）
 * @param timeRangeType 时间类型，（0为累计，2为指定日期）
 * @param dataType 数据类型（1：播放量，3评论量，4昨日净增粉，5展现量，6粉丝量，7播放时长，8弹幕量，9点赞量，10强烈推荐，11收藏量，12分享量，13视频收益，14昨日涨粉，15昨日掉粉）
 */
export const getXiguashipinDataOverview = async (
  cookie: string,
  startDate: Date,
  endDate: Date,
  timeRangeType: 0 | 1,
  dataType: 1 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15,
) => {
  const result: XiguashipinDataOverviewOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    let start_date_str = startDate.toISOString();
    if (start_date_str.length > 0) {
      start_date_str = start_date_str.slice(0, 10);
    }

    let end_date_str = endDate.toISOString();
    if (end_date_str.length > 0) {
      end_date_str = end_date_str.slice(0, 10);
    }

    const dataOverviewResult = await getDataOverviewAsync(
      cookie,
      start_date_str,
      end_date_str,
      timeRangeType,
      dataType,
    );

    result.code = dataOverviewResult.status;
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

export interface XiguashipinDataOverviewOutput extends BaseResult {
  data?: {
    /**
     * 对应日期的值
     */
    data: Array<number>;

    /**
     * 日期数据
     */
    dates: Array<string>;
  };

  raw?: unknown;
}

/**
 * 西瓜视频收益数据
 * @param cookie
 */
export const getXiguashipinIncome = async (cookie: string) => {
  const result: XiguashipinIncomeOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const incomeResult = await getIncomeAsync(cookie);

    result.code = incomeResult.status;
    result.msg = incomeResult.message;
    result.data = incomeResult.data;
    result.raw = incomeResult;
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

export interface XiguashipinIncomeOutput extends BaseResult {
  data?: {
    LastReadyDate: string;

    /**
     * 总收益
     */
    TotalIncome: number;
  };

  raw?: unknown;
}

/**
 * 西瓜视频单篇统计数据
 * @param cookie
 * @param groupId 作品id
 * @param startDate 发布日期
 * @param endDate 昨日日期
 * @param tab 数据类型（0：概览，1：播放分析，2：互动分析，3：粉丝分析，4：收益分析）
 */
export const getXiguashipinSingleDataStatistic = async (
  cookie: string,
  groupId: string,
  startDate: Date,
  endDate: Date,
  tab: 0 | 1 | 2 | 4 = 0,
): Promise<XiguashipinSingleDataStatisticOutput> => {
  const result: XiguashipinSingleDataStatisticOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    let start_date_str = startDate.toISOString();
    if (start_date_str.length > 0) {
      start_date_str = start_date_str.slice(0, 10);
    }

    let end_date_str = endDate.toISOString();
    if (end_date_str.length > 0) {
      end_date_str = end_date_str.slice(0, 10);
    }

    const singleDataOverviewStatisticResult = await getSingleDataStatisticAsync(
      cookie,
      groupId,
      start_date_str,
      end_date_str,
      tab,
    );

    result.code = singleDataOverviewStatisticResult.status;
    result.msg = singleDataOverviewStatisticResult.message;
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

export interface XiguashipinSingleDataStatisticOutput extends BaseResult {
  data?: {
    overviewList: Array<{
      MeetCondition: boolean;

      /**
       * 对应类型时间范围类总数据
       */
      TotalCount: number;

      /**
       * 对应类型时间范围内粉丝总数居
       */
      FansCount: number;

      /**
       * 数据类型
       */
      DataType: number;

      /**
       * 数据文本
       */
      TotalCountText: string;

      /**
       * 最后更新总数据日期
       */
      LatestUpdateDateTotal: string;

      /**
       * 粉丝数据文本
       */
      FansCountText: string;

      /**
       * 最后更新粉丝总数居日期
       */
      LatestUpdateDateFans: string;
    }>;
  };

  raw?: unknown;
}

/**
 * 西瓜视频单篇报表分析
 * @param cookie
 * @param groupId 作品id
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @param timeRangeType 查询日期范围（0累计，1日期范围）
 * @param dataType 数据类型（1：播放量，3评论量，4昨日净增粉，5展现量，6粉丝量，7平均播放时长，8弹幕量，9点赞量，10强烈推荐，11收藏量，12分享量，13视频收益，14播放转换率，15涨粉量，16：掉粉量，25：10秒跳出率，26：播放完成率）
 */
export const getXiguashipinSingleDataOverview = async (
  cookie: string,
  groupId: string,
  startDate: Date,
  endDate: Date,
  timeRangeType: 0 | 1,
  dataType: 1 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 25 | 26,
) => {
  const result: XiguashipinSingleDataOverviewOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    let start_date_str = startDate.toISOString();
    if (start_date_str.length > 0) {
      start_date_str = start_date_str.slice(0, 10);
    }

    let end_date_str = endDate.toISOString();
    if (end_date_str.length > 0) {
      end_date_str = end_date_str.slice(0, 10);
    }

    const singleDataOverviewResult = await getXiguashipinSingleDataOverviewAsync(
      cookie,
      groupId,
      start_date_str,
      end_date_str,
      timeRangeType,
      dataType,
    );

    result.code = singleDataOverviewResult.status;
    result.msg = singleDataOverviewResult.message;
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

export interface XiguashipinSingleDataOverviewOutput extends BaseResult {
  data?: {
    IsShowLoyal: false;
    /**
     * 日期
     */
    dates: Array<string>;

    /**
     * 相应数据
     */
    data: Array<number>;

    /**
     * 相应粉丝数据
     */
    fansData: Array<number>;
  };

  raw?: unknown;
}

/**
 * 获取用户信息
 * @param cookie
 */
export const getXiguashipinUserInfo = async (cookie: string): Promise<XiguashipinUserInfoOutput> => {
  const result: XiguashipinUserInfoOutput = {
    code: 0,
    msg: 'ok',
    data: {
      userId: '',
      userName: '',
      userImage: '',
    },
  };

  try {
    const incomeResult = await getUserInfoAsync(cookie);

    result.yixiaoerId = incomeResult?.data?.userId?.toString();
    result.yixiaoerName = incomeResult?.data?.userName?.toString();
    result.yixiaoerImageUrl = incomeResult?.data?.userImage?.toString();
    result.raw = incomeResult?.data;
    result.code = incomeResult.status;
    result.msg = incomeResult.message;
    result.data = incomeResult.data;
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

export interface XiguashipinUserInfoOutput extends PlatformAuthorInfo {
  data: {
    userId: string;
    userName: string;
    userImage: string;
  };
}

export const getXiguashipinTopicList = async (cookie: string, keyWord: string): Promise<XiguashipinTopicListOutPut> => {
  const result: XiguashipinTopicListOutPut = {
    code: 0,
    msg: 'ok',
  };

  try {
    const searchWords = await getTopicsWords(cookie, keyWord);
    const keyWords = searchWords.data.slice(0, 10).map((obj) => obj.hashtag_name);
    const topics = await getTopics(cookie, keyWords);
    if (topics.data.length > 0) {
      for (const item of topics.data) {
        item.hashtag_name = item.name;
      }
    }
    result.code = topics.code ?? -1;
    result.msg = topics.message;
    result.data = topics.data;
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

export const getXiguashipinFriendList = async (
  cookie: string,
  keyWord: string,
): Promise<XiguashipinFriendListOutPut> => {
  const result: XiguashipinFriendListOutPut = {
    code: 0,
    msg: 'ok',
    data: [],
  };

  try {
    const friendResponse = await getFriendResponse(cookie, keyWord);

    if (friendResponse.data?.suggest) {
      for (const item of friendResponse.data.suggest) {
        result.data?.push(item.user.info);
      }
    }
    result.code = friendResponse.err_no ?? -1;
    result.msg = friendResponse.message;
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
export interface XiguashipinTopicListOutPut extends BaseResult {
  /**
   * 话题列表
   */
  data?: Array<XiguashipinTopicInfo>;
}

/**
 * 西瓜好友
 */
export interface XiguashipinFriendListOutPut extends BaseResult {
  /**
   * 好友/用户列表
   */
  data?: Array<XiguashipinFriendInfo>;
}

/**
 * 查询发布视频额度审核状态
 * @param cookie
 * @param publishId
 * @param maxPage
 */
export const getXiguaVideoStatus = async (
  cookie: string,
  publishId: string,
  maxPage: number = 10,
): Promise<XiguaVideoStatusResultOutput> => {
  const result: XiguaVideoStatusResultOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };
  try {
    const miniCorsor = 0;
    for (let i = 0; i < maxPage; i++) {
      const statusResult = await getContentListAsync(cookie, 1, '', i * 20, 20);
      if (statusResult?.data?.ArticleList?.length > 0) {
        for (const item of statusResult.data.ArticleList) {
          const findDocId = item.ItemId.toString();
          if (findDocId === publishId) {
            result.code = 0;
            const statusStr = item.ArticleStatus?.toString();
            switch (statusStr) {
              //4草稿 3未通过 2已发布  6审核中
              case '4':
                result.auditStatus = auditStatusEnum.draft;
                break;
              case '3':
                result.auditStatus = auditStatusEnum.deny;
                break;
              case '2':
                result.auditStatus = auditStatusEnum.published;
                break;
              case '6':
                result.auditStatus = auditStatusEnum.inAudit;
                break;
              case '5':
                result.auditStatus = auditStatusEnum.notPublic;
                break;
              case '18':
                result.auditStatus = auditStatusEnum.notPublic;
                break;
              default:
                result.auditStatus = auditStatusEnum.inAudit;
                break;
            }
            if (item['TimerData']?.['TimerStatus']?.toString() == '1') {
              result.auditStatus = auditStatusEnum.prePublish;
            }
            const statusString = item?.ArticleStatusText?.toString();
            if (statusString?.includes('可见')) {
              result.auditStatus = auditStatusEnum.notPublic;
            }
            result.docId = findDocId;
            result.create_time = item.CreateTime;
            result.openUrl = item?.ShareUrl?.toString() ?? 'https://www.toutiao.com/item/' + findDocId + '/';
            result.coverUrl = item.VideoData?.CoverUrl;
            result.data = item;
            return result;
          }
        }
      }
      await Task.Delay(1000);
    }
    if (!result.docId) {
      const statusResult = await getShortContentListAsync(cookie, miniCorsor, 20);
      if (statusResult?.data?.Contents.length > 0) {
        for (const item of statusResult.data.Contents) {
          const findDocId = item.ArticleAttr?.ItemId?.toString();
          if (findDocId === publishId) {
            result.code = 0;
            const statusStr = item.ArticleAttr.Status?.toString();
            switch (statusStr) {
              //4草稿 3未通过 2已发布  6审核中
              case '4':
                result.auditStatus = auditStatusEnum.draft;
                break;
              case '3':
                result.auditStatus = auditStatusEnum.deny;
                break;
              case '2':
                result.auditStatus = auditStatusEnum.published;
                break;
              case '6':
                result.auditStatus = auditStatusEnum.inAudit;
                break;
              case '5':
                result.auditStatus = auditStatusEnum.notPublic;
                break;
              case '18':
                result.auditStatus = auditStatusEnum.notPublic;
                break;
              default:
                result.auditStatus = auditStatusEnum.inAudit;
                break;
            }
            if (item.ArticleAttr['TimerStatus'] == '1') {
              result.auditStatus = auditStatusEnum.prePublish;
            }
            const statusString = item?.ArticleAttr?.StatusDesc?.toString();
            if (statusString?.includes('可见')) {
              result.auditStatus = auditStatusEnum.notPublic;
            }
            result.docId = findDocId;
            result.create_time = item.ArticleAttr.ShowTime;
            result.openUrl = 'https://www.toutiao.com/item/' + findDocId + '/';
            result.coverUrl = item?.ArticleAttr?.CoverImage?.ImageURL;
            result.data = item;
            return result;
          }
        }
      }
    }
    result.code = -1;
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

export const getXiguaMiniVideoStatus = async (
  cookie: string,
  publishId: string,
  maxPage: number = 10,
): Promise<XiguaVideoStatusResultOutput> => {
  const result: XiguaVideoStatusResultOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };
  try {
    const miniCorsor = 0;
    for (let i = 0; i < maxPage; i++) {
      const statusResult = await getShortContentListAsync(cookie, miniCorsor, 20);
      if (statusResult?.data?.Contents.length > 0) {
        for (const item of statusResult.data.Contents) {
          const findDocId = item.ArticleAttr?.ItemId?.toString();
          if (findDocId === publishId) {
            result.code = 0;
            const statusStr = item.ArticleAttr.Status?.toString();
            switch (statusStr) {
              //4草稿 3未通过 2已发布  6审核中
              case '4':
                result.auditStatus = auditStatusEnum.draft;
                break;
              case '3':
                result.auditStatus = auditStatusEnum.deny;
                break;
              case '2':
                result.auditStatus = auditStatusEnum.published;
                break;
              case '6':
                result.auditStatus = auditStatusEnum.inAudit;
                break;
              case '5':
                result.auditStatus = auditStatusEnum.notPublic;
                break;
              case '18':
                result.auditStatus = auditStatusEnum.notPublic;
                break;
              default:
                result.auditStatus = auditStatusEnum.inAudit;
                break;
            }
            if (item.ArticleAttr['TimerStatus'] == '1') {
              result.auditStatus = auditStatusEnum.prePublish;
            }
            const statusString = item?.ArticleAttr?.StatusDesc?.toString();
            if (statusString?.includes('可见')) {
              result.auditStatus = auditStatusEnum.notPublic;
            }
            result.docId = findDocId;
            result.create_time = item.ArticleAttr.ShowTime;
            result.openUrl = 'https://www.toutiao.com/item/' + findDocId + '/';
            result.coverUrl = item?.ArticleAttr?.CoverImage?.ImageURL;
            result.data = item;
            return result;
          }
        }
      }
    }
    if (!result.docId) {
      const statusResult = await getContentListAsync(cookie, 1, '', 0, 20);
      if (statusResult?.data?.ArticleList?.length > 0) {
        for (const item of statusResult.data.ArticleList) {
          const findDocId = item.ItemId.toString();
          if (findDocId === publishId) {
            result.code = 0;
            const statusStr = item.ArticleStatus?.toString();
            switch (statusStr) {
              //4草稿 3未通过 2已发布  6审核中
              case '4':
                result.auditStatus = auditStatusEnum.draft;
                break;
              case '3':
                result.auditStatus = auditStatusEnum.deny;
                break;
              case '2':
                result.auditStatus = auditStatusEnum.published;
                break;
              case '6':
                result.auditStatus = auditStatusEnum.inAudit;
                break;
              case '5':
                result.auditStatus = auditStatusEnum.notPublic;
                break;
              case '18':
                result.auditStatus = auditStatusEnum.notPublic;
                break;
              default:
                result.auditStatus = auditStatusEnum.inAudit;
                break;
            }
            if (item['TimerData']?.['TimerStatus']?.toString() == '1') {
              result.auditStatus = auditStatusEnum.prePublish;
            }
            const statusString = item?.ArticleStatusText?.toString();
            if (statusString?.includes('可见')) {
              result.auditStatus = auditStatusEnum.notPublic;
            }
            result.docId = findDocId;
            result.create_time = item.CreateTime;
            result.openUrl = item?.ShareUrl?.toString() ?? 'https://www.toutiao.com/item/' + findDocId + '/';
            result.coverUrl = item.VideoData?.CoverUrl;
            result.data = item;
            return result;
          }
        }
      }
    }
    result.code = -1;
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

export interface XiguaVideoStatusResultOutput {
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
  data?: XiguashipinMediaContent | XiguashipinShortMediaContent;
}
