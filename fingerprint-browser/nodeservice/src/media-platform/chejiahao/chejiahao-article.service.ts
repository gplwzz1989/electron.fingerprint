import { $http } from '@/http';
import { HttpsProxyAgent } from 'https-proxy-agent';

export const convertCheJiaHaoImageResponse = async (
  cookie: string,
  imgUrl: string,
): Promise<CheJiaHaoImageConvertResponse> => {
  const url = `https://chejiatong.autohome.com.cn/FileUpload/RemoteImage?url=${encodeURIComponent(imgUrl)}`;

  const headers = {
    cookie: cookie,
    accept: 'application/json, text/plain, */*',
    referer: 'https://chejiatong.autohome.com.cn/',
    Origin: 'https://chejiatong.autohome.com.cn',
    'Content-Type': 'application/json',
  };

  const result = await $http.get(url, { headers: headers });

  return result.data;
};

export interface CheJiaHaoImageConvertResponse {
  /**
   * 返回状态码（0 通常表示成功，可根据业务扩展其他状态码）
   */
  returncode: number;

  /**
   * 提示信息（null 表示无额外提示）
   */
  message: string | null;

  /**
   * 图片核心信息结果集
   */
  result: {
    /**
     * 图片文件名（含后缀）
     */
    FileName: string;

    /**
     * 图片访问 URL
     */
    Url: string;

    /**
     * 图片宽度（像素）
     */
    Width: number;

    /**
     * 图片高度（像素）
     */
    Height: number;

    /**
     * 图片文件大小（字节数）
     */
    Length: number;

    /**
     * 图片展示 ID（null 表示暂未分配/无需展示 ID）
     */
    ImgShowId: string | null;
  };
}

export const saveCheJiaHaoArticleResponse = async (
  cookie: string,
  postStr: string,
  pubType: 0 | 1,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<CheJiaHaoArticlePublishResponse> => {
  const url = `https://creator.autohome.com.cn/openapi/content-api/gc/article/publish?t=${Date.now()}&publishType=${pubType}`;
  const headers = {
    cookie: cookie,
    accept: 'application/json, text/plain, */*',
    referer: 'https://chejiatong.autohome.com.cn/',
    'Content-Type': 'application/json; charset=UTF-8',
  };

  const result = await $http.post(url, postStr, { headers: headers, httpsAgent: proxyAgent, httpAgent: proxyAgent });

  return result.data;
};

export interface CheJiaHaoArticlePublishResponse {
  returncode: number;
  message: string;
  result: {
    id: string;
    draftId: string;
    content: string;
  };
}

export const publishCheJiaHaoArticleResponse = async (
  cookie: string,
  postStr: string,
  pubType: 0 | 1,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<CheJiaHaoArticlePublishResponse> => {
  const url = `https://creator.autohome.com.cn/openapi/content-api/gc/article/publish?t=${Date.now()}&publishType=${pubType}`;
  const headers = {
    cookie: cookie,
    accept: 'application/json, text/plain, */*',
    referer: 'https://chejiatong.autohome.com.cn/',
    'Content-Type': 'application/json; charset=UTF-8',
  };

  const result = await $http.post(url, postStr, { headers: headers, httpsAgent: proxyAgent, httpAgent: proxyAgent });

  return result.data;
};
