import { BaseResult } from '../baseResult';
import { getContentListAsync, YidianhaoMediaContent } from './yidianhao-content-list.service';
import { AxiosError } from 'axios';
import crypto from 'crypto';
import { errorCode } from '../errorCode';
import {
  getDataFansDailyAsync,
  getDataOverviewAsync,
  getDataOverviewIncomeAsync,
  getDataOverviewIncomeListAsync,
  YidianhaoDataOverviewItem,
} from './yidianhao-data-overview.service';
import { getUserHomeDataAsync, getUserInfoAsync } from './yidianhao-user.service';
import { getArticleIdAsync } from './yidianhao-base.service';
import {
  ListItemInfoLevel,
  ListLevelInfoResponse,
  MediaStatusResultOutput,
  PlatformAuthorInfo,
  PlatformContentItem,
  PlatformContentItemNum,
} from '@/media-platform/baseModel';
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
import { deleteContent } from '@/media-platform/yidianhao/yidianhao-content-delete.service';
import { getVideoCategoryResponse } from '@/media-platform/wangyihao/wangyihao-category.service';
import { WangyihaoCategoryOutput } from '@/media-platform';
import { getYidianVideoCategoryResponse } from '@/media-platform/yidianhao/yidianhao-category.service';

/**
 * 一点号内容管理
 * @param cookie
 * @param token 平台token
 * @param page 页码
 * @param page_size 每页数量
 * @param status 内容状态 （'0,1,2,3,4,5,6,7,9,14,15'：全部，'2,6,7'：已发布，'1,4,5,14,15'：审核中，'3'：未通过，'0'：草稿，'9'：已删除）
 * @param article_type 内容类型，不传为全部，（-1000001：文章，-1000002：图集，-1000003：视频，-1000004：短内容）
 * @param start_date 开始日期
 * @param end_date 结束日期
 */
export const getYidianhaoContentList = async (
  cookie: string,
  token: string,
  page: number = 1,
  page_size: number = 10,
  status: '0,1,2,3,4,5,6,7,9,14,15' | '2,6,7' | '1,4,5,14,15' | '3' | '0' | '9' = '2,6,7',
  article_type?: -1000001 | -1000002 | -1000003 | -1000004,
  start_date?: Date,
  end_date?: Date,
) => {
  const result: YidianhaoContentListOutput = {
    code: 0,
    msg: '',
  };

  try {
    let start_time = 0;
    let end_time = 0;

    if (start_date && end_date) {
      start_time = start_date.getTime();
      end_time = end_date.getTime();
    }

    const contentListResult = await getContentListAsync(
      cookie,
      page,
      page_size,
      token,
      status,
      start_time,
      end_time,
      article_type,
    );

    result.code = contentListResult?.errorCode != 0 ? 0 : contentListResult?.errorCode;
    result.msg = contentListResult?.reason;
    result.posts = contentListResult.posts;
    result.total = contentListResult.total;
    result.page_total = contentListResult.page_total;
    result.page_current = contentListResult.page_current;
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

export interface YidianhaoContentListOutput extends BaseResult {
  /**
   * 作品总数
   */
  total?: number;

  /**
   * 总页数
   */
  page_total?: number;
  posts?: Array<YidianhaoMediaContent>;

  /**
   * 当前页数
   */
  page_current?: number;
  errorCode?: number;
  reason?: string;
  raw?: unknown;
}

/**
 * 一点号内容分析
 * @param cookie
 * @param start_day 开始日期 （Date）
 * @param end_day 结束日期 （Date）
 */
export const getYidianhaoDataOverview = async (cookie: string, start_day: Date, end_day: Date) => {
  const result: YidianhaoDataOverviewOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const startTime = start_day.getTime();
    const endTime = end_day.getTime();

    const dataOverviewResult = await getDataOverviewAsync(cookie, startTime, endTime);

    const dateListArray: Array<YidianhaoDataOverviewItem> = [];
    if (dataOverviewResult?.code === 0) {
      const dataOverviewRes: { total: YidianhaoDataOverviewItem } = dataOverviewResult?.result?.res;

      if (dataOverviewRes) {
        for (const item in dataOverviewRes) {
          if (item.toString() != 'total') {
            const dateItem: YidianhaoDataOverviewItem = dataOverviewRes[item];
            dateListArray.push(dateItem);
          }
        }
      }
    }

    result.data = dateListArray;
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

export interface YidianhaoDataOverviewOutput extends BaseResult {
  data?: Array<YidianhaoDataOverviewItem>;

  raw?: unknown;
}

/**
 * 一点号结算中心收益数据
 * @param cookie
 */
export const getYidianhaoDataOverviewIncome = async (cookie: string) => {
  const result: YidianhaoDataOverviewIncomeOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const dataOverviewIncomeResult = await getDataOverviewIncomeAsync(cookie);

    result.code = dataOverviewIncomeResult.code;
    result.msg = dataOverviewIncomeResult.reason;
    result.data = dataOverviewIncomeResult.result;
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

export interface YidianhaoDataOverviewIncomeOutput extends BaseResult {
  data?: {
    /**
     * 昨日收益
     */
    outlay_income_latest: string;
    outlay_latest_time: string;

    /**
     * 待提取收益
     */
    outlay_income_wait: string;

    /**
     * 余额
     */
    outlay_income_balance: string;

    /**
     * 冻结收益
     */
    outlay_income_frozen: string;

    /**
     * 总收益
     */
    outlay_income_history: string;
    status: number;
  };
}

/**
 * 一点号收益报表
 * @param cookie
 */
export const getYidianhaoDataOverviewIncomeList = async (cookie: string) => {
  const result: YidianhaoDataOverviewIncomeListOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const dataOverviewIncomeListResult = await getDataOverviewIncomeListAsync(cookie);

    result.code = dataOverviewIncomeListResult.status === 'success' ? 0 : 2;
    result.msg = dataOverviewIncomeListResult.status;
    result.data = dataOverviewIncomeListResult.result;
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

export interface YidianhaoDataOverviewIncomeListOutput extends BaseResult {
  data?: Array<{
    /**
     * 广告费
     */
    click_fee: number;

    /**
     * 鼓励费
     */
    cpm_fee: number;

    /**
     * 奖金
     */
    fixed_fee: number;
    operate_fee: number;
    tax_free_fee: number;

    /**
     * 邀约收益
     */
    invite_fee: number;
    tip_fee: number;

    /**
     * 总收益
     */
    total_fee: number;
    tort_fee: number;
    media_id: number;
    day: string;
  }>;
}

/**
 * 一点号首页数据
 * @param cookie
 */
export const getYidianhaoUserHomeData = async (cookie: string) => {
  const result: YidianhaoUserHomeDataOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const dataOverviewIncomeListResult = await getUserHomeDataAsync(cookie);

    result.code = dataOverviewIncomeListResult.code;
    result.data = dataOverviewIncomeListResult.result;
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

export interface YidianhaoUserHomeDataOutput extends BaseResult {
  data?: {
    /**
     * 推荐量
     */
    viewSum: number;

    /**
     * 昨日推荐量
     */
    viewYesterday: number;

    /**
     * 阅读量
     */
    clickSum: number;

    /**
     * 昨日阅读量
     */
    clickYesterday: number;

    /**
     * 粉丝量
     */
    fansSum: number;

    /**
     * 昨日粉丝量
     */
    fansYesterday: number;
    desc: string;
  };
}

/**
 * 获取token
 * @param cookie
 * @param id 用户信息id
 * @param uid 用户信息uid
 */
export const getYidianhaoToken = async (cookie: string, id: number, uid: string): Promise<YidianhaoTokenOutput> => {
  const result: YidianhaoTokenOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const articleIdResult = await getArticleIdAsync(cookie);

    result.code = articleIdResult.code;

    const preSignStr = `token_pwd=null&&media_id=${id}&&token_user=null&&uid=${uid}&&randomStr=${articleIdResult.result}`;
    result.token = crypto.createHash('md5').update(preSignStr).digest('hex');
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

export interface YidianhaoTokenOutput extends BaseResult {
  token?: string;
}

/**
 * 获取用户信息
 * @param cookie
 * @param proxy
 */
export const getYidianhaoUserInfo = async (cookie: string, proxy?: IWebProxy): Promise<YidianhaoUserInfoOutput> => {
  const result: YidianhaoUserInfoOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfoResult = await getUserInfoAsync(cookie, webProxy);

    result.yixiaoerId = userInfoResult?.data?.uid?.toString();
    result.yixiaoerName = userInfoResult?.data?.media_name?.toString();
    result.yixiaoerImageUrl = userInfoResult?.data?.media_pic;
    result.raw = userInfoResult?.data;
    result.code = userInfoResult.code;
    result.msg = userInfoResult.msg;
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

export interface YidianhaoUserInfoOutput extends PlatformAuthorInfo {
  data?: {
    copyright: number;
    media_name: string;
    id: number;
    media_pic: string;
    uid: string;
    media_summary: string;
    mpCode?: string;
    skUrl?: string;
  };
}

export const getYidianhaoMediaStatus = async (
  cookie: string,
  publishId: string,
  maxPage: number = 10,
): Promise<MediaStatusResultOutput> => {
  const result: MediaStatusResultOutput = {
    code: -1,
    msg: '',
    publishId: publishId,
  };

  try {
    const userInfo = await getYidianhaoUserInfo(cookie);
    const yidianToken = await getYidianhaoToken(cookie, userInfo.data?.id ?? 0, userInfo.data?.uid ?? '');
    const publishStatus = [2, 7];
    const InAuditStatus = [1, 4, 5, 14];

    let mediaResult: YidianhaoContentListOutput | undefined = undefined;
    for (let i = 1; i < maxPage; i++) {
      mediaResult = await getYidianhaoContentList(cookie, yidianToken.token ?? '', i, 10, '0,1,2,3,4,5,6,7,9,14,15');

      if (mediaResult?.posts?.length) {
        for (const item of mediaResult?.posts) {
          const findDocid = item.id?.toString();
          if (findDocid == publishId) {
            result.code = 0;
            result.msg = '';

            if (publishStatus.includes(item.status)) {
              result.auditStatus = auditStatusEnum.published;
            } else if (InAuditStatus.includes(item.status)) {
              result.auditStatus = auditStatusEnum.inAudit;
            } else if (item.status === 3) {
              result.auditStatus = auditStatusEnum.deny;
            } else if (item.status === 0) {
              result.auditStatus = auditStatusEnum.draft;
            } else if (item.status === 9) {
              result.auditStatus = auditStatusEnum.customWithdrawn;
            } else if (item.status === 6) {
              result.auditStatus = auditStatusEnum.prePublish;
              if (item.scheduleTime > 0) {
                result.create_time = item.scheduleTime;
              }
            }

            result.create_time = item.date;
            if (result.auditStatus === auditStatusEnum.published) {
              result.openUrl = `https://www.yidianzixun.com/article/${item['newsId'] ?? item['data']['doc_id']}`;
            }

            result.publishId = findDocid;
            result.docId = findDocid;
            result.coverUrl = item.showCover;
            result.data = item;
            return result;
          }
        }
      } else {
        result.code = mediaResult?.code ?? -1;
        result.msg = '未找到作品';
        return result;
      }
    }
    result.code = mediaResult?.code ?? -1;
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

/**
 *
 * @param cookie
 * @param days 1: 7天数据，2: 30天数据,3: 90天数据
 * @param proxy
 */
export const getYidianhaoOverViewDashboard = async (
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
    { name: '累计推荐量', key: 'totalRecommendsCount' },
    { name: '累计总阅读量', key: 'totalReadsCount' },
    { name: '推荐量', key: 'recommendCount' },
    { name: '阅读量', key: 'readCount' },
    { name: '粉丝量', key: 'totalFansCount' },
    { name: '内容量', key: 'workCount' },
    { name: '分享量', key: 'shareCount' },
    { name: '评论量', key: 'commentCount' },
    { name: '收藏量', key: 'collectCount' },
    { name: '点赞量', key: 'greatCount' },
    { name: '净增粉丝数', key: 'netFansCount' },
  ];

  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    //累计推荐量、累计总阅读量、粉丝量、内容量、分享量、评论量、收藏量、点赞量
    const newOverView = {
      all: {
        overview: {},
        thirtydays: {},
      },
    };
    result.dataObj = newOverView as never;
    const homeData = await getUserHomeDataAsync(cookie, webProxy);
    if (homeData?.result?.clickSum != undefined) {
      result.data?.push({
        name: '累计推荐量',
        key: 'totalRecommendsCount',
        value: formatNumber(homeData?.result?.viewSum),
        list: [],
      });
      result.data?.push({
        name: '累计总阅读量',
        key: 'totalReadsCount',
        value: formatNumber(homeData?.result?.clickSum),
        list: [],
      });
      result.data?.push({
        name: '粉丝量',
        key: 'totalFansCount',
        value: formatNumber(homeData?.result?.fansSum),
        list: [],
      });
      newOverView.all.overview['totalRecommendsCount'] = formatNumberNo(homeData?.result?.viewSum);
      newOverView.all.overview['totalReadsCount'] = formatNumberNo(homeData?.result?.clickSum);
      newOverView.all.overview['totalFansCount'] = formatNumberNo(homeData?.result?.fansSum);
    } else {
      result.code = homeData?.code ?? errorCode.data_error;
      result.msg = homeData?.reason ?? '';
      return result;
    }
    const endDay = dayjs().add(-1, 'days').format('YYYY-MM-DD 00:00:00');
    const startDay = dayjs()
      .add(-(days === 1 ? 7 : 30), 'days')
      .format('YYYY-MM-DD 00:00:00');
    const contentData = await getDataOverviewAsync(
      cookie,
      new Date(startDay).getTime(),
      new Date(endDay).getTime(),
      webProxy,
    );
    if (contentData?.result?.res?.total) {
      const contentDataList: Array<{
        day: string;
        timeStamp: number;
        postNum: number;
        viewDoc: number;
        clickDoc: number;
        shareDoc: number;
        addCommentDoc: number;
        likeDoc: number;
        thumbUpDoc: number;
      }> = [];
      for (const key of Object.keys(contentData.result.res)) {
        if (key?.startsWith('2')) {
          const obj = contentData.result.res[key] as YiDianDailyContentData;
          contentDataList.push({
            day: obj.day,
            timeStamp: new Date(obj.day).getTime(),
            postNum: obj.postNum,
            viewDoc: obj.viewDoc,
            clickDoc: obj.clickDoc,
            shareDoc: obj.shareDoc,
            addCommentDoc: obj.addCommentDoc,
            likeDoc: obj.likeDoc,
            thumbUpDoc: obj.thumbUpDoc,
          });
        }
      }
      const work = {
        name: '内容量',
        key: 'workCount',
        value: formatNumber(contentData.result.res.total.postNum),
        list: contentDataList?.map((obj) => ({
          date: obj.timeStamp,
          value: obj.postNum,
        })),
      };
      result.data?.push(work);
      newOverView.all.overview[work.key] = formatNumberNo(contentData.result.res.total.postNum);
      newOverView.all.thirtydays[work.key] = work.list;

      const recm = {
        name: '推荐量',
        key: 'recommendCount',
        value: formatNumber(contentData.result.res.total.viewDoc),
        list: contentDataList?.map((obj) => ({
          date: obj.timeStamp,
          value: obj.viewDoc,
        })),
      };
      result.data?.push(recm);
      newOverView.all.overview[recm.key] = formatNumberNo(contentData.result.res.total.viewDoc);
      newOverView.all.thirtydays[recm.key] = recm.list;

      const read = {
        name: '阅读量',
        key: 'readCount',
        value: formatNumber(contentData.result.res.total.clickDoc),
        list: contentDataList?.map((obj) => ({
          date: obj.timeStamp,
          value: obj.clickDoc,
        })),
      };
      result.data?.push(read);
      newOverView.all.overview[read.key] = formatNumberNo(contentData.result.res.total.clickDoc);
      newOverView.all.thirtydays[read.key] = read.list;

      const share = {
        name: '分享量',
        key: 'shareCount',
        value: formatNumber(contentData.result.res.total.shareDoc),
        list: contentDataList?.map((obj) => ({
          date: obj.timeStamp,
          value: obj.shareDoc,
        })),
      };
      result.data?.push(share);
      newOverView.all.overview[share.key] = formatNumberNo(contentData.result.res.total.shareDoc);
      newOverView.all.thirtydays[share.key] = share.list;

      const comment = {
        name: '评论量',
        key: 'commentCount',
        value: formatNumber(contentData.result.res.total.addCommentDoc),
        list: contentDataList?.map((obj) => ({
          date: obj.timeStamp,
          value: obj.addCommentDoc,
        })),
      };
      result.data?.push(comment);
      newOverView.all.overview[comment.key] = formatNumberNo(contentData.result.res.total.addCommentDoc);
      newOverView.all.thirtydays[comment.key] = comment.list;

      const collect = {
        name: '收藏量',
        key: 'collectCount',
        value: formatNumber(contentData.result.res.total.likeDoc),
        list: contentDataList?.map((obj) => ({
          date: obj.timeStamp,
          value: obj.likeDoc,
        })),
      };
      result.data?.push(collect);
      newOverView.all.overview[collect.key] = formatNumberNo(contentData.result.res.total.likeDoc);
      newOverView.all.thirtydays[collect.key] = collect.list;

      const great = {
        name: '点赞量',
        key: 'greatCount',
        value: formatNumber(contentData.result.res.total.thumbUpDoc),
        list: contentDataList?.map((obj) => ({
          date: obj.timeStamp,
          value: obj.thumbUpDoc,
        })),
      };
      result.data?.push(great);
      newOverView.all.overview[great.key] = formatNumberNo(contentData.result.res.total.thumbUpDoc);
      newOverView.all.thirtydays[great.key] = great.list;
    } else {
      result.code = homeData?.code ?? errorCode.data_error;
      result.msg = homeData?.reason ?? '';
      result.data = [];
      return result;
    }

    const fansResult = await getDataFansDailyAsync(cookie, days === 2 ? 30 : days === 1 ? 7 : 90);
    if (fansResult?.result?.length) {
      result.data?.push({
        name: '净增粉丝数',
        key: 'netFansCount',
        value: formatNumber(
          fansResult.result
            .map((obj) => obj.fans_pure_add)
            .filter((num) => typeof num === 'number' && !isNaN(num))
            .reduce((acc, num) => acc + num, 0),
        ),
        list: fansResult.result?.map((obj) => ({ date: new Date(obj.date).getTime() ?? 0, value: obj.fans_pure_add })),
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

interface YiDianDailyContentData {
  day: string;
  timeStamp: number;
  postNum: number;
  viewDoc: number;
  clickDoc: number;
  shareDoc: number;
  addCommentDoc: number;
  likeDoc: number;
  thumbUpDoc: number;
}

/**
 * 获取企一点号指定天数内公开作品数据
 * @param cookie
 * @param eventCallBack
 * @param type
 * @param days
 * @param maxCount
 * @param isHeader
 * @param proxy
 */
export const getYidianhaoContentListView = async (
  cookie: string,
  type: 'video' | 'article' | 'all',
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
    //封面、标题、发布时间、作品类型
    // 推荐、
    // 阅读、评论、分享、收藏
    const lastDate = dayjs().add(-days, 'days').toDate();
    result.headers = [
      { name: '封面', key: 'cover' },
      { name: '标题', key: 'title' },
      { name: '发布时间', key: 'date' },
      { name: '推荐', key: 'reCommand' },
      { name: '阅读', key: 'read' },
      { name: '播放', key: 'play' },
      // { name: '赞同', key: 'great' },
      { name: '评论', key: 'comment' },
      { name: '分享', key: 'share' },
      { name: '收藏', key: 'collect' },
      // { name: '喜欢', key: 'like' },
    ];
    if (isHeader) {
      return result;
    }
    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    let contentTmpId = 0;
    for (let i = 1; i < syncContentMaxPage; i++) {
      const contentList = await getContentListAsync(
        cookie,
        i,
        10,
        '',
        '2,6,7',
        undefined,
        undefined,
        type === 'video' ? -1000003 : type === 'article' ? -1000001 : undefined,
        webProxy,
      );
      if (contentList?.posts?.length) {
        if (contentList.posts[0].id === contentTmpId) {
          break;
        } else {
          contentTmpId = contentList.posts[0].id;
        }
        let j = 0;
        for (const item of contentList?.posts) {
          j++;
          if (type === 'all') {
            if (item.type != 0 && item.type != 5 && item.type != 257) {
              continue;
            }
          }
          const date = dayjs(item.date).toDate();
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
            id: item.id.toString(),
            cover: item.showCover,
            title: item.title,
            date: dateStr,
            reCommand: formatNumber(item.all_data?.viewDoc),
            read: formatNumber(item.all_data?.clickDoc),
            play: formatNumber(item.all_data?.clickDoc),
            comment: formatNumber(item.all_data?.addCommentDoc),
            share: formatNumber(item.all_data?.shareDoc),
            collect: formatNumber(item.all_data?.likeDoc),
            pageUrl: `https://www.yidianzixun.com/article/${item['newsId'] ?? item['data']['doc_id']}`,
            type: type != 'all' ? type : item.type === 0 ? 'article' : 'video',
          };
          const newItemNum: PlatformContentItemNum = {
            id: item.id.toString(),
            cover: item.showCover,
            title: item.title,
            date: dateStr,
            reCommand: formatNumberNo(item.all_data?.viewDoc),
            read: formatNumberNo(item.all_data?.clickDoc),
            comment: formatNumberNo(item.all_data?.addCommentDoc),
            share: formatNumberNo(item.all_data?.shareDoc),
            collect: formatNumberNo(item.all_data?.likeDoc),
            pageUrl: `https://www.yidianzixun.com/article/${item['newsId'] ?? item['data']['doc_id']}`,
            type: type != 'all' ? type : item.type === 0 ? 'article' : 'video',
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
        if (!result.data.length) {
          result.code =
            contentList?.errorCode ??
            (contentList?.toString()?.includes("Cannot read property 'id' of null") ? 401 : 0);
          result.msg = contentList?.reason;
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
 * @param accountId
 */
export const deleteYidianhaoContent = async (cookie: string, docId: string): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    const deleteResult = await deleteContent(cookie, docId);
    result.code = deleteResult?.code ?? -1;
    result.msg = deleteResult?.reason ?? deleteResult?.status;
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

export const getYidianhaoVideoCategory = async (cookie: string): Promise<ListLevelInfoResponse> => {
  const result: ListLevelInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    const categoryResult = await getYidianVideoCategoryResponse(cookie);
    if (categoryResult?.types) {
      let i = 0;
      for (const item of Object.keys(categoryResult?.types)) {
        if (item === '其他') {
          continue;
        }
        i++;
        const firstCate: ListItemInfoLevel = {
          yixiaoerId: i.toString() ?? '',
          yixiaoerName: item,
        };
        const children = categoryResult.types[item] as Array<string>;
        if (children?.length) {
          // children = children.sort((a, b) => a.localeCompare(b, 'zh-CN'));
          firstCate.child = [];
          let j = 0;
          for (const child of children) {
            if (child === '其他') {
              continue;
            }
            j++;
            firstCate.child?.push({
              yixiaoerId: j?.toString() ?? '',
              yixiaoerName: child,
            });
          }
        }
        result.dataList?.push(firstCate);
      }
      result.dataList = [...(result.dataList ?? [])]?.sort((a, b) => {
        // 使用 localeCompare 确保中文按拼音正确排序
        return a.yixiaoerName.localeCompare(b.yixiaoerName, 'zh-CN');
      });
    }
    result.code = categoryResult?.status === 'success' ? 0 : -1;
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
