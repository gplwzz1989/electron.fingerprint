import { BaseResult } from '../../media-platform/baseResult';
import { getUserInfo, getXsrfToken, uploadImage, xinlangweiboSchedulePostFrequency } from './xinlangweibo-base.service';
import { AxiosError } from 'axios';
import { errorCode } from '../../media-platform/errorCode';
import FormData from 'form-data';
import {
  getToutiaoCollectionResponse,
  getVideoCollectionResponse,
  XinlangweiboCollectionInfo,
  WeiboToutiaoCollectionInfo,
} from './xinlangweibo-collection.service';
import {
  getUserHomeDataAsync,
  getXinlangweiboBlueVIPUserResponse,
  getXinlangweiboIndex,
  getXinlangweiboPublicAuthorSearchHtml,
} from './xinlangweibo-user.service';
import {
  getContentListAsync,
  getPrepubContentListAsync,
  getXinlangweiboArticleDraftListResponse,
  getXinlangweiboArticleListResponse,
  getXinlangweiboVideoListResponse,
  XinlangweiboContentListResponse,
  XinlangweiboMediaContent,
  XinlangweiboPreContent,
} from './xinlangweibo-content-list.service';
import {
  getArticleInteractTrendAsync,
  getArticleReadTrendAsync,
  getSingleArticleInteractAsync,
  getSingleArticleReadTrendAsync,
  getSingleVideoInteractAsync,
  getSingleVideoPlayTrendAsync,
  getSingleWeiboInteractAsync,
  getSingleWeiboReadTrendAsync,
  getVideoInteractTrendAsync,
  getVideoPlayTrendAsync,
  getWeiboFansTrendAsync,
  getWeiboInteractTrendAsync,
  getWeiboReadTrendAsync,
} from './xinlangweibo-data-overview.service';
import { getFriendListResponse, XinlangweiboFriendInfo } from './xinlangweibo-friend.service';
import { $http } from '../../http';
import {
  auditStatusEnum,
  convertCookieStr,
  formatNumber,
  formatNumberNo,
  Guid,
  readImageData,
  Task,
} from '../../utils';
import { getTopicListResponse, WeiboTopicInfo } from './xinlangweibo-topic.service';
import { getLocationListResponse, XinlangweiboLocationInfo } from './xinlangweibo-location.service';
import type { AccountContentListViewOutPut, AccountReportDataOutPut } from '../data-service';
import {
  DataColumn,
  ListInfoResponse,
  PlatformAuthorInfo,
  PlatformContentItem,
  PlatformContentItemNum,
  PublicAuthorPlatformCode,
  PlatformPublicAuthorInfo,
  PlatformPublicAuthorListOutput,
  UserCanPublishNum,
} from '../baseModel';
import { createKuaiProxyAgent, IWebProxy, KuaiDaiLiProxy } from '../webproxy';
import { EventEmitter } from 'events';
import {
  deleteArticleDraftContent,
  deleteContent,
} from '@/media-platform/xinlangweibo/xinlangweibo-content-delete.service';
import { PubContentEnum } from '@/cloud/model/TypeEnum';
import { HttpsProxyAgent } from 'https-proxy-agent';
import dayjs from 'dayjs';

// 与 data-service 保持一致，避免当前模块运行时反向加载平台聚合入口
const syncContentMaxPage = 36500;
const syncContentEventName = 'content_back';

/**
 * 用户基本信息
 */
export interface XinlangweiboUserInfoResultOutput extends PlatformAuthorInfo {
  data: {
    /**
     * 用户u信息
     */
    user?: {
      /**
       * 用户ID
       */
      id: number;
      /**
       * 用户ID字符串
       */
      idstr: string;
      /**
       * 是否为新用户
       */
      pc_new: number;
      /**
       * 用户昵称
       */
      screen_name: string;
      // 头像URL
      profile_image_url: string;
      // 个人主页URL
      profile_url: string;
      // 是否已验证
      verified: boolean;
      // 验证类型
      verified_type: number;
      // 大头像URL
      avatar_large: string;
      // 高清头像URL
      avatar_hd: string;
      // 是否关注我
      follow_me: boolean;
      // 是否正在关注
      following: boolean;
      // V+标识
      v_plus: number;
      // 是否有星球视频
      planet_video: boolean;
      // 验证原因
      verified_reason: string;
      // 个人描述
      description: string;
      // 所在地
      location: string;
      // 粉丝数
      followers_count: number;
      // 粉丝数字符串形式
      followers_count_str: string;
      // 关注数
      friends_count: number;
      // 微博数
      statuses_count: number;
      // SVIP标识
      svip: number;
      // VVIP标识
      vvip: number;
      // 手机封面图URL
      cover_image_phone: string;
      // 水印信息
      watermark: {
        // 水印位置，1:底部居右，2:底部居中，3:图片中心
        markpos: number;
        // 是否开启了水印；0表示未开启，显示用户昵称情况下表示开启了水印
        nick: number | string;
      };
      status_total_counter: {
        //转评赞
        total_cnt: number;
      };
    };
  };
}

/**
 * 视频合集列表
 */
export interface XinlangweiboVideoCollectionResultOutput extends BaseResult {
  data?: {
    /**
     * 合集列表
     */
    playlists: Array<XinlangweiboCollectionInfo>;
    /**
     * 总数
     */
    total_count: number;
  };
}

/**
 * 视频合集列表
 */
export interface XinlangweiboToutiaoCollectionResultOutput extends BaseResult {
  data?: {
    /**
     * 合集列表
     */
    list: Array<WeiboToutiaoCollectionInfo>;
  };
}
/**
 * 图片上传返回结构
 */
export interface UploadImageResultOutput extends BaseResult {
  data: {
    count: number;
    // 操作结果 true 成功 false 失败
    ret: boolean;
    pic: {
      // 图片是否被旋转
      rotated: boolean;
      // 图片的唯一标识符
      pid: string;
    };
  };
}

export interface XinlangweiboSchedulePostFrequencyResultOutput extends BaseResult {
  data?: {
    // 定时发文类型信息
    schedule: {
      // VIP图标 URL
      icon: string;
      // 跳转链接
      scheme: string;
      // 文本信息
      text: string;
      // 剩余次数
      residue_num: number;
      // 类型标识
      type: string;
    };
    edit: {
      // VIP图标 URL
      icon: string;
      // 跳转链接
      scheme: string;
      // 文本信息
      text: string;
      // 剩余次数
      residue_num: number;
      // 类型标识
      type: string;
    };
  };
}

/**
 * 获取新浪微博用户信息
 * @param cookie
 * @param proxy
 */
export const getXinlangweiboUserInfo = async (
  cookie: string,
  proxy?: KuaiDaiLiProxy,
): Promise<XinlangweiboUserInfoResultOutput> => {
  const result: XinlangweiboUserInfoResultOutput = {
    code: 0,
    msg: '',
    data: {},
  };
  try {
    cookie = convertCookieStr(cookie, 'weibo.com');
    let proxyAgent;
    if (proxy?.serverAdd) {
      proxyAgent = createKuaiProxyAgent(proxy);
    }
    //暂时取消这个验证，这个验证对蓝V号不适用
    // const xsrfToken = await getXsrfToken(cookie);
    // if (!xsrfToken) {
    //   console.debug('新浪微博cookie缺失XSRF-TOKEN----登录失效', cookie);
    //   result.code = 2;
    //   result.msg = '登录失效';
    //   return result;
    // }

    const preInfo = await getXinlangweiboBlueVIPUserResponse(cookie, proxyAgent);
    if (!preInfo || !preInfo?.data?.profile) {
      result.code = 302;
      result.msg = '登录失效';
      return result;
    }

    const userId = preInfo.data.profile?.split('u/')[1];

    const resultHtml = (await getUserInfo(cookie, userId))?.trim();

    const regex = /window\.\$CONFIG\s*=\s*({[\s\S]*?}\s*});/;

    let match = regex.exec(resultHtml);
    if (!match) {
      const regexNew = /window\.\$CONFIG\s*=\s*(\{[\s\S]*?\})\s*;\s*/;
      match = regexNew.exec(resultHtml);
    }
    if (match === null || resultHtml?.startsWith('Redirect')) {
      console.debug('新浪微博cookie----登录失效', cookie);
      result.code = 302;
      result.msg = '登录失效';
      return result;
    }

    const objectString = match[1];
    result.data = JSON.parse(objectString);

    //新版格式
    result.yixiaoerId = result.data?.user?.id?.toString() ?? result.data?.user?.idstr;
    result.yixiaoerName = result?.data?.user?.screen_name;
    result.yixiaoerImageUrl =
      result.data?.user?.avatar_hd ?? result.data?.user?.avatar_large ?? result.data?.user?.profile_image_url;
    result.raw = result.data?.user;
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
 * 新浪微博图片上传
 * @param cookie
 * @param uid 用户id
 * @param markpos 水印标记 来着用户信息中的watermark
 * @param nick 水印标记 来着用户信息中的watermark
 * @param imageUrl 图片地址
 * @param [retryTimes=3] 重拾请求次数
 */

export const xinlangweiboUploadImage = async (
  cookie: string,
  uid: number,
  markpos: number,
  nick: number | string,
  imageUrl: string,
  retryTimes: number = 3,
): Promise<UploadImageResultOutput> => {
  const result: UploadImageResultOutput = {
    data: { pic: { pid: '', rotated: false }, ret: false, count: 0 },
    code: 0,
    msg: '',
  };

  try {
    // 重拾请求
    for (let i = 0; i < retryTimes; i++) {
      result.data = await uploadImage(cookie, uid, markpos, nick, imageUrl);
      if (result.data.ret) {
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

export const getXinlangweiboFriendList = async (
  cookie: string,
  keyWord: string = '',
): Promise<XinlangweiboFriendOutput> => {
  const result: XinlangweiboFriendOutput = {
    code: 0,
    msg: '',
  };
  try {
    cookie = convertCookieStr(cookie, 'weibo.com');
    const friendResult = await getFriendListResponse(cookie, keyWord);
    if (friendResult?.ok === 1) {
      result.code = 0;
    } else if (friendResult?.ok === 0) {
      result.code = 1;
    } else {
      result.code = friendResult.ok ?? -1;
    }
    result.data = friendResult.data;
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

export interface XinlangweiboFriendOutput {
  /**
   * 状态码
   * 0 正常 非0异常
   */
  code: number;

  /**
   * 错误提示
   */
  msg: string;

  /**
   * 好友列表信息
   */
  data?: Array<XinlangweiboFriendInfo>;
}

/**
 * 查询新浪微博会员定时发布剩余次数
 * @param cookie
 */
export const getXinlangweiboSchedulePostFrequency = async (
  cookie: string,
): Promise<XinlangweiboSchedulePostFrequencyResultOutput> => {
  const result: XinlangweiboSchedulePostFrequencyResultOutput = {
    msg: '',
    code: 0,
  };

  try {
    cookie = convertCookieStr(cookie, 'weibo.com');
    const responseResult = await xinlangweiboSchedulePostFrequency(cookie);

    const isLogin = JSON.stringify(responseResult).includes('https://login.sina.com.cn/sso/login.php');

    if (isLogin) {
      result.code = 2;
      result.msg = '登录失效';
    }

    if (responseResult.ok === 0) {
      result.code = 3;
      result.msg = '服务异常';
    } else {
      result.data = responseResult.result;
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
 * 获取视频合集列表
 * @param cookie
 * @param page 翻页，首页为1，下一页累加1
 */
export const getXinlangweiboVideoCollectionList = async (
  cookie: string,
  page: number = 1,
): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };
  try {
    cookie = convertCookieStr(cookie, 'weibo.com');
    // const xsrfToken = await getXsrfToken(cookie);
    // if (!xsrfToken) {
    //   result.code = 2;
    //   result.msg = '登录失效';
    //   return result;
    // }

    const collectionResponse = await getVideoCollectionResponse(cookie, '', page);

    result.code = collectionResponse?.ok === 1 ? 0 : collectionResponse.error_code ?? errorCode.data_error;
    result.msg = collectionResponse?.error ?? '';
    if (collectionResponse?.data?.playlists?.length) {
      for (const item of collectionResponse.data?.playlists) {
        result.dataList?.push({
          yixiaoerId: item.id_str,
          yixiaoerName: item.name,
          yixiaoerDesc: item.description,
          yixiaoerImageUrl: item.cover?.url,
        });
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
 * 获取头条文章合集列表
 * @param cookie
 * @param uid 用户uid
 */
export const getXinlangweiboToutiaoCollectionList = async (
  cookie: string,
  uid: string,
): Promise<XinlangweiboToutiaoCollectionResultOutput> => {
  const result: XinlangweiboToutiaoCollectionResultOutput = {
    code: 0,
    msg: '',
  };
  try {
    cookie = convertCookieStr(cookie, 'weibo.com');
    const xsrfToken = await getXsrfToken(cookie);
    if (!xsrfToken) {
      result.code = 2;
      result.msg = '登录失效';
      return result;
    }

    const collectionResponse = await getToutiaoCollectionResponse(cookie, xsrfToken, uid);

    result.code = collectionResponse.code === 100000 ? 0 : errorCode.data_error;
    result.data = collectionResponse.data;
    result.msg = collectionResponse?.msg ?? '';
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
 * 微博首页数据
 * @param cookie
 * @param uid 微博用户id
 */
export const getXinlangweiboUserHomeData = async (
  cookie: string,
  uid: number,
): Promise<XinlangweiboUserHomeDataOutput> => {
  const result: XinlangweiboUserHomeDataOutput = {
    code: 0,
    msg: '',
  };
  try {
    cookie = convertCookieStr(cookie, 'weibo.com');
    const userHomeDataResponse = await getUserHomeDataAsync(cookie, uid);

    result.code = userHomeDataResponse.ok === 1 ? 0 : userHomeDataResponse.ok;
    result.data = userHomeDataResponse.data;
    result.msg = userHomeDataResponse?.message ?? '';
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

export interface XinlangweiboUserHomeDataOutput extends BaseResult {
  data?: {
    user: {
      /**
       * 用户id
       */
      id: number;
      idstr: string;
      pc_new: number;

      /**
       * 昵称
       */
      screen_name: string;

      /**
       * 封面
       */
      profile_image_url: string;
      profile_url: string;
      verified: boolean;
      verified_type: number;
      domain: string;
      weihao: string;
      avatar_large: string;
      avatar_hd: string;
      follow_me: boolean;
      following: boolean;
      mbrank: number;
      mbtype: number;
      v_plus: number;
      planet_video: boolean;
      description: string;
      location: string;
      gender: string;
      /**
       * 粉丝数
       */
      followers_count: number;
      followers_count_str: string;

      /**
       * 关注数
       */
      friends_count: number;

      /**
       * 作品数
       */
      statuses_count: number;
      url: string;
      svip: number;
      vvip: number;
      cover_image_phone: string;
      icon_list: [];
      user_type: number;
      is_star: string;
      is_muteuser: boolean;
      special_follow: boolean;
    };
    tabList: Array<{
      name: string;
      tabName: string;
    }>;
    blockText: string;
  };
}

/**
 * 获取微博列表
 * @param cookie
 * @param uid 微博用户id
 * @param page 页码
 */
export const getXinlangweiboContentList = async (
  cookie: string,
  uid: number,
  page: number = 1,
): Promise<XinlangweiboContentListOutput> => {
  const result: XinlangweiboContentListOutput = {
    code: 0,
    msg: '',
  };
  try {
    cookie = convertCookieStr(cookie, 'weibo.com');
    const contentListResponse = await getContentListAsync(cookie, uid, page);

    result.code = contentListResponse.ok === 1 ? 0 : contentListResponse.ok;
    result.data = contentListResponse.data;
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

export interface XinlangweiboContentListOutput extends BaseResult {
  data?: {
    since_id: string;
    list: Array<XinlangweiboMediaContent>;
    status_visible: number;
    bottom_tips_visible: boolean;
    bottom_tips_text: string;
    topicList: [];
    total: number;
  };
}

/**
 * 获取视频播放趋势
 * @param cookie
 * @param start_date 开始日期
 * @param end_date 结束日期
 * @param proxy
 */
export const getXinlangweiboVideoPlayTrend = async (
  cookie: string,
  start_date: Date,
  end_date: Date,
  proxy?: KuaiDaiLiProxy,
): Promise<XinlangweiboVideoPlayTrendOutput> => {
  const result: XinlangweiboVideoPlayTrendOutput = {
    code: 0,
    msg: '',
  };

  try {
    cookie = convertCookieStr(cookie, 'weibo.com');
    let proxyAgent;
    if (proxy?.serverAdd) {
      proxyAgent = createKuaiProxyAgent(proxy);
    }
    let start_date_str = start_date.toISOString();
    if (start_date_str.length > 0) {
      start_date_str = start_date_str.slice(0, 10);
    }

    let end_date_str = end_date.toISOString();
    if (end_date_str.length > 0) {
      end_date_str = end_date_str.slice(0, 10);
    }

    const videoPlayTrendResponse = await getVideoPlayTrendAsync(cookie, start_date_str, end_date_str, proxyAgent);
    result.code = videoPlayTrendResponse.code === 100000 ? 0 : videoPlayTrendResponse.code;
    result.msg = videoPlayTrendResponse.msg;
    result.data = videoPlayTrendResponse.data;
    result.raw = videoPlayTrendResponse;
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

export interface XinlangweiboVideoPlayTrendOutput extends BaseResult {
  data?: {
    chart: {
      videoPlayTrend: {
        starttime: string;
        /**
         * 视频发布数
         */
        videoCountTrend: Array<number>;
        videoCountTotal: number;
        /**
         * 视频播放数
         */
        videoPlayTrend: Array<number>;
        videoPlayTotal: number;
      };
    };
    param: {
      followers_count: number;
      starttime: string;
      endtime: string;
    };
  };

  raw?: unknown;
}

/**
 * 获取视频互动趋势
 * @param cookie
 * @param start_date 开始日期
 * @param end_date 结束日期
 */
export const getXinlangweiboVideoInteractTrend = async (
  cookie: string,
  start_date: Date,
  end_date: Date,
  proxy?: KuaiDaiLiProxy,
): Promise<XinlangweiboVideoInteractTrendOutput> => {
  const result: XinlangweiboVideoInteractTrendOutput = {
    code: 0,
    msg: '',
  };

  try {
    cookie = convertCookieStr(cookie, 'weibo.com');
    let proxyAgent;
    if (proxy?.serverAdd) {
      proxyAgent = createKuaiProxyAgent(proxy);
    }
    let start_date_str = start_date.toISOString();
    if (start_date_str.length > 0) {
      start_date_str = start_date_str.slice(0, 10);
    }

    let end_date_str = end_date.toISOString();
    if (end_date_str.length > 0) {
      end_date_str = end_date_str.slice(0, 10);
    }

    const videoInteractTrendResponse = await getVideoInteractTrendAsync(
      cookie,
      start_date_str,
      end_date_str,
      proxyAgent,
    );
    result.code = videoInteractTrendResponse.code === 100000 ? 0 : videoInteractTrendResponse.code;
    result.msg = videoInteractTrendResponse.msg;
    result.data = videoInteractTrendResponse.data;
    result.raw = videoInteractTrendResponse;
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

export interface XinlangweiboVideoInteractTrendOutput extends BaseResult {
  data?: {
    chart: {
      videoInteract: {
        starttime: string;

        /**
         * 转发
         */
        repostTrend: Array<number>;
        repostTotal: number;

        /**
         * 评论
         */
        commentTrend: Array<number>;
        commentTotal: number;

        /**
         * 点赞
         */
        likeTrend: Array<number>;
        likeTotal: number;

        /**
         * 互动
         */
        interTrend: Array<number>;
        interTotal: number;
      };
    };
    param: {
      followers_count: number;
      starttime: string;
      endtime: string;
    };
  };

  raw?: unknown;
}

/**
 * 获取单个视频播放趋势
 * @param cookie
 * @param mid 作品mid
 * @param oid 作品oid
 */
export const getXinlangweiboSingleVideoPlayTrend = async (
  cookie: string,
  mid: string,
  oid: string,
): Promise<XinlangweiboSingleVideoPlayTrendOutput> => {
  const result: XinlangweiboSingleVideoPlayTrendOutput = {
    code: 0,
    msg: '',
  };

  try {
    cookie = convertCookieStr(cookie, 'weibo.com');
    const singleVideoPlayTrendResponse = await getSingleVideoPlayTrendAsync(cookie, mid, oid);

    result.code = singleVideoPlayTrendResponse.code === 100000 ? 0 : singleVideoPlayTrendResponse.code;
    result.msg = singleVideoPlayTrendResponse.msg;
    result.data = singleVideoPlayTrendResponse.data;
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

export interface XinlangweiboSingleVideoPlayTrendOutput extends BaseResult {
  data?: {
    chart: {
      singleVideoPlayTrend: {
        starttime: string;
        /**
         * 视频播放数
         */
        playTrend: Array<number>;
        /**
         * 视频播放人数
         */
        playPeopleTrend: Array<number>;
        playTotal: number;
        playPeopleTotal: number;
      };
    };
    param: {
      followers_count: number;
      mid: string;
      oid: string;
      starttime: string;
      endtime: string;
    };
  };

  raw?: unknown;
}

/**
 * 获取单个视频互动趋势
 * @param cookie
 * @param mid 作品mid
 * @param oid 作品oid
 */
export const getXinlangweiboSingleVideoInteract = async (
  cookie: string,
  mid: string,
  oid: string,
): Promise<XinlangweiboSingleVideoInteractOutput> => {
  const result: XinlangweiboSingleVideoInteractOutput = {
    code: 0,
    msg: '',
  };

  try {
    cookie = convertCookieStr(cookie, 'weibo.com');
    const singleVideoInteractResponse = await getSingleVideoInteractAsync(cookie, mid, oid);

    result.code = singleVideoInteractResponse.code === 100000 ? 0 : singleVideoInteractResponse.code;
    result.msg = singleVideoInteractResponse.msg;
    result.data = singleVideoInteractResponse.data;
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

export interface XinlangweiboSingleVideoInteractOutput extends BaseResult {
  data?: {
    chart: {
      singleVideoInter: {
        starttime: string;
        /**
         * 转发
         */
        repostTrend: Array<number>;
        repostTotal: number;
        /**
         * 评论
         */
        commentTrend: Array<number>;
        commentTotal: number;
        /**
         * 点赞
         */
        likeTrend: Array<number>;
        likeTotal: number;
      };
    };
    param: {
      followers_count: number;
      mid: string;
      oid: string;
      starttime: string;
      endtime: string;
    };
  };

  raw?: unknown;
}

/**
 * 获取文章阅读趋势
 * @param cookie
 * @param start_date 开始日期
 * @param end_date 结束日期
 */
export const getXinlangweiboArticleReadTrend = async (
  cookie: string,
  start_date: Date,
  end_date: Date,
): Promise<XinlangweiboArticleReadTrendOutput> => {
  const result: XinlangweiboArticleReadTrendOutput = {
    code: 0,
    msg: '',
  };

  try {
    cookie = convertCookieStr(cookie, 'weibo.com');
    let start_date_str = start_date.toISOString();
    if (start_date_str.length > 0) {
      start_date_str = start_date_str.slice(0, 10);
    }

    let end_date_str = end_date.toISOString();
    if (end_date_str.length > 0) {
      end_date_str = end_date_str.slice(0, 10);
    }

    const articleReadTrendResponse = await getArticleReadTrendAsync(cookie, start_date_str, end_date_str);
    result.code = articleReadTrendResponse.code === 100000 ? 0 : articleReadTrendResponse.code;
    result.msg = articleReadTrendResponse.msg;
    result.data = articleReadTrendResponse.data;
    result.raw = articleReadTrendResponse;
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

export interface XinlangweiboArticleReadTrendOutput extends BaseResult {
  data?: {
    chart: {
      articleReadTrend: {
        starttime: string;
        /**
         * 文章阅读数
         */
        articleReadTrend: Array<number>;
        articleReadTotal: number;
        /**
         * 文章发布数
         */
        articleSendTrend: Array<number>;
        articleSendTotal: number;
      };
    };
    param: {
      followers_count: number;
      starttime: string;
      endtime: string;
    };
  };

  raw?: unknown;
}

/**
 * 获取文章互动趋势
 * @param cookie
 * @param start_date 开始日期
 * @param end_date 结束日期
 */
export const getXinlangweiboArticleInteractTrend = async (
  cookie: string,
  start_date: Date,
  end_date: Date,
): Promise<XinlangweiboArticleInteractTrendOutput> => {
  const result: XinlangweiboArticleInteractTrendOutput = {
    code: 0,
    msg: '',
  };

  try {
    cookie = convertCookieStr(cookie, 'weibo.com');
    let start_date_str = start_date.toISOString();
    if (start_date_str.length > 0) {
      start_date_str = start_date_str.slice(0, 10);
    }

    let end_date_str = end_date.toISOString();
    if (end_date_str.length > 0) {
      end_date_str = end_date_str.slice(0, 10);
    }

    const articleInteractTrendResponse = await getArticleInteractTrendAsync(cookie, start_date_str, end_date_str);
    result.code = articleInteractTrendResponse.code === 100000 ? 0 : articleInteractTrendResponse.code;
    result.msg = articleInteractTrendResponse.msg;
    result.data = articleInteractTrendResponse.data;
    result.raw = articleInteractTrendResponse;
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

export interface XinlangweiboArticleInteractTrendOutput extends BaseResult {
  data?: {
    chart: {
      articleInteractTrend: {
        starttime: string;

        /**
         * 文章转发数
         */
        repostTrend: Array<number>;
        repostTotal: number;

        /**
         * 文章评论数
         */
        commentTrend: Array<number>;
        commentTotal: number;

        /**
         * 点赞数
         */
        likeTrend: Array<number>;
        likeTotal: number;

        /**
         * 转发点赞数
         */
        interTrend: Array<number>;
        interTotal: number;
      };
    };
    param: {
      followers_count: number;
      starttime: string;
      endtime: string;
    };
  };

  raw?: unknown;
}

/**
 * 获取单篇文章阅读趋势
 * @param cookie
 * @param mid 作品mid
 * @param oid 作品oid
 */
export const getXinlangweiboSingleArticleReadTrend = async (
  cookie: string,
  mid: string,
  oid: string,
): Promise<XinlangweiboSingleArticleReadTrendOutput> => {
  const result: XinlangweiboSingleArticleReadTrendOutput = {
    code: 0,
    msg: '',
  };

  try {
    cookie = convertCookieStr(cookie, 'weibo.com');
    const singleArticleReadTrendResponse = await getSingleArticleReadTrendAsync(cookie, mid, oid);
    result.code = singleArticleReadTrendResponse.code === 100000 ? 0 : singleArticleReadTrendResponse.code;
    result.msg = singleArticleReadTrendResponse.msg;
    result.data = singleArticleReadTrendResponse.data;
    result.raw = singleArticleReadTrendResponse;
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

export interface XinlangweiboSingleArticleReadTrendOutput extends BaseResult {
  data?: {
    chart: {
      singleArticleReadTrend: {
        starttime: string;

        /**
         * 阅读数
         */
        readTrend: Array<number>;
        readTotal: number;

        /**
         * 阅读人数
         */
        readPeopleTrend: Array<number>;
        readPeopleTotal: number;
        averageRead: number;
      };
    };
    param: {
      followers_count: number;
      mid: string;
      oid: string;
      starttime: string;
      endtime: string;
    };
  };

  raw?: unknown;
}

/**
 * 获取单篇文章互动
 * @param cookie
 * @param mid 作品mid
 */
export const getXinlangweiboSingleArticleInteract = async (
  cookie: string,
  mid: string,
): Promise<XinlangweiboSingleArticleInteractOutput> => {
  const result: XinlangweiboSingleArticleInteractOutput = {
    code: 0,
    msg: '',
  };

  try {
    cookie = convertCookieStr(cookie, 'weibo.com');
    const singleArticleInteractResponse = await getSingleArticleInteractAsync(cookie, mid);
    result.code = singleArticleInteractResponse.code === 100000 ? 0 : singleArticleInteractResponse.code;
    result.msg = singleArticleInteractResponse.msg;
    result.data = singleArticleInteractResponse.data;
    result.raw = singleArticleInteractResponse;
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

export interface XinlangweiboSingleArticleInteractOutput extends BaseResult {
  data?: {
    chart: {
      singleArticleInter: {
        starttime: string;

        /**
         * 转发数
         */
        repostTrend: Array<number>;
        repostTotal: number;

        /**
         * 评论数
         */
        commentTrend: Array<number>;
        commentTotal: number;

        /**
         * 点赞数
         */
        likeTrend: Array<number>;
        likeTotal: number;
      };
    };
    param: {
      followers_count: number;
      mid: string;
      starttime: string;
      endtime: string;
    };
  };

  raw?: unknown;
}

/**
 * 获取微博阅读趋势
 * @param cookie
 * @param start_date 开始日期
 * @param end_date 结束日期
 * @param proxy
 */
export const getXinlangweiboWeiboReadTrend = async (
  cookie: string,
  start_date: Date,
  end_date: Date,
  proxy?: KuaiDaiLiProxy,
): Promise<XinlangweiboWeiboReadTrendOutput> => {
  const result: XinlangweiboWeiboReadTrendOutput = {
    code: 0,
    msg: '',
  };

  try {
    cookie = convertCookieStr(cookie, 'weibo.com');
    //proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
    let proxyAgent;
    if (proxy?.serverAdd) {
      proxyAgent = createKuaiProxyAgent(proxy);
    }
    let start_date_str = start_date.toISOString();
    if (start_date_str.length > 0) {
      start_date_str = start_date_str.slice(0, 10);
    }

    let end_date_str = end_date.toISOString();
    if (end_date_str.length > 0) {
      end_date_str = end_date_str.slice(0, 10);
    }

    const weiboReadTrendResponse = await getWeiboReadTrendAsync(cookie, start_date_str, end_date_str, proxyAgent);
    result.code = weiboReadTrendResponse.code === 100000 ? 0 : weiboReadTrendResponse.code;
    result.msg = weiboReadTrendResponse.msg;
    result.data = weiboReadTrendResponse.data;
    result.raw = weiboReadTrendResponse;
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

export interface XinlangweiboWeiboReadTrendOutput extends BaseResult {
  data?: {
    chart: {
      weiboReadTrend: {
        starttime: string;

        /**
         * 微博发布数
         */
        weibos: Array<number>;
        reads: Array<number>;

        /**
         * 微博阅读数
         */
        readTotal: number;
        weiboTotal: number;
      };
    };
    param: {
      followers_count: number;
      starttime: string;
      endtime: string;
    };
  };

  raw?: unknown;
}

/**
 * 获取微博互动趋势
 * @param cookie
 * @param start_date 开始日期
 * @param end_date 结束日期
 * @param proxy
 */
export const getXinlangweiboWeiboInteractTrend = async (
  cookie: string,
  start_date: Date,
  end_date: Date,
  proxy?: KuaiDaiLiProxy,
): Promise<XinlangweiboWeiboInteractTrendOutput> => {
  const result: XinlangweiboWeiboInteractTrendOutput = {
    code: 0,
    msg: '',
  };

  try {
    cookie = convertCookieStr(cookie, 'weibo.com');
    //proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
    let proxyAgent;
    if (proxy?.serverAdd) {
      proxyAgent = createKuaiProxyAgent(proxy);
    }
    let start_date_str = start_date.toISOString();
    if (start_date_str.length > 0) {
      start_date_str = start_date_str.slice(0, 10);
    }

    let end_date_str = end_date.toISOString();
    if (end_date_str.length > 0) {
      end_date_str = end_date_str.slice(0, 10);
    }

    const weiboInteractTrendResponse = await getWeiboInteractTrendAsync(
      cookie,
      start_date_str,
      end_date_str,
      proxyAgent,
    );
    result.code = weiboInteractTrendResponse.code === 100000 ? 0 : weiboInteractTrendResponse.code;
    result.msg = weiboInteractTrendResponse.msg;
    result.data = weiboInteractTrendResponse.data;
    result.raw = weiboInteractTrendResponse;
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

export interface XinlangweiboWeiboInteractTrendOutput extends BaseResult {
  data?: {
    chart: {
      weiboInteract: {
        interTotal: number;
        repostTotal: number;
        commentTotal: number;
        likeTotal: number;

        /**
         * 转发数
         */
        repostTrend: Array<number>;

        /**
         * 评论数
         */
        commentTrend: Array<number>;

        /**
         * 点赞数
         */
        likeTrend: Array<number>;

        /**
         * 转发点赞数
         */
        weiboInteractTrend: Array<number>;
        starttime: string;
      };
    };
    param: {
      followers_count: number;
      starttime: string;
      endtime: string;
    };
  };

  raw?: unknown;
}

/**
 * 获取微博阅读趋势
 * @param cookie
 * @param mid 作品mid
 */
export const getXinlangweiboSingleWeiboReadTrend = async (
  cookie: string,
  mid: string,
): Promise<XinlangweiboSingleWeiboReadTrendOutput> => {
  const result: XinlangweiboSingleWeiboReadTrendOutput = {
    code: 0,
    msg: '',
  };

  try {
    cookie = convertCookieStr(cookie, 'weibo.com');
    const singleWeiboReadTrendResponse = await getSingleWeiboReadTrendAsync(cookie, mid);
    result.code = singleWeiboReadTrendResponse.code === 100000 ? 0 : singleWeiboReadTrendResponse.code;
    result.msg = singleWeiboReadTrendResponse.msg;
    result.data = singleWeiboReadTrendResponse.data;
    result.raw = singleWeiboReadTrendResponse;
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

export interface XinlangweiboSingleWeiboReadTrendOutput extends BaseResult {
  data?: {
    chart: {
      singleWeiboReadTrend: {
        starttime: string;
        /**
         * 微博阅读数
         */
        readTrend: Array<number>;

        /**
         * 微博阅读人数
         */
        readPeopleTrend: Array<number>;
        readTotal: number;
        readPeopleTotal: number;
      };
    };
    param: {
      followers_count: number;
      mid: string;
      starttime: string;
      endtime: string;
    };
  };

  raw?: unknown;
}

/**
 * 获取微博互动趋势
 * @param cookie
 * @param mid 作品mid
 */
export const getXinlangweiboSingleWeiboInteract = async (
  cookie: string,
  mid: string,
): Promise<XinlangweiboSingleWeiboInteractOutput> => {
  const result: XinlangweiboSingleWeiboInteractOutput = {
    code: 0,
    msg: '',
  };

  try {
    cookie = convertCookieStr(cookie, 'weibo.com');
    const singleWeiboInteractResponse = await getSingleWeiboInteractAsync(cookie, mid);
    result.code = singleWeiboInteractResponse.code === 100000 ? 0 : singleWeiboInteractResponse.code;
    result.msg = singleWeiboInteractResponse.msg;
    result.data = singleWeiboInteractResponse.data;
    result.raw = singleWeiboInteractResponse;
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

export interface XinlangweiboSingleWeiboInteractOutput extends BaseResult {
  data?: {
    chart: {
      singleWeiboInteract: {
        starttime: string;

        /**
         * 微博转发数
         */
        repostTrend: Array<number>;
        repostTotal: number;

        /**
         * 评论数
         */
        commentTrend: Array<number>;
        commentTotal: number;

        /**
         * 点赞数
         */
        likeTrend: Array<number>;
        likeTotal: number;
      };
    };
    param: {
      followers_count: number;
      mid: string;
      starttime: string;
      endtime: string;
    };
  };

  raw?: unknown;
}

/**
 * 创建草稿箱 获取文章id
 * @param cookie
 * @param uid
 */
export const createXinlangweiboDraft = async (cookie: string, uid: number): Promise<WeiboToutiaoDraftResponse> => {
  const result: WeiboToutiaoDraftResponse = {
    code: 0,
    msg: '',
  };

  try {
    const responseResult = await xinlangweiboCreateDraft(cookie, uid);
    if (responseResult.code === 100000) {
      result.data = responseResult;
    } else {
      result.code = responseResult.code;
      result.msg = responseResult.msg;
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
 * 创建草稿箱返回结构
 */
export interface WeiboToutiaoDraftResponse extends BaseResult {
  data?: {
    // 状态码
    code: number;
    msg: string;
    // 基础信息
    data?: {
      // 创建时间
      updated: string;
      // 草稿id
      id: string;
    };
  };
}
/**
 * 新浪微博创建草稿
 * @param cookie
 * @param uid 用户id
 */
const xinlangweiboCreateDraft = async (cookie: string, uid: number): Promise<XinlangweiboCreateDraftResultResponse> => {
  const rid = generateRandomString(16);
  const url = `https://card.weibo.com/article/v3/aj/editor/draft/create?uid=${uid}&_rid=${rid}`;

  const header = {
    Cookie: cookie,
    Origin: 'https://card.weibo.com',
    Referer: 'https://card.weibo.com/article/v3/editor',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Sn-Reqid': rid,
  };

  const formData = new FormData();
  formData.append('_rid', rid);

  const result = await $http.post(url, formData, {
    headers: header,
  });

  return result.data;
};

/**
 * 新浪微博创建草稿返回结果
 */
interface XinlangweiboCreateDraftResultResponse {
  // 状态码
  code: number;
  msg: string;
  // 基础信息
  data?: {
    // 创建时间
    updated: string;
    // 草稿id
    id: string;
  };
}

/**
 * 在指定字符串中 随机生成指定长度的字符串
 * @param length
 */
export const generateRandomString = (length: number = 16) => {
  // 原始字符串来源于 新浪微博官方
  const originalString = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * originalString.length);
    result += originalString[randomIndex];
  }
  return result;
};

/**
 * 新浪微博封面图片上传
 * @param cookie
 * @param imageUrl
 * @param retryTimes
 */
export const xinlangweiboCoverUploadImage = async (
  cookie: string,
  imageUrl: string,
  retryTimes: number = 3,
): Promise<UploadCoverImageResultOutput> => {
  const result: UploadCoverImageResultOutput = {
    data: { code: '' },
    code: 0,
    msg: '',
  };

  try {
    // 重拾请求
    for (let i = 0; i < retryTimes; i++) {
      result.data = await articleCoverUploadImage(cookie, imageUrl);
      if (result.data.code === 'A00006') {
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
 * 上封面返回结构
 */
export interface UploadCoverImageResultOutput extends BaseResult {
  data: {
    // 操作结果 A00006 表示成功
    code: string;
    data?: {
      pics: {
        pic_1: {
          pid: string;
        };
      };
    };
    // 请求出错的信息
    ret?: boolean;
    count?: number;
    errno?: number;
  };
}

/**
 * 新浪微博头条文章封面上传
 * @param cookie
 * @param imageUrl
 */
export const articleCoverUploadImage = async (
  cookie: string,
  imageUrl: string,
): Promise<XinlangweiboCoverUploadImageResultResponse> => {
  // 文件上传地址
  const url = 'https://picupload.weibo.com/interface/pic_upload.php';
  const header = {
    Origin: 'https://card.weibo.com',
    Referer: 'https://card.weibo.com/',
    Cookie: cookie,
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  // 获取网络图片Buffer
  const imageBuffer = await readImageData(imageUrl, 'jpeg');
  const rid = generateRandomString(16);
  // 参数组装
  const params = {
    app: 'miniblog',
    s: 'json',
    p: 1,
    data: 1,
    url: 0,
    markpos: 1,
    nick: 0,
    file_source: 4,
    _rid: rid,
  };

  // 发送请求
  const result = await $http.post(url, imageBuffer.data, {
    params: params,
    headers: header,
  });
  return result.data;
};

/**
 * 新浪微博封面上传返回结果
 */
export interface XinlangweiboCoverUploadImageResultResponse {
  // 操作结果 A00006 成功
  code: string;
  data?: {
    pics: {
      pic_1: {
        pid: string;
      };
    };
  };
  // 请求出错的信息
  ret?: boolean;
  errno?: number;
}

/**
 * 话题接口，目前为了适配而生，只是讲输入的关键词转化为话题对象，并非从官方获取
 * @param keyWord 关键词
 * @param cookie 账号cookie
 */
export const getXinlangweiboTopicList = async (cookie: string, keyWord: string): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    cookie = convertCookieStr(cookie, 'weibo.com');
    const topicsList = await getTopicListResponse(cookie, keyWord);
    if (topicsList?.data?.length > 0) {
      for (const item of topicsList.data) {
        item.id = Guid.NewGuid().toString();
      }
      result.dataList = topicsList?.data.map((obj) => ({ yixiaoerId: obj.id, yixiaoerName: obj.topic, raw: obj }));
    } else if (keyWord) {
      const id = Guid.NewGuid().toString();
      result.dataList?.push({
        yixiaoerId: id,
        yixiaoerName: keyWord,
        raw: { topic: keyWord, id: Guid.NewGuid().toString() },
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

  return result;
};

export interface XinlangweiboTopicResult {
  code: number;

  msg: string;

  topics: Array<WeiboTopicInfo>;
}

/**
 * 获取地点列表
 * @param cookie
 * @param keyWord
 * @param proxy
 */
export const getxinlangweiboLocationList = async (
  cookie: string,
  keyWord: string,
  proxy?: KuaiDaiLiProxy,
): Promise<XinlangweiboLocationResult> => {
  const result: XinlangweiboLocationResult = {
    code: 0,
    msg: '',
    pois: [],
  };

  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }

    cookie = convertCookieStr(cookie, 'weibo.com');
    const locationList = await getLocationListResponse(cookie, keyWord, webProxy);
    if (locationList?.data?.pois?.length > 0) {
      for (const item of locationList.data.pois) {
        item['yixiaoerId'] = item.poiid;
        item['yixiaoerName'] = item.title;
        result.pois.push(item);
      }
      result.dataList = result.pois?.map((item) => ({
        yixiaoerId: item.yixiaoerId,
        yixiaoerName: item.yixiaoerName,
        yixiaoerDesc: item.address,
        raw: item,
      }));
    }
    if (locationList.ok != 1) {
      result.code = -1;
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

export interface XinlangweiboLocationResult extends ListInfoResponse {
  code: number;
  msg: string;
  /**
   * 地点列表
   */
  pois: Array<XinlangweiboLocationInfo>;
}

/**
 * 获取微博发布状态
 * @param cookie
 * @param publishId 作品发布id
 * @param uid 用户id
 * @param maxPage 最大翻页数
 */
export const getXinlangweiboVideoStatus = async (
  cookie: string,
  publishId: string,
  uid: number = 0,
  maxPage: number = 10,
): Promise<XinlangweiboContentStatusResultOutput> => {
  const result: XinlangweiboContentStatusResultOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };
  try {
    cookie = convertCookieStr(cookie, 'weibo.com');
    //先查定时发布
    const prepubResult = await getPrepubContentListAsync(cookie);
    if (prepubResult?.data?.statuses?.length > 0) {
      for (const item of prepubResult.data.statuses) {
        const findDocId = item.schedule_id?.toString();
        let objId = item.url_objects?.length
          ? item.url_objects?.find((x) => x.url_ori?.includes(':'))?.object_id?.toString()
          : '';
        if (objId?.includes(':')) {
          objId = objId?.split(':')[1];
        }
        if (findDocId === publishId || objId === publishId) {
          result.code = 0;
          result.auditStatus = auditStatusEnum.prePublish;
          result.docId = findDocId;
          result.create_time = new Date(item.schedule_at).getTime();
          result.data = item;
          return result;
        }
      }
    }

    //再查普通发布
    if (!uid) {
      const userInfo = await getXinlangweiboUserInfo(cookie);
      uid = userInfo?.data?.user?.id ?? 0;
    }

    let statusResult: XinlangweiboContentListResponse | undefined = undefined;
    for (let i = 1; i < maxPage; i++) {
      statusResult = await getContentListAsync(cookie, uid, i);
      if (statusResult?.data?.list?.length > 0) {
        for (const item of statusResult?.data?.list) {
          const findDocId = item.page_info?.object_id ?? item.page_info?.page_id ?? item.idstr;
          if (findDocId?.endsWith(publishId)) {
            result.code = 0;
            result.auditStatus = auditStatusEnum.published;
            if (item.visible?.type != 0) {
              result.auditStatus = auditStatusEnum.notPublic;
            }
            if (item.created_at?.includes('审核中')) {
              result.auditStatus = auditStatusEnum.inAudit;
            }
            result.docId = item?.id?.toString() ?? item?.mid?.toString() ?? item?.idstr?.toString();
            result.create_time = new Date(item.created_at).getTime();
            result.openUrl = item?.url_struct ? item?.url_struct[0]?.long_url ?? item?.url_struct[0]?.short_url : '';
            if (!result.openUrl) {
              if (item.page_info) {
                result.openUrl = `https://video.weibo.com/show?fid=${findDocId}`;
              } else {
                result.openUrl = `https://m.weibo.cn/status/${findDocId}`;
              }
            }
            result.coverUrl = item?.page_info?.pic_info?.pic_big?.url;
            result.data = item;
            return result;
          } else if (publishId === item.idstr) {
            result.code = 0;
            result.auditStatus = auditStatusEnum.published;
            if (item.visible?.type != 0) {
              result.auditStatus = auditStatusEnum.notPublic;
            }
            if (item.created_at?.includes('审核中')) {
              result.auditStatus = auditStatusEnum.inAudit;
            }
            result.docId = item?.id?.toString() ?? item?.mid?.toString() ?? item?.idstr?.toString();
            result.create_time = new Date(item.created_at).getTime();
            result.openUrl = '';
            result.openUrl = `https://m.weibo.cn/status/${item.idstr}`;
            result.coverUrl = item?.page_info?.pic_info?.pic_big?.url;
            result.data = item;
            return result;
          }
        }
      } else {
        result.code = statusResult?.ok === 1 ? 0 : statusResult?.ok === 0 ? -1 : statusResult?.ok ?? -1;
        result.msg = '未找到作品';
        return result;
      }
    }
    if (statusResult?.ok === 1) {
      result.code = 0;
      result.msg = '未找到作品';
      return result;
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

export interface XinlangweiboContentStatusResultOutput {
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
   * 作品创建时间13位
   */
  create_time?: number;

  /**
   * 视频信息
   */
  data?: XinlangweiboMediaContent | XinlangweiboPreContent;
}

/**
 *
 * @param cookie
 * @param days 1: 7天数据，2: 30天数据,3: 90天数据
 * @param type video:视频 dynamic:图文
 * @param proxy
 */
export const getXinlangweiboOverViewDashboard = async (
  cookie: string,
  days: 1 | 2 | 3 = 2,
  type: 'video' | 'dynamic' = 'video',
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
          { name: '总粉丝', key: 'totalFansCount' },
          { name: '总转评赞', key: 'totalInterCount' },
          { name: '视频发布总数', key: 'workCount' },
          { name: '视频播放总数', key: 'playCount' },
          { name: '转评赞总数', key: 'interCount' },
          { name: '评论总数', key: 'commentCount' },
          { name: '点赞总数', key: 'greatCount' },
          { name: '转发总数', key: 'shareCount' },
          { name: '粉丝净增数', key: 'netFansCount' },
        ]
      : [
          { name: '总粉丝', key: 'totalFansCount' },
          { name: '总转评赞', key: 'totalInterCount' },
          { name: '阅读总数', key: 'readCount' },
          { name: '发博总数', key: 'workCount' },
          { name: '转评赞总数', key: 'interCount' },
          { name: '评论总数', key: 'commentCount' },
          { name: '赞总数', key: 'greatCount' },
          { name: '转发总数', key: 'shareCount' },
          { name: '粉丝净增数', key: 'netFansCount' },
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
      dynamic: {
        overview: {},
        thirtydays: {},
      },
    };
    result.dataObj = newOverView as never;
    const fansData = await getXinlangweiboUserInfo(cookie, proxy);
    if (fansData?.code === 0 && fansData?.data?.user?.screen_name) {
      result.data?.push({
        name: '总粉丝',
        key: 'totalFansCount',
        value: formatNumber(fansData.data.user.followers_count),
        list: [],
      });
      result.data?.push({
        name: '总转评赞',
        key: 'totalInterCount',
        value: formatNumber(fansData.data.user.status_total_counter.total_cnt),
        list: [],
      });
      newOverView.all.overview['totalFansCount'] = formatNumberNo(fansData.data.user.followers_count);
      newOverView.all.overview['totalInterCount'] = formatNumberNo(fansData.data.user.status_total_counter.total_cnt);
    } else {
      result.code = fansData?.code ?? -1;
      result.msg = fansData?.msg ?? '';
      return result;
    }

    const now = new Date();
    let startTs = new Date(now.setDate(now.getDate() - 30));
    if (days === 1) {
      startTs = new Date(now.setDate(now.getDate() - 7));
    } else if (days === 3) {
      startTs = new Date(now.setDate(now.getDate() - 90));
    }

    const endNow = new Date();
    const endTs = new Date(endNow.setDate(endNow.getDate() - 1));

    let playObj: object = {};
    let commObj: object = {};
    if (type === 'video') {
      playObj = await getXinlangweiboVideoPlayTrend(cookie, startTs, endTs, proxy);
      commObj = await getXinlangweiboVideoInteractTrend(cookie, startTs, endTs, proxy);
    } else {
      playObj = await getXinlangweiboWeiboReadTrend(cookie, startTs, endTs, proxy);
      commObj = await getXinlangweiboWeiboInteractTrend(cookie, startTs, endTs, proxy);
    }
    result.msg = playObj ? playObj['msg'] ?? playObj['message'] : '';
    if (type === 'video') {
      const videoPlay = playObj as XinlangweiboVideoPlayTrendOutput;
      const videoComm = commObj as XinlangweiboVideoInteractTrendOutput;

      let total = videoPlay.data?.chart.videoPlayTrend.videoCountTotal;
      const dataItem: DataColumn = {
        name: '视频发布总数',
        key: 'workCount',
        value: formatNumber(total),
        list: [],
      };
      result.data?.push(dataItem);
      newOverView.video.overview[dataItem.key] = formatNumberNo(total);
      let endTsTmp = endTs.getTime();
      for (const item of videoPlay.data?.chart.videoPlayTrend.videoCountTrend ?? []) {
        dataItem.list.push({ date: endTsTmp, value: item ?? 0 });
        endTsTmp -= 86400000;
      }
      newOverView.video.thirtydays[dataItem.key] = dataItem.list;

      total = videoPlay.data?.chart.videoPlayTrend.videoPlayTotal;
      const dataItemplay: DataColumn = {
        name: '视频播放总数',
        key: 'playCount',
        value: formatNumber(total),
        list: [],
      };
      result.data?.push(dataItemplay);
      newOverView.video.overview[dataItemplay.key] = formatNumberNo(total);
      endTsTmp = endTs.getTime();
      for (const item of videoPlay.data?.chart.videoPlayTrend.videoPlayTrend ?? []) {
        dataItemplay.list.push({ date: endTsTmp, value: item ?? 0 });
        endTsTmp -= 86400000;
      }
      newOverView.video.thirtydays[dataItemplay.key] = dataItemplay.list;

      total = videoComm.data?.chart?.videoInteract?.interTotal;
      const dataItempcom: DataColumn = {
        name: '转评赞总数',
        key: 'interCount',
        value: formatNumber(total),
        list: [],
      };
      result.data?.push(dataItempcom);
      newOverView.video.overview[dataItempcom.key] = formatNumberNo(total);
      endTsTmp = endTs.getTime();
      for (const item of videoComm.data?.chart?.videoInteract?.interTrend ?? []) {
        dataItempcom.list.push({ date: endTsTmp, value: item ?? 0 });
        endTsTmp -= 86400000;
      }
      newOverView.video.thirtydays[dataItempcom.key] = dataItempcom.list;

      total = videoComm.data?.chart?.videoInteract?.commentTotal;
      const dataItempcoms: DataColumn = {
        name: '评论总数',
        key: 'commentCount',
        value: formatNumber(total),
        list: [],
      };
      result.data?.push(dataItempcoms);
      newOverView.video.overview[dataItempcoms.key] = formatNumberNo(total);
      endTsTmp = endTs.getTime();
      for (const item of videoComm.data?.chart?.videoInteract?.commentTrend ?? []) {
        dataItempcoms.list.push({ date: endTsTmp, value: item ?? 0 });
        endTsTmp -= 86400000;
      }
      newOverView.video.thirtydays[dataItempcoms.key] = dataItempcoms.list;

      total = videoComm.data?.chart?.videoInteract?.likeTotal;
      const dataItemplike: DataColumn = {
        name: '点赞总数',
        key: 'greatCount',
        value: formatNumber(total),
        list: [],
      };
      result.data?.push(dataItemplike);
      newOverView.video.overview[dataItemplike.key] = formatNumberNo(total);
      endTsTmp = endTs.getTime();
      for (const item of videoComm.data?.chart?.videoInteract?.likeTrend ?? []) {
        dataItemplike.list.push({ date: endTsTmp, value: item ?? 0 });
        endTsTmp -= 86400000;
      }
      newOverView.video.thirtydays[dataItemplike.key] = dataItemplike.list;

      total = videoComm.data?.chart?.videoInteract?.repostTotal;
      const dataItemprep: DataColumn = {
        name: '转发总数',
        key: 'shareCount',
        value: formatNumber(total),
        list: [],
      };
      result.data?.push(dataItemprep);
      newOverView.video.overview[dataItemprep.key] = formatNumberNo(total);
      endTsTmp = endTs.getTime();
      for (const item of videoComm.data?.chart?.videoInteract?.repostTrend ?? []) {
        dataItemprep.list.push({ date: endTsTmp, value: item ?? 0 });
        endTsTmp -= 86400000;
      }
      newOverView.video.thirtydays[dataItemprep.key] = dataItemprep.list;
    } else {
      const weiboPlay = playObj as XinlangweiboWeiboReadTrendOutput;
      const weiboComm = commObj as XinlangweiboWeiboInteractTrendOutput;

      let total = weiboPlay.data?.chart.weiboReadTrend.readTotal;
      const dataItem: DataColumn = {
        name: '阅读总数',
        key: 'readCount',
        value: formatNumber(total),
        list: [],
      };
      result.data?.push(dataItem);
      newOverView.dynamic.overview[dataItem.key] = formatNumberNo(total);
      let endTsTmp = endTs.getTime();
      for (const item of weiboPlay.data?.chart.weiboReadTrend.reads ?? []) {
        dataItem.list.push({ date: endTsTmp, value: item ?? 0 });
        endTsTmp -= 86400000;
      }
      newOverView.dynamic.thirtydays[dataItem.key] = dataItem.list;

      total = weiboPlay.data?.chart.weiboReadTrend.weiboTotal;
      const dataItemplay: DataColumn = {
        name: '发博总数',
        key: 'workCount',
        value: formatNumber(total),
        list: [],
      };
      result.data?.push(dataItemplay);
      newOverView.dynamic.overview[dataItemplay.key] = formatNumberNo(total);
      endTsTmp = endTs.getTime();
      for (const item of weiboPlay.data?.chart.weiboReadTrend.weibos ?? []) {
        dataItemplay.list.push({ date: endTsTmp, value: item ?? 0 });
        endTsTmp -= 86400000;
      }
      newOverView.dynamic.thirtydays[dataItemplay.key] = dataItemplay.list;

      total = weiboComm.data?.chart.weiboInteract.interTotal;
      const dataItempcom: DataColumn = {
        name: '转评赞总数',
        key: 'interCount',
        value: formatNumber(total),
        list: [],
      };
      result.data?.push(dataItempcom);
      newOverView.dynamic.overview[dataItempcom.key] = formatNumberNo(total);
      endTsTmp = endTs.getTime();
      for (const item of weiboComm.data?.chart.weiboInteract.weiboInteractTrend ?? []) {
        dataItempcom.list.push({ date: endTsTmp, value: item ?? 0 });
        endTsTmp -= 86400000;
      }
      newOverView.dynamic.thirtydays[dataItempcom.key] = dataItempcom.list;

      total = weiboComm.data?.chart.weiboInteract.commentTotal;
      const dataItempcoms: DataColumn = {
        name: '评论总数',
        key: 'commentCount',
        value: formatNumber(total),
        list: [],
      };
      result.data?.push(dataItempcoms);
      newOverView.dynamic.overview[dataItempcoms.key] = formatNumberNo(total);
      endTsTmp = endTs.getTime();
      for (const item of weiboComm.data?.chart.weiboInteract.commentTrend ?? []) {
        dataItempcoms.list.push({ date: endTsTmp, value: item ?? 0 });
        endTsTmp -= 86400000;
      }
      newOverView.dynamic.thirtydays[dataItempcoms.key] = dataItempcoms.list;

      total = weiboComm.data?.chart.weiboInteract.likeTotal;
      const dataItemplike: DataColumn = {
        name: '赞总数',
        key: 'greatCount',
        value: formatNumber(total),
        list: [],
      };
      result.data?.push(dataItemplike);
      newOverView.dynamic.overview[dataItemplike.key] = formatNumberNo(total);
      endTsTmp = endTs.getTime();
      for (const item of weiboComm.data?.chart.weiboInteract.likeTrend ?? []) {
        dataItemplike.list.push({ date: endTsTmp, value: item ?? 0 });
        endTsTmp -= 86400000;
      }
      newOverView.dynamic.thirtydays[dataItemplike.key] = dataItemplike.list;

      total = weiboComm.data?.chart.weiboInteract.repostTotal;
      const dataItemprep: DataColumn = {
        name: '转发总数',
        key: 'shareCount',
        value: formatNumber(total),
        list: [],
      };
      result.data?.push(dataItemprep);
      newOverView.dynamic.overview[dataItemprep.key] = formatNumberNo(total);
      endTsTmp = endTs.getTime();
      for (const item of weiboComm.data?.chart.weiboInteract.repostTrend ?? []) {
        dataItemprep.list.push({ date: endTsTmp, value: item ?? 0 });
        endTsTmp -= 86400000;
      }
      newOverView.dynamic.thirtydays[dataItemprep.key] = dataItemprep.list;
    }

    //粉丝趋势
    const fansResult = await getWeiboFansTrendAsync(
      cookie,
      dayjs(startTs).format('YYYY-MM-DD'),
      dayjs(endTs).format('YYYY-MM-DD'),
    );
    if (fansResult?.data?.chart?.fansTrend?.tIncrTrend?.length) {
      //粉丝变化数
      let total = 0;
      fansResult?.data?.chart?.fansTrend?.tIncrTrend.forEach((x) => (total += x));
      const dataItemFansChange: DataColumn = {
        name: '粉丝净增数',
        key: 'netFansCount',
        value: formatNumber(total),
        list: [],
      };
      result.data?.push(dataItemFansChange);
      newOverView.all.overview[dataItemFansChange.key] = formatNumberNo(total);

      let endTsTmp = endTs.getTime();
      for (const item of fansResult?.data?.chart?.fansTrend?.tIncrTrend ?? []) {
        dataItemFansChange.list.push({ date: endTsTmp, value: item ?? 0 });
        endTsTmp -= 86400000;
      }
      newOverView.all.thirtydays[dataItemFansChange.key] = dataItemFansChange.list;
    } else {
      result.code = fansResult?.code ?? -1;
      result.msg = fansResult?.msg;
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
 * 获取新浪微博指定天数内，最多20条公开作品数据
 * @param cookie
 * @param type
 * @param eventCallBack
 * @param days
 * @param maxCount
 * @param isHeader
 * @param proxy
 */
export const gettXinlangweiboContentListView = async (
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
    cookie = convertCookieStr(cookie, 'weibo.com');
    const lastDate = dayjs().add(-days, 'days').toDate();
    result.headers = [
      { name: '封面', key: 'cover' },
      { name: '标题', key: 'title' },
      { name: '发布时间', key: 'date' },
    ];

    if (type === 'video') {
      result.headers.push({ name: '播放量', key: 'play' });
    }

    result.headers.push(
      ...[
        { name: '分享量', key: 'share' },
        { name: '评论量', key: 'comment' },
        { name: '点赞量', key: 'great' },
      ],
    );
    if (isHeader) {
      return result;
    }
    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    let videoCursor = '0';
    let contentTmpId: string = '';
    for (let i = 1; i < syncContentMaxPage; i++) {
      if (type === 'video') {
        const contentList = await getXinlangweiboVideoListResponse(cookie, videoCursor, webProxy);
        if (contentList?.data?.videos?.length) {
          const fId = contentList.data.videos[0]?.mid?.toString() ?? contentList.data.videos[0].oid;
          if (fId === contentTmpId) {
            break;
          } else {
            contentTmpId = fId;
          }
          videoCursor = contentList.data.next_cursor ?? 0;
          let j = 0;
          for (const item of contentList?.data?.videos) {
            j++;
            // if (item.Archive.state === -50) {
            //   continue;
            // }
            const date = dayjs(item.create_time).toDate();
            if (lastDate > date || result.data.length >= maxCount) {
              //前面可能会有三个置顶的
              if (j <= 3) {
                continue;
              }
              eventCallBack?.emit(syncContentEventName, { ...result });
              return result;
            }
            const dateStr = dayjs(date).format('YYYY-MM-DD HH:mm:ss');
            const coverJo = item.covers?.length ? item.covers[0] : null;
            const newItem: PlatformContentItem = {
              id: item?.mid?.toString() ?? item.oid,
              cover: coverJo?.url ?? '',
              title: item?.titles[0]?.title ?? '',
              date: dateStr,
              play: formatNumber(item?.statistics?.play_count),
              share: formatNumber(item?.statistics?.reposts_count),
              comment: formatNumber(item?.statistics?.comment_count),
              great: formatNumber(item?.statistics?.attitude_count),
              type: type,
            };
            const newItemNum: PlatformContentItemNum = {
              id: item?.mid?.toString() ?? item.oid,
              cover: coverJo?.url ?? '',
              title: item?.titles[0]?.title ?? '',
              date: dateStr,
              play: formatNumberNo(item?.statistics?.play_count),
              share: formatNumberNo(item?.statistics?.reposts_count),
              comment: formatNumberNo(item?.statistics?.comment_count),
              great: formatNumberNo(item?.statistics?.attitude_count),
              type: type,
            };
            newItem.pageUrl = `https://weibo.com/tv/show/${item.oid}?mid=${item.mid}`;
            newItemNum.pageUrl = newItem.pageUrl;
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
            result.code = contentList?.ok === 1 ? 0 : contentList?.ok === 0 ? -1 : contentList?.ok ?? -1;
            result.msg = contentList ? contentList['message'] : '';
          }
          break;
        }
      } else {
        const contentList = await getXinlangweiboArticleListResponse(cookie, i, webProxy);
        if (contentList?.data?.list?.length) {
          const fId = contentList.data.list[0]?.oid;
          if (fId === contentTmpId) {
            break;
          } else {
            contentTmpId = fId;
          }
          let j = 0;
          for (const item of contentList?.data?.list) {
            j++;
            if (!item.countList) {
              continue;
            }
            const date = dayjs(item.created).toDate();
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
              id: item.oid,
              cover: item.image ?? '',
              title: item.title ?? '',
              date: dateStr,
              share: formatNumber(item.countList.reposts_count),
              comment: formatNumber(item.countList.comments_count),
              great: formatNumber(item.countList.attitudes_count),
              type: type,
            };
            const newItemNum: PlatformContentItemNum = {
              id: item.oid,
              cover: item.image ?? '',
              title: item.title ?? '',
              date: dateStr,
              share: formatNumberNo(item.countList.reposts_count),
              comment: formatNumberNo(item.countList.comments_count),
              great: formatNumberNo(item.countList.attitudes_count),
              type: type,
            };

            newItem.pageUrl = item?.pclink ?? `https://weibo.com/ttarticle/p/show?id=${item.oid.split(':')[1]}`;
            newItemNum.pageUrl = newItem.pageUrl;
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
            result.code = contentList?.ok === 1 ? 0 : contentList?.ok === 0 ? -1 : contentList?.ok ?? -1;
            result.msg = contentList ? contentList['message'] : '';
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

export const checkLogin = async (cookie: string, proxy?: IWebProxy): Promise<{ code: number; msg: string }> => {
  const result = {
    code: 0,
    msg: '',
  };
  try {
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    cookie = convertCookieStr(cookie, 'weibo.com');
    const collectionResponse = await getXinlangweiboIndex(cookie, webProxy);

    result.code = collectionResponse.code;
    result.msg = collectionResponse?.result ?? '';
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
 * @param uid
 */
export const deleteXinlangweiboContent = async (
  cookie: string,
  docId: string,
  contentType: PubContentEnum,
  isDraft: boolean,
  uid?: string,
): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    if (contentType === PubContentEnum.article && isDraft) {
      if (!uid) {
        const userInfo = await getXinlangweiboUserInfo(cookie);
        uid = userInfo?.data?.user?.id?.toString();
      }
      const deRe = await deleteArticleDraftContent(cookie, docId, uid ?? '');
      result.code = deRe?.code === 100000 ? 0 : -1;
      result.msg = deRe?.msg;
    } else {
      const deleteResult = await deleteContent(cookie, docId);
      result.code = deleteResult?.ok === 1 ? 0 : -1;
      result.msg = deleteResult?.message;
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

export const getXinLangWeiBoArticleDraftNum = async (cookie: string, proxy?: IWebProxy): Promise<UserCanPublishNum> => {
  const result: UserCanPublishNum = {
    code: 0,
    msg: '',
  };
  result.data = { remain_total_num: 1, remain_article_num: 1, remain_video_num: 1, remain_dynamic_num: 1 };
  try {
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const draftList = await getXinlangweiboArticleDraftListResponse(cookie, webProxy);
    result.code = draftList?.code === 100000 ? 0 : -1;
    result.msg = draftList?.msg ?? '';
    if (draftList?.data?.max_count >= 0 && draftList?.data?.count >= 0) {
      result.data.remain_article_num = draftList?.data?.max_count - draftList.data.count;
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

const formatXinlangweiboPublicAuthorUrl = (url: string | undefined): string => {
  if (!url) {
    return '';
  }
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  return url;
};

const decodeXinlangweiboPublicHtmlText = (value: string): string => {
  return value
    .replace(/&#x([0-9a-fA-F]+);/g, (_match, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
};

const stripXinlangweiboPublicHtmlTag = (value: string): string => {
  return decodeXinlangweiboPublicHtmlText(value.replace(/<[^>]+>/g, '')).trim();
};

const parseXinlangweiboPublicCountText = (value: string | undefined): number => {
  if (!value) {
    return 0;
  }
  const text = value.replace(/,/g, '').trim();
  const numberValue = Number(text.replace(/[万亿]/g, ''));
  if (Number.isNaN(numberValue)) {
    return 0;
  }
  if (text.includes('亿')) {
    return Math.round(numberValue * 100000000);
  }
  if (text.includes('万')) {
    return Math.round(numberValue * 10000);
  }
  return numberValue;
};

const extractXinlangweiboPublicAuthorId = (value: string): string => {
  return (
    value.match(/uid=["']?(\d+)/)?.[1] ?? value.match(/\/u\/(\d+)/)?.[1] ?? value.match(/weibo\.com\/(\d+)/)?.[1] ?? ''
  );
};

/**
 * 解析微博公开作者搜索 HTML
 * @param html 微博公开搜索页 HTML
 */
export const parseXinlangweiboPublicAuthorSearchHtml = (html: string): Array<PlatformPublicAuthorInfo> => {
  const result: Array<PlatformPublicAuthorInfo> = [];
  const exists = new Set<string>();
  const cardReg =
    /<div\b(?=[^>]*class="[^"]*\bcard\b[^"]*")[^>]*>[\s\S]*?(?=<div\b[^>]*class="[^"]*\bcard\b[^"]*"|<div\b[^>]*class="[^"]*\bcard-no-result\b|<\/body>)/g;
  let match: RegExpExecArray | null;
  while ((match = cardReg.exec(html))) {
    const cardHtml = match[0];
    if (!cardHtml.includes('/u/') || !cardHtml.includes('class="name"')) {
      continue;
    }
    const extAuthorId = extractXinlangweiboPublicAuthorId(cardHtml);
    if (!extAuthorId || exists.has(extAuthorId)) {
      continue;
    }
    exists.add(extAuthorId);

    const nameMatch = cardHtml.match(/<a\b(?=[^>]*class="[^"]*\bname\b[^"]*")[^>]*>([\s\S]*?)<\/a>/);
    const avatarUrl = formatXinlangweiboPublicAuthorUrl(cardHtml.match(/<img\b[^>]*\bsrc="([^"]+)"/)?.[1] ?? '');
    const description =
      stripXinlangweiboPublicHtmlTag(
        cardHtml.match(/<p\b(?=[^>]*class="[^"]*\btxt\b[^"]*")[^>]*>([\s\S]*?)<\/p>/)?.[1] ?? '',
      ) ||
      stripXinlangweiboPublicHtmlTag(
        cardHtml.match(/<div\b(?=[^>]*class="[^"]*\binfo\b[^"]*")[^>]*>([\s\S]*?)<\/div>/)?.[1] ?? '',
      );
    const text = stripXinlangweiboPublicHtmlTag(cardHtml.replace(/<br\s*\/?>/g, ' '));
    const followerText = text.match(/粉丝[:：]?\s*([\d,.]+[万亿]?)/)?.[1];
    const workText = text.match(/微博[:：]?\s*([\d,.]+[万亿]?)/)?.[1];

    result.push({
      platform_code: PublicAuthorPlatformCode.XinLangWeiBo,
      ext_author_id: extAuthorId,
      nickname: stripXinlangweiboPublicHtmlTag(nameMatch?.[1] ?? ''),
      avatar_url: avatarUrl,
      description: description,
      aut_index: `https://weibo.com/u/${extAuthorId}`,
      aut_spi_url: `uid=${extAuthorId}`,
      follower_count: parseXinlangweiboPublicCountText(followerText),
      total_views: 0,
      total_comments: 0,
      total_likes: 0,
      work_count: parseXinlangweiboPublicCountText(workText),
    });
  }
  return result;
};

/**
 * 搜索微博公开作者列表
 * @param keyWord 搜索关键词
 * @param cookie 为空时使用抓包中的公开搜索默认 cookie
 * @param nextPage 下一页参数，当前仅支持第一页
 * @param proxy 代理
 */
export const searchXinlangweiboPublicAuthorList = async (
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
    const html = await getXinlangweiboPublicAuthorSearchHtml(cookie, keyWord, webProxy);
    result.dataList = parseXinlangweiboPublicAuthorSearchHtml(html);
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = '请求微博作者搜索失败';
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = '解析微博作者搜索结果失败';
    } else {
      result.msg = '微博作者搜索失败';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};
