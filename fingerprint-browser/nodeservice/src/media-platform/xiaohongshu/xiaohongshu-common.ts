import { BaseResult } from '../baseResult';
import {
  getPersonalInfoAsync,
  getUserInfo,
  getXiaohongshuLiveDataOverview as getXiaohongshuLiveDataOverviewAsync,
  XiaohongshuLiveDataOverviewResponse,
} from './xiaohongshu-base.service';
import { AxiosError } from 'axios';
import { getFriendListResponse, XiaohongshuFriendInfo } from './xiaohongshu-friend.service';
import { getLocationListResponse, XiaohongshuLocationInfo } from './xiaohongshu-location.service';
import { createTopicResponse, getTopicListResponse, XiaohongshuTopicInfo } from './xiaohongshu-topic.service';
import { auditStatusEnum, formatNumber, formatNumberNo, Task } from '../../utils';
import {
  getAnalyzeContentListResponse,
  getContentListAsync,
  XiaohongshuContentListResponse,
  XiaohongshuMediaContent,
} from './xiaohongshu-content-list.service';
import {
  getDataCenterOverviewNewAsync,
  getAccountDataCenterOverviewAsync,
  getDataOverviewNewAsync,
  getDataOverviewSingleListAsync,
  XiaohongshuDataOverviewNewItem,
  XiaohongshuSingleDataOverview,
} from './xiaohongshu-data-overview.service';
import { errorCode } from '../errorCode';
import {
  AccountContentListViewOutPut,
  AccountReportDataOutPut,
  syncContentEventName,
  syncContentMaxPage,
} from '../data-service';
import { DataColumn, ListInfoResponse, PlatformAuthorInfo, UserCanPublishInfo, UserStatus } from '../baseModel';
import dayjs from 'dayjs';
import { createKuaiProxyAgent, IWebProxy, KuaiDaiLiProxy } from '../webproxy';
import { EventEmitter } from 'events';
import { deleteContent } from '@/media-platform/xiaohongshu/xiaohongshu-content-delete.service';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 获取小红书创作者信息
 * @param cookie
 * @param proxy
 */
export const getXiaohongshuUserInfo = async (
  cookie: string,
  proxy?: IWebProxy,
): Promise<XiaohongshuUserInfoResultOutput> => {
  const result: XiaohongshuUserInfoResultOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfoResult = await getUserInfo(cookie, webProxy);

    result.yixiaoerId = userInfoResult?.data?.userId?.toString();
    result.yixiaoerName = userInfoResult?.data?.userName?.toString();
    result.yixiaoerImageUrl = userInfoResult?.data?.userAvatar;
    result.raw = userInfoResult.data;
    result.code = userInfoResult.result;
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

export interface XiaohongshuUserInfoResultOutput extends PlatformAuthorInfo {
  /**
   * 状态码 0:正常，非0异常，-100:登录失效
   */
  code: number;
  /**
   * 数据体
   */
  data?: {
    /**
     * 用户id
     */
    userId: string;
    /**
     * 用户昵称
     */
    userName: string;
    /**
     * 用户头像
     */
    userAvatar: string;
    /**
     *小红书号
     */
    redId: string;
    /**
     * 角色 创作者/商家/等等
     */
    role: string;
  };
}

/**
 * 获取小红书直播数据概览，用于判断登录是否有效
 * @param cookie
 * @param proxy
 */
export const getXiaohongshuLiveDataOverview = async (
  cookie: string,
  proxy?: IWebProxy,
): Promise<XiaohongshuLiveDataOverviewResultOutput> => {
  const result: XiaohongshuLiveDataOverviewResultOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const liveDataResult = await getXiaohongshuLiveDataOverviewAsync(cookie, webProxy);

    result.code = liveDataResult?.code ?? errorCode.data_error;
    result.success = liveDataResult?.success;
    result.msg = liveDataResult?.msg;
    result.raw = liveDataResult?.data;
    result.data = liveDataResult?.data;
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

export interface XiaohongshuLiveDataOverviewResultOutput extends BaseResult {
  /**
   * 接口是否成功
   */
  success?: boolean;
  data?: XiaohongshuLiveDataOverviewResponse['data'];
  raw?: unknown;
}

export const getXiaoHongShuUserCanPubInfo = async (cookie: string, proxy?: IWebProxy): Promise<UserCanPublishInfo> => {
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
    const userInfo = await getPersonalInfoAsync(cookie, webProxy);
    result.code = userInfo?.result ?? -1;
    result.msg = userInfo?.msg ?? '';
    if (userInfo?.data?.diagnosis_status === 2) {
      const user = await getUserInfo(cookie, webProxy);
      if (user?.data?.permissions && !user?.data?.permissions?.includes('PRODUCT_NODE')) {
        result.data = { status: UserStatus.ban, msg: '因违反社区规范禁止发布笔记' };
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
    result.code = errorCode.exception;
  }
  return result;
};

/**
 * 获取好友/用户列表数据
 * @param cookie
 * @param keyWord 搜索关键词
 * @param pageNum 翻页页码，默认1
 */
export const getXiaohongshuFriendList = async (
  cookie: string,
  keyWord: string,
  pageNum: number = 1,
): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: 'ok',
    dataList: [],
  };

  try {
    const friendResult = await getFriendListResponse(cookie, keyWord ?? '', pageNum);

    result.code = friendResult?.code ?? errorCode.data_error;
    result.msg = friendResult?.msg;
    if (friendResult?.data?.user_info_dtos?.length) {
      result.dataList = friendResult?.data?.user_info_dtos.map((obj) => ({
        yixiaoerId: obj?.user_base_dto?.user_id?.toString(),
        yixiaoerName: obj.user_base_dto?.user_nickname,
        yixiaoerImageUrl: obj.user_base_dto?.image,
        raw: obj.user_base_dto,
      }));
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

export interface XiaohongshuFriendListResultOutput extends BaseResult {
  data?: {
    /**
     * 用户列表
     */
    user_info_dtos: [
      {
        /**
         * 用户详细信息
         */
        user_base_dto: XiaohongshuFriendInfo;
        /**
         * 粉丝数
         */
        fans_total: number;
      },
    ];
  };
}

/**
 * 获取地理位置信息列表
 * @param cookie
 * @param keyWord 搜索关键词
 * @param pageNum 翻页页码，默认1
 * @param proxy
 */
export const getXiaohongshuLocationList = async (
  cookie: string,
  keyWord: string,
  pageNum: number = 1,
  proxy?: KuaiDaiLiProxy,
): Promise<XiaohongshuLocationListResultOutput> => {
  const result: XiaohongshuLocationListResultOutput = {
    code: 0,
    msg: '',
    data: [],
  };

  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }

    const locationResult = await getLocationListResponse(cookie, keyWord ?? '', pageNum, webProxy);
    if (locationResult.data?.poi_list?.length) {
      for (const item of locationResult.data?.poi_list) {
        item['poiOid'] = item['poi_id'];
        item['recommendType'] = item['poi_type'];
        item['subname'] = item['full_address'];
        item['poiLongId'] = item['poi_id'];
        //以上为兼容老版本

        item['yixiaoerId'] = item['poi_id'];
        item['yixiaoerName'] = item['name'];
        //以上为选项类数据固定字段，id用于去重，name用于显示，这些字段不能变动字段名
        result.data?.push(item);
      }
      result.dataList = result.data?.map((item) => ({
        yixiaoerId: item.poiOid,
        yixiaoerName: item.name,
        yixiaoerDesc: item.subname,
        raw: item,
      }));
    }
    result.code = locationResult.code;
    result.msg = locationResult.msg;
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

export interface XiaohongshuLocationListResultOutput extends ListInfoResponse {
  /**
   * 地点列表
   */
  data?: Array<XiaohongshuLocationInfo>;
}

/**
 * 获取小红书话题列表信息
 * @param cookie
 * @param keyWord 搜索关键词
 * @param pageNum 翻页页码，默认首页1
 */
export const getXiaohongshuTopicList = async (
  cookie: string,
  keyWord: string,
  pageNum: number = 1,
): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: 'ok',
    dataList: [],
  };
  try {
    const topicResult = await getTopicListResponse(cookie, keyWord ?? '', pageNum);
    const findRe = topicResult?.data?.topic_info_dtos?.find((x) => x.name == keyWord);
    if (!findRe && topicResult.code === 0) {
      const createTopic = await createTopicResponse(cookie, keyWord);
      if (createTopic?.data?.topic_infos?.length) {
        if (!topicResult?.data?.topic_info_dtos) {
          topicResult.data = { topic_info_dtos: [] };
        }
        topicResult.data.topic_info_dtos.push({
          id: createTopic.data.topic_infos[0].id,
          name: createTopic.data.topic_infos[0].name,
          type: '',
          smart: false,
          link: '',
          view_num: 0,
        });
      }
    }
    if (topicResult?.data?.topic_info_dtos?.length) {
      result.dataList = topicResult?.data?.topic_info_dtos?.map((obj) => ({
        yixiaoerId: obj.id?.toString() ?? '',
        yixiaoerName: obj.name ?? '',
        viewNum: obj.view_num,
        raw: obj,
      }));
    }

    result.code = topicResult.code;
    result.msg = topicResult.msg;
    //result.data = topicResult.data;
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

export interface XiaohongshuTopicListResultOutput extends BaseResult {
  /**
   * 话题数据
   */
  data?: {
    /**
     * 话题列表
     */
    topic_info_dtos: Array<XiaohongshuTopicInfo>;
  };
}

/**
 * 查询作品的审核状态
 * @param cookie
 * @param publishId  发布产生的唯一publishId
 * @param maxPage 最大翻页数，超出后不再继续查询，默认10页
 */
export const getXiaohongshuMediaStatus = async (
  cookie: string,
  publishId: string,
  maxPage: number = 10,
): Promise<XiaohongshuMediaStatusResultOutput> => {
  const result: XiaohongshuMediaStatusResultOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };

  try {
    if (!maxPage) {
      maxPage = 1;
    }
    let contentList: XiaohongshuContentListResponse | undefined = undefined;
    for (let i = 0; i <= maxPage; i++) {
      //根据页码获取视频列表
      contentList = await getContentListAsync(cookie, 0, i);

      if (contentList?.data?.notes?.length) {
        for (const content of contentList.data.notes) {
          const findId = content?.id?.toString();

          if (findId === publishId) {
            result.docId = findId;
            result.create_time = new Date(content.time).getTime() / 1000;
            result.data = content;
            const mediaStatus = content?.tab_status;
            const perCode = content.permission_code;
            if (mediaStatus == 1) {
              result.auditStatus = auditStatusEnum.published;
              result.openUrl = `https://www.xiaohongshu.com/explore/${publishId}?xsec_token=${encodeURIComponent(
                content.xsec_token,
              )}&xsec_source=${encodeURIComponent(content.xsec_source)}`;
              if (content.post_timing === true) {
                result.auditStatus = auditStatusEnum.prePublish;
                result.openUrl = '';
              }
            } else if (mediaStatus == 3) {
              result.auditStatus = auditStatusEnum.deny;
            } else if (mediaStatus == 4) {
              result.auditStatus = auditStatusEnum.prePublish;
              if (content.schedule_post_time > 0) {
                result.create_time = new Date(content.schedule_post_time).getTime() / 1000;
              }
            } else if (mediaStatus == 2) {
              result.auditStatus = auditStatusEnum.inAudit;
            } else {
              result.auditStatus = auditStatusEnum.inAudit;
            }
            if (perCode == 1) {
              result.auditStatus = auditStatusEnum.notPublic;
            }

            result.coverUrl = content.images_list[0]?.url;
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
    //TODO 更多错误处理
  }

  return result;
};

export interface XiaohongshuMediaStatusResultOutput extends BaseResult {
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
  data?: XiaohongshuMediaContent;
}

/**
 * 小红书笔记管理
 * @param cookie
 * @param tab 类型（0全部，1已发布，2审核中，3未通过）
 * @param pageNum 翻页页码，默认首页为0 -1为最后一页
 */
export const getXiaohongshuContentList = async (
  cookie: string,
  tab: number,
  pageNum: number = 0,
): Promise<XiaohongshuContentListOutput> => {
  const result: XiaohongshuContentListOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const contentListResult = await getContentListAsync(cookie, tab, pageNum);
    result.code = contentListResult?.code;
    result.msg = contentListResult.msg;
    result.data = contentListResult.data;
    result.raw = contentListResult;

    if (result.code == -100) {
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
  }

  return result;
};

export interface XiaohongshuContentListOutput extends BaseResult {
  data?: {
    notes: Array<XiaohongshuMediaContent>;
    page: number;
  };

  raw?: unknown;
}

/**
 * 小红书笔记数据(账号30天概览)
 * @param cookie
 */
export const getXiaohongshuDataOverviewNewList = async (
  cookie: string,
): Promise<XiaohongshuAccountOverview30DaysOutput> => {
  const result: XiaohongshuAccountOverview30DaysOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const dataOverviewResult = await getAccountDataCenterOverviewAsync(cookie);
    result.code = dataOverviewResult?.code ?? 0;
    result.msg = dataOverviewResult.msg;
    result.data = dataOverviewResult.data.thirty as never;
    result.raw = dataOverviewResult;

    if (result.code == -100) {
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
  }

  return result;
};

export interface XiaohongshuDataOverviewNewListOutput extends BaseResult {
  data?: XiaohongshuDataOverviewNewItem;

  raw?: unknown;
}

/**
 * 小红书账号30天概览数据输出
 */
export interface XiaohongshuAccountOverview30DaysOutput extends BaseResult {
  data?: {
    // 观看数据
    impl_count: number; // 曝光数
    view_count: number; // 观看数
    cover_click_rate: number; // 封面点击率
    avg_view_time: number; // 平均观看时长(秒)
    view_time_avg: number; // 观看总时长(秒)
    view_time_avg_hours: number; // 观看总时长(小时)
    video_full_view_rate: number; // 视频完播率

    // 互动数据
    like_count: number; // 点赞数
    comment_count: number; // 评论数
    collect_count: number; // 收藏数
    share_count: number; // 分享数

    // 涨粉数据
    net_rise_fans_count: number; // 净增关注(净涨粉)
    rise_fans_count: number; // 新增关注
    loss_fans_count: number; // 取消关注
    home_view_count: number; // 主页访客
    home_conversion_rise_fans_rate: number; // 主页转粉率

    // 时间范围
    begin_time: number;
    end_time: number;

    // 列表数据
    impl_count_list: Array<{ date: number; count: number; count_with_double: number }>;
    view_list: Array<{ date: number; count: number; count_with_double: number }>;
    cover_click_rate_list: Array<{ date: number; count: number; count_with_double: number }>;
    avg_view_time_list: Array<{ date: number; count: number; count_with_double: number }>;
    view_time_list: Array<{ date: number; count: number; count_with_double: number }>;
    video_full_view_rate_list: Array<{ date: number; count: number; count_with_double: number }>;
    like_list: Array<{ date: number; count: number; count_with_double: number }>;
    comment_list: Array<{ date: number; count: number; count_with_double: number }>;
    collect_list: Array<{ date: number; count: number; count_with_double: number }>;
    share_list: Array<{ date: number; count: number; count_with_double: number }>;
    net_rise_fans_count_list: Array<{ date: number; count: number; count_with_double: number }>;
    rise_fans_list: Array<{ date: number; count: number; count_with_double: number }>;
    loss_fans_count_list: Array<{ date: number; count: number; count_with_double: number }>;
    home_view_list: Array<{ date: number; count: number; count_with_double: number }>;
    home_conversion_rise_fans_rate_list: Array<{ date: number; count: number; count_with_double: number }>;
  };

  raw?: unknown;
}

/**
 * 小红书笔记单篇数据
 * @param cookie
 * @param page 页码
 * @param page_size 每页数量（12，24，36，48）
 */
export const getXiaohongshuDataOverviewSingleList = async (
  cookie: string,
  page: number = 1,
  page_size: 12 | 24 | 36 | 48 = 12,
) => {
  const result: XiaohongshuDataOverviewSingleListOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const dataOverviewResult = await getDataOverviewSingleListAsync(cookie, page, page_size);
    result.code = dataOverviewResult?.result;
    result.msg = dataOverviewResult.msg;
    result.data = dataOverviewResult.data;
    result.raw = dataOverviewResult;

    if (result.code == -100) {
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
  }

  return result;
};

export interface XiaohongshuDataOverviewSingleListOutput extends BaseResult {
  data?: {
    note_info: Array<XiaohongshuSingleDataOverview>;
    total: number;
  };

  raw?: unknown;
}

/**
 * 小红书账号首页数据
 * @param cookie
 */
export const getXiaohongshuPersonalInfo = async (cookie: string): Promise<XiaohongshuPersonalInfoOutput> => {
  const result: XiaohongshuPersonalInfoOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const userInfoResult = await getPersonalInfoAsync(cookie);

    result.code = userInfoResult.result;
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
  }

  return result;
};

export interface XiaohongshuPersonalInfoOutput extends BaseResult {
  data?: {
    /**
     * 昵称
     */
    name: string;

    /**
     * 头像
     */
    avatar: string;

    /**
     * 关注
     */
    follow_count: number;

    /**
     * 粉丝数
     */
    fans_count: number;

    /**
     * 获赞与收藏
     */
    faved_count: number;
    red_num: string;
    personal_desc: string;
  };
}

/**
 *
 * @param cookie
 * @param days 1: 7天数据，2: 30天数据
 * @param proxy
 */
export const getXiaoHongShuOverViewDashboard = async (
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
    { name: '总获赞与收藏', key: 'totalFavedCount' },
    { name: '曝光数', key: 'recommendCount' },
    { name: '观看数', key: 'playCount' },
    { name: '封面点击率', key: 'coverClickRatio' },
    { name: '平均观看时长', key: 'averagePlayTime' },
    { name: '观看总时长(小时)', key: 'playDuration' },
    { name: '视频完播率', key: 'playCompletionRate' },
    { name: '点赞数', key: 'greatCount' },
    { name: '评论数', key: 'commentCount' },
    { name: '收藏数', key: 'collectCount' },
    { name: '分享数', key: 'shareCount' },
    { name: '净增关注', key: 'netFansCount' },
    { name: '新增关注', key: 'fansCount' },
    { name: '取消关注', key: 'cancelFansCount' },
    { name: '主页访客', key: 'homepageViewCount' },
    { name: '主页转粉率', key: 'homeConversionRate' },
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
    const fansData = await getPersonalInfoAsync(cookie, proxyAgent);
    if (fansData?.data?.name) {
      result.data?.push({
        name: '总粉丝数',
        key: 'totalFansCount',
        value: formatNumber(fansData.data.fans_count),
        list: [],
      });
      result.data?.push({
        name: '总获赞与收藏',
        key: 'totalFavedCount',
        value: formatNumber(fansData.data.faved_count),
        list: [],
      });
      newOverView.all.overview['totalFansCount'] = formatNumberNo(fansData.data.fans_count);
      newOverView.all.overview['totalFavedCount'] = formatNumberNo(fansData.data.faved_count);
    } else {
      result.code = fansData?.result ?? -1;
      result.msg = fansData?.msg ?? '';
      return result;
    }

    const tiaoResult = await getXiaohongshuDataOverviewCenterList(cookie, proxy);
    result.code = tiaoResult?.code ?? 0;
    result.msg = tiaoResult?.msg ?? '';

    if (days === 1) {
    } else {
      if (tiaoResult?.data?.collect_list && tiaoResult?.data?.collect_list?.length > 0) {
        const thtData = tiaoResult?.data;

        // 曝光数
        if (thtData?.impl_count_list?.length > 0) {
          const dataItem: DataColumn = {
            name: '曝光数',
            key: 'recommendCount',
            value: formatNumber(thtData?.impl_count),
            list: [],
          };
          result.data?.push(dataItem);
          newOverView.all.overview[dataItem.key] = formatNumberNo(thtData?.impl_count);
          for (const item of thtData?.impl_count_list) {
            dataItem.list.push({ date: item.date, value: item.count });
          }
          newOverView.all.thirtydays[dataItem.key] = dataItem.list;
        }

        // 观看数
        if (thtData?.view_list?.length > 0) {
          const dataItem: DataColumn = {
            name: '观看数',
            key: 'playCount',
            value: formatNumber(thtData?.view_count),
            list: [],
          };
          result.data?.push(dataItem);
          newOverView.all.overview[dataItem.key] = formatNumberNo(thtData?.view_count);
          for (const item of thtData?.view_list) {
            dataItem.list.push({ date: item.date, value: item.count });
          }
          newOverView.all.thirtydays[dataItem.key] = dataItem.list;
        }

        // 封面点击率
        if (thtData?.cover_click_rate_list?.length > 0) {
          const dataItem: DataColumn = {
            name: '封面点击率',
            key: 'coverClickRatio',
            value: `${(thtData?.cover_click_rate).toFixed(2)}%`,
            list: [],
          };
          result.data?.push(dataItem);
          newOverView.all.overview[dataItem.key] = Number(((thtData?.cover_click_rate ?? 0) / 100).toFixed(4));
          for (const item of thtData?.cover_click_rate_list) {
            dataItem.list.push({ date: item.date, value: Number(((item.count ?? 0) / 100).toFixed(4)) });
          }
          newOverView.all.thirtydays[dataItem.key] = dataItem.list;
        }

        // 平均观看时长
        if (thtData?.avg_view_time_list?.length > 0) {
          const dataItem: DataColumn = {
            name: '平均观看时长',
            key: 'averagePlayTime',
            value: `${thtData?.avg_view_time}`,
            list: [],
          };
          result.data?.push(dataItem);
          newOverView.all.overview[dataItem.key] = thtData?.avg_view_time;
          for (const item of thtData?.avg_view_time_list) {
            dataItem.list.push({ date: item.date, value: item.count });
          }
          newOverView.all.thirtydays[dataItem.key] = dataItem.list;
        }

        // 观看总时长(小时)
        if (thtData?.view_time_list?.length > 0) {
          const dataItem: DataColumn = {
            name: '观看总时长(小时)',
            key: 'playDuration',
            value: `${(thtData?.view_time_avg / (60 * 60)).toFixed(2)}`,
            list: [],
          };
          result.data?.push(dataItem);
          newOverView.all.overview[dataItem.key] = parseFloat((thtData?.view_time_avg).toFixed(2));
          for (const item of thtData?.view_time_list) {
            dataItem.list.push({ date: item.date, value: item.count });
          }
          newOverView.all.thirtydays[dataItem.key] = dataItem.list;
        }

        // 视频完播率
        if (thtData?.video_full_view_rate_list?.length > 0) {
          const dataItem: DataColumn = {
            name: '视频完播率',
            key: 'playCompletionRate',
            value: `${(thtData?.video_full_view_rate).toFixed(2)}%`,
            list: [],
          };
          result.data?.push(dataItem);
          newOverView.all.overview[dataItem.key] = Number(((thtData?.video_full_view_rate ?? 0) / 100)?.toFixed(4));
          for (const item of thtData?.video_full_view_rate_list) {
            dataItem.list.push({ date: item.date, value: Number(((item.count ?? 0) / 100)?.toFixed(4)) });
          }
          newOverView.all.thirtydays[dataItem.key] = dataItem.list;
        }

        // 点赞数
        if (thtData?.like_list?.length > 0) {
          const dataItem: DataColumn = {
            name: '点赞数',
            key: 'greatCount',
            value: formatNumber(thtData?.like_count),
            list: [],
          };
          result.data?.push(dataItem);
          newOverView.all.overview[dataItem.key] = formatNumberNo(thtData?.like_count);
          for (const item of thtData?.like_list) {
            dataItem.list.push({ date: item.date, value: item.count });
          }
          newOverView.all.thirtydays[dataItem.key] = dataItem.list;
        }

        // 评论数
        if (thtData?.comment_list?.length > 0) {
          const dataItem: DataColumn = {
            name: '评论数',
            key: 'commentCount',
            value: formatNumber(thtData?.comment_count),
            list: [],
          };
          result.data?.push(dataItem);
          newOverView.all.overview[dataItem.key] = formatNumberNo(thtData?.comment_count);
          for (const item of thtData?.comment_list) {
            dataItem.list.push({ date: item.date, value: item.count });
          }
          newOverView.all.thirtydays[dataItem.key] = dataItem.list;
        }

        // 收藏数
        if (thtData?.collect_list?.length > 0) {
          const dataItem: DataColumn = {
            name: '收藏数',
            key: 'collectCount',
            value: formatNumber(thtData?.collect_count),
            list: [],
          };
          result.data?.push(dataItem);
          newOverView.all.overview[dataItem.key] = formatNumberNo(thtData?.collect_count);
          for (const item of thtData?.collect_list) {
            dataItem.list.push({ date: item.date, value: item.count });
          }
          newOverView.all.thirtydays[dataItem.key] = dataItem.list;
        }

        // 分享数
        if (thtData?.share_list?.length > 0) {
          const dataItem: DataColumn = {
            name: '分享数',
            key: 'shareCount',
            value: formatNumber(thtData?.share_count),
            list: [],
          };
          result.data?.push(dataItem);
          newOverView.all.overview[dataItem.key] = formatNumberNo(thtData?.share_count);
          for (const item of thtData?.share_list) {
            dataItem.list.push({ date: item.date, value: item.count });
          }
          newOverView.all.thirtydays[dataItem.key] = dataItem.list;
        }

        // 净增关注(净涨粉)
        if (thtData?.net_rise_fans_count_list?.length > 0) {
          const dataItem: DataColumn = {
            name: '净增关注',
            key: 'netFansCount',
            value: formatNumber(thtData?.net_rise_fans_count),
            list: [],
          };
          result.data?.push(dataItem);
          newOverView.all.overview[dataItem.key] = formatNumberNo(thtData?.net_rise_fans_count);
          for (const item of thtData?.net_rise_fans_count_list) {
            dataItem.list.push({ date: item.date, value: item.count });
          }
          newOverView.all.thirtydays[dataItem.key] = dataItem.list;
        }

        // 新增关注
        if (thtData?.rise_fans_list?.length > 0) {
          const dataItem: DataColumn = {
            name: '新增关注',
            key: 'fansCount',
            value: formatNumber(thtData?.rise_fans_count),
            list: [],
          };
          result.data?.push(dataItem);
          newOverView.all.overview[dataItem.key] = formatNumberNo(thtData?.rise_fans_count);
          for (const item of thtData?.rise_fans_list) {
            dataItem.list.push({ date: item.date, value: item.count });
          }
          newOverView.all.thirtydays[dataItem.key] = dataItem.list;
        }

        // 取消关注
        if (thtData?.loss_fans_count_list?.length > 0) {
          const dataItem: DataColumn = {
            name: '取消关注',
            key: 'cancelFansCount',
            value: formatNumber(thtData?.loss_fans_count),
            list: [],
          };
          result.data?.push(dataItem);
          newOverView.all.overview[dataItem.key] = formatNumberNo(thtData?.loss_fans_count);
          for (const item of thtData?.loss_fans_count_list) {
            dataItem.list.push({ date: item.date, value: item.count });
          }
          newOverView.all.thirtydays[dataItem.key] = dataItem.list;
        }

        // 主页访客
        if (thtData?.home_view_list?.length > 0) {
          const dataItem: DataColumn = {
            name: '主页访客',
            key: 'homepageViewCount',
            value: formatNumber(thtData?.home_view_count),
            list: [],
          };
          result.data?.push(dataItem);
          newOverView.all.overview[dataItem.key] = formatNumberNo(thtData?.home_view_count);
          for (const item of thtData?.home_view_list) {
            dataItem.list.push({ date: item.date, value: item.count });
          }
          newOverView.all.thirtydays[dataItem.key] = dataItem.list;
        }

        // 主页转粉率
        if (thtData?.home_conversion_rise_fans_rate_list?.length > 0) {
          const dataItem: DataColumn = {
            name: '主页转粉率',
            key: 'homeConversionRate',
            value: `${(thtData?.home_conversion_rise_fans_rate).toFixed(2)}%`,
            list: [],
          };
          result.data?.push(dataItem);
          newOverView.all.overview[dataItem.key] = Number(
            ((thtData?.home_conversion_rise_fans_rate ?? 0) / 100).toFixed(4),
          );
          for (const item of thtData?.home_conversion_rise_fans_rate_list) {
            dataItem.list.push({ date: item.date, value: Number(((item.count ?? 0) / 100).toFixed(4)) });
          }
          newOverView.all.thirtydays[dataItem.key] = dataItem.list;
        }
      } else {
        result.code = result?.code ?? -1;
        result.data = [];
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

/**
 * 小红书概览数据
 * @param cookie
 * @param proxy
 */
export const getXiaohongshuDataOverviewCenterList = async (
  cookie: string,
  proxy?: KuaiDaiLiProxy,
): Promise<XiaohongshuAccountOverview30DaysOutput> => {
  const result: XiaohongshuAccountOverview30DaysOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    let proxyAgent;
    if (proxy?.serverAdd) {
      proxyAgent = createKuaiProxyAgent(proxy);
    }
    const dataOverviewResult = await getAccountDataCenterOverviewAsync(cookie, proxyAgent);
    result.code = dataOverviewResult?.code ?? 0;
    result.msg = dataOverviewResult.msg;
    result.data = dataOverviewResult.data.thirty as never;
    result.raw = dataOverviewResult;

    if (result.code == -100) {
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
  }

  return result;
};

/**
 * 获取小红书指定天数内，最多20条公开作品数据
 * @param cookie
 * @param eventCallBack
 * @param days
 * @param maxCount
 * @param isHeader
 * @param proxy
 */
export const getXiaohongshuContentListView = async (
  cookie: string,
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
      { name: '作品类型', key: 'type' },
      { name: '标题', key: 'title' },
      { name: '发布时间', key: 'date' },
      { name: '阅读', key: 'read' },
      { name: '评论', key: 'comment' },
      { name: '点赞', key: 'great' },
      { name: '收藏', key: 'collect' },
      { name: '分享', key: 'share' },
    ];
    if (isHeader) {
      return result;
    }
    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    let contentTmpId = '';
    for (let i = 0; i < syncContentMaxPage; i++) {
      const contentList = await getContentListAsync(cookie, 1, i, webProxy);
      if (contentList?.data?.notes?.length) {
        if (contentList.data.notes[0].id == contentTmpId) {
          break;
        } else {
          contentTmpId = contentList.data.notes[0].id;
        }
        let j = 0;
        for (const item of contentList?.data?.notes) {
          j++;
          if (item.permission_code === 1) {
            continue;
          }
          const date = dayjs(item.time).toDate();
          if (lastDate > date || result.data.length >= maxCount) {
            //前面可能会有三个置顶的
            if (j <= 3) {
              continue;
            }
            eventCallBack?.emit(syncContentEventName, { ...result });
            return result;
          }
          const dateStr = dayjs(date).format('YYYY-MM-DD HH:mm:ss');
          result.data.push({
            id: item.id,
            cover: item.images_list[0]?.url ?? '',
            type: item.type === 'video' ? 'video' : 'dynamic',
            title: item?.display_title ?? '',
            date: dateStr,
            read: formatNumber(item.view_count),
            comment: formatNumber(item.comments_count),
            great: formatNumber(item.likes),
            collect: formatNumber(item.collected_count),
            share: formatNumber(item.shared_count),
            pageUrl: `https://www.xiaohongshu.com/explore/${item.id}?xsec_token=${encodeURIComponent(
              item.xsec_token,
            )}&xsec_source=${encodeURIComponent(item.xsec_source)}`,
          });
          result.dataList.push({
            id: item.id,
            cover: item.images_list[0]?.url ?? '',
            type: item.type === 'video' ? 'video' : 'dynamic',
            title: item?.display_title ?? '',
            date: dateStr,
            read: formatNumberNo(item.view_count),
            comment: formatNumberNo(item.comments_count),
            great: formatNumberNo(item.likes),
            collect: formatNumberNo(item.collected_count),
            share: formatNumberNo(item.shared_count),
            pageUrl: `https://www.xiaohongshu.com/explore/${item.id}?xsec_token=${encodeURIComponent(
              item.xsec_token,
            )}&xsec_source=${encodeURIComponent(item.xsec_source)}`,
          });
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
 * 数据分析下的作品列表
 * @param cookie
 * @param eventCallBack
 * @param days
 * @param maxCount
 * @param isHeader
 * @param proxy
 */
export const getXiaohongshuAnalyzeContentListView = async (
  cookie: string,
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
      { name: '作品类型', key: 'type' },
      { name: '标题', key: 'title' },
      { name: '发布时间', key: 'date' },
      { name: '曝光', key: 'reCommand' },
      { name: '观看', key: 'read' },
      { name: '封面点击率', key: 'coverClickRatio' },
      { name: '评论', key: 'comment' },
      { name: '点赞', key: 'great' },
      { name: '收藏', key: 'collect' },
      { name: '涨粉', key: 'addFans' },
      { name: '分享', key: 'share' },
      { name: '人均播放时长', key: 'averagePlayTime' },
      { name: '弹幕', key: 'danmu' },
    ];
    if (isHeader) {
      return result;
    }
    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    let contentTmpId = '';
    for (let i = 1; i < syncContentMaxPage; i++) {
      const contentList = await getAnalyzeContentListResponse(cookie, 0, i, webProxy);
      if (contentList?.data?.note_infos?.length) {
        if (contentList.data.note_infos[0].id == contentTmpId) {
          break;
        } else {
          contentTmpId = contentList.data.note_infos[0].id;
        }
        let j = 0;
        for (const item of contentList?.data?.note_infos) {
          j++;
          // if (item.permission_code === 1) {
          //   continue;
          // }
          const date = dayjs(item.post_time).toDate();
          if (lastDate > date || result.data.length >= maxCount) {
            //前面可能会有三个置顶的
            if (j <= 3) {
              continue;
            }
            eventCallBack?.emit(syncContentEventName, { ...result });
            return result;
          }
          const dateStr = dayjs(date).format('YYYY-MM-DD HH:mm:ss');
          result.data.push({
            id: item.id,
            cover: item.cover_url ?? '',
            type: item.type === 2 ? 'video' : 'dynamic',
            title: item?.title ? item.title : '无标题笔记',
            date: dateStr,
            reCommand: formatNumber(item.imp_count),
            read: formatNumber(item.read_count),
            coverClickRatio: formatNumber(item.coverClickRate),
            comment: formatNumber(item.comment_count),
            addFans: formatNumber(item.increase_fans_count),
            great: formatNumber(item.like_count),
            collect: formatNumber(item.fav_count),
            share: formatNumber(item.share_count),
            averagePlayTime: formatNumber(item.view_time_avg),
            danmu: formatNumber(item.danmaku_count),
            pageUrl: ``,
          });
          result.dataList.push({
            id: item.id,
            cover: item.cover_url ?? '',
            type: item.type === 2 ? 'video' : 'dynamic',
            title: item?.title ? item.title : '无标题笔记',
            date: dateStr,
            reCommand: formatNumberNo(item.imp_count),
            read: formatNumberNo(item.read_count),
            coverClickRatio: formatNumberNo(item.coverClickRate),
            comment: formatNumberNo(item.comment_count),
            addFans: formatNumberNo(item.increase_fans_count),
            great: formatNumberNo(item.like_count),
            collect: formatNumberNo(item.fav_count),
            share: formatNumberNo(item.share_count),
            averagePlayTime: formatNumberNo(item.view_time_avg),
            danmu: formatNumberNo(item.danmaku_count),
            pageUrl: ``,
          });
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
export const deleteXiaohongshuContent = async (cookie: string, docId: string): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    const deleteResult = await deleteContent(cookie, docId);
    result.code = deleteResult?.code ?? -1;
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
