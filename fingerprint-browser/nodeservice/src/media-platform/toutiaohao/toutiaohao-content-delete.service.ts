import { $http } from '@/http';

export const deleteTouTiaoMediaContent = async (
  cookie: string,
  docId: string,
  type: 1 | 2 = 1,
): Promise<{ code: number; message: string }> => {
  const url = `https://mp.toutiao.com/mp/agw/creator_center/delete?type=${type}&gid=${docId}&is_comment=false&app_id=1231`;
  const headers = {
    cookie: cookie,
    referer: 'https://mp.toutiao.com/profile_v4/manage/content/all',
    origin: 'https://mp.toutiao.com',
    'Content-Type': 'application/json',
  };

  const postData = { type: 1, gid: docId, is_comment: false };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export const deleteArticleContent = async (cookie: string, docId: string): Promise<ToutiaoDeleteArticleResponse> => {
  //https://mp.toutiao.com/mp/agw/creator_center/delete?type=1&gid=1842302851967040&is_comment=false&app_id=1231
  const url = `https://mp.toutiao.com/mp/agw/article/delete/`;
  const headers = {
    cookie: cookie,
    referer: 'https://mp.toutiao.com/profile_v4/manage/content/all',
    origin: 'https://mp.toutiao.com',
  };

  const postData = `item_id=${docId}&pgc_id=${docId}&id=${docId}&article_type=0&group_id=${docId}&source_type=0&has_article_pgc=1&book_id=&create_time=${(
    Date.now() / 1000
  ).toFixed(0)}&group_source=2&mp_id=54&sync_source=`;

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface ToutiaoDeleteArticleResponse {
  code: number;
  data: null;
  err_no: number;
  message: string;
  now: 1748510507;
  reason: 'success';
}

export const deleteVideoContent = async (
  cookie: string,
  docId: string,
  csrfToken: string,
): Promise<ToutiaoDeleteVideoContentResponse> => {
  const url = `https://mp.toutiao.com/xigua/api/video/articledelete/`;
  const headers = {
    cookie: cookie,
    referer: 'https://mp.toutiao.com/profile_v4/manage/content/all',
    origin: 'https://mp.toutiao.com',
    'x-csrf-token': csrfToken,
  };

  const postData = { ItemId: docId, SourceType: 2, DelSlaveId: '', Reason: '' };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  const re = result.data as ToutiaoDeleteVideoContentResponse;
  const cookies = result.headers['set-cookie'];
  if (cookies?.length) {
    re.csrfToekn = cookies[0].split(';')[0]?.replace('set-cookie:', '')?.split('=')[1];
  }
  return re;
};

export interface ToutiaoDeleteVideoContentResponse {
  code: number;
  msg: string;
  csrfToekn: string;
}

export const deleteMiniVideoContent = async (cookie: string, docId: string): Promise<ToutiaoDelteMiniVideoResponse> => {
  const url = `https://mp.toutiao.com/ugc/publish/video/v1/delete/?item_id=${docId}`;
  const headers = {
    cookie: cookie,
    referer: 'https://mp.toutiao.com/profile_v4/manage/content/all',
    origin: 'https://mp.toutiao.com',
  };

  const result = await $http.get(url, {
    headers: headers,
  });

  return result.data;
};

export interface ToutiaoDelteMiniVideoResponse {
  err_code: number;
  err_no: number;
  message: string;
}
