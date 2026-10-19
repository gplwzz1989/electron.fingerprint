import { $http } from '@/http';

/**
 *
 * @param cookie
 * @param docId
 */
export const deleteCheJiaHaoMediaResponse = async (
  cookie: string,
  docId: string,
): Promise<{ returncode: number; message: string; result: number }> => {
  //           https://creator.autohome.com.cn/openapi/content-api/operation/delete/old_info?maindataType=chejiahao&infoType=1&bizId=11692970
  const url = `https://creator.autohome.com.cn/openapi/content-api/operation/delete/info?id=${docId}`;

  const headers = {
    cookie: cookie,
    referer: 'https://creator.autohome.com.cn/web/publish/video',
    Origin: 'https://creator.autohome.com.cn',
  };

  const result = await $http.get(url, { headers: headers });

  return result.data;
};
