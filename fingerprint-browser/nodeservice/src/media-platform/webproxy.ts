import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

export interface IWebProxy {
  /**
   * 代理地址
   */
  serverAdd: string;

  /**
   * 代理端口
   */
  serverPort: number;

  /**
   * 用户名
   */
  userName?: string;

  /**
   * 密码
   */
  password?: string;

  /**
   *  代理类型 http或者socks
   */
  type?: 'http' | 'socks5' | 'socks4';
}

export interface KuaiDaiLiProxy extends IWebProxy {
  /**
   * 通道id
   */
  sid?: string;
  /**
   * 代理区域代码
   */
  area?: string;

  /**
   * 代理省份代码
   */
  province?: string;

  /**
   * 代理城市代码
   */
  city?: string;

  // /**
  //  * ip切换周期，分钟，支持0.25 0.5,1-30的整数，不带时默认为每次请求都更换ip
  //  */
  // changeMinute?: 0.25 | 0.5 | 1 | 2 | 3 | 5 | 7 | 10 | 15 | 20 | 25 | 30;
}

export interface ProxyAgentOptions {
  /**
   * 以原生 WHATWG URL 对象传给代理库。
   * App 发布包的构建产物可能没有注入 Node 的 url 模块，使用 URL 对象可绕过代理库内部的 URL 构造路径。
   */
  useNativeUrl?: boolean;
}

/**
 * 创建快代理客户端
 * @param proxyParams
 * @param changeTime
 */
export const createKuaiProxyAgent = (
  proxyParams: KuaiDaiLiProxy,
  changeTime?: 0 | 0.25 | 0.5 | 1 | 2 | 3 | 5 | 7 | 10 | 15 | 20 | 25 | 30,
  options: ProxyAgentOptions = {},
): HttpsProxyAgent<string> | SocksProxyAgent | undefined => {
  if (!proxyParams?.serverPort || !proxyParams?.serverPort) {
    return undefined;
  }
  if (!proxyParams?.type) {
    proxyParams.type = 'http';
  }
  const args: Array<string> =
    proxyParams.type === 'http'
      ? [`http://`]
      : proxyParams.type?.startsWith('socks')
      ? [`${proxyParams.type}://`]
      : ['socks5://'];
  if (proxyParams.userName) {
    args.push(`${proxyParams.userName}`);
    if (proxyParams.area) {
      args.push(`-area-${proxyParams.area}`);
    }
    if (proxyParams.province) {
      args.push(`-prov-${proxyParams.province}`);
    }
    if (proxyParams.city) {
      args.push(`-city-${proxyParams.city}`);
    }
    if (changeTime) {
      args.push(`-period-${changeTime}`);
    }
    if (proxyParams.sid) {
      args.push(`-sid-${proxyParams.sid}`);
    }
    args.push(`:${proxyParams.password ?? ''}`);
  }
  if (args?.length > 0) {
    args.push('@');
  }
  args.push(`${proxyParams.serverAdd}:${proxyParams.serverPort}`);
  const proxyUrl = args.join('');
  const proxyUri = options.useNativeUrl ? new globalThis.URL(proxyUrl) : proxyUrl;
  //console.log(proxyUrl);
  if (proxyParams.type?.startsWith('http')) {
    return new HttpsProxyAgent(proxyUri, { timeout: 20000 });
  } else {
    return new SocksProxyAgent(proxyUri, { timeout: 20000 });
  }
};

/**
 * App 发布专用代理构造器。
 * Web 调用继续使用 createKuaiProxyAgent 的原有字符串入参行为。
 */
export const createAppProxyAgent = (
  proxyParams: KuaiDaiLiProxy,
  changeTime?: 0 | 0.25 | 0.5 | 1 | 2 | 3 | 5 | 7 | 10 | 15 | 20 | 25 | 30,
): HttpsProxyAgent<string> | SocksProxyAgent | undefined => {
  return createKuaiProxyAgent(proxyParams, changeTime, { useNativeUrl: true });
};
