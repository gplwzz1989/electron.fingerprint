import { PubConfig } from '@/Config';
import { $http } from '@/http';
import { generateToken } from '../task/taskService';
import { logger } from '@/utils';

export class WechatTokenKeeper {
  constructor(
    private parentAccountId: string,
    private token: string,
    private authToken: string,
  ) {}

  private abort: AbortController = new AbortController();

  async start() {
    try {
      while (!this.abort.signal.aborted) {
        // 发送心跳请求
        try {
          await this.sendHeartbeat();
          logger.info('心跳请求成功发送');
        } catch (error) {
          logger.error('发送心跳请求失败:', error as object);
          // 即使心跳失败也继续循环，不中断整个流程
        }

        // 如果在心跳请求后已经被取消，则退出循环
        if (this.abort.signal.aborted) break;

        // 等待10秒钟后再次发送心跳
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => {
            clearTimeout(timeout);
            resolve();
          }, 10000);

          // 如果等待过程中收到取消信号，清除定时器并立即继续
          this.abort.signal.addEventListener(
            'abort',
            () => {
              clearTimeout(timeout);
              resolve();
            },
            { once: true },
          );
        });
      }
    } finally {
      // 清理资源或记录日志
      logger.info('心跳服务已终止');
    }
  }

  async sendHeartbeat() {
    const tm = Date.now();
    await $http.put(
      `${PubConfig.API_URL}/platform-accounts/${this.parentAccountId}/wechat/keys/alive`,
      {},
      {
        headers: {
          authToken: this.authToken,
          wxkey: this.token,
          authorization: PubConfig.API_Token ? PubConfig.API_Token : generateToken(tm),
          timestamp: tm,
          'x-client': PubConfig.xClient,
        },
      },
    );
  }

  stop() {
    this.abort.abort();
  }
}
