import type { WebContentsView } from 'electron';
import type { AccountInfoStructure, BrowserContextIdentifier } from './type';

export abstract class PlatformAuthorizeConfig {
  /**
   * 新授权地址
   */
  abstract authorizeUrl: string;

  /**
   * 打开的入口地址
   */
  abstract entryUrl: string;

  /**
   * 是否需要处理session级别的cookie
   */
  needHandleSessionCookie: boolean = false;

  initView(_view: WebContentsView, _account: AccountInfoStructure | null) {
    // 默认不处理
  }

  waitForLoginFinish?(
    contextIdentifier: BrowserContextIdentifier,
    views: WebContentsView[],
    abortSignal: AbortSignal,
  ): Promise<void>;
}
