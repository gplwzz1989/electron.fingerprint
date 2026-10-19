import { createHttpInstance } from '@/http';
import { HtmlDocument } from '@/htmlAgilityPack';
import { CancelToken, privateKey } from '@/utils/CancelToken';
import { auditStatusEnum, logger, publishStatusEnum, SetProgressNewEvent, Task } from '@/utils';
import { AxiosError, AxiosInstance } from 'axios';
import { aws4Interceptor } from 'aws4-axios';
import crc from 'crc';
import crypto from 'crypto';
import dayjs from 'dayjs';
import { EventEmitter } from 'events';
import fs from 'fs';
import { BaseResult } from '../baseResult';
import { ImageInfo, MediaStatusResultOutput, PlatformAuthorInfo } from '../baseModel';
import { errorCode } from '../errorCode';
import { ITask } from '../baseTask';
import { createKuaiProxyAgent, IWebProxy } from '../webproxy';

const DONG_CHE_HAO_ORIGIN = 'https://mp.dcdapp.com';
const DONG_CHE_HAO_REFERER = `${DONG_CHE_HAO_ORIGIN}/profile_v2/publish`;
const DONG_CHE_HAO_ROOT_REFERER = `${DONG_CHE_HAO_ORIGIN}/`;
const DONG_CHE_HAO_ARTICLE_REFERER = `${DONG_CHE_HAO_ORIGIN}/profile_v2/publish/article`;
const DONG_CHE_HAO_VIDEO_REFERER = `${DONG_CHE_HAO_ORIGIN}/profile_v2/publish/video`;
const DONG_CHE_HAO_DYNAMIC_REFERER = `${DONG_CHE_HAO_ORIGIN}/profile_v2/publish/post`;
const DONG_CHE_HAO_ARTICLE_PUBLISH_URL = `${DONG_CHE_HAO_ORIGIN}/motor/content_publish/publish_mp_article/v1`;
const DONG_CHE_HAO_VIDEO_PUBLISH_URL = `${DONG_CHE_HAO_ORIGIN}/motor/content_publish/publish_video/v1`;
const DONG_CHE_HAO_DYNAMIC_PUBLISH_URL = `${DONG_CHE_HAO_ORIGIN}/motor/discuss_ugc/cheyou_publish_forum/v2/`;
const DONG_CHE_HAO_CONTENT_LIST_URL = `${DONG_CHE_HAO_ORIGIN}/motor/creator/api/content/v2/get_graphic`;
const DONG_CHE_HAO_SHORT_VIDEO_CONTENT_LIST_URL = `${DONG_CHE_HAO_ORIGIN}/motor/mp_index/api/short_video`;
const DONG_CHE_HAO_DYNAMIC_CONTENT_LIST_URL = `${DONG_CHE_HAO_ORIGIN}/api/content/short_graphic`;
const DONG_CHE_HAO_ARTICLE_CONTENT_LIST_REFERER = `${DONG_CHE_HAO_ORIGIN}/profile_v2/manage/content/article`;
const DONG_CHE_HAO_VIDEO_CONTENT_LIST_REFERER = `${DONG_CHE_HAO_ORIGIN}/profile_v2/manage/content/video`;
const DONG_CHE_HAO_DYNAMIC_CONTENT_LIST_REFERER = `${DONG_CHE_HAO_ORIGIN}/profile_v2/manage/content/posts`;
const IMAGE_X_URL = 'https://imagex.bytedanceapi.com';
const IMAGE_SERVICE_ID = 'f042mdwyw7';
const VAS_UPLOAD_URL = 'https://vas-lf-x.snssdk.com/video/openapi/v1/';
const VOD_UPLOAD_URL = 'https://vod.bytedanceapi.com';
const DONG_CHE_HAO_VOD_SPACE = 'motor_content_cloud';
const DONG_CHE_HAO_VIDEO_UPLOAD_TOKEN_URL = `${DONG_CHE_HAO_ORIGIN}/motor/mp_node/api/upload_token`;

type JsonObject = Record<string, any>;

const asObject = (value: unknown): JsonObject => (value && typeof value === 'object' ? (value as JsonObject) : {});

const asResponseObject = (value: unknown): JsonObject => {
  if (typeof value !== 'string') return asObject(value);
  try {
    return asObject(JSON.parse(value));
  } catch {
    return {};
  }
};

const summarizeResponse = (value: unknown): string => {
  try {
    const text = typeof value === 'string' ? value : JSON.stringify(value);
    return String(text ?? '')
      .replace(/\s+/g, ' ')
      .slice(0, 500);
  } catch {
    return String(value ?? '')
      .replace(/\s+/g, ' ')
      .slice(0, 500);
  }
};

const summarizeResponseShape = (value: unknown): string => {
  const body = asResponseObject(value);
  const data = body.data;
  const dataShape = Array.isArray(data)
    ? `array(${data.length})`
    : `object(${Object.keys(asObject(data)).sort().join(',')})`;
  const status = body.status ?? body.code ?? body.err_no ?? body.errno ?? 'missing';
  const message = getResponseMessage(body).replace(/\s+/g, ' ').slice(0, 120) || 'empty';
  return `rootKeys=${Object.keys(body).sort().join(',')}; data=${dataShape}; status=${String(
    status,
  )}; message=${message}; publishId=${getPublishId(body) ? 'present' : 'missing'}`;
};

const summarizePublishForm = (postData: string): string => {
  const params = new URLSearchParams(postData);
  const fields = Array.from(params.keys());
  return [
    `fields=${fields.join(',')}`,
    `videoId=${params.get('video_id') ? 'present' : 'missing'}`,
    `thumbUri=${params.get('thumb_uri') ? 'present' : 'missing'}`,
    `verticalCover=${params.get('vertical_cover_image') ? 'present' : 'missing'}`,
    `creatorStatement=${params.get('creator_statement') ? 'present' : 'missing'}`,
    `itemId=${params.has('item_id') ? (params.get('item_id') ? 'present' : 'empty') : 'missing'}`,
    `timerTime=${params.get('timer_time') ?? 'immediate'}`,
  ].join('; ');
};

const getResponseMessage = (body: JsonObject): string => {
  const data = asObject(body.data);
  const baseResponse = asObject(data.BaseResp);
  return String(
    body.message ??
      body.Message ??
      body.msg ??
      body.Msg ??
      data.message ??
      data.Message ??
      data.msg ??
      data.Msg ??
      baseResponse.StatusMessage ??
      body.error?.message ??
      body.errmsg ??
      body.err_show ??
      data.err_show ??
      data.toast_message ??
      '',
  );
};

const getResponseCode = (body: JsonObject, fallback: number = errorCode.data_error): number => {
  const value = Number(body.code ?? body.err_no ?? body.errno ?? body.status ?? body.status_code ?? body.returncode);
  return Number.isFinite(value) && value !== 0 ? value : fallback;
};

const getCookieValue = (cookie: string, name: string): string => {
  const item = cookie
    ?.split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${name}=`));
  return item?.slice(name.length + 1) ?? '';
};

/**
 * 动态发布前的 HEAD 请求会下发新的 csrf_session_id。Node 端不会像浏览器
 * 一样自动把 Set-Cookie 带到下一次请求，所以需要将响应 Cookie 合并回请求头。
 */
const mergeSetCookieHeader = (cookie: string, headers: JsonObject): string => {
  const cookies = new Map<string, string>();
  for (const item of String(cookie ?? '').split(';')) {
    const separator = item.indexOf('=');
    if (separator <= 0) continue;
    const name = item.slice(0, separator).trim();
    if (name) cookies.set(name, item.trim());
  }

  const rawSetCookie = headers['set-cookie'] ?? headers['Set-Cookie'];
  const setCookies = Array.isArray(rawSetCookie) ? rawSetCookie : rawSetCookie ? [rawSetCookie] : [];
  for (const item of setCookies) {
    const pair = String(item).split(';', 1)[0].trim();
    const separator = pair.indexOf('=');
    if (separator <= 0) continue;
    const name = pair.slice(0, separator).trim();
    if (name) cookies.set(name, pair);
  }
  return Array.from(cookies.values()).join('; ');
};

const createDongCheHaoHttp = (proxy?: IWebProxy): AxiosInstance => {
  const agent = proxy?.serverAdd ? createKuaiProxyAgent(proxy) : undefined;
  return createHttpInstance(agent ? { httpAgent: agent, httpsAgent: agent } : undefined);
};

const dongCheHaoHeaders = (cookie: string, referer: string = DONG_CHE_HAO_REFERER): Record<string, string> => {
  const headers: Record<string, string> = {
    cookie,
    Referer: referer,
    Origin: DONG_CHE_HAO_ORIGIN,
  };
  const csrfToken = getCookieValue(cookie, 'xigua_csrf_token');
  if (csrfToken) headers['x-csrf-token'] = csrfToken;
  return headers;
};

const toImageSource = (source: string): string => (source?.startsWith('//') ? `https:${source}` : source);

const readBinary = async (source: string, proxy?: IWebProxy): Promise<Buffer> => {
  const filePath = source?.startsWith('yi-file://') ? source.slice('yi-file://'.length) : source;
  if (filePath?.toLowerCase().startsWith('http')) {
    const response = await createDongCheHaoHttp(proxy).get(filePath, { responseType: 'arraybuffer' });
    if (response.status < 200 || response.status >= 300 || !response.data?.length) {
      throw new Error(`文件下载失败:${response.status}:${source}`);
    }
    return Buffer.from(response.data);
  }
  if (!filePath || !fs.existsSync(filePath)) throw new Error(`文件不存在:${filePath}`);
  const data = await fs.promises.readFile(filePath);
  if (!data.length) throw new Error(`文件为空:${filePath}`);
  return data;
};

const crc32 = (data: Buffer): string => crc.crc32(data).toString(16).padStart(8, '0');

const firstPositiveNumber = (...values: unknown[]): number => {
  for (const value of values) {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue) && numberValue > 0) return numberValue;
  }
  return 0;
};

/**
 * 网页端发布表单不会直接提交 VAS 返回的高精度时长，而是保留 3 位小数。
 * 例如上传信息中的 4.086009，官方最终请求会发送 4.086。
 */
const formatDongCheHaoVideoDuration = (...values: unknown[]): string => {
  const duration = firstPositiveNumber(...values);
  return duration > 0 ? String(Number(duration.toFixed(3))) : '0';
};

/**
 * 懂车号视频接口的 timer_time 使用 Unix 秒级时间戳；统一任务输入的
 * prePubTime 是 13 位毫秒级时间戳。
 */
const formatDongCheHaoVideoTimerTime = (prePubTime?: number): string | undefined => {
  const milliseconds = Number(prePubTime);
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return undefined;
  const seconds = Math.floor(milliseconds / 1000);
  return seconds > 0 ? String(seconds) : undefined;
};

const isDongCheHaoVideoScheduled = (prePubTime?: number): boolean => {
  const milliseconds = Number(prePubTime);
  return Number.isFinite(milliseconds) && milliseconds > Date.now();
};

const getPublishId = (body: JsonObject): string | undefined => {
  const data = asObject(body.data);
  const nestedData = asObject(data.data);
  const id =
    data.item_id_str ??
    data.item_id ??
    data.itemId ??
    data.pgc_id ??
    data.pgcId ??
    data.group_id ??
    data.groupId ??
    data.id ??
    nestedData.item_id_str ??
    nestedData.item_id ??
    nestedData.itemId ??
    nestedData.pgc_id ??
    nestedData.pgcId ??
    nestedData.group_id ??
    nestedData.groupId ??
    body.item_id_str ??
    body.item_id ??
    body.itemId ??
    body.pgc_id ??
    body.pgcId ??
    body.group_id ??
    body.groupId;
  return id === undefined || id === null || id === '' ? undefined : String(id);
};

/** 懂车号图文动态成功响应使用 gid_str/thread_id，而不是文章接口的 item_id。 */
export const getDongCheHaoDynamicPublishId = (body: JsonObject): string | undefined => {
  const data = asObject(body.data);
  const id =
    data.gid_str ??
    data.gid ??
    data.thread_id ??
    data.threadId ??
    body.gid_str ??
    body.gid ??
    body.thread_id ??
    body.threadId;
  return id === undefined || id === null || id === '' ? undefined : String(id);
};

const isSuccessMessage = (body: JsonObject): boolean => {
  const message = getResponseMessage(body).toLowerCase();
  return message === 'success' || message === 'ok' || message.includes('成功');
};

const isSuccessfulValue = (value: unknown): boolean => {
  if (value === undefined || value === null || value === '' || value === true) return true;
  const normalized = String(value).trim().toLowerCase();
  return normalized === '0' || normalized === 'true' || normalized === 'success' || normalized === 'ok';
};

const isErrorCodeValue = (value: unknown): boolean => {
  if (value === undefined || value === null || value === '') return false;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue !== 0 : !isSuccessfulValue(value);
};

const buildPublishResult = (
  taskId: string,
  body: JsonObject,
  defaultMessage: string,
): DongCheHaoPublishResultOutput => {
  const publishId = getPublishId(body);
  const message = getResponseMessage(body) || defaultMessage;
  if (publishId || isSuccessMessage(body)) {
    return { code: errorCode.ok, msg: message, taskId, publishId };
  }
  if (/login|登录|未登录/i.test(message)) {
    return { code: errorCode.loginExpire, msg: message, taskId };
  }
  return { code: getResponseCode(body), msg: message, taskId };
};

export interface DongCheHaoUserInfoResponse {
  status?: number | string;
  message?: string;
  msg?: string;
  data?: {
    user?: JsonObject;
    media?: JsonObject;
    [key: string]: any;
  };
  [key: string]: any;
}

export const getDongCheHaoUserInfoResponse = async (
  cookie: string,
  proxy?: IWebProxy,
): Promise<DongCheHaoUserInfoResponse> => {
  const response = await createDongCheHaoHttp(proxy).get<DongCheHaoUserInfoResponse>(
    `${DONG_CHE_HAO_ORIGIN}/motor/mp_index/api/user/info?`,
    { headers: dongCheHaoHeaders(cookie) },
  );
  return response.data;
};

export const getDongCheHaoUserInfo = async (cookie: string, proxy?: IWebProxy): Promise<PlatformAuthorInfo> => {
  const result: PlatformAuthorInfo = { code: errorCode.ok, msg: '' };
  try {
    const userInfo = await getDongCheHaoUserInfoResponse(cookie, proxy);
    const data = asObject(userInfo?.data);
    const user = asObject(data.user);
    const media = asObject(data.media);
    const userId = user.id ?? user.user_id ?? data.id;
    const message = getResponseMessage(asObject(userInfo));

    result.raw = userInfo?.data ?? userInfo;
    if (userId === undefined || userId === null || String(userId) === '') {
      result.code = /login|登录|未登录/i.test(message) ? errorCode.loginExpire : getResponseCode(asObject(userInfo));
      result.msg = message || '获取懂车号用户信息失败';
      return result;
    }

    result.yixiaoerId = String(userId);
    result.yixiaoerName = String(media.display_name ?? media.name ?? user.screen_name ?? user.name ?? '');
    result.yixiaoerImageUrl = media.https_avatar_url ?? media.avatar_url ?? user.https_avatar_url ?? user.avatar_url;
    result.code = errorCode.ok;
    result.msg = message;
  } catch (error) {
    result.code = error instanceof AxiosError ? errorCode.request_error : errorCode.exception;
    result.msg = error instanceof Error ? error.message : String(error ?? '获取懂车号用户信息失败');
  }
  return result;
};

/** 懂车号作品列表中的内容类型。ImageText 是客户端对动态/短图文的兼容叫法。 */
export type DongCheHaoContentType = 'article' | 'video' | 'dynamic' | 'imageText';

export interface DongCheHaoContentListItem extends JsonObject {
  item_id?: string | number;
  item_id_str?: string;
  gid?: string | number;
  gid_str?: string;
  thread_id?: string | number;
  thread_id_str?: string;
  status?: string | number;
  status_desc?: string;
  item_status?: string | number;
  create_time?: string | number;
  content_publish_time?: string | number;
  share_url?: string;
  title?: string;
  content?: string;
}

export interface DongCheHaoContentListData extends JsonObject {
  list?: DongCheHaoContentListItem[];
  has_more?: boolean | number | string;
  hasMore?: boolean | number | string;
  offset?: string | number;
  start_cursor?: string | number;
  end_cursor?: string | number;
  startCursor?: string | number;
  endCursor?: string | number;
  total?: number;
}

export interface DongCheHaoContentListResponse extends JsonObject {
  status?: number | string;
  code?: number | string;
  message?: string;
  msg?: string;
  data?: DongCheHaoContentListData | DongCheHaoContentListItem[];
}

export interface DongCheHaoContentListOptions {
  /** 图文/视频接口的 page_size；动态接口使用 count。 */
  pageSize?: number;
  count?: number;
  offset?: string | number;
  status?: number | string;
  sort?: number | string;
  /** 下一页游标，图文/视频接口会以 end_cursor 传递。 */
  cursor?: string | number;
}

type DongCheHaoContentListSource = 'graphic' | 'shortVideo' | 'both';

const normalizeDongCheHaoContentType = (
  contentType: DongCheHaoContentType | 0 | 1,
): Exclude<DongCheHaoContentType, 'imageText'> => {
  if (contentType === 0 || contentType === 'article') return 'article';
  if (contentType === 1 || contentType === 'video') return 'video';
  return 'dynamic';
};

const toPositiveInteger = (value: unknown, fallback: number): number => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? Math.trunc(numberValue) : fallback;
};

const toNonNegativeInteger = (value: unknown, fallback: number): number => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? Math.trunc(numberValue) : fallback;
};

/** 根据浏览器网络请求构造懂车号文章、视频、动态作品列表参数。 */
export const buildDongCheHaoContentListParams = (
  contentType: DongCheHaoContentType | 0 | 1,
  options: DongCheHaoContentListOptions = {},
): JsonObject => {
  const normalizedType = normalizeDongCheHaoContentType(contentType);
  if (normalizedType === 'dynamic') {
    return {
      count: toPositiveInteger(options.count, 7),
      offset: toNonNegativeInteger(options.offset, 0),
      status: options.status ?? 0,
    };
  }

  const params: JsonObject = {
    feature: normalizedType === 'article' ? 0 : 1,
    sort: options.sort ?? 2,
    status: options.status ?? 0,
    page_size: toPositiveInteger(options.pageSize, 20),
  };
  if (options.cursor !== undefined && options.cursor !== null && String(options.cursor) !== '') {
    params.end_cursor = options.cursor;
  }
  return params;
};

const getDongCheHaoContentListUrl = (contentType: Exclude<DongCheHaoContentType, 'imageText'>): string =>
  contentType === 'dynamic' ? DONG_CHE_HAO_DYNAMIC_CONTENT_LIST_URL : DONG_CHE_HAO_CONTENT_LIST_URL;

const getDongCheHaoContentListReferer = (contentType: Exclude<DongCheHaoContentType, 'imageText'>): string => {
  switch (contentType) {
    case 'article':
      return DONG_CHE_HAO_ARTICLE_CONTENT_LIST_REFERER;
    case 'video':
      return DONG_CHE_HAO_VIDEO_CONTENT_LIST_REFERER;
    default:
      return DONG_CHE_HAO_DYNAMIC_CONTENT_LIST_REFERER;
  }
};

/** 查询懂车号文章、视频、动态作品列表，保留官方原始响应供状态查询和上层使用。 */
export const getDongCheHaoContentListResponse = async (
  cookie: string,
  contentType: DongCheHaoContentType | 0 | 1,
  options: DongCheHaoContentListOptions = {},
  proxy?: IWebProxy,
): Promise<DongCheHaoContentListResponse> => {
  const normalizedType = normalizeDongCheHaoContentType(contentType);
  const response = await createDongCheHaoHttp(proxy).get<DongCheHaoContentListResponse>(
    getDongCheHaoContentListUrl(normalizedType),
    {
      headers: {
        ...dongCheHaoHeaders(cookie, getDongCheHaoContentListReferer(normalizedType)),
        Accept: 'application/json, text/plain, */*',
      },
      params: buildDongCheHaoContentListParams(normalizedType, options),
    },
  );
  return asResponseObject(response.data) as DongCheHaoContentListResponse;
};

type DongCheHaoListSizeOrOptions = number | DongCheHaoContentListOptions;

export const getDongCheHaoArticleContentListResponse = async (
  cookie: string,
  pageSizeOrOptions: DongCheHaoListSizeOrOptions = 20,
  proxy?: IWebProxy,
): Promise<DongCheHaoContentListResponse> =>
  getDongCheHaoContentListResponse(
    cookie,
    'article',
    typeof pageSizeOrOptions === 'number' ? { pageSize: pageSizeOrOptions } : pageSizeOrOptions,
    proxy,
  );

export const getDongCheHaoVideoContentListResponse = async (
  cookie: string,
  pageSizeOrOptions: DongCheHaoListSizeOrOptions = 20,
  proxy?: IWebProxy,
): Promise<DongCheHaoContentListResponse> =>
  getDongCheHaoContentListResponse(
    cookie,
    'video',
    typeof pageSizeOrOptions === 'number' ? { pageSize: pageSizeOrOptions } : pageSizeOrOptions,
    proxy,
  );

export const getDongCheHaoDynamicContentListResponse = async (
  cookie: string,
  countOrOptions: DongCheHaoListSizeOrOptions = 7,
  offsetOrProxy: string | number | IWebProxy = 0,
  proxy?: IWebProxy,
): Promise<DongCheHaoContentListResponse> => {
  if (typeof countOrOptions === 'object') {
    return getDongCheHaoContentListResponse(
      cookie,
      'dynamic',
      countOrOptions,
      typeof offsetOrProxy === 'object' ? offsetOrProxy : proxy,
    );
  }
  return getDongCheHaoContentListResponse(
    cookie,
    'dynamic',
    {
      count: countOrOptions,
      offset: typeof offsetOrProxy === 'object' ? 0 : offsetOrProxy,
    },
    typeof offsetOrProxy === 'object' ? offsetOrProxy : proxy,
  );
};

/** 竖版视频作品列表接口，和 get_graphic 的普通视频列表是两套官方数据源。 */
export const buildDongCheHaoShortVideoContentListParams = (options: DongCheHaoContentListOptions = {}): JsonObject => ({
  count: toPositiveInteger(options.count, 7),
  offset: options.offset ?? 0,
  status: options.status ?? 0,
});

export const getDongCheHaoShortVideoContentListResponse = async (
  cookie: string,
  countOrOptions: DongCheHaoListSizeOrOptions = 7,
  offsetOrProxy: string | number | IWebProxy = 0,
  proxy?: IWebProxy,
): Promise<DongCheHaoContentListResponse> => {
  const options: DongCheHaoContentListOptions =
    typeof countOrOptions === 'number'
      ? {
          count: countOrOptions,
          offset: typeof offsetOrProxy === 'object' ? 0 : offsetOrProxy,
        }
      : countOrOptions;
  const requestProxy = typeof offsetOrProxy === 'object' ? offsetOrProxy : proxy;
  const response = await createDongCheHaoHttp(requestProxy).get<DongCheHaoContentListResponse>(
    DONG_CHE_HAO_SHORT_VIDEO_CONTENT_LIST_URL,
    {
      headers: {
        ...dongCheHaoHeaders(cookie, DONG_CHE_HAO_VIDEO_CONTENT_LIST_REFERER),
        Accept: 'application/json, text/plain, */*',
      },
      params: buildDongCheHaoShortVideoContentListParams(options),
    },
  );
  return asResponseObject(response.data) as DongCheHaoContentListResponse;
};

export const getDongCheHaoShortVideoContentList = getDongCheHaoShortVideoContentListResponse;
export const getDongCheHaoVerticalVideoContentListResponse = getDongCheHaoShortVideoContentListResponse;

/** 兼容平台模块中常见的无 Response 后缀命名。 */
export const getDongCheHaoArticleContentList = getDongCheHaoArticleContentListResponse;
export const getDongCheHaoVideoContentList = getDongCheHaoVideoContentListResponse;
export const getDongCheHaoDynamicContentList = getDongCheHaoDynamicContentListResponse;

const getDongCheHaoContentListData = (body: DongCheHaoContentListResponse): DongCheHaoContentListData => {
  if (Array.isArray(body.data)) return { ...(body as JsonObject), list: body.data } as DongCheHaoContentListData;
  const data = asObject(body.data);
  if (Array.isArray(data.list)) return { ...(body as JsonObject), ...data } as DongCheHaoContentListData;
  if (Array.isArray(data.data)) {
    return { ...(body as JsonObject), ...data, list: data.data } as DongCheHaoContentListData;
  }
  const nestedData = asObject(data.data);
  if (Array.isArray(nestedData.list)) {
    return { ...(body as JsonObject), ...data, ...nestedData } as DongCheHaoContentListData;
  }
  if (Array.isArray((body as JsonObject).list)) {
    return { ...(body as JsonObject), list: (body as JsonObject).list } as DongCheHaoContentListData;
  }
  return data as DongCheHaoContentListData;
};

export const getDongCheHaoContentListItems = (
  body: DongCheHaoContentListResponse | unknown,
): DongCheHaoContentListItem[] => {
  const response = asResponseObject(body) as DongCheHaoContentListResponse;
  const data = getDongCheHaoContentListData(response);
  return Array.isArray(data.list) ? data.list.filter((item) => item && typeof item === 'object') : [];
};

const getDongCheHaoListResponseCode = (body: DongCheHaoContentListResponse): number => {
  const rawValue = body.status ?? body.code ?? body.err_no ?? body.errno ?? body.status_code;
  if (rawValue === undefined || rawValue === null || rawValue === '') return errorCode.ok;
  if (typeof rawValue === 'string' && /^(success|ok)$/i.test(rawValue.trim())) return errorCode.ok;
  const code = Number(rawValue);
  return Number.isFinite(code) ? code : errorCode.data_error;
};

const getDongCheHaoListHasMore = (data: DongCheHaoContentListData): boolean => {
  const value = data.has_more ?? data.hasMore;
  if (value !== undefined) {
    return value === true || value === 1 || /^(true|1|yes)$/i.test(String(value));
  }
  return (
    Array.isArray(data.list) &&
    data.list.length > 0 &&
    data.list.length >= toPositiveInteger(data.total, data.list.length + 1)
  );
};

const getDongCheHaoListCursor = (data: DongCheHaoContentListData): string | number | undefined =>
  data.end_cursor ?? data.endCursor;

const hasDongCheHaoValue = (value: unknown): boolean =>
  value !== undefined && value !== null && String(value).trim() !== '';

const getDongCheHaoItemIdCandidates = (
  item: DongCheHaoContentListItem,
  contentType: Exclude<DongCheHaoContentType, 'imageText'>,
): string[] => {
  const values =
    contentType === 'dynamic'
      ? [
          item.thread_id_str,
          item.thread_id,
          item.gid_str,
          item.gid,
          item.item_id_str,
          item.item_id,
          item.relative_id,
          item.id,
        ]
      : [
          item.item_id_str,
          item.item_id,
          item.gid_str,
          item.gid,
          item.group_id_str,
          item.group_id,
          item.relative_id,
          item.pgc_id,
          item.pgcId,
          item.id,
        ];
  return values.filter(hasDongCheHaoValue).map((value) => String(value).trim());
};

const getDongCheHaoItemStatusValue = (item: DongCheHaoContentListItem): unknown =>
  [item.status, item.status_code, item.item_status, item.itemStatus, item.pgc_status, item.pgcStatus].find(
    hasDongCheHaoValue,
  );

const getDongCheHaoItemStatusText = (item: DongCheHaoContentListItem): string =>
  getDongCheHaoItemString(
    item.status_desc,
    item.statusDesc,
    item.status_description,
    item.item_status_desc,
    item.itemStatusDesc,
    item.audit_status_desc,
    item.auditStatusDesc,
    item.reject_reason,
    item.rejectReason,
    item.un_recommend_text,
    item.confirm_reason,
  ) ?? '';

/** 将懂车号作品列表的状态码统一成平台审核状态。 */
export const mapDongCheHaoAuditStatus = (
  item: DongCheHaoContentListItem,
  contentType: DongCheHaoContentType = 'video',
  contentSource: Exclude<DongCheHaoContentListSource, 'both'> = 'graphic',
): auditStatusEnum => {
  const normalizedType = normalizeDongCheHaoContentType(contentType);
  const text = getDongCheHaoItemStatusText(item);
  if (/已发布|已上线|发布成功|审核通过|已通过/.test(text)) return auditStatusEnum.published;
  if (/驳回|拒绝|未通过|审核失败|发布失败|违规/.test(text)) return auditStatusEnum.deny;
  if (/定时|待发布|预发布/.test(text)) return auditStatusEnum.prePublish;
  if (/草稿/.test(text)) return auditStatusEnum.draft;
  if (/仅自己|仅我|私密|不可见|不公开/.test(text)) return auditStatusEnum.notPublic;
  if (/下架|撤回|删除/.test(text)) return auditStatusEnum.customWithdrawn;
  if (/不适合|不宜|不建议/.test(text)) return auditStatusEnum.notSuitableForPublicity;
  if (/转码|发布中|处理中/.test(text)) return auditStatusEnum.waitExecute;
  if (/审核中|待审核|审核/.test(text)) return auditStatusEnum.inAudit;

  const status = Number(getDongCheHaoItemStatusValue(item));
  if (contentSource === 'shortVideo') {
    switch (status) {
      case 0:
        return auditStatusEnum.draft;
      case 1:
        return auditStatusEnum.inAudit;
      case 2:
        return auditStatusEnum.inAudit;
      case 3:
        return auditStatusEnum.published;
      case 4:
        return auditStatusEnum.deny;
      case 5:
        return auditStatusEnum.notPublic;
      case 6:
      case 11:
        return auditStatusEnum.customWithdrawn;
      default:
        return auditStatusEnum.inAudit;
    }
  }

  if (normalizedType === 'dynamic') {
    switch (status) {
      case 10:
        return auditStatusEnum.inAudit;
      case 20:
        return auditStatusEnum.published;
      case 30:
        return auditStatusEnum.deny;
      case 40:
        return auditStatusEnum.notSuitableForPublicity;
      case 50:
        return auditStatusEnum.prePublish;
      case 110:
        return auditStatusEnum.customWithdrawn;
      case 0:
        return auditStatusEnum.draft;
      default:
        return auditStatusEnum.inAudit;
    }
  }

  switch (status) {
    case 0:
      return auditStatusEnum.draft;
    case 1:
      return auditStatusEnum.inAudit;
    case 2:
      return auditStatusEnum.published;
    case 3:
      return auditStatusEnum.deny;
    case 4:
      return auditStatusEnum.notSuitableForPublicity;
    case 5:
      return auditStatusEnum.prePublish;
    case 11:
      return auditStatusEnum.customWithdrawn;
    default:
      return auditStatusEnum.inAudit;
  }
};

const getDongCheHaoItemString = (...values: unknown[]): string | undefined => {
  const value = values.find(hasDongCheHaoValue);
  return value === undefined ? undefined : String(value).trim();
};

const getDongCheHaoItemCoverUrl = (item: DongCheHaoContentListItem): string | undefined => {
  const cover = asObject(item.cover_image_info ?? item.coverImageInfo ?? item.cover_image ?? item.coverImage);
  const coverUrlList = Array.isArray(cover.url_list)
    ? cover.url_list
    : Array.isArray(cover.urlList)
    ? cover.urlList
    : [];
  const firstCover = asObject(coverUrlList[0]);
  const imageList = Array.isArray(item.image_list)
    ? item.image_list
    : Array.isArray(item.imageList)
    ? item.imageList
    : [];
  const firstImage = asObject(imageList[0]);
  return getDongCheHaoItemString(
    item.cover_url,
    item.coverUrl,
    cover.https_url,
    cover.httpsUrl,
    cover.url,
    typeof coverUrlList[0] === 'string' ? coverUrlList[0] : undefined,
    firstCover.url,
    firstCover.https_url,
    firstCover.httpsUrl,
    firstImage.url,
    firstImage.https_url,
  );
};

const getDongCheHaoItemTime = (item: DongCheHaoContentListItem): number | undefined => {
  const rawTime = getDongCheHaoItemString(
    item.create_time,
    item.createTime,
    item.content_publish_time,
    item.contentPublishTime,
    item.publish_time,
    item.publishTime,
    item.show_time,
    item.showTime,
  );
  if (!rawTime) return undefined;
  const numberTime = Number(rawTime);
  if (Number.isFinite(numberTime))
    return numberTime > 100000000000 ? Math.trunc(numberTime) : Math.trunc(numberTime * 1000);
  const parsedTime = Date.parse(rawTime);
  return Number.isFinite(parsedTime) ? parsedTime : undefined;
};

const getDongCheHaoItemOpenUrl = (item: DongCheHaoContentListItem): string | undefined =>
  getDongCheHaoItemString(
    item.share_url,
    item.shareUrl,
    item.open_url,
    item.openUrl,
    item.article_url,
    item.articleUrl,
    item.url,
  );

const buildDongCheHaoContentStatusResult = (
  publishId: string,
  item: DongCheHaoContentListItem,
  contentType: Exclude<DongCheHaoContentType, 'imageText'>,
  contentSource: Exclude<DongCheHaoContentListSource, 'both'> = 'graphic',
): MediaStatusResultOutput => {
  const auditStatus = mapDongCheHaoAuditStatus(item, contentType, contentSource);
  const result: MediaStatusResultOutput = {
    code: errorCode.ok,
    msg: getDongCheHaoItemStatusText(item),
    publishId,
    docId: getDongCheHaoItemIdCandidates(item, contentType)[0] ?? publishId,
    auditStatus,
    data: item,
  };
  result.create_time = getDongCheHaoItemTime(item);
  result.coverUrl = getDongCheHaoItemCoverUrl(item);
  if (auditStatus === auditStatusEnum.published) {
    const openUrl = getDongCheHaoItemOpenUrl(item);
    if (openUrl?.startsWith('http')) result.openUrl = openUrl;
  }
  return result;
};

const getDongCheHaoMediaStatusBySource = async (
  cookie: string,
  publishId: string,
  contentType: Exclude<DongCheHaoContentType, 'imageText'>,
  maxPage: number,
  proxy: IWebProxy | undefined,
  contentSource: Exclude<DongCheHaoContentListSource, 'both'>,
): Promise<MediaStatusResultOutput> => {
  const result: MediaStatusResultOutput = { code: errorCode.ok, msg: '', publishId };
  const targetId = String(publishId).trim();
  let cursor: string | number | undefined;
  let previousCursor: string | undefined;
  let offset: string | number = 0;

  try {
    for (let page = 0; page < maxPage; page += 1) {
      const options: DongCheHaoContentListOptions =
        contentType === 'dynamic' || contentSource === 'shortVideo'
          ? { count: 7, offset, status: 0 }
          : { pageSize: 20, sort: 2, status: 0, ...(cursor === undefined ? {} : { cursor }) };
      const body =
        contentSource === 'shortVideo'
          ? await getDongCheHaoShortVideoContentListResponse(cookie, options, proxy)
          : await getDongCheHaoContentListResponse(cookie, contentType, options, proxy);
      const responseCode = getDongCheHaoListResponseCode(body);
      if (responseCode !== errorCode.ok) {
        const message = getResponseMessage(body) || '查询懂车号作品失败';
        return {
          ...result,
          code: /login|登录|未登录/i.test(message) ? errorCode.loginExpire : responseCode,
          msg: message,
          data: body,
        };
      }

      const items = getDongCheHaoContentListItems(body);
      const matchedItem = items.find((item) => getDongCheHaoItemIdCandidates(item, contentType).includes(targetId));
      if (matchedItem) {
        return buildDongCheHaoContentStatusResult(publishId, matchedItem, contentType, contentSource);
      }

      const data = getDongCheHaoContentListData(body);
      const hasMore = getDongCheHaoListHasMore(data);
      if (!hasMore) break;

      if (contentType === 'dynamic' || contentSource === 'shortVideo') {
        const count = toPositiveInteger(options.count, 7);
        const nextOffset = data.offset;
        if (hasDongCheHaoValue(nextOffset)) {
          if (String(nextOffset) === String(offset)) break;
          offset = nextOffset as string | number;
        } else {
          offset = toNonNegativeInteger(offset, 0) + count;
        }
        continue;
      }

      const nextCursor = getDongCheHaoListCursor(data);
      if (!hasDongCheHaoValue(nextCursor) || String(nextCursor) === previousCursor) break;
      previousCursor = String(nextCursor);
      cursor = nextCursor;
    }
  } catch (error) {
    result.code = error instanceof AxiosError ? errorCode.request_error : errorCode.data_error;
    result.msg = error instanceof Error ? error.message : String(error ?? '查询懂车号作品失败');
    return result;
  }

  result.code = -1;
  result.msg = '未找到作品';
  return result;
};

/** 查询懂车号文章、视频或图文动态的发布/审核状态。 */
export const getDongCheHaoMediaStatus = async (
  cookie: string,
  publishId: string,
  contentTypeOrMaxPage: DongCheHaoContentType | number = 'video',
  maxPageOrProxy: number | IWebProxy = 10,
  proxy?: IWebProxy,
  contentSource: DongCheHaoContentListSource = 'both',
): Promise<MediaStatusResultOutput> => {
  const result: MediaStatusResultOutput = { code: errorCode.ok, msg: '', publishId };
  if (!publishId) return { ...result, code: errorCode.data_error, msg: 'publishId不能为空' };

  const contentType = normalizeDongCheHaoContentType(
    typeof contentTypeOrMaxPage === 'number' ? 'video' : contentTypeOrMaxPage,
  );
  const maxPage = Math.max(
    1,
    toPositiveInteger(typeof contentTypeOrMaxPage === 'number' ? contentTypeOrMaxPage : maxPageOrProxy, 10),
  );
  const requestProxy =
    typeof contentTypeOrMaxPage === 'number'
      ? typeof maxPageOrProxy === 'object'
        ? maxPageOrProxy
        : proxy
      : typeof maxPageOrProxy === 'object'
      ? maxPageOrProxy
      : proxy;

  if (contentType === 'video' && contentSource === 'both') {
    // 普通视频和竖版视频使用两套独立列表接口；即使命中第一套，也必须完成第二套查询。
    const [graphicResult, shortVideoResult] = await Promise.all([
      getDongCheHaoMediaStatusBySource(cookie, publishId, contentType, maxPage, requestProxy, 'graphic'),
      getDongCheHaoMediaStatusBySource(cookie, publishId, contentType, maxPage, requestProxy, 'shortVideo'),
    ]);
    const foundResult = [graphicResult, shortVideoResult].find((item) => item.docId);
    if (foundResult) return foundResult;
    const errorResult = [graphicResult, shortVideoResult].find((item) => item.code !== -1);
    return errorResult ?? { ...result, code: -1, msg: '未找到作品' };
  }

  return getDongCheHaoMediaStatusBySource(
    cookie,
    publishId,
    contentType,
    maxPage,
    requestProxy,
    contentSource === 'shortVideo' ? 'shortVideo' : 'graphic',
  );
};

export const getDongCheHaoArticleStatus = (
  cookie: string,
  publishId: string,
  maxPage: number = 10,
  proxy?: IWebProxy,
): Promise<MediaStatusResultOutput> => getDongCheHaoMediaStatus(cookie, publishId, 'article', maxPage, proxy);

export const getDongCheHaoVideoStatus = (
  cookie: string,
  publishId: string,
  maxPage: number = 10,
  proxy?: IWebProxy,
): Promise<MediaStatusResultOutput> => getDongCheHaoMediaStatus(cookie, publishId, 'video', maxPage, proxy);

export const getDongCheHaoDynamicStatus = (
  cookie: string,
  publishId: string,
  maxPage: number = 10,
  proxy?: IWebProxy,
): Promise<MediaStatusResultOutput> => getDongCheHaoMediaStatus(cookie, publishId, 'dynamic', maxPage, proxy);

interface DongCheHaoAuthData extends JsonObject {
  uploadToken: string;
}

interface DongCheHaoAwsCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

class DongCheHaoVodUnavailableError extends Error {}

const getDongCheHaoAuthKey = async (
  cookie: string,
  type: 'video' | 'image',
  proxy?: IWebProxy,
): Promise<DongCheHaoAuthData> => {
  const params = encodeURIComponent(JSON.stringify({ type, column: false, ugc: false }));
  const response = await createDongCheHaoHttp(proxy).get(
    `${DONG_CHE_HAO_ORIGIN}/api/proxy/xigua/api/upload/getAuthKey/?params=${params}`,
    { headers: dongCheHaoHeaders(cookie) },
  );
  const body = asResponseObject(response.data);
  const data = asObject(body.data);
  const uploadToken = String(data.uploadToken ?? '');
  if (String(body.status) !== '0' || uploadToken.split(':').length < 4) {
    throw new Error(`获取${type === 'video' ? '视频' : '图片'}上传授权失败:${getResponseMessage(body)}`);
  }
  return data as DongCheHaoAuthData;
};

/**
 * 懂车号网页视频上传使用的视频 STS 凭证。
 * 官方 CommitUploadInner 请求使用的 AWS4 Authorization 就由这组凭证生成。
 */
const getDongCheHaoAwsCredentials = async (cookie: string, proxy?: IWebProxy): Promise<DongCheHaoAwsCredentials> => {
  const response = await createDongCheHaoHttp(proxy).get(DONG_CHE_HAO_VIDEO_UPLOAD_TOKEN_URL, {
    headers: dongCheHaoHeaders(cookie, DONG_CHE_HAO_VIDEO_REFERER),
  });
  const body = asResponseObject(response.data);
  const token = asResponseObject(asObject(body.data).token);
  const accessKeyId = token.AccessKeyId ?? token.AccessKeyID ?? token.accessKeyId;
  const secretAccessKey = token.SecretAccessKey ?? token.secretAccessKey;
  if (!accessKeyId || !secretAccessKey) throw new Error('获取懂车号上传 AWS 授权失败');
  return {
    accessKeyId: String(accessKeyId),
    secretAccessKey: String(secretAccessKey),
    sessionToken: token.SessionToken ?? token.sessionToken,
  };
};

const createDongCheHaoVodHttp = async (cookie: string, proxy?: IWebProxy): Promise<AxiosInstance> => {
  const credentials = await getDongCheHaoAwsCredentials(cookie, proxy);
  const http = createDongCheHaoHttp(proxy);
  http.interceptors.request.use(
    aws4Interceptor({
      instance: http,
      options: { region: 'cn-north-1', service: 'vod' },
      credentials,
    }),
  );
  return http;
};

const getDcdUploadParams = async (
  cookie: string,
  authToken: string,
  fileSize: number,
  action: 'GetVideoUploadParams' | 'GetImageUploadParams',
  proxy?: IWebProxy,
): Promise<JsonObject> => {
  const tokenParts = authToken.split(':');
  const response = await createDongCheHaoHttp(proxy).get(VAS_UPLOAD_URL, {
    params: {
      action,
      s: Math.random().toString(36).slice(2),
      use_edge_node: 1,
      file_size: fileSize,
    },
    headers: {
      ...dongCheHaoHeaders(cookie, `${DONG_CHE_HAO_ORIGIN}/`),
      Authorization: authToken,
      'X-TT-Access': tokenParts[3],
    },
  });
  const body = asResponseObject(response.data);
  if (String(body.code) !== '2000' || !body.data) {
    throw new Error(`获取${action.startsWith('GetVideo') ? '视频' : '图片'}上传参数失败:${getResponseMessage(body)}`);
  }
  return asObject(body.data);
};

const getTosNode = (uploadData: JsonObject): JsonObject => {
  const edgeNode = Array.isArray(uploadData.edge_nodes) ? asObject(uploadData.edge_nodes[0]) : {};
  return Object.keys(edgeNode).length ? edgeNode : uploadData;
};

const uploadHostUrl = (host: string, uri: string): string => {
  const normalizedHost = host?.startsWith('http') ? host : `https://${host}`;
  return `${normalizedHost.replace(/\/$/, '')}/${String(uri).replace(/^\//, '')}`;
};

const getTosUploadUrl = (uploadData: JsonObject, image: boolean = false): string => {
  const node = getTosNode(uploadData);
  const uri = image ? node.object_ids?.[0] ?? uploadData.object_ids?.[0] ?? node.oid : node.oid ?? uploadData.oid;
  const host = node.tos_host ?? uploadData.tos_host;
  if (!host || !uri) throw new Error('上传参数中未找到存储节点');
  return uploadHostUrl(String(host), String(uri));
};

const getTosSign = (uploadData: JsonObject): string => {
  const node = getTosNode(uploadData);
  const sign = node.tos_sign ?? uploadData.tos_sign;
  if (!sign) throw new Error('上传参数中未找到签名');
  return String(sign);
};

interface DongCheHaoVodStoreInfo extends JsonObject {
  StoreUri?: string;
  Auth?: string;
  UploadID?: string;
}

interface DongCheHaoVodUploadNode extends JsonObject {
  Vid?: string;
  UploadHost?: string;
  UploadHosts?: string[];
  StoreInfos?: DongCheHaoVodStoreInfo[];
  UploadHeader?: JsonObject;
  SessionKey?: string;
}

const sha256Hex = (value: string): string => crypto.createHash('sha256').update(value).digest('hex');

const dongCheHaoUploadBrowserHeaders: Record<string, string> = {
  Accept: '*/*',
  Origin: DONG_CHE_HAO_ORIGIN,
  Referer: `${DONG_CHE_HAO_ORIGIN}/`,
  Priority: 'u=1, i',
  'Sec-Fetch-Site': 'cross-site',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Dest': 'empty',
};

// 图片二进制上传使用官方 SDK 的 XMLHttpRequest 分支；Priority 是浏览器
// fetch/preflight 的请求头，不属于官方 XHR 直传请求。
const dongCheHaoImageBinaryUploadHeaders: Record<string, string> = {
  Accept: '*/*',
  Origin: DONG_CHE_HAO_ORIGIN,
  Referer: `${DONG_CHE_HAO_ORIGIN}/`,
  'Sec-Fetch-Site': 'cross-site',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Dest': 'empty',
};

const getDongCheHaoVodUploadNode = (body: JsonObject): DongCheHaoVodUploadNode | undefined => {
  const uploadNodes = asObject(asObject(body.Result).InnerUploadAddress).UploadNodes;
  const nodes = Array.isArray(uploadNodes) ? (uploadNodes.map(asObject) as DongCheHaoVodUploadNode[]) : [];
  return nodes.find((node) => {
    if (!node.UploadHost && node.UploadHosts?.length) node.UploadHost = node.UploadHosts[0];
    return Boolean(
      node.UploadHost &&
        node.StoreInfos?.[0]?.StoreUri &&
        node.StoreInfos?.[0]?.Auth &&
        node.StoreInfos?.[0]?.UploadID &&
        node.SessionKey,
    );
  });
};

export const buildDongCheHaoVodApplyUploadParams = (
  fileSize: number,
  requestId: string = Math.random().toString(36).slice(2),
): {
  Action: string;
  Version: string;
  SpaceName: string;
  FileType: string;
  IsInner: number;
  FileSize: number;
  s: string;
} => ({
  Action: 'ApplyUploadInner',
  Version: '2020-11-19',
  SpaceName: DONG_CHE_HAO_VOD_SPACE,
  FileType: 'video',
  IsInner: 1,
  FileSize: fileSize,
  s: requestId,
});

const getDongCheHaoVodUploadArgs = async (http: AxiosInstance, fileSize: number): Promise<DongCheHaoVodUploadNode> => {
  const response = await http.get(VOD_UPLOAD_URL, {
    params: buildDongCheHaoVodApplyUploadParams(fileSize),
    headers: dongCheHaoUploadBrowserHeaders,
  });
  const body = asResponseObject(response.data);
  const node = getDongCheHaoVodUploadNode(body);
  const metadataError = asObject(asObject(body.ResponseMetadata).Error);
  if (response.status < 200 || response.status >= 300 || metadataError.Code || !node) {
    throw new Error(`获取懂车号 VOD 上传参数失败:${metadataError.Message ?? getResponseMessage(body)}`);
  }
  return node;
};

const getDongCheHaoVodUploadUrl = (
  node: DongCheHaoVodUploadNode,
): { url: string; storeInfo: DongCheHaoVodStoreInfo } => {
  const storeInfo = node.StoreInfos?.[0];
  const uploadHost = node.UploadHost ?? node.UploadHosts?.[0];
  if (!uploadHost || !storeInfo?.StoreUri) throw new Error('懂车号 VOD 上传节点信息不完整');
  return { url: uploadHostUrl(String(uploadHost), String(storeInfo.StoreUri)), storeInfo };
};

const uploadDongCheHaoVodPart = async (
  uploadUrl: string,
  uploadId: string,
  partNumber: number,
  data: Buffer,
  userId: string,
  storeInfo: DongCheHaoVodStoreInfo,
  uploadHeader?: JsonObject,
  proxy?: IWebProxy,
): Promise<string> => {
  const response = await createDongCheHaoHttp(proxy).put(
    `${uploadUrl}?partNumber=${partNumber}&uploadID=${encodeURIComponent(uploadId)}`,
    data,
    {
      headers: {
        ...dongCheHaoUploadBrowserHeaders,
        ...(uploadHeader ?? {}),
        Authorization: String(storeInfo.Auth ?? ''),
        'X-Storage-U': encodeURIComponent(userId),
        'Content-Disposition': 'attachment; filename="undefined"',
        'Content-Type': 'application/octet-stream',
        'Content-CRC32': crc32(data),
      },
      maxBodyLength: Infinity,
    },
  );
  const body = asResponseObject(response.data);
  const failedBySuccess = body.success !== undefined && !isSuccessfulValue(body.success);
  if (response.status < 200 || response.status >= 300 || failedBySuccess) {
    throw new Error(
      `懂车号 VOD 视频分片上传失败:${partNumber}:${getResponseMessage(body) || summarizeResponse(response.data)}`,
    );
  }
  return crc32(data);
};

const finishDongCheHaoVodUpload = async (
  uploadUrl: string,
  uploadId: string,
  partList: string,
  userId: string,
  storeInfo: DongCheHaoVodStoreInfo,
  uploadHeader?: JsonObject,
  proxy?: IWebProxy,
): Promise<JsonObject> => {
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await createDongCheHaoHttp(proxy).post(
      `${uploadUrl}?uploadID=${encodeURIComponent(uploadId)}`,
      partList,
      {
        headers: {
          ...dongCheHaoUploadBrowserHeaders,
          ...(uploadHeader ?? {}),
          Authorization: String(storeInfo.Auth ?? ''),
          'X-Storage-U': encodeURIComponent(userId),
          'Content-Type': 'text/plain;charset=UTF-8',
        },
      },
    );
    const body = asResponseObject(response.data);
    const payload = asObject(body.payload);
    const failedBySuccess = body.success !== undefined && !isSuccessfulValue(body.success);
    const hasKey = Boolean(payload.key ?? payload.Key ?? body.key ?? body.hash ?? body.data?.key ?? body.data?.hash);
    if (response.status >= 200 && response.status < 300 && !failedBySuccess && hasKey) return body;
    const message = getResponseMessage(body) || summarizeResponse(response.data);
    if (attempt === 4 || !/merge|process|upload|wait|处理中|合并/i.test(message)) {
      throw new Error(`懂车号 VOD 视频分片提交失败:${message}`);
    }
    await Task.Delay(2000);
  }
  throw new Error('懂车号 VOD 视频分片提交失败');
};

export const buildDongCheHaoVodCommitUploadRequest = (
  sessionKey: string,
): {
  body: string;
  params: { Action: string; Version: string; SpaceName: string };
} => ({
  body: JSON.stringify({ SessionKey: sessionKey, Functions: [] }),
  params: {
    Action: 'CommitUploadInner',
    Version: '2020-11-19',
    SpaceName: DONG_CHE_HAO_VOD_SPACE,
  },
});

const commitDongCheHaoVodUpload = async (http: AxiosInstance, sessionKey: string): Promise<JsonObject> => {
  const request = buildDongCheHaoVodCommitUploadRequest(sessionKey);
  const response = await http.post(VOD_UPLOAD_URL, request.body, {
    params: request.params,
    headers: {
      ...dongCheHaoUploadBrowserHeaders,
      'Content-Type': 'text/plain;charset=UTF-8',
      'X-Amz-Content-Sha256': sha256Hex(request.body),
    },
  });
  const body = asResponseObject(response.data);
  const metadataError = asObject(asObject(body.ResponseMetadata).Error);
  const results = asObject(body.Result).Results;
  if (
    response.status < 200 ||
    response.status >= 300 ||
    metadataError.Code ||
    !Array.isArray(results) ||
    !results.length
  ) {
    throw new Error(
      `懂车号视频提交上传失败:${
        metadataError.Message ?? (getResponseMessage(body) || summarizeResponse(response.data))
      }`,
    );
  }
  return body;
};

/**
 * VOD 提交结果在部分账号上只返回 VideoMeta，不返回自动封面。
 * 沿用网页端的 VAS 信息接口补取 poster；自定义封面时不需要这次兼容查询。
 */
const getDongCheHaoLegacyVideoInfo = async (
  cookie: string,
  sessionKey: string,
  proxy?: IWebProxy,
): Promise<JsonObject | undefined> => {
  try {
    const decoded = asObject(JSON.parse(Buffer.from(sessionKey, 'base64').toString('utf8')));
    const extraParam = String(decoded.extra ?? '').replace(/^\?/, '');
    const vid = String(decoded.vid ?? '');
    const oid = String(decoded.uri ?? '');
    const token = String(decoded.token ?? '');
    if (!extraParam || !vid || !oid || !token) return undefined;

    const authData = await getDongCheHaoAuthKey(cookie, 'video', proxy);
    const response = await createDongCheHaoHttp(proxy).post(
      `${VAS_UPLOAD_URL}?action=UpdateVideoUploadInfos&${extraParam}`,
      { vid, oid, token, poster_ss: 0, user_reference: '' },
      {
        headers: {
          ...dongCheHaoHeaders(cookie, `${DONG_CHE_HAO_ORIGIN}/`),
          Authorization: authData.uploadToken,
          'X-TT-Access': authData.uploadToken.split(':')[3],
          'Content-Type': 'application/json',
        },
      },
    );
    const body = asResponseObject(response.data);
    const data = asObject(body.data);
    const video = asObject(data.video);
    return String(body.code) === '2000' && Object.keys(video).length
      ? { video, poster: asObject(data.poster) }
      : undefined;
  } catch {
    return undefined;
  }
};

interface DongCheHaoImageNode extends JsonObject {
  UploadHost?: string;
  UploadHosts?: string[];
  StoreInfos?: DongCheHaoVodStoreInfo[];
  UploadHeader?: JsonObject;
  SessionKey?: string;
}

interface DongCheHaoImageContext {
  http: AxiosInstance;
  cookie: string;
  proxy?: IWebProxy;
  userId: string;
  node: DongCheHaoImageNode;
}

interface DongCheHaoUploadedImage extends JsonObject {
  ImageUri: string;
  ImageWidth?: number;
  ImageHeight?: number;
  main_url: string;
}

interface DongCheHaoCommittedImage extends JsonObject {
  ImageUri: string;
  ImageWidth?: number;
  ImageHeight?: number;
}

const getDongCheHaoImageCommitResult = (body: JsonObject): JsonObject => {
  const result = asObject(body.Result);
  const uploadResult = Array.isArray(result.Results) ? asObject(result.Results[0]) : {};
  const pluginResult = Array.isArray(result.PluginResult) ? asObject(result.PluginResult[0]) : {};
  return { ...uploadResult, ...pluginResult };
};

const getDongCheHaoImageUploadFailureDetail = (status: number, value: unknown): string => {
  const body = asResponseObject(value);
  const error = asObject(body.error ?? body.Error);
  const code = error.code ?? error.Code ?? body.code ?? body.err_no ?? body.errno;
  const message = getResponseMessage(body) || String(error.message ?? error.Message ?? '');
  return [`status=${status}`, code !== undefined && code !== '' ? `code=${String(code)}` : '', message]
    .filter(Boolean)
    .join(':');
};

const getDongCheHaoImageUploadRequestDetail = (
  uploadUrl: string,
  imageData: Buffer,
  headers: Record<string, string>,
): string => {
  let host = 'unknown';
  try {
    host = new URL(uploadUrl).host;
  } catch {
    // 上传地址本身会在实际请求阶段被校验；失败日志不能影响原始错误。
  }
  return [
    `host=${host}`,
    `bytes=${imageData.length}`,
    `crc32=${headers['Content-CRC32'] ?? 'missing'}`,
    `contentLength=${headers['Content-Length'] ?? 'auto'}`,
    `auth=${headers.Authorization ? 'present' : 'missing'}`,
    `storageUser=${headers['X-Storage-U'] ? 'present' : 'missing'}`,
  ].join('; ');
};

export const getDongCheHaoImageCommitUri = (body: JsonObject): string => {
  const result = asObject(body.Result);
  const uploadResult = Array.isArray(result.Results) ? asObject(result.Results[0]) : {};
  const pluginResult = Array.isArray(result.PluginResult) ? asObject(result.PluginResult[0]) : {};
  // The official car-page request submits the committed storage URI from
  // Results.Uri. PluginResult.ImageUri is metadata returned by ImageX and is
  // This is the URI field used by the article publisher after image commit.
  return String(uploadResult.Uri ?? pluginResult.ImageUri ?? pluginResult.image_uri ?? '');
};

const getDongCheHaoDynamicImageCommitUri = (body: JsonObject): string => {
  const result = asObject(body.Result);
  const pluginResult = Array.isArray(result.PluginResult) ? asObject(result.PluginResult[0]) : {};
  return String(pluginResult.ImageUri ?? pluginResult.image_uri ?? '');
};

/**
 * 官方上传 SDK 的二进制上传请求：先合并 UploadHeader，再由二进制传输层补齐
 * Content-Type 和 Content-Disposition；Node 端需要显式设置这些浏览器会自动补上的请求头。
 */
export const buildDongCheHaoImageUploadHeaders = (
  auth: string,
  userId: string,
  imageData: Buffer,
  uploadHeader: JsonObject = {},
): Record<string, string> => ({
  ...dongCheHaoImageBinaryUploadHeaders,
  Authorization: auth,
  'Content-CRC32': crc32(imageData),
  'X-Storage-U': encodeURIComponent(userId),
  ...uploadHeader,
  // Axios' Node adapter calculates Content-Length from the Buffer. Do not
  // force it here: a manually supplied length can become stale or duplicated
  // when the request passes through the local proxy.
  'Content-Type': 'application/octet-stream',
  'Content-Disposition': 'attachment; filename="undefined"',
});

/** 文章上传沿用官方 XHR 的完整请求头，并显式保留二进制长度。 */
export const buildDongCheHaoArticleImageUploadHeaders = (
  auth: string,
  userId: string,
  imageData: Buffer,
  uploadHeader: JsonObject = {},
): Record<string, string> => ({
  ...buildDongCheHaoImageUploadHeaders(auth, userId, imageData, uploadHeader),
  Priority: 'u=1, i',
  'Content-Length': String(imageData.length),
});

const createImageUploadContext = async (
  cookie: string,
  userId: string,
  proxy?: IWebProxy,
  options: { referer?: string; browserHeaders?: boolean } = {},
): Promise<DongCheHaoImageContext> => {
  const uploadReferer = options.referer ?? DONG_CHE_HAO_REFERER;
  const authResponse = await createDongCheHaoHttp(proxy).get(
    `${DONG_CHE_HAO_ORIGIN}/motor/car_page/v6/img/get_upload_auth`,
    {
      headers: dongCheHaoHeaders(cookie, uploadReferer),
    },
  );
  const authBody = asResponseObject(authResponse.data);
  const token = asResponseObject(asObject(authBody.data).token);
  const accessKeyId = token.AccessKeyId ?? token.AccessKeyID ?? token.accessKeyId;
  const secretAccessKey = token.SecretAccessKey ?? token.secretAccessKey;
  if (!accessKeyId || !secretAccessKey) throw new Error('获取图片上传授权失败');

  const http = createDongCheHaoHttp(proxy);
  http.interceptors.request.use(
    aws4Interceptor({
      instance: http,
      options: { region: 'cn-north-1', service: 'imagex' },
      credentials: {
        accessKeyId: String(accessKeyId),
        secretAccessKey: String(secretAccessKey),
        sessionToken: token.SessionToken ?? token.sessionToken,
      },
    }),
  );

  const response = await http.get(IMAGE_X_URL, {
    params: {
      Action: 'ApplyImageUpload',
      Version: '2018-08-01',
      ServiceId: IMAGE_SERVICE_ID,
      s: Math.random().toString(36).slice(2),
    },
    headers: options.browserHeaders
      ? {
          ...dongCheHaoImageBinaryUploadHeaders,
          Referer: uploadReferer,
          Priority: 'u=1, i',
        }
      : { Accept: '*/*', Origin: DONG_CHE_HAO_ORIGIN, Referer: uploadReferer },
  });
  const result = asObject(asResponseObject(response.data).Result);
  const uploadAddress = asObject(result.UploadAddress) as DongCheHaoImageNode;
  if (Array.isArray(uploadAddress.UploadHosts) && uploadAddress.UploadHosts.length) {
    uploadAddress.UploadHost = uploadAddress.UploadHosts[0];
  }
  if (
    !uploadAddress.UploadHost ||
    !uploadAddress.StoreInfos?.[0]?.StoreUri ||
    !uploadAddress.StoreInfos?.[0]?.Auth ||
    !uploadAddress.SessionKey
  ) {
    throw new Error('获取图片上传节点失败');
  }
  return { http, cookie, proxy, userId, node: uploadAddress };
};

/**
 * 官方 ImageX 图片上传链路：TOS PUT -> CommitImageUpload。
 *
 * 这个函数只负责得到 ImageX 的 ImageUri，不调用懂车号文章的 get_url 接口，
 * 也不生成 HTML。车友说动态发布必须把这里返回的 ImageUri 原样放入
 * cheyou_publish_forum/v2 的 image_urls 字段。
 */
type DongCheHaoImageUploadHeadersBuilder = (
  auth: string,
  userId: string,
  imageData: Buffer,
  uploadHeader?: JsonObject,
) => Record<string, string>;

interface DongCheHaoImageUploadOptions {
  buildHeaders?: DongCheHaoImageUploadHeadersBuilder;
  getCommitUri?: (body: JsonObject) => string;
}

const uploadDongCheHaoOfficialImage = async (
  context: DongCheHaoImageContext,
  source: string,
  options: DongCheHaoImageUploadOptions = {},
): Promise<DongCheHaoCommittedImage> => {
  const imageData = await readBinary(source, context.proxy);
  const storeInfo = context.node.StoreInfos?.[0];
  const uploadUrl = uploadHostUrl(String(context.node.UploadHost), String(storeInfo?.StoreUri));
  const uploadHeaders = (options.buildHeaders ?? buildDongCheHaoImageUploadHeaders)(
    String(storeInfo?.Auth ?? ''),
    context.userId,
    imageData,
    context.node.UploadHeader,
  );
  const uploadResponse = await createDongCheHaoHttp(context.proxy).put(uploadUrl, imageData, {
    headers: uploadHeaders,
    maxBodyLength: Infinity,
  });
  if (uploadResponse.status < 200 || uploadResponse.status >= 300) {
    throw new Error(
      `图片上传失败:${source}:${getDongCheHaoImageUploadFailureDetail(
        uploadResponse.status,
        uploadResponse.data,
      )}:${getDongCheHaoImageUploadRequestDetail(uploadUrl, imageData, uploadHeaders)}`,
    );
  }

  const commitResponse = await context.http.post(IMAGE_X_URL, undefined, {
    params: {
      Action: 'CommitImageUpload',
      Version: '2018-08-01',
      SessionKey: context.node.SessionKey,
      ServiceId: IMAGE_SERVICE_ID,
    },
    headers: {
      Accept: '*/*',
      Origin: DONG_CHE_HAO_ORIGIN,
      Referer: DONG_CHE_HAO_REFERER,
      'Content-Type': 'application/json',
      'Content-Length': '0',
    },
  });
  const commitBody = asResponseObject(commitResponse.data);
  const metadataError = asObject(asObject(commitBody.ResponseMetadata).Error);
  const imageUri = (options.getCommitUri ?? getDongCheHaoDynamicImageCommitUri)(commitBody);
  if (commitResponse.status < 200 || commitResponse.status >= 300 || metadataError.Code || !imageUri) {
    throw new Error(
      `图片提交失败:${source}:${
        metadataError.Message || getResponseMessage(commitBody) || summarizeResponse(commitBody)
      }`,
    );
  }

  const plugin = getDongCheHaoImageCommitResult(commitBody);
  return { ...plugin, ImageUri: imageUri } as DongCheHaoCommittedImage;
};

/**
 * 文章正文/文章封面仍需要 main_url，因此只有文章流程才会继续调用 get_url。
 * 动态流程不调用这个包装函数。
 */
const uploadDongCheHaoArticleImage = async (
  context: DongCheHaoImageContext,
  source: string,
): Promise<DongCheHaoUploadedImage> => {
  const uploaded = await uploadDongCheHaoOfficialImage(context, source, {
    buildHeaders: buildDongCheHaoArticleImageUploadHeaders,
    getCommitUri: getDongCheHaoImageCommitUri,
  });
  const imageUri = uploaded.ImageUri;

  const urlResponse = await createDongCheHaoHttp(context.proxy).post(
    `${DONG_CHE_HAO_ORIGIN}/motor/car_page/v6/img/get_url`,
    `img_uris=${encodeURIComponent(imageUri)}&img_url_type=1&img_param=tplv-resize%3A640%3A0&img_format=image`,
    {
      headers: {
        ...dongCheHaoHeaders(context.cookie, DONG_CHE_HAO_REFERER),
        'Content-Type': 'text/plain;charset=UTF-8',
      },
    },
  );
  const urlMap = asObject(asObject(asResponseObject(urlResponse.data).data).img_url_map);
  const mainUrl = String(asObject(urlMap[imageUri]).main_url ?? '');
  if (!mainUrl) throw new Error(`获取图片地址失败:${source}`);
  return { ...uploaded, ImageUri: imageUri, main_url: mainUrl } as DongCheHaoUploadedImage;
};

/** 动态图片上传只返回官方 CommitImageUpload 产出的 ImageUri。 */
const uploadDongCheHaoDynamicImage = async (context: DongCheHaoImageContext, source: string): Promise<string> => {
  const uploaded = await uploadDongCheHaoOfficialImage(context, source);
  return uploaded.ImageUri;
};

const replaceArticleImages = async (
  content: string,
  contextFactory: (() => Promise<DongCheHaoImageContext>) | undefined,
  cache: Map<string, DongCheHaoUploadedImage>,
  taskData: { contentWords?: number; cancelToken?: CancelToken },
): Promise<string> => {
  const cleanedContent = String(content ?? '').replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1');
  const html = new HtmlDocument();
  html.LoadHtml(cleanedContent);
  const imageNodes = html.DocumentNode?.SelectNodes('//img') ?? [];
  if (imageNodes.length && !contextFactory) throw new Error('正文图片上传上下文缺失');

  for (const image of imageNodes) {
    taskData.cancelToken?.throwIfCancelled(privateKey);
    const source = toImageSource(image.getAttribute('src') ?? image.getAttribute('data-src') ?? '');
    if (!source) continue;
    let uploaded = cache.get(source);
    if (!uploaded) {
      uploaded = await uploadDongCheHaoArticleImage(await contextFactory!(), source);
      cache.set(source, uploaded);
    }
    image.setAttribute('src', uploaded.main_url);
    image.setAttribute('image_type', '');
    image.setAttribute('mime_type', '');
    image.setAttribute('web_uri', uploaded.ImageUri);
    image.setAttribute('img_width', String(uploaded.ImageWidth ?? 0));
    image.setAttribute('img_height', String(uploaded.ImageHeight ?? 0));
    image.setAttribute('class', '');
  }

  taskData.contentWords = html.DocumentNode?.InnerText()?.length ?? 0;
  return imageNodes.length ? html.DocumentNode.OuterHtml() : cleanedContent;
};

const buildArticleCoverInfo = (uploaded: DongCheHaoUploadedImage, source: ImageInfo): JsonObject => ({
  thumb_height: uploaded.ImageHeight ?? source.height ?? 0,
  thumb_width: uploaded.ImageWidth ?? source.width ?? 0,
  uri: uploaded.ImageUri,
  url: uploaded.main_url,
});

const buildCoverPackage = async (
  covers: ImageInfo[] | undefined,
  contextFactory: (() => Promise<DongCheHaoImageContext>) | undefined,
  cache: Map<string, DongCheHaoUploadedImage>,
): Promise<JsonObject[]> => {
  const result: JsonObject[] = [];
  for (const cover of (covers ?? []).slice(0, 3)) {
    const source = toImageSource(cover?.pathOrUrl ?? '');
    if (!source) continue;
    if (!contextFactory) throw new Error('封面图片上传上下文缺失');
    let uploaded = cache.get(source);
    if (!uploaded) {
      uploaded = await uploadDongCheHaoArticleImage(await contextFactory(), source);
      cache.set(source, uploaded);
    }
    result.push(buildArticleCoverInfo(uploaded, cover));
  }
  return result;
};

const buildArticleVerticalCover = async (
  cover: ImageInfo | undefined,
  fallback: JsonObject | undefined,
  contextFactory: (() => Promise<DongCheHaoImageContext>) | undefined,
  cache: Map<string, DongCheHaoUploadedImage>,
): Promise<JsonObject | undefined> => {
  const source = toImageSource(cover?.pathOrUrl ?? '');
  if (!cover || !source) return fallback;
  if (!contextFactory) throw new Error('竖版封面图片上传上下文缺失');
  let uploaded = cache.get(source);
  if (!uploaded) {
    uploaded = await uploadDongCheHaoArticleImage(await contextFactory(), source);
    cache.set(source, uploaded);
  }
  return buildArticleCoverInfo(uploaded, cover);
};

export interface DongCheHaoArticleTaskInput {
  cancelToken?: CancelToken;
  taskId: string;
  title: string;
  content: string;
  /** 横版封面；未提供时兼容使用 covers */
  horizontalCover?: ImageInfo;
  /** 旧版/通用任务中的横版封面列表 */
  covers?: ImageInfo[];
  /** 竖版封面；未提供时兼容使用横版封面首图 */
  verticalCover?: ImageInfo;
  pubType: 0 | 1;
  isOriginal?: 0 | 1;
  prePubTime?: number;
  contentWords?: number;
  activityId?: string;
  /** 2：不投放广告，3：投放广告 */
  adType?: 2 | 3;
  userId?: string;
  proxy?: IWebProxy;
}

export interface DongCheHaoDynamicTaskInput {
  cancelToken?: CancelToken;
  taskId: string;
  desc?: string;
  images: ImageInfo[];
  userId?: string;
  proxy?: IWebProxy;
}

export interface DongCheHaoVideoTaskInput extends ITask {
  cancelToken?: CancelToken;
  taskId: string;
  video: {
    duration: number;
    width: number;
    height: number;
    size?: number;
    localPath: string;
  };
  cover?: ImageInfo;
  verticalCover?: ImageInfo;
  title: string;
  desc?: string;
  creatorStatement?: {
    text: string;
    input?: string;
  };
  pubType: 0 | 1;
  isOriginal?: 0 | 1;
  prePubTime?: number;
  userId?: string;
  proxy?: IWebProxy;
}

export interface DongCheHaoPublishResultOutput extends BaseResult {
  taskId: string;
  publishId?: string;
  errorInfo?: string;
  scheduled?: boolean;
}

export interface DongCheHaoVideoCoverInfo {
  uri: string;
  width?: number;
  height?: number;
}

const buildDongCheHaoArticleVerticalCover = (cover: JsonObject | undefined): string => {
  const uri = String(cover?.uri ?? '');
  if (!uri) return '';
  return JSON.stringify({
    uri,
    height: Number(cover?.thumb_height ?? 0),
    width: Number(cover?.thumb_width ?? 0),
  });
};

export const buildDongCheHaoArticlePostData = (
  taskData: DongCheHaoArticleTaskInput,
  covers: JsonObject[],
  verticalCover?: JsonObject,
): string => {
  const primaryCover = verticalCover ?? covers.find((cover) => String(cover?.uri ?? ''));
  return JSON.stringify({
    extra: {
      article_ad_type: taskData.adType === 2 ? 2 : 3,
      content_word_cnt: taskData.contentWords ?? 0,
      pgc_feed_covers: covers,
      timer_status: taskData.prePubTime ? 1 : 0,
      timer_time: taskData.prePubTime ? dayjs(taskData.prePubTime).format('YYYY-MM-DD HH:mm') : '',
      title_id: '',
      vertical_cover_image: buildDongCheHaoArticleVerticalCover(primaryCover),
      publisher_ai_info: JSON.stringify({ use_ai_img: 0, ai_img_list: [] }),
      ...(taskData.isOriginal === 1 ? { claim_origin: 1 } : {}),
    },
    save: taskData.pubType,
    source: 20,
    title: taskData.title,
    content: taskData.content,
    mp_act_id: taskData.activityId ?? '',
  });
};

const toDongCheHaoImageSources = (images: ImageInfo[] | undefined): string[] =>
  (images ?? []).map((image) => toImageSource(image?.pathOrUrl ?? '')).filter(Boolean);

/**
 * 懂车号“车友说”官方接口只有一个 image_urls 字段，最多接收 9 张图片。
 * 按源地址去重，避免同一张图被重复上传。
 */
export const getDongCheHaoDynamicImageSources = (taskData: DongCheHaoDynamicTaskInput): string[] => {
  return Array.from(new Set(toDongCheHaoImageSources(taskData.images))).slice(0, 9);
};

/**
 * 懂车号网页端图文动态使用独立的 x-www-form-urlencoded 接口。
 * 该接口不接收文章 title/HTML，也不复用文章接口的 extra 字段。
 */
export const buildDongCheHaoDynamicPostData = (
  taskData: DongCheHaoDynamicTaskInput,
  imageUris: string[] = [],
): string => {
  const content = String(taskData.desc ?? '').trim();
  return new URLSearchParams({
    content,
    publisher_ai_info: JSON.stringify({ use_ai_img: 0, ai_img_list: [] }),
    image_urls: imageUris.filter(Boolean).join(','),
    motor_type: '2',
    common_source: '80070',
    sync_to_toutiao: '1',
  }).toString();
};

const summarizeDongCheHaoDynamicForm = (postData: string): string => {
  const params = new URLSearchParams(postData);
  const imageUris = params
    .get('image_urls')
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return [
    `fields=${Array.from(params.keys()).join(',')}`,
    `content=${params.get('content') ? 'present' : 'empty'}`,
    `imageUrlCount=${imageUris?.length ?? 0}`,
    `motorType=${params.get('motor_type') ?? 'missing'}`,
    `commonSource=${params.get('common_source') ?? 'missing'}`,
  ].join('; ');
};

export const publishDongCheHaoArticle = async (
  cookie: string,
  taskData: DongCheHaoArticleTaskInput,
  eventCallback: EventEmitter = new EventEmitter(),
): Promise<DongCheHaoPublishResultOutput> => {
  const result: DongCheHaoPublishResultOutput = { code: errorCode.ok, msg: '', taskId: taskData.taskId };
  try {
    taskData.cancelToken?.throwIfCancelled(privateKey);
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploading, '开始发布懂车号文章', taskData.taskId);

    const cache = new Map<string, DongCheHaoUploadedImage>();
    const horizontalCovers = taskData.horizontalCover ? [taskData.horizontalCover] : taskData.covers;
    const hasImages =
      /<img\b/i.test(taskData.content) ||
      Boolean(horizontalCovers?.some((cover) => cover?.pathOrUrl)) ||
      Boolean(taskData.verticalCover?.pathOrUrl);
    const userId = hasImages ? await resolveUserId(cookie, taskData.userId, taskData.proxy) : taskData.userId ?? '';
    const imageContextFactory = hasImages
      ? () =>
          createImageUploadContext(cookie, userId, taskData.proxy, {
            referer: DONG_CHE_HAO_ROOT_REFERER,
            browserHeaders: true,
          })
      : undefined;
    taskData.content = await replaceArticleImages(taskData.content, imageContextFactory, cache, taskData);
    const covers = await buildCoverPackage(horizontalCovers, imageContextFactory, cache);
    const verticalCover = await buildArticleVerticalCover(
      taskData.verticalCover,
      covers[0],
      imageContextFactory,
      cache,
    );

    taskData.cancelToken?.throwIfCancelled(privateKey);
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '图片上传完成', taskData.taskId);
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送懂车号文章', taskData.taskId);
    const postData = buildDongCheHaoArticlePostData(taskData, covers, verticalCover);
    taskData.cancelToken?.disable(privateKey);

    let secSdkToken = await getDongCheHaoSecSdkToken(
      cookie,
      taskData.proxy,
      DONG_CHE_HAO_ARTICLE_PUBLISH_URL,
      DONG_CHE_HAO_ARTICLE_REFERER,
    );
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        secSdkToken = await getDongCheHaoSecSdkToken(
          cookie,
          taskData.proxy,
          DONG_CHE_HAO_ARTICLE_PUBLISH_URL,
          DONG_CHE_HAO_ARTICLE_REFERER,
        );
      }
      const http = createDongCheHaoHttp(taskData.proxy);
      const response = await http.post(DONG_CHE_HAO_ARTICLE_PUBLISH_URL, postData, {
        headers: buildDongCheHaoArticlePublishHeaders(cookie, DONG_CHE_HAO_ARTICLE_REFERER, secSdkToken),
      });
      const publishResult = buildPublishResult(taskData.taskId, asResponseObject(response.data), '懂车号文章发布失败');
      if (publishResult.code === errorCode.ok) {
        SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '懂车号文章发布成功', taskData.taskId);
        return publishResult;
      }
      if (attempt < 2 && /稍后重试|请重试|invalid/i.test(publishResult.msg ?? '')) {
        await Task.Delay(1000);
        continue;
      }
      result.code = publishResult.code;
      result.msg = publishResult.msg;
      break;
    }
  } catch (error) {
    result.code = error instanceof AxiosError ? errorCode.request_error : errorCode.data_error;
    result.msg = error instanceof Error ? error.message : String(error ?? '懂车号文章发布失败');
    result.errorInfo = error instanceof Error ? error.stack : String(error ?? '');
  }
  SetProgressNewEvent(eventCallback, publishStatusEnum.pushFail, result.msg || '懂车号文章发布失败', taskData.taskId);
  return result;
};

const resolveUserId = async (cookie: string, preferred: string | undefined, proxy?: IWebProxy): Promise<string> => {
  if (preferred) return String(preferred);
  const userInfo = await getDongCheHaoUserInfo(cookie, proxy);
  if (!userInfo.yixiaoerId) throw new Error(userInfo.msg || '获取懂车号用户ID失败');
  return userInfo.yixiaoerId;
};

const getDongCheHaoAntiToken = async (cookie: string, proxy?: IWebProxy): Promise<string> => {
  try {
    const response = await createDongCheHaoHttp(proxy).get(`${DONG_CHE_HAO_ORIGIN}/tt-anti-token`, {
      headers: dongCheHaoHeaders(cookie),
    });
    return String(asObject(asResponseObject(response.data).data).token ?? '');
  } catch {
    return '';
  }
};

/**
 * 懂车号网页发布请求会携带由 SecSDK 下发的 CSRF token。
 * 某些账号/环境未返回该 token 时仍保留原有请求路径，便于兼容旧接口。
 */
const getDongCheHaoSecSdkToken = async (
  cookie: string,
  proxy?: IWebProxy,
  url: string = DONG_CHE_HAO_VIDEO_PUBLISH_URL,
  referer: string = DONG_CHE_HAO_VIDEO_REFERER,
): Promise<string> => {
  try {
    const response = await createDongCheHaoHttp(proxy).head(url, {
      headers: {
        ...dongCheHaoHeaders(cookie, referer),
        Accept: 'application/json, text/plain, */*',
        'x-secsdk-csrf-request': '1',
        'x-secsdk-csrf-version': '1.2.17',
      },
    });
    const value = String(response.headers['x-ware-csrf-token'] ?? '');
    const values = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    return values[1] ?? values[0] ?? '';
  } catch {
    return '';
  }
};

export const buildDongCheHaoArticlePublishHeaders = (
  cookie: string,
  referer: string = DONG_CHE_HAO_ARTICLE_REFERER,
  secSdkToken?: string,
): Record<string, string> => ({
  ...dongCheHaoHeaders(cookie, referer),
  Accept: '*/*',
  'Content-Type': 'application/json',
  Priority: 'u=1, i',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Dest': 'empty',
  ...(secSdkToken ? { 'x-secsdk-csrf-token': secSdkToken } : {}),
});

interface DongCheHaoDynamicCsrfContext {
  cookie: string;
  token: string;
}

const getDongCheHaoDynamicCsrfContext = async (
  cookie: string,
  proxy?: IWebProxy,
): Promise<DongCheHaoDynamicCsrfContext> => {
  try {
    const response = await createDongCheHaoHttp(proxy).head(DONG_CHE_HAO_DYNAMIC_PUBLISH_URL, {
      headers: {
        ...dongCheHaoHeaders(cookie, DONG_CHE_HAO_DYNAMIC_REFERER),
        Accept: 'application/json, text/plain, */*',
        'x-secsdk-csrf-request': '1',
        'x-secsdk-csrf-version': '1.2.22',
      },
    });
    const value = String(response.headers['x-ware-csrf-token'] ?? '');
    const values = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    return {
      token: values[1] ?? values[0] ?? '',
      cookie: mergeSetCookieHeader(cookie, asObject(response.headers)),
    };
  } catch {
    return { token: '', cookie };
  }
};

export const buildDongCheHaoDynamicPublishHeaders = (
  cookie: string,
  referer: string = DONG_CHE_HAO_DYNAMIC_REFERER,
  secSdkToken?: string,
): Record<string, string> => ({
  ...dongCheHaoHeaders(cookie, referer),
  Accept: '*/*',
  'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
  Priority: 'u=1, i',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Dest': 'empty',
  ...(secSdkToken ? { 'x-secsdk-csrf-token': secSdkToken } : {}),
});

export const publishDongCheHaoDynamic = async (
  cookie: string,
  taskData: DongCheHaoDynamicTaskInput,
  eventCallback: EventEmitter = new EventEmitter(),
): Promise<DongCheHaoPublishResultOutput> => {
  const result: DongCheHaoPublishResultOutput = { code: errorCode.ok, msg: '', taskId: taskData.taskId };
  try {
    taskData.cancelToken?.throwIfCancelled(privateKey);
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploading, '开始发布懂车号图文动态', taskData.taskId);

    const cache = new Map<string, string>();
    const imageSources = getDongCheHaoDynamicImageSources(taskData);
    const imageSourceField = imageSources.length ? 'images' : 'none';
    const userId = imageSources.length
      ? await resolveUserId(cookie, taskData.userId, taskData.proxy)
      : taskData.userId ?? '';
    const imageUris: string[] = [];
    for (const source of imageSources) {
      taskData.cancelToken?.throwIfCancelled(privateKey);
      let imageUri = cache.get(source);
      if (!imageUri) {
        // ApplyImageUpload returns a one-image SessionKey/StoreUri pair. The
        // official web page requests a fresh pair for every selected image.
        const imageContext = await createImageUploadContext(cookie, userId, taskData.proxy);
        imageUri = await uploadDongCheHaoDynamicImage(imageContext, source);
        cache.set(source, imageUri);
      }
      imageUris.push(imageUri);
    }
    if (imageSources.length && imageUris.length !== imageSources.length) {
      throw new Error(`图文图片上传结果数量异常:expected=${imageSources.length};actual=${imageUris.length}`);
    }

    taskData.cancelToken?.throwIfCancelled(privateKey);
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '图片上传完成', taskData.taskId);
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送懂车号图文动态', taskData.taskId);
    const postData = buildDongCheHaoDynamicPostData(taskData, imageUris);
    let csrfContext = await getDongCheHaoDynamicCsrfContext(cookie, taskData.proxy);
    const http = createDongCheHaoHttp(taskData.proxy);
    taskData.cancelToken?.disable(privateKey);

    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) csrfContext = await getDongCheHaoDynamicCsrfContext(csrfContext.cookie, taskData.proxy);
      const response = await http.post(DONG_CHE_HAO_DYNAMIC_PUBLISH_URL, postData, {
        headers: buildDongCheHaoDynamicPublishHeaders(
          csrfContext.cookie,
          DONG_CHE_HAO_DYNAMIC_REFERER,
          csrfContext.token,
        ),
      });
      const responseBody = asResponseObject(response.data);
      const publishId = getDongCheHaoDynamicPublishId(responseBody);
      const success = responseBody.status !== undefined && isSuccessfulValue(responseBody.status);
      if (success) {
        logger.info(
          `懂车号图文动态发布成功 ${taskData.taskId}; imageSource=${imageSourceField}; imageCount=${
            imageUris.length
          }; postForm=${summarizeDongCheHaoDynamicForm(postData)}; responseShape=${summarizeResponseShape(
            responseBody,
          )}`,
        );
        SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '懂车号图文动态发布成功', taskData.taskId);
        return {
          code: errorCode.ok,
          msg: getResponseMessage(responseBody) || '懂车号图文动态发布成功',
          taskId: taskData.taskId,
          publishId,
        };
      }

      const message = getResponseMessage(responseBody) || '懂车号图文动态发布失败';
      result.code = /login|登录|未登录/i.test(message) ? errorCode.loginExpire : getResponseCode(responseBody);
      result.msg = message;
      result.errorInfo = [
        `attempt=${attempt + 1}/3`,
        `responseStatus=${response.status}`,
        `contentType=${String(response.headers?.['content-type'] ?? '')}`,
        `csrfToken=${csrfContext.token ? 'present' : 'missing'}`,
        `csrfCookie=${getCookieValue(csrfContext.cookie, 'csrf_session_id') ? 'present' : 'missing'}`,
        `imageSource=${imageSourceField}`,
        `imageCount=${imageUris.length}`,
        `postForm=${summarizeDongCheHaoDynamicForm(postData)}`,
        `responseShape=${summarizeResponseShape(responseBody)}`,
      ].join('; ');
      if (attempt < 2 && /稍后重试|请重试|系统繁忙|超时|timeout|csrf|会话|session/i.test(message)) continue;
      break;
    }
  } catch (error) {
    result.code = error instanceof AxiosError ? errorCode.request_error : errorCode.data_error;
    result.msg = error instanceof Error ? error.message : String(error ?? '懂车号图文动态发布失败');
    result.errorInfo = error instanceof Error ? error.stack : String(error ?? '');
  }
  SetProgressNewEvent(
    eventCallback,
    publishStatusEnum.pushFail,
    result.msg || '懂车号图文动态发布失败',
    taskData.taskId,
  );
  return result;
};

const uploadVideoPart = async (
  http: AxiosInstance,
  uploadUrl: string,
  uploadId: string,
  partNumber: number,
  data: Buffer,
  userId: string,
  sign: string,
): Promise<string> => {
  const response = await http.put(
    `${uploadUrl}?partNumber=${partNumber}&uploadID=${encodeURIComponent(uploadId)}`,
    data,
    {
      headers: {
        Authorization: sign,
        'X-Storage-U': userId,
        'Content-Disposition': 'attachment; filename="undefined"',
        'Content-CRC32': crc32(data),
        'Content-Type': 'application/octet-stream',
        Accept: '*/*',
        Origin: DONG_CHE_HAO_ORIGIN,
        Referer: `${DONG_CHE_HAO_ORIGIN}/`,
      },
      maxBodyLength: Infinity,
    },
  );
  const body = asResponseObject(response.data);
  if (response.status < 200 || response.status >= 300 || (body.success !== undefined && String(body.success) !== '0')) {
    throw new Error(`视频分片上传失败:${partNumber}:${getResponseMessage(body)}`);
  }
  return crc32(data);
};

const uploadDcdVideoLegacy = async (
  cookie: string,
  userId: string,
  taskData: DongCheHaoVideoTaskInput,
  eventCallback: EventEmitter,
): Promise<{ uploadData: JsonObject; videoInfo: JsonObject }> => {
  const fileStat = await fs.promises.stat(taskData.video.localPath);
  if (fileStat.size <= 0) throw new Error(`视频文件为空:${taskData.video.localPath}`);
  const authData = await getDongCheHaoAuthKey(cookie, 'video', taskData.proxy);
  const uploadData = await getDcdUploadParams(
    cookie,
    authData.uploadToken,
    fileStat.size,
    'GetVideoUploadParams',
    taskData.proxy,
  );
  const uploadUrl = getTosUploadUrl(uploadData);
  const sign = getTosSign(uploadData);
  const http = createDongCheHaoHttp(taskData.proxy);
  const startResponse = await http.post(`${uploadUrl}?uploads`, '------WebKitFormBoundaryxjKyummOEGmnyH9P--', {
    headers: { Authorization: sign, 'X-Storage-U': userId, 'Content-Type': 'text/plain' },
  });
  const uploadId = String(asObject(asResponseObject(startResponse.data).payload).uploadID ?? '');
  if (String(asResponseObject(startResponse.data).success) !== '0' || !uploadId) throw new Error('获取视频上传ID失败');

  const blockSize = fileStat.size / 2097152 > 24 ? 5242880 : 2097152;
  const totalParts = Math.ceil(fileStat.size / blockSize);
  const crcList = new Map<number, string>();
  const fileHandle = await fs.promises.open(taskData.video.localPath, 'r');
  const pending: Array<Promise<{ partNumber: number; crc: string }>> = [];
  let uploadedParts = 0;
  const flushOne = async () => {
    const uploaded = await pending.shift();
    if (!uploaded) return;
    crcList.set(uploaded.partNumber, uploaded.crc);
    uploadedParts += 1;
    SetProgressNewEvent(
      eventCallback,
      publishStatusEnum.uploading,
      '视频上传中',
      taskData.taskId,
      totalParts,
      uploadedParts,
      Boolean(taskData.needParts),
    );
  };

  try {
    for (let partNumber = 1, offset = 0; offset < fileStat.size; partNumber++) {
      taskData.cancelToken?.throwIfCancelled(privateKey);
      const size = Math.min(blockSize, fileStat.size - offset);
      const data = Buffer.alloc(size);
      const read = await fileHandle.read(data, 0, size, offset);
      if (read.bytesRead !== size) throw new Error(`视频文件读取失败:${taskData.video.localPath}`);
      pending.push(
        uploadVideoPart(http, uploadUrl, uploadId, partNumber, data, userId, sign).then((crc) => ({ partNumber, crc })),
      );
      if (pending.length >= 3) await flushOne();
      offset += size;
    }
    while (pending.length) await flushOne();
  } finally {
    await fileHandle.close();
  }

  const partList = Array.from(crcList.keys())
    .sort((left, right) => left - right)
    .map((partNumber) => `${partNumber}:${crcList.get(partNumber)}`)
    .join(',');
  let finishBody: JsonObject = {};
  for (let attempt = 0; attempt < 5; attempt++) {
    const response = await http.post(`${uploadUrl}?uploadID=${encodeURIComponent(uploadId)}`, partList, {
      headers: { Authorization: sign, 'X-Storage-U': userId, 'Content-Type': 'text/plain;charset=UTF-8' },
    });
    finishBody = asResponseObject(response.data);
    if (String(finishBody.success) === '0' && asObject(finishBody.payload).key) break;
    const message = getResponseMessage(finishBody);
    if (!/merged$/i.test(message) || attempt === 4) throw new Error(`视频分片合并失败:${message}`);
    await Task.Delay(2000);
  }

  const node = getTosNode(uploadData);
  const extraParam = String(node.extra_param ?? uploadData.extra_param ?? '').replace(/^\?/, '');
  const infoResponse = await http.post(
    `${VAS_UPLOAD_URL}?action=UpdateVideoUploadInfos&${extraParam}`,
    {
      vid: node.vid ?? uploadData.vid,
      oid: node.oid ?? uploadData.oid,
      token: node.token ?? uploadData.token,
      poster_ss: 0,
      user_reference: '',
    },
    {
      headers: {
        ...dongCheHaoHeaders(cookie, `${DONG_CHE_HAO_ORIGIN}/`),
        Authorization: authData.uploadToken,
        'X-TT-Access': authData.uploadToken.split(':')[3],
        'Content-Type': 'application/json',
      },
    },
  );
  const infoBody = asResponseObject(infoResponse.data);
  const videoInfo = asObject(asObject(infoBody.data).video);
  if (String(infoBody.code) !== '2000' || !Object.keys(videoInfo).length)
    throw new Error(`获取上传完成视频信息失败:${getResponseMessage(infoBody)}`);
  return {
    uploadData,
    videoInfo: {
      ...videoInfo,
      vid: videoInfo.vid ?? node.vid ?? uploadData.vid,
      oid: videoInfo.oid ?? node.oid ?? uploadData.oid,
      poster: asObject(asObject(infoBody.data).poster),
      uploadToken: authData.uploadToken,
    },
  };
};

/**
 * 懂车帝新版网页视频上传流程：ApplyUploadInner -> 分片上传 -> 分片提交 -> CommitUploadInner。
 * 其中 CommitUploadInner 是官方上传完成后真正把视频提交给 VOD 的步骤。
 */
const uploadDcdVideoViaOfficialVod = async (
  cookie: string,
  userId: string,
  taskData: DongCheHaoVideoTaskInput,
  eventCallback: EventEmitter,
): Promise<{ uploadData: JsonObject; videoInfo: JsonObject }> => {
  const fileStat = await fs.promises.stat(taskData.video.localPath);
  if (fileStat.size <= 0) throw new Error(`视频文件为空:${taskData.video.localPath}`);

  let vodHttp: AxiosInstance;
  let node: DongCheHaoVodUploadNode;
  try {
    vodHttp = await createDongCheHaoVodHttp(cookie, taskData.proxy);
    node = await getDongCheHaoVodUploadArgs(vodHttp, fileStat.size);
  } catch (error) {
    throw new DongCheHaoVodUnavailableError(error instanceof Error ? error.message : String(error ?? 'VOD 上传不可用'));
  }
  const { url: uploadUrl, storeInfo } = getDongCheHaoVodUploadUrl(node);
  const uploadId = String(storeInfo.UploadID);
  const blockSize =
    fileStat.size > 1024 * 1024 * 1024
      ? 10 * 1024 * 1024
      : fileStat.size > 50 * 1024 * 1024
      ? 5 * 1024 * 1024
      : 3 * 1024 * 1024;
  const totalParts = Math.ceil(fileStat.size / blockSize);
  const crcList = new Map<number, string>();
  const fileHandle = await fs.promises.open(taskData.video.localPath, 'r');
  const pending: Array<Promise<{ partNumber: number; crc: string }>> = [];
  let uploadedParts = 0;
  const flushOne = async () => {
    const uploaded = await pending.shift();
    if (!uploaded) return;
    crcList.set(uploaded.partNumber, uploaded.crc);
    uploadedParts += 1;
    SetProgressNewEvent(
      eventCallback,
      publishStatusEnum.uploading,
      '视频上传中',
      taskData.taskId,
      totalParts,
      uploadedParts,
      Boolean(taskData.needParts),
    );
  };

  try {
    for (let partNumber = 1, offset = 0; offset < fileStat.size; partNumber++) {
      taskData.cancelToken?.throwIfCancelled(privateKey);
      const size = Math.min(blockSize, fileStat.size - offset);
      const data = Buffer.alloc(size);
      const read = await fileHandle.read(data, 0, size, offset);
      if (read.bytesRead !== size) throw new Error(`视频文件读取失败:${taskData.video.localPath}`);
      pending.push(
        uploadDongCheHaoVodPart(
          uploadUrl,
          uploadId,
          partNumber,
          data,
          userId,
          storeInfo,
          node.UploadHeader,
          taskData.proxy,
        ).then((crc) => ({ partNumber, crc })),
      );
      if (pending.length >= 3) await flushOne();
      offset += size;
    }
    while (pending.length) await flushOne();
  } finally {
    await fileHandle.close();
  }

  if (crcList.size !== totalParts) throw new Error('懂车号 VOD 视频分片上传不完整');
  const partList = Array.from(crcList.keys())
    .sort((left, right) => left - right)
    .map((partNumber) => `${partNumber}:${crcList.get(partNumber)}`)
    .join(',');
  SetProgressNewEvent(eventCallback, publishStatusEnum.uploading, '上传完成校验中', taskData.taskId);
  await finishDongCheHaoVodUpload(uploadUrl, uploadId, partList, userId, storeInfo, node.UploadHeader, taskData.proxy);
  taskData.cancelToken?.throwIfCancelled(privateKey);

  const commitBody = await commitDongCheHaoVodUpload(vodHttp, String(node.SessionKey));
  const committedVideo = asObject(asObject(commitBody.Result).Results?.[0]);
  const videoMeta = asObject(committedVideo.VideoMeta ?? committedVideo.video_meta);
  const videoId = String(committedVideo.Vid ?? committedVideo.vid ?? node.Vid ?? '');
  const videoUri = String(videoMeta.Uri ?? videoMeta.uri ?? '');
  if (!videoId || !videoUri) throw new Error('懂车号 VOD 视频提交结果缺少视频信息');
  const posterUri = String(
    committedVideo.PosterUri ?? committedVideo.poster_uri ?? videoMeta.PosterUri ?? videoMeta.poster_uri ?? '',
  );
  const poster = asObject(committedVideo.Poster ?? committedVideo.poster ?? videoMeta.Poster ?? videoMeta.poster);
  if (posterUri && !poster.oid && !poster.uri) {
    poster.oid = posterUri;
    poster.uri = posterUri;
  }
  const legacyVideoInfo = taskData.cover?.pathOrUrl
    ? undefined
    : await getDongCheHaoLegacyVideoInfo(cookie, String(node.SessionKey), taskData.proxy);
  const legacyVideo = asObject(legacyVideoInfo?.video);
  const legacyPoster = asObject(legacyVideoInfo?.poster);

  return {
    uploadData: { vid: videoId, oid: videoUri },
    videoInfo: {
      vid: videoId,
      oid: videoUri,
      video: {
        ...legacyVideo,
        ...videoMeta,
        uri: videoUri,
        width: videoMeta.Width ?? videoMeta.width,
        height: videoMeta.Height ?? videoMeta.height,
        duration: videoMeta.Duration ?? videoMeta.duration,
      },
      poster: Object.keys(legacyPoster).length ? legacyPoster : poster,
    },
  };
};

const uploadDcdVideo = async (
  cookie: string,
  userId: string,
  taskData: DongCheHaoVideoTaskInput,
  eventCallback: EventEmitter,
): Promise<{ uploadData: JsonObject; videoInfo: JsonObject }> => {
  try {
    return await uploadDcdVideoViaOfficialVod(cookie, userId, taskData, eventCallback);
  } catch (error) {
    if (!(error instanceof DongCheHaoVodUnavailableError)) throw error;
    logger.info(`懂车号新版 VOD 上传不可用，回退兼容上传链路 ${taskData.taskId}: ${error.message}`);
    return uploadDcdVideoLegacy(cookie, userId, taskData, eventCallback);
  }
};

/**
 * 懂车号网页端在最终发布前会先把上传完成的视频绑定到当前发布上下文。
 * 该接口的请求体是 application/x-www-form-urlencoded，仅包含 vid。
 */
export const buildDongCheHaoBindVideoPostData = (vid: string): string => `vid=${encodeURIComponent(String(vid))}`;

const bindDongCheHaoVideo = async (
  http: AxiosInstance,
  cookie: string,
  vid: string,
  antiToken: string,
  secSdkToken: string,
): Promise<{ itemId?: string; responseShape: string }> => {
  const response = await http.post(
    `${DONG_CHE_HAO_ORIGIN}/motor/content_publish/bind_video`,
    buildDongCheHaoBindVideoPostData(vid),
    {
      headers: {
        ...dongCheHaoHeaders(cookie, DONG_CHE_HAO_VIDEO_REFERER),
        Accept: '*/*',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        ...(antiToken ? { 'tt-anti-token': antiToken } : {}),
        ...(secSdkToken ? { 'x-secsdk-csrf-token': secSdkToken } : {}),
      },
    },
  );
  const body = asResponseObject(response.data);
  const apiCode = body.err_no ?? body.code ?? body.errno ?? body.status_code;
  const successValue = body.success;
  const failedByCode = isErrorCodeValue(apiCode);
  const failedByStatus =
    body.status !== undefined &&
    body.status !== null &&
    body.status !== '' &&
    !isSuccessfulValue(body.status) &&
    !isSuccessMessage(body);
  const failedBySuccess = successValue !== undefined && !isSuccessfulValue(successValue);
  if (response.status < 200 || response.status >= 300 || failedByCode || failedByStatus || failedBySuccess) {
    throw new Error(`懂车号视频绑定失败:${getResponseMessage(body) || summarizeResponse(response.data)}`);
  }
  return { itemId: getPublishId(body), responseShape: summarizeResponseShape(body) };
};

const uploadDcdVideoCover = async (
  cookie: string,
  userId: string,
  source: string,
  proxy?: IWebProxy,
  fallbackSize?: Pick<ImageInfo, 'width' | 'height'>,
): Promise<DongCheHaoVideoCoverInfo> => {
  const data = await readBinary(toImageSource(source), proxy);
  const authData = await getDongCheHaoAuthKey(cookie, 'image', proxy);
  const uploadData = await getDcdUploadParams(cookie, authData.uploadToken, data.length, 'GetImageUploadParams', proxy);
  const uploadUrl = getTosUploadUrl(uploadData, true);
  const response = await createDongCheHaoHttp(proxy).put(uploadUrl, data, {
    headers: {
      Authorization: getTosSign(uploadData),
      'X-Storage-U': userId,
      'Content-Disposition': 'attachment; filename="undefined"',
      'Content-CRC32': crc32(data),
      'Content-Type': 'application/octet-stream',
      Accept: '*/*',
      Origin: DONG_CHE_HAO_ORIGIN,
      Referer: `${DONG_CHE_HAO_ORIGIN}/`,
      'Sec-Fetch-Site': 'cross-site',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Dest': 'empty',
    },
    maxBodyLength: Infinity,
  });
  const body = asResponseObject(response.data);
  if (response.status < 200 || response.status >= 300 || String(body.success) !== '0')
    throw new Error(`封面上传失败:${source}`);

  const objectId = String(getTosNode(uploadData).object_ids?.[0] ?? uploadData.object_ids?.[0] ?? '');
  if (!objectId) throw new Error('图片上传参数缺少 object_id');
  const infoResponse = await createDongCheHaoHttp(proxy).post(
    `${VAS_UPLOAD_URL}?action=GetImageUploadInfos&`,
    [{ uri: objectId }],
    {
      headers: {
        ...dongCheHaoHeaders(cookie, `${DONG_CHE_HAO_ORIGIN}/`),
        Authorization: authData.uploadToken,
        'X-TT-Access': authData.uploadToken.split(':')[3],
        'Content-Type': 'application/json',
      },
    },
  );
  const imageInfo = asObject(asResponseObject(infoResponse.data).data?.[0]);
  const uri = String(imageInfo.uri ?? '');
  if (String(asResponseObject(infoResponse.data).code) !== '2000' || !uri)
    throw new Error(`获取封面信息失败:${source}`);
  const width = Number(imageInfo.width ?? imageInfo.info?.width ?? fallbackSize?.width);
  const height = Number(imageInfo.height ?? imageInfo.info?.height ?? fallbackSize?.height);
  return {
    uri,
    ...(Number.isFinite(width) && width > 0 ? { width } : {}),
    ...(Number.isFinite(height) && height > 0 ? { height } : {}),
  };
};

export const buildDongCheHaoVideoPostData = (
  taskData: DongCheHaoVideoTaskInput,
  videoInfo: JsonObject,
  coverUri: string,
  verticalCover?: DongCheHaoVideoCoverInfo,
  itemId?: string,
): string => {
  const video = asObject(videoInfo.video ?? videoInfo);
  const videoDuration = formatDongCheHaoVideoDuration(video.duration, videoInfo.duration, taskData.video.duration);
  const videoHeight = firstPositiveNumber(video.height, videoInfo.height, taskData.video.height);
  const videoWidth = firstPositiveNumber(video.width, videoInfo.width, taskData.video.width);
  const timerTime = taskData.pubType === 1 ? formatDongCheHaoVideoTimerTime(taskData.prePubTime) : undefined;
  const verticalCoverImage = verticalCover?.uri
    ? JSON.stringify({
        uri: verticalCover.uri,
        height: verticalCover.height ?? 0,
        width: verticalCover.width ?? 0,
      })
    : '';
  const creatorStatement = taskData.creatorStatement?.text
    ? JSON.stringify({
        text: taskData.creatorStatement.text,
        ...(taskData.creatorStatement.input !== undefined ? { input: taskData.creatorStatement.input } : {}),
      })
    : '';
  const query: string[] = [
    `height=${videoHeight}`,
    `width=${videoWidth}`,
    `description=${encodeURIComponent(taskData.title ?? '')}`,
    ...(verticalCoverImage ? [`vertical_cover_image=${encodeURIComponent(verticalCoverImage)}`] : []),
    'sync_to_toutiao=0',
    `video_id=${encodeURIComponent(String(videoInfo.vid ?? video.vid ?? ''))}`,
    `video_duration=${videoDuration}`,
    `publish_type=${taskData.pubType ?? 1}`,
    'praise=0',
    `thumb_uri=${encodeURIComponent(coverUri)}`,
    'key_frames=%5B%5D',
    `abstract=${encodeURIComponent(taskData.desc ?? '')}`,
    ...(timerTime ? [`timer_time=${timerTime}`] : []),
    ...(creatorStatement ? [`creator_statement=${encodeURIComponent(creatorStatement)}`] : []),
    `item_id=${encodeURIComponent(itemId ?? '')}`,
    'video_type=2',
    'thumb_time=0',
    'thumb_source=0',
    'common_source=80037',
    'motor_source=80037',
    'source_v2=80037',
    'DevicePlatform=pc',
    'sync2douyin=0',
    `claim_origin=${taskData.isOriginal === 1 ? 1 : 0}`,
    'CoverTitles=%5B%5D',
    'TemplateName=',
    'FilterName=',
    'Praise=0',
    'mp_act_id=',
    'TerminalType=01',
    'OsType=09',
    'SoftType=chrome%2092.0.4515.159',
  ];
  return query.join('&');
};

export const buildDongCheHaoVideoPublishHeaders = (
  cookie: string,
  referer: string = DONG_CHE_HAO_VIDEO_REFERER,
  antiToken?: string,
  secSdkToken?: string,
): Record<string, string> => ({
  ...dongCheHaoHeaders(cookie, referer),
  Accept: '*/*',
  'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
  Priority: 'u=1, i',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Dest': 'empty',
  ...(antiToken ? { 'tt-anti-token': antiToken } : {}),
  ...(secSdkToken ? { 'x-secsdk-csrf-token': secSdkToken } : {}),
});

export const publishDongCheHaoVideo = async (
  cookie: string,
  taskData: DongCheHaoVideoTaskInput,
  eventCallback: EventEmitter = new EventEmitter(),
): Promise<DongCheHaoPublishResultOutput> => {
  const result: DongCheHaoPublishResultOutput = { code: errorCode.ok, msg: '', taskId: taskData.taskId };
  try {
    taskData.cancelToken?.throwIfCancelled(privateKey);
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploading, '开始发布懂车号视频', taskData.taskId);
    if (!taskData.video?.localPath || !fs.existsSync(taskData.video.localPath)) {
      result.code = errorCode.io_error;
      result.msg = `视频文件不存在:${taskData.video?.localPath ?? ''}`;
      return result;
    }
    const userId = await resolveUserId(cookie, taskData.userId, taskData.proxy);
    SetProgressNewEvent(eventCallback, publishStatusEnum.uploading, '视频上传中', taskData.taskId);
    const uploaded = await uploadDcdVideo(cookie, userId, taskData, eventCallback);
    taskData.cancelToken?.throwIfCancelled(privateKey);

    const poster = asObject(uploaded.videoInfo.poster);
    const autoCover = String(poster.oid ?? poster.uri ?? poster.Uri ?? uploaded.videoInfo.posterUri ?? '');
    const coverInfo = taskData.cover?.pathOrUrl
      ? await uploadDcdVideoCover(cookie, userId, taskData.cover.pathOrUrl, taskData.proxy, taskData.cover)
      : { uri: autoCover };
    if (!coverInfo.uri) throw new Error('懂车号未返回自动封面，请提供封面图片');
    const verticalCoverInfo = taskData.verticalCover?.pathOrUrl
      ? await uploadDcdVideoCover(
          cookie,
          userId,
          taskData.verticalCover.pathOrUrl,
          taskData.proxy,
          taskData.verticalCover,
        )
      : undefined;

    SetProgressNewEvent(eventCallback, publishStatusEnum.uploadSuccess, '视频和封面上传完成', taskData.taskId);
    const http = createDongCheHaoHttp(taskData.proxy);
    const [bindAntiToken, bindSecSdkToken] = await Promise.all([
      getDongCheHaoAntiToken(cookie, taskData.proxy),
      getDongCheHaoSecSdkToken(cookie, taskData.proxy),
    ]);
    const videoId = String(uploaded.videoInfo.vid ?? asObject(uploaded.videoInfo.video).vid ?? '');
    if (!videoId) throw new Error('上传完成视频缺少 vid');
    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '绑定懂车号视频', taskData.taskId);
    const bindResult = await bindDongCheHaoVideo(http, cookie, videoId, bindAntiToken, bindSecSdkToken);
    const boundItemId = bindResult.itemId;

    // bind_video 可能会刷新发布上下文；最终发布必须使用绑定之后获取的 token。
    let antiToken = (await getDongCheHaoAntiToken(cookie, taskData.proxy)) || bindAntiToken;
    let secSdkToken = (await getDongCheHaoSecSdkToken(cookie, taskData.proxy)) || bindSecSdkToken;

    SetProgressNewEvent(eventCallback, publishStatusEnum.pushing, '推送懂车号视频', taskData.taskId);
    const postData = buildDongCheHaoVideoPostData(
      taskData,
      uploaded.videoInfo,
      coverInfo.uri,
      verticalCoverInfo,
      boundItemId,
    );
    const scheduled = taskData.pubType === 1 && isDongCheHaoVideoScheduled(taskData.prePubTime);
    const finalReferer = boundItemId
      ? `${DONG_CHE_HAO_VIDEO_REFERER}?pgc_id=${encodeURIComponent(boundItemId)}`
      : DONG_CHE_HAO_VIDEO_REFERER;
    taskData.cancelToken?.disable(privateKey);
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) {
        antiToken = (await getDongCheHaoAntiToken(cookie, taskData.proxy)) || antiToken;
        secSdkToken = (await getDongCheHaoSecSdkToken(cookie, taskData.proxy)) || secSdkToken;
      }

      const response = await http.post(`${DONG_CHE_HAO_ORIGIN}/motor/content_publish/publish_video/v1`, postData, {
        headers: buildDongCheHaoVideoPublishHeaders(cookie, finalReferer, antiToken, secSdkToken),
      });
      const responseBody = asResponseObject(response.data);
      const publishResult = buildPublishResult(taskData.taskId, responseBody, '懂车号视频发布失败');
      if (publishResult.code === errorCode.ok) {
        if (!scheduled) {
          SetProgressNewEvent(eventCallback, publishStatusEnum.pushSuccess, '懂车号视频发布成功', taskData.taskId);
        }
        return {
          ...publishResult,
          msg: scheduled ? '定时发布中' : publishResult.msg,
          scheduled,
        };
      }

      result.code = publishResult.code;
      result.msg = publishResult.msg;
      result.errorInfo = [
        `attempt=${attempt + 1}/3`,
        `responseStatus=${response.status}`,
        `contentType=${String(response.headers?.['content-type'] ?? '')}`,
        `bindAntiToken=${bindAntiToken ? 'present' : 'missing'}`,
        `publishAntiToken=${antiToken ? 'present' : 'missing'}`,
        `secSdkToken=${secSdkToken ? 'present' : 'missing'}`,
        `publishType=${taskData.pubType}`,
        `boundItemId=${boundItemId ? 'present' : 'missing'}`,
        `verticalCover=${verticalCoverInfo ? 'present' : 'missing'}`,
        `creatorStatement=${taskData.creatorStatement?.text ? 'present' : 'missing'}`,
        `videoDimensions=${firstPositiveNumber(
          asObject(uploaded.videoInfo.video ?? uploaded.videoInfo).width,
          uploaded.videoInfo.width,
          taskData.video.width,
        )}x${firstPositiveNumber(
          asObject(uploaded.videoInfo.video ?? uploaded.videoInfo).height,
          uploaded.videoInfo.height,
          taskData.video.height,
        )}`,
        `videoDuration=${firstPositiveNumber(
          asObject(uploaded.videoInfo.video ?? uploaded.videoInfo).duration,
          uploaded.videoInfo.duration,
          taskData.video.duration,
        )}`,
        `publishVideoDuration=${formatDongCheHaoVideoDuration(
          asObject(uploaded.videoInfo.video ?? uploaded.videoInfo).duration,
          uploaded.videoInfo.duration,
          taskData.video.duration,
        )}`,
        `postDataLength=${Buffer.byteLength(postData)}`,
        `postForm=${summarizePublishForm(postData)}`,
        `bindResponse=${bindResult.responseShape}`,
        `responseBody=${summarizeResponse(response.data)}`,
      ].join('; ');

      if (attempt < 2 && /系统繁忙|稍后重试|请重试|invalid/i.test(publishResult.msg ?? '')) {
        await Task.Delay(1000 * (attempt + 1));
        continue;
      }
      break;
    }
  } catch (error) {
    result.code = error instanceof AxiosError ? errorCode.request_error : errorCode.data_error;
    result.msg = error instanceof Error ? error.message : String(error ?? '懂车号视频发布失败');
    result.errorInfo = error instanceof Error ? error.stack : String(error ?? '');
  }
  SetProgressNewEvent(eventCallback, publishStatusEnum.pushFail, result.msg || '懂车号视频发布失败', taskData.taskId);
  logger.error(`懂车号视频发布失败 ${taskData.taskId}: ${result.msg}`);
  return result;
};

export const DongCheHao = {
  getDongCheHaoUserInfo,
  getDongCheHaoContentListResponse,
  getDongCheHaoArticleContentListResponse,
  getDongCheHaoVideoContentListResponse,
  getDongCheHaoShortVideoContentListResponse,
  getDongCheHaoVerticalVideoContentListResponse,
  getDongCheHaoDynamicContentListResponse,
  getDongCheHaoMediaStatus,
  getDongCheHaoArticleStatus,
  getDongCheHaoVideoStatus,
  getDongCheHaoDynamicStatus,
  publishVideo: publishDongCheHaoVideo,
  publishArticle: publishDongCheHaoArticle,
  publishDynamic: publishDongCheHaoDynamic,
};
