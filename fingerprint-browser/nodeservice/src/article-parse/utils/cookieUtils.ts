import CheckUtils from './checkUtils';

class CookieUtils {
  /**
   * 以KeyValue结构返回
   * @param cookies
   */
  toKeyValue(cookies: string): string {
    // 非法内容
    if (CheckUtils.IsNullOrWhiteSpace(cookies)) {
      return cookies;
    }

    try {
      const parseResult = JSON.parse(cookies);
      return parseResult.map((cookie: any) => `${cookie.name}=${cookie.value}`).join('; ');
    } catch (e: any) {
      throw new Error(e);
    }
  }
}

export default new CookieUtils();
