import crypto from 'crypto';

/**
 * Cookie 加密工具函数
 *
 * 使用两层加密机制保护敏感的 cookie 数据：
 * 1. 用随机生成的数据加密密钥（DEK）加密实际数据
 * 2. 用用户密钥派生的密钥加密密钥（KEK）来保护 DEK
 *
 * 这种方式的优势是解密时只需要一次哈希运算，而不是数万次迭代
 */

interface EncryptedCookieData {
  version: number;
  encryptedData: string;
  encryptedKey: string;
  iv: string;
  authTag: string;
}

/**
 * 加密 cookie 字符串
 *
 * @param cookieString - 需要加密的 cookie 字符串
 * @param userProvidedKey - 用户提供的加密密钥
 * @returns 加密后的 Base64 编码字符串
 *
 * @example
 * ```typescript
 * const encrypted = await encryptCookie('my-cookie-data', 'my-secret-key')
 * console.log(encrypted) // 返回 Base64 编码的加密数据
 * ```
 */
export async function encryptCookie(cookieString: string, userProvidedKey: string): Promise<string> {
  // 生成随机的数据加密密钥（256位）
  const dataEncryptionKey = crypto.randomBytes(32);

  // 生成初始化向量（128位）
  const iv = crypto.randomBytes(16);

  // 第一层：使用 DEK 加密实际的 cookie 数据
  const cipher = crypto.createCipheriv('aes-256-gcm', dataEncryptionKey, iv);

  // 加密数据，注意这里我们明确指定了输入输出编码
  let encrypted = cipher.update(cookieString, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // 获取 GCM 模式的认证标签
  const authTag = cipher.getAuthTag();

  // 第二层：保护数据加密密钥
  // 从用户密钥派生密钥加密密钥（KEK）
  const keyEncryptionKey = crypto.createHash('sha256').update(userProvidedKey).digest(); // 返回 Buffer，正好是 32 字节（256位）

  // 使用 ECB 模式加密 DEK
  // 注意：ECB 模式不需要 IV，所以第三个参数是 null
  const keyCipher = crypto.createCipheriv('aes-256-ecb', keyEncryptionKey, null);

  // 修正：正确处理 Buffer 类型的加密
  const encryptedDEK = Buffer.concat([keyCipher.update(dataEncryptionKey), keyCipher.final()]).toString('hex');

  // 组合所有组件
  const combined: EncryptedCookieData = {
    version: 1, // 版本号，便于未来升级
    encryptedData: encrypted,
    encryptedKey: encryptedDEK,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  };

  // 最终编码为 Base64 返回
  return Buffer.from(JSON.stringify(combined)).toString('base64');
}

/**
 * 解密 cookie 字符串
 *
 * @param encryptedData - 加密后的 Base64 编码字符串
 * @param userProvidedKey - 用户提供的解密密钥
 * @returns 解密后的原始 cookie 字符串
 *
 * @example
 * ```typescript
 * const decrypted = decryptCookie(encryptedData, 'my-secret-key')
 * console.log(decrypted) // 返回原始 cookie 数据
 * ```
 */
export function decryptCookie(encryptedData: string, userProvidedKey: string): string {
  // 解析存储的数据
  const combined: EncryptedCookieData = JSON.parse(Buffer.from(encryptedData, 'base64').toString());

  // 快速生成密钥加密密钥（只需要一次哈希）
  const keyEncryptionKey = crypto.createHash('sha256').update(userProvidedKey).digest();

  // 解密数据加密密钥
  const keyDecipher = crypto.createDecipheriv('aes-256-ecb', keyEncryptionKey, null);

  // 从十六进制字符串恢复加密的 DEK
  const encryptedDEKBuffer = Buffer.from(combined.encryptedKey, 'hex');

  // 解密得到原始的 DEK
  const dataEncryptionKey = Buffer.concat([keyDecipher.update(encryptedDEKBuffer), keyDecipher.final()]);

  // 恢复 IV 和认证标签
  const iv = Buffer.from(combined.iv, 'hex');
  const authTag = Buffer.from(combined.authTag, 'hex');

  // 使用 DEK 解密实际数据
  const decipher = crypto.createDecipheriv('aes-256-gcm', dataEncryptionKey, iv);
  decipher.setAuthTag(authTag);

  // 解密并返回原始字符串
  let decrypted = decipher.update(combined.encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * 带错误处理的安全解密方法
 *
 * @param encryptedData - 加密后的 Base64 编码字符串
 * @param userProvidedKey - 用户提供的解密密钥
 * @returns 包含成功状态和数据或错误信息的对象
 *
 * @example
 * ```typescript
 * const result = await decryptCookieSafe(encryptedData, 'my-secret-key')
 * if (result.success) {
 *   console.log('解密成功:', result.data)
 * } else {
 *   console.error('解密失败:', result.error)
 * }
 * ```
 */
export async function decryptCookieSafe(
  encryptedData: string,
  userProvidedKey: string,
): Promise<{
  success: boolean;
  data?: string;
  error?: string;
}> {
  try {
    const decrypted = decryptCookie(encryptedData, userProvidedKey);
    return { success: true, data: decrypted };
  } catch (error) {
    // 可能的错误：密钥错误、数据被篡改、格式错误等
    return {
      success: false,
      error: error instanceof Error ? error.message : '解密失败',
    };
  }
}
