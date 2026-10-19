import { $http } from '@/http';

export const deleteMeiPaiVideoResponse = async (
  cookie: string,
  docId: string,
): Promise<{ error_code: 0; error: 'success' }> => {
  const url = `https://www.meipai.com/medias/remove_video_convert?vid=${docId}`;

  const headers = {
    cookie: cookie,
    referer: 'https://www.meipai.com/medias/upload',
    Origin: 'https://www.meipai.com',
  };

  const result = await $http.get(url, { headers: headers });

  return result.data;
};
