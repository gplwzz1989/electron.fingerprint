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
import { DouyinPublicAuthorSearchDefaultCookie } from './douyin-user.service';

export type DouyinPublicWorkSearchContentType = PlatformPublicWorkSearchContentType;

export let DouyinPublicWorkSearchDefaultCookie = DouyinPublicAuthorSearchDefaultCookie;

const DouyinPublicWorkSearchUserAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';
const DouyinPublicWorkSearchSecChUa = '"Not;A=Brand";v="8", "Chromium";v="150", "Google Chrome";v="150"';
const DouyinPublicWorkSearchAcceptLanguage = 'zh-CN,zh;q=0.9';
const DouyinPublicWorkSearchFirstPageSize = 20;

interface DouyinPublicWorkSearchParseResult {
  dataList: Array<PlatformPublicWorkInfo>;
  searchId?: string;
  hasMore?: boolean;
}

const appendDouyinPublicWorkSearchCookie = (cookie: string, name: string, value: string): string => {
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

const mergeDouyinPublicWorkSearchResponseCookie = (cookie: string, setCookie: unknown): string => {
  const responseCookieList = Array.isArray(setCookie) ? setCookie : typeof setCookie === 'string' ? [setCookie] : [];
  return responseCookieList.reduce((currentCookie, responseCookie) => {
    const cookiePair = responseCookie.split(';')[0]?.trim();
    const equalIndex = cookiePair.indexOf('=');
    if (equalIndex <= 0) {
      return currentCookie;
    }
    return appendDouyinPublicWorkSearchCookie(
      currentCookie,
      cookiePair.slice(0, equalIndex).trim(),
      cookiePair.slice(equalIndex + 1).trim(),
    );
  }, cookie);
};

const syncDouyinPublicWorkSearchResponseCookie = (requestCookie: string, setCookie: unknown): string => {
  const nextDefaultCookie = mergeDouyinPublicWorkSearchResponseCookie(DouyinPublicWorkSearchDefaultCookie, setCookie);
  DouyinPublicWorkSearchDefaultCookie = nextDefaultCookie;
  return mergeDouyinPublicWorkSearchResponseCookie(requestCookie, setCookie);
};

const toNumber = (value: unknown): number => {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const toStringValue = (value: unknown): string => {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value);
};

const getFirstUrl = (value: any): string => {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
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
  if (typeof value.url === 'string') {
    return value.url;
  }
  if (Array.isArray(value.url_list)) {
    return getFirstUrl(value.url_list);
  }
  if (Array.isArray(value.urlList)) {
    return getFirstUrl(value.urlList);
  }
  return '';
};

const decodeDouyinPublicWorkHtmlText = (value: string): string => {
  return value
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

const getDouyinPublicWorkTitleTags = (title: string): Array<string> => {
  const tags = title.match(/#[^#\s，,。；;!！?？]+/g) ?? [];
  return tags.map((tag) => tag.replace(/^#/, '').trim()).filter(Boolean);
};

const getDouyinPublicWorkTags = (item: any, title: string): Array<string> => {
  const result = new Set<string>();
  getDouyinPublicWorkTitleTags(title).forEach((tag) => result.add(tag));
  const textExtra = Array.isArray(item.text_extra) ? item.text_extra : [];
  textExtra.forEach((tagItem: any) => {
    const tag = decodeDouyinPublicWorkHtmlText(toStringValue(tagItem?.hashtag_name ?? tagItem?.hashtag_id ?? ''));
    if (tag) {
      result.add(tag);
    }
  });
  return Array.from(result);
};

const normalizeDouyinPublicWorkSearchText = (value: unknown): string => {
  return decodeDouyinPublicWorkHtmlText(toStringValue(value)).replace(/\s/g, '').toLowerCase();
};

const extractDouyinPublicWorkSearchJsonValue = (source: string, valueStart: number): string => {
  const openChar = source[valueStart];
  const closeChar = openChar === '{' ? '}' : openChar === '[' ? ']' : '';
  if (!closeChar) {
    return '';
  }

  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = valueStart; i < source.length; i++) {
    const char = source[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) {
      continue;
    }
    if (char === openChar) {
      depth++;
    } else if (char === closeChar) {
      depth--;
      if (depth === 0) {
        return source.substring(valueStart, i + 1);
      }
    }
  }
  return '';
};

const findDouyinPublicWorkSearchData = (value: unknown): DouyinPublicWorkSearchData | undefined => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  const valueRecord = value as Record<string, any>;
  if (valueRecord.predictAckData?.business_data) {
    return valueRecord.predictAckData as DouyinPublicWorkSearchData;
  }
  if (Array.isArray(valueRecord.business_data)) {
    return valueRecord as DouyinPublicWorkSearchData;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const searchData = findDouyinPublicWorkSearchData(item);
      if (searchData) {
        return searchData;
      }
    }
    return undefined;
  }
  for (const key of Object.keys(valueRecord)) {
    const searchData = findDouyinPublicWorkSearchData(valueRecord[key]);
    if (searchData) {
      return searchData;
    }
  }
  return undefined;
};

const findDouyinPublicWorkRscJsonStart = (source: string): number => {
  const arrayStart = source.indexOf('[');
  const objectStart = source.indexOf('{');
  if (arrayStart < 0) {
    return objectStart;
  }
  if (objectStart < 0) {
    return arrayStart;
  }
  return Math.min(arrayStart, objectStart);
};

const extractDouyinPublicWorkRscSearchDataList = (html: string): Array<DouyinPublicWorkSearchData> => {
  const result: Array<DouyinPublicWorkSearchData> = [];
  let pushIndex = -1;
  while ((pushIndex = html.indexOf('self.__rsc_f.push(', pushIndex + 1)) >= 0) {
    const argumentStart = html.indexOf('[', pushIndex);
    if (argumentStart < 0) {
      continue;
    }
    const argumentJson = extractDouyinPublicWorkSearchJsonValue(html, argumentStart);
    if (!argumentJson) {
      continue;
    }
    try {
      const argumentData = JSON.parse(argumentJson) as Array<unknown>;
      for (const item of argumentData) {
        if (typeof item !== 'string' || (!item.includes('predictAckData') && !item.includes('business_data'))) {
          continue;
        }
        const rscJsonStart = findDouyinPublicWorkRscJsonStart(item);
        if (rscJsonStart < 0) {
          continue;
        }
        const searchData = findDouyinPublicWorkSearchData(JSON.parse(item.substring(rscJsonStart)));
        if (searchData) {
          result.push(searchData);
        }
      }
    } catch (e) {
      continue;
    }
  }
  return result;
};

const extractDouyinPublicWorkLetSearchDataList = (html: string): Array<DouyinPublicWorkSearchData> => {
  const result: Array<DouyinPublicWorkSearchData> = [];
  let dataIndex = -1;
  while ((dataIndex = html.indexOf('let data =', dataIndex + 1)) >= 0) {
    const jsonStart = html.indexOf('{', dataIndex);
    if (jsonStart < 0) {
      continue;
    }
    const dataJson = extractDouyinPublicWorkSearchJsonValue(html, jsonStart);
    if (!dataJson) {
      continue;
    }
    try {
      result.push(JSON.parse(dataJson) as DouyinPublicWorkSearchData);
    } catch (e) {
      continue;
    }
  }
  return result;
};

export const extractDouyinPublicWorkSearchData = (html: string): DouyinPublicWorkSearchData | undefined => {
  const dataList = [
    ...extractDouyinPublicWorkLetSearchDataList(html),
    ...extractDouyinPublicWorkRscSearchDataList(html),
  ];
  if (!dataList.length) {
    return undefined;
  }
  return dataList.reduce<DouyinPublicWorkSearchData>(
    (result, item) => ({
      ...result,
      ...item,
      log: result.log ?? item.log,
      log_pb: result.log_pb ?? item.log_pb,
      extra: result.extra ?? item.extra,
      business_data: [...(result.business_data ?? []), ...(item.business_data ?? [])],
    }),
    { business_data: [] },
  );
};

const parseDouyinPublicWorkSearchRawData = (
  rawData: string | DouyinPublicWorkSearchRawData | undefined,
): DouyinPublicWorkSearchRawData | undefined => {
  if (!rawData) {
    return undefined;
  }
  if (typeof rawData !== 'string') {
    return rawData;
  }
  try {
    return JSON.parse(rawData) as DouyinPublicWorkSearchRawData;
  } catch (e) {
    return undefined;
  }
};

const getDouyinPublicWorkSearchId = (searchData: DouyinPublicWorkSearchData | undefined): string => {
  return (
    toStringValue(searchData?.log?.search_id) ||
    toStringValue(searchData?.log_pb?.impr_id) ||
    toStringValue(searchData?.extra?.logid) ||
    toStringValue(searchData?.log_id)
  );
};

const getDouyinPublicWorkSearchHasMore = (value: DouyinPublicWorkSearchData['has_more']): boolean => {
  return value !== false && value !== 0 && value !== '0';
};

const getDouyinPublicWorkAuthorId = (awemeInfo: DouyinPublicWorkAwemeInfo | undefined): string => {
  return toStringValue(
    awemeInfo?.author?.search_impr?.entity_id ?? awemeInfo?.author?.uid ?? awemeInfo?.author_user_id,
  );
};

const parseDouyinPublicWorkAuthor = (awemeInfo: DouyinPublicWorkAwemeInfo | undefined): PlatformPublicAuthorInfo => {
  const author = awemeInfo?.author;
  const extAuthorId = getDouyinPublicWorkAuthorId(awemeInfo);
  const secUid = toStringValue(author?.sec_uid);
  const douyinId = toStringValue(author?.unique_id || author?.short_id || extAuthorId);
  return {
    platform_code: PublicAuthorPlatformCode.DouYin,
    ext_author_id: extAuthorId,
    nickname: toStringValue(author?.nickname),
    avatar_url:
      getFirstUrl(author?.avatar_larger) || getFirstUrl(author?.avatar_medium) || getFirstUrl(author?.avatar_thumb),
    description: toStringValue(author?.signature),
    aut_index: secUid ? `https://www.douyin.com/user/${secUid}` : `https://www.douyin.com/search/${douyinId}`,
    aut_spi_url: `sec_uid=${secUid}`,
    follower_count: toNumber(author?.follower_count),
    total_views: 0,
    total_comments: 0,
    total_likes: toNumber(author?.total_favorited),
    work_count: toNumber(author?.aweme_count),
  };
};

const isDouyinPublicWorkSearchMatched = (work: PlatformPublicWorkInfo, keyWord?: string): boolean => {
  const normalizedKeyWord = normalizeDouyinPublicWorkSearchText(keyWord);
  if (!normalizedKeyWord) {
    return true;
  }
  const raw = work.raw as DouyinPublicWorkAwemeInfo | undefined;
  const searchTextList = [
    work.title,
    ...(work.tags ?? []),
    work.author?.nickname,
    work.author?.description,
    work.author?.ext_author_id,
    raw?.author?.unique_id,
    raw?.author?.short_id,
  ]
    .map(normalizeDouyinPublicWorkSearchText)
    .filter(Boolean);
  return searchTextList.some(
    (searchText) =>
      searchText.includes(normalizedKeyWord) || (searchText.length >= 3 && normalizedKeyWord.includes(searchText)),
  );
};

const parseDouyinPublicWorkSearchItem = (
  item: DouyinPublicWorkSearchBusinessData,
  contentType: DouyinPublicWorkSearchContentType,
): PlatformPublicWorkInfo | undefined => {
  const rawData = parseDouyinPublicWorkSearchRawData(item?.data?.raw_data);
  const awemeInfo = rawData?.aweme_info ?? item?.data?.aweme_list?.[0];
  const docid = toStringValue(
    awemeInfo?.aweme_id ?? awemeInfo?.group_id ?? item?.data?.provider_doc_id_str ?? rawData?.provider_doc_id_str,
  ).trim();
  if (!docid) {
    return undefined;
  }
  const title = decodeDouyinPublicWorkHtmlText(toStringValue(awemeInfo?.desc));
  return {
    platform_code: PublicAuthorPlatformCode.DouYin,
    docid,
    title,
    url: awemeInfo?.share_url || `https://www.douyin.com/video/${docid}`,
    cover_url:
      getFirstUrl(awemeInfo?.video?.cover) ||
      getFirstUrl(awemeInfo?.video?.origin_cover) ||
      getFirstUrl(awemeInfo?.video?.dynamic_cover),
    content_type: contentType,
    category: '其他',
    ext_category_id: '',
    ext_author_id: getDouyinPublicWorkAuthorId(awemeInfo),
    author: parseDouyinPublicWorkAuthor(awemeInfo),
    published_at: toStringValue(awemeInfo?.create_time || Math.floor(Date.now() / 1000)),
    tags: getDouyinPublicWorkTags(awemeInfo, title),
    metrics: {
      view: toNumber(awemeInfo?.statistics?.play_count),
      like: toNumber(awemeInfo?.statistics?.digg_count),
      comment: toNumber(awemeInfo?.statistics?.comment_count),
      share: toNumber(awemeInfo?.statistics?.share_count),
    },
    video_info: {
      duration_ms: toNumber(awemeInfo?.duration ?? awemeInfo?.video?.duration),
      download_url: getFirstUrl(awemeInfo?.video?.download_addr) || getFirstUrl(awemeInfo?.video?.play_addr),
    },
    raw: {},
  };
};

export const parseDouyinPublicWorkSearchData = (
  searchData: DouyinPublicWorkSearchData | undefined,
  contentType: DouyinPublicWorkSearchContentType = 'video',
  keyWord?: string,
): DouyinPublicWorkSearchParseResult => {
  const exists = new Set<string>();
  const dataList: Array<PlatformPublicWorkInfo> = [];
  if (!searchData?.business_data?.length) {
    return {
      dataList,
      searchId: getDouyinPublicWorkSearchId(searchData),
      hasMore: false,
    };
  }
  for (const item of searchData.business_data) {
    const work = parseDouyinPublicWorkSearchItem(item, contentType);
    if (!work || exists.has(work.docid) || !isDouyinPublicWorkSearchMatched(work, keyWord)) {
      continue;
    }
    exists.add(work.docid);
    dataList.push(work);
  }
  return {
    dataList,
    searchId: getDouyinPublicWorkSearchId(searchData),
    hasMore: getDouyinPublicWorkSearchHasMore(searchData.has_more),
  };
};

/**
 * 解析抖音公开视频作品搜索 HTML
 * @param html 抖音公开搜索页 HTML
 */
export const parseDouyinPublicWorkSearchHtml = (
  html: string,
  contentType: DouyinPublicWorkSearchContentType = 'video',
  keyWord?: string,
): Array<PlatformPublicWorkInfo> => {
  return parseDouyinPublicWorkSearchData(extractDouyinPublicWorkSearchData(html), contentType, keyWord).dataList;
};

export const getDouyinPublicWorkSearchHtml = async (
  cookie: string | undefined,
  keyWord: string,
  proxy: HttpsProxyAgent<string> | object | undefined = undefined,
): Promise<string> => {
  let requestCookie = cookie?.trim() ? cookie : DouyinPublicWorkSearchDefaultCookie;
  const params = new URLSearchParams({
    search_entrance: 'aweme',
    keyword: keyWord ?? '',
    enter_method: 'normal_search',
    pd: 'video',
  });

  const requestSearchHtml = async (): Promise<string> => {
    const url = `https://so.douyin.com/s?${params.toString()}`;
    const result = await $http.get<unknown, AxiosResponse<string>>(url, {
      headers: {
        cookie: requestCookie,
        referer: url,
        'User-Agent': DouyinPublicWorkSearchUserAgent,
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': DouyinPublicWorkSearchAcceptLanguage,
        'Upgrade-Insecure-Requests': '1',
        'sec-ch-ua': DouyinPublicWorkSearchSecChUa,
        'sec-ch-ua-mobile': HttpConfig.sec_ch_ua_mobile,
        'sec-ch-ua-platform': HttpConfig.sec_ch_ua_platform,
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-User': '?1',
        'Sec-Fetch-Dest': 'document',
      },
      httpAgent: proxy,
      httpsAgent: proxy,
      responseType: 'text',
    });
    requestCookie = syncDouyinPublicWorkSearchResponseCookie(requestCookie, result.headers['set-cookie']);
    return result.data;
  };

  let html = await requestSearchHtml();
  if (!extractDouyinPublicWorkSearchData(html)?.business_data?.length) {
    requestCookie = appendDouyinPublicWorkSearchCookie(requestCookie, 'douyin_search_screen', '1478*623');
    requestCookie = appendDouyinPublicWorkSearchCookie(requestCookie, 'x_mac_env', '2');
    params.set('reload_from', 'abnormal_wh_3');
    html = await requestSearchHtml();
  }
  return html;
};

export const getDouyinPublicWorkSearchMoreResponse = async (
  cookie: string | undefined,
  keyWord: string,
  offset: number,
  searchId: string,
  proxy: HttpsProxyAgent<string> | object | undefined = undefined,
): Promise<DouyinPublicWorkSearchData> => {
  const requestCookie = cookie?.trim() ? cookie : DouyinPublicWorkSearchDefaultCookie;
  const pageSize = 30;
  const params = new URLSearchParams({
    aid: '581610',
    device_platform: 'webapp',
    search_source: 'normal_search',
    app_version: '290000',
    version_code: '290000',
    version_name: '29.0.0',
    webapp_platform: 'mac',
    webapp_platform_version: '',
    search_entrance: 'aweme',
    keyword: keyWord ?? '',
    enter_method: 'normal_search',
    pd: 'video',
    app_theme: 'light',
    count: pageSize.toString(),
    sort_params: '',
    appTheme: 'light',
    video_tab_waterfall: 'true',
    need_filter_settings: '1',
    location_access: '',
    offset: offset.toString(),
    search_id: searchId,
    currentPage: (Math.floor(Math.max(offset - DouyinPublicWorkSearchFirstPageSize, 0) / pageSize) + 2).toString(),
    'options[stream]': 'false',
  });
  const result = await $http.get<unknown, AxiosResponse<DouyinPublicWorkSearchData>>(
    `https://so.douyin.com/aweme/v2/search/msite/item/single/?${params.toString()}`,
    {
      headers: {
        cookie: requestCookie,
        referer: 'https://so.douyin.com/s',
        'User-Agent': DouyinPublicWorkSearchUserAgent,
        Accept: '*/*',
        'Accept-Language': DouyinPublicWorkSearchAcceptLanguage,
        'Content-Type': 'application/x-www-form-urlencoded',
        'sec-ch-ua': DouyinPublicWorkSearchSecChUa,
        'sec-ch-ua-mobile': HttpConfig.sec_ch_ua_mobile,
        'sec-ch-ua-platform': HttpConfig.sec_ch_ua_platform,
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Dest': 'empty',
      },
      httpAgent: proxy,
      httpsAgent: proxy,
    },
  );
  syncDouyinPublicWorkSearchResponseCookie(requestCookie, result.headers['set-cookie']);
  return result.data;
};

export const searchDouyinPublicWorkList = async (
  keyWord: string,
  cookie?: string | undefined,
  nextPage?: string,
  proxy?: KuaiDaiLiProxy,
  contentType: DouyinPublicWorkSearchContentType = 'video',
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
    result.msg = '抖音作品搜索暂仅支持视频';
    return result;
  }
  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const offset = Number(nextPage ?? 0) || 0;
    const html = await getDouyinPublicWorkSearchHtml(cookie, keyWord, webProxy);
    const firstSearchData = extractDouyinPublicWorkSearchData(html);
    const firstPageResult = parseDouyinPublicWorkSearchData(firstSearchData, contentType, keyWord);
    if (offset <= 0) {
      result.dataList = firstPageResult.dataList;
      const firstPageSize = firstSearchData?.business_data?.length ?? firstPageResult.dataList.length;
      if (
        firstPageResult.searchId &&
        firstPageResult.dataList.length &&
        firstPageSize >= DouyinPublicWorkSearchFirstPageSize
      ) {
        result.nextPage = firstPageSize.toString();
      }
    } else if (firstPageResult.searchId) {
      const moreResponse = await getDouyinPublicWorkSearchMoreResponse(
        cookie,
        keyWord,
        offset,
        firstPageResult.searchId,
        webProxy,
      );
      const moreResult = parseDouyinPublicWorkSearchData(moreResponse, contentType, keyWord);
      result.dataList = moreResult.dataList;
      if (moreResult.hasMore && moreResult.dataList.length) {
        result.nextPage = (offset + (moreResponse.business_data?.length ?? moreResult.dataList.length)).toString();
      }
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = '请求抖音作品搜索失败';
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = '解析抖音作品搜索结果失败';
    } else {
      result.msg = '抖音作品搜索失败';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};

export interface DouyinPublicWorkSearchBusinessData {
  data_id?: string;
  type?: number;
  data?: {
    provider_doc_id_str?: string;
    raw_data?: string | DouyinPublicWorkSearchRawData;
    aweme_list?: Array<DouyinPublicWorkAwemeInfo>;
  };
}

export interface DouyinPublicWorkSearchData {
  business_data?: Array<DouyinPublicWorkSearchBusinessData>;
  log?: {
    search_id?: string;
  };
  log_pb?: {
    impr_id?: string;
  };
  extra?: {
    logid?: string;
  };
  has_more?: boolean | number | string;
  cursor?: number;
  offset?: number;
  log_id?: string;
}

export interface DouyinPublicWorkSearchRawData {
  type?: number;
  aweme_info?: DouyinPublicWorkAwemeInfo;
  provider_doc_id_str?: string;
}

export interface DouyinPublicWorkAwemeInfo {
  aweme_id?: string;
  group_id?: string;
  desc?: string;
  create_time?: number | string;
  author_user_id?: string;
  author?: {
    uid?: string;
    sec_uid?: string;
    short_id?: string;
    unique_id?: string;
    nickname?: string;
    signature?: string;
    avatar_larger?: unknown;
    avatar_medium?: unknown;
    avatar_thumb?: unknown;
    follower_count?: number | string;
    total_favorited?: number | string;
    aweme_count?: number | string;
    search_impr?: {
      entity_id?: string;
    };
  };
  share_url?: string;
  duration?: number | string;
  statistics?: {
    play_count?: number | string;
    digg_count?: number | string;
    comment_count?: number | string;
    share_count?: number | string;
  };
  text_extra?: Array<{
    hashtag_name?: string;
    hashtag_id?: string;
  }>;
  video?: {
    cover?: unknown;
    origin_cover?: unknown;
    dynamic_cover?: unknown;
    download_addr?: unknown;
    play_addr?: unknown;
    duration?: number | string;
  };
}
