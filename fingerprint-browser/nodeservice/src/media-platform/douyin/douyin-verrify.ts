import { BaseResult } from '@/media-platform/baseResult';
import { createKuaiProxyAgent, KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { ImageInfo, PublishResult } from '@/media-platform/baseModel';
import { logger, Task } from '@/utils';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { errorCode } from '@/media-platform/errorCode';
import {
  AuthDataOutput,
  getAuthKey,
  getSdkToken,
  ImagePartInfo,
  uploadCover,
  uploadedImageInfo,
} from './douyin-base.service';
import { getMediaUserInfo } from './douyin-user.service';
import { AxiosError } from 'axios';
import { buildDynamicPostData_v2, publishDynamicResponse } from './douyin-dynamic';
import { deleteContent } from './douyin-deletecontent.service';
import { checkByPassword, checkBySMSCode, publishVideoPostData, sendSMSCode } from './douyin-video.service';
import { sendDouyinAssistSmsCode, verifyDouyinAssistSmsCode } from './douyin-assist-sms.service';
import { getPublishVerifyMethods } from './douyin-publish-risk';

export { getPublishVerifyMethods } from './douyin-publish-risk';

export const sendVerifySmsCode = async (
  cookie: string,
  checkStr: string,
  sdkToken: string,
  proxy?: KuaiDaiLiProxy,
): Promise<BaseResult> => {
  const result: BaseResult = {
    code: errorCode.ok,
    msg: '',
  };
  try {
    if (!checkStr) {
      result.code = 400;
      result.msg = '请先检测账号是否需要验证';
      return result;
    }
    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    for (let i = 0; i < 3 && !sdkToken; i++) {
      sdkToken = await getSdkToken(cookie);
      if (sdkToken) {
        break;
      }
    }
    let collectionResult: { error_code?: number; description?: string; mobile?: string } | undefined;
    let legacyTimeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      const legacyController = new AbortController();
      const legacyTimeout = new Promise<undefined>((resolve) => {
        legacyTimeoutId = setTimeout(() => {
          legacyController.abort();
          resolve(undefined);
        }, 5000);
      });
      collectionResult = await Promise.race([
        sendSMSCode(cookie, sdkToken, checkStr, webProxy, legacyController.signal),
        legacyTimeout,
      ]);
    } catch {
      collectionResult = undefined;
    } finally {
      if (legacyTimeoutId) {
        clearTimeout(legacyTimeoutId);
      }
    }
    if (collectionResult?.mobile) {
      result.code = 0;
      result.msg = collectionResult.description ?? '';
      result.data = collectionResult.mobile as never;
      return result;
    }

    try {
      const assistResult = await sendDouyinAssistSmsCode(cookie, checkStr, {
        sdkToken,
        proxyAgent: webProxy,
      });
      result.code = assistResult.data?.mobile
        ? 0
        : assistResult.data?.error_code ?? collectionResult?.error_code ?? errorCode.data_error;
      result.msg = assistResult.data?.description ?? assistResult.message ?? collectionResult?.description ?? '';
      result.data = assistResult.data?.mobile as never;
    } catch {
      result.code = collectionResult?.error_code ?? errorCode.unknown_error;
      result.msg = collectionResult?.description ?? '短信验证码发送失败，请稍后重试';
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = '网络异常，短信验证码发送失败，请稍后重试';
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = '短信验证码发送失败，请稍后重试';
    } else {
      result.msg = '短信验证码发送失败，请稍后重试';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};

/**
 * 使用已经组装完成的发布数据恢复发布
 */
export const publishVerifiedPostData = async (
  cookie: string,
  publishType: 'video' | 'dynamic',
  postData: string,
  taskId: string,
  proxy?: KuaiDaiLiProxy,
): Promise<PublishResult> => {
  let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
  if (proxy?.serverAdd) {
    webProxy = createKuaiProxyAgent(proxy);
  }
  let sdkToken = '';
  for (let i = 0; i < 3 && !sdkToken; i++) {
    sdkToken = await getSdkToken(cookie);
  }

  const publishResult =
    publishType === 'video'
      ? await publishVideoPostData(cookie, sdkToken, postData, taskId, webProxy)
      : await publishDynamicResponse(cookie, sdkToken, postData, taskId, webProxy, undefined, true);
  return {
    code: publishResult.status_code,
    msg: publishResult.status_msg ?? (publishResult.status_code === 0 ? '' : '发布失败，请稍后重试'),
    taskId,
    publishId: publishResult?.item_id ?? publishResult?.aweme?.aweme_id?.toString(),
    checkStr: publishResult.checkStr,
    postData: publishResult.postData,
    verifyMethods: publishResult.checkStr ? getPublishVerifyMethods(publishResult.checkStr) : undefined,
  };
};

export const verifyPublish = async (
  cookie: string,
  type: 'password' | 'smscode',
  code_number: string,
  password: string,
  checkStr?: string,
  sdkToken?: string,
  proxy?: KuaiDaiLiProxy,
): Promise<BaseResult> => {
  const result: BaseResult = {
    code: errorCode.ok,
    msg: '',
  };
  try {
    if (!checkStr) {
      result.code = 400;
      result.msg = '请先检测账号是否需要验证';
      return result;
    }
    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    for (let i = 0; i < 3; i++) {
      sdkToken = await getSdkToken(cookie);
      if (sdkToken) {
        break;
      }
    }

    if (type === 'smscode') {
      if (Number(code_number) > 0) {
        let smsRe = '';
        try {
          smsRe = await checkBySMSCode(cookie, sdkToken ?? '', code_number, checkStr ?? '', webProxy);
        } catch {
          smsRe = '旧版发布验证失败';
        }
        if (smsRe) {
          try {
            smsRe = await verifyDouyinAssistSmsCode(cookie, checkStr, code_number, {
              sdkToken: sdkToken ?? '',
              proxyAgent: webProxy,
            });
          } catch {
            // 新版验证失败时保留旧版接口返回的错误，便于调用方识别原始失败原因
          }
        }
        result.code = smsRe ? 400 : 0;
        result.msg = smsRe;
      } else {
        result.code = 400;
        result.msg = '短信验证码只能为数字';
      }
    } else {
      if (!password) {
        result.code = 400;
        result.msg = '密码不能为空';
      } else {
        const passRe = await checkByPassword(cookie, sdkToken ?? '', password, checkStr ?? '', webProxy);
        result.code = passRe ? 400 : 0;
        result.msg = passRe;
      }
    }
  } catch (e) {
    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = '网络异常，发布验证失败，请稍后重试';
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = '发布验证失败，请检查后重试';
    } else {
      result.msg = '发布验证失败，请检查后重试';
      result.code = errorCode.unknown_error;
    }
  }
  return result;
};

export const getPublishCheckStr = async (
  cookie: string,
  localStorageStr: string | object,
  images: Array<ImageInfo>,
  sdkToken?: string,
  proxy?: KuaiDaiLiProxy,
): Promise<BaseResult> => {
  logger.info(`发布风控${Date.now()}`);

  const taskId = Date.now().toString();
  const result: BaseResult = {
    code: 0,
    msg: '',
  };
  try {
    let webProxy: HttpsProxyAgent<string> | object | undefined = undefined;
    if (proxy?.serverAdd) {
      webProxy = createKuaiProxyAgent(proxy);
    }
    const localStorage =
      typeof localStorageStr === 'string' && localStorageStr?.startsWith('{')
        ? JSON.parse(localStorageStr)
        : (localStorageStr as object);

    if (localStorage && localStorage['security-sdk/s_sdk_sign_data_key/web_protect']) {
      cookie = cookie.replace(/security-sdk\/s_sdk_sign_data_key\/web_protect=/g, 'droppedCookie=');
      cookie = cookie.replace(/security-sdk\/s_sdk_crypt_sdk/g, 'droppedCookie=');
    }
    if (
      !cookie.includes('security-sdk/s_sdk_crypt_sdk') ||
      !cookie.includes('security-sdk/s_sdk_sign_data_key/web_protect') ||
      !cookie.includes('bd_ticket_guard_client_data') ||
      !cookie.includes('sid_tt')
    ) {
      if (
        !localStorage ||
        !localStorage['security-sdk/s_sdk_crypt_sdk'] ||
        !localStorage['security-sdk/s_sdk_sign_data_key/web_protect']
      ) {
        result.code = errorCode.io_error;
        result.msg = '账号信息缺失，请重新授权此账号再试';
        logger.error('解除风控环境信息缺失：LocalStorage关键字段不完整');
        return result;
      } else if (!cookie.includes('bd_ticket_guard_client_data') || !cookie.includes('sid_tt')) {
        result.code = errorCode.io_error;
        result.msg = '账号信息缺失，请重新授权此账号再试';
        logger.error('解除风控环境信息缺失：Cookie关键字段不完整');
        return result;
      }
      cookie = `${cookie};security-sdk/s_sdk_crypt_sdk=${encodeURIComponent(
        localStorage['security-sdk/s_sdk_crypt_sdk'],
      )};security-sdk/s_sdk_sign_data_key/web_protect=${encodeURIComponent(
        localStorage['security-sdk/s_sdk_sign_data_key/web_protect'],
      )}`;
    }

    if (!(images?.length > 0)) {
      result.code = 2;
      result.msg = '最少需要一张图片';
      return result;
    }

    //最多只支持35张图片
    images = images.slice(0, 2);

    // region 准备发布上传前置数据

    // 获取sdkToken
    for (let i = 0; i < 3; i++) {
      sdkToken = await getSdkToken(cookie);
      if (sdkToken) {
        break;
      }
    }

    let userId = '';

    // 获取用户信息
    if (!userId) {
      let userInfo = await getMediaUserInfo(cookie);
      for (let i = 0; i < 3; i++) {
        userId = userInfo?.user?.uid;
        if (!userId) {
          if (i < 3 && userInfo?.status_code != 8) {
            userInfo = await getMediaUserInfo(cookie);
            continue;
          }
          result.code = userInfo.status_code;
          result.msg = userInfo.status_msg;
          logger.error(`风控解除获取用户信息失败，状态码:${userInfo?.status_code ?? -1}`);
          return result;
        } else {
          break;
        }
      }
    }

    const shopDraftId = '';

    // 获取上传认证参数
    const authData: AuthDataOutput = await getAuthKey(cookie);
    // endregion

    // region 上传图片
    const imgInfoList: Array<ImagePartInfo> = [];
    let processCount = 0;
    for (const img of images) {
      processCount++;
      for (let i = 0; i < 3; i++) {
        const imgInfo = await uploadCover(userId, img.pathOrUrl, authData, '', result as never);
        //成功
        if (imgInfo != null && imgInfo?.Result?.PluginResult?.length > 0) {
          imgInfoList.push(imgInfo?.Result?.PluginResult[0]);
          break;
        }
        //失败
        else {
          if (i < 3 - 1) {
            await Task.Delay(3000);
            continue;
          }
          result.code = result.code > 0 ? result.code : -1;
          result.msg = result.msg ? result.msg : `图片上传失败${img.pathOrUrl}`;
          logger.error(
            `风控解除图片上传失败 ${cookie} ${img.pathOrUrl} ${JSON.stringify(imgInfo)} ${JSON.stringify(result)}`,
          );
          return result;
        }
      }
    }
    // endregion

    // region 封面上传

    let uploadedCoverInfo: uploadedImageInfo | null = await uploadCover(
      userId,
      images[0].pathOrUrl,
      authData,
      taskId,
      result as never,
    );
    for (let i = 0; i < 3; i++) {
      if (uploadedCoverInfo == null || !(uploadedCoverInfo?.Result?.Results?.length > 0)) {
        if (i < 3 - 1) {
          uploadedCoverInfo = await uploadCover(userId, images[0].pathOrUrl, authData, taskId, result as never);
          continue;
        }

        result.code = -1;
        result.msg = result.msg
          ? result.msg
          : `解除风控封面上传失败:${uploadedCoverInfo?.ResponseMetadata?.Error?.Message ?? ''}`;
        logger.error(
          `解除风控封面上传失败 ${taskId} ${cookie} ${images[0].pathOrUrl} ${uploadedCoverInfo} ${JSON.stringify(
            result,
          )}`,
        );
        return result;
      }
      break;
    }
    if (uploadedCoverInfo == null) {
      result.code = -1;
      logger.error(
        `封面上传失败 ${taskId} ${cookie} ${images[0].pathOrUrl} ${uploadedCoverInfo} ${JSON.stringify(result)}`,
      );
      return result;
    }

    // endregion

    // region 组装并推送数据
    // 组装发布数据
    const postData = await buildDynamicPostData_v2(
      { title: '', text: 'verify', visibility_type: 0 } as never,
      uploadedCoverInfo,
      imgInfoList,
      shopDraftId,
      cookie,
    );

    const publishResult = await publishDynamicResponse(cookie, sdkToken ?? '', postData, taskId, webProxy, '', true);

    result.code = publishResult?.status_code ?? -1;
    result.msg = publishResult?.status_msg ?? '';
    result.data = publishResult?.checkStr as never;
    if (publishResult?.item_id) {
      deleteVerifyContent(cookie, publishResult.item_id);
    }
    return result;
    // endregion
  } catch (e) {
    // 统一异常失败处理
    result.code = -1;

    if (e instanceof AxiosError) {
      result.code = errorCode.request_error;
      result.msg = `网络异常:${e.message}`;
    } else if (e instanceof Error) {
      result.code = errorCode.data_error;
      result.msg = e.message;
    } else {
      result.msg = '发布失败，请查看详细错误信息';
    }
    logger.error(`抖音风控校验异常失败，状态码:${result.code}`);
  } finally {
  }
  return result;
};

const deleteVerifyContent = async (cookie: string, publishId: string): Promise<void> => {
  for (let i = 0; i < 3; i++) {
    try {
      const re = await deleteContent(cookie, publishId);
      if (re?.status_code === 0 || re?.status_code === 8) {
        return;
      }
      await Task.Delay(2000);
    } catch (e) {
      console.log((e as Error)?.message);
    }
  }
};
