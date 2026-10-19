import { $http } from '@/http';
import buffer from 'buffer';
import FormData from 'form-data';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { Guid, parseSetCookie } from '@/utils';
import crypto from 'crypto';
import { getCsdnSign } from './csdn-base.service';

export const getCaSignatureNew = async ({
  method: t,
  url: e,
  appSecret: n,
  accept: r,
  date: o,
  contentType: i,
  params: s,
  headers: a,
}): Promise<string> => {
  // 初始化字符串 u，用于存储要进行签名的内容
  let u = '';

  // 处理 URL 中的参数
  if (!s || e.indexOf('?') === -1) {
    // 如果 params 为空，则将其初始化为空对象
    s = s || {};
  } else {
    // 从 URL 中提取参数并存储到 s 中
    s = (function (url) {
      const paramsObj = {};
      const matches = url.match(/[?&]([^=&#]+)=([^&#]*)/g);
      if (matches) {
        for (const match of matches) {
          const parts = match.split('=');
          const key = parts[0].substr(1);
          const value = decodeURIComponent(parts[1] ?? '');
          if (paramsObj[key]) {
            paramsObj[key] = [].concat(paramsObj[key], value as never);
          } else {
            paramsObj[key] = value;
          }
        }
      }
      return paramsObj;
    })(e);
    // 移除 URL 中的参数部分
    e = e.split('?')[0];
  }

  // 过滤掉参数对象中键为 "undefined" 的属性
  const c = {};
  if (s && Object.keys(s).length > 0) {
    Object.keys(s).forEach((key) => {
      if (key !== 'undefined') {
        c[key] = s[key];
      }
    });
  }
  s = c;

  // 拼接签名内容的前几行
  u += t + '\n';
  u += r + '\n';
  u += '\n';
  u += i + '\n';
  u += o + '\n';

  // 处理请求头，将 It 函数逻辑嵌入进来
  const filteredHeaders = {};
  for (const headerKey in a) {
    const lowerCaseKey = headerKey.toLowerCase();
    if (!lowerCaseKey.startsWith('x-ca-')) {
      continue;
    }
    const specialHeaders = ['x-ca-timestamp', 'x-ca-signature', 'x-ca-signature-headers', 'x-ca-key', 'x-ca-nonce'];
    if (specialHeaders.indexOf(lowerCaseKey) > -1) {
      filteredHeaders[lowerCaseKey] = a[headerKey];
    }
  }
  const l = Array.from(Object.keys(filteredHeaders)).sort();
  for (const key of l) {
    u += key + ':' + filteredHeaders[key] + '\n';
  }

  // 拼接 URL 和参数
  u += (function (url, params) {
    const sortedKeys = Array.from(Object.keys(params)).sort();
    let queryString = null;
    for (const key of sortedKeys) {
      let paramStr;
      if (params[key] !== undefined && params[key] !== '') {
        paramStr = key + '=' + params[key];
      } else {
        paramStr = key + params[key];
      }
      queryString = queryString ? queryString + '&' + paramStr : paramStr;
    }
    return queryString ? url + '?' + queryString : url;
  })(e.replace(/^(?=^.{3,255}$)(http(s)?:\/\/)?(www\.)?[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.csdn\.net)/, ''), s);

  const hmac = await crypto.createHmac('sha256', n);

  return await hmac.update(u).digest('base64');
};

export const getImageUploadArgs = async (cookie: string): Promise<CSDNImageUploadArgsResponse> => {
  const url = 'https://bizapi.csdn.net/resource-api/v1/image/direct/upload/signature';

  const xNonce = Guid.NewGuid();

  const tm = Date.now();

  const headers = {
    Accept: 'application/json, text/plain, */*',
    cookie: cookie,
    referer: 'https://mp.csdn.net/',
    origin: 'https://mp.csdn.net',
    'Content-type': 'application/json;charset=UTF-8',
    'X-Ca-Key': '260196572',
    'X-Ca-Nonce': xNonce,
    'X-Ca-Signature': '',
    'X-Ca-Signature-Headers': 'x-ca-key,x-ca-nonce,x-ca-timestamp',
    'x-Ca-Timestamp': tm,
  };

  const preData = {
    method: 'POST',
    url: url,
    appSecret: 't5PaqxVQpWoHgLGt7XPIvd5ipJcwJTU7',
    accept: headers.Accept,
    date: '',
    contentType: headers['Content-type'],
    params: undefined,
    headers: {
      'X-Ca-Key': headers['X-Ca-Key'],
      'X-Ca-Nonce': xNonce,
      'X-Ca-Timestamp': tm,
      'Content-Type': headers['Content-type'],
      common: { Accept: headers.Accept },
      delete: {},
      get: {},
      head: {},
      post: { 'Content-Type': 'application/json;charset=UTF-8' },
      put: { 'Content-Type': 'application/x-www-form-urlencoded' },
      patch: { 'Content-Type': 'application/x-www-form-urlencoded' },
    },
  };
  headers['X-Ca-Signature'] = await getCaSignatureNew(preData);

  const postData = { imageTemplate: 'standard', appName: 'direct_blog', imageSuffix: 'png' };

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

export interface CSDNImageUploadArgsResponse {
  /** 状态码，200 表示成功 */
  code: number;
  /** 响应消息，成功时为 "success" */
  msg: string;
  /** 额外消息，此处为 null */
  message: null;
  /** 核心数据对象（上传策略相关信息） */
  data: {
    /** 存储服务提供商（如 obs） */
    provider: string;
    /** 访问 ID */
    accessId: string;
    /** 上传策略（Base64 编码字符串） */
    policy: string;
    /** 签名信息 */
    signature: string;
    /** 存储目录 */
    dir: string;
    /** 过期时间戳 */
    expire: string;
    /** 存储服务主机地址 */
    host: string;
    /** 回调 URL */
    callbackUrl: string;
    /** 文件存储路径 */
    filePath: string;
    /** 回调请求体模板 */
    callbackBody: string;
    /** 回调请求体类型 */
    callbackBodyType: string;
    /** 自定义参数 */
    customParam: {
      /** 资源类型 */
      rtype: string;
      /** 水印信息 */
      watermark: string;
      /** 模板名称 */
      templateName: string;
      /** 文件路径 */
      filePath: string;
      /** 是否需要审核（1 表示需要） */
      isAudit: number;
      /** 图片应用标识 */
      'x-image-app': string;
      /** 类型 */
      type: string;
      /** 图片后缀 */
      'x-image-suffix': string;
      /** 用户名 */
      username: string;
    };
  };
}

export const covertImgFromUrl = async (cookie: string, imgUrl: string): Promise<CSDNImageConvertResponse> => {
  const url = 'https://bizapi.csdn.net/resource-api/v1/image/external/storage';

  const tm = Date.now();
  const xNonce = Guid.NewGuid();

  const headers = {
    Accept: 'application/json, text/plain, */*',
    cookie: cookie,
    referer: 'https://mp.csdn.net/',
    origin: 'https://mp.csdn.net',
    'Content-type': 'application/json;charset=UTF-8',
    'X-Ca-Key': '260196572',
    'X-Ca-Nonce': xNonce,
    'X-Ca-Signature': '',
    'X-Ca-Signature-Headers': 'x-ca-key,x-ca-nonce,x-ca-timestamp',
    'x-Ca-Timestamp': tm,
  };

  const preData = {
    method: 'POST',
    url: url,
    appSecret: 't5PaqxVQpWoHgLGt7XPIvd5ipJcwJTU7',
    accept: headers.Accept,
    date: '',
    contentType: headers['Content-type'],
    params: undefined,
    headers: {
      'X-Ca-Key': headers['X-Ca-Key'],
      'X-Ca-Nonce': xNonce,
      'X-Ca-Timestamp': tm,
      'Content-Type': headers['Content-type'],
      common: { Accept: headers.Accept },
      delete: {},
      get: {},
      head: {},
      post: { 'Content-Type': 'application/json;charset=UTF-8' },
      put: { 'Content-Type': 'application/x-www-form-urlencoded' },
      patch: { 'Content-Type': 'application/x-www-form-urlencoded' },
    },
  };

  headers['X-Ca-Signature'] = await getCaSignatureNew(preData);

  const postData = {
    art_id: '',
    uuid: Guid.NewGuid().toString().substring(0, 8),
    imgUrl: imgUrl,
    type: 'blog',
    rtype: 'article',
    isCrawler: 0,
    nocache: 2,
  };

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

export interface CSDNImageConvertResponse {
  /** 状态码，200 表示成功 */
  code: number;
  /** 响应消息，成功时为 "success" */
  msg: string;
  /** 额外消息，此处为 null */
  message: null;
  /** 图片资源数据 */
  data: {
    /** 唯一标识，此处为 null */
    uniqueId: null;
    /** 原始图片 URL */
    originUrl: string;
    /** 处理后的图片 URL */
    url: string;
    /** 缓存状态标识 */
    cache: number;
    /** 图片高度 */
    height: number;
    /** 图片宽度 */
    width: number;
    /** 内容类型（图片格式） */
    contentType: string;
    /** 内容大小（字节数） */
    contentLength: number;
  };
}

export const uploadImageResponse = async (
  cookie: string,
  imageData: buffer.Buffer,
  upArgs: CSDNImageUploadArgsResponse,
): Promise<CSDNImageUploadResponse> => {
  const url = upArgs?.data?.host ?? 'https://csdn-img-blog.oss-cn-beijing.aliyuncs.com/';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.csdn.net/',
    origin: 'https://mp.csdn.net',
  };

  const multiContentKeyValue = {};

  multiContentKeyValue['key'] = upArgs.data?.filePath;
  multiContentKeyValue['policy'] = upArgs.data?.policy;
  multiContentKeyValue['signature'] = upArgs.data?.signature;
  multiContentKeyValue['callbackBody'] = upArgs.data.callbackBody;
  multiContentKeyValue['callbackBodyType'] = upArgs.data?.callbackBodyType;
  multiContentKeyValue['callbackUrl'] = upArgs.data?.callbackUrl;
  multiContentKeyValue['AccessKeyId'] = upArgs.data?.accessId;
  multiContentKeyValue['x:rtype'] = upArgs.data?.customParam?.rtype;
  multiContentKeyValue['x:watermark'] = upArgs.data?.customParam?.watermark;
  multiContentKeyValue['x:templateName'] = upArgs.data?.customParam?.templateName;
  multiContentKeyValue['x:filePath'] = upArgs.data?.filePath;
  multiContentKeyValue['x:isAudit'] = upArgs.data?.customParam?.isAudit;
  multiContentKeyValue['x:x-image-app'] = upArgs.data?.customParam['x-image-app'];
  multiContentKeyValue['x:type'] = upArgs.data?.customParam?.type;
  multiContentKeyValue['x:x-image-suffix'] = upArgs.data?.customParam['x-image-suffix'];
  multiContentKeyValue['x:username'] = upArgs.data?.customParam['username'];

  const formData = new FormData();
  for (const key of Object.keys(multiContentKeyValue)) {
    formData.append(key, multiContentKeyValue[key]);
  }

  formData.append('file', imageData, { filename: `${Date.now()}.png`, contentType: 'image/png' });
  const result = await $http.post(url, formData, { headers: headers });

  return result.data;
};

export interface CSDNImageUploadResponse {
  /** 状态码，200 表示成功 */
  code: number;
  /** 响应消息，成功时为 "success" */
  msg: string;
  /** 图片相关数据 */
  data: {
    /** 图片主机域名 */
    hostname: string;
    /** 图片完整 URL */
    imageUrl: string;
    /** 图片宽度（字符串类型，可能包含非数字字符） */
    width: string;
    /** 图片对象的目标键值 */
    targetObjectKey: string;
    /** 图片后缀信息 */
    'x-image-suffix': string;
    /** 图片高度（字符串类型，可能包含非数字字符） */
    height: string;
  };
}

export const publishCSDNArticleResponse = async (
  cookie: string,
  postStr: object,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<CSDNArticlePublishResponse> => {
  const url = `https://bizapi.csdn.net/blog-console-api/v1/postedit/saveArticle`;

  const xNonce = Guid.NewGuid();

  const headers = {
    cookie: cookie,
    referer: 'https://mp.csdn.net/',
    origin: 'https://mp.csdn.net',
    Accept: 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'Accept-Encoding': 'gzip, deflate, br',
    'X-Ca-Key': '203803574',
    'X-Ca-Nonce': xNonce,
    'X-Ca-Signature': '',
    'X-Ca-Signature-Headers': 'x-ca-key,x-ca-nonce',
  };

  headers['X-Ca-Signature'] = await getCsdnSign(
    'POST',
    'https://bizapi.csdn.net/blog-console-api/v1/postedit/saveArticle',
    'application/json, text/plain, */*',
    '',
    headers['Content-Type'] ?? '',
    {},
    {
      'X-Ca-Key': '203803574',
      'X-Ca-Nonce': xNonce,
      'Content-Type': headers['Content-Type'],
      common: { Accept: headers.Accept },
      delete: {},
      get: {},
      head: {},
      post: { 'Content-Type': 'application/json;charset=UTF-8' },
      put: { 'Content-Type': 'application/x-www-form-urlencoded' },
      patch: { 'Content-Type': 'application/x-www-form-urlencoded' },
    },
  );

  const result = await $http.post(url, postStr, { headers: headers, httpsAgent: proxyAgent, httpAgent: proxyAgent });

  return result.data;
};

export interface CSDNArticlePublishResponse {
  /** 状态码，200 表示成功 */
  code: number;
  /** 追踪 ID，用于请求跟踪 */
  traceId: string;
  message: string;
  /** 响应消息，发布成功时为发布结果描述 */
  msg: string;
  /** 文章发布后的核心数据 */
  data: {
    /** 文章详情页 URL */
    url: string;
    /** 文章唯一标识 ID */
    article_id: number;
    /** 文章标题 */
    title: string;
    /** 文章描述内容 */
    description: string;
  };
}

export const checkRisk = async (cookie: string, userId: string): Promise<string> => {
  const url = 'https://passport.csdn.net/v1/api/user/risk/check';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.csdn.net/',
    origin: 'https://mp.csdn.net',
    Accept: 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'Accept-Encoding': 'gzip, deflate, br',
  };

  const postData = { username: userId, biz: 'blog', subBiz: 'article' };

  const result = await $http.post(url, postData, { headers: headers });
  const newCookie = parseSetCookie(result.headers as never);
  if (newCookie) {
    return newCookie?.includes('SESSION')
      ? `${cookie.replace('SESSION', 's_s')};${newCookie}`
      : `${cookie};${newCookie}`;
  } else {
    return cookie;
  }
};
