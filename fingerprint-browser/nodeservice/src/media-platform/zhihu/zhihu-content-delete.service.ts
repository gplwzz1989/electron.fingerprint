import { $http } from '@/http';

export const deleteVideoContent = async (
  cookie: string,
  docId: string,
  isDraft: boolean,
): Promise<ZhihuDeleteVideoResponse> => {
  const urlEnd = isDraft ? `drafts/${docId}` : `${docId}`;
  const url = `https://www.zhihu.com/api/v4/zvideos/${urlEnd}`;
  const headers = {
    cookie: cookie,
    referer: 'https://www.zhihu.com/creator/manage/creation/zvideo',
    origin: 'https://www.zhihu.com/creator/manage/creation/zvideo',
  };

  const result = await $http.delete(url, {
    headers: headers,
  });

  return result.data;
};

export const deleteArticleContent = async (
  cookie: string,
  docId: string,
  isDraft: boolean,
): Promise<ZhihuDeleteVideoResponse> => {
  const urlEnd = isDraft ? `${docId}/draft` : `${docId}`;
  const url = `https://www.zhihu.com/api/v4/articles/${urlEnd}`;
  const headers = {
    cookie: cookie,
    referer: 'https://www.zhihu.com/creator/manage/creation/draft?type=article',
    origin: 'https://www.zhihu.com/',
  };

  const result = await $http.delete(url, {
    headers: headers,
  });

  return result.data;
};

export interface ZhihuDeleteVideoResponse {
  error: { code: number; name: string; message: string };
}

export const deleteDynamicContent = async (
  cookie: string,
  docId: string,
): Promise<{ success: boolean; error: { message: string; code: number; name: string } }> => {

  const url = `https://www.zhihu.com/api/v4/pins/${docId}`;
  const headers = {
    cookie: cookie,
    referer: 'https://www.zhihu.com/creator/manage/creation/draft?type=article',
    origin: 'https://www.zhihu.com/',
  };

  const result = await $http.delete(url, {
    headers: headers,
  });

  return result.data;
};
