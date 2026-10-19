import { PlatformAuthorizeConfig } from '../platform-authorize-config';
import type { BrowserContextIdentifier } from '../type';
import type { WebContentsView } from 'electron';

//等待对应名称的localStorage加载完成
export async function waitForLocalStorage<T extends Record<string, string>>(
  view: WebContentsView,
  names: string[],
  cancelToken: AbortSignal,
): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const checkLocalStorage = async () => {
      if (cancelToken.aborted) {
        reject(new Error('waitForLocalStorage canceled'));
        return;
      }
      const localStorage = await view.webContents.executeJavaScript(`
        (function() {
          const localStorageData = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
              const item = localStorage.getItem(key);
              if (item) localStorageData[key] = item;
            }
          }
          return localStorageData;
        })()
      `);
      if (names.every((name) => localStorage[name])) {
        resolve(
          names.reduce(
            (acc, name) => {
              acc[name] = localStorage[name];
              return acc;
            },
            {} as Record<string, string>,
          ) as T,
        );
      } else {
        setTimeout(checkLocalStorage, 500);
      }
    };
    checkLocalStorage();
  });
}

async function waitForLocalStorageDifferentFrom<T extends Record<string, string>>(
  view: WebContentsView,
  lastValues: Record<string, string>,
  cancelToken: AbortSignal,
): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const checkLocalStorage = async () => {
      if (cancelToken.aborted) {
        reject(new Error('waitForLocalStorageDifferentFrom canceled'));
        return;
      }
      const localStorage = await view.webContents.executeJavaScript(`
            (function() {
            const localStorageData = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key) {
                const item = localStorage.getItem(key);
                if (item) localStorageData[key] = item;
                }
            }
            return localStorageData;
            })()
        `);

      if (Object.keys(lastValues).every((name) => (localStorage[name] ?? null) !== lastValues[name])) {
        resolve(
          Object.keys(lastValues).reduce(
            (acc, name) => {
              acc[name] = localStorage[name];
              return acc;
            },
            {} as Record<string, string>,
          ) as T,
        );
      } else {
        setTimeout(checkLocalStorage, 500);
      }
    };
    checkLocalStorage();
  });
}

export class DouYinAuthorizeConfig extends PlatformAuthorizeConfig {
  authorizeUrl = 'https://creator.douyin.com/';
  entryUrl = 'https://creator.douyin.com/creator-micro/home';

  async waitForLoginFinish(
    contextIdentifier: BrowserContextIdentifier,
    views: WebContentsView[],
    abortSignal: AbortSignal,
  ) {
    const promises = views.map(async (view, index) => {
      console.log('waitForLoginFinish', view.webContents.getURL());
      const last_s_sdk_sign_data_key = await view.webContents.executeJavaScript(
        "localStorage.getItem('security-sdk/s_sdk_sign_data_key/web_protect')",
      );

      const timeoutPromise = new Promise<void>((resolve, reject) =>
        setTimeout(async () => {
          if (!abortSignal.aborted) {
            const s_sdk_crypt_sdk = await view.webContents.executeJavaScript(
              "localStorage.getItem('security-sdk/s_sdk_crypt_sdk')",
            );
            const s_sdk_sign_data_key = await view.webContents.executeJavaScript(
              "localStorage.getItem('security-sdk/s_sdk_sign_data_key/web_protect')",
            );
            if (s_sdk_crypt_sdk && s_sdk_sign_data_key) {
              resolve();
            } else {
              reject(
                new Error(
                  `视图 ${index} 超时：10秒内未找到localStorage键值s_sdk_crypt_sdk:${s_sdk_crypt_sdk} s_sdk_sign_data_key:${s_sdk_sign_data_key}`,
                ),
              );
            }
          }
        }, 10000),
      );

      const waitForKeysPromise = (async () => {
        try {
          // security-sdk/s_sdk_crypt_sdk登录后不变，只要求有就行了
          await waitForLocalStorage(view, ['security-sdk/s_sdk_crypt_sdk'], abortSignal);
          // security-sdk/s_sdk_sign_data_key/web_protect登录后会变，需要等待变化
          await waitForLocalStorageDifferentFrom(
            view,
            {
              'security-sdk/s_sdk_sign_data_key/web_protect': last_s_sdk_sign_data_key,
            },
            abortSignal,
          );
        } catch (error) {
          if (error instanceof Error) throw new Error(`视图 ${index} 等待键值失败: ${error.message}`);
        }
      })();

      try {
        await Promise.race([timeoutPromise, waitForKeysPromise]);
        console.log('waitForLoginFinish success');
        return true;
      } catch (error) {
        if (error instanceof Error) console.error(`视图 ${index} 登录失败:`, error.message);
        throw error; // 重新抛出错误以便收集
      }
    });

    const results = await Promise.allSettled(promises);

    if (results.some((p) => p.status === 'fulfilled')) {
      return;
    } else {
      // 收集所有失败原因
      const failureReasons = results
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map((r) => r.reason.message || '未知错误')
        .join('; ');

      throw new Error(`waitForLoginFinish 失败: ${failureReasons}`);
    }
  }
}
