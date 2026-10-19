import $axios, { AxiosError, AxiosInstance, AxiosResponse, CreateAxiosDefaults } from 'axios';
import axiosRetry from 'axios-retry';
import * as http from 'http';
import * as https from 'https';
import { PubConfig } from './Config';
import { logger } from './utils';

const DEFAULT_HTTP_TIMEOUT = 200000;

type HttpAgentLike = {
  maxSockets?: number;
  sockets?: { readonly [key: string]: Array<unknown> | undefined };
  requests?: { readonly [key: string]: Array<unknown> | undefined };
  destroy: () => void;
};

export interface HttpSocketOriginStatus {
  agent: string;
  origin: string;
  activeConnections: number;
  waitingRequests: number;
}

export interface HttpSocketStatus {
  activeConnections: number;
  waitingRequests: number;
  congestedOrigins: Array<HttpSocketOriginStatus>;
}

const managedHttpAgents = new Set<HttpAgentLike>();
const persistentHttpAgents = new Set<HttpAgentLike>();

const toHttpAgent = (agent: unknown): HttpAgentLike | undefined => {
  if (agent && typeof agent === 'object' && typeof (agent as { destroy?: unknown }).destroy === 'function') {
    return agent as HttpAgentLike;
  }
  return undefined;
};

/**
 * 登记HTTP Agent，便于异常时统一清理连接
 */
export const registerHttpAgent = <T>(agent: T, persistent: boolean = false): T => {
  const httpAgent = toHttpAgent(agent);
  if (httpAgent) {
    managedHttpAgents.add(httpAgent);
    if (persistent) {
      persistentHttpAgents.add(httpAgent);
    }
  }
  return agent;
};

/**
 * 移除已完成请求使用的临时HTTP Agent
 */
export const unregisterHttpAgent = (agent: unknown): void => {
  const httpAgent = toHttpAgent(agent);
  if (httpAgent && !persistentHttpAgents.has(httpAgent)) {
    managedHttpAgents.delete(httpAgent);
  }
};

const getAgentOriginStatus = (agentName: string, agent: HttpAgentLike): Array<HttpSocketOriginStatus> => {
  const sockets = agent.sockets ?? {};
  const requests = agent.requests ?? {};
  const origins = new Set([...Object.keys(sockets), ...Object.keys(requests)]);
  return Array.from(origins).map((origin) => ({
    agent: agentName,
    origin,
    activeConnections: sockets[origin]?.length ?? 0,
    waitingRequests: requests[origin]?.length ?? 0,
  }));
};

/**
 * 中断进程内已登记HTTP Agent管理的所有连接
 */
export const destroyManagedHttpSockets = (): void => {
  let destroyedAgentCount = 0;
  for (const agent of managedHttpAgents) {
    try {
      agent.destroy();
      destroyedAgentCount += 1;
    } catch (error) {
      console.error('中断HTTP连接失败', error instanceof Error ? error.message : '未知错误');
    }
  }
  console.error(`HTTP连接监控已中断${destroyedAgentCount}个Agent的连接`);
};

registerHttpAgent(http.globalAgent, true);
registerHttpAgent(https.globalAgent, true);

export class HttpConfig {
  /**
   * 是否开启调试模式
   * @type {boolean}
   */
  static debug: boolean = false;

  /**
   * HTTP连接监控间隔
   */
  static socketMonitorIntervalMs: number = 60 * 1000;

  /**
   * 排队请求超过该数量时触发连接清理
   */
  static socketQueueThreshold: number = 20;

  /**
   * User Agent  需要保持和客户端统统一，客户端进程初始化时赋值一次
   * @type {string}
   */
  static userAgent: string =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36 Edg/116.0.1938.69';

  /**
   * Accept
   * @type {string}
   */
  static accept: string = '*/*';

  /**
   * Accept Encoding
   * @type {string}
   */
  static acceptEncoding: string = 'gzip,deflate,br';

  /**
   * Accept Language
   * @type {string}
   */
  static acceptLanguage: string = ' zh-CN,zh;q=0.9';

  // region 浏览器的一些信息

  /**
   *  需要保持和客户端统统一，客户端进程初始化时赋值一次
   */
  static sec_ch_ua: string = '"Microsoft Edge";v="117", "Not;A=Brand";v="8", "Chromium";v="117"';
  static sec_ch_ua_mobile: string = '?0';
  /**
   * 需要保持和客户端统统一，客户端进程初始化时赋值一次
   */
  static sec_ch_ua_platform: string = '"Windows"';

  static Sec_Fetch_Site: string = 'same-origin';
  static Sec_Fetch_Mode: string = 'cors';
  static Sec_Fetch_Dest: string = ' empty';

  // endregion
}

/**
 * 设置默认函数以确定响应的 HTTP 状态代码是否被视为有效.
 */
$axios.defaults.validateStatus = function (status: number) {
  // 服务端有相应时都不抛出异常
  return status >= 0 && status < 800;
};

/**
 * 创建一个axios实例
 * @param {CreateAxiosDefaults<unknown> | undefined} config
 * @return {AxiosInstance}
 */
const createHttpInstance = (config?: CreateAxiosDefaults<unknown> | undefined): AxiosInstance => {
  const httpsAgent = config?.httpsAgent ?? new https.Agent({ rejectUnauthorized: false });
  registerHttpAgent(config?.httpAgent);
  registerHttpAgent(httpsAgent);
  const usePubConfigHttpTimeout = config?.timeout === undefined;

  const instance: AxiosInstance = $axios.create({
    ...(config ?? {}),
    httpsAgent,
    adapter: 'http',
    // proxy: {
    //  host: '127.0.0.1',
    //  port: 8888,
    //  protocol: 'http:',
    // },
    headers: {
      // 全局默认信息，单个请求可自行修改
      'User-Agent': HttpConfig.userAgent,
      Accept: HttpConfig.accept,
      'Accept-Encoding': HttpConfig.acceptEncoding,
      'Accept-Language': HttpConfig.acceptLanguage,
      Connection: 'keep-alive',
      'sec-ch-ua': HttpConfig.sec_ch_ua,
      'sec-ch-ua-mobile': HttpConfig.sec_ch_ua_mobile,
      'Sec-Fetch-Site': HttpConfig.Sec_Fetch_Site,
      'Sec-Fetch-Mode': HttpConfig.Sec_Fetch_Mode,
      'Sec-Fetch-Dest': HttpConfig.Sec_Fetch_Dest,
    },
    // PubConfig imports the utility layer, which imports this module in turn.
    // Use the same default during cyclic module initialization; the getter below
    // continues to follow PubConfig.httpTimeout after initialization completes.
    timeout: config?.timeout ?? DEFAULT_HTTP_TIMEOUT,
  });

  if (usePubConfigHttpTimeout) {
    Object.defineProperty(instance.defaults, 'timeout', {
      configurable: true,
      enumerable: true,
      get: () => PubConfig.httpTimeout,
      set: (timeout: number) => {
        PubConfig.httpTimeout = timeout;
      },
    });
  }

  // 请求拦截器
  instance.interceptors.request.use(
    (config) => {
      registerHttpAgent(config.httpAgent);
      registerHttpAgent(config.httpsAgent);
      // 启用调试模式时打印请求信息
      if (HttpConfig.debug) {
        console.debug(`请求拦截器：${config.method?.toUpperCase()} ${config.url}`);
        //console.debug(JSON.stringify(config));
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  // 响应拦截器
  instance.interceptors.response.use(
    (response) => {
      unregisterHttpAgent(response.config?.httpAgent);
      unregisterHttpAgent(response.config?.httpsAgent);
      //代理异常
      if (response.status === 407) {
        throw new Error('代理认证失败');
      }
      if (response?.status === 408) {
        throw new Error('代理等待客户端数据超时');
      }
      // 根据重试条件确定是否应重试请求
      const isRetry = response.config?.retryCondition && response.config?.retryCondition(null, response);
      if (isRetry) {
        // 平台接口多半是返回了风控验证页、代理错误页或登录页，但响应体到这里就丢了，
        // 只留下「重试200」三个字，事后无从判断到底是哪一种。截一段留证。
        const retryCount = (response.config as { 'axios-retry'?: { retryCount?: number } })?.['axios-retry']
          ?.retryCount;
        console.error(
          `重试原因：${response.config?.method?.toUpperCase()} ${response.config?.url} - ${response.status} 第${
            retryCount ?? 0
          }次 body=${String(response.data).slice(0, 200)}`,
        );
        const error = new AxiosError(`重试${response?.status}`);
        error.config = response.config;
        error.response = response;
        throw error;
      }

      // 启用调试模式时打印响应信息
      if (HttpConfig.debug) {
        console.debug(
          `响应拦截器：${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}(${
            response.statusText
          })`,
        );
        console.debug(JSON.stringify(response.data));
      }

      return Promise.resolve(response);
    },
    (error) => {
      unregisterHttpAgent(error?.config?.httpAgent);
      unregisterHttpAgent(error?.config?.httpsAgent);
      return Promise.reject(error);
    },
  );

  /**
   * 自动重试
   */
  axiosRetry(instance, {
    // 重试次数
    retries: 2,
    // 延时重试
    retryDelay: (retryCount: number): number => {
      return retryCount * 1000;
    },
    shouldResetTimeout: true,
    // 重置请求超时时间
    retryCondition: (error): boolean => {
      console.error(`HTTP请求失败：${error?.message}`);

      // 自定义重试条件，例如仅在某些错误码下重试 || axiosRetry.isRetryableError(error)
      return error.message?.startsWith('重试') || axiosRetry.isNetworkError(error);
    },
    // 监听重试
    onRetry: (retryCount, error, requestConfig): void => {
      console.error(
        `HTTP请求失败，正在重试：${requestConfig.method?.toUpperCase()} ${requestConfig.url} - 第 ${retryCount} 次`,
      );
    },
  });

  return instance;
};

const $httpHttpAgent = registerHttpAgent(
  new http.Agent({ keepAlive: true }),
  true,
);
const $httpHttpsAgent = registerHttpAgent(
  new https.Agent({ rejectUnauthorized: false, keepAlive: true }),
  true,
);

const $http: AxiosInstance = createHttpInstance({
  httpAgent: $httpHttpAgent,
  httpsAgent: $httpHttpsAgent,
});
const $webhookHttpAgent = registerHttpAgent(new http.Agent({ keepAlive: true }), true);
const $webhookHttpsAgent = registerHttpAgent(
  new https.Agent({ rejectUnauthorized: false, keepAlive: true }),
  true,
);

const $webhookHttp: AxiosInstance = createHttpInstance({
  timeout: 5000,
  httpAgent: $webhookHttpAgent,
  httpsAgent: $webhookHttpsAgent,
});

const getHttpSocketStatus = (): HttpSocketStatus => {
  const origins = [
    ...getAgentOriginStatus('http', $httpHttpAgent),
    ...getAgentOriginStatus('https', $httpHttpsAgent),
  ];

  return {
    activeConnections: origins.reduce((total, item) => total + item.activeConnections, 0),
    waitingRequests: origins.reduce((total, item) => total + item.waitingRequests, 0),
    congestedOrigins: origins.filter((item) => item.waitingRequests > 0),
  };
};

const checkHttpSocketStatus = (): void => {
  const status = getHttpSocketStatus();
  if (status.waitingRequests <= HttpConfig.socketQueueThreshold) {
    return;
  }

  const details = status.congestedOrigins
    .map(
      (item) =>
        `${item.agent}://${item.origin} 活动连接${item.activeConnections}，排队请求${item.waitingRequests}`,
    )
    .join('; ');
  logger.error(
    `HTTP排队请求超过阈值，执行连接清理：活动连接数${status.activeConnections}，等待请求数${status.waitingRequests}，阈值${HttpConfig.socketQueueThreshold}，详情：${details}`,
  );
  destroyManagedHttpSockets();
};

let httpSocketMonitorTimer: ReturnType<typeof setInterval> | undefined;

export const startHttpSocketMonitor = (intervalMs: number = HttpConfig.socketMonitorIntervalMs): void => {
  if (httpSocketMonitorTimer) {
    return;
  }
  httpSocketMonitorTimer = setInterval(checkHttpSocketStatus, intervalMs);
  (httpSocketMonitorTimer as ReturnType<typeof setInterval> & { unref?: () => void }).unref?.();
};

export const stopHttpSocketMonitor = (): void => {
  if (!httpSocketMonitorTimer) {
    return;
  }
  clearInterval(httpSocketMonitorTimer);
  httpSocketMonitorTimer = undefined;
};

startHttpSocketMonitor();

// 扩展 Axios 属性
declare module 'axios' {
  export interface AxiosRequestConfig {
    /**
     * 重试条件
     * @return {boolean | Promise<boolean>}
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    retryCondition?: (error: AxiosError | null, response: AxiosResponse<any, any>) => boolean | Promise<boolean>;
  }
}

export { $http, $webhookHttp, createHttpInstance };
