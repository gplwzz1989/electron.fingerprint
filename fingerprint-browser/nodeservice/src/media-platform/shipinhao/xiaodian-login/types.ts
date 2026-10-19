import type { ShipinhaoUserInfoResultOutput } from '../shipinhao-common';
import type { KuaiDaiLiProxy } from '@/media-platform/webproxy';

/**
 * 微信小店账号类型。
 */
export type XiaodianLoginType = 'shop' | 'talent' | 'supplier';

/**
 * 微信小店登录 Cookie 字典。
 */
export type XiaodianCookieMap = Record<string, string>;

/**
 * 浏览器可直接恢复的 Cookie 项。
 */
export interface XiaodianBrowserCookie {
  /**
   * Cookie 名称。
   */
  name: string;
  /**
   * Cookie 值。
   */
  value: string;
  /**
   * Cookie 所属域名。
   */
  domain: string;
  /**
   * Cookie 路径。
   */
  path: string;
  /**
   * 是否仅主机域名有效。
   */
  hostOnly?: boolean;
  /**
   * 是否仅 HTTPS 发送。
   */
  secure?: boolean;
  /**
   * 是否禁止前端脚本读取。
   */
  httpOnly?: boolean;
  /**
   * 是否为会话 Cookie。
   */
  session?: boolean;
  /**
   * Cookie 过期时间，单位为秒。
   */
  expirationDate?: number;
  /**
   * SameSite 策略。
   */
  sameSite?: string;
}

/**
 * 微信小店接口通用响应结构。
 */
export interface XiaodianApiResponse<TData> {
  code?: number | string;
  errCode?: number | string;
  ret?: number | string;
  err_msg?: string;
  errMsg?: string;
  message?: string;
  baseResp?: {
    ret?: number | string;
    errMsg?: string;
  };
  base_resp?: {
    ret?: number | string;
    err_msg?: string;
  };
  data?: TData;
}

/**
 * 创建微信小店二维码登录会话的配置。
 */
export interface CreateXiaodianLoginQrCodeOptions {
  /**
   * 微信小店客户端设备 ID；不传时模块内会自动生成并复用。
   */
  deviceId?: string;
  /**
   * 二维码登录确认超时时间，默认 2 分钟。
   */
  timeoutMs?: number;
  /**
   * 微信小店客户端 User-Agent。
   */
  userAgent?: string;
  proxy?: KuaiDaiLiProxy;
}

/**
 * 微信小店二维码登录数据。
 */
export interface XiaodianLoginQrCodeResult {
  /**
   * 二维码创建后的初始登录状态。
   */
  status: 'waiting';
  /**
   * 当前登录状态的中文提示。
   */
  message: string;
  /**
   * 本次登录流程的唯一会话 ID。
   */
  loginSessionId: string;
  /**
   * 微信小店二维码票据。
   */
  qrTicket: string;
  /**
   * 微信小店客户端设备 ID。
   */
  deviceId: string;
  /**
   * 微信小店返回的原始二维码图片字符串。
   */
  qrcodeImg: string;
  /**
   * 归一化后的二维码 Data URL。
   */
  qrcodeDataUrl: string;
  /**
   * 创建时间戳。
   */
  createdAt: number;
  /**
   * 二维码登录确认超时时间戳。
   */
  expireAt: number;
}

/**
 * 微信小店二维码轮询状态。
 */
export type XiaodianQrPollingStatus =
  | 'waiting'
  | 'scanned'
  | 'confirmed'
  | 'success'
  | 'failed'
  | 'timeout';

/**
 * 微信小店登录失败原因。
 */
export type XiaodianLoginFailedReason =
  | '超时未确认'
  | '二维码已过期'
  | '登录失败'
  | '授权失败'
  | '会话不存在'
  | '已停止';

/**
 * 微信小店登录轮询事件基础数据。
 */
export interface XiaodianLoginPollingBaseEvent {
  /**
   * 本次登录流程的唯一会话 ID。
   */
  loginSessionId: string;
  /**
   * 归一化后的轮询状态。
   */
  status: XiaodianQrPollingStatus;
  /**
   * 微信小店返回的原始扫码状态。
   */
  qrStatus?: number;
  /**
   * 中文提示信息。
   */
  message: string;
  /**
   * 原始响应数据。
   */
  raw?: unknown;
}

/**
 * 微信小店登录凭据。
 */
export interface XiaodianCredential {
  /**
   * 小店账号类型。
   */
  loginType: XiaodianLoginType;
  /**
   * 小店业务 ID。
   */
  bizId: string;
  /**
   * 账号昵称。
   */
  nickname: string;
  /**
   * 客服 OpenID。
   */
  kfOpenId: string;
  /**
   * 微信小店客户端设备 ID。
   */
  pcappUuid: string;
  /**
   * 是否为达人身份。
   */
  isTalent: boolean;
  /**
   * 头像地址。
   */
  headimg?: string;
  /**
   * 小店登录 Cookie。
   */
  cookies: XiaodianCookieMap;
  /**
   * 小店登录 Cookie 字符串。
   */
  cookie: string;
  /**
   * 原始登录结果。
   */
  raw?: unknown;
}

/**
 * 使用小店 Cookie 调用接口时可补充的登录动态参数。
 */
export interface XiaodianCredentialDynamicParams {
  /**
   * 小店账号类型；缺失时默认按普通小店账号处理。
   */
  loginType?: XiaodianLoginType;
  /**
   * 小店业务 ID；缺失时默认为空字符串。
   */
  bizId?: string;
  /**
   * 账号昵称；缺失时默认为空字符串。
   */
  nickname?: string;
  /**
   * 客服 OpenID；缺失时默认为空字符串。
   */
  kfOpenId?: string;
  /**
   * 微信小店客户端设备 ID；缺失时使用模块级默认设备 ID。
   */
  pcappUuid?: string;
  /**
   * 是否为达人身份；缺失时根据账号类型推断。
   */
  isTalent?: boolean;
  /**
   * 头像地址；缺失时默认为空字符串。
   */
  headimg?: string;
  /**
   * 原始登录结果；缺失时不填。
   */
  raw?: unknown;
}

/**
 * 微信小店保活结果。
 */
export interface XiaodianKeepaliveResult {
  /**
   * 合并服务端 Set-Cookie 后的小店凭据。
   */
  credential: XiaodianCredential;
  /**
   * 合并服务端 Set-Cookie 后的小店 Cookie 字符串。
   */
  cookie: string;
  /**
   * refresh_session 返回的过期时间。
   */
  expireTime?: number;
  /**
   * refresh_session 返回的最大过期时间。
   */
  maxExpireTime?: number;
  /**
   * HTTP 状态码。
   */
  status: number;
  /**
   * 原始响应数据。
   */
  raw: unknown;
}

/**
 * 视频号 sessionid 换取结果。
 */
export interface XiaodianChannelsSessionResult {
  /**
   * 小店跳转视频号的 externalCode。
   */
  externalCode: string;
  /**
   * 视频号 sessionid。
   */
  sessionid: string;
  /**
   * 视频号 Cookie 字典。
   */
  cookies: XiaodianCookieMap;
  /**
   * 视频号 Cookie 字符串。
   */
  cookie: string;
  /**
   * 合并 Set-Cookie 后的小店凭据。
   */
  xiaodianCredential: XiaodianCredential;
  /**
   * 原始响应数据。
   */
  raw: {
    skipFinder: unknown;
    channelsAuth: unknown;
  };
}

/**
 * 视频号作者信息。
 */
export interface XiaodianChannelsAuthorInfo {
  /**
   * 视频号长 ID。
   */
  finderUsername: string;
  /**
   * 视频号短 ID。
   */
  uniqId: string;
  /**
   * 昵称。
   */
  nickname: string;
  /**
   * 头像地址。
   */
  headImgUrl: string;
  /**
   * 原始用户信息。
   */
  raw: ShipinhaoUserInfoResultOutput;
}

/**
 * 小店与视频号合并后的授权结果。
 */
export interface XiaodianAuthorizationResult {
  /**
   * 合并服务端 Set-Cookie 后的小店凭据。
   */
  xiaodianCredential: XiaodianCredential;
  /**
   * 视频号登录凭据。
   */
  channelsSession: XiaodianChannelsSessionResult;
  /**
   * 小店 Cookie 与视频号 Cookie 合并后的浏览器 Cookie JSON 数组字符串。
   */
  mergedCookie: string;
  /**
   * 小店 Cookie 与视频号 Cookie 合并后的浏览器 Cookie JSON 数组字符串。
   */
  mergedCookieJson: string;
  /**
   * 小店 Cookie 与视频号 Cookie 拼接后的请求头字符串，仅用于排查兼容。
   */
  mergedCookieHeader: string;
  /**
   * 视频号作者信息。
   */
  authorInfo: XiaodianChannelsAuthorInfo;
}

/**
 * 使用小店浏览器 Cookie JSON 刷新视频号 Cookie 的配置。
 */
export interface RefreshShipinhaoByXiaodianCookieOptions extends GetChannelsSessionByXiaodianCredentialOptions {}

/**
 * 使用小店浏览器 Cookie JSON 刷新视频号 Cookie 的结果。
 */
export interface RefreshShipinhaoByXiaodianCookieResult {
  /**
   * 小店浏览器 Cookie JSON 数组字符串。
   */
  xiaodianCookieJson: string;
  /**
   * 视频号浏览器 Cookie JSON 数组字符串。
   */
  channelsCookieJson: string;
  /**
   * 小店与视频号合并后的浏览器 Cookie JSON 数组字符串。
   */
  mergedCookieJson: string;
  /**
   * 调小店接口时临时转换得到的 Header Cookie。
   */
  xiaodianCookie: string;
  /**
   * 调视频号接口时临时转换得到的 Header Cookie。
   */
  channelsCookie: string;
  /**
   * 小店本轮凭据过期时间。
   */
  expireTime?: number;
  /**
   * 小店最大可保活时间。
   */
  maxExpireTime?: number;
  /**
   * 视频号作者信息。
   */
  authorInfo: XiaodianChannelsAuthorInfo;
  /**
   * 底层接口原始结果。
   */
  raw: {
    keepalive: XiaodianKeepaliveResult;
    channelsSession: XiaodianChannelsSessionResult;
    authorInfo: XiaodianChannelsAuthorInfo['raw'];
  };
}

/**
 * 微信小店登录轮询事件表。
 */
export interface XiaodianLoginPollingEventMap {
  waiting: XiaodianLoginPollingBaseEvent;
  scanned: XiaodianLoginPollingBaseEvent;
  confirmed: XiaodianLoginPollingBaseEvent;
  loggedIn: XiaodianLoginPollingBaseEvent & {
    credentials: XiaodianCredential[];
  };
  xiaodianCredential: XiaodianLoginPollingBaseEvent & {
    credentials: XiaodianCredential[];
  };
  channelsSession: XiaodianLoginPollingBaseEvent & {
    credential: XiaodianCredential;
    channelsSession: XiaodianChannelsSessionResult;
  };
  authorInfo: XiaodianLoginPollingBaseEvent & {
    credential: XiaodianCredential;
    channelsSession: XiaodianChannelsSessionResult;
    authorInfo: XiaodianChannelsAuthorInfo;
  };
  authorized: XiaodianLoginPollingBaseEvent & {
    authorizations: XiaodianAuthorizationResult[];
  };
  failed: XiaodianLoginPollingBaseEvent & {
    reason: XiaodianLoginFailedReason;
  };
  timeout: XiaodianLoginPollingBaseEvent & {
    reason: '超时未确认';
  };
}

/**
 * 二维码登录轮询配置。
 */
export interface StartXiaodianLoginPollingOptions {
  /**
   * 轮询间隔，默认 3 秒。
   */
  intervalMs?: number;
  /**
   * 只登录指定小店账号类型。
   */
  accountTypes?: XiaodianLoginType[];
  /**
   * 最多处理的账号数量，默认不限制。
   */
  accountLimit?: number;
  /**
   * 微信小店客户端 User-Agent。
   */
  userAgent?: string;
  /**
   * 视频号跳转目标 username。
   */
  finderUsername?: string;
  proxy?: KuaiDaiLiProxy;
}

/**
 * 微信小店保活配置。
 */
export interface KeepaliveXiaodianCredentialOptions extends XiaodianCredentialDynamicParams {
  /**
   * 微信小店客户端 User-Agent。
   */
  userAgent?: string;
  proxy?: KuaiDaiLiProxy;
}

/**
 * 视频号 sessionid 换取配置。
 */
export interface GetChannelsSessionByXiaodianCredentialOptions extends XiaodianCredentialDynamicParams {
  /**
   * 微信小店客户端 User-Agent。
   */
  userAgent?: string;
  proxy?: KuaiDaiLiProxy;
  /**
   * 视频号跳转目标 username。
   */
  finderUsername?: string;
  /**
   * 视频号登录指纹设备 ID。
   */
  channelsFingerprintDeviceId?: string;
}
