import { getNewSign } from '@/media-platform/xiaohongshu/xiaohongshu-base.service';
import { $http } from '@/http';

export const getXiaohongshuCollectionResponse = async (
  cookie: string,
  cusor?: string,
): Promise<XiaohongshuCollectionResponse> => {
  const urlPath = `/api/sns/v1/note/collection/pc/list_v2`;

  const url = `https://edith.xiaohongshu.com${urlPath}`;

  const postData = { cursor: cusor ?? '', need_type_list: [0], target_uid: '' };

  const signStr = await getNewSign(urlPath, JSON.stringify(postData));
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

  const result = await $http.post(url, postData, { headers: headers });

  return result.data;
};

export interface XiaohongshuCollectionResponse {
  result: number;
  success: boolean;
  msg: string;
  data: {
    collection_info_list: [XiaoHongShuCollectionInfo];
    has_more: boolean;
    next_cursor: string;
  };
}

export interface XiaoHongShuCollectionInfo {
  name: string;
  desc: string;
  total_episodes: number;
  /**
   * 创建时间戳
   */
  create_time: number;
  paid: number;
  type: number;
  id: string;
  icon: string;
  collected: boolean;
  /**
   * 笔记数
   */
  note_num: number;
  /**
   * 观看数
   */
  view_num: 0;
}
