import crypto from 'node:crypto';

import { $http } from '@/http';

type NodeJsonWebKey = crypto.JsonWebKey;

export const DOUBAO_FEISHU_DEFAULTS = {
  baseUrl: 'https://www.doubao.com',
  referer: 'https://www.doubao.com/',
  origin: 'https://www.doubao.com',
  aid: '497858',
  accountSdkSource: 'web',
  sdkVersion: '2.2.11-doubao.0',
  bizAuthClientId: 'cli_a872ee858eae100e',
  bizAuthClientType: 'Lark',
  bizAuthScope: 'internal',
  dpopSeed: 'passport-dpop-token-generator',
  dpopSalt: 'fixed-salt',
  exportFormat: 'docx',
  exportEventSource: '41',
  syncedBlockHostType: '22',
  pollIntervalMs: 1000,
  maxWaitMs: 60000,
  appVersionExt: 'doubao:3.11.3',
} as const;

export type DoubaoCookieInput =
  | string
  | Array<{ name?: string; value?: string | number | boolean | null }>
  | { cookies?: Array<{ name?: string; value?: string | number | boolean | null }> };

export interface DoubaoCookieValues {
  msToken: string;
  verifyFp: string;
  fp: string;
  csrfToken: string;
  feishuDpopKeypair: string;
  deviceId: string;
  teaId: string;
}

export interface EnsureFeishuDpopRuntimeResult {
  cookieHeader: string;
  cookieValues: DoubaoCookieValues;
  generatedFeishuDpopKeypair: boolean;
}

export interface CreateFeishuDpopProofOptions {
  feishuDpopKeypairCookie: string;
  seed?: string;
  verbose?: boolean;
  jti?: string;
  htm?: string;
  htu?: string;
  iat?: number;
  nonce?: string;
}

function parseCookieJson(input: DoubaoCookieInput): Map<string, string> {
  const parsed = typeof input === 'string' ? JSON.parse(input) : input;
  const items = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.cookies) ? parsed.cookies : [];
  const cookieMap = new Map<string, string>();

  for (const item of items) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const name = typeof item.name === 'string' ? item.name : '';
    const value = item.value == null ? '' : String(item.value);

    if (!name) {
      continue;
    }

    cookieMap.set(name, value);
  }

  return cookieMap;
}

export function parseCookieHeader(cookieHeader: string): Map<string, string> {
  const map = new Map<string, string>();
  const pairs = String(cookieHeader || '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);

  for (const pair of pairs) {
    const separatorIndex = pair.indexOf('=');
    if (separatorIndex === -1) {
      map.set(pair, '');
      continue;
    }

    const key = pair.slice(0, separatorIndex).trim();
    const value = pair.slice(separatorIndex + 1);
    map.set(key, value);
  }

  return map;
}

export function buildCookieHeader(cookieMap: Map<string, string>): string {
  return Array.from(cookieMap.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
}

export function normalizeCookieInput(cookieInput: DoubaoCookieInput): string {
  if (typeof cookieInput === 'string') {
    const trimmed = cookieInput.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      return buildCookieHeader(parseCookieJson(trimmed));
    }
    return trimmed;
  }

  if (Array.isArray(cookieInput)) {
    return buildCookieHeader(parseCookieJson(cookieInput));
  }

  if (cookieInput && typeof cookieInput === 'object') {
    return buildCookieHeader(parseCookieJson(cookieInput));
  }

  return '';
}

export function parseCookieValues(cookieHeader: string): DoubaoCookieValues {
  const cookies = parseCookieHeader(cookieHeader);
  const verifyFp = cookies.get('s_v_web_id') || cookies.get('fp') || '';

  return {
    msToken: cookies.get('msToken') || '',
    verifyFp,
    fp: cookies.get('fp') || verifyFp,
    csrfToken: cookies.get('passport_csrf_token') || cookies.get('passport_csrf_token_default') || '',
    feishuDpopKeypair: cookies.get('feishu_dpop_keypair') || '',
    deviceId: cookies.get('device_id') || '',
    teaId: cookies.get('tea_uuid') || cookies.get('web_id') || cookies.get('device_id') || '',
  };
}

async function deriveFeishuDpopAesKey(seed: string = DOUBAO_FEISHU_DEFAULTS.dpopSeed): Promise<CryptoKey> {
  const keyMaterial = await crypto.webcrypto.subtle.importKey('raw', Buffer.from(seed), 'PBKDF2', false, [
    'deriveKey',
  ]);

  return crypto.webcrypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: Buffer.from(DOUBAO_FEISHU_DEFAULTS.dpopSalt),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function generateFeishuDpopKeypair(): Promise<{
  privateKey: NodeJsonWebKey;
  publicKey: NodeJsonWebKey;
}> {
  const keypair = await crypto.webcrypto.subtle.generateKey(
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    true,
    ['sign', 'verify'],
  );

  const [privateKey, publicKey] = await Promise.all([
    crypto.webcrypto.subtle.exportKey('jwk', keypair.privateKey),
    crypto.webcrypto.subtle.exportKey('jwk', keypair.publicKey),
  ]);

  return { privateKey: privateKey as NodeJsonWebKey, publicKey: publicKey as NodeJsonWebKey };
}

export async function encryptFeishuDpopKeypair(
  keypair: { privateKey: NodeJsonWebKey; publicKey: NodeJsonWebKey },
  options: { seed?: string; iv?: Iterable<number> } = {},
): Promise<string> {
  const aesKey = await deriveFeishuDpopAesKey(options.seed);
  const iv = options.iv ? Uint8Array.from(options.iv) : crypto.webcrypto.getRandomValues(new Uint8Array(12));
  const plaintext = Buffer.from(JSON.stringify(keypair), 'utf8');
  const ciphertext = Buffer.from(
    await crypto.webcrypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      aesKey,
      plaintext,
    ),
  );

  return Buffer.concat([Buffer.from(iv), ciphertext]).toString('base64');
}

export async function decryptFeishuDpopKeypair(
  cookieValue: string,
  options: { seed?: string } = {},
): Promise<{ privateKey: NodeJsonWebKey; publicKey: NodeJsonWebKey }> {
  const raw = Buffer.from(cookieValue, 'base64');
  const iv = raw.subarray(0, 12);
  const ciphertext = raw.subarray(12);
  const aesKey = await deriveFeishuDpopAesKey(options.seed);
  const decrypted = Buffer.from(
    await crypto.webcrypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      aesKey,
      ciphertext,
    ),
  );

  return JSON.parse(decrypted.toString('utf8')) as {
    privateKey: NodeJsonWebKey;
    publicKey: NodeJsonWebKey;
  };
}

function signFeishuDpopProof(options: {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  privateKey: NodeJsonWebKey;
}): string {
  const encodedHeader = Buffer.from(JSON.stringify(options.header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(options.payload)).toString('base64url');
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const key = crypto.createPrivateKey({
    key: options.privateKey as crypto.JsonWebKey,
    format: 'jwk',
  });
  const signature = crypto.sign('sha256', Buffer.from(signingInput), {
    key,
    dsaEncoding: 'ieee-p1363',
  });

  return `${signingInput}.${signature.toString('base64url')}`;
}

export function computeJwkThumbprint(publicKey: NodeJsonWebKey): string {
  const canonical = JSON.stringify({
    crv: publicKey.crv,
    kty: publicKey.kty,
    x: publicKey.x,
    y: publicKey.y,
  });

  return crypto.createHash('sha256').update(canonical).digest('base64url');
}

async function getServerTimeSeconds(verbose = false): Promise<number> {
  try {
    const response = await $http.post('https://accounts.feishu.cn/accounts/status/heartbeat', undefined);
    const now = Math.floor(Number(response.data?.data?.now || Date.now() / 1000));

    if (verbose) {
      console.log(`[heartbeat] serverTime=${now}`);
    }

    return now;
  } catch (error) {
    if (verbose) {
      console.log(`[heartbeat] fallback local time: ${String(error)}`);
    }

    return Math.floor(Date.now() / 1000);
  }
}

export async function createFeishuDpopProofFromCookie(options: CreateFeishuDpopProofOptions): Promise<{
  proof: string;
  keypair: { privateKey: NodeJsonWebKey; publicKey: NodeJsonWebKey };
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  thumbprint: string;
}> {
  const keypair = await decryptFeishuDpopKeypair(options.feishuDpopKeypairCookie, {
    seed: options.seed,
  });
  const header = {
    typ: 'dpop+jwt',
    alg: 'ES256',
    jwk: keypair.publicKey,
  };
  const payload = {
    jti: options.jti ?? crypto.randomUUID(),
    htm: options.htm ?? '',
    htu: options.htu ?? '',
    iat: options.iat ?? (await getServerTimeSeconds(options.verbose)),
    nonce: options.nonce ?? crypto.randomUUID(),
  };
  const proof = signFeishuDpopProof({
    header,
    payload,
    privateKey: keypair.privateKey,
  });

  return {
    proof,
    keypair,
    header,
    payload,
    thumbprint: computeJwkThumbprint(keypair.publicKey),
  };
}

export async function ensureFeishuDpopRuntime(
  cookieInput: DoubaoCookieInput,
  seed: string = DOUBAO_FEISHU_DEFAULTS.dpopSeed,
): Promise<EnsureFeishuDpopRuntimeResult> {
  const cookieHeader = normalizeCookieInput(cookieInput);

  if (!cookieHeader) {
    throw new Error('Missing required input: cookie');
  }

  const cookieValues = parseCookieValues(cookieHeader);

  if (cookieValues.feishuDpopKeypair) {
    return {
      cookieHeader,
      cookieValues,
      generatedFeishuDpopKeypair: false,
    };
  }

  const keypair = await generateFeishuDpopKeypair();
  const feishuDpopKeypair = await encryptFeishuDpopKeypair(keypair, { seed });
  const cookieMap = parseCookieHeader(cookieHeader);
  cookieMap.set('feishu_dpop_keypair', feishuDpopKeypair);

  return {
    cookieHeader: buildCookieHeader(cookieMap),
    cookieValues: {
      ...cookieValues,
      feishuDpopKeypair,
    },
    generatedFeishuDpopKeypair: true,
  };
}

function normalizeBooleanValues(
  input: Record<string, string | number | boolean>,
): Record<string, string | number> {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, typeof value === 'boolean' ? Number(value) : value]),
  );
}

function sortPassportParams(input: Record<string, string | number>, removeAt = -1) {
  const keys = Object.keys(input).sort();

  if (removeAt >= 0 && removeAt < keys.length) {
    keys.splice(removeAt, 1);
  }

  return {
    keys,
    str: keys
      .map((key) => `${key}=${typeof input[key] === 'object' ? JSON.stringify(input[key]) : input[key]}`)
      .join('&'),
  };
}

export function encodeDoubaoPassportQs(input: string): string {
  return Array.from(Buffer.from(input, 'utf8'))
    .map((byte) => (byte ^ 5).toString(16))
    .join('');
}

export function buildDoubaoPassportSignAndQs(
  commonParams: Record<string, string | number | boolean>,
  dataParams: Record<string, string | number | boolean>,
  appKey = '2094abfcccefaeaffd24c622475fba10',
): {
  sign: string;
  qs: string;
  signSource: string;
  sortedCommonKeys: string[];
  sortedDataKeys: string[];
} {
  const normalizedCommonParams = normalizeBooleanValues(commonParams);
  const normalizedDataParams = normalizeBooleanValues(dataParams);
  const sortedCommon = sortPassportParams(normalizedCommonParams, 10);
  const sortedData = sortPassportParams(normalizedDataParams);
  const signSource = `${sortedCommon.str}&${sortedData.str}&app_key=${appKey}`;
  const qsKeys = sortedCommon.keys.filter((key) => key !== 'aid');

  return {
    sign: crypto.createHash('sha256').update(signSource).digest('hex'),
    qs: encodeDoubaoPassportQs(qsKeys.join(',')),
    signSource,
    sortedCommonKeys: sortedCommon.keys,
    sortedDataKeys: sortedData.keys,
  };
}

export function ensureAuthorization(value: string): string {
  return String(value).startsWith('DPoP ') ? String(value) : `DPoP ${value}`;
}
