import { Platforms } from '@/service/datasync-service-manager';
import { PlatformAccountInfoResponse } from '../model/UIFormModel';
import { PubConfig } from '@/Config';
import { $http } from '@/http';
import { generateToken } from './taskService';
import { AccountService } from '@/service/account-browser-service';
import { logger } from '@/utils';
import pako from 'pako';

interface AccountToken {
  cookie: string;
  localStorage: object;
}

const getAccountToken = async (
  platform: Platforms,
  account: PlatformAccountInfoResponse,
  wxkey: string | null,
  authToken: string,
): Promise<AccountToken> => {
  try {
    if (account.parentId) {
      const tm = Date.now();

      if (!wxkey) throw new Error(`获取cookie失败:wxkey为空`);

      //获取Cookie
      const result = await $http.get<{ data: { cookie: string }; statusCode: number; message?: string }>(
        `${PubConfig.API_URL}/platform-accounts/${account.platformAccountId}/cookie`,
        {
          headers: {
            authToken: authToken,
            wxkey: wxkey,
            authorization: PubConfig.API_Token ? PubConfig.API_Token : generateToken(tm),
            timestamp: tm,
            'x-client': PubConfig.xClient,
          },
        },
      );
      if (result?.data?.statusCode === 0) {
        let cookie = JSON.stringify([
          {
            name: 'sessionid',
            value: encodeURIComponent(result.data.data.cookie),
            sameSite: 'unspecified',
          },
        ]);
        // 检查cookie是否有效
        const accountService = new AccountService(cookie, platform);
        const checkResult = await accountService.checkAccountAlive();
        if (checkResult !== 1) {
          logger.info(account.platformAccountId + `:微信cookie需要刷新`);
          const refreshResult = await $http.post<{ data: { cookie: string }; statusCode: number; message?: string }>(
            `${PubConfig.API_URL}/platform-accounts/${account.platformAccountId}/cookie-refresh`,
            wxkey,
            {
              headers: {
                authToken: authToken,
                wxkey: wxkey,
                authorization: PubConfig.API_Token ? PubConfig.API_Token : generateToken(tm),
                timestamp: tm,
                'x-client': PubConfig.xClient,
              },
            },
          );
          if (refreshResult?.data?.statusCode !== 0) {
            throw new Error(refreshResult.data?.message ?? `刷新cookie失败:${JSON.stringify(refreshResult.data)}`);
          }
          cookie = JSON.stringify([
            {
              name: 'sessionid',
              value: encodeURIComponent(refreshResult.data.data.cookie),
              sameSite: 'unspecified',
            },
          ]);
        }

        return { cookie: cookie, localStorage: {} };
      } else {
        throw new Error(result.data?.message ?? `获取cookie失败:${JSON.stringify(result.data)}`);
      }
    } else {
      const spaceUrl = `${PubConfig.API_URL}/storages/site-spaces/access-url?fileKey=${account.platformAccountSpaceId}_account_session`;

      const tm = Date.now();
      const headers = {
        authToken: authToken,
        authorization: PubConfig.API_Token ? PubConfig.API_Token : generateToken(tm),
        timestamp: tm,
        'x-client': PubConfig.xClient,
      };
      const result = await $http.get<{ data: string; statusCode: number; message?: string }>(spaceUrl, {
        headers: headers,
      });
      if (!result.data.data) {
        throw new Error(result.data?.message ?? `获取cookie失败:${result.status}`);
      }

      const cookieData = await $http.get(result.data.data, { responseType: 'arraybuffer' });
      if (cookieData.status != 200) {
        throw new Error(`获取oss-cookie失败:${cookieData.status}`);
      }

      const jsonString = pako.inflate(cookieData.data, { to: 'string' });
      const cookieRe = JSON.parse(jsonString);
      return {
        cookie: JSON.stringify(cookieRe.cookies),
        localStorage: cookieRe.localStorage,
      };
    }
  } catch (e) {
    const err = JSON.stringify(e) ?? '';
    logger.error(
      `获取媒体号:${account.platformAccountName} ${account.platformAccountSpaceId} cookie失败:${err.substring(
        0,
        1000,
      )}`,
    );
    throw new Error(`获取cookie异常失败:${err.substring(0, 1000)}`);
  }
};
