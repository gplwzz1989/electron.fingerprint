import { AxiosError, AxiosResponse } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { $http, HttpConfig } from '../../http';
import { errorCode } from '../errorCode';
import { PublicAuthorPlatformCode } from '../baseModel';
import type {
  PlatformPublicAuthorInfo,
  PlatformPublicWorkInfo,
  PlatformPublicWorkListOutput,
  PlatformPublicWorkSearchContentType,
} from '../baseModel';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../webproxy';
import { BilibiliPublicAuthorSearchDefaultCookie } from './bilibili-user.service';

export type BilibiliPublicWorkSearchContentType = PlatformPublicWorkSearchContentType;

export let BilibiliPublicWorkSearchDefaultCookie = BilibiliPublicAuthorSearchDefaultCookie;

const BilibiliPublicWorkSearchUserAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';
const BilibiliPublicWorkSearchSecChUa = '"Not;A=Brand";v="8", "Chromium";v="150", "Google Chrome";v="150"';
const BilibiliPublicWorkSearchAcceptLanguage = 'zh-CN,zh;q=0.9';
const BilibiliPublicWorkSearchPageSize = 30;

const appendBilibiliPublicWorkSearchCookie = (cookie: string, name: string, value: string): string => {
  if (!name) {
    return cookie;
  }
  const cookieList = cookie
    .split(';')
    .map((item) => item.trim())
    .filter((item) => item && !item.startsWith(`${name}=`));
  cookieList.push(`${name}=${value}`);
  return `${cookieList.join('; ')};`;
};

const mergeBilibiliPublicWorkSearchResponseCookie = (cookie: string, setCookie: unknown): string => {
  const responseCookieList = Array.isArray(setCookie) ? setCookie : typeof setCookie === 'string' ? [setCookie] : [];
  return responseCookieList.reduce((currentCookie, responseCookie) => {
    const cookiePair = responseCookie.split(';')[0]?.trim();
    const equalIndex = cookiePair.indexOf('=');
    if (equalIndex <= 0) {
      return currentCookie;
    }
    return appendBilibiliPublicWorkSearchCookie(
      currentCookie,
      cookiePair.slice(0, equalIndex).trim(),
      cookiePair.slice(equalIndex + 1).trim(),
    );
  }, cookie);
};

const syncBilibiliPublicWorkSearchResponseCookie = (requestCookie: string, setCookie: unknown): string => {
  const nextDefaultCookie = mergeBilibiliPublicWorkSearchResponseCookie(
    BilibiliPublicWorkSearchDefaultCookie,
    setCookie,
  );
  BilibiliPublicWorkSearchDefaultCookie = nextDefaultCookie;
  return mergeBilibiliPublicWorkSearchResponseCookie(requestCookie, setCookie);
};

const toStringValue = (value: unknown): string => {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value);
};

const formatBilibiliPublicWorkUrl = (url: unknown): string => {
  const text = toStringValue(url);
  if (!text) {
    return '';
  }
  if (text.startsWith('//')) {
    return `https:${text}`;
  }
  if (text.startsWith('http://')) {
    return text.replace(/^http:\/\//, 'https://');
  }
  return text;
};

const decodeBilibiliPublicWorkText = (value: unknown): string => {
  return toStringValue(value)
    .replace(/<[^>]*>/g, '')
    .replace(/&#x([0-9a-fA-F]+);/g, (_match, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
};

const parseBilibiliPublicWorkCount = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  const text = toStringValue(value).replace(/,/g, '').trim();
  const match = text.match(/([\d.]+)\s*([万亿]?)/);
  if (!match) {
    return 0;
  }
  const numberValue = Number(match[1]);
  if (!Number.isFinite(numberValue)) {
    return 0;
  }
  if (match[2] === '亿') {
    return Math.round(numberValue * 100000000);
  }
  if (match[2] === '万') {
    return Math.round(numberValue * 10000);
  }
  return Math.round(numberValue);
};

const parseBilibiliPublicWorkDurationMs = (duration: unknown): number => {
  const text = toStringValue(duration).trim();
  if (!text) {
    return 0;
  }
  const parts = text.split(':').map((item) => Number(item));
  if (!parts.length || parts.some((item) => !Number.isFinite(item))) {
    return 0;
  }
  return parts.reduce((total, item) => total * 60 + item, 0) * 1000;
};

const getBilibiliPublicWorkTags = (tag: unknown): Array<string> => {
  return toStringValue(tag)
    .split(',')
    .map((item) => decodeBilibiliPublicWorkText(item))
    .filter(Boolean);
};

const parseBilibiliPublicWorkAuthor = (item: BilibiliPublicWorkSearchItem): PlatformPublicAuthorInfo => {
  const extAuthorId = toStringValue(item.mid);
  return {
    platform_code: PublicAuthorPlatformCode.BiLiBiLi,
    ext_author_id: extAuthorId,
    nickname: decodeBilibiliPublicWorkText(item.author),
    avatar_url: formatBilibiliPublicWorkUrl(item.upic),
    description: '',
    aut_index: extAuthorId ? `https://space.bilibili.com/${extAuthorId}` : '',
    aut_spi_url: extAuthorId ? `mid=${extAuthorId}` : '',
    follower_count: 0,
    total_views: 0,
    total_comments: 0,
    total_likes: 0,
    work_count: 0,
  };
};

const parseBilibiliPublicWorkSearchItem = (
  item: BilibiliPublicWorkSearchItem,
  contentType: BilibiliPublicWorkSearchContentType,
): PlatformPublicWorkInfo | undefined => {
  if (item?.type && item.type !== 'video') {
    return undefined;
  }
  const docid = toStringValue(item.bvid || item.aid || item.id).trim();
  if (!docid) {
    return undefined;
  }
  const author = parseBilibiliPublicWorkAuthor(item);
  const title = decodeBilibiliPublicWorkText(item.title);
  return {
    platform_code: PublicAuthorPlatformCode.BiLiBiLi,
    docid,
    title,
    url: item.bvid ? `https://www.bilibili.com/video/${item.bvid}` : formatBilibiliPublicWorkUrl(item.arcurl),
    cover_url: formatBilibiliPublicWorkUrl(item.pic),
    content_type: contentType,
    category: decodeBilibiliPublicWorkText(item.typename) || '其他',
    ext_category_id: toStringValue(item.typeid),
    ext_author_id: author.ext_author_id,
    author,
    published_at: toStringValue(item.pubdate || item.senddate || Math.floor(Date.now() / 1000)),
    tags: getBilibiliPublicWorkTags(item.tag),
    metrics: {
      view: parseBilibiliPublicWorkCount(item.play),
      like: parseBilibiliPublicWorkCount(item.like),
      comment: parseBilibiliPublicWorkCount(item.review),
      share: 0,
    },
    video_info: {
      duration_ms: parseBilibiliPublicWorkDurationMs(item.duration),
      download_url: '',
    },
    raw: {},
  };
};

export const parseBilibiliPublicWorkSearchResponse = (
  response: BilibiliPublicWorkSearchResponse,
  contentType: BilibiliPublicWorkSearchContentType = 'video',
): Array<PlatformPublicWorkInfo> => {
  const exists = new Set<string>();
  const dataList: Array<PlatformPublicWorkInfo> = [];
  if (!response?.data?.result?.length) {
    return dataList;
  }
  for (const item of response.data.result) {
    const work = parseBilibiliPublicWorkSearchItem(item, contentType);
    if (!work || exists.has(work.docid)) {
      continue;
    }
    exists.add(work.docid);
    dataList.push(work);
  }
  return dataList;
};

export const getBilibiliPublicWorkSearchResponse = async (
  cookie: string | undefined,
  keyWord: string,
  pageNum: number = 1,
  proxyAgent: HttpsProxyAgent<string> | object | undefined = undefined,
): Promise<BilibiliPublicWorkSearchResponse> => {
  const requestCookie = cookie?.trim() ? cookie : BilibiliPublicWorkSearchDefaultCookie;
  const params = new URLSearchParams({
    search_type: 'video',
    keyword: keyWord ?? '',
    page: pageNum.toString(),
    page_size: BilibiliPublicWorkSearchPageSize.toString(),
  });
  const result = await $http.get<unknown, AxiosResponse<BilibiliPublicWorkSearchResponse>>(
    `https://api.bilibili.com/x/web-interface/wbi/search/type?${params.toString()}`,
    {
      headers: {
        cookie: requestCookie,
        Host: 'api.bilibili.com',
        Origin: 'https://search.bilibili.com',
        Referer: `https://search.bilibili.com/video?keyword=${encodeURIComponent(keyWord ?? '')}`,
        'User-Agent': BilibiliPublicWorkSearchUserAgent,
        Accept: '*/*',
        'Accept-Language': BilibiliPublicWorkSearchAcceptLanguage,
        'sec-ch-ua': BilibiliPublicWorkSearchSecChUa,
        'sec-ch-ua-mobile': HttpConfig.sec_ch_ua_mobile,
        'sec-ch-ua-platform': HttpConfig.sec_ch_ua_platform,
        'Sec-Fetch-Site': 'same-site',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
      },
      httpAgent: proxyAgent,
      httpsAgent: proxyAgent,
    },
  );
  syncBilibiliPublicWorkSearchResponseCookie(requestCookie, result.headers['set-cookie']);
  return result.data;
};

export const searchBilibiliPublicWorkList = async (
  keyWord: string,
  cookie?: string | undefined,
  nextPage?: string,
  proxy?: KuaiDaiLiProxy,
  contentType: BilibiliPublicWorkSearchContentType = 'video',
): Promise<PlatformPublicWorkListOutput> => {
  const result: PlatformPublicWorkListOutput = {
    code: 0,
    msg: '',
    dataList: [],
  };
  if (!keyWord?.trim()) {
    result.code = errorCode.data_error;
    result.msg = '搜索关键词不能为空';
    return result;
  }
  if (contentType !== 'video') {
    result.code = errorCode.data_error;
    result.msg = 'B站作品搜索暂仅支持视频';
    return result;
  }
  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const pageNum = Number(nextPage ?? 1) || 1;
    const workSearchResponse = await getBilibiliPublicWorkSearchResponse(cookie, keyWord, pageNum, webProxy);
    result.code = workSearchResponse?.code ?? -1;
    result.msg = workSearchResponse?.message ?? '';
    result.dataList = parseBilibiliPublicWorkSearchResponse(workSearchResponse, contentType);
    if ((workSearchResponse?.data?.numPages ?? 0) > pageNum && result.dataList.length > 0) {
      result.nextPage = (pageNum + 1).toString();
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = '请求B站作品搜索失败';
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = '解析B站作品搜索结果失败';
    } else {
      result.msg = 'B站作品搜索失败';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};

export interface BilibiliPublicWorkSearchItem {
  type?: string;
  id?: number | string;
  aid?: number | string;
  bvid?: string;
  title?: string;
  description?: string;
  pic?: string;
  arcurl?: string;
  play?: number | string;
  video_review?: number | string;
  review?: number | string;
  favorites?: number | string;
  like?: number | string;
  tag?: string;
  pubdate?: number | string;
  senddate?: number | string;
  duration?: string;
  mid?: number | string;
  author?: string;
  upic?: string;
  typeid?: number | string;
  typename?: string;
}

export interface BilibiliPublicWorkSearchResponse {
  code: number;
  message: string;
  ttl?: number;
  data?: {
    page?: number;
    pagesize?: number;
    numResults?: number;
    numPages?: number;
    next?: number | boolean;
    result?: Array<BilibiliPublicWorkSearchItem>;
  };
}
