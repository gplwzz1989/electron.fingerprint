import { BaseResult } from '../baseResult';
import {
  DayuhaoContentListResponse,
  DayuhaoMediaContent,
  DayuhaoMediaContentSingle,
  getContentListAsync,
  getDayuhaoContentSingleListAsync,
} from './dayuhao-content-list.service';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import {
  DayuhaoDataOverviewItemResponse,
  getDataOverviewAsync,
  getDayuhaoDataOverviewFansAsync,
  getDayuhaoDataOverviewFansStatisticAsync,
  getDayuhaoDataOverviewIncomeAsync,
  getSingleDataOverviewAsync,
  getSingleDataOverviewStatisticAsync,
} from './dayuhao-data-overview.service';
import { getUserInfoAsync } from '../dayuhao/dayuhao-user.service';
import { getMiniVideoCategoryListResponse, getVideoCategoryListResponse } from '../dayuhao/dayuhao-category.service';
import {
  ListInfoResponse,
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
import { deleteContent, deleteMiniVideoContent } from '@/media-platform/dayuhao/dayuhao-content-delete.service';

/**
 * 大鱼号-我的作品
 * @param cookie
 * @param page 页码 默认1
 * @param currentView 内容状态 默认全部（'all'：全部，'released'：已发布，'timedRelease'：待发布，'pending'：审核中，'spam'：发布失败，'offline'：已下线）
 * @param currentTab 数据类型 默认全部（'all'：全部，'article'：图文，'shortvideo'：短视频，'minivideo'：小视频，'album'：图集）
 */
export const getDayuhaoContentList = async (
  cookie: string,
  page: number = 1,
  currentView: 'all' | 'released' | 'timedRelease' | 'pending' | 'spam' | 'offline' = 'all',
  currentTab: 'all' | 'article' | 'shortvideo' | 'minivideo' | 'album' = 'all',
) => {
  const result: DayuhaoContentListOutput = {
    code: 0,
    msg: '',
  };

  try {
    const contentListResult = await getContentListAsync(cookie, page, currentView, currentTab);
    if (!contentListResult?.error?.code) {
      result.data = contentListResult.dataList;
      result.raw = contentListResult;
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

export interface DayuhaoContentListOutput extends BaseResult {
  data?: {
    data: Array<DayuhaoMediaContent>;
    totalPage: number;
    metadata: {
      total: number;
      max_pos: number;
    };
  };

  raw?: unknown;
}

/**
 * 大鱼号内容单篇列表数据
 * @param cookie
 * @param beginDate 开始日期（Date）
 * @param endDate 结束日期（Date）
 * @param page 页码
 * @param size 每页数量
 */
export const getDayuhaoContentSingleList = async (
  cookie: string,
  beginDate: Date,
  endDate: Date,
  page: number = 1,
  size: number = 5,
) => {
  const result: DayuhaoContentSingleListOutput = {
    code: 0,
    msg: '',
  };

  try {
    let start_date_str = beginDate.toISOString();
    if (start_date_str.length > 0) {
      start_date_str = start_date_str.slice(0, 10);
      start_date_str = start_date_str.replaceAll('-', '');
    }

    let end_date_str = endDate.toISOString();
    if (end_date_str.length > 0) {
      end_date_str = end_date_str.slice(0, 10);
      end_date_str = end_date_str.replaceAll('-', '');
    }

    const contentSingleListResult = await getDayuhaoContentSingleListAsync(
      cookie,
      start_date_str,
      end_date_str,
      page,
      size,
    );
    if (!contentSingleListResult?.error?.code) {
      result.data = contentSingleListResult.data;
      result.total = contentSingleListResult.total;
      result.raw = contentSingleListResult;
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

export interface DayuhaoContentSingleListOutput extends BaseResult {
  data?: Array<DayuhaoMediaContentSingle>;
  total?: number;

  raw?: unknown;
}

/**
 * 大鱼号运营数据-作品数据
 * @param cookie
 * @param beginDate 开始日期（Date）
 * @param endDate 结束日期（Date）
 */
export const getDayuhaoDataOverview = async (cookie: string, beginDate: Date, endDate: Date) => {
  const result: DayuhaoDataOverviewOutput = {
    code: 0,
    msg: '',
  };

  try {
    let start_date_str = beginDate.toISOString();
    if (start_date_str.length > 0) {
      start_date_str = start_date_str.slice(0, 10);
      start_date_str = start_date_str.replaceAll('-', '');
    }

    let end_date_str = endDate.toISOString();
    if (end_date_str.length > 0) {
      end_date_str = end_date_str.slice(0, 10);
      end_date_str = end_date_str.replaceAll('-', '');
    }

    const dataOverviewResult = await getDataOverviewAsync(cookie, start_date_str, end_date_str);
    if (!dataOverviewResult?.error?.code) {
      result.data = dataOverviewResult.data;
      result.raw = dataOverviewResult;
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

export interface DayuhaoDataOverviewOutput extends BaseResult {
  data?: Array<DayuhaoDataOverviewItemResponse>;

  raw?: unknown;
}

/**
 * 大鱼号粉丝报表数据
 * @param cookie
 * @param beginDate 开始日期（Date）
 * @param endDate 结束日期（Date）
 */
export const getDayuhaoDataOverviewFans = async (cookie: string, beginDate: Date, endDate: Date) => {
  const result: DayuhaoDataOverviewFansOutput = {
    code: 0,
    msg: '',
  };

  try {
    let start_date_str = beginDate.toISOString();
    if (start_date_str.length > 0) {
      start_date_str = start_date_str.slice(0, 10);
      start_date_str = start_date_str.replaceAll('-', '');
    }

    let end_date_str = endDate.toISOString();
    if (end_date_str.length > 0) {
      end_date_str = end_date_str.slice(0, 10);
      end_date_str = end_date_str.replaceAll('-', '');
    }

    const dataOverviewFansResult = await getDayuhaoDataOverviewFansAsync(cookie, start_date_str, end_date_str);
    if (!dataOverviewFansResult?.error?.code) {
      result.data = dataOverviewFansResult.data;
      result.raw = dataOverviewFansResult;
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

export interface DayuhaoDataOverviewFansOutput extends BaseResult {
  data?: {
    list: Array<{
      ds: string;

      /**
       * 日期
       */
      date: string;

      /**
       * 粉丝增加数
       */
      follow_increase: number;
    }>;
  };

  raw?: unknown;
}

/**
 * 大鱼号粉丝数据分析顶部统计数据
 * @param cookie
 */
export const getDayuhaoDataOverviewFansStatistic = async (cookie: string) => {
  const result: DayuhaoDataOverviewFansStatisticOutput = {
    code: 0,
    msg: '',
  };

  try {
    const dataOverviewFansStatisticResult = await getDayuhaoDataOverviewFansStatisticAsync(cookie);
    if (!dataOverviewFansStatisticResult?.error?.code) {
      result.data = dataOverviewFansStatisticResult.data;
      result.raw = dataOverviewFansStatisticResult;
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

export interface DayuhaoDataOverviewFansStatisticOutput extends BaseResult {
  data?: Array<{
    /**
     * 数据名称（累计粉丝数、新增粉丝数、取消关注数、净增粉丝数）
     */
    value: string;

    /**
     * 对应值
     */
    text: string;
  }>;

  raw?: unknown;
}

/**
 * 大鱼号收益数据
 * @param cookie
 */
export const getDayuhaoDataOverviewIncome = async (cookie: string) => {
  const result: DayuhaoDataOverviewIncomeOutput = {
    code: 0,
    msg: '',
  };

  try {
    const dataOverviewFansStatisticResult = await getDayuhaoDataOverviewIncomeAsync(cookie);
    if (!dataOverviewFansStatisticResult?.error?.code) {
      result.data = dataOverviewFansStatisticResult.data;
      result.raw = dataOverviewFansStatisticResult;
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

export interface DayuhaoDataOverviewIncomeOutput extends BaseResult {
  data?: Array<{
    id: number;
    sn: string;
    apply_date: number;
    app_id: number;
    app_user_id: string;
    user_name: string;
    inout: number;
    action: number;
    result: number;

    /**
     * 税前总收益
     */
    pretax_amount: number;
    tax_amount: number;

    /**
     * 税后总收益
     */
    aftertax_amount: number;

    /**
     * 上月结算收益
     */
    previous_balance: number;
    next_balance: number;
    memo: string;
    status: string;
    created_at: string;
  }>;

  raw?: unknown;
}

/**
 * 大鱼号单篇统计数据
 * @param cookie
 * @param content_id 作品id
 * @param product_type 作品类型
 * @param start_date 开始日期 Date 昨日日期
 * @param end_date 结束日期 Date 昨日日期
 */
export const getDayuhaoSingleDataOverviewStatistic = async (
  cookie: string,
  content_id: string,
  product_type: string,
  start_date: Date,
  end_date: Date,
): Promise<DayuhaoSingleDataOverviewStatisticOutput> => {
  const result: DayuhaoSingleDataOverviewStatisticOutput = {
    code: 0,
    msg: '',
  };

  try {
    let start_date_str = start_date.toISOString();
    if (start_date_str.length > 0) {
      start_date_str = start_date_str.slice(0, 10);
      start_date_str = start_date_str.replaceAll('-', '');
    }

    let end_date_str = end_date.toISOString();
    if (end_date_str.length > 0) {
      end_date_str = end_date_str.slice(0, 10);
      end_date_str = end_date_str.replaceAll('-', '');
    }

    const singleDataOverviewStatisticResult = await getSingleDataOverviewStatisticAsync(
      cookie,
      content_id,
      product_type,
      start_date_str,
      end_date_str,
    );
    if (!singleDataOverviewStatisticResult?.error?.code) {
      result.data = singleDataOverviewStatisticResult.data;
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

export interface DayuhaoSingleDataOverviewStatisticOutput extends BaseResult {
  data?: Array<{
    /**
     * 日期
     */
    date: string;
    date_published: boolean;

    /**
     * 总评论数
     */
    comment_pv_all: number;

    /**
     * 总点赞数
     */
    like_pv_all: number;

    /**
     * 总分享数
     */
    share_pv_all: number;

    /**
     * 总收藏数
     */
    fav_pv_all: number;

    /**
     * 展现量
     */
    show_pv_all: number;

    /**
     * 阅读量
     */
    read_pv_all: number;

    /**
     * 文章点击率
     */
    txt_list_click_ratio: number;
    txt_list_click_ratio_over: number;

    /**
     * 平均阅读完成率
     */
    scroll_read_ratio: number;
    scroll_read_ratio_over: number;

    /**
     * 平均阅读时长
     */
    avg_read_times: number;
    avg_read_time_over: number;
    fans_show_pv_all: number;
    fans_read_pv_all: number;
    fans_txt_list_click_ratio: number;
    fans_scroll_read_ratio: number;
    fans_avg_read_times: number;
    total_follow_uv: number;
    item_follow_uv_all: number;
    item_follow_uv_ratio: number;
    item_follow_uv_ratio_over: number;
    ds: number;

    /**
     * 超过同类作品平均播放时长数据（百分比）
     */
    avg_play_time_over: number;

    /**
     * 平均播放时长
     */
    avg_play_times: number;

    /**
     * 粉丝播放时长
     */
    fans_avg_play_time: number;

    /**
     * 粉丝平均播放完成率
     */
    fans_stop_play_ratio: number;
    fans_vdo_list_click_ratio: number;
    fans_video_vv_all: number;

    /**
     * 平均播放完成率
     */
    stop_play_ratio: number;

    /**
     * 超过同类作品平均完成率
     */
    stop_play_ratio_over: number;

    /**
     * 视频点击率
     */
    vdo_list_click_ratio: number;

    /**
     * 超过同类作品视频点击率
     */
    vdo_list_click_ratio_over: number;

    /**
     * 播放数
     */
    video_vv_all: number;
  }>;
}

/**
 * 大鱼号单篇报表数据
 * @param cookie
 * @param content_id 作品id
 * @param product_type 作品类型
 * @param start_date 开始日期 Date
 * @param end_date 结束日期 Date
 */
export const getDayuhaoSingleDataOverview = async (
  cookie: string,
  content_id: string,
  product_type: string,
  start_date: Date,
  end_date: Date,
): Promise<DayuhaoSingleDataOverviewOutput> => {
  const result: DayuhaoSingleDataOverviewOutput = {
    code: 0,
    msg: '',
  };

  try {
    let start_date_str = start_date.toISOString();
    if (start_date_str.length > 0) {
      start_date_str = start_date_str.slice(0, 10);
      start_date_str = start_date_str.replaceAll('-', '');
    }

    let end_date_str = end_date.toISOString();
    if (end_date_str.length > 0) {
      end_date_str = end_date_str.slice(0, 10);
      end_date_str = end_date_str.replaceAll('-', '');
    }

    const singleDataOverviewResult = await getSingleDataOverviewAsync(
      cookie,
      content_id,
      product_type,
      start_date_str,
      end_date_str,
    );
    if (!singleDataOverviewResult?.error?.code) {
      result.data = singleDataOverviewResult.data;
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

export interface DayuhaoSingleDataOverviewOutput extends BaseResult {
  data?: Array<{
    /**
     * 日期
     */
    date: string;
    date_published: boolean;

    /**
     * 展现量
     */
    show_pv: number;

    /**
     * 评论量
     */
    comment_pv: number;

    /**
     * 分享量
     */
    share_pv: number;

    /**
     * 点赞数
     */
    like_pv: number;

    /**
     * 收藏数
     */
    fav_pv: number;

    /**
     * 阅读量
     */
    read_pv: number;

    /**
     * 平均阅读时长
     */
    avg_read_times: number;

    /**
     * 阅读完成率
     */
    scroll_read_ratio: number;
    item_follow_uv: number;
    ds: number;

    /**
     * 播放量
     */
    video_vv: number;

    /**
     * 平均播放时长
     */
    avg_play_times: number;

    /**
     * 播放完成率
     */
    stop_play_ratio: number;
  }>;
}

export const getDayuhaoUserInfo = async (cookie: string, proxy?: IWebProxy): Promise<DayuhaoUserInfoOutput> => {
  const result: DayuhaoUserInfoOutput = {
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
    result.yixiaoerImageUrl = userInfoResult?.data?.avatar?.toString();
    result.yixiaoerName = userInfoResult?.data?.nickname?.toString();
    result.raw = userInfoResult?.data;
    result.code = userInfoResult.code;
    result.msg = userInfoResult.msg;
    result.data = userInfoResult.data;
    if (result?.data?.avatar?.startsWith('//')) {
      result.data.avatar = `https:${result?.data?.avatar}`;
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

export interface DayuhaoUserInfoOutput extends PlatformAuthorInfo {
  data?: {
    /**
     * 用户id
     */
    uid: string;

    /**
     * 用户昵称
     */
    nickname: string;

    /**
     * 用户头像
     */
    avatar: string;

    /**
     * 可发布数量
     */
    allowPublishNum: number;

    /**
     * 可发布数量
     */
    allowAllPublishNum: number;

    utoken: string;

    requestId: string;

    imageUpSign: string;

    imageCutSign: string;
  };
}

/**
 * 获取横版视频分类
 * @param cookie
 */
export const getDayuhaoVideoCategoryList = async (cookie: string): Promise<DayuhaoCategoryOutput> => {
  const result: DayuhaoCategoryOutput = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    result.data = await getVideoCategoryListResponse(cookie);
    if (result.data.length) {
      let i = 1;
      for (const item of result.data) {
        i++;
        result.dataList?.push({ yixiaoerId: i.toString(), yixiaoerName: item });
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
 * 获取竖版视频分类
 * @param cookie
 */
export const getDayuhaoMiniVideoCategoryList = async (cookie: string): Promise<DayuhaoCategoryOutput> => {
  const result: DayuhaoCategoryOutput = {
    code: 0,
    msg: '',
  };

  try {
    result.data = await getMiniVideoCategoryListResponse(cookie);
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

export interface DayuhaoCategoryOutput extends ListInfoResponse {
  /**
   * 分类名称列表
   */
  data?: Array<string>;
}

export const getDayuhaoMediaStatus = async (
  cookie: string,
  publishId: string,
  maxPage: number = 10,
): Promise<MediaStatusResultOutput> => {
  const result: MediaStatusResultOutput = {
    code: -1,
    msg: '未找到作品',
    publishId: publishId,
  };

  try {
    let mediaResult: DayuhaoContentListResponse | undefined = undefined;
    for (let i = 1; i < maxPage; i++) {
      mediaResult = await getContentListAsync(cookie, i);

      if (mediaResult?.dataList?.data?.length) {
        for (const item of mediaResult?.dataList?.data) {
          let findDocid = item.origin_id?.toString();
          if (item?.body?.videos?.length) {
            findDocid = item.content_id?.toString();
          }
          if (findDocid == publishId) {
            result.code = 0;
            result.msg = '';

            if (item.status === 1) {
              result.auditStatus = auditStatusEnum.published;
            } else if (item.status === 2) {
              result.auditStatus = auditStatusEnum.customWithdrawn;
            } else if (item.status === 3) {
              result.auditStatus = auditStatusEnum.inAudit;
            } else if (item.status === 4) {
              result.auditStatus = auditStatusEnum.deny;
              result.msg = item?._app_extra?.audit_remark ?? '';
            } else if (item.status === 5) {
              result.auditStatus = auditStatusEnum.prePublish;
            } else {
              result.auditStatus = auditStatusEnum.inAudit;
            }

            result.create_time = new Date(item.publish_at).getTime() / 1000;
            if (result.auditStatus === auditStatusEnum.published) {
              if (item.body?.videos?.length) {
                result.openUrl = `https://mparticle.uc.cn/video.html?uc_param_str=frdnsnpfvecpntnwprdssskt&xss_item_id=${item.xss_item_id}`;
              } else {
                result.openUrl = `https://mparticle.uc.cn/article.html?uc_param_str=frdnsnpfvecpntnwprdssskt&wm_aid=${item.origin_id}`;
              }
            }

            result.publishId = findDocid;
            result.docId = item.content_id.toString();
            result.coverUrl = item.cover_url;
            result.data = item;
            return result;
          }
        }
      } else {
        result.code = mediaResult?.dataList?.metadata?.total ? 0 : -1;
        result.msg = '未找到作品';
        return result;
      }
    }
    result.code = mediaResult?.dataList?.metadata?.total ? 0 : -1;
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
export const getDayuhaoOverViewDashboard = async (
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
    { name: '粉丝数', key: 'totalFansCount' },
    { name: '推荐', key: 'recommendCount' },
    { name: '播放/阅读', key: 'playCount' },
    { name: '点赞', key: 'greatCount' },
    { name: '评论', key: 'commentCount' },
    { name: '分享', key: 'shareCount' },
    { name: '净增粉丝数', key: 'netFansCount' },
  ];

  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    //粉丝数 推荐、播放/阅读、点赞、评论、分享
    const newOverView = {
      all: {
        overview: {},
        thirtydays: {},
      },
    };
    result.dataObj = newOverView as never;
    const homeData = (await getDayuhaoDataOverviewFansStatisticAsync(cookie, webProxy)) ?? {};
    if ((homeData?.data?.length && !homeData?.error) || homeData.error?.toString() === 'no data') {
      result.data?.push({
        name: '粉丝数',
        key: 'totalFansCount',
        value: formatNumber(homeData?.data?.length ? parseInt(homeData?.data[0]?.value) : null),
        list: [],
      });
      newOverView.all.overview['totalFansCount'] = formatNumberNo(
        homeData?.data?.length ? parseInt(homeData?.data[0]?.value) : null,
      );
    } else {
      result.code = errorCode.data_error;
      result.msg = homeData?.error?.message ?? homeData?.error?.toString() ?? '';
      return result;
    }
    const endDay = dayjs().add(-1, 'days').format('YYYYMMDD');
    const startDay = dayjs()
      .add(-(days === 1 ? 7 : 30), 'days')
      .format('YYYYMMDD');
    const contentData = await getDataOverviewAsync(cookie, startDay, endDay, webProxy);
    if (contentData?.data?.length) {
      const dateMap: Map<string, number> = new Map<string, number>();
      contentData.data.forEach((item) => {
        dateMap.set(item.date, dayjs(item.date, 'YYYYMMDD').unix() * 1000);
      });

      let total = formatNumberNo(
        contentData.data
          .map((obj) => obj.show_pv)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const recm = {
        name: '推荐',
        key: 'recommendCount',
        value: formatNumber(total),
        list: contentData?.data?.map((obj) => ({
          date: dateMap.get(obj.date) ?? dayjs(obj.date, 'YYYYMMDD').unix() * 1000,
          value: obj.show_pv,
        })),
      };
      result.data?.push(recm);
      newOverView.all.overview[recm.key] = total;
      newOverView.all.thirtydays[recm.key] = recm.list;

      total = formatNumberNo(
        contentData.data
          .map((obj) => obj.read_pv)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const play = {
        name: '播放/阅读',
        key: 'playCount',
        value: formatNumber(total),
        list: contentData?.data?.map((obj) => ({
          date: dateMap.get(obj.date) ?? dayjs(obj.date, 'YYYYMMDD').unix() * 1000,
          value: obj.read_pv,
        })),
      };
      result.data?.push(play);
      newOverView.all.overview[play.key] = total;
      newOverView.all.thirtydays[play.key] = play.list;

      total = formatNumberNo(
        contentData.data
          .map((obj) => obj.like_pv)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const great = {
        name: '点赞',
        key: 'greatCount',
        value: formatNumber(total),
        list: contentData?.data?.map((obj) => ({
          date: dateMap.get(obj.date) ?? dayjs(obj.date, 'YYYYMMDD').unix() * 1000,
          value: obj.like_pv,
        })),
      };
      result.data?.push(great);
      newOverView.all.overview[great.key] = total;
      newOverView.all.thirtydays[great.key] = great.list;

      total = formatNumberNo(
        contentData.data
          .map((obj) => obj.comment_pv)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const comment = {
        name: '评论',
        key: 'commentCount',
        value: formatNumber(total),
        list: contentData?.data?.map((obj) => ({
          date: dateMap.get(obj.date) ?? dayjs(obj.date, 'YYYYMMDD').unix() * 1000,
          value: obj.comment_pv,
        })),
      };
      result.data?.push(comment);
      newOverView.all.overview[comment.key] = total;
      newOverView.all.thirtydays[comment.key] = comment.list;

      total = formatNumberNo(
        contentData.data
          .map((obj) => obj.share_pv)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const share = {
        name: '分享',
        key: 'shareCount',
        value: formatNumber(total),
        list: contentData?.data?.map((obj) => ({
          date: dateMap.get(obj.date) ?? dayjs(obj.date, 'YYYYMMDD').unix() * 1000,
          value: obj.share_pv,
        })),
      };
      result.data?.push(share);
      newOverView.all.overview[share.key] = total;
      newOverView.all.thirtydays[share.key] = share.list;
    } else {
      result.code = errorCode.data_error;
      result.msg = homeData['error'] ? homeData['error']['message'] : '';
      result.data = [];
      return result;
    }

    const fansResult = await getDayuhaoDataOverviewFansAsync(
      cookie,
      dayjs()
        .add(-(days === 1 ? 7 : 30), 'days')
        .format('YYYY-MM-DD'),
      dayjs().add(-1, 'days').format('YYYY-MM-DD'),
    );
    if (fansResult?.data?.list?.length) {
      const total = formatNumberNo(
        fansResult.data.list
          .map((obj) => obj.follow_increase)
          .filter((num) => typeof num === 'number' && !isNaN(num))
          .reduce((acc, num) => acc + num, 0),
      );
      const fan = {
        name: '净增粉丝数',
        key: 'netFansCount',
        value: formatNumber(total),
        list: fansResult.data.list?.map((obj) => ({
          date: new Date(obj.date).getTime() ?? 0,
          value: obj.follow_increase,
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
 * 获取企鹅号指定天数内公开作品数据
 * @param cookie
 * @param eventCallBack
 * @param type
 * @param days
 * @param maxCount
 * @param isHeader
 * @param proxy
 */
export const getDayuhaoContentListView = async (
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
    // 阅读、评论、点赞、收藏、分享
    const lastDate = dayjs().add(-days, 'days').toDate();
    result.headers = [
      { name: '封面', key: 'cover' },
      { name: '标题', key: 'title' },
      { name: '发布时间', key: 'date' },
      // { name: '推荐', key: 'reCommand' },
      { name: '阅读', key: 'read' },
      { name: '评论', key: 'comment' },
      { name: '点赞', key: 'great' },
      { name: '收藏', key: 'collect' },
      { name: '分享', key: 'share' },

      // { name: '喜欢', key: 'like' },
    ];
    if (isHeader) {
      return result;
    }
    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    let contentTmpiD = '';
    for (let i = 1; i < syncContentMaxPage; i++) {
      const contentList = await getContentListAsync(cookie, i, 'released', 'all', webProxy);
      if (contentList?.dataList?.data?.length) {
        if (contentList.dataList.data[0].content_id === contentTmpiD) {
          break;
        } else {
          contentTmpiD = contentList.dataList.data[0].content_id;
        }
        let j = 0;
        for (const item of contentList?.dataList.data) {
          j++;
          if (item.article_category != 0 && item.article_category != 1) {
            continue;
          }
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
          const newItem: PlatformContentItem = {
            id: item.origin_id.toString(),
            cover: item.cover_url,
            title: item.title,
            date: dateStr,
            read: formatNumber(item.realData?.click_pv ? item.realData.click_pv : item.realData.video_vv),
            play: formatNumber(item.realData?.click_pv ? item.realData.click_pv : item.realData.video_vv),
            comment: formatNumber(item.realData?.comment_pv),
            share: formatNumber(item.realData?.share_pv),
            collect: formatNumber(item.realData?.fav_pv),
            great: formatNumber(item.realData?.like_pv),
          };
          const newItemNum: PlatformContentItemNum = {
            id: item.origin_id.toString(),
            cover: item.cover_url,
            title: item.title,
            date: dateStr,
            read: formatNumberNo(item.realData?.click_pv ? item.realData.click_pv : item.realData.video_vv),
            play: formatNumberNo(item.realData?.click_pv ? item.realData.click_pv : item.realData.video_vv),
            comment: formatNumberNo(item.realData?.comment_pv),
            share: formatNumberNo(item.realData?.share_pv),
            collect: formatNumberNo(item.realData?.fav_pv),
            great: formatNumberNo(item.realData?.like_pv),
          };
          if (item.article_category === 1) {
            newItem.pageUrl = `https://mparticle.uc.cn/video.html?uc_param_str=frdnsnpfvecpntnwprdssskt&xss_item_id=${item.xss_item_id}`;
            newItem.type = 'video';
          } else {
            newItem.pageUrl = `https://mparticle.uc.cn/article.html?uc_param_str=frdnsnpfvecpntnwprdssskt&wm_aid=${item.origin_id}`;
            newItem.type = 'article';
          }
          newItemNum.pageUrl = newItem.pageUrl;
          newItemNum.type = newItem.type;
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
          result.code = Number(contentList?.error?.code) ?? contentList['code'] ?? -1;
          result.msg = contentList?.error?.message ?? contentList['msg'];
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
 * @param utoken
 * @param requestId
 */
export const deleteDayuhaooContent = async (
  cookie: string,
  contentType: PubContentEnum,
  docId: string,
  utoken?: string,
  requestId?: string,
): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    if (!utoken) {
      const userInfo = await getUserInfoAsync(cookie);
      if (!userInfo?.data?.utoken) {
        result.code = userInfo?.code ?? -1;
        result.msg = userInfo?.msg;
        return result;
      }
      utoken = userInfo.data.utoken;
      requestId = userInfo.data.requestId;
    }
    if (contentType === PubContentEnum.video) {
      const deleteRe = await deleteContent(cookie, docId, requestId ?? '', utoken, 1002);
      if (!deleteRe?.error) {
        return result;
      }
      const deleteMiniVideo = await deleteMiniVideoContent(cookie, docId, requestId ?? '', utoken);
      if (!deleteMiniVideo?.error) {
        return result;
      }
      result.code = -1;
      result.msg =
        (deleteRe ? deleteRe?.error?.message ?? deleteRe?.error : '') +
        '_' +
        (deleteMiniVideo ? deleteMiniVideo?.error?.message ?? deleteMiniVideo?.error : '');
    } else if (contentType === PubContentEnum.article) {
      const deleteRe = await deleteContent(cookie, docId, requestId ?? '', utoken, 1001);
      result.code = deleteRe?.error ? -1 : 0;
      result.msg = deleteRe ? deleteRe?.error?.message ?? deleteRe?.error : '';
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
