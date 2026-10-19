export const access_regex = /(?:access|vqq_access)_token=(.*?);/;
export const vusession_regex = /(?:vusession|vqq_vusession)=(.*?);/;
//vqq_vusession  vqq_access_token
/**
 * 腾讯视频获取actk和vstk
 * @param params vstk传cookie里面的vusession，actk传cookie里面的access_token
 */
export const calculateVS_ACTK = (params: string): number => {
  if (!params) return 0;
  const n: number = params.length;
  let i: number = 5381;
  for (let e = 0; e < n; ++e) {
    i += (i << 5) + params[e].charCodeAt(0);
  }
  return 2147483647 & i;
};

/**
 * 获取cookie中的token
 * @param cookie
 */
export const getCookieAccessTokenValue = (cookie: string) => {
  const accessTokneMatch = access_regex.exec(cookie);
  return accessTokneMatch ? accessTokneMatch[1] : '';
};

/**
 * 获取cookie中vusession
 * @param cookie
 */
export const getCookieVusessionValue = (cookie: string) => {
  const vusessionMatch = vusession_regex.exec(cookie);
  return vusessionMatch ? vusessionMatch[1] : '';
};
