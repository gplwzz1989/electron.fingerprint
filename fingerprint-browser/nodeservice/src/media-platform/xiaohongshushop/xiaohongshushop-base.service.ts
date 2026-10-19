import { $http } from '../../http';
import * as buffer from 'buffer';
import { isJson, parseSetCookie } from '../../utils';
import { AxiosResponseHeaders } from 'axios';
import { getNewSign } from '@/media-platform/xiaohongshu/xiaohongshu-base.service';

/**
 * 获取用户基础信息/判断登录是否有效
 * @param cookie
 * @param proxyAgent
 */
export const getUserInfo = async (cookie: string, proxyAgent?: object): Promise<XiaohongshushopUserInfoResponse> => {
  const url = 'https://ark.xiaohongshu.com/api/edith/seller/info/v2';

  const headers = {
    cookie: cookie,
    referer: 'https://ark.xiaohongshu.com/app-system/home',
    Authorization: '',
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

export interface XiaohongshushopUserInfoResponse {
  /**
   * 提示消息
   */
  msg: string;
  data: {
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
  /**
   * 状态码，0:正常，非0异常
   * -100:登录失效/未登录
   */
  code: number;
  /**
   * 接口是否成功
   */
  success: boolean;
}

/**
 * 获取上传参数，视频上传的第一步
 * @param cookie
 * @param scene 场景，可选video、image, 默认video上传视频，可能还有上传图片，音频等场景
 */
export const getUploadArgsResponse = async (
  cookie: string,
  scene: string = 'video',
): Promise<XiaohongshuUploadArgsResponse> => {
  const url = `https://creator.xiaohongshu.com/api/media/v1/upload/web/permit?biz_name=spectrum&scene=${scene}&file_count=1&version=1&source=web`;

  const headers = {
    cookie: cookie,
    referer: 'https://ark.xiaohongshu.com',
    Origin: 'https://ark.xiaohongshu.com',
  };

  const result = await $http.get(url, {
    retryCondition: (error, response) => {
      return !isJson(response.data);
    },
    headers: headers,
  });

  return result.data;
};

export interface XiaohongshuUploadArgsResponse {
  /**
   * 状态码
   * 0正常 非0异常
   */
  code: number;
  /**
   * 提示消息
   */
  msg?: string;
  success: boolean;
  data: {
    uploadTempPermits: Array<XiaohongshuUploadNode>;
  };
}
export interface XiaohongshuUploadNode {
  /**
   * 上传文件id，默认只有一个
   */
  fileIds: Array<string>;
  token: string;
  /**
   * 过期时间错
   */
  expireTime: number;
  qos: number;
  cloudType: number;
  /**
   * 上传地址你域名
   */
  uploadAddr: string;
  /**
   * 存储桶
   */
  bucket: string;
  /**
   * 区域
   */
  region: string;
  /**
   * 上传id,多分片上传不需要
   */
  uploadId: number;
}

/**
 * 上传图片
 * @param imageData 图片二进制数据
 * @param uploadArgs 上传参数，来源于获取上传参数接口
 */
export const uploadImage = async (imageData: buffer.Buffer, uploadArgs: XiaohongshuUploadNode): Promise<string> => {
  const url = `https://${uploadArgs.uploadAddr}/${uploadArgs.fileIds[0]}`;

  const headers = {
    'x-cos-security-token': uploadArgs.token,
    referer: 'https://ark.xiaohongshu.com',
    Origin: 'https://ark.xiaohongshu.com',
    Authorization: '',
    'Content-Type': '',
  };

  const result = await $http.put(url, imageData, {
    headers: headers,
    responseType: 'text',
  });

  return result?.headers['x-ros-preview-url'] ?? result.data;
};

/**
 * 小红书用户首页数据
 * @param cookie
 */
export const getPersonalInfoAsync = async (cookie: string): Promise<XiaohongshuPersonalInfoResponse> => {
  const url = 'https://creator.xiaohongshu.com/api/galaxy/creator/home/personal_info';

  const headers = {
    cookie: cookie,
    referer: 'https://ark.xiaohongshu.com',
    Authorization: '',
  };

  const result = await $http.get(url, { headers: headers });

  return result.data;
};

export interface XiaohongshuPersonalInfoResponse {
  result: number;
  success: boolean;
  data: {
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

  /**
   * 提示消息  比如:登录已过期
   */
  msg?: string;
}

export const getTicketCoookie = async (cookie: string): Promise<string> => {
  const url = 'https://customer.xiaohongshu.com/api/cas/customer/web/service-ticket';

  const postData = { service: 'https://creator.xiaohongshu.com', source: '', type: 'tgt' };
  //签名
  const baseurl = '/api/cas/customer/web/service-ticket';

  const sign = await getNewSign(baseurl, JSON.stringify(postData));
  const signJo = JSON.parse(sign);
  if (!signJo || !signJo['X-s']) {
    return cookie;
  }
  if (signJo['a1']) {
    cookie = cookie.replace('a1=', 'a1old=');
    cookie = `${cookie};a1=${signJo['a1']}`;
  }

  const headers = {
    cookie: cookie,
    referer: 'https://creator.xiaohongshu.com',
    Origin: 'https://creator.xiaohongshu.com',
    Authorization: '',
  };
  headers['X-s'] = signJo['X-s'];
  headers['X-t'] = signJo['X-t'];

  headers['X-S-Common'] = signJo['X-S-Common'] ?? '';

  const result = await $http.post(url, postData, { headers: headers });

  if (result.headers['set-cookie']) {
    const tmCookie = parseSetCookie(result.headers as AxiosResponseHeaders);
    return `${cookie};${tmCookie}`;
  }
  return cookie;
};
