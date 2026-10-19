import { $http } from '@/http';
import { Task } from '@/utils';

const XHS_SIGN_ORIGIN = 'http://qianming.yixiaoer.cn:';
const XHS_SIGN_PORTS = ['5061', '5062', '5063'] as const;
const XHS_SIGN_PATH = '/Sign/GetSign';

let signIndex = 0;

export interface XhsRemoteSignResult {
  'X-s': string;
  'X-t': string | number;
  'X-S-Common'?: string;
  'X-Rap-Param'?: string;
  a1?: string;
}

interface XhsRemoteSignResponse {
  signature?: string;
}

const parseXhsRemoteSign = (signature: string): XhsRemoteSignResult => {
  const result = JSON.parse(signature.replace(/\\/g, '"')) as Partial<XhsRemoteSignResult> & {
    'x-rap-param'?: string;
  };
  if (!result['X-s'] || !result['X-t']) {
    throw new Error('小红书远端签名响应缺少X-s或X-t');
  }
  result['X-Rap-Param'] ??= result['x-rap-param'];
  return result as XhsRemoteSignResult;
};

/**
 * 调用现有小红书远端签名服务。该模块不包含平台域名、Cookie 或业务请求逻辑，
 * 可供小红书系的不同站点复用。
 */
export const getXhsRemoteSign = async (path: string, body?: string): Promise<XhsRemoteSignResult> => {
  let currentIndex = signIndex++;
  let lastError: unknown;

  for (let attempt = 0; attempt < XHS_SIGN_PORTS.length; attempt++) {
    try {
      const signItems = [path];
      if (body !== undefined) {
        signItems.push(encodeURIComponent(body));
      }

      const url = `${XHS_SIGN_ORIGIN}${XHS_SIGN_PORTS[currentIndex++ % XHS_SIGN_PORTS.length]}${XHS_SIGN_PATH}`;
      const requestData = {
        url: '',
        cookie: JSON.stringify(signItems),
        signType: 'browser',
        signCommand: 'newxiaohongshu',
      };

      let response = await $http.post<XhsRemoteSignResponse>(url, requestData);
      if (!response.data?.signature) {
        await Task.Delay(1000);
        response = await $http.post<XhsRemoteSignResponse>(url, requestData);
      }
      if (response.data?.signature) {
        return parseXhsRemoteSign(response.data.signature);
      }
      lastError = new Error('小红书远端签名服务未返回签名');
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(`获取小红书远端签名失败${lastError instanceof Error ? `：${lastError.message}` : ''}`);
};
