import { WebContentsView } from 'electron';
import { PlatformAuthorizeConfig } from '../platform-authorize-config';
import type { AccountInfoStructure } from '../type';

/**
 * 淘宝光合网页端授权配置。
 *
 * 光合使用淘宝站内登录态，不走开放平台 OAuth。登录完成后会回跳到光合
 * 页面，后端再通过 queryPerson 校验 Cookie 是否仍然有效。
 */
export class TaoBaoGuangHeAuthorizeConfig extends PlatformAuthorizeConfig {
  // 使用独立的淘宝登录入口，让通用授权宿主能识别“登录页 -> 光合页面”的完成跳转。
  authorizeUrl =
    'https://login.taobao.com/havanaone/login/login.htm?bizName=taobao&sub=true&redirectURL=https%3A%2F%2Fcreator.guanghe.taobao.com%2Fpage';
  entryUrl = 'https://creator.guanghe.taobao.com/page';

  /** 淘宝登录过程中会产生 session cookie，需要在授权上下文中持久化。 */
  needHandleSessionCookie = true;

  initView(view: WebContentsView, _account: AccountInfoStructure | null): void {
    view.webContents.session.cookies.on('changed', async (_event, cookie) => {
      const webContents = view.webContents;
      const currentUrl = webContents?.getURL() || this.entryUrl;

      if (!cookie.session || !webContents || webContents.isDestroyed() || !currentUrl.startsWith('http')) {
        return;
      }

      try {
        await webContents.session.cookies.set({
          ...cookie,
          url: currentUrl,
          expirationDate: Number.MAX_SAFE_INTEGER,
        });
      } catch (error) {
        // 不输出 Cookie 内容，避免把登录凭证写入日志。
        console.error('淘宝光合 session cookie 持久化失败', error);
      }
    });
  }
}
