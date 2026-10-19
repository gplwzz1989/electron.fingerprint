import { WebContentsView } from 'electron';
import { PlatformAuthorizeConfig } from '../platform-authorize-config';
import { AccountInfoStructure } from '../type';

export class BaiJiaHaoAuthorizeConfig extends PlatformAuthorizeConfig {
  authorizeUrl = 'https://baijiahao.baidu.com/builder/theme/bjh/login';
  entryUrl = 'https://baijiahao.baidu.com/builder/rc/home';
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
