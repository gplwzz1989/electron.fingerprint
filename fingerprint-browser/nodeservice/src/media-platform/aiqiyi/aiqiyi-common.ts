import { BaseResult } from '../baseResult';
import {
  AiqiyiArticleMediaContent,
  AiqiyiContentListInput,
  AiqiyiMediaContent,
  getAiqiyiArticleDraftListResponse,
  getArticleContentListAsync,
  getVideoContentListAsync,
  getVideoSingleContentListAsync,
} from './aiqiyi-content-list.service';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import {
  AiqiyiDataOverviewItemResponse,
  getDailyFansOverviewAsync,
  getDataOverviewAsync,
  getSingleDataOverviewAsync,
  getSingleDataOverviewStatisticAsync,
} from './aiqiyi-data-overview.service';
import { getUserHomeDataAsync, getUserIncomeAsync, getUserInfoAsync } from '../aiqiyi/aiqiyi-user.service';
import {
  ListItemInfoLevel,
  ListLevelInfoResponse,
  MediaStatusResultOutput,
  PlatformAuthorInfo,
  PlatformContentItem,
  PlatformContentItemNum,
} from '../baseModel';
import { auditStatusEnum, formatNumber, formatNumberNo, Task } from '@/utils';
import { createKuaiProxyAgent, IWebProxy, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import {
  AccountContentListViewOutPut,
  AccountReportDataOutPut,
  syncContentEventName,
  syncContentMaxPage,
} from '@/media-platform/data-service';
import { HttpsProxyAgent } from 'https-proxy-agent';
import dayjs from 'dayjs';
import { EventEmitter } from 'events';
import { PubContentEnum } from '@/cloud/model/TypeEnum';
import {
  deleteArticleContent,
  deleteArticleDraftContent,
  deleteVideoContent,
  deleteVideoDraftContent,
} from './aiqiyi-deletecontent.service';
import { getIqiYiVideoCategoryResponse } from './aiqiyi-category.service';

/**
 * 爱奇艺作品管理
 * @param cookie
 * @param pageNo 页码 默认1
 * @param pageSize 每页数量 默认11
 * @param contentStatus 默认全部 0为全部，1为已发布，2为发布中，3为发布失败，4为草稿
 * @param proxy
 */
export const getAiqiyiVideoContentList = async (
  cookie: string,
  pageNo: number = 1,
  pageSize: number = 11,
  contentStatus: 0 | 1 | 2 | 3 | 4 = 0,
  proxy?: KuaiDaiLiProxy,
) => {
  const result: AiqiyiContentListOutput = {
    code: 0,
    msg: '',
  };

  try {
    let params: AiqiyiContentListInput = {
      pageNo: pageNo,
      pageSize: pageSize,
      order: 'desc',
      orderBy: 'createTime',
    };

    let webProxy: HttpsProxyAgent<string> | object | undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    if (contentStatus === 1) {
      // 已发布
      params = { ...params, publishStatus: 1 };
    } else if (contentStatus === 2) {
      // 发布中
      params = { ...params, publishSituation: 0 };
    } else if (contentStatus === 3) {
      // 发布失败
      params = { ...params, publishSituation: 1 };
    } else if (contentStatus === 4) {
      // 草稿
      params = { ...params, publishStatus: 9 };
    }

    const contentListResult = await getVideoContentListAsync(cookie, params, webProxy);

    result.code = contentListResult.code;
    result.msg = contentListResult.msg;
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

export interface AiqiyiContentListOutput extends BaseResult {
  data?: {
    order: string;
    orderBy: string;

    /**
     * 当前页码
     */
    pageNo: number;

    /**
     * 每页数量
     */
    pageSize: number;

    /**
     * 作品总数
     */
    totalCount: number;

    /**
     * 总页数
     */
    totalPages: number;
    result: Array<AiqiyiMediaContent>;
  };
  raw?: unknown;
}

/**
 * 爱奇艺作品数据
 * @param cookie
 * @param startDate 开始日期 Date
 * @param endDate 结束日期 Date
 * @param dateType 数据日期范围（2：7天，3：15天，4：30天），默认数据4
 */
export const getAiqiyiDataOverview = async (
  cookie: string,
  startDate: Date,
  endDate: Date,
  dateType: 2 | 3 | 4 = 4,
) => {
  const result: AiqiyiDataOverviewOutput = {
    code: 0,
    msg: '',
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

    const dataOverviewResult = await getDataOverviewAsync(cookie, start_date_str, end_date_str, dateType);

    result.code = dataOverviewResult.code;
    result.msg = dataOverviewResult.msg;
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

export interface AiqiyiDataOverviewOutput extends BaseResult {
  data?: {
    resultSize: number;
    status: string;
    data: Array<AiqiyiDataOverviewItemResponse>;
  };

  raw?: unknown;
}

/**
 * 爱奇艺首页数据
 * @param cookie
 */
export const getAiqiyiUserHomeData = async (cookie: string) => {
  const result: AiqiyiUserHomeDataOutput = {
    code: 0,
    msg: '',
  };

  try {
    const userHomeDataResult = await getUserHomeDataAsync(cookie);

    result.code = userHomeDataResult.code;
    result.msg = userHomeDataResult.msg;
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

export interface AiqiyiUserHomeDataOutput extends BaseResult {
  data?: {
    /**
     * 总播放量
     */
    totalVv: number;

    /**
     * 昨日播放量
     */
    yestodayVv: number;

    /**
     * 播放数据是否已更新
     */
    vvUpdated: boolean;

    /**
     * 总点赞数
     */
    totalLikeNum: number;

    /**
     * 昨日点赞数
     */
    yesterdayLikeNum: number;

    /**
     * 总展现量
     */
    totalPv: number;

    /**
     * 总播放时长（单位毫秒）
     */
    totalPlaytime: number;
    totalBvvDuration: number;

    /**
     * 播放完成率
     */
    playCompletePercent: number;

    /**
     * 总评论数
     */
    totalCommentNum: number;

    /**
     * 总粉丝数
     */
    fansTotalNum: number;

    /**
     * 昨日粉丝数
     */
    fansChange: number;

    /**
     * 粉丝数据是否已更新
     */
    fansUpdated: boolean;
  };

  raw?: unknown;
}

/**
 * 爱奇艺收益数据
 * @param cookie
 */
export const getAiqiyiUserIncome = async (cookie: string) => {
  const result: AiqiyiUserIncomeOutput = {
    code: 0,
    msg: '',
  };

  try {
    const userIncomeResult = await getUserIncomeAsync(cookie);

    result.code = userIncomeResult.code;
    result.msg = userIncomeResult.msg;
    result.data = userIncomeResult.data;
    result.raw = userIncomeResult;
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

export interface AiqiyiUserIncomeOutput extends BaseResult {
  data?: {
    /**
     * 总收益
     */
    totalIncome: number;
  };

  raw?: unknown;
}

/**
 * 爱奇艺单篇统计数据
 * @param cookie
 * @param qipuId 作品id
 */
export const getAiqiyiSingleDataOverviewStatistic = async (
  cookie: string,
  qipuId: number,
): Promise<AiqiyiSingleDataOverviewStatisticOutput> => {
  const result: AiqiyiSingleDataOverviewStatisticOutput = {
    code: 0,
    msg: '',
  };

  try {
    const singleDataOverviewStatisticResult = await getSingleDataOverviewStatisticAsync(cookie, qipuId);

    result.code = singleDataOverviewStatisticResult.code;
    result.msg = singleDataOverviewStatisticResult.msg;
    result.data = singleDataOverviewStatisticResult.data;
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

export interface AiqiyiSingleDataOverviewStatisticOutput extends BaseResult {
  data?: {
    /**
     * 总播放
     */
    totalVv: number;

    /**
     * 总播放
     */
    totalPv: number;

    /**
     * 总评论
     */
    totalCommentNum: number;

    /**
     * 总新增粉丝数
     */
    totalFansIncrNum: number;

    /**
     * 总点赞
     */
    totalLikeNum: number;

    /**
     * 总播放时长（毫秒）
     */
    totalPlaytime: number;
    totalBvvDuration: number;

    /**
     * 总播放完成率
     */
    playCompletePercent: number;
  };
}

/**
 * 爱奇艺单篇报表数据
 * @param cookie
 * @param qipuId 作品id
 * @param startDate 开始日期
 * @param endDate 结束日期
 */
export const getAiqiyiSingleDataOverview = async (
  cookie: string,
  qipuId: number,
  startDate: Date,
  endDate: Date,
): Promise<AiqiyiSingleDataOverviewOutput> => {
  const result: AiqiyiSingleDataOverviewOutput = {
    code: 0,
    msg: '',
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

    const singleDataOverviewResult = await getSingleDataOverviewAsync(cookie, qipuId, start_date_str, end_date_str);

    result.code = singleDataOverviewResult.code;
    result.msg = singleDataOverviewResult.msg;
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

export interface AiqiyiSingleDataOverviewOutput extends BaseResult {
  data?: {
    resultSize: number;
    status: string;
    videoDetailData: Array<{
      /**
       * 日期
       */
      dt: string;

      /**
       * 评论数
       */
      commentNum: number;

      /**
       * 展现量
       */
      pv: number;

      /**
       * 播放量
       */
      vv: number;

      /**
       * 新增粉丝数
       */
      fansIncrNum: number;

      /**
       * 播放时长
       */
      playtime: number;

      /**
       * 播放完成率
       */
      completionDegree: number;

      /**
       * 点赞数
       */
      likeNum: number;

      /**
       * 分享数
       */
      shareNum: number;

      /**
       * 弹幕数
       */
      barrageNum: number;
      vvXDuration: number;

      /**
       * 粉丝播放量
       */
      fansVv: number;

      /**
       * 粉丝播放时长
       */
      fansPlaytime: number;

      /**
       * 粉丝完成播放率
       */
      fansCompletionDegree: number;

      /**
       * 粉丝评论量
       */
      fansCommentNum: number;

      /**
       * 粉丝点赞量
       */
      fansLikeNum: number;

      /**
       * 粉丝弹幕数
       */
      fansBarrageNum: number;
    }>;
  };

  raw?: unknown;
}

/**
 * 爱奇艺用户信息
 * @param cookie
 * @param proxy
 */
export const getAiqiyiUserInfo = async (cookie: string, proxy?: IWebProxy): Promise<AiqiyiUserInfoOutput> => {
  const result: AiqiyiUserInfoOutput = {
    code: 0,
    msg: '',
  };

  try {
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfoResult = await getUserInfoAsync(cookie, webProxy);

    result.yixiaoerId = userInfoResult?.data?.uid?.toString();
    result.yixiaoerName = userInfoResult?.data?.nickname?.toString();
    result.yixiaoerImageUrl = userInfoResult?.data?.icon;
    result.raw = userInfoResult.data;
    result.code = userInfoResult.code;
    result.msg = userInfoResult.msg;
    result.data = userInfoResult.data;
    if (userInfoResult?.data?.verified == false) {
      //未入驻
      result.code = errorCode.accountUnVerify;
      return result;
    }
    if (userInfoResult?.data?.certificateType === null) {
      /**
       * 未实名
       */
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

export interface AiqiyiUserInfoOutput extends PlatformAuthorInfo {
  data?: {
    uid: number;
    icon: string;
    nickname: string;
  };
}

export const getAiqiyiArticleContentList = async (
  cookie: string,
  status: 'NORMAL' | 'DELETE',
  pageNo: number = 1,
  pageSize: number = 20,
): Promise<AiqiyiArticleContentListOutput> => {
  const result: AiqiyiArticleContentListOutput = {
    code: 0,
    msg: '',
  };

  try {
    const articleContentListResult = await getArticleContentListAsync(cookie, pageNo, pageSize, status);

    result.code = articleContentListResult.code === 'A00000' ? 0 : 2;
    result.msg = articleContentListResult.msg;
    result.data = articleContentListResult.data;
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

export interface AiqiyiArticleContentListOutput extends BaseResult {
  data?: {
    total: number;
    num: number;
    list: Array<AiqiyiArticleMediaContent>;
  };
}

/**
 * 查询视频作品状态
 * @param cookie
 * @param publishId 作品id,来源于发布时产生的publishId
 * @param maxPage 查询最大翻页数，默认10页
 */
export const getAiqiyiVideoStatus = async (
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
    let contentList: AiqiyiContentListOutput | undefined = undefined;
    for (let i = 1; i < maxPage; i++) {
      contentList = await getAiqiyiVideoContentList(cookie, i, 11, 0);
      if (contentList?.data?.result && contentList?.data?.result?.length > 0) {
        for (const item of contentList?.data?.result) {
          let findId = item?.qipuId?.toString();
          if (item.videoStatus === '草稿') {
            findId = item['videoId']?.toString();
          }
          if (findId === publishId) {
            geted = true;
            switch (item.videoStatus) {
              case '草稿':
                result.auditStatus = auditStatusEnum.draft;
                break;
              case '已发布':
                result.auditStatus = auditStatusEnum.published;
                break;
              case '已下线':
                result.auditStatus = auditStatusEnum.customWithdrawn;
                break;
              case '定时发布中':
                result.auditStatus = auditStatusEnum.prePublish;
                break;
              case '封面图转码失败':
                result.auditStatus = auditStatusEnum.executeFail;
                break;
              case '视频转码中':
                result.auditStatus = auditStatusEnum.waitExecute;
                break;
              case '视频转码失败':
                result.auditStatus = auditStatusEnum.waitExecute;
                break;
              default:
                result.auditStatus = auditStatusEnum.inAudit;
                break;
            }
            result.code = 0;
            result.msg = '';
            result.data = item;
            result.create_time = new Date(item.createTime).getTime();
            result.docId = result.publishId;
            result.coverUrl = item?.coverImage;
            result.openUrl = item.pageUrl;
            return result;
          }
        }
        if (geted) {
          break;
        }
      } else {
        result.code = contentList?.code ?? -1;
        result.msg = '未找到作品';
        break;
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
 * 查询作品状态
 * @param cookie
 * @param publishId 作品id,来源于发布时产生的publishId
 * @param maxPage 查询最大翻页数，默认10页
 * @param title
 */
export const getAiqiyiArticleStatus = async (
  cookie: string,
  publishId: string,
  maxPage: number = 5,
  title?: string,
): Promise<MediaStatusResultOutput> => {
  const result: MediaStatusResultOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };
  try {
    //todo 等待查询方案
    result.docId = publishId;
    result.create_time = Date.now();
    result.auditStatus = auditStatusEnum.published;
    if (maxPage > 0) {
      result.data = {};
    }
    const publishNum = parseInt(publishId);
    const draft = await getAiqiyiArticleDraftListResponse(cookie);
    if (draft?.data?.drafts?.length) {
      title = title?.trim();
      for (const item of draft?.data?.drafts) {
        if (item.lastEditTime.toString() == publishId || (title && title === item.title?.trim())) {
          result.code = 0;
          result.msg = '';
          result.data = item;
          result.create_time = item.lastEditTime;
          //result.docId = item.draftId?.toString();
          result.auditStatus = auditStatusEnum.inAudit;
          //return result;
        }
      }
    }
    let geted = false;
    let contentList: AiqiyiArticleContentListOutput | undefined = undefined;
    for (let i = 1; i < maxPage; i++) {
      contentList = await getAiqiyiArticleContentList(cookie, 'NORMAL', i);
      if (contentList?.data?.list) {
        for (const item of contentList?.data?.list) {
          const findId = item?.releaseDate ?? item?.modifyDate;
          if ((findId >= publishNum && findId - publishNum < 60) || (title && title === item.feedTitle?.trim())) {
            geted = true;
            result.auditStatus = auditStatusEnum.published;
            result.code = 0;
            result.msg = '';
            result.data = item;
            result.create_time = findId;
            result.docId = `${item.feedId.toString()}_${item.circleQipuId?.toString()}`;
            result.coverUrl = item?.wallIcon;
            result.openUrl = item.shareUrl;
            return result;
          }
        }
        if (geted) {
          break;
        }
      }
      if (result.docId) {
        return result;
      }

      contentList = await getAiqiyiArticleContentList(cookie, 'DELETE', i);
      if (contentList?.data?.list) {
        for (const item of contentList?.data?.list) {
          const findId = item?.modifyDate;
          if (findId >= publishNum && findId - publishNum < 60) {
            geted = true;
            result.auditStatus = auditStatusEnum.deny;
            result.code = 0;
            result.msg = '';
            result.data = item;
            result.create_time = findId;
            result.docId = `${item.feedId.toString()}_${item.circleQipuId?.toString()}`;
            result.coverUrl = item?.wallIcon;
            result.openUrl = '';
            return result;
          }
        }
        if (geted) {
          break;
        }
      }
      if (!contentList?.data?.list?.length && !contentList?.data?.list?.length) {
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
 *
 * @param cookie
 * @param days 1: 7天数据，2: 30天数据,3: 90天数据
 * @param proxy
 */
export const getAiqiyiOverViewDashboard = async (
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
    { name: '总播放量', key: 'totalPlaysCount' },
    { name: '总粉丝量', key: 'totalFansCount' },
    { name: '展现量', key: 'impressionCount' },
    { name: '播放量', key: 'playCount' },
    { name: '播放时长', key: 'playDuration' },
    { name: '播放完成率', key: 'playCompletionRate' },
    { name: '评论量', key: 'commentCount' },
    { name: '点赞量', key: 'greatCount' },
    { name: '弹幕量', key: 'danmuCount' },
    { name: '分享量', key: 'shareCount' },
    { name: '涨粉量', key: 'fansCount' },
  ];

  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    //总播放量、总粉丝量
    // 总播放量、总粉丝量 展现量、播放时长、播放完成率、评论量、点赞量、弹幕量、分享量
    const newOverView = {
      all: {
        overview: {},
        thirtydays: {},
      },
    };
    result.dataObj = newOverView as never;
    const homeData = await getUserHomeDataAsync(cookie, webProxy);
    if (homeData?.data?.fansTotalNum != undefined) {
      result.data?.push({
        name: '总播放量',
        key: 'totalPlaysCount',
        value: formatNumber(homeData?.data?.totalVv),
        list: [],
      });
      result.data?.push({
        name: '总粉丝量',
        key: 'totalFansCount',
        value: formatNumber(homeData?.data?.fansTotalNum),
        list: [],
      });
      newOverView.all.overview['totalPlaysCount'] = formatNumberNo(homeData?.data?.totalVv);
      newOverView.all.overview['totalFansCount'] = formatNumberNo(homeData?.data?.fansTotalNum);
    } else {
      result.code = homeData?.code ?? errorCode.data_error;
      result.msg = homeData?.msg ?? '';
      return result;
    }
    const endDay = dayjs().add(-1, 'days').format('YYYY-MM-DD');
    const startDay = dayjs()
      .add(-(days === 1 ? 7 : 30), 'days')
      .format('YYYY-MM-DD');
    const contentData = await getDataOverviewAsync(cookie, startDay, endDay, days === 1 ? 2 : 4, webProxy);
    if (contentData?.data?.data?.length) {
      const dateMap: Map<string, number> = new Map();
      contentData.data.data.forEach((item) => {
        dateMap.set(item.date, new Date(item.date).getTime());
      });

      let total = formatNumberNo(
        contentData?.data?.data
          .map((obj) => obj.pv)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const recm = {
        name: '展现量',
        key: 'impressionCount',
        value: formatNumber(total),
        list: contentData?.data?.data.map((obj) => ({
          date: dateMap.get(obj.date) ?? new Date(obj.date).getTime(),
          value: obj.pv,
        })),
      };
      result.data?.push(recm);
      newOverView.all.overview[recm.key] = total;
      newOverView.all.thirtydays[recm.key] = recm.list;

      total = formatNumberNo(
        contentData?.data?.data
          .map((obj) => obj.vv)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const play = {
        name: '播放量',
        key: 'playCount',
        value: formatNumber(total),
        list: contentData?.data?.data.map((obj) => ({
          date: dateMap.get(obj.date) ?? new Date(obj.date).getTime(),
          value: obj.vv,
        })),
      };
      result.data?.push(play);
      newOverView.all.overview[play.key] = total;
      newOverView.all.thirtydays[play.key] = play.list;

      total = formatNumberNo(
        parseInt(
          (
            contentData?.data?.data
              .map((obj) => obj.playtime)
              .filter((num) => typeof num === 'number' && !isNaN(num))
              .reduce((acc, num) => acc + num, 0) / 1000
          ).toFixed(2),
        ),
      );
      const dura = {
        name: '播放时长',
        key: 'playDuration',
        value: formatNumber(
          parseInt(
            (
              contentData?.data?.data
                .map((obj) => obj.playtime)
                .filter((num) => typeof num === 'number' && !isNaN(num))
                .reduce((acc, num) => acc + num, 0) /
              (60 * 1000)
            ).toFixed(1),
          ),
        ),
        list: contentData?.data?.data.map((obj) => ({
          date: dateMap.get(obj.date) ?? new Date(obj.date).getTime(),
          value: obj.playtime / (60 * 1000),
        })),
      };
      result.data?.push(dura);
      newOverView.all.overview[dura.key] = total;
      newOverView.all.thirtydays[dura.key] = contentData?.data?.data.map((obj) => ({
        date: dateMap.get(obj.date) ?? new Date(obj.date).getTime(),
        value: obj.playtime / 1000,
      }));

      const playfi = {
        name: '播放完成率',
        key: 'playCompletionRate',
        value: formatNumber(
          contentData?.data?.data
            .map((obj) => obj.completionDegree)
            .filter((num) => typeof num === 'number' && !isNaN(num))
            .reduce((acc, num) => acc + num, 0) / 30,
        ),
        list: contentData?.data?.data.map((obj) => ({
          date: dateMap.get(obj.date) ?? new Date(obj.date).getTime(),
          value: obj.completionDegree,
        })),
      };
      result.data?.push(playfi);
      newOverView.all.overview[playfi.key] = parseFloat(playfi.value);
      newOverView.all.thirtydays[playfi.key] = playfi.list;

      total = formatNumberNo(
        contentData?.data?.data
          .map((obj) => obj.commentNum)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const comment = {
        name: '评论量',
        key: 'commentCount',
        value: formatNumber(total),
        list: contentData?.data?.data.map((obj) => ({
          date: dateMap.get(obj.date) ?? new Date(obj.date).getTime(),
          value: obj.commentNum,
        })),
      };
      result.data?.push(comment);
      newOverView.all.overview[comment.key] = total;
      newOverView.all.thirtydays[comment.key] = comment.list;

      total = formatNumberNo(
        contentData?.data?.data
          .map((obj) => obj.barrageNum)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const danmu = {
        name: '弹幕量',
        key: 'danmuCount',
        value: formatNumber(total),
        list: contentData?.data?.data.map((obj) => ({
          date: dateMap.get(obj.date) ?? new Date(obj.date).getTime(),
          value: obj.barrageNum,
        })),
      };
      result.data?.push(danmu);
      newOverView.all.overview[danmu.key] = total;
      newOverView.all.thirtydays[danmu.key] = danmu.list;

      total = formatNumberNo(
        contentData?.data?.data
          .map((obj) => obj.shareNum)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const share = {
        name: '分享量',
        key: 'shareCount',
        value: formatNumber(total),
        list: contentData?.data?.data.map((obj) => ({
          date: dateMap.get(obj.date) ?? new Date(obj.date).getTime(),
          value: obj.shareNum,
        })),
      };
      result.data?.push(share);
      newOverView.all.overview[share.key] = total;
      newOverView.all.thirtydays[share.key] = share.list;

      total = formatNumberNo(
        contentData?.data?.data
          .map((obj) => obj.likeNum)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const great = {
        name: '点赞量',
        key: 'greatCount',
        value: formatNumber(total),
        list: contentData?.data?.data.map((obj) => ({
          date: dateMap.get(obj.date) ?? new Date(obj.date).getTime(),
          value: obj.likeNum,
        })),
      };
      result.data?.push(great);
      newOverView.all.overview[great.key] = total;
      newOverView.all.thirtydays[great.key] = great.list;
    } else {
      result.code = homeData?.code ?? errorCode.data_error;
      result.msg = homeData?.msg ?? '';
      result.data = [];
      return result;
    }

    //粉丝数据
    const fansResult = await getDailyFansOverviewAsync(cookie, days === 2 ? 30 : days === 1 ? 7 : 90, startDay, endDay);
    if (fansResult?.data?.content?.length) {
      if (fansResult?.data?.content[0]?.dt?.length < 5) {
        fansResult.data.content = fansResult.data.content.slice(1);
      }
      const total = formatNumberNo(
        fansResult.data.content
          .map((obj) => obj.incr_num)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const fan = {
        name: '涨粉量',
        key: 'fansCount',
        value: formatNumber(total),
        list: fansResult.data.content?.map((obj) => ({
          date: new Date(obj.dt).getTime() ?? 0,
          value: obj.incr_num,
        })),
      };
      result.data?.push(fan);
      newOverView.all.overview[fan.key] = total;
      newOverView.all.thirtydays[fan.key] = fan.list;
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
 * 获取爱奇艺号指定天数内公开作品数据
 * @param cookie
 * @param eventCallBack
 * @param type
 * @param days
 * @param maxCount
 * @param isHeader
 * @param proxy
 */
export const getAiqiyiContentListView = async (
  cookie: string,
  type: 'video' = 'video',
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
    //封面、标题、
    // 创建时间
    // 展现量、播放量、播放时长、播放完成率、评论量、点赞量、弹幕
    // 数、分享量
    const lastDate = dayjs().add(-days, 'days').toDate();
    result.headers = [
      { name: '封面', key: 'cover' },
      { name: '标题', key: 'title' },
      { name: '发布时间', key: 'date' },
      { name: '展现量', key: 'reCommand' },
      { name: '播放量', key: 'play' },
      { name: '播放时长', key: 'playTime' },
      { name: '播放完成率', key: 'finishPlay' },
      { name: '评论量', key: 'comment' },
      { name: '点赞量', key: 'great' },
      { name: '弹幕数', key: 'danmu' },
      { name: '分享量', key: 'share' },
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

    const startDate = dayjs().add(-1, 'days').format('YYYY-MM-DD');
    const endDate = dayjs().add(-7, 'days').format('YYYY-MM-DD');
    let contentTmpiD = 0;
    for (let i = 1; i < syncContentMaxPage; i++) {
      const contentList = await getVideoSingleContentListAsync(cookie, startDate, endDate, i, 10, webProxy);
      if (contentList?.data?.videoDetailData?.length) {
        if (contentList.data.videoDetailData[0].qipuId === contentTmpiD) {
          break;
        } else {
          contentTmpiD = contentList.data.videoDetailData[0].qipuId;
        }
        let j = 0;
        for (const item of contentList?.data.videoDetailData) {
          j++;

          const date = dayjs(item?.createTime).toDate();
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
            id: item.qipuId?.toString(),
            cover: item.coverImage,
            title: item.displayName,
            date: dateStr,
            reCommand: formatNumber(item.pv),
            play: formatNumber(item.vv),
            playTime: formatNumber(item.playtime / (1000 * 60)),
            finishPlay: formatNumber(item.completionDegree),
            comment: formatNumber(item.commentNum),
            great: formatNumber(item.likeNum),
            danmu: formatNumber(item.barrageNum),
            share: formatNumber(item.shareNum),
            type: 'video',
          };
          const newItemNum: PlatformContentItemNum = {
            id: item.qipuId?.toString(),
            cover: item.coverImage,
            title: item.displayName,
            date: dateStr,
            reCommand: formatNumberNo(item.pv),
            play: formatNumberNo(item.vv),
            playTime: formatNumberNo(item.playtime / (1000 * 60)),
            finishPlay: formatNumberNo(item.completionDegree),
            comment: formatNumberNo(item.commentNum),
            great: formatNumberNo(item.likeNum),
            danmu: formatNumberNo(item.barrageNum),
            share: formatNumberNo(item.shareNum),
            type: 'video',
          };
          //当前数据无法组装pageurl
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
          result.msg = contentList?.msg;
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
 * 删除作品
 * @param cookie
 * @param contentType
 * @param docId
 * @param isDraft
 */
export const deleteAiqiyiContent = async (
  cookie: string,
  contentType: PubContentEnum,
  docId: string,
  isDraft: boolean,
): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    if (contentType === PubContentEnum.video) {
      const deleteRe = isDraft ? await deleteVideoDraftContent(cookie, docId) : await deleteVideoContent(cookie, docId);
      result.code = deleteRe?.code ?? -1;
      result.msg = deleteRe?.msg ?? '';
    } else if (contentType === PubContentEnum.article) {
      const deleteRe = isDraft
        ? await deleteArticleDraftContent(cookie, docId)
        : await deleteArticleContent(cookie, docId);
      result.code = deleteRe?.code === 'A00000' ? 0 : -1;
      result.msg = deleteRe?.msg ?? '';
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

/**
 * 获取分类
 * @param cookie
 */
export const getAiqiYiVideoCategory = async (cookie: string): Promise<ListLevelInfoResponse> => {
  const result: ListLevelInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    const resultRe = await getIqiYiVideoCategoryResponse(cookie);
    if (resultRe?.data?.classifyDataList) {
      for (const item of resultRe.data?.classifyDataList) {
        const firstCate: ListItemInfoLevel = {
          yixiaoerId: item?.classifyId ?? '',
          yixiaoerName: item.classifyName,
        };

        firstCate.raw = item;
        result.dataList?.push(firstCate);
      }
    }
    result.code = resultRe?.code ?? -2;
    result.msg = resultRe?.msg;
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
