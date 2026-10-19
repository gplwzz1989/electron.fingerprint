import { AxiosError, AxiosResponse } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { $http } from '../../http';
import { errorCode } from '../errorCode';
import { PublicAuthorPlatformCode } from '../baseModel';
import type {
  PlatformPublicAuthorInfo,
  PlatformPublicWorkContentType,
  PlatformPublicWorkInfo,
  PlatformPublicWorkListOutput,
  PlatformPublicWorkSearchContentType,
} from '../baseModel';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../webproxy';

export type XinlangweiboPublicWorkSearchContentType = PlatformPublicWorkSearchContentType;

export let XinlangweiboPublicWorkSearchDefaultCookie = '';

const XinlangweiboPublicWorkSearchUserAgent =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
const XinlangweiboPublicWorkSearchSecChUa = '"Google Chrome";v="150", "Chromium";v="150", "Not)A;Brand";v="24"';
const XinlangweiboPublicWorkSearchAcceptLanguage = 'zh-CN,zh;q=0.9';
const XinlangweiboPublicWorkSearchType = '64';

interface XinlangweiboPublicWorkSearchParseResult {
  dataList: Array<PlatformPublicWorkInfo>;
  total: number;
  pageSize: number;
}

const appendXinlangweiboPublicWorkSearchCookie = (cookie: string, name: string, value: string): string => {
  if (!name) {
    return cookie;
  }
  const cookieItem = `${name}=${value}`;
  if (!cookie?.trim()) {
    return cookieItem;
  }
  const cookieList = cookie
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean);
  const cookieIndex = cookieList.findIndex((item) => item.startsWith(`${name}=`));
  if (cookieIndex >= 0) {
    cookieList[cookieIndex] = cookieItem;
  } else {
    cookieList.push(cookieItem);
  }
  return cookieList.join('; ');
};

const mergeXinlangweiboPublicWorkSearchResponseCookie = (cookie: string, setCookie: unknown): string => {
  const setCookieList = Array.isArray(setCookie) ? setCookie : typeof setCookie === 'string' ? [setCookie] : [];
  return setCookieList.reduce((newCookie, item) => {
    const cookieText = item?.toString().split(';')[0]?.trim();
    const splitIndex = cookieText?.indexOf('=') ?? -1;
    if (!cookieText || splitIndex <= 0) {
      return newCookie;
    }
    return appendXinlangweiboPublicWorkSearchCookie(
      newCookie,
      cookieText.substring(0, splitIndex),
      cookieText.substring(splitIndex + 1),
    );
  }, cookie);
};

const syncXinlangweiboPublicWorkSearchResponseCookie = (requestCookie: string, setCookie: unknown): string => {
  const nextDefaultCookie = mergeXinlangweiboPublicWorkSearchResponseCookie(
    XinlangweiboPublicWorkSearchDefaultCookie,
    setCookie,
  );
  XinlangweiboPublicWorkSearchDefaultCookie = nextDefaultCookie;
  return mergeXinlangweiboPublicWorkSearchResponseCookie(requestCookie, setCookie);
};

const getXinlangweiboPublicWorkSearchCookiePriority = (domain: unknown): number => {
  const domainText = String(domain ?? '');
  if (domainText.includes('m.weibo.cn')) {
    return 4;
  }
  if (domainText.includes('weibo.cn')) {
    return 3;
  }
  if (domainText.includes('weibo.com')) {
    return 2;
  }
  return 1;
};

const normalizeXinlangweiboPublicWorkSearchCookie = (cookie: string | undefined): string => {
  const cookieText = cookie?.trim() ?? '';
  if (!cookieText.startsWith('[')) {
    return cookieText;
  }
  try {
    const cookieList = JSON.parse(cookieText) as Array<{ name?: string; value?: string; domain?: string }>;
    const exists = new Set<string>();
    return cookieList
      .filter((item) => item?.name && item.value !== undefined)
      .sort(
        (a, b) =>
          getXinlangweiboPublicWorkSearchCookiePriority(b.domain) -
          getXinlangweiboPublicWorkSearchCookiePriority(a.domain),
      )
      .filter((item) => {
        if (!item.name || exists.has(item.name)) {
          return false;
        }
        exists.add(item.name);
        return true;
      })
      .map((item) => `${item.name}=${item.value}`)
      .join('; ');
  } catch (e) {
    return cookieText;
  }
};

const toStringValue = (value: unknown): string => {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value);
};

const toNumber = (value: unknown): number => {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const parseXinlangweiboPublicWorkCount = (value: unknown): number => {
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

const formatXinlangweiboPublicWorkUrl = (url: unknown): string => {
  const text = toStringValue(url).trim();
  if (!text) {
    return '';
  }
  if (text.startsWith('//')) {
    return `https:${text}`;
  }
  if (text.startsWith('/')) {
    return `https://m.weibo.cn${text}`;
  }
  if (text.startsWith('http://')) {
    return text.replace(/^http:\/\//, 'https://');
  }
  return text;
};

const getFirstUrl = (value: any): string => {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return formatXinlangweiboPublicWorkUrl(value);
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const url = getFirstUrl(item);
      if (url) {
        return url;
      }
    }
    return '';
  }
  return formatXinlangweiboPublicWorkUrl(
    value.url ??
      value.pic_big?.url ??
      value.large?.url ??
      value.mw2000?.url ??
      value.largest?.url ??
      value.original?.url ??
      value.bmiddle?.url ??
      value.thumbnail?.url,
  );
};

const decodeXinlangweiboPublicWorkText = (value: unknown): string => {
  return toStringValue(value)
    .replace(/<br\s*\/?>/g, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&#x([0-9a-fA-F]+);/g, (_match, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_match, code) => String.fromCharCode(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .replace(/\s*全文$/, '')
    .trim();
};

const getCurrentTimestampSecond = (): string => {
  return Math.floor(Date.now() / 1000).toString();
};

const parseXinlangweiboPublicWorkDateText = (value: string): number => {
  const normalizedValue = value.replace(/年/g, '-').replace(/月/g, '-').replace(/日/g, '').replace(/\./g, '-');
  const parsedTime = Date.parse(normalizedValue);
  return Number.isFinite(parsedTime) ? Math.floor(parsedTime / 1000) : 0;
};

const extractXinlangweiboPublicWorkVisitorValue = (html: string, name: string): string => {
  const match = html.match(new RegExp(`var\\s+${name}\\s*=\\s*"([^"]*)"`));
  return match?.[1] ?? '';
};

const toTimestampSecondString = (value: unknown): string => {
  const fallback = getCurrentTimestampSecond();
  const text = toStringValue(value).trim();
  if (!text) {
    return fallback;
  }
  const numberValue = Number(text);
  if (Number.isFinite(numberValue) && numberValue > 0) {
    return Math.floor(numberValue > 9999999999 ? numberValue / 1000 : numberValue).toString();
  }
  if (text.includes('刚刚')) {
    return fallback;
  }
  const relativeMatch = text.match(/(\d+)\s*(分钟|小时|天|个月|月|年)前/);
  if (relativeMatch) {
    const amount = Number(relativeMatch[1]);
    const unit = relativeMatch[2];
    const date = new Date();
    if (unit === '分钟') {
      date.setMinutes(date.getMinutes() - amount);
    } else if (unit === '小时') {
      date.setHours(date.getHours() - amount);
    } else if (unit === '天') {
      date.setDate(date.getDate() - amount);
    } else if (unit === '个月' || unit === '月') {
      date.setMonth(date.getMonth() - amount);
    } else if (unit === '年') {
      date.setFullYear(date.getFullYear() - amount);
    }
    return Math.floor(date.getTime() / 1000).toString();
  }
  const yesterdayMatch = text.match(/^昨天\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
  if (yesterdayMatch) {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    date.setHours(Number(yesterdayMatch[1]), Number(yesterdayMatch[2]), Number(yesterdayMatch[3] ?? 0), 0);
    return Math.floor(date.getTime() / 1000).toString();
  }
  const todayMatch = text.match(/^今天\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
  if (todayMatch) {
    const date = new Date();
    date.setHours(Number(todayMatch[1]), Number(todayMatch[2]), Number(todayMatch[3] ?? 0), 0);
    return Math.floor(date.getTime() / 1000).toString();
  }
  if (/^\d{1,2}[-/]\d{1,2}(\s+\d{1,2}:\d{1,2}(:\d{1,2})?)?$/.test(text)) {
    const date = new Date();
    const parsedTime = parseXinlangweiboPublicWorkDateText(`${date.getFullYear()}-${text}`);
    return parsedTime > 0 ? parsedTime.toString() : fallback;
  }
  const parsedTime = parseXinlangweiboPublicWorkDateText(text);
  return parsedTime > 0 ? parsedTime.toString() : fallback;
};

const getXinlangweiboPublicWorkText = (mblog: XinlangweiboPublicWorkMblog): string => {
  return decodeXinlangweiboPublicWorkText(mblog.text_raw || mblog.longTextContent || mblog.text);
};

const getXinlangweiboPublicWorkTitle = (mblog: XinlangweiboPublicWorkMblog): string => {
  if (getXinlangweiboPublicWorkContentType(mblog) === 'video') {
    return getXinlangweiboPublicWorkText(mblog) || decodeXinlangweiboPublicWorkText(mblog.page_info?.content2);
  }
  return (
    decodeXinlangweiboPublicWorkText(
      mblog.page_info?.content1 || mblog.page_info?.page_title || mblog.page_info?.page_desc,
    ) || getXinlangweiboPublicWorkText(mblog)
  );
};

const addXinlangweiboPublicWorkTextTags = (result: Set<string>, text: string): void => {
  const tagReg = /#([^#]+)#/g;
  let match: RegExpExecArray | null;
  while ((match = tagReg.exec(text))) {
    const tag = decodeXinlangweiboPublicWorkText(match[1]);
    if (tag) {
      result.add(tag);
    }
  }
};

const getXinlangweiboPublicWorkTags = (mblog: XinlangweiboPublicWorkMblog, title: string): Array<string> => {
  const result = new Set<string>();
  addXinlangweiboPublicWorkTextTags(result, title);
  addXinlangweiboPublicWorkTextTags(result, getXinlangweiboPublicWorkText(mblog));
  const topicList = Array.isArray(mblog.topic_struct) ? mblog.topic_struct : [];
  topicList.forEach((item) => {
    const topicTitle = decodeXinlangweiboPublicWorkText(item?.topic_title || item?.topic_url || '');
    if (topicTitle) {
      result.add(topicTitle.replace(/^#|#$/g, ''));
    }
  });
  return Array.from(result);
};

const getXinlangweiboPublicWorkPicInfoCover = (mblog: XinlangweiboPublicWorkMblog): string => {
  const picInfos = mblog.pic_infos;
  if (!picInfos || typeof picInfos !== 'object') {
    return '';
  }
  for (const picInfo of Object.values(picInfos)) {
    const url = getFirstUrl(picInfo);
    if (url) {
      return url;
    }
  }
  return '';
};

const getXinlangweiboPublicWorkCover = (mblog: XinlangweiboPublicWorkMblog): string => {
  return (
    getFirstUrl(mblog.page_info?.page_pic) ||
    getFirstUrl(mblog.page_info?.pic_info?.pic_big) ||
    getFirstUrl(mblog.page_info?.media_info?.cover_image) ||
    getFirstUrl(mblog.page_info?.media_info?.video_details) ||
    getFirstUrl(mblog.pics?.[0]?.large) ||
    getFirstUrl(mblog.pics?.[0]) ||
    getXinlangweiboPublicWorkPicInfoCover(mblog) ||
    getFirstUrl(mblog.retweeted_status?.page_info?.page_pic) ||
    getFirstUrl(mblog.retweeted_status?.pics?.[0]?.large) ||
    getFirstUrl(mblog.retweeted_status?.pics?.[0])
  );
};

const getXinlangweiboPublicWorkMediaInfo = (mblog: XinlangweiboPublicWorkMblog): any => {
  return mblog.page_info?.media_info ?? mblog.retweeted_status?.page_info?.media_info;
};

const getXinlangweiboPublicWorkContentType = (mblog: XinlangweiboPublicWorkMblog): PlatformPublicWorkContentType => {
  const pageInfo = mblog.page_info ?? mblog.retweeted_status?.page_info;
  const pageInfoType = toStringValue(pageInfo?.type).toLowerCase();
  const objectType = toStringValue(pageInfo?.object_type).toLowerCase();
  if (getXinlangweiboPublicWorkMediaInfo(mblog) || pageInfoType === 'video' || objectType === 'video') {
    return 'video';
  }
  if (pageInfoType === 'article' || objectType === '5') {
    return 'article';
  }
  return 'dynamic';
};

const getXinlangweiboPublicWorkVideoInfo = (
  mblog: XinlangweiboPublicWorkMblog,
): PlatformPublicWorkInfo['video_info'] | undefined => {
  const mediaInfo = getXinlangweiboPublicWorkMediaInfo(mblog);
  if (!mediaInfo) {
    return undefined;
  }
  const duration = toNumber(mediaInfo.duration ?? mediaInfo.video_duration ?? mediaInfo.stream_duration);
  return {
    duration_ms: duration > 0 ? (duration > 10000 ? duration : duration * 1000) : 0,
    download_url: formatXinlangweiboPublicWorkUrl(
      mediaInfo.mp4_hd_url ||
        mediaInfo.stream_url_hd ||
        mediaInfo.mp4_720p_mp4 ||
        mediaInfo.mp4_sd_url ||
        mediaInfo.stream_url,
    ),
  };
};

const parseXinlangweiboPublicWorkAuthor = (user: XinlangweiboPublicWorkUser | undefined): PlatformPublicAuthorInfo => {
  const extAuthorId = toStringValue(user?.idstr || user?.id);
  return {
    platform_code: PublicAuthorPlatformCode.XinLangWeiBo,
    ext_author_id: extAuthorId,
    nickname: decodeXinlangweiboPublicWorkText(user?.screen_name),
    avatar_url: formatXinlangweiboPublicWorkUrl(user?.avatar_hd || user?.avatar_large || user?.profile_image_url),
    description: decodeXinlangweiboPublicWorkText(user?.description || user?.verified_reason),
    aut_index: extAuthorId ? `https://weibo.com/u/${extAuthorId}` : formatXinlangweiboPublicWorkUrl(user?.profile_url),
    aut_spi_url: extAuthorId ? `uid=${extAuthorId}` : '',
    follower_count: parseXinlangweiboPublicWorkCount(user?.followers_count_str ?? user?.followers_count),
    total_views: 0,
    total_comments: 0,
    total_likes: 0,
    work_count: parseXinlangweiboPublicWorkCount(user?.statuses_count),
  };
};

const getXinlangweiboPublicWorkDocId = (mblog: XinlangweiboPublicWorkMblog): string => {
  return toStringValue(mblog.idstr || mblog.id || mblog.mid || mblog.mblogid || mblog.bid).trim();
};

const getXinlangweiboPublicWorkUrl = (mblog: XinlangweiboPublicWorkMblog, docid: string): string => {
  if (mblog.bid) {
    return `https://m.weibo.cn/status/${mblog.bid}`;
  }
  if (docid) {
    return `https://m.weibo.cn/detail/${docid}`;
  }
  return formatXinlangweiboPublicWorkUrl(mblog.scheme || mblog.page_info?.page_url);
};

const parseXinlangweiboPublicWorkSearchMblog = (
  mblog: XinlangweiboPublicWorkMblog,
): PlatformPublicWorkInfo | undefined => {
  const docid = getXinlangweiboPublicWorkDocId(mblog);
  if (!docid) {
    return undefined;
  }
  const author = parseXinlangweiboPublicWorkAuthor(mblog.user);
  const title = getXinlangweiboPublicWorkTitle(mblog);
  const contentType = getXinlangweiboPublicWorkContentType(mblog);
  const videoInfo = getXinlangweiboPublicWorkVideoInfo(mblog);
  return {
    platform_code: PublicAuthorPlatformCode.XinLangWeiBo,
    docid,
    title,
    url: getXinlangweiboPublicWorkUrl(mblog, docid),
    cover_url: getXinlangweiboPublicWorkCover(mblog),
    content_type: contentType,
    category: '其他',
    ext_category_id: '',
    ext_author_id: author.ext_author_id,
    author,
    published_at: toTimestampSecondString(mblog.created_at || mblog.edit_at || mblog.created_timestamp),
    tags: getXinlangweiboPublicWorkTags(mblog, title),
    metrics: {
      view: parseXinlangweiboPublicWorkCount(mblog.page_info?.play_count ?? mblog.reads_count ?? mblog.read_count),
      like: parseXinlangweiboPublicWorkCount(mblog.attitudes_count),
      comment: parseXinlangweiboPublicWorkCount(mblog.comments_count),
      share: parseXinlangweiboPublicWorkCount(mblog.reposts_count),
    },
    ...(videoInfo ? { video_info: videoInfo } : {}),
    raw: {},
  };
};

const collectXinlangweiboPublicWorkMblogList = (
  cards: Array<XinlangweiboPublicWorkSearchCard> | undefined,
): Array<XinlangweiboPublicWorkMblog> => {
  const result: Array<XinlangweiboPublicWorkMblog> = [];
  if (!cards?.length) {
    return result;
  }
  for (const card of cards) {
    if (card?.mblog) {
      result.push(card.mblog);
    }
    result.push(...collectXinlangweiboPublicWorkMblogList(card?.card_group));
  }
  return result;
};

const parseXinlangweiboPublicWorkSearchResponseResult = (
  response: XinlangweiboPublicWorkSearchResponse,
): XinlangweiboPublicWorkSearchParseResult => {
  const exists = new Set<string>();
  const dataList: Array<PlatformPublicWorkInfo> = [];
  const mblogList = collectXinlangweiboPublicWorkMblogList(response?.data?.cards);
  for (const mblog of mblogList) {
    const work = parseXinlangweiboPublicWorkSearchMblog(mblog);
    if (!work || exists.has(work.docid)) {
      continue;
    }
    exists.add(work.docid);
    dataList.push(work);
  }
  return {
    dataList,
    total: parseXinlangweiboPublicWorkCount(response?.data?.cardlistInfo?.total),
    pageSize: parseXinlangweiboPublicWorkCount(response?.data?.cardlistInfo?.page_size),
  };
};

export const parseXinlangweiboPublicWorkSearchResponse = (
  response: XinlangweiboPublicWorkSearchResponse,
): Array<PlatformPublicWorkInfo> => {
  return parseXinlangweiboPublicWorkSearchResponseResult(response).dataList;
};

const prepareXinlangweiboPublicWorkSearchCookie = async (
  cookie: string,
  containerId: string,
  proxyAgent: HttpsProxyAgent<string> | object | undefined = undefined,
): Promise<string> => {
  let requestCookie = cookie;
  const searchUrl = `https://m.weibo.cn/search?containerid=${encodeURIComponent(containerId)}`;
  const searchPageResult = await $http.get<unknown, AxiosResponse<string>>(searchUrl, {
    headers: {
      ...(requestCookie ? { Cookie: requestCookie } : {}),
      Host: 'm.weibo.cn',
      Referer: 'https://m.weibo.cn/',
      'User-Agent': XinlangweiboPublicWorkSearchUserAgent,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': XinlangweiboPublicWorkSearchAcceptLanguage,
      'Upgrade-Insecure-Requests': '1',
      'sec-ch-ua': XinlangweiboPublicWorkSearchSecChUa,
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"iOS"',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Dest': 'document',
    },
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
    responseType: 'text',
    maxRedirects: 0,
    timeout: 30000,
  });
  requestCookie = syncXinlangweiboPublicWorkSearchResponseCookie(requestCookie, searchPageResult.headers['set-cookie']);
  const redirectUrl = searchPageResult.headers.location
    ? new URL(searchPageResult.headers.location, searchUrl).toString()
    : '';
  if (redirectUrl.includes('/visitor/visitor')) {
    const visitorUrl = new URL(redirectUrl);
    const visitorPageResult = await $http.get<unknown, AxiosResponse<string>>(redirectUrl, {
      headers: {
        ...(requestCookie ? { Cookie: requestCookie } : {}),
        Host: visitorUrl.host,
        Referer: searchUrl,
        'User-Agent': XinlangweiboPublicWorkSearchUserAgent,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': XinlangweiboPublicWorkSearchAcceptLanguage,
        'Upgrade-Insecure-Requests': '1',
        'sec-ch-ua': XinlangweiboPublicWorkSearchSecChUa,
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"iOS"',
        'Sec-Fetch-Site': 'same-site',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Dest': 'document',
      },
      httpAgent: proxyAgent,
      httpsAgent: proxyAgent,
      responseType: 'text',
      timeout: 30000,
    });
    requestCookie = syncXinlangweiboPublicWorkSearchResponseCookie(
      requestCookie,
      visitorPageResult.headers['set-cookie'],
    );
    const requestId = extractXinlangweiboPublicWorkVisitorValue(visitorPageResult.data, 'request_id');
    const returnUrl = extractXinlangweiboPublicWorkVisitorValue(visitorPageResult.data, 'return_url') || searchUrl;
    if (requestId) {
      const visitorParams = new URLSearchParams({
        cb: 'visitor_gray_callback',
        ver: '20250916',
        request_id: requestId,
        tid: '',
        from: 'weibo',
        webdriver: 'false',
        rid: Date.now().toString(),
        return_url: returnUrl,
      });
      const visitorCookieResult = await $http.post<unknown, AxiosResponse<string>>(
        `${visitorUrl.origin}/visitor/genvisitor2`,
        visitorParams.toString(),
        {
          headers: {
            ...(requestCookie ? { Cookie: requestCookie } : {}),
            Host: visitorUrl.host,
            Referer: redirectUrl,
            'User-Agent': XinlangweiboPublicWorkSearchUserAgent,
            Accept: '*/*',
            'Accept-Language': XinlangweiboPublicWorkSearchAcceptLanguage,
            'Content-Type': 'application/x-www-form-urlencoded',
            'sec-ch-ua': XinlangweiboPublicWorkSearchSecChUa,
            'sec-ch-ua-mobile': '?1',
            'sec-ch-ua-platform': '"iOS"',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Dest': 'empty',
          },
          httpAgent: proxyAgent,
          httpsAgent: proxyAgent,
          responseType: 'text',
          timeout: 30000,
        },
      );
      requestCookie = syncXinlangweiboPublicWorkSearchResponseCookie(
        requestCookie,
        visitorCookieResult.headers['set-cookie'],
      );
    }
  }

  const configResult = await $http.get<unknown, AxiosResponse<XinlangweiboPublicWorkConfigResponse>>(
    'https://m.weibo.cn/api/config',
    {
      headers: {
        ...(requestCookie ? { Cookie: requestCookie } : {}),
        Host: 'm.weibo.cn',
        Referer: searchUrl,
        'User-Agent': XinlangweiboPublicWorkSearchUserAgent,
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': XinlangweiboPublicWorkSearchAcceptLanguage,
        'MWeibo-Pwa': '1',
        'X-Requested-With': 'XMLHttpRequest',
        'sec-ch-ua': XinlangweiboPublicWorkSearchSecChUa,
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"iOS"',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
      },
      httpAgent: proxyAgent,
      httpsAgent: proxyAgent,
      timeout: 30000,
    },
  );
  requestCookie = syncXinlangweiboPublicWorkSearchResponseCookie(requestCookie, configResult.headers['set-cookie']);
  return requestCookie;
};

export const getXinlangweiboPublicWorkSearchResponse = async (
  cookie: string | undefined,
  keyWord: string,
  pageNum: number = 1,
  proxyAgent: HttpsProxyAgent<string> | object | undefined = undefined,
): Promise<XinlangweiboPublicWorkSearchResponse> => {
  const baseCookie = normalizeXinlangweiboPublicWorkSearchCookie(cookie);
  const containerId = `100103type=${XinlangweiboPublicWorkSearchType}&q=${keyWord ?? ''}`;
  const requestCookie = await prepareXinlangweiboPublicWorkSearchCookie(
    baseCookie || XinlangweiboPublicWorkSearchDefaultCookie,
    containerId,
    proxyAgent,
  );
  const params = new URLSearchParams({
    containerid: containerId,
    page_type: 'searchall',
  });
  if (pageNum > 1) {
    params.set('page', pageNum.toString());
  }
  const result = await $http.get<unknown, AxiosResponse<XinlangweiboPublicWorkSearchResponse>>(
    `https://m.weibo.cn/api/container/getIndex?${params.toString()}`,
    {
      headers: {
        ...(requestCookie ? { Cookie: requestCookie } : {}),
        Host: 'm.weibo.cn',
        Referer: `https://m.weibo.cn/search?containerid=${encodeURIComponent(containerId)}`,
        'User-Agent': XinlangweiboPublicWorkSearchUserAgent,
        Accept: 'application/json, text/plain, */*',
        'Accept-Language': XinlangweiboPublicWorkSearchAcceptLanguage,
        'MWeibo-Pwa': '1',
        'X-Requested-With': 'XMLHttpRequest',
        'sec-ch-ua': XinlangweiboPublicWorkSearchSecChUa,
        'sec-ch-ua-mobile': '?1',
        'sec-ch-ua-platform': '"iOS"',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
      },
      httpAgent: proxyAgent,
      httpsAgent: proxyAgent,
      timeout: 30000,
    },
  );
  syncXinlangweiboPublicWorkSearchResponseCookie(requestCookie, result.headers['set-cookie']);
  if (result.status < 200 || result.status >= 300 || !result.data || typeof result.data !== 'object') {
    return {
      ok: errorCode.request_error,
      msg: '请求微博作品搜索失败',
    };
  }
  return result.data;
};

export const searchXinlangweiboPublicWorkList = async (
  keyWord: string,
  cookie?: string | undefined,
  nextPage?: string,
  proxy?: KuaiDaiLiProxy,
  contentType: XinlangweiboPublicWorkSearchContentType = 'video',
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
    result.msg = '微博作品搜索暂仅支持默认作品搜索';
    return result;
  }
  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const pageNum = Number(nextPage ?? 1) || 1;
    const workSearchResponse = await getXinlangweiboPublicWorkSearchResponse(cookie, keyWord, pageNum, webProxy);
    result.code = workSearchResponse?.ok === 1 ? 0 : workSearchResponse?.ok ?? -1;
    result.msg = workSearchResponse?.msg ?? (result.code === -100 ? '微博作品搜索需要有效的移动端 Cookie' : '');
    const parseResult = parseXinlangweiboPublicWorkSearchResponseResult(workSearchResponse);
    result.dataList = parseResult.dataList;
    const pageSize = parseResult.pageSize || 10;
    if (parseResult.total > pageNum * pageSize && result.dataList.length > 0) {
      result.nextPage = (pageNum + 1).toString();
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = '请求微博作品搜索失败';
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = '解析微博作品搜索结果失败';
    } else {
      result.msg = '微博作品搜索失败';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};

export interface XinlangweiboPublicWorkSearchCard {
  card_type?: number;
  card_type_name?: string;
  mblog?: XinlangweiboPublicWorkMblog;
  card_group?: Array<XinlangweiboPublicWorkSearchCard>;
}

export interface XinlangweiboPublicWorkSearchResponse {
  ok?: number;
  msg?: string;
  data?: {
    cards?: Array<XinlangweiboPublicWorkSearchCard>;
    cardlistInfo?: {
      total?: number | string;
      page_size?: number | string;
      page?: number | string;
      containerid?: string;
    };
  };
}

export interface XinlangweiboPublicWorkConfigResponse {
  ok?: number;
  data?: {
    login?: boolean;
    st?: string;
  };
}

export interface XinlangweiboPublicWorkUser {
  id?: number | string;
  idstr?: string;
  screen_name?: string;
  profile_image_url?: string;
  avatar_hd?: string;
  avatar_large?: string;
  profile_url?: string;
  description?: string;
  followers_count?: number | string;
  followers_count_str?: string;
  statuses_count?: number | string;
  verified_reason?: string;
}

export interface XinlangweiboPublicWorkMblog {
  id?: number | string;
  idstr?: string;
  mid?: number | string;
  mblogid?: string;
  bid?: string;
  created_at?: string;
  edit_at?: string;
  created_timestamp?: number | string;
  text?: string;
  text_raw?: string;
  longTextContent?: string;
  scheme?: string;
  reads_count?: number | string;
  read_count?: number | string;
  reposts_count?: number | string;
  comments_count?: number | string;
  attitudes_count?: number | string;
  user?: XinlangweiboPublicWorkUser;
  pics?: Array<any>;
  pic_infos?: Record<string, any>;
  topic_struct?: Array<{
    topic_title?: string;
    topic_url?: string;
  }>;
  page_info?: {
    type?: string;
    object_type?: number | string;
    page_title?: string;
    page_desc?: string;
    content1?: string;
    content2?: string;
    page_url?: string;
    play_count?: number | string;
    page_pic?: unknown;
    pic_info?: {
      pic_big?: unknown;
    };
    media_info?: any;
  };
  retweeted_status?: XinlangweiboPublicWorkMblog;
}
