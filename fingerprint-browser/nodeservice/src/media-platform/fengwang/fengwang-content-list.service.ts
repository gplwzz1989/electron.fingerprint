//https://www.meipai.com/medias/video_convert_list

import { $http } from '@/http';

/**
 *
 * @param cookie
 * @param page
 * @param userId
 */
export const getFengWangMiniVideoListResponse = async (
  cookie: string,
  page: number = 1,
  userId: string,
): Promise<string> => {
  const url = `http://o.fun.tv/pgc/videos/${userId}/pg-${page}`;

  const headers = {
    cookie: cookie,
    referer: `http://o.fun.tv/pgc/videos/${userId}/`,
  };

  const result = await $http.get(url, { headers: headers, responseType: 'text' });

  return result.data;
};
