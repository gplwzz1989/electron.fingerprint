import http, { type IncomingMessage, type RequestOptions } from 'http';
import https from 'https';
import { PubConfig } from '@/Config';
import { HttpConfig, registerHttpAgent } from '@/http';

export type HttpStreamResponse = IncomingMessage;

const httpStreamHttpAgent = registerHttpAgent(new http.Agent({ keepAlive: true }), true);
const httpStreamHttpsAgent = registerHttpAgent(
  new https.Agent({ rejectUnauthorized: false, keepAlive: true }),
  true,
);

export async function getHttpStream(
  url: string,
  options: {
    headers?: Record<string, string>;
    timeoutMs?: number;
    maxRedirects?: number;
  } = {},
): Promise<HttpStreamResponse> {
  const timeoutMs = options.timeoutMs ?? PubConfig.httpTimeout;
  const maxRedirects = options.maxRedirects ?? 5;

  const requestOnce = (targetUrl: string, redirectsLeft: number): Promise<HttpStreamResponse> => {
    const u = new URL(targetUrl);
    const isHttps = u.protocol === 'https:';
    const lib = isHttps ? https : http;

    const defaultHeaders: Record<string, string> = {
      'User-Agent': HttpConfig.userAgent,
      Accept: HttpConfig.accept,
      'Accept-Encoding': HttpConfig.acceptEncoding,
      'Accept-Language': HttpConfig.acceptLanguage,
      Connection: 'keep-alive',
    };

    const requestOptions: RequestOptions = {
      protocol: u.protocol,
      hostname: u.hostname,
      port: u.port ? Number(u.port) : isHttps ? 443 : 80,
      method: 'GET',
      path: `${u.pathname}${u.search}`,
      headers: {
        ...defaultHeaders,
        ...(options.headers ?? {}),
      },
      agent: isHttps ? httpStreamHttpsAgent : httpStreamHttpAgent,
    };

    return new Promise((resolve, reject) => {
      const req = lib.request(requestOptions, (res) => {
        const status = res.statusCode ?? 0;
        const location = res.headers.location;
        const isRedirect = [301, 302, 303, 307, 308].includes(status) && !!location;

        if (isRedirect) {
          if (redirectsLeft <= 0) {
            res.resume();
            reject(new Error(`Too many redirects for ${url}`));
            return;
          }
          const nextUrl = new URL(location as string, u).toString();
          res.resume();
          requestOnce(nextUrl, redirectsLeft - 1).then(resolve, reject);
          return;
        }

        resolve(res);
      });

      req.setTimeout(timeoutMs, () => req.destroy(new Error(`Request timeout after ${timeoutMs}ms`)));
      req.on('error', reject);
      req.end();
    });
  };

  return requestOnce(url, maxRedirects);
}
