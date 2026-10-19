import { PlatformAuthorInfo } from '@/media-platform';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';
import { getDouBaoIndexInfo } from './doubao-user.service';
import { KuaiDaiLiProxy } from '@/media-platform/webproxy';

export const getDoubaoUserInfo = async (cookie: string, proxy?: KuaiDaiLiProxy): Promise<PlatformAuthorInfo> => {
  const result: PlatformAuthorInfo = {
    code: 0,
    msg: '',
  };

  try {
    const userInfoHtml = await getDouBaoIndexInfo(cookie);
    if (!userInfoHtml) {
      result.code = 401;
      result.msg = '获取用户信息失败';
      return result;
    }

    const match = userInfoHtml.match(/window\._ROUTER_DATA\s*=\s*(.*?);?\s*<\/script>/);
    if (match && match[1]) {
      const userInfo = JSON.parse(match[1]);

      const accountInfoData =userInfo?.loaderData?.chat_layout?.chat_layout?.accountInfo?.data?? userInfo?.loaderData?.chat_layout?.accountInfo?.data;

      if (!accountInfoData?.user_id) {
        result.code = accountInfoData?.error_code ?? 401;
        result.msg = accountInfoData?.description;
        return result;
      }

      result.yixiaoerId = accountInfoData?.user_id?.toString();
      result.yixiaoerName = accountInfoData?.name;
      result.yixiaoerImageUrl = accountInfoData?.avatar_url;

      result.raw = userInfo;
      result.code = 0;

      if (!result?.yixiaoerId) {
        result.code = 401;
      }
    } else {
      result.code = 401;
      result.msg = '获取用户信息失败';
      return result;
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = e.message;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = e?.toString() ?? '';
      result.code = errorCode.unknown_error;
    }
    result.code = errorCode.exception;
  }
  return result;
};
