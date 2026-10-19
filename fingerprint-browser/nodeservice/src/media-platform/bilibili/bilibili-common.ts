import { BaseResult } from '../baseResult';
import {
  getMemberInfoResponse,
  getPrivilegeResponse,
  getUserInfoResponse,
  getUserLikePlayResponse,
  getUserOnlyFansResponse,
} from './bilibili-base.service';
import { AxiosError } from 'axios';
import {
  BilibiliArticleCategoryInfo,
  BilibiliVideoCategoryInfo,
  getArticleCategoryResponse,
  getVideoCategoryResponse,
} from './bilibili-category.service';
import { BilibiliVideoTopicInfo, getVideoTopicResponse, searchVideoTopicResponse } from './bilibili-topic.service';
import {
  BilibiliVideoParticipationTopicInfo,
  BilibiliVideoParticipationTopicQuery,
  getBilibiliVideoParticipationTopicResponse,
  searchBilibiliVideoParticipationTopicResponse,
  toBilibiliVideoParticipationTopicListItem,
} from './bilibili-participation-topic.service';
import { auditStatusEnum, formatNumber, formatNumberNo, Task } from '../../utils';
import {
  BilibiliArticleContentListResponse,
  BilibiliArticleMediaContent,
  BilibiliContentListResponse,
  BilibiliMediaContent,
  getArticleContentListAsync,
  getContentListAsync,
} from './bilibili-content-list.service';
import {
  BilibiliCoreData,
  BilibiliTendencyData,
  getArticleDataOverviewAsync,
  getArticleDataOverviewCoreAsync,
  getDataOverviewAllAsync,
  getDataOverviewAsync,
  getDataOverviewCoreAsync,
  getIncomeStatisticAsync,
} from './bilibili-data-overview.service';
import { errorCode } from '../errorCode';
import { BilibiliVideoFriendInfo, getVideoFriendResponse } from './bilibili-friend.service';
import {
  AccountContentListViewOutPut,
  AccountReportDataOutPut,
  syncContentEventName,
  syncContentMaxPage,
} from '../data-service';
import {
  DataColumn,
  ListInfoResponse,
  ListItemInfo,
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
import { createKuaiProxyAgent, IWebProxy, KuaiDaiLiProxy } from '../webproxy';
import { EventEmitter } from 'events';
import { deleteArticleResponse } from '@/media-platform/bilibili/bilibili-content-delete.service';
import { HttpsProxyAgent } from 'https-proxy-agent';
import {
  BilibiliPublicAuthorSearchResponse,
  getBilibiliPublicAuthorSearchResponse,
} from './bilibili-user.service';

/**
 * 获取用户信息
 * @param cookie
 */
export const getBilibiliUserInfo = async (cookie: string, proxy?: IWebProxy): Promise<BilibiliUserInfoOutput> => {
  const result: BilibiliUserInfoOutput = {
    code: 0,
    msg: '',
  };

  try {
    if (!(cookie ?? '').includes('bili_jct=')) {
      console.debug(' B站cookie缺失bili_jct-----登录失效', cookie);
      result.code = -101;
      result.msg = '登录失效,缺失jct';
      return result;
    }
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfoResult = await getUserInfoResponse(cookie, webProxy);

    result.yixiaoerId = userInfoResult?.data?.mid?.toString();
    result.yixiaoerName = userInfoResult?.data?.uname?.toString();
    result.yixiaoerImageUrl = userInfoResult?.data.face?.toString();
    result.raw = userInfoResult?.data;
    result.code = userInfoResult.code;
    result.data = userInfoResult.data;
    result.msg = userInfoResult.message;
    if (result.code == -101) {
      console.debug(' B站登录失效', cookie);
      result.msg = '登录失效';
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

export interface BilibiliUserInfoOutput extends PlatformAuthorInfo {
  /**
   * 状态码 0正常，非0异常
   */
  code: number;
  /**
   * 数据体
   */
  data?: {
    isLogin: boolean;
    email_verified: boolean;
    /**
     * 头像url地址
     */
    face: string;
    /**
     * 等级信息，暂时无用
     */
    level_info: { current_level: number; current_min: number; current_exp: number; next_exp: number };
    /**
     * 作者id
     */
    mid: number;
    mobile_verified: number;
    money: number;
    moral: number;
    official: { role: number; title: string; desc: string; type: number };
    officialVerify: { type: number; desc: string };
    scores: number;
    /**
     * 作者昵称
     */
    uname: string;
    /**
     * 钱包信息
     */
    wallet: {
      mid: number;
      // noinspection SpellCheckingInspection
      bcoin_balance: number;
      coupon_balance: number;
      coupon_due_time: number;
    };
    has_shop: boolean;
    shop_url: string;
    allowance_count: number;
    answer_status: number;
    is_senior_member: number;
  };
}

/**
 * 获取用户会员信息
 * @param cookie
 */
export const getBilibiliMemberInfo = async (cookie: string): Promise<BilibiliMemberInfoOutput> => {
  const result: BilibiliMemberInfoOutput = {
    code: 0,
    msg: '',
  };

  try {
    const memberResult = await getMemberInfoResponse(cookie);

    result.code = memberResult.code;
    result.msg = memberResult.message;
    result.data = memberResult.data;
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

export interface BilibiliMemberInfoOutput extends BaseResult {
  /**
   * 数据体
   */
  data?: {
    /**
     * 用户id
     */
    mid: number;
    /**
     * 用户昵称
     */
    uname: string;
    /**
     * 用户显示id
     */
    userid: string;
    /**
     * 个性签名
     */
    sign: string;
    /**
     * 生日
     */
    birthday: string;
    /**
     * 性别
     */
    sex: string;
    /**
     * 会员等级 如:正式会员、新手
     */
    rank: string;
  };
}

/**
 * 获取用户高权益
 * @param cookie
 */
export const getBilibiliPrivilege = async (cookie: string): Promise<BilibiliPrivilegeOutput> => {
  const result: BilibiliPrivilegeOutput = {
    code: 0,
    msg: '',
  };
  try {
    const privilegeResult = await getPrivilegeResponse(cookie);

    result.code = privilegeResult.code;
    result.msg = privilegeResult.message;
    result.data = privilegeResult.data;
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

export interface BilibiliPrivilegeOutput extends BaseResult {
  /**
   * 数据体
   */
  data?: {
    can_edit: boolean;
    /**
     * 是否禁言/封号
     */
    forbid: boolean;
    id: number;
    /**
     * 是否专栏作者，如果为false，则不能发布专栏文章
     */
    is_author: boolean;
    level: boolean;
  };
}

/**
 * 获取视频分类/分区
 * @param cookie
 */
export const getBilibiliVideoCategory = async (cookie: string): Promise<BilibiliVideoCategoryOutput> => {
  const result: BilibiliVideoCategoryOutput = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    const videoCategoryResult = await getVideoCategoryResponse(cookie);

    result.code = videoCategoryResult.code;
    result.msg = videoCategoryResult.message;
    result.data = videoCategoryResult.data;
    if (result.data?.type_list?.length) {
      for (const item of result.data?.type_list) {
        const firstCate: ListItemInfoLevel = {
          yixiaoerId: item.id?.toString() ?? '',
          yixiaoerName: item.name,
        };
        if (item.children?.length) {
          firstCate.child = [];
          for (const child of item.children) {
            child.children = undefined;
            firstCate.child?.push({
              yixiaoerId: child.id?.toString() ?? '',
              yixiaoerName: child.name,
              raw: child,
            });
          }
        }
        item.children = undefined;
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

export interface BilibiliVideoCategoryOutput extends ListLevelInfoResponse {
  /**
   * 数据体
   */
  data?: {
    // noinspection SpellCheckingInspection
    /**
     * 分类列表
     */
    type_list: Array<BilibiliVideoCategoryInfo>;
  };
}

/**
 * 获取图文分类/分区
 * @param cookie
 */
export const getBilibiliArticleCategory = async (cookie: string): Promise<BilibiliArticleCategoryOutput> => {
  const result: BilibiliArticleCategoryOutput = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    const videoCategoryResult = await getArticleCategoryResponse(cookie);

    result.code = videoCategoryResult.code;
    result.msg = videoCategoryResult.message;
    if (videoCategoryResult.data?.categories?.length) {
      for (const item of videoCategoryResult.data?.categories) {
        const firstCate: ListItemInfoLevel = {
          yixiaoerId: item.id?.toString() ?? '',
          yixiaoerName: item.name,
        };
        if (item.children?.length) {
          firstCate.child = [];
          for (const child of item.children) {
            child.children = [];
            firstCate.child?.push({
              yixiaoerId: child.id?.toString() ?? '',
              yixiaoerName: child.name,
              raw: child,
            });
          }
        }
        item.children = [];
        firstCate.raw = item;
        result.dataList?.push(firstCate);
      }
    }
    result.data = videoCategoryResult.data;
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

export interface BilibiliArticleCategoryOutput extends ListLevelInfoResponse {
  /**
   * 数据体
   */
  data?: {
    /**
     * 分类列表
     */
    categories: Array<BilibiliArticleCategoryInfo>;
  };
}

/**
 * 获取视频下话题/活动，注意活动和分类必须匹配，分类更换后活动必须重新选择
 * categoryId和keyWord不能同时存在，当传入keyWord时，会忽略categoryId
 * @param cookie
 * @param categoryId 二级分类id，无二级传一级，必须传，错误的id无法获得活动
 * @param keyWord 搜索关键词
 * @param pageNum 分页页码，从0开始，默认0
 * @param title 作品标题
 */
export const getBilibiliVideoTopic = async (
  cookie: string,
  categoryId: number,
  keyWord: string = '',
  pageNum: number = 0,
  title: string | null = null,
): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    if (keyWord) {
      const videoTopicResult = await searchVideoTopicResponse(cookie, pageNum, keyWord);
      result.code = videoTopicResult.code;
      result.msg = videoTopicResult.message;
      if (videoTopicResult?.data?.result?.topics?.length) {
        for (let i = 0; i < videoTopicResult?.data?.result?.topics.length; i++) {
          const item = videoTopicResult?.data?.result?.topics[i];
          result.dataList?.push({
            yixiaoerId: item?.topic_id
              ? item?.topic_id?.toString()
              : item?.mission_id
              ? item.mission_id?.toString()
              : Date.now().toString(),
            yixiaoerName: item?.topic_name,
            raw: item,
          });
        }
      }
    } else {
      const videoTopicResult = await getVideoTopicResponse(cookie, categoryId, pageNum, title);
      result.code = videoTopicResult.code;
      result.msg = videoTopicResult.message;
      if (videoTopicResult?.data?.topics?.length) {
        for (let i = 0; i < videoTopicResult?.data?.topics.length; i++) {
          const item = videoTopicResult?.data?.topics[i];
          result.dataList?.push({
            yixiaoerId: item?.topic_id
              ? item?.topic_id?.toString()
              : item?.mission_id
              ? item.mission_id?.toString()
              : Date.now().toString(),
            yixiaoerName: item?.topic_name,
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

/**
 * 获取B站视频发布页的参与话题。
 *
 * 参与话题和普通话题是两套能力：普通话题继续使用
 * getBilibiliVideoTopic，本方法使用发布页的 /topic/type/v2 推荐接口；有
 * keyWord 时使用发布页的 /topic/search 搜索接口。
 *
 * @param cookie B站登录cookie
 * @param query 参与话题查询参数
 */
export const getBilibiliVideoParticipationTopic = async (
  cookie: string,
  query: BilibiliVideoParticipationTopicQuery = {},
): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    if (query.keyWord?.trim()) {
      const pageNum = Number.isFinite(query.pageNum) && (query.pageNum ?? 0) >= 0 ? Math.floor(query.pageNum ?? 0) : 0;
      const pageSize =
        Number.isFinite(query.pageSize) && (query.pageSize ?? 0) > 0 ? Math.floor(query.pageSize ?? 0) : 50;
      const searchResult = await searchBilibiliVideoParticipationTopicResponse(
        cookie,
        query.keyWord,
        pageNum,
        pageSize,
        query.offset,
      );
      result.code = searchResult.code;
      result.msg = searchResult.message ?? '';
      result.data = searchResult.data;

      const topicList = searchResult.data?.result?.topics ?? [];
      result.dataList = topicList
        .map((item: BilibiliVideoParticipationTopicInfo) => toBilibiliVideoParticipationTopicListItem(item))
        .filter((item): item is ListItemInfo => !!item);

      const pageInfo = searchResult.data?.result?.page_info;
      if (pageInfo?.has_more) {
        result.nextPage = String((pageInfo.page_num ?? pageNum) + 1);
      }
    } else {
      const recommendResult = await getBilibiliVideoParticipationTopicResponse(cookie, query);
      result.code = recommendResult.code;
      result.msg = recommendResult.message ?? '';
      result.data = recommendResult.data;

      const topicList = recommendResult.data?.topics ?? [];
      result.dataList = topicList
        .map((item: BilibiliVideoParticipationTopicInfo) => toBilibiliVideoParticipationTopicListItem(item))
        .filter((item): item is ListItemInfo => !!item);

      const pageNum = Number.isFinite(query.pageNum) && (query.pageNum ?? 0) >= 0 ? Math.floor(query.pageNum ?? 0) : 0;
      if (recommendResult.data?.maxpage !== undefined && recommendResult.data.maxpage > pageNum) {
        result.nextPage = String(pageNum + 1);
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
 * 搜索B站视频发布页可参与的话题。
 */
export const searchBilibiliVideoParticipationTopic = async (
  cookie: string,
  keyWord: string,
  pageNum: number = 0,
  pageSize: number = 50,
): Promise<ListInfoResponse> => {
  return getBilibiliVideoParticipationTopic(cookie, {
    keyWord,
    pageNum,
    pageSize,
  });
};

export interface BilibiliVideoTopicsOutput extends BaseResult {
  /**
   * 数据体
   */
  data?: {
    /**
     * 活动/话题列表
     */
    topics: Array<BilibiliVideoTopicInfo>;
    /**
     * 推荐标签，暂时无用
     */
    tags: null;
    // noinspection SpellCheckingInspection
    /**
     * 总页数
     */
    maxpage: number;
  };
}

/**
 * 获取B站视频审核状态
 * @param cookie
 * @param publishId  发布产生的publishId
 * @param maxPage 最大翻页数，默认10
 */
export const getBilibiliVideoStatus = async (
  cookie: string,
  publishId: string,
  maxPage: number = 10,
): Promise<BilibiliMediaStatusResultOutput> => {
  const result: BilibiliMediaStatusResultOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };

  try {
    if (!maxPage || maxPage < 1) {
      maxPage = 1;
    }
    let videoList: BilibiliContentListResponse | undefined = undefined;
    for (let i = 1; i <= maxPage; i++) {
      videoList = await getContentListAsync(cookie, i);
      if (videoList?.data?.arc_audits?.length) {
        for (const item of videoList.data.arc_audits) {
          const findPublishId = item.Archive.aid.toString();

          if (findPublishId == publishId) {
            result.docId = findPublishId;
            result.coverUrl = item.Archive.cover;
            // 状态
            const state = item.Archive.state;
            if (state === 0) {
              result.auditStatus = auditStatusEnum.published;
              // 链接
              result.openUrl = `https://www.bilibili.com/video/${item?.Archive?.bvid}/`;
            } else if (state == -4) {
              result.auditStatus = auditStatusEnum.deny;
            } else if (state == -30) {
              result.auditStatus = auditStatusEnum.inAudit;
            } else if (state == -40) {
              result.auditStatus = auditStatusEnum.prePublish;
            } else if (state == -16) {
              result.auditStatus = auditStatusEnum.executeFail;
            } else {
              result.auditStatus = auditStatusEnum.inAudit;
            }

            // 提示消息
            result.msg = item?.Archive?.reject_reason?.toString();

            //发布时间
            result.create_time =
              result.auditStatus == auditStatusEnum.prePublish ? item.Archive.dtime : item.Archive.ctime;

            result.data = item;
            //logger.error(`B站状态 publishId:${publishId} 结果 ${JSON.stringify(result)}`);
            return result;
          }
        }
      } else {
        result.code = videoList?.code ?? errorCode.data_error;
        result.msg = `未找到作品${videoList.message ?? ''}`;
        break;
      }
    }
    result.code = videoList?.code ?? errorCode.data_error;
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

export interface BilibiliMediaStatusResultOutput extends BaseResult {
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
   * 作品url
   */
  openUrl?: string;

  /**
   * 封面url
   */
  coverUrl?: string;

  /**
   * 视频信息
   */
  data?: object;
}

export const getBilibiliArticleStatus = async (
  cookie: string,
  publishId: string,
  maxPage: number = 10,
): Promise<BilibiliMediaStatusResultOutput> => {
  const result: BilibiliMediaStatusResultOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };

  try {
    if (!maxPage || maxPage < 1) {
      maxPage = 1;
    }
    let articleList: BilibiliArticleContentListResponse | undefined = undefined;
    for (let i = 1; i <= maxPage; i++) {
      articleList = await getArticleContentListAsync(cookie, i, 0);
      if (articleList?.artlist?.articles?.length) {
        for (const item of articleList.artlist.articles) {
          const findPublishId = item.id.toString();

          if (findPublishId == publishId) {
            result.docId = findPublishId;
            result.coverUrl = item.image_urls[0];
            // 状态
            const state = item.state;
            if (state === 0) {
              result.auditStatus = auditStatusEnum.published;
              // 链接
              result.openUrl = item.view_url;
            } else if (state == -4) {
              result.auditStatus = auditStatusEnum.deny;
            } else if (state == -30) {
              result.auditStatus = auditStatusEnum.inAudit;
            } else if (state == -40) {
              result.auditStatus = auditStatusEnum.prePublish;
            } else if (state == -16) {
              result.auditStatus = auditStatusEnum.executeFail;
            } else {
              result.auditStatus = auditStatusEnum.inAudit;
            }

            // 提示消息
            result.msg = '';

            //发布时间
            result.create_time = result.auditStatus == auditStatusEnum.prePublish ? item.dtime : item.ctime;

            result.data = item;
            //logger.error(`B站状态 publishId:${publishId} 结果 ${JSON.stringify(result)}`);
            return result;
          }
        }
      } else {
        result.code = articleList?.code ?? errorCode.data_error;
        result.msg = `未找到作品${articleList.message ?? ''}`;
        break;
      }
    }
    result.code = articleList?.code ?? errorCode.data_error;
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
 * b站稿件列表
 * @param cookie
 * @param pn 翻页页码，从1开始，默认1
 * @param ps 每页数量(默认10)
 * @param pubStatus 发布状态 is_pubing审核中，pubed已发布,not_pubed未通过，合在一起'is_pubing,pubed,not_pubed'表示全部状态
 */
export const getBilibiliContentList = async (
  cookie: string,
  pn: number = 1,
  ps: number = 10,
  pubStatus: 'is_pubing,pubed,not_pubed' | 'is_pubing' | 'pubed' | 'not_pubed' = 'is_pubing,pubed,not_pubed',
): Promise<BilibiliContentListOutput> => {
  const result: BilibiliContentListOutput = {
    code: 0,
    msg: '',
  };

  try {
    const contentListResult = await getContentListAsync(cookie, pn, ps, pubStatus);

    result.code = contentListResult.code;
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

export interface BilibiliContentListOutput extends BaseResult {
  data?: {
    arc_audits: Array<BilibiliMediaContent>;
    page: {
      count: number;
      pn: number;
      ps: number;
    };
  };

  raw?: unknown;
}

/**
 * b站报表数据
 * @param cookie
 * @param period 数据跨度（0：昨日&7天，1：30天，2：90天，3：累计（实际返回90天））
 * @param type 数据类型 （play：播放量，visitor：空间访客，fan：净增粉丝，like：点赞，fav：收藏，coin：硬币，comment：评论，dm：弹幕，share：分享，elec：充电）
 */
export const getBilibiliDataOverview = async (
  cookie: string,
  period: 0 | 1 | 2 | 3 = 0,
  type: 'play' | 'visitor' | 'fan' | 'like' | 'fav' | 'coin' | 'comment' | 'dm' | 'share' | 'elec' = 'play',
): Promise<BilibiliDataOverviewOutput> => {
  const result: BilibiliDataOverviewOutput = {
    code: 0,
    msg: '',
  };

  try {
    const dataOverviewResult = await getDataOverviewAsync(cookie, period, type);

    result.code = dataOverviewResult.code;
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

export interface BilibiliDataOverviewOutput extends BaseResult {
  data?: {
    tendency: Array<BilibiliTendencyData>;
  };

  raw?: unknown;
}

/**
 * b站 核心数据(累计)
 * @param cookie
 * @param tab 数据类型 默认0（0：播放量、粉丝数，1：点赞数、收藏数，2：弹幕、分享、评论，4：充电）
 */
export const getBilibiliDataOverviewCore = async (
  cookie: string,
  tab: 0 | 1 | 2 | 3 = 0,
): Promise<BilibiliDataOverviewCoreOutput> => {
  const result: BilibiliDataOverviewCoreOutput = {
    code: 0,
    msg: '',
  };

  try {
    const dataOverviewCoreResult = await getDataOverviewCoreAsync(cookie, tab);

    result.code = dataOverviewCoreResult.code;
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

export interface BilibiliDataOverviewCoreOutput extends BaseResult {
  data?: BilibiliCoreData;

  raw?: unknown;
}

/**
 * b站图文列表
 * @param cookie
 * @param pn 页码 默认1
 * @param group 作品状态（0：全部，1：进行中，2：已通过，3：未通过）
 */
export const getBilibiliArticleContentList = async (
  cookie: string,
  pn: number,
  group: 0 | 1 | 2 | 3 = 2,
): Promise<BilibiliArticleContentListOutput> => {
  const result: BilibiliArticleContentListOutput = {
    code: 0,
    msg: '',
  };

  try {
    const dataOverviewCoreResult = await getArticleContentListAsync(cookie, pn, group);

    result.code = dataOverviewCoreResult.code;
    result.msg = dataOverviewCoreResult.message;
    result.data = dataOverviewCoreResult.artlist;
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

export interface BilibiliArticleContentListOutput extends BaseResult {
  data?: {
    articles: Array<BilibiliArticleMediaContent>;
    type: {
      /**
       * 作品总数
       */
      all: number;

      /**
       * 进行中
       */
      audit: number;

      /**
       * 已通过
       */
      passed: number;

      /**
       * 未通过
       */
      not_passed: number;

      /**
       * 定时通过
       */
      timing_passed: number;
    };
    page: {
      /**
       * 当前页
       */
      pn: number;

      /**
       * 每页数量
       */
      ps: number;

      /**
       * 总数量
       */
      total: number;
    };
  };

  raw?: unknown;
}

/**
 * B站收益统计数据
 * @param cookie
 */
export const getBilibiliIncomeStatistic = async (cookie: string): Promise<BilibiliIncomeStatisticOutput> => {
  const result: BilibiliIncomeStatisticOutput = {
    code: 0,
    msg: '',
  };

  try {
    const incomeStatisticResult = await getIncomeStatisticAsync(cookie);

    result.code = incomeStatisticResult.code;
    result.msg = incomeStatisticResult.message;
    result.data = incomeStatisticResult.data;
    result.raw = incomeStatisticResult;
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

export interface BilibiliIncomeStatisticOutput extends BaseResult {
  data?: {
    summary: {
      state: number;
      daily_amt: number;
      annual_amt: number;
      thirty_days_amt: number;
      last_thirty_days_amt: number;
      over_last_day_amt: number;
      over_last_thirty_days_amt: number;
      over_last_year_amt: number;
      daily1_amt: number;
      annual1_amt: number;
    };
  };

  raw?: unknown;
}

/**
 * B站专栏统计数据
 * @param cookie
 */
export const getBilibiliArticleDataOverviewCore = async (
  cookie: string,
): Promise<BilibiliArticleDataOverviewCoreOutput> => {
  const result: BilibiliArticleDataOverviewCoreOutput = {
    code: 0,
    msg: '',
  };

  try {
    const articleDataOverviewCoreResult = await getArticleDataOverviewCoreAsync(cookie);

    result.code = articleDataOverviewCoreResult.code;
    result.msg = articleDataOverviewCoreResult.message;
    result.data = articleDataOverviewCoreResult.data;
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

export interface BilibiliArticleDataOverviewCoreOutput extends BaseResult {
  data?: {
    /**
     * 浏览量
     */
    view: number;

    /**
     * 评论数
     */
    reply: number;

    /**
     * 点赞数
     */
    like: number;

    /**
     * 硬币数
     */
    coin: number;

    /**
     * 收藏数
     */
    fav: number;

    /**
     * 分享数
     */
    share: number;

    /**
     * 浏览数增量
     */
    incr_view: number;

    /**
     * 评论数增量
     */
    incr_reply: number;

    /**
     * 点赞数增量
     */
    incr_like: number;

    /**
     * 硬币增量
     */
    incr_coin: number;

    /**
     * 收藏增量
     */
    incr_fav: number;

    /**
     * 分享增量
     */
    incr_share: number;
  };
}

/**
 * B站专栏报表数据
 * @param cookie
 * @param type 数据类型（1：浏览，2：评论，3：分享，4：硬币，5：收藏，6：点赞）
 */
export const getBilibiliArticleDataOverview = async (
  cookie: string,
  type: 1 | 2 | 3 | 4 | 5 | 6 = 1,
): Promise<BilibiliArticleDataOverviewOutput> => {
  const result: BilibiliArticleDataOverviewOutput = {
    code: 0,
    msg: '',
  };

  try {
    const articleDataOverviewResult = await getArticleDataOverviewAsync(cookie, type);

    result.code = articleDataOverviewResult.code;
    result.msg = articleDataOverviewResult.message;
    result.data = articleDataOverviewResult.data;
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

export interface BilibiliArticleDataOverviewOutput extends BaseResult {
  data?: Array<{
    /**
     * 日期
     */
    date_key: number;

    /**
     * 对应类型数据
     */
    total_inc: number;
  }>;
}

/**
 * 获获取用户列表
 * @param cookie
 * @param keyWord 搜索关键词
 * @param mid
 */
export const getBilibiliFriend = async (
  cookie: string,
  keyWord: string = '',
  mid?: number,
): Promise<BilibiliFriendListOutput> => {
  const result: BilibiliFriendListOutput = {
    code: 0,
    msg: '',
  };

  try {
    const videoTopicResult = await getVideoFriendResponse(cookie, keyWord, mid);

    result.code = videoTopicResult.code;
    result.msg = videoTopicResult.message;
    result.items = videoTopicResult.data?.groups[0]?.items;
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

export interface BilibiliFriendListOutput extends BaseResult {
  /**
   * 用户列表
   */
  items?: Array<BilibiliVideoFriendInfo>;
}

/**
 *
 * @param cookie
 * @param days 1: 7天数据，2: 30天数据
 * @param proxy
 */
export const getBiliBiliOverViewDashboard = async (
  cookie: string,
  days: 1 | 2 = 2,
  proxy?: KuaiDaiLiProxy,
): Promise<AccountReportDataOutPut> => {
  const result: AccountReportDataOutPut = {
    code: 0,
    msg: '',
    data: [],
  };

  const names = [
    { name: '总粉丝数', key: 'totalFansCount' },
    { name: '总获赞数', key: 'totalGreatsCount' },
    { name: '总播放数', key: 'totalPlaysCount' },
    { name: '播放量', key: 'playCount' },
    { name: '空间访客', key: 'homepageViewCount' },
    { name: '净增粉丝', key: 'netFansCount' },
    { name: '点赞', key: 'greatCount' },
    { name: '收藏', key: 'collectCount' },
    { name: '硬币', key: 'coinCount' },
    { name: '评论', key: 'commentCount' },
    { name: '弹幕', key: 'danmuCount' },
    { name: '分享', key: 'shareCount' },
    { name: '充电', key: 'chargeCount' },
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
    const userInfo = await getUserInfoResponse(cookie, proxyAgent);
    if (!userInfo?.data?.mid) {
      result.code = userInfo?.code ?? -1;
      result.msg = userInfo?.message;
      return result;
    }
    const fansData = await getUserOnlyFansResponse(cookie, userInfo.data.mid, proxyAgent);
    if (fansData?.data?.mid) {
      result.data?.push({
        name: '总粉丝数',
        key: 'totalFansCount',
        value: formatNumber(fansData.data.follower),
        list: [],
      });
      newOverView.all.overview['totalFansCount'] = formatNumberNo(fansData.data.follower);
    } else {
      result.code = fansData?.code ?? -1;
      result.msg = fansData?.message;
      return result;
    }

    const playLikes = await getUserLikePlayResponse(cookie, userInfo.data.mid, proxyAgent);
    if (playLikes?.data?.archive) {
      result.data?.push({
        name: '总获赞数',
        key: 'totalGreatsCount',
        value: formatNumber(playLikes.data.likes),
        list: [],
      });
      result.data?.push({
        name: '总播放数',
        key: 'totalPlaysCount',
        value: formatNumber(playLikes.data.archive.view),
        list: [],
      });
      newOverView.all.overview['totalGreatsCount'] = formatNumberNo(playLikes.data.likes);
      newOverView.all.overview['totalPlaysCount'] = formatNumberNo(playLikes.data.archive.view);
    } else {
      result.code = playLikes?.code ?? -1;
      result.data = [];
      result.msg = playLikes?.message;
      return result;
    }

    const tiaoResult = await getDataOverviewAllAsync(cookie, days === 1 ? 0 : 1, proxyAgent);
    result.code = tiaoResult?.code ?? 0;
    result.msg = tiaoResult?.message ?? '';

    if (tiaoResult?.data?.data_tendency?.play && tiaoResult?.data?.data_tendency.play?.length > 0) {
      const thtData = tiaoResult?.data?.data_tendency;
      if (thtData?.play?.length > 0) {
        let total = 0;
        thtData?.play.forEach((item) => {
          total += item.total_inc;
        });
        const dataItem: DataColumn = {
          name: '播放量',
          key: 'playCount',
          value: formatNumber(total),
          list: [],
        };
        result.data?.push(dataItem);
        newOverView.all.overview[dataItem.key] = formatNumberNo(total);
        for (const item of thtData?.play) {
          dataItem.list.push({ date: item.date_key * 1000, value: item.total_inc });
        }
        newOverView.all.thirtydays[dataItem.key] = dataItem.list;
      }

      if (thtData?.visitor?.length > 0) {
        let total = 0;
        thtData?.visitor.forEach((item) => {
          total += item.total_inc;
        });
        const dataItem: DataColumn = {
          name: '空间访客',
          key: 'homepageViewCount',
          value: formatNumber(total),
          list: [],
        };
        result.data?.push(dataItem);
        newOverView.all.overview[dataItem.key] = formatNumberNo(total);
        for (const item of thtData?.visitor) {
          dataItem.list.push({ date: item.date_key * 1000, value: item.total_inc });
        }
        newOverView.all.thirtydays[dataItem.key] = dataItem.list;
      }

      if (thtData?.fan?.length > 0) {
        let total = 0;
        thtData?.fan.forEach((item) => {
          total += item.total_inc;
        });
        const dataItem: DataColumn = {
          name: '净增粉丝',
          key: 'netFansCount',
          value: formatNumber(total),
          list: [],
        };
        result.data?.push(dataItem);
        newOverView.all.overview[dataItem.key] = formatNumberNo(total);
        for (const item of thtData?.fan) {
          dataItem.list.push({ date: item.date_key * 1000, value: item.total_inc });
        }
        newOverView.all.thirtydays[dataItem.key] = dataItem.list;
      }

      if (thtData?.like?.length > 0) {
        let total = 0;
        thtData?.like.forEach((item) => {
          total += item.total_inc;
        });
        const dataItem: DataColumn = {
          name: '点赞',
          key: 'greatCount',
          value: formatNumber(total),
          list: [],
        };
        result.data?.push(dataItem);
        newOverView.all.overview[dataItem.key] = formatNumberNo(total);
        for (const item of thtData?.like) {
          dataItem.list.push({ date: item.date_key * 1000, value: item.total_inc });
        }
        newOverView.all.thirtydays[dataItem.key] = dataItem.list;
      }

      if (thtData?.fav?.length > 0) {
        let total = 0;
        thtData?.fav.forEach((item) => {
          total += item.total_inc;
        });
        const dataItem: DataColumn = {
          name: '收藏',
          key: 'collectCount',
          value: formatNumber(total),
          list: [],
        };
        result.data?.push(dataItem);
        newOverView.all.overview[dataItem.key] = formatNumberNo(total);
        for (const item of thtData?.fav) {
          dataItem.list.push({ date: item.date_key * 1000, value: item.total_inc });
        }
        newOverView.all.thirtydays[dataItem.key] = dataItem.list;
      }

      if (thtData?.coin?.length > 0) {
        let total = 0;
        thtData?.coin.forEach((item) => {
          total += item.total_inc;
        });
        const dataItem: DataColumn = {
          name: '硬币',
          key: 'coinCount',
          value: formatNumber(total),
          list: [],
        };
        result.data?.push(dataItem);
        newOverView.all.overview[dataItem.key] = formatNumberNo(total);
        for (const item of thtData?.coin) {
          dataItem.list.push({ date: item.date_key * 1000, value: item.total_inc });
        }
        newOverView.all.thirtydays[dataItem.key] = dataItem.list;
      }

      if (thtData?.comment?.length > 0) {
        let total = 0;
        thtData?.comment.forEach((item) => {
          total += item.total_inc;
        });
        const dataItem: DataColumn = {
          name: '评论',
          key: 'commentCount',
          value: formatNumber(total),
          list: [],
        };
        result.data?.push(dataItem);
        newOverView.all.overview[dataItem.key] = formatNumberNo(total);
        for (const item of thtData?.comment) {
          dataItem.list.push({ date: item.date_key * 1000, value: item.total_inc });
        }
        newOverView.all.thirtydays[dataItem.key] = dataItem.list;
      }

      if (thtData?.dm?.length > 0) {
        let total = 0;
        thtData?.dm.forEach((item) => {
          total += item.total_inc;
        });
        const dataItem: DataColumn = {
          name: '弹幕',
          key: 'danmuCount',
          value: formatNumber(total),
          list: [],
        };
        result.data?.push(dataItem);
        newOverView.all.overview[dataItem.key] = formatNumberNo(total);
        for (const item of thtData?.dm) {
          dataItem.list.push({ date: item.date_key * 1000, value: item.total_inc });
        }
        newOverView.all.thirtydays[dataItem.key] = dataItem.list;
      }

      if (thtData?.share?.length > 0) {
        let total = 0;
        thtData?.share.forEach((item) => {
          total += item.total_inc;
        });
        const dataItem: DataColumn = {
          name: '分享',
          key: 'shareCount',
          value: formatNumber(total),
          list: [],
        };
        result.data?.push(dataItem);
        newOverView.all.overview[dataItem.key] = formatNumberNo(total);
        for (const item of thtData?.share) {
          dataItem.list.push({ date: item.date_key * 1000, value: item.total_inc });
        }
        newOverView.all.thirtydays[dataItem.key] = dataItem.list;
      }

      if (thtData?.elec?.length > 0) {
        let total = 0;
        thtData?.elec.forEach((item) => {
          total += item.total_inc;
        });
        const dataItem: DataColumn = {
          name: '充电',
          key: 'chargeCount',
          value: formatNumber(total),
          list: [],
        };
        result.data?.push(dataItem);
        newOverView.all.overview[dataItem.key] = formatNumberNo(total);
        for (const item of thtData?.elec) {
          dataItem.list.push({ date: item.date_key * 1000, value: item.total_inc });
        }
        newOverView.all.thirtydays[dataItem.key] = dataItem.list;
      }
    } else {
      result.code = result?.code ?? -1;
      result.data = [];
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
 * 获取B站指定天数内，最多20条公开作品数据
 * @param cookie
 * @param type
 * @param eventCallBack
 * @param days
 * @param maxCount
 * @param isHeader
 * @param proxy
 */
export const getBilibiliContentListView = async (
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
    result.headers =
      type === 'video'
        ? [
            { name: '封面', key: 'cover' },
            { name: '标题', key: 'title' },
            { name: '发布时间', key: 'date' },
            { name: '播放', key: 'play' },
            { name: '点赞', key: 'great' },
            { name: '弹幕', key: 'danmu' },
            { name: '评论', key: 'comment' },
            { name: '硬币', key: 'coin' },
            { name: '收藏', key: 'collect' },
            { name: '分享', key: 'share' },
          ]
        : [
            { name: '封面', key: 'cover' },
            { name: '标题', key: 'title' },
            { name: '发布时间', key: 'date' },
            { name: '阅读', key: 'read' },
            { name: '评论', key: 'comment' },
            { name: '点赞', key: 'great' },
            { name: '收藏', key: 'collect' },
            { name: '硬币', key: 'coin' },
          ];
    if (isHeader) {
      return result;
    }

    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }

    let contentTmpId = 0;
    if (type === 'video') {
      for (let i = 1; i < syncContentMaxPage; i++) {
        const contentList = await getContentListAsync(cookie, i, 10, 'pubed', webProxy);
        if (contentList?.data?.arc_audits?.length) {
          if (contentList.data.arc_audits[0].Archive.aid === contentTmpId) {
            break;
          } else {
            contentTmpId = contentList?.data?.arc_audits[0].Archive.aid;
          }
          let j = 0;
          for (const item of contentList?.data?.arc_audits) {
            j++;
            if (item.Archive.state === -50) {
              continue;
            }
            const date = dayjs(item.Archive.ctime * 1000).toDate();
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
              id: item.Archive?.aid.toString(),
              cover: item.Archive.cover ?? '',
              title: item.Archive.title ?? '',
              date: dateStr,
              play: formatNumber(item.stat.view),
              great: formatNumber(item.stat.like),
              danmu: formatNumber(item.stat.danmaku),
              comment: formatNumber(item.stat.reply),
              coin: formatNumber(item.stat.coin),
              collect: formatNumber(item.stat.favorite),
              share: formatNumber(item.stat.share),
              type: type,
              pageUrl: `https://www.bilibili.com/video/${item.Archive.bvid}/`,
            };
            result.data.push(newItem);
            const newItemNew: PlatformContentItemNum = {
              id: item.Archive?.aid.toString(),
              cover: item.Archive.cover ?? '',
              title: item.Archive.title ?? '',
              date: dateStr,
              play: formatNumberNo(item.stat.view),
              great: formatNumberNo(item.stat.like),
              danmu: formatNumberNo(item.stat.danmaku),
              comment: formatNumberNo(item.stat.reply),
              coin: formatNumberNo(item.stat.coin),
              collect: formatNumberNo(item.stat.favorite),
              share: formatNumberNo(item.stat.share),
              type: type,
              pageUrl: `https://www.bilibili.com/video/${item.Archive.bvid}/`,
            };
            result.dataList.push(newItemNew);
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
      }
    } else {
      for (let i = 1; i < syncContentMaxPage; i++) {
        const contentList = await getArticleContentListAsync(cookie, i, 2, webProxy);
        if (contentList?.artlist?.articles) {
          if (contentList.artlist.articles[0].id === contentTmpId) {
            break;
          } else {
            contentTmpId = contentList.artlist.articles[0].id;
          }
          let j = 0;
          for (const item of contentList?.artlist?.articles) {
            j++;
            // if (item.Archive.state === -50) {
            //   continue;
            // }
            const date = dayjs(item.publish_time * 1000).toDate();
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
              cover: item.image_urls[0] ?? '',
              title: item.title ?? '',
              date: dateStr,
              read: formatNumber(item.stats.view),
              comment: formatNumber(item.stats.reply),
              great: formatNumber(item.stats.like),
              collect: formatNumber(item.stats.favorite),
              coin: formatNumber(item.stats.coin),
              type: type,
              pageUrl: `https://www.bilibili.com/read/cv${item.id}/`,
            };
            result.data.push(newItem);
            const newItemNew: PlatformContentItemNum = {
              id: item.id.toString(),
              cover: item.image_urls[0] ?? '',
              title: item.title ?? '',
              date: dateStr,
              read: formatNumberNo(item.stats.view),
              comment: formatNumberNo(item.stats.reply),
              great: formatNumberNo(item.stats.like),
              collect: formatNumberNo(item.stats.favorite),
              coin: formatNumberNo(item.stats.coin),
              type: type,
              pageUrl: `https://www.bilibili.com/read/cv${item.id}/`,
            };
            result.dataList.push(newItemNew);
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
 * 删除B站文章
 * @param cookie
 * @param docId
 */
export const deleteBiLiBiLiArticleContent = async (cookie: string, docId: string): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    const cateData = await deleteArticleResponse(cookie, docId);
    result.code = cateData?.code ?? -1;
    result.msg = cateData?.message ?? '';
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

const formatBilibiliPublicAuthorUrl = (url: string | undefined): string => {
  if (!url) {
    return '';
  }
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  return url;
};

/**
 * 解析B站公开作者搜索响应
 * @param response B站公开作者搜索响应
 */
export const parseBilibiliPublicAuthorSearchResponse = (
  response: BilibiliPublicAuthorSearchResponse,
): Array<PlatformPublicAuthorInfo> => {
  const exists = new Set<string>();
  const dataList: Array<PlatformPublicAuthorInfo> = [];
  if (!response?.data?.result?.length) {
    return dataList;
  }
  for (const item of response.data.result) {
    if (item?.type && item.type !== 'bili_user') {
      continue;
    }
    const extAuthorId = item?.mid?.toString() ?? '';
    if (!extAuthorId || exists.has(extAuthorId)) {
      continue;
    }
    exists.add(extAuthorId);
    dataList.push({
      platform_code: PublicAuthorPlatformCode.BiLiBiLi,
      ext_author_id: extAuthorId,
      nickname: item?.uname ?? '',
      avatar_url: formatBilibiliPublicAuthorUrl(item?.upic),
      description: item?.usign || item?.official_verify?.desc || item?.verify_info || '',
      aut_index: `https://space.bilibili.com/${extAuthorId}`,
      aut_spi_url: `mid=${extAuthorId}`,
      follower_count: Number(item?.fans ?? 0),
      total_views: 0,
      total_comments: 0,
      total_likes: 0,
      work_count: Number(item?.videos ?? 0),
    });
  }
  return dataList;
};

/**
 * 搜索B站公开作者列表
 * @param keyWord 搜索关键词
 * @param cookie 为空时使用公开搜索默认 cookie
 * @param nextPage 下一页参数，当前仅支持第一页
 * @param proxy 代理
 */
export const searchBilibiliPublicAuthorList = async (
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
    const authorSearchResponse = await getBilibiliPublicAuthorSearchResponse(cookie, keyWord, 1, webProxy);
    result.code = authorSearchResponse?.code ?? -1;
    result.msg = authorSearchResponse?.message ?? '';
    result.dataList = parseBilibiliPublicAuthorSearchResponse(authorSearchResponse);
    if ((authorSearchResponse?.data?.numPages ?? 0) > 1) {
      result.nextPage = '36';
    }
    //result.raw = authorSearchResponse;
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = '请求B站作者搜索失败';
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = '解析B站作者搜索结果失败';
    } else {
      result.msg = 'B站作者搜索失败';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};
