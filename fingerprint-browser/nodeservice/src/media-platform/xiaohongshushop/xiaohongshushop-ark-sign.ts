import { createHash } from 'crypto';

const X_S_BASE64_ALPHABET = 'A4NjFqYu5wPHsO0XTdDgMa2r1ZQocVte9UJBvk6/7=yRnhISGKblCWi+LpfE8xzm3';
const X_S_COMMON_BASE64_ALPHABET = 'ZmserbBoHQtNP+wOcza/LpngG8yJq42KWYj0DSfdikx3VT16IlUAFM97hECvuRX5';
const B1_RC4_KEY = 'xhswebmplfbt';
const CRC32_POLYNOMIAL = 0xedb88320;

export type XiaohongshushopArkPlatform = 'Android' | 'iOS' | 'Mac OS' | 'Linux' | 'Windows';

export interface XiaohongshushopArkSignContext {
  /**
   * localStorage 中 b1 的值，即当前浏览器指纹的 miniUa。
   */
  miniUa: string;
  /**
   * sessionStorage 中当前签名计数，默认值为 0。
   */
  signCount?: number;
  /**
   * localStorage 中 b1b1 的值，默认值为 1。
   */
  x0?: string;
  /**
   * 当前平台，浏览器端默认值为 Windows。
   */
  platform?: XiaohongshushopArkPlatform;
  /**
   * 13 位毫秒时间戳，未传时使用当前时间。
   */
  timestamp?: number;
}

export interface XiaohongshushopArkSignOptions extends XiaohongshushopArkSignContext {
  /**
   * a1 Cookie 的值。
   */
  a1: string;
}

export interface XiaohongshushopArkSignHeaders {
  'X-t': number;
  'X-s': string;
  'X-S-Common': string;
}

export type XiaohongshushopArkB1Value = string | number | boolean;

export interface XiaohongshushopArkB1Options {
  /**
   * 第一组环境检测结果，对应 x33。
   */
  environmentCheck1: XiaohongshushopArkB1Value;
  /**
   * 第二组环境检测结果，对应 x34。
   */
  environmentCheck2: XiaohongshushopArkB1Value;
  /**
   * 第三组环境检测结果，对应 x35。
   */
  environmentCheck3: XiaohongshushopArkB1Value;
  /**
   * window.history.length，对应 x36。
   */
  historyLength: XiaohongshushopArkB1Value;
  /**
   * 24 项自动化及浏览器一致性检测结果，对应 x37。
   */
  automationChecks: string | readonly XiaohongshushopArkB1Value[];
  /**
   * 39 项运行环境及浏览器能力检测结果，对应 x38。
   */
  runtimeChecks: string | readonly XiaohongshushopArkB1Value[];
  /**
   * 页面状态检测结果，对应 x39。
   */
  pageState: XiaohongshushopArkB1Value;
  /**
   * 指纹脚本版本，对应 x42；当前站点下发版本为 3.5.4。
   */
  sdkVersion: string;
  /**
   * Canvas 指纹结果或不支持原因，对应 x43。
   */
  canvasFingerprint: string;
  /**
   * 指纹生成时的毫秒时间戳，对应 x44。
   */
  timestamp: string | number;
  /**
   * 风险插件及运行容器检测结果，对应 x45。
   */
  riskEnvironment: string;
  /**
   * 布尔环境检测结果，对应 x46。
   */
  booleanEnvironmentCheck: XiaohongshushopArkB1Value;
  /**
   * 扩展环境信息，对应 x48。
   */
  extendedEnvironment: string;
  /**
   * 列表和类型摘要，对应 x49。
   */
  listTypeSummary: string;
  /**
   * 数值采样结果，对应 x50。
   */
  renderSamples: string | readonly XiaohongshushopArkB1Value[];
  /**
   * 第一组附加环境信息，对应 x51。
   */
  additionalEnvironment1: string;
  /**
   * 第二组附加环境信息，对应 x52。
   */
  additionalEnvironment2: string;
  /**
   * 页面初始化后新增的全局变量名称，对应 x82；没有采集结果时不写入明文。
   */
  globalVariableNames?: string | readonly string[];
  /**
   * 鼠标、触摸、键盘、页面状态和性能时序的行为摘要，对应 x84；没有采集结果时不写入明文。
   */
  behaviorSummary?: string;
}

export interface XiaohongshushopArkB1Payload {
  x33: string;
  x34: string;
  x35: string;
  x36: string;
  x37: string;
  x38: string;
  x39: string;
  x42: string;
  x43: string;
  x44: string;
  x45: string;
  x46: string;
  x48: string;
  x49: string;
  x50: string;
  x51: string;
  x52: string;
  x82?: string;
  x84?: string;
}

interface XsCommonPayload {
  s0: number;
  s1: string;
  x0: string;
  x1: string;
  x2: XiaohongshushopArkPlatform;
  x3: string;
  x4: string;
  x5: string;
  x6: string;
  x7: string;
  x8: string;
  x9: number;
  x10: number;
  x11: string;
}

const getPlatformCode = (platform: XiaohongshushopArkPlatform): number => {
  switch (platform) {
    case 'iOS':
      return 1;
    case 'Android':
      return 2;
    case 'Mac OS':
      return 3;
    case 'Linux':
      return 4;
    default:
      return 5;
  }
};

const getRequestPath = (url: string): string => {
  if (!/^https?:\/\//i.test(url)) {
    return url;
  }

  const parsedUrl = new URL(url);
  return `${parsedUrl.pathname}${parsedUrl.search}`;
};

const getBodyText = (data: unknown): string => {
  const dataType = Object.prototype.toString.call(data);
  if (dataType !== '[object Object]' && dataType !== '[object Array]') {
    return '';
  }

  return JSON.stringify(data);
};

const encodeCustomBase64 = (source: Uint8Array, alphabet: string, padding: string): string => {
  let result = '';

  for (let index = 0; index < source.length; index += 3) {
    const first = source[index];
    const hasSecond = index + 1 < source.length;
    const hasThird = index + 2 < source.length;
    const second = hasSecond ? source[index + 1] : 0;
    const third = hasThird ? source[index + 2] : 0;

    result += alphabet[first >> 2];
    result += alphabet[((first & 0x03) << 4) | (second >> 4)];
    result += hasSecond ? alphabet[((second & 0x0f) << 2) | (third >> 6)] : padding;
    result += hasThird ? alphabet[third & 0x3f] : padding;
  }

  return result;
};

const encryptRc4ToString = (source: string, key: string): string => {
  const state = Array.from({ length: 256 }, (_, index) => index);
  let stateIndex = 0;

  for (let index = 0; index < state.length; index++) {
    stateIndex = (stateIndex + state[index] + key.charCodeAt(index % key.length)) & 0xff;
    [state[index], state[stateIndex]] = [state[stateIndex], state[index]];
  }

  const result: string[] = [];
  let firstIndex = 0;
  let secondIndex = 0;

  for (let index = 0; index < source.length; index++) {
    firstIndex = (firstIndex + 1) & 0xff;
    secondIndex = (secondIndex + state[firstIndex]) & 0xff;
    [state[firstIndex], state[secondIndex]] = [state[secondIndex], state[firstIndex]];

    const keyByte = state[(state[firstIndex] + state[secondIndex]) & 0xff];
    result.push(String.fromCharCode(source.charCodeAt(index) ^ keyByte));
  }

  return result.join('');
};

const serializeB1List = (
  value: string | readonly XiaohongshushopArkB1Value[],
  separator: string,
): string => {
  return typeof value === 'string' ? value : value.map(String).join(separator);
};

/**
 * 将外部采集参数按指纹脚本的映射和固定字段顺序生成 b1 明文。
 */
export const getXiaohongshushopArkB1Payload = (
  options: XiaohongshushopArkB1Options,
): XiaohongshushopArkB1Payload => {
  const payload: XiaohongshushopArkB1Payload = {
    x33: String(options.environmentCheck1),
    x34: String(options.environmentCheck2),
    x35: String(options.environmentCheck3),
    x36: String(options.historyLength),
    x37: serializeB1List(options.automationChecks, '|'),
    x38: serializeB1List(options.runtimeChecks, '|'),
    x39: String(options.pageState),
    x42: options.sdkVersion,
    x43: options.canvasFingerprint,
    x44: String(options.timestamp),
    x45: options.riskEnvironment,
    x46: String(options.booleanEnvironmentCheck),
    x48: options.extendedEnvironment,
    x49: options.listTypeSummary,
    x50: serializeB1List(options.renderSamples, ','),
    x51: options.additionalEnvironment1,
    x52: options.additionalEnvironment2,
  };

  if (options.globalVariableNames !== undefined) {
    payload.x82 =
      typeof options.globalVariableNames === 'string'
        ? options.globalVariableNames
        : options.globalVariableNames.join('|');
  }
  if (options.behaviorSummary !== undefined) {
    payload.x84 = options.behaviorSummary;
  }

  return payload;
};

/**
 * 根据完整的指纹脚本采集结果生成 localStorage 中的 b1。
 */
export const getXiaohongshushopArkB1 = (options: XiaohongshushopArkB1Options): string => {
  const source = JSON.stringify(getXiaohongshushopArkB1Payload(options));
  const encrypted = encryptRc4ToString(source, B1_RC4_KEY);

  return encodeCustomBase64(Buffer.from(encrypted, 'utf8'), X_S_COMMON_BASE64_ALPHABET, '=');
};

const getCrc32 = (source: string): number => {
  let crc = -1;

  for (const byte of Buffer.from(source, 'utf8')) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (crc & 1 ? CRC32_POLYNOMIAL : 0);
    }
  }

  return (crc ^ -1 ^ CRC32_POLYNOMIAL) | 0;
};

const getXs = (path: string, data: unknown, timestamp: number): string => {
  const source = `${timestamp}test${path}${getBodyText(data)}`;
  const md5Hex = createHash('md5').update(source, 'utf8').digest('hex');
  return encodeCustomBase64(Buffer.from(md5Hex, 'utf8'), X_S_BASE64_ALPHABET, X_S_BASE64_ALPHABET[64]);
};

const getXsCommon = (options: XiaohongshushopArkSignOptions): string => {
  const platform = options.platform ?? 'Windows';
  const payload: XsCommonPayload = {
    s0: getPlatformCode(platform),
    s1: '',
    x0: options.x0 ?? '1',
    x1: '4.1.5-2',
    x2: platform,
    x3: 'noteark',
    x4: '1.1.86',
    x5: options.a1,
    x6: '',
    x7: '',
    x8: options.miniUa,
    x9: getCrc32(options.miniUa),
    x10: options.signCount ?? 0,
    x11: 'lite',
  };

  return encodeCustomBase64(Buffer.from(JSON.stringify(payload), 'utf8'), X_S_COMMON_BASE64_ALPHABET, '=');
};

/**
 * 生成 ark.xiaohongshu.com 请求使用的 X-t、X-s 和 X-S-Common。
 *
 * url 需要包含最终查询参数，data 需要保持与实际发送请求时相同的字段顺序。
 */
export const getXiaohongshushopArkSignHeaders = (
  url: string,
  data: unknown,
  options: XiaohongshushopArkSignOptions,
): XiaohongshushopArkSignHeaders => {
  const timestamp = options.timestamp ?? Date.now();
  const path = getRequestPath(url);

  return {
    'X-t': timestamp,
    'X-s': getXs(path, data, timestamp),
    'X-S-Common': getXsCommon(options),
  };
};

const getCookieValue = (cookie: string, name: string): string | undefined => {
  const cookieItem = cookie.split(';').find((item) => item.trim().startsWith(`${name}=`));
  return cookieItem?.trim().slice(name.length + 1) || undefined;
};

/**
 * 使用现有 Cookie 生成发布请求签名。
 */
export const getXiaohongshushopArkSignHeadersByCookie = (
  url: string,
  data: unknown,
  cookie: string,
  context?: Partial<XiaohongshushopArkSignContext>,
): XiaohongshushopArkSignHeaders => {
  const a1 = getCookieValue(cookie, 'a1');
  if (!a1) {
    throw new Error('签名失败：Cookie 中缺少 a1');
  }
  const miniUa = context?.miniUa ?? getCookieValue(cookie, 'b1')??'';
  if (!miniUa) {
    //throw new Error('签名失败：缺少浏览器指纹 b1');
  }
  const cookieSignCount = Number(getCookieValue(cookie, 'sc'));

  return getXiaohongshushopArkSignHeaders(url, data, {
    a1,
    miniUa,
    signCount: context?.signCount ?? (Number.isFinite(cookieSignCount) ? cookieSignCount : 0),
    x0: context?.x0 ?? getCookieValue(cookie, 'b1b1') ?? '1',
    platform: context?.platform,
    timestamp: context?.timestamp,
  });
};
