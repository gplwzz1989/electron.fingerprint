import { WebContentsView } from 'electron';
import { PlatformAuthorizeConfig } from '../platform-authorize-config';
import { AccountInfoStructure } from '../type';
import dayjs from 'dayjs';

export class QiEHaoAuthorizeConfig extends PlatformAuthorizeConfig {
  authorizeUrl = 'https://om.qq.com/userAuth/index';
  entryUrl = 'https://om.qq.com/main';
  needHandleSessionCookie = true;

  initView(view: WebContentsView, _account: AccountInfoStructure | null): void {
    view.webContents.session.cookies.on('changed', async (_e, cookie) => {
      const webContents = view.webContents;
      if (webContents && cookie.expirationDate && cookie.expirationDate < dayjs().add(30, 'day').unix()) {
        const domain = cookie.domain || '';
        const cleanDomain = domain.startsWith('.') ? domain.substring(1) : domain;
        const url = `http${cookie.secure ? 's' : ''}://${cleanDomain}${cookie.path || '/'}`;

        void webContents.session.cookies
          .set({
            ...cookie,
            url: url,
            expirationDate: Number.MAX_SAFE_INTEGER,
          })
          .catch((e) => {
            console.error('set cookie error', e, cookie, {
              ...cookie,
              url: url,
              expirationDate: Number.MAX_SAFE_INTEGER,
            });
          });
      }
    });
  }
}
