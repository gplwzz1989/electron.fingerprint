import { EventEmitter } from 'events';
import fs from 'fs';
import crypto from 'crypto';
import { $http } from '../src/http';
import path from 'path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { PubConfig } from './Config';
import { AxiosResponseHeaders } from 'axios';
import buffer from 'buffer';

export const stepWaitTime = 3000;

export interface Cookie {
  name: string;
  value: string;
  domain?: string;
}

export const setCookie = (cookie: Cookie[] | string): string => {
  if (typeof cookie === 'object') {
    return convertCookie(cookie);
  }
  return cookie;
};

export const convertCookie = (cookies: Cookie[]): string => {
  for (const cookie of cookies) {
    if (/[\u4e00-\u9fa5]/.test(cookie.name) || /[\u4e00-\u9fa5]/.test(cookie.value)) {
      cookie.name = 'invalidNameCookie';
      cookie.value = encodeURIComponent(cookie.value);
    }
  }
  const result = cookies.map((x) => `${x.name}=${x.value}`);
  return result.join('; ');
};

export const convertCookieStr = (cookieStr: string, domain?: string, only?: boolean): string => {
  try {
    if (cookieStr?.trim()?.startsWith('[')) {
      const cookies: Array<Cookie> = JSON.parse(cookieStr);
      for (const cookie of cookies) {
        if (/[\u4e00-\u9fa5]/.test(cookie.name) || /[\u4e00-\u9fa5]/.test(cookie.value)) {
          cookie.name = 'invalidNameCookie';
          cookie.value = encodeURIComponent(cookie.value);
        }
      }
      if (domain) {
        if (only === true) {
          return cookies
            ?.filter((m) => m.domain === domain)
            ?.map((m) => `${m.name}=${m.value}`)
            ?.join(';');
        } else {
          return cookies
            ?.filter((m) => m.domain?.includes(domain))
            ?.map((m) => `${m.name}=${m.value}`)
            ?.join(';');
        }
      } else {
        return cookies?.map((m) => `${m.name}=${m.value}`)?.join(';');
      }
    } else if (typeof cookieStr === 'object') {
      const cookies: Array<Cookie> = cookieStr as Array<Cookie>;
      if (!cookies) {
        logger.error(`Cookie异常 ${cookieStr}`);
      }
      return (cookieStr as Array<Cookie>)?.map((m) => `${m.name}=${m.value}`)?.join(';');
    } else {
      return cookieStr;
    }
  } catch (error) {
    return cookieStr;
  }
};

/**
 * Checks whether a given input is a valid JSON string.
 *
 * @param {any} input - The input to check.
 * @returns {boolean} - True if the input is a valid JSON string, false otherwise.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isJson = (input: any): boolean => {
  input = typeof input !== 'string' ? JSON.stringify(input) : input;

  try {
    input = JSON.parse(input);
  } catch (e) {
    return false;
  }

  if (typeof input === 'object' && input !== null) {
    return true;
  }

  return false;
};

/**
 * 是否正在以 Vitest 运行
 * @return {boolean}
 */
export const isVitest = (): boolean => {
  return true;
  //return import.meta.env.VITEST === 'true';
};

/**
 * 是否真实发送请求
 * @return {boolean}
 */
export const isRealSendRequest = (): boolean => {
  return process.env.VITEST_REAL_SEND_REQUEST === 'true';
};

export class Guid {
  public static NewGuid(): string {
    // noinspection SpellCheckingInspection
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

export const SetProgressEvent = (
  callback: EventEmitter,
  percent: number,
  msg: string,
  taskId: string,
  eventName: string = 'publishing',
): void => {
  return;
  if (!callback) throw 'callback不能为空';
  callback.emit(eventName, percent, msg, taskId);
};
export const SetProgressNewEvent = (
  callback: EventEmitter,
  publishStatus: publishStatusEnum,
  msg: string,
  taskId: string,
  totalParts: number = 0,
  uploadedParts: number = 0,
  needParts: boolean = false,
  eventName: string = 'progress',
): void => {
  if (!callback) {
    throw 'callback不能为空';
  }
  if (totalParts > 0 && !needParts) {
    return;
  }
  if (uploadedParts > totalParts) {
    uploadedParts = totalParts;
  }
  callback.emit(eventName, publishStatus, msg, taskId, uploadedParts, totalParts);
};
/**
 * 获取时间戳
 * @param len
 * @constructor
 */
export const GetTimeStamp = (len?: number): string => {
  if (len) {
    return Date.now().toString().substring(0, len);
  } else {
    return Date.now().toString();
  }
};

/**
 * 计算指定路径下文件的hash
 * @param path
 * @param algorithm
 * @param digestStr
 * @constructor
 */
export const GetMD5ByPathLike = async (
  path: string,
  algorithm: string = 'md5',
  digestStr: 'hex' | 'base64' | 'base64url' = 'hex',
): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const stream = fs.createReadStream(path);
    const fsHash = crypto.createHash(algorithm);

    stream.on('data', (data) => {
      fsHash.update(data);
    });

    stream.on('end', () => {
      const md5 = fsHash.digest(digestStr);
      return resolve(md5);
    });

    stream.on('error', (err) => {
      return reject(err);
    });
  });
};
export const GetMD5 = (
  data: string | buffer.Buffer,
  algorithm: string = 'md5',
  digestStr: 'hex' | 'base64' | 'base64url' = 'hex',
): string => {
  const fsHash = crypto.createHash(algorithm);

  fsHash.update(data);

  return fsHash.digest(digestStr);
};
/**
 * 内容审核状态
 */
export enum auditStatusEnum {
  /**
   * 发布成功
   */
  published = 0,

  /**
   * 审核中
   */
  inAudit = 1,

  /**
   * 审核失败
   */
  deny = 2,

  /**
   * 审核成功
   */
  auditSuccess = 3,

  /**
   * 草稿
   */
  draft = 4,

  /**
   *定时等待中
   */
  prePublish = 5,

  /**
   * 转码处理中
   */
  waitExecute = 7,

  /**
   * 用户撤回，下线，删除
   */
  customWithdrawn = 10,

  /**
   * 不适合公开
   */
  notSuitableForPublicity = 11,

  /**
   * 非公开的，进部分可见,仅自己可见,粉丝可见等
   */
  notPublic = 13,

  /**
   * 转码处理失败
   */
  executeFail = 14,
}

/**
 * 内容推送状态
 */
export enum publishStatusEnum {
  /**
   * 上传中
   */
  uploading = 0,

  /**
   * 上传失败
   */
  uploadFail = 1,

  /**
   * 上传成功
   */
  uploadSuccess = 2,

  /**
   * 推送中
   */
  pushing = 4,

  /**
   *推送失败
   */
  pushFail = 5,

  /**
   * 推送成功
   */
  pushSuccess = 6,
}

/**
 * 读取图片
 * @param filePath
 */
export const convertImageFileToBuffer = async (filePath: string): Promise<Buffer> => {
  // 网络图片
  if (filePath.startsWith('http')) {
    const result = await $http.get(filePath, {
      responseType: 'arraybuffer',
    });
    if (result.status > 204) {
      throw new Error(`文件下载失败:${result.status}:${filePath}`);
    }
    return result.data;
  } else {
    if (filePath?.startsWith('yi-file://')) {
      filePath = filePath.replace('yi-file://', '');
    }
    if (!fs.existsSync(filePath)) {
      throw new Error(`文件不存在:${filePath}`);
    }
    return await fs.promises.readFile(filePath);
  }
};

/**
 *
 * @param filePathOrUrl
 * @param inTypeStr 当前下载的类型
 */
export const readImageData = async (
  filePathOrUrl: string,
  inTypeStr: 'mp4' | 'jpeg' = 'jpeg',
): Promise<ImageDataInfo> => {
  const re: ImageDataInfo = { status: -1 };
  // 网络图片
  if (filePathOrUrl?.toLowerCase().startsWith('http')) {
    const result = await $http.get(filePathOrUrl, {
      responseType: 'arraybuffer',
    });
    re.status = result.status;
    if (result.status > 204) {
      throw new Error(`文件下载失败:${re.status}:${filePathOrUrl}`);
    }
    re.data = result.data;
    const typeStr = result.headers ? result.headers['content-type']?.toString() : '';
    if (typeStr?.includes('video') || typeStr?.includes('image')) {
      re.ext = typeStr.includes('/') ? typeStr.split('/')[1] : inTypeStr;
    } else {
      re.ext = inTypeStr === 'jpeg' ? 'jpeg' : 'mp4';
    }
    re.fileName = generateRandomFileName(5, re.ext ?? inTypeStr === 'jpeg' ? 'jpeg' : 'mp4');
  } else {
    if (filePathOrUrl?.startsWith('yi-file://')) {
      filePathOrUrl = filePathOrUrl.replace('yi-file://', '');
    }
    if (!filePathOrUrl || !fs.existsSync(filePathOrUrl)) {
      throw new Error(`文件不存在:${filePathOrUrl}`);
    }
    re.data = await fs.promises.readFile(filePathOrUrl, { flag: 'r' });
    re.status = 200;
    re.ext = path.extname(filePathOrUrl).replace('.', '');
    if (!re.ext) {
      re.ext = inTypeStr === 'jpeg' ? 'jpeg' : 'mp4';
    }
    re.fileName = path.basename(filePathOrUrl);
    if (!re.fileName?.includes('.')) {
      re.fileName = `${re.fileName}.${re.ext}`;
    }
  }
  if (!re?.data?.length || re?.data?.length < 100) {
    throw new Error(`文件过小:${re?.data?.length ?? 0}:${filePathOrUrl}`);
  }
  return re;
};

export interface ImageDataInfo {
  /**
   * 二进制数据
   */
  data?: Buffer;
  /**
   * 文件类型/后缀名不带.
   */
  ext?: string;
  /**
   * 状态码
   */
  status: number;

  fileName?: string;
}

/**
 * 延时等待
 */
export class Task {
  public static async Delay(delay: number = 0): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        return resolve();
      }, delay);
    });
  }
}

/**
 * 随机生成文件名
 * @param length 文件名长度
 * @param ext 文件后缀名
 */
export const generateRandomFileName = (length: number, ext: string): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomString = Array.from(
    { length: length },
    () => characters[Math.floor(Math.random() * characters.length)],
  ).join('');
  return `${randomString}.${ext}`;
};

export const getSignServerUrl = (
  platform:
    | 'baijiahao'
    | 'toutiaohao'
    | 'duoduo'
    | 'xiaohongshu'
    | 'kuaishou'
    | 'pipixia'
    | 'pipixia_new'
    | 'douyin'
    | 'wangyi'
    | 'doubao',
  index: number = 0,
): string => {
  const kuaishouPorts = ['5008', '5009', '5010', '5011'];
  const xiaohongshuPorts = ['5096'];
  const duoduoPorts = ['5084', '5085'];
  const baijiahaoPorts = ['5012'];
  const toutiaohaoPorts = ['5031', '5032'];
  const pipixiaPorts = ['5021', '5022'];
  const pipixiaNewPorts = ['5023'];
  const douyinPorts = ['5041', '5042'];
  const ddoubaoPorts = ['5071'];
  const wangyiPorts = ['5051', '5052'];
  const signUrl = 'http://qianming.yixiaoer.cn:';
  switch (platform) {
    case 'kuaishou':
      return `${signUrl}${kuaishouPorts[index % kuaishouPorts.length]}`;
    case 'douyin':
      return `${signUrl}${douyinPorts[index % douyinPorts.length]}`;
    case 'xiaohongshu':
      return `${signUrl}${xiaohongshuPorts[index % xiaohongshuPorts.length]}`;
    case 'duoduo':
      return `${signUrl}${duoduoPorts[index % duoduoPorts.length]}`;
    case 'baijiahao':
      return `${signUrl}${baijiahaoPorts[index % baijiahaoPorts.length]}`;
    case 'toutiaohao':
      return `${signUrl}${toutiaohaoPorts[index % toutiaohaoPorts.length]}`;
    case 'pipixia':
      return `${signUrl}${pipixiaPorts[index % pipixiaPorts.length]}`;
    case 'pipixia_new':
      return `${signUrl}${pipixiaNewPorts[index % pipixiaNewPorts.length]}`;
    case 'wangyi':
      return `${signUrl}${wangyiPorts[index % wangyiPorts.length]}`;
    case 'doubao':
      return `${signUrl}${ddoubaoPorts[index % ddoubaoPorts.length]}`;
  }
  return '';
};

/**
 * 排序查询字key=value
 */
export const sortQueryString = (queryStringList: Array<string>, ascending = true): string => {
  // 将查询字符串拆分为键值对数组
  const pairs = queryStringList.map((pair) => pair.split('='));

  // 按照键名进行排序
  pairs.sort((a, b) => {
    const comparison = a[0].localeCompare(b[0]);
    // 控制升序或降序
    return ascending ? comparison : -comparison;
  });

  // 将排序后的键值对数组重新组合成查询字符串
  const sortedQueryString = pairs.map((pair) => pair.join('=')).join('&');

  return sortedQueryString;
};

export const htmlDecode = (str: string): string => {
  let s = '';
  if (str.length == 0) return '';
  s = str.replace(/&amp;/g, '&');
  s = s.replace(/&lt;/g, '<');
  s = s.replace(/&gt;/g, '>');
  s = s.replace(/&nbsp;/g, ' ');
  s = s.replace(/&#39;/g, "'");
  s = s.replace(/&quot;/g, '"');
  s = s.replace(/<br\/>/g, '\n');

  return s;
};

export const htmlEncode = (str: string): string => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) {
    return '-';
  }
  if (num < 100000) {
    return num.toLocaleString();
  } else if (num < 100000000) {
    return (num / 10000).toFixed(2).replace(/\.00$/, '') + '万';
  } else {
    return (num / 100000000).toFixed(2).replace(/\.00$/, '') + '亿';
  }
};

export const formatNumberNo = (num: number | undefined | null): number => {
  if (num === undefined || num === null || isNaN(num)) {
    return 0;
  }
  return num;
};

export const adjustTimestampTo5Minutes = (timestamp) => {
  // 创建Date对象（10位时间戳是秒级，需要转为毫秒）
  const date = new Date(timestamp * 1000);

  // 获取当前分钟数
  const minutes = date.getMinutes();

  // 计算需要增加的分钟数，使其成为5的倍数
  const remainder = minutes % 5;
  const addMinutes = remainder === 0 ? 0 : 5 - remainder;

  // 增加相应的分钟数（转换为毫秒）
  const adjustedTime = date.getTime() + addMinutes * 60 * 1000;

  // 清除秒和毫秒部分，只保留到分钟
  const adjustedDate = new Date(adjustedTime);
  adjustedDate.setSeconds(0, 0);

  // 转换回10位时间戳（秒级）
  return Math.floor(adjustedDate.getTime() / 1000);
};

export class Random {
  Next(start: number, end: number): number {
    return parseInt(String(Math.random() * (end - start) + 1));
  }
}
/**
 * 日志记录兼容类
 */
export class Logger extends EventEmitter {
  public info(msg: string, params?: object) {
    console.log(msg, params);
  }
  public error(msg: string, params?: object) {
    console.log(msg, params);
  }
}
export let logger = new Logger();
export const createLogger = async () => {
  try {
    logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        // 自定义日志输出格式
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let metaString = '';
          if (Object.keys(meta).length > 0) {
            metaString = ` ${JSON.stringify(meta)}`;
          }
          return `[${timestamp}] ${level}: ${message}${metaString}\n`;
        }),
      ),
      transports: !PubConfig?.logPath
        ? [
            // 同时将日志输出到控制台
            new winston.transports.Console(),
          ]
        : [
            new DailyRotateFile({
              filename: path.join(PubConfig?.logPath ?? '', 'publish_service_%DATE%.log'),
              datePattern: 'YYYY-MM-DD',
              zippedArchive: false,
              maxSize: '3m',
              maxFiles: '7d',
              level: 'info',
            }),
            // 同时将日志输出到控制台
            new winston.transports.Console(),
          ],
    });
    logger.on('error', (err) => {
      console.error('Error writing log:', err);
    });
  } catch (e) {
    logger = new Logger();
    console.error('Error writing log:', e);
  }
};

export function convertToMinuteMultipleOf5(timestamp: number) {
  const date = new Date(timestamp);

  const minutes = date.getMinutes();

  let targetMinutes: number;

  targetMinutes = Math.round(minutes / 5) * 5;
  if (targetMinutes === 60) {
    date.setHours(date.getHours() + 1);
    targetMinutes = 0;
  }

  date.setMinutes(targetMinutes);
  date.setSeconds(0);
  date.setMilliseconds(0);

  return date.getTime();
}

export function parseSetCookie(headers: AxiosResponseHeaders): string {
  // 获取 set-cookie 字段，可能是单个字符串或字符串数组
  const setCookie = headers['set-cookie'];

  if (!setCookie) {
    return '';
  }

  // 统一转为数组处理
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];

  // 解析每个 cookie，只取 key=value 部分（忽略后面的属性）
  const parsedCookies = cookies.map((cookie) => {
    // 分割出 cookie 的键值对部分（第一个 ';' 之前的内容）
    const keyValue = cookie.split(';')[0].trim();
    return keyValue;
  });

  // 合并为单个字符串，用 ';' 分隔
  return parsedCookies.join(';');
}

export class UploadEmitGate {
  private lastEmitTime = 0;
  private lastEmitPercent = 0;

  constructor(
    private readonly fileSize: number,
    private readonly totalParts: number,
  ) {}

  shouldEmit(uploadedParts: number): boolean {
    const MB = 1024 * 1024;

    // 规则 1：大于 100MB，按时间
    if (this.fileSize > 100 * MB) {
      const now = Date.now();
      if (now - this.lastEmitTime >= 5000) {
        this.lastEmitTime = now;
        return true;
      }
      return false;
    }

    // 文件 ≤ 100MB
    const percent = uploadedParts / this.totalParts;

    // 规则 2：分片 > 10，按 10%
    if (this.totalParts > 10) {
      if (percent - this.lastEmitPercent >= 0.1 || percent >= 1) {
        this.lastEmitPercent = percent;
        return true;
      }
      return false;
    }

    // 规则 3：分片 ≤ 10，每次都 emit
    return true;
  }
}
