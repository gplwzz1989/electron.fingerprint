import crypto from 'crypto';
import { $http } from '../../http';
import { getSignServerUrl } from '../../utils';

const cacheSign = {};
/**
 * 获取签名
 * @param needSignStr
 */
export const getSign = async (needSignStr: string): Promise<string> => {
  try {
    const md5 = crypto.createHash('md5').update(needSignStr).digest('hex');
    if (cacheSign[md5]) {
      return cacheSign[md5];
    }

    const url = getSignServerUrl('baijiahao') + '/Sign/GetSign';

    // noinspection SpellCheckingInspection
    const postData = { url: '', cookie: needSignStr, signType: 'browser', signCommand: 'baijiahao' };

    const headers = {
      'Content-Type': 'application/json',
    };

    const result = await $http.post(url, postData, { headers });

    const signStr = result.data?.signature ?? '';

    if (signStr) {
      cacheSign[md5] = signStr;
    }
    return signStr;
  } catch (e) {
    console.debug('百家号签名异常', e?.toString());
  }

  return '';
};
