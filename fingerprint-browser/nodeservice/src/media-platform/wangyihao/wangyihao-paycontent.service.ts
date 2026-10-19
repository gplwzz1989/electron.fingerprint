import { $http } from '../../http';
import { AxiosResponse } from 'axios';
import { GetTimeStamp } from '../../utils';
import { BadRequestException } from '../../error';

/**
 * 获取网易云付费内容
 * @param cookie
 * @param realUserId 用户信息realUserId
 * @param wemediaId 用户信息wemediaId
 * @param keyword 搜索关键字
 * @param categoryStr 分类字符串（使用,分隔）
 * @param ename 用户ename
 * @param columnTypeList 付费类型 ‘’ 单篇付费， ‘1’ 文章专栏，‘3’ 视频专栏 ‘5’ 短剧专栏
 */
export const getPayContentAsync = async (
  cookie: string,
  realUserId: string,
  wemediaId: string,
  keyword: string,
  categoryStr: string,
  ename: string,
  columnTypeList: '' | '1' | '3' | '5' = '',
): Promise<WangyihaoPayContentResponse> => {
  let contentTypeList: string;
  if (columnTypeList === '') {
    contentTypeList = 'doc';
  } else {
    contentTypeList = 'paidCollect';
  }

  const result = await $http.get<unknown, AxiosResponse<WangyihaoPayContentResponse>>(
    'https://mp.163.com/wemedia/video/categoryV6/getTree.do',
    {
      headers: {
        cookie: cookie,
        referer: 'https://mp.163.com/subscribe_v3/index.html',
        Origin: 'https://mp.163.com',
        Host: 'mp.163.com',
      },
      params: {
        _: GetTimeStamp(13),
        realUserId: realUserId,
        wemediaId: wemediaId,
        contentTypeList: contentTypeList,
        columnTypeList: columnTypeList,
        order: 1,
        keyWordList: keyword,
        tid: ename,
        category: categoryStr,
      },
    },
  );

  // 请求失败
  if (result.data.code !== 1) {
    throw new BadRequestException(result.data?.msg, result.data?.code, result.data);
  }

  return result.data;
};

export interface PayContentResponse {
  /**
   * 内容id
   */
  contentId: string;

  /**
   * 内容类型
   */
  contentType: string;

  /**
   * 作品标题
   */
  title: string;

  /**
   * 作品封面
   */
  cover: string;

  /**
   * 作品价格（分）
   */
  price: number;

  /**
   * 购买人数
   */
  purchaseCount: number;

  /**
   * 佣金 （分）
   */
  commission: number;
  finishStatus: null;
  /**
   * 作者
   */
  name: string;

  /**
   * 作者头像
   */
  avatar: string;

  /**
   * 免费阅读链接
   */
  freeLink: string;
}

export interface WangyihaoPayContentResponse {
  code: number;
  msg: string;
  data: Array<PayContentResponse>;
}
