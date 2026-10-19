import { describe, expect, it, vi } from 'vitest';
import { HttpConfig, $http } from '@/http';
import type { KuaiDaiLiProxy } from '@/media-platform/webproxy';
import { getRedNoteVideoUploadPermit } from '@/media-platform/rednote/rednote-video-upload.service';

const cookie =
  process.env.REDNOTE_COOKIE ??
  '';

describe.runIf(Boolean(cookie))('RedNote real video upload permit', () => {
  it('returns a successful response with all required upload fields', async () => {
    const proxy: KuaiDaiLiProxy | undefined = process.env.REDNOTE_PROXY_JSON
      ? JSON.parse(process.env.REDNOTE_PROXY_JSON)
      : undefined;
    if (proxy && (!proxy.serverAdd || !Number.isInteger(proxy.serverPort) || proxy.serverPort <= 0 ||
      (proxy.type && !['http', 'socks5', 'socks4'].includes(proxy.type)))) {
      throw new Error('Invalid REDNOTE_PROXY_JSON: check serverAdd, serverPort and type');
    }
    const previousDebug = HttpConfig.debug;
    HttpConfig.debug = false;
    let httpStatus: number | undefined;
    let contentType: string | undefined;
    const originalGet = $http.get.bind($http);
    const getSpy = vi.spyOn($http, 'get').mockImplementation(async (...args: Parameters<typeof $http.get>) => {
      const response = await originalGet(...args);
      httpStatus = response.status;
      contentType = response.headers['content-type']?.toString();
      return response;
    });
    try {
      const permit = await getRedNoteVideoUploadPermit(cookie, proxy);
      const node = permit?.data?.uploadTempPermits?.[0];
      // Only print structure and booleans, never credentials or the full response.
      console.info(JSON.stringify({
        mode: proxy ? 'proxy' : 'direct',
        proxyType: proxy?.type ?? (proxy ? 'http' : undefined),
        httpStatus,
        contentType,
        responseType: typeof permit,
        code: permit?.code,
        success: permit?.success,
        responseKeys: permit && typeof permit === 'object' ? Object.keys(permit) : [],
        permitCount: permit?.data?.uploadTempPermits?.length ?? 0,
        nodeKeys: node ? Object.keys(node) : [],
        hasFileId: Boolean(node?.fileIds?.[0]),
        hasToken: Boolean(node?.token),
        hasUploadAddr: Boolean(node?.uploadAddr),
      }, null, 2));
      // Assert booleans so failed assertions cannot expose the response or token.
      expect(permit?.code === 0, 'business code must be 0').toBe(true);
      expect(permit?.success === true, 'success must be true').toBe(true);
      expect(Boolean(node?.fileIds?.[0]), 'missing fileIds[0]').toBe(true);
      expect(Boolean(node?.token), 'missing token').toBe(true);
      expect(Boolean(node?.uploadAddr), 'missing uploadAddr').toBe(true);
    } catch (error) {
      console.info(JSON.stringify({
        mode: proxy ? 'proxy' : 'direct',
        httpStatus,
        errorName: error instanceof Error ? error.name : 'unknown',
        networkCode: (error as { code?: string } | null)?.code,
      }));
      // Axios errors can include request Cookie and response credentials.
      throw new Error(`Permit check failed (${error instanceof Error ? error.name : 'unknown error'}); inspect the sanitized summary above.`);
    } finally {
      getSpy.mockRestore();
      HttpConfig.debug = previousDebug;
    }
  }, 120_000);
});
