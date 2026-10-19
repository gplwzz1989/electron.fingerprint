import { $http } from '../../http';
import * as buffer from 'buffer';
import { isJson } from '../../utils';
import { HttpsProxyAgent } from 'https-proxy-agent';

export const regex = /bili_jct=([a-z0-9]{20,})/;

/**
 * 获取用户基础信息，判断登录是否有效
 * @param cookie
 * @param proxyAgent
 */
export const getUserInfoResponse = async (
  cookie: string,
  proxyAgent: object | undefined = undefined,
): Promise<BilibiliUserInfoResponse> => {
  const url = 'https://api.bilibili.com/x/web-interface/nav';

  const headers = {
    cookie: cookie,
    Referer: 'https://member.bilibili.com/',
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

export interface BilibiliUserInfoResponse {
  /**
   * 状态码 0:正常 非0异常 ，-101 登录失效/未登录
   */
  code: number;
  /**
   * 提示消息，登录失效或者未登录会有提示 如:账号未登录
   */
  message: string;
  /**
   * 数据体
   */
  data: {
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
export const getMemberInfoResponse = async (cookie: string): Promise<BilibiliMemberInfoResponse> => {
  const url = 'https://api.bilibili.com/x/member/web/account';

  const headers = {
    cookie: cookie,
    Referer: 'https://account.bilibili.com/',
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface BilibiliMemberInfoResponse {
  /**
   * 状态码 0正常 非0异常
   */
  code: number;
  /**
   * 提示消息
   */
  message: string;
  /**
   * 数据体
   */
  data: {
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
 * 获取账号状态是否禁言封号，是否有图文权限
 * @param cookie
 */
export const getPrivilegeResponse = async (cookie: string): Promise<BilibiliPrivilegeResponse> => {
  const url = 'https://api.bilibili.com/x/article/is_author';

  const headers = {
    cookie: cookie,
    Referer: 'https://member.bilibili.com/',
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface BilibiliPrivilegeResponse {
  /**
   * 状态码 0正常 非0 异常
   */
  code: number;
  /**
   * 提示消息
   */
  message: string;
  /**
   * 数据体
   */
  data: {
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
 * 上传图片
 * @param cookie
 * @param imageData 图片数据
 * @constructor
 */
export const uploadImage = async (cookie: string, imageData: buffer.Buffer): Promise<UploadImageResponse> => {
  const url = `https://member.bilibili.com/x/vu/web/cover/up?t=${new Date().getTime()}`;

  const headers = {
    cookie: cookie,
    Referer: 'https://member.bilibili.com/platform/upload/video/frame?page_from=creative_home_top_upload',
  };

  const token = regex.exec(cookie);

  // noinspection SpellCheckingInspection
  const postData = `csrf=${token ? token[1] : ''}&cover=data%3Aimage%2Fjpeg%3Bbase64%2C${encodeURIComponent(
    Buffer.from(imageData).toString('base64'),
  )}`;

  const result = await $http.post(url, postData, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface UploadImageResponse {
  /**
   * 状态码
   */
  code: number;
  /**
   * 提示消息
   */
  message: string;
  /**
   * 数据体
   */
  data?: {
    /**
     * 上传完成后封面图url地址
     */
    url: string;
  };
}

export const getUserFansResponse = async (cookie: string): Promise<BiliBiliFansResponse> => {
  const url = `https://member.bilibili.com/x/web/data/index/stat`;

  const headers = {
    cookie: cookie,
    Referer: 'https://member.bilibili.com/',
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};
export interface BiliBiliFansResponse {
  code: number;
  message: string;
  ttl: number;
  data: {
    inc_coin: number;
    inc_elec: number;
    inc_fav: number;
    inc_like: number;
    inc_share: number;
    incr_click: number;
    incr_dm: number;
    incr_fans: number;
    incr_reply: number;
    incr_vt: number;
    /**
     * 总播放量
     */
    total_click: number;
    /**
     * 总硬币数
     */
    total_coin: number;
    /**
     * 总弹幕
     */
    total_dm: number;
    /**
     * 总充电
     */
    total_elec: number;
    /**
     * 总粉丝苏
     */
    total_fans: number;
    /**
     * 总收藏
     */
    total_fav: number;
    /**
     * 总点赞
     */
    total_like: number;
    /**
     * 总评论
     */
    total_reply: number;
    /**
     * 总分享
     */
    total_share: number;
  };
}

export const getUserOnlyFansResponse = async (
  cookie: string,
  uid: number,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<BiliBiliFansOnly> => {
  const url = `https://api.bilibili.com/x/relation/stat?vmid=${uid}`;

  const headers = {
    cookie: cookie,
    Referer: 'https://member.bilibili.com/',
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result.data;
};

export interface BiliBiliFansOnly {
  code: number;
  message: string;
  data: { mid: number; follower: number };
}

export const getUserLikePlayResponse = async (
  cookie: string,
  uid: number,
  proxyAgent: HttpsProxyAgent<string> | undefined = undefined,
): Promise<BiliBiliLikePlayOnly> => {
  const url = `https://api.bilibili.com/x/space/upstat?mid=${uid}`;

  const headers = {
    cookie: cookie,
    Referer: 'https://member.bilibili.com/',
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface BiliBiliLikePlayOnly {
  code: number;
  message: string;

  data: { archive: { view: number }; article: { view: number }; likes: number };
}
