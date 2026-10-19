import { Readable } from 'node:stream';
import querystring from 'node:querystring';

import { $http } from '@/http';
import { getHttpStream } from '@/httpStream';

import { applyDoubaoABogusSignature } from './doubao-chat.service';
import {
  buildDoubaoPassportSignAndQs,
  createFeishuDpopProofFromCookie,
  DOUBAO_FEISHU_DEFAULTS,
  ensureAuthorization,
  ensureFeishuDpopRuntime,
  type DoubaoCookieInput,
  type DoubaoCookieValues,
} from './sign.service';

export type DoubaoExportFormat = 'docx' | 'pdf' | 'markdown';

export interface DoubaoDownloadOptions {
  format?: DoubaoExportFormat | 'word' | 'md';
  baseUrl?: string;
  referer?: string;
  origin?: string;
  aid?: string;
  accountSdkSource?: string;
  sdkVersion?: string;
  clientId?: string;
  clientType?: string;
  scope?: string;
  exportEventSource?: string;
  syncedBlockHostType?: string;
  dpopSeed?: string;
  pollIntervalMs?: number;
  maxWaitMs?: number;
  appVersionExt?: string;
  verbose?: boolean;
  unsign?: boolean;
}

interface NormalizedDoubaoDownloadOptions {
  fileToken: string;
  format: DoubaoExportFormat;
  baseUrl: string;
  referer: string;
  origin: string;
  aid: string;
  accountSdkSource: string;
  sdkVersion: string;
  clientId: string;
  clientType: string;
  scope: string;
  exportEventSource: string;
  syncedBlockHostType: string;
  dpopSeed: string;
  pollIntervalMs: number;
  maxWaitMs: number;
  appVersionExt: string;
  verbose: boolean;
  unsign: boolean;
  cookieHeader: string;
  cookieValues: DoubaoCookieValues;
  generatedFeishuDpopKeypair: boolean;
}

interface DoubaoBizAuthResponse {
  data?: {
    access_token?: string;
  };
}

interface DoubaoExportCreateResponse {
  code?: number;
  data?: {
    ticket?: string;
  };
}

interface DoubaoExportResultResponse {
  code?: number;
  data?: {
    result?: {
      file_name?: string;
      file_size?: number;
      type?: string;
      job_error_msg?: string;
      file_extension?: string;
      extra?: Record<string, string>;
      job_status?: number;
      file_token?: string;
    };
  };
}

export interface DoubaoDownloadInfo {
  downloadUrl: string;
  exportTicket: string;
  exportedFileToken: string;
  fileName: string;
  fileSize: number;
  type: string;
  fileExtension: string;
  jobStatus: number;
  jobErrorMsg: string;
  extra?: Record<string, string>;
}

function normalizeFormat(format?: DoubaoDownloadOptions['format']): DoubaoExportFormat {
  const normalized = String(format ?? DOUBAO_FEISHU_DEFAULTS.exportFormat).toLowerCase();
  const mapped = {
    word: 'docx',
    docx: 'docx',
    pdf: 'pdf',
    md: 'markdown',
    markdown: 'markdown',
  }[normalized] as DoubaoExportFormat | undefined;

  if (!mapped) {
    throw new Error(`Unsupported export format: ${format}`);
  }

  return mapped;
}

function normalizeJsonResponseData<T>(raw: unknown): { data: T | null; text: string } {
  if (typeof raw === 'string') {
    try {
      return {
        data: raw ? (JSON.parse(raw) as T) : null,
        text: raw,
      };
    } catch {
      return {
        data: null,
        text: raw,
      };
    }
  }

  return {
    data: (raw as T) ?? null,
    text: raw == null ? '' : JSON.stringify(raw),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildFeishuHeaders(
  options: NormalizedDoubaoDownloadOptions,
  dpopToken: string,
  authorization: string,
  withJsonBody: boolean,
): Record<string, string> {
  return {
    authorization: ensureAuthorization(authorization),
    dpop: dpopToken,
    'x-lgw-tea-id': options.cookieValues.teaId,
    'x-lgw-device-id': options.cookieValues.deviceId,
    'x-lgw-app-version-ext': options.appVersionExt,
    'x-lgw-app-id': options.aid,
    origin: options.origin,
    referer: options.referer,
    accept: '*/*',
    ...(withJsonBody ? { 'content-type': 'application/json' } : {}),
  };
}

function buildExportResultUrl(options: NormalizedDoubaoDownloadOptions, ticket: string): string {
  const params = new URLSearchParams({
    synced_block_host_type: options.syncedBlockHostType,
    synced_block_host_token: options.fileToken,
    token: options.fileToken,
    type: options.format,
  });

  return `https://my.feishu.cn/space/api/export/result/${ticket}?${params.toString()}`;
}

function buildDownloadUrl(options: NormalizedDoubaoDownloadOptions, fileToken: string): string {
  const params = new URLSearchParams({
    synced_block_host_type: options.syncedBlockHostType,
    synced_block_host_token: fileToken,
    token: fileToken,
    type: options.format,
  });

  return `https://my.feishu.cn/space/api/box/stream/download/all/${fileToken}?${params.toString()}`;
}

async function normalizeOptions(
  cookie: DoubaoCookieInput,
  fileToken: string,
  options: DoubaoDownloadOptions = {},
): Promise<NormalizedDoubaoDownloadOptions> {
  if (!fileToken) {
    throw new Error('Missing required input: fileToken');
  }

  const dpopSeed = options.dpopSeed ?? DOUBAO_FEISHU_DEFAULTS.dpopSeed;
  const runtime = await ensureFeishuDpopRuntime(cookie, dpopSeed);

  return {
    fileToken,
    format: normalizeFormat(options.format),
    baseUrl: options.baseUrl ?? DOUBAO_FEISHU_DEFAULTS.baseUrl,
    referer: options.referer ?? DOUBAO_FEISHU_DEFAULTS.referer,
    origin: options.origin ?? DOUBAO_FEISHU_DEFAULTS.origin,
    aid: String(options.aid ?? DOUBAO_FEISHU_DEFAULTS.aid),
    accountSdkSource: options.accountSdkSource ?? DOUBAO_FEISHU_DEFAULTS.accountSdkSource,
    sdkVersion: options.sdkVersion ?? DOUBAO_FEISHU_DEFAULTS.sdkVersion,
    clientId: options.clientId ?? DOUBAO_FEISHU_DEFAULTS.bizAuthClientId,
    clientType: options.clientType ?? DOUBAO_FEISHU_DEFAULTS.bizAuthClientType,
    scope: options.scope ?? DOUBAO_FEISHU_DEFAULTS.bizAuthScope,
    exportEventSource: String(options.exportEventSource ?? DOUBAO_FEISHU_DEFAULTS.exportEventSource),
    syncedBlockHostType: String(options.syncedBlockHostType ?? DOUBAO_FEISHU_DEFAULTS.syncedBlockHostType),
    dpopSeed,
    pollIntervalMs: Number(options.pollIntervalMs ?? DOUBAO_FEISHU_DEFAULTS.pollIntervalMs),
    maxWaitMs: Number(options.maxWaitMs ?? DOUBAO_FEISHU_DEFAULTS.maxWaitMs),
    appVersionExt: options.appVersionExt ?? DOUBAO_FEISHU_DEFAULTS.appVersionExt,
    verbose: Boolean(options.verbose),
    unsign: Boolean(options.unsign),
    cookieHeader: runtime.cookieHeader,
    cookieValues: runtime.cookieValues,
    generatedFeishuDpopKeypair: runtime.generatedFeishuDpopKeypair,
  };
}

async function getBizAuthAccessToken(options: NormalizedDoubaoDownloadOptions): Promise<string> {
  const dpop = await createFeishuDpopProofFromCookie({
    feishuDpopKeypairCookie: options.cookieValues.feishuDpopKeypair,
    seed: options.dpopSeed,
    verbose: options.verbose,
  });
  const commonParams: Record<string, string> = {
    aid: options.aid,
    account_sdk_source: options.accountSdkSource,
    sdk_version: options.sdkVersion,
    verifyFp: options.cookieValues.verifyFp,
    fp: options.cookieValues.fp,
  };
  const bodyParams: Record<string, string> = {
    client_id: options.clientId,
    client_type: options.clientType,
    scope: options.scope,
    d_pop: dpop.proof,
  };
  const signed = buildDoubaoPassportSignAndQs(commonParams, bodyParams);
  const params = await applyDoubaoABogusSignature(
    {
      ...commonParams,
      sign: signed.sign,
      qs: signed.qs,
      msToken: options.cookieValues.msToken,
    },
    querystring.stringify(bodyParams),
    options.unsign,
  );

  const response = await $http.post(`${options.baseUrl}/passport/user/biz_auth/`, querystring.stringify(bodyParams), {
    params,
    headers: {
      accept: 'application/json, text/javascript',
      'content-type': 'application/x-www-form-urlencoded',
      'x-tt-passport-csrf-token': options.cookieValues.csrfToken,
      cookie: options.cookieHeader,
      origin: options.origin,
      referer: options.referer,
    },
  });
  const normalizedResponse = normalizeJsonResponseData<DoubaoBizAuthResponse>(response.data);
  const accessToken = normalizedResponse.data?.data?.access_token;

  if (response.status < 200 || response.status >= 300 || !accessToken) {
    throw new Error(`biz_auth failed: ${response.status} ${normalizedResponse.text}`);
  }

  return ensureAuthorization(accessToken);
}

async function createExportTicket(options: NormalizedDoubaoDownloadOptions, authorization: string): Promise<string> {
  const dpop = await createFeishuDpopProofFromCookie({
    feishuDpopKeypairCookie: options.cookieValues.feishuDpopKeypair,
    seed: options.dpopSeed,
    verbose: options.verbose,
  });
  const response = await $http.post(
    'https://my.feishu.cn/space/api/export/create/',
    {
      event_source: options.exportEventSource,
      file_extension: options.format === 'markdown' ? 'md' : options.format,
      token: options.fileToken,
      type: 'docx',
    },
    {
      headers: buildFeishuHeaders(options, dpop.proof, authorization, true),
    },
  );
  const normalizedResponse = normalizeJsonResponseData<DoubaoExportCreateResponse>(response.data);
  const ticket = normalizedResponse.data?.data?.ticket;

  if (response.status < 200 || response.status >= 300 || normalizedResponse.data?.code !== 0 || !ticket) {
    throw new Error(`export/create failed: ${response.status} ${normalizedResponse.text}`);
  }

  return ticket;
}

async function waitForExportFileToken(
  options: NormalizedDoubaoDownloadOptions,
  authorization: string,
  ticket: string,
): Promise<{
  fileToken: string;
  fileName: string;
  fileSize: number;
  type: string;
  fileExtension: string;
  jobStatus: number;
  jobErrorMsg: string;
  extra?: Record<string, string>;
}> {
  const startedAt = Date.now();

  while (Date.now() - startedAt <= options.maxWaitMs) {
    const dpop = await createFeishuDpopProofFromCookie({
      feishuDpopKeypairCookie: options.cookieValues.feishuDpopKeypair,
      seed: options.dpopSeed,
      verbose: options.verbose,
    });
    const response = await $http.get(buildExportResultUrl(options, ticket), {
      headers: buildFeishuHeaders(options, dpop.proof, authorization, false),
    });
    const normalizedResponse = normalizeJsonResponseData<DoubaoExportResultResponse>(response.data);
    const result = normalizedResponse.data?.data?.result;

    if (response.status < 200 || response.status >= 300 || normalizedResponse.data?.code !== 0 || !result) {
      throw new Error(`export/result failed: ${response.status} ${normalizedResponse.text}`);
    }

    if (options.verbose) {
      console.log(`[poll] job_status=${result.job_status}`);
    }

    if (result.file_token) {
      return {
        fileToken: result.file_token,
        fileName: result.file_name || '',
        fileSize: Number(result.file_size || 0),
        type: result.type || options.format,
        fileExtension: result.file_extension || (options.format === 'markdown' ? 'md' : options.format),
        jobStatus: Number(result.job_status || 0),
        jobErrorMsg: result.job_error_msg || '',
        extra: result.extra,
      };
    }

    if (result.job_status !== 2) {
      throw new Error(`export/result ended with unexpected job_status=${result.job_status}`);
    }

    await sleep(options.pollIntervalMs);
  }

  throw new Error(`export/result timed out after ${options.maxWaitMs}ms`);
}

async function resolveDoubaoDownloadFlow(
  cookie: DoubaoCookieInput,
  fileToken: string,
  options: DoubaoDownloadOptions = {},
): Promise<{
  normalized: NormalizedDoubaoDownloadOptions;
  authorization: string;
  exportTicket: string;
  exportedFileToken: string;
  downloadUrl: string;
  exportResult: {
    fileName: string;
    fileSize: number;
    type: string;
    fileExtension: string;
    jobStatus: number;
    jobErrorMsg: string;
    extra?: Record<string, string>;
  };
}> {
  const normalized = await normalizeOptions(cookie, fileToken, options);
  const authorization = await getBizAuthAccessToken(normalized);
  const exportTicket = await createExportTicket(normalized, authorization);
  const exportResult = await waitForExportFileToken(normalized, authorization, exportTicket);

  return {
    normalized,
    authorization,
    exportTicket,
    exportedFileToken: exportResult.fileToken,
    downloadUrl: buildDownloadUrl(normalized, exportResult.fileToken),
    exportResult: {
      fileName: exportResult.fileName,
      fileSize: exportResult.fileSize,
      type: exportResult.type,
      fileExtension: exportResult.fileExtension,
      jobStatus: exportResult.jobStatus,
      jobErrorMsg: exportResult.jobErrorMsg,
      extra: exportResult.extra,
    },
  };
}

export async function getDoubaoDownloadInfo(
  cookie: DoubaoCookieInput,
  attachmentId: string,
  options: DoubaoDownloadOptions = {},
): Promise<DoubaoDownloadInfo> {
  const flow = await resolveDoubaoDownloadFlow(cookie, attachmentId, options);

  return {
    downloadUrl: flow.downloadUrl,
    exportTicket: flow.exportTicket,
    exportedFileToken: flow.exportedFileToken,
    fileName: flow.exportResult.fileName,
    fileSize: flow.exportResult.fileSize,
    type: flow.exportResult.type,
    fileExtension: flow.exportResult.fileExtension,
    jobStatus: flow.exportResult.jobStatus,
    jobErrorMsg: flow.exportResult.jobErrorMsg,
    extra: flow.exportResult.extra,
  };
}

export async function getDoubaoDownloadUrl(
  cookie: DoubaoCookieInput,
  attachmentId: string,
  options: DoubaoDownloadOptions = {},
): Promise<string> {
  return (await getDoubaoDownloadInfo(cookie, attachmentId, options)).downloadUrl;
}

export async function getDoubaoDownloadStream(
  cookie: DoubaoCookieInput,
  attachmentId: string,
  options: DoubaoDownloadOptions = {},
): Promise<Readable> {
  const flow = await resolveDoubaoDownloadFlow(cookie, attachmentId, options);
  const dpop = await createFeishuDpopProofFromCookie({
    feishuDpopKeypairCookie: flow.normalized.cookieValues.feishuDpopKeypair,
    seed: flow.normalized.dpopSeed,
    verbose: flow.normalized.verbose,
  });
  const stream = await getHttpStream(flow.downloadUrl, {
    headers: buildFeishuHeaders(flow.normalized, dpop.proof, flow.authorization, false) as Record<string, string>,
  });
  const status = stream.statusCode ?? -1;
  if (status < 200 || status >= 300) {
    stream.resume();
    throw new Error(`download failed: ${status}`);
  }

  return stream as unknown as Readable;
}

export async function getDoubaoDownloadRequest(
  cookie: DoubaoCookieInput,
  attachmentId: string,
  options: DoubaoDownloadOptions = {},
): Promise<{ url: string; headers: Record<string, string> }> {
  const flow = await resolveDoubaoDownloadFlow(cookie, attachmentId, options);
  const dpop = await createFeishuDpopProofFromCookie({
    feishuDpopKeypairCookie: flow.normalized.cookieValues.feishuDpopKeypair,
    seed: flow.normalized.dpopSeed,
    verbose: flow.normalized.verbose,
  });

  return {
    url: flow.downloadUrl,
    headers: buildFeishuHeaders(flow.normalized, dpop.proof, flow.authorization, false) as Record<string, string>,
  };
}

export default getDoubaoDownloadUrl;
