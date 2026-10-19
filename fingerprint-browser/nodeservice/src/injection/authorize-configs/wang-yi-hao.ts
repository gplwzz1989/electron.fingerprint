import { WebContentsView } from 'electron';
import { PlatformAuthorizeConfig } from '../platform-authorize-config';
import type { AccountInfoStructure } from '../type';

export class WangYiHaoAuthorizeConfig extends PlatformAuthorizeConfig {
  authorizeUrl = 'https://mp.163.com/login.html';
  entryUrl = 'https://mp.163.com/subscribe_v4/index.html#/';
  needHandleSessionCookie = true;

  initView(view: WebContentsView, _account: AccountInfoStructure | null): void {
    view.webContents.session.cookies.on('changed', async (_e, cookie) => {
      const webContents = view.webContents;
      if (cookie.session && webContents) {
        void webContents.session.cookies
          .set({
            ...cookie,
            url: webContents.getURL(),
            expirationDate: Number.MAX_SAFE_INTEGER,
          })
          .catch((e) => {
            console.error('set cookie error', cookie, {
              ...cookie,
              url: webContents.getURL(),
              expirationDate: Number.MAX_SAFE_INTEGER,
            });
          });
      }
    });
  }
}
