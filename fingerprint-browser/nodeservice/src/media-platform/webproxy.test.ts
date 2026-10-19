import { describe, expect, it } from 'vitest';
import { createAppProxyAgent, createKuaiProxyAgent } from './webproxy';

describe('代理构造器', () => {
  const proxy = {
    serverAdd: '127.0.0.1',
    serverPort: 8080,
    userName: 'user',
    password: 'password',
  } as const;

  it('App 发布使用原生 URL 对象创建 HTTP 代理', () => {
    const agent = createAppProxyAgent(proxy);
    expect(agent).toBeDefined();
    expect(agent && 'hostname' in agent.proxy ? agent.proxy.hostname : '').toBe('127.0.0.1');
  });

  it('App 发布使用原生 URL 对象创建 SOCKS 代理', () => {
    const agent = createAppProxyAgent({ ...proxy, type: 'socks5' });
    expect(agent).toBeDefined();
    expect(agent?.proxy?.host).toBe('127.0.0.1');
  });

  it('Web 发布继续使用原有代理构造器', () => {
    expect(() => createKuaiProxyAgent(proxy)).not.toThrow();
  });
});
