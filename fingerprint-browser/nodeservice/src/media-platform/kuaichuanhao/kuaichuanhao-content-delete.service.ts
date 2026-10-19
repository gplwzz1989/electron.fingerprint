import { $http } from '@/http';
import dayjs from 'dayjs';

export const deleteKuaiChuanArticle = async (
  cookie: string,
  docId: string,
  createTime: string,
): Promise<{ errno: number; errmsg: string }> => {
  const url = 'https://kuaichuan.360kuai.com/articleManage/del';

  const headers = {
    cookie: cookie,
    referer: 'https://kuaichuan.360kuai.com',
    Origin: 'https://kuaichuan.360kuai.com',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const postData = `id=${docId}&create_time=${encodeURIComponent(
    createTime ?? dayjs(new Date()).format('YYYY-MM-DD HH:mm:ss'),
  )}`;

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};
