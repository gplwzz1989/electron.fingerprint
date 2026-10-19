import { PlatformAuthorizeConfig } from '../platform-authorize-config';
import type { BrowserContextIdentifier } from '../type';
import type { Cookie, Session, WebContentsView } from 'electron';
import { getRedNoteUserInfoResponse, isValidRedNoteUserInfo, REDNOTE_USER_INFO_URL } from '@/media-platform/rednote';

const serializeCookies = (cookies: Cookie[]): string =>
  cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join(';');

export class RedNoteAuthorizeConfig extends PlatformAuthorizeConfig {
  authorizeUrl = 'https://creator.rednote.com/login';
  entryUrl = 'https://creator.rednote.com/publish/publish';

  async waitForLoginFinish(
    _contextIdentifier: BrowserContextIdentifier,
    views: WebContentsView[],
    abortSignal: AbortSignal,
  ): Promise<void> {
    if (!views.length) {
      throw new Error('RedNote登录验证失败: 没有可用的授权页面');
    }

    return new Promise<void>((resolve, reject) => {
      const sessionViews = new Map<Session, WebContentsView>();
      views.forEach((view) => sessionViews.set(view.webContents.session, view));
      const validatingSessions = new Set<Session>();
      let settled = false;

      const cleanup = () => {
        sessionViews.forEach((_view, session) => {
          session.webRequest.onCompleted({ urls: [`${REDNOTE_USER_INFO_URL}*`] }, null);
        });
        abortSignal.removeEventListener('abort', onAbort);
      };

      const finish = (error?: Error) => {
        if (settled) return;
        settled = true;
        cleanup();
        error ? reject(error) : resolve();
      };

      const onAbort = () => finish(new Error('用户取消授权'));

      abortSignal.addEventListener('abort', onAbort, { once: true });
      if (abortSignal.aborted) {
        onAbort();
        return;
      }

      sessionViews.forEach((view, session) => {
        session.webRequest.onCompleted({ urls: [`${REDNOTE_USER_INFO_URL}*`] }, async (details) => {
          if (settled || validatingSessions.has(session) || details.statusCode !== 200) return;
          validatingSessions.add(session);
          try {
            // 请求完成后读取一次最新 Cookie，再主动请求用户接口进行最终验证。
            const cookies = await view.webContents.session.cookies.get({ url: this.entryUrl });
            const cookie = serializeCookies(cookies);
            if (!cookie) return;

            const result = await getRedNoteUserInfoResponse(cookie);
            if (isValidRedNoteUserInfo(result)) {
              finish();
            }
          } catch {
            // 页面可能仍处于登录或跳转阶段，单次验证失败时继续监听后续用户信息请求。
          } finally {
            validatingSessions.delete(session);
          }
        });
      });
    });
  }
}
