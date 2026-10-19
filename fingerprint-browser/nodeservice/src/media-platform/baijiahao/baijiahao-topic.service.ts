import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { BadRequestException } from '../../error';

/**
 * 获取话题列表
 * @param cookie
 * @param keyword 搜索关键字
 * @param title 搜索标题
 * @param resource_type 话题数据来源（1: 图文 3: 视频 4: 动态）
 */
export const getTopicListAsync = async (
  cookie: string,
  keyword: string,
  title: string,
  resource_type: 1 | 3 | 4 = 3,
): Promise<BaijiahaoTopicResponse> => {
  let mediaType: string;

  switch (resource_type) {
    case 1:
      mediaType = 'news';
      break;
    case 3:
      mediaType = 'videoV2';
      break;
    case 4:
      mediaType = 'events';
      break;
    default:
      mediaType = 'videoV2';
      break;
  }

  const result = await $http.get<unknown, AxiosResponse<BaijiahaoTopicResponse>>(
    'https://baijiahao.baidu.com/pcui/pcpublisher/searchtopic',
    {
      headers: {
        cookie: cookie,
        referer: `https://baijiahao.baidu.com/builder/rc/edit?type=${mediaType}`,
        host: 'baijiahao.baidu.com',
      },
      params: {
        content: keyword,
        resource_type: resource_type,
        title: title,
      },
    },
  );

  // 请求失败
  if (result.data.errno !== 0) {
    throw new BadRequestException(result.data?.errmsg, result.data?.errno, result.data);
  }

  return result.data;
};

export interface BaijiahaoTopicItem {
  category: string;
  guide: string;
  id: string;
  link: {
    scheme: string;
    url: string;
  };
  sv_small_images: {
    height?: string;
    http?: string;
    https?: string;
    wide?: string;
  };
  title: string;
}

export interface BaijiahaoTopicResponse {
  data: {
    recommend: Array<BaijiahaoTopicItem>;
    hot: Array<BaijiahaoTopicItem>;
  };
  errno: number;
  errmsg: string;
}
