import { logger } from '@/utils';
import { WechatTokenKeeper } from './wechat-token-keeper';

export class WechatTokenKeeperManager {
  private tokenKeepers: Map<string, WechatTokenKeeper> = new Map();

  constructor() {}

  startTokenKeeper(taskId: string, parentAccountId: string, token: string, authToken: string) {
    if (this.tokenKeepers.has(taskId)) {
      logger.info(`Token keeper for ${taskId} already exists.`);
      return;
    }

    const tokenKeeper = new WechatTokenKeeper(parentAccountId, token, authToken);
    this.tokenKeepers.set(taskId, tokenKeeper);
    tokenKeeper.start();
  }

  stopTokenKeeper(taskId: string) {
    const tokenKeeper = this.tokenKeepers.get(taskId);
    if (tokenKeeper) {
      tokenKeeper.stop();
      this.tokenKeepers.delete(taskId);
    } else {
      logger.info(`No token keeper found for ${taskId}.`);
    }
  }
}
