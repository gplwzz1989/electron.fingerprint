import { HttpsProxyAgent } from 'https-proxy-agent';
import { $http } from '@/http';

export const getVideoContentListResponse = async (
  cookie: string,
  cursor: string = '',
  status: 6 | 7 = 6,
  proxyAgent?: HttpsProxyAgent<string>,
): Promise<SouHuShiPinContentListResponse> => {
  const url = `https://my.tv.sohu.com/user/a/rvideo/myVideos/datas.do?includeCo=true&vStatus=${status}&cursor=${cursor}&uploadFrom=8&orderBy=2&orderType=by_upload&mediaType=0&size=10`;

  const headers = {
    cookie: cookie,
    referer: 'https://my.tv.sohu.com',
    Origin: 'http://my.tv.sohu.com',
  };

  const params = {};

  const result = await $http.get(url, {
    headers: headers,
    params: params,
    httpAgent: proxyAgent,
    httpsAgent: proxyAgent,
  });

  return result.data;
};

export interface SouHuShiPinContentListResponse {
  status: number;
  statusText: string;
  nextCursor: string;
  data: Array<{
    /**
     * 作品id
     */
    id: number;
    tag: string;
    videoLevel: number;
    videoLength: number;
    videoSize: number;
    /**
     * 13位时间戳
     */
    uploadTime: number;
    categoriesId: number;
    title: string;
    userId: number;
    recordType: 0;
    uploadFrom: 8;
    cateCode: number;
    smallCover: string;
    /**
     * 状态 21:转码中   33,40::已发布
     */
    status: 21;
    bigCover: string;
    videoType: 10;
    cutCoverURL: '';
    isInPlaylist: 0;
    fcStatusName: '未分成';
    fcStatus: '0';
    firstCateCodeName: '其他';
    secondCateCodeName: '';
    thirdCateCodeName: '';
    /**
     * web访问地址
     */
    url: string;
    geneStatus: 1;
    isFreeRecommend: 0;
    bf8Level: 0;
    vheight: 890;
    vwidth: 1422;
    vr: 0;
    /**
     * 播放数
     */
    videoPlayCount: number;
    videoPlayCountFmt: '0';
    dataType: 0;
    site: 2;
    videoLengthFmt: '00:32';
    co: 0;
    pcount: 0;
  }>;
  addVideoToPlaylistOnceLimit: number;
  maxPlaylistCountForVideo: number;
  matchCount: number;
  hasNext: false;
  count: number;
}
