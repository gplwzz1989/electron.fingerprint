import { BaseResult } from '../baseResult';
import {
  SouhuhaoMediaContent,
  getContentListAsync,
  getContentSingleListAsync,
  SouhuhaoContentListResponse,
} from './souhuhao-content-list.service';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import {
  getDataOverviewAsync,
  getDataOverviewDetailAll,
  getRangeDataOverview,
  SouhuhaoDataOverviewItemResponse,
} from './souhuhao-data-overview.service';
import {
  getUserIncomeAsync,
  getUserInfoAsync,
  getUserNewsInfoAsync,
  getUserUserHomeDateAsync,
} from './souhuhao-user.service';
import { getSouhuhaoTopicAsync } from './souhuhao-topic.service';
import { getSouhuhaoColumnAsync } from './souhuhao-column.service';
import { getSouhuhaoSubVideoCategoryAsync, getSouhuVideoCategoryAsync } from './souhuhao-category.service';
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
  syncContentMaxPage,
} from '@/media-platform/data-service';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { EventEmitter } from 'events';
import dayjs from 'dayjs';
import { deleteContent } from '@/media-platform/souhuhao/souhuhao-content-delete.service';

/**
 * 搜狐号内容管理
 * @param cookie
 * @param accountId 账号id
 * @param page 页码 默认1
 * @param pageSize 每页数量 默认10
 * @param newsType 数据类型 默认全部（0：全部，1：图文，3：图集，4：视频）
 * @param statusType 数据状态 默认全部（1：全部，2：已发布，4：审核中，7：未通过，6：草稿，5：定时发布）
 */
export const getSouhuhaoContentList = async (
  cookie: string,
  accountId: number,
  page: number = 1,
  pageSize: number = 10,
  newsType: 0 | 1 | 3 | 4 = 0,
  statusType: 1 | 2 | 4 | 5 | 6 | 7 = 1,
) => {
  const result: SouhuhaoContentListOutput = {
    code: 0,
    msg: '',
  };

  try {
    const contentListResult = await getContentListAsync(cookie, page, pageSize, accountId, newsType, statusType);

    result.code = contentListResult.code === 2000000 ? 0 : contentListResult.code;
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

export interface SouhuhaoContentListOutput extends BaseResult {
  data?: {
    news: Array<SouhuhaoMediaContent>;

    /**
     * 作品总数
     */
    totalCount: number;
  };

  raw?: unknown;
}

/**
 * 搜狐号数据分析视频数据
 * @param cookie
 * @param accountId 账号id
 * @param startDate 开始日期 Date
 * @param endDate 结束日期 Date
 * @param type 数据类型 默认视频 （0：视频，1：图文 2：短内容）
 */
export const getSouhuhaoDataOverview = async (
  cookie: string,
  accountId: number,
  startDate: Date,
  endDate: Date,
  type: 0 | 1 | 2 = 0,
) => {
  const result: SouhuhaoDataOverviewOutput = {
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

    const dataOverviewResult = await getDataOverviewAsync(cookie, accountId, start_date_str, end_date_str, type);

    result.code = dataOverviewResult.code === 2000000 ? 0 : dataOverviewResult.code;
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

export interface SouhuhaoDataOverviewOutput extends BaseResult {
  data?: {
    result: {
      list: Array<SouhuhaoDataOverviewItemResponse>;
    };

    /**
     * 新增播放（阅读）
     */
    diff: number;

    /**
     * 总播放（阅读）
     */
    history: number;
    status: string;
  };

  raw?: unknown;
}

/**
 * 搜狐号用户内容统计数据
 * @param cookie
 * @param accountId 账号id
 */
export const getSouhuhaoNewsInfo = async (cookie: string, accountId: number) => {
  const result: SouhuhaoNewsInfoOutput = {
    code: 0,
    msg: '',
  };

  try {
    const userNewsInfoResult = await getUserNewsInfoAsync(cookie, accountId);

    result.code = userNewsInfoResult.code === 2000000 ? 0 : userNewsInfoResult.code;
    result.msg = userNewsInfoResult.msg;
    result.data = userNewsInfoResult.data;
    result.raw = userNewsInfoResult;
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

export interface SouhuhaoNewsInfoOutput extends BaseResult {
  data?: {
    /**
     * 文章未通过审核数
     */
    text_reject_cnt: number;

    /**
     * 文章总数
     */
    text_total_cnt: number;

    /**
     * 文章草稿数
     */
    text_draft_cnt: number;

    /**
     * 文章已发布数量
     */
    text_pass_cnt: number;

    /**
     * 视频草稿数
     */
    video_draft_cnt: number;

    /**
     * 视频总数
     */
    video_total_cnt: number;

    /**
     * 视频已发布数量
     */
    video_pass_cnt: number;

    /**
     * 视频未通过审核数
     */
    video_reject_cnt: number;

    /**
     * 内容总数
     */
    news_total_cnt: number;

    /**
     * 内容通过审核数
     */
    news_pass_cnt: number;

    /**
     * 内容未通过审核数
     */
    news_reject_cnt: number;

    /**
     * 内容草稿数
     */
    news_draft_cnt: number;
  };

  raw?: unknown;
}

/**
 * 搜狐号用户统计数据
 * @param cookie
 * @param accountId 账号id
 */
export const getSouhuhaoUserHomeData = async (cookie: string, accountId: number) => {
  const result: SouhuhaoUserHomeDataOutput = {
    code: 0,
    msg: '',
  };

  try {
    const userHomeDataResult = await getUserUserHomeDateAsync(cookie, accountId);

    result.code = userHomeDataResult.code === 2000000 ? 0 : userHomeDataResult.code;
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

export interface SouhuhaoUserHomeDataOutput extends BaseResult {
  data?: {
    /**
     * 日期
     */
    date: string;

    /**
     * 总播放（阅读）
     */
    totalPv: number;
    totalVv: number;

    /**
     * 昨日新增播放（阅读）
     */
    diff: number;
  };

  raw?: unknown;
}

/**
 * 搜狐号用户信息
 * @param cookie
 */
export const getSouhuhaoUserInfo = async (cookie: string, proxy?: IWebProxy) => {
  const result: SouhuhaoUserInfoOutput = {
    code: 0,
    msg: '',
  };

  try {
    if (!cookie?.includes('mp-cv=')) {
      result.code = 400;
      result.msg = '未获取到用户信息mp,请刷新后重试';
      return result;
    }
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }

    const userIdStr = decodeURIComponent(
      cookie?.includes('mpCreatorId=') ? cookie.split('mpCreatorId=')[1]?.split(';')[0]?.trim() : '',
    );
    const userId = userIdStr?.includes('{') ? JSON.parse(userIdStr)?.id?.toString() : undefined;
    const userInfoResult = await getUserInfoAsync(cookie, webProxy);

    result.code = userInfoResult.code === 2000000 ? 0 : userInfoResult.code;
    result.msg = userInfoResult.msg;
    result.data = userInfoResult.data;
    const accountInfos = userInfoResult?.data?.data?.flatMap((item) => item.accountInfos) ?? [];
    const userItem = userId ? accountInfos.find((item) => item.id.toString() === userId) : accountInfos[0];
    if (userItem?.id) {
      result.authorInfo = {
        code: 0,
        yixiaoerId: userItem.id.toString(),
        yixiaoerName: userItem.nickName,
        yixiaoerImageUrl: userItem.avatar ?? '',
        verify: !(userItem.auditTime == null || userItem.statusName == '驳回'),
        raw: userItem,
      };

      if (result.authorInfo?.yixiaoerImageUrl?.startsWith('//')) {
        result.authorInfo.yixiaoerImageUrl = `https:${result.authorInfo.yixiaoerImageUrl}`;
        userItem.avatar = result.authorInfo.yixiaoerImageUrl;
      }

      //后续全部用这种格式，上面的只是做历史兼容 2024-12-26
      result.yixiaoerId = userItem.id.toString();
      result.yixiaoerName = userItem.nickName;
      result.yixiaoerImageUrl = userItem.avatar ?? '';
      result.verify = userItem.statusName === '通过'; // status=1是通过
      result.raw = userItem;
    }
    //result.raw = userInfoResult;
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

export interface SouhuhaoUserInfoOutput extends PlatformAuthorInfo {
  /**
   * 用户标准化基本信息
   */
  authorInfo?: PlatformAuthorInfo;

  data?: {
    total: number;
    data: [
      {
        orgId: number;
        orgType: number;
        isOwner: boolean;
        accountInfos: Array<{
          /**
           * 账号id
           */
          id: number;

          /**
           * 头像
           */
          avatar: string;

          /**
           * 昵称
           */
          nickName: string;

          /**
           * 账号类型
           */
          accountType: number;

          /**
           * 账号类型详细
           */
          accountTypeName: string;

          /**
           * 状态
           */
          status: number;
          auditType: number;
          orgId: number;

          /**
           * 状态详细
           */
          statusName: string;
          channelId: number;
        }>;
        managerAccounts: Array<{
          /**
           * 账号id
           */
          id: number;

          /**
           * 头像
           */
          avatar: string;

          /**
           * 昵称
           */
          nickName: string;

          /**
           * 账号类型
           */
          accountType: number;

          /**
           * 账号类型详细
           */
          accountTypeName: string;

          /**
           * 状态
           */
          status: number;
          auditType: number;
          orgId: number;

          /**
           * 状态详细
           */
          statusName: string;
          channelId: number;
        }>;
      },
    ];
  };
}

/**
 * 搜狐号收益数据
 * @param cookie
 * @param accountId
 */
export const getSouhuhaoUserIncome = async (cookie: string, accountId: number): Promise<SouhuhaoUserIncomeOutput> => {
  const result: SouhuhaoUserIncomeOutput = {
    code: 0,
    msg: '',
  };

  try {
    const userInfoResult = await getUserIncomeAsync(cookie, accountId);

    result.validAmount = userInfoResult.validAmount;
    result.withdrawingAmount = userInfoResult.withdrawingAmount;
    result.withdrawAmount = userInfoResult.withdrawAmount;
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

export interface SouhuhaoUserIncomeOutput extends BaseResult {
  /**
   * 未提现金额
   */
  validAmount?: number;

  /**
   * 待打款金额
   */
  withdrawingAmount?: number;

  /**
   * 已提现金额
   */
  withdrawAmount?: number;
}

/**
 * 搜狐号话题
 * @param cookie
 * @param accountId 账号id
 * @param keyword 搜索关键字
 */
export const getSouhuhaoTopic = async (
  cookie: string,
  accountId: number,
  keyword: string,
): Promise<SouhuhaoTopicOutput> => {
  const result: SouhuhaoTopicOutput = {
    code: 0,
    msg: '',
  };

  try {
    const topicResult = await getSouhuhaoTopicAsync(cookie, accountId, keyword);

    result.code = topicResult.code === 2000000 ? 0 : topicResult.code;
    result.msg = topicResult.msg;
    result.data = topicResult.data;
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

export interface SouhuhaoTopicOutput extends BaseResult {
  data?: Array<{
    /**
     * 标签id
     */
    id: string;

    /**
     * 标签名称
     */
    name: string;

    /**
     * 标签类型
     */
    type: number;
  }>;
}

/**
 * 获取栏目
 * @param cookie
 * @param accountId 账号id
 */
export const getSouhuhaoColumn = async (cookie: string, accountId: number): Promise<SouhuhaoColumnOutput> => {
  const result: SouhuhaoColumnOutput = {
    code: 0,
    msg: '',
  };

  try {
    const columnResult = await getSouhuhaoColumnAsync(cookie, accountId);

    result.code = columnResult.code === 2000000 ? 0 : columnResult.code;
    result.msg = columnResult.msg;
    result.data = columnResult.data;
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

export interface SouhuhaoColumnOutput extends BaseResult {
  data?: {
    total: number;
    data: Array<{
      /**
       * 栏目id
       */
      id: number;

      /**
       * 栏目名称
       */
      name: string;

      /**
       * 描述
       */
      description: string;

      /**
       * 封面
       */
      cover: string;
      status: number;
      statusName: string;
      topicId: number;
      createTime: string;
      newsId: number;
      newsReadNum: number;
      newsNum: number;
      columnPv: number;
      order: number;
      topicUrl: string;
      operateType: number;
      canShowOrder: boolean;
    }>;
    totalPages: number;
  };
}

export const getSouhuhaoVideoCategory = async (
  cookie: string,
  accountId: number,
): Promise<SouhuhaoVideoCategoryOutput> => {
  const result: SouhuhaoVideoCategoryOutput = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    if (!accountId) {
      const userInfo = await getSouhuhaoUserInfo(cookie);
      accountId = parseInt(userInfo?.yixiaoerId ?? '0');
    }
    const categoryResult = await getSouhuVideoCategoryAsync(cookie, accountId);
    const subCategoryResult = await getSouhuhaoSubVideoCategoryAsync(cookie, accountId);

    const subCategoryData = subCategoryResult.data;

    const categoryItemList: Array<SouhuhaoVideoCategoryItem> = [];

    if (categoryResult.length > 0 && subCategoryData.length > 0) {
      for (const item of categoryResult) {
        const subItem = subCategoryData.filter((subItem) => subItem.channelId === item.id);
        const firstCate: ListItemInfoLevel = {
          yixiaoerId: item.id?.toString(),
          yixiaoerName: item?.name,
          raw: item,
        };
        if (subItem?.length) {
          firstCate.child = [];
          for (const child of subItem) {
            firstCate.child.push({
              yixiaoerId: child.id?.toString(),
              yixiaoerName: child.name,
              raw: child,
            });
          }
        }
        result.dataList?.push(firstCate);
        categoryItemList.push({
          id: item.id,
          name: item.name,
          cmsChannelId: item.cmsChannelId,
          cmsPName: item.cmsPName,
          status: item.status,
          level: item.level,
          subItems: subItem,
        });
      }
    }

    result.data = categoryItemList;
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

export interface SouhuhaoVideoCategoryOutput extends ListLevelInfoResponse {
  data?: Array<SouhuhaoVideoCategoryItem>;
}

export interface SouhuhaoVideoCategoryItem {
  /**
   * 分类id
   */
  id: number;

  /**
   * 分类名称
   */
  name: string;
  cmsChannelId?: number;
  cmsPName?: string;
  status: number;
  level?: number;
  /**
   * 父级分类
   */
  channelId?: number;
  subItems?: Array<SouhuhaoVideoCategoryItem>;
}

/**
 * 获取视频状态
 * @param cookie
 * @param accountId 账号id
 * @param publishId 发布id
 * @param maxPage 最大页码数
 */
export const getSouhuhaoVideoStatus = async (
  cookie: string,
  accountId: number,
  publishId: string,
  maxPage: number = 10,
): Promise<MediaStatusResultOutput> => {
  const result: MediaStatusResultOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };

  try {
    if (!maxPage) {
      maxPage = 1;
    }
    let contentList: SouhuhaoContentListResponse | undefined = undefined;
    for (let i = 0; i <= maxPage; i++) {
      //根据页码获取视频列表
      contentList = await getContentListAsync(cookie, i + 1, 10, accountId, 4, 1);

      if (contentList?.data?.videos?.length) {
        for (const content of contentList.data.videos) {
          const findId = content?.id?.toString();

          if (findId === publishId) {
            result.docId = findId;
            result.create_time = new Date(content.postTime).getTime() / 1000;
            result.data = content;
            const mediaStatus = content?.status;
            switch (mediaStatus) {
              case 1:
                result.auditStatus = auditStatusEnum.draft;
                break;
              case 2:
                result.auditStatus = auditStatusEnum.inAudit;
                break;
              case 3:
                result.auditStatus = auditStatusEnum.deny;
                break;
              case 4:
                result.auditStatus = auditStatusEnum.published;
                result.openUrl = `https://www.sohu.com/a/${content.id}_${content.userId}`;
                break;
              case 5:
                result.auditStatus = auditStatusEnum.prePublish;
                break;
              default:
                result.auditStatus = auditStatusEnum.inAudit;
                break;
            }
            return result;
          }
        }
      } else {
        result.code = contentList?.code === 2000000 ? 0 : contentList?.code == 0 ? -1 : contentList?.code ?? -1;
        result.msg = '未找到作品';
        return result;
      }
    }
    result.code = contentList?.code === 2000000 ? 0 : contentList?.code == 0 ? -1 : contentList?.code ?? -1;
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
 * 获取视频状态
 * @param cookie
 * @param accountId 账号id
 * @param publishId 发布id
 * @param maxPage 最大页码数
 */
export const getSouhuhaoArticleStatus = async (
  cookie: string,
  accountId: number,
  publishId: string,
  maxPage: number = 10,
): Promise<MediaStatusResultOutput> => {
  const result: MediaStatusResultOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };

  try {
    if (!maxPage) {
      maxPage = 1;
    }
    let contentList: SouhuhaoContentListResponse | undefined = undefined;
    for (let i = 0; i <= maxPage; i++) {
      //根据页码获取视频列表
      contentList = await getContentListAsync(cookie, i + 1, 10, accountId, 1, 1);

      if (contentList?.data?.news?.length) {
        for (const content of contentList.data.news) {
          const findId = content?.id?.toString();

          if (findId === publishId) {
            result.docId = findId;
            result.create_time = new Date(content.postTime).getTime() / 1000;
            result.data = content;
            const mediaStatus = content?.status;
            switch (mediaStatus) {
              case 1:
                result.auditStatus = auditStatusEnum.draft;
                break;
              case 2:
                result.auditStatus = auditStatusEnum.inAudit;
                break;
              case 3:
                result.auditStatus = auditStatusEnum.deny;
                break;
              case 4:
                result.auditStatus = auditStatusEnum.published;
                result.openUrl = `https://www.sohu.com/a/${content.id}_${content.userId}`;
                break;
              case 5:
                result.auditStatus = auditStatusEnum.prePublish;
                break;
              default:
                result.auditStatus = auditStatusEnum.inAudit;
                break;
            }

            return result;
          }
        }
      } else {
        result.code = contentList?.code === 2000000 ? 0 : contentList?.code == 0 ? -1 : contentList?.code ?? -1;
        result.msg = '未找到作品';
        return result;
      }
    }
    result.code = contentList?.code === 2000000 ? 0 : contentList?.code == 0 ? -1 : contentList?.code ?? -1;
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
 * @param type video:视频 dynamic:图文
 * @param proxy
 */
export const getSouhuhaoOverViewDashboard = async (
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
    { name: '阅读量', key: 'totalReadsCount' },
    { name: '内容量', key: 'totalWorksCount' },
    { name: '订阅数', key: 'subscribeCount' },
    { name: '获赞数', key: 'likeCount' },
    { name: '阅读数', key: 'readCount' },
    { name: '访问(播放)数', key: 'playCount' },
    { name: '点赞数', key: 'greatCount' },
    { name: '评论数', key: 'commentCount' },
    { name: '分享数', key: 'shareCount' },
  ];

  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const newOverView = {
      all: {
        overview: {},
        thirtydays: {},
      },
    };
    result.dataObj = newOverView as never;
    const user = await getSouhuhaoUserInfo(cookie);

    const homeData = await getUserUserHomeDateAsync(cookie, parseInt(user?.yixiaoerId ?? '0'));
    if (homeData?.data?.totalPv != undefined) {
      result.data?.push({
        name: '阅读量',
        key: 'totalReadsCount',
        value: formatNumber(homeData?.data?.totalVv),
        list: [],
      });
      newOverView.all.overview['totalReadsCount'] = formatNumberNo(homeData?.data?.totalVv);
    } else {
      result.code = homeData?.code ?? errorCode.data_error;
      result.msg = homeData?.msg ?? '';
      return result;
    }

    const contentData = await getUserNewsInfoAsync(cookie, parseInt(user?.yixiaoerId ?? '0'));
    if (contentData?.data?.news_pass_cnt != undefined) {
      result.data?.push({
        name: '内容量',
        key: 'totalWorksCount',
        value: formatNumber(contentData.data.news_pass_cnt),
        list: [],
      });
      newOverView.all.overview['totalWorksCount'] = formatNumberNo(contentData.data.news_pass_cnt);
    } else {
      result.code = homeData?.code ?? errorCode.data_error;
      result.msg = homeData?.msg ?? '';
      result.data = [];
      return result;
    }

    //订阅/获赞暂缓

    const endDate = dayjs().format('YYYY-MM-DD');
    const startDate = dayjs().add(-31, 'days').format('YYYY-MM-DD');

    const viewAllData = await getRangeDataOverview(
      cookie,
      parseInt(user?.yixiaoerId ?? '0'),
      0,
      1,
      startDate,
      endDate,
      30,
      webProxy,
    );

    if (viewAllData?.data?.pvInfo?.length) {
      const dateMap: Map<string, number> = new Map<string, number>();
      viewAllData?.data?.pvInfo.forEach((item) => {
        dateMap.set(item.date, new Date(item.date).getTime());
      });

      let total = formatNumberNo(
        viewAllData?.data?.pvInfo
          .map((obj) => obj.pv)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const read = {
        name: '阅读数',
        key: 'readCount',
        value: formatNumber(total),
        list: viewAllData?.data?.pvInfo.map((obj) => ({
          date: dateMap.get(obj.date) ?? new Date(obj.date).getTime(),
          value: obj.pv,
        })),
      };
      result.data?.push(read);
      newOverView.all.overview[read.key] = total;
      newOverView.all.thirtydays[read.key] = read.list;

      total = formatNumberNo(
        viewAllData?.data?.pvInfo
          .map((obj) => obj.pvValid)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const play = {
        name: '访问(播放)数',
        key: 'playCount',
        value: formatNumber(total),
        list: viewAllData?.data?.pvInfo.map((obj) => ({
          date: dateMap.get(obj.date) ?? new Date(obj.date).getTime(),
          value: obj.pvValid,
        })),
      };
      result.data?.push(play);
      newOverView.all.overview[play.key] = total;
      newOverView.all.thirtydays[play.key] = play.list;

      total = formatNumberNo(
        viewAllData?.data?.pvInfo
          .map((obj) => obj.likeCount)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const great = {
        name: '点赞数',
        key: 'greatCount',
        value: formatNumber(total),
        list: viewAllData?.data?.pvInfo.map((obj) => ({
          date: dateMap.get(obj.date) ?? new Date(obj.date).getTime(),
          value: obj.likeCount,
        })),
      };
      result.data?.push(great);
      newOverView.all.overview[great.key] = total;
      newOverView.all.thirtydays[great.key] = great.list;

      total = formatNumberNo(
        viewAllData?.data?.pvInfo
          .map((obj) => obj.commentCount)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const comment = {
        name: '评论数',
        key: 'commentCount',
        value: formatNumber(total),
        list: viewAllData?.data?.pvInfo.map((obj) => ({
          date: dateMap.get(obj.date) ?? new Date(obj.date).getTime(),
          value: obj.commentCount,
        })),
      };
      result.data?.push(comment);
      newOverView.all.overview[comment.key] = total;
      newOverView.all.thirtydays[comment.key] = comment.list;

      total = formatNumberNo(
        viewAllData?.data?.pvInfo
          .map((obj) => obj.shareCount)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const share = {
        name: '分享数',
        key: 'shareCount',
        value: formatNumber(total),
        list: viewAllData?.data?.pvInfo.map((obj) => ({
          date: dateMap.get(obj.date) ?? new Date(obj.date).getTime(),
          value: obj.shareCount,
        })),
      };
      result.data?.push(share);
      newOverView.all.overview[share.key] = total;
      newOverView.all.overview[share.key] = share.list;
    } else {
      result.code = viewAllData?.code ?? errorCode.data_error;
      result.msg = viewAllData?.msg ?? '';
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
 * 获取企鹅号指定天数内公开作品数据
 * @param cookie
 * @param eventCallBack
 * @param type
 * @param days
 * @param maxCount
 * @param isHeader
 * @param proxy
 */
export const getSouhuhaoContentListView = async (
  cookie: string,
  type: 'video' | 'article' | 'all' = 'all',
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
    //阅读数、访问(播放)数、点赞数、评论数、分享数、投票数
    const lastDate = dayjs().add(-days, 'days').toDate();
    result.headers = [
      { name: '封面', key: 'cover' },
      { name: '标题', key: 'title' },
      { name: '发布时间', key: 'date' },
      { name: '阅读数', key: 'read' },
      { name: '访问(播放)数', key: 'play' },
      { name: '点赞数', key: 'great' },
      { name: '评论数', key: 'comment' },
      { name: '分享数', key: 'share' },
      { name: '投票数', key: 'vote' },
    ];
    if (isHeader) {
      return result;
    }
    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    let contentTmpId = '';
    const user = await getSouhuhaoUserInfo(cookie);
    for (let i = 1; i < syncContentMaxPage; i++) {
      const contentList = await getContentSingleListAsync(
        cookie,
        parseInt(user?.yixiaoerId ?? '0'),
        dayjs(lastDate).format('YYYY-MM-DD'),
        dayjs(new Date()).format('YYYY-MM-DD'),
        i,
        type === 'all' ? 0 : type === 'article' ? 1 : 2,
        webProxy,
      );
      if (contentList?.data?.news?.length) {
        if (contentList.data.news[0].cover === contentTmpId) {
          break;
        } else {
          contentTmpId = contentList.data.news[0].cover;
        }
        let j = 0;
        for (const item of contentList?.data?.news) {
          j++;

          const date = dayjs(item.date).toDate();
          if (result.data.length >= maxCount) {
            //前面可能会有三个置顶的
            if (j <= 3) {
              continue;
            }
            eventCallBack?.emit(syncContentEventName, { ...result });
            return result;
          }
          const dateStr = dayjs(date).format('YYYY-MM-DD HH:mm:ss');
          const newItem: PlatformContentItem = {
            id: '',
            cover: 'http:' + item.cover,
            title: item.title,
            date: dateStr,
            read: formatNumber(item.pv),
            play: formatNumber(item.pvValid),
            great: formatNumber(item.likeCount),
            comment: formatNumber(item.commentCount),
            share: formatNumber(item.shareCount),
            vote: formatNumber(item.voteCount),

            pageUrl: '',
            type: item.type <= 2 ? 'article' : 'video',
          };
          const newItemNum: PlatformContentItemNum = {
            id: '',
            cover: 'http:' + item.cover,
            title: item.title,
            date: dateStr,
            read: formatNumberNo(item.pv),
            play: formatNumberNo(item.pvValid),
            great: formatNumberNo(item.likeCount),
            comment: formatNumberNo(item.commentCount),
            share: formatNumberNo(item.shareCount),
            vote: formatNumberNo(item.voteCount),

            pageUrl: '',
            type: item.type <= 2 ? 'article' : 'video',
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
          result.code = contentList?.code ?? -1;
          result.msg = contentList?.msg ?? '';
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
export const deleteSouhuhaoContent = async (cookie: string, docId: string, accountId: string): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    const deleteResult = await deleteContent(cookie, docId, accountId);
    result.code = deleteResult?.code === 2000000 ? 0 : -1;
    result.msg = deleteResult?.msg;
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
