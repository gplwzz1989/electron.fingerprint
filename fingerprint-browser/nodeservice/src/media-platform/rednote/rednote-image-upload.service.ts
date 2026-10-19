import { HttpConfig, $http } from '@/http';
import { getXhsRemoteSign } from '@/media-platform/xhs-remote-sign.service';
import { createKuaiProxyAgent, IWebProxy } from '@/media-platform/webproxy';
import { convertImageFileToBuffer } from '@/utils';
import { Buffer } from 'buffer';
import { REDNOTE_CREATOR_ORIGIN } from './rednote-location.service';
import { replaceCookieA1 } from './rednote-signed-request.service';

export const REDNOTE_IMAGE_UPLOAD_PERMIT_PATH = '/api/media/v1/upload/creator/permit';

export interface RedNoteUploadPermitNode {
  fileIds: string[];
  token: string;
  expireTime?: number;
  qos?: number;
  cloudType?: number;
  uploadAddr: string;
  bucket?: string;
  region?: string;
  uploadId?: number | string;
  [key: string]: unknown;
}

export interface RedNoteUploadPermitResponse {
  code: number;
  success: boolean;
  msg?: string;
  data?: { uploadTempPermits?: RedNoteUploadPermitNode[] };
}

export interface RedNoteImageUploadResult {
  fileId: string;
  previewUrl: string;
  uploadNode: RedNoteUploadPermitNode;
}

export const getRedNoteImageUploadPermit = async (
  cookie: string,
  fileCount: number = 1,
  proxy?: IWebProxy,
  scene: 'image' | 'video' = 'image',
): Promise<RedNoteUploadPermitResponse> => {
  const query = `biz_name=spectrum&scene=${scene}&file_count=${Math.max(fileCount, 1)}&version=1&source=web`;
  const signedPath = `${REDNOTE_IMAGE_UPLOAD_PERMIT_PATH}?${query}`;
  const sign = await getXhsRemoteSign(signedPath);
  const proxyAgent = proxy ? createKuaiProxyAgent(proxy) : undefined;
  const response = await $http.get<RedNoteUploadPermitResponse>(`${REDNOTE_CREATOR_ORIGIN}${signedPath}`, {
    headers: {
      Accept: 'application/json, text/plain, */*',
      'Accept-Language': HttpConfig.acceptLanguage,
      Authorization: '',
      Cookie: replaceCookieA1(cookie, sign.a1),
      Referer: `${REDNOTE_CREATOR_ORIGIN}/publish/publish`,
      'User-Agent': HttpConfig.userAgent,
      'X-s': sign['X-s'],
      'X-t': sign['X-t'].toString(),
      'X-S-Common': sign['X-S-Common'] ?? '',
    },
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });
  return response.data;
};

/** 直接 PUT 完整图片；x-cos-security-token 使用 permit 节点中的 token。 */
export const uploadRedNoteImage = async (
  imageData: Buffer,
  uploadNode: RedNoteUploadPermitNode,
  proxy?: IWebProxy,
): Promise<RedNoteImageUploadResult> => {
  const fileId = uploadNode.fileIds?.[0];
  if (!fileId || !uploadNode.uploadAddr || !uploadNode.token) {
    throw new Error('RedNote图片上传凭证不完整');
  }
  const proxyAgent = proxy ? createKuaiProxyAgent(proxy) : undefined;
  const uploadOrigin = uploadNode.uploadAddr.startsWith('http')
    ? uploadNode.uploadAddr.replace(/\/$/, '')
    : `https://${uploadNode.uploadAddr.replace(/\/$/, '')}`;
  const response = await $http.put<string>(`${uploadOrigin}/${fileId}`, imageData, {
    headers: {
      Accept: '*/*',
      Authorization: '',
      Origin: REDNOTE_CREATOR_ORIGIN,
      Referer: `${REDNOTE_CREATOR_ORIGIN}/`,
      'User-Agent': HttpConfig.userAgent,
      'x-cos-security-token': uploadNode.token,
    },
    responseType: 'text',
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });
  const previewUrl = response.headers['x-ros-preview-url']?.toString() ?? response.data?.toString() ?? '';
  return { fileId, previewUrl, uploadNode };
};

export const uploadRedNoteImageFromPath = async (
  cookie: string,
  imagePathOrUrl: string,
  proxy?: IWebProxy,
): Promise<RedNoteImageUploadResult> => {
  const permit = await getRedNoteImageUploadPermit(cookie, 1, proxy);
  const uploadNode = permit.data?.uploadTempPermits?.[0];
  if (!uploadNode?.fileIds?.[0]) {
    throw new Error(`获取RedNote图片上传凭证失败：${permit.msg ?? ''}`);
  }
  const imageData = await convertImageFileToBuffer(imagePathOrUrl);
  return uploadRedNoteImage(imageData, uploadNode, proxy);
};
