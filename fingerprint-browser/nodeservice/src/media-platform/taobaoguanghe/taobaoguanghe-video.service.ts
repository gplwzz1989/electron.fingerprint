import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import {
  BaseSinglePublishTask,
  BaseSinglePublishTaskDynamic,
  BaseSinglePublishTaskVideo,
} from '../../cloud/model/BaseTaskFormModel';
import { AuditResult, GoodsItemInfo, ImageInfo, ListGoodsInfoResponse, ListItemInfo } from '../baseModel';
import { BaseResult } from '../baseResult';
import { errorCode } from '../errorCode';
import { createHttpInstance } from '../../http';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../webproxy';
import { auditStatusEnum, htmlDecode } from '@/utils';
import { privateKey } from '@/utils/CancelToken';
import { getTaoBaoGuangHeUserInfo } from './taobaoguanghe-user.service';

const TAOBAO_GUANGHE_VIDEO_BIZ_CODE = 'pc_video_daren_publish';
const TAOBAO_GUANGHE_IMAGE_TEXT_BIZ_CODE = 'pc_photo_daren_publish';
const TAOBAO_GUANGHE_APP_KEY = '12574478';
const TAOBAO_GUANGHE_MTOP_VERSION = '2.6.1';
const TAOBAO_GUANGHE_SDK_VERSION = '0.6.2-beta.2';
const TAOBAO_GUANGHE_MTOP_URL = 'https://h5api.m.taobao.com/h5';
const TAOBAO_GUANGHE_BIZ_CONFIG_URL = 'https://upload.media.aliyun.com/api/gateway/bizConfig';
const TAOBAO_GUANGHE_COVER_UPLOAD_URL =
  'https://stream-upload.taobao.com/api/upload.api?appkey=gg_tmp&folderId=0&_input_charset=utf-8&useGtrSessionFilter=false';
const TAOBAO_GUANGHE_IMAGE_UPLOAD_URL =
  'https://stream-upload.taobao.com/api/upload.api?appkey=daren&folderId=0&_input_charset=utf-8&useGtrSessionFilter=false';
const TAOBAO_GUANGHE_PUBLISH_CONFIG_API = 'mtop.taobao.media.guang.pc.config';
const TAOBAO_GUANGHE_PUBLISH_API = 'mtop.taobao.media.guang.pcPublish.publish';
const TAOBAO_GUANGHE_SESSION_GENERATE_API = 'mtop.taobao.media.guang.session.generate';
const TAOBAO_GUANGHE_ITEM_LIST_TABS_API = 'mtop.taobao.media.guang.item.listTabs';
const TAOBAO_GUANGHE_ITEM_LIST_ITEMS_API = 'mtop.taobao.media.guang.item.listItems';
const TAOBAO_GUANGHE_CONTENT_LIST_API = 'mtop.taobao.gcm.content.admin.list';
const TAOBAO_GUANGHE_DELETE_API = 'mtop.taobao.gcm.content.admin.delete';
const TAOBAO_GUANGHE_WORKSPACE_REFERER = 'https://creator.guanghe.taobao.com/page/workspace/tb';
const TAOBAO_GUANGHE_ITEM_REFERER = 'https://huodong.taobao.com/';
const TAOBAO_GUANGHE_ITEM_PAGE_SIZE = 15;
const TAOBAO_GUANGHE_ITEM_MAX = 6;
const TAOBAO_GUANGHE_DEFAULT_ITEM_SOURCE = 'coreitem';
const TAOBAO_GUANGHE_MTOP_COOKIE_MAX_BYTES = 4096;

// 浏览器 Cookie 中有些风控/追踪字段会非常大，透传给代理后可能触发 431。
const TAOBAO_GUANGHE_MTOP_LARGE_COOKIE_NAMES = new Set(['tfstk', 'ultraCookieBase']);
const TAOBAO_GUANGHE_MTOP_PRIORITY_COOKIE_NAMES = [
  '_m_h5_tk',
  '_m_h5_tk_enc',
  'cookie2',
  '_tb_token_',
  't',
  'cna',
  'unb',
  'cookie17',
  'cookie1',
  'cookie21',
  'uc1',
  'uc3',
  'uc4',
  'lgc',
  'tracknick',
  'sn',
  'sg',
  'isg',
  'havana_lgc2_0',
  'havana_lgc_exp',
  '_hvn_lgc__',
  'sgcookie',
  'wk_cookie2',
  'wk_unb',
  'xly_s',
  'mtop_partitioned_detect',
];

// 淘宝光合官方“创作者声明”编码：0/1/2/4/5/6。
const TAOBAO_GUANGHE_STATEMENT_TYPES = new Set([0, 1, 2, 4, 5, 6]);

const guangHeHttp = createHttpInstance({
  timeout: 120000,
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

type JsonRecord = Record<string, any>;

type TaoBaoGuangHeVideoPublishTask = BaseSinglePublishTaskVideo & {
  allow_download?: boolean;
  statement?: {
    type: number;
    forwardFrom?: string;
  };
};

export type TaoBaoGuangHeImageTextPublishTask = BaseSinglePublishTaskDynamic & {
  tags?: string[];
  topics?: ListItemInfo[];
  statement?: {
    type: number;
    forwardFrom?: string;
  };
};

const normalizeStatementType = (value: unknown): number => {
  const statementType = Number(value);
  return Number.isInteger(statementType) && TAOBAO_GUANGHE_STATEMENT_TYPES.has(statementType) ? statementType : 0;
};

export interface TaoBaoGuangHeUploadBizConfig {
  apiInfo?: {
    init?: string;
    keepAlive?: string;
    complete?: string;
    second?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface TaoBaoGuangHePublishOptions {
  proxy?: KuaiDaiLiProxy;
  onProgress?: (uploadedParts: number, totalParts: number, message: string) => void;
  onStage?: (stage: 'upload' | 'push', message: string) => void;
}

export type TaoBaoGuangHeGoodsPageType = 'video' | 'photo';

/**
 * 淘宝光合商品选择器的查询上下文。
 *
 * `publishSession` 来自光合 `session.generate`，由运行时生成/透传，调用方不需要自己计算签名。
 */
export interface TaoBaoGuangHeGoodsQueryOptions {
  pageType?: TaoBaoGuangHeGoodsPageType;
  ugcScene?: string;
  site?: string;
  publishVersion?: string;
  publishSession?: string;
  filterValue?: string;
  secondLevelFilterValue?: string;
  source?: string;
  pageSize?: number;
  expoContents?: string;
  sortType?: string;
  sortValue?: string;
  proxy?: KuaiDaiLiProxy;
}

export interface TaoBaoGuangHeGoodsFilter {
  filterName?: string;
  filterValue?: string;
  selected?: boolean;
  [key: string]: unknown;
}

export interface TaoBaoGuangHeGoodsTab {
  tabName?: string;
  tabGroup?: string;
  filters?: TaoBaoGuangHeGoodsFilter[];
  secondLevelFilters?: TaoBaoGuangHeGoodsFilter[];
  [key: string]: unknown;
}

export interface TaoBaoGuangHeGoodsTabsResult {
  code: number;
  msg?: string;
  data?: object;
  dataList?: TaoBaoGuangHeGoodsTab[];
  publishSession?: string;
  raw?: unknown;
}

export interface TaoBaoGuangHeGoodsListResult extends ListGoodsInfoResponse {
  publishSession?: string;
  raw?: unknown;
}

export interface TaoBaoGuangHeVideoPublishResult {
  publishId: string;
  fileId: string;
  coverUrl: string;
  raw: unknown;
}

export interface TaoBaoGuangHeImageTextPublishResult {
  publishId: string;
  pictureIds: string[];
  raw: unknown;
}

export class TaoBaoGuangHePublishError extends Error {
  constructor(
    message: string,
    public readonly phase: 'upload' | 'push',
    public readonly code?: number,
  ) {
    super(message);
    this.name = 'TaoBaoGuangHePublishError';
  }
}

interface MtopRequestOptions {
  method?: 'GET' | 'POST';
  timeout?: number;
  proxy?: KuaiDaiLiProxy;
  referer?: string;
  query?: Record<string, string | number | boolean | undefined>;
}

interface MtopResponse {
  envelope: JsonRecord;
  data: JsonRecord;
}

interface MtopCookieState {
  value: string;
}

interface VideoUploadStrategy {
  uploadId: string;
  uploadUrlList: Array<string | JsonRecord>;
  sliceSize: number;
  sliceRetryCount: number;
  concurrentSliceNum: number;
}

interface UploadedVideoInfo {
  fileId: string;
  ossUrl?: string;
  uploadId?: string;
}

interface CoverUploadResult {
  url: string;
  width?: number;
  height?: number;
}

interface PublishConfig {
  bizCode: string;
  publishExtra: JsonRecord;
  publishSession?: string;
  dataSession: string;
  sessionId: string;
  abParams?: unknown;
  pageConfig?: JsonRecord;
}

interface PublishConfigOptions {
  contentType: 'video' | 'article';
  ugcScene: string;
  bizCode: string;
  mediaType: 'video' | 'photo';
}

interface UploadedPictureInfo {
  id: string;
  fileId: string;
  url: string;
  width?: number;
  height?: number;
}

const isRecord = (value: unknown): value is JsonRecord => {
  return !!value && typeof value === 'object' && !Array.isArray(value);
};

type TaoBaoGuangHeInlineType = 'Topic' | 'At' | 'Brand' | 'Shop';

export interface TaoBaoGuangHeDescription {
  title: string;
  titleRaw: string;
  titleElements: JsonRecord[];
}

const TAOBAO_GUANGHE_INLINE_TYPES: Record<string, TaoBaoGuangHeInlineType> = {
  topic: 'Topic',
  friend: 'At',
  at: 'At',
  brand: 'Brand',
  shop: 'Shop',
};

const TAOBAO_GUANGHE_INLINE_TOKEN = '\u0000taobao-guanghe-inline-';

const decodeGuangHeText = (value: string): string => {
  return htmlDecode(value)
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (match, code: string) => {
      try {
        return String.fromCodePoint(Number(code));
      } catch {
        return match;
      }
    })
    .replace(/&#x([\da-f]+);/gi, (match, code: string) => {
      try {
        return String.fromCodePoint(parseInt(code, 16));
      } catch {
        return match;
      }
    });
};

const cleanGuangHeText = (value: string): string => {
  return decodeGuangHeText(value)
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .trim();
};

const getGuangHeMarkupAttribute = (attributes: string, name: string): string | undefined => {
  const match = attributes.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  const value = match?.[1] ?? match?.[2] ?? match?.[3];
  return value === undefined ? undefined : decodeGuangHeText(value);
};

const parseGuangHeRaw = (value: string | undefined): JsonRecord => {
  if (!value) {
    return {};
  }
  const candidates = [decodeGuangHeText(value)];
  try {
    candidates.push(decodeURIComponent(candidates[0]));
  } catch {
    // raw 不是 URL 编码时直接使用第一份候选值。
  }
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (isRecord(parsed)) {
        return parsed;
      }
    } catch {
      // 非 JSON raw 由调用方继续使用 text/name 属性兜底。
    }
  }
  return {};
};

const getGuangHeRawValue = (raw: JsonRecord, ...keys: string[]): string | undefined => {
  const nested = isRecord(raw.raw) ? raw.raw : {};
  for (const key of keys) {
    const value = raw[key] ?? nested[key];
    if (value !== undefined && value !== null && String(value).trim()) {
      return String(value);
    }
  }
  return undefined;
};

const normalizeGuangHeTopicName = (value: string): string => {
  return cleanGuangHeText(value)
    .replace(/^#+\s*/, '')
    .replace(/#+\s*$/, '')
    .trim();
};

const stripGuangHeInlineText = (value: string): string => {
  return cleanGuangHeText(value.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, ''));
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const stripTrailingGuangHeTopics = (value: string, topicNames: string[]): string => {
  if (!value || topicNames.length === 0) {
    return value;
  }
  const topicSuffix = topicNames.map((name) => `#\\s*${escapeRegExp(name)}\\s*#?`).join('\\s+');
  const match = value.match(new RegExp(`(?:^|\\s+)${topicSuffix}\\s*$`, 'u'));
  return match?.index === undefined ? value : value.slice(0, match.index).trimEnd();
};

const createGuangHeInline = (
  tagName: string,
  attributes: string,
  innerHtml: string,
): { type: TaoBaoGuangHeInlineType; visibleText: string; element: JsonRecord } | undefined => {
  const type = TAOBAO_GUANGHE_INLINE_TYPES[tagName.toLowerCase()];
  if (!type) {
    return undefined;
  }
  const raw = parseGuangHeRaw(getGuangHeMarkupAttribute(attributes, 'raw'));
  const innerText = stripGuangHeInlineText(innerHtml);
  const attrText = getGuangHeMarkupAttribute(attributes, 'text') ?? getGuangHeMarkupAttribute(attributes, 'name');
  const name = normalizeGuangHeTopicName(
    attrText ?? getGuangHeRawValue(raw, 'yixiaoerName', 'nickname', 'userNick', 'name', 'title') ?? innerText,
  );
  if (!name) {
    return undefined;
  }

  const id =
    getGuangHeMarkupAttribute(attributes, 'id') ??
    getGuangHeRawValue(raw, 'id', 'userId', 'userIdEncrypt', 'yixiaoerId', 'brandId', 'shopId');
  const subType =
    getGuangHeMarkupAttribute(attributes, 'subType') ??
    getGuangHeMarkupAttribute(attributes, 'hashTagType') ??
    getGuangHeRawValue(raw, 'subType', 'hashTagType') ??
    (type === 'Topic' ? 'hashtag_customize' : undefined);
  const element: JsonRecord = {
    id: id ?? '',
    name,
    ...(subType ? { subType } : {}),
    type,
  };

  let visibleText = name;
  if (type === 'Topic') {
    visibleText = `#${name}`;
  } else if (type === 'At') {
    visibleText = `@${name}`;
  } else if (innerText) {
    visibleText = innerText;
  }
  return { type, visibleText, element };
};

const parseGuangHeDescription = (value: string): TaoBaoGuangHeDescription => {
  const inlineMap = new Map<string, { type: TaoBaoGuangHeInlineType; visibleText: string; element: JsonRecord }>();
  let inlineIndex = 0;
  let html = value.replace(
    /<(topic|friend|at|brand|shop)\b([^>]*)>([\s\S]*?)<\/\1\s*>/gi,
    (match, tagName: string, attributes: string, innerHtml: string) => {
      const inline = createGuangHeInline(tagName, attributes, innerHtml);
      if (!inline) {
        return innerHtml;
      }
      const token = `${TAOBAO_GUANGHE_INLINE_TOKEN}${inlineIndex++}\u0000`;
      inlineMap.set(token, inline);
      return token;
    },
  );

  html = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|h[1-6]|section)\s*>/gi, '\n')
    .replace(/<(?:p|div|li|h[1-6]|section)\b[^>]*>/gi, '')
    .replace(/<[^>]*>/g, '');

  let title = '';
  let titleRaw = '';
  const titleElements: JsonRecord[] = [];
  let cursor = 0;
  const tokenPattern = /\u0000taobao-guanghe-inline-\d+\u0000/g;
  for (const match of html.matchAll(tokenPattern)) {
    const token = match[0];
    const index = match.index ?? 0;
    const text = html.slice(cursor, index);
    title += decodeGuangHeText(text);
    titleRaw += decodeGuangHeText(text);
    const inline = inlineMap.get(token);
    if (inline && (inline.type !== 'Topic' || titleElements.filter((item) => item.type === 'Topic').length < 4)) {
      title += inline.visibleText;
      titleRaw += `{##[${inline.type}]##}`;
      titleElements.push(inline.element);
    } else if (inline) {
      title += inline.visibleText;
      titleRaw += inline.visibleText;
    }
    cursor = index + token.length;
  }
  const tail = html.slice(cursor);
  title += decodeGuangHeText(tail);
  titleRaw += decodeGuangHeText(tail);

  return {
    title: cleanGuangHeText(title),
    titleRaw: cleanGuangHeText(titleRaw),
    titleElements,
  };
};

export const buildGuangHeDescription = (description: string, tags: string[] = []): TaoBaoGuangHeDescription => {
  const parsed = parseGuangHeDescription(description);
  const tagNames = Array.from(
    new Set(tags.map((tag) => normalizeGuangHeTopicName(String(tag ?? ''))).filter(Boolean)),
  ).slice(0, 4);
  const parsedTopicNames = parsed.titleElements
    .filter((element) => element.type === 'Topic')
    .map((element) => String(element.name));
  const knownTopicNames = new Set(parsedTopicNames);
  const duplicateTopicNames = Array.from(new Set([...parsedTopicNames, ...tagNames]));
  let title = stripTrailingGuangHeTopics(parsed.title, duplicateTopicNames);
  let titleRaw = stripTrailingGuangHeTopics(parsed.titleRaw, duplicateTopicNames);
  const titleElements = [...parsed.titleElements];
  for (const name of tagNames) {
    if (knownTopicNames.has(name) || titleElements.filter((item) => item.type === 'Topic').length >= 4) {
      continue;
    }
    title = `${title}${title ? ' ' : ''}#${name}`;
    titleRaw = `${titleRaw}${titleRaw ? ' ' : ''}{##[Topic]##}`;
    titleElements.push({ id: '', name, subType: 'hashtag_customize', type: 'Topic' });
    knownTopicNames.add(name);
  }
  return {
    title: cleanGuangHeText(title),
    titleRaw: cleanGuangHeText(titleRaw),
    titleElements,
  };
};

const parseJsonMaybe = (value: unknown): any => {
  if (Buffer.isBuffer(value)) {
    value = value.toString('utf8');
  }
  if (typeof value !== 'string') {
    return value;
  }
  const text = value.trim().replace(/^\uFEFF/, '');
  if (!text) {
    return value;
  }
  try {
    return JSON.parse(text);
  } catch {
    const jsonp = text.match(/^[^(]+\(([\s\S]*)\)\s*;?$/);
    if (jsonp?.[1]) {
      try {
        return JSON.parse(jsonp[1]);
      } catch {
        return value;
      }
    }
    return value;
  }
};

const parseRecord = (value: unknown): JsonRecord | undefined => {
  const parsed = parseJsonMaybe(value);
  return isRecord(parsed) ? parsed : undefined;
};

/**
 * Extract the publish session returned by GuangHe pc.config.
 *
 * The config response has appeared in several shapes (plain object, nested
 * data/model objects, and JSON strings). The session is created before media
 * upload, so topic search must be able to find it without an upload result.
 */
export const extractTaoBaoGuangHePublishSession = (value: unknown): string | undefined => {
  const visited = new Set<object>();
  const visit = (current: unknown, depth: number): string | undefined => {
    if (current === undefined || current === null || depth > 8) {
      return undefined;
    }

    const parsed = parseJsonMaybe(current);
    if (parsed !== current) {
      return visit(parsed, depth + 1);
    }

    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        const session = visit(item, depth + 1);
        if (session) {
          return session;
        }
      }
      return undefined;
    }

    if (!isRecord(parsed)) {
      return undefined;
    }
    if (visited.has(parsed)) {
      return undefined;
    }
    visited.add(parsed);

    for (const [key, child] of Object.entries(parsed)) {
      if (key.replace(/[_-]/g, '').toLowerCase() === 'publishsession') {
        const session = parseJsonMaybe(child);
        if (typeof session === 'string' && session.trim()) {
          return session.trim();
        }
        if (typeof session === 'number' && Number.isFinite(session)) {
          return String(session);
        }
      }
    }

    for (const child of Object.values(parsed)) {
      const session = visit(child, depth + 1);
      if (session) {
        return session;
      }
    }
    return undefined;
  };

  return visit(value, 0);
};

const normalizeAbParams = (value: unknown): JsonRecord[] | undefined => {
  const parsed = parseJsonMaybe(value);
  if (Array.isArray(parsed)) {
    return parsed.filter((item): item is JsonRecord => isRecord(item));
  }
  if (!isRecord(parsed)) {
    return undefined;
  }
  return Object.values(parsed)
    .filter((item): item is JsonRecord => isRecord(item))
    .map((item) => ({
      ...(item.bucketId === undefined ? {} : { bucketId: item.bucketId }),
      ...(item.paramKey === undefined ? {} : { paramKey: item.paramKey }),
      ...(item.paramValue === undefined ? {} : { paramValue: item.paramValue }),
      ...(item.releaseId === undefined ? {} : { releaseId: item.releaseId }),
    }));
};

const unwrapMtopData = (envelope: JsonRecord): JsonRecord => {
  let value: any = parseJsonMaybe(envelope?.data);
  for (let i = 0; i < 3; i += 1) {
    if (!isRecord(value)) {
      break;
    }
    if (isRecord(value.data) && !value.model && !value.publishParams && !value.publishExtra) {
      value = value.data;
      continue;
    }
    break;
  }
  return isRecord(value) ? value : {};
};

const getModel = (envelope: JsonRecord): JsonRecord => {
  const data = unwrapMtopData(envelope);
  if (isRecord(data.model)) {
    return data.model;
  }
  if (isRecord(data.result)) {
    return data.result;
  }
  return data;
};

interface MtopCookiePair {
  name: string;
  value: string;
  key: string;
}

const parseMtopCookiePairs = (cookie: string): MtopCookiePair[] =>
  cookie
    .split(';')
    .map((item) => item.trim())
    .map((item) => {
      const separator = item.indexOf('=');
      if (separator <= 0) {
        return undefined;
      }
      const name = item.slice(0, separator).trim();
      return {
        name,
        value: item.slice(separator + 1).trim(),
        key: name.replace(/^\*|\*$/g, '').toLowerCase(),
      };
    })
    .filter((item): item is MtopCookiePair => Boolean(item));

const serializeMtopCookiePairs = (pairs: MtopCookiePair[]): string =>
  pairs.map(({ name, value }) => `${name}=${value}`).join('; ');

const getMtopCookieValue = (cookie: string, name: string): string => {
  const key = name.trim().toLowerCase();
  const pairs = parseMtopCookiePairs(cookie);
  for (let index = pairs.length - 1; index >= 0; index -= 1) {
    if (pairs[index].key === key) {
      return pairs[index].value;
    }
  }
  return '';
};

const getMtopToken = (cookie: string): string => {
  const token = getMtopCookieValue(cookie, '_m_h5_tk');
  const rawToken = token.split('_')[0];
  try {
    return decodeURIComponent(rawToken);
  } catch {
    return rawToken;
  }
};

const getMtopTokenFingerprint = (cookie: string): string =>
  `${getMtopCookieValue(cookie, '_m_h5_tk')}\u0000${getMtopCookieValue(cookie, '_m_h5_tk_enc')}`;

const shouldRefreshMtopToken = (cookie: string): boolean => {
  const rawToken = getMtopCookieValue(cookie, '_m_h5_tk');
  if (!rawToken) return true;

  let token = rawToken;
  try {
    token = decodeURIComponent(rawToken);
  } catch {
    // Keep the raw value when a malformed cookie value is received.
  }

  const expiryMatch = token.match(/_(\d{10,})$/);
  if (!expiryMatch) return false;

  const timestamp = Number(expiryMatch[1]);
  if (!Number.isFinite(timestamp)) return false;

  const expiryAt = timestamp < 100_000_000_000 ? timestamp * 1000 : timestamp;
  return expiryAt <= Date.now() + 30_000;
};

const getTaoBaoGuangHeMtopCookie = (cookie: string, omitMtopToken = false): string => {
  const pairs = parseMtopCookiePairs(cookie);
  if (!pairs.length) {
    return cookie.trim();
  }

  const pairByKey = new Map<string, MtopCookiePair>();
  pairs.forEach((pair) => pairByKey.set(pair.key, pair));

  const selected: MtopCookiePair[] = [];
  const selectedKeys = new Set<string>();
  const addPair = (pair: MtopCookiePair | undefined): void => {
    if (
      !pair ||
      selectedKeys.has(pair.key) ||
      (omitMtopToken && (pair.key === '_m_h5_tk' || pair.key === '_m_h5_tk_enc'))
    ) {
      return;
    }
    const candidate = serializeMtopCookiePairs([...selected, pair]);
    if (Buffer.byteLength(candidate, 'utf8') > TAOBAO_GUANGHE_MTOP_COOKIE_MAX_BYTES) {
      return;
    }
    selected.push(pair);
    selectedKeys.add(pair.key);
  };

  TAOBAO_GUANGHE_MTOP_PRIORITY_COOKIE_NAMES.forEach((name) => addPair(pairByKey.get(name.toLowerCase())));
  pairs.filter((pair) => !TAOBAO_GUANGHE_MTOP_LARGE_COOKIE_NAMES.has(pair.key)).forEach(addPair);
  pairs.filter((pair) => TAOBAO_GUANGHE_MTOP_LARGE_COOKIE_NAMES.has(pair.key)).forEach(addPair);

  return serializeMtopCookiePairs(selected);
};

const sanitizeErrorMessage = (error: unknown): string => {
  const message = error instanceof Error ? error.message : String(error ?? '未知错误');
  return message.replace(/https?:\/\/[^\s]+/gi, '[url]').slice(0, 500);
};

const getErrorCodeFromMessage = (message: string): number | undefined => {
  if (/not[\s_-]*login|login[\s_-]*expired|登录失效|登录过期|请先登录|未登录|账号失效|账号过期/i.test(message)) {
    return 172403;
  }
  return undefined;
};

const getSetCookieHeaders = (headers: unknown): string[] => {
  if (!isRecord(headers)) {
    return [];
  }

  const headerBag = headers as Record<string, unknown> & {
    get?: (name: string) => unknown;
  };
  const getterValue = typeof headerBag.get === 'function' ? headerBag.get('set-cookie') : undefined;
  const value = getterValue ?? headerBag['set-cookie'] ?? headerBag['Set-Cookie'];
  const values = Array.isArray(value) ? value : typeof value === 'string' ? [value] : [];

  return values
    .filter((item): item is string => typeof item === 'string')
    .flatMap((item) => item.split(/,(?=\s*[^;,=\s]+=[^;,]*)/g))
    .map((item) => item.trim())
    .filter(Boolean);
};

const mergeSetCookie = (cookie: string, headers: unknown): string => {
  const cookieMap = new Map<string, MtopCookiePair>();
  parseMtopCookiePairs(cookie).forEach((pair) => cookieMap.set(pair.key, pair));

  getSetCookieHeaders(headers).forEach((setCookie) => {
    const firstPair =
      setCookie
        .replace(/^set-cookie:\s*/i, '')
        .split(';', 1)[0]
        ?.trim() ?? '';
    const separator = firstPair.indexOf('=');
    if (separator <= 0) {
      return;
    }
    const name = firstPair.slice(0, separator).trim();
    const value = firstPair.slice(separator + 1).trim();
    const key = name.replace(/^\*|\*$/g, '').toLowerCase();
    if (/(?:^|;)\s*max-age\s*=\s*0(?:;|$)/i.test(setCookie)) {
      cookieMap.delete(key);
      return;
    }
    cookieMap.set(key, { name, value, key });
  });

  return Array.from(cookieMap.entries())
    .map(([, pair]) => `${pair.name}=${pair.value}`)
    .join('; ');
};

export const isTaoBaoGuangHeMtopTokenInvalid = (envelope: JsonRecord): boolean => {
  const ret = Array.isArray(envelope?.ret) ? envelope.ret : [];
  const text = [
    ...ret,
    envelope?.code,
    envelope?.msg,
    envelope?.message,
    typeof envelope?.data === 'string' ? envelope.data : '',
  ]
    .filter((item) => item !== undefined && item !== null)
    .join(' ');
  return /令牌(?:过期|为空)|session(?:[\s_-]*expired|过期)|fail_sys_(?:session_expired|token_(?:expired|exoi?red|empty))|token[\s_-]*(?:expired|empty)/i.test(
    text,
  );
};

const getAgentConfig = (proxy?: KuaiDaiLiProxy): JsonRecord => {
  const agent = proxy ? createKuaiProxyAgent(proxy) : undefined;
  return agent ? { httpAgent: agent, httpsAgent: agent } : {};
};

const assertMtopSuccess = (envelope: JsonRecord, api: string): void => {
  const ret = Array.isArray(envelope?.ret) ? envelope.ret : [];
  const failed = ret.find((item: unknown) => !/^SUCCESS::/i.test(String(item)));
  if (failed) {
    throw new Error(`${api}: ${String(failed).replace(/^\w+::/, '')}`);
  }
  if (
    envelope?.code !== undefined &&
    String(envelope.code) !== '0' &&
    String(envelope.code).toUpperCase() !== 'SUCCESS'
  ) {
    throw new Error(`${api}: code ${String(envelope.code)}`);
  }
};

const requestMtop = async (
  cookieState: MtopCookieState,
  api: string,
  data: JsonRecord,
  options: MtopRequestOptions = {},
): Promise<MtopResponse> => {
  const method = options.method ?? 'GET';
  const dataString = JSON.stringify(data);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const cookie = cookieState.value;
    const timestamp = Date.now().toString();
    const refreshMtopToken = attempt === 0 && shouldRefreshMtopToken(cookie);
    const token = refreshMtopToken ? '' : getMtopToken(cookie);
    const sign = crypto
      .createHash('md5')
      .update(`${token}&${timestamp}&${TAOBAO_GUANGHE_APP_KEY}&${dataString}`)
      .digest('hex');
    const query = new URLSearchParams();
    query.set('jsv', TAOBAO_GUANGHE_MTOP_VERSION);
    query.set('appKey', TAOBAO_GUANGHE_APP_KEY);
    query.set('t', timestamp);
    query.set('sign', sign);
    query.set('api', api);
    query.set('v', '1.0');
    query.set('type', 'originaljson');
    query.set('dataType', 'jsonp');
    query.set('preventFallback', 'true');
    query.set('syncCookieMode', 'true');
    if (options.query) {
      Object.entries(options.query).forEach(([key, value]) => {
        if (value !== undefined) {
          query.set(key, String(value));
        }
      });
    }

    const url = `${TAOBAO_GUANGHE_MTOP_URL}/${api}/1.0/?${query.toString()}`;
    const referer = options.referer ?? 'https://huodong.taobao.com/';
    const headers: JsonRecord = {
      Cookie: getTaoBaoGuangHeMtopCookie(cookie, refreshMtopToken),
      Accept: 'application/json, text/plain, */*',
      Origin: new URL(referer).origin,
      Referer: referer,
    };
    const requestConfig: JsonRecord = {
      headers,
      timeout: options.timeout ?? 120000,
      ...getAgentConfig(options.proxy),
    };

    let response;
    if (method === 'POST') {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
      const form = new URLSearchParams();
      form.set('data', dataString);
      response = await guangHeHttp.post(url, form.toString(), requestConfig);
    } else {
      query.set('data', dataString);
      response = await guangHeHttp.get(`${TAOBAO_GUANGHE_MTOP_URL}/${api}/1.0/?${query.toString()}`, requestConfig);
    }

    const refreshedCookie = mergeSetCookie(cookie, response.headers);
    const mtopTokenRefreshed = getMtopTokenFingerprint(refreshedCookie) !== getMtopTokenFingerprint(cookie);
    if (refreshedCookie) {
      cookieState.value = refreshedCookie;
    }

    const envelope = parseJsonMaybe(response.data);
    if (!isRecord(envelope)) {
      const contentType = String(response.headers?.['content-type'] ?? '');
      const body = Buffer.isBuffer(response.data)
        ? response.data.toString('utf8')
        : typeof response.data === 'string'
        ? response.data
        : JSON.stringify(response.data ?? '');
      const preview = body.replace(/\s+/g, ' ').trim().slice(0, 200);
      throw new Error(
        `${api}: 响应格式异常(status=${response.status}, contentType=${contentType || 'unknown'}, body=${preview})`,
      );
    }
    if (isTaoBaoGuangHeMtopTokenInvalid(envelope) && attempt === 0 && mtopTokenRefreshed) {
      continue;
    }
    assertMtopSuccess(envelope, api);
    return { envelope, data: unwrapMtopData(envelope) };
  }
  throw new Error(`${api}: 令牌过期，刷新后重试仍失败`);
};

const getUploadBizConfig = async (proxy?: KuaiDaiLiProxy): Promise<TaoBaoGuangHeUploadBizConfig> => {
  const response = await guangHeHttp.get(TAOBAO_GUANGHE_BIZ_CONFIG_URL, {
    params: { bizCode: TAOBAO_GUANGHE_VIDEO_BIZ_CODE },
    headers: {
      Accept: 'application/json, text/plain, */*',
      Origin: 'https://huodong.taobao.com',
      Referer: 'https://huodong.taobao.com/',
    },
    ...getAgentConfig(proxy),
  });
  const body = parseJsonMaybe(response.data);
  const config = isRecord(body?.data) ? body.data : body;
  if (!isRecord(config) || !isRecord(config.apiInfo)) {
    throw new Error('光合视频上传配置为空');
  }
  return config as TaoBaoGuangHeUploadBizConfig;
};

const buildDefaultPublishExtra = (mediaType: 'video' | 'photo' = 'video'): JsonRecord => ({
  short_title_min: '1',
  short_title_max: '30',
  video_short_title_min: '0',
  video_short_title_max: '30',
  text_min: '10',
  text_max: '1000',
  video_text_min: '0',
  show_short_title_entry: '1',
  content_empty_config: '1',
  video_content_empty_config: '0',
  media_type: mediaType,
  cover_type: '4',
  text_type: '1',
  post_channel: 'normal',
  cus_cover: '1',
  enable_cps: '0',
  item_min: '0',
  item_max: '6',
  shop_min: '0',
  shop_max: '6',
  topic_disable: '0',
  enableConfig: '1',
});

const getPublishConfig = async (
  cookieState: MtopCookieState,
  proxy?: KuaiDaiLiProxy,
  publishSession?: string,
  options: PublishConfigOptions = {
    contentType: 'video',
    ugcScene: 'pc_newcreator_video',
    bizCode: TAOBAO_GUANGHE_VIDEO_BIZ_CODE,
    mediaType: 'video',
  },
): Promise<PublishConfig> => {
  const sessionId = GuidLike();
  const dataSession = `${sessionId}${Math.floor(Math.random() * 100)}`;
  const request: JsonRecord = {
    contentType: options.contentType,
    ugcScene: options.ugcScene,
    contentId: '',
    dataSession,
  };
  if (publishSession) {
    request.publishSession = publishSession;
  }
  const response = await requestMtop(cookieState, TAOBAO_GUANGHE_PUBLISH_CONFIG_API, request, {
    proxy,
    referer: 'https://huodong.taobao.com/',
  });
  const data = response.data;
  const model = parseRecord(data.model) ?? data;
  const pageConfig = parseRecord(model.pageConfig);
  const publishParams =
    parseRecord(model.publishParams) || parseRecord(model.publishExtra) || parseRecord(pageConfig?.publishParams) || {};
  const returnedSession = extractTaoBaoGuangHePublishSession(data) ?? publishSession;
  const returnedDataSession = model.dataSession ?? publishParams.dataSession ?? dataSession;
  return {
    bizCode: String(model.bizCode ?? options.bizCode),
    publishExtra: {
      ...buildDefaultPublishExtra(options.mediaType),
      ...publishParams,
      umi_pub_session: sessionId,
      dataSession: String(returnedDataSession),
      post_channel: publishParams.post_channel ?? 'normal',
    },
    publishSession: returnedSession == null ? undefined : String(returnedSession),
    dataSession: String(returnedDataSession),
    sessionId,
    abParams: normalizeAbParams(model.abParams ?? pageConfig?.abParams),
    pageConfig,
  };
};

const getTaoBaoGuangHeGoodsContext = (options: TaoBaoGuangHeGoodsQueryOptions = {}): JsonRecord => {
  const pageType = options.pageType ?? 'video';
  const isPhoto = pageType === 'photo';
  return {
    ugc_scene: options.ugcScene ?? (isPhoto ? 'pc_newcreator_pic' : 'pc_newcreator_video'),
    ugcScene: options.ugcScene ?? (isPhoto ? 'pc_newcreator_pic' : 'pc_newcreator_video'),
    pageType,
    site: options.site ?? 'guangguang',
    publishVersion: options.publishVersion ?? '1',
    publishSession: options.publishSession?.trim() ?? '',
  };
};

const generateTaoBaoGuangHePublishSession = async (
  cookieState: MtopCookieState,
  options: TaoBaoGuangHeGoodsQueryOptions = {},
): Promise<string> => {
  const isPhoto = options.pageType === 'photo';
  const ugcScene = options.ugcScene ?? (isPhoto ? 'pc_newcreator_pic' : 'pc_newcreator_video');
  const response = await requestMtop(
    cookieState,
    TAOBAO_GUANGHE_SESSION_GENERATE_API,
    {
      request: JSON.stringify({ ugcScene }),
    },
    {
      method: 'POST',
      timeout: 5000,
      proxy: options.proxy,
      referer: TAOBAO_GUANGHE_ITEM_REFERER,
      query: {
        withCredentials: true,
        timeout: 5000,
      },
    },
  );
  const publishSession = extractTaoBaoGuangHePublishSession(response.data);
  if (!publishSession) {
    throw new Error('光合 session.generate 未返回 publishSession');
  }
  return publishSession;
};

const getTaoBaoGuangHeGoodsPublishSession = async (
  cookieState: MtopCookieState,
  options: TaoBaoGuangHeGoodsQueryOptions,
): Promise<string> => {
  const configuredSession = options.publishSession?.trim();
  if (configuredSession) {
    return configuredSession;
  }

  return generateTaoBaoGuangHePublishSession(cookieState, options);
};

/**
 * 构造光合商品分类/Tab接口请求参数。
 *
 * 该接口只返回商品选择器的分类和筛选项，具体商品由 listItems 接口返回。
 * 兼容传入 publishSession 字符串或完整查询选项，便于业务侧直接复用。
 */
export function buildTaoBaoGuangHeGoodsTabsRequest(
  publishSessionOrOptions: string | TaoBaoGuangHeGoodsQueryOptions = '',
  maybeOptions: TaoBaoGuangHeGoodsQueryOptions = {},
): JsonRecord {
  const options =
    typeof publishSessionOrOptions === 'string'
      ? { ...maybeOptions, publishSession: publishSessionOrOptions }
      : publishSessionOrOptions;
  return {
    ...getTaoBaoGuangHeGoodsContext(options),
    show_tab_level: 1,
  };
}

/**
 * 构造光合商品列表接口请求参数。
 * `nextPage` 对应官方响应里的 cursor；首页传空字符串。
 */
export function buildTaoBaoGuangHeGoodsListRequest(
  keyWordOrOptions: string | TaoBaoGuangHeGoodsQueryOptions = '',
  nextPage: string = '',
  maybeOptions: TaoBaoGuangHeGoodsQueryOptions = {},
): JsonRecord {
  const keyWord = typeof keyWordOrOptions === 'string' ? keyWordOrOptions : '';
  const options = typeof keyWordOrOptions === 'string' ? maybeOptions : keyWordOrOptions;
  const source = options.source?.trim() || TAOBAO_GUANGHE_DEFAULT_ITEM_SOURCE;
  const request: JsonRecord = {
    source,
    cursor: nextPage ?? '',
    keyword: keyWord ?? '',
    pageSize: options.pageSize ?? TAOBAO_GUANGHE_ITEM_PAGE_SIZE,
    expoContents: options.expoContents ?? '',
    sortType: options.sortType ?? '',
    sortValue: options.sortValue ?? '',
    ...getTaoBaoGuangHeGoodsContext(options),
  };
  if (source === 'order') {
    if (options.filterValue !== undefined) {
      request.filterValue = options.filterValue;
    }
    if (options.secondLevelFilterValue !== undefined) {
      request.secondLevelFilterValue = options.secondLevelFilterValue;
    }
  } else if (source === 'selfShop') {
    // 店铺账号的“本店商品”没有一级筛选，官方首页只提交二级筛选默认值。
    if (options.filterValue !== undefined) {
      request.filterValue = options.filterValue;
    }
    request.secondLevelFilterValue = options.secondLevelFilterValue ?? '-1';
  } else {
    request.filterValue = options.filterValue ?? '-1';
    request.secondLevelFilterValue = options.secondLevelFilterValue ?? '-1';
  }
  return request;
}

const getTaoBaoGuangHeArray = (value: JsonRecord, keys: string[]): JsonRecord[] => {
  for (const key of keys) {
    const direct = value[key];
    if (Array.isArray(direct)) {
      return direct.filter((item): item is JsonRecord => isRecord(item));
    }
    if (isRecord(direct)) {
      for (const nestedKey of keys) {
        const nested = direct[nestedKey];
        if (Array.isArray(nested)) {
          return nested.filter((item): item is JsonRecord => isRecord(item));
        }
      }
    }
  }
  return [];
};

const toTaoBaoGuangHeGoodsPrice = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== 'string' || !value.trim()) {
    return undefined;
  }
  const price = Number(value.replace(/[^\d.-]/g, ''));
  return Number.isFinite(price) ? price : undefined;
};

const toTaoBaoGuangHeGoodsListItem = (item: JsonRecord): GoodsItemInfo | undefined => {
  const itemId = item.itemId ?? item.itemID ?? item.id;
  if (itemId === undefined || itemId === null || String(itemId).trim() === '') {
    return undefined;
  }
  const image = item.picUrl ?? item.imageUrl ?? item.imgUrl;
  const price = toTaoBaoGuangHeGoodsPrice(item.price);
  return {
    yixiaoerId: String(itemId),
    yixiaoerName: String(item.title ?? item.itemTitle ?? ''),
    ...(image == null ? {} : { yixiaoerImageUrl: String(image), images: [String(image)] }),
    ...(item.shopTitle == null && item.categoryName == null
      ? {}
      : { yixiaoerDesc: String(item.shopTitle ?? item.categoryName) }),
    ...(price === undefined ? {} : { price }),
    raw: item,
  };
};

/**
 * 获取光合商品选择器的分类和筛选项。
 * 未传 publishSession 时会先调用 session.generate 获取当前发布会话；商品接口失败时会刷新会话并重试一次。
 */
export const getTaoBaoGuangHeGoodsTabs = async (
  cookie: string,
  options: TaoBaoGuangHeGoodsQueryOptions = {},
): Promise<TaoBaoGuangHeGoodsTabsResult> => {
  const cookieState: MtopCookieState = { value: cookie };
  try {
    let publishSession = await getTaoBaoGuangHeGoodsPublishSession(cookieState, options);
    let response: MtopResponse;
    try {
      response = await requestMtop(
        cookieState,
        TAOBAO_GUANGHE_ITEM_LIST_TABS_API,
        buildTaoBaoGuangHeGoodsTabsRequest({ ...options, publishSession }),
        {
          method: 'POST',
          timeout: 120000,
          proxy: options.proxy,
          referer: TAOBAO_GUANGHE_ITEM_REFERER,
          query: { timeout: 10000 },
        },
      );
    } catch {
      publishSession = await generateTaoBaoGuangHePublishSession(cookieState, options);
      response = await requestMtop(
        cookieState,
        TAOBAO_GUANGHE_ITEM_LIST_TABS_API,
        buildTaoBaoGuangHeGoodsTabsRequest({ ...options, publishSession }),
        {
          method: 'POST',
          timeout: 120000,
          proxy: options.proxy,
          referer: TAOBAO_GUANGHE_ITEM_REFERER,
          query: { timeout: 10000 },
        },
      );
    }
    const model = getModel(response.envelope);
    const tabs = getTaoBaoGuangHeArray(model, ['result', 'tabs', 'data']);
    return {
      code: errorCode.ok,
      msg: '',
      data: model,
      dataList: tabs as TaoBaoGuangHeGoodsTab[],
      publishSession,
      raw: response.envelope,
    };
  } catch (error) {
    const message = sanitizeErrorMessage(error);
    return {
      code: getErrorCodeFromMessage(message) ?? errorCode.data_error,
      msg: message || '获取光合商品分类失败',
    };
  }
};

/**
 * 获取光合商品列表。返回的 `raw` 必须在发布时原样带回官方 `items` 字段。
 */
export const getTaoBaoGuangHeGoodsList = async (
  cookie: string,
  keyWord: string = '',
  nextPage: string = '',
  options: TaoBaoGuangHeGoodsQueryOptions = {},
): Promise<TaoBaoGuangHeGoodsListResult> => {
  const cookieState: MtopCookieState = { value: cookie };
  try {
    let publishSession = await getTaoBaoGuangHeGoodsPublishSession(cookieState, options);
    let response: MtopResponse;
    try {
      response = await requestMtop(
        cookieState,
        TAOBAO_GUANGHE_ITEM_LIST_ITEMS_API,
        buildTaoBaoGuangHeGoodsListRequest(keyWord, nextPage, { ...options, publishSession }),
        {
          method: 'POST',
          timeout: 120000,
          proxy: options.proxy,
          referer: TAOBAO_GUANGHE_ITEM_REFERER,
          query: { timeout: 10000 },
        },
      );
    } catch {
      publishSession = await generateTaoBaoGuangHePublishSession(cookieState, options);
      response = await requestMtop(
        cookieState,
        TAOBAO_GUANGHE_ITEM_LIST_ITEMS_API,
        buildTaoBaoGuangHeGoodsListRequest(keyWord, nextPage, { ...options, publishSession }),
        {
          method: 'POST',
          timeout: 120000,
          proxy: options.proxy,
          referer: TAOBAO_GUANGHE_ITEM_REFERER,
          query: { timeout: 10000 },
        },
      );
    }
    const model = getModel(response.envelope);
    const rawItems = getTaoBaoGuangHeArray(model, ['data', 'result', 'items', 'list']);
    const dataList = rawItems.map(toTaoBaoGuangHeGoodsListItem).filter((item): item is GoodsItemInfo => !!item);
    const cursorValue =
      model.cursor ?? model.nextCursor ?? (isRecord(model.pageInfo) ? model.pageInfo.cursor : undefined);
    const cursor = cursorValue == null ? '' : String(cursorValue).trim();
    return {
      code: errorCode.ok,
      msg: '',
      data: model,
      dataList,
      ...(cursor && cursor !== String(nextPage ?? '').trim() ? { nextPage: cursor } : {}),
      publishSession,
      raw: response.envelope,
    };
  } catch (error) {
    const message = sanitizeErrorMessage(error);
    return {
      code: getErrorCodeFromMessage(message) ?? errorCode.data_error,
      msg: message || '获取光合商品列表失败',
      dataList: [],
    };
  }
};

const getVideoMimeType = (filePath: string): string => {
  const extension = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.mkv': 'video/x-matroska',
    '.webm': 'video/webm',
  };
  return mimeTypes[extension] ?? 'video/mp4';
};

const getImageMimeType = (image: ImageInfo): { extension: string; mimeType: string } => {
  const source = image.pathOrUrl ?? '';
  const sourceExtension = path.extname(source.split('?')[0]).replace('.', '').toLowerCase();
  const format = String(image.format ?? sourceExtension ?? 'jpeg')
    .replace('.', '')
    .toLowerCase();
  if (format === 'png') {
    return { extension: 'png', mimeType: 'image/png' };
  }
  if (format === 'webp') {
    return { extension: 'webp', mimeType: 'image/webp' };
  }
  return { extension: 'jpg', mimeType: 'image/jpeg' };
};

const isAliCdnImage = (value: string): boolean => {
  try {
    const url = new URL(value);
    return /(^|\.)alicdn\.com$/i.test(url.hostname);
  } catch {
    return false;
  }
};

const readCover = async (
  image: ImageInfo,
  proxy?: KuaiDaiLiProxy,
): Promise<{ data: Buffer; extension: string; mimeType: string }> => {
  const { extension, mimeType } = getImageMimeType(image);
  if (/^https?:\/\//i.test(image.pathOrUrl)) {
    const response = await guangHeHttp.get(image.pathOrUrl, {
      responseType: 'arraybuffer',
      timeout: 120000,
      ...getAgentConfig(proxy),
    });
    return { data: Buffer.from(response.data), extension, mimeType };
  }
  if (!fs.existsSync(image.pathOrUrl)) {
    throw new TaoBaoGuangHePublishError('封面文件不存在', 'upload', 172002);
  }
  return { data: await fs.promises.readFile(image.pathOrUrl), extension, mimeType };
};

const uploadCover = async (cookie: string, image: ImageInfo, proxy?: KuaiDaiLiProxy): Promise<CoverUploadResult> => {
  if (/^https?:\/\//i.test(image.pathOrUrl) && isAliCdnImage(image.pathOrUrl)) {
    return { url: image.pathOrUrl, width: image.width, height: image.height };
  }
  const cover = await readCover(image, proxy);
  const filename = `cover_${Date.now()}.${cover.extension}`;
  const form = new FormData();
  form.append('name', filename);
  form.append('file', cover.data, { filename, contentType: cover.mimeType });
  const response = await guangHeHttp.post(TAOBAO_GUANGHE_COVER_UPLOAD_URL, form, {
    headers: {
      ...form.getHeaders(),
      Cookie: cookie,
      Accept: 'application/json, text/plain, */*',
      Origin: 'https://huodong.taobao.com',
      Referer: 'https://huodong.taobao.com/',
    },
    timeout: 120000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    ...getAgentConfig(proxy),
  });
  const body = parseJsonMaybe(response.data);
  const object = isRecord(body?.object) ? body.object : isRecord(body?.data?.object) ? body.data.object : undefined;
  if (!object?.url) {
    throw new Error('光合封面上传失败');
  }
  return {
    url: String(object.url),
    width: image.width ?? (parseInt(String(object.pix ?? '').split('x')[0], 10) || undefined),
    height: image.height ?? (parseInt(String(object.pix ?? '').split('x')[1], 10) || undefined),
  };
};

let taoBaoGuangHePictureIdSequence = 0;

/**
 * 光合图文请求里的 pics.id 是页面侧生成的图片临时标识，不是 upload.api 返回的 fileId。
 * 使用毫秒时间戳加三位序号，保持与官方页面相同的 16 位数字形态，并避免同一批图片重复。
 */
const createPictureId = (): string => {
  const sequence = taoBaoGuangHePictureIdSequence++ % 1000;
  return `${Date.now()}${String(sequence).padStart(3, '0')}`;
};

const uploadImage = async (cookie: string, image: ImageInfo, proxy?: KuaiDaiLiProxy): Promise<UploadedPictureInfo> => {
  const picture = await readCover(image, proxy);
  const filename = `image_${Date.now()}.${picture.extension}`;
  const form = new FormData();
  form.append('name', filename);
  form.append('file', picture.data, { filename, contentType: picture.mimeType });
  const response = await guangHeHttp.post(TAOBAO_GUANGHE_IMAGE_UPLOAD_URL, form, {
    headers: {
      ...form.getHeaders(),
      Cookie: cookie,
      Accept: 'application/json, text/plain, */*',
      Origin: 'https://huodong.taobao.com',
      Referer: 'https://huodong.taobao.com/',
    },
    timeout: 120000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    ...getAgentConfig(proxy),
  });
  const body = parseJsonMaybe(response.data);
  const object = isRecord(body?.object) ? body.object : isRecord(body?.data?.object) ? body.data.object : undefined;
  const fileId = object?.fileId ?? object?.id;
  const url = object?.url;
  if (!fileId || !url) {
    throw new Error('光合图文图片上传失败');
  }
  const pix = String(object?.pix ?? '');
  return {
    id: createPictureId(),
    fileId: String(fileId),
    url: String(url),
    width: image.width ?? (parseInt(pix.split('x')[0], 10) || undefined),
    height: image.height ?? (parseInt(pix.split('x')[1], 10) || undefined),
  };
};

const getUploadStrategy = async (
  cookieState: MtopCookieState,
  filePath: string,
  fileSize: number,
  proxy?: KuaiDaiLiProxy,
): Promise<VideoUploadStrategy> => {
  const bizConfig = await getUploadBizConfig(proxy);
  const initApi = bizConfig.apiInfo?.init ?? 'mtop.video.upload.init.taobao';
  const initData: JsonRecord = {
    bizCode: TAOBAO_GUANGHE_VIDEO_BIZ_CODE,
    fileSize,
    mimeType: getVideoMimeType(filePath),
    localFileName: path.basename(filePath),
    sdkVersion: TAOBAO_GUANGHE_SDK_VERSION,
  };
  const response = await requestMtop(cookieState, initApi, initData, { proxy });
  const model = getModel(response.envelope);
  const strategy = isRecord(model.uploadStrategy)
    ? model.uploadStrategy
    : isRecord(model.strategy)
    ? model.strategy
    : model;
  const uploadUrlListValue = parseJsonMaybe(strategy.uploadUrlList ?? model.uploadUrlList);
  const uploadUrlList = Array.isArray(uploadUrlListValue) ? uploadUrlListValue : [];
  const policy = isRecord(strategy.videoUploadPolicy)
    ? strategy.videoUploadPolicy
    : isRecord(model.videoUploadPolicy)
    ? model.videoUploadPolicy
    : strategy;
  const sliceSize = Number(policy.sliceSize ?? strategy.sliceSize ?? 8);
  const uploadId = strategy.uploadId ?? model.uploadId;
  if (!uploadId || uploadUrlList.length === 0 || !Number.isFinite(sliceSize) || sliceSize <= 0) {
    throw new Error('光合视频上传参数不完整');
  }
  return {
    uploadId: String(uploadId),
    uploadUrlList,
    sliceSize,
    sliceRetryCount: Math.max(1, Number(policy.sliceRetryCount ?? strategy.sliceRetryCount ?? 3)),
    concurrentSliceNum: Math.max(1, Number(policy.concurrentSliceNum ?? strategy.concurrentSliceNum ?? 1)),
  };
};

const getUploadUrl = (item: string | JsonRecord): { url: string; partNumber: number } => {
  if (typeof item === 'string') {
    let partNumber = 0;
    try {
      partNumber = Number(new URL(item).searchParams.get('partNumber') ?? 0);
    } catch {
      // The URL will be validated by the upload request.
    }
    return { url: item, partNumber: Number.isFinite(partNumber) ? partNumber : 0 };
  }
  const url = item.url ?? item.uploadUrl ?? item.partUrl;
  if (!url) {
    throw new Error('光合视频分片上传地址为空');
  }
  const urlString = String(url);
  let partNumber = Number(item.partNumber ?? item.partNo ?? 0);
  if (!Number.isFinite(partNumber) || partNumber <= 0) {
    try {
      partNumber = Number(new URL(urlString).searchParams.get('partNumber') ?? 0);
    } catch {
      partNumber = 0;
    }
  }
  return { url: urlString, partNumber: Number.isFinite(partNumber) ? partNumber : 0 };
};

const getResponseHeader = (headers: unknown, name: string): string => {
  if (!headers || typeof headers !== 'object') {
    return '';
  }
  const headerBag = headers as {
    get?: (key: string) => unknown;
    [key: string]: unknown;
  };
  const value =
    headerBag.get?.(name) ?? headerBag[name] ?? headerBag[name.toLowerCase()] ?? headerBag[name.toUpperCase()];
  return value == null ? '' : String(value);
};

const getOssErrorDetail = (data: unknown): string => {
  const text =
    Buffer.isBuffer(data) || typeof data === 'string' ? Buffer.from(data).toString('utf8') : JSON.stringify(data ?? '');
  const code = text.match(/<Code>\s*([^<]+)\s*<\/Code>/i)?.[1]?.trim();
  const message = text.match(/<Message>\s*([^<]+)\s*<\/Message>/i)?.[1]?.trim();
  return [code, message].filter(Boolean).join(': ').slice(0, 200);
};

const uploadPart = async (url: string, data: Buffer, proxy?: KuaiDaiLiProxy): Promise<string> => {
  const response = await guangHeHttp.put(url, data, {
    headers: {
      // 光合下发的 OSS 预签名 URL 按浏览器请求生成，浏览器分片 PUT 不带 Content-Type。
      // Axios 对 Buffer + PUT 会自动补 application/x-www-form-urlencoded，必须显式置空。
      'Content-Type': null,
      Accept: '*/*',
      Origin: 'https://huodong.taobao.com',
      Referer: 'https://huodong.taobao.com/',
      'Sec-Fetch-Site': 'cross-site',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Dest': 'empty',
    },
    responseType: 'text',
    timeout: 120000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    ...getAgentConfig(proxy),
  });
  if (response.status < 200 || response.status >= 300) {
    const detail = getOssErrorDetail(response.data);
    throw new Error(`视频分片上传失败，HTTP 状态码：${response.status}${detail ? `，${detail}` : ''}`);
  }

  const localMd5 = crypto.createHash('md5').update(data).digest('hex').toUpperCase();
  const expectedMd5 = crypto.createHash('md5').update(data).digest('base64');
  const responseMd5 = getResponseHeader(response.headers, 'content-md5').replace(/^"|"$/g, '');
  if (responseMd5 && responseMd5 !== expectedMd5) {
    throw new Error('视频分片 MD5 校验失败');
  }
  const etag = getResponseHeader(response.headers, 'etag').replace(/^"|"$/g, '');

  // 部分光合 OSS 分片地址返回 2xx，但不会向 Node 暴露 ETag。
  // 合片接口需要的是每个分片的 MD5，因此使用本地计算值兜底。
  return (etag || localMd5).toUpperCase();
};

const delay = (milliseconds: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, milliseconds));

const uploadVideo = async (
  cookieState: MtopCookieState,
  task: BaseSinglePublishTaskVideo,
  strategy: VideoUploadStrategy,
  options: TaoBaoGuangHePublishOptions,
): Promise<UploadedVideoInfo> => {
  const filePath = task.video.localPath;
  const fileStat = await fs.promises.stat(filePath);
  const chunkSize = Math.max(1, Math.floor(strategy.sliceSize * 1024 * 1024));
  const totalParts = Math.ceil(fileStat.size / chunkSize);
  if (strategy.uploadUrlList.length < totalParts) {
    throw new Error(`光合视频分片地址不足，需要 ${totalParts} 个`);
  }
  const uploadTargets = strategy.uploadUrlList.slice(0, totalParts).map((item, index) => {
    const target = getUploadUrl(item);
    const partNumber = target.partNumber || index + 1;
    if (!Number.isSafeInteger(partNumber) || partNumber < 1 || partNumber > totalParts) {
      throw new Error(`光合视频分片序号无效：${partNumber}`);
    }
    return { ...target, partNumber };
  });
  const partNumbers = new Set(uploadTargets.map((target) => target.partNumber));
  if (partNumbers.size !== totalParts) {
    throw new Error('光合视频分片地址不完整或存在重复序号');
  }
  const fileHandle = await fs.promises.open(filePath, 'r');
  const uploadedParts: Array<{ partNumber: number; md5: string }> = [];
  const uploadStartedAt = Date.now();
  try {
    for (const uploadTarget of uploadTargets) {
      task.cancelToken?.throwIfCancelled(privateKey);
      const offset = (uploadTarget.partNumber - 1) * chunkSize;
      const length = Math.min(chunkSize, fileStat.size - offset);
      const buffer = Buffer.alloc(length);
      const readResult = await fileHandle.read(buffer, 0, length, offset);
      const body = readResult.bytesRead === length ? buffer : buffer.subarray(0, readResult.bytesRead);
      let etag = '';
      let lastError: unknown;
      for (let attempt = 0; attempt < strategy.sliceRetryCount; attempt += 1) {
        try {
          etag = await uploadPart(uploadTarget.url, body, options.proxy);
          break;
        } catch (error) {
          lastError = error;
          if (attempt + 1 < strategy.sliceRetryCount) {
            await delay(500 * (attempt + 1));
          }
        }
      }
      if (!etag) {
        throw lastError instanceof Error ? lastError : new Error('视频分片上传失败');
      }
      uploadedParts.push({
        partNumber: uploadTarget.partNumber,
        md5: etag,
      });
      options.onProgress?.(uploadedParts.length, totalParts, `视频分片上传中（${uploadedParts.length}/${totalParts}）`);
    }
  } finally {
    await fileHandle.close();
  }

  task.cancelToken?.throwIfCancelled(privateKey);
  uploadedParts.sort((left, right) => left.partNumber - right.partNumber);
  if (uploadedParts.length === 0) {
    throw new Error('光合视频分片上传结果为空，无法合片');
  }
  const elapsedSeconds = Math.max(0.001, (Date.now() - uploadStartedAt) / 1000);
  const netSpeed = fileStat.size / 1024 / elapsedSeconds;
  const bizConfig = await getUploadBizConfig(options.proxy);
  const completeApi = bizConfig.apiInfo?.complete ?? 'mtop.video.upload.complete.taobao';
  // 光合官方页面传的是 JSON 字符串数组，而不是对象数组：
  // ["{\"partNumber\":1,\"md5\":\"...\"}"]
  const partList = JSON.stringify(uploadedParts.map((part) => JSON.stringify(part)));
  const completeData = {
    bizCode: TAOBAO_GUANGHE_VIDEO_BIZ_CODE,
    uploadId: strategy.uploadId,
    partList,
    netSpeed,
    sdkVersion: TAOBAO_GUANGHE_SDK_VERSION,
  };
  const completeResponse = await requestMtop(cookieState, completeApi, completeData, {
    method: 'POST',
    proxy: options.proxy,
  });
  const model = getModel(completeResponse.envelope);
  const fileId = model.fileId ?? model.videoFileId;
  if (!fileId) {
    throw new Error('光合视频合片未返回 fileId');
  }
  return {
    fileId: String(fileId),
    ossUrl: model.ossUrl == null ? undefined : String(model.ossUrl),
    uploadId: model.uploadId == null ? undefined : String(model.uploadId),
  };
};

const toTopic = (topic: ListItemInfo): JsonRecord | undefined => {
  const raw = isRecord(topic.raw) ? topic.raw : {};
  const rawTopicId = raw.topicId ?? raw.id;
  const topicId =
    rawTopicId ?? (topic.yixiaoerId && topic.yixiaoerId !== topic.yixiaoerName ? topic.yixiaoerId : undefined);
  if (!topicId) {
    return undefined;
  }
  return {
    topicId: String(topicId),
    ...(raw.source === undefined ? {} : { source: raw.source }),
  };
};

const toTaoBaoGuangHePublishItem = (value: unknown): JsonRecord | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const raw = isRecord(value.raw) ? value.raw : undefined;
  const rawItemId = raw?.itemId ?? raw?.itemID ?? raw?.id;
  const itemId = rawItemId ?? value.itemId ?? value.itemID ?? value.id ?? value.yixiaoerId;
  if (itemId === undefined || itemId === null || String(itemId).trim() === '') {
    return undefined;
  }

  if (raw && Object.keys(raw).length > 0) {
    return raw.itemId === undefined || raw.itemId === null ? { ...raw, itemId } : raw;
  }

  // 允许调用方直接传入 listItems 返回的官方对象，避免在没有 raw 包装时丢失校验字段。
  if (
    value.yixiaoerId === undefined &&
    value.yixiaoerName === undefined &&
    (value.itemId !== undefined || value.itemID !== undefined)
  ) {
    return value;
  }

  const item: JsonRecord = {
    source: 'coreitem',
    itemId,
  };
  const fields: Array<[string, unknown]> = [
    ['title', value.title ?? value.yixiaoerName],
    ['picUrl', value.picUrl ?? value.yixiaoerImageUrl],
    ['itemUrl', value.itemUrl],
    ['price', value.price],
    ['shopTitle', value.shopTitle ?? value.yixiaoerDesc],
  ];
  fields.forEach(([key, fieldValue]) => {
    if (fieldValue !== undefined && fieldValue !== null && String(fieldValue) !== '') {
      item[key] = fieldValue;
    }
  });
  return item;
};

/**
 * 将统一商品选项转换成淘宝光合发布接口 `items` 所需的原始商品对象。
 * 商品列表接口返回的 `raw` 会优先原样提交，避免丢失官方校验字段。
 */
export const buildTaoBaoGuangHeGoodsItems = (shoppingCart: unknown): JsonRecord[] => {
  const values = Array.isArray(shoppingCart) ? shoppingCart : shoppingCart == null ? [] : [shoppingCart];
  if (values.length > TAOBAO_GUANGHE_ITEM_MAX) {
    throw new Error(`淘宝光合最多关联${TAOBAO_GUANGHE_ITEM_MAX}个商品`);
  }
  return values.map(toTaoBaoGuangHePublishItem).filter((item): item is JsonRecord => !!item);
};

const getTaoBaoGuangHePublishItems = (task: JsonRecord): JsonRecord[] => {
  if (task.shopping_cart !== undefined && task.shopping_cart !== null) {
    return buildTaoBaoGuangHeGoodsItems(task.shopping_cart);
  }
  return Array.isArray(task.contentList) ? task.contentList.filter(isRecord) : [];
};

const getAccountId = async (cookie: string, task: BaseSinglePublishTask): Promise<string> => {
  const configuredId = task.platformAccount.platformAuthorId;
  if (configuredId) {
    return String(configuredId);
  }
  const userInfo = await getTaoBaoGuangHeUserInfo(cookie, task.proxy);
  const accountData = isRecord(userInfo.data) ? userInfo.data : {};
  const accountId = accountData.id ?? accountData.userId ?? accountData.uid ?? task.platformAccount.platformAccountId;
  if (!accountId) {
    throw new Error('光合账号缺少官方账号 ID');
  }
  return String(accountId);
};

const getPublishId = (envelope: JsonRecord): string | undefined => {
  const data = unwrapMtopData(envelope);
  const candidates = [data.result, data.publishId, data.contentId, data.id, data.model?.result, data.model?.contentId];
  const result = candidates.find((value) => value !== undefined && value !== null && String(value).length > 0);
  return result == null ? undefined : String(result);
};

type TaoBaoGuangHeContentItem = JsonRecord & {
  auditInfo?: JsonRecord;
  baseInfo?: JsonRecord;
};

const toTaoBaoGuangHeTimestamp = (value: unknown): number | undefined => {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return undefined;
  }
  return timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
};

const getTaoBaoGuangHeContentBaseInfo = (item: TaoBaoGuangHeContentItem): JsonRecord => {
  return isRecord(item.baseInfo) ? item.baseInfo : item;
};

const getTaoBaoGuangHeContentId = (item: TaoBaoGuangHeContentItem): string | undefined => {
  const baseInfo = getTaoBaoGuangHeContentBaseInfo(item);
  const id = baseInfo.id ?? item.id;
  return id === undefined || id === null || String(id).trim() === '' ? undefined : String(id);
};

const getTaoBaoGuangHeRefuseMessage = (item: TaoBaoGuangHeContentItem): string | undefined => {
  const auditInfo = isRecord(item.auditInfo) ? item.auditInfo : {};
  const descriptions = Array.isArray(auditInfo.refuseDescriptions) ? auditInfo.refuseDescriptions : [];
  const reason = descriptions
    .map((description) => (isRecord(description) ? description.reason : undefined))
    .find((value) => typeof value === 'string' && value.trim());
  return typeof reason === 'string' ? reason : undefined;
};

export const buildTaoBaoGuangHeContentListRequest = (pageNo: number = 1, pageSize: number = 20): JsonRecord => ({
  condition: JSON.stringify({ showContentDiagnosis: true }),
  source: 'guanghe',
  mode: 0,
  scene: 'workList',
  agentType: '',
  pageSize,
  pageNo,
  channelLocation: 'creator_contentmanagement',
  promoteSourceUrl: TAOBAO_GUANGHE_WORKSPACE_REFERER,
  version: 2,
});

export const mapTaoBaoGuangHeAuditStatus = (
  item: TaoBaoGuangHeContentItem,
  now: number = Date.now(),
): auditStatusEnum => {
  const auditInfo = isRecord(item.auditInfo) ? item.auditInfo : {};
  const baseInfo = getTaoBaoGuangHeContentBaseInfo(item);
  const auditStatus = Number(auditInfo.status);
  const online = baseInfo.online === true || baseInfo.online === 'true';
  const onlineTime = toTaoBaoGuangHeTimestamp(baseInfo.onlineTime ?? baseInfo.releaseTime);

  if (auditStatus === -1 || auditStatus === -2) {
    return auditStatusEnum.deny;
  }
  // status=0 时即使 online=true，也仍处于“公域审核中”。
  if (auditStatus === 0) return auditStatusEnum.inAudit;
  if (auditStatus === 1 && online) return auditStatusEnum.published;
  if (onlineTime !== undefined && onlineTime > now) {
    return auditStatusEnum.prePublish;
  }
  return auditStatusEnum.inAudit;
};

export const getTaoBaoGuangHeMediaStatus = async (
  cookie: string,
  publishId: string,
  maxPages: number = 10,
): Promise<AuditResult> => {
  const result: AuditResult = { code: errorCode.ok, msg: '', publishId };
  try {
    const pageLimit = Math.max(1, Math.trunc(maxPages));
    const cookieState: MtopCookieState = { value: cookie };
    for (let pageNo = 1; pageNo <= pageLimit; pageNo += 1) {
      const response = await requestMtop(
        cookieState,
        TAOBAO_GUANGHE_CONTENT_LIST_API,
        buildTaoBaoGuangHeContentListRequest(pageNo),
        {
          referer: TAOBAO_GUANGHE_WORKSPACE_REFERER,
          query: { type: 'originaljsonp', dataType: 'originaljsonp', callback: 'mtopjsonp31' },
        },
      );
      const model = getModel(response.envelope);
      const items = Array.isArray(model.data) ? model.data.filter(isRecord) : [];
      const item = items.find(
        (candidate) => getTaoBaoGuangHeContentId(candidate as TaoBaoGuangHeContentItem) === String(publishId),
      ) as TaoBaoGuangHeContentItem | undefined;

      if (item) {
        const baseInfo = getTaoBaoGuangHeContentBaseInfo(item);
        const auditStatus = mapTaoBaoGuangHeAuditStatus(item);
        const cover = isRecord(baseInfo.cover) ? baseInfo.cover.url : undefined;
        const pictures = Array.isArray(baseInfo.pictures) ? baseInfo.pictures : [];
        const firstPicture = isRecord(pictures[0]) ? pictures[0].url : undefined;
        const openUrl = [baseInfo.rawDetailUrl, baseInfo.detailUrl, baseInfo.detailQrCodeUrl].find(
          (value) => typeof value === 'string' && value.trim(),
        );
        result.docId = getTaoBaoGuangHeContentId(item);
        result.auditStatus = auditStatus;
        result.coverUrl =
          typeof cover === 'string' ? cover : typeof firstPicture === 'string' ? firstPicture : undefined;
        result.create_time = toTaoBaoGuangHeTimestamp(baseInfo.createTime ?? baseInfo.publishTime);
        result.openUrl = typeof openUrl === 'string' ? openUrl : undefined;
        result.data = item;
        result.msg =
          auditStatus === auditStatusEnum.deny
            ? getTaoBaoGuangHeRefuseMessage(item) ?? '淘宝光合审核不通过'
            : auditStatus === auditStatusEnum.prePublish
            ? '定时发布中'
            : auditStatus === auditStatusEnum.published
            ? '发布成功'
            : '审核中';
        return result;
      }

      const hasNext = model.hasNext === true || model.hasNext === 'true';
      if (!hasNext) {
        break;
      }
    }
    return { ...result, msg: '未找到作品' };
  } catch (error) {
    const message = sanitizeErrorMessage(error);
    return {
      ...result,
      code: getErrorCodeFromMessage(message) ?? errorCode.data_error,
      msg: message || '查询作品状态失败',
    };
  }
};

const buildPublishRequest = (
  task: TaoBaoGuangHeVideoPublishTask,
  config: PublishConfig,
  accountId: string,
  video: UploadedVideoInfo,
  cover: CoverUploadResult,
): JsonRecord => {
  const requestId = GuidLike();
  // 光合页面的顶部输入框是 30 字以内的标题，下面的大文本框才是视频描述。
  const descriptionSource = task.desc?.trim() || '';
  const description = buildGuangHeDescription(descriptionSource, [
    ...(task.tags ?? []).map((tag) => String(tag ?? '')),
    ...(task.topics ?? []).map((topic) => String(topic.yixiaoerName ?? '')),
  ]);
  const shortTitleSource = task.short_title?.trim() || task.title?.trim() || '';
  const shortTitle = Array.from(shortTitleSource).slice(0, 30).join('');
  const topics = (task.topics ?? []).map(toTopic).filter((item): item is JsonRecord => !!item);
  // 光合富文本会把话题作为描述末尾的内联节点序列化，而不是把 #话题直接拼进文本。
  const statementType = normalizeStatementType(task.statement?.type);
  const forwardFrom = task.statement?.forwardFrom?.trim() || task.contentSourceUrl?.trim();
  const publishExtra: JsonRecord = {
    ...config.publishExtra,
    umi_pub_session: config.sessionId,
    dataSession: config.dataSession,
    text_type: String(statementType),
  };
  const taskRecord = task as JsonRecord;
  const scheduleValue = task.prePubTime ?? taskRecord.onlineTime ?? taskRecord.online_time;
  const scheduleTimestamp = Number(scheduleValue);
  const onlineTime =
    Number.isFinite(scheduleTimestamp) && scheduleTimestamp > 0
      ? Math.trunc(scheduleTimestamp < 1_000_000_000_000 ? scheduleTimestamp * 1000 : scheduleTimestamp)
      : undefined;
  if (onlineTime !== undefined) {
    // 官方页面会同时提交这两个字段，缺少 publishExtra.online_time 时定时任务会按立即发布处理。
    publishExtra.online_time = onlineTime;
  }
  const contentSource: JsonRecord = { fromType: statementType };
  if (statementType === 4) {
    contentSource.forwardFrom = forwardFrom || null;
  }
  const request: JsonRecord = {
    id: '',
    bizCode: config.bizCode,
    requestId,
    shortTitle: encodeURIComponent(shortTitle),
    title: encodeURIComponent(description.title),
    contentType: 'video',
    ugcScene: 'pc_newcreator_video',
    shareResult: '',
    topics,
    items: getTaoBaoGuangHePublishItems(taskRecord),
    video: {
      fileId: video.fileId,
      interactiveId: '',
      statInfo: { audio: [] },
    },
    coverUser: [
      {
        url: cover.url,
        width: Number(cover.width ?? task.covers?.[0]?.width ?? 0),
        height: Number(cover.height ?? task.covers?.[0]?.height ?? 0),
        statInfo: {
          source: null,
          cover_text: null,
          cover_text_content: null,
        },
      },
    ],
    downloadEnable: task.allow_download === true ? '1' : '0',
    customModuleFrontData: {},
    pois: [],
    shops: [],
    collections: [],
    titleRaw: encodeURIComponent(description.titleRaw),
    publishExtra,
    contentSource,
    publishToken: crypto.createHash('md5').update(`${accountId}2088666${requestId}`).digest('hex'),
  };
  if (config.abParams !== undefined) {
    request.abParams = config.abParams;
  }
  if (config.publishSession) {
    request.publishSession = config.publishSession;
  }
  if (onlineTime !== undefined) {
    request.onlineTime = onlineTime;
  }
  if (description.titleElements.length) {
    request.titleElements = description.titleElements;
  }
  return request;
};

export const buildTaoBaoGuangHePublishRequest = buildPublishRequest;

const buildImageTextPublishRequest = (
  task: TaoBaoGuangHeImageTextPublishTask,
  config: PublishConfig,
  accountId: string,
  pictures: UploadedPictureInfo[],
): JsonRecord => {
  const requestId = config.sessionId;
  const descriptionSource = task.desc?.trim() || '';
  const description = buildGuangHeDescription(descriptionSource, [
    ...(task.tags ?? []).map((tag) => String(tag ?? '')),
    ...(task.topics ?? []).map((topic) => String(topic.yixiaoerName ?? '')),
  ]);
  const shortTitleSource = task.short_title?.trim() || task.title?.trim() || '';
  const shortTitle = Array.from(shortTitleSource).slice(0, 30).join('');
  const topics = (task.topics ?? []).map(toTopic).filter((item): item is JsonRecord => !!item);
  const statementType = normalizeStatementType(task.statement?.type);
  const forwardFrom = task.statement?.forwardFrom?.trim() || task.contentSourceUrl?.trim();
  const publishExtra: JsonRecord = {
    ...config.publishExtra,
    media_type: 'photo',
    umi_pub_session: config.sessionId,
    dataSession: config.dataSession,
    text_type: String(statementType),
  };
  const taskRecord = task as JsonRecord;
  const scheduleValue = task.prePubTime ?? taskRecord.onlineTime ?? taskRecord.online_time;
  const scheduleTimestamp = Number(scheduleValue);
  const onlineTime =
    Number.isFinite(scheduleTimestamp) && scheduleTimestamp > 0
      ? Math.trunc(scheduleTimestamp < 1_000_000_000_000 ? scheduleTimestamp * 1000 : scheduleTimestamp)
      : undefined;
  if (onlineTime !== undefined) {
    publishExtra.online_time = onlineTime;
  }
  const contentSource: JsonRecord = { fromType: statementType };
  if (statementType === 4) {
    contentSource.forwardFrom = forwardFrom || null;
  }
  const request: JsonRecord = {
    id: '',
    bizCode: config.bizCode || TAOBAO_GUANGHE_IMAGE_TEXT_BIZ_CODE,
    requestId,
    title: encodeURIComponent(description.title),
    shortTitle: encodeURIComponent(shortTitle),
    contentType: 'article',
    ugcScene: 'pc_newcreator_pic',
    shareResult: '',
    topics,
    items: getTaoBaoGuangHePublishItems(taskRecord),
    pics: pictures.map((picture) => ({
      id: picture.id,
      width: Number(picture.width ?? 0),
      height: Number(picture.height ?? 0),
      url: picture.url,
      fileId: picture.fileId,
    })),
    // 图文页面没有“允许下载”选项，按官方请求固定提交默认值 0。
    downloadEnable: '0',
    customModuleFrontData: {},
    abParams: config.abParams ?? [],
    pois: [],
    shops: [],
    titleRaw: encodeURIComponent(description.titleRaw),
    titleElements: description.titleElements,
    publishExtra,
    contentSource,
    publishSession: config.publishSession,
    publishToken: crypto.createHash('md5').update(`${accountId}2088666${requestId}`).digest('hex'),
  };
  if (!config.publishSession) {
    delete request.publishSession;
  }
  if (onlineTime !== undefined) {
    request.onlineTime = onlineTime;
  }
  return request;
};

export const buildTaoBaoGuangHeImageTextPublishRequest = buildImageTextPublishRequest;

const GuidLike = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = (Math.random() * 16) | 0;
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

export const publishTaoBaoGuangHeVideo = async (
  cookie: string,
  task: TaoBaoGuangHeVideoPublishTask,
  options: TaoBaoGuangHePublishOptions = {},
): Promise<TaoBaoGuangHeVideoPublishResult> => {
  let phase: 'upload' | 'push' = 'upload';
  const cookieState: MtopCookieState = { value: cookie };
  try {
    task.cancelToken?.throwIfCancelled(privateKey);
    if (!task.video?.localPath || !fs.existsSync(task.video.localPath)) {
      throw new TaoBaoGuangHePublishError('视频文件不存在', 'upload', 172002);
    }
    const cover = task.covers?.[0] ?? task.verticalCover ?? task.verticalCovers?.[0] ?? task.horizontalCover;
    if (!cover?.pathOrUrl) {
      throw new TaoBaoGuangHePublishError('视频封面不能为空', 'upload', 2);
    }
    options.onStage?.('upload', '正在获取光合发布配置');
    const config = await getPublishConfig(cookieState, options.proxy);
    task.cancelToken?.throwIfCancelled(privateKey);

    options.onStage?.('upload', '正在获取视频上传参数');
    const fileStat = await fs.promises.stat(task.video.localPath);
    task.video.size = fileStat.size;
    const strategy = await getUploadStrategy(cookieState, task.video.localPath, fileStat.size, options.proxy);
    task.cancelToken?.throwIfCancelled(privateKey);

    const uploadedVideo = await uploadVideo(cookieState, task, strategy, options);
    task.cancelToken?.throwIfCancelled(privateKey);
    const uploadedCover = await uploadCover(cookieState.value, cover, options.proxy);
    task.cancelToken?.throwIfCancelled(privateKey);

    options.onProgress?.(1, 1, '视频和封面上传完成');
    phase = 'push';
    options.onStage?.('push', '正在推送光合视频');
    const accountId = await getAccountId(cookieState.value, task);
    const request = buildPublishRequest(task, config, accountId, uploadedVideo, uploadedCover);
    const publishApi = String(config.pageConfig?.publishMtop ?? TAOBAO_GUANGHE_PUBLISH_API);
    const publishResponse = await requestMtop(
      cookieState,
      publishApi,
      { request: JSON.stringify(request) },
      {
        method: 'POST',
        timeout: 120000,
        proxy: options.proxy,
        referer: 'https://huodong.taobao.com/',
        query: { timeout: 120000 },
      },
    );
    const publishId = getPublishId(publishResponse.envelope);
    if (!publishId) {
      throw new Error('光合视频发布未返回作品 ID');
    }
    return {
      publishId,
      fileId: uploadedVideo.fileId,
      coverUrl: uploadedCover.url,
      raw: publishResponse.envelope,
    };
  } catch (error) {
    if (error instanceof TaoBaoGuangHePublishError) {
      throw error;
    }
    const message = sanitizeErrorMessage(error);
    throw new TaoBaoGuangHePublishError(message || '光合视频发布失败', phase, getErrorCodeFromMessage(message));
  }
};

export const publishTaoBaoGuangHeImageText = async (
  cookie: string,
  task: TaoBaoGuangHeImageTextPublishTask,
  options: TaoBaoGuangHePublishOptions = {},
): Promise<TaoBaoGuangHeImageTextPublishResult> => {
  let phase: 'upload' | 'push' = 'upload';
  const cookieState: MtopCookieState = { value: cookie };
  try {
    task.cancelToken?.throwIfCancelled(privateKey);
    if (!Array.isArray(task.images) || task.images.length === 0) {
      throw new TaoBaoGuangHePublishError('光合图文至少需要一张图片', 'upload', 2);
    }
    if (!task.title?.trim() && !task.desc?.trim()) {
      throw new TaoBaoGuangHePublishError('光合图文标题和描述至少填写一个', 'upload', 2);
    }

    options.onStage?.('upload', '正在获取光合图文发布配置');
    const config = await getPublishConfig(cookieState, options.proxy, undefined, {
      contentType: 'article',
      ugcScene: 'pc_newcreator_pic',
      bizCode: TAOBAO_GUANGHE_IMAGE_TEXT_BIZ_CODE,
      mediaType: 'photo',
    });
    task.cancelToken?.throwIfCancelled(privateKey);

    const pictures: UploadedPictureInfo[] = [];
    for (let index = 0; index < task.images.length; index += 1) {
      task.cancelToken?.throwIfCancelled(privateKey);
      options.onStage?.('upload', `正在上传光合图文图片（${index + 1}/${task.images.length}）`);
      pictures.push(await uploadImage(cookieState.value, task.images[index], options.proxy));
      options.onProgress?.(index + 1, task.images.length, `图文图片上传进度 ${index + 1}/${task.images.length}`);
    }
    task.cancelToken?.throwIfCancelled(privateKey);

    phase = 'push';
    options.onStage?.('push', '正在推送光合图文');
    const accountId = await getAccountId(cookieState.value, task);
    const request = buildImageTextPublishRequest(task, config, accountId, pictures);
    const publishApi = String(config.pageConfig?.publishMtop ?? TAOBAO_GUANGHE_PUBLISH_API);
    const publishResponse = await requestMtop(
      cookieState,
      publishApi,
      { request: JSON.stringify(request) },
      {
        method: 'POST',
        timeout: 120000,
        proxy: options.proxy,
        referer: 'https://huodong.taobao.com/',
        query: { timeout: 120000 },
      },
    );
    const publishId = getPublishId(publishResponse.envelope);
    if (!publishId) {
      throw new Error('光合图文发布未返回作品 ID');
    }
    return {
      publishId,
      pictureIds: pictures.map((picture) => picture.fileId),
      raw: publishResponse.envelope,
    };
  } catch (error) {
    if (error instanceof TaoBaoGuangHePublishError) {
      throw error;
    }
    const message = sanitizeErrorMessage(error);
    throw new TaoBaoGuangHePublishError(message || '光合图文发布失败', phase, getErrorCodeFromMessage(message));
  }
};

export const buildTaoBaoGuangHeDeleteRequest = (docId: unknown): JsonRecord => {
  const value = isRecord(docId) ? docId.docId : docId;
  const normalizedDocId = String(value ?? '').trim();
  const id = Number(normalizedDocId);
  if (!/^\d+$/.test(normalizedDocId) || !Number.isSafeInteger(id) || id <= 0) {
    throw new Error('作品 ID 格式错误');
  }
  return { id, source: 'guanghe', mode: 0, agentType: '' };
};

export const deleteTaoBaoGuangHeContent = async (cookie: string, docId: unknown): Promise<BaseResult> => {
  try {
    const response = await requestMtop(
      { value: cookie },
      TAOBAO_GUANGHE_DELETE_API,
      buildTaoBaoGuangHeDeleteRequest(docId),
      {
        referer: 'https://creator.guanghe.taobao.com/page/workspace/tb',
        query: { type: 'originaljsonp', dataType: 'originaljsonp', callback: 'mtopjsonp32' },
      },
    );
    const deleted = response.data.model === true && response.data.fail !== true;
    return {
      code: deleted ? errorCode.ok : errorCode.data_error,
      msg: deleted ? '删除成功' : '删除失败',
      data: response.envelope,
    };
  } catch (error) {
    const message = sanitizeErrorMessage(error);
    return {
      code: getErrorCodeFromMessage(message) ?? errorCode.data_error,
      msg: message || '删除失败',
    };
  }
};

export const TaoBaoGuangHeVideo = {
  publish: publishTaoBaoGuangHeVideo,
};

export const TaoBaoGuangHeImageText = {
  publish: publishTaoBaoGuangHeImageText,
};
