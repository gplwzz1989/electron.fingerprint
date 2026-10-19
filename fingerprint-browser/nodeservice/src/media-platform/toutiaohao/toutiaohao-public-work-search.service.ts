import { $http, HttpConfig } from '../../http';
import { AxiosError, AxiosResponse } from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { errorCode } from '../errorCode';
import { PublicAuthorPlatformCode } from '../baseModel';
import type {
  PlatformPublicAuthorInfo,
  PlatformPublicWorkInfo,
  PlatformPublicWorkListOutput,
  PlatformPublicWorkSearchContentType,
} from '../baseModel';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '../webproxy';
import { ToutiaohaoPublicAuthorSearchDefaultCookie } from './toutiaohao-user.service';

export type ToutiaohaoPublicWorkSearchContentType = PlatformPublicWorkSearchContentType;

export let ToutiaohaoPublicWorkSearchDefaultCookie = ToutiaohaoPublicAuthorSearchDefaultCookie;

const ToutiaohaoPublicWorkSearchUserAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36';
const ToutiaohaoPublicWorkSearchSecChUa = '"Google Chrome";v="150", "Chromium";v="150", "Not)A;Brand";v="24"';
const ToutiaohaoPublicWorkSearchAcceptLanguage = 'zh-CN,zh;q=0.9';

const ToutiaohaoPublicWorkCategoryNameMap: Record<string, string> = {
  video_digital: '数码科技',
  video_tech: '科技',
  video_science: '科学',
  video_house: '家居',
  video_comic: '动漫',
  video_child: '视频',
  video_music: '音乐',
  video_game: '游戏',
  video_entertainment: '娱乐',
  video_food: '美食',
  video_travel: '旅游',
  video_sports: '体育',
  video_car: '汽车',
  video_education: '教育',
  video_history: '历史',
  video_culture: '文化',
  video_agriculture: '三农',
  video_pet: '宠物',
  video_fashion: '时尚',
  video_finance: '财经',
  news: '资讯',
};

interface ToutiaohaoPublicWorkSearchCard {
  data?: any;
  extraData?: {
    curPageNum?: number | string;
    pageCount?: number | string;
    has_more?: number | string;
    offset?: number | string;
  };
}

interface ToutiaohaoPublicWorkSearchParseResult {
  dataList: Array<PlatformPublicWorkInfo>;
  hasMore?: number;
  curPageNum?: number;
  pageCount?: number;
}

const appendToutiaohaoPublicWorkSearchCookie = (cookie: string, name: string, value: string): string => {
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

const mergeToutiaohaoPublicWorkSearchResponseCookie = (cookie: string, setCookie: unknown): string => {
  const responseCookieList = Array.isArray(setCookie) ? setCookie : typeof setCookie === 'string' ? [setCookie] : [];
  return responseCookieList.reduce((currentCookie, responseCookie) => {
    const cookiePair = responseCookie.split(';')[0]?.trim();
    const equalIndex = cookiePair.indexOf('=');
    if (equalIndex <= 0) {
      return currentCookie;
    }
    return appendToutiaohaoPublicWorkSearchCookie(
      currentCookie,
      cookiePair.slice(0, equalIndex).trim(),
      cookiePair.slice(equalIndex + 1).trim(),
    );
  }, cookie);
};

const syncToutiaohaoPublicWorkSearchResponseCookie = (requestCookie: string, setCookie: unknown): string => {
  const nextDefaultCookie = mergeToutiaohaoPublicWorkSearchResponseCookie(
    ToutiaohaoPublicWorkSearchDefaultCookie,
    setCookie,
  );
  ToutiaohaoPublicWorkSearchDefaultCookie = nextDefaultCookie;
  return mergeToutiaohaoPublicWorkSearchResponseCookie(requestCookie, setCookie);
};

const getToutiaohaoPublicWorkSearchTab = (
  contentType: ToutiaohaoPublicWorkSearchContentType = 'video',
): 'video' | 'xiaoshipin' => {
  return contentType === 'miniVideo' ? 'xiaoshipin' : 'video';
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

const decodeToutiaohaoPublicWorkHtmlText = (value: string): string => {
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

const getToutiaohaoPublicWorkTitleTags = (title: string): Array<string> => {
  const tags = title.match(/#[^#\s，,。；;!！?？]+/g) ?? [];
  return tags.map((tag) => tag.replace(/^#/, '').trim()).filter(Boolean);
};

const getToutiaohaoPublicWorkTags = (item: any, title: string): Array<string> => {
  const result = new Set<string>();
  getToutiaohaoPublicWorkTitleTags(title).forEach((tag) => result.add(tag));
  const tagList = Array.isArray(item.tags) ? item.tags : Array.isArray(item.show_tag_list) ? item.show_tag_list : [];
  tagList.forEach((tagItem: any) => {
    const tag = decodeToutiaohaoPublicWorkHtmlText(toStringValue(tagItem?.text ?? tagItem?.name ?? tagItem));
    if (tag) {
      result.add(tag);
    }
  });
  return Array.from(result);
};

const isToutiaohaoPublicWorkChineseCategory = (category: string): boolean => {
  return /^[\u4e00-\u9fa5]+$/.test(category);
};

const getToutiaohaoPublicWorkCategory = (
  item: any,
  tags: Array<string>,
): { category: string; extCategoryId: string } => {
  const categoryList = Array.isArray(item.categories) ? item.categories : [];
  const extCategoryId = toStringValue(categoryList[0] ?? item.tag ?? item.raw_data?.data_ext?.category ?? '');
  const tagCategory = tags.find((tag) => tag.includes('科技') || tag.includes('数码')) ?? '';
  let category =
    tagCategory ||
    toStringValue(item.category) ||
    toStringValue(item.data_ext?.xigua_extra_info?.entity) ||
    ToutiaohaoPublicWorkCategoryNameMap[extCategoryId] ||
    extCategoryId;
  category = category.trim();
  if (!category || !isToutiaohaoPublicWorkChineseCategory(category)) {
    category = '其他';
  }
  if (category?.length > 3) {
    category = '其他';
  }
  return { category, extCategoryId };
};

const getToutiaohaoPublicWorkAuthorId = (item: any): string => {
  const userId = toStringValue(item.user_id ?? item.media_creator_id ?? item.raw_data?.user?.info?.user_id);
  if (userId && userId !== '-1') {
    return userId;
  }
  try {
    const userAuthInfo = JSON.parse(toStringValue(item.raw_data?.user?.info?.user_auth_info));
    return toStringValue(userAuthInfo.open_auth_uid);
  } catch (e) {
    return '';
  }
};

const parseToutiaohaoPublicWorkAuthor = (item: any): PlatformPublicAuthorInfo => {
  const extAuthorId = getToutiaohaoPublicWorkAuthorId(item);
  const userInfo = item.raw_data?.user?.info ?? {};
  const nickname = decodeToutiaohaoPublicWorkHtmlText(
    toStringValue(
      item.screen_name ||
        item.name ||
        item.author_name ||
        item.media_name ||
        item.source ||
        userInfo.screen_name ||
        userInfo.name,
    ),
  );
  return {
    platform_code: PublicAuthorPlatformCode.TouTiaoHao,
    ext_author_id: extAuthorId,
    nickname,
    avatar_url: getFirstUrl(item.avatar_url || item.user_avatar_url || userInfo.avatar_url || userInfo.avatar),
    description: decodeToutiaohaoPublicWorkHtmlText(
      toStringValue(item.description || item.verified_content || item.verify_content || userInfo.description),
    ),
    aut_index: extAuthorId ? `https://www.toutiao.com/c/user/${extAuthorId}/` : '',
    aut_spi_url: extAuthorId ? `user_id=${extAuthorId}` : '',
    follower_count: toNumber(item.follow_count ?? userInfo.follow_count),
    total_views: 0,
    total_comments: 0,
    total_likes: 0,
    work_count: 0,
  };
};

const getToutiaohaoPublicWorkUrl = (
  item: any,
  docid: string,
  contentType: ToutiaohaoPublicWorkSearchContentType,
): string => {
  let rawUrl = toStringValue(
    item.article_url ||
      item.share_url ||
      item.source_url ||
      item.display?.info?.url ||
      item.raw_data?.share?.share_url ||
      item.raw_data?.share_info?.share_url,
  );

  if (rawUrl && !rawUrl.includes('%!d(MISSING)')) {
    if (contentType === 'video' && rawUrl?.includes('/group/')) {
      rawUrl = rawUrl.replace('/group/', '/video/');
    }
    return rawUrl;
  }
  if (contentType === 'miniVideo') {
    return docid ? `https://www.douyin.com/share/video/${docid}/` : rawUrl;
  }
  return docid ? `https://www.toutiao.com/group/${docid}/` : rawUrl;
};

const getToutiaohaoPublicWorkCover = (item: any): string => {
  return (
    getFirstUrl(item.video_image) ||
    getFirstUrl(item.large_thumbnail_url) ||
    getFirstUrl(item.thumbnail_url) ||
    getFirstUrl(item.video_img_16_9) ||
    getFirstUrl(item.image_url) ||
    getFirstUrl(item.large_image_url) ||
    getFirstUrl(item.middle_image_url) ||
    getFirstUrl(item.raw_data?.large_image_list) ||
    getFirstUrl(item.raw_data?.thumb_image_list) ||
    getFirstUrl(item.raw_data?.first_frame_image_list) ||
    getFirstUrl(item.raw_data?.video?.origin_cover)
  );
};

const getToutiaohaoPublicWorkDurationMs = (item: any): number => {
  const durationSecond = toNumber(
    item.video_duration ??
      item.display?.self_info?.video_duration ??
      item.raw_data?.video?.duration ??
      item.video?.duration,
  );
  return durationSecond > 0 ? durationSecond * 1000 : 0;
};

const getToutiaohaoPublicWorkPublishedAt = (item: any): string => {
  const value =
    item.publish_time ?? item.create_time ?? item.display_time ?? item.behot_time ?? item.raw_data?.publish_time;
  if (value !== undefined && value !== null) {
    return toStringValue(value);
  }
  const datetime = toStringValue(item.datetime);
  const dateTs = Date.parse(datetime);
  return Number.isFinite(dateTs) ? Math.floor(dateTs / 1000).toString() : '';
};

const parseToutiaohaoPublicWorkSearchCard = (
  card: ToutiaohaoPublicWorkSearchCard,
  contentType: ToutiaohaoPublicWorkSearchContentType,
): PlatformPublicWorkInfo | undefined => {
  const item = card?.data;
  if (
    !item ||
    (item.template_key !== 'video-undefined-default' && item.template_key !== '63-undefined' && item.cell_type !== 63)
  ) {
    return undefined;
  }
  const docid = toStringValue(
    item.group_id ?? item.id ?? item.item_id_str ?? item.raw_data?.group_id_str ?? item.raw_data?.item_id_str,
  );
  if (!docid) {
    return undefined;
  }
  const title = decodeToutiaoPublicWorkTitle(item);
  const tags = getToutiaohaoPublicWorkTags(item, title);
  const { category, extCategoryId } = getToutiaohaoPublicWorkCategory(item, tags);
  const durationMs = getToutiaohaoPublicWorkDurationMs(item);
  const author = parseToutiaohaoPublicWorkAuthor(item);
  return {
    platform_code: PublicAuthorPlatformCode.TouTiaoHao,
    docid,
    title,
    url: getToutiaohaoPublicWorkUrl(item, docid, contentType),
    cover_url: getToutiaohaoPublicWorkCover(item),
    content_type: contentType,
    category,
    ext_category_id: extCategoryId,
    ext_author_id: author.ext_author_id,
    author,
    published_at: getToutiaohaoPublicWorkPublishedAt(item),
    tags,
    metrics: {
      view: toNumber(item.play_count ?? item.read_count ?? item.raw_data?.action?.play_count),
      like: toNumber(item.digg_count ?? item.raw_data?.action?.digg_count),
      comment: toNumber(item.comment_count ?? item.raw_data?.action?.comment_count),
      share: toNumber(item.share_count ?? item.forward_count ?? item.raw_data?.action?.share_count),
    },
    video_info: {
      duration_ms: durationMs,
      download_url: getFirstUrl(item.raw_data?.video?.play_addr),
    },
  };
};

const decodeToutiaoPublicWorkTitle = (item: any): string => {
  return decodeToutiaohaoPublicWorkHtmlText(
    toStringValue(
      item.title ||
        item.raw_data?.title ||
        item.display?.title?.text ||
        item.emphasized?.title ||
        item.display?.emphasized?.title ||
        item.abstract,
    ),
  );
};

const parseToutiaohaoPublicWorkSearchHtmlResult = (
  html: string,
  contentType: ToutiaohaoPublicWorkSearchContentType = 'video',
): ToutiaohaoPublicWorkSearchParseResult => {
  const result: ToutiaohaoPublicWorkSearchParseResult = { dataList: [] };
  let htmlText = html;
  try {
    const response = JSON.parse(html) as {
      html?: string;
      hasMore?: number;
      rawData?: {
        has_more?: number;
        cur_page_num?: number;
        page_count?: number;
      };
    };
    if (response.html) {
      htmlText = response.html;
      result.hasMore = toNumber(response.hasMore ?? response.rawData?.has_more);
      result.curPageNum = toNumber(response.rawData?.cur_page_num);
      result.pageCount = toNumber(response.rawData?.page_count);
    }
  } catch (e) {
    htmlText = html;
  }

  const exists = new Set<string>();
  const cardReg =
    /<script\b(?=[^>]*data-druid-card-data-id=)(?=[^>]*type="application\/json")[^>]*>([\s\S]*?)<\/script>/g;
  let match: RegExpExecArray | null;
  while ((match = cardReg.exec(htmlText))) {
    try {
      const card = JSON.parse(match[1].trim()) as ToutiaohaoPublicWorkSearchCard;
      if (card.extraData) {
        result.hasMore = result.hasMore ?? toNumber(card.extraData.has_more);
        result.curPageNum = result.curPageNum ?? toNumber(card.extraData.curPageNum);
        result.pageCount = result.pageCount ?? toNumber(card.extraData.pageCount);
      }
      const work = parseToutiaohaoPublicWorkSearchCard(card, contentType);
      if (!work || exists.has(work.docid)) {
        continue;
      }
      exists.add(work.docid);
      result.dataList.push(work);
    } catch (e) {
      continue;
    }
  }
  return result;
};

export const parseToutiaohaoPublicWorkSearchHtml = (
  html: string,
  contentType: ToutiaohaoPublicWorkSearchContentType = 'video',
): Array<PlatformPublicWorkInfo> => {
  return parseToutiaohaoPublicWorkSearchHtmlResult(html, contentType).dataList;
};

export const getToutiaohaoPublicWorkSearchHtml = async (
  cookie: string | undefined,
  keyWord: string,
  contentType: ToutiaohaoPublicWorkSearchContentType = 'video',
  nextPage?: string,
  proxyAgent: HttpsProxyAgent<string> | object | undefined = undefined,
): Promise<string> => {
  const requestCookie = cookie?.trim() ? cookie : ToutiaohaoPublicWorkSearchDefaultCookie;
  const tab = getToutiaohaoPublicWorkSearchTab(contentType);
  const pageNum = Number(nextPage ?? 0) || 0;
  const params = new URLSearchParams({
    aid: '4916',
    pd: tab,
    page_num: pageNum.toString(),
    dvpf: 'pc',
    keyword: keyWord ?? '',
    source: pageNum > 0 ? 'pagination' : contentType === 'miniVideo' ? 'search_subtab_switch' : 'input',
    action_type: pageNum > 0 ? 'pagination' : contentType === 'miniVideo' ? 'search_subtab_switch' : 'pagination',
    from: tab,
    cur_tab_title: tab,
    enable_druid_v2: '1',
  });
  if (contentType === 'miniVideo' && pageNum > 0) {
    params.set('rawHTML', '1');
    params.set('start_index', pageNum.toString());
  }
  const url = `https://so.toutiao.com/search?${params.toString()}`;
  const result = await $http.get<unknown, AxiosResponse<string>>(url, {
    headers: {
      cookie: requestCookie,
      Host: 'so.toutiao.com',
      'User-Agent': ToutiaohaoPublicWorkSearchUserAgent,
      Accept:
        contentType === 'miniVideo' && pageNum > 0
          ? '*/*'
          : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': ToutiaohaoPublicWorkSearchAcceptLanguage,
      referer: `https://so.toutiao.com/search?aid=4916&pd=${tab}&page_num=0&dvpf=pc&keyword=${encodeURIComponent(
        keyWord ?? '',
      )}&source=input&action_type=pagination&from=${tab}&cur_tab_title=${tab}`,
      'Upgrade-Insecure-Requests': '1',
      'sec-ch-ua': ToutiaohaoPublicWorkSearchSecChUa,
      'sec-ch-ua-mobile': HttpConfig.sec_ch_ua_mobile,
      'sec-ch-ua-platform': HttpConfig.sec_ch_ua_platform,
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': contentType === 'miniVideo' && pageNum > 0 ? 'cors' : 'navigate',
      'Sec-Fetch-User': '?1',
      'Sec-Fetch-Dest': contentType === 'miniVideo' && pageNum > 0 ? 'empty' : 'document',
    },
    responseType: 'text',
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });
  syncToutiaohaoPublicWorkSearchResponseCookie(requestCookie, result.headers['set-cookie']);
  return result.data;
};

export const searchToutiaohaoPublicWorkList = async (
  keyWord: string,
  cookie?: string | undefined,
  nextPage?: string,
  proxy?: KuaiDaiLiProxy,
  contentType: ToutiaohaoPublicWorkSearchContentType = 'video',
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
  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const pageNum = Number(nextPage ?? 0) || 0;
    const html = await getToutiaohaoPublicWorkSearchHtml(cookie, keyWord, contentType, pageNum.toString(), webProxy);
    const parseResult = parseToutiaohaoPublicWorkSearchHtmlResult(html, contentType);
    result.dataList = parseResult.dataList;
    if (parseResult.hasMore && result.dataList.length > 0) {
      result.nextPage = ((parseResult.curPageNum ?? pageNum) + 1).toString();
    } else if (parseResult.pageCount && pageNum + 1 < parseResult.pageCount) {
      result.nextPage = (pageNum + 1).toString();
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = '请求头条号作品搜索失败';
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = '解析头条号作品搜索结果失败';
    } else {
      result.msg = '头条号作品搜索失败';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};
