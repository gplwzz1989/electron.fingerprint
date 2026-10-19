import { BaseResult } from '../baseResult';
import { getTicketCoookie, getUserInfo } from './xiaohongshushop-base.service';
import { AxiosError } from 'axios';
import { getFriendListResponse, XiaohongshushopFriendInfo } from './xiaohongshushop-friend.service';
import { getLocationListResponse, XiaohongshushopLocationInfo } from './xiaohongshushop-location.service';
import { getTopicListResponse, XiaohongshushopTopicInfo } from './xiaohongshushop-topic.service';
import { auditStatusEnum } from '../../utils';
import {
  getContentListAsync,
  XiaohongshuContentListResponse,
  XiaohongshushopMediaContent,
} from './xiaohongshushop-content-list.service';
import { errorCode } from '../errorCode';
import {
  getXiaohongshuPubGoodsResponse,
  getXiaohongshuShowGoodsResponse,
  XiaohongshushopPubGoodsInfo,
  XiaohongshushopShowGoodsInfo,
} from '../xiaohongshushop/xiaohongshushop-goods.service';
import { AuditResult, ListGoodsInfoResponse, ListLocationInfoResponse, PlatformAuthorInfo } from '@/media-platform';
import { createKuaiProxyAgent, IWebProxy, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 获取小红书创作者信息
 * @param cookie
 * @param proxy
 */
export const getXiaohongshushopUserInfo = async (
  cookie: string,
  proxy?: IWebProxy,
): Promise<XiaohongshushopUserInfoResultOutput> => {
  const result: XiaohongshushopUserInfoResultOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const userInfoResult = await getUserInfo(cookie, webProxy);

    result.yixiaoerId = userInfoResult?.data?.user_id?.toString();
    result.yixiaoerName = userInfoResult?.data?.user_name;
    result.yixiaoerImageUrl = userInfoResult?.data?.seller_image;
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
  }

  return result;
};

export interface XiaohongshushopUserInfoResultOutput extends PlatformAuthorInfo {
  /**
   * 状态码 0:正常，非0异常，-100:登录失效
   */
  code: number;
  /**
   * 数据体
   */
  data?: {
    /**
     * 用户头像
     */
    seller_image: string;
    /**
     * 用户昵称/店铺名称
     */
    seller_name: string;
    account_type: string;
    user_email: string;
    createTime: string;
    brand_white_user: boolean;
    /**
     * 账号角色
     */
    role: string;
    config_values: {
      /**
       * 是否绑定微信
       */
      wechat_erqing: string;
      /**
       * 店铺星际
       */
      shopStar: string;
      alipay_smid: string;
      alipay_erqing: string;
      set_cs_mode: '';
      wechat_smid: string;
      self_cs_on: string;
      shopScore: string;
      self_pre_cs: string;
    };
    use_logistics_plan: boolean;
    can_apply_customs: boolean;
    member_price_enable: boolean;
    main_category_ids: Array<string>;
    name: string;
    /**
     * 用户id
     */
    seller_id: string;
    user_name: string;
    can_seller_all_brands: boolean;
    email: string;
    /**
     * 店铺类型
     */
    seller_type: number;
    trade_mode: number;
    /**
     * 公司名称
     */
    company_name: string;
    declaration_mode: string;
    deactivated: boolean;
    sns_user_id: string;
    /**
     * 用户id
     */
    user_id: string;
    brand_ids: Array<string>;
    brief: string;
    /**
     * 账号状态
     */
    state: number;
    /**
     *
     */
    avatar: {
      height: number;
      link: string;
      path: string;
      width: number;
    };
    is_official: boolean;
    single_branded: boolean;
    brand_score: number;
    /**
     * 经营类目id列表
     */
    category_ids: Array<string>;
  };
}

/**
 * 获取好友/用户列表数据
 * @param cookie
 * @param keyWord 搜索关键词
 * @param pageNum 翻页页码，默认1
 */
export const getXiaohongshushopFriendList = async (
  cookie: string,
  keyWord: string,
  pageNum: number = 1,
): Promise<XiaohongshushopFriendListResultOutput> => {
  const result: XiaohongshushopFriendListResultOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const friendResult = await getFriendListResponse(cookie, keyWord ?? '', pageNum);

    result.code = friendResult.code;
    result.msg = friendResult.msg;
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

export interface XiaohongshushopFriendListResultOutput extends BaseResult {
  data?: {
    /**
     * 用户列表
     */
    user_info_dtos: [
      {
        /**
         * 用户详细信息
         */
        user_base_dto: XiaohongshushopFriendInfo;
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
export const getXiaohongshushopLocationList = async (
  cookie: string,
  keyWord: string,
  pageNum: number = 1,
  proxy?: KuaiDaiLiProxy,
): Promise<XiaohongshushopLocationListResultOutput> => {
  const result: XiaohongshushopLocationListResultOutput = {
    code: 0,
    msg: 'ok',
    dataList: [],
  };

  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const locationResult = await getLocationListResponse(cookie, keyWord ?? '', pageNum, webProxy);

    result.code = locationResult.code;
    result.msg = locationResult.msg;
    if (locationResult.data?.length) {
      locationResult.data.forEach(
        (item) =>
          result.dataList?.push({
            yixiaoerId: item.poiOid,
            yixiaoerName: item.name,
            yixiaoerDesc: item.subname,
            raw: item,
          }),
      );
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

export interface XiaohongshushopLocationListResultOutput extends ListLocationInfoResponse {}

/**
 * 获取小红书话题列表信息
 * @param cookie
 * @param keyWord 搜索关键词
 * @param pageNum 翻页页码，默认首页1
 */
export const getXiaohongshushopTopicList = async (
  cookie: string,
  keyWord: string,
  pageNum: number = 1,
): Promise<XiaohongshushopTopicListResultOutput> => {
  const result: XiaohongshushopTopicListResultOutput = {
    code: 0,
    msg: 'ok',
  };
  try {
    const topicResult = await getTopicListResponse(cookie, keyWord ?? '', pageNum);

    result.code = topicResult.code;
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

export interface XiaohongshushopTopicListResultOutput extends BaseResult {
  /**
   * 话题数据
   */
  data?: {
    /**
     * 话题列表
     */
    topic_info_dtos: Array<XiaohongshushopTopicInfo>;
  };
}

/**
 * 查询作品的审核状态
 * @param cookie
 * @param publishId  发布产生的唯一publishId
 * @param maxPage 最大翻页数，超出后不再继续查询，默认10页
 */
export const getXiaohongshushopMediaStatus = async (
  cookie: string,
  publishId: string,
  maxPage: number = 10,
): Promise<XiaohongshushopMediaStatusResultOutput> => {
  const result: XiaohongshushopMediaStatusResultOutput = {
    code: 0,
    msg: 'ok',
    publishId: publishId,
  };

  try {
    if (!maxPage) {
      maxPage = 1;
    }
    cookie = await getTicketCoookie(cookie);
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
            if (mediaStatus == 1) {
              result.auditStatus = auditStatusEnum.published;
              result.openUrl = `https://www.xiaohongshu.com/explore/${publishId}?xsec_token=${encodeURIComponent(
                content.xsec_token,
              )}&xsec_source=${encodeURIComponent(content.xsec_source)}`;
            } else if (mediaStatus == 3) {
              result.auditStatus = auditStatusEnum.deny;
            } else if (mediaStatus == 4) {
              result.auditStatus = auditStatusEnum.prePublish;
            } else if (mediaStatus == 2) {
              result.auditStatus = auditStatusEnum.inAudit;
            } else {
              result.auditStatus = auditStatusEnum.inAudit;
            }

            return result;
          }
        }
      } else {
        result.code = contentList?.code ?? contentList?.result ?? -1;
        result.msg = '未找到作品';
        return result;
      }
    }
    result.code = contentList?.code ?? contentList?.result ?? -1;
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

export interface XiaohongshushopMediaStatusResultOutput extends AuditResult {
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
   * 视频信息
   */
  data?: XiaohongshushopMediaContent;
}

/**
 * 小红书笔记管理
 * @param cookie
 * @param tab 类型（0全部，1已发布，2审核中，3未通过）
 * @param pageNum 翻页页码，默认首页为0 -1为最后一页
 */
export const getXiaohongshushopContentList = async (
  cookie: string,
  tab: number,
  pageNum: number = 0,
): Promise<XiaohongshushopContentListOutput> => {
  const result: XiaohongshushopContentListOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const contentListResult = await getContentListAsync(cookie, tab, pageNum);
    result.code = contentListResult?.result;
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

/**
 * 获取商品列表信息，第一层
 * @param cookie
 * @param keyWord 搜索关键词
 * @param pageNum 翻页页码，默认首页为1，翻页累加1
 */
export const getXiaohongshushopFirstGoods = async (
  cookie: string,
  keyWord: string = '',
  pageNum: number = 1,
): Promise<ListGoodsInfoResponse> => {
  const result: ListGoodsInfoResponse = {
    code: 0,
    msg: 'ok',
    dataList: [],
  };

  if (!pageNum) {
    pageNum = 1;
  }
  try {
    const goodsResult = await getXiaohongshuShowGoodsResponse(cookie, keyWord ?? '', pageNum);
    result.code = goodsResult?.code ?? errorCode.data_error;
    result.msg = goodsResult.msg;
    if (goodsResult?.data?.data?.length) {
      if (goodsResult?.data?.result?.end_tag != 1) {
        result.nextPage =(pageNum+1).toString();
      }
      for (const item of goodsResult?.data?.data) {
        result.dataList?.push({
          yixiaoerId: item.goods_info?.item_id,
          yixiaoerName: item.goods_info?.name,
          yixiaoerImageUrl: item.goods_info.image,
          price: item.goods_info.purchase_price,
          count: item.goods_info.inventory,
          yixiaoerDesc: item.goods_info.variants,
          raw: item.goods_info,
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
 *获取商品信息列表第第二级（一级商品的详情型号款式列表）
 * @param cookie
 * @param goodsId 一级商品id
 */
export const getXiaohongshushopSecondGoods = async (
  cookie: string,
  goodsId: string,
): Promise<XiaohongshuPubGoodsOutput> => {
  const result: XiaohongshuPubGoodsOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const goodsResult = await getXiaohongshuPubGoodsResponse(cookie, goodsId);
    result.code = goodsResult?.code ?? errorCode.data_error;
    result.msg = goodsResult.msg;
    result.data = goodsResult.data;
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

export interface XiaohongshushopContentListOutput extends BaseResult {
  data?: {
    notes: Array<XiaohongshushopMediaContent>;
    page: number;
  };

  raw?: unknown;
}

export interface XiaohongshushopShowGoodsOutput extends BaseResult {
  data?: Array<{
    goods_info: XiaohongshushopShowGoodsInfo;
  }>;
}

export interface XiaohongshuPubGoodsOutput extends BaseResult {
  data?: {
    goods_all_variant: {
      content: Array<XiaohongshushopPubGoodsInfo>;
    };
  };
}
