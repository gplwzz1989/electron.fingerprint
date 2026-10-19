import * as https from 'node:https';
import * as http from 'node:http';
import { createDecipheriv } from 'node:crypto';

export interface DouyinImageBase64Result {
  base64: string;
  mime: string;
  dataUrl: string;
  buffer: Buffer;
}

/**
 * 将十六进制字符串转换为 Buffer
 */
function hexToBuffer(hex: string): Buffer {
  if (typeof hex !== 'string' || !hex.trim()) {
    throw new Error('skey 不能为空');
  }

  const normalized = hex.trim().replace(/\s+/g, '');
  if (!/^[\da-fA-F]+$/.test(normalized) || normalized.length % 2 !== 0) {
    throw new Error('skey 格式不正确，必须是偶数长度的十六进制字符串');
  }

  return Buffer.from(normalized, 'hex');
}

/**
 * 下载远程二进制内容
 */
function downloadBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    if (typeof url !== 'string' || !url.trim()) {
      reject(new Error('url 不能为空'));
      return;
    }

    const client = url.startsWith('https://') ? https : http;

    const request = client.get(url, (response) => {
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`图片请求失败，状态码：${response.statusCode ?? '未知'}`));
        return;
      }

      const chunks: Buffer[] = [];
      response.on('data', (chunk: Buffer) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
    });

    request.on('error', () => {
      reject(new Error('图片请求失败，请检查 url 是否可用'));
    });
  });
}

/**
 * 根据文件头判断图片 mime
 */
function detectMime(buffer: Buffer): string {
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return 'image/png';
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  return 'application/octet-stream';
}

/**
 * 解密抖音 .image 二进制
 */
function decryptDouyinImageBuffer(encryptedBuffer: Buffer, skey: string): Buffer {
  if (!Buffer.isBuffer(encryptedBuffer) || encryptedBuffer.length <= 12 + 16) {
    throw new Error('图片二进制内容无效');
  }

  const key = hexToBuffer(skey);
  if (key.length !== 32) {
    throw new Error('skey 长度不正确，解密需要 32 字节密钥');
  }

  const iv = encryptedBuffer.subarray(0, 12);
  const payload = encryptedBuffer.subarray(12);
  const authTag = payload.subarray(payload.length - 16);
  const ciphertext = payload.subarray(0, payload.length - 16);

  try {
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    throw new Error('图片解密失败，请确认 url 和 skey 是否匹配');
  }
}

/**
 * 传入 url 和 skey，返回图片 base64
 */
export async function douyinImageToBase64(url: string, skey: string): Promise<DouyinImageBase64Result> {
  const encryptedBuffer = await downloadBuffer(url);
  const plainBuffer = decryptDouyinImageBuffer(encryptedBuffer, skey);
  const mime = detectMime(plainBuffer);
  const base64 = plainBuffer.toString('base64');

  return {
    base64,
    mime,
    dataUrl: `data:${mime};base64,${base64}`,
    buffer: plainBuffer,
  };
}
