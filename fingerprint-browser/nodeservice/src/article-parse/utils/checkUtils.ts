class CheckUtils {
  /**
   * 判断字符串是否为空，或空对象
   * @param {string} value
   * @returns {boolean}
   * @constructor
   */
  public IsNullOrWhiteSpace(value?: string) {
    if (!value) {
      return true;
    }

    return value.trim().length === 0;
  }
}

export default new CheckUtils();
