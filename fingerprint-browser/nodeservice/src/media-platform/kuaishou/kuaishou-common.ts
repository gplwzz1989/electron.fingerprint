import { BaseResult } from '../baseResult';
import {
  getUploadArgsResponse,
  getUserFansNumResponse,
  getUserHomeDataAsync,
  getUserInfoResponse,
  getUserPrivilegeResponse,
  refreshUserTokenResponse,
  regex,
} from './kuaishou-base.service';
import { AxiosError } from 'axios';
import { getCategoryResponse } from './kuaishou-category.service';
import { deleteContentResponse } from './kuaishou-deletecontent.service';
import { getFriendResponse, KuaishouFriendInfo, searchFriendResponse } from './kuaishou-friend.service';
import { getLocationResponse, KuaishouLocationInfo } from './kuaishou-location.service';
import { auditStatusEnum, formatNumber, formatNumberNo, Guid, Task } from '../../utils';
import {
  getContentListAsync,
  getKuaishouContentDetailList,
  KuaishouContentData,
  KuaishouContentListResponse,
  KuaishouMediaContent,
} from './kuaishou-content-list.service';
import { getGoodsResponse, KuaishouGoodsInfo, KuaishouGoodsResponse } from './kuaishou-shop.service';
import { getTopicResponse, KuaishouTopicInfo } from './kuaishou-topic.service';
import {
  getDataOverviewAsync,
  getSingleDataOverviewAsync,
  KuaishouBasicData,
  KuaishouSingleDataOverviewTabDataResponse,
} from './kuaishou-data-overview.service';
import { errorCode } from '../errorCode';
import { KuaishouMusicInfo } from './kuaishou-music.service';
import { getKuaishouMusicResponse } from './kuaishou-music.service';
import {
  AccountContentListViewOutPut,
  AccountReportDataOutPut,
  syncContentEventName,
  syncContentMaxPage,
} from '../data-service';
import {
  DataColumn,
  GeoLocation,
  ListGoodsInfoResponse,
  ListInfoResponse,
  ListMusicInfoResponse,
  PlatformAuthorInfo,
} from '../baseModel';
import dayjs from 'dayjs';
import { createKuaiProxyAgent, IWebProxy, KuaiDaiLiProxy } from '../webproxy';
import { EventEmitter } from 'events';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { getCollectionResponse } from '@/media-platform/kuaishou/kuaishou-collection.service';
import { MiniAppPrivilege } from '@/cloud/model/SearchDataModel';

import { getMiniAppResponse } from '@/media-platform/kuaishou/kuaishou-miniapp.service';
/**
 * 获取快手创作者信息
 * @param cookie
 * @param proxy
 */
export const getKuaishouUserInfo = async (cookie: string, proxy?: IWebProxy): Promise<KuaishouUserInfoOutput> => {
  const result: KuaishouUserInfoOutput = {
    code: 0,
    msg: '',
  };

  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfoResult = await getUserInfoResponse(cookie, webProxy);

    result.yixiaoerId = userInfoResult?.data?.userId?.toString();
    result.yixiaoerName = userInfoResult?.data?.userName?.toString();
    result.yixiaoerImageUrl = userInfoResult?.data?.userAvatar?.toString();
    result.raw = userInfoResult?.data;
    result.code = userInfoResult?.result == 1 ? 0 : userInfoResult.result;
    result.msg = userInfoResult.message;
    result.data = userInfoResult.data;
    if (result.code == 109) {
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

// noinspection SpellCheckingInspection
export interface KuaishouUserInfoOutput extends PlatformAuthorInfo {
  /**
   * 状态码 0正常 非0异常 109登录失效或未登录
   *
   */
  code: number;
  data?: {
    /**
     * 用户头像
     */
    userAvatar: string;
    /**
     * 快手号，暂时无用
     */
    userKwaiId: string | null;
    /**
     * 用户昵称
     */
    userName: string;
    /**
     * 用户id
     */
    userId: number;
  };
}

/**
 * 获取账号状态
 * @param cookie
 */
export const getKuaishouUserStatus = async (cookie: string): Promise<KuaishouAccountStatusOutput> => {
  const result: KuaishouAccountStatusOutput = {
    code: 0,
    msg: '',
  };

  try {
    const userStatusResult = await getUploadArgsResponse(cookie);

    result.code = userStatusResult?.result == 1 ? 0 : userStatusResult.result;
    result.msg = userStatusResult.message ?? '';
    if (userStatusResult?.message?.includes('账号异常')) {
      result.status = 5;
    } else if (result.code == 0) {
      result.status = 0;
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

export interface KuaishouAccountStatusOutput extends BaseResult {
  /**
   * 账号状态 0正常，非0异常，异常可能有多种情况，暂时不区分
   */
  status?: number;
}

/**
 * 获取快手账号是否有购物车/商品权限
 * @param cookie
 */
export const getKuaishouShopPrivilege = async (cookie: string): Promise<KuaishouShopPrivilegeOutput> => {
  const result: KuaishouShopPrivilegeOutput = {
    code: 0,
    msg: '',
  };

  try {
    const shopResult = await getUserPrivilegeResponse(cookie);

    result.code = shopResult?.result == 1 ? 0 : shopResult.result;
    result.msg = shopResult?.message ?? '';
    result.data=shopResult.data;
    if (result.code == 0 && shopResult.data?.items?.length) {
      for (const item of shopResult.data.items) {
        if (item.type == 1) {
          result.hasShopCart = true;

          return result;
        }
      }
      result.hasShopCart = false;
    } else if (result.code == 0) {
      result.hasShopCart = false;
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

export interface KuaishouShopPrivilegeOutput extends BaseResult {
  /**
   * 是否有购物车权限
   */
  hasShopCart?: boolean;
}

export const getKuaishouMiniAppPrivilege = async (cookie: string): Promise<MiniAppPrivilege> => {
  const result: MiniAppPrivilege = {
    code: 0,
    msg: '',
    has_app_permission: false,
  };

  try {
    const shopResult = await getUserPrivilegeResponse(cookie);

    result.code = shopResult?.result == 1 ? 0 : shopResult.result;
    result.msg = shopResult?.message ?? '';
    result.data=shopResult.data;
    if (result.code == 0 && shopResult.data?.items?.length) {
      for (const item of shopResult.data.items) {
        if (item.type == 9) {
          result.has_app_permission = true;
          return result;
        }
      }
      result.has_app_permission = false;
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

export const getKuaiShouMiniApp = async (cookie: string, appUrl: string): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
  };
  result.dataList = [];

  try {
    const appResult = await getMiniAppResponse(cookie, appUrl);
    result.code = appResult?.result === 1 ? 0 : appResult?.result === 0 ? -1 : appResult?.result ?? -1;
    result.msg = appResult?.message;
    if (appResult?.data?.list?.length) {
      appResult.data.list.forEach((x) => {
        result.dataList?.push({
          yixiaoerId: x.associateTaskId?.bindId,
          yixiaoerName: x.title,
          yixiaoerImageUrl: x.url,
          yixiaoerDesc: x.desc,
          enable: x?.associateTaskId?.bindId ? true : false,
          reason: x.validMessage ?? '当前小程序不支持挂载',
          raw: x,
        } as never);
      });
      // if (!appResult?.data?.list[0]?.associateTaskId?.bindId) {
      //   result.code = errorCode.privilege_error;
      //   result.msg = appResult?.data?.list[0]?.validMessage ?? '当前小程序不支持挂载';
      // }
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
 * 获取快手分类列表
 * @param cookie
 */
export const getKuaishouCategory = async (cookie: string): Promise<KuaishouCategoryOutput> => {
  const result: KuaishouCategoryOutput = {
    code: 0,
    msg: '',
  };

  try {
    const categoryResult = await getCategoryResponse(cookie);

    result.code = categoryResult?.result == 1 ? 0 : categoryResult.result;
    result.msg = categoryResult?.message ?? '';
    result.data = categoryResult.data;
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

export interface KuaishouCategoryOutput extends BaseResult {
  /**
   * 分类列表
   */
  data?: Array<{
    /**
     * 一级分类名称
     */
    firstDomain: string;
    /**
     * 二级分类名称列表
     */
    secondDomain: Array<string>;
  }>;
}

/**
 * 删除快手作品
 * @param cookie
 * @param docId 快手作品id，查询状态返回的docId或者数据同步中的docId
 */
export const deleteKuaishouContent = async (cookie: string, docId: string): Promise<KuaishouDeleteContentOutput> => {
  const result: KuaishouDeleteContentOutput = {
    code: 0,
    msg: '',
  };

  try {
    const deleteResult = await deleteContentResponse(cookie, docId);

    result.code = deleteResult?.result == 1 ? 0 : deleteResult.result;
    result.msg = deleteResult?.message ?? '';
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

export interface KuaishouDeleteContentOutput extends BaseResult {}

/**
 * 获取快手好友信息列表，此接口只返回当前账号关注的用户和相互关注的（好友）
 * @param cookie
 * @param keyWord
 */
export const getKuaishouFriend = async (cookie: string, keyWord?: string): Promise<KuaishouFriendOutput> => {
  const result: KuaishouFriendOutput = {
    code: 0,
    msg: '',
  };

  try {
    const friendResult = keyWord ? await searchFriendResponse(cookie, keyWord) : await getFriendResponse(cookie);

    result.code = friendResult?.result == 1 ? 0 : friendResult.result;
    result.msg = friendResult.message ?? '';
    if (friendResult.data?.list?.length) {
      result.dataList = friendResult.data.list.map((obj) => ({
        yixiaoerId: obj.userId.toString(),
        yixiaoerName: obj.userName,
        yixiaoerImageUrl: obj.headUrl,
        fansNum: Number(obj.fansCount),
        raw: obj,
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

export interface KuaishouFriendOutput extends ListInfoResponse {
  /**
   * 数据体
   */
  data?: {
    /**
     * 关注/好友列表
     */
    list: Array<KuaishouFriendInfo>;
  };
}

/**
 * 获取快手地理位置信息列表
 * @param cookie
 * @param keyWord 搜索关键词，默认为空，为空时返回附近推荐地点
 * @param proxy
 * @param coords  浏览器navigator.geolocation.getCurrentPosition获取的coords
 */
export const getKuaishouLocation = async (
  cookie: string,
  keyWord: string,
  proxy?: KuaiDaiLiProxy,
  coords?: GeoLocation,
): Promise<KuaishouLocationOutput> => {
  const result: KuaishouLocationOutput = {
    code: 0,
    msg: '',
  };

  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }

    const locationResult = await getLocationResponse(cookie, keyWord, webProxy, coords);

    result.code = locationResult?.result == 1 ? 0 : locationResult.result;
    result.msg = locationResult.message ?? '';
    result.locations = locationResult.locations;
    if (result.locations?.length) {
      result.dataList = result.locations?.map((obj) => ({
        yixiaoerId: obj.id?.toString() ?? '',
        yixiaoerName: obj.title ?? '',
        yixiaoerDesc: obj.address,
        raw: obj,
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

export interface KuaishouLocationOutput extends ListInfoResponse {
  /**
   * 地址列表
   */
  locations?: Array<KuaishouLocationInfo>;
}

/**
 * 获取快手作品审核状态
 * @param cookie
 * @param publishId  发布产生的publishId
 * @param maxPage 最大翻页数，默认最大30
 */
export const getKuaishouMediaStatus = async (
  cookie: string,
  publishId: string,
  maxPage: number = 10,
  desc?: string,
): Promise<KuaishouMediaStatusResultOutput> => {
  const result: KuaishouMediaStatusResultOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };
  try {
    const compareId = parseInt(publishId);
    if (!maxPage || maxPage < 1) {
      maxPage = 1;
    }

    const startTime = new Date().setDate(new Date().getDate() - 7);
    let cursor = '9007199254740991';
    const endTime = 9007199254740991;

    // 待发布/审核中
    let videoList = await getContentListAsync(cookie, cursor, startTime, endTime, 30, '2');
    if (videoList?.data?.list?.length) {
      for (const content of videoList.data.list) {
        const findDocId = parseInt(content.uploadTime?.toString().substring(0, 10));
        const timeOk = findDocId >= compareId && findDocId - compareId < 60;
        const title = content.title?.toString()?.replace('#g', '')?.replace(' g', '')?.trim();
        desc = desc?.toString()?.replace('#g', '')?.replace(' g', '')?.trim();
        const descOk = desc ? title === desc : true;
        if (timeOk && descOk) {
          result.docId = content.workId;
          result.create_time = content.publishTime ? content.publishTime : content.uploadTime;
          result.data = content;
          result.auditStatus = auditStatusEnum.inAudit;
          if (content.publishStatus == 1) {
            result.auditStatus = auditStatusEnum.prePublish;
          }
          result.coverUrl = content.publishCoverUrl;
          return result;
        }
      }
    }

    // 已发布
    for (let i = 0; i < maxPage; i++) {
      videoList = await getContentListAsync(cookie, cursor, startTime, endTime, 30, '1');
      if (videoList?.data?.list?.length) {
        cursor = videoList.data.nextCursor;
        for (const content of videoList.data.list) {
          const findDocId = parseInt(content.uploadTime?.toString().substring(0, 10));
          const timeOk = findDocId >= compareId && findDocId - compareId < 60;
          const title = content.title?.toString()?.replace('#g', '')?.replace(' g', '')?.trim();
          desc = desc?.toString()?.replace('#g', '')?.replace(' g', '')?.trim();
          const descOk = desc ? title === desc : true;
          if (timeOk && descOk) {
            result.docId = content.workId;
            result.create_time = content.publishTime ? content.publishTime : content.uploadTime;
            result.data = content;
            result.auditStatus = auditStatusEnum.published;
            if (content.photoStatus == 1) {
              result.auditStatus = auditStatusEnum.notPublic;
            }
            result.openUrl = `https://m.gifshow.com/fw/photo/${content.workId}`;
            result.coverUrl = content.publishCoverUrl;
            return result;
          }
        }
      } else {
        break;
      }
    }

    cursor = '9007199254740991';
    // 未通过
    for (let i = 0; i < maxPage; i++) {
      videoList = await getContentListAsync(cookie, cursor, startTime, endTime, 30, '3');
      if (videoList?.data?.list?.length) {
        cursor = videoList.data.nextCursor;
        for (const content of videoList.data.list) {
          const findDocId = parseInt(content.uploadTime?.toString().substring(0, 10));
          const timeOk = findDocId >= compareId && findDocId - compareId < 60;
          const title = content.title?.toString()?.replace('#g', '')?.replace(' g', '')?.trim();
          desc = desc?.toString()?.replace('#g', '')?.replace(' g', '')?.trim();
          const descOk = desc ? title === desc : true;
          if (timeOk && descOk) {
            result.docId = content.workId;
            result.create_time = content.publishTime ? content.publishTime : content.uploadTime;
            result.data = content;
            result.auditStatus = auditStatusEnum.deny;
            result.coverUrl = content.publishCoverUrl;
            return result;
          }
        }
      } else {
        break;
      }
    }
    result.code = videoList?.result === 1 ? 0 : videoList?.result == 0 ? -1 : videoList?.result ?? errorCode.data_error;
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
 * 获取快手作品审核状态
 * @param cookie
 * @param publishId  发布产生的publishId
 * @param pubDesc 发布时正文文字
 * @param maxPage 最大翻页数，默认最大30
 */
export const getKuaishouArticleStatus = async (
  cookie: string,
  publishId: string,
  pubDesc: string,
  maxPage: number = 10,
): Promise<KuaishouMediaStatusResultOutput> => {
  const result: KuaishouMediaStatusResultOutput = {
    code: 0,
    msg: '',
    publishId: publishId,
  };

  try {
    if (!maxPage || maxPage < 1) {
      maxPage = 1;
    }

    const startTime = new Date().setDate(new Date().getDate() - 7);
    let cursor = '9007199254740991';
    const endTime = 9007199254740991;

    // 已发布
    let videoList: KuaishouContentListResponse | null = null;
    for (let i = 0; i < maxPage; i++) {
      videoList = await getContentListAsync(cookie, cursor, startTime, endTime, 30, '1');
      if (videoList?.data?.list?.length) {
        cursor = videoList.data.nextCursor;
        for (const content of videoList.data.list) {
          const findDocId = content.uploadTime?.toString().substring(0, 10);
          const updateTime = parseInt(findDocId);
          const publishTime = parseInt(publishId);
          const desc = content.title?.substring(0, 20)?.trim() ?? '';
          const compareDesc = pubDesc?.substring(0, 20)?.trim() ?? '';
          if (updateTime - publishTime < 8 && desc == compareDesc) {
            result.docId = content.workId;
            result.create_time = content.publishTime ? content.publishTime : content.uploadTime;
            result.data = content;
            result.auditStatus = auditStatusEnum.published;
            return result;
          }
        }
      } else {
        break;
      }
    }

    cursor = '9007199254740991';
    // 待发布/审核中
    videoList = await getContentListAsync(cookie, cursor, startTime, endTime, 30, '2');
    if (videoList?.data?.list?.length) {
      for (const content of videoList.data.list) {
        const findDocId = content.uploadTime?.toString().substring(0, 10);
        const updateTime = parseInt(findDocId);
        const publishTime = parseInt(publishId);
        const desc = content.title?.substring(0, 20)?.trim() ?? '';
        const compareDesc = pubDesc?.substring(0, 20)?.trim() ?? '';
        if (updateTime - publishTime < 8 && desc == compareDesc) {
          result.docId = content.workId;
          result.create_time = content.publishTime ? content.publishTime : content.uploadTime;
          result.data = content;
          result.auditStatus = auditStatusEnum.inAudit;
          return result;
        }
      }
    }

    // 未通过
    for (let i = 0; i < maxPage; i++) {
      videoList = await getContentListAsync(cookie, cursor, startTime, endTime, 30, '3');
      if (videoList?.data?.list?.length) {
        cursor = videoList.data.nextCursor;
        for (const content of videoList.data.list) {
          const findDocId = content.uploadTime?.toString().substring(0, 10);
          const updateTime = parseInt(findDocId);
          const publishTime = parseInt(publishId);
          const desc = content.title?.substring(0, 20)?.trim() ?? '';
          const compareDesc = pubDesc?.substring(0, 20)?.trim() ?? '';
          if (updateTime - publishTime < 8 && desc == compareDesc) {
            result.docId = content.workId;
            result.create_time = content.publishTime ? content.publishTime : content.uploadTime;
            result.data = content;
            result.auditStatus = auditStatusEnum.deny;
            return result;
          }
        }
      } else {
        break;
      }
    }
    result.code = videoList?.result ?? errorCode.data_error;
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

export interface KuaishouMediaStatusResultOutput extends BaseResult {
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
   * 作品创建时间,13位时间戳
   */
  create_time?: number;
  /**
   * 作品url
   */
  openUrl?: string;

  /**
   * 作品封面url
   */
  coverUrl?: string;
  /**
   * 视频信息
   */
  data?: KuaishouMediaContent;
}

/**
 * 获取快手商品列表
 * @param cookie
 * @param keyWord 搜索关键词，默认为空
 * @param cursor 下一页参数,首页默认为空，当为null时，获取全部商品
 */
export const getKuaishouGoods = async (
  cookie: string,
  keyWord?: string,
  cursor: string | null = '',
): Promise<ListGoodsInfoResponse> => {
  const result: ListGoodsInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };
  try {
    const goodsResult = await getGoodsResponse(cookie, keyWord ?? '', cursor ?? '');
    if (goodsResult?.data?.list?.length) {
      // 下一页参数
      cursor = goodsResult.data.cursor;
      result.nextPage =
        goodsResult.data.cursor != '-1' && goodsResult.data.cursor != '0' ? goodsResult.data.cursor : undefined;

      const now = Date.now();
      let i = 0;
      for (const content of goodsResult.data.list) {
        i++;
        result.dataList?.push({
          yixiaoerId: `${now}_${i}`,
          yixiaoerName: content.title,
          yixiaoerImageUrl: content.url,
          price: content.price * 100,
          raw: content,
        });
      }
    }

    result.code = goodsResult?.result === 1 ? 0 : goodsResult?.result === 0 ? -1 : goodsResult?.result ?? -1;
    result.msg = goodsResult?.message;
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

export interface KuaishouGoodsOutput extends BaseResult {
  data?: {
    /**
     * 商品列表
     */
    list: Array<KuaishouGoodsInfo>;
    /**
     * 下一页参数
     */
    cursor: string;
  };
}

/**
 * 获取快手话题
 * @param cookie
 * @param keyWord 搜索关键词
 */
export const getKuaishouTopic = async (cookie: string, keyWord: string): Promise<KuaishouTopicOutput> => {
  const result: KuaishouTopicOutput = {
    code: 0,
    msg: '',
  };

  try {
    const topicResult = await getTopicResponse(cookie, keyWord);

    result.code = topicResult.result == 1 ? 0 : topicResult.result;
    result.msg = topicResult.message;
    if (topicResult.data?.tags?.length) {
      result.dataList = topicResult.data.tags.map((obj) => ({
        yixiaoerId: obj.tag.id.toString(),
        yixiaoerName: obj.tag.name,
        viewNum: obj.viewCount,
        raw: obj.tag,
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

export interface KuaishouTopicOutput extends ListInfoResponse {
  data?: {
    /**
     * 话题列表
     */
    tags: Array<{
      /**
       * 话题详细数据
       */
      tag: KuaishouTopicInfo;
      /**
       * 阅读数.热度
       */
      viewCount: number;
    }>;
  };
}

/**
 * 获取快手视频数据
 * @param cookie
 * @param timeType 数据类型（1为近7天，2为近30天，3为近90天）
 * @param proxy
 */
export const getKuaishouDataOverview = async (
  cookie: string,
  timeType: 1 | 2 | 3 = 2,
  proxy?: KuaiDaiLiProxy,
): Promise<KuaishouDataOverviewOutput> => {
  const result: KuaishouDataOverviewOutput = {
    code: 0,
    msg: '',
  };

  try {
    let proxyAgent;
    if (proxy?.serverAdd) {
      proxyAgent = createKuaiProxyAgent(proxy);
    }
    const dataOverviewResult = await getDataOverviewAsync(cookie, timeType, proxyAgent);
    result.code = dataOverviewResult?.result == 1 ? 0 : dataOverviewResult?.result;
    result.msg = dataOverviewResult.message;
    result.data = dataOverviewResult.data;
    result.raw = dataOverviewResult;

    if (result.code == 109) {
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

export interface KuaishouDataOverviewOutput extends BaseResult {
  data?: {
    basicData: Array<KuaishouBasicData>;

    /**
     * 数据更新时间
     */
    dataUpdateTime: number;
  };

  raw?: unknown;
}

/**
 * 快手视频管理
 * @param cookie 账号cookie
 * @param startTime 开始时间 Date
 * @param cursor 默认为0，下一页为前一页返回的对应数据
 * @param queryType 数据类型（0：全部，1：已发布，2：待发布，3：未通过）
 * @param limit 每页数量（平台默认30）
 */
export const getKuaishouContentList = async (
  cookie: string,
  startTime: Date,
  cursor: string = '0',
  queryType: '0' | '1' | '2' | '3' = '0',
  limit: number = 30,
) => {
  const result: KuaishouContentListOutput = {
    code: 0,
    msg: '',
  };

  try {
    const startTimeTimes = startTime.getTime();

    const cursorstr = cursor === '0' ? '9007199254740991' : cursor;

    const contentListResult = await getContentListAsync(
      cookie,
      cursorstr,
      startTimeTimes,
      9007199254740991,
      limit,
      queryType,
    );
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

export interface KuaishouContentListOutput extends BaseResult {
  data?: KuaishouContentData;
  raw?: unknown;
}

/**
 * 快手单篇数据
 * @param cookie
 * @param workId 作品id
 * @param timeType 数据范围（1为近7天，2为近30天，3为近90天）
 */
export const getKuaishouSingleDataOverview = async (cookie: string, workId: string, timeType: 1 | 2 | 3 = 2) => {
  const result: KuaishouSingleDataOverviewOutput = {
    code: 0,
    msg: '',
  };

  try {
    const contentListResult = await getSingleDataOverviewAsync(cookie, workId, timeType);
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

export interface KuaishouSingleDataOverviewOutput extends BaseResult {
  data?: {
    basicData: [
      {
        tabName: string;
        tabData: Array<KuaishouSingleDataOverviewTabDataResponse>;
      },
    ];

    /**
     * 数据更新时间
     */
    dataUpdateTime: number;
  };

  raw?: unknown;
}

/**
 * 快手用户首页数据
 * @param cookie
 */
export const getKuaishouUserHomeData = async (cookie: string): Promise<KuaishouUserHomeDataOutput> => {
  const result: KuaishouUserHomeDataOutput = {
    code: 0,
    msg: '',
  };

  try {
    const contentListResult = await getUserHomeDataAsync(cookie);
    result.data = contentListResult.data;
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

export interface KuaishouUserHomeDataOutput extends BaseResult {
  data?: {
    /**
     * 点赞
     */
    likeCnt: number;

    /**
     * 用户名
     */
    userName: string;

    /**
     * 粉丝数
     */
    fansCnt: number;

    /**
     * 用户id
     */
    userId: number;

    /**
     * 关注数
     */
    followCnt: number;
    desc: string;

    /**
     * 收益数
     */
    incomes: number;

    /**
     * 快币数
     */
    ksCoin: number;

    /**
     * 黄钻数
     */
    diamond: number;
  };
}

export const getKuaishouMusicList = async (
  cookie: string,
  keyWord: string = '',
  nextPage: string = '',
): Promise<KuaishouMusicListDataOutput> => {
  const result: KuaishouMusicListDataOutput = {
    code: 0,
    msg: '',
  };

  try {
    const match = regex.exec(cookie);
    const webapiId = match ? match[1] : Guid.NewGuid().toString().replace(/-/g, '');
    const contentListResult = await getKuaishouMusicResponse(cookie, keyWord ?? '', nextPage, webapiId);
    result.musicList = contentListResult.data?.musicList;
    // 下一页参数
    if (result.musicList?.length >= 50) {
      result.nextPage = contentListResult.data.searchSessionId;
    }
    result.code = contentListResult.result == 1 ? 0 : contentListResult.result;
    if (result.musicList?.length) {
      result.dataList = result.musicList?.map((obj) => ({
        yixiaoerId: obj.musicId,
        yixiaoerName: obj.title,
        yixiaoerImageUrl: obj.cover[0]?.url,
        authorName: obj.author,
        duration: obj.duration / 1000,
        playUrl: obj.url[0]?.url,
        raw: obj,
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

export interface KuaishouMusicListDataOutput extends ListMusicInfoResponse {
  /**
   * 音乐列表
   */
  musicList?: Array<KuaishouMusicInfo>;

  /**
   * 下一页参数，为空、null、undefined时表示没有下一页
   */
  nextPage?: string;
}

/**
 *
 * @param cookie
 * @param days 1: 7天数据，2: 30天数据,3: 90天数据
 * @param proxy
 */
export const getKuaiShouOverViewDashboard = async (
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
    { name: '总粉丝', key: 'totalFansCount' },
    { name: '总获赞', key: 'totalGreatsCount' },
    { name: '播放量', key: 'playCount' },
    { name: '点赞量', key: 'greatCount' },
    { name: '净增粉丝量', key: 'netFansCount' },
    { name: '完播率', key: 'playCompletionRate' },
    { name: '评论量', key: 'commentCount' },
    { name: '分享量', key: 'shareCount' },
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
    const fansData = await getUserFansNumResponse(cookie, proxyAgent);
    if (fansData && fansData['result'] != 1) {
      result.code = fansData['result'] === 0 ? -1 : fansData['result'];
      result.msg = fansData['message'] ?? '';
      return result;
    }
    if (fansData['data']['fansCnt']?.toString()) {
      result.data?.push({
        name: '总粉丝',
        key: 'totalFansCount',
        value: formatNumber(fansData['data']['fansCnt']),
        list: [],
      });
      result.data?.push({
        name: '总获赞',
        key: 'totalGreatsCount',
        value: formatNumber(fansData['data']['likeCnt']),
        list: [],
      });
      newOverView.all.overview['totalFansCount'] = formatNumberNo(fansData['data']['fansCnt']);
      newOverView.all.overview['totalGreatsCount'] = formatNumberNo(fansData['data']['likeCnt']);
    } else {
      throw new Error(fansData['message']?.toString() ?? '');
    }

    const tiaoResult = await getKuaishouDataOverview(cookie, days, proxy);
    result.code = tiaoResult?.code;
    result.msg = tiaoResult?.msg ?? '';
    if (tiaoResult?.data?.basicData && tiaoResult?.data?.basicData?.length > 0) {
      for (const metric of tiaoResult?.data.basicData) {
        if (!metric?.name || metric.name === '作品量') {
          continue;
        }
        const nameItem = names.find((item) => item.name === metric.name);

        const dataItem: DataColumn = {
          name: metric.name,
          key: nameItem?.key ?? metric.name,
          value: '-',
          list: [],
        };
        if (dataItem.name === '完播率') {
          dataItem.value = `${(metric.sumCount * 100).toFixed(2)}%`;
          newOverView.all.overview[dataItem.key] = parseFloat((metric.sumCount ?? 0).toFixed(4));
        } else {
          dataItem.value = formatNumber(metric.sumCount);
          newOverView.all.overview[dataItem.key] = formatNumberNo(metric.sumCount);
        }
        result.data?.push(dataItem);
        if (metric.trendData?.length > 0) {
          for (const trendItem of metric.trendData) {
            const dateStr = `${trendItem.date.substr(0, 4)}-${trendItem.date.substr(4, 2)}-${trendItem.date.substr(
              6,
              2,
            )}`;

            dataItem.list.push({
              date: new Date(dateStr).getTime(),
              value: trendItem.count,
            });
          }
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
 * 获取快手指定天数内，最多20条公开作品数据
 * @param cookie
 * @param eventCallBack
 * @param days
 * @param maxCount
 * @param isHeader
 * @param proxy
 */
export const getKuaishouContentListView = async (
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
      { name: '描述', key: 'desc' },
      { name: '发布时间', key: 'date' },
      { name: '作品类型', key: 'type' },
      { name: '播放量', key: 'play' },
      { name: '完播率', key: 'finishPlay' },
      { name: '评论量', key: 'comment' },
      { name: '点赞量', key: 'great' },
      { name: '收藏量', key: 'collect' },
      { name: '涨粉量', key: 'addFans' },
    ];
    if (isHeader) {
      return result;
    }
    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    let contentTmpId: string = '';
    for (let i = 0; i < syncContentMaxPage; i++) {
      const contentList = await getKuaishouContentDetailList(cookie, i, webProxy);
      if (contentList?.data?.photoList?.photoItems?.length) {
        if (contentList.data.photoList.photoItems[0]?.photoId === contentTmpId) {
          break;
        } else {
          contentTmpId = contentList.data.photoList.photoItems[0].photoId;
        }
        let j = 0;
        for (const item of contentList?.data?.photoList?.photoItems) {
          j++;
          //快手获取的是公开作品，不需要过滤可见类型
          const date = dayjs(item.publishTime).toDate();
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
            id: item.photoId,
            cover: item.cover ?? '',
            desc: item?.title ?? '',
            date: dateStr,
            type: item.video ? 'video' : 'dynamic',
            play: formatNumber(item.playCount),
            finishPlay: `${(item.fpr * 100).toFixed(2)}%`,
            comment: formatNumber(item.commentCount),
            great: formatNumber(item.likeCount),
            collect: formatNumber(item.collectCount),
            addFans: formatNumber(item.followCount),
            pageUrl: `https://m.gifshow.com/fw/photo/${item.photoId}`,
          });
          result.dataList.push({
            id: item.photoId,
            cover: item.cover ?? '',
            desc: item?.title ?? '',
            date: dateStr,
            type: item.video ? 'video' : 'dynamic',
            play: formatNumberNo(item.playCount),
            finishPlay: parseFloat(item.fpr.toFixed(4)),
            comment: formatNumberNo(item.commentCount),
            great: formatNumberNo(item.likeCount),
            collect: formatNumberNo(item.collectCount),
            addFans: formatNumberNo(item.followCount),
            pageUrl: `https://m.gifshow.com/fw/photo/${item.photoId}`,
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
          result.code = contentList?.result === 1 ? 0 : contentList?.result === 0 ? -1 : contentList?.result ?? -1;
          result.msg = contentList?.message;
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

export const getKuaishouCollection = async (cookie: string): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    const topicResult = await getCollectionResponse(cookie);

    result.code = topicResult.result == 1 ? 0 : topicResult.result;
    result.msg = topicResult.message;
    if (topicResult.data?.length) {
      result.dataList = topicResult.data.map((obj) => ({
        yixiaoerId: obj.collectionId?.toString(),
        yixiaoerName: obj.title,
        viewNum: obj.photoSize,
        raw: obj,
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

export const checkKuaiShouLogin = async (cookie: string, proxy?: IWebProxy): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };

  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfoResult = await refreshUserTokenResponse(cookie, webProxy);
    result.code = userInfoResult?.['kuaishou.web.cp.api.at'] ? 0 : userInfoResult?.result ?? -1;
    result.msg = userInfoResult?.error_msg;
    result.data = userInfoResult;
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
