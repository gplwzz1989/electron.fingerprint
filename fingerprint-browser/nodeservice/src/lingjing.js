'use strict';

(function attachLingjing(globalObject) {
  const currentLingjing =
    globalObject.lingjing && typeof globalObject.lingjing === 'object' ? globalObject.lingjing : {};

  /**
   * 解密抖音消息图片并返回 base64
   * 每个功能函数内部自包含，避免影响 lingjing 下的其他函数
   * @param {{ url: string, skey: string }} params
   * @returns {Promise<string>}
   */
  async function decodeDouYinMsgImage(params) {
    if (!params || typeof params !== 'object') {
      throw new Error('入参不能为空');
    }

    const { url, skey } = params;

    if (typeof url !== 'string' || !url.trim()) {
      throw new Error('url 不能为空');
    }

    if (typeof skey !== 'string' || !skey.trim()) {
      throw new Error('skey 不能为空');
    }

    if (!globalObject.fetch || !globalObject.crypto || !globalObject.crypto.subtle) {
      throw new Error('当前浏览器环境不支持解密所需能力');
    }

    const normalizedSkey = skey.trim().replace(/\s+/g, '');
    if (!/^[\da-fA-F]+$/.test(normalizedSkey) || normalizedSkey.length % 2 !== 0) {
      throw new Error('skey 格式不正确，必须是偶数长度的十六进制字符串');
    }

    const keyBytes = new Uint8Array(normalizedSkey.length / 2);
    for (let index = 0; index < normalizedSkey.length; index += 2) {
      keyBytes[index / 2] = parseInt(normalizedSkey.slice(index, index + 2), 16);
    }

    if (keyBytes.length !== 32) {
      throw new Error('skey 长度不正确，解密需要 32 字节密钥');
    }

    let encryptedBuffer;
    try {
      const response = await globalObject.fetch(url.trim());
      if (!response.ok) {
        throw new Error(`图片请求失败，状态码：${response.status}`);
      }

      encryptedBuffer = new Uint8Array(await response.arrayBuffer());
    } catch (error) {
      if (error instanceof Error && error.message) {
        throw error;
      }

      throw new Error('图片请求失败，请检查 url 是否可用');
    }

    if (encryptedBuffer.length <= 12 + 16) {
      throw new Error('图片二进制内容无效');
    }

    const iv = encryptedBuffer.slice(0, 12);
    const payload = encryptedBuffer.slice(12);

    let plainBuffer;
    try {
      const cryptoKey = await globalObject.crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt']);
      const decrypted = await globalObject.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv,
          tagLength: 128,
        },
        cryptoKey,
        payload,
      );
      plainBuffer = new Uint8Array(decrypted);
    } catch (error) {
      throw new Error('图片解密失败，请确认 url 和 skey 是否匹配');
    }

    let binary = '';
    const chunkSize = 32768;
    for (let index = 0; index < plainBuffer.length; index += chunkSize) {
      const chunk = plainBuffer.subarray(index, index + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }

    return globalObject.btoa(binary);
  }

  currentLingjing.decodeDouYinMsgImage = decodeDouYinMsgImage;
  globalObject.lingjing = currentLingjing;
})(typeof globalThis !== 'undefined' ? globalThis : window);
