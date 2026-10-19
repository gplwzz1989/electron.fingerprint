import { $http, HttpConfig } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { GetTimeStamp, Task } from '../../utils';
import { HtmlDocument } from '../../htmlAgilityPack';

/**
 * 公众号首页数据
 * @param cookie
 * @param token
 */
export const getUserHomeDataAsync = async (cookie: string, token: number, proxyAgent?: object) => {
  const url = 'https://mp.weixin.qq.com/cgi-bin/home?t=home/index&lang=zh_CN&token=' + token;
  const result = await $http.get<unknown, AxiosResponse<string>>(url, {
    headers: {
      cookie: cookie,
    },
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  const data: WeixingongzhonghaoUserHomeDataResponse = {
    base_resp: {
      err_msg: 'ok',
      ret: 0,
    },
    fans: '',
    totalContents: '',
  };

  const html = new HtmlDocument();
  html.LoadHtml(result.data);

  const content =
    html.DocumentNode.SelectSingleNode("//div[@class='weui-desktop-user_sum original_cnt']") ??
    html.DocumentNode.SelectSingleNode("//a[@class='weui-desktop-user_sum original_cnt']");

  data.totalContents = content?.textContent?.trim() ?? '0';

  let fansCount = '';

  // 如果HTML节点没有获取到，尝试从JavaScript变量中提取
  if (!fansCount) {
    const totalFriendCntMatch = new RegExp("total_friend_cnt:[\\s]*'([0-9]+)'").exec(result.data);
    if (totalFriendCntMatch && totalFriendCntMatch.length > 1) {
      fansCount = totalFriendCntMatch[1];
    }
  }

  data.fans = fansCount || '0';

  return data;
};

export const getUserHomeDataResponse = async (cookie: string, token: number): Promise<string> => {
  const url = 'https://mp.weixin.qq.com/cgi-bin/home?t=home/index&lang=zh_CN&token=' + token;
  const result = await $http.get(url, {
    headers: {
      cookie: cookie,
      Referer: 'https://mp.weixin.qq.com/cgi-bin/appmsg',
    },
    responseType: 'text',
  });

  return result.data;
};

/**
 * 微信公众号流量主
 * @param cookie
 * @param token
 */
export const getUserIncomeAsync = async (
  cookie: string,
  token: number,
): Promise<WeixingongzhonghaoUserIncomeResponse> => {
  const result = await $http.get<unknown, AxiosResponse<WeixingongzhonghaoUserIncomeResponse>>(
    'https://mp.weixin.qq.com/promotion/publisher/publisher_stat',
    {
      headers: {
        cookie: cookie,
        referer:
          'https://mp.weixin.qq.com/cgi-bin/frame?t=ad_system/common_frame&t1=publisher/publisher_overview&token=' +
          token +
          '&lang=zh_CN',
        authority: 'mp.weixin.qq.com',
        'x-requested-with': 'XMLHttpRequest',
      },
      params: {
        action: 'overview',
        result_type: 1,
        version: 'v2',
        token: token,
        _: GetTimeStamp(13),
      },
    },
  );

  // 请求失败
  if (result.data?.base_resp?.ret) {
    throw new BadRequestException(result.data?.base_resp?.err_msg, result.data?.base_resp?.ret, result.data);
  }

  return result.data;
};

export interface WeixingongzhonghaoUserHomeDataResponse {
  base_resp: {
    err_msg: string;
    ret: number;
  };
  fans: string | null;
  totalContents: string | null;
}

export interface WeixingongzhonghaoUserIncomeResponse {
  base_resp: {
    err_msg: string;
    ret: number;
  };
  total_income: number;
  last_week_income: number;
  yesterday_income: number;
  last_month_income: number;
}

export const getUserInfoAsync = async (
  cookie: string,
  proxyAgent?: object,
): Promise<WeixingongzhonghaoUserInfoResponse> => {
  const url = 'https://mp.weixin.qq.com/cgi-bin/loginpage?url=%2Fcgi-bin%2Fhome';
  const result = await $http.get<unknown, AxiosResponse<string>>(url, {
    headers: {
      cookie: cookie,
    },
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  const data: WeixingongzhonghaoUserInfoResponse = {
    base_resp: {
      err_msg: 'ok',
      ret: 0,
    },
    data: {
      token: 0,
      author_id: '',
      nick_name: '',
      head_img: '',
      can_app_msg: 0,
      ticket: '',
      ticketId: '',
    },
  };

  const tokenArray = new RegExp('&token=[0-9a-zA-Z]{3,}').exec(result.data);

  if (tokenArray != null && tokenArray.length > 0) {
    data.data.token = Number(tokenArray[0].split('=')[1]);
  }

  const nickNameArray = new RegExp('nick_name:[\\s]".*"').exec(result.data);

  if (nickNameArray != null && nickNameArray.length > 0) {
    data.data.nick_name = nickNameArray[0].split('"')[1];
  }
  const uinArray = new RegExp('uin:[\\s]{0,}"[0-9]{3,}"').exec(result.data);

  if (uinArray != null && uinArray.length > 0) {
    data.data.author_id = uinArray[0].split(':')[1].trim();
    data.data.author_id = data.data.author_id.replaceAll('"', '');
  }

  const ticketIdArray = new RegExp('user_name:[\\s]{0,}".*"').exec(result.data);
  const ticketArray = new RegExp('ticket:[\\s]{0,}".*"').exec(result.data);
  if (ticketIdArray && ticketIdArray?.length > 0) {
    data.data.ticketId = ticketIdArray[0].split('"')[1];
  }
  if (ticketArray && ticketArray?.length > 0) {
    data.data.ticket = ticketArray[0].split('"')[1];
  }

  if (!data.data.token || !data.data.author_id) {
    data.base_resp.ret = 200003;
    data.base_resp.err_msg = '登录失效';
    return data;
  }

  const materialArray = new RegExp('"material_acl":').exec(result.data);

  if (materialArray != null && materialArray.length > 0) {
    const canAppMsgArray = new RegExp('"can_app_msg":[\\s][0-9]{0,}').exec(materialArray[0]);
    if (canAppMsgArray != null && canAppMsgArray.length > 0) {
      data.data.can_app_msg = Number(canAppMsgArray[0].split(':')[1].trim());
    }
  }

  const headImageArray = new RegExp("head_img:[\\s]'.*'").exec(result.data);

  if (headImageArray != null && headImageArray.length > 0) {
    data.data.head_img = headImageArray[0].replace('head_img:', '');
    data.data.head_img = data.data.head_img.replaceAll("'", '');
  }

  return data;
};

export interface WeixingongzhonghaoUserInfoResponse {
  base_resp: {
    err_msg: string;
    ret: number;
  };
  data: {
    token: number;
    author_id: string;
    nick_name: string;
    head_img: string;
    can_app_msg: number;
    ticket: string;
    ticketId: string;
  };
}

/**
 * 搜索微信公众号用户卡片列表
 * @param cookie
 * @param keyWord
 * @param token
 * @param pageNum
 */
export const getUserInfoListResponse = async (
  cookie: string,
  keyWord: string,
  token: number,
  pageNum: number = 1,
): Promise<WeixingongzhonghaoUserInfoListResponse> => {
  const headers = {
    cookie: cookie,
    referer: `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=77&createType=0&token=${token}&lang=zh_CN&timestamp=${Date.now()}`,
    'x-requested-with': 'XMLHttpRequest',
  };

  const params = {
    action: 'search_biz',
    scene: 1,
    begin: (pageNum - 1) * 10,
    count: 10,
    query: keyWord,
    fingerprint: '', //68a2eb484886f3c74d4f38586c80f510
    token: token,
    lang: 'zh_CN',
    f: 'json',
    ajax: 1,
  };

  const result = await $http.get('https://mp.weixin.qq.com/cgi-bin/searchbiz', {
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface WeixingongzhonghaoUserInfoListResponse {
  base_resp: { ret: number; err_msg: string };
  list: Array<{
    /**
     * 账号id
     */
    fakeid: string;
    /**
     * 账号昵称
     */
    nickname: string;
    alias: string;
    /**
     * 账号头像
     */
    round_head_img: string;
    service_type: number;
    signature: string;
    /**
     * 账号认证类型
     */
    verify_status: number;
  }>;
  total: number;
}

/**
 * 搜索微信视频号用户卡片列表
 * @param cookie
 * @param keyWord
 * @param token
 * @param pageBuffer 下一页参数
 */
export const getShipinhaoUserInfoListResponse = async (
  cookie: string,
  keyWord: string,
  token: number,
  pageBuffer: string = '',
): Promise<WeixingongzhonghaoShipinhaoUserInfoListResponse> => {
  const headers = {
    cookie: cookie,
    referer: `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=77&createType=0&token=${token}&lang=zh_CN&timestamp=${Date.now()}`,
    'x-requested-with': 'XMLHttpRequest',
  };

  const params = {
    action: 'search',
    scene: 1,
    buffer: pageBuffer,
    count: 21,
    query: keyWord,
    fingerprint: '',
    token: token,
    lang: 'zh_CN',
    f: 'json',
    ajax: 1,
  };

  const url = 'https://mp.weixin.qq.com/cgi-bin/videosnap';

  const result = await $http.get(url, {
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface WeixingongzhonghaoShipinhaoUserInfoListResponse {
  acct_continue_flag: boolean;
  acct_list: Array<{
    cover_url: string;
    ext_flag: number;
    /**
     * 用户头像
     */
    head_url: string;
    /**
     * 用户昵称，html
     * '<em class="highlight">王者</em>芊月';
     */
    highlight_nickname: string;
    /**
     * 用户签名/描述，html
     */
    highlight_signature: string;
    /**
     * 用户签名/描述
     */
    label: string;
    /**
     * 用户昵称
     */
    nickname: string;
    spam_flag: 0;
    /**
     * 用户id
     */
    username: string;
  }>;
  base_resp: { err_msg: string; ret: number };
  feed_list: [];
  last_buff: string;
}

/**
 * 获取视频号下的内容列表
 * @param cookie
 * @param userId 视频号用户id
 * @param token
 * @param pageBuffer 下一页参数
 * @param keyWord
 */
export const getShipinhaoUserContentListResponse = async (
  cookie: string,
  userId: string,
  token: number,
  pageBuffer: string = '',
  keyWord?: string,
): Promise<WeixinShipinhaoContentListResponse> => {
  const headers = {
    cookie: cookie,
    referer: `https://mp.weixin.qq.com/cgi-bin/appmsg?t=media/appmsg_edit_v2&action=edit&isNew=1&type=77&createType=0&token=${token}&lang=zh_CN&timestamp=${Date.now()}`,
    'x-requested-with': 'XMLHttpRequest',
  };

  const params = {
    action: 'get_feed_list',
    username: userId,
    scene: 0,
    buffer: pageBuffer,
    count: 15,
    fingerprint: '',
    token: token,
    lang: 'zh_CN',
    f: 'json',
    ajax: 1,
  };
  if (keyWord) {
    params.action = 'search_feeds';
    params['query'] = keyWord;
  }
  const url = 'https://mp.weixin.qq.com/cgi-bin/videosnap';

  const result = await $http.get(url, {
    headers: headers,
    params: params,
  });

  return result.data;
};

export interface WeixinShipinhaoContentListResponse {
  base_resp: { err_msg: string; ret: number };
  continue_flag: boolean;
  /**
   * 数量
   */
  feedCount: number;
  /**
   * 下一页参数
   */
  last_buff: string;
  list: Array<{
    auth_info: {
      auth_icon_url: string;
    };
    desc: string;
    /**
     * 作品id
     */
    export_id: string;
    ext_flag: number;
    /**
     * 用户头像
     */
    head_url: string;
    media: Array<{
      cover_url: string;
      full_cover_url: string;
      full_height: number;
      full_width: number;
      height: number;
      /**
       * 类型,  4
       */
      media_type: number;
      thumb_url: string;
      video_play_len_s: number;
      width: number;
    }>;
    media_num: number;
    nickname: string;
    //'17076712254746457271';
    nonce_id: string;
    spam_flag: 0;
    topic_info: [];
    /**
     * 用户id
     */
    username: string;
  }>;
}

/**
 * 是否需要三妈验证进行发布
 * @param cookie
 * @param token
 */
export const checkQrcodeOpen = async (cookie: string, token: string): Promise<boolean> => {
  for (let i = 0; i < 3; i++) {
    //群发消息
    try {
      const url = `https://mp.weixin.qq.com/cgi-bin/safecenterstatus?action=protect&t=setting/safe-protect&token=${token}&lang=zh_CN`;

      const headers = {
        cookie: cookie,
        referer: 'https://mp.weixin.qq.com',
      };
      const result = await $http.get(url, {
        headers: headers,
        responseType: 'text',
      });
      if (result?.data.includes('wx.cgiData')) {
        return !result?.data.includes('"protect_status":1');
      } else {
        await Task.Delay(1000);
      }
    } catch (e) {}
  }
  return true;
};
