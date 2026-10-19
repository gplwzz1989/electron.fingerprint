import { WebContentsView } from 'electron';
import { PlatformAuthorizeConfig } from '../platform-authorize-config';
import type { AccountInfoStructure } from '../type';

export class SouHuHaoAuthorizeConfig extends PlatformAuthorizeConfig {
  authorizeUrl = 'https://mp.sohu.com/mpfe/v4/login';
  entryUrl = 'https://mp.sohu.com/mpfe/v4/contentManagement/first/page';
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
