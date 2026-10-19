/**
 * 获取当前时间戳
 * @param {number} len 长度
 * @return {string}
 */
export const getNowTimeStamp = (len?: number): string => {
  if (len) {
    return Date.now().toString().substring(0, len);
  } else {
    return Date.now().toString();
  }
};
