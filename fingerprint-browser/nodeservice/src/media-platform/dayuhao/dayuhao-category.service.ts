import { $http } from '../../http';

export const getVideoCategoryListResponse = async (cookie: string): Promise<Array<string>> => {
  const url = 'https://mp.dayu.com/video-category';

  const headers = {
    cookie: cookie,
    Referer: 'https://mp.dayu.com/dashboard/video/write',
    'Content-type': 'application/json',
  };

  const result = await $http.get(url, { headers: headers });

  return result.data;
};

export const getMiniVideoCategoryListResponse = async (cookie: string): Promise<Array<string>> => {
  const url = 'https://mp.dayu.com/minivideo-category';

  const headers = {
    cookie: cookie,
    Referer: 'https://mp.dayu.com/dashboard/minivideo/write',
    'Content-type': 'application/json',
  };

  const result = await $http.get(url, { headers: headers });

  return result.data;
};
