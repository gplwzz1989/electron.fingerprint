import { $http } from '@/http';
import { HttpsProxyAgent } from 'https-proxy-agent';

/**
 * 生成爱奇艺视频作品ID
 * @param cookie 账号cookie
 * @param postData 视频上传信息
 * @param proxyAgent 代理配置
 */
export const generateAiqiyiQipuId = async (
  cookie: string,
  postData: AiqiyiGenerateQipuIdInput,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<AiqiyiGenerateQipuIdResponse> => {
  const url = 'https://mp-api.iqiyi.com/v-catalog/api/1.0/union-catalog/generateQipuId';

  const headers = {
    cookie: cookie,
    referer: 'https://creator.iqiyi.com/',
    Origin: 'https://creator.iqiyi.com',
    'content-type': 'application/json',
  };

  const result = await $http.post(url, postData, {
    headers: headers,
    httpsAgent: proxyAgent,
    httpAgent: proxyAgent,
  });

  return result?.data;
};

export interface AiqiyiGenerateQipuIdInput {
  /**
   * 视频上传返回的文件ID
   */
  fileId: string;
  /**
   * 视频开始上传时间
   */
  fileUploadStartTime: number;
  /**
   * 视频结束上传时间
   */
  fileUploadEndTime: number;
}

export interface AiqiyiGenerateQipuIdResponse {
  httpStatus: number;
  /**
   * 状态码，0表示正常
   */
  code: number;
  msg: string;
  /**
   * 爱奇艺作品ID
   */
  data: number;
  msgCode: null;
}
