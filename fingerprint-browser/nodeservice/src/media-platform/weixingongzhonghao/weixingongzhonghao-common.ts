import { BaseResult } from '../baseResult';
import { AxiosError } from 'axios';
import { errorCode } from '../errorCode';
import { getContentListAsync, getContentListFromHtmlAsync } from './weixingongzhonghao-content-list.service';
import {
  getDataOverviewAsync,
  getDataOverviewSingleListAsync,
  getSingleDataOverviewAsync,
  WeixingongzhonghaoDataOverviewItem,
  WeixingongzhonghaoDataOverviewSingleResponse,
  getArticleStatTendencyAndSourceAsync,
  getFanAnalysisAsync,
  getAccountOverviewAsync,
} from './weixingongzhonghao-data-overview.service';
import {
  getShipinhaoUserContentListResponse,
  getShipinhaoUserInfoListResponse,
  getUserHomeDataAsync,
  getUserHomeDataResponse,
  getUserIncomeAsync,
  getUserInfoAsync,
  getUserInfoListResponse,
} from './weixingongzhonghao-user.service';
import {
  ListInfoResponse,
  MediaStatusResultOutput,
  PlatformAuthorInfo,
  WeiXinGongZhongHaoCreateVoteRequest,
  DataColumn,
} from '../../media-platform';
import {
  ShipinhaoContentListInfoOutPut,
  WeiXinGongZhongHaoCreateVoteResponse,
  WeiXinGongZhongHaoUpdateVoteDetailInfo,
  WeiXinGongZhongHaoUserListOutPut,
  WeiXinGongZhongHaoVoteDetailOutPut,
  WeiXinGongZhongHaoVoteImageOutPut,
  WeiXinGongZhongHaoVoteListOutPut,
} from './weixingongzhonghao-model';
import {
  createWeixinVoteResponse,
  getWeixingongzonghaoVoteDetailResponse,
  getWeixingongzonghaoVoteListResponse,
  uploadWeixinVoteImageResponse,
  WeixingongzhonghaoVoteListBody,
} from './weixingongzhonghao-vote.service';

import { auditStatusEnum, logger, readImageData, formatNumber, formatNumberNo } from '@/utils';
import { createKuaiProxyAgent, IWebProxy, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import {
  AccountReportDataOutPut,
  AccountContentListViewOutPut,
  syncContentEventName,
  syncContentMaxPage,
} from '@/media-platform/data-service';
import {
  searchLinkMiniAppResponse,
  searchMiniAppResponse,
} from '@/media-platform/weixingongzhonghao/weixingongzhonghao-miniapp.service';
import dayjs from 'dayjs';
import { EventEmitter } from 'events';
import { Task } from '@/utils';

/**
 * 微信公众号内容列表
 * @param cookie
 * @param token 用户账号token
 * @param begin 数据起始数字 默认0
 * @param count 每页数量 默认10
 */
export const getWeixingongzhonghaoContentList = async (
  cookie: string,
  token: number,
  begin: number = 0,
  count: number = 10,
) => {
  const result: WeixingongzhonghaoContentListOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const contentListResult = await getContentListAsync(cookie, begin, count, token);

    result.code = contentListResult.base_resp.ret;
    result.msg = contentListResult.base_resp.err_msg;
    result.publish_page = contentListResult.publish_page;
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

export interface WeixingongzhonghaoContentListOutput extends BaseResult {
  publish_page?: string;
}

/**
 * 微信公众号内容分析(阅读)
 * @param cookie
 * @param token 用户账号token
 * @param begin_date 开始日期（Date）
 * @param end_date 结束日期（Date）
 */
export const getWeixingongzhonghaoDataOverview = async (
  cookie: string,
  token: number,
  begin_date: Date,
  end_date: Date,
) => {
  const result: WeixingongzhonghaoDataOverviewOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    let start_date_str = begin_date.toISOString();
    if (start_date_str.length > 0) {
      start_date_str = start_date_str.slice(0, 10);
      start_date_str = start_date_str.replaceAll('-', '');
    }

    let end_date_str = end_date.toISOString();
    if (end_date_str.length > 0) {
      end_date_str = end_date_str.slice(0, 10);
      end_date_str = end_date_str.replaceAll('-', '');
    }

    const dataOverviewResult = await getDataOverviewAsync(cookie, token, start_date_str, end_date_str);

    const filterData: Array<WeixingongzhonghaoDataOverviewItem> = dataOverviewResult.data.filter(
      (item) => item.scene === '99999999',
    );

    result.code = dataOverviewResult.base_resp.ret;
    result.msg = dataOverviewResult.base_resp.err_msg;
    result.data = filterData;
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

export interface WeixingongzhonghaoDataOverviewOutput extends BaseResult {
  data?: Array<WeixingongzhonghaoDataOverviewItem>;
}

/**
 * 微信公众号内容分析单篇数据
 * @param cookie
 * @param token 账号token
 * @param begin_date 开始日期 （Date）
 * @param end_date 结束日期 （Date）
 * @param offset 数据起始数字 默认0
 * @param size 每页数量 默认10
 * @param tmpl 数据类型 默认阅读（12：阅读，11：分享）
 */
export const getWeixingongzhonghaoDataOverviewSingleContentList = async (
  cookie: string,
  token: number,
  begin_date: Date,
  end_date: Date,
  offset: number = 0,
  size: number = 10,
  tmpl: 12 | 11 = 12,
) => {
  const result: WeixingongzhonghaoDataOverviewSingleContentListOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    let start_date_str = begin_date.toISOString();
    if (start_date_str.length > 0) {
      start_date_str = start_date_str.slice(0, 10);
      start_date_str = start_date_str.replaceAll('-', '');
    }

    let end_date_str = end_date.toISOString();
    if (end_date_str.length > 0) {
      end_date_str = end_date_str.slice(0, 10);
      end_date_str = end_date_str.replaceAll('-', '');
    }

    const dataOverviewResult = await getDataOverviewSingleListAsync(
      cookie,
      token,
      start_date_str,
      end_date_str,
      offset,
      size,
      tmpl,
    );

    result.code = dataOverviewResult.base_resp.ret;
    result.msg = dataOverviewResult.base_resp.err_msg;
    result.data = dataOverviewResult.data;
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

export interface WeixingongzhonghaoDataOverviewSingleContentListOutput extends BaseResult {
  data?: Array<WeixingongzhonghaoDataOverviewSingleResponse>;
}

/**
 * 公众号首页数据
 * @param cookie
 * @param token 账号token
 */
export const getWeixingongzhonghaoUserHomeData = async (cookie: string, token: number) => {
  const result: WeixingongzhonghaoUserHomeDataOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    const dataOverviewResult = await getUserHomeDataAsync(cookie, token);

    result.code = dataOverviewResult.base_resp.ret;
    result.msg = dataOverviewResult.base_resp.err_msg;
    result.fans = dataOverviewResult.fans;
    result.totalContents = dataOverviewResult.totalContents;
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

export interface WeixingongzhonghaoUserHomeDataOutput extends BaseResult {
  fans?: string | null;
  totalContents?: string | null;
}

/**
 * 微信公众号基本信息
 * @param cookie
 * @param proxy
 */
export const getWeixingongzhonghaoUserInfo = async (
  cookie: string,
  proxy?: IWebProxy,
): Promise<WeixingongzhonghaoUserInfoOutput> => {
  const result: WeixingongzhonghaoUserInfoOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    let webProxy: object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const dataOverviewResult = await getUserInfoAsync(cookie, webProxy);

    result.yixiaoerId = dataOverviewResult?.data?.author_id?.toString();
    result.yixiaoerName = dataOverviewResult?.data?.nick_name;
    result.yixiaoerImageUrl = dataOverviewResult?.data?.head_img;
    result.raw = dataOverviewResult?.data;
    result.code = dataOverviewResult.base_resp.ret;
    result.msg = dataOverviewResult.base_resp.err_msg;
    result.data = dataOverviewResult.data;
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

export interface WeixingongzhonghaoUserInfoOutput extends PlatformAuthorInfo {
  data?: {
    token: number;

    /**
     * 作者id
     */
    author_id: string;

    /**
     * 昵称
     */
    nick_name: string;

    /**
     * 头像
     */
    head_img: string;
    /**
     * 剩余群发数
     */
    can_app_msg: number;
    /**
     *
     */
    ticket: string;
    /**
     *
     */
    ticketId: string;
  };
}

/**
 * 公众号收益数据
 * @param cookie
 * @param token 公众号token
 */
export const getWeixingongzhonghaoUserIncome = async (
  cookie: string,
  token: number,
): Promise<WeixingongzhonghaoUserIncomeOutput> => {
  const result: WeixingongzhonghaoUserIncomeOutput = {
    code: 0,
    msg: 'ok',
    total_income: 0,
    last_week_income: 0,
    yesterday_income: 0,
    last_month_income: 0,
  };

  try {
    const userIncomeResult = await getUserIncomeAsync(cookie, token);

    result.code = userIncomeResult?.base_resp?.ret ? userIncomeResult?.base_resp?.ret : 0;
    result.msg = userIncomeResult?.base_resp?.err_msg ? userIncomeResult?.base_resp?.err_msg : 'ok';
    result.total_income = userIncomeResult?.total_income ? userIncomeResult?.total_income : 0;
    result.last_week_income = userIncomeResult?.last_week_income ? userIncomeResult?.last_week_income : 0;
    result.yesterday_income = userIncomeResult?.yesterday_income ? userIncomeResult?.yesterday_income : 0;
    result.last_month_income = userIncomeResult?.last_month_income ? userIncomeResult?.last_month_income : 0;
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

export interface WeixingongzhonghaoUserIncomeOutput extends BaseResult {
  total_income?: number;
  last_week_income?: number;
  yesterday_income?: number;
  last_month_income?: number;
}

/**
 * 微信公众号单篇数据
 * @param cookie
 * @param aid 作品id
 * @param publish_date 发布日期
 * @param token 账号token，来自用户信息中token
 */
export const getWeixingongzhonghaoSingleDataOverview = async (
  cookie: string,
  aid: string,
  publish_date: Date,
  token: number,
): Promise<WeixingongzhonghaoSingleDataOverviewOutput> => {
  const result: WeixingongzhonghaoSingleDataOverviewOutput = {
    code: 0,
    msg: 'ok',
  };

  try {
    let publish_date_str = publish_date.toISOString();
    if (publish_date_str.length > 0) {
      publish_date_str = publish_date_str.slice(0, 10);
    }

    const dataOverviewResult = await getSingleDataOverviewAsync(cookie, aid, publish_date_str, token);

    if (dataOverviewResult?.data && dataOverviewResult?.data?.length > 0) {
      result.code = dataOverviewResult.base_resp.ret;
      result.msg = dataOverviewResult.base_resp.err_msg;
      result.data = dataOverviewResult.data;
    } else {
      result.code = errorCode.request_error;
      result.msg = 'fail';
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

export interface WeixingongzhonghaoSingleDataOverviewOutput extends BaseResult {
  data?: Array<{
    /**
     * 日期
     */
    ref_date: string;
    scene: number;

    /**
     * 阅读人数
     */
    read_user: number;

    /**
     * 阅读数量
     */
    read_count: number;

    /**
     * 分享人数
     */
    share_user: number;

    /**
     * 分享数量
     */
    share_count: number;
  }>;
}

/**
 *
 * @param cookie
 * @param keyWord
 * @param pageNum 页码，默认首页为 1
 * @param token 账号token，来自用户信息中token
 */
export const searchWeiXinGongZhongHaoUserList = async (
  cookie: string,
  keyWord: string,
  pageNum: number = 1,
  token?: number,
): Promise<WeiXinGongZhongHaoUserListOutPut> => {
  const result: WeiXinGongZhongHaoUserListOutPut = {
    code: 0,
    msg: '',
    dataList: [],
  };
  try {
    if (!token) {
      const user = await getUserInfoAsync(cookie);
      token = user?.data?.token;
    }
    const cateData = await getUserInfoListResponse(cookie, keyWord, token, pageNum);
    if (cateData?.list?.length) {
      for (const item of cateData?.list) {
        result.dataList?.push({
          yixiaoerId: item?.fakeid,
          yixiaoerName: item?.nickname,
          yixiaoerImageUrl: item?.round_head_img,
          yixiaoerDesc: item?.signature,
          alias: item.alias,
          serviceType: item.service_type,
          verifyStatus: item.verify_status,
          raw: item,
        });
      }
    }
    result.code = cateData?.base_resp?.ret ?? -1;
    result.msg = cateData?.base_resp?.err_msg ?? '';
    if (result?.dataList && result.dataList.length >= 10) {
      result.nextPage = (pageNum + 1).toString();
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
 * 搜索视频号用户列表
 * @param cookie
 * @param keyWord
 * @param nextPage 下一页参数，来自返回值中的nextPage，首页默认为空字符串
 * @param token 账号token，来自用户信息中token
 */
export const searchWeiXinShipinhaoUserList = async (
  cookie: string,
  keyWord: string,
  nextPage: string = '',
  token?: number,
): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };
  try {
    if (!token) {
      const user = await getUserInfoAsync(cookie);
      token = user?.data?.token;
    }
    const cateData = await getShipinhaoUserInfoListResponse(cookie, keyWord, token, nextPage);
    if (cateData?.acct_list?.length) {
      for (const item of cateData?.acct_list) {
        result.dataList?.push({
          yixiaoerId: item?.username,
          yixiaoerName: item?.nickname,
          yixiaoerImageUrl: item?.head_url,
          yixiaoerDesc: item?.label,
          raw: item,
        });
      }
    }
    result.code = cateData?.base_resp?.ret ?? -1;
    result.msg = cateData?.base_resp?.err_msg ?? '';
    result.nextPage = result?.dataList?.length ? cateData.last_buff : undefined;
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
 * 搜索视频号用户列表
 * @param cookie
 * @param yixiaoerId 视频号用户id，来自"搜索视频号用户列表"接口
 * @param nextPage 下一页参数，来自返回值中的nextPage，首页默认为空字符串
 * @param token 账号token，来自用户信息中token
 * @param keyWord
 */
export const getWeiXinShipinhaoUserContentList = async (
  cookie: string,
  yixiaoerId: string,
  nextPage: string = '',
  token?: number,
  keyWord?: string,
): Promise<ShipinhaoContentListInfoOutPut> => {
  const result: ShipinhaoContentListInfoOutPut = {
    code: 0,
    msg: '',
    dataList: [],
  };
  try {
    if (!token) {
      const user = await getUserInfoAsync(cookie);
      token = user?.data?.token;
    }
    const cateData = await getShipinhaoUserContentListResponse(cookie, yixiaoerId, token, nextPage, keyWord);
    if (cateData?.list?.length) {
      for (const item of cateData?.list) {
        result.dataList?.push({
          yixiaoerId: item?.export_id,
          yixiaoerName: item?.desc,
          yixiaoerImageUrl: item?.media[0]?.cover_url ? item?.media[0].cover_url : item?.media[0]?.thumb_url,
          yixiaoerDesc: item?.desc,
          authorId: item.username,
          authorLogo: item?.head_url,
          authorName: item.nickname,
          nonceId: item.nonce_id,
          videoHeight: item.media[0].height,
          videoWidth: item.media[0].width,
          authLogo: item.auth_info?.auth_icon_url,
          raw: item,
        });
      }
    }
    result.code = cateData?.base_resp?.ret ?? -1;
    result.msg = cateData?.base_resp?.err_msg ?? '';
    result.nextPage = result?.dataList?.length ? cateData.last_buff : undefined;
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
 * 创建并发布投票
 * @param cookie
 * @param voteData 投票数据体
 * @param token 用户信息接口中的token
 */
export const createWeiXinGongZhongHaoVote = async (
  cookie: string,
  voteData: WeiXinGongZhongHaoCreateVoteRequest,
  token?: number,
): Promise<WeiXinGongZhongHaoCreateVoteResponse> => {
  const result: WeiXinGongZhongHaoCreateVoteResponse = {
    code: 0,
    msg: '',
  };
  try {
    if (!token) {
      const user = await getUserInfoAsync(cookie);
      token = user?.data?.token;
    }

    const postDataStr = JSON.stringify(voteData);

    const cateData = await createWeixinVoteResponse(cookie, postDataStr, token);
    result.code = cateData?.base_resp?.ret ?? -1;
    result.msg = cateData?.base_resp?.err_msg ?? '';
    result.voteId = cateData?.super_vote_id;
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
 * @param token
 * @param pageNum
 */
export const getWeiXinGongZhongHaoVoteList = async (
  cookie: string,
  token?: number,
  pageNum: number = 1,
): Promise<WeiXinGongZhongHaoVoteListOutPut> => {
  const result: WeiXinGongZhongHaoVoteListOutPut = {
    code: 0,
    msg: '',
    dataList: [],
  };
  try {
    if (!token) {
      const user = await getUserInfoAsync(cookie);
      token = user?.data?.token;
    }
    const cateData = await getWeixingongzonghaoVoteListResponse(cookie, token, pageNum);
    if (cateData?.base_resp?.ret === 0 && cateData.data) {
      const voteList: WeixingongzhonghaoVoteListBody = JSON.parse(cateData.data);
      for (const item of voteList.super_vote_info) {
        result.dataList?.push({
          yixiaoerId: item?.super_vote_id.toString(),
          yixiaoerName: item?.title,
          votePerson: item.person_count,
          viewNum: item.person_count,
          expire: item.expire_time,
          raw: item,
        });
      }
    }
    result.code = cateData?.base_resp?.ret ?? -1;
    result.msg = cateData?.base_resp?.err_msg ?? '';
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
 * @param voteId 创建投票返回的voteId，投票列表中的yixiaoerId或voteId
 * @param token
 */
export const getWeiXinGongZhongHaoVoteDetail = async (
  cookie: string,
  voteId: string,
  token?: number,
): Promise<WeiXinGongZhongHaoVoteDetailOutPut> => {
  const result: WeiXinGongZhongHaoVoteDetailOutPut = {
    code: 0,
    msg: '',
  };
  try {
    if (!token) {
      const user = await getUserInfoAsync(cookie);
      token = user?.data?.token;
    }
    const cateData = await getWeixingongzonghaoVoteDetailResponse(cookie, voteId, token);
    if (cateData?.base_resp?.ret === 0 && cateData.data) {
      const voteDetail: WeiXinGongZhongHaoUpdateVoteDetailInfo = JSON.parse(cateData.data);
      voteDetail.id = voteId;
      result.data = voteDetail;
    }
    result.code = cateData?.base_resp?.ret ?? -1;
    result.msg = cateData?.base_resp?.err_msg ?? '';
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
 * 创建投票时，上传图片
 * @param cookie
 * @param imageUrlOrPath 图片url或者本地路径
 * @param ticketId 用户信息接口返回的ticketId
 * @param ticket 用户信息接口返回的ticket
 * @param userToken 用户信息接口返回的token
 */
export const uploadWeiXinGongZhongHaoVoteImage = async (
  cookie: string,
  imageUrlOrPath: string,
  ticketId: string,
  ticket: string,
  userToken: number,
): Promise<WeiXinGongZhongHaoVoteImageOutPut | null | undefined> => {
  const result: WeiXinGongZhongHaoVoteImageOutPut = {
    code: 0,
    msg: '',
  };

  try {
    if (!userToken || !ticket || !ticketId) {
      const user = await getUserInfoAsync(cookie);
      if (user?.data?.token) {
        userToken = user.data.token;
        ticket = user.data.ticket;
        ticketId = user.data.ticketId;
      } else {
        result.code = user?.base_resp?.ret ?? -1;
        result.msg = user?.base_resp?.err_msg ?? '';
      }
    }

    //失败后进行下载上传
    const imageData = await readImageData(imageUrlOrPath, 'jpeg');
    if (!imageData?.data) {
      logger.error(`图片读取失败:${imageUrlOrPath}-${imageData.status}`);
      result.code = -1;
      result.msg = '图片读取失败' + imageData?.status;
    } else {
      const imageInfo = await uploadWeixinVoteImageResponse(
        cookie,
        imageData.data,
        ticketId,
        ticket,
        userToken,
        imageData.ext,
        imageData.fileName,
      );
      if (imageInfo?.cdn_url) {
        result.imgUrl = imageInfo.cdn_url;
        return result;
      } else {
        logger.error(`图片上传失败:${imageUrlOrPath}-${imageInfo?.base_resp?.err_msg ?? '网络异常'}`);
        result.msg = imageInfo?.base_resp?.err_msg;
        result.code = imageInfo?.base_resp?.ret ?? -1;
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
 * 查询文章状态
 * @param cookie
 * @param publishIdPre
 * @param userToken
 * @param maxPage
 */
export const getGongZhongHaoArticleStatus = async (
  cookie: string,
  publishIdPre: string,
  userToken: number = 0,
  maxPage: number = 10,
): Promise<MediaStatusResultOutput> => {
  const result: MediaStatusResultOutput = {
    code: 0,
    msg: '',
    publishId: publishIdPre,
  };
  try {
    let geted = false;
    const publishId = publishIdPre?.split('_')[0];
    if (!userToken) {
      const user = await getUserInfoAsync(cookie);
      userToken = user.data.token ?? 0;
    }

    try {
      const homeData = await getUserHomeDataResponse(cookie, userToken);
      const preStr = homeData?.split('timesend_msg : ')[1]?.split('}",')[0] + '}"';
      if (preStr?.length > 100) {
        const preJo = JSON.parse(JSON.parse(preStr));
        const list = preJo['sent_list'];
        for (const item of list) {
          const msgs = item['appmsg_info'] as Array<AppMsgInfo>;
          const findId = item['copy_appmsg_id']?.toString();
          if (findId == publishId && msgs?.length) {
            result.auditStatus = auditStatusEnum.prePublish;
            result.create_time = item['sent_info']['time'] * 1000;
            result.openUrls = [];
            for (const content of msgs) {
              result.openUrls.push({
                openUrl: content.content_url,
                cover: content.cover,
                title: content.title,
                documentId: `${findId}_${content.itemidx}`,
              });
            }
            return result;
          }
        }
      }
    } catch (e) {}

    let contentList: WeixingongzhonghaoContentListOutput | undefined = undefined;
    for (let i = 0; i < maxPage; i++) {
      contentList = await getWeixingongzhonghaoContentList(cookie, userToken, i * 10);
      if (contentList?.publish_page && contentList.code == 0) {
        const cList = JSON.parse(contentList.publish_page);
        for (const item of cList['publish_list']) {
          // if (item['publish_type'] == 1) {
          //   continue;
          // }

          const itemInfo: WechatPublishData = JSON.parse(item['publish_info']);
          const findId = itemInfo?.copy_appmsg_id?.toString();

          if (findId === publishId) {
            geted = true;

            if (
              itemInfo.publish_info?.publish_status == 200 ||
              (itemInfo?.sent_result && !itemInfo?.sent_result?.refuse_reason)
            ) {
              result.auditStatus = auditStatusEnum.published;
              //result.openUrl = itemInfo?.appmsgex[0].link ?? '';
            } else {
              result.msg = itemInfo?.sent_result?.refuse_reason
                ? itemInfo?.sent_result?.refuse_reason
                : itemInfo?.appmsg_info?.length
                ? itemInfo?.appmsg_info[0]?.audit_tips
                : '';
              result.auditStatus = auditStatusEnum.deny;
            }

            result.code = 0;
            result.data = itemInfo;
            result.create_time = itemInfo?.sent_info?.time
              ? itemInfo.sent_info.time * 1000
              : itemInfo.publish_info.create_time * 1000;

            result.openUrls = [];
            if (itemInfo?.appmsg_info?.length) {
              for (const content of itemInfo.appmsg_info) {
                result.openUrls.push({
                  openUrl: content.content_url,
                  cover: content.cover,
                  title: content.title,
                  documentId: `${findId}_${content.itemidx}`,
                });
              }
            } else {
              for (const content of itemInfo.appmsgex) {
                result.openUrls.push({
                  openUrl: content.link,
                  cover: content.cover,
                  title: content.title,
                  documentId: `${findId}_${content.itemidx}`,
                });
              }
            }

            return result;
          }
        }
        if (geted) {
          break;
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
  }
  result.code = -1;
  result.msg = '未找到作品';
  return result;
};

/**
 * 微信公众号发布信息相关接口定义
 */
interface XaCheckItem {
  /** 检查项索引 */
  idx: number;
  /** 检查状态（2 可能表示通过） */
  status: number;
  /** 检查结果码（100 可能表示正常） */
  rescode: number;
}

interface PublishInfo {
  /** 公众号账号 ID */
  bizuin: number;
  /** 消息 ID */
  msgid: number;
  /** 草稿消息 ID */
  draft_msgid: number;
  /** 发布类型（1 可能表示普通发布） */
  publish_type: number;
  /** 发布来源（1 可能表示手动发布） */
  publish_src: number;
  /** 发布状态（200 可能表示发布成功） */
  publish_status: number;
  /** 创建时间（时间戳，秒级） */
  create_time: number;
  /** 更新时间（时间戳，秒级） */
  update_time: number;
  /** 检查结果列表（可能为空） */
  check_results: [];
  /** 展示类型列表 */
  show_types: number[];
  /** 索引计数 */
  index_count: number;
  /** 小程序检查项列表 */
  xa_check_items: XaCheckItem[];
  /** 原创检查类型 */
  original_check_type: number;
  /** 普通检查结果列表（可能为空） */
  normal_check_results: [];
  /** 是否在个人主页展示（1 表示是） */
  in_profile: number;
  /** 预发布状态列表（可能为空） */
  pre_publish_status: [];
  /** 辟谣审核信息列表（可能为空） */
  refutation_audit_info: [];
}

interface AppmsgEx {
  /** 文章辅助 ID */
  aid: string;
  /** 文章标题 */
  title: string;
  /** 封面图片 URL */
  cover: string;
  /** 文章链接 */
  link: string;
  /** 文章摘要（为空） */
  digest: string;
  /** 更新时间（时间戳，秒级） */
  update_time: number;
  /** 文章消息 ID */
  appmsgid: number;
  /** 项目索引 */
  itemidx: number;
  /** 项目展示类型 */
  item_show_type: number;
  /** 作者名称（为空） */
  author_name: string;
  /** 标签 ID 列表（为空） */
  tagid: [];
  /** 创建时间（时间戳，秒级） */
  create_time: number;
  /** 是否付费订阅（0 表示否） */
  is_pay_subscribe: number;
  /** 是否有红包封面（0 表示否） */
  has_red_packet_cover: number;
  /** 专辑 ID（0 表示无） */
  album_id: string;
  /** 是否正在审核（0 表示否） */
  checking: number;
  /** 媒体时长（0:00 表示无） */
  media_duration: string;
  /** 媒体 API 发布状态（3 可能表示已发布） */
  mediaapi_publish_status: number;
  /** 版权类型（0 表示普通） */
  copyright_type: number;
  /** 文章专辑信息列表（为空） */
  appmsg_album_infos: [];
  /** 付费专辑信息 */
  pay_album_info: {
    appmsg_album_infos: [];
  };
  /** 是否删除（false 表示未删除） */
  is_deleted: boolean;
  /** 封禁标志（0 表示正常） */
  ban_flag: number;
  /** 235:1 比例封面图 URL */
  pic_cdn_url_235_1: string;
  /** 16:9 比例封面图 URL（为空） */
  pic_cdn_url_16_9: string;
  /** 3:4 比例封面图 URL（为空） */
  pic_cdn_url_3_4: string;
  /** 1:1 比例封面图 URL */
  pic_cdn_url_1_1: string;
  /** 排版信息 */
  line_info: {
    /** 是否使用排版 */
    use_line: number;
    /** 排版计数 */
    line_count: number;
    /** 是否为文章标志 */
    is_appmsg_flag: number;
    /** 是否启用标志 */
    is_use_flag: number;
  };
  /** 版权状态（0 表示无特殊版权） */
  copyright_stat: number;
  /** 是否为辟谣内容（0 表示否） */
  is_rumor_refutation: number;
  /** 是否多图封面（0 表示否） */
  multi_picture_cover: number;
  /** 分享图片信息列表（为空） */
  share_imageinfo: [];
}

/** 根对象接口 */
interface WechatPublishData {
  /** 类型（1 可能表示文章） */
  type: number;
  /** 消息 ID */
  msgid: number;
  /** 应用消息信息列表（为空） */
  appmsg_info: [AppMsgInfo];
  /** 发布信息 */
  publish_info: PublishInfo;
  sent_info: { time: number };
  /** 扩展应用消息列表 */
  appmsgex: AppmsgEx[];
  copy_appmsg_id: string;
  sent_result: {
    msg_status: number;
    refuse_reason: string;
  };
}

export interface AppMsgInfo {
  content_url: string;
  title: string;
  cover: string;
  audit_tips: string;
  itemidx: number;
  appmsgid: string;
}

export const getWeiXinGongZhongHaoMiniApp = async (
  cookie: string,
  keyWord: string,
  token?: number,
): Promise<ListInfoResponse> => {
  const result: ListInfoResponse = {
    code: 0,
    msg: '',
    dataList: [],
  };
  try {
    if (!keyWord) {
      result.code = 400;
      result.msg = '搜索关键词/链接不能为空';
      return result;
    }
    if (!token) {
      const user = await getUserInfoAsync(cookie);
      token = user?.data?.token;
    }
    if (keyWord?.includes('小程序://')) {
      const re = await searchLinkMiniAppResponse(cookie, keyWord, token);
      if (re?.weapp?.appid) {
        result.dataList?.push({ yixiaoerId: re.weapp.appid, yixiaoerName: re.weapp.nickname, raw: re.weapp });
      }
      result.code = re?.base_resp?.ret ?? -1;
      result.msg = re?.base_resp?.err_msg;
      return result;
    } else {
      const re = await searchMiniAppResponse(cookie, keyWord, token);
      if (re?.items?.length && re.items[0]?.weapp?.appid) {
        for (const item of re.items) {
          if (item?.weapp?.appid) {
            result.dataList?.push({ yixiaoerId: item.weapp.appid, yixiaoerName: item.weapp.nickname, raw: item.weapp });
          }
        }
      }
      result.code = re?.base_resp?.ret ?? -1;
      result.msg = re?.base_resp?.err_msg;
      return result;
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
 * 微信公众号账号30天概览数据
 * @param cookie
 * @param proxy
 * @param token 账号token，来自用户信息中token
 * @param fingerprint 指纹参数
 */
export const getWeiXinGongZhongHaoOverViewDashboard = async (
  cookie: string,
  proxy?: KuaiDaiLiProxy,
  token?: number,
  fingerprint: string = '',
): Promise<AccountReportDataOutPut> => {
  const result: AccountReportDataOutPut = {
    code: 0,
    msg: '',
    data: [],
  };

  const names = [
    { name: '总用户数', key: 'totalFansCount' },
    { name: '阅读数', key: 'playCount' },
    { name: '分享数', key: 'shareCount' },
    { name: '收藏数', key: 'collectCount' },
    { name: '点赞数', key: 'greatCount' },
    { name: '推荐数', key: 'recommendCount' },
    { name: '留言数', key: 'commentCount' },
    { name: '净增关注', key: 'netFansCount' },
  ];

  try {
    if (!token) {
      const user = await getUserInfoAsync(cookie);
      token = user?.data?.token;
      if (!token) {
        result.code = user?.base_resp?.ret ?? -1;
        result.msg = user?.base_resp?.err_msg ?? '获取token失败';
        return result;
      }
    }
    let webProxy;
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

    // 获取总用户数（粉丝数）
    const fansData = await getUserHomeDataAsync(cookie, token, webProxy);
    if (fansData?.fans) {
      const fansCount = parseInt(fansData.fans.replace(/,/g, '')) || 0;
      result.data?.push({
        name: '总用户数',
        key: 'totalFansCount',
        value: formatNumber(fansCount),
        list: [],
      });
      newOverView.all.overview['totalFansCount'] = formatNumberNo(fansCount);
    } else {
      result.code = fansData?.base_resp?.ret ?? -1;
      result.msg = fansData?.base_resp?.err_msg ?? '';
      return result;
    }

    // 计算30天前的日期
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const endTimestamp = Math.floor(endDate.getTime() / 1000);
    const startTimestamp = Math.floor(startDate.getTime() / 1000);

    // 获取30天的阅读、分享、收藏数据
    const articleStatData = await getArticleStatTendencyAndSourceAsync(
      cookie,
      token.toString(),
      startTimestamp,
      endTimestamp,
      fingerprint,
      webProxy,
    );

    if (articleStatData?.base_resp?.ret === 0 && articleStatData?.all_article_stat_tendency?.list) {
      const tendencyList = articleStatData.all_article_stat_tendency.list;

      // 过滤出总计数据（scene: 9999）
      const totalData = tendencyList.filter((item) => item.scene === 9999);

      // 计算总阅读数
      const totalReadUv = totalData.reduce((sum, item) => sum + (item.read_uv || 0), 0);
      if (totalData.length > 0) {
        const dataItem: DataColumn = {
          name: '阅读数',
          key: 'playCount',
          value: formatNumber(totalReadUv),
          list: [],
        };
        result.data?.push(dataItem);
        newOverView.all.overview[dataItem.key] = formatNumberNo(totalReadUv);
        for (const item of totalData) {
          dataItem.list.push({ date: item.date, value: item.read_uv });
        }
        newOverView.all.thirtydays[dataItem.key] = dataItem.list;
      }

      // 计算总分享数
      const totalShareUv = totalData.reduce((sum, item) => sum + (item.share_uv || 0), 0);
      if (totalData.length > 0) {
        const dataItem: DataColumn = {
          name: '分享数',
          key: 'shareCount',
          value: formatNumber(totalShareUv),
          list: [],
        };
        result.data?.push(dataItem);
        newOverView.all.overview[dataItem.key] = formatNumberNo(totalShareUv);
        for (const item of totalData) {
          dataItem.list.push({ date: item.date, value: item.share_uv });
        }
        newOverView.all.thirtydays[dataItem.key] = dataItem.list;
      }

      // 计算总收藏数
      const totalCollectionUv = totalData.reduce((sum, item) => sum + (item.collection_uv || 0), 0);
      if (totalData.length > 0) {
        const dataItem: DataColumn = {
          name: '收藏数',
          key: 'collectCount',
          value: formatNumber(totalCollectionUv),
          list: [],
        };
        result.data?.push(dataItem);
        newOverView.all.overview[dataItem.key] = formatNumberNo(totalCollectionUv);
        for (const item of totalData) {
          dataItem.list.push({ date: item.date, value: item.collection_uv || 0 });
        }
        newOverView.all.thirtydays[dataItem.key] = dataItem.list;
      }
    } else {
      result.code = articleStatData?.base_resp?.ret ?? -1;
      result.msg = articleStatData?.base_resp?.err_msg ?? '获取文章统计数据失败';
    }

    // 获取点赞、推荐、留言数据
    const accountOverviewData = await getAccountOverviewAsync(cookie, token.toString(), webProxy);
    if (accountOverviewData?.base_resp?.ret === 0) {
      // 点赞数（近30天）
      const dataItem1: DataColumn = {
        name: '点赞数',
        key: 'greatCount',
        value: formatNumber(accountOverviewData.like_count),
        list: [],
      };
      result.data?.push(dataItem1);
      newOverView.all.overview[dataItem1.key] = formatNumberNo(accountOverviewData.like_count);
      // 注意：这个接口不提供30天的list数据，只有总数
      //newOverView.all.thirtydays[dataItem1.key] = dataItem1.list;

      // 推荐数（在看数，近30天）
      const dataItem2: DataColumn = {
        name: '推荐数',
        key: 'recommendCount',
        value: formatNumber(accountOverviewData.zaikan_count),
        list: [],
      };
      result.data?.push(dataItem2);
      newOverView.all.overview[dataItem2.key] = formatNumberNo(accountOverviewData.zaikan_count);
      //newOverView.all.thirtydays[dataItem2.key] = dataItem2.list;

      // 留言数（近30天）
      const dataItem3: DataColumn = {
        name: '留言数',
        key: 'commentCount',
        value: formatNumber(accountOverviewData.comment_count),
        list: [],
      };
      result.data?.push(dataItem3);
      newOverView.all.overview[dataItem3.key] = formatNumberNo(accountOverviewData.comment_count);
      //newOverView.all.thirtydays[dataItem3.key] = dataItem3.list;
    }

    // 获取粉丝分析数据（净增关注）
    const startDateStr = startDate.toISOString().slice(0, 10);
    const endDateStr = endDate.toISOString().slice(0, 10);

    const fanAnalysisData = await getFanAnalysisAsync(
      cookie,
      token.toString(),
      startDateStr,
      endDateStr,
      99999999,
      fingerprint,
      webProxy,
    );

    if (fanAnalysisData?.base_resp?.ret === 0 && fanAnalysisData?.category_list?.length > 0) {
      // 找到总计数据（user_source: 99999999）
      const totalCategory = fanAnalysisData.category_list.find((cat) => cat.user_source === 99999999);
      if (totalCategory && totalCategory.list && totalCategory.list.length > 0) {
        const totalNetGain = totalCategory.list.reduce((sum, item) => sum + (item.netgain_user || 0), 0);
        const dataItem: DataColumn = {
          name: '净增关注',
          key: 'netFansCount',
          value: formatNumber(totalNetGain),
          list: [],
        };
        result.data?.push(dataItem);
        newOverView.all.overview[dataItem.key] = formatNumberNo(totalNetGain);
        for (const item of totalCategory.list) {
          // 将日期字符串转换为时间戳
          const dateTimestamp = new Date(item.date).getTime();
          dataItem.list.push({ date: dateTimestamp, value: item.netgain_user });
        }
        newOverView.all.thirtydays[dataItem.key] = dataItem.list;
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

  // 按照names顺序重新排列数据
  const dataList = result.data ?? [];
  result.data = [];
  for (const { name, key } of names) {
    const tmp = dataList.find((item) => item.name === name);
    result.data.push(tmp ?? { name: name, key: key, value: '-', list: [] });
  }

  return result;
};

/**
 * 获取微信公众号指定天数内的作品数据
 * @param cookie
 * @param token 账号token，来自用户信息中token
 * @param eventCallBack 事件回调
 * @param days 天数，默认7天
 * @param maxCount 最大数量，默认20条
 * @param isHeader 是否只返回表头
 * @param proxy 代理配置
 */
export const getWeixingongzhonghaoContentListView = async (
  cookie: string,
  token: string,
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
      { name: '点赞', key: 'great' },
      { name: '分享', key: 'share' },
      { name: '推荐', key: 'reCommand' },
      { name: '留言', key: 'comment' },
    ];

    if (isHeader) {
      return result;
    }

    let webProxy;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    if (!token) {
      const user = await getUserInfoAsync(cookie);
      token = user?.data?.token?.toString();
      if (!token) {
        result.code = user?.base_resp?.ret ?? -1;
        result.msg = user?.base_resp?.err_msg ?? '获取token失败';
        return result;
      }
    }

    let contentTmpId = '';
    for (let i = 0; i < syncContentMaxPage; i++) {
      const contentList = await getContentListFromHtmlAsync(cookie, i * 10, 10, token, webProxy);

      if (contentList?.publish_list?.length) {
        // 检查是否重复
        const firstItemInfo = contentList.publish_list[0].publish_info;
        const firstId = typeof firstItemInfo === 'string' ? '' : firstItemInfo?.copy_appmsg_id?.toString();

        if (firstId === contentTmpId) {
          break;
        } else {
          contentTmpId = firstId;
        }

        let j = 0;
        for (const item of contentList.publish_list) {
          j++;

          // 跳过非发布类型
          if (item.publish_type !== 101) {
            // continue;
          }

          const publishInfo = item.publish_info;
          if (typeof publishInfo === 'string') {
            continue;
          }

          // 检查是否有文章信息
          if (!publishInfo?.appmsg_info?.length) {
            continue;
          }

          // 获取发布时间
          const publishTime = publishInfo.sent_info?.time
            ? publishInfo.sent_info.time * 1000
            : (publishInfo.publish_info?.create_time ?? 0) * 1000;
          const date = new Date(publishTime);

          // 检查时间范围
          if (lastDate > date || result.data.length >= maxCount) {
            if (j <= 3) {
              continue;
            }
            eventCallBack?.emit(syncContentEventName, { ...result });
            return result;
          }

          const dateStr = dayjs(date).format('YYYY-MM-DD HH:mm:ss');

          // 遍历每篇文章
          for (const article of publishInfo.appmsg_info) {
            // 跳过已删除的文章
            if (article.is_deleted) {
              continue;
            }

            const articleId = `${publishInfo.copy_appmsg_id}_${article.itemidx}`;

            result.data.push({
              id: articleId,
              cover: article.cover || article.pic_cdn_url_235_1 || '',
              type: article.videoid ? 'video' : 'article', // 微信公众号主要是图文
              title: article.title || '',
              date: dateStr,
              read: formatNumber(article.read_num || 0),
              great: formatNumber(article.old_like_num || 0),
              share: formatNumber(article.share_num || 0),
              reCommand: formatNumber(article.like_num || 0), // 在看数
              comment: formatNumber(article.comment_num || 0),
              pageUrl: article.content_url || '',
            });

            result.dataList.push({
              id: articleId,
              cover: article.cover || article.pic_cdn_url_235_1 || '',
              type: 'article',
              title: article.title || '',
              date: dateStr,
              read: formatNumberNo(article.read_num || 0),
              great: formatNumberNo(article.old_like_num || 0),
              share: formatNumberNo(article.share_num || 0),
              reCommand: formatNumberNo(article.like_num || 0),
              comment: formatNumberNo(article.comment_num || 0),
              pageUrl: article.content_url || '',
            });

            if (result.data.length >= maxCount) {
              eventCallBack?.emit(syncContentEventName, { ...result });
              return result;
            }
          }
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
          result.code = -1;
          result.msg = '未获取到内容列表';
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
