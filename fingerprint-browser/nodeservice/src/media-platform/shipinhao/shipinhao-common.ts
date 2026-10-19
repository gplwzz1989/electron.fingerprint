import { getActivityListResponse, ShipinhaoActivityInfo } from './shipinhao-activity.service';
import { BaseResult } from '../baseResult';
import {
  getShipinhaoPrivilegeResponse,
  getShipinhaoStatusResponse,
  getUserinfo,
  getUserinfoLite,
} from './shipinhao-base.service';
import { getCollectionListResponse, ShipinhaoCollectionInfo } from './shipinhao-collection.service';
import { getDramaListResponse, ShipinhaoDramaInfo } from './shipinhao-drama.service';
import { getUserListResponse, ShipinhaoFriendInfo } from './shipinhao-friend.service';
import { getLocationListResponse, ShipinhaoLocationInfo } from './shipinhao-location.service';
import { getGoodsListResponse, ShipinhaoGoodsInfo } from './shipinhao-shop.service';
import { AxiosError } from 'axios';
import { auditStatusEnum, formatNumber, formatNumberNo, Guid, Task } from '../../utils';
import { getVideoList, ShipinhaoVideoInfo, ShipinhaoVideoListResponse } from './shipinhao-mediastatus.service';
import {
  getDataOverviewListAsync,
  getFansDailyResponseAsync,
  getSingleDataOverviewAsync,
  ShipinhaoTotalData,
} from './shipinhao-data-overview.service';
import {
  getContentListAsync,
  getShipinhaoPostListAsync,
  getShipinhaoSingleContentListAsync,
  ShipinhaoMediaContent,
  ShipinhaoSingleMediaContent,
} from './shipinhao-content-list.service';
import { errorCode } from '../errorCode';
import {
  AccountContentListViewOutPut,
  AccountReportDataOutPut,
  syncContentEventName,
  syncContentMaxPage,
} from '../data-service';
import {
  DataColumn,
  ListGoodsInfoResponse,
  ListInfoResponse,
  PlatformAuthorInfo,
  PlatformContentItem,
  PlatformContentItemNum,
} from '../baseModel';
import dayjs from 'dayjs';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../webproxy';
import { PlatformMusicInfoOutput } from '../model';
import { getShipinhaoMusicResponse } from './shipinhao-music.service';
import { EventEmitter } from 'events';
import { deleteContent } from '@/media-platform/shipinhao/shipinhao-content-delete.service';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 获取活动列表
 * @param cookie
 * @param keyWord 搜索关键词,不能为空，关键词为空时没有默认活动信息
 * @param finderUsername 用户信息，可选参数
 * @param uin 用户信息uin，可选参数，默认为0
 * @param lastBuff 下一页参数，可选参数，默认为空
 */
export const getShipinhaoActivity = async (
  cookie: string,
  keyWord: string,
  finderUsername?: string,
  uin: number = 0,
  lastBuff: string = '',
): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    const activityResult = await getActivityListResponse(cookie, keyWord ?? '', finderUsername ?? '', lastBuff, uin);

    result.code = activityResult?.errCode ?? errorCode.data_error;
    result.msg = activityResult?.errMsg;
    if (activityResult?.data?.eventList?.length) {
      for (const item of activityResult?.data?.eventList) {
        result.dataList?.push({
          yixiaoerId: item?.eventTopicId,
          yixiaoerName: `${item.eventCreatorNickname} · ${item.eventName}`,
          raw: item,
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
export interface ShipinhaoActivityListResultOutput extends BaseResult {
  /**
   * 数据体
   */
  data?: {
    /**
     * 活动数据列表
     */
    eventList: Array<ShipinhaoActivityInfo>;
    /**
     * 翻页下一页参数
     */
    lastBuff: string;
    /**
     * 是否有下一页
     */
    continueFlag: boolean;
  };
}

/**
 * 获取用户详细信息
 * @param cookie
 * @param proxy
 */
export const getShipinhaoUserInfo = async (
  cookie: string,
  proxy?: KuaiDaiLiProxy,
): Promise<ShipinhaoUserInfoResultOutput> => {
  const result: ShipinhaoUserInfoResultOutput = {
    code: 0,
    msg: '',
  };

  try {
    let proxyAgent;
    if (proxy?.serverAdd) {
      proxyAgent = createKuaiProxyAgent(proxy);
    }
    const userInfoResult = await getUserinfo(cookie, proxyAgent);

    result.yixiaoerId = userInfoResult?.data?.finderUser?.uniqId?.toString();
    result.yixiaoerName = userInfoResult?.data?.finderUser?.nickname?.toString();
    result.yixiaoerImageUrl = userInfoResult?.data?.finderUser?.headImgUrl?.toString();
    result.raw = userInfoResult?.data?.finderUser;
    result.code = userInfoResult.errCode;
    result.msg = userInfoResult.errMsg;
    result.data = userInfoResult.data;

    if (result?.code === 300333 || result?.code === 300334) {
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

/**
 * 鑾峰彇瑙嗛鍙风淇＄洃鍚交閲忚韩浠藉垵濮嬪寲淇℃伅
 * @param cookie
 * @param proxy
 */
export const getShipinhaoMessageInitInfo = async (
  cookie: string,
  proxy?: KuaiDaiLiProxy,
): Promise<ShipinhaoUserInfoResultOutput> => {
  const result: ShipinhaoUserInfoResultOutput = {
    code: 0,
    msg: '',
  };

  try {
    let proxyAgent;
    if (proxy?.serverAdd) {
      proxyAgent = createKuaiProxyAgent(proxy);
    }
    const userInfoResult = await getUserinfoLite(cookie, proxyAgent);

    result.yixiaoerId = userInfoResult?.data?.finderUser?.uniqId?.toString();
    result.yixiaoerName = userInfoResult?.data?.finderUser?.nickname?.toString();
    result.yixiaoerImageUrl = userInfoResult?.data?.finderUser?.headImgUrl?.toString();
    result.raw = userInfoResult?.data?.finderUser;
    result.code = userInfoResult.errCode;
    result.msg = userInfoResult.errMsg;
    result.data = userInfoResult.data;

    if (result?.code === 300333 || result?.code === 300334) {
      result.msg = '鐧诲綍澶辨晥';
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
 * 视频号作品数据
 * @param cookie
 * @param finderUsername 用户信息返回的finderUsername
 * @param uin 用户信息返回的uin
 * @param currentPage 页码 默认1
 * @param pageSize 每页数量 默认20
 */
export const getShipinhaoContentList = async (
  cookie: string,
  finderUsername: string,
  uin: number,
  currentPage: number = 1,
  pageSize: number = 20,
): Promise<ShipinhaoContentListOutput> => {
  const result: ShipinhaoContentListOutput = {
    code: 0,
    msg: '',
    data: {},
  };

  try {
    const contentListResult = await getContentListAsync(cookie, finderUsername, uin, currentPage, pageSize);
    result.code = contentListResult.errCode;
    result.msg = contentListResult.errMsg;
    result.data.list = contentListResult.data?.list;
    result.data.totalCount = contentListResult.data?.totalCount;
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

/**
 * 视频号数据中心视频数据
 * @param cookie
 * @param startDate 开始时间
 * @param endDate 结束时间
 * @param finderUsername 用户信息返回的finderUsername
 * @param uin 用户信息返回的uin
 * @param type
 * @param proxy
 */
export const getShipinhaoDataOverview = async (
  cookie: string,
  startDate: Date,
  endDate: Date,
  finderUsername: string,
  uin: number,
  type: 'video' | 'dynamic' = 'video',
  proxy?: KuaiDaiLiProxy,
): Promise<ShipinhaoDataOverviewOutput> => {
  const result: ShipinhaoDataOverviewOutput = {
    code: 0,
    msg: '',
    data: {},
  };

  try {
    let proxyAgent;
    if (proxy?.serverAdd) {
      proxyAgent = createKuaiProxyAgent(proxy);
    }
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    const startTs = String(Math.floor(startTime / 1000)).padStart(10, '0');
    const endTs = String(Math.floor(endTime / 1000)).padStart(10, '0');

    const dataOverviewList = await getDataOverviewListAsync(
      cookie,
      startTs,
      endTs,
      finderUsername,
      uin,
      type,
      proxyAgent,
    );
    result.code = dataOverviewList.errCode;
    result.msg = dataOverviewList.errMsg;
    result.data = dataOverviewList.data;
    result.raw = dataOverviewList;
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

export interface ShipinhaoUserInfoResultOutput extends PlatformAuthorInfo {
  /**
   * 消息体
   */
  data?: {
    /**
     * 用户信息
     */
    finderUser?: {
      /**
       * 用户长ID
       */
      finderUsername: string;
      /**
       * 昵称
       */
      nickname: string;
      /**
       * 头像URL
       */
      headImgUrl: string;
      /**
       * 作品数
       */
      feedsCount: number;
      /**
       * 粉丝数
       */
      fansCount: number;
      /**
       * 账号状态
       */
      acctStatus: number;
      /**
       * 视频号id
       */
      uniqId: string;
      /**
       * 后续需要使用的uin参数，疑似微信id
       */
      uin: number;
    };
    /**
     * 原创信息
     */
    entranceInfo: {
      originalEntranceInfo: {
        /**
         * 是否有原创权限 1有，非1无
         */
        contactAdditionalFlag: number;
      };
    };
    /**
     * 挂车信息
     */
    switchInfo: {
      /**
       * 是否有挂车权限 1有 非1无
       */
      enablePostWithProduct: number;
    };
  };
}

/**
 * 获取合集列表
 * @param cookie
 * @param finderUsername 可选参数，来自于用户信息接口返回
 * @param pageNum 翻页页码，默认值为1，最小值:1
 */
export const getShipinhaoCollection = async (
  cookie: string,
  finderUsername?: string,
  pageNum: number = 1,
): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
  };
  result.dataList = [];
  try {
    if (!pageNum) {
      pageNum = 1;
    }
    const collectionResult = await getCollectionListResponse(cookie, finderUsername ?? '', pageNum);

    result.code = collectionResult?.errCode ?? -1;
    result.msg = collectionResult?.errMsg;
    if (collectionResult?.data?.collectionList?.length) {
      collectionResult?.data?.collectionList?.forEach((x) => {
        result?.dataList?.push({
          yixiaoerId: x.id?.toString(),
          yixiaoerName: x.name,
          yixiaoerDesc: x.desc,
          yixiaoerImageUrl: x.coverImgUrl,
          viewNum: Number(x.totalReadCount),
        });
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

export interface ShipinhaoCollectionListResultOutput extends BaseResult {
  /**
   * 数据体
   */
  data?: {
    /**
     * 合集数据列表
     */
    collectionList: Array<ShipinhaoCollectionInfo>;

    /**
     *合集数量
     */
    collectionListCount: number;

    baseResp: {
      // noinspection SpellCheckingInspection
      errcode: number;
    };
  };
}

/**
 * 获取视频好用户列表
 * @param cookie
 * @param keyWord 搜索关键词，不能为空，为空时没有默认好友/用户列表
 * @param finderUsername 可选参数，来自于用户信息接口返回
 * @param pageNum 翻页页码，默认值为1，最小值:1
 */
export const getShipinhaoFriend = async (
  cookie: string,
  keyWord: string,
  finderUsername?: string,
  pageNum: number = 1,
): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    if (!pageNum) {
      pageNum = 1;
    }
    const friendResult = await getUserListResponse(cookie, keyWord ?? '', finderUsername ?? '', pageNum);

    result.code = friendResult?.errCode ?? errorCode.data_error;
    result.msg = friendResult?.errMsg ?? '';

    if (friendResult?.data?.list?.length) {
      for (const item of friendResult?.data?.list) {
        result.dataList?.push({
          yixiaoerId: item.username,
          yixiaoerName: item.nickName,
          yixiaoerImageUrl: item.headImgUrl,
          raw: item,
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

export interface ShipinhaoFriendListResultOutput extends BaseResult {
  /**
   * 数据体
   */
  data?: {
    /**
     *好友/用户信息列表
     */
    list: Array<ShipinhaoFriendInfo>;
    /**
     * 总数量
     */
    totalCount: number;
  };
}

/**
 * 获取视频号剧集列表
 * @param cookie
 * @param keyWord 搜索关键词，为空时获取默认剧集列表
 * @param finderUsername 可选参数，来自于用户信息接口返回
 * @param pageNum 翻页页码，默认值为1，最小值:1
 */
export const getShipinhaoDrama = async (
  cookie: string,
  keyWord: string,
  finderUsername?: string,
  pageNum: number = 1,
): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    if (!pageNum) {
      pageNum = 1;
    }
    if (!finderUsername) {
      const data = await getShipinhaoUserInfo(cookie);
      finderUsername = data.data?.finderUser?.finderUsername;
    }
    const dramaResult = await getDramaListResponse(cookie, keyWord ?? '', finderUsername ?? '', pageNum);

    result.code = dramaResult?.errCode ?? errorCode.data_error;
    result.msg = dramaResult?.errMsg ?? '';

    if (dramaResult?.data?.list?.length) {
      result.nextPage = (pageNum + 1).toString();
      for (const item of dramaResult.data.list) {
        result.dataList?.push({
          yixiaoerId: item.id,
          yixiaoerName: item.name,
          yixiaoerImageUrl: item.coverUrl,
          //raw: item,
        });
      }
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = '请求视频号剧集失败，请稍后重试';
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = '处理视频号剧集数据失败，请稍后重试';
    } else {
      result.msg = '获取视频号剧集失败，请稍后重试';
      result.code = errorCode.unknown_error;
    }
  }

  return result;
};

export interface ShipinhaoDramaListResultOutput extends BaseResult {
  /**
   * 数据体
   */
  data?: {
    /**
     * 剧集列表
     */
    list: Array<ShipinhaoDramaInfo>;
    /**
     * 总数量
     */
    totalCount: number;
  };
}

/**
 * 搜索地理位置信息列表
 * @param cookie
 * @param keyWord 搜索关键词
 * @param finderUsername 可选参数，来自获取用户信息接口
 * @param proxy
 */
export const getShipinhaoLocation = async (
  cookie: string,
  keyWord: string,
  finderUsername?: string,
  proxy?: KuaiDaiLiProxy,
): Promise<ShipinhaoLocationListResultOutput> => {
  const result: ShipinhaoLocationListResultOutput = {
    code: 0,
    msg: '',
  };
  result.dataList = [];

  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }

    const locationResult = await getLocationListResponse(cookie, keyWord ?? '', finderUsername ?? '', webProxy);
    if (locationResult?.data?.list) {
      if (!keyWord && locationResult?.data?.address?.poiCheckSum) {
        result.dataList.push({
          yixiaoerId: locationResult.data.address.poiCheckSum,
          yixiaoerName: locationResult.data.address.city,
          yixiaoerDesc: locationResult.data.address.province + locationResult.data.address.city,
          raw: locationResult.data.address,
        });
      }
      locationResult.data.list?.forEach((obj) => {
        result.dataList?.push({
          yixiaoerId: obj.uid,
          yixiaoerName: obj.name,
          yixiaoerDesc: obj.address,
          raw: obj,
        });
      });
    }
    result.code = locationResult.errCode;
    result.msg = locationResult.errMsg;
    result.data = locationResult.data;
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

export interface ShipinhaoLocationListResultOutput extends ListInfoResponse {
  /**
   * 地点数据体
   */
  data?: {
    /**
     * 地点列表信息
     */
    list: Array<ShipinhaoLocationInfo>;
    address: {
      /**
       * 当前所在地精度
       */
      longitude: number;
      /**
       * 当前所在地维度
       */
      latitude: number;
      /**
       * 当前国家
       */
      country: string;

      countryCode: string;
      /**
       * 当前省份
       */
      province: string;
      /**
       * 当前城市
       */
      city: string;
      /**
       * 当前区县
       */
      region: string;
    };
    continueFlag: number;
  };
}

/**
 * 获取用户已添加的商品列表
 * @param cookie
 * @param keyWord 搜索关键词
 * @param finderUsername 可选参数，来自获取用户信息接口
 * @param lastBuffer 下一页参数，首页为空，来自返回值中的lastBuffer
 */
export const getShipinhaoGoods = async (
  cookie: string,
  keyWord: string,
  finderUsername?: string,
  lastBuffer?: string,
): Promise<ListGoodsInfoResponse> => {
  const result: ListGoodsInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    const goodsResult = await getGoodsListResponse(cookie, keyWord ?? '', finderUsername ?? '', lastBuffer ?? '');

    result.code = goodsResult?.errCode ?? -1;
    result.msg = goodsResult.errMsg;
    if (goodsResult?.data?.products?.length) {
      for (const item of goodsResult?.data?.products) {
        result.dataList?.push({
          yixiaoerId: item.outProductId,
          yixiaoerName: item.title,
          yixiaoerDesc: item.platformName,
          yixiaoerImageUrl: item.imgUrls?.length ? item.imgUrls[0] : '',
          price: item.sellingPrice,
          count: item.stock,
          raw: item,
        });
      }
      result.nextPage = goodsResult?.continueFlag ? goodsResult?.lastBuffer : undefined;
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

export interface ShipinhaoGoodsListResultOutput extends BaseResult {
  data: {
    /**
     * 商品列表
     */
    products?: Array<ShipinhaoGoodsInfo>;
  };

  /**
   * 下一页参数值
   */
  lastBuffer?: string;

  /**
   * 是否还有下一页数据
   */
  continueFlag?: number;
}

/**
 * 获取已发布作品的审核状态
 * @param cookie
 * @param publishId  发布时产生的publishId
 * @param finderUsername 可选参数，来自获取用户信息接口
 * @param maxPage 可选参数, 查询最大翻页数，默认10页
 */
export const getShipinhaoMediaStatus = async (
  cookie: string,
  publishId: string,
  finderUsername?: string,
  maxPage: number = 10,
): Promise<ShipinhaoMediaStatusResultOutput> => {
  const result: ShipinhaoMediaStatusResultOutput = {
    code: -1,
    msg: '',
    publishId: publishId,
  };

  try {
    let mediaResult: ShipinhaoVideoListResponse | undefined = undefined;
    for (let i = 1; i < maxPage; i++) {
      mediaResult = await getVideoList(cookie, finderUsername ?? '', i);
      //logger.info(`视频号状态查询:${cookie}:${finderUsername}\n${JSON.stringify(mediaResult)}`);
      if (mediaResult?.data?.list?.length) {
        for (const item of mediaResult.data.list) {
          const thumbUrl = item?.desc?.media[0]?.coverUrl
            ? item?.desc?.media[0]?.coverUrl
            : (item?.desc?.media[0]?.fullThumbUrl
                ? item.desc?.media[0]?.fullThumbUrl
                : item.desc?.media[0]?.thumbUrl) ?? '';
          const findDocid = (thumbUrl.includes('encfilekey=') ? thumbUrl.split('encfilekey=')[1] : '').split('&')[0];
          if (findDocid == publishId) {
            result.code = 0;
            result.msg = '';
            if (item.handleStatus) {
              if (item.handleStatus === 1) {
                result.auditStatus = auditStatusEnum.waitExecute;
              } else if (item.handleStatus === 2) {
                result.auditStatus = auditStatusEnum.prePublish;
              } else {
                result.auditStatus = auditStatusEnum.executeFail;
              }
            } else {
              result.auditStatus = auditStatusEnum.published;
            }

            const effectiveTime = item?.effectiveTime;
            //定时发布
            if (effectiveTime && effectiveTime > new Date().getTime() / 1000) {
              result.auditStatus = auditStatusEnum.prePublish;
              result.create_time = item.effectiveTime;
            } else {
              result.create_time = item.createTime;
              result.openUrl = item?.desc?.media[0]?.url;
            }
            result.publishId = findDocid;
            result.docId = item.objectId?.toString() ?? '';
            result.coverUrl = item.desc?.media[0]?.coverUrl;
            if (!result.coverUrl) {
              result.coverUrl = item?.desc?.media[0].fullThumbUrl;
            }
            return result;
          }
        }
      } else {
        result.code = mediaResult?.errCode ?? -1;
        result.msg = '未找到作品';
        return result;
      }
    }
    result.code = mediaResult?.errCode ?? -1;
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

export interface ShipinhaoMediaStatusResultOutput extends BaseResult {
  /**
   * 发布产生的id
   */
  publishId?: string;

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
   * 作品封面url
   */
  coverUrl?: string;
  /**
   * 视频信息
   */
  data?: ShipinhaoVideoInfo;
}

/**
 * 获取用户是否有视频原创权限、挂载商品权限
 * @param cookie
 * @param finderUsername 可选参数，来自获取用户信息接口
 */
export const getShipinhaoPrivilege = async (
  cookie: string,
  finderUsername?: string,
): Promise<ShipinhaoPrivilegeResultOutput> => {
  const result: ShipinhaoPrivilegeResultOutput = {
    code: 0,
    msg: '',
  };

  try {
    const privilegeResult = await getShipinhaoPrivilegeResponse(cookie, finderUsername ?? '');

    result.code = privilegeResult.errCode;
    result.msg = privilegeResult.errMsg;
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

export interface ShipinhaoPrivilegeResultOutput extends BaseResult {
  data?: {
    entranceInfo: {
      originalEntranceInfo: {
        /**
         * 是否有原创权限 1有，非1无
         */
        contactAdditionalFlag: number;
      };
    };
    switchInfo: {
      /**
       * 是否有挂车权限 1有 非1无
       */
      enablePostWithProduct: number;
    };
  };
}

/**
 * 获取用户状态是否正常
 * @param cookie
 */
export const getShipinhaoUserStatus = async (cookie: string): Promise<ShipinhaoStatusResultOutput> => {
  const result: ShipinhaoStatusResultOutput = {
    code: 0,
    msg: '',
  };

  try {
    const statusResult = await getShipinhaoStatusResponse(cookie);

    result.code = statusResult.errCode;
    result.msg = statusResult.errMsg;
    result.data = statusResult.data;
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

export interface ShipinhaoStatusResultOutput extends BaseResult {
  data?: {
    /**
     * 账号异常提示消息，当为空时，账号正常
     */
    wording: string;
  };
}

export interface ShipinhaoContentListOutput extends BaseResult {
  data: {
    /**
     * 作品列表
     */
    list?: Array<ShipinhaoMediaContent>;
    /**
     * 作品总数
     */
    totalCount?: number;
  };
  raw?: unknown;
}

export interface ShipinhaoDataOverviewOutput extends BaseResult {
  data: {
    totalData?: ShipinhaoTotalData;
    notExistFansData?: boolean;
  };
  raw?: unknown;
}

/**
 * 视频号数据中心单篇数据
 * @param cookie
 * @param feedId 作品id
 * @param startDate 开始时间（Date）
 * @param endDate 结束时间（Date）
 * @param finderUsername 用户信息返回的finderUsername
 * @param uin 用户信息返回的uin
 */
export const getShipinhaoSingleDataOverview = async (
  cookie: string,
  feedId: string,
  startDate: Date,
  endDate: Date,
  finderUsername: string,
  uin: number,
) => {
  const result: ShipinhaoDataOverviewSingleOutput = {
    code: 0,
    msg: '',
  };

  try {
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    const startTs = String(Math.floor(startTime / 1000)).padStart(10, '0');
    const endTs = String(Math.floor(endTime / 1000)).padStart(10, '0');

    const dataOverviewSingleResult = await getSingleDataOverviewAsync(
      cookie,
      feedId,
      startTs,
      endTs,
      finderUsername,
      uin,
    );

    result.code = dataOverviewSingleResult.errCode;
    result.msg = dataOverviewSingleResult.errMsg;
    result.data = dataOverviewSingleResult.data;
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

export interface ShipinhaoDataOverviewSingleOutput extends BaseResult {
  data?: {
    feedData: Array<{
      totalData: {
        /**
         * 播放
         */
        browse: Array<string>;
        /**
         * 评论
         */
        comment: Array<string>;
        /**
         * 喜欢数
         */
        fav: Array<string>;
        /**
         * 关注
         */
        follow: Array<string>;
        /**
         * 分享
         */
        forward: Array<string>;
        forwardAggregation: Array<string>;
        /**
         * 推荐
         */
        like: Array<string>;
        ringset: Array<string>;
        snscover: Array<string>;
        statusref: Array<string>;
      };
    }>;
  };
}

/**
 * 视频号单篇列表
 * @param cookie
 * @param finderUsername 用户信息返回的finderUsername
 * @param uin 用户信息返回的uin
 * @param startDate 开始日期 Date
 * @param endDate 结束日期 Date
 * @param currentPage 页码
 * @param pageSize 每页数量
 */
export const getShipinhaoSingleContent = async (
  cookie: string,
  finderUsername: string,
  uin: number,
  startDate: Date,
  endDate: Date,
  currentPage: number = 1,
  pageSize: number = 10,
): Promise<ShipinhaoSingleContentListOutput> => {
  const result: ShipinhaoSingleContentListOutput = {
    code: 0,
    msg: '',
  };

  try {
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();

    const startTs = Math.floor(startTime / 1000);
    const endTs = Math.floor(endTime / 1000);

    const singleContentListResult = await getShipinhaoSingleContentListAsync(
      cookie,
      finderUsername,
      uin,
      startTs,
      endTs,
      currentPage,
      pageSize,
    );

    result.code = singleContentListResult.errCode;
    result.msg = singleContentListResult.errMsg;
    result.data = singleContentListResult.data;
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

export interface ShipinhaoSingleContentListOutput extends BaseResult {
  data?: {
    list: Array<ShipinhaoSingleMediaContent>;
    totalCount: 1;
  };
}

/**
 * 话题接口，目前为了适配而生，只是讲输入的关键词转化为话题对象，并非从官方获取
 * @param keyWord 关键词
 * @param cookie 账号cookie
 */
export const getShipinhaoTopicList = async (keyWord: string, cookie?: string): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };

  try {
    /**
     * 别问为什么，就是为了规避傻逼规则
     */
    const m = Guid.NewGuid().toString();

    result.dataList?.push({
      yixiaoerId: m,
      yixiaoerName: keyWord,
      raw: {
        name: keyWord,
        id: m,
      },
    });
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

export interface ShipinhaoTopicResult {
  code: number;

  msg: string;

  topics: Array<ShipinhaoTopicInfo>;
}

export interface ShipinhaoTopicInfo {
  /**
   * 唯一id号
   */
  id: string;
  /**
   * 话题名称
   */
  name: string;
}

/**
 *
 * @param cookie
 * @param days 1: 7天数据，2: 30天数据,3: 90天数据
 * @param type video:视频 dynamic:图文
 * @param proxy
 */
export const getShipinhaoOverViewDashboard = async (
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
          { name: '总关注者', key: 'totalFansCount' },
          { name: '播放', key: 'playCount' },
          { name: '喜欢', key: 'likeCount' },
          { name: '点赞', key: 'greatCount' },
          { name: '评论', key: 'commentCount' },
          { name: '分享', key: 'shareCount' },
          { name: '关注', key: 'fansCount' },
          { name: '净增关注', key: 'netFansCount' },
        ]
      : [
          { name: '总关注者', key: 'totalFansCount' },
          { name: '曝光量', key: 'impressionCount' },
          { name: '喜欢', key: 'likeCount' },
          { name: '点赞', key: 'greatCount' },
          { name: '评论', key: 'commentCount' },
          { name: '分享', key: 'shareCount' },
          { name: '新增关注', key: 'fansCount' },
          { name: '净增关注', key: 'netFansCount' },
        ];
  if (type === 'video') {
    names.splice(2, 0, { name: '\u63A8\u8350\u91CF', key: 'recommendCount' });
  } else {
    names.splice(2, 0, { name: '\u63A8\u8350\u91CF', key: 'recommendCount' });
  }

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
    const fansData = await getShipinhaoUserInfo(cookie, proxy);
    if (fansData?.code === 0 && fansData?.data?.finderUser?.finderUsername) {
      result.data?.push({
        name: '总关注者',
        key: 'totalFansCount',
        value: formatNumber(fansData.data.finderUser.fansCount),
        list: [],
      });
      newOverView.all.overview['totalFansCount'] = formatNumberNo(fansData.data.finderUser.fansCount);
    } else {
      result.code = fansData?.code ?? -1;
      result.msg = fansData?.msg ?? '';
      return result;
    }

    const endTs = dayjs().add(-1, 'day').startOf('day').toDate();
    let startTs = dayjs(endTs).add(-29, 'day').startOf('day').valueOf();
    if (days === 1) {
      startTs = dayjs(endTs).add(-6, 'day').startOf('day').valueOf();
    } else if (days === 3) {
      startTs = dayjs(endTs).add(-89, 'day').startOf('day').valueOf();
    }
    const rangeDays = dayjs(endTs).diff(dayjs(startTs), 'day') + 1;

    const tiaoResult = await getShipinhaoDataOverview(
      cookie,
      new Date(startTs),
      endTs,
      fansData.data.finderUser.finderUsername,
      fansData.data.finderUser.uin,
      type,
      proxy,
    );
    result.code = tiaoResult?.code;
    result.msg = tiaoResult?.msg ?? '';
    if (tiaoResult?.data.totalData?.browse && tiaoResult?.data.totalData?.browse?.length > 0) {
      if (tiaoResult?.data.totalData?.browse) {
        let total = 0;
        tiaoResult?.data.totalData?.browse.forEach((x) => (total += parseInt(x)));
        const dataItem: DataColumn = {
          name: type === 'video' ? '播放' : '曝光量',
          key: type === 'video' ? 'playCount' : 'impressionCount',
          value: formatNumber(total),
          list: [],
        };
        result.data?.push(dataItem);
        if (type === 'video') {
          newOverView.video.overview[dataItem.key] = formatNumberNo(total);
        } else {
          newOverView.dynamic.overview[dataItem.key] = formatNumberNo(total);
        }
        let endTsTmp = endTs.getTime();
        for (const item of tiaoResult?.data?.totalData.browse.slice().reverse()) {
          dataItem.list.push({ date: endTsTmp, value: parseInt(item) });
          endTsTmp -= 86400000;
        }
        if (type === 'video') {
          newOverView.video.thirtydays[dataItem.key] = dataItem.list;
        } else {
          newOverView.dynamic.thirtydays[dataItem.key] = dataItem.list;
        }
      }

      //喜欢，爱心
      if (tiaoResult?.data.totalData?.like) {
        let total = 0;
        tiaoResult?.data.totalData?.like.forEach((x) => (total += parseInt(x)));
        const dataItem: DataColumn = {
          name: '喜欢',
          key: 'likeCount',
          value: formatNumber(total),
          list: [],
        };
        result.data?.push(dataItem);
        if (type === 'video') {
          newOverView.video.overview[dataItem.key] = formatNumberNo(total);
        } else {
          newOverView.dynamic.overview[dataItem.key] = formatNumberNo(total);
        }
        let endTsTmp = endTs.getTime();
        for (const item of tiaoResult?.data?.totalData.like.slice().reverse()) {
          dataItem.list.push({ date: endTsTmp, value: parseInt(item) });
          endTsTmp -= 86400000;
        }
        if (type === 'video') {
          newOverView.video.thirtydays[dataItem.key] = dataItem.list;
        } else {
          newOverView.dynamic.thirtydays[dataItem.key] = dataItem.list;
        }
      }

      //点赞
      if (tiaoResult?.data.totalData?.fav) {
        let total = 0;
        tiaoResult?.data.totalData?.fav.forEach((x) => (total += parseInt(x)));
        const dataItem: DataColumn = {
          name: '点赞',
          key: 'greatCount',
          value: formatNumber(total),
          list: [],
        };
        result.data?.push(dataItem);
        if (type === 'video') {
          newOverView.video.overview[dataItem.key] = formatNumberNo(total);
        } else {
          newOverView.dynamic.overview[dataItem.key] = formatNumberNo(total);
        }
        let endTsTmp = endTs.getTime();
        for (const item of tiaoResult?.data?.totalData.fav.slice().reverse()) {
          dataItem.list.push({ date: endTsTmp, value: parseInt(item) });
          endTsTmp -= 86400000;
        }
        if (type === 'video') {
          newOverView.video.thirtydays[dataItem.key] = dataItem.list;
        } else {
          newOverView.dynamic.thirtydays[dataItem.key] = dataItem.list;
        }
      }

      //评论
      if (tiaoResult?.data.totalData?.comment) {
        let total = 0;
        tiaoResult?.data.totalData?.comment.forEach((x) => (total += parseInt(x)));
        const dataItem: DataColumn = {
          name: '评论',
          key: 'commentCount',
          value: formatNumber(total),
          list: [],
        };
        result.data?.push(dataItem);
        if (type === 'video') {
          newOverView.video.overview[dataItem.key] = formatNumberNo(total);
        } else {
          newOverView.dynamic.overview[dataItem.key] = formatNumberNo(total);
        }
        let endTsTmp = endTs.getTime();
        for (const item of tiaoResult?.data?.totalData.comment.slice().reverse()) {
          dataItem.list.push({ date: endTsTmp, value: parseInt(item) });
          endTsTmp -= 86400000;
        }
        if (type === 'video') {
          newOverView.video.thirtydays[dataItem.key] = dataItem.list;
        } else {
          newOverView.dynamic.thirtydays[dataItem.key] = dataItem.list;
        }
      }

      //分享
      if (tiaoResult?.data.totalData?.forward) {
        let total = 0;
        tiaoResult?.data.totalData?.forward.forEach((x) => (total += parseInt(x)));
        const dataItem: DataColumn = {
          name: '分享',
          key: 'shareCount',
          value: formatNumber(total),
          list: [],
        };
        result.data?.push(dataItem);
        if (type === 'video') {
          newOverView.video.overview[dataItem.key] = formatNumberNo(total);
        } else {
          newOverView.dynamic.overview[dataItem.key] = formatNumberNo(total);
        }
        let endTsTmp = endTs.getTime();
        for (const item of tiaoResult?.data?.totalData.forward.slice().reverse()) {
          dataItem.list.push({ date: endTsTmp, value: parseInt(item) });
          endTsTmp -= 86400000;
        }
        if (type === 'video') {
          newOverView.video.thirtydays[dataItem.key] = dataItem.list;
        } else {
          newOverView.dynamic.thirtydays[dataItem.key] = dataItem.list;
        }
      }

      //关注
      if (tiaoResult?.data.totalData?.follow) {
        let total = 0;
        tiaoResult?.data.totalData?.follow.forEach((x) => (total += parseInt(x)));
        const dataItem: DataColumn = {
          name: type === 'video' ? '关注' : '新增关注',
          key: 'fansCount',
          value: formatNumber(total),
          list: [],
        };
        result.data?.push(dataItem);
        if (type === 'video') {
          newOverView.video.overview[dataItem.key] = formatNumberNo(total);
        } else {
          newOverView.dynamic.overview[dataItem.key] = formatNumberNo(total);
        }
        let endTsTmp = endTs.getTime();
        for (const item of tiaoResult?.data?.totalData.follow.slice().reverse()) {
          dataItem.list.push({ date: endTsTmp, value: parseInt(item) });
          endTsTmp -= 86400000;
        }
        if (type === 'video') {
          newOverView.video.thirtydays[dataItem.key] = dataItem.list;
        } else {
          newOverView.dynamic.thirtydays[dataItem.key] = dataItem.list;
        }
      }
    } else {
      result.code = result?.code ?? -1;
      result.data = [];
    }

    //关注数据
    const fansResult = await getFansDailyResponseAsync(
      cookie,
      dayjs(endTs).add(-29, 'day').startOf('day').unix().toString(),
      dayjs(endTs).startOf('day').unix().toString(),
      fansData?.data?.finderUser?.finderUsername ?? '',
      fansData.data.finderUser.uin,
    );
    if (fansResult?.data?.netAdd) {
      //粉丝变化数
      let total = 0;
      fansResult?.data?.netAdd?.forEach((x) => (total += x));
      const dataItemFansChange: DataColumn = {
        name: '净增关注',
        key: 'netFansCount',
        value: formatNumber(total),
        list: [],
      };
      result.data?.push(dataItemFansChange);
      newOverView.all.overview[dataItemFansChange.key] = formatNumberNo(total);
      let endTsTmp = endTs.getTime();
      for (const item of (fansResult?.data?.netAdd ?? []).slice().reverse()) {
        dataItemFansChange.list.push({ date: endTsTmp, value: item ?? 0 });
        endTsTmp -= 86400000;
      }
      newOverView.all.thirtydays[dataItemFansChange.key] = dataItemFansChange.list;
    } else {
      result.code = fansResult?.errCode ?? -1;
      result.msg = fansResult.errMsg ?? '';
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
  const targetView = (type === 'video' ? result.dataObj?.video : result.dataObj?.dynamic) as
    | {
        overview?: Record<string, number>;
        thirtydays?: Record<string, Array<{ date: number; value: number }>>;
      }
    | undefined;
  const oldLikeData = dataList.find((item) => item.key === 'likeCount');
  const oldGreatData = dataList.find((item) => item.key === 'greatCount');
  const zeroList = (() => {
    const baseList = oldGreatData?.list ?? oldLikeData?.list ?? [];
    return baseList.map((item) => ({ date: item.date, value: 0 }));
  })();
  const recommendData = oldLikeData
    ? {
        ...oldLikeData,
        name: '推荐量',
        key: 'recommendCount',
        list: oldLikeData.list?.map((item) => ({ ...item })) ?? [],
      }
    : undefined;
  const likeData = oldGreatData
    ? {
        ...oldGreatData,
        key: 'likeCount',
        list: oldGreatData.list?.map((item) => ({ ...item })) ?? [],
      }
    : undefined;
  const greatData = {
    name: '点赞',
    key: 'greatCount',
    value: formatNumber(0),
    list: zeroList,
  };
  if (!names.find((item) => item.key === 'recommendCount')) {
    names.splice(2, 0, { name: '推荐量', key: 'recommendCount' });
  }
  const recommendName = names.find((item) => item.key === 'recommendCount');
  if (recommendName) {
    recommendName.name = '推荐量';
  }
  if (oldLikeData) {
    oldLikeData.name = '推荐量';
    oldLikeData.key = 'recommendCount';
  }
  if (oldGreatData) {
    oldGreatData.key = 'likeCount';
  }
  if (targetView?.overview) {
    const oldLikeValue = targetView.overview['likeCount'] ?? 0;
    const oldGreatValue = targetView.overview['greatCount'] ?? 0;
    targetView.overview['recommendCount'] = oldLikeValue;
    targetView.overview['likeCount'] = oldGreatValue;
    targetView.overview['greatCount'] = 0;
  }
  if (targetView?.thirtydays) {
    const oldLikeList = targetView.thirtydays['likeCount'] ?? [];
    const oldGreatList = targetView.thirtydays['greatCount'] ?? [];
    targetView.thirtydays['recommendCount'] = oldLikeList.map((item) => ({ ...item }));
    targetView.thirtydays['likeCount'] = oldGreatList.map((item) => ({ ...item }));
    targetView.thirtydays['greatCount'] = zeroList.map((item) => ({ ...item }));
  }
  result.data = [];
  for (const { name, key } of names) {
    let tmp;
    if (key === 'recommendCount') {
      tmp = recommendData ?? dataList.find((item) => item.key === key);
    } else if (key === 'likeCount') {
      tmp = likeData ?? dataList.find((item) => item.key === key);
    } else if (key === 'greatCount') {
      tmp = greatData;
    } else {
      tmp = dataList.find((item) => item.key === key);
    }
    result.data.push(tmp ?? { name: name, key: key, value: '-', list: [] });
  }
  return result;
};

/**
 * 获取视频号指定天数内，最多20条公开作品数据
 * @param cookie
 * @param eventCallBack
 * @param type
 * @param days
 * @param maxCount
 * @param isHeader
 * @param proxy
 */
export const getShipinhaoContentListView = async (
  cookie: string,
  type: 'video' | 'dynamic',
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
    dataList: [],
  };
  result.data = [];
  result.dataList = [];
  try {
    const lastDate = dayjs().add(-days, 'days').toDate();
    result.headers = [
      { name: '封面', key: 'cover' },
      { name: type === 'video' ? '描述' : '标题', key: type === 'video' ? 'desc' : 'title' },
      { name: '发布时间', key: 'date' },
      { name: type === 'video' ? '播放' : '阅读', key: type === 'video' ? 'play' : 'read' },
      { name: '爱心', key: 'love' },
      { name: '评论', key: 'comment' },
      { name: '分享', key: 'share' },
      { name: '点赞', key: 'great' },
      // { name: '收藏量', key: 'collect' },
      // { name: '涨粉量', key: 'addFans' },
    ];
    if (isHeader) {
      return result;
    }
    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfo = await getUserinfo(cookie, webProxy);
    let contentTmpId = '';
    for (let i = 1; i < syncContentMaxPage; i++) {
      const contentList = await getShipinhaoPostListAsync(
        cookie,
        userInfo?.data?.finderUser?.finderUsername ?? '',
        userInfo.data?.finderUser?.uin ?? 0,
        i,
        20,
        type,
        webProxy,
      );
      if (contentList?.data?.list?.length) {
        if (contentList.data.list[0]?.objectId === contentTmpId) {
          break;
        } else {
          contentTmpId = contentList.data.list[0]?.objectId;
        }
        let j = 0;
        for (const item of contentList?.data?.list) {
          j++;
          if (item.visibleType === 3) {
            continue;
          }
          const date = dayjs(item.createTime * 1000).toDate();
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
            id: item.exportId,
            cover:
              item.desc.mediaType === 4
                ? item.desc.media[0].thumbUrl ?? item.desc.media[0].fullThumbUrl
                : item.desc.media[0].thumbUrl ?? item.desc.media[0].coverUrl,
            date: dateStr,
            love: formatNumber(item.likeCount),
            comment: formatNumber(item.commentCount),
            share: formatNumber(item.forwardAggregationCount),
            great: formatNumber(item.favCount),
            // play: formatNumber(item.readCount),
            // read: formatNumber(item.readCount),
            addFans: formatNumber(item.followCount),
            forward: formatNumber(item.forwardCount),
            ringSetCount: formatNumber(item.ringsetCount),
            snscoverCount: formatNumber(item.snscoverCount),
            pageUrl: item?.desc?.media[0].url ?? '',
            type: item.desc.mediaType === 4 ? 'video' : 'dynamic',
          };
          const newItemNew: PlatformContentItemNum = {
            id: item.exportId,
            cover:
              item.desc.mediaType === 4
                ? item.desc.media[0].thumbUrl ?? item.desc.media[0].fullThumbUrl
                : item.desc.media[0].thumbUrl ?? item.desc.media[0].coverUrl,
            date: dateStr,
            love: formatNumberNo(item.likeCount),
            comment: formatNumberNo(item.commentCount),
            share: formatNumberNo(item.forwardAggregationCount),
            great: formatNumberNo(item.favCount),
            // play: formatNumber(item.readCount),
            // read: formatNumber(item.readCount),
            addFans: formatNumberNo(item.followCount),
            forward: formatNumberNo(item.forwardCount),
            ringSetCount: formatNumberNo(item.ringsetCount),
            snscoverCount: formatNumberNo(item.snscoverCount),
            pageUrl: item?.desc?.media[0].url ?? '',
            type: item.desc.mediaType === 4 ? 'video' : 'dynamic',
          };
          if (item.desc.mediaType === 4) {
            newItem.play = formatNumber(item.readCount);
            newItem.desc = item?.desc?.description ?? '';
            newItem.finishPlay = item.fullPlayRate?.toFixed(2) ?? '0';
            newItem.playTime = item.avgPlayTimeSec?.toFixed(2) ?? '0';
            newItem.statusRefCount = formatNumber(item.statusrefCount);
            newItemNew.play = formatNumberNo(item.readCount);
            newItemNew.desc = item?.desc?.description ?? '';
            newItemNew.finishPlay = parseFloat(item.fullPlayRate?.toFixed(4) ?? '0');
            newItemNew.playTime = parseFloat(item.avgPlayTimeSec?.toFixed(2) ?? '0');
            newItemNew.statusRefCount = formatNumberNo(item.statusrefCount);
          } else {
            newItem.read = formatNumber(item.readCount);
            newItem.title = item?.desc?.finderNewlifeDesc?.richTextTitle
              ? item?.desc?.finderNewlifeDesc?.richTextTitle
              : item?.desc?.description ?? '';
            newItemNew.read = formatNumberNo(item.readCount);
            newItemNew.title = item?.desc?.finderNewlifeDesc?.richTextTitle
              ? item?.desc?.finderNewlifeDesc?.richTextTitle
              : item?.desc?.description ?? '';
          }
          result.data.push(newItem);
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
          result.code = contentList?.errCode ?? -1;
          result.msg = contentList?.errMsg;
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
 * @param type  类型 'recommend':推荐 | 'collect':收藏 | 'search':搜索
 * @param keyWord 搜索关键词
 * @param page 页码，默认 1
 * @param size 单页数量，默认5
 * @param nextPageParam 下一页需要的参数
 * @param finderUsername
 */
export const getShipinhaoMusicList = async (
  cookie: string,
  type: 'recommend' | 'collect' | 'search',
  keyWord: string | undefined = '',
  page: number = 1,
  nextPageParam: string = '',
  size: number = 5,
  finderUsername: string = '',
): Promise<PlatformMusicInfoOutput> => {
  const result: PlatformMusicInfoOutput = {
    code: 0,
    msg: '',
    data: [],
  };
  try {
    const musicRes = await getShipinhaoMusicResponse(
      cookie,
      finderUsername ?? '',
      type,
      keyWord ?? '',
      page,
      nextPageParam,
      size,
    );
    result.code = musicRes?.errCode ?? -1;
    result.msg = musicRes?.errMsg;
    result.total = musicRes?.data?.totalCount ?? 0;
    if (musicRes?.data?.items?.length > 0) {
      for (const item of musicRes.data?.items) {
        if (type === 'search') {
          item.listenItem['query'] = keyWord ?? '';
          item.listenItem['bgmSource'] = 4;
          item.listenItem.playableInfo['type'] = 1;
          item.listenItem['docType'] = 1;
        } else if (type === 'recommend') {
          item.listenItem['bgmSource'] = 2;
          item.listenItem.playableInfo['type'] = 0;
          item.listenItem['docType'] = 0;
        } else {
          item.listenItem['bgmSource'] = 1;
          item.listenItem.playableInfo['type'] = 2;
          item.listenItem['docType'] = 2;
        }
        result.data?.push({
          id: item.listenItem.musicSid?.toString() ?? item?.listenItem?.playableInfo?.listenId?.toString(),
          name: item.listenItem.playableInfo?.title,
          authorName: item.listenItem.playableInfo?.author,
          image: item.listenItem.playableInfo.cover,
          url: item.listenItem.url,
          duration: item.listenItem.playableInfo.duration,
          raw: item.listenItem,
        });
      }
      if (page * size < musicRes.data.totalCount) {
        result.nextPage = `${page + 1}_${musicRes.data.lastBuffer}`;
      }
      if (result?.data?.length) {
        result.dataList = result.data.map((obj) => ({
          yixiaoerId: obj.id,
          yixiaoerName: obj.name,
          authorName: obj.authorName,
          playUrl: obj.url,
          duration: parseInt((obj.duration / 1000).toFixed(1)),
          raw: obj,
        }));
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
 */
export const deleteShipinhaoContent = async (cookie: string, docId: string): Promise<BaseResult> => {
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    const deleteResult = await deleteContent(cookie, docId);
    result.code = deleteResult?.errCode ?? -1;
    result.msg = deleteResult?.errMsg;
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
