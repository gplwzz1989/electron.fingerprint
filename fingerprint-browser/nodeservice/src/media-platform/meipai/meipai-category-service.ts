import { $http } from '@/http';

export interface MeiPaiCategoryInfo {
  id: number;
  name: string;
  pid: number;
  child_list: Array<MeiPaiCategoryInfo>;
}

export const getMeiPaiCategoryResponse = async (cookie: string): Promise<MeiPaiCategoryInfoResponse> => {
  const url = 'https://www.meipai.com/medias/upload';

  const headers = {
    cookie: cookie,
    referer: 'https://www.meipai.com/medias/upload',
    Origin: 'https://www.meipai.com',
  };

  const result = await $http.get(url, { headers: headers, responseType: 'text' });

  const jsonStr = result.data.toString()?.split('<script>window.PHPDATA = ')[1].split('</script>')[0];
  const re = JSON.parse(jsonStr);

  return re;
};

export interface MeiPaiCategoryInfoResponse {
  category_list: Array<MeiPaiCategoryInfo>;
}
