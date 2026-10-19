import { PlatformAuthorInfo } from '@/media-platform';
import { AxiosError } from 'axios';
import { errorCode } from '@/media-platform/errorCode';
import { getDeepSeekUserInfo } from './deepseek-user.service';
import { KuaiDaiLiProxy } from '@/media-platform/webproxy';

/**
 * 获取DeepSeek用户信息
 * @param cookie Cookie字符串
 * @param proxy 代理配置（可选）
 * @returns 平台用户信息
 */
export const getDeepseekUserInfo = async (cookie: string, proxy?: KuaiDaiLiProxy): Promise<PlatformAuthorInfo> => {
  const result: PlatformAuthorInfo = {
    code: 0,
    msg: '',
  };

  try {
    const response = await getDeepSeekUserInfo(cookie, proxy);

    const userData = response?.data?.biz_data;

    result.code = response?.code ?? -1;
    result.msg = response?.msg;
    // 映射用户信息
    result.yixiaoerId = userData?.id;
    result.yixiaoerName = userData?.mobile_number || userData?.email || userData?.id; // 使用手机号或邮箱作为名称
    result.yixiaoerImageUrl = ''; // DeepSeek API 响应中没有头像信息
    result.raw = userData;
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
  }

  return result;
};
