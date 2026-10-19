import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, test } from 'vitest';
import {
  createXiaodianLoginQrCode,
  getChannelsAuthorInfo,
  getChannelsSessionByXiaodianCredential,
  keepaliveXiaodianCredential,
  startXiaodianLoginPolling,
} from '../../../src/media-platform/shipinhao/xiaodian-login';
import type {
  XiaodianAuthorizationResult,
  XiaodianChannelsSessionResult,
  XiaodianCredentialDynamicParams,
  XiaodianKeepaliveResult,
  XiaodianLoginPollingEventMap,
  XiaodianLoginQrCodeResult,
} from '../../../src/media-platform/shipinhao';

const manualLoginTimeoutMs = 150_000;
const loginDataFile = path.join(__dirname, '小店login.txt');

interface SavedXiaodianCredential extends XiaodianCredentialDynamicParams {
  /**
   * 小店登录 Cookie 字符串。
   */
  cookie?: string;
  /**
   * 小店登录 Cookie 字典。
   */
  cookies?: Record<string, string>;
  /**
   * 小店登录 Cookie 名称列表。
   */
  cookieNames?: string[];
}

interface SavedChannelsSession {
  /**
   * 小店跳转视频号的 externalCode。
   */
  externalCode?: string;
  /**
   * 视频号 sessionid。
   */
  sessionid?: string;
  /**
   * 视频号 Cookie 字符串。
   */
  cookie?: string;
  /**
   * 视频号 Cookie 字典。
   */
  cookies?: Record<string, string>;
  /**
   * 视频号 Cookie 名称列表。
   */
  cookieNames?: string[];
}

interface SavedLoginData extends Record<string, unknown> {
  /**
   * 微信小店登录凭据。
   */
  xiaodianCredential?: SavedXiaodianCredential;
  /**
   * 视频号登录凭据。
   */
  channelsSession?: SavedChannelsSession;
  /**
   * 小店 Cookie 与视频号 Cookie 拼接后的字符串。
   */
  mergedCookie?: string;
}

describe('【微信小店二维码登录真实测试】', () => {
  test(
    '获取二维码登录数据并输出扫码状态和登录成功回调',
    async () => {
      const qrCode = await createXiaodianLoginQrCode();
      const qrHtmlFile = writeQrCodeHtml(qrCode);

      console.log(`微信小店二维码登录会话：${qrCode.loginSessionId}`);
      console.log(`微信小店二维码 DataURL：${qrCode.qrcodeDataUrl}`);
      console.log(`请打开二维码 HTML 文件并在 2 分钟内扫码确认：${qrHtmlFile}`);

      expect(qrCode.loginSessionId).not.toBe('');
      expect(qrCode.qrTicket).not.toBe('');
      expect(qrCode.qrcodeDataUrl.startsWith('data:image/')).toBe(true);

      const authorization = await waitForAuthorizationByQrCode(qrCode);

      expect(authorization.channelsSession.sessionid).not.toBe('');
      expect(authorization.authorInfo.finderUsername).not.toBe('');
      expect(authorization.authorInfo.nickname).not.toBe('');
    },
    manualLoginTimeoutMs,
  );
});

describe('【微信小店后续接口真实测试】', () => {
  test(
    '使用小店 Cookie 换取视频号 sessionid',
    async () => {
      const { cookie, dynamicParams } = readSavedXiaodianCredentialInput();
      const channelsSession = await getChannelsSessionByXiaodianCredential(cookie, dynamicParams);

      console.log('视频号 sessionid 获取结果：', JSON.stringify(channelsSession, null, 2));
      expect(channelsSession.externalCode).not.toBe('');
      expect(channelsSession.sessionid).not.toBe('');
      expect(channelsSession.cookie).toContain('sessionid=');
      expect(channelsSession.xiaodianCredential.cookies).not.toEqual({});
      writeChannelsSessionLoginData(channelsSession);
    },
    manualLoginTimeoutMs,
  );

  test(
    '使用视频号 Cookie 获取作者信息',
    async () => {
      const channelsCookie = readSavedChannelsCookie();
      const authorInfo = await getChannelsAuthorInfo(channelsCookie);

      console.log('视频号作者信息获取结果：', JSON.stringify(authorInfo, null, 2));
      expect(authorInfo.finderUsername).not.toBe('');
      expect(authorInfo.uniqId).not.toBe('');
      expect(authorInfo.nickname).not.toBe('');
      expect(authorInfo.raw.code).toBe(0);
    },
    manualLoginTimeoutMs,
  );

  test(
    '使用小店 Cookie 保活',
    async () => {
      const { cookie, dynamicParams } = readSavedXiaodianCredentialInput();
      const keepaliveResult = await keepaliveXiaodianCredential(cookie, undefined);

      console.log('微信小店保活结果：', JSON.stringify(keepaliveResult, null, 2));
      expect(keepaliveResult.status).toBe(200);
      expect(keepaliveResult.cookie).toContain('=');
      expect(keepaliveResult.credential.cookies).not.toEqual({});
      expect(keepaliveResult.expireTime).not.toBeUndefined();
      expect(keepaliveResult.maxExpireTime).not.toBeUndefined();
      writeKeepaliveLoginData(keepaliveResult);
      console.log(`微信小店保活成功，已写回登录数据文件：${loginDataFile}`);
    },
    manualLoginTimeoutMs,
  );
});

function readSavedLoginData(): SavedLoginData {
  const text = fs.readFileSync(loginDataFile, 'utf8').replace(/^\uFEFF/, '').trim();
  if (!text) throw new Error(`小店登录数据文件为空：${loginDataFile}`);
  const data = JSON.parse(text) as unknown;
  if (!isRecord(data)) throw new Error(`小店登录数据文件格式不正确：${loginDataFile}`);
  return data as SavedLoginData;
}

function readSavedXiaodianCredentialInput(): {
  cookie: string;
  dynamicParams: XiaodianCredentialDynamicParams;
} {
  const loginData = readSavedLoginData();
  const credential = loginData.xiaodianCredential;
  if (!credential?.cookie) throw new Error(`小店登录数据缺少 xiaodianCredential.cookie：${loginDataFile}`);
  return {
    cookie: credential.cookie,
    dynamicParams: {
      loginType: credential.loginType,
      bizId: credential.bizId,
      nickname: credential.nickname,
      kfOpenId: credential.kfOpenId,
      pcappUuid: credential.pcappUuid,
      isTalent: credential.isTalent,
      headimg: credential.headimg,
      raw: credential.raw,
    },
  };
}

function readSavedChannelsCookie(): string {
  const loginData = readSavedLoginData();
  const cookie = loginData.channelsSession?.cookie;
  if (!cookie) throw new Error(`小店登录数据缺少 channelsSession.cookie：${loginDataFile}`);
  return cookie;
}

function writeKeepaliveLoginData(keepaliveResult: XiaodianKeepaliveResult): void {
  const loginData = readSavedLoginData();
  const updatedLoginData: SavedLoginData = {
    ...loginData,
    xiaodianCredential: {
      ...loginData.xiaodianCredential,
      loginType: keepaliveResult.credential.loginType,
      bizId: keepaliveResult.credential.bizId,
      nickname: keepaliveResult.credential.nickname,
      kfOpenId: keepaliveResult.credential.kfOpenId,
      pcappUuid: keepaliveResult.credential.pcappUuid,
      isTalent: keepaliveResult.credential.isTalent,
      headimg: keepaliveResult.credential.headimg,
      raw: keepaliveResult.credential.raw,
      cookie: keepaliveResult.cookie,
      cookieNames: Object.keys(keepaliveResult.credential.cookies),
      cookies: keepaliveResult.credential.cookies,
    },
    keepalive: {
      status: keepaliveResult.status,
      expireTime: keepaliveResult.expireTime,
      maxExpireTime: keepaliveResult.maxExpireTime,
      savedAt: new Date().toISOString(),
      raw: keepaliveResult.raw,
    },
  };
  updatedLoginData.mergedCookie = [keepaliveResult.cookie, loginData.channelsSession?.cookie].filter(Boolean).join('; ');
  writeLoginData(updatedLoginData);
}

function writeChannelsSessionLoginData(channelsSession: XiaodianChannelsSessionResult): void {
  const loginData = readSavedLoginData();
  const updatedLoginData: SavedLoginData = {
    ...loginData,
    xiaodianCredential: {
      ...loginData.xiaodianCredential,
      loginType: channelsSession.xiaodianCredential.loginType,
      bizId: channelsSession.xiaodianCredential.bizId,
      nickname: channelsSession.xiaodianCredential.nickname,
      kfOpenId: channelsSession.xiaodianCredential.kfOpenId,
      pcappUuid: channelsSession.xiaodianCredential.pcappUuid,
      isTalent: channelsSession.xiaodianCredential.isTalent,
      headimg: channelsSession.xiaodianCredential.headimg,
      raw: channelsSession.xiaodianCredential.raw,
      cookie: channelsSession.xiaodianCredential.cookie,
      cookieNames: Object.keys(channelsSession.xiaodianCredential.cookies),
      cookies: channelsSession.xiaodianCredential.cookies,
    },
    channelsSession: {
      externalCode: channelsSession.externalCode,
      sessionid: channelsSession.sessionid,
      cookieNames: Object.keys(channelsSession.cookies),
      cookies: channelsSession.cookies,
      cookie: channelsSession.cookie,
    },
  };
  updatedLoginData.mergedCookie = [channelsSession.xiaodianCredential.cookie, channelsSession.cookie]
    .filter(Boolean)
    .join('; ');
  writeLoginData(updatedLoginData);
  console.log(`视频号 sessionid 获取成功，已写回登录数据文件：${loginDataFile}`);
}

function writeLoginData(loginData: SavedLoginData): void {
  fs.writeFileSync(loginDataFile, `${JSON.stringify(loginData, null, 2)}\n`, 'utf8');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function waitForAuthorizationByQrCode(qrCode: XiaodianLoginQrCodeResult): Promise<XiaodianAuthorizationResult> {
  return await new Promise<XiaodianAuthorizationResult>((resolve, reject) => {
    const controller = startXiaodianLoginPolling(qrCode.loginSessionId);
    const clean = (): void => {
      clearTimeout(safetyTimer);
      controller.stop();
    };
    const safetyTimer = setTimeout(() => {
      clean();
      reject(new Error('微信小店扫码授权超时，未在 2 分钟内确认登录'));
    }, manualLoginTimeoutMs - 5_000);

    controller.on('waiting', (event) => {
      console.log(`微信小店扫码状态：${event.message}，会话：${event.loginSessionId}，状态：${event.qrStatus}`);
    });
    controller.on('scanned', (event) => {
      console.log(`微信小店扫码状态：${event.message}，会话：${event.loginSessionId}，状态：${event.qrStatus}`);
    });
    controller.on('confirmed', (event) => {
      console.log(`微信小店扫码状态：${event.message}，会话：${event.loginSessionId}，状态：${event.qrStatus}`);
    });
    controller.on('loggedIn', (event) => {
      console.log(
        `微信小店已登录事件：${event.message}，会话：${event.loginSessionId}，账号数：${event.credentials.length}`,
      );
      console.log('微信小店已登录凭据信息：', JSON.stringify(event.credentials, null, 2));
    });
    controller.on('xiaodianCredential', (event) => {
      console.log(`微信小店登录凭据回调：${event.message}，账号数：${event.credentials.length}`);
      console.log('微信小店登录凭据回调信息：', JSON.stringify(event.credentials, null, 2));
    });
    controller.on('channelsSession', (event) => {
      console.log(`视频号 sessionid 回调：${event.message}，sessionid=${event.channelsSession.sessionid}`);
      console.log('视频号 sessionid 回调信息：', JSON.stringify(event.channelsSession, null, 2));
    });
    controller.on('authorInfo', (event) => {
      console.log(
        `视频号作者信息回调：${event.message}，作者：${event.authorInfo.nickname}，ID：${event.authorInfo.finderUsername}`,
      );
      console.log('视频号作者信息回调信息：', JSON.stringify(event.authorInfo, null, 2));
    });
    controller.on('authorized', (event) => {
      clean();
      const authorization = event.authorizations[0];
      if (!authorization) {
        reject(new Error('微信小店授权成功事件缺少授权结果'));
        return;
      }
      console.log(
        `微信小店登录成功回调：${event.message}，作者：${authorization.authorInfo.nickname}，视频号 ID：${authorization.authorInfo.finderUsername}`,
      );
      console.log('微信小店登录成功回调信息：', JSON.stringify(buildLoginSuccessLog(event, authorization), null, 2));
      resolve(authorization);
    });
    controller.on('failed', (event) => {
      clean();
      console.log(`微信小店登录失败回调：${event.reason}，${event.message}`);
      reject(new Error(`微信小店授权失败：${event.reason}，${event.message}`));
    });
    controller.on('timeout', (event) => {
      clean();
      console.log(`微信小店登录超时回调：${event.reason}，${event.message}`);
      reject(new Error(`微信小店授权超时：${event.reason}，${event.message}`));
    });
  });
}

function buildLoginSuccessLog(
  event: XiaodianLoginPollingEventMap['authorized'],
  authorization: XiaodianAuthorizationResult,
): Record<string, unknown> {
  return {
    loginSessionId: event.loginSessionId,
    status: event.status,
    qrStatus: event.qrStatus,
    message: event.message,
    xiaodianCredential: {
      loginType: authorization.xiaodianCredential.loginType,
      bizId: authorization.xiaodianCredential.bizId,
      nickname: authorization.xiaodianCredential.nickname,
      kfOpenId: authorization.xiaodianCredential.kfOpenId,
      pcappUuid: authorization.xiaodianCredential.pcappUuid,
      isTalent: authorization.xiaodianCredential.isTalent,
      cookie: authorization.xiaodianCredential.cookie,
      cookieNames: Object.keys(authorization.xiaodianCredential.cookies),
      cookies: authorization.xiaodianCredential.cookies,
    },
    channelsSession: {
      externalCode: authorization.channelsSession.externalCode,
      sessionid: authorization.channelsSession.sessionid,
      cookieNames: Object.keys(authorization.channelsSession.cookies),
      cookies: authorization.channelsSession.cookies,
      cookie: authorization.channelsSession.cookie,
    },
    mergedCookie: authorization.mergedCookie,
    mergedCookieJson: authorization.mergedCookieJson,
    mergedCookieHeader: authorization.mergedCookieHeader,
    authorInfo: {
      finderUsername: authorization.authorInfo.finderUsername,
      uniqId: authorization.authorInfo.uniqId,
      nickname: authorization.authorInfo.nickname,
      headImgUrl: authorization.authorInfo.headImgUrl,
    },
  };
}

async function waitForTimeoutEvent(loginSessionId: string): Promise<XiaodianLoginPollingEventMap['timeout']> {
  return await new Promise<XiaodianLoginPollingEventMap['timeout']>((resolve, reject) => {
    const controller = startXiaodianLoginPolling(loginSessionId);
    const safetyTimer = setTimeout(() => {
      controller.stop();
      reject(new Error('等待二维码轮询失败事件超时'));
    }, 12_000);

    controller.on('authorized', () => {
      clearTimeout(safetyTimer);
      controller.stop();
      reject(new Error('超时测试不应该完成授权'));
    });
    controller.on('waiting', (event) => {
      console.log(`微信小店等待扫码事件：${event.message}，会话：${event.loginSessionId}，状态：${event.qrStatus}`);
    });
    controller.on('scanned', (event) => {
      console.log(`微信小店已扫码事件：${event.message}，会话：${event.loginSessionId}，状态：${event.qrStatus}`);
    });
    controller.on('timeout', (event) => {
      clearTimeout(safetyTimer);
      controller.stop();
      console.log(`微信小店超时事件：${event.reason}，${event.message}`);
      resolve(event);
    });
    controller.on('failed', (event) => {
      console.log(`微信小店失败事件：${event.reason}，${event.message}`);
    });
  });
}

function writeQrCodeHtml(qrCode: XiaodianLoginQrCodeResult): string {
  const htmlFile = path.join(os.tmpdir(), `xiaodian-login-${qrCode.loginSessionId}.html`);
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>微信小店扫码登录</title>
</head>
<body style="font-family: sans-serif; text-align: center; padding: 32px;">
  <h1>微信小店扫码登录</h1>
  <p>请使用微信扫码，并在手机上确认登录。</p>
  <img src="${qrCode.qrcodeDataUrl}" alt="微信小店登录二维码" style="width: 280px; height: 280px;">
  <p>${qrCode.loginSessionId}</p>
</body>
</html>
`;
  fs.writeFileSync(htmlFile, html, 'utf8');
  return htmlFile;
}
