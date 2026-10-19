import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';
import { Guid } from '../../utils';
import { getCsdnSign } from './csdn-base.service';

/**
 * CSDN 首页统计数据
 * @param cookie
 */
export const getUserHomeDataAsync = async (cookie: string): Promise<CsdnUserHomeDataResponse> => {
  const xNonce = Guid.NewGuid();
  const signature = await getCsdnSign(
    'GET',
    'https://bizapi.csdn.net/blog/phoenix/console/v1/data/get-blog-statistics-data',
    'application/json, text/plain, */*',
    '',
    '',
    {},
    {
      'X-Ca-Key': '203803574',
      'X-Ca-Nonce': xNonce,
      common: { Accept: 'application/json, text/plain, */*' },
      delete: {},
      get: {},
      head: {},
      post: { 'Content-Type': 'application/json;charset=UTF-8' },
      put: { 'Content-Type': 'application/x-www-form-urlencoded' },
      patch: { 'Content-Type': 'application/x-www-form-urlencoded' },
    },
  );

  const result = await $http.get<unknown, AxiosResponse<CsdnUserHomeDataResponse>>(
    'https://bizapi.csdn.net/blog/phoenix/console/v1/data/get-blog-statistics-data',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.csdn.net/',
        origin: 'https://mp.csdn.net',
        authority: 'bizapi.csdn.net',
        Accept: 'application/json, text/plain, */*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Content-Type': null,
        'X-Ca-Key': '203803574',
        'X-Ca-Nonce': xNonce,
        'X-Ca-Signature': signature,
        'X-Ca-Signature-Headers': 'x-ca-key,x-ca-nonce',
      },
      params: {},
    },
  );

  return result.data;
};

export interface CsdnUserHomeDataResponse {
  code: number;
  message: string;
  traceId: string;
  data: {
    /**
     * 总阅读数
     */
    allViewCount: number;

    /**
     * 昨日阅读数
     */
    yesterdayViewCount: number;

    /**
     * 总粉丝数
     */
    allFansCount: number;

    /**
     * 昨日粉丝数
     */
    yesterdayFansCount: number;

    /**
     * 总收藏数
     */
    allFavoriteCount: number;

    /**
     * 昨日收藏数
     */
    yesterdayFavoriteCount: number;
  };
}

export const getCSDNUserInfoResponse = async (
  cookie: string,
  proxyAgent?: object,
): Promise<CSDNUserProfileResponse> => {
  const xNonce = Guid.NewGuid();
  const signature = await getCsdnSign(
    'GET',
    'https://bizapi.csdn.net/blog-console-api/v1/user/info',
    'application/json, text/plain, */*',
    '',
    '',
    {},
    {
      'X-Ca-Key': '203803574',
      'X-Ca-Nonce': xNonce,
      common: { Accept: 'application/json, text/plain, */*' },
      delete: {},
      get: {},
      head: {},
      post: { 'Content-Type': 'application/json;charset=UTF-8' },
      put: { 'Content-Type': 'application/x-www-form-urlencoded' },
      patch: { 'Content-Type': 'application/x-www-form-urlencoded' },
    },
  );

  const url = 'https://bizapi.csdn.net/blog-console-api/v1/user/info';

  const headers = {
    accept: 'application/json, text/plain, */*',
    cookie: cookie,
    referer: 'https://mp.csdn.net/',
    origin: 'https://mp.csdn.net',
    'X-Ca-Key': '203803574',
    'X-Ca-Nonce': xNonce,
    'X-Ca-Signature': signature,
    'X-Ca-Signature-Headers': 'x-ca-key,x-ca-nonce',
  };

  const result = await $http.get(url, { headers: headers, httpsAgent: proxyAgent, httpAgent: proxyAgent });

  return result.data;
};

export interface CSDNUserProfileResponse {
  /** 状态码，200 表示成功 */
  code: number;
  /** 追踪 ID，用于请求跟踪 */
  traceId: string;
  /** 响应消息，成功时为 "success" */
  msg: string;

  message: string;
  /** 核心数据对象 */
  data: {
    /** 用户头像 URL */
    avatar: string;
    /** 用户名（登录名） */
    username: string;
    /** 用户昵称 */
    nickname: string;
    /** 用户角色列表（为空数组） */
    roles: never[];
    /** 用户等级 */
    level: number;
    /** 用户积分 */
    point: number;
    /** 详细资料信息 */
    profile: {
      /** 资料中的等级信息 */
      level: number;
      /** 资料中的积分信息 */
      point: number;
      /** 勋章/成就数据列表 */
      data: Array<{
        /** 关联的用户名 */
        username: string;
        /** 勋章类型标识 */
        type: number;
        /** 勋章分数 */
        score: number;
        /** 勋章名称 */
        name: string;
        /** 勋章图片 URL */
        image: string;
        /** 勋章描述 */
        description: string;
        /** 是否显示该勋章 */
        show: boolean;
        /** 勋章简短描述 */
        desc: string;
      }>;
      /** 专家标识（0 表示非专家） */
      ico_expert: number;
      /** 是否为专栏达人 */
      zhuanlandaren: boolean;
      /** 是否有持之以恒标识 */
      chizhiyiheng: boolean;
      /** 是否为微软 MVP */
      weiruanmvp: boolean;
      /** 是否为博客之星 */
      bokezhixing: boolean;
      /** 是否有短期勋章 */
      short_medal: boolean;
      /** 是否有长期勋章 */
      long_medal: boolean;
      /** 超级作者列表（为空数组） */
      super_writer: never[];
    };
    /** 认证信息列表（为空数组） */
    certification: never[];
    /** 博客首页 URL */
    blog_url: string;
    /** 自定义域名（为空字符串） */
    custom_domain: string;
    /** 代码样式配置 */
    code_style: string;
    /** 开放打赏设置（"0" 表示关闭） */
    open_reward: string;
    /** 编辑器类型（"0" 表示默认编辑器） */
    editor_type: string;
    /** 是否为大师模式 */
    master_mode: boolean;
    /** 是否显示上传视频按钮 */
    is_show_upload_video: boolean;
    /** 侧边栏默认 AB 测试配置 */
    side_model_default_abtest: boolean;
    /** 侧边栏隐藏状态 AB 测试配置 */
    side_model_hide_status_abtest: boolean;
    /** 封面图片 AB 测试配置 */
    cover_image_ab_test: boolean;
    /** 是否显示创作者活动开关 */
    is_show_creator_activity_switch: number;
    /** 是否显示博客信息卡片 */
    is_show_blog_info_card: boolean;
    /** 是否显示新版编辑器样式 */
    is_show_editor_new_style: boolean;
    /** 节假日审核配置 */
    holiday_audit_config: {
      /** 审核提示消息 */
      msg: string;
      /** 审核开关状态 */
      switch: boolean;
    };
    /** 是否显示粉丝菜单 */
    is_show_fans_menu: boolean;
    /** 是否在粉丝白名单中 */
    is_in_fans_white_users: boolean;
    /** 是否为引导日志 */
    is_guide_log: boolean;
    /** 博客交流群二维码 URL */
    blog_group_qr_code_url: string;
    /** 是否显示新版公众号入口 */
    show_new_mp_entry: boolean;
    /** 是否显示维权权益 */
    is_show_defend_benefit: boolean;
  };
}
