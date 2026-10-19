import { $http } from '@/http';
import { Random } from '@/utils';
import buffer from 'buffer';
import FormData from 'form-data';
import { HttpsProxyAgent } from 'https-proxy-agent';

export const getPublishToken = async (cookie: string): Promise<KuaiChuanPublishTokenResponse> => {
  const url = 'https://kuaichuan.360kuai.com/token/gettoken';

  const headers = {
    Accept: 'application/json, text/plain, */*',
    cookie: cookie,
    referer: 'https://kuaichuan.360kuai.com',
  };

  const result = await $http.get(url, { headers: headers });

  const re = result.data;
  const cookies = result.headers['set-cookie'] ?? ['opennews=arsg1425sfagsf'];
  for (const cookie of cookies) {
    if (cookie?.includes('opennews')) {
      re['opennews'] = cookie.split(';')[0]?.split('=')[1]?.trim();
      break;
    }
  }
  return result.data;
};

export interface KuaiChuanPublishTokenResponse {
  errno: number;
  errmsg: string;
  /**
   * 发布token
   */
  data: string;
  opennews: string;
}

export const covertImgFromUrl = async (cookie: string, imgUrl: string): Promise<KuaiChuanImageConvertResponse> => {
  const url = 'https://kuaichuan.360kuai.com/upload/convertImg?source=post&picarule_facedetect=1';

  const headers = {
    cookie: cookie,
    referer: 'https://kuaichuan.360kuai.com',
    Origin: 'https://kuaichuan.360kuai.com',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const postData = `op=false&img_list=${encodeURIComponent(imgUrl)}&group_id=78767${new Random().Next(
    1111111111,
    9999999999,
  )}&waters=1%7C1%7C1%7C1`;

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

export interface KuaiChuanImageConvertResponse {
  /**
   * 0为正常
   */
  errno: number;
  errmsg: string;
  data: {
    list: Array<{ url: string; errno: number; msg: string }>;
    group_id: number;
  };
}

export const uploadImageResponse = async (
  cookie: string,
  imageData: buffer.Buffer,
): Promise<KuaiChuanImageUploadResponse> => {
  const url = 'https://kuaichuan.360kuai.com/upload/img?source=post';

  const headers = {
    cookie: cookie,
    referer: 'https://kuaichuan.360kuai.com',
    Origin: 'https://kuaichuan.360kuai.com',
  };

  const postData = new FormData();
  postData.append('img', imageData, {
    filename: `${new Random().Next(111111, 999999)}.jpg`,
    contentType: 'image/jpeg',
  });

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

export interface KuaiChuanImageUploadResponse {
  errno: number;
  errmsg: string;
  data: {
    url: string;
    type: string;
    file_md5: string;
  };
}

export const publishKuaiChuanArticleResponse = async (
  cookie: string,
  postStr: string,
  pubType: 0 | 1,
  proxyAgent?: HttpsProxyAgent<string> | object,
): Promise<KuaiChuanHaoPublishResponse> => {
  const url = `https://kuaichuan.360kuai.com/articleManage/${!pubType ? 'doDraft' : 'publish'}`;

  const headers = {
    Accept: 'application/json, text/plain, */*',
    'Accept-Encoding': 'gzip, deflate, br',
    cookie: cookie,
    referer: 'https://kuaichuan.360kuai.com/',
    Origin: 'https://kuaichuan.360kuai.com',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const result = await $http.post(url, postStr, { headers: headers, httpsAgent: proxyAgent, httpAgent: proxyAgent });

  return result.data;
};

export interface KuaiChuanHaoPublishResponse {
  errno: number;
  errmsg: string;
  data: { id: number; url: string };
}
