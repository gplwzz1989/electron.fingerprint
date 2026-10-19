import { HttpConfig, $http } from '@/http';
import { createKuaiProxyAgent, IWebProxy } from '@/media-platform/webproxy';
import crypto from 'crypto';
import fs from 'fs';
import { REDNOTE_CREATOR_ORIGIN } from './rednote-location.service';
import {
  getRedNoteImageUploadPermit,
  RedNoteUploadPermitNode,
  RedNoteUploadPermitResponse,
} from './rednote-image-upload.service';

export const REDNOTE_VIDEO_PART_SIZE = 5 * 1024 * 1024;

export const getRedNoteVideoUploadPermit = async (
  cookie: string,
  proxy?: IWebProxy,
): Promise<RedNoteUploadPermitResponse> => getRedNoteImageUploadPermit(cookie, 1, proxy, 'video');

const uploadUrl = (node: RedNoteUploadPermitNode, query: string): string => {
  const origin = node.uploadAddr.startsWith('http')
    ? node.uploadAddr.replace(/\/$/, '')
    : `https://${node.uploadAddr.replace(/\/$/, '')}`;
  return `${origin}/${node.fileIds[0]}?${query}`;
};

const uploadConfig = (node: RedNoteUploadPermitNode, proxy?: IWebProxy) => {
  const proxyAgent = proxy ? createKuaiProxyAgent(proxy) : undefined;
  return {
    headers: {
      Accept: '*/*',
      'Accept-Language': HttpConfig.acceptLanguage,
      Authorization: '',
      Origin: REDNOTE_CREATOR_ORIGIN,
      Referer: `${REDNOTE_CREATOR_ORIGIN}/`,
      'User-Agent': HttpConfig.userAgent,
      'x-cos-security-token': node.token,
    },
    responseType: 'text' as const,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  };
};

export const createRedNoteMultipartUpload = async (
  node: RedNoteUploadPermitNode,
  proxy?: IWebProxy,
): Promise<string> => {
  const response = await $http.post<string>(uploadUrl(node, 'uploads'), '', uploadConfig(node, proxy));
  const uploadId = response.data?.match(/<UploadId>([^<]+)<\/UploadId>/)?.[1];
  if (!uploadId) throw new Error(`RedNote获取视频UploadId失败：${response.data ?? ''}`);
  return uploadId;
};

export const uploadRedNoteVideoPart = async (
  node: RedNoteUploadPermitNode,
  uploadId: string,
  partNumber: number,
  data: Buffer,
  proxy?: IWebProxy,
): Promise<string> => {
  const response = await $http.put<string>(
    uploadUrl(node, `partNumber=${partNumber}&uploadId=${encodeURIComponent(uploadId)}`),
    data,
    uploadConfig(node, proxy),
  );
  const etag = response.headers.etag?.toString();
  if (!etag) throw new Error(`RedNote视频分片${partNumber}上传失败`);
  return etag;
};

export const completeRedNoteMultipartUpload = async (
  node: RedNoteUploadPermitNode,
  uploadId: string,
  etags: string[],
  proxy?: IWebProxy,
): Promise<string> => {
  const parts = etags
    .map((etag, index) => `<Part><PartNumber>${index + 1}</PartNumber><ETag>${etag}</ETag></Part>`)
    .join('');
  const body = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><CompleteMultipartUpload>${parts}</CompleteMultipartUpload>`;
  const config = uploadConfig(node, proxy);
  config.headers['Content-MD5'] = crypto.createHash('md5').update(body).digest('base64');
  const response = await $http.post<string>(
    uploadUrl(node, `uploadId=${encodeURIComponent(uploadId)}`),
    body,
    config,
  );
  if (!response.data?.includes(node.fileIds[0])) throw new Error('RedNote视频上传完成校验失败');
  return response.data;
};

export const uploadRedNoteVideoFromPath = async (
  cookie: string,
  videoPath: string,
  proxy?: IWebProxy,
  concurrency: number = 3,
  onProgress?: (uploadedParts: number, totalParts: number) => void,
): Promise<{ fileId: string; uploadNode: RedNoteUploadPermitNode; completeResponse: string }> => {
  const permit = await getRedNoteVideoUploadPermit(cookie, proxy);
  const node = permit.data?.uploadTempPermits?.[0];
  if (!node?.fileIds?.[0] || !node.token || !node.uploadAddr) {
    throw new Error(`获取RedNote视频上传凭证失败：${permit.msg ?? ''}`);
  }
  const stat = await fs.promises.stat(videoPath);
  if (!stat.isFile() || stat.size <= 0) throw new Error(`RedNote视频文件无效：${videoPath}`);
  const uploadId = await createRedNoteMultipartUpload(node, proxy);
  const totalParts = Math.ceil(stat.size / REDNOTE_VIDEO_PART_SIZE);
  const etags = new Array<string>(totalParts);
  const handle = await fs.promises.open(videoPath, 'r');
  let nextPart = 0;
  let uploaded = 0;
  try {
    const worker = async () => {
      while (nextPart < totalParts) {
        const index = nextPart++;
        const offset = index * REDNOTE_VIDEO_PART_SIZE;
        const length = Math.min(REDNOTE_VIDEO_PART_SIZE, stat.size - offset);
        const data = Buffer.alloc(length);
        await handle.read(data, 0, length, offset);
        etags[index] = await uploadRedNoteVideoPart(node, uploadId, index + 1, data, proxy);
        onProgress?.(++uploaded, totalParts);
      }
    };
    await Promise.all(Array.from({ length: Math.min(Math.max(concurrency, 1), totalParts) }, worker));
  } finally {
    await handle.close();
  }
  const completeResponse = await completeRedNoteMultipartUpload(node, uploadId, etags, proxy);
  return { fileId: node.fileIds[0], uploadNode: node, completeResponse };
};
