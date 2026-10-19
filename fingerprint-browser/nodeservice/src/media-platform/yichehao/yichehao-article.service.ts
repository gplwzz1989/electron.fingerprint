import { Guid } from '@/utils';
import { $http } from '@/http';
import { HttpsProxyAgent } from 'https-proxy-agent';
import buffer from 'buffer';
import FormData from 'form-data';

export const convertYiCheHaoImageResponse = async (
  cookie: string,
  imageUrl: string,
): Promise<ConvertImageInfoResponse> => {
  const url = 'https://mp.yiche.com/api/upload_image/mp_convert_upload';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yiche.com/',
    Origin: 'https://mp.yiche.com',
    cid: 500,
    ver: '1.0.4',
    'x-user-guid': Guid.NewGuid().toString(),
    'Content-Type': 'application/json',
  };

  const postData = {
    outImageUrl: imageUrl,
    type: 6,
    queryBase64: false,
    autoRecStatus: true,
  };

  const result = await $http.post<ConvertImageInfoResponse>(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface ConvertImageInfoResponse {
  /** 状态码，"1" 表示成功 */
  status: string;
  /** 状态描述信息 */
  message: string;
  /** 错误代码，空字符串表示无错误 */
  ercd: string;
  /** 图片相关数据 */
  data: {
    /** 完整图片 URL，可能为 null */
    fullUrl: string | null;
    /** 图片宽度 */
    width: number;
    /** 图片高度 */
    height: number;
    /** 文件大小（字节数） */
    fileSize: number;
    /** 图片的唯一标识键 */
    imgKey: string;
    /** 图片的 Base64 编码字符串，可能为 null */
    imgBase64: string | null;
    /** 序列号，可能为 null */
    serialId: string | null;
  };
}

export const publishYiCheHaoArticleResponse = async (
  cookie: string,
  postData?: string,
  proxy?: HttpsProxyAgent<string> | object,
): Promise<{ status?: string; message?: string; data: { newsId?: string } }> => {
  const url = `https://mp.yiche.com/web_mp/api/v1/pub/savenews`;

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yidianzixun.com/',
    Origin: 'https://mp.yidianzixun.com',
    'content-type': 'application/json',
  };

  const result = await $http.post(url, postData, { headers: headers, httpAgent: proxy, httpsAgent: proxy });

  return result.data;
};
export const uploadYiCheHaoArticleImageResponse = async (
  cookie: string,
  imageData: buffer.Buffer,
  width: number,
  height: number,
): Promise<UploadArticleImageInfoResponse> => {
  const url = 'https://mp.yiche.com/api/upload_image/mp_real_upload';

  const headers = {
    cookie: cookie,
    referer: 'https://mp.yiche.com/',
    Origin: 'https://mp.yiche.com',
    cid: '500',
    ver: '1.0.4',
    'x-user-guid': Guid.NewGuid().toString(),
  };

  const formData = new FormData();
  formData.append('watermarkStatus', 'true');
  formData.append('autoRecStatus', 'true');
  formData.append('queryBase64', 'true');
  formData.append('type', '6');
  formData.append('width', width.toString());
  formData.append('height', height.toString());
  formData.append('file', imageData, {
    filename: `${Guid.NewGuid().toString().replace(/-/g, '')}.png`,
    contentType: `image/png`,
  });

  const result = await $http.post<UploadArticleImageInfoResponse>(url, formData, {
    headers: headers,
  });

  return result.data;
};

export interface UploadArticleImageInfoResponse {
  /** 状态码，"1" 表示成功 */
  status: string;
  /** 状态描述信息 */
  message: string;
  /** 错误代码，空字符串表示无错误 */
  ercd: string;
  /** 图片相关数据 */
  data: {
    /** 完整图片 URL，可能为 null */
    fullUrl: string | null;
    /** 图片宽度 */
    width: number;
    /** 图片高度 */
    height: number;
    /** 文件大小（字节数） */
    fileSize: number;
    /** 图片的唯一标识键 */
    imgKey: string;
    /** 图片的 Base64 编码字符串，可能为 null */
    imgBase64: string | null;
    /** 序列号，可能为 null */
    serialId: string | null;
  };
}
