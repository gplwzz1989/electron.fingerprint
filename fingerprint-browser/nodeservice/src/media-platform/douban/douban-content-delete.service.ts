import { $http } from '@/http';
export const deleteDouBanArticle = async (cookie: string, docId: string): Promise<string> => {
  const url = `https://www.douban.com/note/${docId}/remove`;

  const headers = {
    cookie: cookie,
    referer: 'https://accounts.douban.com/passport/setting',
    Origin: 'https://accounts.douban.com/',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const postData = `ck=${cookie.split('ck=')[1]?.split(';')[0]}`;

  const result = await $http.post(url, postData, { headers: headers, responseType: 'text', maxRedirects: 0 });

  return result.data;
};
