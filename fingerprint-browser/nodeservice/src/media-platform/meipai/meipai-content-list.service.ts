//https://www.meipai.com/medias/video_convert_list

import { $http } from '@/http';

export const getMeiPaiContentIndexPage = async (cookie: string,page:number): Promise<string> => {
  const url = `https://www.meipai.com/medias/video_convert_list?p=${page}`;

  const headers = {
    cookie: cookie,
    referer: 'https://www.meipai.com/medias/upload',
    Origin: 'https://www.meipai.com',
  };

  const result = await $http.get(url, { headers: headers });

  return result.data;
};

export interface MeiPaiContentItem
{
  docId:string,
  publishId:string,
  publishTime:string,
  status:string,
  href?:string,
  coverUrl:string,
}