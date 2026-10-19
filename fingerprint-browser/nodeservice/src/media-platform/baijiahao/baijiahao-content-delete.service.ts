import { $http } from '@/http';

export const withDrawContent = async (
  cookie: string,
  docId: string,
  token: string,
): Promise<BaijiahaoWithDrawResponse> => {
  const url = `https://baijiahao.baidu.com/pcui/article/withdraw`;
  const headers = {
    cookie: cookie,
    referer: 'https://baijiahao.baidu.com',
    origin: 'https://baijiahao.baidu.com',
    'Content-Type': 'application/x-www-form-urlencoded',
    token: token,
  };

  const postData = `article_id=${docId}`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface BaijiahaoWithDrawResponse {
  errno: number;
  errmsg: string;
  data: {
    /**
     * 不知道什么用，备用
     */
    article_id: string;
  };
}

export const deleteContent = async (cookie: string, docId: string, token: string): Promise<BaijiahaoDeleteResponse> => {
  const url = `https://baijiahao.baidu.com/pcui/article/remove`;
  const headers = {
    cookie: cookie,
    referer: 'https://baijiahao.baidu.com',
    origin: 'https://baijiahao.baidu.com',
    'Content-Type': 'application/x-www-form-urlencoded',
    token: token,
  };

  const postData = `article_id=${docId}`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface BaijiahaoDeleteResponse {
  errno: number;
  errmsg: string;
  data: true;
}

export const deleteMiniVideoContent = async (
  cookie: string,
  docId: string,
  token: string,
): Promise<BaijiahaoDeleteMiniVideoRequest> => {
  const url = `https://baijiahao.baidu.com/pcui/pcpublisher/deletedynamic`;
  const headers = {
    cookie: cookie,
    referer: 'https://baijiahao.baidu.com',
    origin: 'https://baijiahao.baidu.com',
    'Content-Type': 'application/x-www-form-urlencoded',
    token: token,
  };

  const postData = `feed_id=${docId}`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface BaijiahaoDeleteMiniVideoRequest {
  errno: number;
  errmsg: string;
  data: null;
  request_id: string;
}

export const deleteBaiJiaDynamicContent = async (
  cookie: string,
  docId: string,
  token: string,
): Promise<BaijihaoDeleteDynamicResponse> => {
  const url = `https://baijiahao.baidu.com/pcui/pcpublisher/deletedynamic`;
  const headers = {
    cookie: cookie,
    referer: 'https://baijiahao.baidu.com',
    origin: 'https://baijiahao.baidu.com',
    'Content-Type': 'application/x-www-form-urlencoded',
    token: token,
  };

  const postData = `content=%E5%88%A0%E9%99%A4%E4%B8%8D%E5%8F%AF%E6%81%A2%E5%A4%8D%EF%BC%8C%E7%A1%AE%E8%AE%A4%E5%88%A0%E9%99%A4%E8%AF%A5%E6%9D%A1%E5%8A%A8%E6%80%81%E5%90%97%EF%BC%9F&action=recall&id=${
    docId.split('_')[0]
  }&feed_id=${docId.split('_')[1]}`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface BaijihaoDeleteDynamicResponse {
  errno: 0;
  errmsg: 'success';
  data: { errno: '0'; feed_id: '5795202801039466172' };
  request_id: '1852246808';
  ie: 'utf-8';
}
