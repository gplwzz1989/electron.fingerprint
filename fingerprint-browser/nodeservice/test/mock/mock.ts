import { SetupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll } from 'vitest';

/**
 * 打扫Mock战场
 * @param server
 */
export const initMock = (server: SetupServer): void => {
  // 在所有测试之前启动服务器
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

  // 所有测试后关闭服务器
  afterEach(() => server.resetHandlers());

  // 每次测试后重置处理程序 `对测试隔离很重要`
  afterAll(() => server.close());
};
