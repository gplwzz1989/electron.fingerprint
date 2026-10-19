import { $http } from '@/http';

/**
 *
 * @param cookie
 * @param type 1:文章  2:视频
 */
export const getAzhanMediaCategory = async (
  cookie: string,
  type: 1 | 2 = 2,
): Promise<Array<AZhanVideoCategoryInfo>> => {
  const url = `https://member.acfun.cn/common/api/getChannelList`;

  const headers = {
    cookie: cookie,
    referer: 'https://member.acfun.cn',
    Origin: 'https://member.acfun.cn',
  };

  const postData = { types: type };

  const result = await $http.post(url, postData, {
    headers: headers,
  });

  return result.data;
};

export interface AZhanVideoCategoryInfo {
  /**
   * 子分类
   */
  children?: AZhanVideoCategoryInfo[];
  realms?: Array<{
    realmId: string;
    introduction: string;
    realmName: string;
  }>;
  channelId: string;
  channelType?: number;
  name: string;
  introduction?: string;
}
