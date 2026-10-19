import { EventEmitter } from 'events';
import type { AxiosRequestConfig } from 'axios';
import crypto from 'crypto';
import { $http } from '@/http';
import { createKuaiProxyAgent } from '@/media-platform/webproxy';
import type { KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { getShipinhaoUserInfo } from '../shipinhao-common';
import type {
  CreateXiaodianLoginQrCodeOptions,
  GetChannelsSessionByXiaodianCredentialOptions,
  KeepaliveXiaodianCredentialOptions,
  StartXiaodianLoginPollingOptions,
  XiaodianApiResponse,
  XiaodianAuthorizationResult,
  XiaodianChannelsAuthorInfo,
  XiaodianChannelsSessionResult,
  XiaodianCookieMap,
  XiaodianCredential,
  XiaodianCredentialDynamicParams,
  XiaodianKeepaliveResult,
  XiaodianLoginFailedReason,
  XiaodianLoginPollingEventMap,
  XiaodianLoginQrCodeResult,
  XiaodianLoginType,
} from './types';
import {
  CHANNELS_COOKIE_DOMAIN,
  cookieHeaderToBrowserCookieJson,
  mergeBrowserCookieJson,
  XIAODIAN_COOKIE_DOMAIN,
} from './browser-cookie';
import {
  buildLoginCookies,
  cloneXiaodianCredential,
  cookieHeaderFromMap,
  cookieMapFromHeader,
  DEFAULT_LOGIN_CONFIRM_TIMEOUT_MS,
  DEFAULT_LOGIN_POLLING_INTERVAL_MS,
  DEFAULT_XIAODIAN_USER_AGENT,
  getApiCode,
  getApiMessage,
  getDefaultDeviceId,
  mergeSetCookiesIntoMap,
  normalizeQrcodeDataUrl,
  normalizeResponseData,
  numberValue,
  stringValue,
  toSafeErrorMessage,
  toXiaodianLoginType,
  XIAODIAN_BASE_URL,
  XIAODIAN_LOGIN_URL,
  XIAODIAN_MULTI_LOGIN_BASE,
} from './utils';

interface XiaodianLoginContext {
  loginSessionId: string;
  qrTicket: string;
  deviceId: string;
  cookies: XiaodianCookieMap;
  createdAt: number;
  expireAt: number;
  userAgent: string;
  proxy?: KuaiDaiLiProxy;
  emittedStatuses?: Set<'waiting' | 'scanned' | 'confirmed'>;
}

interface GetLoginQrCodeData {
  qrTicket?: string;
  qrcodeImg?: string;
}

interface QueryLoginQrCodeData {
  status?: number | string;
  tmpQrTicket?: string;
  kfOpenId?: string;
  shopList?: XiaodianLoginAccount[];
  talentList?: XiaodianLoginAccount[];
  supplierList?: XiaodianLoginAccount[];
}

interface XiaodianLoginAccount {
  accountType?: XiaodianLoginType;
  appid?: string | number;
  appId?: string | number;
  bizId?: string | number;
  supplierId?: string | number;
  supplier_id?: string | number;
  nickname?: string;
  name?: string;
  headimgurl?: string;
  headImg?: string;
  headimg?: string;
  isLogin?: boolean;
  isAccountOpeningFinish?: boolean;
  isSupplierLoginAllowed?: boolean;
  jobInfoList?: XiaodianLoginAccountJobInfo[];
}

interface XiaodianLoginAccountJobInfo {
  jobName?: string;
  jobId?: string | number;
}

interface ConfirmLoginData {
  loginResults?: XiaodianLoginResult[];
}

interface XiaodianLoginResult extends Record<string, unknown> {
  loginType?: XiaodianLoginType;
  accountType?: XiaodianLoginType;
  appid?: string | number;
  bizId?: string | number;
  accountAppId?: string | number;
}

interface RefreshSessionData {
  expire_time?: number | string;
  max_expire_time?: number | string;
}

interface SkipFinderPlatformCodeData {
  code?: string;
}

interface BindChannelListData {
  finderList?: Array<{
    finderUsername?: string;
    nickname?: string;
    finderUniqId?: string;
  }>;
  mpList?: unknown[];
}

interface ChannelsAuthData {
  errCode?: number | string;
  ret?: number | string;
  baseResp?: {
    ret?: number | string;
    errMsg?: string;
  };
  base_resp?: {
    ret?: number | string;
    err_msg?: string;
  };
  errMsg?: string;
  err_msg?: string;
  message?: string;
}

interface XiaodianHttpResult<TData> {
  status: number;
  data: TData & XiaodianApiResponse<unknown>;
}

type XiaodianProxyAgent = ReturnType<typeof createKuaiProxyAgent>;

class XiaodianAuthorizationError extends Error {}

const loginSessionStore = new Map<string, XiaodianLoginContext>();

/**
 * 创建微信小店二维码登录会话。
 */
export async function createXiaodianLoginQrCode(
  options: CreateXiaodianLoginQrCodeOptions = {},
): Promise<XiaodianLoginQrCodeResult> {
  cleanupExpiredLoginSessions();
  const now = Date.now();
  const deviceId = options.deviceId || getDefaultDeviceId();
  const userAgent = options.userAgent || DEFAULT_XIAODIAN_USER_AGENT;
  const proxyAgent = createXiaodianProxyAgent(options.proxy);
  const context: XiaodianLoginContext = {
    loginSessionId: crypto.randomUUID(),
    qrTicket: '',
    deviceId,
    cookies: {},
    createdAt: now,
    expireAt: now + (options.timeoutMs ?? DEFAULT_LOGIN_CONFIRM_TIMEOUT_MS),
    userAgent,
    proxy: options.proxy,
    emittedStatuses: new Set<'waiting' | 'scanned' | 'confirmed'>(['waiting']),
  };
  await initLoginPage(context, proxyAgent);
  const result = await xiaodianGet<GetLoginQrCodeData>(
    `${XIAODIAN_MULTI_LOGIN_BASE}/getLoginQrCode?${new URLSearchParams({ deviceId })}`,
    context,
    '获取二维码',
    {},
    proxyAgent,
  );
  const { qrTicket, qrcodeImg } = result.data;
  if (!qrTicket || !qrcodeImg) throw new Error('获取二维码失败，响应缺少二维码数据');
  const createdAt = Date.now();
  context.qrTicket = qrTicket;
  context.createdAt = createdAt;
  context.expireAt = createdAt + (options.timeoutMs ?? DEFAULT_LOGIN_CONFIRM_TIMEOUT_MS);
  loginSessionStore.set(context.loginSessionId, context);
  return {
    status: 'waiting',
    message: '等待扫码确认',
    loginSessionId: context.loginSessionId,
    qrTicket,
    deviceId,
    qrcodeImg,
    qrcodeDataUrl: normalizeQrcodeDataUrl(qrcodeImg),
    createdAt,
    expireAt: context.expireAt,
  };
}

/**
 * 开始轮询微信小店二维码登录状态。
 */
export function startXiaodianLoginPolling(
  loginSessionId: string,
  options: StartXiaodianLoginPollingOptions = {},
): XiaodianLoginPollingController {
  const context = loginSessionStore.get(loginSessionId);
  const controller = new XiaodianLoginPollingController(context, loginSessionId, options);
  setTimeout(() => controller.start(), 0);
  return controller;
}

/**
 * 使用微信小店 Cookie 字符串执行一次凭据保活。
 *
 * @param cookie 小店登录 Cookie 字符串，格式示例：a=B; C=D。
 * @param dynamicParams 登录后产生的动态参数；缺失字段会使用默认值。
 */
export async function keepaliveXiaodianCredential(
  cookie: string,
  dynamicParams: KeepaliveXiaodianCredentialOptions = {},
): Promise<XiaodianKeepaliveResult> {
  const updatedCredential = createCredentialFromCookie(cookie, dynamicParams);
  const proxyAgent = createXiaodianProxyAgent(dynamicParams.proxy);
  const result = await xiaodianPostWithCredential<RefreshSessionData>(
    updatedCredential,
    `${XIAODIAN_BASE_URL}/shop/commkf/refresh_session`,
    '{}',
    'refresh_session',
    dynamicParams.userAgent,
    proxyAgent,
  );
  return {
    credential: updatedCredential,
    cookie: updatedCredential.cookie,
    expireTime: numberValue(result.data.expire_time),
    maxExpireTime: numberValue(result.data.max_expire_time),
    status: result.status,
    raw: result.data,
  };
}

/**
 * 通过微信小店 Cookie 字符串换取视频号 sessionid。
 *
 * @param cookie 小店登录 Cookie 字符串，格式示例：a=B; C=D。
 * @param dynamicParams 登录后产生的动态参数；缺失字段会使用默认值。
 */
export async function getChannelsSessionByXiaodianCredential(
  cookie: string,
  dynamicParams: GetChannelsSessionByXiaodianCredentialOptions = {},
): Promise<XiaodianChannelsSessionResult> {
  try {
    const updatedCredential = createCredentialFromCookie(cookie, dynamicParams);
    const proxyAgent = createXiaodianProxyAgent(dynamicParams.proxy);
    const finderUsername = await getBoundFinderUsername(updatedCredential, dynamicParams, proxyAgent);
    const skipFinder = await getSkipFinderPlatformCode(updatedCredential, finderUsername, dynamicParams, proxyAgent);
    const externalCode = skipFinder.data.code;
    if (!externalCode) throw new Error('视频号 sessionid 换取失败，缺少小店跳转 code');
    const channelsAuth = await authChannelsWithExternalCode(externalCode, dynamicParams, proxyAgent);
    const sessionid = channelsAuth.cookies.sessionid;
    if (!sessionid) throw new Error('视频号 sessionid 请求成功但未返回 sessionid');
    return {
      externalCode,
      sessionid,
      cookies: channelsAuth.cookies,
      cookie: cookieHeaderFromMap(channelsAuth.cookies),
      xiaodianCredential: updatedCredential,
      raw: {
        skipFinder: skipFinder.data,
        channelsAuth: channelsAuth.raw,
      },
    };
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('鉴权失败')) {
      Object.assign(error, { code: 300333 });
    }
    throw error;
  }
}

/**
 * 获取视频号作者信息。
 */
export async function getChannelsAuthorInfo(
  channelsCookie: string,
  proxy?: KuaiDaiLiProxy,
): Promise<XiaodianChannelsAuthorInfo> {
  const result = await getShipinhaoUserInfo(channelsCookie, proxy);
  const finderUser = result.data?.finderUser;
  if (result.code !== 0 || !finderUser?.finderUsername) {
    throw new Error(`获取视频号作者信息失败，${result.msg || '未返回作者信息'}`);
  }
  return {
    finderUsername: finderUser.finderUsername,
    uniqId: finderUser.uniqId,
    nickname: finderUser.nickname,
    headImgUrl: finderUser.headImgUrl,
    raw: result,
  };
}

/**
 * 微信小店二维码登录轮询控制器。
 */
export class XiaodianLoginPollingController {
  private readonly emitter = new EventEmitter();
  private readonly proxyAgent: XiaodianProxyAgent;
  private started = false;
  private stopped = false;

  constructor(
    private readonly context: XiaodianLoginContext | undefined,
    private readonly loginSessionId: string,
    private readonly options: StartXiaodianLoginPollingOptions,
  ) {
    this.proxyAgent = createXiaodianProxyAgent(options.proxy ?? context?.proxy);
  }

  /**
   * 监听登录轮询事件。
   */
  on<EventName extends keyof XiaodianLoginPollingEventMap>(
    eventName: EventName,
    listener: (event: XiaodianLoginPollingEventMap[EventName]) => void,
  ): this {
    this.emitter.on(eventName, listener as (event: unknown) => void);
    return this;
  }

  /**
   * 取消监听登录轮询事件。
   */
  off<EventName extends keyof XiaodianLoginPollingEventMap>(
    eventName: EventName,
    listener: (event: XiaodianLoginPollingEventMap[EventName]) => void,
  ): this {
    this.emitter.off(eventName, listener as (event: unknown) => void);
    return this;
  }

  /**
   * 停止轮询。
   */
  stop(): void {
    this.stopped = true;
  }

  /**
   * 启动轮询。
   */
  start(): void {
    if (this.started) return;
    this.started = true;
    void this.run().catch((error: unknown) => {
      if (error instanceof XiaodianAuthorizationError) {
        this.emitFailed('授权失败', toSafeErrorMessage(error));
        return;
      }
      this.emitFailed('登录失败', toSafeErrorMessage(error));
    });
  }

  private async run(): Promise<void> {
    if (!this.context) {
      this.emitFailed('会话不存在', '登录会话不存在或已过期');
      return;
    }
    while (!this.stopped) {
      if (Date.now() >= this.context.expireAt) {
        this.emitTimeout('二维码登录超时，用户未在 2 分钟内确认登录');
        return;
      }
      const queryResult = await queryLoginQrCode(this.context, this.proxyAgent);
      const scanData = queryResult.data;
      const qrStatus = Number(scanData?.status ?? 0);
      if (qrStatus === 2) {
        this.emitEvent('scanned', {
          loginSessionId: this.loginSessionId,
          status: 'scanned',
          qrStatus,
          message: '已扫码，等待手机确认登录',
          raw: scanData,
        });
      } else if (qrStatus === 3 && scanData) {
        await this.handleConfirmed(scanData, qrStatus);
        return;
      } else if (qrStatus === 4) {
        this.emitFailed('二维码已过期', '二维码已过期，需要重新生成二维码', qrStatus, scanData);
        return;
      } else {
        this.emitEvent('waiting', {
          loginSessionId: this.loginSessionId,
          status: 'waiting',
          qrStatus,
          message: '等待扫码确认',
          raw: scanData,
        });
      }
      await this.sleepUntilNextRound();
    }
    this.emitFailed('已停止', '二维码登录轮询已停止');
  }

  private async handleConfirmed(scanData: QueryLoginQrCodeData, qrStatus: number): Promise<void> {
    if (!this.context) return;
    this.emitEvent('confirmed', {
      loginSessionId: this.loginSessionId,
      status: 'confirmed',
      qrStatus,
      message: '扫码确认完成，开始获取登录凭据',
      raw: scanData,
    });
    const credentials = await confirmLogin(scanData, this.context, this.options, this.proxyAgent);
    this.emitEvent('loggedIn', {
      loginSessionId: this.loginSessionId,
      status: 'confirmed',
      qrStatus,
      message: '已登录微信小店',
      raw: credentials,
      credentials,
    });
    this.emitEvent('xiaodianCredential', {
      loginSessionId: this.loginSessionId,
      status: 'confirmed',
      qrStatus,
      message: '已获取微信小店登录凭据',
      raw: credentials,
      credentials,
    });
    const authorizations: XiaodianAuthorizationResult[] = [];
    const proxy = this.options.proxy ?? this.context.proxy;
    for (const credential of credentials) {
      const channelsSession = await getChannelsSessionByXiaodianCredential(credential.cookie, {
        ...this.options,
        ...credentialDynamicParamsFromCredential(credential),
        proxy,
      });
      this.emitEvent('channelsSession', {
        loginSessionId: this.loginSessionId,
        status: 'confirmed',
        qrStatus,
        message: '已换取视频号 sessionid',
        raw: channelsSession.raw,
        credential: channelsSession.xiaodianCredential,
        channelsSession,
      });
      const authorInfo = await getChannelsAuthorInfo(channelsSession.cookie, proxy);
      this.emitEvent('authorInfo', {
        loginSessionId: this.loginSessionId,
        status: 'confirmed',
        qrStatus,
        message: '已获取视频号作者信息',
        raw: authorInfo.raw,
        credential: channelsSession.xiaodianCredential,
        channelsSession,
        authorInfo,
      });
      const xiaodianCookieJson = cookieHeaderToBrowserCookieJson(
        cookieHeaderFromMap(channelsSession.xiaodianCredential.cookies),
        XIAODIAN_COOKIE_DOMAIN,
      );
      const channelsCookieJson = cookieHeaderToBrowserCookieJson(channelsSession.cookie, CHANNELS_COOKIE_DOMAIN);
      const mergedCookieJson = mergeBrowserCookieJson(xiaodianCookieJson, channelsCookieJson);
      authorizations.push({
        xiaodianCredential: channelsSession.xiaodianCredential,
        channelsSession,
        mergedCookie: mergedCookieJson,
        mergedCookieJson,
        mergedCookieHeader: [cookieHeaderFromMap(channelsSession.xiaodianCredential.cookies), channelsSession.cookie]
          .filter(Boolean)
          .join('; '),
        authorInfo,
      });
    }
    if (!authorizations.length) throw new Error('授权失败，未获取到可用账号');
    loginSessionStore.delete(this.loginSessionId);
    this.emitEvent('authorized', {
      loginSessionId: this.loginSessionId,
      status: 'success',
      qrStatus,
      message: '授权成功',
      raw: authorizations,
      authorizations,
    });
  }

  private async sleepUntilNextRound(): Promise<void> {
    if (!this.context) return;
    const intervalMs = this.options.intervalMs ?? DEFAULT_LOGIN_POLLING_INTERVAL_MS;
    const remainingMs = Math.max(0, this.context.expireAt - Date.now());
    await new Promise<void>((resolve) => setTimeout(resolve, Math.min(intervalMs, remainingMs)));
  }

  private emitFailed(reason: XiaodianLoginFailedReason, message: string, qrStatus?: number, raw?: unknown): void {
    loginSessionStore.delete(this.loginSessionId);
    this.emitEvent('failed', {
      loginSessionId: this.loginSessionId,
      status: 'failed',
      qrStatus,
      message,
      reason,
      raw,
    });
  }

  private emitTimeout(message: string, qrStatus?: number, raw?: unknown): void {
    loginSessionStore.delete(this.loginSessionId);
    this.emitEvent('timeout', {
      loginSessionId: this.loginSessionId,
      status: 'timeout',
      qrStatus,
      message,
      reason: '超时未确认',
      raw,
    });
    this.emitEvent('failed', {
      loginSessionId: this.loginSessionId,
      status: 'failed',
      qrStatus,
      message,
      reason: '超时未确认',
      raw,
    });
  }

  private emitEvent<EventName extends keyof XiaodianLoginPollingEventMap>(
    eventName: EventName,
    event: XiaodianLoginPollingEventMap[EventName],
  ): void {
    if (
      this.context &&
      (event.status === 'waiting' || event.status === 'scanned' || event.status === 'confirmed')
    ) {
      this.context.emittedStatuses ??= new Set<'waiting' | 'scanned' | 'confirmed'>();
      if (this.context.emittedStatuses.has(event.status)) return;
      this.context.emittedStatuses.add(event.status);
    }
    this.emitter.emit(eventName, event);
  }
}

function createXiaodianProxyAgent(proxy?: KuaiDaiLiProxy): XiaodianProxyAgent {
  if (!proxy?.serverAdd) return undefined;
  return createKuaiProxyAgent(proxy);
}

function buildProxyRequestConfig(
  proxyAgent?: XiaodianProxyAgent,
): Pick<AxiosRequestConfig, 'httpAgent' | 'httpsAgent'> {
  if (!proxyAgent) return {};
  return {
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  };
}

async function initLoginPage(context: XiaodianLoginContext, proxyAgent?: XiaodianProxyAgent): Promise<void> {
  try {
    const response = await $http.get(XIAODIAN_LOGIN_URL, {
      headers: buildLoginPageHeaders(context),
      maxRedirects: 0,
      ...buildProxyRequestConfig(proxyAgent),
    });
    mergeSetCookiesIntoMap(context.cookies, response.headers);
  } catch {
    // 初始化登录页只是为了让服务端下发辅助 Cookie，失败不阻断二维码生成。
  }
}

async function queryLoginQrCode(
  context: XiaodianLoginContext,
  proxyAgent?: XiaodianProxyAgent,
): Promise<XiaodianHttpResult<QueryLoginQrCodeData>> {
  return xiaodianGet<QueryLoginQrCodeData>(
    `${XIAODIAN_MULTI_LOGIN_BASE}/queryLoginQrCode?${new URLSearchParams({ qr_ticket: context.qrTicket })}`,
    context,
    '查询扫码状态',
    {},
    proxyAgent,
  );
}

async function confirmLogin(
  scanData: QueryLoginQrCodeData,
  context: XiaodianLoginContext,
  options: StartXiaodianLoginPollingOptions,
  proxyAgent?: XiaodianProxyAgent,
): Promise<XiaodianCredential[]> {
  if (!scanData.tmpQrTicket) throw new Error('确认登录失败，缺少临时二维码票据');
  const accounts = normalizeAccounts(scanData);
  const selectedAccounts = selectAccounts(accounts, options);
  if (!selectedAccounts.length) throw new Error('没有可登录账号，请确认微信账号有可用的小店/达人/供应商身份');
  const result = await xiaodianPost<ConfirmLoginData>(
    `${XIAODIAN_MULTI_LOGIN_BASE}/confirmLogin`,
    context,
    JSON.stringify({
      qrTicket: scanData.tmpQrTicket,
      bizIdList: selectedAccounts.map((account) => ({
        type: account.accountType,
        bizId: getBizId(account),
      })),
    }),
    '确认登录',
    {
      'content-type': 'application/json;charset=UTF-8',
      origin: XIAODIAN_BASE_URL,
    },
    proxyAgent,
  );
  const loginResults = result.data.loginResults;
  if (!loginResults?.length) throw new Error('确认登录成功但没有返回登录凭据');
  return loginResults.map((loginResult) => enrichLoginResult(loginResult, scanData, accounts, context));
}

function normalizeAccounts(scanData: QueryLoginQrCodeData): XiaodianLoginAccount[] {
  const shopList = (scanData.shopList ?? []).map((item) => ({ ...item, accountType: 'shop' as const }));
  const talentList = (scanData.talentList ?? []).map((item) => ({ ...item, accountType: 'talent' as const }));
  const supplierList = (scanData.supplierList ?? []).map((item) => ({ ...item, accountType: 'supplier' as const }));
  return [...shopList, ...talentList, ...supplierList];
}

function selectAccounts(
  accounts: XiaodianLoginAccount[],
  options: StartXiaodianLoginPollingOptions,
): XiaodianLoginAccount[] {
  const talentAccounts = accounts.filter((account) => account.accountType === 'talent');
  const adminAccounts = talentAccounts.filter((account) => isAdminAccount(account));
  if (!adminAccounts.length) throw new XiaodianAuthorizationError('当前账号未开通视频号带货，暂不支持');
  let selected = adminAccounts.filter((account) => !isAccountDisabled(account));
  if (options.accountLimit && options.accountLimit > 0) selected = selected.slice(0, options.accountLimit);
  return selected;
}

function isAdminAccount(account: XiaodianLoginAccount): boolean {
  return (
    account.jobInfoList?.some((jobInfo) => Number(jobInfo.jobId) === 99999 || jobInfo.jobName === '管理员') ?? false
  );
}

function isAccountDisabled(account: XiaodianLoginAccount): boolean {
  if (account.isLogin) return true;
  if (account.accountType === 'talent' && account.isAccountOpeningFinish === false) return true;
  if (account.accountType === 'supplier' && account.isSupplierLoginAllowed === false) return true;
  return !getBizId(account);
}

function enrichLoginResult(
  loginResult: XiaodianLoginResult,
  scanData: QueryLoginQrCodeData,
  accounts: XiaodianLoginAccount[],
  context: XiaodianLoginContext,
): XiaodianCredential {
  const loginType = toXiaodianLoginType(loginResult.loginType || loginResult.accountType);
  const bizId =
    stringValue(loginResult.appid) || stringValue(loginResult.bizId) || stringValue(loginResult.accountAppId);
  const account =
    accounts.find((item) => item.accountType === loginType && getBizId(item) === bizId) ||
    accounts.find((item) => item.accountType === loginType);
  const cookies = buildLoginCookies(loginType, loginResult);
  Object.assign(cookies, context.cookies);
  const cookie = cookieHeaderFromMap(cookies);
  return {
    loginType,
    bizId: bizId || getBizId(account),
    kfOpenId: scanData.kfOpenId || '',
    pcappUuid: context.deviceId,
    nickname:
      loginType === 'supplier' ? account?.name || account?.nickname || '' : account?.nickname || account?.name || '',
    headimg: account?.headimgurl || account?.headImg || account?.headimg || '',
    isTalent: loginType === 'talent',
    cookies,
    cookie,
    raw: loginResult,
  };
}

function getBizId(account: XiaodianLoginAccount | undefined): string {
  if (!account) return '';
  return (
    stringValue(account.appid) ||
    stringValue(account.appId) ||
    stringValue(account.bizId) ||
    stringValue(account.supplierId) ||
    stringValue(account.supplier_id)
  );
}

function createCredentialFromCookie(
  cookie: string,
  dynamicParams: XiaodianCredentialDynamicParams = {},
): XiaodianCredential {
  const trimmedCookie = cookie.trim();
  if (!trimmedCookie) throw new Error('微信小店 Cookie 不能为空');
  const cookies = cookieMapFromHeader(trimmedCookie);
  if (!Object.keys(cookies).length) throw new Error('微信小店 Cookie 格式不正确，格式示例：a=B; C=D');
  const loginType = dynamicParams.loginType
    ? toXiaodianLoginType(dynamicParams.loginType)
    : inferLoginTypeFromCookies(cookies);
  return {
    loginType,
    bizId: dynamicParams.bizId || '',
    nickname: dynamicParams.nickname || '',
    kfOpenId: dynamicParams.kfOpenId || '',
    pcappUuid: dynamicParams.pcappUuid || getDefaultDeviceId(),
    isTalent: dynamicParams.isTalent ?? loginType === 'talent',
    headimg: dynamicParams.headimg || '',
    cookies,
    cookie: cookieHeaderFromMap(cookies),
    raw: dynamicParams.raw,
  };
}

function inferLoginTypeFromCookies(cookies: XiaodianCookieMap): XiaodianLoginType {
  if (cookies.talent_token) return 'talent';
  if (cookies.supplier_token) return 'supplier';
  return 'shop';
}

function credentialDynamicParamsFromCredential(credential: XiaodianCredential): XiaodianCredentialDynamicParams {
  return {
    loginType: credential.loginType,
    bizId: credential.bizId,
    nickname: credential.nickname,
    kfOpenId: credential.kfOpenId,
    pcappUuid: credential.pcappUuid,
    isTalent: credential.isTalent,
    headimg: credential.headimg,
    raw: credential.raw,
  };
}

async function getBoundFinderUsername(
  credential: XiaodianCredential,
  options: GetChannelsSessionByXiaodianCredentialOptions,
  proxyAgent?: XiaodianProxyAgent,
): Promise<string> {
  const bindChannels = await getBindChannelList(credential, options, proxyAgent);
  const finderList = Array.isArray(bindChannels.data.finderList) ? bindChannels.data.finderList : [];
  if (!finderList.length) throw new XiaodianAuthorizationError('未绑定视频号');
  const targetFinderUsername = options.finderUsername?.trim();
  const boundFinder = targetFinderUsername
    ? finderList.find(
        (finder) =>
          finder.finderUsername === targetFinderUsername || finder.finderUniqId === targetFinderUsername,
      )
    : finderList.find((finder) => finder.finderUsername);
  if (!boundFinder) {
    throw new XiaodianAuthorizationError(
      targetFinderUsername ? '指定的视频号未绑定到当前小店' : '已绑定视频号但缺少 finderUsername',
    );
  }
  if (!boundFinder.finderUsername) throw new XiaodianAuthorizationError('已绑定视频号但缺少 finderUsername');
  return boundFinder.finderUsername;
}

async function getBindChannelList(
  credential: XiaodianCredential,
  options: GetChannelsSessionByXiaodianCredentialOptions,
  proxyAgent?: XiaodianProxyAgent,
): Promise<XiaodianHttpResult<BindChannelListData>> {
  const url = `${XIAODIAN_BASE_URL}/shop-faas/mmeckolbasenode/base/getBindChannelList?${new URLSearchParams({
    token: '',
    lang: 'zh_CN',
  })}`;
  return xiaodianGetWithCredential<BindChannelListData>(
    credential,
    url,
    '检测绑定视频号',
    options.userAgent,
    {
      Referer: bindChannelRefererFor(credential),
      'User-Agent': `${options.userAgent || DEFAULT_XIAODIAN_USER_AGENT} ShopWebview`,
      biz_magic: '',
      ...magicHeaders(credential),
      'potter-scene': potterSceneFor(credential),
    },
    {},
    proxyAgent,
  );
}

async function getSkipFinderPlatformCode(
  credential: XiaodianCredential,
  finderUsername: string,
  options: GetChannelsSessionByXiaodianCredentialOptions,
  proxyAgent?: XiaodianProxyAgent,
): Promise<XiaodianHttpResult<SkipFinderPlatformCodeData>> {
  const url = `${XIAODIAN_BASE_URL}/shop-faas/mmeckolbasenode/base/genSkipFinderPlatformCode?${new URLSearchParams({
    token: '',
    lang: 'zh_CN',
    toFinderusername: finderUsername,
  })}`;
  return xiaodianGetWithCredential<SkipFinderPlatformCodeData>(
    credential,
    url,
    'genSkipFinderPlatformCode',
    options.userAgent,
    {
      Referer: homeUrlFor(credential),
      'User-Agent': `${options.userAgent || DEFAULT_XIAODIAN_USER_AGENT} ShopWebview`,
      biz_magic: '',
      ...magicHeaders(credential),
      'potter-scene': potterSceneFor(credential),
    },
    { ignoreRootCode: true },
    proxyAgent,
  );
}

async function authChannelsWithExternalCode(
  externalCode: string,
  options: GetChannelsSessionByXiaodianCredentialOptions,
  proxyAgent?: XiaodianProxyAgent,
): Promise<{
  cookies: XiaodianCookieMap;
  raw: ChannelsAuthData;
}> {
  const channelsCookie: XiaodianCookieMap = {};
  const authPageUrl = 'https://channels.weixin.qq.com/platform/post/create';
  const referer = `${authPageUrl}?${new URLSearchParams({
    external_token: externalCode,
    external_scene: '8',
    external_type: '8',
  })}`;
  const response = await $http.post<unknown>(
    `https://channels.weixin.qq.com/cgi-bin/mmfinderassistant-bin/auth/auth_with_external?${new URLSearchParams({
      _aid: crypto.randomUUID(),
      _rid: crypto.randomUUID().slice(0, 8),
      _pageUrl: authPageUrl,
    })}`,
    {
      externalCode,
      externalAuthScene: 8,
      timestamp: String(Date.now()),
      _log_finder_uin: '',
      _log_finder_id: '',
      rawKeyBuff: '',
      pluginSessionId: null,
      scene: 7,
      reqScene: 7,
    },
    {
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        Origin: 'https://channels.weixin.qq.com',
        Referer: referer,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0',
        'sec-ch-ua': '"Not;A=Brand";v="8", "Chromium";v="150", "Microsoft Edge";v="150"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'X-WECHAT-UIN': '0000000000',
        'finger-print-device-id': options.channelsFingerprintDeviceId || crypto.randomBytes(16).toString('hex'),
        Cookie: 'sessionid=',
      },
      maxRedirects: 0,
      ...buildProxyRequestConfig(proxyAgent),
    },
  );
  mergeSetCookiesIntoMap(channelsCookie, response.headers);
  const data = normalizeResponseData<unknown>(response.data) as unknown as ChannelsAuthData | null;
  if ([301, 302, 401, 403].includes(response.status)) {
    throw new Error(`视频号 sessionid 请求返回 ${response.status}`);
  }
  if (!data) throw new Error('视频号 sessionid 请求返回了非 JSON 内容');
  const ret = data.errCode ?? data.ret ?? data.baseResp?.ret ?? data.base_resp?.ret;
  if (ret !== undefined && Number(ret) !== 0) {
    const message =
      data.message ||
      data.errMsg ||
      data.err_msg ||
      data.baseResp?.errMsg ||
      data.base_resp?.err_msg ||
      `返回码 ${ret}`;
    throw new Error(`视频号 sessionid 请求失败，${message}`);
  }
  return {
    cookies: channelsCookie,
    raw: data,
  };
}

async function xiaodianGet<TData>(
  url: string,
  context: XiaodianLoginContext,
  actionName: string,
  headers: Record<string, string> = {},
  proxyAgent?: XiaodianProxyAgent,
): Promise<XiaodianHttpResult<TData>> {
  const response = await $http.get<unknown>(url, {
    headers: {
      ...buildLoginContextHeaders(context),
      ...headers,
    },
    maxRedirects: 0,
    ...buildProxyRequestConfig(proxyAgent),
  });
  mergeSetCookiesIntoMap(context.cookies, response.headers);
  return assertXiaodianResponse<TData>(response.status, response.data, actionName);
}

async function xiaodianPost<TData>(
  url: string,
  context: XiaodianLoginContext,
  body: string,
  actionName: string,
  headers: Record<string, string> = {},
  proxyAgent?: XiaodianProxyAgent,
): Promise<XiaodianHttpResult<TData>> {
  const response = await $http.post<unknown>(url, body, {
    headers: {
      ...buildLoginContextHeaders(context),
      ...headers,
    },
    maxRedirects: 0,
    ...buildProxyRequestConfig(proxyAgent),
  });
  mergeSetCookiesIntoMap(context.cookies, response.headers);
  return assertXiaodianResponse<TData>(response.status, response.data, actionName);
}

async function xiaodianGetWithCredential<TData>(
  credential: XiaodianCredential,
  url: string,
  actionName: string,
  userAgent: string | undefined,
  headers: Record<string, string> = {},
  assertOptions: XiaodianAssertOptions = {},
  proxyAgent?: XiaodianProxyAgent,
): Promise<XiaodianHttpResult<TData>> {
  const response = await $http.get<unknown>(url, {
    headers: {
      ...buildCredentialHeaders(credential, userAgent),
      ...headers,
    },
    maxRedirects: 0,
    ...buildProxyRequestConfig(proxyAgent),
  });
  mergeSetCookiesIntoMap(credential.cookies, response.headers);
  credential.cookie = cookieHeaderFromMap(credential.cookies);
  return assertXiaodianResponse<TData>(response.status, response.data, actionName, assertOptions);
}

async function xiaodianPostWithCredential<TData>(
  credential: XiaodianCredential,
  url: string,
  body: string,
  actionName: string,
  userAgent: string | undefined,
  proxyAgent?: XiaodianProxyAgent,
): Promise<XiaodianHttpResult<TData>> {
  const response = await $http.post<unknown>(url, body, {
    headers: {
      ...buildCredentialHeaders(credential, userAgent),
      'Content-Type': 'application/json;charset=UTF-8',
    },
    maxRedirects: 0,
    ...buildProxyRequestConfig(proxyAgent),
  });
  mergeSetCookiesIntoMap(credential.cookies, response.headers);
  credential.cookie = cookieHeaderFromMap(credential.cookies);
  return assertXiaodianResponse<TData>(response.status, response.data, actionName);
}

function assertXiaodianResponse<TData>(
  status: number,
  responseData: unknown,
  actionName: string,
  options: XiaodianAssertOptions = {},
): XiaodianHttpResult<TData> {
  if ([301, 302, 401, 403].includes(status)) {
    throw new Error(`${actionName} 返回 ${status}，需要重新扫码登录`);
  }
  const data = normalizeResponseData<TData>(responseData);
  if (!data) throw new Error(`${actionName} 没有返回 JSON，可能被登录页拦截`);
  const code = options.ignoreRootCode
    ? getApiCodeWithoutRootCode(data as XiaodianApiResponse<unknown>)
    : getApiCode(data);
  if (code !== undefined && Number(code) !== 0) {
    const message = getApiMessage(data as XiaodianApiResponse<unknown>) || `返回码 ${code}`;
    throw new Error(`${actionName} 鉴权失败，${message}`);
  }
  return {
    status,
    data: data as TData & XiaodianApiResponse<unknown>,
  };
}

interface XiaodianAssertOptions {
  /**
   * genSkipFinderPlatformCode 的根字段 code 是 externalCode，不是错误码。
   */
  ignoreRootCode?: boolean;
}

function getApiCodeWithoutRootCode(data: XiaodianApiResponse<unknown>): number | string | undefined {
  return data.errCode ?? data.ret ?? data.baseResp?.ret ?? data.base_resp?.ret;
}

function buildLoginPageHeaders(context: XiaodianLoginContext): Record<string, string> {
  return buildLoginContextHeaders(context);
}

function buildBaseXiaodianHeaders(deviceId: string, userAgent: string): Record<string, string> {
  return {
    accept: 'application/json, text/plain, */*',
    'accept-language': 'zh-CN,zh;q=0.9',
    'user-agent': userAgent,
    pcapp_new_login: '1',
    pcapp_uuid: deviceId,
    referer: XIAODIAN_LOGIN_URL,
  };
}

function buildLoginContextHeaders(context: XiaodianLoginContext): Record<string, string> {
  const headers = buildBaseXiaodianHeaders(context.deviceId, context.userAgent);
  const cookie = cookieHeaderFromMap(context.cookies);
  if (cookie) headers.cookie = cookie;
  return headers;
}

function buildCredentialHeaders(credential: XiaodianCredential, userAgent: string | undefined): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json, text/plain, */*',
    Referer: refererFor(credential),
    'User-Agent': userAgent || DEFAULT_XIAODIAN_USER_AGENT,
    'sec-ch-ua': '"Not?A_Brand";v="8", "Chromium";v="108"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    kf_scene: kfSceneFor(credential),
    web_version: '3.1.30',
    pcapp_new_login: '1',
    pcapp_uuid: credential.pcappUuid || getDefaultDeviceId(),
    cookie: cookieHeaderFromMap(credential.cookies),
  };
  if (!headers.kf_scene) delete headers.kf_scene;
  return headers;
}

function refererFor(credential: XiaodianCredential): string {
  if (credential.loginType === 'talent') return `${XIAODIAN_BASE_URL}/talent/kf`;
  if (credential.loginType === 'supplier') return `${XIAODIAN_BASE_URL}/supplier/kf`;
  return `${XIAODIAN_BASE_URL}/shop/kf`;
}

function homeUrlFor(credential: XiaodianCredential): string {
  if (credential.loginType === 'talent') return `${XIAODIAN_BASE_URL}/talent/home`;
  if (credential.loginType === 'supplier') return `${XIAODIAN_BASE_URL}/supplier/home`;
  return `${XIAODIAN_BASE_URL}/shop/home`;
}

function bindChannelRefererFor(credential: XiaodianCredential): string {
  return `${XIAODIAN_BASE_URL}/${credential.loginType}/channel/finder`;
}

function kfSceneFor(credential: XiaodianCredential): string {
  if (credential.loginType === 'talent') return '8';
  return '';
}

function magicHeaders(credential: XiaodianCredential): Record<string, string> {
  if (credential.loginType === 'talent') return { talent_magic: credential.cookies.talent_magic || '' };
  if (credential.loginType === 'supplier') return { supplier_magic: credential.cookies.supplier_magic || '' };
  return { biz_magic: credential.cookies.biz_magic || '' };
}

function potterSceneFor(credential: XiaodianCredential): string {
  if (credential.loginType === 'talent') return 'talent';
  if (credential.loginType === 'supplier') return 'supplier';
  return 'shop';
}

function cleanupExpiredLoginSessions(): void {
  const now = Date.now();
  for (const [loginSessionId, context] of loginSessionStore.entries()) {
    if (context.expireAt <= now) loginSessionStore.delete(loginSessionId);
  }
}
