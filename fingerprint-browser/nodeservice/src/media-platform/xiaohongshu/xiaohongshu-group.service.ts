import { getNewSign } from '@/media-platform/xiaohongshu/xiaohongshu-base.service';
import { $http } from '@/http';

export const getXiaohongshuGroupResponse = async (
  cookie: string,
  cusor?: string,
): Promise<XiaohongshuGroupResponse> => {
  const urlPath = `/api/im/web/nns/group_list?note_id=`;

  const url = `https://edith.xiaohongshu.com${urlPath}`;

  const signStr = await getNewSign(urlPath, undefined);
  const sign = JSON.parse(signStr);
  if (sign['a1']) {
    cookie = `${cookie};a1=${sign['a1']}`;
  }
  const headers = {
    cookie: cookie,
    Origin: 'https://creator.xiaohongshu.com',
    referer: 'https://www.xiaohongshu.com',
  };
  headers['X-s'] = sign['X-s'];
  headers['X-t'] = sign['X-t'];

  const result = await $http.get(url, { headers: headers });

  return result.data;
};

export interface XiaohongshuGroupResponse {
  code: number;
  success: boolean;
  msg: string;
  data: {
    group_list: [
      {
        group_id: string;
        avatar: string;
        group_name: string;
        desc: string;
        linkable: boolean;
      },
    ];
  };
}
