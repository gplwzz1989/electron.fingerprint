import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';

/**
 * 微信公众号内容分析单篇数据
 * @param cookie
 * @param token
 * @param begin_date
 * @param end_date
 * @param offset
 * @param size
 * @param tmpl
 * */
export const getDataOverviewSingleListAsync = async (
  cookie: string,
  token: number,
  begin_date: string,
  end_date: string,
  offset: number,
  size: number,
  tmpl: 12 | 11 = 12,
): Promise<WeixingongzhonghaoDataOverviewSingleContentListResponse> => {
  const url: string = 'https://mp.weixin.qq.com/misc/datacubequery';
  const referer = 'https://mp.weixin.qq.com/misc/appmsganalysis?action=query';

  const headers = {
    cookie: cookie,
    referer: referer,
    authority: 'mp.weixin.qq.com',
    'x-requested-with': 'XMLHttpRequest',
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
  };

  const postData = {
    busi: 5,
    tmpl: tmpl,
    action: 'query',
    token: token,
    args: JSON.stringify({ scene: 99999999, begin_date: begin_date, end_date: end_date, offset: offset, size: size }),
    lang: 'zh_CN',
    f: 'json',
    ajax: 1,
  };

  const result = await $http.post<never, AxiosResponse<WeixingongzhonghaoDataOverviewSingleContentListResponse>>(
    url,
    postData,
    {
      headers: headers,
    },
  );

  if (result.data.base_resp.ret !== 0) {
    throw new BadRequestException(result.data.base_resp.err_msg, result.data.base_resp.ret, result.data);
  }

  return result.data;
};

/**
 * 微信公众号内容分析
 * @param cookie
 * @param token
 * @param begin_date
 * @param end_date
 */
export const getDataOverviewAsync = async (
  cookie: string,
  token: number,
  begin_date: string,
  end_date: string,
): Promise<WeixingongzhonghaoDataOverviewResponse> => {
  const url: string = 'https://mp.weixin.qq.com/misc/datacubequery';
  const referer = 'https://mp.weixin.qq.com/misc/appmsganalysis?action=report&token=' + token + '&lang=zh_CN';

  const headers = {
    cookie: cookie,
    referer: referer,
    authority: 'mp.weixin.qq.com',
    'x-requested-with': 'XMLHttpRequest',
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
  };

  const postData = {
    busi: 3,
    tmpl: 2,
    action: 'query',
    token: token,
    args: JSON.stringify({ begin_date: begin_date, end_date: end_date }),
    lang: 'zh_CN',
    f: 'json',
    ajax: 1,
  };

  const result = await $http.post<never, AxiosResponse<WeixingongzhonghaoDataOverviewResponse>>(url, postData, {
    headers: headers,
  });

  if (result.data.base_resp.ret !== 0) {
    throw new BadRequestException(result.data.base_resp.err_msg, result.data.base_resp.ret, result.data);
  }

  return result.data;
};

export interface WeixingongzhonghaoDataOverviewSingleResponse {
  idx: string;

  /**
   * 作品id
   */
  msgid: string;

  /**
   * 发表时间
   */
  post_ds: string;

  /**
   * 对应数据
   */
  pv: string;

  /**
   * 近14天相关数据
   */
  pv_list: string;
  /**
   * 占比
   */
  pv_ratio: string;
  /**
   * 标题
   */
  title: string;
}

export interface WeixingongzhonghaoDataOverviewSingleContentListResponse {
  base_resp: {
    err_msg: string;
    ret: number;
  };
  data: Array<WeixingongzhonghaoDataOverviewSingleResponse>;
  delay: boolean;
}

export interface WeixingongzhonghaoDataOverviewItem {
  mass_pv: string;
  mass_uv: string;

  /**
   * 阅读次数
   */
  read_pv: string;

  /**
   * 阅读人数
   */
  read_uv: string;

  /**
   * 日期
   */
  refdate: string;
  scene: string;
}

export interface WeixingongzhonghaoDataOverviewResponse {
  base_resp: {
    err_msg: string;
    ret: number;
  };
  data: Array<WeixingongzhonghaoDataOverviewItem>;
  delay: boolean;
}

/**
 * 微信公众号单篇数据
 * @param cookie
 * @param aid 作品id
 * @param publish_date 发布日期
 * @param token 账号token
 */
export const getSingleDataOverviewAsync = async (
  cookie: string,
  aid: string,
  publish_date: string,
  token: number,
): Promise<WeixingongzhonghaoSingleDataOverviewResponse> => {
  const url =
    'https://mp.weixin.qq.com/misc/appmsganalysis?action=detailpage&msgid=' +
    aid +
    '&publish_date=' +
    publish_date +
    '&type=int&token=' +
    token +
    '&lang=zh_CN';

  const result = await $http.get<unknown, AxiosResponse<string>>(url, {
    headers: {
      cookie: cookie,
      referer: 'https://mp.weixin.qq.com',
    },
  });

  if (result.status !== 200) {
    throw new BadRequestException(result.statusText, result.status, result.data);
  }

  const data: WeixingongzhonghaoSingleDataOverviewResponse = {
    base_resp: {
      err_msg: 'ok',
      ret: 0,
    },
  };

  const summary_data_regex = /articleSummaryData:([\s\S]+)detailData/;
  const summaryArray = summary_data_regex.exec(result.data);
  if (summaryArray != null && summaryArray.length > 0) {
    let replacedString = summaryArray[1].replace(/\n/g, '');
    replacedString = replacedString.trim();
    replacedString = replacedString.slice(0, -1);
    const dataList = JSON.parse(replacedString);
    if (dataList?.list.length > 0) {
      data.data = dataList?.list;
    }
  }

  return data;
};

export interface WeixingongzhonghaoSingleDataOverviewResponse {
  base_resp: {
    err_msg: string;
    ret: number;
  };
  data?: Array<{
    ref_date: string;
    scene: number;
    read_user: number;
    read_count: number;
    share_user: number;
    share_count: number;
  }>;
}

/**
 * 微信公众号30天数据趋势和来源
 * @param cookie
 * @param token
 * @param begin_timestamp 开始时间戳（秒）
 * @param end_timestamp 结束时间戳（秒）
 * @param fingerprint 指纹
 */
export const getArticleStatTendencyAndSourceAsync = async (
  cookie: string,
  token: string,
  begin_timestamp: number,
  end_timestamp: number,
  fingerprint: string,
  proxyAgent?: object,
): Promise<WeixingongzhonghaoArticleStatTendencyAndSourceResponse> => {
  const url = `https://mp.weixin.qq.com/misc/appmsganalysis?begin_timestamp=${begin_timestamp}&end_timestamp=${end_timestamp}&action=get_article_stat_tendency_and_source&fingerprint=${fingerprint}&token=${token}&lang=zh_CN&f=json&ajax=1`;

  const headers = {
    cookie: cookie,
    referer: `https://mp.weixin.qq.com/misc/appmsganalysis?action=report&type=daily_v2&token=${token}&lang=zh_CN`,
    'x-requested-with': 'XMLHttpRequest',
  };

  const result = await $http.get<never, AxiosResponse<WeixingongzhonghaoArticleStatTendencyAndSourceResponse>>(url, {
    headers: headers,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

export interface WeixingongzhonghaoArticleStatTendencyItem {
  /**
   * 日期时间戳
   */
  date: number;
  /**
   * 场景类型
   * 0: 会话
   * 1: 好友转发
   * 2: 朋友圈
   * 4: 历史消息
   * 5: 搜一搜
   * 6: 看一看
   * 7: 其他
   * 9999: 总计
   */
  scene: number;
  /**
   * 阅读人数
   */
  read_uv: number;
  /**
   * 分享人数
   */
  share_uv: number;
  /**
   * 来源人数（可选）
   */
  source_uv?: number;
  /**
   * 收藏人数（可选）
   */
  collection_uv?: number;
  /**
   * 群发次数（可选）
   */
  mass_pv?: number;
}

export interface WeixingongzhonghaoArticleStatSourceItem {
  /**
   * 场景类型
   */
  scene: number;
  /**
   * 阅读人数
   */
  read_uv: number;
  /**
   * 分享人数
   */
  share_uv: number;
}

export interface WeixingongzhonghaoArticleStatTendencyAndSourceResponse {
  base_resp: {
    err_msg: string;
    ret: number;
  };
  /**
   * 全部文章统计趋势
   */
  all_article_stat_tendency: {
    list: Array<WeixingongzhonghaoArticleStatTendencyItem>;
    scene_info: Array<unknown>;
  };
  /**
   * 全部文章统计来源
   */
  all_article_stat_source: {
    list: Array<WeixingongzhonghaoArticleStatSourceItem>;
    scene_info: Array<unknown>;
  };
  jump_list: Array<unknown>;
  user_source_list: Array<unknown>;
  article_list: Array<unknown>;
  one_article_jump_stat: Array<unknown>;
}

/**
 * 微信公众号概览数据响应
 */
export interface WeixingongzhonghaoAccountOverviewResponse {
  base_resp: {
    err_msg: string;
    ret: number;
  };
  /**
   * 阅读人数（近30天）
   */
  read_count: number;
  /**
   * 点赞人数（近30天）
   */
  like_count: number;
  /**
   * 分享人数（近30天）
   */
  share_count: number;
  /**
   * 在看人数（近30天）
   */
  zaikan_count: number;
  /**
   * 留言数（近30天）
   */
  comment_count: number;
}

/**
 * 获取微信公众号账号概览数据
 * @param cookie
 * @param token
 */
export const getAccountOverviewAsync = async (
  cookie: string,
  token: string,
  proxyAgent?: object,
): Promise<WeixingongzhonghaoAccountOverviewResponse> => {
  const url = `https://mp.weixin.qq.com/misc/appmsganalysis?action=report&type=daily_v2&token=${token}&lang=zh_CN`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.weixin.qq.com/misc/useranalysis?=&token=' + token + '&lang=zh_CN',
    'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.7204.185 Safari/537.36',
  };

  const result = await $http.get<unknown, AxiosResponse<string>>(url, {
    headers: headers,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  if (result.status !== 200) {
    throw new BadRequestException(result.statusText, result.status, result.data);
  }

  // 提取近30天数据的辅助函数（data_range_type: '3'）
  const extract30DaysValue = (summaryName: string): number => {
    // 匹配 summary_name: [ ... ] 中 data_range_type: '3' 的 data_value
    const regex = new RegExp(
      `${summaryName}:\\s*\\[[\\s\\S]*?data_range_type:\\s*'3'\\s*\\*\\s*1[\\s\\S]*?data_value:\\s*'(-?\\d+)'\\s*\\*\\s*1`,
      'i',
    );
    const match = regex.exec(result.data);
    return match ? parseInt(match[1]) : 0;
  };

  const data: WeixingongzhonghaoAccountOverviewResponse = {
    base_resp: {
      err_msg: 'ok',
      ret: 0,
    },
    read_count: extract30DaysValue('read_summary'),
    like_count: extract30DaysValue('like_summary'),
    share_count: extract30DaysValue('share_summary'),
    zaikan_count: extract30DaysValue('zaikan_summary'),
    comment_count: extract30DaysValue('comment_summary'),
  };

  return data;
};

/**
 * 微信公众号粉丝分析数据项
 */
export interface WeixingongzhonghaoFanAnalysisItem {
  /**
   * 日期
   */
  date: string;
  /**
   * 新增用户数
   */
  new_user: number;
  /**
   * 取消关注用户数
   */
  cancel_user: number;
  /**
   * 净增用户数
   */
  netgain_user: number;
  /**
   * 累计用户数
   */
  cumulate_user: number;
}

/**
 * 微信公众号粉丝分析响应
 */
export interface WeixingongzhonghaoFanAnalysisResponse {
  base_resp: {
    err_msg: string;
    ret: number;
  };
  category_list: Array<{
    user_source: number;
    list: Array<WeixingongzhonghaoFanAnalysisItem>;
  }>;
  load_done: number;
}

/**
 * 获取微信公众号粉丝分析数据
 * @param cookie
 * @param token
 * @param begin_date 开始日期 格式：YYYY-MM-DD
 * @param end_date 结束日期 格式：YYYY-MM-DD
 * @param source 数据来源 默认：99999999
 * @param fingerprint 指纹
 */
export const getFanAnalysisAsync = async (
  cookie: string,
  token: string,
  begin_date: string,
  end_date: string,
  source: number = 99999999,
  fingerprint: string,
  proxyAgent?: object,
): Promise<WeixingongzhonghaoFanAnalysisResponse> => {
  const url = `https://mp.weixin.qq.com/misc/useranalysis?&begin_date=${begin_date}&end_date=${end_date}&source=${source}&fingerprint=${fingerprint}&token=${token}&lang=zh_CN&f=json&ajax=1`;

  const headers = {
    cookie: cookie,
    referer: `https://mp.weixin.qq.com/misc/useranalysis?=&token=${token}&lang=zh_CN`,
    'x-requested-with': 'XMLHttpRequest',
  };

  const result = await $http.get<never, AxiosResponse<WeixingongzhonghaoFanAnalysisResponse>>(url, {
    headers: headers,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};
